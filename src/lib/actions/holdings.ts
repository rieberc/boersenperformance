"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { holdingSchema } from "@/lib/validation/holding";

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
    buyPrice: formData.get("buyPrice"),
    buyDate: formData.get("buyDate"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await prisma.holding.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/dashboard");
  return {};
}

export async function deleteHoldingAction(holdingId: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.holding.deleteMany({ where: { id: holdingId, userId } });
  revalidatePath("/dashboard");
}
