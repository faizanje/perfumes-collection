"use client";

import { useEffect, useState } from "react";
import type { Perfume } from "@/lib/types";
import { familyMeta } from "@/lib/families";
import { layeringPartners } from "@/lib/layering";
import { useUserMeta } from "@/lib/userMeta";
import { FavoriteButton } from "./FavoriteButton";
import { AccordBars, SeasonStrip, NoteRow } from "./viz";

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
            {profile.imageUrl && (
              <img
                src={profile.imageUrl}
                alt={profile.originalName ?? perfume.cloneName}
                loading="lazy"
                className="h-32 w-24 shrink-0 self-start object-contain drop-shadow-[0_8px_18px_rgba(0,0,0,0.4)]"
              />
            )}
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
            {profile.originalUrl && (
              <a href={profile.originalUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-3 py-1.5 text-sm text-ink-2 transition-colors hover:border-ink-3 hover:text-ink">
                Fragrantica ↗
              </a>
            )}
            {!verified && (
              <span className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-3" title="Estimated — this scent isn't on Fragrantica">◌ estimated</span>
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
              <ul className="space-y-1.5">
                {partners.map(({ perfume: p, reason }) => (
                  <li key={p.id}>
                    <button
                      onClick={() => onOpen(p)}
                      data-family={p.profile.family}
                      className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2 text-left transition-colors hover:border-ink-3"
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

          <Section title="Personal">
            <MetaEditor perfume={perfume} />
          </Section>
        </div>
      </div>
    </div>
  );
}
