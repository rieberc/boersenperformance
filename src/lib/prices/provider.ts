export type SecurityAssetType = "STOCK" | "ETF" | "CRYPTO";

export type SecuritySearchResult = {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  assetType: SecurityAssetType;
};

export type PriceQuote = {
  symbol: string;
  price: number;
  currency: string;
};

export type HistoricalPricePoint = {
  date: string;
  price: number;
};

export type HistoricalPriceSeries = {
  currency: string;
  points: HistoricalPricePoint[];
};

export interface PriceProvider {
  search(query: string): Promise<SecuritySearchResult[]>;
  quotes(symbols: string[]): Promise<PriceQuote[]>;
  fxRate(from: string, to: string): Promise<number | null>;
  historicalPrices(symbol: string, start: Date, end: Date): Promise<HistoricalPriceSeries>;
  allTimeHighs(symbols: string[]): Promise<Map<string, number | null>>;
}
