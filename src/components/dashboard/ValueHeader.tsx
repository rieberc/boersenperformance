import { GainPill } from "@/components/dashboard/GainPill";
import { formatEUR } from "@/lib/utils/currency";

export function ValueHeader({
  totalValue,
  totalInvested,
  totalGain,
  totalGainPercent,
  totalRealizedGain,
}: {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  totalRealizedGain: number;
}) {
  const hasRealizedGain = Math.abs(totalRealizedGain) > 0.005;

  return (
    <div>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-muted">Depotwert</p>
        <GainPill percent={totalGainPercent} />
      </div>
      <p className="mt-1 text-4xl font-bold tracking-tight text-navy">{formatEUR(totalValue)}</p>

      <div className={`mt-4 grid gap-4 ${hasRealizedGain ? "grid-cols-3" : "grid-cols-2"}`}>
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
        {hasRealizedGain && (
          <div>
            <p className="text-xs text-muted">Realisiert</p>
            <p
              className={`text-base font-semibold ${totalRealizedGain >= 0 ? "text-accent-dark" : "text-negative"}`}
            >
              {totalRealizedGain >= 0 ? "+" : ""}
              {formatEUR(totalRealizedGain)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
