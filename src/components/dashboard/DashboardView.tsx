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
import { TopMovers } from "@/components/dashboard/TopMovers";
import { ClosedPositionsList } from "@/components/dashboard/ClosedPositionsList";
import { AddHoldingFab } from "@/components/dashboard/AddHoldingFab";
import { ImportCsvSheet } from "@/components/import/ImportCsvSheet";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { DrawdownChart } from "@/components/dashboard/DrawdownChart";
import { PerformanceOverview } from "@/components/dashboard/PerformanceOverview";
import {
  AssetTypeFilter,
  ALL_ASSET_GROUPS,
  assetGroupsToTypesParam,
  toAssetGroup,
  type AssetGroup,
} from "@/components/dashboard/AssetTypeFilter";
import { resolvePresetRange, type DateRangePreset } from "@/lib/utils/dateRange";
import type { PortfolioSummary } from "@/lib/portfolio/summary";
import type { PerformanceOverview as PerformanceOverviewData } from "@/lib/portfolio/performance";

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
  const [assetGroups, setAssetGroups] = useState<Set<AssetGroup>>(new Set(ALL_ASSET_GROUPS));
  const [chartTab, setChartTab] = useState<"value" | "drawdown">("value");

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
  const typesParam = assetGroupsToTypesParam(assetGroups);

  // Same queryKey/queryFn as PerformanceOverview so TanStack Query dedupes
  // this into a single request when both are mounted.
  const { data: performance } = useQuery({
    queryKey: ["portfolio", "performance", rangeStartIso, rangeEndIso, typesParam ?? null],
    queryFn: async (): Promise<PerformanceOverviewData> => {
      const url = typesParam
        ? `/api/portfolio/performance?start=${rangeStartIso}&end=${rangeEndIso}&types=${typesParam}`
        : `/api/portfolio/performance?start=${rangeStartIso}&end=${rangeEndIso}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      return res.json();
    },
  });

  const isAssetFiltered = assetGroups.size < ALL_ASSET_GROUPS.length;
  const filteredHoldings = isAssetFiltered
    ? summary.holdings.filter((h) => assetGroups.has(toAssetGroup(h.assetType)))
    : summary.holdings;

  const filteredTotalValue = isAssetFiltered
    ? filteredHoldings.reduce((sum, h) => sum + h.currentValue, 0)
    : summary.totalValue;
  const filteredTotalInvested = isAssetFiltered
    ? filteredHoldings.reduce((sum, h) => sum + h.investedValue, 0)
    : summary.totalInvested;
  const filteredTotalGain = filteredTotalValue - filteredTotalInvested;
  const filteredTotalGainPercent = filteredTotalInvested > 0 ? (filteredTotalGain / filteredTotalInvested) * 100 : 0;

  const filteredClosedPositions = isAssetFiltered
    ? summary.closedPositions.filter((p) => assetGroups.has(toAssetGroup(p.assetType)))
    : summary.closedPositions;

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-28">
      <header className="safe-top flex items-center justify-between px-5 pt-6 pb-2">
        <h1 className="text-lg font-bold text-navy">Mein Depot</h1>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/watchlist"
            aria-label="Watchlist"
            className="rounded-full p-2 text-navy hover:bg-black/5"
          >
            ★
          </Link>
          <button
            type="button"
            aria-label="CSV importieren"
            onClick={() => setImportOpen(true)}
            className="rounded-full p-2 text-navy hover:bg-black/5"
          >
            ⇪
          </button>
          <a
            href="/api/portfolio/export"
            aria-label="Als Excel exportieren"
            className="rounded-full p-2 text-navy hover:bg-black/5"
          >
            ⇩
          </a>
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

        <div className="flex justify-end">
          <AssetTypeFilter selected={assetGroups} onChange={setAssetGroups} />
        </div>

        <Card className="p-5">
          <ValueHeader
            totalValue={filteredTotalValue}
            totalInvested={filteredTotalInvested}
            totalGain={filteredTotalGain}
            totalGainPercent={filteredTotalGainPercent}
            totalRealizedGain={performance?.realisiertBrutto ?? (isAssetFiltered ? 0 : summary.totalRealizedGain)}
            izf={performance?.izf}
          />
        </Card>

        <Card className="p-5">
          <AllocationDonut holdings={filteredHoldings} totalValue={filteredTotalValue} />
        </Card>

        {filteredHoldings.some((h) => h.quantity > 0 && h.currentPrice != null) && (
          <Card className="p-5">
            <TopMovers holdings={filteredHoldings} />
          </Card>
        )}

        <Card className="p-5">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setChartTab("value")}
                className={`border-b-2 pb-2 text-sm font-semibold ${
                  chartTab === "value" ? "border-accent text-accent-dark" : "border-transparent text-muted"
                }`}
              >
                Wertentwicklung
              </button>
              <button
                type="button"
                onClick={() => setChartTab("drawdown")}
                className={`border-b-2 pb-2 text-sm font-semibold ${
                  chartTab === "drawdown" ? "border-accent text-accent-dark" : "border-transparent text-muted"
                }`}
              >
                Drawdown
              </button>
            </div>
            <DateRangePicker
              preset={preset}
              onSelect={setPreset}
              customStart={customRange.start}
              customEnd={customRange.end}
              onCustomChange={(start, end) => setCustomRange({ start, end })}
            />
          </div>

          <div className="mb-3 border-b border-border" />

          {chartTab === "value" ? (
            <PerformanceChart start={rangeStartIso} end={rangeEndIso} types={typesParam} />
          ) : (
            <DrawdownChart start={rangeStartIso} end={rangeEndIso} types={typesParam} />
          )}

          <div className="my-4 border-t border-border" />

          <h2 className="mb-2 text-sm font-semibold text-navy">Rendite</h2>
          <PerformanceOverview start={rangeStartIso} end={rangeEndIso} types={typesParam} />
        </Card>

        <Card className="p-2">
          <div className="flex items-center justify-between px-3 pt-2">
            <h2 className="text-sm font-semibold text-navy">Positionen</h2>
            <Link href="/dashboard/activity" className="text-xs font-semibold text-accent-dark">
              Aktivitäten →
            </Link>
          </div>
          <div className="px-3">
            <HoldingsList holdings={filteredHoldings} />
          </div>
        </Card>

        {filteredClosedPositions.length > 0 && (
          <Card className="p-2">
            <div className="px-3 pt-2">
              <h2 className="text-sm font-semibold text-navy">Verkaufte Wertpapiere</h2>
            </div>
            <div className="px-3">
              <ClosedPositionsList positions={filteredClosedPositions} />
            </div>
          </Card>
        )}
      </main>

      <AddHoldingFab />
      <ImportCsvSheet open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
