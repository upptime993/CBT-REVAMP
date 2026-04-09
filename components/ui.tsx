"use client";

import React, { useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronDown,
  Check,
  AlertCircle,
  Info,
  Loader2,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";

// ============================================
// BUTTON
// ============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "teal" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    teal: "btn-teal",
    danger: "btn-danger",
    ghost: "btn-ghost",
    outline:
      "btn bg-transparent border border-[#2A2A4A] text-white hover:bg-[#1A1A2E]",
  }[variant];

  const sizeClass = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  }[size];

  return (
    <button
      className={cn(
        "btn",
        variantClass,
        sizeClass,
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// ============================================
// INPUT
// ============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  type,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {leftIcon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            "input",
            leftIcon && "pl-10",
            (rightIcon || isPassword) && "pr-10",
            error && "input-error",
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-[#6B7280] flex items-center gap-1">
          <Info className="w-3 h-3" />
          {hint}
        </p>
      )}
    </div>
  );
}

// ============================================
// TEXTAREA
// ============================================
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({
  label,
  error,
  hint,
  className,
  ...props
}: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="form-label">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={cn(
          "input resize-none min-h-[100px]",
          error && "input-error",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-xs text-[#6B7280]">{hint}</p>
      )}
    </div>
  );
}

// ============================================
// SELECT
// ============================================
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled,
  required,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="w-full" ref={ref}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setOpen(!open)}
          className={cn(
            "input text-left flex items-center justify-between",
            !selected && "text-[#6B7280]",
            error && "input-error",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span>{selected?.label || placeholder}</span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-[#6B7280] transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-1 bg-[#1A1A2E] border border-[#2A2A4A] rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    onChange?.(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-[#16213E] cursor-pointer",
                    value === opt.value
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-white"
                  )}
                >
                  {opt.label}
                  {value === opt.value && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================
// MODAL
// ============================================
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnOverlay?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  closeOnOverlay = true,
}: ModalProps) {
  const sizeClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  }[size];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeOnOverlay ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "relative w-full bg-[#1A1A2E] border border-[#2A2A4A] rounded-2xl shadow-2xl",
              sizeClass
            )}
          >
            {title && (
              <div className="flex items-center justify-between p-5 border-b border-[#2A2A4A]">
                <h2 className="text-lg font-bold">{title}</h2>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[#16213E] transition-colors text-[#6B7280] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// CONFIRM MODAL
// ============================================
interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary" | "teal";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Lanjutkan",
  cancelText = "Batal",
  variant = "danger",
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-[#B0B0C0] text-sm mb-5">{message}</p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          fullWidth
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          fullWidth
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}

// ============================================
// BADGE
// ============================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = "default",
  className,
  dot,
}: BadgeProps) {
  const variantClass = {
    default: "bg-[#2A2A4A] text-[#B0B0C0]",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    danger: "bg-red-500/20 text-red-400",
    info: "bg-cyan-500/20 text-cyan-400",
    purple: "bg-purple-500/20 text-purple-400",
  }[variant];

  return (
    <span className={cn("badge", variantClass, className)}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            {
              default: "bg-gray-400",
              success: "bg-green-400",
              warning: "bg-yellow-400",
              danger: "bg-red-400",
              info: "bg-cyan-400",
              purple: "bg-purple-400",
            }[variant]
          )}
        />
      )}
      {children}
    </span>
  );
}

// ============================================
// SKELETON LOADER
// ============================================
interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "skeleton h-4",
              i === lines - 1 && "w-3/4",
              className
            )}
          />
        ))}
      </div>
    );
  }
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

// ============================================
// CARD
// ============================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  gradient?: "purple" | "teal" | "cyan" | "orange" | "red" | "green";
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className,
  hover,
  onClick,
  gradient,
  padding = "md",
}: CardProps) {
  const paddingClass = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  }[padding];

  const gradientClass = gradient
    ? {
        purple: "gradient-purple",
        teal: "gradient-teal",
        cyan: "gradient-cyan",
        orange: "gradient-orange",
        red: "gradient-red",
        green: "gradient-green",
      }[gradient]
    : "bg-[#1A1A2E] border border-[#2A2A4A]";

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-2xl overflow-hidden",
        paddingClass,
        gradientClass,
        hover && "card-hover cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// TABS
// ============================================
interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex gap-1 bg-[#1A1A2E] p-1 rounded-xl border border-[#2A2A4A]",
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 justify-center",
            active === tab.id
              ? "bg-purple-600 text-white shadow-lg"
              : "text-[#6B7280] hover:text-white hover:bg-[#16213E]"
          )}
        >
          {tab.icon}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                active === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-[#2A2A4A] text-[#B0B0C0]"
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="text-[#2A2A4A] mb-4 opacity-60">{icon}</div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-[#6B7280] text-sm mb-6 max-w-xs">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================
interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  const sizeClass = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }[size];

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2
        className={cn("animate-spin text-purple-500", sizeClass)}
      />
    </div>
  );
}

