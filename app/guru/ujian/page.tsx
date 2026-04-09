"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ClipboardList,
  Settings,
  Play,
  Square,
  Copy,
  Trash2,
  Eye,
  Key,
  ChevronRight,
  Calendar,
  Clock,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import {
  Button,
  Badge,
  Modal,
  ConfirmModal,
  Input,
  Select,
  Toggle,
  EmptyState,
  Alert,
} from "@/components/ui";
import { SectionHeader, CopyButton } from "@/components/shared";
import { useAuthStore } from "@/store";
import {
  cn,
  statusUjianConfig,
  formatTanggal,
  formatWaktu,
} from "@/lib/utils";
import toast from "react-hot-toast";

// ── Buat Ujian Modal ──
interface BuatUjianModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function BuatUjianModal({ open, onClose, onSuccess }: BuatUjianModalProps) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    nama: "",
    mapel: "",
    deskripsi: "",
    durasi: 60,
    tanggalMulai: "",
    tanggalSelesai: "",
    acakSoal: false,
    acakJawaban: false,
    tampilkanHasil: true,
    bataspelanggaran: 3,
    antiCheat: true,
  });

  const [soalList, setSoalList] = useState<any[]>([]);
  const [selectedSoal, setSelectedSoal] = useState<string[]>([]);
  const [soalLoading, setSoalLoading] = useState(false);
  const [soalSearch, setSoalSearch] = useState("");

  const MAPEL_OPTIONS = [
    "Matematika", "Bahasa Indonesia", "Bahasa Inggris",
    "IPA Biologi", "IPA Fisika", "IPA Kimia",
    "IPS Sejarah", "IPS Geografi", "PKn", "Lainnya",
  ].map((m) => ({ value: m, label: m }));

  const fetchSoal = useCallback(async () => {
    setSoalLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(soalSearch && { search: soalSearch }),
        ...(form.mapel && { mapel: form.mapel }),
      });
      const res = await fetch(`/api/soal?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSoalList(data.data?.list || []);
    } catch {}
    finally { setSoalLoading(false); }
  }, [token, soalSearch, form.mapel]);

  useEffect(() => {
    if (step === 2) fetchSoal();
  }, [step, fetchSoal]);

  const toggleSoal = (id: string) => {
    setSelectedSoal((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ujian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nama: form.nama,
          mapel: form.mapel,
          deskripsi: form.deskripsi,
          soalIds: selectedSoal,
          durasi: form.durasi,
          tanggalMulai: form.tanggalMulai,
          tanggalSelesai: form.tanggalSelesai,
          pengaturan: {
            acakSoal: form.acakSoal,
            acakJawaban: form.acakJawaban,
            tampilkanHasil: form.tampilkanHasil,
            bataspelanggaran: form.bataspelanggaran,
            antiCheat: form.antiCheat,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ujian berhasil dibuat! 🎉");
        onSuccess();
        onClose();
        resetForm();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal membuat ujian");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedSoal([]);
    setForm({
      nama: "", mapel: "", deskripsi: "",
      durasi: 60, tanggalMulai: "", tanggalSelesai: "",
      acakSoal: false, acakJawaban: false,
      tampilkanHasil: true, bataspelanggaran: 3, antiCheat: true,
    });
  };

  const validateStep1 = () => {
    if (!form.nama.trim()) { toast.error("Nama ujian wajib diisi"); return false; }
    if (!form.mapel) { toast.error("Mata pelajaran wajib dipilih"); return false; }
    if (!form.tanggalMulai || !form.tanggalSelesai) {
      toast.error("Tanggal mulai dan selesai wajib diisi"); return false;
    }
    if (form.durasi < 5) { toast.error("Durasi minimal 5 menit"); return false; }
    return true;
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); resetForm(); }}
      title={step === 1 ? "Informasi Ujian" : step === 2 ? "Pilih Soal" : "Pengaturan"}
      size="lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-5">
        {["Info", "Soal", "Setting"].map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              step > i + 1 ? "text-purple-400" : step === i + 1 ? "text-white" : "text-[#6B7280]"
            )}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                step > i + 1 ? "bg-purple-500 text-white"
                  : step === i + 1 ? "border-2 border-purple-500 text-purple-400"
                  : "bg-[#2A2A4A] text-[#6B7280]"
              )}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              {s}
            </div>
            {i < 2 && <div className={cn("flex-1 h-px", step > i + 1 ? "bg-purple-500" : "bg-[#2A2A4A]")} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Nama Ujian"
            value={form.nama}
            onChange={(e) => setForm({ ...form, nama: e.target.value })}
            placeholder="Contoh: UTS Matematika Kelas X"
            required
          />
          <Select
            label="Mata Pelajaran"
            options={MAPEL_OPTIONS}
            value={form.mapel}
            onChange={(v) => setForm({ ...form, mapel: v })}
            required
          />
          <Input
            label="Deskripsi / Instruksi (opsional)"
            value={form.deskripsi}
            onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
            placeholder="Instruksi untuk siswa..."
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Tanggal Mulai *</label>
              <input
                type="datetime-local"
                value={form.tanggalMulai}
                onChange={(e) => setForm({ ...form, tanggalMulai: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Selesai *</label>
              <input
                type="datetime-local"
                value={form.tanggalSelesai}
                onChange={(e) => setForm({ ...form, tanggalSelesai: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <Input
            label="Durasi (menit)"
            type="number"
            value={form.durasi}
            onChange={(e) => setForm({ ...form, durasi: Number(e.target.value) })}
            min={5}
            max={300}
          />
          <Button
            variant="primary"
            fullWidth
            onClick={() => { if (validateStep1()) setStep(2); }}
          >
            Lanjut Pilih Soal →
          </Button>
        </div>
      )}

      {/* Step 2: Pilih Soal */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#B0B0C0]">
              Dipilih:{" "}
              <span className="text-purple-400 font-bold">
                {selectedSoal.length} soal
              </span>
            </p>
            <input
              type="text"
              placeholder="Cari soal..."
              value={soalSearch}
              onChange={(e) => setSoalSearch(e.target.value)}
              className="input text-xs py-1.5 w-40"
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
            {soalLoading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
              </div>
            ) : soalList.length === 0 ? (
              <p className="text-center text-[#6B7280] text-sm py-8">
                Tidak ada soal ditemukan. Buat soal dulu di Bank Soal.
              </p>
            ) : (
              soalList.map((soal) => {
                const isSelected = selectedSoal.includes(soal._id);
                return (
                  <button
                    key={soal._id}
                    onClick={() => toggleSoal(soal._id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all",
                      isSelected
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-[#2A2A4A] bg-[#16213E] hover:border-[#3A3A5A]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                        isSelected ? "bg-purple-500 border-purple-500" : "border-[#4A4A6A]"
                      )}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white line-clamp-1">
                          {soal.pertanyaan}
                        </p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">
                          {soal.tipe} • {soal.mapel} • {soal.poin} poin
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {selectedSoal.length === 0 && (
            <Alert type="warning" message="Pilih minimal 1 soal untuk ujian" />
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(1)}>← Kembali</Button>
            <Button
              variant="primary"
              fullWidth
              disabled={selectedSoal.length === 0}
              onClick={() => setStep(3)}
            >
              Lanjut Setting →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Setting */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-3 p-4 bg-[#16213E] rounded-xl">
            <Toggle
              checked={form.acakSoal}
              onChange={(v) => setForm({ ...form, acakSoal: v })}
              label="Acak urutan soal"
            />
            <Toggle
              checked={form.acakJawaban}
              onChange={(v) => setForm({ ...form, acakJawaban: v })}
              label="Acak urutan jawaban"
            />
            <Toggle
              checked={form.tampilkanHasil}
              onChange={(v) => setForm({ ...form, tampilkanHasil: v })}
              label="Tampilkan hasil langsung setelah ujian"
            />
            <Toggle
              checked={form.antiCheat}
              onChange={(v) => setForm({ ...form, antiCheat: v })}
              label="Aktifkan mode anti-cheat"
            />
          </div>

          <Select
            label="Batas Pelanggaran Sebelum Dikeluarkan"
            options={[
              { value: "1", label: "1x Pelanggaran" },
              { value: "2", label: "2x Pelanggaran" },
              { value: "3", label: "3x Pelanggaran (default)" },
              { value: "5", label: "5x Pelanggaran" },
            ]}
            value={String(form.bataspelanggaran)}
            onChange={(v) => setForm({ ...form, bataspelanggaran: Number(v) })}
          />

          {/* Summary */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-purple-400">Ringkasan Ujian</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#B0B0C0]">
              <span>📚 {form.nama}</span>
              <span>📖 {form.mapel}</span>
              <span>⏱ {form.durasi} menit</span>
              <span>📝 {selectedSoal.length} soal</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setStep(2)}>← Kembali</Button>
            <Button
              variant="teal"
              fullWidth
              loading={loading}
              onClick={handleSubmit}
            >
              ✅ Buat Ujian (Draft)
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Main Page ──
export default function UjianPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const [ujianList, setUjianList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showBuatModal, setShowBuatModal] = useState(
    searchParams.get("action") === "buat"
  );
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [tokenModal, setTokenModal] = useState<{
    open: boolean; ujianId: string; nama: string; token?: string;
  }>({ open: false, ujianId: "", nama: "" });
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tutupLoading, setTutupLoading] = useState<string | null>(null);

  const fetchUjian = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "20",
        ...(statusFilter && { status: statusFilter }),
      });
      const res = await fetch(`/api/ujian?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUjianList(data.data.list);
        setTotal(data.data.total);
      }
    } catch {
      toast.error("Gagal memuat daftar ujian");
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter]);

  useEffect(() => { fetchUjian(); }, [fetchUjian]);

  const handleBukaUjian = async (ujianId: string, nama: string) => {
    setTokenLoading(true);
    try {
      const res = await fetch("/api/ujian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "buka", ujianId }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenModal({ open: true, ujianId, nama, token: data.data.token });
        toast.success("Ujian dibuka! Bagikan token ke siswa.");
        fetchUjian();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal membuka ujian");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleTutupUjian = async (ujianId: string) => {
    setTutupLoading(ujianId);
    try {
      const res = await fetch("/api/ujian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "tutup", ujianId }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ujian berhasil ditutup");
        fetchUjian();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menutup ujian");
    } finally {
      setTutupLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/ujian?id=${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ujian berhasil dihapus");
        fetchUjian();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menghapus ujian");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const STATUS_FILTER = [
    { value: "", label: "Semua Status" },
    { value: "draft", label: "Draft" },
    { value: "aktif", label: "Aktif" },
    { value: "selesai", label: "Selesai" },
  ];

  return (
    <DashboardLayout
      title="Manajemen Ujian"
      subtitle={`${total} ujian dibuat`}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowBuatModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Buat Ujian
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Filter */}
        <div className="flex gap-3">
          <Select
            options={STATUS_FILTER}
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="Filter status..."
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-36 rounded-2xl" />
            ))}
          </div>
        ) : ujianList.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-16 h-16" />}
            title="Belum ada ujian"
            description="Buat ujian pertama kamu sekarang!"
            action={
              <Button
                variant="primary"
                onClick={() => setShowBuatModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Buat Ujian Pertama
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {ujianList.map((ujian, i) => {
                const statusCfg = statusUjianConfig(ujian.status);
                const isAktif = ujian.status === "aktif";
                const isDraft = ujian.status === "draft";

                return (
                  <motion.div
                    key={ujian._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5 hover:border-[#3A3A5A] transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Badge
                            variant={
                              isAktif ? "success"
                                : ujian.status === "selesai" ? "info"
                                : "default"
                            }
                            dot
                          >
                            {statusCfg.label}
                          </Badge>
                          <span className="text-xs text-[#6B7280]">
                            {ujian.mapel}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white">{ujian.nama}</h3>
                        {ujian.deskripsi && (
                          <p className="text-xs text-[#6B7280] mt-1 line-clamp-1">
                            {ujian.deskripsi}
                          </p>
                        )}
                      </div>

                      {/* Token badge jika aktif */}
                      {isAktif && ujian.token && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-3 py-1.5">
                          <Key className="w-3.5 h-3.5 text-green-400" />
                          <span className="font-mono font-bold text-green-400 text-sm tracking-widest">
                            {ujian.token}
                          </span>
                          <CopyButton text={ujian.token} label="" />
                        </div>
                      )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        {
                          icon: <Calendar className="w-3.5 h-3.5" />,
                          label: "Mulai",
                          value: formatTanggal(ujian.tanggalMulai),
                        },
                        {
                          icon: <Clock className="w-3.5 h-3.5" />,
                          label: "Durasi",
                          value: `${ujian.durasi} menit`,
                        },
                        {
                          icon: <ClipboardList className="w-3.5 h-3.5" />,
                          label: "Jumlah Soal",
                          value: `${ujian.soalIds?.length || 0} soal`,
                        },
                        {
                          icon: <Users className="w-3.5 h-3.5" />,
                          label: "Peserta",
                          value: `${ujian.sudahUjian || 0}/${
                            (ujian.sudahUjian || 0) + (ujian.belumUjian || 0)
                          }`,
                        },
                      ].map((info) => (
                        <div
                          key={info.label}
                          className="bg-[#16213E] rounded-xl p-2.5"
                        >
                          <div className="flex items-center gap-1.5 text-[#6B7280] mb-1">
                            {info.icon}
                            <span className="text-[10px] uppercase tracking-wider">
                              {info.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-white">
                            {info.value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#2A2A4A]">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => router.push(`/guru/ujian/${ujian._id}`)}
                        icon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Detail & Hasil
                      </Button>

                      {isDraft && (
                        <Button
                          size="sm"
                          variant="teal"
                          loading={tokenLoading}
                          onClick={() => handleBukaUjian(ujian._id, ujian.nama)}
                          icon={<Play className="w-3.5 h-3.5" />}
                        >
                          Buka Ujian
                        </Button>
                      )}

                      {isAktif && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setTokenModal({
                                open: true,
                                ujianId: ujian._id,
                                nama: ujian.nama,
                                token: ujian.token,
                              })
                            }
                            icon={<Key className="w-3.5 h-3.5" />}
                          >
                            Token
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            loading={tutupLoading === ujian._id}
                            onClick={() => handleTutupUjian(ujian._id)}
                            icon={<Square className="w-3.5 h-3.5" />}
                          >
                            Tutup Ujian
                          </Button>
                        </>
                      )}

                      {isDraft && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteId(ujian._id)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          className="text-red-400 hover:text-red-300 ml-auto"
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <BuatUjianModal
        open={showBuatModal}
        onClose={() => setShowBuatModal(false)}
        onSuccess={fetchUjian}
      />

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Ujian"
        message="Hapus ujian ini beserta semua data sesi dan hasil ujian? Tindakan tidak bisa dibatalkan."
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />

      {/* Token Modal */}
      <Modal
        open={tokenModal.open}
        onClose={() => setTokenModal({ open: false, ujianId: "", nama: "" })}
        title="Token Ujian"
        size="sm"
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-[#B0B0C0]">{tokenModal.nama}</p>
          <div className="bg-[#16213E] border border-green-500/30 rounded-2xl p-6">
            <p className="text-xs text-[#6B7280] mb-2">TOKEN UJIAN</p>
            <p className="text-4xl font-bold font-mono text-green-400 tracking-widest">
              {tokenModal.token}
            </p>
          </div>
          <CopyButton text={tokenModal.token || ""} label="Salin Token" />
          <Alert
            type="info"
            message="Bagikan token ini kepada siswa. Token akan otomatis expired setelah ujian ditutup."
          />
        </div>
      </Modal>
    </DashboardLayout>
  );
}