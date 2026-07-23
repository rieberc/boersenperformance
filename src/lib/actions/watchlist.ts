"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { watchlistItemSchema } from "@/lib/validation/watchlist";

export type WatchlistFormState = { error?: string } | undefined;

export async function addWatchlistItemAction(
  _prevState: WatchlistFormState,
  formData: FormData,
): Promise<WatchlistFormState> {
  const userId = await requireUserId();

  const parsed = watchlistItemSchema.safeParse({
    assetType: formData.get("assetType"),
    symbol: formData.get("symbol"),
    name: formData.get("name"),
    currency: formData.get("currency"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ungültige Eingabe." };
  }

  const existing = await prisma.watchlistItem.findUnique({
    where: { userId_symbol: { userId, symbol: parsed.data.symbol } },
  });
  if (existing) {
    return { error: "Ist bereits auf der Watchlist." };
  }

  await prisma.watchlistItem.create({ data: { ...parsed.data, userId } });

  revalidatePath("/dashboard/watchlist");
  return {};
}

export async function removeWatchlistItemAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.watchlistItem.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/watchlist");
}
