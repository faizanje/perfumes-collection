"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import type { Perfume } from "@/lib/types";
import { familyMeta } from "@/lib/families";
import { useBottlePref, type BottleMode } from "@/lib/bottlePref";
import { SeasonGlyphs } from "./viz";
import { FavoriteButton } from "./FavoriteButton";

const other = (m: BottleMode): BottleMode => (m === "house" ? "original" : "house");

export function PerfumeCard({
  perfume,
  onOpen,
}: {
  perfume: Perfume;
  onOpen: (p: Perfume) => void;
}) {
  const { profile } = perfume;
  const fam = familyMeta(profile.family);
  const origImg = profile.imageUrl;
  const houseImg = profile.houseBottle?.img;
  const parents = profile.parentImages ?? [];
  const hasBoth = Boolean(origImg && houseImg);

  // Global default + per-card overrides: hover previews the other bottle (desktop),
  // tapping the source pill makes a choice stick (works on touch, where there's no hover).
  const { mode } = useBottlePref();
  const [stuck, setStuck] = useState<BottleMode | null>(null);
  const [hover, setHover] = useState(false);
  const base = stuck ?? mode;
  const shown: BottleMode = hover && hasBoth ? other(base) : base;
  const houseLabel = perfume.house || "Owned";

  return (
    <article
      data-family={profile.family}
      onMouseEnter={() => hasBoth && setHover(true)}
      onMouseLeave={() => hasBoth && setHover(false)}
      className="group relative isolate flex flex-col overflow-hidden rounded-2xl border transition-[transform,box-shadow] duration-[var(--dur-mid)] ease-out hover:-translate-y-1"
      style={{
        borderColor: "color-mix(in oklab, var(--fam) 24%, var(--color-line))",
        background: "var(--color-surface)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <button
        type="button"
        onClick={() => onOpen(perfume)}
        className="flex flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)]"
        aria-label={`Open ${perfume.cloneName}`}
      >
        {/* bottle floats on a dark family-glow panel (transparent PNG) */}
        <div
          className="relative flex h-52 items-center justify-center overflow-hidden"
          style={{ background: "radial-gradient(125% 90% at 50% 12%, color-mix(in oklab, var(--fam) 30%, var(--color-surface)), var(--color-surface) 72%)" }}
        >
          {hasBoth ? (
            // two bottles cross-fade: the inspired-by original and the real house bottle
            <>
              <img
                src={origImg!}
                alt={`${perfume.cloneName}, inspired by ${perfume.impressionOf ?? "original"}`}
                loading="lazy"
                aria-hidden={shown !== "original"}
                className={`absolute inset-0 h-full w-full object-contain p-4 drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-[var(--dur-mid)] ease-out group-hover:scale-[1.05] ${shown === "original" ? "opacity-100" : "opacity-0"}`}
              />
              <img
                src={houseImg!}
                alt={`${perfume.cloneName}, ${houseLabel} bottle`}
                loading="lazy"
                aria-hidden={shown !== "house"}
                className={`absolute inset-0 h-full w-full object-contain p-4 drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)] transition-[opacity,transform] duration-[var(--dur-mid)] ease-out group-hover:scale-[1.05] ${shown === "house" ? "opacity-100" : "opacity-0"}`}
              />
            </>
          ) : origImg || houseImg ? (
            <img
              src={(origImg || houseImg)!}
              alt={profile.originalName ?? perfume.cloneName}
              loading="lazy"
              className="h-full w-full object-contain p-4 drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)] transition-transform duration-[var(--dur-mid)] ease-out group-hover:scale-[1.05]"
            />
          ) : parents.length >= 2 ? (
            // hybrid — two parent bottles, fanned and overlapping
            <div className="relative h-full w-full">
              <img src={parents[0]} alt="" loading="lazy" className="absolute left-[9%] top-1/2 h-[62%] -translate-y-1/2 -rotate-[9deg] object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.5)] transition-transform duration-[var(--dur-mid)] ease-out group-hover:-translate-x-1.5" />
              <img src={parents[1]} alt="" loading="lazy" className="absolute right-[9%] top-1/2 z-10 h-[62%] -translate-y-1/2 rotate-[9deg] object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)] transition-transform duration-[var(--dur-mid)] ease-out group-hover:translate-x-1.5" />
              <span className="absolute left-1/2 top-1/2 z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[rgba(15,12,9,0.7)] text-sm text-white backdrop-blur-sm">+</span>
            </div>
          ) : parents.length === 1 ? (
            <img src={parents[0]} alt="" loading="lazy" className="h-full w-full object-contain p-4 drop-shadow-[0_10px_22px_rgba(0,0,0,0.45)]" />
          ) : (
            <span className="select-none font-display text-7xl leading-none" style={{ color: "color-mix(in oklab, var(--fam) 60%, var(--color-ink))", opacity: 0.5 }}>
              {perfume.cloneName.trim().charAt(0)}
            </span>
          )}

          <span className="absolute left-3.5 top-3.5 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,12,9,0.55)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--fam)" }} />
            {fam.short}
          </span>
          <span className="absolute bottom-3 left-3.5 rounded-full bg-[rgba(15,12,9,0.5)] px-2 py-1 backdrop-blur-sm">
            <SeasonGlyphs profile={profile} />
          </span>
        </div>

        {/* info */}
        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <h3 className="text-[1.32rem] leading-[1.12] text-ink">{perfume.cloneName}</h3>
          {perfume.impressionOf && (
            <p className="mt-1.5 line-clamp-1 text-[0.88rem] text-ink-2">
              <span className="text-ink-3">{perfume.kind === "hybrid" ? "blend · " : perfume.isOriginal ? "" : "after "}</span>
              {perfume.impressionOf}
            </p>
          )}
          <p className="mt-3 line-clamp-1 text-[0.78rem] capitalize text-ink-3">
            {profile.keyAccords.slice(0, 4).join("  ·  ")}
          </p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            <span className="truncate text-[0.66rem] uppercase tracking-[0.1em] text-ink-3" title={perfume.house}>{perfume.house}</span>
            {profile.source !== "fragrantica" && (
              <span className="shrink-0 text-[0.62rem] text-ink-3" title="Estimated. Not on Fragrantica">◌</span>
            )}
          </div>
        </div>
      </button>

      {/* controls overlaid on the image panel — siblings of the open-button to
          avoid nesting interactive elements inside it. The overlay matches the
          h-52 image so the toggle lands at the image's bottom-right. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-52">
        <span className="pointer-events-auto absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(15,12,9,0.5)] backdrop-blur-sm">
          <FavoriteButton id={perfume.id} />
        </span>
        {hasBoth && (
          <button
            type="button"
            onClick={() => setStuck(other(shown))}
            aria-label={shown === "house" ? `Showing ${houseLabel} bottle, switch to the inspired-by original` : `Showing the inspired-by original, switch to the ${houseLabel} bottle`}
            title={shown === "house" ? "Switch to the inspired-by original" : `Switch to the ${houseLabel} bottle`}
            className="pointer-events-auto absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,12,9,0.62)] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-[rgba(15,12,9,0.82)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
          >
            <ArrowLeftRight size={11} strokeWidth={2.2} aria-hidden />
            {shown === "house" ? houseLabel : "Original"}
          </button>
        )}
      </div>
    </article>
  );
}
