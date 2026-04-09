import { TipeSoal, ISoal, IJawaban } from "./mongodb";

// ============================================
// TOKEN GENERATOR
// ============================================
export function generateToken(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// ============================================
// AUTO GRADING ENGINE
// ============================================
export function autoGrade(
  soal: ISoal,
  jawaban: IJawaban["jawaban"]
): number {
  if (jawaban === null || jawaban === undefined) return 0;

  switch (soal.tipe) {
    case "pilihan_ganda": {
      const kunci = soal.kunciJawaban as string;
      return jawaban === kunci ? soal.poin : 0;
    }

    case "pg_kompleks": {
      const kunci = (soal.kunciJawaban as string[]).sort();
      const jwb = ((jawaban as string[]) || []).sort();
      // Semua jawaban harus tepat (tidak boleh kurang atau lebih)
      const benar =
        kunci.length === jwb.length &&
        kunci.every((k, i) => k === jwb[i]);
      if (benar) return soal.poin;
      // Poin parsial: benar sebagian
      const benarSebagian = kunci.filter((k) => jwb.includes(k)).length;
      if (benarSebagian > 0) {
        return Math.round((benarSebagian / kunci.length) * soal.poin);
      }
      return 0;
    }

    case "isian_singkat": {
      const diterima = soal.jawabanDiterima || [];
      const jwbStr = (jawaban as string).trim().toLowerCase();
      const cocok = diterima.some(
        (j) => j.trim().toLowerCase() === jwbStr
      );
      return cocok ? soal.poin : 0;
    }

    case "menjodohkan": {
      const pasangan = soal.pasangan || [];
      const jwbObj = jawaban as Record<string, string>;
      let benar = 0;
      pasangan.forEach((p) => {
        if (jwbObj[p.id] === p.kanan) benar++;
      });
      return Math.round((benar / pasangan.length) * soal.poin);
    }

    case "esai":
      // Esai tidak bisa auto-grade
      return 0;

    default:
      return 0;
  }
}

// ============================================
// HITUNG NILAI AKHIR (0-100)
// ============================================
export function hitungNilaiAkhir(
  totalSkor: number,
  skorMaksimal: number
): number {
  if (skorMaksimal === 0) return 0;
  return Math.round((totalSkor / skorMaksimal) * 100);
}

// ============================================
// ACAK ARRAY (Fisher-Yates)
// ============================================
export function acakArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================
// FORMAT LABEL TIPE SOAL
// ============================================
export function labelTipe(tipe: TipeSoal): string {
  const map: Record<TipeSoal, string> = {
    pilihan_ganda: "Pilihan Ganda",
    pg_kompleks: "PG Kompleks",
    isian_singkat: "Isian Singkat",
    menjodohkan: "Menjodohkan",
    esai: "Esai",
  };
  return map[tipe] || tipe;
}

export function warnaTipe(tipe: TipeSoal): string {
  const map: Record<TipeSoal, string> = {
    pilihan_ganda: "bg-blue-500/20 text-blue-400",
    pg_kompleks: "bg-green-500/20 text-green-400",
    isian_singkat: "bg-yellow-500/20 text-yellow-400",
    menjodohkan: "bg-orange-500/20 text-orange-400",
    esai: "bg-red-500/20 text-red-400",
  };
  return map[tipe] || "bg-gray-500/20 text-gray-400";
}

// ============================================
// FORMAT WAKTU
// ============================================
export function formatDurasi(detik: number): string {
  const menit = Math.floor(detik / 60);
  const sisa = detik % 60;
  return `${String(menit).padStart(2, "0")}:${String(sisa).padStart(2, "0")}`;
}

export function formatTanggal(date: Date | string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatWaktu(date: Date | string): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// CLASS MERGE UTILITY
// ============================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================
// VALIDASI NISN
// ============================================
export function validasiNISN(nisn: string): boolean {
  return /^\d{10}$/.test(nisn.trim());
}

// ============================================
// CENSOR NISN untuk tampilan
// ============================================
export function censorNISN(nisn: string): string {
  if (nisn.length <= 4) return nisn;
  return nisn.slice(0, 3) + "****" + nisn.slice(-3);
}

// ============================================
// STATUS BADGE CONFIG
// ============================================
export function statusUjianConfig(status: string) {
  const map: Record<string, { label: string; class: string }> = {
    draft: { label: "Draft", class: "bg-gray-500/20 text-gray-400" },
    aktif: { label: "Aktif", class: "bg-green-500/20 text-green-400 animate-pulse" },
    selesai: { label: "Selesai", class: "bg-blue-500/20 text-blue-400" },
  };
  return map[status] || { label: status, class: "bg-gray-500/20 text-gray-400" };
}

export function statusSesiConfig(status: string) {
  const map: Record<string, { label: string; class: string }> = {
    belum_mulai: { label: "Belum Mulai", class: "bg-gray-500/20 text-gray-400" },
    berlangsung: { label: "Sedang Ujian", class: "bg-yellow-500/20 text-yellow-400" },
    selesai: { label: "Selesai", class: "bg-green-500/20 text-green-400" },
    dikeluarkan: { label: "Dikeluarkan", class: "bg-red-500/20 text-red-400" },
    ditangguhkan: { label: "Ditangguhkan", class: "bg-orange-500/20 text-orange-400" },
  };
  return map[status] || { label: status, class: "bg-gray-500/20 text-gray-400" };
}

// ============================================
// PAGINATION HELPER
// ============================================
export function getPaginationData(
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  return { totalPages, hasNext, hasPrev, total };
}