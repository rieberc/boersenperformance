"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/Card";
import { WatchlistChart, WATCHLIST_COLORS } from "@/components/watchlist/WatchlistChart";
import { WatchlistRow } from "@/components/watchlist/WatchlistRow";
import { WatchlistRangePicker } from "@/components/watchlist/WatchlistRangePicker";
import { AddWatchlistItemFab } from "@/components/watchlist/AddWatchlistItemFab";
import { resolvePresetRange, type DateRangePreset } from "@/lib/utils/dateRange";
import type { WatchlistPerformance } from "@/lib/portfolio/watchlist";

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const DEFAULT_PRESET: DateRangePreset = "30d";

export function WatchlistView({
  initialPerformance,
  basePath = "/api/watchlist",
  backHref = "/dashboard",
  readOnly = false,
}: {
  initialPerformance: WatchlistPerformance;
  basePath?: string;
  backHref?: string;
  readOnly?: boolean;
}) {
  const [preset, setPreset] = useState<DateRangePreset>(DEFAULT_PRESET);

  const range = resolvePresetRange(preset, null);
  const startIso = toIsoDate(range.start);
  const endIso = toIsoDate(range.end);

  const { data } = useQuery({
    queryKey: ["watchlist", "performance", basePath, startIso, endIso],
    queryFn: async (): Promise<WatchlistPerformance> => {
      const res = await fetch(`${basePath}/performance?start=${startIso}&end=${endIso}`);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      return res.json();
    },
    // Only seed initialData for the exact range it was fetched with —
    // otherwise TanStack Query marks other ranges "fresh" too (given the
    // app's 60s default staleTime) and never refetches them.
    initialData: preset === DEFAULT_PRESET ? initialPerformance : undefined,
  });

  const performance = data ?? (preset === DEFAULT_PRESET ? initialPerformance : { items: [], points: [] });

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-background pb-28">
      <header className="safe-top flex items-center gap-3 px-5 pt-6 pb-4">
        <Link
          href={backHref}
          aria-label="Zurück"
          className="rounded-full p-2 text-navy hover:bg-black/5"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-navy">Watchlist</h1>
      </header>

      <main className="flex flex-col gap-4 px-5">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Wertentwicklung</h2>
            <WatchlistRangePicker preset={preset} onSelect={setPreset} />
          </div>
          <WatchlistChart items={performance.items} points={performance.points} />
        </Card>

        <Card className="p-2">
          <div className="px-3 pt-2">
            <h2 className="text-sm font-semibold text-navy">Werte</h2>
          </div>
          <div className="px-3">
            {performance.items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                Noch keine Werte auf deiner Watchlist. Füge ETFs, Aktien oder Crypto hinzu, um ihre
                Entwicklung zu verfolgen.
              </p>
            ) : (
              performance.items.map((item, index) => (
                <div key={item.id} className={index > 0 ? "border-t border-border" : ""}>
                  <WatchlistRow
                    item={item}
                    color={WATCHLIST_COLORS[index % WATCHLIST_COLORS.length]}
                    readOnly={readOnly}
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </main>

      {!readOnly && <AddWatchlistItemFab />}
    </div>
  );
}
