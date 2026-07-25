import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils/decimal";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const symbol = request.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol ist erforderlich." }, { status: 400 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { userId: session.user.id, symbol, active: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    alerts: alerts.map((a) => ({
      id: a.id,
      symbol: a.symbol,
      direction: a.direction,
      targetPrice: toNumber(a.targetPrice),
      currency: a.currency,
    })),
  });
}
