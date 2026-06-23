"use client";

import { useEffect, useState } from "react";
import type { Perfume } from "@/lib/types";
import { SEASON_GLYPH, SEASON_LABEL, familyMeta } from "@/lib/families";
import { layeringPartners } from "@/lib/layering";
import { useUserMeta } from "@/lib/userMeta";
import { FavoriteButton } from "./FavoriteButton";
import { familyWash } from "./ui";

function NotePyramid({ perfume }: { perfume: Perfume }) {
  const rows: [string, string[]][] = [
    ["Top", perfume.profile.topNotes],
    ["Heart", perfume.profile.heartNotes],
    ["Base", perfume.profile.baseNotes],
  ];
  const has = rows.some(([, n]) => n.length);
  if (!has) return null;
  return (
    <div className="space-y-3">
      {rows.map(([tier, notes]) =>
        notes.length ? (
          <div key={tier} className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-baseline gap-3">
            <span className="label pt-0.5">{tier}</span>
            <p className="text-[0.95rem] leading-relaxed text-ink">
              {notes.join(", ")}
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}

function MetaEditor({ perfume }: { perfume: Perfume }) {
  const { meta, setNote, setRating } = useUserMeta();
  const m = meta[perfume.id] ?? {};
  const [draft, setDraft] = useState(m.note ?? "");

  useEffect(() => setDraft(m.note ?? ""), [perfume.id, m.note]);

  return (
    <div className="rounded-md border border-line bg-canvas p-4">
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
              style={{ color: (m.rating ?? 0) >= n ? "var(--color-accent)" : "var(--color-line)" }}
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
        className="w-full resize-none rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-3 focus:border-ink-3 focus:outline-none"
      />
    </div>
  );
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

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={perfume.cloneName}>
      <button
        aria-label="Close"
        onClick={onClose}
        style={{ background: "var(--scrim)" }}
        className="absolute inset-0 backdrop-blur-[2px] animate-[fade_var(--dur-mid)_ease-out]"
      />
      <div
        data-family={profile.family}
        className="absolute inset-y-0 right-0 flex w-full max-w-[33rem] flex-col overflow-y-auto border-l border-line bg-canvas shadow-2xl animate-[slidein_var(--dur-mid)_var(--ease-out)] sm:rounded-l-lg"
      >
        {/* header */}
        <div className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-6 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--fam)" }} />
              <span className="label">{fam.name}</span>
            </span>
            <button
              onClick={onClose}
              className="rounded-full px-2 py-1 text-sm text-ink-2 hover:text-ink"
              aria-label="Close"
            >
              Close ✕
            </button>
          </div>
        </div>

        <div className="px-6 pb-10 pt-5">
          <div className="rounded-md px-5 py-5" style={familyWash(22)}>
            <h2 className="text-3xl leading-[1.08] text-ink">{perfume.cloneName}</h2>
            {perfume.impressionOf && (
              <p className="mt-2 text-[0.95rem] text-ink-2">
                <span className="label mr-1.5">
                  {perfume.kind === "hybrid" ? "blend of" : perfume.isOriginal ? "original" : "impression of"}
                </span>
                {perfume.impressionOf}
              </p>
            )}
            <p className="mt-3 text-sm text-ink-3">
              {perfume.house}
              {perfume.group ? ` · ${perfume.group}` : ""}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <FavoriteButton id={perfume.id} label />
            {profile.rating != null && (
              <span className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2">
                ★ {profile.rating} <span className="text-ink-3">community</span>
              </span>
            )}
            {(profile.needsReview || profile.confidence === "low") && (
              <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-3" title="Auto-enriched — worth confirming">
                ◌ unverified data
              </span>
            )}
          </div>

          <p className="mt-5 font-display text-lg leading-snug text-ink-2">{profile.mood}</p>

          {/* notes */}
          <Section title="Notes">
            <NotePyramid perfume={perfume} />
            {!!profile.keyAccords.length && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.keyAccords.map((a) => (
                  <span
                    key={a}
                    className="rounded-full px-2.5 py-1 text-xs capitalize text-ink-2"
                    style={{ background: "color-mix(in oklab, var(--fam) 14%, var(--color-surface))" }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            )}
          </Section>

          {/* when to wear */}
          <Section title="When to wear">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="label">Seasons</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {profile.seasons.filter((s) => s.strength >= 0.5).map((s) => (
                    <span key={s.season} className="inline-flex items-center gap-1 text-sm text-ink">
                      <span>{SEASON_GLYPH[s.season]}</span>
                      {SEASON_LABEL[s.season]}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="label">Time</span>
                <p className="mt-2 text-sm text-ink">{profile.timeOfDay.join(" & ") || "Any"}</p>
              </div>
            </div>
            <div className="mt-4">
              <span className="label">Occasions</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {profile.occasions.map((o) => (
                  <span key={o} className="rounded-full border border-line px-2.5 py-1 text-xs text-ink-2">
                    {o}
                  </span>
                ))}
              </div>
            </div>
            {(profile.longevity || profile.sillage) && (
              <div className="mt-4 flex gap-6">
                {profile.longevity && (
                  <p className="text-sm text-ink-2">
                    <span className="label block">Longevity</span>
                    <span className="capitalize">{profile.longevity}</span>
                  </p>
                )}
                {profile.sillage && (
                  <p className="text-sm text-ink-2">
                    <span className="label block">Sillage</span>
                    <span className="capitalize">{profile.sillage}</span>
                  </p>
                )}
              </div>
            )}
          </Section>

          {/* layering */}
          {partners.length > 0 && (
            <Section title="Layers well with">
              <ul className="space-y-1.5">
                {partners.map(({ perfume: p, reason }) => (
                  <li key={p.id}>
                    <button
                      onClick={() => onOpen(p)}
                      data-family={p.profile.family}
                      className="flex w-full items-center gap-3 rounded-sm border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-ink-3"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: "var(--fam)" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{p.cloneName}</span>
                        <span className="block truncate text-xs text-ink-3">{reason}</span>
                      </span>
                      <span className="label shrink-0">{p.house}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* personal */}
          <Section title="">
            <MetaEditor perfume={perfume} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 border-t border-line pt-5 first:border-t-0">
      {title && <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-3">{title}</h3>}
      {children}
    </section>
  );
}
