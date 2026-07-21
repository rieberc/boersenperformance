"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createHoldingAction } from "@/lib/actions/holdings";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { AssetType } from "@/generated/prisma/client";
import type { SecuritySearchResult } from "@/lib/prices/provider";

export function HoldingForm({
  assetType,
  security,
  onDone,
  onBack,
}: {
  assetType: AssetType;
  security: SecuritySearchResult;
  onDone: () => void;
  onBack: () => void;
}) {
  const [state, action, pending] = useActionState(createHoldingAction, undefined);
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
      <input type="hidden" name="assetType" value={assetType} />
      <input type="hidden" name="symbol" value={security.symbol} />
      <input type="hidden" name="name" value={security.name} />

      <div className="rounded-xl bg-background px-3 py-2.5">
        <p className="text-sm font-semibold text-navy">{security.name}</p>
        <p className="text-xs text-muted">{security.symbol}</p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Menge</label>
        <Input name="quantity" type="number" step="any" min="0" inputMode="decimal" required />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Kaufpreis</label>
          <Input name="buyPrice" type="number" step="any" min="0" inputMode="decimal" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Währung</label>
          <Input name="currency" defaultValue={security.currency ?? "EUR"} maxLength={3} required />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Kaufdatum</label>
        <Input name="buyDate" type="date" defaultValue={today} max={today} required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
      )}

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          Zurück
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Wird gespeichert…" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
