"use client";

import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEUR } from "@/lib/utils/currency";
import type { ValuePoint } from "@/lib/portfolio/history";

export function PerformanceChart({ start, end }: { start: string; end: string }) {
  const { data, isFetching } = useQuery({
    queryKey: ["portfolio", "history", start, end],
    queryFn: async (): Promise<{ series: ValuePoint[] }> => {
      const res = await fetch(`/api/portfolio/history?start=${start}&end=${end}`);
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
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7684" }}
            tickFormatter={(v: string) => new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
            minTickGap={40}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={0}
            tick={false}
            axisLine={false}
            tickLine={false}
            domain={["dataMin", "dataMax"]}
          />
          <Tooltip
            formatter={(value) => [formatEUR(Number(value)), "Wert"]}
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString("de-DE")}
          />
          <Line type="monotone" dataKey="value" stroke="#0ea780" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
