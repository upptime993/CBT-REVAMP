"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
} from "lucide-react";
import { Button, Modal, Alert } from "@/components/ui";
import { TimerDisplay, ScoreCircle } from "@/components/shared";
import { useAuthStore, useExamStore } from "@/store";
import { useAntiCheat, useTimer } from "@/hooks";
import { cn, labelTipe, acakArray } from "@/lib/utils";
import toast from "react-hot-toast";

// ── Answer Components ──
function PGAnswer({
  opsi, jawaban, onChange, acak,
}: {
  opsi: any[]; jawaban: string; onChange: (v: string) => void; acak?: boolean;
}) {
  const list = acak ? acakArray(opsi) : opsi;
  return (
    <div className="space-y-2">
      {list.map((o: any) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
            jawaban === o.id
              ? "border-purple-500 bg-purple-500/15 text-white"
              : "border-[#2A2A4A] bg-[#16213E] text-[#B0B0C0] hover:border-[#3A3A5A]"
          )}
        >
          <div className={cn(
            "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
            jawaban === o.id ? "bg-purple-500 text-white" : "bg-[#2A2A4A] text-[#6B7280]"
          )}>
            {jawaban === o.id ? "✓" : o.id}
          </div>
          <span className="text-sm">{o.teks}</span>
        </button>
      ))}
    </div>
  );
}

