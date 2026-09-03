"use client";

import { useState, type ReactNode } from "react";
import type { ClientStatus } from "@/lib/types";
import { CLIENT_STATUS_LABEL } from "@/lib/types";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
      <div>
        <h1 className="font-display text-xl font-medium text-text">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-text-muted">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: ClientStatus }) {
  const attention = status === "starting" || status === "closing";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide"
      style={{
        background: attention ? "var(--warn-soft)" : "var(--accent-soft)",
        color: attention ? "var(--warn)" : "var(--accent-strong)",
      }}
    >
      {CLIENT_STATUS_LABEL[status]}
    </span>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-border bg-surface ${
        onClick ? "active:bg-surface-raised" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <p className="text-sm text-text-faint">{label}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div
        className="h-5 w-5 animate-spin rounded-full border-2 border-border-strong"
        style={{ borderTopColor: "var(--accent)" }}
      />
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  type?: string;
}) {
  const shared =
    "w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-[15px] text-text placeholder:text-text-faint focus:outline-none focus:border-accent";
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium tracking-wide text-text-muted">
        {label}
      </span>
      {multiline ? (
        <textarea
          className={`${shared} min-h-[84px] resize-none`}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={shared}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium tracking-wide text-text-muted">
        {label}
      </span>
      <select
        className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-[15px] text-text focus:outline-none focus:border-accent"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl px-4 py-3 text-[15px] font-medium transition-opacity active:opacity-80 disabled:opacity-50"
      style={{ background: "var(--accent)", color: "var(--accent-on)" }}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-border px-4 py-3 text-[15px] font-medium text-text-muted transition-colors active:bg-surface-raised"
    >
      {children}
    </button>
  );
}

export function FAB({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
      style={{
        right: "20px",
        bottom: "calc(88px + var(--safe-bottom))",
        background: "var(--accent)",
        color: "var(--accent-on)",
      }}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl border-t border-border bg-surface"
        style={{ paddingBottom: "var(--safe-bottom)" }}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-display text-lg font-medium text-text">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-text-faint active:bg-surface-raised"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/55" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-xs rounded-2xl border border-border bg-surface p-5">
        <h3 className="font-display text-base font-medium text-text">{title}</h3>
        {body && <p className="mt-1.5 text-[13px] text-text-muted">{body}</p>}
        <div className="mt-5 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-text-muted active:bg-surface-raised"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium active:opacity-80"
            style={{ background: "var(--danger)", color: "#1a0f0c" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const [target, setTarget] = useState<(() => void) | null>(null);
  return {
    open: target !== null,
    ask: (fn: () => void) => setTarget(() => fn),
    cancel: () => setTarget(null),
    confirm: () => {
      target?.();
      setTarget(null);
    },
  };
}

export function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="text-text-faint transition-transform"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
