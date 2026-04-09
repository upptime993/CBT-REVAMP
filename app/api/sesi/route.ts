import { NextRequest } from "next/server";
import {
  connectDB,
  UjianSesi,
  Ujian,
  Soal,
  HasilUjian,
  Siswa,
} from "@/lib/mongodb";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { autoGrade, acakArray, hitungNilaiAkhir } from "@/lib/utils";

// POST /api/sesi → Mulai ujian / Submit
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["siswa"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { action } = body;

    // ── MULAI UJIAN ──
    if (action === "mulai") {
      const { ujianId } = body;
      if (!ujianId) return errorResponse("ID ujian wajib diisi", 400);

      const ujian = await Ujian.findById(ujianId);
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);
      if (ujian.status !== "aktif") {
        return errorResponse("Ujian tidak sedang aktif", 400);
      }

      const siswa = await Siswa.findById(auth.user.id);
      if (!siswa) return errorResponse("Data siswa tidak ditemukan", 404);

      // Cek sesi yang sudah ada
      let sesi = await UjianSesi.findOne({
        ujianId,
        siswaId: auth.user.id,
      });

      if (sesi) {
        if (sesi.status === "selesai") {
          return errorResponse("Kamu sudah menyelesaikan ujian ini", 400);
        }
        if (sesi.status === "dikeluarkan" && !sesi.diizinkanKembali) {
          return errorResponse(
            "Kamu dikeluarkan dari ujian. Hubungi guru.",
            403
          );
        }
        // Lanjutkan sesi yang ada (berlangsung atau diizinkan kembali)
        if (sesi.status === "dikeluarkan" && sesi.diizinkanKembali) {
          sesi.status = "berlangsung";
          sesi.diizinkanKembali = false;
          await sesi.save();
        }

        // Hitung sisa waktu
        const elapsed = sesi.waktuMulai
          ? Math.floor((Date.now() - sesi.waktuMulai.getTime()) / 1000)
          : 0;
        const sisaDetik = Math.max(0, ujian.durasi * 60 - elapsed);

        return successResponse({
          sesi: {
            _id: sesi._id,
            jawaban: sesi.jawaban,
            jumlahPelanggaran: sesi.jumlahPelanggaran,
          },
          sisaWaktu: sisaDetik,
          urutanSoal: sesi.urutanSoal,
          durasi: ujian.durasi,
        });
      }

      // Buat sesi baru
      let soalIds = ujian.soalIds.map((id: any) => id.toString());
      if (ujian.pengaturan.acakSoal) {
        soalIds = acakArray(soalIds);
      }

      // Inisialisasi jawaban kosong
      const jawaban = soalIds.map((soalId: string) => ({
        soalId,
        tipe: "pilihan_ganda",
        jawaban: null,
        skorOtomatis: 0,
        sudahDikoreksi: false,
      }));

      sesi = await UjianSesi.create({
        ujianId,
        siswaId: auth.user.id,
        siswaNama: siswa.nama,
        siswaNisn: siswa.nisn,
        status: "berlangsung",
        jawaban,
        waktuMulai: new Date(),
        urutanSoal: soalIds,
        jumlahPelanggaran: 0,
        diizinkanKembali: false,
      });

      return successResponse(
        {
          sesi: {
            _id: sesi._id,
            jawaban: sesi.jawaban,
            jumlahPelanggaran: 0,
          },
          sisaWaktu: ujian.durasi * 60,
          urutanSoal: soalIds,
          durasi: ujian.durasi,
        },
        "Ujian dimulai"
      );
    }

    // ── SUBMIT UJIAN ──
    if (action === "submit") {
      const { sesiId, jawaban: jawabanInput } = body;
      if (!sesiId) return errorResponse("ID sesi wajib diisi", 400);

      const sesi = await UjianSesi.findById(sesiId);
      if (!sesi) return errorResponse("Sesi tidak ditemukan", 404);

      if (!["berlangsung", "dikeluarkan"].includes(sesi.status)) {
        return errorResponse("Sesi sudah selesai atau tidak valid", 400);
      }

      const ujian = await Ujian.findById(sesi.ujianId);
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

      // Ambil semua soal
      const soalList = await Soal.find({ _id: { $in: ujian.soalIds } });
      const soalMap = new Map(
        soalList.map((s) => [s._id.toString(), s])
      );

      // Koreksi otomatis per soal
      let totalSkor = 0;
      let skorMaksimal = 0;
      let adaEsai = false;

      const detailPerTipe: Record<string, { benar: number; total: number; skor: number }> = {};

      const jawabanFinal = sesi.urutanSoal.map((soalId: string) => {
        const soal = soalMap.get(soalId);
        if (!soal) return null;

        const inputJawaban = jawabanInput?.[soalId] ?? null;
        const skor = autoGrade(soal as any, inputJawaban);

        const tipe = soal.tipe;
        if (!detailPerTipe[tipe]) {
          detailPerTipe[tipe] = { benar: 0, total: 0, skor: 0 };
        }
        detailPerTipe[tipe].total += 1;
        detailPerTipe[tipe].skor += skor;
        if (skor > 0) detailPerTipe[tipe].benar += 1;

        const poinSoal = tipe === "esai" ? soal.skorMaksimal || soal.poin : soal.poin;
        skorMaksimal += poinSoal;
        totalSkor += skor;

        if (tipe === "esai") adaEsai = true;

        return {
          soalId,
          tipe,
          jawaban: inputJawaban,
          skorOtomatis: skor,
          sudahDikoreksi: tipe !== "esai",
        };
      }).filter(Boolean);

      const waktuSelesai = new Date();
      const waktuPengerjaan = sesi.waktuMulai
        ? Math.floor(
            (waktuSelesai.getTime() - sesi.waktuMulai.getTime()) / 1000 / 60
          )
        : 0;

      const nilaiAkhir = hitungNilaiAkhir(totalSkor, skorMaksimal);

      // Update sesi
      await UjianSesi.findByIdAndUpdate(sesiId, {
        $set: {
          status: "selesai",
          jawaban: jawabanFinal,
          totalSkor,
          nilaiAkhir,
          waktuSelesai,
        },
      });

      // Simpan hasil ujian
      const siswa = await Siswa.findById(auth.user.id);
      const hasil = await HasilUjian.create({
        ujianId: sesi.ujianId,
        ujianNama: ujian.nama,
        mapel: ujian.mapel,
        siswaId: auth.user.id,
        siswaNama: sesi.siswaNama,
        siswaNisn: sesi.siswaNisn,
        kelasNama: siswa?.kelas || "",
        sesiId,
        nilaiAkhir,
        totalSkor,
        skorMaksimal,
        status: adaEsai ? "belum_dikoreksi" : nilaiAkhir >= 75 ? "lulus" : "tidak_lulus",
        detailPerTipe: Object.entries(detailPerTipe).map(([tipe, d]) => ({
          tipe,
          ...d,
        })),
        waktuPengerjaan,
        tanggalUjian: new Date(),
      });

      return successResponse(
        {
          nilaiAkhir,
          totalSkor,
          skorMaksimal,
          adaEsai,
          hasilId: hasil._id,
        },
        "Ujian berhasil diselesaikan"
      );
    }

    return errorResponse("Action tidak valid", 400);
  } catch (error: any) {
    console.error("[SESI POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// PATCH /api/sesi → Simpan jawaban sementara | Log pelanggaran | Izinkan kembali
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, [
      "siswa", "superadmin", "admin", "guru",
    ]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { action, sesiId } = body;

    if (!sesiId) return errorResponse("ID sesi wajib diisi", 400);

    // ── SIMPAN JAWABAN SEMENTARA ──
    if (action === "simpan_jawaban") {
      const { soalId, jawaban } = body;
      await UjianSesi.findOneAndUpdate(
        { _id: sesiId, "jawaban.soalId": soalId },
        { $set: { "jawaban.$.jawaban": jawaban } }
      );
      return successResponse(null, "Jawaban disimpan");
    }

    // ── LOG PELANGGARAN ──
    if (action === "pelanggaran") {
      const { tipe, keterangan } = body;

      const sesi = await UjianSesi.findById(sesiId);
      if (!sesi) return errorResponse("Sesi tidak ditemukan", 404);

      const ujian = await Ujian.findById(sesi.ujianId);
      const batas = ujian?.pengaturan.bataspelanggaran || 3;

      await UjianSesi.findByIdAndUpdate(sesiId, {
        $inc: { jumlahPelanggaran: 1 },
        $push: {
          logPelanggaran: {
            tipe,
            keterangan,
            waktu: new Date(),
          },
        },
      });

      const updated = await UjianSesi.findById(sesiId);
      const jumlah = updated?.jumlahPelanggaran || 0;

      // Jika melebihi batas → kick
      if (jumlah >= batas) {
        await UjianSesi.findByIdAndUpdate(sesiId, {
          $set: { status: "dikeluarkan" },
        });
        return successResponse(
          { dikeluarkan: true, jumlahPelanggaran: jumlah },
          "Siswa dikeluarkan dari ujian"
        );
      }

      return successResponse(
        { dikeluarkan: false, jumlahPelanggaran: jumlah },
        "Pelanggaran dicatat"
      );
    }

    // ── IZINKAN KEMBALI (guru/admin) ──
    if (action === "izinkan_kembali") {
      if (!["superadmin", "admin", "guru"].includes(auth.user.role)) {
        return errorResponse("Akses ditolak", 403);
      }

      const updated = await UjianSesi.findByIdAndUpdate(
        sesiId,
        {
          $set: {
            diizinkanKembali: true,
            diizinkanOleh: auth.user.nama,
            status: "ditangguhkan",
          },
        },
        { new: true }
      );

      if (!updated) return errorResponse("Sesi tidak ditemukan", 404);

      return successResponse(updated, "Siswa diizinkan masuk kembali");
    }

    return errorResponse("Action tidak valid", 400);
  } catch (error: any) {
    console.error("[SESI PATCH]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// GET /api/sesi → Monitoring live / Daftar peserta
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, [
      "superadmin", "admin", "guru", "siswa",
    ]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const ujianId = searchParams.get("ujianId");
    const siswaId = searchParams.get("siswaId");
    const sesiId = searchParams.get("sesiId");

    // Ambil sesi spesifik
    if (sesiId) {
      const sesi = await UjianSesi.findById(sesiId).lean();
      if (!sesi) return errorResponse("Sesi tidak ditemukan", 404);
      return successResponse(sesi);
    }

    // Monitoring per ujian (guru)
    if (ujianId) {
      const sesiList = await UjianSesi.find({ ujianId })
        .sort({ waktuMulai: -1 })
        .lean();

      const summary = {
        total: sesiList.length,
        berlangsung: sesiList.filter((s) => s.status === "berlangsung").length,
        selesai: sesiList.filter((s) => s.status === "selesai").length,
        dikeluarkan: sesiList.filter((s) => s.status === "dikeluarkan").length,
        belumMulai: sesiList.filter((s) => s.status === "belum_mulai").length,
      };

      return successResponse({ list: sesiList, summary });
    }

    // Riwayat ujian siswa
    if (siswaId) {
      const sesiList = await UjianSesi.find({ siswaId })
        .sort({ createdAt: -1 })
        .lean();
      return successResponse({ list: sesiList });
    }

    return errorResponse("Parameter tidak valid", 400);
  } catch (error: any) {
    console.error("[SESI GET]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}