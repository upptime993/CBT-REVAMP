import { NextRequest } from "next/server";
import { connectDB, User, Siswa } from "@/lib/mongodb";
import {
  comparePassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  successResponse,
  errorResponse,
  getUserFromRequest,
  hashPassword,
} from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/auth → Login
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { tipe, nisn, username, password } = body;

    // ── LOGIN SISWA ──
    if (tipe === "siswa") {
      if (!nisn) {
        return errorResponse("NISN wajib diisi", 400);
      }

      const nisnClean = nisn.toString().trim();
      if (!/^\d{10}$/.test(nisnClean)) {
        return errorResponse("NISN harus 10 digit angka", 400);
      }

      const siswa = await Siswa.findOne({ nisn: nisnClean, aktif: true });
      if (!siswa) {
        return errorResponse(
          "NISN tidak ditemukan atau akun tidak aktif",
          401
        );
      }

      const payload = {
        id: siswa._id.toString(),
        nama: siswa.nama,
        role: "siswa" as const,
        nisn: siswa.nisn,
        kelas: siswa.kelas,
      };

      const token = signToken(payload);
      const response = successResponse(
        {
          user: payload,
          token,
        },
        "Login berhasil"
      );

      return setAuthCookie(response as NextResponse, token);
    }

    // ── LOGIN GURU / ADMIN ──
    if (tipe === "guru") {
      if (!username || !password) {
        return errorResponse("Username dan password wajib diisi", 400);
      }

      const user = await User.findOne({
        username: username.toLowerCase().trim(),
        aktif: true,
      });

      if (!user) {
        return errorResponse("Username tidak ditemukan atau akun tidak aktif", 401);
      }

      const passwordValid = await comparePassword(password, user.password);
      if (!passwordValid) {
        return errorResponse("Password salah", 401);
      }

      const payload = {
        id: user._id.toString(),
        nama: user.nama,
        role: user.role as "superadmin" | "admin" | "guru",
        username: user.username,
      };

      const token = signToken(payload);
      const response = successResponse(
        {
          user: payload,
          token,
        },
        "Login berhasil"
      );

      return setAuthCookie(response as NextResponse, token);
    }

    return errorResponse("Tipe login tidak valid", 400);
  } catch (error: any) {
    console.error("[AUTH POST]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// GET /api/auth → Get current user
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) {
      return errorResponse("Tidak terautentikasi", 401);
    }
    return successResponse(user, "Data user berhasil diambil");
  } catch (error: any) {
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// DELETE /api/auth → Logout
export async function DELETE(req: NextRequest) {
  const response = successResponse(null, "Logout berhasil");
  return clearAuthCookie(response as NextResponse);
}

// PUT /api/auth → Ganti password / username
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    const user = getUserFromRequest(req);
    if (!user) return errorResponse("Tidak terautentikasi", 401);

    const body = await req.json();
    const { passwordLama, passwordBaru, usernameBaru } = body;

    // Siswa tidak bisa ganti akun di sini
    if (user.role === "siswa") {
      return errorResponse("Akses ditolak", 403);
    }

    const userDoc = await User.findById(user.id);
    if (!userDoc) return errorResponse("User tidak ditemukan", 404);

    // Verifikasi password lama
    if (passwordLama) {
      const valid = await comparePassword(passwordLama, userDoc.password);
      if (!valid) return errorResponse("Password lama salah", 400);
    }

    if (usernameBaru) {
      // Cek username sudah dipakai
      const exists = await User.findOne({
        username: usernameBaru.toLowerCase(),
        _id: { $ne: userDoc._id },
      });
      if (exists) return errorResponse("Username sudah digunakan", 400);
      userDoc.username = usernameBaru.toLowerCase();
    }

    if (passwordBaru) {
      if (passwordBaru.length < 6) {
        return errorResponse("Password baru minimal 6 karakter", 400);
      }
      userDoc.password = await hashPassword(passwordBaru);
    }

    await userDoc.save();
    return successResponse(null, "Akun berhasil diperbarui");
  } catch (error: any) {
    console.error("[AUTH PUT]", error);
    return errorResponse("Terjadi kesalahan server", 500);
  }
}