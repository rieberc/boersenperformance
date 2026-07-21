import Papa from "papaparse";
import type { RawImportRow } from "@/lib/import/types";

type DkbCsvRow = {
  datetime: string;
  date: string;
  time: string;
  price: string;
  shares: string;
  amount: string;
  tax: string;
  fee: string;
  realizedgains: string;
  type: string;
  broker: string;
  assettype: string;
  identifier: string;
  wkn: string;
  originalcurrency: string;
  currency: string;
  fxrate: string;
  holding: string;
  holdingname: string;
  holdingnickname: string;
  exchange: string;
  avgholdingperiod: string;
  notes: string;
};

export function parseGermanNumber(value: string | undefined | null): number {
  if (!value) return 0;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export type ParseResult = {
  rows: RawImportRow[];
  skipped: { transferIn: number; other: number };
};

export function parseDkbCsv(csvText: string): ParseResult {
  const parsed = Papa.parse<DkbCsvRow>(csvText, {
    header: true,
    delimiter: ";",
    skipEmptyLines: true,
  });

  const rows: RawImportRow[] = [];
  let transferIn = 0;
  let other = 0;

  for (const raw of parsed.data) {
    if (raw.type === "TransferIn") {
      transferIn++;
      continue;
    }

    if (raw.assettype !== "Security" && raw.assettype !== "Crypto") {
      other++;
      continue;
    }

    let type: RawImportRow["type"];
    if (raw.type === "Buy") type = "BUY";
    else if (raw.type === "Sell") type = "SELL";
    else if (raw.type === "Dividend") type = "DIVIDEND";
    else {
      other++;
      continue;
    }

    const identifier = raw.identifier?.trim();
    if (!identifier) {
      other++;
      continue;
    }

    const date = new Date(raw.datetime || raw.date);
    if (Number.isNaN(date.getTime())) {
      other++;
      continue;
    }

    if (type === "DIVIDEND") {
      rows.push({
        csvAssetType: raw.assettype,
        identifier,
        holdingName: raw.holdingname,
        type,
        quantity: 1,
        price: parseGermanNumber(raw.amount),
        fee: parseGermanNumber(raw.fee),
        tax: parseGermanNumber(raw.tax),
        currency: raw.currency || "EUR",
        date,
      });
      continue;
    }

    const quantity = parseGermanNumber(raw.shares);
    const price = parseGermanNumber(raw.price);
    if (quantity <= 0 || price <= 0) {
      other++;
      continue;
    }

    rows.push({
      csvAssetType: raw.assettype,
      identifier,
      holdingName: raw.holdingname,
      type,
      quantity,
      price,
      fee: parseGermanNumber(raw.fee),
      tax: parseGermanNumber(raw.tax),
      currency: raw.currency || "EUR",
      date,
    });
  }

  return { rows, skipped: { transferIn, other } };
}
