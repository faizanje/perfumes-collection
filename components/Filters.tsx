"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { familyMeta, SEASON_LABEL } from "@/lib/families";
import { houseLogo } from "@/lib/houseLogos";
import type { FilterState } from "@/lib/filter";
import type { Facets, Season } from "@/lib/types";

const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function Filters({
  facets,
  filter,
  setFilter,
  resultCount,
}: {
  facets: Facets;
  filter: FilterState;
  setFilter: (f: FilterState) => void;
  resultCount: number;
}) {
  const [houseQuery, setHouseQuery] = useState("");
  const patch = (p: Partial<FilterState>) => setFilter({ ...filter, ...p });
  const activeCount =
    filter.families.length +
    filter.seasons.length +
    filter.occasions.length +
    filter.houses.length +
    (filter.favoritesOnly ? 1 : 0);
  const visibleHouses = useMemo(() => {
    const q = houseQuery.trim().toLowerCase();
    const filtered = q
      ? facets.houses.filter(([h]) => h.toLowerCase().includes(q))
      : facets.houses;
    return [...filtered].sort(([a], [b]) => {
      const aa = filter.houses.includes(a) ? 0 : 1;
      const bb = filter.houses.includes(b) ? 0 : 1;
      return aa - bb;
    });
  }, [facets.houses, filter.houses, houseQuery]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-surface px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-2">
            <span className="tnum text-ink">{resultCount}</span> shown
          </span>
          {activeCount > 0 && (
            <button
              onClick={() =>
                patch({ families: [], seasons: [], occasions: [], houses: [], favoritesOnly: false })
              }
              className="text-sm text-ink-2 underline decoration-line underline-offset-4 transition-colors hover:text-ink"
            >
              Clear {activeCount}
            </button>
          )}
        </div>
      </div>

      {/* families */}
      <FilterBlock label="Family">
        <div className="flex flex-col gap-1">
          {facets.families.map(([fam, n]) => {
            const active = filter.families.includes(fam);
            return (
              <button
                key={fam}
                data-family={fam}
                onClick={() => patch({ families: toggle(filter.families, fam) })}
                aria-pressed={active}
                className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-sm text-ink-2 transition-colors hover:bg-surface-2"
                style={{
                  borderColor: active ? "color-mix(in oklab, var(--fam) 52%, var(--color-line))" : "transparent",
                  background: active ? "color-mix(in oklab, var(--fam) 18%, var(--color-surface))" : "transparent",
                }}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--fam)" }} />
                  {familyMeta(fam).short}
                </span>
                <span className="tnum text-xs opacity-70">{n}</span>
              </button>
            );
          })}
        </div>
      </FilterBlock>

      {/* seasons */}
      <FilterBlock label="Season">
        <div className="flex flex-wrap gap-1.5">
          {SEASONS.map((s) => {
            const active = filter.seasons.includes(s);
            return (
              <button
                key={s}
                onClick={() => patch({ seasons: toggle(filter.seasons, s) })}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active ? "border-ink bg-surface-2 text-ink" : "border-line text-ink-2 hover:border-ink-3"
                }`}
              >
                {SEASON_LABEL[s]}
              </button>
            );
          })}
        </div>
      </FilterBlock>

      {/* occasions */}
      <FilterBlock label="Occasion">
        <div className="flex flex-wrap gap-1.5">
          {facets.occasions.map(([o]) => {
            const active = filter.occasions.includes(o);
            return (
              <button
                key={o}
                onClick={() => patch({ occasions: toggle(filter.occasions, o) })}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  active ? "border-ink bg-surface-2 text-ink" : "border-line text-ink-2 hover:border-ink-3"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </FilterBlock>

      {/* houses */}
      <FilterBlock label="House" action={<span className="tnum text-xs text-ink-3">{facets.houses.length}</span>}>
        <div className="rounded-lg border border-line bg-surface p-2">
          <div className="relative">
            <Search size={14} strokeWidth={1.8} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={houseQuery}
              onChange={(e) => setHouseQuery(e.target.value)}
              placeholder="Find a house"
              className="w-full rounded-md border border-line bg-canvas py-1.5 pl-8 pr-8 text-sm text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
              aria-label="Search houses"
            />
            {houseQuery && (
              <button
                type="button"
                onClick={() => setHouseQuery("")}
                aria-label="Clear house search"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <X size={13} strokeWidth={2} aria-hidden />
              </button>
            )}
          </div>

          <div className="mt-2 max-h-[22rem] overflow-y-auto pr-1">
            <div className="flex flex-col gap-1">
              {visibleHouses.map(([h, n]) => {
              const active = filter.houses.includes(h);
              return (
                <button
                  key={h}
                  onClick={() => patch({ houses: toggle(filter.houses, h) })}
                  aria-pressed={active}
                  className={`flex items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                    active ? "border-ink bg-surface-2 text-ink" : "border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {houseLogo(h) && (
                      <>
                        <img src={houseLogo(h)!.dark} alt="" className="hidden h-5 w-auto max-w-[84px] shrink-0 object-contain dark:block" />
                        <img src={houseLogo(h)!.light} alt="" className="block h-5 w-auto max-w-[84px] shrink-0 object-contain dark:hidden" />
                      </>
                    )}
                    <span className="truncate" title={h}>{h}</span>
                  </span>
                  <span className="tnum text-xs opacity-70">{n}</span>
                </button>
              );
            })}
              {visibleHouses.length === 0 && (
                <p className="px-2 py-3 text-sm text-ink-3">No houses match.</p>
              )}
            </div>
          </div>
        </div>
      </FilterBlock>

    </div>
  );
}

function FilterBlock({ label, children, action }: { label: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="label">{label}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
