"use client";

import { useState } from "react";
import { GainPill } from "@/components/dashboard/GainPill";
import { WatchlistItemActionsSheet } from "@/components/watchlist/WatchlistItemActionsSheet";
import { formatCurrency } from "@/lib/utils/currency";
import type { WatchlistPerformanceItem } from "@/lib/portfolio/watchlist";

const ASSET_TYPE_LABEL: Record<WatchlistPerformanceItem["assetType"], string> = {
  STOCK: "Aktie",
  ETF: "ETF",
  CRYPTO: "Crypto",
};

export function WatchlistRow({ item, color }: { item: WatchlistPerformanceItem; color: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 py-3 text-left"
      >
        <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-navy">{item.name}</p>
          <p className="text-xs text-muted">
            {ASSET_TYPE_LABEL[item.assetType]} · {item.symbol}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <p className="text-sm font-semibold text-navy">
            {item.currentPrice != null ? formatCurrency(item.currentPrice, item.currency) : "–"}
          </p>
          {item.changePercent != null && <GainPill percent={item.changePercent} />}
        </div>
      </button>

      <WatchlistItemActionsSheet item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