// ============================================
// SEARCH BAR
// ============================================
interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Cari...",
  className,
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// PROGRESS BAR
// ============================================
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  color?: "purple" | "teal" | "green" | "red" | "orange";
  showLabel?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  color = "purple",
  showLabel = false,
  size = "md",
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));

  const colorClass = {
    purple: "bg-purple-500",
    teal: "bg-teal-400",
    green: "bg-green-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
  }[color];

  const heightClass = size === "sm" ? "h-1.5" : "h-2.5";

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-[#B0B0C0] mb-1">
          <span>Progress</span>
          <span>{pct}%</span>
        </div>
      )}
      <div
        className={cn("w-full bg-[#2A2A4A] rounded-full overflow-hidden", heightClass)}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={cn("h-full rounded-full", colorClass)}
        />
      </div>
    </div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: "purple" | "teal" | "cyan" | "orange" | "red" | "green";
  onClick?: () => void;
  trend?: { value: number; label: string };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  onClick,
  trend,
}: StatCardProps) {
  const gradientClass = {
    purple: "from-purple-600/20 to-purple-600/5 border-purple-500/20",
    teal: "from-teal-500/20 to-teal-500/5 border-teal-500/20",
    cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
    orange: "from-orange-500/20 to-orange-500/5 border-orange-500/20",
    red: "from-red-500/20 to-red-500/5 border-red-500/20",
    green: "from-green-500/20 to-green-500/5 border-green-500/20",
  }[gradient];

  const iconBgClass = {
    purple: "bg-purple-500/20 text-purple-400",
    teal: "bg-teal-500/20 text-teal-400",
    cyan: "bg-cyan-500/20 text-cyan-400",
    orange: "bg-orange-500/20 text-orange-400",
    red: "bg-red-500/20 text-red-400",
    green: "bg-green-500/20 text-green-400",
  }[gradient];

  return (
    <motion.div
      whileHover={onClick ? { y: -3, scale: 1.01 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={cn(
        "bg-gradient-to-br border rounded-2xl p-5 relative overflow-hidden",
        gradientClass,
        onClick && "cursor-pointer"
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-5">
        <div className="w-full h-full rounded-full bg-white transform translate-x-8 -translate-y-8" />
      </div>

      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2.5 rounded-xl", iconBgClass)}>{icon}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-lg",
              trend.value >= 0
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            )}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}%
          </span>
        )}
      </div>

      <p className="text-[#B0B0C0] text-xs font-medium uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>
      )}
    </motion.div>
  );
}

// ============================================
// TOGGLE / SWITCH
// ============================================
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <motion.div
          className={cn(
            "w-11 h-6 rounded-full transition-colors duration-200",
            checked ? "bg-purple-600" : "bg-[#2A2A4A]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <motion.div
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-[#B0B0C0]">{label}</span>
      )}
    </label>
  );
}

// ============================================
// ALERT
// ============================================
interface AlertProps {
  type: "info" | "success" | "warning" | "error";
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type, title, message, onClose, className }: AlertProps) {
  const config = {
    info: {
      bg: "bg-cyan-500/10 border-cyan-500/30",
      text: "text-cyan-400",
      icon: <Info className="w-5 h-5" />,
    },
    success: {
      bg: "bg-green-500/10 border-green-500/30",
      text: "text-green-400",
      icon: <Check className="w-5 h-5" />,
    },
    warning: {
      bg: "bg-yellow-500/10 border-yellow-500/30",
      text: "text-yellow-400",
      icon: <AlertCircle className="w-5 h-5" />,
    },
    error: {
      bg: "bg-red-500/10 border-red-500/30",
      text: "text-red-400",
      icon: <AlertCircle className="w-5 h-5" />,
    },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border",
        config.bg,
        className
      )}
    >
      <div className={cn("mt-0.5 flex-shrink-0", config.text)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn("font-semibold text-sm mb-0.5", config.text)}>
            {title}
          </p>
        )}
        <p className="text-sm text-[#B0B0C0]">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-[#6B7280] hover:text-white transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// ============================================
// PAGINATION
// ============================================
interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center gap-2 justify-center">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A4A] text-[#B0B0C0] hover:text-white hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ‹
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "w-9 h-9 rounded-lg text-sm font-medium transition-all",
            p === page
              ? "bg-purple-600 text-white"
              : "bg-[#1A1A2E] border border-[#2A2A4A] text-[#B0B0C0] hover:text-white hover:border-purple-500"
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="p-2 rounded-lg bg-[#1A1A2E] border border-[#2A2A4A] text-[#B0B0C0] hover:text-white hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ›
      </button>
    </div>
  );
}