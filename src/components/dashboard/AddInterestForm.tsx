"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addInterestAction } from "@/lib/actions/interest";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AddInterestForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(addInterestAction, undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state === undefined) return;
    if (!state.error) {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Bank</label>
        <Input name="bank" placeholder="z.B. ING" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Gutschrift Zinsen netto</label>
        <Input name="amountNet" type="number" step="any" min="0" inputMode="decimal" required />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-navy">Datum</label>
        <Input name="date" type="date" defaultValue={today} max={today} required />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="mt-2 w-full">
        {pending ? "Wird gespeichert…" : "Hinzufügen"}
      </Button>
    </form>
  );
}
