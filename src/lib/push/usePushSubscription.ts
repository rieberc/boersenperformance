"use client";

import { useEffect, useState } from "react";
import { getExistingPushSubscription, subscribeToPush } from "@/lib/push/subscribe-client";
import { subscribePushAction } from "@/lib/actions/alerts";

export type PushSubscriptionState =
  | "checking"
  | "subscribed"
  | "unsubscribed"
  | "subscribing"
  | "denied"
  | "unsupported";

/** Resolves synchronously to a final state when there's nothing to check
 * asynchronously (unsupported browser, or notifications already blocked),
 * or null when an existing subscription still needs to be looked up. */
function syncState(): PushSubscriptionState | null {
  if (typeof window === "undefined") return "checking";
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") return "denied";
  return null;
}

export function usePushSubscription() {
  const [state, setState] = useState<PushSubscriptionState>(() => syncState() ?? "checking");

  useEffect(() => {
    if (syncState() !== null) return;
    getExistingPushSubscription()
      .then((sub) => setState(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setState("unsubscribed"));
  }, []);

  async function enable() {
    setState("subscribing");
    try {
      const subscription = await subscribeToPush();
      const result = await subscribePushAction(subscription);
      if (result.error) {
        setState("unsubscribed");
        return;
      }
      setState("subscribed");
    } catch {
      setState(Notification.permission === "denied" ? "denied" : "unsubscribed");
    }
  }

  return { state, enable };
}
