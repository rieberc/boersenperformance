"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { SellForm } from "@/components/holdings/SellForm";
import { deletePositionAction } from "@/lib/actions/holdings";
import type { HoldingSummary } from "@/lib/portfolio/summary";

export function PositionActionsSheet({
  holding,
  open,
  onClose,
}: {
  holding: HoldingSummary;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"menu" | "sell">("menu");
  const [isDeleting, startDeleteTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleClose() {
    onClose();
    setTimeout(() => setStep("menu"), 300);
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deletePositionAction(holding.symbol);
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      handleClose();
    });
  }

  return (
    <Sheet open={open} onClose={handleClose} title={holding.name}>
      {step === "menu" ? (
        <div className="flex flex-col gap-3">
          {holding.assetType !== "CASH" && (
            <Button variant="secondary" onClick={() => setStep("sell")} className="w-full">
              Verkaufen
            </Button>
          )}
          <Button
            variant="ghost"
            disabled={isDeleting}
            onClick={handleDelete}
            className="w-full text-negative hover:bg-negative-soft"
          >
            {isDeleting ? "Wird gelöscht…" : "Position löschen"}
          </Button>
        </div>
      ) : (
        <SellForm holding={holding} onBack={() => setStep("menu")} onDone={handleClose} />
      )}
    </Sheet>
  );
}
