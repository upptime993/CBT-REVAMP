import { create } from "zustand";
import { persist } from "zustand/middleware";
import { JWTPayload } from "@/lib/auth";

// ============================================
// AUTH STORE
// ============================================
interface AuthState {
  user: JWTPayload | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: JWTPayload | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, token: null }),
    }),
    {
      name: "cbt-auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

// ============================================
// UI STORE
// ============================================
interface UIState {
  isDark: boolean;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setSidebar: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isDark: true,
      sidebarOpen: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "cbt-ui",
    }
  )
);

// ============================================
// EXAM STORE (state ujian aktif)
// ============================================
export type JawabanMap = Record<string, string | string[] | Record<string, string> | null>;

interface ExamState {
  // Info ujian
  ujianId: string | null;
  sesiId: string | null;
  namaUjian: string;
  mapel: string;

  // Soal
  soalList: any[];
  currentIndex: number;
  urutanSoal: string[];

  // Jawaban
  jawaban: JawabanMap;

  // Timer
  sisaWaktu: number; // detik
  waktuMulai: number | null; // timestamp

  // Anti-cheat
  jumlahPelanggaran: number;
  batasPelanggaran: number;
  isFullscreen: boolean;

  // Status
  isActive: boolean;
  isSubmitting: boolean;

  // Actions
  setUjianInfo: (info: Partial<ExamState>) => void;
  setSoalList: (soal: any[]) => void;
  setCurrentIndex: (index: number) => void;
  setJawaban: (soalId: string, jawaban: JawabanMap[string]) => void;
  setSisaWaktu: (waktu: number) => void;
  tambahPelanggaran: () => void;
  setFullscreen: (val: boolean) => void;
  setActive: (val: boolean) => void;
  setSubmitting: (val: boolean) => void;
  resetExam: () => void;
}

const examInitialState = {
  ujianId: null,
  sesiId: null,
  namaUjian: "",
  mapel: "",
  soalList: [],
  currentIndex: 0,
  urutanSoal: [],
  jawaban: {},
  sisaWaktu: 0,
  waktuMulai: null,
  jumlahPelanggaran: 0,
  batasPelanggaran: 3,
  isFullscreen: false,
  isActive: false,
  isSubmitting: false,
};

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      ...examInitialState,
      setUjianInfo: (info) => set((state) => ({ ...state, ...info })),
      setSoalList: (soalList) => set({ soalList }),
      setCurrentIndex: (currentIndex) => set({ currentIndex }),
      setJawaban: (soalId, jawaban) =>
        set((state) => ({
          jawaban: { ...state.jawaban, [soalId]: jawaban },
        })),
      setSisaWaktu: (sisaWaktu) => set({ sisaWaktu }),
      tambahPelanggaran: () =>
        set((state) => ({
          jumlahPelanggaran: state.jumlahPelanggaran + 1,
        })),
      setFullscreen: (isFullscreen) => set({ isFullscreen }),
      setActive: (isActive) => set({ isActive }),
      setSubmitting: (isSubmitting) => set({ isSubmitting }),
      resetExam: () => set(examInitialState),
    }),
    {
      name: "cbt-exam",
      // Persist jawaban & waktu agar aman jika refresh
      partialize: (state) => ({
        ujianId: state.ujianId,
        sesiId: state.sesiId,
        jawaban: state.jawaban,
        sisaWaktu: state.sisaWaktu,
        waktuMulai: state.waktuMulai,
        currentIndex: state.currentIndex,
        jumlahPelanggaran: state.jumlahPelanggaran,
        namaUjian: state.namaUjian,
        mapel: state.mapel,
      }),
    }
  )
);