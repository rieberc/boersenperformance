import { prisma } from "@/lib/prisma";
import { getValueHistory, type ValuePoint } from "@/lib/portfolio/history";
import type { AssetType } from "@/generated/prisma/client";

export type MonthPerformance = {
  month: number;
  absoluteGain: number;
  percentGain: number | null;
};

export type YearPerformance = {
  year: number;
  absoluteGain: number;
  percentGain: number | null;
  months: MonthPerformance[];
};

function monthKey(date: string): string {
  return date.slice(0, 7);
}

/**
 * Chains daily time-weighted growth factors across a segment of points (same
 * technique as computeTTWROR in performance.ts), plus the segment's plain
 * absolute gain (value change net of contributions). `points` must include
 * one anchor point from just before the segment as points[0].
 */
function twrSegment(points: ValuePoint[]): { twrFactor: number | null; absoluteGain: number } {
  if (points.length < 2) return { twrFactor: null, absoluteGain: 0 };

  let factor = 1;
  let hasData = false;

  for (let i = 1; i < points.length; i++) {
    const prevValue = points[i - 1].value;
    if (prevValue <= 1e-9) continue;

    const cf = points[i].contributed - points[i - 1].contributed;
    const dailyGrowth = (points[i].value - cf) / prevValue;
    if (dailyGrowth > 0) {
      factor *= dailyGrowth;
      hasData = true;
    }
  }

  const startValue = points[0].value;
  const endValue = points[points.length - 1].value;
  const contributions = points[points.length - 1].contributed - points[0].contributed;
  const absoluteGain = endValue - startValue - contributions;

  return { twrFactor: hasData ? factor : null, absoluteGain };
}

export async function getYearlyPerformance(userId: string, assetTypes?: AssetType[]): Promise<YearPerformance[]> {
  const earliest = await prisma.holding.findFirst({
    where: { userId, ...(assetTypes ? { assetType: { in: assetTypes } } : {}) },
    orderBy: { date: "asc" },
    select: { date: true },
  });
  if (!earliest) return [];

  const series = await getValueHistory(userId, earliest.date, new Date(), assetTypes);
  if (series.length === 0) return [];

  const zeroAnchor: ValuePoint = { date: "", value: 0, contributed: 0 };

  const pointsByMonth = new Map<string, ValuePoint[]>();
  for (const point of series) {
    const key = monthKey(point.date);
    const list = pointsByMonth.get(key) ?? [];
    list.push(point);
    pointsByMonth.set(key, list);
  }

  const monthKeys = [...pointsByMonth.keys()].sort();
  const monthResults = new Map<string, { twrFactor: number | null; absoluteGain: number }>();

  let previousPoint = zeroAnchor;
  for (const key of monthKeys) {
    const points = pointsByMonth.get(key)!;
    monthResults.set(key, twrSegment([previousPoint, ...points]));
    previousPoint = points[points.length - 1];
  }

  const years = new Map<number, YearPerformance>();
  for (const key of monthKeys) {
    const [yearStr, monthStr] = key.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const result = monthResults.get(key)!;

    if (!years.has(year)) {
      years.set(year, { year, absoluteGain: 0, percentGain: null, months: [] });
    }
    const yearEntry = years.get(year)!;
    yearEntry.months.push({
      month,
      absoluteGain: result.absoluteGain,
      percentGain: result.twrFactor != null ? (result.twrFactor - 1) * 100 : null,
    });
    yearEntry.absoluteGain += result.absoluteGain;
  }

  for (const yearEntry of years.values()) {
    let factor = 1;
    let hasData = false;
    for (const m of yearEntry.months) {
      if (m.percentGain != null) {
        factor *= 1 + m.percentGain / 100;
        hasData = true;
      }
    }
    yearEntry.percentGain = hasData ? (factor - 1) * 100 : null;
    yearEntry.months.sort((a, b) => b.month - a.month);
  }

  return [...years.values()].sort((a, b) => b.year - a.year);
}