function PGKompleksAnswer({
  opsi, jawaban, onChange,
}: {
  opsi: any[]; jawaban: string[]; onChange: (v: string[]) => void;
}) {
  const toggle = (id: string) => {
    onChange(
      jawaban.includes(id) ? jawaban.filter((j) => j !== id) : [...jawaban, id]
    );
  };
  return (
    <div className="space-y-2">
      <p className="text-xs text-teal-400 mb-3">
        ✓ Pilih semua jawaban yang benar (bisa lebih dari satu)
      </p>
      {opsi.map((o: any) => {
        const checked = jawaban.includes(o.id);
        return (
          <button
            key={o.id}
            onClick={() => toggle(o.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
              checked
                ? "border-teal-500 bg-teal-500/15 text-white"
                : "border-[#2A2A4A] bg-[#16213E] text-[#B0B0C0] hover:border-[#3A3A5A]"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0",
              checked ? "bg-teal-500 border-teal-500" : "border-[#4A4A6A]"
            )}>
              {checked && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-sm">{o.teks}</span>
          </button>
        );
      })}
    </div>
  );
}

function IsianAnswer({
  jawaban, onChange,
}: {
  jawaban: string; onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={jawaban || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Ketik jawaban kamu di sini..."
      className="input text-base"
      autoComplete="off"
    />
  );
}

function MenjodohkanAnswer({
  pasangan, jawaban, onChange,
}: {
  pasangan: any[]; jawaban: Record<string, string>; onChange: (v: Record<string, string>) => void;
}) {
  const kananList = pasangan.map((p) => p.kanan);
  const acakKanan = useRef(acakArray(kananList)).current;

  const handleSelect = (pasanganId: string, kanan: string) => {
    onChange({ ...jawaban, [pasanganId]: kanan });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6B7280]">Cocokkan kolom kiri dengan kolom kanan</p>
      {pasangan.map((p) => (
        <div key={p.id} className="grid grid-cols-2 gap-2 items-center">
          <div className="bg-[#16213E] border border-[#2A2A4A] rounded-xl px-3 py-2.5 text-sm text-[#B0B0C0]">
            {p.kiri}
          </div>
          <select
            value={jawaban[p.id] || ""}
            onChange={(e) => handleSelect(p.id, e.target.value)}
            className="input text-sm"
          >
            <option value="">-- Pilih --</option>
            {acakKanan.map((k: string) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function EsaiAnswer({
  jawaban, onChange,
}: {
  jawaban: string; onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={jawaban || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Tulis jawaban kamu di sini secara lengkap dan jelas..."
      rows={8}
      className="input resize-none"
    />
  );
}

// ── MAIN EXAM PAGE ──
export default function UjianAktifPage() {
  const router = useRouter();
  const params = useParams();
  const ujianId = params.id as string;
  const { user, token } = useAuthStore();
  const examStore = useExamStore();

  const [ujian, setUjian] = useState<any>(null);
  const [soalList, setSoalList] = useState<any[]>([]);
  const [sesiId, setSesiId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawaban, setJawaban] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [ujianSelesai, setUjianSelesai] = useState(false);
  const [hasilAkhir, setHasilAkhir] = useState<any>(null);

  // Violation state
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [violationMessage, setViolationMessage] = useState("");
  const [isKicked, setIsKicked] = useState(false);
  const batasRef = useRef(3);

  // Auto-save interval ref
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // ── INIT: Mulai ujian ──
  useEffect(() => {
    const initUjian = async () => {
      setLoading(true);
      try {
        // Ambil data ujian (soal tanpa kunci jawaban)
        const ujianRes = await fetch(`/api/ujian?id=${ujianId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const ujianData = await ujianRes.json();
        if (!ujianData.success) {
          toast.error("Ujian tidak ditemukan");
          router.push("/siswa/ujian");
          return;
        }

        setUjian(ujianData.data.ujian);
        batasRef.current = ujianData.data.ujian.pengaturan?.bataspelanggaran || 3;

        // Mulai sesi
        const sesiRes = await fetch("/api/sesi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "mulai", ujianId }),
        });
        const sesiData = await sesiRes.json();
        if (!sesiData.success) {
          toast.error(sesiData.message);
          router.push("/siswa/ujian");
          return;
        }

        setSesiId(sesiData.data.sesi._id);
        setViolationCount(sesiData.data.sesi.jumlahPelanggaran || 0);

        // Set soal berdasarkan urutan yang sudah diacak
        const urutanSoal: string[] = sesiData.data.urutanSoal;
        const soalMap = new Map(
          ujianData.data.soalList.map((s: any) => [s._id, s])
        );
        const orderedSoal = urutanSoal
          .map((id: string) => soalMap.get(id))
          .filter(Boolean);
        setSoalList(orderedSoal);

        // Restore jawaban yang sudah ada
        const existingJawaban: Record<string, any> = {};
        sesiData.data.sesi.jawaban?.forEach((j: any) => {
          if (j.jawaban !== null) existingJawaban[j.soalId] = j.jawaban;
        });
        setJawaban(existingJawaban);

        // Set timer
        timerRef.current = sesiData.data.sisaWaktu;
      } catch (err) {
        toast.error("Gagal memulai ujian");
        router.push("/siswa/ujian");
      } finally {
        setLoading(false);
      }
    };
    initUjian();
  }, [ujianId, token]);

  // ── TIMER ──
  const timerRef = useRef(0);
  const [sisaWaktu, setSisaWaktu] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (loading || ujianSelesai) return;

    timerInterval.current = setInterval(() => {
      timerRef.current -= 1;
      setSisaWaktu(timerRef.current);
      if (timerRef.current <= 0) {
        clearInterval(timerInterval.current!);
        handleSubmit(true); // Auto-submit
      }
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [loading, ujianSelesai]);

  useEffect(() => {
    if (!loading) setSisaWaktu(timerRef.current);
  }, [loading]);

  // ── AUTO-SAVE (setiap 30 detik) ──
  useEffect(() => {
    if (!sesiId || loading) return;
    autoSaveRef.current = setInterval(async () => {
      await autoSave();
    }, 30000);
    return () => {
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);
    };
  }, [sesiId, jawaban, loading]);

  const autoSave = useCallback(async () => {
    if (!sesiId) return;
    // Simpan semua jawaban satu per satu
    const promises = Object.entries(jawaban).map(([soalId, jwb]) =>
      fetch("/api/sesi", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "simpan_jawaban",
          sesiId,
          soalId,
          jawaban: jwb,
        }),
      })
    );
    await Promise.allSettled(promises);
  }, [sesiId, jawaban, token]);

  // ── ANTI-CHEAT ──
  const handleViolation = useCallback(
    (count: number, tipe: string) => {
      setViolationCount(count);
      const sisa = batasRef.current - count;

      if (count < batasRef.current) {
        setViolationMessage(
          `⚠️ Peringatan ${count}/${batasRef.current}: Aktivitas mencurigakan terdeteksi! (${sisa} kesempatan tersisa)`
        );
        setShowViolationAlert(true);
        // Shake effect
        document.body.classList.add("violation-shake");
        setTimeout(() => document.body.classList.remove("violation-shake"), 500);
      }
    },
    []
  );

  const handleMaxViolation = useCallback(async () => {
    // Auto-save dulu
    await autoSave();
    // Submit otomatis
    await handleSubmit(true, true);
    setIsKicked(true);
  }, [autoSave]);

  const { enterFullscreen } = useAntiCheat({
    enabled: !loading && !ujianSelesai && !!ujian?.pengaturan?.antiCheat,
    batasPelanggaran: batasRef.current,
    sesiId: sesiId || "",
    onViolation: handleViolation,
    onMaxViolation: handleMaxViolation,
  });

  // Request fullscreen on load
  useEffect(() => {
    if (!loading && ujian) {
      enterFullscreen();
    }
  }, [loading, ujian]);

  // ── SUBMIT ──
  const handleSubmit = useCallback(
    async (autoSubmit = false, kicked = false) => {
      if (!sesiId) return;
      if (submitting) return;

      setSubmitting(true);
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (autoSaveRef.current) clearInterval(autoSaveRef.current);

      try {
        const res = await fetch("/api/sesi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "submit",
            sesiId,
            jawaban,
          }),
        });
        const data = await res.json();
        if (data.success) {
          // Exit fullscreen
          if (document.fullscreenElement) {
            await document.exitFullscreen().catch(() => {});
          }
          setHasilAkhir(data.data);
          setUjianSelesai(true);
        } else {
          toast.error(data.message || "Gagal submit ujian");
        }
      } catch {
        toast.error("Terjadi kesalahan saat submit");
      } finally {
        setSubmitting(false);
        setShowSubmitConfirm(false);
      }
    },
    [sesiId, jawaban, token, submitting]
  );

  // ── JAWABAN HANDLER ──
  const handleJawaban = useCallback(
    (soalId: string, value: any) => {
      setJawaban((prev) => ({ ...prev, [soalId]: value }));
    },
    []
  );

  // ── RENDER LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[#B0B0C0]">Mempersiapkan ujian...</p>
      </div>
    );
  }

  // ── RENDER SELESAI ──
  if (ujianSelesai && hasilAkhir) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center space-y-5"
        >
          {isKicked ? (
            <>
              <div className="text-6xl">🚫</div>
              <h2 className="text-2xl font-bold text-red-400">
                Kamu Dikeluarkan dari Ujian
              </h2>
              <p className="text-[#B0B0C0] text-sm">
                Kamu telah melanggar aturan ujian sebanyak {violationCount} kali.
                Hubungi guru untuk mendapatkan izin masuk kembali.
              </p>
            </>
          ) : (
            <>
              <div className="text-6xl">🎉</div>
              <h2 className="text-2xl font-bold text-white">Ujian Selesai!</h2>
              <ScoreCircle nilai={hasilAkhir.nilaiAkhir} size="lg" />
              <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Skor</span>
                  <span className="text-white font-bold">
                    {hasilAkhir.totalSkor}/{hasilAkhir.skorMaksimal}
                  </span>
                </div>
                {hasilAkhir.adaEsai && (
                  <Alert
                    type="warning"
                    message="Terdapat soal esai yang perlu dikoreksi guru. Nilai akan diupdate setelah dikoreksi."
                  />
                )}
              </div>
            </>
          )}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => router.push("/dashboard/siswa")}
          >
            Kembali ke Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentSoal = soalList[currentIndex];
  if (!currentSoal) return null;

  const currentJawaban = jawaban[currentSoal._id];
  const answeredCount = soalList.filter(
    (s) => jawaban[s._id] !== undefined && jawaban[s._id] !== null
  ).length;
  const isWarning = sisaWaktu <= 300;
  const isDanger = sisaWaktu <= 60;

  return (
    <div className="exam-fullscreen exam-mode bg-[#0F0F1A] flex flex-col no-select">
      {/* Violation Alert */}
      <AnimatePresence>
        {showViolationAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 z-[10001] max-w-md mx-auto"
          >
            <div className="bg-red-500 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm">{violationMessage}</p>
              </div>
              <button
                onClick={() => setShowViolationAlert(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP BAR */}
      <div className="flex-shrink-0 bg-[#1A1A2E] border-b border-[#2A2A4A] px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex-1">
            <p className="font-bold text-white text-sm truncate">
              {ujian?.nama}
            </p>
            <p className="text-xs text-[#6B7280]">
              {ujian?.mapel} •{" "}
              {answeredCount}/{soalList.length} dijawab
            </p>
          </div>

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl",
            isDanger
              ? "bg-red-500/20 border border-red-500/30"
              : isWarning
              ? "bg-yellow-500/20 border border-yellow-500/30"
              : "bg-[#16213E] border border-[#2A2A4A]"
          )}>
            <Clock className={cn(
              "w-4 h-4",
              isDanger ? "text-red-400" : isWarning ? "text-yellow-400" : "text-[#6B7280]"
            )} />
            <TimerDisplay
              seconds={sisaWaktu}
              isWarning={isWarning}
              isDanger={isDanger}
            />
          </div>

          {/* Violation indicator */}
          {violationCount > 0 && (
            <div className="ml-3 flex items-center gap-1 bg-red-500/20 border border-red-500/30 px-2 py-1 rounded-lg">
              <AlertTriangle className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400 font-bold">
                {violationCount}/{batasRef.current}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Soal number & tipe */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 gradient-purple rounded-lg flex items-center justify-center text-sm font-bold text-white">
              {currentIndex + 1}
            </div>
            <div>
              <p className="text-xs text-[#6B7280]">
                Soal {currentIndex + 1} dari {soalList.length}
              </p>
              <p className="text-xs text-purple-400">
                {labelTipe(currentSoal.tipe)} • {currentSoal.poin || currentSoal.skorMaksimal} poin
              </p>
            </div>
          </div>

          {/* Pertanyaan */}
          <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5 mb-5">
            <p className="text-white leading-relaxed">{currentSoal.pertanyaan}</p>
          </div>

          {/* Jawaban */}
          <div className="mb-6">
            {currentSoal.tipe === "pilihan_ganda" && (
              <PGAnswer
                opsi={currentSoal.opsi || []}
                jawaban={currentJawaban || ""}
                onChange={(v) => handleJawaban(currentSoal._id, v)}
                acak={ujian?.pengaturan?.acakJawaban}
              />
            )}
            {currentSoal.tipe === "pg_kompleks" && (
              <PGKompleksAnswer
                opsi={currentSoal.opsi || []}
                jawaban={currentJawaban || []}
                onChange={(v) => handleJawaban(currentSoal._id, v)}
              />
            )}
            {currentSoal.tipe === "isian_singkat" && (
              <IsianAnswer
                jawaban={currentJawaban || ""}
                onChange={(v) => handleJawaban(currentSoal._id, v)}
              />
            )}
            {currentSoal.tipe === "menjodohkan" && (
              <MenjodohkanAnswer
                pasangan={currentSoal.pasangan || []}
                jawaban={currentJawaban || {}}
                onChange={(v) => handleJawaban(currentSoal._id, v)}
              />
            )}
            {currentSoal.tipe === "esai" && (
              <EsaiAnswer
                jawaban={currentJawaban || ""}
                onChange={(v) => handleJawaban(currentSoal._id, v)}
              />
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM NAV */}
      <div className="flex-shrink-0 bg-[#1A1A2E] border-t border-[#2A2A4A] px-4 py-3">
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Nomor soal grid */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {soalList.map((soal, idx) => {
              const isAnswered = jawaban[soal._id] !== undefined && jawaban[soal._id] !== null;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={soal._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={cn(
                    "q-number",
                    isCurrent
                      ? "q-number-current"
                      : isAnswered
                      ? "q-number-answered"
                      : "q-number-unanswered"
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Prev/Next/Submit */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Prev
            </Button>

            <div className="flex-1 text-center text-xs text-[#6B7280]">
              {answeredCount}/{soalList.length} terjawab
            </div>

            {currentIndex < soalList.length - 1 ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentIndex((p) => Math.min(soalList.length - 1, p + 1))}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="teal"
                size="sm"
                onClick={() => setShowSubmitConfirm(true)}
                icon={<Send className="w-4 h-4" />}
              >
                Selesai
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirm Modal */}
      <Modal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Kumpulkan Jawaban?"
        size="sm"
        closeOnOverlay={false}
      >
        <div className="space-y-4">
          <div className="bg-[#16213E] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Terjawab</span>
              <span className={answeredCount === soalList.length ? "text-green-400" : "text-yellow-400"}>
                {answeredCount}/{soalList.length} soal
              </span>
            </div>
            {answeredCount < soalList.length && (
              <p className="text-yellow-400 text-xs">
                ⚠️ Masih ada {soalList.length - answeredCount} soal yang belum dijawab
              </p>
            )}
          </div>
          <p className="text-sm text-[#B0B0C0]">
            Setelah dikumpulkan, kamu tidak bisa mengubah jawaban lagi.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowSubmitConfirm(false)}
            >
              Kembali
            </Button>
            <Button
              variant="teal"
              fullWidth
              loading={submitting}
              onClick={() => handleSubmit(false)}
            >
              Ya, Kumpulkan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}