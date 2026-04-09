import { NextRequest } from "next/server";
import { connectDB, Ujian, UjianSesi, HasilUjian, Soal } from "@/lib/mongodb";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";
import { generateToken } from "@/lib/utils";

// GET /api/ujian → List ujian
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, [
      "superadmin", "admin", "guru", "siswa",
    ]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "";
    const id = searchParams.get("id") || "";
    const skip = (page - 1) * limit;

    // Ambil 1 ujian by ID (dengan soal lengkap)
    if (id) {
      const ujian = await Ujian.findById(id).lean();
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

      // Jika siswa, jangan tampilkan kunci jawaban
      if (auth.user.role === "siswa") {
        const soalList = await Soal.find(
          { _id: { $in: ujian.soalIds } },
          { kunciJawaban: 0, jawabanDiterima: 0, rubrik: 0 } // sembunyikan jawaban
        ).lean();
        return successResponse({ ujian, soalList });
      }

      const soalList = await Soal.find({
        _id: { $in: ujian.soalIds },
      }).lean();

      // Statistik peserta
      const [totalPeserta, sudahUjian, belumUjian, dikeluarkan] =
        await Promise.all([
          UjianSesi.countDocuments({ ujianId: id }),
          UjianSesi.countDocuments({
            ujianId: id,
            status: { $in: ["selesai", "dikeluarkan"] },
          }),
          UjianSesi.countDocuments({ ujianId: id, status: "belum_mulai" }),
          UjianSesi.countDocuments({ ujianId: id, status: "dikeluarkan" }),
        ]);

      return successResponse({
        ujian,
        soalList,
        statistik: { totalPeserta, sudahUjian, belumUjian, dikeluarkan },
      });
    }

    // ── LIST UNTUK GURU/ADMIN ──
    if (["superadmin", "admin", "guru"].includes(auth.user.role)) {
      const query: any = {};
      if (status) query.status = status;
      if (auth.user.role === "guru") {
        query.pembuatId = auth.user.id;
      }

      const [ujianList, total] = await Promise.all([
        Ujian.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Ujian.countDocuments(query),
      ]);

      // Tambahkan statistik peserta per ujian
      const ujianWithStats = await Promise.all(
        ujianList.map(async (u) => {
          const [sudah, belum] = await Promise.all([
            UjianSesi.countDocuments({
              ujianId: u._id,
              status: { $in: ["selesai", "dikeluarkan"] },
            }),
            UjianSesi.countDocuments({
              ujianId: u._id,
              status: { $in: ["belum_mulai", "berlangsung"] },
            }),
          ]);
          return { ...u, sudahUjian: sudah, belumUjian: belum };
        })
      );

      return successResponse({
        list: ujianWithStats,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // ── LIST UNTUK SISWA ──
    if (auth.user.role === "siswa") {
      // Ambil ujian yang aktif
      const ujianAktif = await Ujian.find({
        status: "aktif",
      })
        .sort({ tanggalMulai: -1 })
        .lean();

      // Cek status sesi untuk siswa ini
      const ujianWithSesi = await Promise.all(
        ujianAktif.map(async (u) => {
          const sesi = await UjianSesi.findOne({
            ujianId: u._id,
            siswaId: auth.user.id,
          }).lean();
          return {
            ...u,
            token: undefined, // sembunyikan token dari siswa
            statusSesi: sesi?.status || null,
            sudahMengerjakan: sesi
              ? ["selesai", "dikeluarkan"].includes(sesi.status)
              : false,
          };
        })
      );

      return successResponse({ list: ujianWithSesi });
    }

    return errorResponse("Akses ditolak", 403);
  } catch (error: any) {
    console.error("[UJIAN GET]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// POST /api/ujian → Buat ujian baru / aksi (buka, tutup, generate token)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { action } = body;

    // ── BUKA UJIAN / GENERATE TOKEN ──
    if (action === "buka" || action === "token") {
      const { ujianId } = body;
      if (!ujianId) return errorResponse("ID ujian wajib diisi", 400);

      const ujian = await Ujian.findById(ujianId);
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

      const token = generateToken(6);
      const tokenExpiry = new Date(
        Date.now() + ujian.durasi * 60 * 1000 + 30 * 60 * 1000
      ); // durasi + 30 menit buffer

      ujian.token = token;
      ujian.tokenExpiry = tokenExpiry;
      ujian.status = "aktif";
      await ujian.save();

      return successResponse(
        { token, tokenExpiry, status: "aktif" },
        "Ujian dibuka dan token berhasil dibuat"
      );
    }

    // ── TUTUP UJIAN ──
    if (action === "tutup") {
      const { ujianId } = body;
      if (!ujianId) return errorResponse("ID ujian wajib diisi", 400);

      const ujian = await Ujian.findByIdAndUpdate(
        ujianId,
        {
          $set: {
            status: "selesai",
            token: undefined,
            tokenExpiry: undefined,
          },
        },
        { new: true }
      );
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

      return successResponse({ status: "selesai" }, "Ujian berhasil ditutup");
    }

    // ── VERIFIKASI TOKEN (siswa) ──
    if (action === "verifikasi_token") {
      const { ujianId, token, siswaId } = body;

      const ujian = await Ujian.findById(ujianId);
      if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);
      if (ujian.status !== "aktif") {
        return errorResponse("Ujian tidak sedang aktif", 400);
      }

      if (ujian.token !== token.toUpperCase()) {
        return errorResponse("Token tidak valid", 400);
      }

      if (ujian.tokenExpiry && new Date() > ujian.tokenExpiry) {
        return errorResponse("Token sudah kadaluarsa", 400);
      }

      // Cek apakah siswa sudah pernah mengerjakan
      const sesiAda = await UjianSesi.findOne({ ujianId, siswaId });
      if (sesiAda) {
        if (["selesai"].includes(sesiAda.status)) {
          return errorResponse("Kamu sudah mengerjakan ujian ini", 400);
        }
        if (sesiAda.status === "dikeluarkan" && !sesiAda.diizinkanKembali) {
          return errorResponse(
            "Kamu dikeluarkan dari ujian. Hubungi guru untuk masuk kembali.",
            403
          );
        }
      }

      return successResponse(
        {
          valid: true,
          ujian: {
            nama: ujian.nama,
            mapel: ujian.mapel,
            durasi: ujian.durasi,
            jumlahSoal: ujian.soalIds.length,
          },
        },
        "Token valid"
      );
    }

    // ── BUAT UJIAN BARU ──
    const {
      nama,
      mapel,
      kelasTarget,
      kelasNama,
      deskripsi,
      soalIds,
      durasi,
      tanggalMulai,
      tanggalSelesai,
      pengaturan,
    } = body;

    // Validasi
    if (!nama?.trim()) return errorResponse("Nama ujian wajib diisi", 400);
    if (!mapel?.trim()) return errorResponse("Mata pelajaran wajib diisi", 400);
    if (!soalIds || soalIds.length === 0) {
      return errorResponse("Minimal 1 soal harus dipilih", 400);
    }
    if (!durasi || durasi < 5) {
      return errorResponse("Durasi minimal 5 menit", 400);
    }
    if (!tanggalMulai || !tanggalSelesai) {
      return errorResponse("Tanggal mulai dan selesai wajib diisi", 400);
    }

    const ujian = await Ujian.create({
      nama: nama.trim(),
      mapel: mapel.trim(),
      kelasTarget: kelasTarget || [],
      kelasNama: kelasNama || [],
      deskripsi: deskripsi?.trim(),
      soalIds,
      durasi,
      tanggalMulai: new Date(tanggalMulai),
      tanggalSelesai: new Date(tanggalSelesai),
      status: "draft",
      pengaturan: {
        acakSoal: pengaturan?.acakSoal ?? false,
        acakJawaban: pengaturan?.acakJawaban ?? false,
        tampilkanHasil: pengaturan?.tampilkanHasil ?? true,
        bataspelanggaran: pengaturan?.bataspelanggaran ?? 3,
        antiCheat: pengaturan?.antiCheat ?? true,
      },
      pembuatId: auth.user.id,
      pembuatNama: auth.user.nama,
    });

    return successResponse(ujian, "Ujian berhasil dibuat", 201);
  } catch (error: any) {
    console.error("[UJIAN POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// PUT /api/ujian → Edit ujian
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return errorResponse("ID ujian wajib diisi", 400);

    const ujian = await Ujian.findById(id);
    if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

    if (ujian.status === "aktif") {
      return errorResponse(
        "Tidak bisa mengedit ujian yang sedang aktif. Tutup dulu ujiannya.",
        400
      );
    }

    const updated = await Ujian.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return successResponse(updated, "Ujian berhasil diperbarui");
  } catch (error: any) {
    console.error("[UJIAN PUT]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// DELETE /api/ujian
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID ujian wajib diisi", 400);

    const ujian = await Ujian.findById(id);
    if (!ujian) return errorResponse("Ujian tidak ditemukan", 404);

    if (ujian.status === "aktif") {
      return errorResponse("Tidak bisa menghapus ujian yang sedang aktif", 400);
    }

    await Promise.all([
      Ujian.findByIdAndDelete(id),
      UjianSesi.deleteMany({ ujianId: id }),
      HasilUjian.deleteMany({ ujianId: id }),
    ]);

    return successResponse(null, "Ujian berhasil dihapus");
  } catch (error: any) {
    console.error("[UJIAN DELETE]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}