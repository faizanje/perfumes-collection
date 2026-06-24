"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Heart, SlidersHorizontal, ChevronsDownUp, ChevronsUpDown, X } from "lucide-react";
import type { Facets, Perfume } from "@/lib/types";
import { EMPTY_FILTER, applyFilters, type FilterState } from "@/lib/filter";
import { GROUP_BY_LABELS, groupPerfumes, type GroupBy } from "@/lib/group";
import { useUserMeta } from "@/lib/userMeta";
import { useBottlePref, type BottleMode } from "@/lib/bottlePref";
import { PerfumeCard } from "./PerfumeCard";
import { PerfumeDetail } from "./PerfumeDetail";
import { GroupSection } from "./GroupSection";
import { Filters } from "./Filters";

const SORTS: [FilterState["sort"], string][] = [
  ["name", "Name"],
  ["house", "House"],
  ["family", "Family"],
  ["rating", "Rating"],
];

type ViewMode = "grouped" | "gallery";

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
  const [view, setView] = useState<ViewMode>("grouped");
  const [groupBy, setGroupBy] = useState<GroupBy>("collection");
  // collapse/expand all groups: defaultOpen flips, signal forces a reset in every section
  const [allOpen, setAllOpen] = useState(true);
  const [collapseSignal, setCollapseSignal] = useState(0);
  const toggleAll = () => {
    setAllOpen((o) => !o);
    setCollapseSignal((s) => s + 1);
  };
  const { favorites, favoriteCount, ready } = useUserMeta();
  const { mode: bottleMode, setMode: setBottleMode } = useBottlePref();
  const hasHouseBottles = useMemo(
    () => collection.some((p) => p.profile.houseBottle),
    [collection]
  );

  const results = useMemo(
    () => applyFilters(collection, filter, favorites),
    [collection, filter, favorites]
  );
  const groups = useMemo(
    () => (view === "grouped" ? groupPerfumes(results, groupBy, facets) : []),
    [results, groupBy, facets, view]
  );

  return (
    <>
      {/* ── control bar ── */}
      <div className="sticky top-0 z-30 -mx-4 mb-6 border-b border-line bg-canvas/85 px-4 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative order-1 min-w-[12rem] flex-1">
            <Search size={16} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={filter.query}
              onChange={(e) => setFilter({ ...filter, query: e.target.value })}
              placeholder="Search name, original, note…"
              className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-9 text-sm text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
              aria-label="Search the collection"
            />
            {filter.query && (
              <button
                type="button"
                onClick={() => setFilter({ ...filter, query: "" })}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 transition-colors hover:bg-line hover:text-ink focus:outline-none focus-visible:ring-1 focus-visible:ring-ink-3"
              >
                <X size={15} strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>

          {/* view toggle */}
          <div className="order-3 inline-flex rounded-full border border-line bg-surface p-0.5 sm:order-2" role="tablist" aria-label="View">
            {(["grouped", "gallery"] as ViewMode[]).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1.5 text-sm capitalize transition-colors ${
                  view === v ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* default bottle photo (only when the collection has real house bottles) */}
          {hasHouseBottles && (
            <div className="order-5 inline-flex items-center gap-1.5 sm:order-2">
              <span className="label hidden md:inline">Bottle</span>
              <div className="inline-flex rounded-full border border-line bg-surface p-0.5" role="group" aria-label="Default bottle photo">
                {([["original", "Original"], ["house", "Owned"]] as [BottleMode, string][]).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setBottleMode(v)}
                    aria-pressed={bottleMode === v}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      bottleMode === v ? "bg-ink text-canvas" : "text-ink-2 hover:text-ink"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* group-by (only meaningful in grouped view) */}
          {view === "grouped" && (
            <label className="order-4 hidden items-center gap-1.5 sm:flex">
              <span className="label">Group</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:border-ink-3 focus:outline-none"
              >
                {GROUP_BY_LABELS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          )}

          {view === "grouped" && (
            <button
              onClick={toggleAll}
              className="order-4 hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink sm:inline-flex"
              title={allOpen ? "Collapse all groups" : "Expand all groups"}
            >
              {allOpen ? <ChevronsDownUp size={15} strokeWidth={1.8} /> : <ChevronsUpDown size={15} strokeWidth={1.8} />}
              {allOpen ? "Collapse" : "Expand"}
            </button>
          )}

          {/* sort (gallery view) */}
          {view === "gallery" && (
            <label className="order-4 hidden items-center gap-1.5 sm:flex">
              <span className="label">Sort</span>
              <select
                value={filter.sort}
                onChange={(e) => setFilter({ ...filter, sort: e.target.value as FilterState["sort"] })}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink focus:border-ink-3 focus:outline-none"
              >
                {SORTS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          )}

          <button
            onClick={() => setFilter({ ...filter, favoritesOnly: !filter.favoritesOnly })}
            aria-pressed={filter.favoritesOnly}
            className={`order-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors sm:order-5 ${
              filter.favoritesOnly ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2 hover:border-ink-3"
            }`}
          >
            <Heart size={15} strokeWidth={1.8} style={{ fill: filter.favoritesOnly ? "currentColor" : "transparent" }} />
            <span className="tnum">{ready ? favoriteCount : 0}</span>
          </button>

          <button
            onClick={() => setSheetOpen(true)}
            className="order-5 inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm text-ink-2 hover:border-ink-3 lg:hidden"
          >
            <SlidersHorizontal size={15} strokeWidth={1.8} /> Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)]">
        {/* desktop rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-[5.25rem] max-h-[calc(100vh-6.5rem)] overflow-y-auto pr-2">
            <Filters facets={facets} filter={filter} setFilter={setFilter} resultCount={results.length} />
          </div>
        </aside>

        {/* content */}
        <div className="min-w-0">
          {results.length === 0 ? (
            <EmptyState onReset={() => setFilter(EMPTY_FILTER)} />
          ) : view === "grouped" ? (
            <div>
              {groups.map((g) => (
                <GroupSection key={g.key} group={g} onOpen={setSelected} defaultOpen={allOpen} resetSignal={collapseSignal} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(264px,1fr))] gap-3.5">
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
          <button className="absolute inset-0" style={{ background: "var(--scrim)" }} onClick={() => setSheetOpen(false)} aria-label="Close filters" />
          <div className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-y-auto rounded-t-xl border-t border-line bg-canvas px-5 pb-8 pt-4 animate-[rise_var(--dur-mid)_var(--ease-out)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl">Filters</h2>
              <button onClick={() => setSheetOpen(false)} className="rounded-full border border-line px-3 py-1 text-sm text-ink-2">Done</button>
            </div>
            {/* group-by on mobile */}
            <div className="mb-5">
              <h3 className="label mb-2">Group by</h3>
              <div className="flex flex-wrap gap-1.5">
                {GROUP_BY_LABELS.map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => { setGroupBy(v); setView("grouped"); }}
                    aria-pressed={view === "grouped" && groupBy === v}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      view === "grouped" && groupBy === v ? "border-ink bg-ink text-canvas" : "border-line text-ink-2"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <Filters facets={facets} filter={filter} setFilter={setFilter} resultCount={results.length} />
            <Link href="/wear" className="mt-6 block rounded-full border border-line py-2.5 text-center text-sm text-ink-2">
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line py-24 text-center">
      <p className="font-display text-2xl text-ink">Nothing matches yet</p>
      <p className="mt-2 max-w-sm text-sm text-ink-3">
        Try loosening a filter or clearing your search.
      </p>
      <button
        onClick={onReset}
        className="mt-5 rounded-full border border-ink px-4 py-2 text-sm text-ink transition-colors hover:bg-ink hover:text-canvas"
      >
        Reset everything
      </button>
    </div>
  );
}
