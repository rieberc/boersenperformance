"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { interestSchema } from "@/lib/validation/interest";
import { cashSymbolForBank } from "@/lib/utils/cash";

export type InterestFormState = { error?: string } | undefined;

export async function addInterestAction(
  _prevState: InterestFormState,
  formData: FormData,
): Promise<InterestFormState> {
  const userId = await requireUserId();

  const parsed = interestSchema.safeParse({
    bank: formData.get("bank"),
    amountNet: formData.get("amountNet"),
    date: formData.get("date"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await prisma.holding.create({
    data: {
      userId,
      assetType: "CASH",
      type: "BUY",
      symbol: cashSymbolForBank(parsed.data.bank),
      name: parsed.data.bank.trim(),
      currency: "EUR",
      quantity: parsed.data.amountNet,
      price: 1,
      date: parsed.data.date,
    },
  });

  revalidatePath("/dashboard");
  return {};
}
