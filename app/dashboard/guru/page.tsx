"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RefreshCw,
  Plus,
  Eye,
  Activity,
} from "lucide-react";
import {
  DashboardLayout,
} from "@/components/layout";
import {
  GuruStatGrid,
  QuickActions,
  RecentUjianList,
  LiveMonitoring,
} from "@/components/dashboard-components";
import { Button, Tabs, Skeleton } from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import { useAuth } from "@/hooks";

interface DashboardData {
  totalSiswa: number;
  totalSoal: number;
  totalUjian: number;
  sudahUjian: number;
  belumUjian: number;
  belumKoreksi: number;
  recentUjian: any[];
  ujianAktif: any[];
}

export default function DashboardGuruPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { requireRole } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [monitoringUjianId, setMonitoringUjianId] = useState<string | null>(null);
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  useEffect(() => {
    requireRole(["guru", "admin", "superadmin"]);
  }, []);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [siswaRes, soalRes, ujianRes, koreksiRes] = await Promise.all([
        fetch("/api/manajemen?tipe=siswa&limit=1", { headers }),
        fetch("/api/soal?limit=1", { headers }),
        fetch("/api/ujian?limit=5", { headers }),
        fetch("/api/hasil", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ tipe: "belum_koreksi" }),
        }),
      ]);

      const [siswaData, soalData, ujianData, koreksiData] = await Promise.all([
        siswaRes.json(),
        soalRes.json(),
        ujianRes.json(),
        koreksiRes.json(),
      ]);

      // Hitung sudah/belum ujian dari semua ujian
      const ujianList = ujianData.data?.list || [];
      const totalSudah = ujianList.reduce(
        (acc: number, u: any) => acc + (u.sudahUjian || 0),
        0
      );
      const totalBelum = ujianList.reduce(
        (acc: number, u: any) => acc + (u.belumUjian || 0),
        0
      );

      // Ujian aktif
      const ujianAktif = ujianList.filter((u: any) => u.status === "aktif");

      setData({
        totalSiswa: siswaData.data?.total || 0,
        totalSoal: soalData.data?.total || 0,
        totalUjian: ujianData.data?.total || 0,
        sudahUjian: totalSudah,
        belumUjian: totalBelum,
        belumKoreksi: koreksiData.data?.total || 0,
        recentUjian: ujianList,
        ujianAktif,
      });

      // Auto-pilih ujian aktif pertama untuk monitoring
      if (ujianAktif.length > 0 && !monitoringUjianId) {
        setMonitoringUjianId(ujianAktif[0]._id);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch monitoring sesi
  const fetchMonitoring = useCallback(async () => {
    if (!monitoringUjianId) return;
    setMonitoringLoading(true);
    try {
      const res = await fetch(
        `/api/sesi?ujianId=${monitoringUjianId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setSesiList(data.data?.list || []);
    } catch {}
    finally { setMonitoringLoading(false); }
  }, [monitoringUjianId, token]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Polling monitoring setiap 5 detik
  useEffect(() => {
    if (activeTab !== "monitoring") return;
    fetchMonitoring();
    const interval = setInterval(fetchMonitoring, 5000);
    return () => clearInterval(interval);
  }, [activeTab, fetchMonitoring]);

  const handleIzinkan = async (sesiId: string) => {
    try {
      const res = await fetch("/api/sesi", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: "izinkan_kembali", sesiId }),
      });
      if (res.ok) {
        fetchMonitoring();
      }
    } catch {}
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "ujian", label: "Ujian", count: data?.recentUjian.length },
    {
      id: "monitoring",
      label: "Live Monitor",
      count: data?.ujianAktif.length,
    },
  ];

  return (
    <DashboardLayout
      showGreeting
      subtitle={`${new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`}
      belumKoreksi={data?.belumKoreksi}
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={fetchDashboard}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* STAT GRID */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <GuruStatGrid
            totalSiswa={data?.totalSiswa || 0}
            totalSoal={data?.totalSoal || 0}
            ujian={{
              sudah: data?.sudahUjian || 0,
              belum: data?.belumUjian || 0,
              total: (data?.sudahUjian || 0) + (data?.belumUjian || 0),
            }}
            belumKoreksi={data?.belumKoreksi || 0}
          />
        )}

        {/* QUICK ACTIONS */}
        <QuickActions />

        {/* TABS */}
        <div className="space-y-4">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <SectionHeader
                title="Ujian Terbaru"
                action={
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => router.push("/guru/ujian")}
                    icon={<Eye className="w-4 h-4" />}
                  >
                    Lihat Semua
                  </Button>
                }
              />
              <RecentUjianList
                ujianList={data?.recentUjian || []}
                loading={loading}
                onDetail={(id) => router.push(`/guru/ujian/${id}`)}
              />
            </motion.div>
          )}

          {/* Ujian Tab */}
          {activeTab === "ujian" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <SectionHeader
                title="Semua Ujian"
                action={
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => router.push("/guru/ujian")}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Buat Ujian
                  </Button>
                }
              />
              <RecentUjianList
                ujianList={data?.recentUjian || []}
                loading={loading}
                onDetail={(id) => router.push(`/guru/ujian/${id}`)}
              />
            </motion.div>
          )}

          {/* Monitoring Tab */}
          {activeTab === "monitoring" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <SectionHeader
                title="Live Monitoring Ujian"
                subtitle="Update otomatis setiap 5 detik"
                action={
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">LIVE</span>
                  </div>
                }
              />

              {/* Pilih ujian aktif */}
              {data?.ujianAktif && data.ujianAktif.length > 0 ? (
                <>
                  {data.ujianAktif.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {data.ujianAktif.map((u: any) => (
                        <button
                          key={u._id}
                          onClick={() => setMonitoringUjianId(u._id)}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            monitoringUjianId === u._id
                              ? "bg-purple-600 text-white"
                              : "bg-[#1A1A2E] border border-[#2A2A4A] text-[#B0B0C0]"
                          }`}
                        >
                          {u.nama}
                        </button>
                      ))}
                    </div>
                  )}

                  {monitoringLoading && sesiList.length === 0 ? (
                    <div className="skeleton h-40 rounded-2xl" />
                  ) : (
                    <LiveMonitoring
                      sesiList={sesiList}
                      ujianDurasi={
                        data.ujianAktif.find(
                          (u: any) => u._id === monitoringUjianId
                        )?.durasi || 60
                      }
                      onIzinkan={handleIzinkan}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-[#6B7280]">
                  <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Tidak ada ujian yang sedang aktif</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-4"
                    onClick={() => router.push("/guru/ujian")}
                  >
                    Buka Ujian
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}