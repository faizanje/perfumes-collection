"use client";

import { useMemo, useState } from "react";
import type { Facets, Perfume, Season } from "@/lib/types";
import { SEASON_META } from "@/lib/seasons";
import { recommend, type WearQuery } from "@/lib/recommend";
import { PerfumeCard } from "./PerfumeCard";
import { PerfumeDetail } from "./PerfumeDetail";

const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];
const TIMES: ("Day" | "Night")[] = ["Day", "Night"];

export function WearClient({
  collection,
  facets,
}: {
  collection: Perfume[];
  facets: Facets;
}) {
  const [q, setQ] = useState<WearQuery>({ season: null, occasion: null, time: null });
  const [selected, setSelected] = useState<Perfume | null>(null);

  const matches = useMemo(() => recommend(q, collection), [q, collection]);
  const asked = q.season || q.occasion || q.time;

  return (
    <>
      <div className="rounded-md border border-line bg-surface p-5 sm:p-7">
        <Row label="Season">
          <ChipRow>
            {SEASONS.map((s) => {
              const meta = SEASON_META[s];
              const Icon = meta.Icon;
              return (
                <Toggle
                  key={s}
                  active={q.season === s}
                  onClick={() => setQ({ ...q, season: q.season === s ? null : s })}
                >
                  <Icon size={14} strokeWidth={2} style={{ color: meta.color }} className="mr-1.5" />
                  {meta.label}
                </Toggle>
              );
            })}
          </ChipRow>
        </Row>

        <Row label="Occasion">
          <ChipRow>
            {facets.occasions.map(([o]) => (
              <Toggle
                key={o}
                active={q.occasion === o}
                onClick={() => setQ({ ...q, occasion: q.occasion === o ? null : o })}
              >
                {o}
              </Toggle>
            ))}
          </ChipRow>
        </Row>

        <Row label="Time">
          <ChipRow>
            {TIMES.map((t) => (
              <Toggle key={t} active={q.time === t} onClick={() => setQ({ ...q, time: q.time === t ? null : t })}>
                {t}
              </Toggle>
            ))}
          </ChipRow>
        </Row>
      </div>

      <div className="mt-8">
        {!asked ? (
          <p className="py-16 text-center font-display text-xl text-ink-3">
            Pick a season, occasion or time to see what fits.
          </p>
        ) : matches.length === 0 ? (
          <p className="py-16 text-center font-display text-xl text-ink-3">
            No strong match for that combination. Try relaxing one choice.
          </p>
        ) : (
          <>
            <p className="mb-4 text-sm text-ink-3 tnum">
              {matches.length} suggestion{matches.length > 1 ? "s" : ""}, best first
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {matches.map(({ perfume }) => (
                <PerfumeCard key={perfume.id} perfume={perfume} onOpen={setSelected} />
              ))}
            </div>
          </>
        )}
      </div>

      <PerfumeDetail perfume={selected} all={collection} onClose={() => setSelected(null)} onOpen={setSelected} />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-t border-line py-4 first:border-t-0 first:pt-0 sm:grid sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <span className="label">{label}</span>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-1.5">{children}</div>;
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-[var(--dur-fast)] ease-out ${
        active ? "border-ink bg-ink text-canvas" : "border-line text-ink-2 hover:border-ink-3 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}
