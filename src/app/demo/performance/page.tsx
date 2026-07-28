import { getDemoUserId } from "@/lib/demo/seed";
import { getYearlyPerformance } from "@/lib/portfolio/yearlyPerformance";
import { PerformanceHistoryView } from "@/components/performance/PerformanceHistoryView";

export const dynamic = "force-dynamic";

export default async function DemoPerformanceHistoryPage() {
  const userId = await getDemoUserId();

  // Matches the Dashboard's default asset-type filter (Wertpapiere only) so
  // the "Gewinn" figures shown on both pages agree by default.
  const years = await getYearlyPerformance(userId, ["STOCK", "ETF"]);

  return <PerformanceHistoryView initialYears={years} basePath="/api/demo" backHref="/demo" />;
}
