"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SiswaLayout } from "@/components/layout";
import {
  WelcomeCard,
  ScoreChart,
  MapelChart,
  UjianAvailableCard,
  HasilCard,
} from "@/components/dashboard-components";
import { StatCard, Tabs, Spinner } from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import { useAuth } from "@/hooks";
import {
  BookOpen,
  CheckCircle,
  TrendingUp,
  Trophy,
  FileText,
} from "lucide-react";

export default function DashboardSiswaPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { requireRole } = useAuth();

  const [ujianList, setUjianList] = useState<any[]>([]);
  const [hasilList, setHasilList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statistikMapel, setStatistikMapel] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUjian: 0,
    selesai: 0,
    rataRata: 0,
    tertinggi: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    requireRole(["siswa"]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [ujianRes, hasilRes] = await Promise.all([
        fetch("/api/ujian", { headers }),
        fetch(`/api/hasil?siswaId=${user?.id}&limit=5`, { headers }),
      ]);

      const [ujianData, hasilData] = await Promise.all([
        ujianRes.json(),
        hasilRes.json(),
      ]);

      setUjianList(ujianData.data?.list || []);

      if (hasilData.success) {
        setHasilList(hasilData.data?.list || []);
        setChartData(hasilData.data?.chartData || []);
        setStatistikMapel(hasilData.data?.statistikMapel || []);
        setStats({
          totalUjian: hasilData.data?.total || 0,
          selesai: hasilData.data?.total || 0,
          rataRata: hasilData.data?.rataRataTotal || 0,
          tertinggi: hasilData.data?.nilaiTertinggi || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: "home", label: "Beranda", icon: <BookOpen className="w-4 h-4" /> },
    { id: "statistik", label: "Statistik", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] pb-28">
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* Welcome Card */}
        <WelcomeCard
          nama={user?.nama || ""}
          kelas={user?.kelas || ""}
          nisn={user?.nisn || ""}
          totalUjianSelesai={stats.selesai}
          rataRata={stats.rataRata}
        />

        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard
              title="Ujian Tersedia"
              value={ujianList.filter((u) => !u.sudahMengerjakan).length}
              subtitle="Siap dikerjakan"
              icon={<FileText className="w-5 h-5" />}
              gradient="teal"
              onClick={() => router.push("/siswa/ujian")}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <StatCard
              title="Ujian Selesai"
              value={stats.selesai}
              subtitle="Total dikerjakan"
              icon={<CheckCircle className="w-5 h-5" />}
              gradient="purple"
              onClick={() => router.push("/siswa/hasil")}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard
              title="Rata-rata Nilai"
              value={stats.rataRata || "-"}
              subtitle="Semua mapel"
              icon={<TrendingUp className="w-5 h-5" />}
              gradient="cyan"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <StatCard
              title="Nilai Tertinggi"
              value={stats.tertinggi || "-"}
              subtitle="Best score"
              icon={<Trophy className="w-5 h-5" />}
              gradient="orange"
            />
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* HOME Tab */}
        {activeTab === "home" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {/* Ujian tersedia */}
            <div>
              <SectionHeader
                title="Ujian Tersedia"
                subtitle="Ujian yang bisa dikerjakan sekarang"
                action={
                  <button
                    onClick={() => router.push("/siswa/ujian")}
                    className="text-xs text-purple-400 hover:text-purple-300"
                  >
                    Lihat Semua
                  </button>
                }
                className="mb-3"
              />
              {ujianList.length === 0 ? (
                <div className="text-center py-8 text-[#6B7280]">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Tidak ada ujian tersedia saat ini</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ujianList.slice(0, 3).map((ujian) => (
                    <UjianAvailableCard
                      key={ujian._id}
                      ujian={ujian}
                      onKerjakan={(id) =>
                        router.push(`/siswa/ujian?id=${id}`)
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Nilai terbaru */}
            {hasilList.length > 0 && (
              <div>
                <SectionHeader
                  title="Nilai Terbaru"
                  action={
                    <button
                      onClick={() => router.push("/siswa/hasil")}
                      className="text-xs text-purple-400 hover:text-purple-300"
                    >
                      Lihat Semua
                    </button>
                  }
                  className="mb-3"
                />
                <div className="space-y-3">
                  {hasilList.slice(0, 3).map((hasil) => (
                    <HasilCard
                      key={hasil._id}
                      hasil={hasil}
                      onClick={() =>
                        router.push(`/siswa/hasil?id=${hasil._id}`)
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STATISTIK Tab */}
        {activeTab === "statistik" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-5"
          >
            {chartData.length > 0 ? (
              <>
                <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4">
                  <SectionHeader
                    title="Grafik Nilai"
                    subtitle="10 ujian terakhir"
                    className="mb-4"
                  />
                  <ScoreChart data={chartData} />
                </div>

                {statistikMapel.length > 0 && (
                  <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4">
                    <SectionHeader
                      title="Rata-rata per Mapel"
                      className="mb-4"
                    />
                    <MapelChart data={statistikMapel} />
                    <div className="mt-4 space-y-2">
                      {statistikMapel.map((m) => (
                        <div
                          key={m.mapel}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-[#B0B0C0]">{m.mapel}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#6B7280]">
                              {m.jumlahUjian}x ujian
                            </span>
                            <span
                              className={`font-bold ${
                                m.rataRata >= 75
                                  ? "text-green-400"
                                  : m.rataRata >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
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
                <p className="text-xs mt-1">
                  Selesaikan ujian pertama kamu!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Bottom Nav */}
      <div className="bottom-nav">
        <div className="flex items-center justify-around">
          {[
            { href: "/dashboard/siswa", label: "Beranda", icon: "🏠" },
            { href: "/siswa/hasil", label: "Statistik", icon: "📊" },
            { href: "/siswa/ujian", label: "Ujian", icon: "📝" },
            { href: "/siswa/profil", label: "Profil", icon: "👤" },
          ].map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center gap-1 py-2 px-4 text-xs"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[#6B7280]">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}