"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { formatEUR } from "@/lib/utils/currency";

const COLORS = ["#0d2b4e", "#0ea780", "#16385f", "#5fb8a0", "#8aa4bd", "#c9d6e3"];

export function AllocationDonut({
  holdings,
  totalValue,
}: {
  holdings: Array<{ id: string; name: string; currentValue: number }>;
  totalValue: number;
}) {
  const data = holdings
    .filter((h) => h.currentValue > 0)
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((h) => ({ name: h.name, value: h.currentValue }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted">
        Noch keine Bestände
      </div>
    );
  }

  return (
    <div className="relative h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="65%"
            outerRadius="100%"
            paddingAngle={data.length > 1 ? 2 : 0}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-lg font-bold text-navy">{formatEUR(totalValue)}</p>
      </div>
    </div>
  );
}
