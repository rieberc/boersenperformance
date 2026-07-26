"use client";

import { useQuery } from "@tanstack/react-query";
import { formatEUR } from "@/lib/utils/currency";
import type { PerformanceOverview as PerformanceOverviewData } from "@/lib/portfolio/performance";

function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

function Row({
  label,
  value,
  bold,
  positive,
}: {
  label: string;
  value: string;
  bold?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className={bold ? "text-sm font-semibold text-navy" : "text-sm text-muted"}>{label}</span>
      <span
        className={
          bold
            ? "text-sm font-bold text-navy"
            : positive === true
              ? "text-sm font-medium text-accent-dark"
              : positive === false
                ? "text-sm font-medium text-negative"
                : "text-sm font-medium text-navy"
        }
      >
        {value}
      </span>
    </div>
  );
}

export function PerformanceOverview({
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
    queryKey: ["portfolio", "performance", basePath, start, end, types ?? null],
    queryFn: async (): Promise<PerformanceOverviewData> => {
      const url = types
        ? `${basePath}/performance?start=${start}&end=${end}&types=${types}`
        : `${basePath}/performance?start=${start}&end=${end}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      return res.json();
    },
  });

  if (isFetching && !data) {
    return <div className="py-6 text-center text-sm text-muted">Lädt…</div>;
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>seit {new Date(start).toLocaleDateString("de-DE")}</span>
        <span>in EUR</span>
      </div>

      <Row label="Portfoliowert" value={formatEUR(data.totalValue)} />
      <Row label="Investiert" value={formatEUR(data.investedValue)} />
      <Row label="IZF" value={data.izf != null ? formatPercent(data.izf) : "–"} positive={data.izf != null ? data.izf >= 0 : undefined} />
      <Row
        label="TTWROR"
        value={data.ttwror != null ? formatPercent(data.ttwror) : "–"}
        positive={data.ttwror != null ? data.ttwror >= 0 : undefined}
      />

      <div className="my-2 border-t border-border" />

      <Row label="Kursgewinn" value={formatEUR(data.kursgewinn)} positive={data.kursgewinn >= 0} />
      <Row label="Realisiert (Brutto)" value={formatEUR(data.realisiertBrutto)} positive={data.realisiertBrutto >= 0} />
      <Row label="Dividenden (Brutto)" value={formatEUR(data.dividendenBrutto)} />
      <Row label="Gewinn" value={formatEUR(data.gewinn)} bold />

      <div className="my-2 border-t border-border" />

      <Row label="Steuern" value={formatEUR(data.steuern)} />
      <Row label="Gebühren" value={formatEUR(data.gebuehren)} />
      <Row label="Nettogewinn" value={formatEUR(data.nettogewinn)} bold />
    </div>
  );
}
