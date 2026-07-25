"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { priceAlertSchema, pushSubscriptionSchema, type PushSubscriptionInput } from "@/lib/validation/alert";

export type AlertFormState = { error?: string } | undefined;

export async function createAlertAction(
  _prevState: AlertFormState,
  formData: FormData,
): Promise<AlertFormState> {
  const userId = await requireUserId();

  const parsed = priceAlertSchema.safeParse({
    symbol: formData.get("symbol"),
    name: formData.get("name"),
    currency: formData.get("currency"),
    direction: formData.get("direction"),
    targetPrice: formData.get("targetPrice"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  await prisma.priceAlert.create({ data: { ...parsed.data, userId } });

  revalidatePath("/dashboard/watchlist");
  return {};
}

export async function deleteAlertAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.priceAlert.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/watchlist");
}

export async function subscribePushAction(subscription: PushSubscriptionInput): Promise<{ error?: string }> {
  const userId = await requireUserId();

  const parsed = pushSubscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { error: "Ungültige Push-Subscription." };
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    create: {
      userId,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
    update: {
      userId,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return {};
}
