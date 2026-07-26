import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/seed";
import { getPerformanceOverview } from "@/lib/portfolio/performance";
import { parseAssetTypesParam } from "@/lib/utils/assetTypeFilter";

export async function GET(request: NextRequest) {
  const startParam = request.nextUrl.searchParams.get("start");
  const endParam = request.nextUrl.searchParams.get("end");
  if (!startParam || !endParam) {
    return NextResponse.json({ error: "start und end sind erforderlich." }, { status: 400 });
  }

  const start = new Date(startParam);
  const end = new Date(endParam);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Ungültiger Zeitraum." }, { status: 400 });
  }

  const assetTypes = parseAssetTypesParam(request.nextUrl.searchParams.get("types"));
  const userId = await getDemoUserId();
  const overview = await getPerformanceOverview(userId, start, end, assetTypes);
  return NextResponse.json(overview);
}
