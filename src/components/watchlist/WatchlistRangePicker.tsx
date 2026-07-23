"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { PRESET_LABELS, type DateRangePreset } from "@/lib/utils/dateRange";

const PRESETS: DateRangePreset[] = ["7d", "30d", "3m", "6m", "1y"];

export function WatchlistRangePicker({
  preset,
  onSelect,
}: {
  preset: DateRangePreset;
  onSelect: (preset: DateRangePreset) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold text-navy"
      >
        {PRESET_LABELS[preset]}
        <span className="text-xs">⌄</span>
      </button>

      {open && (
        <>
          <button
            aria-label="Schließen"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  onSelect(p);
                  setOpen(false);
                }}
                className={clsx(
                  "block w-full px-4 py-2 text-left text-sm hover:bg-background",
                  p === preset ? "font-semibold text-accent-dark" : "text-navy",
                )}
              >
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
