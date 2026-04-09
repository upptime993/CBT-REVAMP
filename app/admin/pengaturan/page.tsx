"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Shield, User, Lock, Save, Database } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, Alert, Badge } from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function PengaturanAdminPage() {
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [usernameBaru, setUsernameBaru] = useState("");
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasi, setKonfirmasi] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordBaru && passwordBaru !== konfirmasi) {
      setError("Konfirmasi password tidak cocok"); return;
    }
    if (passwordBaru && !passwordLama) {
      setError("Masukkan password lama"); return;
    }
    if (passwordBaru && passwordBaru.length < 6) {
      setError("Password minimal 6 karakter"); return;
    }

    setLoading(true);
    try {
      const body: any = {};
      if (usernameBaru.trim()) body.usernameBaru = usernameBaru.trim();
      if (passwordBaru) { body.passwordLama = passwordLama; body.passwordBaru = passwordBaru; }

      if (!Object.keys(body).length) {
        setError("Tidak ada perubahan"); setLoading(false); return;
      }

      const res = await fetch("/api/auth", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Akun berhasil diperbarui!");
        setSuccess("Perubahan berhasil disimpan");
        if (usernameBaru && user) setUser({ ...user, username: usernameBaru });
        setUsernameBaru(""); setPasswordLama(""); setPasswordBaru(""); setKonfirmasi("");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Sistem" subtitle="Konfigurasi administrator">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Admin info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <div className="w-full h-full rounded-full bg-white transform translate-x-8 -translate-y-8" />
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center text-2xl font-bold">
              {user?.nama?.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{user?.nama}</p>
              <p className="text-purple-300">@{user?.username}</p>
              <Badge variant="purple" className="mt-1">
                <Shield className="w-3 h-3" />
                {user?.role === "superadmin" ? "Super Admin" : "Admin"}
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* System Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5"
        >
          <SectionHeader title="Informasi Sistem" className="mb-4" />
          <div className="space-y-3">
            {[
              { label: "Aplikasi", value: "CBT-REVAMP v1.0" },
              { label: "Database", value: "MongoDB Atlas" },
              { label: "Platform", value: "Next.js 14 + Vercel" },
              { label: "Environment", value: process.env.NODE_ENV || "production" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-[#6B7280]">{item.label}</span>
                <span className="text-white font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Update akun */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5"
        >
          <SectionHeader
            title="Perbarui Akun Admin"
            className="mb-5"
          />
          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError("")} /></div>}
          {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess("")} /></div>}
          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Username Baru"
              value={usernameBaru}
              onChange={(e) => setUsernameBaru(e.target.value)}
              placeholder={`Saat ini: ${user?.username}`}
              leftIcon={<User className="w-4 h-4" />}
            />
            <div className="border-t border-[#2A2A4A] pt-4 space-y-3">
              <p className="text-sm font-medium text-[#B0B0C0]">Ganti Password</p>
              <Input label="Password Lama" type="password" value={passwordLama}
                onChange={(e) => setPasswordLama(e.target.value)}
                placeholder="Password saat ini" leftIcon={<Lock className="w-4 h-4" />} />
              <Input label="Password Baru" type="password" value={passwordBaru}
                onChange={(e) => setPasswordBaru(e.target.value)}
                placeholder="Minimal 6 karakter" leftIcon={<Lock className="w-4 h-4" />} />
              {passwordBaru && (
                <Input label="Konfirmasi Password" type="password" value={konfirmasi}
                  onChange={(e) => setKonfirmasi(e.target.value)}
                  placeholder="Ulangi password baru"
                  leftIcon={<Lock className="w-4 h-4" />}
                  error={konfirmasi && passwordBaru !== konfirmasi ? "Password tidak cocok" : ""} />
              )}
            </div>
            <Button type="submit" variant="primary" fullWidth loading={loading} size="lg"
              icon={<Save className="w-4 h-4" />}>
              Simpan Perubahan
            </Button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}