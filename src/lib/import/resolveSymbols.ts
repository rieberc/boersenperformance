import { yahooPriceProvider } from "@/lib/prices/yahoo";
import type { SecuritySearchResult } from "@/lib/prices/provider";
import type { ImportGroupPayload, RawImportRow } from "@/lib/import/types";

function pickBestMatch(
  candidates: SecuritySearchResult[],
  preferredCurrency: string,
  existingSymbols: Set<string>,
): SecuritySearchResult | undefined {
  return (
    candidates.find((r) => existingSymbols.has(r.symbol)) ??
    candidates.find((r) => r.currency === preferredCurrency) ??
    candidates[0]
  );
}

export async function resolveImportGroups(
  rows: RawImportRow[],
  existingSymbols: Set<string> = new Set(),
): Promise<ImportGroupPayload[]> {
  const byKey = new Map<string, RawImportRow[]>();
  for (const row of rows) {
    const key = `${row.csvAssetType}:${row.identifier}`;
    const list = byKey.get(key);
    if (list) list.push(row);
    else byKey.set(key, [row]);
  }

  const groups: ImportGroupPayload[] = [];

  for (const groupRows of byKey.values()) {
    const first = groupRows[0];
    let resolved: ImportGroupPayload["resolved"] = null;

    if (first.csvAssetType === "Crypto") {
      const cryptoSymbol = `${first.identifier}-EUR`;
      resolved = {
        symbol: existingSymbols.has(`${first.identifier}-USD`) ? `${first.identifier}-USD` : cryptoSymbol,
        name: first.holdingName || first.identifier,
        assetType: "CRYPTO",
      };
    } else {
      const [byIdentifier, byName] = await Promise.all([
        yahooPriceProvider.search(first.identifier),
        first.holdingName ? yahooPriceProvider.search(first.holdingName) : Promise.resolve([]),
      ]);

      const bySymbol = new Map<string, SecuritySearchResult>();
      for (const r of [...byIdentifier, ...byName]) {
        if (r.assetType === "STOCK" || r.assetType === "ETF") bySymbol.set(r.symbol, r);
      }

      const match = pickBestMatch([...bySymbol.values()], first.currency, existingSymbols);

      if (match) {
        resolved = { symbol: match.symbol, name: match.name, assetType: match.assetType };
      }
    }

    groups.push({
      identifier: first.identifier,
      csvAssetType: first.csvAssetType,
      holdingName: first.holdingName,
      resolved,
      rows: groupRows.map((r) => ({
        type: r.type,
        quantity: r.quantity,
        price: r.price,
        fee: r.fee,
        tax: r.tax,
        currency: r.currency,
        date: r.date.toISOString(),
      })),
    });
  }

  return groups;
}
