"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Check,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  Badge,
  Toggle,
} from "./ui";
import { cn, labelTipe, warnaTipe } from "@/lib/utils";
import type { TipeSoal } from "@/lib/mongodb";
import toast from "react-hot-toast";

// ============================================
// TIPE SOAL SELECTOR
// ============================================
const TIPE_OPTIONS: { tipe: TipeSoal; label: string; desc: string; color: string }[] = [
  {
    tipe: "pilihan_ganda",
    label: "Pilihan Ganda",
    desc: "1 jawaban benar dari beberapa opsi",
    color: "border-blue-500/40 hover:border-blue-500 bg-blue-500/5",
  },
  {
    tipe: "pg_kompleks",
    label: "PG Kompleks",
    desc: "Beberapa jawaban benar (checkbox)",
    color: "border-green-500/40 hover:border-green-500 bg-green-500/5",
  },
  {
    tipe: "isian_singkat",
    label: "Isian Singkat",
    desc: "Jawab dengan teks pendek",
    color: "border-yellow-500/40 hover:border-yellow-500 bg-yellow-500/5",
  },
  {
    tipe: "menjodohkan",
    label: "Menjodohkan",
    desc: "Cocokkan kolom kiri dan kanan",
    color: "border-orange-500/40 hover:border-orange-500 bg-orange-500/5",
  },
  {
    tipe: "esai",
    label: "Esai / Uraian",
    desc: "Jawaban panjang, dikoreksi guru",
    color: "border-red-500/40 hover:border-red-500 bg-red-500/5",
  },
];

interface TipeSelectorProps {
  value: TipeSoal | "";
  onChange: (tipe: TipeSoal) => void;
}

export function TipeSelector({ value, onChange }: TipeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {TIPE_OPTIONS.map((opt) => (
        <motion.button
          key={opt.tipe}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(opt.tipe)}
          className={cn(
            "relative p-4 rounded-2xl border-2 text-left transition-all",
            value === opt.tipe
              ? opt.color + " border-opacity-100"
              : "border-[#2A2A4A] bg-[#1A1A2E] hover:border-[#3A3A6A]"
          )}
        >
          {value === opt.tipe && (
            <div className="absolute top-3 right-3 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          <Badge className={cn("mb-2 text-[10px]", warnaTipe(opt.tipe))}>
            {opt.label}
          </Badge>
          <p className="text-xs text-[#B0B0C0]">{opt.desc}</p>
        </motion.button>
      ))}
    </div>
  );
}

// ============================================
// PILIHAN GANDA FORM
// ============================================
interface OpsiPG {
  id: string;
  teks: string;
}

interface PGFormProps {
  opsi: OpsiPG[];
  kunci: string;
  onChange: (opsi: OpsiPG[], kunci: string) => void;
  isKompleks?: boolean;
  kunciKompleks?: string[];
  onChangeKompleks?: (opsi: OpsiPG[], kunci: string[]) => void;
}

