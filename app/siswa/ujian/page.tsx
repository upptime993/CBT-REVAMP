"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Key, AlertTriangle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { SiswaLayout } from "@/components/layout";
import { Button, Alert, Badge, Modal } from "@/components/ui";
import { UjianAvailableCard } from "@/components/dashboard-components";
import { useAuthStore, useExamStore } from "@/store";
import toast from "react-hot-toast";

// ── Loading Fallback ──
function SiswaUjianLoading() {
  return (
    <SiswaLayout title="Ujian Tersedia" showBack>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-36 rounded-2xl" />
        ))}
      </div>
    </SiswaLayout>
  );
}

// ── Komponen utama yang pakai useSearchParams ──
function SiswaUjianContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();
  const { resetExam } = useExamStore();

  const [ujianList, setUjianList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Token input state
  const [selectedUjian, setSelectedUjian] = useState<any | null>(null);
  const [token_input, setTokenInput] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");

  // Warning modal state
  const [showWarning, setShowWarning] = useState(false);
  const [verifiedUjian, setVerifiedUjian] = useState<any | null>(null);

  const fetchUjian = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ujian", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setUjianList(data.data?.list || []);
    } catch {
      toast.error("Gagal memuat daftar ujian");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUjian();
  }, [fetchUjian]);

  // Auto-select ujian dari query param setelah fetch selesai
  useEffect(() => {
    const id = searchParams.get("id");
    if (id && ujianList.length > 0) {
      const found = ujianList.find((u) => u._id === id);
      if (found) setSelectedUjian(found);
    }
  }, [searchParams, ujianList]);

  const handleVerifikasiToken = async () => {
    if (!token_input.trim()) {
      setTokenError("Token wajib diisi");
      return;
    }
    if (token_input.length < 4) {
      setTokenError("Token tidak valid");
      return;
    }

    setTokenLoading(true);
    setTokenError("");
    try {
      const res = await fetch("/api/ujian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "verifikasi_token",
          ujianId: selectedUjian._id,
          token: token_input.toUpperCase(),
          siswaId: user?.id,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setVerifiedUjian(data.data.ujian);
        setShowWarning(true);
      } else {
        setTokenError(data.message);
      }
    } catch {
      setTokenError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleMulaiUjian = async () => {
    if (!selectedUjian) return;
    resetExam();
    router.push(`/ujian-aktif/${selectedUjian._id}`);
  };

  return (
    <>
      <SiswaLayout title="Ujian Tersedia" showBack>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-36 rounded-2xl" />
              ))}
            </div>
          ) : ujianList.length === 0 ? (
            <div className="text-center py-16 text-[#6B7280]">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Tidak ada ujian tersedia saat ini</p>
              <p className="text-xs mt-1">
                Hubungi guru jika merasa ada ujian yang seharusnya tersedia
              </p>
            </div>
          ) : (
            ujianList.map((ujian) => (
              <UjianAvailableCard
                key={ujian._id}
                ujian={ujian}
                onKerjakan={() => {
                  setSelectedUjian(ujian);
                  setTokenInput("");
                  setTokenError("");
                }}
              />
            ))
          )}
        </div>
      </SiswaLayout>

      {/* TOKEN INPUT MODAL */}
      <Modal
        open={!!selectedUjian && !showWarning}
        onClose={() => {
          setSelectedUjian(null);
          setTokenInput("");
          setTokenError("");
        }}
        title="Masukkan Token Ujian"
        size="sm"
      >
        {selectedUjian && (
          <div className="space-y-4">
            {/* Info Ujian */}
            <div className="bg-[#16213E] rounded-xl p-4 space-y-2">
              <p className="font-semibold text-white">{selectedUjian.nama}</p>
              <div className="flex items-center gap-4 text-xs text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedUjian.durasi} menit
                </span>
                <span>{selectedUjian.soalIds?.length || 0} soal</span>
                <Badge variant="success" dot>
                  {selectedUjian.mapel}
                </Badge>
              </div>
            </div>

            {/* Token Input */}
            <div>
              <label className="form-label">
                Token dari Guru{" "}
                <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <input
                  type="text"
                  value={token_input}
                  onChange={(e) => {
                    const val = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "")
                      .slice(0, 6);
                    setTokenInput(val);
                    setTokenError("");
                  }}
                  placeholder="Contoh: MTK001"
                  className={`input pl-10 text-center text-2xl font-mono tracking-[0.3em] uppercase ${
                    tokenError ? "input-error" : ""
                  }`}
                  maxLength={6}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              {tokenError && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {tokenError}
                </p>
              )}
              <p className="text-xs text-[#6B7280] mt-1.5 text-center">
                {token_input.length}/6 karakter
              </p>
            </div>

            <Alert
              type="info"
              message="Token diberikan oleh guru sebelum ujian dimulai. Hubungi guru jika belum mendapat token."
            />

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setSelectedUjian(null);
                  setTokenInput("");
                }}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                fullWidth
                loading={tokenLoading}
                disabled={token_input.length < 4}
                onClick={handleVerifikasiToken}
              >
                Verifikasi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* FULLSCREEN WARNING MODAL */}
      <AnimatePresence>
        {showWarning && verifiedUjian && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F0F1A]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm"
            >
              {/* Fullscreen icon */}
              <div className="text-center mb-6">
                <div className="w-20 h-20 mx-auto mb-4 relative">
                  <div className="absolute inset-0 border-4 border-teal-500/30 rounded-2xl" />
                  <div className="absolute top-1 left-1 w-5 h-5 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
                  <div className="absolute top-1 right-1 w-5 h-5 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
                  <div className="absolute bottom-1 left-1 w-5 h-5 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
                  <div className="absolute bottom-1 right-1 w-5 h-5 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Ujian Membutuhkan Layar Penuh
                </h2>
                <p className="text-[#B0B0C0] text-sm">
                  Klik tombol di bawah untuk masuk ke mode layar penuh dan
                  memulai ujian.
                </p>
              </div>

              {/* Info ujian */}
              <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4 mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B7280]">Ujian</span>
                  <span className="text-white font-medium">
                    {verifiedUjian.nama}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#6B7280]">Durasi</span>
                  <span className="text-white">
                    {verifiedUjian.durasi} menit
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Jumlah Soal</span>
                  <span className="text-white">
                    {verifiedUjian.jumlahSoal} soal
                  </span>
                </div>
              </div>

              {/* Peringatan */}
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
                <p className="text-red-400 font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  PERINGATAN! Dilarang Keras:
                </p>
                <ul className="space-y-1.5 text-sm text-[#B0B0C0]">
                  {[
                    "Keluar dari mode layar penuh (Fullscreen)",
                    "Berpindah tab/jendela lain, atau Split Screen",
                    "Menggunakan fitur Copy, Paste, atau Screenshot",
                    "Membuka Developer Tools (F12)",
                    "Klik kanan pada halaman ujian",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 pt-3 border-t border-red-500/20">
                  <p className="text-red-400 text-xs font-semibold text-center">
                    ⚠️ Pelanggaran 3x otomatis mengeluarkan dari ujian ⚠️
                  </p>
                  <p className="text-[#6B7280] text-xs text-center mt-1">
                    Butuh persetujuan guru untuk masuk kembali
                  </p>
                </div>
              </div>

              {/* Tombol mulai */}
              <Button
                variant="teal"
                fullWidth
                size="lg"
                onClick={handleMulaiUjian}
                icon={<ArrowRight className="w-5 h-5" />}
              >
                Masuk Layar Penuh & Mulai Ujian
              </Button>

              <button
                onClick={() => {
                  setShowWarning(false);
                  setSelectedUjian(null);
                  setTokenInput("");
                }}
                className="w-full text-center text-xs text-[#6B7280] mt-3 hover:text-white"
              >
                Batal, kembali ke daftar ujian
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Default Export dengan Suspense ──
export default function SiswaUjianPage() {
  return (
    <Suspense fallback={<SiswaUjianLoading />}>
      <SiswaUjianContent />
    </Suspense>
  );
}