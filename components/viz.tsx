import type { LucideIcon } from "lucide-react";
import { accordColor, noteImage } from "@/lib/refData";
import { SEASON_META, SEASON_ORDER, TIME_META } from "@/lib/seasons";
import type { Profile } from "@/lib/types";

/** Weighted accord bars in each accord's true Fragrantica color. */
export function AccordBars({ profile, limit = 7 }: { profile: Profile; limit?: number }) {
  const weights = profile.accordWeights;
  let rows: { name: string; pct: number }[];
  if (weights && Object.keys(weights).length) {
    rows = Object.entries(weights)
      .map(([name, pct]) => ({ name, pct }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, limit);
  } else {
    rows = profile.keyAccords.slice(0, limit).map((name, i) => ({ name, pct: Math.round(100 - i * 13) }));
  }
  if (!rows.length) return null;

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const c = accordColor(r.name) ?? "var(--fam)";
        return (
          <div key={r.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 truncate text-right text-xs capitalize text-ink-2">{r.name}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-ink)_9%,transparent)]">
              <div className="h-full rounded-full" style={{ width: `${Math.max(r.pct, 4)}%`, background: `linear-gradient(90deg, ${c}99, ${c})` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** One horizontal strength bar (icon · label · fill). Reads left-to-right = more suitable. */
function StrengthBar({ Icon, color, label, value }: { Icon: LucideIcon; color: string; label: string; value: number }) {
  const pct = Math.round(value * 100);
  const dim = value < 0.4;
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-[1.05rem] w-[1.05rem] shrink-0" style={{ color, opacity: dim ? 0.5 : 1 }} strokeWidth={2} />
      <span className="w-14 shrink-0 text-[0.82rem]" style={{ color: dim ? "var(--color-ink-3)" : "var(--color-ink)" }}>{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--color-ink)_9%,transparent)]">
        <div className="h-full rounded-full transition-[width] duration-300 ease-out" style={{ width: `${Math.max(pct, 4)}%`, background: color, opacity: dim ? 0.55 : 1 }} />
      </div>
    </div>
  );
}

/** Accurate "when to wear" — horizontal season bars + day/night bars. */
export function SeasonStrip({ profile }: { profile: Profile }) {
  const map = new Map(profile.seasons.map((s) => [s.season, s.strength]));
  const dn = profile.dayNight;
  return (
    <div className="space-y-2.5">
      {SEASON_ORDER.map((s) => {
        const meta = SEASON_META[s];
        return <StrengthBar key={s} Icon={meta.Icon} color={meta.color} label={meta.label} value={map.get(s) ?? 0} />;
      })}
      <div className="!my-3.5 border-t border-line" />
      {(["Day", "Night"] as const).map((t) => {
        const tm = TIME_META[t];
        const v = dn ? (t === "Day" ? dn.day : dn.night) : profile.timeOfDay.includes(t) ? 1 : 0.12;
        return <StrengthBar key={t} Icon={tm.Icon} color={tm.color} label={t} value={v} />;
      })}
    </div>
  );
}

/** Small colored season icons for cards (only the strong seasons). */
export function SeasonGlyphs({ profile }: { profile: Profile }) {
  const strong = new Set(profile.seasons.filter((s) => s.strength >= 0.6).map((s) => s.season));
  const shown = SEASON_ORDER.filter((s) => strong.has(s));
  if (!shown.length) return null;
  return (
    <span className="inline-flex items-center gap-1" aria-label="Best seasons">
      {shown.map((s) => {
        const meta = SEASON_META[s];
        const Icon = meta.Icon;
        return <Icon key={s} className="h-3.5 w-3.5" style={{ color: meta.color }} strokeWidth={2} aria-label={meta.label} />;
      })}
    </span>
  );
}

/** A tier of the note pyramid as larger, legible note tiles (image + name). */
export function NoteRow({ tier, notes }: { tier: string; notes: string[] }) {
  if (!notes.length) return null;
  return (
    <div>
      <span className="label mb-2.5 block" style={{ color: "var(--color-ink-2)" }}>{tier}</span>
      <div className="flex flex-wrap gap-x-3 gap-y-3.5">
        {notes.map((n) => {
          const img = noteImage(n);
          return (
            <div key={n} className="flex w-[4.4rem] flex-col items-center gap-1.5 text-center">
              {img ? (
                <img src={img} alt="" loading="lazy" className="h-[3.1rem] w-[3.1rem] rounded-full object-cover ring-1 ring-[color-mix(in_oklab,var(--color-ink)_14%,transparent)]" />
              ) : (
                <span className="flex h-[3.1rem] w-[3.1rem] items-center justify-center rounded-full bg-surface-2 font-display text-lg text-ink-3 ring-1 ring-line">
                  {n.charAt(0)}
                </span>
              )}
              <span className="text-[0.72rem] leading-tight text-ink-2">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
