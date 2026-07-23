import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWatchlistPerformance } from "@/lib/portfolio/watchlist";
import { resolvePresetRange } from "@/lib/utils/dateRange";
import { WatchlistView } from "@/components/watchlist/WatchlistView";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const range = resolvePresetRange("30d", null);
  const performance = await getWatchlistPerformance(session.user.id, range.start, range.end);

  return <WatchlistView initialPerformance={performance} />;
}
