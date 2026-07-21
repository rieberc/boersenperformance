import type { Prisma } from "@/generated/prisma/client";

export function toNumber(value: Prisma.Decimal | number | string): number {
  return typeof value === "object" ? value.toNumber() : Number(value);
}
