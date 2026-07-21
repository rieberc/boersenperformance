"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNowStrict } from "date-fns";
import { de } from "date-fns/locale";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/ui/Card";
import { ValueHeader } from "@/components/dashboard/ValueHeader";
import { AllocationDonut } from "@/components/dashboard/AllocationDonut";
import { HoldingsList } from "@/components/dashboard/HoldingsList";
import { AddHoldingFab } from "@/components/dashboard/AddHoldingFab";
import { ImportCsvSheet } from "@/components/import/ImportCsvSheet";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import { resolvePresetRange, type DateRangePreset } from "@/lib/utils/dateRange";
import type { PortfolioSummary } from "@/lib/portfolio/summary";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DashboardView({ initialSummary }: { initialSummary: PortfolioSummary }) {
  const [importOpen, setImportOpen] = useState(false);
  const [preset, setPreset] = useState<DateRangePreset>("sinceBuy");
  const [customRange, setCustomRange] = useState(() => ({
    start: toIsoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)),
    end: toIsoDate(new Date()),
  }));

  const { data, isFetching, refetch } = useQuery({
    queryKey: ["portfolio", "summary"],
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

  const earliestTransactionDate = summary.earliestTransactionDate
    ? new Date(summary.earliestTransactionDate)
    : null;
  const range =
    preset === "custom"
      ? { start: new Date(customRange.start), end: new Date(customRange.end) }
      : resolvePresetRange(preset, earliestTransactionDate);
  const rangeStartIso = toIsoDate(range.start);
  const rangeEndIso = toIsoDate(range.end);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-28">
      <header className="safe-top flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-lg font-bold text-navy">Mein Depot</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="CSV importieren"
            onClick={() => setImportOpen(true)}
            className="rounded-full p-2 text-navy hover:bg-black/5"
          >
            ⇪
          </button>
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
            totalRealizedGain={summary.totalRealizedGain}
          />
        </Card>

        <Card className="p-5">
          <AllocationDonut holdings={summary.holdings} totalValue={summary.totalValue} />
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Verlauf</h2>
            <DateRangePicker
              preset={preset}
              onSelect={setPreset}
              customStart={customRange.start}
              customEnd={customRange.end}
              onCustomChange={(start, end) => setCustomRange({ start, end })}
            />
          </div>
          <PerformanceChart start={rangeStartIso} end={rangeEndIso} />

          <div className="my-4 border-t border-border" />

          <h2 className="mb-2 text-sm font-semibold text-navy">Rendite</h2>
          <PerformanceOverview start={rangeStartIso} end={rangeEndIso} />
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between px-3 pt-2">
            <h2 className="text-sm font-semibold text-navy">Positionen</h2>
            <Link href="/dashboard/activity" className="text-xs font-semibold text-accent-dark">
              Aktivitäten →
            </Link>
          </div>
          <div className="px-3">
            <HoldingsList holdings={summary.holdings} />
          </div>
        </Card>
      </main>

      <AddHoldingFab />
      <ImportCsvSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
