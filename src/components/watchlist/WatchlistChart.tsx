"use client";

import { useState } from "react";
import { Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WatchlistPerformanceItem, WatchlistPerformancePoint } from "@/lib/portfolio/watchlist";
import { formatCurrency } from "@/lib/utils/currency";

export const WATCHLIST_COLORS = ["#0d2b4e", "#0ea780", "#e34850", "#f0a202", "#8aa4bd", "#5fb8a0"];

// Matches the (non-exported) key format getWatchlistPerformance stores each
// symbol's absolute price under — kept as a plain literal here rather than a
// shared import, since that module pulls in server-only deps (Prisma,
// yahoo-finance2) that must never reach this "use client" component.
function pricePointKey(symbol: string): string {
  return `${symbol}::price`;
}

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

type TooltipEntry = {
  dataKey?: string | number;
  name?: string;
  value?: string | number;
  color?: string;
  payload?: WatchlistPerformancePoint;
};

function WatchlistTooltip({
  active,
  payload,
  label,
  currencyBySymbol,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  currencyBySymbol: Map<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-navy">{new Date(String(label)).toLocaleDateString("de-DE")}</p>
      {payload.map((entry) => {
        const symbol = String(entry.dataKey);
        const price = entry.payload?.[pricePointKey(symbol)];
        const currency = currencyBySymbol.get(symbol);
        return (
          <p key={symbol} style={{ color: entry.color }}>
            {entry.name}: {formatPercent(Number(entry.value))}
            {typeof price === "number" && currency && ` · ${formatCurrency(price, currency)}`}
          </p>
        );
      })}
    </div>
  );
}

export function WatchlistChart({
  items,
  points,
}: {
  items: WatchlistPerformanceItem[];
  points: WatchlistPerformancePoint[];
}) {
  const [hiddenSymbols, setHiddenSymbols] = useState<Set<string>>(new Set());

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

  const currencyBySymbol = new Map(items.map((item) => [item.symbol, item.currency]));
  const colorBySymbol = new Map(items.map((item, index) => [item.symbol, WATCHLIST_COLORS[index % WATCHLIST_COLORS.length]]));

  function toggle(symbol: string) {
    setHiddenSymbols((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
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
          <Tooltip content={<WatchlistTooltip currencyBySymbol={currencyBySymbol} />} />
          <Legend
            wrapperStyle={{ fontSize: 12, cursor: "pointer" }}
            onClick={(entry) => {
              if (typeof entry.dataKey === "string") toggle(entry.dataKey);
            }}
            formatter={(value, entry) => (
              <span
                className={hiddenSymbols.has(String(entry.dataKey)) ? "text-muted line-through" : "text-muted"}
              >
                {value}
              </span>
            )}
          />
          {items.map((item) => (
            <Line
              key={item.symbol}
              type="monotone"
              dataKey={item.symbol}
              name={item.name}
              stroke={colorBySymbol.get(item.symbol)}
              strokeWidth={2}
              dot={false}
              connectNulls
              hide={hiddenSymbols.has(item.symbol)}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
