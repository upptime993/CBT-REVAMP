import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET belum diset di .env.local");
}

// ============================================
// TYPES
// ============================================
export interface JWTPayload {
  id: string;
  nama: string;
  role: "superadmin" | "admin" | "guru" | "siswa";
  username?: string;
  nisn?: string;
  kelas?: string;
}

// ============================================
// JWT FUNCTIONS
// ============================================
export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// ============================================
// PASSWORD FUNCTIONS
// ============================================
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// ============================================
// GET USER FROM REQUEST
// ============================================
export function getUserFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("token")?.value;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : cookieToken;

  if (!token) return null;
  return verifyToken(token);
}

// ============================================
// MIDDLEWARE HELPER
// ============================================
export function requireAuth(
  req: NextRequest,
  allowedRoles?: string[]
): { user: JWTPayload } | NextResponse {
  const user = getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Tidak terautentikasi. Silakan login." },
      { status: 401 }
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { success: false, message: "Akses ditolak. Tidak memiliki izin." },
      { status: 403 }
    );
  }

  return { user };
}

// ============================================
// SET & CLEAR COOKIE
// ============================================
export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: "/",
  });
  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

// ============================================
// API RESPONSE HELPERS
// ============================================
export function successResponse(data: unknown, message = "Berhasil", status = 200) {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status });
}