"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[400] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-sky-950/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`sleek-scrollbar relative max-h-[92vh] w-full ${maxWidth} overflow-y-auto rounded-t-[28px] border border-white/80 bg-white/95 p-5 shadow-sh3 backdrop-blur-2xl animate-soft-fade-in sm:rounded-[24px] sm:p-6`}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-body text-[17px] font-black tracking-tight text-sky-950">{title}</h2>
            {description && <p className="mt-0.5 font-body text-[12.5px] text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-ink-800/70 transition-colors hover:bg-border-base"
            aria-label="বন্ধ করুন"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
