import { formatEUR } from "@/lib/utils/currency";
import type { ClosedPositionSummary } from "@/lib/portfolio/summary";

const ASSET_TYPE_LABEL: Record<ClosedPositionSummary["assetType"], string> = {
  STOCK: "Aktie",
  ETF: "ETF",
  CRYPTO: "Crypto",
  CASH: "Zinsen",
};

const ASSET_TYPE_COLOR: Record<ClosedPositionSummary["assetType"], string> = {
  STOCK: "bg-navy",
  ETF: "bg-accent",
  CRYPTO: "bg-amber-500",
  CASH: "bg-slate-500",
};

export function ClosedPositionsList({ positions }: { positions: ClosedPositionSummary[] }) {
  if (positions.length === 0) return null;

  return (
    <div className="divide-y divide-border">
      {positions.map((p) => (
        <div key={p.symbol} className="flex items-center gap-3 py-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${ASSET_TYPE_COLOR[p.assetType]}`}
          >
            {p.name.slice(0, 1).toUpperCase()}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy">{p.name}</p>
            <p className="text-xs text-muted">{ASSET_TYPE_LABEL[p.assetType]}</p>
          </div>

          <div className="flex flex-col items-end gap-1 text-right">
            <p className="text-xs text-muted">
              Realisiert{" "}
              <span className={`font-semibold ${p.realizedGain >= 0 ? "text-accent-dark" : "text-negative"}`}>
                {p.realizedGain >= 0 ? "+" : ""}
                {formatEUR(p.realizedGain)} · {p.realizedGainPercent >= 0 ? "+" : ""}
                {p.realizedGainPercent.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%
              </span>
            </p>
            <p className="text-xs text-muted">
              Dividenden{" "}
              <span className="font-semibold text-navy">
                {formatEUR(p.dividends)} · {p.dividendPercent.toLocaleString("de-DE", { maximumFractionDigits: 1 })}%
              </span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
