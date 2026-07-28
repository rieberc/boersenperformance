"use client";

import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ValuePoint } from "@/lib/portfolio/history";

type DrawdownPoint = { date: string; drawdown: number };

function computeDrawdown(series: ValuePoint[]) {
  let peak = -Infinity;
  let peakDate: string | null = null;
  let maxDrawdown = 0;
  let maxDrawdownPeakDate: string | null = null;
  let maxDrawdownTroughDate: string | null = null;
  const points: DrawdownPoint[] = [];

  for (const p of series) {
    if (p.value > peak) {
      peak = p.value;
      peakDate = p.date;
    }
    const drawdown = peak > 0 ? (p.value - peak) / peak : 0;
    points.push({ date: p.date, drawdown });

    if (drawdown < maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownPeakDate = peakDate;
      maxDrawdownTroughDate = p.date;
    }
  }

  return { points, maxDrawdown, peakDate: maxDrawdownPeakDate, troughDate: maxDrawdownTroughDate };
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000));
}

function formatPercent(value: number) {
  return `${(value * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function DrawdownChart({
  start,
  end,
  types,
  basePath = "/api/portfolio",
}: {
  start: string;
  end: string;
  types?: string;
  basePath?: string;
}) {
  const { data, isFetching } = useQuery({
    queryKey: ["portfolio", "history", basePath, start, end, types ?? null],
    queryFn: async (): Promise<{ series: ValuePoint[] }> => {
      const url = types
        ? `${basePath}/history?start=${start}&end=${end}&types=${types}`
        : `${basePath}/history?start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      return res.json();
    },
  });

  const series = data?.series ?? [];

  if (isFetching && series.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-muted">Lädt…</div>;
  }

  if (series.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        Nicht genug Daten für diesen Zeitraum.
      </div>
    );
  }

  const { points, maxDrawdown, peakDate, troughDate } = computeDrawdown(series);
  const duration = peakDate && troughDate ? daysBetween(peakDate, troughDate) : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-5">
        <div>
          <p className="text-xs text-muted">Maximaler Drawdown</p>
          <p className="text-sm font-semibold text-negative">{formatPercent(maxDrawdown)}</p>
        </div>
        {duration != null && (
          <div>
            <p className="text-xs text-muted">Dauer</p>
            <p className="text-sm font-semibold text-navy">{duration} Tage</p>
          </div>
        )}
        {peakDate && troughDate && (
          <div>
            <p className="text-xs text-muted">Periode</p>
            <p className="text-sm font-semibold text-navy">
              {new Date(peakDate).toLocaleDateString("de-DE")} - {new Date(troughDate).toLocaleDateString("de-DE")}
            </p>
          </div>
        )}
      </div>

      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#6b7684" }}
              tickFormatter={(v: string) => new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
              minTickGap={40}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11, fill: "#6b7684" }}
              width={40}
              axisLine={false}
              tickLine={false}
              domain={["dataMin", 0]}
            />
            <Tooltip
              formatter={(value) => [formatPercent(Number(value)), "Drawdown"]}
              labelFormatter={(label) => new Date(String(label)).toLocaleDateString("de-DE")}
            />
            <ReferenceLine y={0} stroke="#c9d6e3" />
            <Area type="monotone" dataKey="drawdown" stroke="#e34850" fill="#e34850" fillOpacity={0.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
