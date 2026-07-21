import { z } from "zod";

export const assetTypeSchema = z.enum(["STOCK", "ETF", "CRYPTO"]);

export const holdingSchema = z.object({
  assetType: assetTypeSchema,
  symbol: z.string().trim().min(1, "Wertpapier auswählen"),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3, "3-stelliger Währungscode, z.B. EUR"),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein"),
  buyPrice: z.coerce.number().positive("Kaufpreis muss größer als 0 sein"),
  buyDate: z.coerce.date(),
});

export type HoldingInput = z.infer<typeof holdingSchema>;
