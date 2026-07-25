import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getYearlyPerformance } from "@/lib/portfolio/yearlyPerformance";
import { PerformanceHistoryView } from "@/components/performance/PerformanceHistoryView";

export default async function PerformanceHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Matches the Dashboard's default asset-type filter (Wertpapiere only) so
  // the "Gewinn" figures shown on both pages agree by default.
  const years = await getYearlyPerformance(session.user.id, ["STOCK", "ETF"]);

  return <PerformanceHistoryView initialYears={years} />;
}
