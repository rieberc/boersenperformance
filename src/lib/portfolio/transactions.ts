import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils/decimal";
import type { AssetType, TransactionType } from "@/generated/prisma/client";

export type TransactionSummary = {
  id: string;
  assetType: AssetType;
  type: TransactionType;
  symbol: string;
  name: string;
  currency: string;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  date: string;
};

export async function getTransactions(userId: string): Promise<TransactionSummary[]> {
  const rows = await prisma.holding.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    assetType: r.assetType,
    type: r.type,
    symbol: r.symbol,
    name: r.name,
    currency: r.currency,
    quantity: toNumber(r.quantity),
    price: toNumber(r.price),
    fee: toNumber(r.fee),
    tax: toNumber(r.tax),
    date: r.date.toISOString(),
  }));
}
