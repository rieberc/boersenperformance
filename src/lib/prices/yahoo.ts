import YahooFinance from "yahoo-finance2";
import type {
  HistoricalPricePoint,
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
          const currencyBySymbol = new Map(quotes.map((q) => [q.symbol, q.currency]));
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
        const price = r.regularMarketPrice ?? r.postMarketPrice ?? r.regularMarketPreviousClose;
        if (price == null) continue;
        out.push({ symbol: r.symbol, price, currency: r.currency ?? "USD" });
      }
      return out;
    } catch {
      return [];
    }
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
      const out: HistoricalPricePoint[] = [];

      for (const quote of result.quotes) {
        const price = quote.close ?? quote.adjclose;
        if (price == null) continue;
        out.push({ date: quote.date.toISOString().slice(0, 10), price });
      }
      return out;
    } catch {
      return [];
    }
  },
};
