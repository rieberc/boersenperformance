import xirr from "xirr";
import { prisma } from "@/lib/prisma";
import { getFxRateWithCache } from "@/lib/prices/cache";
import { toNumber } from "@/lib/utils/decimal";
import { DISPLAY_CURRENCY, getPortfolioSummary } from "@/lib/portfolio/summary";
import { getValueHistory } from "@/lib/portfolio/history";

export type PerformanceOverview = {
  totalValue: number;
  investedValue: number;
  kursgewinn: number;
  realisiertBrutto: number;
  dividendenBrutto: number;
  steuern: number;
  gebuehren: number;
  gewinn: number;
  nettogewinn: number;
  izf: number | null;
  ttwror: number | null;
};

async function buildFxRates(currencies: string[]): Promise<Map<string, number>> {
  const fxRates = new Map<string, number>();
  await Promise.all(
    currencies.map(async (currency) => {
      fxRates.set(currency, (await getFxRateWithCache(currency, DISPLAY_CURRENCY)) ?? 1);
    }),
  );
  return fxRates;
}

function computeTTWROR(
  series: { date: string; value: number }[],
  cashFlowByDate: Map<string, number>,
): number | null {
  if (series.length < 2) return null;

  let twr = 1;
  let hasData = false;

  for (let i = 1; i < series.length; i++) {
    const prevValue = series[i - 1].value;
    if (prevValue <= 1e-9) continue;

    const cf = cashFlowByDate.get(series[i].date) ?? 0;
    const dailyGrowth = (series[i].value - cf) / prevValue;
    if (dailyGrowth > 0) {
      twr *= dailyGrowth;
      hasData = true;
    }
  }

  return hasData ? twr - 1 : null;
}

export async function getPerformanceOverview(
  userId: string,
  start: Date,
  end: Date,
): Promise<PerformanceOverview> {
  const summary = await getPortfolioSummary(userId);

  const periodTransactions = await prisma.holding.findMany({
    where: { userId, date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
  });

  const currencies = [...new Set(periodTransactions.map((t) => t.currency))];
  const fxRates = await buildFxRates(currencies.length > 0 ? currencies : [DISPLAY_CURRENCY]);

  let dividendenBrutto = 0;
  let steuern = 0;
  let gebuehren = 0;
  const cashFlowByDate = new Map<string, number>();
  const izfCashFlows: { amount: number; when: Date }[] = [];

  for (const t of periodTransactions) {
    const fxRate = fxRates.get(t.currency) ?? 1;
    const amount = toNumber(t.quantity) * toNumber(t.price) * fxRate;
    const fee = toNumber(t.fee) * fxRate;
    const tax = toNumber(t.tax) * fxRate;
    steuern += tax;
    gebuehren += fee;

    const dateKey = t.date.toISOString().slice(0, 10);

    if (t.type === "DIVIDEND") {
      dividendenBrutto += amount;
      izfCashFlows.push({ amount: amount - tax, when: t.date });
      continue;
    }

    if (t.type === "BUY") {
      cashFlowByDate.set(dateKey, (cashFlowByDate.get(dateKey) ?? 0) + amount);
      izfCashFlows.push({ amount: -(amount + fee), when: t.date });
    } else {
      cashFlowByDate.set(dateKey, (cashFlowByDate.get(dateKey) ?? 0) - amount);
      izfCashFlows.push({ amount: amount - fee - tax, when: t.date });
    }
  }

  const series = await getValueHistory(userId, start, end);
  const ttwror = computeTTWROR(series, cashFlowByDate);

  // Only add a virtual "bought everything I already held" outflow at the
  // period start if a position actually carries in from before it —
  // otherwise (e.g. the default "seit Kauf" period, which starts exactly on
  // the first transaction) that transaction is already in izfCashFlows and
  // adding series[0].value again would double-count the initial investment.
  const priorPositionCount = await prisma.holding.count({ where: { userId, date: { lt: start } } });
  const startValue = series[0]?.value ?? 0;
  if (priorPositionCount > 0 && startValue > 1e-9) {
    izfCashFlows.unshift({ amount: -startValue, when: start });
  }
  izfCashFlows.push({ amount: summary.totalValue, when: end });

  let izf: number | null = null;
  const hasPositive = izfCashFlows.some((c) => c.amount > 0);
  const hasNegative = izfCashFlows.some((c) => c.amount < 0);
  const spansMultipleDays = izfCashFlows.some(
    (c) => c.when.getTime() !== izfCashFlows[0].when.getTime(),
  );
  if (izfCashFlows.length >= 2 && hasPositive && hasNegative && spansMultipleDays) {
    try {
      izf = xirr(izfCashFlows);
    } catch {
      izf = null;
    }
  }

  const gewinn = summary.totalGain + summary.totalRealizedGain + dividendenBrutto;
  const nettogewinn = gewinn - steuern - gebuehren;

  return {
    totalValue: summary.totalValue,
    investedValue: summary.totalInvested,
    kursgewinn: summary.totalGain,
    realisiertBrutto: summary.totalRealizedGain,
    dividendenBrutto,
    steuern,
    gebuehren,
    gewinn,
    nettogewinn,
    izf,
    ttwror,
  };
}
