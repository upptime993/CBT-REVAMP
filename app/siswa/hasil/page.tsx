"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { SiswaLayout } from "@/components/layout";
import { HasilCard, ScoreChart, MapelChart } from "@/components/dashboard-components";
import { Badge, Tabs, Pagination, Spinner } from "@/components/ui";
import { ScoreCircle, SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import { formatTanggal, labelTipe } from "@/lib/utils";
import toast from "react-hot-toast";

export default function SiswaHasilPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token } = useAuthStore();

  const hasilId = searchParams.get("id");
  const [activeTab, setActiveTab] = useState("riwayat");
  const [hasilList, setHasilList] = useState<any[]>([]);
  const [detailHasil, setDetailHasil] = useState<any | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statistikMapel, setStatistikMapel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHasil = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/hasil?siswaId=${user?.id}&page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setHasilList(data.data.list);
        setTotalPages(data.data.totalPages);
        setChartData(data.data.chartData || []);
        setStatistikMapel(data.data.statistikMapel || []);
      }
    } catch {
      toast.error("Gagal memuat riwayat nilai");
    } finally {
      setLoading(false);
    }
  }, [token, user?.id, page]);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hasil?hasilId=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setDetailHasil(data.data);
      }
    } catch {
      toast.error("Gagal memuat detail hasil");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (hasilId) {
      fetchDetail(hasilId);
    } else {
      fetchHasil();
    }
  }, [hasilId, fetchHasil, fetchDetail]);

  // ── Detail Hasil View ──
  if (hasilId) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      );
    }

    const { hasil, sesi, soalList } = detailHasil || {};

    return (
      <SiswaLayout title="Detail Hasil Ujian" showBack>
        {hasil && (
          <div className="space-y-5">
            {/* Score overview */}
            <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5 text-center">
              <p className="text-[#6B7280] text-sm mb-4">{hasil.ujianNama}</p>
              <ScoreCircle nilai={hasil.nilaiAkhir} size="lg" />
              <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[#2A2A4A]">
                <div>
                  <p className="text-xs text-[#6B7280]">Skor</p>
                  <p className="font-bold text-white">{hasil.totalSkor}/{hasil.skorMaksimal}</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Waktu</p>
                  <p className="font-bold text-white">{hasil.waktuPengerjaan} mnt</p>
                </div>
                <div>
                  <p className="text-xs text-[#6B7280]">Tanggal</p>
                  <p className="font-bold text-white text-xs">{formatTanggal(hasil.tanggalUjian)}</p>
                </div>
              </div>
            </div>

            {/* Detail per tipe */}
            {hasil.detailPerTipe?.length > 0 && (
              <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4">
                <p className="font-semibold text-white mb-3">Rincian per Tipe Soal</p>
                <div className="space-y-2">
                  {hasil.detailPerTipe.map((d: any) => (
                    <div key={d.tipe} className="flex items-center justify-between text-sm">
                      <span className="text-[#B0B0C0]">{labelTipe(d.tipe)}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[#6B7280]">
                          {d.benar}/{d.total} benar
                        </span>
                        <span className="font-bold text-purple-400">
                          {d.skor} poin
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pembahasan jawaban */}
            {sesi && soalList && soalList.length > 0 && (
              <div className="space-y-3">
                <p className="font-semibold text-white">Pembahasan Jawaban</p>
                {sesi.jawaban?.map((j: any, idx: number) => {
                  const soal = soalList.find((s: any) => s._id === j.soalId);
                  if (!soal) return null;
                  const isCorrect = (j.skorOtomatis || j.skorManual || 0) > 0;

                  return (
                    <div
                      key={j.soalId}
                      className={`bg-[#1A1A2E] border rounded-2xl p-4 ${
                        soal.tipe === "esai"
                          ? "border-yellow-500/30"
                          : isCorrect
                          ? "border-green-500/30"
                          : "border-red-500/30"
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-xs text-[#6B7280] mt-0.5">
                          {idx + 1}.
                        </span>
                        <p className="text-sm text-white">{soal.pertanyaan}</p>
                      </div>

                      <div className="ml-4 space-y-1">
                        <p className="text-xs text-[#6B7280]">
                          Jawabanmu:{" "}
                          <span className="text-white">
                            {Array.isArray(j.jawaban)
                              ? j.jawaban.join(", ")
                              : j.jawaban || "Tidak dijawab"}
                          </span>
                        </p>
                        {soal.tipe !== "esai" && (
                          <p className="text-xs text-[#6B7280]">
                            Jawaban benar:{" "}
                            <span className="text-green-400">
                              {Array.isArray(soal.kunciJawaban)
                                ? soal.kunciJawaban.join(", ")
                                : soal.kunciJawaban ||
                                  soal.jawabanDiterima?.join(" / ")}
                            </span>
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {soal.tipe === "esai" ? (
                            <Badge variant="warning">
                              {j.sudahDikoreksi
                                ? `Nilai: ${j.skorManual}`
                                : "Menunggu koreksi"}
                            </Badge>
                          ) : (
                            <Badge variant={isCorrect ? "success" : "danger"}>
                              {isCorrect ? "✓ Benar" : "✗ Salah"} •{" "}
                              {j.skorOtomatis || 0} poin
                            </Badge>
                          )}
                          {j.catatanGuru && (
                            <p className="text-xs text-[#6B7280] italic">
                              "{j.catatanGuru}"
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </SiswaLayout>
    );
  }

  // ── List Hasil View ──
  const tabs = [
    { id: "riwayat", label: "Riwayat Nilai" },
    { id: "statistik", label: "Statistik" },
  ];

  return (
    <SiswaLayout title="Hasil & Statistik" showBack>
      <div className="space-y-5">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {activeTab === "riwayat" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
              </div>
            ) : hasilList.length === 0 ? (
              <div className="text-center py-16 text-[#6B7280]">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Belum ada riwayat ujian</p>
              </div>
            ) : (
              <>
                {hasilList.map((hasil) => (
                  <HasilCard
                    key={hasil._id}
                    hasil={hasil}
                    onClick={() => router.push(`/siswa/hasil?id=${hasil._id}`)}
                  />
                ))}
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </>
            )}
          </motion.div>
        )}

        {activeTab === "statistik" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            {chartData.length > 0 ? (
              <>
                <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4">
                  <SectionHeader title="Grafik Nilai" subtitle="Perkembangan nilai dari waktu ke waktu" className="mb-4" />
                  <ScoreChart data={chartData} />
                </div>
                {statistikMapel.length > 0 && (
                  <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4">
                    <SectionHeader title="Per Mata Pelajaran" className="mb-4" />
                    <MapelChart data={statistikMapel} />
                    <div className="mt-4 space-y-2">
                      {statistikMapel.map((m) => (
                        <div key={m.mapel} className="flex items-center justify-between">
                          <span className="text-sm text-[#B0B0C0]">{m.mapel}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#6B7280]">{m.jumlahUjian}x</span>
                            <span className={`font-bold text-sm ${m.rataRata >= 75 ? "text-green-400" : m.rataRata >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {m.rataRata}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-[#6B7280]">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Belum ada data statistik</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </SiswaLayout>
  );
}