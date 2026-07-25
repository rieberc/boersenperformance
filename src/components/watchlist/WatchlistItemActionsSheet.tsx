"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { AlertForm } from "@/components/watchlist/AlertForm";
import { removeWatchlistItemAction } from "@/lib/actions/watchlist";
import type { WatchlistPerformanceItem } from "@/lib/portfolio/watchlist";

export function WatchlistItemActionsSheet({
  item,
  open,
  onClose,
}: {
  item: WatchlistPerformanceItem;
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"menu" | "alert">("menu");
  const [isDeleting, startDeleteTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleClose() {
    onClose();
    setTimeout(() => setStep("menu"), 300);
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await removeWatchlistItemAction(item.id);
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      handleClose();
    });
  }

  return (
    <Sheet open={open} onClose={handleClose} title={item.name}>
      {step === "menu" ? (
        <div className="flex flex-col gap-3">
          <Button variant="secondary" onClick={() => setStep("alert")} className="w-full">
            Alert einrichten
          </Button>
          <Button
            variant="ghost"
            disabled={isDeleting}
            onClick={handleDelete}
            className="w-full text-negative hover:bg-negative-soft"
          >
            {isDeleting ? "Wird entfernt…" : "Von Watchlist entfernen"}
          </Button>
        </div>
      ) : (
        <AlertForm item={item} onBack={() => setStep("menu")} />
      )}
    </Sheet>
  );
}
