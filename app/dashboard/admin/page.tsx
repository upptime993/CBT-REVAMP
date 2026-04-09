"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  UserPlus,
  BookOpen,
  ClipboardList,
  RefreshCw,
  Shield,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { AdminStatGrid, QuickActions } from "@/components/dashboard-components";
import { Button, Card, Badge } from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import { useAuth } from "@/hooks";
import { formatTanggal } from "@/lib/utils";

export default function DashboardAdminPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const { requireRole } = useAuth();

  const [stats, setStats] = useState({
    totalGuru: 0,
    totalSiswa: 0,
    totalUjian: 0,
    totalSoal: 0,
  });
  const [recentGuru, setRecentGuru] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requireRole(["admin", "superadmin"]);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [guruRes, siswaRes, ujianRes, soalRes] = await Promise.all([
        fetch("/api/manajemen?tipe=guru&limit=5", { headers }),
        fetch("/api/manajemen?tipe=siswa&limit=1", { headers }),
        fetch("/api/ujian?limit=1", { headers }),
        fetch("/api/soal?limit=1", { headers }),
      ]);

      const [guruData, siswaData, ujianData, soalData] = await Promise.all([
        guruRes.json(),
        siswaRes.json(),
        ujianRes.json(),
        soalRes.json(),
      ]);

      setStats({
        totalGuru: guruData.data?.total || 0,
        totalSiswa: siswaData.data?.total || 0,
        totalUjian: ujianData.data?.total || 0,
        totalSoal: soalData.data?.total || 0,
      });
      setRecentGuru(guruData.data?.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <DashboardLayout
      showGreeting
      subtitle="Panel Administrator"
      actions={
        <Button
          size="sm"
          variant="secondary"
          onClick={fetchData}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stat Grid */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))}
          </div>
        ) : (
          <AdminStatGrid {...stats} />
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: "Manajemen Pengguna",
              desc: "Kelola guru & siswa",
              icon: <Users className="w-6 h-6" />,
              color: "gradient-purple",
              href: "/admin",
            },
            {
              label: "Pengaturan Sistem",
              desc: "Konfigurasi aplikasi",
              icon: <Shield className="w-6 h-6" />,
              color: "gradient-teal",
              href: "/admin/pengaturan",
            },
          ].map((item) => (
            <motion.button
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(item.href)}
              className={`${item.color} rounded-2xl p-5 text-left text-white`}
            >
              <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3">
                {item.icon}
              </div>
              <p className="font-bold">{item.label}</p>
              <p className="text-sm text-white/70 mt-0.5">{item.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Recent Guru */}
        <div>
          <SectionHeader
            title="Akun Guru Terbaru"
            action={
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push("/admin?tipe=guru")}
              >
                Lihat Semua
              </Button>
            }
            className="mb-4"
          />
          <div className="space-y-2">
            {loading
              ? [1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-16 rounded-xl" />
                ))
              : recentGuru.map((guru) => (
                  <motion.div
                    key={guru._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 bg-[#1A1A2E] border border-[#2A2A4A] rounded-xl p-3"
                  >
                    <div className="w-9 h-9 gradient-purple rounded-full flex items-center justify-center font-bold text-sm">
                      {guru.nama?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">
                        {guru.nama}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        @{guru.username}{" "}
                        {guru.mapel && `• ${guru.mapel}`}
                      </p>
                    </div>
                    <Badge
                      variant={guru.role === "admin" ? "purple" : "default"}
                    >
                      {guru.role}
                    </Badge>
                  </motion.div>
                ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}