"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { AssetTypeToggle } from "@/components/holdings/AssetTypeToggle";
import { SecuritySearchCombobox } from "@/components/holdings/SecuritySearchCombobox";
import { HoldingForm } from "@/components/holdings/HoldingForm";
import type { AssetType } from "@/generated/prisma/client";
import type { SecuritySearchResult } from "@/lib/prices/provider";

export function AddHoldingSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [assetType, setAssetType] = useState<AssetType>("ETF");
  const [security, setSecurity] = useState<SecuritySearchResult | null>(null);

  function handleClose() {
    onClose();
    setTimeout(() => {
      setSecurity(null);
      setAssetType("ETF");
    }, 300);
  }

  return (
    <Sheet open={open} onClose={handleClose} title="Position hinzufügen">
      {!security ? (
        <div className="flex flex-col gap-4">
          <AssetTypeToggle value={assetType} onChange={setAssetType} />
          <SecuritySearchCombobox assetType={assetType} onSelect={setSecurity} />
        </div>
      ) : (
        <HoldingForm
          assetType={assetType}
          security={security}
          onBack={() => setSecurity(null)}
          onDone={handleClose}
        />
      )}
    </Sheet>
  );
}
