import { z } from "zod";

export const interestSchema = z.object({
  bank: z.string().trim().min(1, "Bank angeben"),
  amountNet: z.coerce.number().positive("Betrag muss größer als 0 sein"),
  date: z.coerce.date(),
});

export type InterestInput = z.infer<typeof interestSchema>;
