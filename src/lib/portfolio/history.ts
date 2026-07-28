import { prisma } from "@/lib/prisma";
import { yahooPriceProvider } from "@/lib/prices/yahoo";
import { getFxRateWithCache, getQuotesWithCache } from "@/lib/prices/cache";
import { toNumber } from "@/lib/utils/decimal";
import { DISPLAY_CURRENCY } from "@/lib/portfolio/summary";
import type { AssetType } from "@/generated/prisma/client";

export type ValuePoint = { date: string; value: number; contributed: number; realizedGain: number };

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * The unofficial Yahoo Finance API occasionally returns a single bad tick
 * (a price wildly out of line with the days around it). An isolated spike
 * or drop that reverts on the very next data point is almost certainly bad
 * data rather than a real move, so it's smoothed out before it can distort
 * the reconstructed portfolio value.
 */
function removePriceOutliers(
  points: { date: string; price: number }[],
): { date: string; price: number }[] {
  if (points.length < 3) return points;

  const cleaned = points.map((p) => ({ ...p }));
  for (let i = 1; i < cleaned.length - 1; i++) {
    const prev = cleaned[i - 1].price;
    const curr = cleaned[i].price;
    const next = cleaned[i + 1].price;
    if (prev <= 0 || next <= 0) continue;

    const jumpFromPrev = Math.abs(curr / prev - 1);
    const jumpToNext = Math.abs(curr / next - 1);
    const neighborsAgree = Math.abs(prev / next - 1) < 0.15;

    if (jumpFromPrev > 0.4 && jumpToNext > 0.4 && neighborsAgree) {
      cleaned[i].price = (prev + next) / 2;
    }
  }
  return cleaned;
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
 * (BUY/SELL transactions only — dividends don't affect quantity). Prices are
 * converted using the currency the quote itself is denominated in (which can
 * differ from the currency the user recorded the purchase in, e.g. an
 * LSE-listed ETF bought via a EUR-settling broker), using the current FX
 * rate uniformly for the whole series — consistent with the rest of the app.
 *
 * Alongside portfolio value, also tracks "zugeführtes Kapital" — the running
 * net cash contributed (buys add, sells subtract, in the currency actually
 * paid) — so the caller can chart market performance against money put in.
 */
export async function getValueHistory(
  userId: string,
  start: Date,
  end: Date,
  assetTypes?: AssetType[],
): Promise<ValuePoint[]> {
  const transactions = await prisma.holding.findMany({
    where: {
      userId,
      type: { not: "DIVIDEND" },
      date: { lte: end },
      ...(assetTypes ? { assetType: { in: assetTypes } } : {}),
    },
    orderBy: { date: "asc" },
  });

  if (transactions.length === 0) return [];

  const deltasBySymbol = new Map<string, { date: string; delta: number }[]>();
  const contributionEvents: { date: string; delta: number }[] = [];
  const realizedGainEvents: { date: string; delta: number }[] = [];

  for (const t of transactions) {
    const list = deltasBySymbol.get(t.symbol) ?? [];
    const qty = toNumber(t.quantity);
    list.push({ date: toIsoDate(t.date), delta: t.type === "SELL" ? -qty : qty });
    deltasBySymbol.set(t.symbol, list);
  }

  const symbols = [...deltasBySymbol.keys()];
  const cashSymbols = new Set(transactions.filter((t) => t.assetType === "CASH").map((t) => t.symbol));
  const priceSeriesBySymbol = new Map<string, { date: string; price: number }[]>();
  const priceCurrencyBySymbol = new Map<string, string>();
  await Promise.all(
    symbols.map(async (symbol) => {
      // CASH holdings have no market price to look up — they're always
      // worth exactly what was credited, so a single price=1 point covering
      // the whole range is all forward-filling needs.
      if (cashSymbols.has(symbol)) {
        priceSeriesBySymbol.set(symbol, [{ date: toIsoDate(start), price: 1 }]);
        priceCurrencyBySymbol.set(symbol, DISPLAY_CURRENCY);
        return;
      }
      const { currency, points } = await yahooPriceProvider.historicalPrices(symbol, start, end);
      priceSeriesBySymbol.set(symbol, removePriceOutliers(points));
      priceCurrencyBySymbol.set(symbol, currency);
    }),
  );

  // If a symbol's historical fetch failed outright (e.g. a transient Yahoo
  // API error), fall back to its last cached current price rather than
  // silently contributing 0 for the whole range.
  const missingSymbols = symbols.filter((s) => priceSeriesBySymbol.get(s)!.length === 0);
  if (missingSymbols.length > 0) {
    const fallbackQuotes = await getQuotesWithCache(missingSymbols);
    for (const symbol of missingSymbols) {
      const fallback = fallbackQuotes.get(symbol);
      if (fallback) {
        priceSeriesBySymbol.set(symbol, [{ date: toIsoDate(start), price: fallback.price }]);
        priceCurrencyBySymbol.set(symbol, fallback.currency);
      }
    }
  }

  // Yahoo's historical chart can lag a day behind (or not yet reflect
  // today's price at all), while getPortfolioSummary always uses the live
  // quote for "now". When the requested range reaches today, patch the
  // series' final price with that same live quote so the two stay
  // reconciled — otherwise totals derived from this series (e.g. yearly/
  // monthly performance) drift from the Depotwert/Kursgewinn shown elsewhere
  // by the gap between yesterday's close and today's price.
  if (toIsoDate(end) >= toIsoDate(new Date())) {
    const liveSymbols = symbols.filter((s) => !cashSymbols.has(s));
    const liveQuotes = await getQuotesWithCache(liveSymbols);
    const endIso = toIsoDate(end);
    for (const symbol of liveSymbols) {
      const live = liveQuotes.get(symbol);
      if (!live) continue;
      const series = priceSeriesBySymbol.get(symbol)!;
      const last = series[series.length - 1];
      if (last && last.date === endIso) {
        last.price = live.price;
      } else {
        series.push({ date: endIso, price: live.price });
      }
      priceCurrencyBySymbol.set(symbol, live.currency);
    }
  }

  const currencies = new Set(priceCurrencyBySymbol.values());
  for (const t of transactions) currencies.add(t.currency);
  const fxRates = new Map<string, number>();
  await Promise.all(
    [...currencies].map(async (currency) => {
      fxRates.set(currency, (await getFxRateWithCache(currency, DISPLAY_CURRENCY)) ?? 1);
    }),
  );

  // A SELL should only pull back out the cost basis of what was sold, not
  // the full sale proceeds — otherwise cashing out a position at a large
  // profit drags "Zugeführtes Kapital" down by more than was ever actually
  // contributed, sending it needlessly negative. Tracked per symbol with the
  // same average-cost method used elsewhere (aggregatePositions in
  // summary.ts); `transactions` is already ordered by date, so a single
  // forward pass keeps a running cost basis and quantity per symbol.
  const costBasisBySymbol = new Map<string, number>();
  const costQtyBySymbol = new Map<string, number>();

  for (const t of transactions) {
    // Interest credited to a CASH holding isn't capital the user contributed
    // — it should show up as the value line pulling ahead of the
    // contributed-capital line, not as an extra contribution.
    if (t.assetType === "CASH") continue;

    const fxRate = fxRates.get(t.currency) ?? 1;
    const qty = toNumber(t.quantity);
    const amount = qty * toNumber(t.price) * fxRate;
    const prevCostBasis = costBasisBySymbol.get(t.symbol) ?? 0;
    const prevQty = costQtyBySymbol.get(t.symbol) ?? 0;

    if (t.type === "SELL") {
      const avgCostPerUnit = prevQty > 0 ? prevCostBasis / prevQty : 0;
      const soldQty = Math.min(qty, prevQty);
      const costRemoved = avgCostPerUnit * soldQty;
      contributionEvents.push({ date: toIsoDate(t.date), delta: -costRemoved });
      realizedGainEvents.push({ date: toIsoDate(t.date), delta: amount - costRemoved });
      costBasisBySymbol.set(t.symbol, prevCostBasis - costRemoved);
      costQtyBySymbol.set(t.symbol, prevQty - soldQty);
    } else {
      contributionEvents.push({ date: toIsoDate(t.date), delta: amount });
      costBasisBySymbol.set(t.symbol, prevCostBasis + amount);
      costQtyBySymbol.set(t.symbol, prevQty + qty);
    }
  }
  contributionEvents.sort((a, b) => a.date.localeCompare(b.date));
  realizedGainEvents.sort((a, b) => a.date.localeCompare(b.date));

  const axis = buildDateAxis(start, end);
  const series: ValuePoint[] = [];

  const qtyCursor = new Map(symbols.map((s) => [s, 0]));
  const qtyValue = new Map(symbols.map((s) => [s, 0]));
  const priceCursor = new Map(symbols.map((s) => [s, 0]));
  const priceValue = new Map(symbols.map((s) => [s, 0]));
  let contributionIdx = 0;
  let contributed = 0;
  let realizedGainIdx = 0;
  let realizedGain = 0;

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

      const fxRate = fxRates.get(priceCurrencyBySymbol.get(symbol) ?? DISPLAY_CURRENCY) ?? 1;
      total += qty * price * fxRate;
    }

    while (contributionIdx < contributionEvents.length && contributionEvents[contributionIdx].date <= date) {
      contributed += contributionEvents[contributionIdx].delta;
      contributionIdx++;
    }

    while (realizedGainIdx < realizedGainEvents.length && realizedGainEvents[realizedGainIdx].date <= date) {
      realizedGain += realizedGainEvents[realizedGainIdx].delta;
      realizedGainIdx++;
    }

    series.push({ date, value: total, contributed, realizedGain });
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
