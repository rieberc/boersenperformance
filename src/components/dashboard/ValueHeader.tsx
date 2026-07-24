import { GainPill } from "@/components/dashboard/GainPill";
import { formatEUR } from "@/lib/utils/currency";

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function ValueHeader({
  totalValue,
  totalInvested,
  totalGain,
  totalGainPercent,
  totalRealizedGain,
  izf,
}: {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  totalRealizedGain: number;
  izf?: number | null;
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-muted">Depotwert</p>
        <GainPill percent={totalGainPercent} />
      </div>
      <p className="mt-1 text-4xl font-bold tracking-tight text-navy">{formatEUR(totalValue)}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        <div>
          <p className="text-xs text-muted">Kursgewinn</p>
          <p className={`text-base font-semibold ${totalGain >= 0 ? "text-accent-dark" : "text-negative"}`}>
            {totalGain >= 0 ? "+" : ""}
            {formatEUR(totalGain)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Investiert</p>
          <p className="text-base font-semibold text-navy">{formatEUR(totalInvested)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">IZF</p>
          <p
            className={`text-base font-semibold ${izf == null ? "text-navy" : izf >= 0 ? "text-accent-dark" : "text-negative"}`}
          >
            {izf != null ? formatPercent(izf) : "–"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Realisiert</p>
          <p
            className={`text-base font-semibold ${totalRealizedGain >= 0 ? "text-accent-dark" : "text-negative"}`}
          >
            {totalRealizedGain >= 0 ? "+" : ""}
            {formatEUR(totalRealizedGain)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <p className="text-sm font-semibold text-navy">Gewinn</p>
        <p className={`text-base font-bold ${totalGain + totalRealizedGain >= 0 ? "text-accent-dark" : "text-negative"}`}>
          {totalGain + totalRealizedGain >= 0 ? "+" : ""}
          {formatEUR(totalGain + totalRealizedGain)}
        </p>
      </div>
    </div>
  );
}
