"use client";

import { useState, useTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { previewImportAction, confirmImportAction } from "@/lib/actions/import";
import type { ImportPreview } from "@/lib/import/types";

export function ImportCsvSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; skippedGroups: number } | null>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  function handleClose() {
    onClose();
    setTimeout(() => {
      setFile(null);
      setPreview(null);
      setError(null);
      setResult(null);
    }, 300);
  }

  function handleAnalyze() {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await previewImportAction(formData);
      if ("error" in res) setError(res.error);
      else setPreview(res.preview);
    });
  }

  function handleConfirm() {
    if (!preview) return;
    startTransition(async () => {
      const res = await confirmImportAction(preview);
      setResult(res);
      await queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    });
  }

  const resolvedGroups = preview?.groups.filter((g) => g.resolved) ?? [];
  const unresolvedGroups = preview?.groups.filter((g) => !g.resolved) ?? [];

  return (
    <Sheet open={open} onClose={handleClose} title="CSV importieren">
      <div className="flex flex-col gap-4">
        {result ? (
          <>
            <p className="text-sm text-navy">
              {result.imported} Transaktionen importiert
              {result.skippedGroups > 0 ? `, ${result.skippedGroups} Wertpapier(e) übersprungen.` : "."}
            </p>
            <Button onClick={handleClose} className="w-full">
              Fertig
            </Button>
          </>
        ) : preview ? (
          <>
            {resolvedGroups.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-navy">
                  {resolvedGroups.length} Wertpapier(e) erkannt
                </p>
                <div className="flex flex-col gap-1.5">
                  {resolvedGroups.map((g) => (
                    <div key={`${g.csvAssetType}:${g.identifier}`} className="rounded-lg bg-background px-3 py-2 text-sm">
                      <p className="font-medium text-navy">{g.resolved!.name}</p>
                      <p className="text-xs text-muted">
                        {g.resolved!.symbol} · {g.rows.length} Transaktion(en)
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {unresolvedGroups.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold text-negative">
                  {unresolvedGroups.length} nicht zugeordnet
                </p>
                <div className="flex flex-col gap-1.5">
                  {unresolvedGroups.map((g) => (
                    <div
                      key={`${g.csvAssetType}:${g.identifier}`}
                      className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative"
                    >
                      {g.holdingName || g.identifier} ({g.rows.length} Transaktion(en) werden übersprungen)
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(preview.skipped.transferIn > 0 || preview.skipped.other > 0) && (
              <p className="text-xs text-muted">
                {preview.skipped.transferIn > 0 && `${preview.skipped.transferIn} Einzahlung(en) ignoriert. `}
                {preview.skipped.other > 0 && `${preview.skipped.other} weitere Zeile(n) übersprungen.`}
              </p>
            )}

            <div className="mt-2 flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setPreview(null)} className="flex-1">
                Zurück
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={isPending || resolvedGroups.length === 0}
                className="flex-1"
              >
                {isPending ? "Importiere…" : "Import bestätigen"}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              Unterstützt CSV-Exporte im Parqet/DKB-Format (Semikolon-getrennt).
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-navy file:mr-3 file:rounded-lg file:border-0 file:bg-navy file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {error && (
              <p className="rounded-lg bg-negative-soft px-3 py-2 text-sm text-negative">{error}</p>
            )}
            <Button type="button" onClick={handleAnalyze} disabled={!file || isPending} className="w-full">
              {isPending ? "Analysiere…" : "Analysieren"}
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}
