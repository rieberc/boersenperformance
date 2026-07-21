"use client";

import { useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { TransactionForm } from "@/components/activity/TransactionForm";
import { deleteTransactionAction } from "@/lib/actions/holdings";
import type { TransactionSummary } from "@/lib/portfolio/transactions";

export function EditTransactionSheet({
  transaction,
  open,
  onClose,
}: {
  transaction: TransactionSummary | null;
  open: boolean;
  onClose: () => void;
}) {
  const [isDeleting, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleDelete() {
    if (!transaction) return;
    startTransition(async () => {
      await deleteTransactionAction(transaction.id);
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      onClose();
    });
  }

  if (!transaction) return null;

  return (
    <Sheet open={open} onClose={onClose} title="Transaktion bearbeiten">
      <div className="flex flex-col gap-4">
        <TransactionForm transaction={transaction} onDone={onClose} />
        <Button
          type="button"
          variant="ghost"
          disabled={isDeleting}
          onClick={handleDelete}
          className="w-full text-negative hover:bg-negative-soft"
        >
          {isDeleting ? "Wird gelöscht…" : "Transaktion löschen"}
        </Button>
      </div>
    </Sheet>
  );
}
