import type { AssetType } from "@/generated/prisma/client";

export type ImportTransactionType = "BUY" | "SELL" | "DIVIDEND";

export type RawImportRow = {
  csvAssetType: "Security" | "Crypto";
  identifier: string;
  holdingName: string;
  type: ImportTransactionType;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  currency: string;
  date: Date;
};

export type ImportRowPayload = {
  type: ImportTransactionType;
  quantity: number;
  price: number;
  fee: number;
  tax: number;
  currency: string;
  date: string;
};

export type ImportGroupPayload = {
  identifier: string;
  csvAssetType: "Security" | "Crypto";
  holdingName: string;
  resolved: { symbol: string; name: string; assetType: AssetType } | null;
  rows: ImportRowPayload[];
};

export type ImportPreview = {
  groups: ImportGroupPayload[];
  skipped: { transferIn: number; other: number };
};
