import { getDemoUserId } from "@/lib/demo/seed";
import { getWatchlistPerformance } from "@/lib/portfolio/watchlist";
import { resolvePresetRange } from "@/lib/utils/dateRange";
import { WatchlistView } from "@/components/watchlist/WatchlistView";

export const dynamic = "force-dynamic";

export default async function DemoWatchlistPage() {
  const userId = await getDemoUserId();
  const range = resolvePresetRange("30d", null);
  const performance = await getWatchlistPerformance(userId, range.start, range.end);

  return (
    <WatchlistView
      initialPerformance={performance}
      basePath="/api/demo/watchlist"
      backHref="/demo"
      readOnly
    />
  );
}
