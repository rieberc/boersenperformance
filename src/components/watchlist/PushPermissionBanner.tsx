"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { usePushSubscription } from "@/lib/push/usePushSubscription";

export function PushPermissionBanner() {
  const { state, enable } = usePushSubscription();

  if (state === "checking" || state === "subscribed" || state === "unsupported") return null;

  return (
    <Card className="flex items-center justify-between gap-3 p-3">
      <p className="text-sm text-navy">
        {state === "denied"
          ? "Benachrichtigungen sind blockiert. Erlaube sie in den Browser-/Geräteeinstellungen, sonst gibt es keine Alerts."
          : "Aktiviere Push-Benachrichtigungen, sonst gibt es keine Alerts, wenn ein Limit erreicht wird."}
      </p>
      {state !== "denied" && (
        <Button
          type="button"
          variant="secondary"
          onClick={enable}
          disabled={state === "subscribing"}
          className="shrink-0"
        >
          {state === "subscribing" ? "…" : "Aktivieren"}
        </Button>
      )}
    </Card>
  );
}
