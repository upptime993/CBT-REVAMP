"use client";

import React, { Component, ErrorInfo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui";
import { cn } from "@/lib/utils";

// ============================================
// ERROR BOUNDARY
// ============================================
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Terjadi Kesalahan
            </h3>
            <p className="text-[#6B7280] text-sm mb-4">
              {this.state.error?.message || "Komponen gagal dimuat"}
            </p>
            <Button
              variant="secondary"
              onClick={() =>
                this.setState({ hasError: false, error: null })
              }
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Coba Lagi
            </Button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

// ============================================
// PAGE LOADING
// ============================================
export function PageLoading({ text = "Memuat..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full"
        style={{ borderWidth: 3 }}
      />
      <p className="text-[#B0B0C0] text-sm">{text}</p>
    </div>
  );
}

// ============================================
// TABLE WRAPPER (responsive)
// ============================================
interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  keyExtractor: (row: T) => string;
}

export function Table<T>({
  columns,
  data,
  loading,
  emptyText = "Tidak ada data",
  keyExtractor,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#2A2A4A]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2A2A4A] bg-[#16213E]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]",
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[#2A2A4A]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5">
                    <div className="skeleton h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-16 text-center text-[#6B7280]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <motion.tr
                key={keyExtractor(row)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-[#2A2A4A] hover:bg-[#16213E] transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-[#B0B0C0]",
                      col.align === "center"
                        ? "text-center"
                        : col.align === "right"
                        ? "text-right"
                        : "text-left"
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as any)[col.key] ?? "-")}
                  </td>
                ))}
              </motion.tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// SCORE CIRCLE
// ============================================
interface ScoreCircleProps {
  nilai: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreCircle({
  nilai,
  size = "md",
  showLabel = true,
}: ScoreCircleProps) {
  const sizeMap = {
    sm: { circle: 60, r: 22, stroke: 4, font: "text-sm" },
    md: { circle: 90, r: 34, stroke: 6, font: "text-xl" },
    lg: { circle: 120, r: 46, stroke: 8, font: "text-3xl" },
  }[size];

  const circumference = 2 * Math.PI * sizeMap.r;
  const offset = circumference - (nilai / 100) * circumference;

  const color =
    nilai >= 75
      ? "#2ECC71"
      : nilai >= 50
      ? "#F39C12"
      : "#E74C3C";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          width={sizeMap.circle}
          height={sizeMap.circle}
          className="-rotate-90"
        >
          <circle
            cx={sizeMap.circle / 2}
            cy={sizeMap.circle / 2}
            r={sizeMap.r}
            fill="none"
            stroke="#2A2A4A"
            strokeWidth={sizeMap.stroke}
          />
          <motion.circle
            cx={sizeMap.circle / 2}
            cy={sizeMap.circle / 2}
            r={sizeMap.r}
            fill="none"
            stroke={color}
            strokeWidth={sizeMap.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold",
            sizeMap.font
          )}
          style={{ color }}
        >
          {nilai}
        </div>
      </div>
      {showLabel && (
        <p className="text-xs text-[#6B7280]">
          {nilai >= 75 ? "✅ Lulus" : nilai >= 50 ? "⚠️ Cukup" : "❌ Tidak Lulus"}
        </p>
      )}
    </div>
  );
}

// ============================================
// COUNTDOWN TIMER DISPLAY
// ============================================
interface TimerDisplayProps {
  seconds: number;
  isWarning?: boolean;
  isDanger?: boolean;
}

export function TimerDisplay({ seconds, isWarning, isDanger }: TimerDisplayProps) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const formatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "font-mono font-bold text-2xl tabular-nums transition-colors",
        isDanger
          ? "text-red-400 timer-danger"
          : isWarning
          ? "text-yellow-400 timer-warning"
          : "text-white"
      )}
    >
      {formatted}
    </div>
  );
}

// ============================================
// COPY TO CLIPBOARD BUTTON
// ============================================
export function CopyButton({
  text,
  label = "Salin",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        copied
          ? "bg-green-500/20 text-green-400"
          : "bg-[#2A2A4A] text-[#B0B0C0] hover:text-white hover:bg-[#3A3A5A]"
      )}
    >
      {copied ? "✅ Tersalin!" : `📋 ${label}`}
    </button>
  );
}

// ============================================
// SECTION HEADER
// ============================================
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        {subtitle && (
          <p className="text-sm text-[#6B7280] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}