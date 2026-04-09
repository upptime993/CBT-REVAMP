import { NextRequest } from "next/server";
import { connectDB, User, Siswa, Kelas } from "@/lib/mongodb";
import {
  requireAuth,
  successResponse,
  errorResponse,
  hashPassword,
} from "@/lib/auth";

// GET /api/manajemen?tipe=siswa|guru|kelas&page=1&limit=10&search=
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin", "guru"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const tipe = searchParams.get("tipe") || "siswa";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // ── GET SISWA ──
    if (tipe === "siswa") {
      const query: any = { aktif: true };
      if (search) {
        query.$or = [
          { nama: { $regex: search, $options: "i" } },
          { nisn: { $regex: search, $options: "i" } },
          { kelas: { $regex: search, $options: "i" } },
        ];
      }

      const kelasFilter = searchParams.get("kelas");
      if (kelasFilter) query.kelas = kelasFilter;

      const [siswaList, total] = await Promise.all([
        Siswa.find(query).sort({ nama: 1 }).skip(skip).limit(limit).lean(),
        Siswa.countDocuments(query),
      ]);

      return successResponse({
        list: siswaList,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // ── GET GURU ──
    if (tipe === "guru") {
      // Hanya admin/superadmin yang bisa lihat guru
      if (!["superadmin", "admin"].includes(auth.user.role)) {
        return errorResponse("Akses ditolak", 403);
      }

      const query: any = { role: { $in: ["guru", "admin"] } };
      if (search) {
        query.$or = [
          { nama: { $regex: search, $options: "i" } },
          { username: { $regex: search, $options: "i" } },
        ];
      }

      const [guruList, total] = await Promise.all([
        User.find(query, { password: 0 })
          .sort({ nama: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query),
      ]);

      return successResponse({
        list: guruList,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    // ── GET KELAS ──
    if (tipe === "kelas") {
      const [kelasList, total] = await Promise.all([
        Kelas.find({ aktif: true }).sort({ nama: 1 }).skip(skip).limit(limit).lean(),
        Kelas.countDocuments({ aktif: true }),
      ]);

      return successResponse({
        list: kelasList,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    }

    return errorResponse("Tipe tidak valid", 400);
  } catch (error: any) {
    console.error("[MANAJEMEN GET]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// POST /api/manajemen → Tambah siswa | guru | kelas
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { tipe } = body;

    // ── TAMBAH SISWA ──
    if (tipe === "siswa") {
      const { nama, nisn, kelas, kelasId, jenisKelamin } = body;

      if (!nama || !nisn || !kelas || !kelasId || !jenisKelamin) {
        return errorResponse("Semua field wajib diisi", 400);
      }

      if (!/^\d{10}$/.test(nisn)) {
        return errorResponse("NISN harus 10 digit angka", 400);
      }

      const exists = await Siswa.findOne({ nisn });
      if (exists) return errorResponse("NISN sudah terdaftar", 400);

      const siswa = await Siswa.create({
        nama: nama.trim(),
        nisn: nisn.trim(),
        kelas,
        kelasId,
        jenisKelamin,
      });

      return successResponse(siswa, "Siswa berhasil ditambahkan", 201);
    }

    // ── TAMBAH GURU ──
    if (tipe === "guru") {
      if (auth.user.role !== "superadmin" && auth.user.role !== "admin") {
        return errorResponse("Akses ditolak", 403);
      }

      const { nama, username, password, mapel, role } = body;

      if (!nama || !username || !password) {
        return errorResponse("Nama, username, dan password wajib diisi", 400);
      }

      if (password.length < 6) {
        return errorResponse("Password minimal 6 karakter", 400);
      }

      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) return errorResponse("Username sudah digunakan", 400);

      const hashedPw = await hashPassword(password);
      const guru = await User.create({
        nama: nama.trim(),
        username: username.toLowerCase().trim(),
        password: hashedPw,
        role: role || "guru",
        mapel: mapel?.trim(),
      });

      const { password: _, ...guruData } = guru.toObject();
      return successResponse(guruData, "Akun guru berhasil dibuat", 201);
    }

    // ── TAMBAH KELAS ──
    if (tipe === "kelas") {
      const { nama, tingkat, tahunAjaran, waliKelas } = body;

      if (!nama || !tingkat || !tahunAjaran) {
        return errorResponse("Nama, tingkat, dan tahun ajaran wajib diisi", 400);
      }

      const exists = await Kelas.findOne({ nama, tahunAjaran });
      if (exists) return errorResponse("Kelas sudah ada di tahun ajaran ini", 400);

      const kelas = await Kelas.create({ nama, tingkat, tahunAjaran, waliKelas });
      return successResponse(kelas, "Kelas berhasil dibuat", 201);
    }

    return errorResponse("Tipe tidak valid", 400);
  } catch (error: any) {
    console.error("[MANAJEMEN POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// PUT /api/manajemen → Edit siswa | guru | kelas
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin"]);
    if ("status" in auth) return auth;

    const body = await req.json();
    const { tipe, id, ...data } = body;

    if (!id) return errorResponse("ID wajib diisi", 400);

    if (tipe === "siswa") {
      if (data.nisn) {
        const exists = await Siswa.findOne({ nisn: data.nisn, _id: { $ne: id } });
        if (exists) return errorResponse("NISN sudah digunakan", 400);
      }
      const updated = await Siswa.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
      if (!updated) return errorResponse("Siswa tidak ditemukan", 404);
      return successResponse(updated, "Data siswa berhasil diperbarui");
    }

    if (tipe === "guru") {
      if (data.password) {
        data.password = await hashPassword(data.password);
      }
      if (data.username) {
        const exists = await User.findOne({
          username: data.username.toLowerCase(),
          _id: { $ne: id },
        });
        if (exists) return errorResponse("Username sudah digunakan", 400);
        data.username = data.username.toLowerCase();
      }
      const updated = await User.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, projection: { password: 0 } }
      );
      if (!updated) return errorResponse("Guru tidak ditemukan", 404);
      return successResponse(updated, "Data guru berhasil diperbarui");
    }

    if (tipe === "kelas") {
      const updated = await Kelas.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true }
      );
      if (!updated) return errorResponse("Kelas tidak ditemukan", 404);
      return successResponse(updated, "Data kelas berhasil diperbarui");
    }

    return errorResponse("Tipe tidak valid", 400);
  } catch (error: any) {
    console.error("[MANAJEMEN PUT]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// DELETE /api/manajemen → Hapus (soft delete)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const auth = requireAuth(req, ["superadmin", "admin"]);
    if ("status" in auth) return auth;

    const { searchParams } = new URL(req.url);
    const tipe = searchParams.get("tipe");
    const id = searchParams.get("id");

    if (!tipe || !id) return errorResponse("Tipe dan ID wajib diisi", 400);

    if (tipe === "siswa") {
      await Siswa.findByIdAndUpdate(id, { aktif: false });
      return successResponse(null, "Siswa berhasil dihapus");
    }

    if (tipe === "guru") {
      // Tidak bisa hapus superadmin
      const guru = await User.findById(id);
      if (guru?.role === "superadmin") {
        return errorResponse("Tidak bisa menghapus akun superadmin", 403);
      }
      await User.findByIdAndUpdate(id, { aktif: false });
      return successResponse(null, "Akun guru berhasil dihapus");
    }

    if (tipe === "kelas") {
      await Kelas.findByIdAndUpdate(id, { aktif: false });
      return successResponse(null, "Kelas berhasil dihapus");
    }

    return errorResponse("Tipe tidak valid", 400);
  } catch (error: any) {
    console.error("[MANAJEMEN DELETE]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}