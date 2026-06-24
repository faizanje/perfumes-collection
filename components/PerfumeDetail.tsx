"use client";

import { useEffect, useState } from "react";
import type { Perfume } from "@/lib/types";
import { familyMeta } from "@/lib/families";
import { layeringPartners } from "@/lib/layering";
import { useUserMeta } from "@/lib/userMeta";
import { useBottlePref, type BottleMode } from "@/lib/bottlePref";
import { FavoriteButton } from "./FavoriteButton";
import { AccordBars, SeasonStrip, NoteRow } from "./viz";

/** Hero bottle(s): when a real house bottle exists alongside the inspired-by
 *  original, show a large image with two captioned thumbnails to switch between
 *  them. Otherwise falls back to the single image. */
function HeroBottles({ perfume }: { perfume: Perfume }) {
  const { profile } = perfume;
  const { mode } = useBottlePref();
  const orig = profile.imageUrl;
  const house = profile.houseBottle?.img;
  const hasBoth = Boolean(orig && house);
  const [shown, setShown] = useState<BottleMode>(mode === "house" && house ? "house" : "original");

  if (!orig && !house) return null;

  if (!hasBoth) {
    return (
      <img
        src={(orig ?? house)!}
        alt={profile.originalName ?? perfume.cloneName}
        loading="lazy"
        className="h-32 w-24 shrink-0 self-start object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
      />
    );
  }

  const big = shown === "house" ? house! : orig!;
  const thumbs: [BottleMode, string, string][] = [
    ["house", house!, perfume.house || "Owned"],
    ["original", orig!, "Original"],
  ];
  return (
    <div className="shrink-0">
      <img
        src={big}
        alt={shown === "house" ? `${perfume.house} bottle` : profile.originalName ?? perfume.cloneName}
        loading="lazy"
        className="h-32 w-24 object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
      />
      <div className="mt-2.5 flex gap-1.5">
        {thumbs.map(([v, src, label]) => (
          <button
            key={v}
            type="button"
            onClick={() => setShown(v)}
            aria-pressed={shown === v}
            title={label}
            className={`h-12 w-10 overflow-hidden rounded-md border bg-[rgba(15,12,9,0.25)] transition-[opacity,border-color] ${
              shown === v ? "border-ink opacity-100" : "border-line opacity-60 hover:opacity-100"
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-contain p-0.5" />
          </button>
        ))}
      </div>
      <p className="mt-1.5 max-w-[6rem] text-[0.7rem] leading-tight text-ink-3">
        {shown === "house"
          ? `${perfume.house} bottle`
          : perfume.impressionOf
            ? `Inspired by ${perfume.impressionOf}`
            : "Original"}
      </p>
    </div>
  );
}

function NotePyramid({ perfume }: { perfume: Perfume }) {
  const { topNotes, heartNotes, baseNotes } = perfume.profile;
  if (!topNotes.length && !heartNotes.length && !baseNotes.length) return null;
  return (
    <div className="space-y-4">
      <NoteRow tier="Top" notes={topNotes} />
      <NoteRow tier="Heart" notes={heartNotes} />
      <NoteRow tier="Base" notes={baseNotes} />
    </div>
  );
}

function MetaEditor({ perfume }: { perfume: Perfume }) {
  const { meta, setNote, setRating } = useUserMeta();
  const m = meta[perfume.id] ?? {};
  const [draft, setDraft] = useState(m.note ?? "");
  useEffect(() => setDraft(m.note ?? ""), [perfume.id, m.note]);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Your notes</span>
        <div className="flex items-center gap-1" role="group" aria-label="Your rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(perfume.id, n === m.rating ? 0 : n)}
              aria-label={`Rate ${n}`}
              className="text-lg leading-none transition-transform duration-[var(--dur-fast)] ease-out hover:scale-110"
              style={{ color: (m.rating ?? 0) >= n ? "var(--color-accent)" : "var(--color-line-2)" }}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => setNote(perfume.id, draft.trim())}
        rows={2}
        placeholder="How does it wear? When did you reach for it?"
        className="w-full resize-none rounded-md border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
      />
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-7 border-t border-line pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function layeringRoleCopy(role: "anchor" | "topper" | "bridge") {
  if (role === "anchor") {
    return {
      label: "Adds depth",
      detail: "Use as the warmer base when you want this scent richer.",
    };
  }
  if (role === "topper") {
    return {
      label: "Freshens it",
      detail: "Use as the brighter top layer when you want more lift.",
    };
  }
  return {
    label: "Easy blend",
    detail: "Shared notes make this flexible; either order works.",
  };
}

export function PerfumeDetail({
  perfume,
  all,
  onClose,
  onOpen,
}: {
  perfume: Perfume | null;
  all: Perfume[];
  onClose: () => void;
  onOpen: (p: Perfume) => void;
}) {
  useEffect(() => {
    if (!perfume) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [perfume, onClose]);

  if (!perfume) return null;
  const { profile } = perfume;
  const fam = familyMeta(profile.family);
  const partners = layeringPartners(perfume, all);
  const verified = profile.source === "fragrantica";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={perfume.cloneName}>
      <button aria-label="Close" onClick={onClose} style={{ background: "var(--scrim)" }} className="absolute inset-0 backdrop-blur-[3px] animate-[fade_var(--dur-mid)_ease-out]" />
      <div
        data-family={profile.family}
        className="absolute inset-y-0 right-0 flex w-full max-w-[34rem] flex-col overflow-y-auto border-l border-line bg-canvas shadow-2xl animate-[slidein_var(--dur-mid)_var(--ease-out)] sm:rounded-l-2xl"
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/90 px-6 py-3 backdrop-blur-xl">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--fam)" }} />
            <span className="label">{fam.name}</span>
          </span>
          <button onClick={onClose} className="rounded-full border border-line px-3 py-1 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink" aria-label="Close">
            Close ✕
          </button>
        </div>

        <div className="px-6 pb-12">
          {/* hero */}
          <div
            className="relative mt-5 flex gap-4 overflow-hidden rounded-2xl border p-5"
            style={{
              borderColor: "color-mix(in oklab, var(--fam) 24%, var(--color-line))",
              background: "linear-gradient(150deg, color-mix(in oklab, var(--fam) 26%, var(--color-surface)), color-mix(in oklab, var(--fam) 8%, var(--color-surface)))",
            }}
          >
            <HeroBottles perfume={perfume} />
            <div className="min-w-0">
              <h2 className="text-[1.9rem] leading-[1.05] text-ink">{perfume.cloneName}</h2>
              {perfume.impressionOf && (
                <p className="mt-2 text-sm text-ink-2">
                  <span className="label mr-1.5">{perfume.kind === "hybrid" ? "blend of" : perfume.isOriginal ? "original" : "impression of"}</span>
                  {perfume.impressionOf}
                </p>
              )}
              <p className="mt-2 text-xs text-ink-3">{perfume.house}{perfume.group ? ` · ${perfume.group}` : ""}</p>
            </div>
          </div>

          {/* actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FavoriteButton id={perfume.id} label />
            {profile.rating != null && (
              <span className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2">★ {profile.rating}</span>
            )}
            {/* hybrid: link both parents; otherwise the single Fragrantica link */}
            {profile.parentLinks?.length ? (
              profile.parentLinks.map((p) =>
                p.url ? (
                  <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink">
                    {p.name} ↗
                  </a>
                ) : null
              )
            ) : (
              <>
                {profile.originalUrl && (
                  <a href={profile.originalUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink">
                    Fragrantica ↗
                  </a>
                )}
                {!verified && (
                  <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-3" title="Estimated. This scent isn't on Fragrantica">◌ estimated</span>
                )}
              </>
            )}
          </div>

          <p className="mt-5 font-display text-lg leading-snug text-ink-2">{profile.mood}</p>

          <Section title="Main accords">
            <AccordBars profile={profile} />
          </Section>

          <Section title="Notes">
            <NotePyramid perfume={perfume} />
          </Section>

          <Section title="When to wear" action={<span className="text-xs text-ink-3">{profile.timeOfDay.join(" & ") || "Any time"}</span>}>
            <SeasonStrip profile={profile} />
            {(profile.longevity || profile.sillage) && (
              <div className="mt-4 flex gap-6">
                {profile.longevity && (
                  <p className="text-sm text-ink-2"><span className="label block">Longevity</span><span className="capitalize">{profile.longevity}</span></p>
                )}
                {profile.sillage && (
                  <p className="text-sm text-ink-2"><span className="label block">Sillage</span><span className="capitalize">{profile.sillage}</span></p>
                )}
              </div>
            )}
          </Section>

          {partners.length > 0 && (
            <Section title="Layers well with">
              <div className="mb-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink-2">
                <p>
                  Spray the first scent in the plan, wait 30-60 seconds, then add the second.
                  Keep stronger, darker scents to fewer sprays; use fresher scents as the final lift.
                </p>
              </div>
              <ul className="space-y-2">
                {partners.map(({ perfume: p, reason, role, order, ratio, warnings }) => {
                  const roleCopy = layeringRoleCopy(role);
                  return (
                    <li key={p.id}>
                      <button
                        onClick={() => onOpen(p)}
                        data-family={p.profile.family}
                        className="flex w-full items-start gap-3 rounded-lg border border-line bg-surface px-3 py-2.5 text-left transition-colors hover:border-ink-3"
                      >
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--fam)" }} />
                        <span className="min-w-0 flex-1">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate text-sm text-ink">{p.cloneName}</span>
                            <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] text-ink-3">
                              {roleCopy.label}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-3">{reason}</span>
                          <span className="mt-1 block text-[0.72rem] leading-snug text-ink-2">{roleCopy.detail}</span>
                          <span className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-ink-2">
                            <span>{order}</span>
                            <span>{ratio}</span>
                            {warnings?.[0] && <span className="text-ink-3">{warnings[0]}</span>}
                          </span>
                        </span>
                        <span className="label shrink-0">{p.house}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section title="Personal">
            <MetaEditor perfume={perfume} />
          </Section>
        </div>
      </div>
    </div>
  );
}
