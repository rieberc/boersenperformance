import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich").max(80),
  email: z.email("Bitte eine gültige E-Mail-Adresse angeben"),
  password: z
    .string()
    .min(8, "Mindestens 8 Zeichen")
    .regex(/[a-zA-Z]/, "Mindestens ein Buchstabe")
    .regex(/[0-9]/, "Mindestens eine Zahl"),
});
