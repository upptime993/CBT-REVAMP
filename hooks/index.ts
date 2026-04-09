"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useExamStore } from "@/store";
import toast from "react-hot-toast";

// ============================================
// UTILITY: Device Detection
// ============================================
const isMobileDevice = () => {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    .test(navigator.userAgent) || 
    ("ontouchstart" in window) ||
    (navigator.maxTouchPoints > 0);
};

const isIOS = () => {
  if (typeof window === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// ============================================
// useAntiCheat HOOK - FIXED VERSION
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
  
  // ✅ FIX: Gunakan ref untuk track violation count secara akurat
  const violationCountRef = useRef(jumlahPelanggaran);
  const isMobile = useRef(isMobileDevice());
  const isIOSDevice = useRef(isIOS());
  
  // ✅ FIX: Track state tambahan untuk mobile
  const lastActiveTime = useRef(Date.now());
  const isFullscreenActive = useRef(false);
  const pageHiddenTime = useRef<number | null>(null);
  
  // Update ref setiap jumlahPelanggaran berubah
  useEffect(() => {
    violationCountRef.current = jumlahPelanggaran;
  }, [jumlahPelanggaran]);

  // ✅ FIX: logViolation yang tidak ada race condition
  const logViolation = useCallback(
    async (tipe: string, keterangan: string) => {
      if (!enabled) return;

      // Increment ref DULU sebelum state update
      violationCountRef.current += 1;
      const currentCount = violationCountRef.current;
      
      // Update store state
      tambahPelanggaran();

      // Log ke server (non-blocking)
      fetch("/api/sesi", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sesiId, 
          tipe, 
          keterangan, 
          action: "pelanggaran",
          timestamp: new Date().toISOString(),
          device: isMobile.current ? "mobile" : "desktop"
        }),
      }).catch(() => {}); // Silent fail, jangan block UI

      onViolation(currentCount, tipe);

      if (currentCount >= batasPelanggaran) {
        onMaxViolation();
      }
    },
    [enabled, sesiId, tambahPelanggaran, batasPelanggaran, onViolation, onMaxViolation]
  );

  // ============================================
  // DESKTOP-SPECIFIC EVENTS
  // ============================================
  useEffect(() => {
    if (!enabled || isMobile.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && ["c", "v", "p", "s", "a", "u"].includes(e.key.toLowerCase()),
        e.key === "F12",
        e.key === "PrintScreen",
        e.altKey && e.key === "Tab",
        e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase()),
        e.metaKey && ["c", "v"].includes(e.key.toLowerCase()), // Mac
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        logViolation("keyboard_shortcut", `Shortcut terlarang: ${e.key}`);
      }
    };

    // ✅ Deteksi fullscreen hanya di desktop
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      isFullscreenActive.current = isFullscreen;
      
      if (!isFullscreen) {
        logViolation("keluar_fullscreen", "Keluar dari mode layar penuh");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [enabled, logViolation]);

  // ============================================
  // CROSS-PLATFORM EVENTS (Desktop + Mobile)
  // ============================================
  useEffect(() => {
    if (!enabled) return;

    // ✅ Context menu - works di kedua platform
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      logViolation("klik_kanan", "Mencoba membuka menu konteks");
    };

    // ✅ Copy/paste - works di kedua platform
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("copy", "Mencoba menyalin teks");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      logViolation("paste", "Mencoba menempel teks");
    };

    // ✅ FIX: Visibility change dengan cooldown untuk mobile
    // Mobile sering trigger ini saat keyboard muncul, dll
    let visibilityTimeout: NodeJS.Timeout | null = null;
    const VISIBILITY_COOLDOWN = isMobile.current ? 1500 : 300; // ms
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pageHiddenTime.current = Date.now();
        
        // ✅ Delay untuk mobile - tunggu konfirmasi benar-benar keluar
        visibilityTimeout = setTimeout(() => {
          if (document.hidden) { // Cek lagi setelah delay
            logViolation("pindah_tab", "Keluar dari tab/aplikasi ujian");
          }
        }, VISIBILITY_COOLDOWN);
      } else {
        // User kembali - cancel pending violation jika cepat kembali
        if (visibilityTimeout) {
          clearTimeout(visibilityTimeout);
          visibilityTimeout = null;
        }
        
        // ✅ Cek durasi keluar - jika lama, tetap catat
        if (pageHiddenTime.current) {
          const hiddenDuration = Date.now() - pageHiddenTime.current;
          if (hiddenDuration > 3000) { // Lebih dari 3 detik
            logViolation(
              "kembali_dari_luar", 
              `Kembali setelah ${Math.round(hiddenDuration / 1000)}s keluar`
            );
          }
          pageHiddenTime.current = null;
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (visibilityTimeout) clearTimeout(visibilityTimeout);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, logViolation]);

  // ============================================
  // MOBILE-SPECIFIC DETECTION
  // ============================================
  useEffect(() => {
    if (!enabled || !isMobile.current) return;

    // ✅ FIX: Deteksi blur dengan debounce di mobile
    // (keyboard virtual bisa trigger blur palsu)
    let blurTimeout: NodeJS.Timeout | null = null;
    let isFocused = true;
    
    const handleBlur = () => {
      // Di mobile, blur sering trigger saat keyboard muncul
      // Gunakan delay lebih panjang
      blurTimeout = setTimeout(() => {
        if (!isFocused && document.hidden) {
          logViolation("window_blur", "Berpindah ke aplikasi lain");
        }
      }, 2000); // 2 detik delay untuk mobile
      isFocused = false;
    };
    
    const handleFocus = () => {
      isFocused = true;
      if (blurTimeout) {
        clearTimeout(blurTimeout);
        blurTimeout = null;
      }
    };

    // ✅ Deteksi screenshot di mobile (Android)
    // Cek perubahan ukuran layar yang tiba-tiba
    let lastWidth = window.screen.width;
    let lastHeight = window.screen.height;
    
    const handleResize = () => {
      const currentWidth = window.screen.width;
      const currentHeight = window.screen.height;
      
      // ✅ Deteksi split screen / floating window
      const widthChange = Math.abs(currentWidth - lastWidth);
      const heightChange = Math.abs(currentHeight - lastHeight);
      
      if (widthChange > 100 || heightChange > 100) {
        // Perubahan signifikan = kemungkinan split screen
        logViolation(
          "split_screen", 
          `Perubahan ukuran layar terdeteksi: ${currentWidth}x${currentHeight}`
        );
      }
      
      lastWidth = currentWidth;
      lastHeight = currentHeight;
    };

    // ✅ Deteksi orientasi berubah (bisa indikasi split screen)
    const handleOrientationChange = () => {
      // Beri waktu untuk orientasi settle
      setTimeout(() => {
        const newWidth = window.innerWidth;
        const screenWidth = window.screen.width;
        
        // Jika innerWidth jauh lebih kecil dari screen = split screen
        if (newWidth < screenWidth * 0.6) {
          logViolation("split_screen", "Kemungkinan mode split screen aktif");
        }
      }, 500);
    };

    // ✅ Deteksi Picture-in-Picture (video floating)
    const handlePiPChange = () => {
      if (document.pictureInPictureElement) {
        logViolation("picture_in_picture", "Mode picture-in-picture aktif");
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    document.addEventListener("enterpictureinpicture", handlePiPChange);

    return () => {
      if (blurTimeout) clearTimeout(blurTimeout);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      document.removeEventListener("enterpictureinpicture", handlePiPChange);
    };
  }, [enabled, logViolation]);

  // ============================================
  // FULLSCREEN MANAGEMENT - Cross Platform
  // ============================================
  const enterFullscreen = useCallback(async () => {
    // iOS tidak support fullscreen API sama sekali
    if (isIOSDevice.current) {
      toast("📱 Gunakan mode Safari fullscreen (tap AA → Sembunyikan Toolbar)", {
        duration: 5000,
        icon: "ℹ️",
      });
      return true; // Return true agar tidak block ujian di iOS
    }

    // Mobile Android - gunakan pendekatan berbeda
    if (isMobile.current) {
      try {
        // Coba berbagai API
        const el = document.documentElement;
        const requestFS = 
          el.requestFullscreen?.bind(el) ||
          (el as any).webkitRequestFullscreen?.bind(el) ||
          (el as any).mozRequestFullScreen?.bind(el);
          
        if (requestFS) {
          await requestFS();
          isFullscreenActive.current = true;
          return true;
        }
      } catch (err) {
        // Fullscreen gagal di mobile - jangan block ujian
        toast("💡 Tips: Gunakan browser Chrome dan aktifkan mode fullscreen", {
          duration: 4000,
        });
        return true; // Tetap lanjutkan ujian
      }
    }

    // Desktop
    try {
      await document.documentElement.requestFullscreen();
      isFullscreenActive.current = true;
      return true;
    } catch {
      toast.error("Gagal masuk mode layar penuh. Coba tekan F11.");
      return false;
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch {} // Silent fail
    isFullscreenActive.current = false;
  }, []);

  return {
    jumlahPelanggaran,
    enterFullscreen,
    exitFullscreen,
    isMobile: isMobile.current,
  };
}