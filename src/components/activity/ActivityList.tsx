"use client";

import { useState } from "react";
import { ActivityRow } from "@/components/activity/ActivityRow";
import { EditTransactionSheet } from "@/components/activity/EditTransactionSheet";
import type { TransactionSummary } from "@/lib/portfolio/transactions";

export function ActivityList({ transactions }: { transactions: TransactionSummary[] }) {
  const [selected, setSelected] = useState<TransactionSummary | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-muted">Noch keine Transaktionen vorhanden.</p>
      </div>
    );
  }

  return (
    <>
      <div className="divide-y divide-border">
        {transactions.map((t) => (
          <ActivityRow key={t.id} transaction={t} onClick={() => setSelected(t)} />
        ))}
      </div>
      <EditTransactionSheet transaction={selected} open={selected != null} onClose={() => setSelected(null)} />
    </>
  );
}
