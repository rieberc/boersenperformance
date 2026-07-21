import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/portfolio/summary";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const summary = await getPortfolioSummary(session.user.id);

  return <DashboardView initialSummary={summary} />;
}
