import { SEASON_GLYPH, SEASON_LABEL, familyMeta } from "@/lib/families";
import type { Profile, Season } from "@/lib/types";

const SEASON_ORDER: Season[] = ["spring", "summer", "fall", "winter"];

/** A small family tag with its accent dot. Expects an ancestor with data-family. */
export function FamilyTag({ family, className = "" }: { family: string; className?: string }) {
  const m = familyMeta(family);
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: "var(--fam)" }}
      />
      <span className="label" style={{ color: "var(--color-ink-2)" }}>
        {m.short}
      </span>
    </span>
  );
}

/** Four season glyphs; strong seasons are inked, weak ones faded. */
export function SeasonDots({ seasons }: { seasons: Profile["seasons"] }) {
  const map = new Map(seasons.map((s) => [s.season, s.strength]));
  return (
    <span className="inline-flex items-center gap-1.5" aria-label="Best seasons">
      {SEASON_ORDER.map((s) => {
        const strength = map.get(s) ?? 0;
        const strong = strength >= 0.6;
        return (
          <span
            key={s}
            title={`${SEASON_LABEL[s]}${strong ? "" : " (light)"}`}
            className="text-[0.85rem] leading-none transition-opacity"
            style={{
              color: strong ? "var(--color-ink)" : "var(--color-ink-3)",
              opacity: strength >= 0.6 ? 1 : strength >= 0.4 ? 0.55 : 0.22,
            }}
          >
            {SEASON_GLYPH[s]}
          </span>
        );
      })}
    </span>
  );
}

export function Chip({
  children,
  active = false,
  onClick,
  as = "button",
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  as?: "button" | "span";
  title?: string;
}) {
  const cls = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors duration-[var(--dur-fast)] ease-out ${
    active
      ? "border-ink bg-ink text-canvas"
      : "border-line bg-surface text-ink-2 hover:border-ink-3 hover:text-ink"
  }`;
  if (as === "span") {
    return (
      <span className={cls} title={title}>
        {children}
      </span>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} title={title} aria-pressed={active}>
      {children}
    </button>
  );
}

export function ConfidenceMark({ profile }: { profile: Profile }) {
  if (profile.needsReview || profile.confidence === "low") {
    return (
      <span className="label" title="Auto-enriched · worth a personal check" style={{ color: "var(--color-ink-3)" }}>
        ◌ unverified
      </span>
    );
  }
  return null;
}

/** A soft family-tinted wash used at the head of cards and detail. */
export function familyWash(strength = 14): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, color-mix(in oklab, var(--fam) ${strength}%, var(--color-canvas)) 0%, var(--color-canvas) 70%)`,
  };
}
