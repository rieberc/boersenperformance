"use client";

import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WatchlistPerformanceItem, WatchlistPerformancePoint } from "@/lib/portfolio/watchlist";

export const WATCHLIST_COLORS = ["#0d2b4e", "#0ea780", "#e34850", "#f0a202", "#8aa4bd", "#5fb8a0"];

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function WatchlistChart({
  items,
  points,
}: {
  items: WatchlistPerformanceItem[];
  points: WatchlistPerformancePoint[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        Noch keine Werte auf der Watchlist.
      </div>
    );
  }

  if (points.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        Nicht genug Daten für diesen Zeitraum.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#6b7684" }}
            tickFormatter={(v: string) => new Date(v).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" })}
            minTickGap={40}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={40}
            tick={{ fontSize: 11, fill: "#6b7684" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            formatter={(value, name) => [formatPercent(Number(value)), name]}
            labelFormatter={(label) => new Date(String(label)).toLocaleDateString("de-DE")}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value) => <span className="text-muted">{value}</span>}
          />
          {items.map((item, index) => (
            <Line
              key={item.symbol}
              type="monotone"
              dataKey={item.symbol}
              name={item.name}
              stroke={WATCHLIST_COLORS[index % WATCHLIST_COLORS.length]}
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
