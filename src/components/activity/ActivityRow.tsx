"use client";

import { formatCurrency, formatDate } from "@/lib/utils/currency";
import type { TransactionSummary } from "@/lib/portfolio/transactions";

const TYPE_LABEL: Record<TransactionSummary["type"], string> = {
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende",
};

const TYPE_COLOR: Record<TransactionSummary["type"], string> = {
  BUY: "bg-accent-soft text-accent-dark",
  SELL: "bg-negative-soft text-negative",
  DIVIDEND: "bg-navy/10 text-navy",
};

export function ActivityRow({
  transaction,
  onClick,
}: {
  transaction: TransactionSummary;
  onClick: () => void;
}) {
  const isCash = transaction.assetType === "CASH";
  const amount = transaction.quantity * transaction.price;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3 text-left"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-navy">{transaction.name}</p>
        <p className="text-xs text-muted">
          {formatDate(transaction.date)}
          {!isCash && ` · ${transaction.quantity} Stk.`}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className="text-sm font-semibold text-navy">{formatCurrency(amount, transaction.currency)}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isCash ? "bg-accent-soft text-accent-dark" : TYPE_COLOR[transaction.type]}`}
        >
          {isCash ? "Zinsen" : TYPE_LABEL[transaction.type]}
        </span>
      </div>
    </button>
  );
}
