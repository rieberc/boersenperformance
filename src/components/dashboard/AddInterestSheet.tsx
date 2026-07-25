"use client";

import { Sheet } from "@/components/ui/Sheet";
import { AddInterestForm } from "@/components/dashboard/AddInterestForm";

export function AddInterestSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Zinsen erfassen">
      <AddInterestForm onDone={onClose} />
    </Sheet>
  );
}
