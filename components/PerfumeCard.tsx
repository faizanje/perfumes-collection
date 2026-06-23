"use client";

import type { Perfume } from "@/lib/types";
import { FamilyTag, SeasonDots, familyWash } from "./ui";
import { FavoriteButton } from "./FavoriteButton";

export function PerfumeCard({
  perfume,
  onOpen,
}: {
  perfume: Perfume;
  onOpen: (p: Perfume) => void;
}) {
  const { profile } = perfume;
  return (
    <article
      data-family={profile.family}
      className="group relative flex flex-col overflow-hidden rounded-md border border-line bg-paper-2 text-left transition-[transform,box-shadow,border-color] duration-[var(--dur-mid)] ease-out hover:-translate-y-1 hover:border-ink-3 hover:shadow-[0_18px_40px_-28px_rgba(40,30,15,0.5)]"
    >
      {/* family spine */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-[3px] origin-top scale-y-100 transition-transform duration-[var(--dur-mid)] ease-out"
        style={{ background: "var(--fam)" }}
      />

      <button
        type="button"
        onClick={() => onOpen(perfume)}
        className="flex flex-1 flex-col px-5 pb-4 pt-4 text-left focus:outline-none"
        aria-label={`Open ${perfume.cloneName}`}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <FamilyTag family={profile.family} />
          <SeasonDots seasons={profile.seasons} />
        </div>

        <div
          className="mb-3 rounded-sm px-3 py-3"
          style={familyWash(16)}
        >
          <h3 className="text-xl leading-[1.15] text-ink">{perfume.cloneName}</h3>
          {perfume.impressionOf && (
            <p className="mt-1.5 text-sm text-ink-2">
              <span className="label mr-1.5 align-middle">
                {perfume.kind === "hybrid" ? "blend" : perfume.isOriginal ? "original" : "impression"}
              </span>
              <span className="align-middle">{perfume.impressionOf}</span>
            </p>
          )}
        </div>

        <p className="mb-3 line-clamp-2 text-sm leading-snug text-ink-3">
          {profile.keyAccords.slice(0, 4).join(" · ") || profile.mood}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="label truncate" title={perfume.house}>
            {perfume.house}
          </span>
        </div>
      </button>

      <div className="absolute right-3 top-3.5">
        <FavoriteButton id={perfume.id} />
      </div>
    </article>
  );
}
