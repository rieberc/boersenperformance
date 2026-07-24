"use client";

import { useState } from "react";
import { GainPill } from "@/components/dashboard/GainPill";
import { AllocationRing } from "@/components/dashboard/AllocationRing";
import { PositionActionsSheet } from "@/components/holdings/PositionActionsSheet";
import { formatCurrency, formatEUR } from "@/lib/utils/currency";
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

function formatSignedEUR(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatEUR(value)}`;
}

function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium tracking-wide text-muted uppercase">{label}</span>
      <span
        className={`text-xs font-semibold ${
          tone === "positive" ? "text-accent-dark" : tone === "negative" ? "text-negative" : "text-navy"
        }`}
      >
        {value}
      </span>
      {sub && <span className="text-[11px] text-muted">{sub}</span>}
    </div>
  );
}

export function PositionsTableRow({ holding }: { holding: HoldingSummary }) {
  const [open, setOpen] = useState(false);
  const hasDividends = holding.dividends > 1e-9;
  const hasRealized = Math.abs(holding.realizedGain) > 1e-9;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full flex-col gap-2 py-3 text-left"
      >
        <div className="flex w-full items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${ASSET_TYPE_COLOR[holding.assetType]}`}
          >
            {holding.name.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{holding.name}</p>
            <p className="text-xs text-muted">
              {ASSET_TYPE_LABEL[holding.assetType]} · {holding.symbol}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-sm font-semibold text-navy">{formatEUR(holding.currentValue)}</p>
            <GainPill percent={holding.gainPercent} />
            <p className={`text-xs font-medium ${holding.gain >= 0 ? "text-accent-dark" : "text-negative"}`}>
              {holding.gain >= 0 ? "+" : ""}
              {formatEUR(holding.gain)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-x-4 gap-y-2 pl-[52px]">
          <Stat
            label="Einstieg"
            value={formatEUR(holding.investedValue)}
            sub={formatCurrency(holding.avgPrice, holding.currency)}
          />
          <Stat
            label="Bestand"
            value={`${holding.quantity.toLocaleString("de-DE", { maximumFractionDigits: 4 })}x`}
            sub={holding.currentPrice != null ? formatCurrency(holding.currentPrice, holding.currency) : "–"}
          />
          {hasDividends && (
            <Stat
              label="Dividenden"
              value={formatEUR(holding.dividends)}
              sub={`${holding.dividendPercent.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%`}
              tone="positive"
            />
          )}
          {hasRealized && (
            <Stat
              label="Realisiert"
              value={formatSignedEUR(holding.realizedGain)}
              sub={`${holding.realizedGainPercent >= 0 ? "+" : ""}${holding.realizedGainPercent.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%`}
              tone={holding.realizedGain >= 0 ? "positive" : "negative"}
            />
          )}
          <Stat
            label="Allokation"
            value={
              <span className="flex items-center gap-1.5">
                <AllocationRing percent={holding.allocationPercent} size={16} />
                {holding.allocationPercent.toLocaleString("de-DE", { maximumFractionDigits: 2 })}%
              </span>
            }
          />
        </div>
      </button>

      <PositionActionsSheet holding={holding} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
