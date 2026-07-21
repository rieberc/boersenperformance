"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/require-user";
import { parseDkbCsv } from "@/lib/import/dkbCsv";
import { resolveImportGroups } from "@/lib/import/resolveSymbols";
import type { ImportPreview } from "@/lib/import/types";

export type PreviewImportResult = { error: string } | { preview: ImportPreview };

export async function previewImportAction(formData: FormData): Promise<PreviewImportResult> {
  const userId = await requireUserId();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Bitte eine CSV-Datei auswählen." };
  }

  const text = await file.text();
  const { rows, skipped } = parseDkbCsv(text);

  if (rows.length === 0) {
    return { error: "Keine verwertbaren Zeilen in der Datei gefunden." };
  }

  const existing = await prisma.holding.findMany({
    where: { userId },
    select: { symbol: true },
    distinct: ["symbol"],
  });
  const existingSymbols = new Set(existing.map((h) => h.symbol));

  const groups = await resolveImportGroups(rows, existingSymbols);

  return { preview: { groups, skipped } };
}

export type ConfirmImportResult = { imported: number; skippedGroups: number };

export async function confirmImportAction(preview: ImportPreview): Promise<ConfirmImportResult> {
  const userId = await requireUserId();

  let imported = 0;
  let skippedGroups = 0;

  for (const group of preview.groups) {
    if (!group.resolved) {
      skippedGroups++;
      continue;
    }
    const { symbol, name, assetType } = group.resolved;

    await prisma.holding.createMany({
      data: group.rows.map((row) => ({
        userId,
        assetType,
        type: row.type,
        symbol,
        name,
        currency: row.currency,
        quantity: row.quantity,
        price: row.price,
        fee: row.fee,
        tax: row.tax,
        date: new Date(row.date),
      })),
    });
    imported += group.rows.length;
  }

  revalidatePath("/dashboard");
  return { imported, skippedGroups };
}
