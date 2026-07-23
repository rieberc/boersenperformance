"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ActivityRow } from "@/components/activity/ActivityRow";
import { EditTransactionSheet } from "@/components/activity/EditTransactionSheet";
import { AssetTypeFilter, ALL_ASSET_GROUPS, toAssetGroup, type AssetGroup } from "@/components/dashboard/AssetTypeFilter";
import { TransactionTypeFilter, ALL_TRANSACTION_TYPES } from "@/components/activity/TransactionTypeFilter";
import type { TransactionSummary } from "@/lib/portfolio/transactions";
import type { TransactionType } from "@/generated/prisma/client";

export function ActivityList({ initialTransactions }: { initialTransactions: TransactionSummary[] }) {
  const [selected, setSelected] = useState<TransactionSummary | null>(null);
  const [assetGroups, setAssetGroups] = useState<Set<AssetGroup>>(new Set(ALL_ASSET_GROUPS));
  const [transactionTypes, setTransactionTypes] = useState<Set<TransactionType>>(new Set(ALL_TRANSACTION_TYPES));

  const { data } = useQuery({
    queryKey: ["portfolio", "transactions"],
    queryFn: async (): Promise<TransactionSummary[]> => {
      const res = await fetch("/api/portfolio/transactions");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const body = await res.json();
      return body.transactions;
    },
    initialData: initialTransactions,
  });

  const transactions = data ?? initialTransactions;
  const filtered = transactions.filter(
    (t) => assetGroups.has(toAssetGroup(t.assetType)) && transactionTypes.has(t.type),
  );

  return (
    <>
      <div className="flex gap-2 pb-3">
        <TransactionTypeFilter selected={transactionTypes} onChange={setTransactionTypes} />
        <AssetTypeFilter selected={assetGroups} onChange={setAssetGroups} />
      </div>

      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-muted">
            {transactions.length === 0 ? "Noch keine Transaktionen vorhanden." : "Keine Transaktionen für diesen Filter."}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((t) => (
            <ActivityRow key={t.id} transaction={t} onClick={() => setSelected(t)} />
          ))}
        </div>
      )}

      <EditTransactionSheet transaction={selected} open={selected != null} onClose={() => setSelected(null)} />
    </>
  );
}
