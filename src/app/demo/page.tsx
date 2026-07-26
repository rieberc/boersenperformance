import { getDemoUserId } from "@/lib/demo/seed";
import { getPortfolioSummary } from "@/lib/portfolio/summary";
import { DashboardView } from "@/components/dashboard/DashboardView";

// Prices and the seeded demo portfolio should stay live, not get frozen into
// the build's static output (this page has no cookies/headers usage, so
// without this it would otherwise be eligible for static generation).
export const dynamic = "force-dynamic";

export default async function DemoPage() {
  const userId = await getDemoUserId();
  const summary = await getPortfolioSummary(userId);

  return <DashboardView initialSummary={summary} basePath="/api/demo" readOnly />;
}
