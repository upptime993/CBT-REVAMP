"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Input, Alert, Card } from "@/components/ui";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function PengaturanGuruPage() {
  const { user, token, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [usernameBaru, setUsernameBaru] = useState("");
  const [passwordLama, setPasswordLama] = useState("");
  const [passwordBaru, setPasswordBaru] = useState("");
  const [konfirmasiPassword, setKonfirmasiPassword] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (passwordBaru && passwordBaru !== konfirmasiPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }
    if (passwordBaru && passwordBaru.length < 6) {
      setError("Password baru minimal 6 karakter");
      return;
    }
    if (passwordBaru && !passwordLama) {
      setError("Masukkan password lama untuk mengganti password");
      return;
    }

    setLoading(true);
    try {
      const body: any = {};
      if (usernameBaru.trim()) body.usernameBaru = usernameBaru.trim();
      if (passwordBaru) { body.passwordLama = passwordLama; body.passwordBaru = passwordBaru; }

      if (Object.keys(body).length === 0) {
        setError("Tidak ada perubahan yang dibuat");
        setLoading(false);
        return;
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
        toast.success("Akun berhasil diperbarui! ✅");
        setSuccess("Perubahan berhasil disimpan");
        if (usernameBaru && user) {
          setUser({ ...user, username: usernameBaru });
        }
        setUsernameBaru("");
        setPasswordLama("");
        setPasswordBaru("");
        setKonfirmasiPassword("");
      } else {
        setError(data.message);
      }
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Pengaturan Akun" subtitle="Kelola informasi akun kamu">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Info akun */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600/20 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 gradient-purple rounded-2xl flex items-center justify-center text-2xl font-bold text-white">
              {user?.nama?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-white text-lg">{user?.nama}</p>
              <p className="text-purple-300 text-sm">@{user?.username}</p>
              <p className="text-purple-300/60 text-xs capitalize mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5"
        >
          <SectionHeader
            title="Perbarui Akun"
            subtitle="Kosongkan field yang tidak ingin diubah"
            className="mb-5"
          />

          {error && (
            <div className="mb-4">
              <Alert type="error" message={error} onClose={() => setError("")} />
            </div>
          )}
          {success && (
            <div className="mb-4">
              <Alert type="success" message={success} onClose={() => setSuccess("")} />
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-4">
            <Input
              label="Username Baru"
              value={usernameBaru}
              onChange={(e) => setUsernameBaru(e.target.value)}
              placeholder={`Username saat ini: ${user?.username}`}
              leftIcon={<User className="w-4 h-4" />}
              hint="Kosongkan jika tidak ingin mengubah username"
            />

            <div className="border-t border-[#2A2A4A] pt-4">
              <p className="text-sm font-medium text-[#B0B0C0] mb-3">
                Ganti Password
              </p>
              <div className="space-y-3">
                <Input
                  label="Password Lama"
                  type="password"
                  value={passwordLama}
                  onChange={(e) => setPasswordLama(e.target.value)}
                  placeholder="Masukkan password lama"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                <Input
                  label="Password Baru"
                  type="password"
                  value={passwordBaru}
                  onChange={(e) => setPasswordBaru(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  leftIcon={<Lock className="w-4 h-4" />}
                />
                {passwordBaru && (
                  <Input
                    label="Konfirmasi Password Baru"
                    type="password"
                    value={konfirmasiPassword}
                    onChange={(e) => setKonfirmasiPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={
                      konfirmasiPassword && passwordBaru !== konfirmasiPassword
                        ? "Password tidak cocok"
                        : ""
                    }
                  />
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              size="lg"
              icon={<Save className="w-4 h-4" />}
            >
              Simpan Perubahan
            </Button>
          </form>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}