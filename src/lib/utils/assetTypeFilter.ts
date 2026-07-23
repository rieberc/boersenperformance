import type { AssetType } from "@/generated/prisma/client";

const VALID_ASSET_TYPES: AssetType[] = ["STOCK", "ETF", "CRYPTO"];

export function parseAssetTypesParam(param: string | null): AssetType[] | undefined {
  if (!param) return undefined;

  const requested = param.split(",").filter((v): v is AssetType => VALID_ASSET_TYPES.includes(v as AssetType));
  if (requested.length === 0 || requested.length === VALID_ASSET_TYPES.length) return undefined;

  return requested;
}
