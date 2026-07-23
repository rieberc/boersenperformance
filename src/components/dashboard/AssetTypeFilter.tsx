"use client";

import { useState } from "react";
import { clsx } from "clsx";

export type AssetGroup = "securities" | "crypto";

export const ALL_ASSET_GROUPS: AssetGroup[] = ["securities", "crypto"];

const GROUP_LABELS: Record<AssetGroup, string> = {
  securities: "Wertpapiere",
  crypto: "Kryptowährungen",
};

export function AssetTypeFilter({
  selected,
  onChange,
}: {
  selected: Set<AssetGroup>;
  onChange: (next: Set<AssetGroup>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Set<AssetGroup>>(selected);

  function handleOpen() {
    setDraft(new Set(selected));
    setOpen(true);
  }

  function toggle(group: AssetGroup) {
    const next = new Set(draft);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setDraft(next);
  }

  function apply() {
    onChange(draft.size > 0 ? draft : new Set(ALL_ASSET_GROUPS));
    setOpen(false);
  }

  function clearFilter() {
    onChange(new Set(ALL_ASSET_GROUPS));
    setOpen(false);
  }

  const isFiltered = selected.size > 0 && selected.size < ALL_ASSET_GROUPS.length;
  const label = isFiltered
    ? [...selected].map((g) => GROUP_LABELS[g]).join(", ")
    : "Wertpapiere";

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
          <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-white p-3 shadow-lg">
            <div className="flex flex-col gap-2">
              {ALL_ASSET_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={draft.has(group)}
                    onChange={() => toggle(group)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  {GROUP_LABELS[group]}
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
