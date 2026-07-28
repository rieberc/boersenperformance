"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createAlertAction, deleteAlertAction } from "@/lib/actions/alerts";
import { usePushSubscription } from "@/lib/push/usePushSubscription";
import { formatCurrency } from "@/lib/utils/currency";
import type { WatchlistPerformanceItem } from "@/lib/portfolio/watchlist";

type AlertDirection = "ABOVE" | "BELOW";

type AlertSummary = {
  id: string;
  symbol: string;
  direction: AlertDirection;
  targetPrice: number;
  currency: string;
};

function AlertRow({ alert }: { alert: AlertSummary }) {
  const [isDeleting, startDeleteTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteAlertAction(alert.id);
      await queryClient.invalidateQueries({ queryKey: ["alerts", alert.symbol] });
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    });
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
      <span className="text-sm text-navy">
        {alert.direction === "ABOVE" ? "Über" : "Unter"} {formatCurrency(alert.targetPrice, alert.currency)}
      </span>
      <button
        type="button"
        disabled={isDeleting}
        onClick={handleDelete}
        aria-label="Alert löschen"
        className="rounded-full p-1.5 text-muted hover:bg-black/5"
      >
        ✕
      </button>
    </div>
  );
}

export function AlertForm({ item, onBack }: { item: WatchlistPerformanceItem; onBack: () => void }) {
  const [direction, setDirection] = useState<AlertDirection>("ABOVE");
  const [state, action, pending] = useActionState(createAlertAction, undefined);
  const { state: pushState, enable: handleEnablePush } = usePushSubscription();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["alerts", item.symbol],
    queryFn: async (): Promise<AlertSummary[]> => {
      const res = await fetch(`/api/alerts?symbol=${encodeURIComponent(item.symbol)}`);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const json = await res.json();
      return json.alerts;
    },
  });

  useEffect(() => {
    if (state === undefined) return;
    if (!state.error) {
      queryClient.invalidateQueries({ queryKey: ["alerts", item.symbol] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const alerts = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      {alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {pushState === "unsubscribed" && (
        <Button type="button" variant="secondary" onClick={handleEnablePush} className="w-full">
          Push-Benachrichtigungen aktivieren
        </Button>
      )}
      {pushState === "subscribing" && (
        <Button type="button" variant="secondary" disabled className="w-full">
          Wird aktiviert…
        </Button>
      )}

      <form action={action} className="flex flex-col gap-4">
        <input type="hidden" name="symbol" value={item.symbol} />
        <input type="hidden" name="name" value={item.name} />
        <input type="hidden" name="currency" value={item.currency} />
        <input type="hidden" name="direction" value={direction} />

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => setDirection("ABOVE")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              direction === "ABOVE" ? "bg-navy text-white" : "text-navy hover:bg-black/5"
            }`}
          >
            Über
          </button>
          <button
            type="button"
            onClick={() => setDirection("BELOW")}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              direction === "BELOW" ? "bg-navy text-white" : "text-navy hover:bg-black/5"
            }`}
          >
            Unter
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">Zielpreis</label>
          <Input name="targetPrice" type="number" step="any" min="0" inputMode="decimal" required />
          <p className="mt-1.5 text-xs text-muted">Preis wird alle 15 Minuten geprüft.</p>
        </div>

        {state?.error && (
          <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{state.error}</p>
        )}

        <div className="mt-2 flex gap-3">
          <Button type="button" variant="ghost" onClick={onBack} className="flex-1">
            Zurück
          </Button>
          <Button type="submit" disabled={pending} className="flex-1">
            {pending ? "Wird gespeichert…" : "Alert hinzufügen"}
          </Button>
        </div>
      </form>
    </div>
  );
}
