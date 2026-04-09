"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PenSquare, CheckCircle } from "lucide-react";
import { DashboardLayout } from "@/components/layout";
import { Button, Modal, Input, Alert, EmptyState, Badge } from "@/components/ui";
import { KoreksiCard } from "@/components/dashboard-components";
import { SectionHeader } from "@/components/shared";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

export default function KoreksiPage() {
  const { token } = useAuthStore();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [koreksiItem, setKoreksiItem] = useState<any | null>(null);
  const [skor, setSkor] = useState("");
  const [catatan, setCatatan] = useState("");
  const [koreksiLoading, setKoreksiLoading] = useState(false);

  const fetchBelumKoreksi = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hasil", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tipe: "belum_koreksi" }),
      });
      const data = await res.json();
      if (data.success) {
        setList(data.data.list);
      }
    } catch {
      toast.error("Gagal memuat data koreksi");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBelumKoreksi(); }, [fetchBelumKoreksi]);

  const handleKoreksi = async () => {
    if (!koreksiItem) return;
    const skorNum = Number(skor);
    if (isNaN(skorNum) || skorNum < 0) {
      toast.error("Skor tidak valid");
      return;
    }

    setKoreksiLoading(true);
    try {
      const res = await fetch("/api/hasil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sesiId: koreksiItem.sesiId,
          soalId: koreksiItem.soalId,
          skorManual: skorNum,
          catatanGuru: catatan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Koreksi berhasil disimpan! ✅");
        setKoreksiItem(null);
        setSkor("");
        setCatatan("");
        fetchBelumKoreksi();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Gagal menyimpan koreksi");
    } finally {
      setKoreksiLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Koreksi Esai"
      subtitle={`${list.length} jawaban menunggu dikoreksi`}
    >
      <div className="space-y-5">
        <SectionHeader
          title="Jawaban Esai Belum Dikoreksi"
          subtitle="Koreksi jawaban esai siswa secara manual"
        />

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 rounded-2xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-16 h-16" />}
            title="Semua sudah dikoreksi! 🎉"
            description="Tidak ada jawaban esai yang menunggu dikoreksi saat ini."
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {list.map((item, i) => (
                <motion.div
                  key={`${item.sesiId}-${item.soalId}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <KoreksiCard
                    item={item}
                    onKoreksi={(item) => {
                      setKoreksiItem(item);
                      setSkor("");
                      setCatatan("");
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Koreksi Modal */}
      <Modal
        open={!!koreksiItem}
        onClose={() => setKoreksiItem(null)}
        title="Koreksi Jawaban Esai"
        size="lg"
      >
        {koreksiItem && (
          <div className="space-y-4">
            {/* Info siswa */}
            <div className="flex items-center gap-3 p-3 bg-[#16213E] rounded-xl">
              <div className="w-9 h-9 bg-purple-500/20 rounded-full flex items-center justify-center font-bold text-purple-400">
                {koreksiItem.siswaNama?.charAt(0)}
              </div>
              <div>
                <p className="font-medium text-white text-sm">
                  {koreksiItem.siswaNama}
                </p>
                <p className="text-xs text-[#6B7280]">
                  {koreksiItem.siswaNisn} • {koreksiItem.ujianNama}
                </p>
              </div>
            </div>

            {/* Jawaban siswa */}
            <div>
              <p className="form-label">Jawaban Siswa</p>
              <div className="bg-[#16213E] border border-[#2A2A4A] rounded-xl p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-[#B0B0C0] whitespace-pre-wrap">
                  {typeof koreksiItem.jawaban === "string"
                    ? koreksiItem.jawaban
                    : JSON.stringify(koreksiItem.jawaban)}
                </p>
              </div>
            </div>

            {/* Input skor */}
            <Input
              label="Berikan Skor"
              type="number"
              value={skor}
              onChange={(e) => setSkor(e.target.value)}
              placeholder="0"
              min={0}
              hint="Masukkan nilai antara 0 sampai skor maksimal soal"
              required
            />

            {/* Catatan */}
            <div>
              <label className="form-label">Catatan untuk Siswa (opsional)</label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Berikan feedback atau catatan untuk siswa..."
                rows={3}
                className="input resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setKoreksiItem(null)}
              >
                Batal
              </Button>
              <Button
                variant="teal"
                fullWidth
                loading={koreksiLoading}
                onClick={handleKoreksi}
                disabled={skor === ""}
              >
                ✅ Simpan Nilai
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}