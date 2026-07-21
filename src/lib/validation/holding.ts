import { z } from "zod";

export const assetTypeSchema = z.enum(["STOCK", "ETF", "CRYPTO"]);
export const transactionTypeSchema = z.enum(["BUY", "SELL", "DIVIDEND"]);

export const holdingSchema = z.object({
  assetType: assetTypeSchema,
  symbol: z.string().trim().min(1, "Wertpapier auswählen"),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3, "3-stelliger Währungscode, z.B. EUR"),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein"),
  price: z.coerce.number().positive("Preis muss größer als 0 sein"),
  date: z.coerce.date(),
});

export type HoldingInput = z.infer<typeof holdingSchema>;

export const sellSchema = z.object({
  symbol: z.string().trim().min(1),
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein"),
  price: z.coerce.number().positive("Preis muss größer als 0 sein"),
  date: z.coerce.date(),
});

export type SellInput = z.infer<typeof sellSchema>;

export const editTransactionSchema = z.object({
  type: transactionTypeSchema,
  quantity: z.coerce.number().positive("Menge muss größer als 0 sein"),
  price: z.coerce.number().positive("Preis muss größer als 0 sein"),
  fee: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  currency: z.string().trim().length(3, "3-stelliger Währungscode, z.B. EUR"),
  date: z.coerce.date(),
});

export type EditTransactionInput = z.infer<typeof editTransactionSchema>;
