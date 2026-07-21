import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { yahooPriceProvider } from "@/lib/prices/yahoo";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await yahooPriceProvider.search(query);
  return NextResponse.json({ results });
}
