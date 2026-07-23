"use client";

import { useState } from "react";
import { clsx } from "clsx";
import type { TransactionType } from "@/generated/prisma/client";

export const ALL_TRANSACTION_TYPES: TransactionType[] = ["BUY", "SELL", "DIVIDEND"];

const TYPE_LABELS: Record<TransactionType, string> = {
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende",
};

export function TransactionTypeFilter({
  selected,
  onChange,
}: {
  selected: Set<TransactionType>;
  onChange: (next: Set<TransactionType>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<TransactionType>>(selected);

  function handleOpen() {
    setDraft(new Set(selected));
    setOpen(true);
  }

  function toggle(type: TransactionType) {
    const next = new Set(draft);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setDraft(next);
  }

  function apply() {
    onChange(draft.size > 0 ? draft : new Set(ALL_TRANSACTION_TYPES));
    setOpen(false);
  }

  function clearFilter() {
    onChange(new Set(ALL_TRANSACTION_TYPES));
    setOpen(false);
  }

  const isFiltered = selected.size > 0 && selected.size < ALL_TRANSACTION_TYPES.length;
  const label = isFiltered ? [...selected].map((t) => TYPE_LABELS[t]).join(", ") : "Typ";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={clsx(
          "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold",
          isFiltered ? "border-accent text-accent-dark" : "border-border text-navy",
        )}
      >
        {label}
        <span className="text-xs">⚟</span>
      </button>

      {open && (
        <>
          <button aria-label="Schließen" className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-white p-3 shadow-lg">
            <div className="flex flex-col gap-2">
              {ALL_TRANSACTION_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={draft.has(type)}
                    onChange={() => toggle(type)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  {TYPE_LABELS[type]}
                </label>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={apply}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white"
              >
                Anwenden
              </button>
              <button type="button" onClick={clearFilter} className="text-xs font-medium text-muted underline">
                Filter löschen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
