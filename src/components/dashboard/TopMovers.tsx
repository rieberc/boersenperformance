import { GainPill } from "@/components/dashboard/GainPill";
import { formatEUR } from "@/lib/utils/currency";
import type { HoldingSummary } from "@/lib/portfolio/summary";

const ASSET_TYPE_COLOR: Record<HoldingSummary["assetType"], string> = {
  STOCK: "bg-navy",
  ETF: "bg-accent",
  CRYPTO: "bg-amber-500",
};

function MoverList({ holdings }: { holdings: HoldingSummary[] }) {
  return (
    <div className="divide-y divide-border">
      {holdings.map((h) => {
        const pricePerUnit = h.quantity > 0 ? h.currentValue / h.quantity : 0;
        return (
          <div key={h.symbol} className="flex items-center gap-3 py-2.5">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${ASSET_TYPE_COLOR[h.assetType]}`}
            >
              {h.name.slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{h.name}</p>
              <p className="text-xs text-muted">{formatEUR(pricePerUnit)}</p>
            </div>

            <div className="flex flex-col items-end gap-1">
              <GainPill percent={h.gainPercent} />
              <p className={`text-xs font-medium ${h.gain >= 0 ? "text-accent-dark" : "text-negative"}`}>
                {h.gain >= 0 ? "+" : ""}
                {formatEUR(h.gain)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TopMovers({ holdings }: { holdings: HoldingSummary[] }) {
  const priced = holdings.filter((h) => h.quantity > 0 && h.currentPrice != null);
  const movers = [...priced].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, 3);
  const worst = [...priced]
    .sort((a, b) => a.gainPercent - b.gainPercent)
    .slice(0, 3)
    .filter((h) => !movers.some((m) => m.symbol === h.symbol));

  if (movers.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy">Top Mover</h2>
          <span className="flex items-center gap-1 text-xs font-semibold text-accent-dark">↑ Gewinner</span>
        </div>
        <MoverList holdings={movers} />
      </div>

      {worst.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Worst Mover</h2>
            <span className="flex items-center gap-1 text-xs font-semibold text-negative">↓ Verlierer</span>
          </div>
          <MoverList holdings={worst} />
        </div>
      )}
    </div>
  );
}
