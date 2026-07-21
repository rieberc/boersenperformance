import { prisma } from "@/lib/prisma";
import { yahooPriceProvider } from "@/lib/prices/yahoo";
import { toNumber } from "@/lib/utils/decimal";

const PRICE_TTL_MS = 10 * 60 * 1000;

export type CachedPrice = { price: number; currency: string; updatedAt: Date };

export async function getQuotesWithCache(symbols: string[]): Promise<Map<string, CachedPrice>> {
  const unique = [...new Set(symbols)];
  const result = new Map<string, CachedPrice>();
  if (unique.length === 0) return result;

  const cached = await prisma.priceCache.findMany({ where: { symbol: { in: unique } } });
  const now = Date.now();
  const cachedBySymbol = new Map(cached.map((c) => [c.symbol, c]));

  const stale = unique.filter((symbol) => {
    const entry = cachedBySymbol.get(symbol);
    return !entry || now - entry.updatedAt.getTime() > PRICE_TTL_MS;
  });

  for (const symbol of unique) {
    const entry = cachedBySymbol.get(symbol);
    if (entry) {
      result.set(symbol, { price: toNumber(entry.price), currency: entry.currency, updatedAt: entry.updatedAt });
    }
  }

  if (stale.length === 0) return result;

  const fresh = await yahooPriceProvider.quotes(stale);
  const fetchedAt = new Date();

  await Promise.all(
    fresh.map((q) =>
      prisma.priceCache.upsert({
        where: { symbol: q.symbol },
        create: { symbol: q.symbol, price: q.price, currency: q.currency },
        update: { price: q.price, currency: q.currency },
      }),
    ),
  );

  for (const q of fresh) {
    result.set(q.symbol, { price: q.price, currency: q.currency, updatedAt: fetchedAt });
  }

  return result;
}

export async function getFxRateWithCache(from: string, to: string): Promise<number | null> {
  if (from === to) return 1;
  const pair = `${from}${to}`;

  const cached = await prisma.fxRateCache.findUnique({ where: { pair } });
  const now = Date.now();
  if (cached && now - cached.updatedAt.getTime() < PRICE_TTL_MS) {
    return toNumber(cached.rate);
  }

  const rate = await yahooPriceProvider.fxRate(from, to);
  if (rate == null) {
    return cached ? toNumber(cached.rate) : null;
  }

  await prisma.fxRateCache.upsert({
    where: { pair },
    create: { pair, rate },
    update: { rate },
  });

  return rate;
}
