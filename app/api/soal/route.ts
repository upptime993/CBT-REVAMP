import { NextRequest } from "next/server";
import { connectDB, Soal, TipeSoal } from "@/lib/mongodb";
import { requireAuth, successResponse, errorResponse } from "@/lib/auth";

// GET /api/soal → List soal dengan filter & pagination
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const tipe = searchParams.get("tipe") || "";
    const mapel = searchParams.get("mapel") || "";
    const kesulitan = searchParams.get("kesulitan") || "";
    const kelas = searchParams.get("kelas") || "";
    const ids = searchParams.get("ids") || ""; // untuk ambil soal by IDs
    const skip = (page - 1) * limit;

    // Ambil by IDs spesifik (untuk preview ujian)
    if (ids) {
      const idList = ids.split(",").filter(Boolean);
      const soalList = await Soal.find({ _id: { $in: idList } }).lean();
      return successResponse({ list: soalList, total: soalList.length });
    }

    const query: any = {};

    if (search) {
      query.$or = [
        { pertanyaan: { $regex: search, $options: "i" } },
        { mapel: { $regex: search, $options: "i" } },
      ];
    }
    if (tipe) query.tipe = tipe;
    if (mapel) query.mapel = { $regex: mapel, $options: "i" };
    if (kesulitan) query.tingkatKesulitan = kesulitan;
    if (kelas) query.kelasTarget = { $in: [kelas] };

    // Guru hanya bisa lihat soal miliknya (opsional, tergantung kebijakan)
    // if (auth.user.role === 'guru') {
    //   query.pembuatId = auth.user.id;
    // }

    const [soalList, total] = await Promise.all([
      Soal.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Soal.countDocuments(query),
    ]);

    // Statistik per tipe
    const stats = await Soal.aggregate([
      { $group: { _id: "$tipe", count: { $sum: 1 } } },
    ]);

    return successResponse({
      list: soalList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats,
    });
  } catch (error: any) {
    console.error("[SOAL GET]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// POST /api/soal → Buat soal baru
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();

    // Validasi field wajib
    const {
      pertanyaan,
      tipe,
      mapel,
      kelasTarget,
      tingkatKesulitan,
      poin,
    } = body;

    if (!pertanyaan?.trim()) {
      return errorResponse("Pertanyaan wajib diisi", 400);
    }
    if (!tipe) return errorResponse("Tipe soal wajib dipilih", 400);
    if (!mapel?.trim()) return errorResponse("Mata pelajaran wajib diisi", 400);

    const validTipe: TipeSoal[] = [
      "pilihan_ganda",
      "pg_kompleks",
      "isian_singkat",
      "menjodohkan",
      "esai",
    ];
    if (!validTipe.includes(tipe)) {
      return errorResponse("Tipe soal tidak valid", 400);
    }

    // Validasi per tipe
    if (tipe === "pilihan_ganda") {
      if (!body.opsi || body.opsi.length < 2) {
        return errorResponse("Pilihan ganda minimal 2 opsi", 400);
      }
      if (!body.kunciJawaban) {
        return errorResponse("Kunci jawaban wajib dipilih", 400);
      }
    }

    if (tipe === "pg_kompleks") {
      if (!body.opsi || body.opsi.length < 2) {
        return errorResponse("PG Kompleks minimal 2 opsi", 400);
      }
      if (!body.kunciJawaban || body.kunciJawaban.length < 2) {
        return errorResponse("PG Kompleks minimal 2 jawaban benar", 400);
      }
    }

    if (tipe === "isian_singkat") {
      if (!body.jawabanDiterima || body.jawabanDiterima.length === 0) {
        return errorResponse("Minimal 1 jawaban yang diterima", 400);
      }
    }

    if (tipe === "menjodohkan") {
      if (!body.pasangan || body.pasangan.length < 2) {
        return errorResponse("Menjodohkan minimal 2 pasangan", 400);
      }
    }

    if (tipe === "esai") {
      if (!body.rubrik?.trim()) {
        return errorResponse("Rubrik penilaian esai wajib diisi", 400);
      }
      if (!body.skorMaksimal || body.skorMaksimal < 1) {
        return errorResponse("Skor maksimal esai wajib diisi", 400);
      }
    }

    const soal = await Soal.create({
      pertanyaan: pertanyaan.trim(),
      tipe,
      mapel: mapel.trim(),
      kelasTarget: kelasTarget || [],
      tingkatKesulitan: tingkatKesulitan || "sedang",
      poin: poin || 1,
      gambar: body.gambar,
      opsi: body.opsi,
      kunciJawaban: body.kunciJawaban,
      jawabanDiterima: body.jawabanDiterima,
      pasangan: body.pasangan,
      rubrik: body.rubrik,
      skorMaksimal: body.skorMaksimal,
      pembuatId: auth.user.id,
      pembuatNama: auth.user.nama,
    });

    return successResponse(soal, "Soal berhasil dibuat", 201);
  } catch (error: any) {
    console.error("[SOAL POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// PUT /api/soal → Edit soal
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) return errorResponse("ID soal wajib diisi", 400);

    const soal = await Soal.findById(id);
    if (!soal) return errorResponse("Soal tidak ditemukan", 404);

    // Guru hanya bisa edit soalnya sendiri
    if (
      auth.user.role === "guru" &&
      soal.pembuatId.toString() !== auth.user.id
    ) {
      return errorResponse("Tidak bisa mengedit soal milik guru lain", 403);
    }

    const updated = await Soal.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return successResponse(updated, "Soal berhasil diperbarui");
  } catch (error: any) {
    console.error("[SOAL PUT]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// DELETE /api/soal → Hapus soal
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return errorResponse("ID soal wajib diisi", 400);

    const soal = await Soal.findById(id);
    if (!soal) return errorResponse("Soal tidak ditemukan", 404);

    if (
      auth.user.role === "guru" &&
      soal.pembuatId.toString() !== auth.user.id
    ) {
      return errorResponse("Tidak bisa menghapus soal milik guru lain", 403);
    }

    await Soal.findByIdAndDelete(id);
    return successResponse(null, "Soal berhasil dihapus");
  } catch (error: any) {
    console.error("[SOAL DELETE]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}