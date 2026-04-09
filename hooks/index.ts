"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useExamStore } from "@/store";
import toast from "react-hot-toast";

// ============================================
// useAuth HOOK
// ============================================
export function useAuth() {
  const { user, token, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
    storeLogout();
    router.push("/login");
  }, [token, storeLogout, router]);

  const requireRole = useCallback(
    (roles: string[]) => {
      if (!user || !roles.includes(user.role)) {
        router.push("/login");
        return false;
      }
      return true;
    },
    [user, router]
  );

  return { user, token, logout, requireRole, isLoggedIn: !!user };
}

// ============================================
// useTimer HOOK
// ============================================
export function useTimer(
  initialSeconds: number,
  onTimeUp: () => void,
  autoStart = false
) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, onTimeUp]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false);
    setSeconds(newSeconds ?? initialSeconds);
  }, [initialSeconds]);

  const formatTime = useCallback(() => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [seconds]);

  const isWarning = seconds <= 300 && seconds > 0; // 5 menit terakhir
  const isDanger = seconds <= 60 && seconds > 0; // 1 menit terakhir

  return { seconds, isRunning, start, pause, reset, formatTime, isWarning, isDanger };
}

// ============================================
// useAntiCheat HOOK
// ============================================
interface AntiCheatOptions {
  enabled: boolean;
  batasPelanggaran: number;
  sesiId: string;
  onViolation: (count: number, tipe: string) => void;
  onMaxViolation: () => void;
}

export function useAntiCheat({
  enabled,
  batasPelanggaran,
  sesiId,
  onViolation,
  onMaxViolation,
}: AntiCheatOptions) {
  const { jumlahPelanggaran, tambahPelanggaran } = useExamStore();
  const violationRef = useRef(jumlahPelanggaran);

  // Update ref setiap jumlahPelanggaran berubah
  useEffect(() => {
    violationRef.current = jumlahPelanggaran;
  }, [jumlahPelanggaran]);

  const logViolation = useCallback(
    async (tipe: string, keterangan: string) => {
      if (!enabled) return;

      tambahPelanggaran();
      const newCount = violationRef.current + 1;

      // Log ke server
      try {
        await fetch("/api/sesi", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sesiId, tipe, keterangan, action: "pelanggaran" }),
        });
      } catch {}

      onViolation(newCount, tipe);

      if (newCount >= batasPelanggaran) {
        onMaxViolation();
      }
    },
    [enabled, sesiId, tambahPelanggaran, batasPelanggaran, onViolation, onMaxViolation]
  );

  useEffect(() => {
    if (!enabled) return;

    // Block context menu (klik kanan)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("klik_kanan", "Mencoba membuka menu konteks");
    };

    // Block copy/paste/cut
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("copy", "Mencoba menyalin teks");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("paste", "Mencoba menempel teks");
    };

    // Block keyboard shortcuts berbahaya
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && ["c", "v", "p", "s", "a", "u"].includes(e.key.toLowerCase()),
        e.key === "F12",
        e.key === "PrintScreen",
        e.altKey && e.key === "Tab",
        e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()),
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        logViolation("keyboard_shortcut", `Shortcut terlarang: ${e.key}`);
      }
    };

    // Deteksi pindah tab / minimize
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("pindah_tab", "Keluar dari tab ujian");
      }
    };

    // Deteksi keluar fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        logViolation("keluar_fullscreen", "Keluar dari mode layar penuh");
      }
    };

    // Deteksi window blur (alt+tab, dll)
    const handleBlur = () => {
      logViolation("window_blur", "Berpindah ke aplikasi lain");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled, logViolation]);

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      return true;
    } catch {
      toast.error("Gagal masuk mode layar penuh. Coba tekan F11.");
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }, []);

  return {
    jumlahPelanggaran,
    enterFullscreen,
    exitFullscreen,
  };
}

// ============================================
// useFetch HOOK (generic data fetching)
// ============================================
export function useFetch<T>(url: string | null, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const fetchData = useCallback(async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options?.headers,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Terjadi kesalahan");
      setData(json.data);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  }, [url, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, error, refetch: fetchData };
}

// ============================================
// useAPI HOOK (untuk POST/PUT/DELETE)
// ============================================
export function useAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  const call = useCallback(
    async (
      url: string,
      method: "POST" | "PUT" | "DELETE" | "PATCH",
      body?: unknown
    ) => {
      setIsLoading(true);
      try {
        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Terjadi kesalahan");
        return { success: true, data: json.data, message: json.message };
      } catch (err: any) {
        return { success: false, error: err.message || "Gagal" };
      } finally {
        setIsLoading(false);
      }
    },
    [token]
  );

  return { call, isLoading };
}