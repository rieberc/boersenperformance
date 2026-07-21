"use client";

import { clsx } from "clsx";
import type { AssetType } from "@/generated/prisma/client";

const OPTIONS: { value: AssetType; label: string }[] = [
  { value: "ETF", label: "ETF" },
  { value: "STOCK", label: "Aktie" },
  { value: "CRYPTO", label: "Crypto" },
];

export function AssetTypeToggle({
  value,
  onChange,
}: {
  value: AssetType;
  onChange: (value: AssetType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-background p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={clsx(
            "rounded-lg py-2 text-sm font-semibold transition",
            value === option.value ? "bg-navy text-white" : "text-navy hover:bg-black/5",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
