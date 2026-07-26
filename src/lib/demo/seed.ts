import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { cashSymbolForBank } from "@/lib/utils/cash";

export const DEMO_EMAIL = "demo@boersenperformance.local";

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function seedDemoHoldings(userId: string) {
  await prisma.holding.createMany({
    data: [
      // ETFs
      { userId, assetType: "ETF", type: "BUY", symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", currency: "EUR", quantity: 40, price: 89.5, date: daysAgo(720) },
      { userId, assetType: "ETF", type: "BUY", symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", currency: "EUR", quantity: 30, price: 98.2, date: daysAgo(420) },
      { userId, assetType: "ETF", type: "BUY", symbol: "VWCE.DE", name: "Vanguard FTSE All-World UCITS ETF", currency: "EUR", quantity: 25, price: 108.7, date: daysAgo(150) },
      { userId, assetType: "ETF", type: "BUY", symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", currency: "EUR", quantity: 20, price: 78.4, date: daysAgo(600) },
      { userId, assetType: "ETF", type: "BUY", symbol: "IWDA.AS", name: "iShares Core MSCI World UCITS ETF", currency: "EUR", quantity: 15, price: 85.1, date: daysAgo(240) },

      // A small ETF position that was fully sold, to show off "Verkaufte Wertpapiere"
      { userId, assetType: "ETF", type: "BUY", symbol: "EXS1.DE", name: "iShares Core DAX UCITS ETF", currency: "EUR", quantity: 20, price: 130, date: daysAgo(500) },
      { userId, assetType: "ETF", type: "SELL", symbol: "EXS1.DE", name: "iShares Core DAX UCITS ETF", currency: "EUR", quantity: 20, price: 152, date: daysAgo(100) },

      // Stocks
      { userId, assetType: "STOCK", type: "BUY", symbol: "AAPL", name: "Apple Inc.", currency: "USD", quantity: 8, price: 165, date: daysAgo(500) },
      { userId, assetType: "STOCK", type: "BUY", symbol: "AAPL", name: "Apple Inc.", currency: "USD", quantity: 4, price: 185, date: daysAgo(200) },
      { userId, assetType: "STOCK", type: "BUY", symbol: "MSFT", name: "Microsoft Corporation", currency: "USD", quantity: 5, price: 310, date: daysAgo(450) },
      { userId, assetType: "STOCK", type: "DIVIDEND", symbol: "MSFT", name: "Microsoft Corporation", currency: "USD", quantity: 1, price: 14.5, date: daysAgo(90) },

      // Two positions bought near their all-time highs, to show a portfolio
      // can also carry clear losers, not just winners.
      { userId, assetType: "STOCK", type: "BUY", symbol: "PYPL", name: "PayPal Holdings Inc.", currency: "USD", quantity: 10, price: 295, date: daysAgo(1000) },
      { userId, assetType: "STOCK", type: "BUY", symbol: "NKE", name: "Nike Inc.", currency: "USD", quantity: 12, price: 172, date: daysAgo(950) },

      // A fully closed position with a large realized gain, to show off that
      // side of "Verkaufte Wertpapiere" alongside the DAX example above.
      // Buy/sell prices are NVDA's real historical closes (in USD, converted
      // at today's FX rate — the same conversion the value-history chart
      // uses) so "Realisiert" here agrees with what the chart shows for the
      // same period, instead of an arbitrary made-up gain.
      { userId, assetType: "STOCK", type: "BUY", symbol: "NVDA", name: "NVIDIA Corporation", currency: "EUR", quantity: 397.32, price: 12.58, date: new Date("2023-01-01") },
      // Fee: a flat 1€ order fee, typical of German neobrokers (Trade
      // Republic/Scalable Capital). Tax: German Abgeltungssteuer (25%) plus
      // Solidaritätszuschlag (5.5% of that), i.e. 26.375% flat on the gross
      // gain (61.759,42€), withheld at the broker as is standard without a
      // Freistellungsauftrag covering the full amount.
      { userId, assetType: "STOCK", type: "SELL", symbol: "NVDA", name: "NVIDIA Corporation", currency: "EUR", quantity: 397.32, price: 168.02, fee: 1, tax: 16289.05, date: new Date("2026-02-01") },

      // Crypto
      { userId, assetType: "CRYPTO", type: "BUY", symbol: "BTC-EUR", name: "Bitcoin", currency: "EUR", quantity: 0.08, price: 32000, date: daysAgo(480) },
      { userId, assetType: "CRYPTO", type: "BUY", symbol: "BTC-EUR", name: "Bitcoin", currency: "EUR", quantity: 0.04, price: 45000, date: daysAgo(160) },
      { userId, assetType: "CRYPTO", type: "BUY", symbol: "ETH-EUR", name: "Ethereum", currency: "EUR", quantity: 1.2, price: 1900, date: daysAgo(400) },

      // Festgeld
      {
        userId,
        assetType: "CASH",
        type: "BUY",
        symbol: cashSymbolForBank("Demo-Festgeldkonto"),
        name: "Demo-Festgeldkonto",
        currency: "EUR",
        quantity: 320,
        price: 1,
        date: daysAgo(60),
      },
    ],
  });
}

async function seedDemoWatchlist(userId: string) {
  await prisma.watchlistItem.createMany({
    data: [
      { userId, assetType: "STOCK", symbol: "AMZN", name: "Amazon.com Inc.", currency: "USD" },
      { userId, assetType: "CRYPTO", symbol: "SOL-EUR", name: "Solana", currency: "EUR" },
    ],
  });
}

/**
 * The public demo (accessible without login) reads/writes a single fixed
 * account so every visitor sees the same portfolio. Its password hash is a
 * throwaway random value never surfaced anywhere, so it can't be logged into
 * even if someone guesses the email.
 */
export async function getDemoUserId(): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL }, select: { id: true } });
  if (existing) return existing.id;

  try {
    const passwordHash = await bcrypt.hash(crypto.randomUUID() + crypto.randomUUID(), 10);
    const user = await prisma.user.create({ data: { email: DEMO_EMAIL, passwordHash, name: "Demo" } });
    await Promise.all([seedDemoHoldings(user.id), seedDemoWatchlist(user.id)]);
    return user.id;
  } catch {
    // Two concurrent first-visitors can race the create above; the loser
    // just reads back what the winner created.
    const fallback = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL }, select: { id: true } });
    return fallback.id;
  }
}
