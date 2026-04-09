"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import {
  Users,
  BookOpen,
  ClipboardList,
  PenSquare,
  Plus,
  Settings,
  Eye,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { StatCard, Badge, Button, Card, ProgressBar } from "./ui";
import { SectionHeader } from "./shared";
import {
  cn,
  formatTanggal,
  formatWaktu,
  statusUjianConfig,
  statusSesiConfig,
} from "@/lib/utils";

// ============================================
// GURU DASHBOARD — STAT GRID
// ============================================
interface GuruStatsProps {
  totalSiswa: number;
  totalSoal: number;
  ujian: { sudah: number; belum: number; total: number };
  belumKoreksi: number;
}

export function GuruStatGrid({
  totalSiswa,
  totalSoal,
  ujian,
  belumKoreksi,
}: GuruStatsProps) {
  const router = useRouter();

  const stats = [
    {
      title: "Total Siswa",
      value: totalSiswa.toLocaleString("id-ID"),
      subtitle: "Siswa terdaftar & aktif",
      icon: <Users className="w-5 h-5" />,
      gradient: "purple" as const,
      onClick: () => router.push("/admin"),
    },
    {
      title: "Bank Soal",
      value: totalSoal.toLocaleString("id-ID"),
      subtitle: "Soal tersedia",
      icon: <BookOpen className="w-5 h-5" />,
      gradient: "teal" as const,
      onClick: () => router.push("/guru/soal"),
    },
    {
      title: "Peserta Ujian",
      value: `${ujian.sudah}/${ujian.total}`,
      subtitle: `${ujian.belum} belum mengerjakan`,
      icon: <ClipboardList className="w-5 h-5" />,
      gradient: "cyan" as const,
      onClick: () => router.push("/guru/ujian"),
    },
    {
      title: "Belum Dikoreksi",
      value: belumKoreksi,
      subtitle: "Esai menunggu koreksi",
      icon: <PenSquare className="w-5 h-5" />,
      gradient: belumKoreksi > 0 ? ("orange" as const) : ("green" as const),
      onClick: () => router.push("/guru/koreksi"),
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// GURU DASHBOARD — QUICK ACTIONS
// ============================================
export function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: "Buat Soal Baru",
      desc: "Tambah ke bank soal",
      icon: <Plus className="w-5 h-5" />,
      color: "gradient-purple",
      href: "/guru/soal/buat",
    },
    {
      label: "Buat Ujian",
      desc: "Setting & buka ujian",
      icon: <Settings className="w-5 h-5" />,
      color: "gradient-teal",
      href: "/guru/ujian?action=buat",
    },
    {
      label: "Lihat Hasil",
      desc: "Nilai & statistik",
      icon: <Eye className="w-5 h-5" />,
      color: "gradient-cyan",
      href: "/guru/ujian",
    },
  ];

  return (
    <div>
      <SectionHeader
        title="Aksi Cepat"
        subtitle="Shortcut menu yang sering digunakan"
        className="mb-4"
      />
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action, i) => (
          <motion.button
            key={action.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push(action.href)}
            className={cn(
              "rounded-2xl p-4 text-left text-white transition-all",
              action.color
            )}
          >
            <div className="bg-white/20 w-9 h-9 rounded-xl flex items-center justify-center mb-3">
              {action.icon}
            </div>
            <p className="font-semibold text-sm">{action.label}</p>
            <p className="text-xs text-white/70 mt-0.5">{action.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ============================================
// GURU DASHBOARD — RECENT UJIAN LIST
// ============================================
interface UjianItem {
  _id: string;
  nama: string;
  mapel: string;
  status: string;
  durasi: number;
  tanggalMulai: string;
  sudahUjian: number;
  belumUjian: number;
  soalIds: string[];
}

export function RecentUjianList({
  ujianList,
  loading,
  onDetail,
}: {
  ujianList: UjianItem[];
  loading?: boolean;
  onDetail: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (ujianList.length === 0) {
    return (
      <div className="text-center py-10 text-[#6B7280]">
        <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Belum ada ujian</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ujianList.map((ujian, i) => {
        const statusCfg = statusUjianConfig(ujian.status);
        return (
          <motion.div
            key={ujian._id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => onDetail(ujian._id)}
            className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4 cursor-pointer hover:border-purple-500/50 transition-all group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant={
                      ujian.status === "aktif"
                        ? "success"
                        : ujian.status === "selesai"
                        ? "info"
                        : "default"
                    }
                    dot
                  >
                    {statusCfg.label}
                  </Badge>
                  <span className="text-xs text-[#6B7280]">{ujian.mapel}</span>
                </div>
                <h3 className="font-semibold text-white text-sm truncate group-hover:text-purple-400 transition-colors">
                  {ujian.nama}
                </h3>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280]">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {ujian.durasi} menit
                  </span>
                  <span>{ujian.soalIds?.length || 0} soal</span>
                  <span>{formatTanggal(ujian.tanggalMulai)}</span>
                </div>
              </div>
              {ujian.status !== "draft" && (
                <div className="text-right shrink-0">
                  <p className="text-xs text-[#6B7280]">Peserta</p>
                  <p className="text-sm font-bold text-white">
                    {ujian.sudahUjian}
                    <span className="text-[#6B7280] font-normal">
                      /{ujian.sudahUjian + ujian.belumUjian}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {ujian.status !== "draft" && ujian.sudahUjian + ujian.belumUjian > 0 && (
              <div className="mt-3">
                <ProgressBar
                  value={ujian.sudahUjian}
                  max={ujian.sudahUjian + ujian.belumUjian}
                  color="purple"
                  size="sm"
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ============================================
// GURU DASHBOARD — LIVE MONITORING
// ============================================
interface SesiItem {
  _id: string;
  siswaNama: string;
  siswaNisn: string;
  status: string;
  jumlahPelanggaran: number;
  waktuMulai?: string;
  jawaban: any[];
}

export function LiveMonitoring({
  sesiList,
  ujianDurasi,
  onIzinkan,
}: {
  sesiList: SesiItem[];
  ujianDurasi: number;
  onIzinkan: (sesiId: string) => void;
}) {
  const berlangsung = sesiList.filter((s) => s.status === "berlangsung");
  const selesai = sesiList.filter((s) => s.status === "selesai");
  const dikeluarkan = sesiList.filter((s) => s.status === "dikeluarkan");

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Sedang Ujian", count: berlangsung.length, color: "text-yellow-400", icon: Activity },
          { label: "Selesai", count: selesai.length, color: "text-green-400", icon: CheckCircle },
          { label: "Dikeluarkan", count: dikeluarkan.length, color: "text-red-400", icon: XCircle },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-[#16213E] rounded-xl p-3 text-center border border-[#2A2A4A]"
          >
            <item.icon className={cn("w-5 h-5 mx-auto mb-1", item.color)} />
            <p className={cn("text-xl font-bold", item.color)}>{item.count}</p>
            <p className="text-xs text-[#6B7280]">{item.label}</p>
          </div>
        ))}
      </div>

      {/* Daftar siswa dikeluarkan */}
      {dikeluarkan.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Siswa Dikeluarkan ({dikeluarkan.length})
          </p>
          <div className="space-y-2">
            {dikeluarkan.map((sesi) => (
              <div
                key={sesi._id}
                className="flex items-center justify-between bg-[#1A1A2E] rounded-lg p-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {sesi.siswaNama}
                  </p>
                  <p className="text-xs text-[#6B7280]">
                    {sesi.siswaNisn} • {sesi.jumlahPelanggaran}x pelanggaran
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="teal"
                  onClick={() => onIzinkan(sesi._id)}
                >
                  Izinkan Kembali
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daftar berlangsung */}
      {berlangsung.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
            Sedang Mengerjakan
          </p>
          {berlangsung.map((sesi) => {
            const answered = sesi.jawaban?.filter((j: any) => j.jawaban !== null).length || 0;
            const total = sesi.jawaban?.length || 0;
            return (
              <div
                key={sesi._id}
                className="flex items-center justify-between bg-[#1A1A2E] rounded-xl p-3 border border-[#2A2A4A]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      {sesi.siswaNama}
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      {answered}/{total} soal dijawab
                    </p>
                  </div>
                </div>
                {sesi.jumlahPelanggaran > 0 && (
                  <Badge variant="warning">
                    ⚠️ {sesi.jumlahPelanggaran}x
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================
// SISWA DASHBOARD — WELCOME CARD
// ============================================
interface WelcomeCardProps {
  nama: string;
  kelas: string;
  nisn: string;
  totalUjianSelesai: number;
  rataRata: number;
}

export function WelcomeCard({
  nama,
  kelas,
  nisn,
  totalUjianSelesai,
  rataRata,
}: WelcomeCardProps) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat Pagi" : hour < 15 ? "Selamat Siang" : hour < 18 ? "Selamat Sore" : "Selamat Malam";
  const greetEmoji = hour >= 6 && hour < 18 ? "☀️" : "🌙";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl p-5"
      style={{
        background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e40af 100%)",
        border: "1px solid rgba(139, 92, 246, 0.3)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
        <div className="w-full h-full rounded-full bg-white transform translate-x-8 -translate-y-8" />
      </div>
      <div className="absolute bottom-0 right-8 w-20 h-20 opacity-10">
        <div className="w-full h-full rounded-full bg-purple-300 transform translate-y-4" />
      </div>

      <div className="relative">
        <p className="text-purple-300 text-sm mb-1">
          {greeting} {greetEmoji}
        </p>
        <h2 className="text-2xl font-bold text-white mb-1">{nama}</h2>
        <p className="text-purple-300 text-sm">
          {kelas} • NISN: {nisn}
        </p>

        <div className="flex gap-4 mt-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-purple-300 text-xs">Ujian Selesai</p>
            <p className="text-white font-bold text-lg">{totalUjianSelesai}</p>
          </div>
          <div className="w-px bg-white/10" />
          <div>
            <p className="text-purple-300 text-xs">Rata-rata Nilai</p>
            <p
              className={cn(
                "font-bold text-lg",
                rataRata >= 75
                  ? "text-green-400"
                  : rataRata >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              )}
            >
              {rataRata || "-"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// SISWA DASHBOARD — SCORE CHART
// ============================================
interface ScoreChartProps {
  data: { ujianNama: string; mapel: string; nilaiAkhir: number; tanggalUjian: string }[];
}

export function ScoreChart({ data }: ScoreChartProps) {
  const chartData = data.slice(-10).map((d) => ({
    name: d.mapel.length > 8 ? d.mapel.slice(0, 8) + ".." : d.mapel,
    nilai: d.nilaiAkhir,
    date: formatTanggal(d.tanggalUjian),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#6B7280] text-sm">
        Belum ada data ujian
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <defs>
          <linearGradient id="nilaiGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
        <XAxis
          dataKey="name"
          stroke="#6B7280"
          tick={{ fontSize: 10, fill: "#6B7280" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#6B7280"
          tick={{ fontSize: 10, fill: "#6B7280" }}
        />
        <Tooltip
          contentStyle={{
            background: "#1A1A2E",
            border: "1px solid #2A2A4A",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}`, "Nilai"]}
        />
        <Area
          type="monotone"
          dataKey="nilai"
          stroke="#6C63FF"
          strokeWidth={2.5}
          fill="url(#nilaiGradient)"
          dot={{ fill: "#6C63FF", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#8B85FF" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ============================================
// SISWA DASHBOARD — PER MAPEL BAR CHART
// ============================================
interface MapelChartProps {
  data: { mapel: string; rataRata: number; jumlahUjian: number }[];
}

export function MapelChart({ data }: MapelChartProps) {
  const COLORS = ["#6C63FF", "#4ECDC4", "#45B7D1", "#F39C12", "#2ECC71", "#E74C3C"];

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[#6B7280] text-sm">
        Belum ada data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4A" />
        <XAxis
          dataKey="mapel"
          stroke="#6B7280"
          tick={{ fontSize: 10, fill: "#6B7280" }}
        />
        <YAxis
          domain={[0, 100]}
          stroke="#6B7280"
          tick={{ fontSize: 10, fill: "#6B7280" }}
        />
        <Tooltip
          contentStyle={{
            background: "#1A1A2E",
            border: "1px solid #2A2A4A",
            borderRadius: 12,
            color: "#fff",
            fontSize: 12,
          }}
          formatter={(value: number) => [`${value}`, "Rata-rata"]}
        />
        <Bar dataKey="rataRata" radius={[6, 6, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================
// UJIAN CARD (Siswa)
// ============================================
interface UjianAvailableCardProps {
  ujian: {
    _id: string;
    nama: string;
    mapel: string;
    durasi: number;
    soalIds: string[];
    tanggalMulai: string;
    tanggalSelesai: string;
    statusSesi?: string | null;
    sudahMengerjakan?: boolean;
  };
  onKerjakan: (id: string) => void;
}

export function UjianAvailableCard({ ujian, onKerjakan }: UjianAvailableCardProps) {
  const sudah = ujian.sudahMengerjakan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-[#1A1A2E] border rounded-2xl p-4 transition-all",
        sudah
          ? "border-[#2A2A4A] opacity-70"
          : "border-[#2A2A4A] hover:border-purple-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={sudah ? "default" : "success"} dot>
              {sudah ? "Selesai" : "Tersedia"}
            </Badge>
            <span className="text-xs text-[#6B7280]">{ujian.mapel}</span>
          </div>
          <h3 className="font-semibold text-white text-sm truncate">{ujian.nama}</h3>
          <div className="flex items-center gap-3 mt-2 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {ujian.durasi} menit
            </span>
            <span>{ujian.soalIds?.length || 0} soal</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        {sudah ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle className="w-4 h-4" />
            Sudah dikerjakan
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => onKerjakan(ujian._id)}
          >
            Kerjakan Ujian
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============================================
// HASIL CARD (Siswa — Riwayat Nilai)
// ============================================
interface HasilCardProps {
  hasil: {
    _id: string;
    ujianNama: string;
    mapel: string;
    nilaiAkhir: number;
    status: string;
    tanggalUjian: string;
    waktuPengerjaan: number;
  };
  onClick: () => void;
}

export function HasilCard({ hasil, onClick }: HasilCardProps) {
  const color =
    hasil.nilaiAkhir >= 75
      ? "text-green-400"
      : hasil.nilaiAkhir >= 50
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4 cursor-pointer hover:border-purple-500/50 transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#6B7280] mb-1">{hasil.mapel}</p>
          <h3 className="font-semibold text-white text-sm truncate">
            {hasil.ujianNama}
          </h3>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-[#6B7280]">
            <span>{formatTanggal(hasil.tanggalUjian)}</span>
            <span>{hasil.waktuPengerjaan} menit</span>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className={cn("text-3xl font-bold", color)}>{hasil.nilaiAkhir}</p>
          <Badge
            variant={
              hasil.status === "lulus"
                ? "success"
                : hasil.status === "tidak_lulus"
                ? "danger"
                : "warning"
            }
          >
            {hasil.status === "lulus"
              ? "Lulus"
              : hasil.status === "tidak_lulus"
              ? "Tidak Lulus"
              : "Dalam Koreksi"}
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// KOREKSI ESAI CARD (Guru)
// ============================================
interface KoreksiCardProps {
  item: {
    sesiId: string;
    soalId: string;
    siswaNama: string;
    siswaNisn: string;
    ujianNama: string;
    mapel: string;
    jawaban: string;
    waktuSelesai: string;
  };
  onKoreksi: (item: any) => void;
}

export function KoreksiCard({ item, onKoreksi }: KoreksiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning">Menunggu Koreksi</Badge>
            <span className="text-xs text-[#6B7280]">{item.mapel}</span>
          </div>
          <p className="font-semibold text-white text-sm">{item.siswaNama}</p>
          <p className="text-xs text-[#6B7280]">
            {item.siswaNisn} • {item.ujianNama}
          </p>
          <p className="text-xs text-[#6B7280] mt-1">
            Selesai: {formatTanggal(item.waktuSelesai)}
          </p>

          {/* Preview jawaban */}
          <div className="mt-2 bg-[#16213E] rounded-lg p-2">
            <p className="text-xs text-[#B0B0C0] line-clamp-2">
              {typeof item.jawaban === "string"
                ? item.jawaban
                : "Jawaban tersedia"}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="primary"
          onClick={() => onKoreksi(item)}
        >
          Koreksi
        </Button>
      </div>
    </motion.div>
  );
}

// ============================================
// ADMIN STAT GRID
// ============================================
interface AdminStatsProps {
  totalGuru: number;
  totalSiswa: number;
  totalUjian: number;
  totalSoal: number;
}

export function AdminStatGrid({
  totalGuru,
  totalSiswa,
  totalUjian,
  totalSoal,
}: AdminStatsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        {
          title: "Total Guru",
          value: totalGuru,
          subtitle: "Akun guru aktif",
          icon: <Users className="w-5 h-5" />,
          gradient: "purple" as const,
          onClick: () => router.push("/admin?tipe=guru"),
        },
        {
          title: "Total Siswa",
          value: totalSiswa,
          subtitle: "Siswa terdaftar",
          icon: <GraduationCap className="w-5 h-5" />,
          gradient: "teal" as const,
          onClick: () => router.push("/admin?tipe=siswa"),
        },
        {
          title: "Total Ujian",
          value: totalUjian,
          subtitle: "Semua ujian dibuat",
          icon: <ClipboardList className="w-5 h-5" />,
          gradient: "cyan" as const,
        },
        {
          title: "Total Soal",
          value: totalSoal,
          subtitle: "Bank soal tersedia",
          icon: <BookOpen className="w-5 h-5" />,
          gradient: "orange" as const,
        },
      ].map((stat, i) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <StatCard {...stat} />
        </motion.div>
      ))}
    </div>
  );
}

// ── Re-export GraduationCap untuk dipakai di AdminStatGrid ──
import { GraduationCap } from "lucide-react";