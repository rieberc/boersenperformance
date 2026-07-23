"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
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
  const [isDeleting, startDeleteTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleDelete() {
    startDeleteTransition(async () => {
      await removeWatchlistItemAction(item.id);
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      onClose();
    });
  }

  return (
    <Sheet open={open} onClose={onClose} title={item.name}>
      <Button
        variant="ghost"
        disabled={isDeleting}
        onClick={handleDelete}
        className="w-full text-negative hover:bg-negative-soft"
      >
        {isDeleting ? "Wird entfernt…" : "Von Watchlist entfernen"}
      </Button>
    </Sheet>
  );
}
