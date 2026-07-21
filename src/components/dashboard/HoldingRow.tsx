"use client";

import { useState } from "react";
import { GainPill } from "@/components/dashboard/GainPill";
import { PositionActionsSheet } from "@/components/holdings/PositionActionsSheet";
import { formatEUR } from "@/lib/utils/currency";
import type { HoldingSummary } from "@/lib/portfolio/summary";

const ASSET_TYPE_LABEL: Record<HoldingSummary["assetType"], string> = {
  STOCK: "Aktie",
  ETF: "ETF",
  CRYPTO: "Crypto",
};

const ASSET_TYPE_COLOR: Record<HoldingSummary["assetType"], string> = {
  STOCK: "bg-navy",
  ETF: "bg-accent",
  CRYPTO: "bg-amber-500",
};

export function HoldingRow({ holding }: { holding: HoldingSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${ASSET_TYPE_COLOR[holding.assetType]}`}
        >
          {holding.name.slice(0, 1).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{holding.name}</p>
          <p className="text-xs text-muted">
            {ASSET_TYPE_LABEL[holding.assetType]} · {holding.quantity} Stk.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-semibold text-navy">{formatEUR(holding.currentValue)}</p>
          <GainPill percent={holding.gainPercent} />
        </div>
      </button>

      <PositionActionsSheet holding={holding} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
