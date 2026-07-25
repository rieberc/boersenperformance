import { prisma } from "@/lib/prisma";
import { getFxRateWithCache, getQuotesWithCache } from "@/lib/prices/cache";
import { toNumber } from "@/lib/utils/decimal";
import type { AssetType } from "@/generated/prisma/client";

export const DISPLAY_CURRENCY = "EUR";

export type HoldingSummary = {
  symbol: string;
  assetType: AssetType;
  name: string;
  currency: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number | null;
  currentValue: number;
  investedValue: number;
  gain: number;
  gainPercent: number;
  dividends: number;
  dividendPercent: number;
  realizedGain: number;
  realizedGainPercent: number;
  allocationPercent: number;
  priceUpdatedAt: string | null;
  stalePrice: boolean;
};

export type ClosedPositionSummary = {
  symbol: string;
  assetType: AssetType;
  name: string;
  currency: string;
  dividends: number;
  dividendPercent: number;
  realizedGain: number;
  realizedGainPercent: number;
};

export type PortfolioSummary = {
  currency: string;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  totalRealizedGain: number;
  earliestTransactionDate: string | null;
  holdings: HoldingSummary[];
  closedPositions: ClosedPositionSummary[];
};

const EMPTY_SUMMARY: PortfolioSummary = {
  currency: DISPLAY_CURRENCY,
  totalValue: 0,
  totalInvested: 0,
  totalGain: 0,
  totalGainPercent: 0,
  totalRealizedGain: 0,
  earliestTransactionDate: null,
  holdings: [],
  closedPositions: [],
};

type Position = {
  assetType: AssetType;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  costBasis: number;
  realizedGain: number;
  realizedCostBasis: number;
  dividends: number;
};

/**
 * Aggregates BUY/SELL transactions per symbol using the average-cost method:
 * each SELL removes cost basis proportionally to the average cost per unit
 * at that point, and the difference to the sale proceeds becomes realized gain.
 */
function aggregatePositions(
  transactions: Awaited<ReturnType<typeof fetchTransactions>>,
  fxRates: Map<string, number>,
): Position[] {
  const bySymbol = new Map<string, Position>();

  function getOrCreate(t: (typeof transactions)[number]): Position {
    let position = bySymbol.get(t.symbol);
    if (!position) {
      position = {
        assetType: t.assetType,
        symbol: t.symbol,
        name: t.name,
        currency: t.currency,
        quantity: 0,
        costBasis: 0,
        realizedGain: 0,
        realizedCostBasis: 0,
        dividends: 0,
      };
      bySymbol.set(t.symbol, position);
    }
    return position;
  }

  for (const t of transactions) {
    const fxRate = fxRates.get(t.currency) ?? 1;
    const quantity = toNumber(t.quantity);
    const price = toNumber(t.price);
    const amountEUR = quantity * price * fxRate;

    if (t.type === "DIVIDEND") {
      getOrCreate(t).dividends += amountEUR;
      continue;
    }

    const position = getOrCreate(t);

    if (t.type === "SELL") {
      const avgCostPerUnit = position.quantity > 0 ? position.costBasis / position.quantity : 0;
      const soldQuantity = Math.min(quantity, position.quantity);
      const costRemoved = avgCostPerUnit * soldQuantity;

      position.costBasis -= costRemoved;
      position.quantity -= soldQuantity;
      position.realizedGain += amountEUR - costRemoved;
      position.realizedCostBasis += costRemoved;
    } else {
      position.quantity += quantity;
      // CASH positions (Tagesgeld/Festgeld interest, modeled as a Holding
      // with price fixed at 1) aren't capital the user contributed — leaving
      // costBasis at 0 means the full credited amount shows up as gain
      // instead of inflating "Investiert".
      if (t.assetType !== "CASH") {
        position.costBasis += amountEUR;
      }
      position.name = t.name;
      position.currency = t.currency;
    }
  }

  return [...bySymbol.values()];
}

async function fetchTransactions(userId: string, assetTypes?: AssetType[]) {
  return prisma.holding.findMany({
    where: { userId, ...(assetTypes ? { assetType: { in: assetTypes } } : {}) },
    orderBy: { date: "asc" },
  });
}

