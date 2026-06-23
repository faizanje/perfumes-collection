"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Facets, Perfume } from "@/lib/types";
import { EMPTY_FILTER, applyFilters, type FilterState } from "@/lib/filter";
import { useUserMeta } from "@/lib/userMeta";
import { PerfumeCard } from "./PerfumeCard";
import { PerfumeDetail } from "./PerfumeDetail";
import { Filters } from "./Filters";

const SORTS: [FilterState["sort"], string][] = [
  ["name", "Name"],
  ["house", "House"],
  ["family", "Family"],
  ["rating", "Rating"],
];

export function GalleryClient({
  collection,
  facets,
}: {
  collection: Perfume[];
  facets: Facets;
}) {
  const [filter, setFilter] = useState<FilterState>(EMPTY_FILTER);
  const [selected, setSelected] = useState<Perfume | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { favorites, favoriteCount, ready } = useUserMeta();

  const results = useMemo(
    () => applyFilters(collection, filter, favorites),
    [collection, filter, favorites]
  );

  return (
    <>
      {/* search + controls bar */}
      <div className="sticky top-0 z-30 -mx-4 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-md sm:border sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3">
              ⌕
            </span>
            <input
              value={filter.query}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              placeholder="Search name, original, note, house…"
              className="w-full rounded-sm border border-line bg-paper-2 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
              aria-label="Search the collection"
            />
          </div>

          <label className="hidden items-center gap-2 sm:flex">
            <span className="label">Sort</span>
            <select
              value={filter.sort}
              onChange={(e) => setFilter({ ...filter, sort: e.target.value as FilterState["sort"] })}
              className="rounded-sm border border-line bg-paper-2 px-2 py-2 text-sm text-ink focus:border-ink-3 focus:outline-none"
            >
              {SORTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
            aria-pressed={filter.favoritesOnly}
            className={`rounded-full border px-3 py-2 text-sm transition-colors ${
              filter.favoritesOnly ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink-3"
            }`}
          >
            ♥ {ready ? favoriteCount : 0}
          </button>

          <button
            onClick={() => setSheetOpen(true)}
            className="rounded-full border border-line px-3 py-2 text-sm text-ink-2 hover:border-ink-3 lg:hidden"
          >
            Filters
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* desktop rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <Filters facets={facets} filter={filter} setFilter={setFilter} resultCount={results.length} />
          </div>
        </aside>

        {/* grid */}
        <div>
          {results.length === 0 ? (
            <EmptyState onReset={() => setFilter(EMPTY_FILTER)} />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => (
                <PerfumeCard key={p.id} perfume={p} onOpen={setSelected} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-[oklch(20%_0.02_60_/_0.42)]" onClick={() => setSheetOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-lg border-t border-line bg-paper px-5 pb-8 pt-4 animate-[rise_var(--dur-mid)_var(--ease-out)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl">Filters</h2>
              <button onClick={() => setSheetOpen(false)} className="text-sm text-ink-2">
                Done
              </button>
            </div>
            <Filters facets={facets} filter={filter} setFilter={setFilter} resultCount={results.length} />
            <Link
              href="/wear"
              className="mt-6 block rounded-sm border border-line py-2.5 text-center text-sm text-ink-2"
            >
              Try “What should I wear?” →
            </Link>
          </div>
        </div>
      )}

      <PerfumeDetail perfume={selected} all={collection} onClose={() => setSelected(null)} onOpen={setSelected} />
    </>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-line py-24 text-center">
      <p className="font-display text-2xl text-ink">Nothing matches — yet</p>
      <p className="mt-2 max-w-sm text-sm text-ink-3">
        Try loosening a filter or clearing your search. Your collection is broad; the right
        scent is in here somewhere.
      </p>
      <button
        onClick={onReset}
        className="mt-5 rounded-full border border-ink px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        Reset everything
      </button>
    </div>
  );
}
