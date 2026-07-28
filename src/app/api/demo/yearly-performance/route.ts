import { NextRequest, NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/seed";
import { getYearlyPerformance } from "@/lib/portfolio/yearlyPerformance";
import { parseAssetTypesParam } from "@/lib/utils/assetTypeFilter";

export async function GET(request: NextRequest) {
  const assetTypes = parseAssetTypesParam(request.nextUrl.searchParams.get("types"));
  const userId = await getDemoUserId();
  const years = await getYearlyPerformance(userId, assetTypes);
  return NextResponse.json({ years });
}
