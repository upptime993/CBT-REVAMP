"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit,
  Filter,
  BookOpen,
  Eye,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import {
  Button,
  Badge,
  SearchBar,
  Select,
  ConfirmModal,
  Pagination,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import {
  cn,
  labelTipe,
  warnaTipe,
  formatTanggal,
} from "@/lib/utils";
import type { TipeSoal } from "@/lib/mongodb";
import toast from "react-hot-toast";

const TIPE_FILTER = [
  { value: "", label: "Semua Tipe" },
  { value: "pilihan_ganda", label: "Pilihan Ganda" },
  { value: "pg_kompleks", label: "PG Kompleks" },
  { value: "isian_singkat", label: "Isian Singkat" },
  { value: "menjodohkan", label: "Menjodohkan" },
  { value: "esai", label: "Esai" },
];

const KESULITAN_FILTER = [
  { value: "", label: "Semua Kesulitan" },
  { value: "mudah", label: "🟢 Mudah" },
  { value: "sedang", label: "🟡 Sedang" },
  { value: "sulit", label: "🔴 Sulit" },
];

export default function BankSoalPage() {
  const router = useRouter();
  const { token } = useAuthStore();

  const [soalList, setSoalList] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any[]>([]);

  const [search, setSearch] = useState("");
  const [tipeFilter, setTipeFilter] = useState("");
  const [kesulitanFilter, setKesulitanFilter] = useState("");
  const [page, setPage] = useState(1);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [previewSoal, setPreviewSoal] = useState<any | null>(null);

  const fetchSoal = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "15",
        ...(search && { search }),
        ...(tipeFilter && { tipe: tipeFilter }),
        ...(kesulitanFilter && { kesulitan: kesulitanFilter }),
      });

      const res = await fetch(`/api/soal?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setSoalList(data.data.list);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
        setStats(data.data.stats || []);
      }
    } catch {
      toast.error("Gagal memuat bank soal");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, tipeFilter, kesulitanFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchSoal, 300);
    return () => clearTimeout(timer);
  }, [fetchSoal]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, tipeFilter, kesulitanFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/soal?id=${deleteId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Soal berhasil dihapus");
        fetchSoal();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menghapus soal");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // Stats per tipe
  const getStatCount = (tipe: string) => {
    const found = stats.find((s: any) => s._id === tipe);
    return found?.count || 0;
  };

  return (
    <DashboardLayout
      title="Bank Soal"
      subtitle={`${total} soal tersedia`}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/guru/soal/buat")}
          icon={<Plus className="w-4 h-4" />}
        >
          Buat Soal
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Statistik per tipe */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { tipe: "pilihan_ganda", short: "PG" },
            { tipe: "pg_kompleks", short: "PGK" },
            { tipe: "isian_singkat", short: "Isian" },
            { tipe: "menjodohkan", short: "Jodoh" },
            { tipe: "esai", short: "Esai" },
          ].map((item) => (
            <button
              key={item.tipe}
              onClick={() =>
                setTipeFilter(
                  tipeFilter === item.tipe ? "" : item.tipe
                )
              }
              className={cn(
                "p-3 rounded-xl border text-center transition-all",
                tipeFilter === item.tipe
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-[#2A2A4A] bg-[#1A1A2E] hover:border-[#3A3A5A]"
              )}
            >
              <p className="text-lg font-bold text-white">
                {loading ? "-" : getStatCount(item.tipe)}
              </p>
              <p className="text-xs text-[#6B7280]">{item.short}</p>
            </button>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Cari pertanyaan atau mapel..."
            className="flex-1"
          />
          <Button
            variant={showFilter ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
            icon={<Filter className="w-4 h-4" />}
          >
            Filter
          </Button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl">
                <Select
                  label="Tipe Soal"
                  options={TIPE_FILTER}
                  value={tipeFilter}
                  onChange={setTipeFilter}
                />
                <Select
                  label="Kesulitan"
                  options={KESULITAN_FILTER}
                  value={kesulitanFilter}
                  onChange={setKesulitanFilter}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Soal List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-24 rounded-2xl" />
            ))}
          </div>
        ) : soalList.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-16 h-16" />}
            title="Bank soal masih kosong"
            description={
              search || tipeFilter || kesulitanFilter
                ? "Tidak ada soal yang sesuai filter. Coba ubah filter pencarian."
                : "Mulai buat soal pertama kamu!"
            }
            action={
              !search && !tipeFilter && (
                <Button
                  variant="primary"
                  onClick={() => router.push("/guru/soal/buat")}
                  icon={<Plus className="w-4 h-4" />}
                >
                  Buat Soal Pertama
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {soalList.map((soal, i) => (
                <motion.div
                  key={soal._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4 hover:border-[#3A3A5A] transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {/* Nomor */}
                    <div className="w-8 h-8 bg-[#16213E] rounded-lg flex items-center justify-center text-xs text-[#6B7280] font-mono flex-shrink-0 mt-0.5">
                      {(page - 1) * 15 + i + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={cn("text-[10px]", warnaTipe(soal.tipe))}>
                          {labelTipe(soal.tipe)}
                        </Badge>
                        <Badge variant="default" className="text-[10px]">
                          {soal.mapel}
                        </Badge>
                        <Badge
                          variant={
                            soal.tingkatKesulitan === "mudah"
                              ? "success"
                              : soal.tingkatKesulitan === "sedang"
                              ? "warning"
                              : "danger"
                          }
                          className="text-[10px]"
                        >
                          {soal.tingkatKesulitan}
                        </Badge>
                        <span className="text-xs text-[#6B7280]">
                          {soal.poin} poin
                        </span>
                      </div>

                      {/* Pertanyaan */}
                      <p className="text-sm text-white line-clamp-2 group-hover:text-purple-300 transition-colors">
                        {soal.pertanyaan}
                      </p>

                      <p className="text-xs text-[#4A4A6A] mt-1.5">
                        {soal.pembuatNama} •{" "}
                        {formatTanggal(soal.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => setPreviewSoal(soal)}
                        className="p-2 rounded-lg hover:bg-[#16213E] text-[#6B7280] hover:text-cyan-400 transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/guru/soal/buat?edit=${soal._id}`)
                        }
                        className="p-2 rounded-lg hover:bg-[#16213E] text-[#6B7280] hover:text-purple-400 transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteId(soal._id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-[#6B7280] hover:text-red-400 transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Pagination */}
            <div className="pt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={setPage}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Soal"
        message="Apakah kamu yakin ingin menghapus soal ini? Tindakan ini tidak bisa dibatalkan."
        confirmText="Ya, Hapus"
        loading={deleteLoading}
      />

      {/* Preview Modal */}
      {previewSoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setPreviewSoal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge className={warnaTipe(previewSoal.tipe)}>
                  {labelTipe(previewSoal.tipe)}
                </Badge>
                <Badge variant="default">{previewSoal.mapel}</Badge>
              </div>
              <button
                onClick={() => setPreviewSoal(null)}
                className="text-[#6B7280] hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-white font-medium mb-4">
              {previewSoal.pertanyaan}
            </p>

            {/* Jawaban preview */}
            {previewSoal.opsi && (
              <div className="space-y-2">
                {previewSoal.opsi.map((o: any) => {
                  const isCorrect = Array.isArray(previewSoal.kunciJawaban)
                    ? previewSoal.kunciJawaban.includes(o.id)
                    : previewSoal.kunciJawaban === o.id;
                  return (
                    <div
                      key={o.id}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg text-sm",
                        isCorrect
                          ? "bg-green-500/15 border border-green-500/30 text-green-300"
                          : "bg-[#16213E] text-[#B0B0C0]"
                      )}
                    >
                      <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold bg-[#2A2A4A]">
                        {o.id}
                      </span>
                      {o.teks}
                      {isCorrect && (
                        <span className="ml-auto text-green-400 text-xs">
                          ✓ Benar
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {previewSoal.jawabanDiterima && (
              <div>
                <p className="text-xs text-[#6B7280] mb-2">
                  Jawaban diterima:
                </p>
                <div className="flex flex-wrap gap-2">
                  {previewSoal.jawabanDiterima.map((j: string) => (
                    <span
                      key={j}
                      className="bg-teal-500/20 text-teal-400 text-xs px-2 py-1 rounded-full"
                    >
                      {j}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {previewSoal.pasangan && (
              <div className="space-y-1.5">
                {previewSoal.pasangan.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 text-sm text-[#B0B0C0]"
                  >
                    <span className="flex-1 bg-[#16213E] px-3 py-1.5 rounded-lg">
                      {p.kiri}
                    </span>
                    <span>→</span>
                    <span className="flex-1 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg text-green-400">
                      {p.kanan}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {previewSoal.rubrik && (
              <div className="bg-[#16213E] rounded-lg p-3 mt-3">
                <p className="text-xs text-[#6B7280] mb-1">Rubrik:</p>
                <p className="text-sm text-[#B0B0C0] whitespace-pre-line">
                  {previewSoal.rubrik}
                </p>
                <p className="text-xs text-orange-400 mt-2">
                  Skor maks: {previewSoal.skorMaksimal}
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}