import { z } from "zod";

export const alertDirectionSchema = z.enum(["ABOVE", "BELOW"]);

export const priceAlertSchema = z.object({
  symbol: z.string().trim().min(1),
  name: z.string().trim().min(1),
  currency: z.string().trim().length(3, "3-stelliger Währungscode, z.B. EUR"),
  direction: alertDirectionSchema,
  targetPrice: z.coerce.number().positive("Zielpreis muss größer als 0 sein"),
});

export type PriceAlertInput = z.infer<typeof priceAlertSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