export function PGForm({
  opsi,
  kunci,
  onChange,
  isKompleks = false,
  kunciKompleks = [],
  onChangeKompleks,
}: PGFormProps) {
  const ids = ["A", "B", "C", "D", "E"];

  const addOpsi = () => {
    if (opsi.length >= 5) {
      toast.error("Maksimal 5 opsi jawaban");
      return;
    }
    const newId = ids[opsi.length];
    onChange([...opsi, { id: newId, teks: "" }], kunci);
  };

  const removeOpsi = (idx: number) => {
    if (opsi.length <= 2) {
      toast.error("Minimal 2 opsi jawaban");
      return;
    }
    const newOpsi = opsi.filter((_, i) => i !== idx).map((o, i) => ({
      ...o,
      id: ids[i],
    }));
    const newKunci = isKompleks
      ? kunciKompleks
          .filter((k) => newOpsi.some((o) => o.id === k))
      : newOpsi.some((o) => o.id === kunci)
      ? kunci
      : "";
    if (isKompleks) {
      onChangeKompleks?.(newOpsi, newKunci as string[]);
    } else {
      onChange(newOpsi, newKunci as string);
    }
  };

  const updateTeks = (idx: number, teks: string) => {
    const newOpsi = [...opsi];
    newOpsi[idx] = { ...newOpsi[idx], teks };
    onChange(newOpsi, kunci);
  };

  const toggleKunciKompleks = (id: string) => {
    const newKunci = kunciKompleks.includes(id)
      ? kunciKompleks.filter((k) => k !== id)
      : [...kunciKompleks, id];
    onChangeKompleks?.(opsi, newKunci);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#B0B0C0]">
          Opsi Jawaban{" "}
          {isKompleks && (
            <span className="text-green-400 text-xs">
              (pilih ≥2 jawaban benar)
            </span>
          )}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={addOpsi}
          disabled={opsi.length >= 5}
          icon={<Plus className="w-3 h-3" />}
        >
          Tambah Opsi
        </Button>
      </div>

      <AnimatePresence>
        {opsi.map((o, idx) => {
          const isCorrect = isKompleks
            ? kunciKompleks.includes(o.id)
            : kunci === o.id;

          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                isCorrect
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-[#2A2A4A] bg-[#16213E]"
              )}
            >
              {/* Label */}
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                  isCorrect
                    ? "bg-green-500 text-white"
                    : "bg-[#2A2A4A] text-[#B0B0C0]"
                )}
              >
                {isCorrect ? <Check className="w-4 h-4" /> : o.id}
              </div>

              {/* Input */}
              <input
                type="text"
                value={o.teks}
                onChange={(e) => updateTeks(idx, e.target.value)}
                placeholder={`Opsi ${o.id}...`}
                className="flex-1 bg-transparent text-sm text-white placeholder-[#4A4A6A] focus:outline-none"
              />

              {/* Pilih sebagai kunci */}
              {!isKompleks ? (
                <button
                  type="button"
                  onClick={() => onChange(opsi, o.id)}
                  className={cn(
                    "text-xs px-2 py-1 rounded-lg font-medium transition-all",
                    isCorrect
                      ? "bg-green-500/20 text-green-400"
                      : "text-[#6B7280] hover:text-green-400 hover:bg-green-500/10"
                  )}
                >
                  {isCorrect ? "✓ Benar" : "Pilih"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleKunciKompleks(o.id)}
                  className={cn(
                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                    isCorrect
                      ? "bg-green-500 border-green-500"
                      : "border-[#4A4A6A] hover:border-green-500"
                  )}
                >
                  {isCorrect && <Check className="w-3 h-3 text-white" />}
                </button>
              )}

              {/* Hapus */}
              <button
                type="button"
                onClick={() => removeOpsi(idx)}
                className="text-[#6B7280] hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {!isKompleks && !kunci && (
        <p className="text-xs text-yellow-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Belum ada jawaban benar yang dipilih
        </p>
      )}
      {isKompleks && kunciKompleks.length < 2 && (
        <p className="text-xs text-yellow-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Pilih minimal 2 jawaban benar
        </p>
      )}
    </div>
  );
}

// ============================================
// ISIAN SINGKAT FORM
// ============================================
interface IsianFormProps {
  jawabanDiterima: string[];
  onChange: (val: string[]) => void;
}

