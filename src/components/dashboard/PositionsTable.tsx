import { PositionsTableRow } from "@/components/dashboard/PositionsTableRow";
import type { HoldingSummary } from "@/lib/portfolio/summary";

export function PositionsTable({ holdings }: { holdings: HoldingSummary[] }) {
  if (holdings.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted">
          Noch keine Position hinterlegt. Tippe unten rechts auf „+“, um dein erstes Investment
          hinzuzufügen.
        </p>
      </div>
    );
  }

  const sorted = [...holdings].sort((a, b) => b.gainPercent - a.gainPercent);

  return (
    <div className="divide-y divide-border">
      {sorted.map((holding) => (
        <PositionsTableRow key={holding.symbol} holding={holding} />
      ))}
    </div>
  );
}
