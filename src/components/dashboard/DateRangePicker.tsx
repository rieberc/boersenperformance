"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { PRESET_LABELS, type DateRangePreset } from "@/lib/utils/dateRange";

const GROUPS: DateRangePreset[][] = [
  ["today", "7d", "30d", "3m", "6m", "1y", "3y"],
  ["mtd", "ytd"],
  ["sinceBuy", "custom"],
];

export function DateRangePicker({
  preset,
  onSelect,
  customStart,
  customEnd,
  onCustomChange,
}: {
  preset: DateRangePreset;
  onSelect: (preset: DateRangePreset) => void;
  customStart: string;
  customEnd: string;
  onCustomChange: (start: string, end: string) => void;
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
          <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-lg">
            {GROUPS.map((group, i) => (
              <div key={i} className={i > 0 ? "border-t border-border py-1" : "py-1"}>
                {group.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onSelect(p);
                      if (p !== "custom") setOpen(false);
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
            ))}

            {preset === "custom" && (
              <div className="flex flex-col gap-2 border-t border-border p-3">
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => onCustomChange(e.target.value, customEnd)}
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => onCustomChange(customStart, e.target.value)}
                  className="rounded-lg border border-border px-2 py-1.5 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-navy px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Übernehmen
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
