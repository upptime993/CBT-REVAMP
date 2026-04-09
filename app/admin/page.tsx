"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit,
  Users,
  GraduationCap,
  School,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import {
  Button,
  Input,
  Select,
  Modal,
  ConfirmModal,
  Badge,
  Tabs,
  SearchBar,
  Pagination,
  EmptyState,
} from "@/components/ui";
import { Table } from "@/components/shared";
import { useAuthStore } from "@/store";
import { formatTanggal } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSearchParams } from "next/navigation";

// ── Tambah/Edit Siswa Modal ──
function SiswaModal({
  open,
  onClose,
  onSuccess,
  editData,
  kelasList,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
  kelasList: any[];
}) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: editData?.nama || "",
    nisn: editData?.nisn || "",
    kelasId: editData?.kelasId || "",
    kelas: editData?.kelas || "",
    jenisKelamin: editData?.jenisKelamin || "L",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || "",
        nisn: editData.nisn || "",
        kelasId: editData.kelasId || "",
        kelas: editData.kelas || "",
        jenisKelamin: editData.jenisKelamin || "L",
      });
    } else {
      setForm({ nama: "", nisn: "", kelasId: "", kelas: "", jenisKelamin: "L" });
    }
  }, [editData, open]);

  const kelasOptions = kelasList.map((k) => ({
    value: k._id,
    label: k.nama,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    if (!/^\d{10}$/.test(form.nisn)) { toast.error("NISN harus 10 digit angka"); return; }
    if (!form.kelasId) { toast.error("Kelas wajib dipilih"); return; }

    const selectedKelas = kelasList.find((k) => k._id === form.kelasId);
    setLoading(true);
    try {
      const method = editData ? "PUT" : "POST";
      const body = editData
        ? { tipe: "siswa", id: editData._id, ...form, kelas: selectedKelas?.nama }
        : { tipe: "siswa", ...form, kelas: selectedKelas?.nama };

      const res = await fetch("/api/manajemen", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editData ? "Data siswa diperbarui!" : "Siswa berhasil ditambahkan!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? "Edit Data Siswa" : "Tambah Siswa Baru"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Nama lengkap siswa"
          required
        />
        <Input
          label="NISN"
          value={form.nisn}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
            setForm({ ...form, nisn: val });
          }}
          placeholder="10 digit NISN"
          maxLength={10}
          disabled={!!editData}
          hint={editData ? "NISN tidak bisa diubah" : ""}
          required
        />
        <Select
          label="Kelas"
          options={kelasOptions}
          value={form.kelasId}
          onChange={(v) => setForm({ ...form, kelasId: v })}
          placeholder="Pilih kelas..."
          required
        />
        <div>
          <label className="form-label">Jenis Kelamin</label>
          <div className="flex gap-3">
            {[
              { value: "L", label: "Laki-laki" },
              { value: "P", label: "Perempuan" },
            ].map((jk) => (
              <button
                key={jk.value}
                type="button"
                onClick={() => setForm({ ...form, jenisKelamin: jk.value })}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.jenisKelamin === jk.value
                    ? "border-purple-500 bg-purple-500/10 text-purple-400"
                    : "border-[#2A2A4A] text-[#6B7280] hover:border-[#3A3A5A]"
                }`}
              >
                {jk.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} type="button">
            Batal
          </Button>
          <Button variant="primary" fullWidth loading={loading} type="submit">
            {editData ? "Simpan Perubahan" : "Tambah Siswa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Tambah Guru Modal ──
function GuruModal({
  open,
  onClose,
  onSuccess,
  editData,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: any;
}) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    username: "",
    password: "",
    mapel: "",
    role: "guru",
  });

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || "",
        username: editData.username || "",
        password: "",
        mapel: editData.mapel || "",
        role: editData.role || "guru",
      });
    } else {
      setForm({ nama: "", username: "", password: "", mapel: "", role: "guru" });
    }
  }, [editData, open]);

  const MAPEL_OPTIONS = [
    "Matematika", "Bahasa Indonesia", "Bahasa Inggris",
    "IPA Biologi", "IPA Fisika", "IPA Kimia",
    "IPS", "PKn", "Agama", "Lainnya",
  ].map((m) => ({ value: m, label: m }));

  const ROLE_OPTIONS = [
    { value: "guru", label: "Guru" },
    { value: "admin", label: "Admin" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama wajib diisi"); return; }
    if (!form.username.trim()) { toast.error("Username wajib diisi"); return; }
    if (!editData && !form.password) { toast.error("Password wajib diisi"); return; }
    if (form.password && form.password.length < 6) {
      toast.error("Password minimal 6 karakter"); return;
    }

    setLoading(true);
    try {
      const method = editData ? "PUT" : "POST";
      const body = editData
        ? { tipe: "guru", id: editData._id, ...form }
        : { tipe: "guru", ...form };

      const res = await fetch("/api/manajemen", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editData ? "Data guru diperbarui!" : "Akun guru berhasil dibuat!");
        onSuccess();
        onClose();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editData ? "Edit Akun Guru" : "Tambah Akun Guru"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Nama lengkap guru"
          required
        />
        <Input
          label="Username"
          value={form.username}
          onChange={(e) =>
            setForm({ ...form, username: e.target.value.toLowerCase() })
          }
          placeholder="username (huruf kecil)"
          required
        />
        <Input
          label={editData ? "Password Baru (kosongkan jika tidak diubah)" : "Password"}
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Minimal 6 karakter"
          required={!editData}
        />
        <Select
          label="Mata Pelajaran"
          options={MAPEL_OPTIONS}
          value={form.mapel}
          onChange={(v) => setForm({ ...form, mapel: v })}
          placeholder="Pilih mapel..."
        />
        <Select
          label="Role"
          options={ROLE_OPTIONS}
          value={form.role}
          onChange={(v) => setForm({ ...form, role: v })}
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} type="button">
            Batal
          </Button>
          <Button variant="primary" fullWidth loading={loading} type="submit">
            {editData ? "Simpan" : "Buat Akun"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Tambah Kelas Modal ──
function KelasModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nama: "",
    tingkat: "X",
    tahunAjaran: "2024/2025",
    waliKelas: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { toast.error("Nama kelas wajib diisi"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/manajemen", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipe: "kelas", ...form }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Kelas berhasil dibuat!");
        onSuccess();
        onClose();
        setForm({ nama: "", tingkat: "X", tahunAjaran: "2024/2025", waliKelas: "" });
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Tambah Kelas" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Kelas"
          value={form.nama}
          onChange={(e) => setForm({ ...form, nama: e.target.value })}
          placeholder="Contoh: X IPA 1"
          required
        />
        <Select
          label="Tingkat"
          options={["VII","VIII","IX","X","XI","XII"].map((t) => ({
            value: t, label: `Kelas ${t}`,
          }))}
          value={form.tingkat}
          onChange={(v) => setForm({ ...form, tingkat: v })}
        />
        <Input
          label="Tahun Ajaran"
          value={form.tahunAjaran}
          onChange={(e) => setForm({ ...form, tahunAjaran: e.target.value })}
          placeholder="2024/2025"
          required
        />
        <Input
          label="Wali Kelas (opsional)"
          value={form.waliKelas}
          onChange={(e) => setForm({ ...form, waliKelas: e.target.value })}
          placeholder="Nama wali kelas"
        />
        <div className="flex gap-3 pt-2">
          <Button variant="secondary" fullWidth onClick={onClose} type="button">
            Batal
          </Button>
          <Button variant="primary" fullWidth loading={loading} type="submit">
            Tambah Kelas
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Admin Page ──
export default function AdminPage() {
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tipe") || "siswa"
  );
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [showSiswaModal, setShowSiswaModal] = useState(false);
  const [showGuruModal, setShowGuruModal] = useState(false);
  const [showKelasModal, setShowKelasModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [kelasList, setKelasList] = useState<any[]>([]);

  const tabs = [
    { id: "siswa", label: "Siswa", icon: <GraduationCap className="w-4 h-4" /> },
    { id: "guru", label: "Guru", icon: <Users className="w-4 h-4" /> },
    { id: "kelas", label: "Kelas", icon: <School className="w-4 h-4" /> },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tipe: activeTab,
        page: String(page),
        limit: "15",
        ...(search && { search }),
      });
      const res = await fetch(`/api/manajemen?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.success) {
        setData(result.data.list);
        setTotal(result.data.total);
        setTotalPages(result.data.totalPages || 1);
      }
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [token, activeTab, page, search]);

  const fetchKelas = useCallback(async () => {
    try {
      const res = await fetch("/api/manajemen?tipe=kelas&limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setKelasList(data.data?.list || []);
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchKelas();
  }, [fetchKelas]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/manajemen?tipe=${activeTab}&id=${deleteId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        toast.success("Data berhasil dihapus");
        fetchData();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menghapus data");
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const siswaColumns = [
    { key: "no", header: "No", width: "50px", render: (_: any, i: number) => (page - 1) * 15 + i + 1 },
    { key: "nama", header: "Nama", render: (row: any) => (
      <div>
        <p className="font-medium text-white">{row.nama}</p>
        <p className="text-xs text-[#6B7280]">{row.nisn}</p>
      </div>
    )},
    { key: "kelas", header: "Kelas" },
    { key: "jenisKelamin", header: "JK", render: (row: any) => (
      <Badge variant={row.jenisKelamin === "L" ? "info" : "purple"}>
        {row.jenisKelamin === "L" ? "L" : "P"}
      </Badge>
    )},
    { key: "aksi", header: "Aksi", align: "right" as const, render: (row: any) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setEditData(row); setShowSiswaModal(true); }}
          className="p-1.5 rounded-lg hover:bg-purple-500/10 text-[#6B7280] hover:text-purple-400 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteId(row._id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B7280] hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  const guruColumns = [
    { key: "nama", header: "Nama", render: (row: any) => (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 gradient-purple rounded-full flex items-center justify-center text-xs font-bold">
          {row.nama?.charAt(0)}
        </div>
        <div>
          <p className="font-medium text-white">{row.nama}</p>
          <p className="text-xs text-[#6B7280]">@{row.username}</p>
        </div>
      </div>
    )},
    { key: "mapel", header: "Mapel", render: (row: any) => row.mapel || "-" },
    { key: "role", header: "Role", render: (row: any) => (
      <Badge variant={row.role === "admin" ? "purple" : "default"}>
        {row.role}
      </Badge>
    )},
    { key: "aksi", header: "Aksi", align: "right" as const, render: (row: any) => (
      <div className="flex items-center justify-end gap-1">
        <button onClick={() => { setEditData(row); setShowGuruModal(true); }}
          className="p-1.5 rounded-lg hover:bg-purple-500/10 text-[#6B7280] hover:text-purple-400 transition-colors">
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={() => setDeleteId(row._id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B7280] hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  const kelasColumns = [
    { key: "nama", header: "Nama Kelas", render: (row: any) => (
      <p className="font-medium text-white">{row.nama}</p>
    )},
    { key: "tingkat", header: "Tingkat" },
    { key: "tahunAjaran", header: "Tahun Ajaran" },
    { key: "waliKelas", header: "Wali Kelas", render: (row: any) => row.waliKelas || "-" },
    { key: "aksi", header: "Aksi", align: "right" as const, render: (row: any) => (
      <button onClick={() => setDeleteId(row._id)}
        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[#6B7280] hover:text-red-400 transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    )},
  ];

  return (
    <DashboardLayout
      title="Manajemen Pengguna"
      subtitle={`${total} ${activeTab} terdaftar`}
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditData(null);
            if (activeTab === "siswa") setShowSiswaModal(true);
            else if (activeTab === "guru") setShowGuruModal(true);
            else setShowKelasModal(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Tambah {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </Button>
      }
    >
      <div className="space-y-5">
        <Tabs tabs={tabs} active={activeTab} onChange={(id) => { setActiveTab(id); setSearch(""); }} />

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Cari ${activeTab}...`}
        />

        <div className="text-xs text-[#6B7280]">
          Menampilkan {data.length} dari {total} data
        </div>

        <Table
          columns={
            activeTab === "siswa"
              ? siswaColumns
              : activeTab === "guru"
              ? guruColumns
              : kelasColumns
          }
          data={data}
          loading={loading}
          keyExtractor={(row: any) => row._id}
          emptyText={`Belum ada ${activeTab} terdaftar`}
        />

        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>

      {/* Modals */}
      <SiswaModal
        open={showSiswaModal}
        onClose={() => { setShowSiswaModal(false); setEditData(null); }}
        onSuccess={fetchData}
        editData={editData}
        kelasList={kelasList}
      />
      <GuruModal
        open={showGuruModal}
        onClose={() => { setShowGuruModal(false); setEditData(null); }}
        onSuccess={fetchData}
        editData={editData}
      />
      <KelasModal
        open={showKelasModal}
        onClose={() => setShowKelasModal(false)}
        onSuccess={() => { fetchData(); fetchKelas(); }}
      />
      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={`Hapus ${activeTab}`}
        message={`Apakah kamu yakin ingin menghapus ${activeTab} ini?`}
        loading={deleteLoading}
      />
    </DashboardLayout>
  );
}