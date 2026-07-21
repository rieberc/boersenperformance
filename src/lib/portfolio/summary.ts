import { prisma } from "@/lib/prisma";
import { getFxRateWithCache, getQuotesWithCache } from "@/lib/prices/cache";
import { toNumber } from "@/lib/utils/decimal";
import type { AssetType } from "@/generated/prisma/client";

export const DISPLAY_CURRENCY = "EUR";

export type HoldingSummary = {
  id: string;
  assetType: AssetType;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
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
  holdings: HoldingSummary[];
};

export async function getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
  const holdings = await prisma.holding.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (holdings.length === 0) {
    return { currency: DISPLAY_CURRENCY, totalValue: 0, totalInvested: 0, totalGain: 0, totalGainPercent: 0, holdings: [] };
  }

  const symbols = holdings.map((h) => h.symbol);
  const quotes = await getQuotesWithCache(symbols);

  const currencies = [...new Set(holdings.map((h) => h.currency))];
  const fxRates = new Map<string, number>();
  await Promise.all(
    currencies.map(async (currency) => {
      const rate = await getFxRateWithCache(currency, DISPLAY_CURRENCY);
      fxRates.set(currency, rate ?? 1);
    }),
  );

  let totalValue = 0;
  let totalInvested = 0;

  const rows = holdings.map((h) => {
    const quantity = toNumber(h.quantity);
    const buyPrice = toNumber(h.buyPrice);
    const quote = quotes.get(h.symbol);
    const fxRate = fxRates.get(h.currency) ?? 1;

    const currentPrice = quote?.price ?? null;
    const currentValue = (currentPrice ?? buyPrice) * quantity * fxRate;
    const investedValue = buyPrice * quantity * fxRate;
    const gain = currentValue - investedValue;
    const gainPercent = investedValue > 0 ? (gain / investedValue) * 100 : 0;

    totalValue += currentValue;
    totalInvested += investedValue;

    return {
      id: h.id,
      assetType: h.assetType,
      symbol: h.symbol,
      name: h.name,
      currency: h.currency,
      quantity,
      buyPrice,
      buyDate: h.buyDate.toISOString(),
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
    holdings: rows,
  };
}
