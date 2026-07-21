import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPortfolioSummary } from "@/lib/portfolio/summary";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const summary = await getPortfolioSummary(session.user.id);
  return NextResponse.json(summary);
}
