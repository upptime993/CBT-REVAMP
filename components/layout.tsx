"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  ClipboardList,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Moon,
  Sun,
  GraduationCap,
  BarChart2,
  PenSquare,
  CheckSquare,
  Shield,
  FileText,
  User,
} from "lucide-react";
import { useAuthStore, useUIStore } from "@/store";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

// ============================================
// SIDEBAR (Desktop — Guru/Admin)
// ============================================
interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
  children?: NavItem[];
}

function buildNavItems(role: string, belumKoreksi = 0): NavItem[] {
  const common: NavItem[] = [
    {
      href:
        role === "guru"
          ? "/dashboard/guru"
          : "/dashboard/admin",
      label: "Dashboard",
      icon: <Home className="w-5 h-5" />,
    },
    {
      href: "/guru/soal",
      label: "Bank Soal",
      icon: <BookOpen className="w-5 h-5" />,
      roles: ["guru", "admin", "superadmin"],
    },
    {
      href: "/guru/ujian",
      label: "Manajemen Ujian",
      icon: <ClipboardList className="w-5 h-5" />,
      roles: ["guru", "admin", "superadmin"],
    },
    {
      href: "/guru/koreksi",
      label: "Koreksi Esai",
      icon: <PenSquare className="w-5 h-5" />,
      badge: belumKoreksi > 0 ? belumKoreksi : undefined,
      roles: ["guru", "admin", "superadmin"],
    },
  ];

  const adminOnly: NavItem[] = [
    {
      href: "/admin",
      label: "Manajemen Pengguna",
      icon: <Users className="w-5 h-5" />,
      roles: ["admin", "superadmin"],
    },
    {
      href: "/admin/pengaturan",
      label: "Pengaturan Sistem",
      icon: <Shield className="w-5 h-5" />,
      roles: ["superadmin"],
    },
  ];

  const settings: NavItem[] = [
    {
      href:
        role === "guru"
          ? "/guru/pengaturan"
          : "/admin/pengaturan",
      label: "Pengaturan Akun",
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  return [...common, ...adminOnly, ...settings].filter(
    (item) => !item.roles || item.roles.includes(role)
  );
}

interface SidebarProps {
  belumKoreksi?: number;
}

export function Sidebar({ belumKoreksi = 0 }: SidebarProps) {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebar } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();

  const navItems = buildNavItems(user?.role || "guru", belumKoreksi);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {}
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebar(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 left-0 h-full w-64 bg-[#1A1A2E] border-r border-[#2A2A4A] z-50 flex flex-col lg:translate-x-0 lg:static lg:z-auto"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2A4A]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-purple rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-white text-sm">CBT-REVAMP</h1>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">
                {user?.role === "superadmin"
                  ? "Super Admin"
                  : user?.role === "admin"
                  ? "Administrator"
                  : "Guru"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebar(false)}
            className="lg:hidden text-[#6B7280] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        <div className="p-4 border-b border-[#2A2A4A]">
          <div className="flex items-center gap-3 bg-[#16213E] rounded-xl p-3">
            <div className="w-9 h-9 gradient-purple rounded-full flex items-center justify-center text-sm font-bold">
              {user?.nama?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.nama}
              </p>
              <p className="text-xs text-[#6B7280] truncate">
                {user?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-3 px-2">
            Menu Utama
          </p>
          {navItems.slice(0, 4).map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              onClick={() => setSidebar(false)}
            />
          ))}

          {["admin", "superadmin"].includes(user?.role || "") && (
            <>
              <div className="divider" />
              <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-3 px-2">
                Administrasi
              </p>
              {navItems.slice(4, -1).map((item) => (
                <SidebarNavItem
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                  onClick={() => setSidebar(false)}
                />
              ))}
            </>
          )}

          <div className="divider" />
          <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-3 px-2">
            Akun
          </p>
          {navItems.slice(-1).map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              onClick={() => setSidebar(false)}
            />
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#2A2A4A]">
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "sidebar-item flex items-center justify-between group",
        isActive && "sidebar-item-active"
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "transition-colors",
            isActive ? "text-purple-400" : "text-[#6B7280] group-hover:text-white"
          )}
        >
          {item.icon}
        </span>
        <span>{item.label}</span>
      </div>
      <div className="flex items-center gap-2">
        {item.badge !== undefined && (
          <Badge variant="danger" className="text-[10px]">
            {item.badge}
          </Badge>
        )}
        {isActive && <ChevronRight className="w-4 h-4 text-purple-400" />}
      </div>
    </Link>
  );
}

// ============================================
// TOP BAR (Header)
// ============================================
interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showGreeting?: boolean;
}

export function TopBar({ title, subtitle, actions, showGreeting }: TopBarProps) {
  const { user } = useAuthStore();
  const { setSidebar, sidebarOpen, isDark, toggleTheme } = useUIStore();
  const [hour, setHour] = useState(0);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const greeting =
    hour < 12
      ? "Selamat Pagi"
      : hour < 15
      ? "Selamat Siang"
      : hour < 18
      ? "Selamat Sore"
      : "Selamat Malam";

  const greetIcon =
    hour >= 6 && hour < 18 ? (
      <Sun className="w-5 h-5 text-yellow-400" />
    ) : (
      <Moon className="w-5 h-5 text-blue-300" />
    );

  return (
    <header className="sticky top-0 z-30 bg-[#0F0F1A]/80 backdrop-blur-lg border-b border-[#2A2A4A] px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebar(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors text-[#6B7280] hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>

          {showGreeting ? (
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-[#B0B0C0]">
                  {greeting},{" "}
                  <span className="font-bold text-white">{user?.nama}</span>
                </p>
                {greetIcon}
              </div>
              {subtitle && (
                <p className="text-xs text-[#6B7280] mt-0.5">{subtitle}</p>
              )}
            </div>
          ) : (
            <div>
              <h1 className="font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-xs text-[#6B7280]">{subtitle}</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors text-[#6B7280] hover:text-white"
          >
            {isDark ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// BOTTOM NAV (Mobile — Siswa)
// ============================================
const siswaNavItems = [
  { href: "/dashboard/siswa", label: "Beranda", icon: Home },
  { href: "/siswa/hasil", label: "Statistik", icon: BarChart2 },
  { href: "/siswa/ujian", label: "Ujian", icon: FileText },
  { href: "/siswa/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="bottom-nav">
      <div className="flex items-center justify-around">
        {siswaNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", isActive && "nav-item-active")}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-purple-400" : "text-[#6B7280]"
                  )}
                />
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-400 rounded-full"
                  />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px]",
                  isActive ? "text-purple-400" : "text-[#6B7280]"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD LAYOUT (Guru/Admin)
// ============================================
export function DashboardLayout({
  children,
  title,
  subtitle,
  actions,
  showGreeting = false,
  belumKoreksi = 0,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showGreeting?: boolean;
  belumKoreksi?: number;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#0F0F1A]">
      <Sidebar belumKoreksi={belumKoreksi} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          showGreeting={showGreeting}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// ============================================
// SISWA LAYOUT
// ============================================
export function SiswaLayout({
  children,
  title,
  showBack = false,
}: {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0F0F1A] pb-28">
      {/* Header siswa */}
      <header className="sticky top-0 z-30 bg-[#0F0F1A]/80 backdrop-blur-lg border-b border-[#2A2A4A] px-4 py-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-[#1A1A2E] transition-colors text-[#6B7280] hover:text-white"
            >
              ‹
            </button>
          )}
          {title && (
            <h1 className="font-bold text-white text-lg">{title}</h1>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}