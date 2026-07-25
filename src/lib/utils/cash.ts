const CASH_SYMBOL_PREFIX = "CASH:";

/**
 * CASH holdings reuse the Holding table (so they get the same aggregation,
 * value-history, and Activity-list handling as real securities) but aren't
 * tied to a market symbol — each bank gets a synthetic one, prefixed to
 * avoid ever colliding with a real ticker.
 */
export function cashSymbolForBank(bank: string): string {
  return `${CASH_SYMBOL_PREFIX}${bank.trim()}`;
}
