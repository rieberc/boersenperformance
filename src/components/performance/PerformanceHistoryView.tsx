"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { GainPill } from "@/components/dashboard/GainPill";
import { AssetTypeFilter, assetGroupsToTypesParam, type AssetGroup } from "@/components/dashboard/AssetTypeFilter";
import { formatEUR } from "@/lib/utils/currency";
import type { YearPerformance } from "@/lib/portfolio/yearlyPerformance";

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function formatSignedEUR(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatEUR(value)}`;
}

function AmountCell({ absolute, percent }: { absolute: number; percent: number | null }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={`text-sm font-semibold ${absolute >= 0 ? "text-accent-dark" : "text-negative"}`}>
        {formatSignedEUR(absolute)}
      </span>
      {percent != null ? <GainPill percent={percent} /> : <span className="text-xs text-muted">–</span>}
    </div>
  );
}

/** Chains each year's TWR factor together (same technique used to derive a
 * year's own percent from its months) so the total percent compounds
 * correctly instead of just averaging or summing the yearly percentages. */
function totalAcrossYears(years: YearPerformance[]): { absoluteGain: number; percentGain: number | null } {
  let absoluteGain = 0;
  let factor = 1;
  let hasData = false;

  for (const y of years) {
    absoluteGain += y.absoluteGain;
    if (y.percentGain != null) {
      factor *= 1 + y.percentGain / 100;
      hasData = true;
    }
  }

  return { absoluteGain, percentGain: hasData ? (factor - 1) * 100 : null };
}

function YearRow({ year }: { year: YearPerformance }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-navy">
          <span className={`inline-block text-xs transition-transform ${open ? "" : "-rotate-90"}`}>⌄</span>
          {year.year}
        </span>
        <AmountCell absolute={year.absoluteGain} percent={year.percentGain} />
      </button>

      {open && (
        <div className="divide-y divide-border pb-2 pl-5">
          {year.months.map((m) => (
            <div key={m.month} className="flex items-center justify-between py-2">
              <span className="text-sm text-muted">{MONTH_NAMES[m.month - 1]}</span>
              <AmountCell absolute={m.absoluteGain} percent={m.percentGain} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Matches the ["STOCK", "ETF"] scope the server component fetches initialYears
// with — the default filter state below resolves to the same param.
const DEFAULT_TYPES_PARAM = "STOCK,ETF";

export function PerformanceHistoryView({
  initialYears,
  basePath = "/api/portfolio",
  backHref = "/dashboard",
}: {
  initialYears: YearPerformance[];
  basePath?: string;
  backHref?: string;
}) {
  const [assetGroups, setAssetGroups] = useState<Set<AssetGroup>>(new Set(["securities"]));
  const typesParam = assetGroupsToTypesParam(assetGroups);

  const { data } = useQuery({
    queryKey: ["portfolio", "yearly-performance", basePath, typesParam ?? null],
    queryFn: async (): Promise<YearPerformance[]> => {
      const url = typesParam
        ? `${basePath}/yearly-performance?types=${typesParam}`
        : `${basePath}/yearly-performance`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const json = await res.json();
      return json.years;
    },
    // Only seed initialData for the exact filter state it was fetched with —
    // otherwise TanStack Query marks other filter combinations "fresh" too
    // (given the app's 60s default staleTime) and never refetches them.
    initialData: typesParam === DEFAULT_TYPES_PARAM ? initialYears : undefined,
  });

  const years = data ?? (typesParam === DEFAULT_TYPES_PARAM ? initialYears : []);
  const total = totalAcrossYears(years);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-10">
      <header className="safe-top flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          href={backHref}
          aria-label="Zurück"
          className="rounded-full p-2 text-navy hover:bg-black/5"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-navy">Performance im Verlauf</h1>
      </header>

      <main className="flex flex-col gap-4 px-5">
        <div className="flex justify-end">
          <AssetTypeFilter selected={assetGroups} onChange={setAssetGroups} />
        </div>

        <Card className="p-2">
          {years.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">Noch keine Performance-Daten vorhanden.</p>
          ) : (
            <div className="px-3">
              {years.map((y) => (
                <YearRow key={y.year} year={y} />
              ))}

              <div className="flex items-center justify-between border-t border-border py-3">
                <span className="text-sm font-semibold text-navy">Gesamt</span>
                <AmountCell absolute={total.absoluteGain} percent={total.percentGain} />
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
