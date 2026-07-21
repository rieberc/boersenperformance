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
  allocationPercent: number;
  priceUpdatedAt: string | null;
  stalePrice: boolean;
};

export type PortfolioSummary = {
  currency: string;
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
  totalRealizedGain: number;
  holdings: HoldingSummary[];
};

const EMPTY_SUMMARY: PortfolioSummary = {
  currency: DISPLAY_CURRENCY,
  totalValue: 0,
  totalInvested: 0,
  totalGain: 0,
  totalGainPercent: 0,
  totalRealizedGain: 0,
  holdings: [],
};

type Position = {
  assetType: AssetType;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  costBasis: number;
  realizedGain: number;
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

  for (const t of transactions) {
    const fxRate = fxRates.get(t.currency) ?? 1;
    const quantity = toNumber(t.quantity);
    const price = toNumber(t.price);
    const amountEUR = quantity * price * fxRate;

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
      };
      bySymbol.set(t.symbol, position);
    }

    if (t.type === "SELL") {
      const avgCostPerUnit = position.quantity > 0 ? position.costBasis / position.quantity : 0;
      const soldQuantity = Math.min(quantity, position.quantity);
      const costRemoved = avgCostPerUnit * soldQuantity;

      position.costBasis -= costRemoved;
      position.quantity -= soldQuantity;
      position.realizedGain += amountEUR - costRemoved;
    } else {
      position.quantity += quantity;
      position.costBasis += amountEUR;
      position.name = t.name;
      position.currency = t.currency;
    }
  }

  return [...bySymbol.values()];
}

async function fetchTransactions(userId: string) {
  return prisma.holding.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
}

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const transactions = await fetchTransactions(userId);
  if (transactions.length === 0) return EMPTY_SUMMARY;

  const currencies = [...new Set(transactions.map((t) => t.currency))];
  const fxRates = new Map<string, number>();
  await Promise.all(
    currencies.map(async (currency) => {
      const rate = await getFxRateWithCache(currency, DISPLAY_CURRENCY);
      fxRates.set(currency, rate ?? 1);
    }),
  );

  const positions = aggregatePositions(transactions, fxRates);
  const openPositions = positions.filter((p) => p.quantity > 1e-9);

  const symbols = openPositions.map((p) => p.symbol);
  const quotes = await getQuotesWithCache(symbols);

  let totalValue = 0;
  let totalInvested = 0;
  const totalRealizedGain = positions.reduce((sum, p) => sum + p.realizedGain, 0);

  const rows: HoldingSummary[] = openPositions.map((p) => {
    const quote = quotes.get(p.symbol);
    const fxRate = fxRates.get(p.currency) ?? 1;
    const avgPrice = p.costBasis / p.quantity / fxRate;

    const currentPrice = quote?.price ?? null;
    const currentValue = currentPrice != null ? currentPrice * p.quantity * fxRate : p.costBasis;
    const investedValue = p.costBasis;
    const gain = currentValue - investedValue;
    const gainPercent = investedValue > 0 ? (gain / investedValue) * 100 : 0;

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
      priceUpdatedAt: quote?.updatedAt.toISOString() ?? null,
      stalePrice: currentPrice == null,
      allocationPercent: 0,
    };
  });

  for (const row of rows) {
    row.allocationPercent = totalValue > 0 ? (row.currentValue / totalValue) * 100 : 0;
  }

  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return {
    currency: DISPLAY_CURRENCY,
    totalValue,
    totalInvested,
    totalGain,
    totalGainPercent,
    totalRealizedGain,
    holdings: rows,
  };
}
