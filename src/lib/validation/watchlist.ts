import { z } from "zod";
import { assetTypeSchema } from "@/lib/validation/holding";

export const watchlistItemSchema = z.object({
  assetType: assetTypeSchema,
  symbol: z.string().trim().min(1, "Wertpapier auswählen"),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3, "3-stelliger Währungscode, z.B. EUR"),
});

export type WatchlistItemInput = z.infer<typeof watchlistItemSchema>;
