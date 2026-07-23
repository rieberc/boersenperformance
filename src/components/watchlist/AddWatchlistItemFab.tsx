"use client";

import { useState } from "react";
import { AddWatchlistItemSheet } from "@/components/watchlist/AddWatchlistItemSheet";

export function AddWatchlistItemFab() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Zur Watchlist hinzufügen"
        onClick={() => setOpen(true)}
        className="safe-bottom fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-white shadow-lg shadow-accent/30 active:scale-95"
      >
        +
      </button>
      <AddWatchlistItemSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
