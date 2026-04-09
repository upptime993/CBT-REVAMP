"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { LogOut, User, Hash, School, Shield } from "lucide-react";
import { SiswaLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function SiswaProfilPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth", { method: "DELETE" });
    } catch {}
    logout();
    toast.success("Berhasil keluar");
    router.push("/login");
  };

  return (
    <SiswaLayout title="Profil Saya" showBack>
      <div className="space-y-5">
        {/* Avatar & info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-20 h-20 gradient-purple rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-3">
            {user?.nama?.charAt(0)?.toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-white">{user?.nama}</h2>
          <p className="text-[#6B7280] text-sm">{user?.kelas}</p>
        </motion.div>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5 space-y-4"
        >
          {[
            { icon: <User className="w-4 h-4" />, label: "Nama Lengkap", value: user?.nama },
            { icon: <Hash className="w-4 h-4" />, label: "NISN", value: user?.nisn },
            { icon: <School className="w-4 h-4" />, label: "Kelas", value: user?.kelas },
            { icon: <Shield className="w-4 h-4" />, label: "Status", value: "Siswa Aktif" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-xs text-[#6B7280]">{item.label}</p>
                <p className="text-sm font-medium text-white">{item.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="danger"
            fullWidth
            size="lg"
            onClick={handleLogout}
            icon={<LogOut className="w-5 h-5" />}
          >
            Keluar dari Akun
          </Button>
        </motion.div>

        <p className="text-center text-xs text-[#4A4A6A]">
          CBT-REVAMP v1.0 • Platform Ujian Online
        </p>
      </div>
    </SiswaLayout>
  );
}