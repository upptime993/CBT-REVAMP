import mongoose, { Schema, Document, Model } from "mongoose";

// ============================================
// KONEKSI DATABASE
// ============================================
const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI belum diset di .env.local");
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: GlobalMongoose | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
    };
    cached!.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

// ============================================
// INTERFACES / TYPES
// ============================================

// User (Admin & Guru)
export interface IUser extends Document {
  _id: string;
  nama: string;
  username: string;
  password: string;
  role: "superadmin" | "admin" | "guru";
  mapel?: string; // khusus guru
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Siswa
export interface ISiswa extends Document {
  _id: string;
  nama: string;
  nisn: string;
  kelas: string;
  kelasId: mongoose.Types.ObjectId;
  jenisKelamin: "L" | "P";
  aktif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Kelas
export interface IKelas extends Document {
  _id: string;
  nama: string; // contoh: "X IPA 1"
  tingkat: string; // "X", "XI", "XII"
  tahunAjaran: string; // "2024/2025"
  waliKelas?: string;
  aktif: boolean;
}

// Soal
export type TipeSoal =
  | "pilihan_ganda"
  | "pg_kompleks"
  | "isian_singkat"
  | "menjodohkan"
  | "esai";

export interface IOpsiPG {
  id: string; // "A", "B", "C", "D", "E"
  teks: string;
  gambar?: string;
}

export interface IPasanganJodoh {
  id: string;
  kiri: string;
  kanan: string;
}

export interface ISoal extends Document {
  _id: string;
  pertanyaan: string;
  gambar?: string;
  tipe: TipeSoal;
  mapel: string;
  kelasTarget: string[];
  tingkatKesulitan: "mudah" | "sedang" | "sulit";
  poin: number;
  // PG & PG Kompleks
  opsi?: IOpsiPG[];
  kunciJawaban?: string | string[]; // string untuk PG, array untuk PGK
  // Isian singkat
  jawabanDiterima?: string[]; // multiple accepted answers
  // Menjodohkan
  pasangan?: IPasanganJodoh[];
  // Esai
  rubrik?: string;
  skorMaksimal?: number;
  // Meta
  pembuatId: mongoose.Types.ObjectId;
  pembuatNama: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ujian
export interface IUjian extends Document {
  _id: string;
  nama: string;
  mapel: string;
  kelasTarget: mongoose.Types.ObjectId[];
  kelasNama: string[];
  deskripsi?: string;
  soalIds: mongoose.Types.ObjectId[];
  durasi: number; // menit
  tanggalMulai: Date;
  tanggalSelesai: Date;
  token?: string;
  tokenExpiry?: Date;
  status: "draft" | "aktif" | "selesai";
  pengaturan: {
    acakSoal: boolean;
    acakJawaban: boolean;
    tampilkanHasil: boolean;
    bataspelanggaran: number;
    antiCheat: boolean;
  };
  pembuatId: mongoose.Types.ObjectId;
  pembuatNama: string;
  createdAt: Date;
  updatedAt: Date;
}

// Sesi Ujian (per siswa)
export type StatusSesi =
  | "belum_mulai"
  | "berlangsung"
  | "selesai"
  | "dikeluarkan"
  | "ditangguhkan";

export interface IJawaban {
  soalId: string;
  tipe: TipeSoal;
  jawaban: string | string[] | Record<string, string> | null;
  skorOtomatis?: number;
  skorManual?: number;
  sudahDikoreksi?: boolean;
  catatanGuru?: string;
}

export interface IUjianSesi extends Document {
  _id: string;
  ujianId: mongoose.Types.ObjectId;
  siswaId: mongoose.Types.ObjectId;
  siswaNama: string;
  siswaNisn: string;
  status: StatusSesi;
  jawaban: IJawaban[];
  totalSkor?: number;
  nilaiAkhir?: number; // 0-100
  jumlahPelanggaran: number;
  logPelanggaran: {
    tipe: string;
    waktu: Date;
    keterangan: string;
  }[];
  waktuMulai?: Date;
  waktuSelesai?: Date;
  diizinkanKembali: boolean;
  diizinkanOleh?: string;
  urutanSoal: string[]; // soalIds yang sudah diacak
  createdAt: Date;
  updatedAt: Date;
}

// Hasil Ujian (summary)
export interface IHasilUjian extends Document {
  _id: string;
  ujianId: mongoose.Types.ObjectId;
  ujianNama: string;
  mapel: string;
  siswaId: mongoose.Types.ObjectId;
  siswaNama: string;
  siswaNisn: string;
  kelasNama: string;
  sesiId: mongoose.Types.ObjectId;
  nilaiAkhir: number;
  totalSkor: number;
  skorMaksimal: number;
  status: "lulus" | "tidak_lulus" | "belum_dikoreksi";
  detailPerTipe: {
    tipe: TipeSoal;
    benar: number;
    total: number;
    skor: number;
  }[];
  waktuPengerjaan: number; // menit
  tanggalUjian: Date;
  createdAt: Date;
}

// ============================================
// SCHEMAS & MODELS
// ============================================

// --- USER MODEL ---
const UserSchema = new Schema<IUser>(
  {
    nama: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["superadmin", "admin", "guru"], default: "guru" },
    mapel: { type: String, trim: true },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// --- SISWA MODEL ---
const SiswaSchema = new Schema<ISiswa>(
  {
    nama: { type: String, required: true, trim: true },
    nisn: { type: String, required: true, unique: true, trim: true },
    kelas: { type: String, required: true },
    kelasId: { type: Schema.Types.ObjectId, ref: "Kelas", required: true },
    jenisKelamin: { type: String, enum: ["L", "P"], required: true },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// --- KELAS MODEL ---
const KelasSchema = new Schema<IKelas>(
  {
    nama: { type: String, required: true, trim: true },
    tingkat: { type: String, required: true },
    tahunAjaran: { type: String, required: true },
    waliKelas: { type: String },
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// --- SOAL MODEL ---
const SoalSchema = new Schema<ISoal>(
  {
    pertanyaan: { type: String, required: true },
    gambar: { type: String },
    tipe: {
      type: String,
      enum: ["pilihan_ganda", "pg_kompleks", "isian_singkat", "menjodohkan", "esai"],
      required: true,
    },
    mapel: { type: String, required: true },
    kelasTarget: [{ type: String }],
    tingkatKesulitan: {
      type: String,
      enum: ["mudah", "sedang", "sulit"],
      default: "sedang",
    },
    poin: { type: Number, default: 1, min: 1 },
    opsi: [
      {
        id: String,
        teks: String,
        gambar: String,
      },
    ],
    kunciJawaban: { type: Schema.Types.Mixed },
    jawabanDiterima: [{ type: String }],
    pasangan: [
      {
        id: String,
        kiri: String,
        kanan: String,
      },
    ],
    rubrik: { type: String },
    skorMaksimal: { type: Number },
    pembuatId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pembuatNama: { type: String, required: true },
  },
  { timestamps: true }
);
SoalSchema.index({ mapel: 1, tipe: 1, kelasTarget: 1 });

// --- UJIAN MODEL ---
const UjianSchema = new Schema<IUjian>(
  {
    nama: { type: String, required: true },
    mapel: { type: String, required: true },
    kelasTarget: [{ type: Schema.Types.ObjectId, ref: "Kelas" }],
    kelasNama: [{ type: String }],
    deskripsi: { type: String },
    soalIds: [{ type: Schema.Types.ObjectId, ref: "Soal" }],
    durasi: { type: Number, required: true, min: 5 },
    tanggalMulai: { type: Date, required: true },
    tanggalSelesai: { type: Date, required: true },
    token: { type: String, uppercase: true },
    tokenExpiry: { type: Date },
    status: {
      type: String,
      enum: ["draft", "aktif", "selesai"],
      default: "draft",
    },
    pengaturan: {
      acakSoal: { type: Boolean, default: false },
      acakJawaban: { type: Boolean, default: false },
      tampilkanHasil: { type: Boolean, default: true },
      bataspelanggaran: { type: Number, default: 3 },
      antiCheat: { type: Boolean, default: true },
    },
    pembuatId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    pembuatNama: { type: String, required: true },
  },
  { timestamps: true }
);

// --- UJIAN SESI MODEL ---
const UjianSesiSchema = new Schema<IUjianSesi>(
  {
    ujianId: { type: Schema.Types.ObjectId, ref: "Ujian", required: true },
    siswaId: { type: Schema.Types.ObjectId, ref: "Siswa", required: true },
    siswaNama: { type: String, required: true },
    siswaNisn: { type: String, required: true },
    status: {
      type: String,
      enum: ["belum_mulai", "berlangsung", "selesai", "dikeluarkan", "ditangguhkan"],
      default: "belum_mulai",
    },
    jawaban: [
      {
        soalId: String,
        tipe: String,
        jawaban: { type: Schema.Types.Mixed, default: null },
        skorOtomatis: { type: Number, default: 0 },
        skorManual: { type: Number },
        sudahDikoreksi: { type: Boolean, default: false },
        catatanGuru: String,
      },
    ],
    totalSkor: { type: Number, default: 0 },
    nilaiAkhir: { type: Number, default: 0 },
    jumlahPelanggaran: { type: Number, default: 0 },
    logPelanggaran: [
      {
        tipe: String,
        waktu: { type: Date, default: Date.now },
        keterangan: String,
      },
    ],
    waktuMulai: { type: Date },
    waktuSelesai: { type: Date },
    diizinkanKembali: { type: Boolean, default: false },
    diizinkanOleh: { type: String },
    urutanSoal: [{ type: String }],
  },
  { timestamps: true }
);
UjianSesiSchema.index({ ujianId: 1, siswaId: 1 }, { unique: true });

// --- HASIL UJIAN MODEL ---
const HasilUjianSchema = new Schema<IHasilUjian>(
  {
    ujianId: { type: Schema.Types.ObjectId, ref: "Ujian", required: true },
    ujianNama: { type: String, required: true },
    mapel: { type: String, required: true },
    siswaId: { type: Schema.Types.ObjectId, ref: "Siswa", required: true },
    siswaNama: { type: String, required: true },
    siswaNisn: { type: String, required: true },
    kelasNama: { type: String, required: true },
    sesiId: { type: Schema.Types.ObjectId, ref: "UjianSesi", required: true },
    nilaiAkhir: { type: Number, required: true },
    totalSkor: { type: Number, required: true },
    skorMaksimal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["lulus", "tidak_lulus", "belum_dikoreksi"],
      default: "belum_dikoreksi",
    },
    detailPerTipe: [
      {
        tipe: String,
        benar: Number,
        total: Number,
        skor: Number,
      },
    ],
    waktuPengerjaan: { type: Number },
    tanggalUjian: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ============================================
// EXPORT MODELS (dengan guard untuk hot reload)
// ============================================
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export const Siswa: Model<ISiswa> =
  mongoose.models.Siswa || mongoose.model<ISiswa>("Siswa", SiswaSchema);

export const Kelas: Model<IKelas> =
  mongoose.models.Kelas || mongoose.model<IKelas>("Kelas", KelasSchema);

export const Soal: Model<ISoal> =
  mongoose.models.Soal || mongoose.model<ISoal>("Soal", SoalSchema);

export const Ujian: Model<IUjian> =
  mongoose.models.Ujian || mongoose.model<IUjian>("Ujian", UjianSchema);

export const UjianSesi: Model<IUjianSesi> =
  mongoose.models.UjianSesi ||
  mongoose.model<IUjianSesi>("UjianSesi", UjianSesiSchema);

export const HasilUjian: Model<IHasilUjian> =
  mongoose.models.HasilUjian ||
  mongoose.model<IHasilUjian>("HasilUjian", HasilUjianSchema);