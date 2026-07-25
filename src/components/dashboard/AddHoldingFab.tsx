"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { AddHoldingSheet } from "@/components/holdings/AddHoldingSheet";
import { AddInterestSheet } from "@/components/dashboard/AddInterestSheet";

export function AddHoldingFab() {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [holdingOpen, setHoldingOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Hinzufügen"
        onClick={() => setChooserOpen(true)}
        className="safe-bottom fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl font-light text-white shadow-lg shadow-accent/30 active:scale-95"
      >
        +
      </button>

      <Sheet open={chooserOpen} onClose={() => setChooserOpen(false)} title="Hinzufügen">
        <div className="flex flex-col gap-3">
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setChooserOpen(false);
              setHoldingOpen(true);
            }}
          >
            Wertpapier / Crypto
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              setChooserOpen(false);
              setInterestOpen(true);
            }}
          >
            Zinsen (Tagesgeld/Festgeld)
          </Button>
        </div>
      </Sheet>

      <AddHoldingSheet open={holdingOpen} onClose={() => setHoldingOpen(false)} />
      <AddInterestSheet open={interestOpen} onClose={() => setInterestOpen(false)} />
    </>
  );
}
