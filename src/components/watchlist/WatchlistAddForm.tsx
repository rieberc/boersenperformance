"use client";

import { useActionState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { addWatchlistItemAction } from "@/lib/actions/watchlist";
import { Button } from "@/components/ui/Button";
import type { AssetType } from "@/generated/prisma/client";
import type { SecuritySearchResult } from "@/lib/prices/provider";

export function WatchlistAddForm({
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
  const [state, action, pending] = useActionState(addWatchlistItemAction, undefined);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (state === undefined) return;
    if (!state.error) {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="assetType" value={assetType} />
      <input type="hidden" name="symbol" value={security.symbol} />
      <input type="hidden" name="name" value={security.name} />
      <input type="hidden" name="currency" value={security.currency ?? "EUR"} />

      <div className="rounded-xl bg-background px-3 py-2.5">
        <p className="text-sm font-semibold text-navy">{security.name}</p>
        <p className="text-xs text-muted">{security.symbol}</p>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
      )}

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
          Zurück
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Wird hinzugefügt…" : "Hinzufügen"}
        </Button>
      </div>
    </form>
  );
}
