"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every page load, not just when the user
 * enables push notifications — a controlling service worker is required for
 * the browser to consider the app installable (and, on iOS, Web Push only
 * works at all once the app has been added to the Home Screen).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
