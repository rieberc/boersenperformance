"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GainPill } from "@/components/dashboard/GainPill";
import { deleteHoldingAction } from "@/lib/actions/holdings";
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
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleDelete() {
    startTransition(async () => {
      await deleteHoldingAction(holding.id);
      await queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
    });
  }

  return (
    <div className="flex items-center gap-3 py-3">
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

      <button
        type="button"
        aria-label="Position löschen"
        disabled={isPending}
        onClick={handleDelete}
        className="ml-1 shrink-0 rounded-full p-2 text-muted hover:bg-black/5 disabled:opacity-40"
      >
        ✕
      </button>
    </div>
  );
}
