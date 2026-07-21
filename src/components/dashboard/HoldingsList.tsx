import { HoldingRow } from "@/components/dashboard/HoldingRow";
import type { HoldingSummary } from "@/lib/portfolio/summary";

export function HoldingsList({ holdings }: { holdings: HoldingSummary[] }) {
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

  return (
    <div className="divide-y divide-border">
      {holdings.map((holding) => (
        <HoldingRow key={holding.symbol} holding={holding} />
      ))}
    </div>
  );
}
