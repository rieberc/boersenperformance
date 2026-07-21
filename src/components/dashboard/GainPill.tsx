import { clsx } from "clsx";

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function GainPill({ percent, className }: { percent: number; className?: string }) {
  const isPositive = percent >= 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        isPositive ? "bg-accent-soft text-accent-dark" : "bg-negative-soft text-negative",
        className,
      )}
    >
      {isPositive ? "↑" : "↓"} {formatPercent(percent)}
    </span>
  );
}
