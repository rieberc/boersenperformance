"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSaleAction } from "@/lib/actions/holdings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { HoldingSummary } from "@/lib/portfolio/summary";

export function SellForm({
  holding,
  onDone,
  onBack,
}: {
  holding: HoldingSummary;
  onDone: () => void;
  onBack: () => void;
}) {
  const [state, action, pending] = useActionState(createSaleAction, undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state === undefined) return;
    if (!state.error) {
      queryClient.invalidateQueries({ queryKey: ["portfolio-summary"] });
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="symbol" value={holding.symbol} />

      <div className="rounded-xl bg-background px-3 py-2.5">
        <p className="text-sm font-semibold text-navy">{holding.name}</p>
        <p className="text-xs text-muted">Du hältst aktuell {holding.quantity} Stück</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Menge</label>
        <Input
          name="quantity"
          type="number"
          step="any"
          min="0"
          max={holding.quantity}
          inputMode="decimal"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">
          Verkaufspreis ({holding.currency})
        </label>
        <Input name="price" type="number" step="any" min="0" inputMode="decimal" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Verkaufsdatum</label>
        <Input name="date" type="date" defaultValue={today} max={today} required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
      )}

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          Zurück
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Wird verkauft…" : "Verkaufen"}
        </Button>
      </div>
    </form>
  );
}
