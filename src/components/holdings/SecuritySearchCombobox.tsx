"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/Input";
import type { AssetType } from "@/generated/prisma/client";
import type { SecuritySearchResult } from "@/lib/prices/provider";

export function SecuritySearchCombobox({
  assetType,
  onSelect,
}: {
  assetType: AssetType;
  onSelect: (result: SecuritySearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["securities-search", debounced],
    queryFn: async (): Promise<{ results: SecuritySearchResult[] }> => {
      const res = await fetch(`/api/securities/search?q=${encodeURIComponent(debounced)}`);
      if (!res.ok) throw new Error("Suche fehlgeschlagen");
      return res.json();
    },
    enabled: debounced.trim().length >= 2,
  });

  const results = (data?.results ?? []).filter((r) => r.assetType === assetType);

  return (
    <div>
      <Input
        autoFocus
        placeholder="Name, WKN, ISIN oder Symbol…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="mt-2 max-h-64 overflow-y-auto">
        {isFetching && <p className="px-1 py-2 text-sm text-muted">Suche…</p>}

        {!isFetching && debounced.trim().length >= 2 && results.length === 0 && (
          <p className="px-1 py-2 text-sm text-muted">Keine Treffer gefunden.</p>
        )}

        {results.map((result) => (
          <button
            key={result.symbol}
            type="button"
            onClick={() => onSelect(result)}
            className="flex w-full flex-col items-start rounded-xl px-3 py-2.5 text-left hover:bg-background"
          >
            <span className="text-sm font-semibold text-navy">{result.name}</span>
            <span className="text-xs text-muted">
              {result.symbol}
              {result.exchange ? ` · ${result.exchange}` : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
