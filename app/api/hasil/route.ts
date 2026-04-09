import { NextRequest } from "next/server";
import {
  connectDB,
  HasilUjian,
  UjianSesi,
  Soal,
  Ujian,
} from "@/lib/mongodb";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { hitungNilaiAkhir } from "@/lib/utils";

// GET /api/hasil → Ambil hasil ujian
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, [
      "superadmin", "admin", "guru", "siswa",
    ]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const hasilId = searchParams.get("hasilId");
    const ujianId = searchParams.get("ujianId");
    const siswaId = searchParams.get("siswaId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Ambil detail 1 hasil
    if (hasilId) {
      const hasil = await HasilUjian.findById(hasilId).lean();
      if (!hasil) return errorResponse("Hasil tidak ditemukan", 404);

      // Cek akses: hanya pemilik atau guru/admin
      if (
        auth.user.role === "siswa" &&
        hasil.siswaId.toString() !== auth.user.id
      ) {
        return errorResponse("Akses ditolak", 403);
      }

      // Ambil detail jawaban dari sesi
      const sesi = await UjianSesi.findById(hasil.sesiId).lean();
      const ujian = await Ujian.findById(hasil.ujianId).lean();

      // Ambil soal dengan jawaban (untuk pembahasan)
      const soalList = await Soal.find({
        _id: { $in: ujian?.soalIds || [] },
      }).lean();

      return successResponse({ hasil, sesi, soalList, ujian });
    }

    // Hasil per ujian (guru melihat semua siswa)
    if (ujianId && ["superadmin", "admin", "guru"].includes(auth.user.role)) {
      const [hasilList, total] = await Promise.all([
        HasilUjian.find({ ujianId })
          .sort({ nilaiAkhir: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        HasilUjian.countDocuments({ ujianId }),
      ]);

      // Statistik nilai
      const allNilai = await HasilUjian.find(
        { ujianId },
        { nilaiAkhir: 1 }
      ).lean();
      const nilaiArr = allNilai.map((h) => h.nilaiAkhir);
      const rataRata =
        nilaiArr.length > 0
          ? Math.round(nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length)
          : 0;
      const nilaiTertinggi = nilaiArr.length > 0 ? Math.max(...nilaiArr) : 0;
      const nilaiTerendah = nilaiArr.length > 0 ? Math.min(...nilaiArr) : 0;
      const lulus = nilaiArr.filter((n) => n >= 75).length;

      // Esai belum dikoreksi
      const belumDikoreksi = await UjianSesi.countDocuments({
        ujianId,
        "jawaban.tipe": "esai",
        "jawaban.sudahDikoreksi": false,
        status: "selesai",
      });

      return successResponse({
        list: hasilList,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        statistik: {
          rataRata,
          nilaiTertinggi,
          nilaiTerendah,
          lulus,
          tidakLulus: nilaiArr.length - lulus,
          belumDikoreksi,
        },
      });
    }

    // Riwayat hasil siswa sendiri
    if (auth.user.role === "siswa") {
      const targetId = siswaId || auth.user.id;
      if (siswaId && siswaId !== auth.user.id) {
        return errorResponse("Akses ditolak", 403);
      }

      const [hasilList, total] = await Promise.all([
        HasilUjian.find({ siswaId: targetId })
          .sort({ tanggalUjian: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        HasilUjian.countDocuments({ siswaId: targetId }),
      ]);

      // Statistik untuk chart (nilai dari waktu ke waktu)
      const allHasil = await HasilUjian.find(
        { siswaId: targetId },
        { nilaiAkhir: 1, mapel: 1, tanggalUjian: 1, ujianNama: 1 }
      )
        .sort({ tanggalUjian: 1 })
        .lean();

      // Statistik per mapel
      const perMapel: Record<string, number[]> = {};
      allHasil.forEach((h) => {
        if (!perMapel[h.mapel]) perMapel[h.mapel] = [];
        perMapel[h.mapel].push(h.nilaiAkhir);
      });

      const statistikMapel = Object.entries(perMapel).map(([mapel, nilai]) => ({
        mapel,
        rataRata: Math.round(nilai.reduce((a, b) => a + b, 0) / nilai.length),
        tertinggi: Math.max(...nilai),
        jumlahUjian: nilai.length,
      }));

      const nilaiArr = allHasil.map((h) => h.nilaiAkhir);
      const rataRataTotal =
        nilaiArr.length > 0
          ? Math.round(nilaiArr.reduce((a, b) => a + b, 0) / nilaiArr.length)
          : 0;

      return successResponse({
        list: hasilList,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        chartData: allHasil,
        statistikMapel,
        rataRataTotal,
        nilaiTertinggi: nilaiArr.length > 0 ? Math.max(...nilaiArr) : 0,
        totalUjian: total,
      });
    }

    return errorResponse("Parameter tidak valid", 400);
  } catch (error: any) {
    console.error("[HASIL GET]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// PATCH /api/hasil → Koreksi esai oleh guru
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { sesiId, soalId, skorManual, catatanGuru } = body;

    if (!sesiId || !soalId || skorManual === undefined) {
      return errorResponse("sesiId, soalId, dan skorManual wajib diisi", 400);
    }

    if (skorManual < 0) {
      return errorResponse("Skor tidak boleh negatif", 400);
    }

    // Ambil soal untuk validasi skor maksimal
    const soal = await Soal.findById(soalId);
    if (!soal) return errorResponse("Soal tidak ditemukan", 404);

    const skorMax = soal.skorMaksimal || soal.poin;
    if (skorManual > skorMax) {
      return errorResponse(`Skor maksimal untuk soal ini adalah ${skorMax}`, 400);
    }

    // Update jawaban esai di sesi
    await UjianSesi.findOneAndUpdate(
      { _id: sesiId, "jawaban.soalId": soalId },
      {
        $set: {
          "jawaban.$.skorManual": skorManual,
          "jawaban.$.sudahDikoreksi": true,
          "jawaban.$.catatanGuru": catatanGuru || "",
        },
      }
    );

    // Recalculate total skor sesi
    const sesi = await UjianSesi.findById(sesiId);
    if (!sesi) return errorResponse("Sesi tidak ditemukan", 404);

    let newTotalSkor = 0;
    let skorMaksimal = 0;
    let semuaDikoreksi = true;

    const ujian = await Ujian.findById(sesi.ujianId);
    const soalList = await Soal.find({ _id: { $in: ujian?.soalIds || [] } });
    const soalMap = new Map(soalList.map((s) => [s._id.toString(), s]));

    sesi.jawaban.forEach((j: any) => {
      const soalData = soalMap.get(j.soalId);
      if (!soalData) return;

      const poin =
        soalData.tipe === "esai"
          ? soalData.skorMaksimal || soalData.poin
          : soalData.poin;
      skorMaksimal += poin;

      if (soalData.tipe === "esai") {
        if (!j.sudahDikoreksi) semuaDikoreksi = false;
        newTotalSkor += j.skorManual || 0;
      } else {
        newTotalSkor += j.skorOtomatis || 0;
      }
    });

    // Skor untuk soal yang baru saja dikoreksi
    const jawabanIdx = sesi.jawaban.findIndex(
      (j: any) => j.soalId === soalId
    );
    if (jawabanIdx !== -1) {
      // Sudah diupdate di atas lewat findOneAndUpdate, refetch
    }

    const nilaiAkhir = hitungNilaiAkhir(newTotalSkor, skorMaksimal);

    await UjianSesi.findByIdAndUpdate(sesiId, {
      $set: { totalSkor: newTotalSkor, nilaiAkhir },
    });

    // Update hasil ujian
    await HasilUjian.findOneAndUpdate(
      { sesiId },
      {
        $set: {
          totalSkor: newTotalSkor,
          nilaiAkhir,
          status: semuaDikoreksi
            ? nilaiAkhir >= 75
              ? "lulus"
              : "tidak_lulus"
            : "belum_dikoreksi",
        },
      }
    );

    return successResponse(
      { nilaiAkhir, totalSkor: newTotalSkor, semuaDikoreksi },
      "Koreksi berhasil disimpan"
    );
  } catch (error: any) {
    console.error("[HASIL PATCH]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// GET belum dikoreksi (untuk dashboard guru)
// Dipanggil dengan: GET /api/hasil?tipe=belum_koreksi
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { tipe } = body;

    if (tipe === "belum_koreksi") {
      // Ambil semua sesi dengan esai belum dikoreksi
      const query: any = {
        status: "selesai",
        jawaban: {
          $elemMatch: {
            tipe: "esai",
            sudahDikoreksi: false,
          },
        },
      };

      // Guru hanya lihat ujian yang dia buat
      if (auth.user.role === "guru") {
        const ujianGuru = await Ujian.find(
          { pembuatId: auth.user.id },
          { _id: 1 }
        ).lean();
        const ujianIds = ujianGuru.map((u) => u._id);
        query.ujianId = { $in: ujianIds };
      }

      const sesiList = await UjianSesi.find(query)
        .populate("ujianId", "nama mapel")
        .sort({ createdAt: -1 })
        .lean();

      // Format untuk tampilan
      const result = sesiList.flatMap((sesi: any) =>
        sesi.jawaban
          .filter((j: any) => j.tipe === "esai" && !j.sudahDikoreksi)
          .map((j: any) => ({
            sesiId: sesi._id,
            soalId: j.soalId,
            siswaNama: sesi.siswaNama,
            siswaNisn: sesi.siswaNisn,
            ujianNama: sesi.ujianId?.nama,
            mapel: sesi.ujianId?.mapel,
            jawaban: j.jawaban,
            waktuSelesai: sesi.waktuSelesai,
          }))
      );

      return successResponse({
        list: result,
        total: result.length,
      });
    }

    return errorResponse("Tipe tidak valid", 400);
  } catch (error: any) {
    console.error("[HASIL POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}