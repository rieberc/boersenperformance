import { prisma } from "@/lib/prisma";
import { yahooPriceProvider } from "@/lib/prices/yahoo";
import { getFxRateWithCache } from "@/lib/prices/cache";
import { toNumber } from "@/lib/utils/decimal";
import { DISPLAY_CURRENCY } from "@/lib/portfolio/summary";

export type ValuePoint = { date: string; value: number };

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
 * Reconstructs daily portfolio value between start and end by forward-filling
 * each symbol's last known historical price and cumulative held quantity
 * (BUY/SELL transactions only — dividends don't affect quantity). Uses the
 * current FX rate uniformly, consistent with the rest of the app.
 */
export async function getValueHistory(userId: string, start: Date, end: Date): Promise<ValuePoint[]> {
  const transactions = await prisma.holding.findMany({
    where: { userId, type: { not: "DIVIDEND" }, date: { lte: end } },
    orderBy: { date: "asc" },
  });

  if (transactions.length === 0) return [];

  const symbolCurrency = new Map<string, string>();
  const deltasBySymbol = new Map<string, { date: string; delta: number }[]>();

  for (const t of transactions) {
    symbolCurrency.set(t.symbol, t.currency);
    const list = deltasBySymbol.get(t.symbol) ?? [];
    const qty = toNumber(t.quantity);
    list.push({ date: toIsoDate(t.date), delta: t.type === "SELL" ? -qty : qty });
    deltasBySymbol.set(t.symbol, list);
  }

  const symbols = [...symbolCurrency.keys()];
  const priceSeriesBySymbol = new Map<string, { date: string; price: number }[]>();
  await Promise.all(
    symbols.map(async (symbol) => {
      priceSeriesBySymbol.set(symbol, await yahooPriceProvider.historicalPrices(symbol, start, end));
    }),
  );

  const currencies = [...new Set(symbolCurrency.values())];
  const fxRates = new Map<string, number>();
  await Promise.all(
    currencies.map(async (currency) => {
      fxRates.set(currency, (await getFxRateWithCache(currency, DISPLAY_CURRENCY)) ?? 1);
    }),
  );

  const axis = buildDateAxis(start, end);
  const series: ValuePoint[] = [];

  const qtyCursor = new Map(symbols.map((s) => [s, 0]));
  const qtyValue = new Map(symbols.map((s) => [s, 0]));
  const priceCursor = new Map(symbols.map((s) => [s, 0]));
  const priceValue = new Map(symbols.map((s) => [s, 0]));

  for (const date of axis) {
    let total = 0;

    for (const symbol of symbols) {
      const deltas = deltasBySymbol.get(symbol)!;
      let dIdx = qtyCursor.get(symbol)!;
      let qty = qtyValue.get(symbol)!;
      while (dIdx < deltas.length && deltas[dIdx].date <= date) {
        qty += deltas[dIdx].delta;
        dIdx++;
      }
      qtyCursor.set(symbol, dIdx);
      qtyValue.set(symbol, qty);

      if (qty <= 1e-9) continue;

      const prices = priceSeriesBySymbol.get(symbol)!;
      let pIdx = priceCursor.get(symbol)!;
      let price = priceValue.get(symbol)!;
      while (pIdx < prices.length && prices[pIdx].date <= date) {
        price = prices[pIdx].price;
        pIdx++;
      }
      priceCursor.set(symbol, pIdx);
      priceValue.set(symbol, price);

      if (price === 0) continue;

      const fxRate = fxRates.get(symbolCurrency.get(symbol)!) ?? 1;
      total += qty * price * fxRate;
    }

    series.push({ date, value: total });
  }

  return series;
}

export function downsample(series: ValuePoint[], maxPoints = 180): ValuePoint[] {
  if (series.length <= maxPoints) return series;

  const step = series.length / maxPoints;
  const out: ValuePoint[] = [];
  for (let i = 0; i < maxPoints; i++) {
    out.push(series[Math.floor(i * step)]);
  }
  const last = series[series.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}
