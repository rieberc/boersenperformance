"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { updateTransactionAction } from "@/lib/actions/holdings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { TransactionSummary } from "@/lib/portfolio/transactions";

const TYPE_LABEL: Record<TransactionSummary["type"], string> = {
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende",
};

export function TransactionForm({
  transaction,
  onDone,
}: {
  transaction: TransactionSummary;
  onDone: () => void;
}) {
  const action = updateTransactionAction.bind(null, transaction.id);
  const [state, formAction, pending] = useActionState(action, undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state === undefined) return;
    if (!state.error) {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="rounded-xl bg-background px-3 py-2.5">
        <p className="text-sm font-semibold text-navy">{transaction.name}</p>
        <p className="text-xs text-muted">{transaction.symbol}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Typ</label>
        <select
          name="type"
          defaultValue={transaction.type}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {Object.entries(TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Menge</label>
          <Input
            name="quantity"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            defaultValue={transaction.quantity}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Preis</label>
          <Input
            name="price"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            defaultValue={transaction.price}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Gebühr</label>
          <Input
            name="fee"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            defaultValue={transaction.fee}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Steuer</label>
          <Input
            name="tax"
            type="number"
            step="any"
            min="0"
            inputMode="decimal"
            defaultValue={transaction.tax}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Währung</label>
          <Input name="currency" defaultValue={transaction.currency} maxLength={3} required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Datum</label>
          <Input
            name="date"
            type="date"
            defaultValue={transaction.date.slice(0, 10)}
            max={new Date().toISOString().slice(0, 10)}
            required
          />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Wird gespeichert…" : "Speichern"}
      </Button>
    </form>
  );
}
