import { prisma } from "@/lib/prisma";
import { yahooPriceProvider } from "@/lib/prices/yahoo";
import { getQuotesWithCache } from "@/lib/prices/cache";
import type { AssetType } from "@/generated/prisma/client";

export type WatchlistItem = {
  id: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  currency: string;
};

export async function getWatchlist(userId: string): Promise<WatchlistItem[]> {
  return prisma.watchlistItem.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, symbol: true, name: true, assetType: true, currency: true },
  });
}

export type WatchlistPerformanceItem = WatchlistItem & {
  currentPrice: number | null;
  priceUpdatedAt: string | null;
  changePercent: number | null;
  hasActiveAlert: boolean;
};

export type WatchlistPerformancePoint = { date: string; [symbol: string]: string | number | undefined };

export type WatchlistPerformance = {
  items: WatchlistPerformanceItem[];
  points: WatchlistPerformancePoint[];
};

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDateAxis(start: Date, end: Date): string[] {
  const axis: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cursor <= endUtc) {
    axis.push(toIsoDate(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return axis;
}

/**
 * Builds a percent-change-from-range-start series per watchlist symbol, so
 * assets in different currencies and price magnitudes can be plotted on one
 * chart. Unlike portfolio value history, no FX conversion is needed here —
 * relative change is currency-agnostic.
 */
export async function getWatchlistPerformance(
  userId: string,
  start: Date,
  end: Date,
): Promise<WatchlistPerformance> {
  const items = await getWatchlist(userId);
  if (items.length === 0) return { items: [], points: [] };

  const symbols = items.map((i) => i.symbol);
  const [quotes, historicalEntries, activeAlerts] = await Promise.all([
    getQuotesWithCache(symbols),
    Promise.all(
      symbols.map(async (symbol) => {
        const { points } = await yahooPriceProvider.historicalPrices(symbol, start, end);
        return [symbol, points] as const;
      }),
    ),
    prisma.priceAlert.findMany({
      where: { userId, active: true, symbol: { in: symbols } },
      select: { symbol: true },
    }),
  ]);
  const historicalBySymbol = new Map(historicalEntries);
  const alertedSymbols = new Set(activeAlerts.map((a) => a.symbol));

  const axis = buildDateAxis(start, end);
  const points: WatchlistPerformancePoint[] = axis.map((date) => ({ date }));
  const changeBySymbol = new Map<string, number | null>();

  for (const symbol of symbols) {
    const prices = historicalBySymbol.get(symbol) ?? [];
    if (prices.length === 0) {
      changeBySymbol.set(symbol, null);
      continue;
    }

    const basePrice = prices[0].price;
    let cursor = 0;
    let lastPercent: number | null = null;

    for (let i = 0; i < axis.length; i++) {
      const date = axis[i];
      while (cursor < prices.length && prices[cursor].date <= date) {
        lastPercent = basePrice !== 0 ? (prices[cursor].price / basePrice - 1) * 100 : 0;
        cursor++;
      }
      if (lastPercent != null) {
        points[i][symbol] = lastPercent;
      }
    }

    changeBySymbol.set(symbol, lastPercent);
  }

  const itemsWithPerformance: WatchlistPerformanceItem[] = items.map((item) => {
    const quote = quotes.get(item.symbol);
    return {
      ...item,
      currentPrice: quote?.price ?? null,
      priceUpdatedAt: quote?.updatedAt.toISOString() ?? null,
      changePercent: changeBySymbol.get(item.symbol) ?? null,
      hasActiveAlert: alertedSymbols.has(item.symbol),
    };
  });

  return { items: itemsWithPerformance, points };
}
