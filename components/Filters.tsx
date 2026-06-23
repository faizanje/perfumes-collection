"use client";

import { familyMeta, SEASON_LABEL } from "@/lib/families";
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
  const patch = (p: Partial<FilterState>) => setFilter({ ...filter, ...p });
  const activeCount =
    filter.families.length +
    filter.seasons.length +
    filter.occasions.length +
    filter.houses.length +
    (filter.favoritesOnly ? 1 : 0);

  return (
    <div className="space-y-7">
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
                className={`flex items-center justify-between rounded-sm px-2.5 py-1.5 text-sm transition-colors ${
                  active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-3"
                }`}
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
                  active ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink-3"
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
                  active ? "border-ink bg-ink text-paper" : "border-line text-ink-2 hover:border-ink-3"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>
      </FilterBlock>

      {/* houses */}
      <FilterBlock label="House">
        <div className="max-h-44 overflow-y-auto pr-1">
          <div className="flex flex-col gap-0.5">
            {facets.houses.map(([h, n]) => {
              const active = filter.houses.includes(h);
              return (
                <button
                  key={h}
                  onClick={() => patch({ houses: toggle(filter.houses, h) })}
                  aria-pressed={active}
                  className={`flex items-center justify-between rounded-sm px-2.5 py-1 text-sm transition-colors ${
                    active ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-3"
                  }`}
                >
                  <span className="truncate">{h}</span>
                  <span className="tnum text-xs opacity-70">{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </FilterBlock>

      <div className="flex items-center justify-between border-t border-line pt-4">
        <span className="text-sm text-ink-3 tnum">{resultCount} shown</span>
        {activeCount > 0 && (
          <button
            onClick={() =>
              patch({ families: [], seasons: [], occasions: [], houses: [], favoritesOnly: false })
            }
            className="text-sm text-ink-2 underline decoration-line underline-offset-4 hover:text-ink"
          >
            Clear {activeCount}
          </button>
        )}
      </div>
    </div>
  );
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="label mb-2.5">{label}</h3>
      {children}
    </div>
  );
}
