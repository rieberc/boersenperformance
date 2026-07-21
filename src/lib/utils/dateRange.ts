export type DateRangePreset =
  | "today"
  | "7d"
  | "30d"
  | "3m"
  | "6m"
  | "1y"
  | "3y"
  | "mtd"
  | "ytd"
  | "sinceBuy"
  | "custom";

export const PRESET_LABELS: Record<DateRangePreset, string> = {
  today: "Heute",
  "7d": "7 Tage",
  "30d": "30 Tage",
  "3m": "3 Monate",
  "6m": "6 Monate",
  "1y": "1 Jahr",
  "3y": "3 Jahre",
  mtd: "MTD",
  ytd: "YTD",
  sinceBuy: "Seit Kauf",
  custom: "Benutzerdefiniert",
};

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Server-provided timestamps (e.g. the first transaction date) are UTC
// midnight instants; truncating them with local Date methods can shift the
// calendar date by a day depending on the browser's timezone offset.
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function resolvePresetRange(
  preset: DateRangePreset,
  firstTransactionDate: Date | null,
): { start: Date; end: Date } {
  const end = startOfDay(new Date());
  const start = new Date(end);

  switch (preset) {
    case "today":
      return { start: end, end };
    case "7d":
      start.setDate(start.getDate() - 7);
      return { start, end };
    case "30d":
      start.setDate(start.getDate() - 30);
      return { start, end };
    case "3m":
      start.setMonth(start.getMonth() - 3);
      return { start, end };
    case "6m":
      start.setMonth(start.getMonth() - 6);
      return { start, end };
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      return { start, end };
    case "3y":
      start.setFullYear(start.getFullYear() - 3);
      return { start, end };
    case "mtd":
      start.setDate(1);
      return { start, end };
    case "ytd":
      start.setMonth(0, 1);
      return { start, end };
    case "sinceBuy":
      return { start: firstTransactionDate ? startOfUtcDay(firstTransactionDate) : start, end };
    case "custom":
      return { start, end };
  }
}
