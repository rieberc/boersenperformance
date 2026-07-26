import { NextResponse } from "next/server";
import { getDemoUserId } from "@/lib/demo/seed";
import { getPortfolioSummary } from "@/lib/portfolio/summary";

export async function GET() {
  const userId = await getDemoUserId();
  const summary = await getPortfolioSummary(userId);
  return NextResponse.json(summary);
}
