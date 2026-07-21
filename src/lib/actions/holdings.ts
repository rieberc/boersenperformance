"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { toNumber } from "@/lib/utils/decimal";
import { editTransactionSchema, holdingSchema, sellSchema } from "@/lib/validation/holding";

export type HoldingFormState = { error?: string } | undefined;

export async function createHoldingAction(
  _prevState: HoldingFormState,
  formData: FormData,
): Promise<HoldingFormState> {
  const userId = await requireUserId();

  const parsed = holdingSchema.safeParse({
    assetType: formData.get("assetType"),
    symbol: formData.get("symbol"),
    name: formData.get("name"),
    currency: formData.get("currency"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await prisma.holding.create({
    data: { ...parsed.data, userId, type: "BUY" },
  });

  revalidatePath("/dashboard");
  return {};
}

async function getNetQuantity(userId: string, symbol: string): Promise<number> {
  const transactions = await prisma.holding.findMany({
    where: { userId, symbol },
    select: { type: true, quantity: true },
  });

  return transactions.reduce((net, t) => {
    if (t.type === "DIVIDEND") return net;
    const qty = toNumber(t.quantity);
    return t.type === "SELL" ? net - qty : net + qty;
  }, 0);
}

export async function createSaleAction(
  _prevState: HoldingFormState,
  formData: FormData,
): Promise<HoldingFormState> {
  const userId = await requireUserId();

  const parsed = sellSchema.safeParse({
    symbol: formData.get("symbol"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await prisma.holding.findFirst({
    where: { userId, symbol: parsed.data.symbol },
    orderBy: { createdAt: "desc" },
  });

  if (!existing) {
    return { error: "Position wurde nicht gefunden." };
  }

  const netQuantity = await getNetQuantity(userId, parsed.data.symbol);
  if (parsed.data.quantity > netQuantity + 1e-9) {
    return { error: `Du hältst nur ${netQuantity} Stück davon.` };
  }

  await prisma.holding.create({
    data: {
      userId,
      assetType: existing.assetType,
      name: existing.name,
      currency: existing.currency,
      symbol: parsed.data.symbol,
      quantity: parsed.data.quantity,
      price: parsed.data.price,
      date: parsed.data.date,
      type: "SELL",
    },
  });

  revalidatePath("/dashboard");
  return {};
}

export async function deletePositionAction(symbol: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.holding.deleteMany({ where: { symbol, userId } });
  revalidatePath("/dashboard");
}

export async function updateTransactionAction(
  id: string,
  _prevState: HoldingFormState,
  formData: FormData,
): Promise<HoldingFormState> {
  const userId = await requireUserId();

  const parsed = editTransactionSchema.safeParse({
    type: formData.get("type"),
    quantity: formData.get("quantity"),
    price: formData.get("price"),
    fee: formData.get("fee") || 0,
    tax: formData.get("tax") || 0,
    currency: formData.get("currency"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await prisma.holding.findFirst({ where: { id, userId } });
  if (!existing) {
    return { error: "Transaktion wurde nicht gefunden." };
  }

  await prisma.holding.update({
    where: { id },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  return {};
}

export async function deleteTransactionAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.holding.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard");
}
