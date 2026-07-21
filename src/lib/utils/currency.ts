export function formatEUR(value: number) {
  return formatCurrency(value, "EUR");
}

export function formatCurrency(value: number, currency: string) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
