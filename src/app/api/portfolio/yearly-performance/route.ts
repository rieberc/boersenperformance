import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getYearlyPerformance } from "@/lib/portfolio/yearlyPerformance";
import { parseAssetTypesParam } from "@/lib/utils/assetTypeFilter";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const assetTypes = parseAssetTypesParam(request.nextUrl.searchParams.get("types"));
  const years = await getYearlyPerformance(session.user.id, assetTypes);
  return NextResponse.json({ years });
}
