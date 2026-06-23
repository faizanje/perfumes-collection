"use client";

import type { Perfume } from "@/lib/types";
import { familyMeta } from "@/lib/families";
import { SeasonDots } from "./ui";
import { FavoriteButton } from "./FavoriteButton";

export function PerfumeCard({
  perfume,
  onOpen,
}: {
  perfume: Perfume;
  onOpen: (p: Perfume) => void;
}) {
  const { profile } = perfume;
  const fam = familyMeta(profile.family);

  return (
    <article
      data-family={profile.family}
      className="group relative flex flex-col overflow-hidden rounded-lg transition-[transform,box-shadow] duration-[var(--dur-mid)] ease-out hover:-translate-y-1"
      style={{
        background:
          "linear-gradient(160deg, color-mix(in oklab, var(--fam) calc(var(--fam-tint) + 8%), var(--color-surface)) 0%, color-mix(in oklab, var(--fam) var(--fam-tint-soft), var(--color-surface)) 60%)",
        border: "1px solid color-mix(in oklab, var(--fam) 30%, var(--color-line))",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-[var(--dur-mid)] ease-out group-hover:opacity-100"
        style={{
          boxShadow:
            "inset 0 0 0 1px color-mix(in oklab, var(--fam) 55%, transparent), 0 16px 44px -22px color-mix(in oklab, var(--fam) 70%, transparent)",
        }}
      />

      <button
        type="button"
        onClick={() => onOpen(perfume)}
        className="flex flex-1 flex-col px-4 pb-3.5 pt-3.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
        aria-label={`Open ${perfume.cloneName}`}
      >
        {/* top row: family + seasons */}
        <div className="mb-3 flex items-center justify-between gap-2 pr-7">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-[color-mix(in_oklab,var(--fam)_30%,transparent)]" style={{ background: "var(--fam)" }} />
            <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "color-mix(in oklab, var(--fam) 55%, var(--color-ink))" }}>
              {fam.short}
            </span>
          </span>
          <SeasonDots seasons={profile.seasons} />
        </div>

        {/* name */}
        <h3 className="text-[1.3rem] leading-[1.12] text-ink">{perfume.cloneName}</h3>

        {perfume.impressionOf && (
          <p className="mt-1.5 text-sm leading-snug text-ink-2">
            <span className="label mr-1 align-middle text-[0.62rem]">
              {perfume.kind === "hybrid" ? "blend" : perfume.isOriginal ? "original" : "impression"}
            </span>
            <span className="align-middle">{perfume.impressionOf}</span>
          </p>
        )}

        {/* accords */}
        <div className="mb-3 mt-3 flex flex-wrap gap-1.5">
          {profile.keyAccords.slice(0, 3).map((a) => (
            <span
              key={a}
              className="rounded-full px-2 py-0.5 text-[0.72rem] capitalize text-ink-2"
              style={{ background: "color-mix(in oklab, var(--fam) 16%, var(--color-surface-2))" }}
            >
              {a}
            </span>
          ))}
        </div>

        {/* footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5" style={{ borderColor: "color-mix(in oklab, var(--fam) 18%, var(--color-line))" }}>
          <span className="label truncate text-[0.62rem]" title={perfume.house}>
            {perfume.house}
          </span>
          {(profile.needsReview || profile.confidence === "low") && (
            <span className="shrink-0 text-[0.62rem] text-ink-3" title="Auto-enriched — worth confirming">
              ◌
            </span>
          )}
        </div>
      </button>

      <div className="absolute right-2.5 top-2.5">
        <FavoriteButton id={perfume.id} />
      </div>
    </article>
  );
}
