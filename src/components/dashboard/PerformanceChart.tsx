"use client";

import { useQuery } from "@tanstack/react-query";
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEUR } from "@/lib/utils/currency";
import type { ValuePoint } from "@/lib/portfolio/history";

function formatCompactEUR(value: number) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    notation: "compact",
    maximumFractionDigits: 0,
  });
}

export function PerformanceChart({
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

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7684" }}
            tickFormatter={(v: string) => new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
            minTickGap={40}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={80}
            tick={{ fontSize: 11, fill: "#6b7684" }}
            tickFormatter={(v: number) => formatCompactEUR(v)}
            axisLine={false}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
          />
          <Tooltip
            formatter={(value, name) => [formatEUR(Number(value)), name]}
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString("de-DE")}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-muted">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="value"
            name="Portfoliowert"
            stroke="#0ea780"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="contributed"
            name="Zugeführtes Kapital"
            stroke="#8aa4bd"
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