export async function getPortfolioSummary(userId: string, assetTypes?: AssetType[]): Promise<PortfolioSummary> {
  const transactions = await fetchTransactions(userId, assetTypes);
  if (transactions.length === 0) return EMPTY_SUMMARY;

  // Note: a holding's cost-basis currency (what was actually paid, e.g. EUR
  // via a German broker) can differ from the currency the live quote is
  // denominated in (e.g. GBP for an LSE-listed ETF) — each needs its own FX
  // rate, so quotes are fetched first to know every currency involved.
  const cashSymbols = new Set(transactions.filter((t) => t.assetType === "CASH").map((t) => t.symbol));
  const symbolsForQuotes = [
    ...new Set(transactions.filter((t) => t.type !== "DIVIDEND" && t.assetType !== "CASH").map((t) => t.symbol)),
  ];
  const quotes = await getQuotesWithCache(symbolsForQuotes);
  // CASH holdings have no market price — they're always worth exactly what
  // was credited, so a real Yahoo lookup for a bank name would be wrong (or
  // fail outright).
  for (const symbol of cashSymbols) {
    quotes.set(symbol, { price: 1, currency: DISPLAY_CURRENCY, updatedAt: new Date(), allTimeHigh: null });
  }

  const currencies = new Set(transactions.map((t) => t.currency));
  for (const quote of quotes.values()) currencies.add(quote.currency);

  const fxRates = new Map<string, number>();
  await Promise.all(
    [...currencies].map(async (currency) => {
      const rate = await getFxRateWithCache(currency, DISPLAY_CURRENCY);
      fxRates.set(currency, rate ?? 1);
    }),
  );

  const positions = aggregatePositions(transactions, fxRates);
  const openPositions = positions.filter((p) => p.quantity > 1e-9);

  let totalValue = 0;
  let totalInvested = 0;
  const totalRealizedGain = positions.reduce((sum, p) => sum + p.realizedGain, 0);

  const rows: HoldingSummary[] = openPositions.map((p) => {
    const quote = quotes.get(p.symbol);
    const fxRate = fxRates.get(p.currency) ?? 1;
    const avgPrice = p.costBasis / p.quantity / fxRate;

    const currentPrice = quote?.price ?? null;
    const currentFxRate = quote ? (fxRates.get(quote.currency) ?? 1) : fxRate;
    const currentValue = currentPrice != null ? currentPrice * p.quantity * currentFxRate : p.costBasis;
    const investedValue = p.costBasis;
    const gain = currentValue - investedValue;
    const gainPercent = investedValue > 0 ? (gain / investedValue) * 100 : 0;
    const dividendPercent = investedValue > 0 ? (p.dividends / investedValue) * 100 : 0;
    const realizedGainPercent = p.realizedCostBasis > 0 ? (p.realizedGain / p.realizedCostBasis) * 100 : 0;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      symbol: p.symbol,
      assetType: p.assetType,
      name: p.name,
      currency: p.currency,
      quantity: p.quantity,
      avgPrice,
      currentPrice,
      currentValue,
      investedValue,
      gain,
      gainPercent,
      dividends: p.dividends,
      dividendPercent,
      realizedGain: p.realizedGain,
      realizedGainPercent,
      priceUpdatedAt: quote?.updatedAt.toISOString() ?? null,
      stalePrice: currentPrice == null,
      allocationPercent: 0,
    };
  });

  for (const row of rows) {
    row.allocationPercent = totalValue > 0 ? (row.currentValue / totalValue) * 100 : 0;
  }

  const closedPositions: ClosedPositionSummary[] = positions
    .filter((p) => p.quantity <= 1e-9 && (p.realizedCostBasis > 1e-9 || p.dividends > 1e-9))
    .map((p) => ({
      symbol: p.symbol,
      assetType: p.assetType,
      name: p.name,
      currency: p.currency,
      dividends: p.dividends,
      dividendPercent: p.realizedCostBasis > 0 ? (p.dividends / p.realizedCostBasis) * 100 : 0,
      realizedGain: p.realizedGain,
      realizedGainPercent: p.realizedCostBasis > 0 ? (p.realizedGain / p.realizedCostBasis) * 100 : 0,
    }))
    .sort((a, b) => b.realizedGain - a.realizedGain);

  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return {
    currency: DISPLAY_CURRENCY,
    totalValue,
    totalInvested,
    totalGain,
    totalGainPercent,
    totalRealizedGain,
    earliestTransactionDate: transactions[0].date.toISOString(),
    holdings: rows,
    closedPositions,
  };
}