export function IsianForm({ jawabanDiterima, onChange }: IsianFormProps) {
  const [input, setInput] = useState("");

  const add = () => {
    const val = input.trim();
    if (!val) return;
    if (jawabanDiterima.includes(val)) {
      toast.error("Jawaban sudah ada");
      return;
    }
    onChange([...jawabanDiterima, val]);
    setInput("");
  };

  const remove = (i: number) => {
    onChange(jawabanDiterima.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[#B0B0C0]">
        Jawaban yang Diterima{" "}
        <span className="text-xs text-[#6B7280]">
          (tambah variasi ejaan/sinonim)
        </span>
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Ketik jawaban lalu Enter atau klik Tambah..."
          className="input flex-1"
        />
        <Button type="button" size="sm" variant="teal" onClick={add}>
          Tambah
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {jawabanDiterima.map((j, i) => (
            <motion.div
              key={j}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 bg-teal-500/20 text-teal-400 border border-teal-500/30 px-3 py-1.5 rounded-full text-sm"
            >
              <Check className="w-3 h-3" />
              {j}
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-teal-400/60 hover:text-red-400 transition-colors ml-1"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {jawabanDiterima.length === 0 && (
          <p className="text-xs text-[#6B7280]">Belum ada jawaban ditambahkan</p>
        )}
      </div>
    </div>
  );
}

// ============================================
// MENJODOHKAN FORM
// ============================================
interface Pasangan {
  id: string;
  kiri: string;
  kanan: string;
}

interface MenjodohkanFormProps {
  pasangan: Pasangan[];
  onChange: (val: Pasangan[]) => void;
}

export function MenjodohkanForm({ pasangan, onChange }: MenjodohkanFormProps) {
  const add = () => {
    if (pasangan.length >= 8) {
      toast.error("Maksimal 8 pasangan");
      return;
    }
    const newId = `P${pasangan.length + 1}`;
    onChange([...pasangan, { id: newId, kiri: "", kanan: "" }]);
  };

  const remove = (idx: number) => {
    if (pasangan.length <= 2) {
      toast.error("Minimal 2 pasangan");
      return;
    }
    onChange(
      pasangan
        .filter((_, i) => i !== idx)
        .map((p, i) => ({ ...p, id: `P${i + 1}` }))
    );
  };

  const update = (idx: number, key: "kiri" | "kanan", val: string) => {
    const updated = [...pasangan];
    updated[idx] = { ...updated[idx], [key]: val };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#B0B0C0]">Pasangan Jawaban</p>
          <p className="text-xs text-[#6B7280]">
            Kolom kiri akan diacak saat ujian
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={add}
          disabled={pasangan.length >= 8}
          icon={<Plus className="w-3 h-3" />}
        >
          Tambah
        </Button>
      </div>

      {/* Header */}
      <div className="grid grid-cols-2 gap-3 px-3">
        <p className="text-xs text-[#6B7280] font-medium">KOLOM KIRI (Soal)</p>
        <p className="text-xs text-[#6B7280] font-medium">KOLOM KANAN (Jawaban)</p>
      </div>

      <AnimatePresence>
        {pasangan.map((p, idx) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="grid grid-cols-2 gap-3 items-center"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#6B7280] font-mono w-6 text-center flex-shrink-0">
                {idx + 1}.
              </span>
              <input
                type="text"
                value={p.kiri}
                onChange={(e) => update(idx, "kiri", e.target.value)}
                placeholder="Kolom kiri..."
                className="input text-sm flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-[#4A4A6A] flex-shrink-0" />
              <input
                type="text"
                value={p.kanan}
                onChange={(e) => update(idx, "kanan", e.target.value)}
                placeholder="Kolom kanan..."
                className="input text-sm flex-1"
              />
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-[#6B7280] hover:text-red-400 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// ESAI FORM
// ============================================
interface EsaiFormProps {
  rubrik: string;
  skorMaksimal: number;
  onChangeRubrik: (val: string) => void;
  onChangeSkor: (val: number) => void;
}

export function EsaiForm({
  rubrik,
  skorMaksimal,
  onChangeRubrik,
  onChangeSkor,
}: EsaiFormProps) {
  return (
    <div className="space-y-4">
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
        <p className="text-xs text-orange-400 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          Soal esai tidak dikoreksi otomatis. Guru perlu mengoreksi secara
          manual setelah ujian selesai.
        </p>
      </div>

      <Textarea
        label="Rubrik Penilaian"
        value={rubrik}
        onChange={(e) => onChangeRubrik(e.target.value)}
        placeholder="Contoh: Skor 10 = jawaban lengkap dan tepat&#10;Skor 7 = jawaban benar tapi kurang lengkap&#10;Skor 3 = jawaban sebagian benar&#10;Skor 0 = tidak menjawab"
        rows={5}
        hint="Rubrik ini hanya terlihat oleh guru saat mengoreksi"
        required
      />

      <Input
        label="Skor Maksimal"
        type="number"
        value={skorMaksimal}
        onChange={(e) => onChangeSkor(Number(e.target.value))}
        min={1}
        max={100}
        hint="Nilai maksimal yang bisa diberikan guru untuk jawaban ini"
        required
      />
    </div>
  );
}

// ============================================
// SOAL EDITOR UTAMA
// ============================================
const MAPEL_OPTIONS = [
  "Matematika", "Bahasa Indonesia", "Bahasa Inggris",
  "IPA Biologi", "IPA Fisika", "IPA Kimia",
  "IPS Sejarah", "IPS Geografi", "IPS Ekonomi",
  "PKn", "Agama", "Seni Budaya", "PJOK",
  "Prakarya", "TIK", "Lainnya",
].map((m) => ({ value: m, label: m }));

const TINGKAT_OPTIONS = [
  { value: "mudah", label: "🟢 Mudah" },
  { value: "sedang", label: "🟡 Sedang" },
  { value: "sulit", label: "🔴 Sulit" },
];

const KELAS_OPTIONS = [
  "VII", "VIII", "IX",
  "X", "XI", "XII",
].map((k) => ({ value: k, label: `Kelas ${k}` }));

interface SoalEditorProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
  initialData?: any;
}

export function SoalEditor({ onSubmit, loading, initialData }: SoalEditorProps) {
  const [tipe, setTipe] = useState<TipeSoal | "">(initialData?.tipe || "");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Base fields
  const [pertanyaan, setPertanyaan] = useState(initialData?.pertanyaan || "");
  const [mapel, setMapel] = useState(initialData?.mapel || "");
  const [kelas, setKelas] = useState<string[]>(initialData?.kelasTarget || []);
  const [kesulitan, setKesulitan] = useState(initialData?.tingkatKesulitan || "sedang");
  const [poin, setPoin] = useState(initialData?.poin || 1);

  // PG
  const [opsi, setOpsi] = useState<OpsiPG[]>(
    initialData?.opsi || [
      { id: "A", teks: "" },
      { id: "B", teks: "" },
      { id: "C", teks: "" },
      { id: "D", teks: "" },
    ]
  );
  const [kunci, setKunci] = useState<string>(initialData?.kunciJawaban || "");

  // PG Kompleks
  const [kunciKompleks, setKunciKompleks] = useState<string[]>(
    Array.isArray(initialData?.kunciJawaban) ? initialData.kunciJawaban : []
  );

  // Isian
  const [jawabanDiterima, setJawabanDiterima] = useState<string[]>(
    initialData?.jawabanDiterima || []
  );

  // Menjodohkan
  const [pasangan, setPasangan] = useState<Pasangan[]>(
    initialData?.pasangan || [
      { id: "P1", kiri: "", kanan: "" },
      { id: "P2", kiri: "", kanan: "" },
    ]
  );

  // Esai
  const [rubrik, setRubrik] = useState(initialData?.rubrik || "");
  const [skorMaksimal, setSkorMaksimal] = useState(initialData?.skorMaksimal || 10);

  const handleKelasToggle = (val: string) => {
    setKelas((prev) =>
      prev.includes(val) ? prev.filter((k) => k !== val) : [...prev, val]
    );
  };

  const validateAndNext = () => {
    if (step === 1) {
      if (!tipe) { toast.error("Pilih tipe soal terlebih dahulu"); return; }
      setStep(2);
    } else if (step === 2) {
      if (!pertanyaan.trim()) { toast.error("Pertanyaan wajib diisi"); return; }
      if (!mapel) { toast.error("Mata pelajaran wajib dipilih"); return; }

      // Validasi per tipe
      if (tipe === "pilihan_ganda" && !kunci) {
        toast.error("Pilih jawaban yang benar"); return;
      }
      if (tipe === "pg_kompleks" && kunciKompleks.length < 2) {
        toast.error("Pilih minimal 2 jawaban benar"); return;
      }
      if (tipe === "isian_singkat" && jawabanDiterima.length === 0) {
        toast.error("Tambahkan minimal 1 jawaban"); return;
      }
      if (tipe === "menjodohkan") {
        const invalid = pasangan.some((p) => !p.kiri || !p.kanan);
        if (invalid) { toast.error("Semua pasangan harus diisi"); return; }
      }
      if (tipe === "esai") {
        if (!rubrik.trim()) { toast.error("Rubrik penilaian wajib diisi"); return; }
        if (!skorMaksimal || skorMaksimal < 1) { toast.error("Skor maksimal wajib diisi"); return; }
      }

      setStep(3);
    }
  };

  const handleSubmit = () => {
    const data: any = {
      tipe,
      pertanyaan,
      mapel,
      kelasTarget: kelas,
      tingkatKesulitan: kesulitan,
      poin: tipe === "esai" ? skorMaksimal : poin,
    };

    if (tipe === "pilihan_ganda") {
      data.opsi = opsi;
      data.kunciJawaban = kunci;
    } else if (tipe === "pg_kompleks") {
      data.opsi = opsi;
      data.kunciJawaban = kunciKompleks;
    } else if (tipe === "isian_singkat") {
      data.jawabanDiterima = jawabanDiterima;
    } else if (tipe === "menjodohkan") {
      data.pasangan = pasangan;
    } else if (tipe === "esai") {
      data.rubrik = rubrik;
      data.skorMaksimal = skorMaksimal;
    }

    onSubmit(data);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "Tipe Soal" },
          { num: 2, label: "Detail Soal" },
          { num: 3, label: "Preview" },
        ].map((s, i) => (
          <React.Fragment key={s.num}>
            <div
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors",
                step >= s.num ? "text-purple-400" : "text-[#6B7280]"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step > s.num
                    ? "bg-purple-500 text-white"
                    : step === s.num
                    ? "bg-purple-500/30 border-2 border-purple-500 text-purple-400"
                    : "bg-[#2A2A4A] text-[#6B7280]"
                )}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "flex-1 h-0.5 rounded transition-colors",
                  step > s.num ? "bg-purple-500" : "bg-[#2A2A4A]"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* STEP 1: Pilih Tipe */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <p className="text-[#B0B0C0] text-sm">
              Pilih tipe soal yang ingin dibuat:
            </p>
            <TipeSelector value={tipe} onChange={setTipe} />
            <Button
              variant="primary"
              onClick={validateAndNext}
              disabled={!tipe}
              fullWidth
              size="lg"
            >
              Lanjut ke Detail Soal →
            </Button>
          </motion.div>
        )}

        {/* STEP 2: Detail Soal */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            {/* Info tipe terpilih */}
            <div className="flex items-center gap-2">
              <Badge className={warnaTipe(tipe as TipeSoal)}>
                {labelTipe(tipe as TipeSoal)}
              </Badge>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#6B7280] hover:text-purple-400 underline"
              >
                Ganti tipe
              </button>
            </div>

            {/* Pertanyaan */}
            <Textarea
              label="Pertanyaan"
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              placeholder="Tulis pertanyaan di sini..."
              rows={4}
              required
            />

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Mata Pelajaran"
                options={MAPEL_OPTIONS}
                value={mapel}
                onChange={setMapel}
                required
              />
              <Select
                label="Tingkat Kesulitan"
                options={TINGKAT_OPTIONS}
                value={kesulitan}
                onChange={setKesulitan}
              />
            </div>

            {/* Kelas target */}
            <div>
              <p className="form-label">Kelas Target</p>
              <div className="flex flex-wrap gap-2">
                {KELAS_OPTIONS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => handleKelasToggle(k.value)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      kelas.includes(k.value)
                        ? "bg-purple-500 border-purple-500 text-white"
                        : "border-[#2A2A4A] text-[#6B7280] hover:border-purple-500 hover:text-white"
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Poin (bukan esai) */}
            {tipe !== "esai" && (
              <Input
                label="Poin/Bobot Soal"
                type="number"
                value={poin}
                onChange={(e) => setPoin(Number(e.target.value))}
                min={1}
                max={100}
                hint="Bobot nilai soal ini dalam total skor ujian"
              />
            )}

            {/* Form spesifik tipe */}
            <div className="border-t border-[#2A2A4A] pt-5">
              {(tipe === "pilihan_ganda" || tipe === "pg_kompleks") && (
                <PGForm
                  opsi={opsi}
                  kunci={kunci}
                  onChange={(o, k) => { setOpsi(o); setKunci(k); }}
                  isKompleks={tipe === "pg_kompleks"}
                  kunciKompleks={kunciKompleks}
                  onChangeKompleks={(o, k) => { setOpsi(o); setKunciKompleks(k); }}
                />
              )}
              {tipe === "isian_singkat" && (
                <IsianForm
                  jawabanDiterima={jawabanDiterima}
                  onChange={setJawabanDiterima}
                />
              )}
              {tipe === "menjodohkan" && (
                <MenjodohkanForm
                  pasangan={pasangan}
                  onChange={setPasangan}
                />
              )}
              {tipe === "esai" && (
                <EsaiForm
                  rubrik={rubrik}
                  skorMaksimal={skorMaksimal}
                  onChangeRubrik={setRubrik}
                  onChangeSkor={setSkorMaksimal}
                />
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(1)}>
                ← Kembali
              </Button>
              <Button variant="primary" onClick={validateAndNext} fullWidth>
                Preview Soal →
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Preview */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div className="bg-[#16213E] border border-[#2A2A4A] rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={warnaTipe(tipe as TipeSoal)}>
                  {labelTipe(tipe as TipeSoal)}
                </Badge>
                <Badge variant="default">{mapel}</Badge>
                <Badge
                  variant={
                    kesulitan === "mudah"
                      ? "success"
                      : kesulitan === "sedang"
                      ? "warning"
                      : "danger"
                  }
                >
                  {kesulitan}
                </Badge>
              </div>

              <p className="text-white font-medium">{pertanyaan}</p>

              {/* Preview jawaban per tipe */}
              {(tipe === "pilihan_ganda" || tipe === "pg_kompleks") && (
                <div className="space-y-2">
                  {opsi.map((o) => {
                    const isCorrect =
                      tipe === "pilihan_ganda"
                        ? kunci === o.id
                        : kunciKompleks.includes(o.id);
                    return (
                      <div
                        key={o.id}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg",
                          isCorrect
                            ? "bg-green-500/15 border border-green-500/30"
                            : "bg-[#1A1A2E]"
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded flex items-center justify-center text-xs font-bold",
                            isCorrect
                              ? "bg-green-500 text-white"
                              : "bg-[#2A2A4A] text-[#B0B0C0]"
                          )}
                        >
                          {isCorrect ? "✓" : o.id}
                        </span>
                        <span className="text-sm text-[#B0B0C0]">{o.teks}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {tipe === "isian_singkat" && (
                <div>
                  <p className="text-xs text-[#6B7280] mb-2">Jawaban diterima:</p>
                  <div className="flex flex-wrap gap-2">
                    {jawabanDiterima.map((j) => (
                      <span
                        key={j}
                        className="bg-teal-500/20 text-teal-400 text-xs px-3 py-1 rounded-full"
                      >
                        {j}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {tipe === "menjodohkan" && (
                <div className="space-y-1.5">
                  {pasangan.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 bg-[#1A1A2E] rounded-lg px-3 py-1.5 text-[#B0B0C0]">
                        {p.kiri}
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#4A4A6A] flex-shrink-0" />
                      <span className="flex-1 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5 text-green-400">
                        {p.kanan}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {tipe === "esai" && (
                <div className="bg-[#1A1A2E] rounded-lg p-3">
                  <p className="text-xs text-[#6B7280] mb-1">
                    Rubrik (hanya guru):
                  </p>
                  <p className="text-sm text-[#B0B0C0] whitespace-pre-line">
                    {rubrik}
                  </p>
                  <p className="text-xs text-orange-400 mt-2">
                    Skor maks: {skorMaksimal}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep(2)}>
                ← Edit
              </Button>
              <Button
                variant="teal"
                fullWidth
                loading={loading}
                onClick={handleSubmit}
                size="lg"
              >
                ✅ Simpan Soal
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}