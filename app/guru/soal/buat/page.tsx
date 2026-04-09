"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { SoalEditor } from "@/components/soal-editor";
import { Alert } from "@/components/ui";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

// ── Loading Fallback ──
function BuatSoalLoading() {
  return (
    <DashboardLayout title="Memuat...">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-2xl" />
        ))}
      </div>
    </DashboardLayout>
  );
}

// ── Komponen utama yang pakai useSearchParams ──
function BuatSoalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token } = useAuthStore();

  const editId = searchParams.get("edit");
  const [loading, setLoading] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);
  const [fetchLoading, setFetchLoading] = useState(!!editId);

  // Fetch data soal jika mode edit
  useEffect(() => {
    if (!editId) return;
    const fetchSoal = async () => {
      try {
        const res = await fetch(`/api/soal?ids=${editId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success && data.data.list.length > 0) {
          setInitialData(data.data.list[0]);
        } else {
          toast.error("Soal tidak ditemukan");
          router.push("/guru/soal");
        }
      } catch {
        toast.error("Gagal memuat data soal");
      } finally {
        setFetchLoading(false);
      }
    };
    fetchSoal();
  }, [editId, token, router]);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...data } : data;

      const res = await fetch("/api/soal", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (result.success) {
        toast.success(
          editId
            ? "Soal berhasil diperbarui! ✅"
            : "Soal berhasil disimpan ke bank soal! ✅"
        );
        router.push("/guru/soal");
      } else {
        toast.error(result.message || "Gagal menyimpan soal");
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <DashboardLayout title="Memuat...">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={editId ? "Edit Soal" : "Buat Soal Baru"}
      subtitle={
        editId
          ? "Perbarui soal yang sudah ada"
          : "Tambahkan soal baru ke bank soal"
      }
    >
      <div className="max-w-2xl mx-auto">
        {editId && (
          <div className="mb-5">
            <Alert
              type="info"
              title="Mode Edit"
              message="Kamu sedang mengedit soal yang sudah ada. Perubahan akan langsung tersimpan."
            />
          </div>
        )}
        <div className="bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl p-5">
          <SoalEditor
            onSubmit={handleSubmit}
            loading={loading}
            initialData={initialData}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

// ── Default Export dengan Suspense ──
export default function BuatSoalPage() {
  return (
    <Suspense fallback={<BuatSoalLoading />}>
      <BuatSoalContent />
    </Suspense>
  );
}