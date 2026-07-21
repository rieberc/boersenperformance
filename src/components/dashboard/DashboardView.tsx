"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { de } from "date-fns/locale";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { ValueHeader } from "@/components/dashboard/ValueHeader";
import { AllocationDonut } from "@/components/dashboard/AllocationDonut";
import { HoldingsList } from "@/components/dashboard/HoldingsList";
import { AddHoldingFab } from "@/components/dashboard/AddHoldingFab";
import type { PortfolioSummary } from "@/lib/portfolio/summary";

export function DashboardView({ initialSummary }: { initialSummary: PortfolioSummary }) {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["portfolio-summary"],
    queryFn: async (): Promise<PortfolioSummary> => {
      const res = await fetch("/api/portfolio/summary");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      return res.json();
    },
    initialData: initialSummary,
  });

  const summary = data ?? initialSummary;

  const priceTimestamps = summary.holdings
    .map((h) => h.priceUpdatedAt)
    .filter((value): value is string => value != null)
    .map((value) => new Date(value).getTime());
  const oldestUpdate = priceTimestamps.length > 0 ? Math.min(...priceTimestamps) : null;
  const hasStalePrices = summary.holdings.some((h) => h.stalePrice);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-28">
      <header className="safe-top flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-lg font-bold text-navy">Mein Depot</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Aktualisieren"
            onClick={() => refetch()}
            className="rounded-full p-2 text-navy hover:bg-black/5"
          >
            <span className={isFetching ? "inline-block animate-spin" : ""}>⟳</span>
          </button>
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label="Abmelden"
              className="rounded-full p-2 text-navy hover:bg-black/5"
            >
              ⏻
            </button>
          </form>
        </div>
      </header>

      {oldestUpdate && (
        <p className="px-5 pb-2 text-xs text-muted">
          Kurse aktualisiert vor {formatDistanceToNowStrict(oldestUpdate, { locale: de })}
        </p>
      )}

      <main className="flex flex-col gap-4 px-5">
        {hasStalePrices && (
          <Card className="border-negative/30 bg-negative-soft p-3 text-sm text-negative">
            Für manche Positionen konnte kein aktueller Kurs geladen werden. Es wird vorübergehend
            der Kaufkurs angezeigt.
          </Card>
        )}

        <Card className="p-5">
          <ValueHeader
            totalValue={summary.totalValue}
            totalInvested={summary.totalInvested}
            totalGain={summary.totalGain}
            totalGainPercent={summary.totalGainPercent}
          />
        </Card>

        <Card className="p-5">
          <AllocationDonut holdings={summary.holdings} totalValue={summary.totalValue} />
        </Card>

        <Card className="p-2">
          <div className="px-3 pt-2">
            <h2 className="text-sm font-semibold text-navy">Positionen</h2>
          </div>
          <div className="px-3">
            <HoldingsList holdings={summary.holdings} />
          </div>
        </Card>
      </main>

      <AddHoldingFab />
    </div>
  );
}
