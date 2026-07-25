import YahooFinance from "yahoo-finance2";
import type {
  HistoricalPriceSeries,
  PriceProvider,
  PriceQuote,
  SecurityAssetType,
  SecuritySearchResult,
} from "@/lib/prices/provider";

const yahooFinance = new YahooFinance({ queue: { concurrency: 4, interval: 250 } });

const QUOTE_TYPE_TO_ASSET_TYPE: Record<string, SecurityAssetType> = {
  EQUITY: "STOCK",
  ETF: "ETF",
  CRYPTOCURRENCY: "CRYPTO",
};

// Some exchanges (notably LSE) quote in a minor unit rather than the major
// currency — e.g. IGSG.L trades in GBp (pence), 1/100 of GBP. Left
// unnormalized, this silently inflates value calculations ~100x once
// converted as if it were already the major currency.
const MINOR_UNIT_CURRENCIES: Record<string, { major: string; divisor: number }> = {
  GBp: { major: "GBP", divisor: 100 },
  GBX: { major: "GBP", divisor: 100 },
  ZAc: { major: "ZAR", divisor: 100 },
  ILA: { major: "ILS", divisor: 100 },
};

function normalizeCurrency(currency: string, price: number): { currency: string; price: number } {
  const minorUnit = MINOR_UNIT_CURRENCIES[currency];
  if (!minorUnit) return { currency, price };
  return { currency: minorUnit.major, price: price / minorUnit.divisor };
}

export const yahooPriceProvider: PriceProvider = {
  async search(query) {
    if (!query.trim()) return [];

    try {
      const result = await yahooFinance.search(query, { quotesCount: 12 });
      const out: SecuritySearchResult[] = [];

      for (const raw of result.quotes as Record<string, unknown>[]) {
        const quoteType = raw.quoteType;
        const symbol = raw.symbol;
        if (typeof quoteType !== "string" || typeof symbol !== "string") continue;

        const assetType = QUOTE_TYPE_TO_ASSET_TYPE[quoteType];
        if (!assetType) continue;

        const longname = typeof raw.longname === "string" ? raw.longname : undefined;
        const shortname = typeof raw.shortname === "string" ? raw.shortname : undefined;
        const exchange = typeof raw.exchange === "string" ? raw.exchange : undefined;

        out.push({ symbol, name: longname ?? shortname ?? symbol, exchange, assetType });
      }

      if (out.length > 0) {
        try {
          const quotes = await yahooFinance.quote(
            out.map((r) => r.symbol),
            { fields: ["symbol", "currency"] },
          );
          const currencyBySymbol = new Map(
            quotes.map((q) => [q.symbol, q.currency ? (MINOR_UNIT_CURRENCIES[q.currency]?.major ?? q.currency) : undefined]),
          );
          for (const item of out) {
            item.currency = currencyBySymbol.get(item.symbol) ?? undefined;
          }
        } catch {
          // currency stays undefined; the form falls back to a default
        }
      }

      return out;
    } catch {
      return [];
    }
  },

  async quotes(symbols) {
    const unique = [...new Set(symbols)];
    if (unique.length === 0) return [];

    try {
      const results = await yahooFinance.quote(unique, {
        fields: ["symbol", "regularMarketPrice", "postMarketPrice", "regularMarketPreviousClose", "currency"],
      });

      const out: PriceQuote[] = [];
      for (const r of results) {
        const rawPrice = r.regularMarketPrice ?? r.postMarketPrice ?? r.regularMarketPreviousClose;
        if (rawPrice == null) continue;
        const { currency, price } = normalizeCurrency(r.currency ?? "USD", rawPrice);
        out.push({ symbol: r.symbol, price, currency });
      }
      return out;
    } catch {
      return [];
    }
  },

  async allTimeHighs(symbols) {
    const unique = [...new Set(symbols)];
    const out = new Map<string, number | null>();
    if (unique.length === 0) return out;

    // quoteSummary has no multi-symbol batch endpoint, unlike quote() —
    // one request per symbol.
    const results = await Promise.allSettled(
      unique.map((symbol) => yahooFinance.quoteSummary(symbol, { modules: ["summaryDetail"] })),
    );

    results.forEach((result, i) => {
      const symbol = unique[i];
      if (result.status !== "fulfilled") {
        out.set(symbol, null);
        return;
      }
      const raw = result.value.summaryDetail?.allTimeHigh;
      if (raw == null) {
        out.set(symbol, null);
        return;
      }
      const { price } = normalizeCurrency(result.value.summaryDetail?.currency ?? "USD", raw);
      out.set(symbol, price);
    });

    return out;
  },

  async fxRate(from, to) {
    if (from === to) return 1;

    try {
      const quote = await yahooFinance.quote(`${from}${to}=X`);
      return quote.regularMarketPrice ?? null;
    } catch {
      return null;
    }
  },

  async historicalPrices(symbol, start, end) {
    try {
      const result = await yahooFinance.chart(symbol, { period1: start, period2: end, interval: "1d" });
      const rawCurrency = result.meta.currency;
      const minorUnit = MINOR_UNIT_CURRENCIES[rawCurrency];
      const currency = minorUnit?.major ?? rawCurrency;

      const points: HistoricalPriceSeries["points"] = [];
      for (const quote of result.quotes) {
        const rawPrice = quote.close ?? quote.adjclose;
        if (rawPrice == null) continue;
        const price = minorUnit ? rawPrice / minorUnit.divisor : rawPrice;
        points.push({ date: quote.date.toISOString().slice(0, 10), price });
      }
      return { currency, points };
    } catch {
      return { currency: "EUR", points: [] };
    }
  },
};
