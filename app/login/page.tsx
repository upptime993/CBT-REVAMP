"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Hash,
  User,
  Lock,
  ChevronDown,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button, Input, Alert } from "@/components/ui";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken, user } = useAuthStore();

  const [showGuruForm, setShowGuruForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Siswa
  const [nisn, setNisn] = useState("");
  const [nisnError, setNisnError] = useState("");

  // Guru/Admin
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Redirect jika sudah login
  useEffect(() => {
    if (user) {
      if (user.role === "siswa") router.replace("/dashboard/siswa");
      else if (user.role === "guru") router.replace("/dashboard/guru");
      else router.replace("/dashboard/admin");
    }
  }, [user, router]);

  // Login Siswa
  const handleLoginSiswa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNisnError("");

    const nisnClean = nisn.trim();
    if (!nisnClean) {
      setNisnError("NISN wajib diisi");
      return;
    }
    if (!/^\d{10}$/.test(nisnClean)) {
      setNisnError("NISN harus 10 digit angka");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipe: "siswa", nisn: nisnClean }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      setUser(data.data.user);
      setToken(data.data.token);
      toast.success(`Selamat datang, ${data.data.user.nama}! 👋`);
      router.push("/dashboard/siswa");
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  // Login Guru/Admin
  const handleLoginGuru = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Username dan password wajib diisi");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipe: "guru",
          username: username.trim(),
          password,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login gagal");
        return;
      }

      setUser(data.data.user);
      setToken(data.data.token);
      toast.success(`Selamat datang, ${data.data.user.nama}! 👋`);

      const role = data.data.user.role;
      if (role === "guru") router.push("/dashboard/guru");
      else router.push("/dashboard/admin");
    } catch {
      setError("Terjadi kesalahan. Periksa koneksi internet Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 gradient-purple rounded-2xl flex items-center justify-center mx-auto mb-4 glow-purple"
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white">CBT-REVAMP</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Platform Ujian Online untuk Sekolah
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-3xl p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {!showGuruForm ? (
              // ── FORM SISWA ──
              <motion.div
                key="siswa"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Masuk sebagai Siswa</h2>
                    <p className="text-xs text-[#6B7280]">
                      Gunakan NISN untuk masuk
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <Alert
                      type="error"
                      message={error}
                      onClose={() => setError("")}
                    />
                  </div>
                )}

                <form onSubmit={handleLoginSiswa} className="space-y-4">
                  <div>
                    <label className="form-label">
                      NISN{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={nisn}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setNisn(val);
                          setNisnError("");
                          setError("");
                        }}
                        placeholder="Masukkan 10 digit NISN"
                        maxLength={10}
                        className={`input pl-10 tracking-widest text-center text-lg font-mono ${
                          nisnError ? "input-error" : ""
                        }`}
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                    {nisnError && (
                      <p className="mt-1.5 text-xs text-red-400">{nisnError}</p>
                    )}
                    {nisn && (
                      <p className="mt-1.5 text-xs text-[#6B7280] text-center">
                        {nisn.length}/10 digit
                        {nisn.length === 10 && (
                          <span className="text-green-400 ml-2">✓ Lengkap</span>
                        )}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    size="lg"
                    loading={loading}
                    disabled={nisn.length !== 10}
                  >
                    Masuk sebagai Siswa
                  </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#2A2A4A]" />
                  <span className="text-xs text-[#4A4A6A]">atau</span>
                  <div className="flex-1 h-px bg-[#2A2A4A]" />
                </div>

                {/* Tombol masuk guru */}
                <button
                  onClick={() => {
                    setShowGuruForm(true);
                    setError("");
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-[#2A2A4A] hover:border-[#3A3A5A] hover:bg-[#16213E] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#2A2A4A] rounded-lg flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                      <Shield className="w-4 h-4 text-[#6B7280] group-hover:text-teal-400 transition-colors" />
                    </div>
                    <span className="text-sm text-[#B0B0C0] group-hover:text-white transition-colors">
                      Masuk sebagai Guru / Admin
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#6B7280] -rotate-90" />
                </button>
              </motion.div>
            ) : (
              // ── FORM GURU/ADMIN ──
              <motion.div
                key="guru"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <button
                    onClick={() => {
                      setShowGuruForm(false);
                      setError("");
                      setUsername("");
                      setPassword("");
                    }}
                    className="w-8 h-8 rounded-lg bg-[#16213E] flex items-center justify-center text-[#6B7280] hover:text-white transition-colors"
                  >
                    ←
                  </button>
                  <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Masuk sebagai Guru/Admin</h2>
                    <p className="text-xs text-[#6B7280]">
                      Gunakan username & password
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mb-4">
                    <Alert
                      type="error"
                      message={error}
                      onClose={() => setError("")}
                    />
                  </div>
                )}

                <form onSubmit={handleLoginGuru} className="space-y-4">
                  <Input
                    label="Username"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setError("");
                    }}
                    placeholder="Masukkan username"
                    leftIcon={<User className="w-4 h-4" />}
                    autoComplete="username"
                    autoFocus
                    required
                  />
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Masukkan password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    autoComplete="current-password"
                    required
                  />

                  <Button
                    type="submit"
                    variant="teal"
                    fullWidth
                    size="lg"
                    loading={loading}
                  >
                    Masuk
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#4A4A6A] mt-6">
          CBT-REVAMP v1.0 • Platform Ujian Online
        </p>
      </motion.div>
    </div>
  );
}