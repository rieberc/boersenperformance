"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="safe-bottom relative z-10 flex max-h-[90dvh] w-full flex-col rounded-t-3xl bg-card p-5 shadow-xl sm:max-w-md sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button
            type="button"
            aria-label="Schließen"
            onClick={onClose}
            className="rounded-full p-2 text-muted hover:bg-black/5"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
