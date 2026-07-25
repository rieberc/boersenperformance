import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getQuotesWithCache } from "@/lib/prices/cache";
import { sendPushToUser } from "@/lib/push/send";
import { sendAlertEmail } from "@/lib/email/send";
import { toNumber } from "@/lib/utils/decimal";
import type { AlertDirection } from "@/generated/prisma/client";

export const maxDuration = 60;

function hasCrossed(direction: AlertDirection, price: number, target: number): boolean {
  return direction === "ABOVE" ? price >= target : price <= target;
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const alerts = await prisma.priceAlert.findMany({
    where: { active: true },
    include: { user: { select: { email: true } } },
  });
  if (alerts.length === 0) {
    return NextResponse.json({ checked: 0, triggered: 0 });
  }

  const symbols = [...new Set(alerts.map((a) => a.symbol))];
  const quotes = await getQuotesWithCache(symbols);

  const toTrigger = alerts.filter((alert) => {
    const quote = quotes.get(alert.symbol);
    if (!quote) return false;
    return hasCrossed(alert.direction, quote.price, toNumber(alert.targetPrice));
  });

  await Promise.allSettled(
    toTrigger.map(async (alert) => {
      const quote = quotes.get(alert.symbol)!;
      const directionLabel = alert.direction === "ABOVE" ? "über" : "unter";
      const message = `${alert.name}: aktuell ${quote.price} ${quote.currency} (Ziel: ${toNumber(alert.targetPrice)} ${alert.currency})`;

      await prisma.priceAlert.update({
        where: { id: alert.id },
        data: { active: false, triggeredAt: new Date() },
      });

      await Promise.allSettled([
        sendPushToUser(alert.userId, {
          title: `${alert.symbol} ${directionLabel} Zielwert`,
          body: message,
          url: "/dashboard/watchlist",
        }),
        sendAlertEmail(alert.user.email, {
          subject: `${alert.symbol} ${directionLabel} Zielwert erreicht`,
          body: message,
        }),
      ]);
    }),
  );

  return NextResponse.json({ checked: alerts.length, triggered: toTrigger.length });
}
