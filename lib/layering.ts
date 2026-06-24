import type { Perfume, Season } from "./types";

// ── Layering model ──────────────────────────────────────────────────────────
// A great layering pair (a) shares a *bridge* so the two blend instead of
// clashing, (b) has one scent that *adds a dimension* the other lacks, (c) pairs
// an anchoring base with a lifting topper, and (d) suits the same context
// (season / time of day). We score every candidate on those axes — weighted by
// the real Fragrantica accord strengths — then diversify the shortlist so it
// isn't six near-identical scents.

// Curated family prior, kept as a light nudge on top of the data-driven signals.
const COMPLEMENT: Record<string, string[]> = {
  "Fresh / Citrus": ["Amber / Oriental", "Gourmand / Sweet", "Oud / Animalic", "Woody", "Leather / Smoky"],
  "Aromatic / Fresh": ["Amber / Oriental", "Gourmand / Sweet", "Leather / Smoky", "Woody", "Oud / Animalic"],
  Woody: ["Floral", "Fruity", "Amber / Oriental", "Gourmand / Sweet", "Fresh / Citrus"],
  "Amber / Oriental": ["Fresh / Citrus", "Aromatic / Fresh", "Fruity", "Floral"],
  Fruity: ["Woody", "Amber / Oriental", "Oud / Animalic", "Gourmand / Sweet"],
  "Gourmand / Sweet": ["Leather / Smoky", "Woody", "Fresh / Citrus", "Aromatic / Fresh"],
  "Oud / Animalic": ["Fresh / Citrus", "Fruity", "Floral", "Aromatic / Fresh"],
  Floral: ["Woody", "Amber / Oriental", "Oud / Animalic", "Fruity"],
  "Leather / Smoky": ["Gourmand / Sweet", "Fresh / Citrus", "Aromatic / Fresh"],
};

// Accord "axes" — broad olfactory dimensions. Layering shines when a partner
// brings an axis the base is missing while still sharing a bridge accord.
const AXES: Record<string, string[]> = {
  fresh: ["citrus", "fresh", "aquatic", "marine", "ozonic", "green", "herbal", "aromatic", "fresh spicy", "mineral", "salty", "watery", "cold spicy"],
  sweet: ["sweet", "vanilla", "gourmand", "caramel", "honey", "chocolate", "cacao", "almond"],
  fruity: ["fruity", "tropical", "berry", "apple", "peach", "cherry", "coconut"],
  floral: ["floral", "white floral", "yellow floral", "rose", "violet", "iris", "tuberose", "lavender", "powdery", "soapy"],
  warm: ["amber", "warm spicy", "cinnamon", "balsamic", "oriental", "resinous", "resin"],
  woody: ["woody", "sandalwood", "cedar", "vetiver", "patchouli", "earthy", "mossy", "chypre", "conifer", "nutty"],
  dark: ["leather", "smoky", "tobacco", "tar", "animalic", "oud", "incense", "alcohol"],
};
const AXIS_KEYS = Object.keys(AXES);
// Which axes read as "deep/heavy" (anchors) vs "bright" (lifters).
const DEEP_AXES = ["dark", "woody", "warm", "sweet"];
const BRIGHT_AXES = ["fresh", "fruity"];

const SEASON_KEYS: Season[] = ["spring", "summer", "fall", "winter"];

export interface LayerMatch {
  perfume: Perfume;
  score: number;
  reason: string;
  role: "anchor" | "topper" | "bridge";
  order: string;
  ratio: string;
  warnings?: string[];
}

/** Accord → relative strength in 0..1 (dominant accord = 1). Falls back to a
 *  rank-decayed weighting when a perfume has no Fragrantica accord weights. */
function accordMap(p: Perfume): Map<string, number> {
  const m = new Map<string, number>();
  const w = p.profile.accordWeights;
  if (w && Object.keys(w).length) {
    const max = Math.max(...Object.values(w)) || 1;
    for (const [k, v] of Object.entries(w)) m.set(k.toLowerCase(), v / max);
  } else {
    p.profile.keyAccords.forEach((k, i) => m.set(k.toLowerCase(), Math.max(0.4, 1 - i * 0.12)));
  }
  return m;
}

/** Note → strength in 0..1. Base notes matter most for blending, top notes for lift. */
function noteMap(p: Perfume): Map<string, number> {
  const m = new Map<string, number>();
  const add = (notes: string[], weight: number) => {
    notes.forEach((note, i) => {
      const key = note.toLowerCase();
      const v = Math.max(0.35, weight - i * 0.06);
      m.set(key, Math.max(m.get(key) ?? 0, v));
    });
  };
  add(p.profile.topNotes, 0.72);
  add(p.profile.heartNotes, 0.86);
  add(p.profile.baseNotes, 1);
  return m;
}

/** Strength of an axis = the strongest accord the perfume has on that axis. */
function axisStrength(m: Map<string, number>, axis: string): number {
  let s = 0;
  for (const a of AXES[axis]) {
    const v = m.get(a);
    if (v && v > s) s = v;
  }
  return s;
}

/** How deep/heavy a scent reads — anchors are high, fresh toppers are low. */
function depth(p: Perfume, m: Map<string, number>): number {
  let d = 0;
  for (const a of DEEP_AXES) d += axisStrength(m, a);
  for (const a of BRIGHT_AXES) d -= axisStrength(m, a) * 0.8;
  // longevity / sillage are sparse (~28%) — use only as a soft nudge when present.
  const lon = p.profile.longevity;
  if (lon === "eternal" || lon === "long lasting") d += 0.4;
  const sil = p.profile.sillage;
  if (sil === "enormous" || sil === "strong") d += 0.3;
  return d;
}

function axisTotal(m: Map<string, number>, axes: string[]): number {
  return axes.reduce((sum, axis) => sum + axisStrength(m, axis), 0);
}

function hasAny(m: Map<string, number>, accords: string[]): number {
  return accords.reduce((best, accord) => Math.max(best, m.get(accord) ?? 0), 0);
}

/** Cosine similarity of two accord maps (used to diversify the shortlist). */
function accordCosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0, na = 0, nb = 0;
  for (const [k, v] of a) { na += v * v; const o = b.get(k); if (o) dot += v * o; }
  for (const v of b.values()) nb += v * v;
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/** Season-profile similarity, 0..1 (cosine over the four season strengths). */
function seasonSim(a: Perfume, b: Perfume): number {
  const va = SEASON_KEYS.map((s) => a.profile.seasons.find((x) => x.season === s)?.strength ?? 0);
  const vb = SEASON_KEYS.map((s) => b.profile.seasons.find((x) => x.season === s)?.strength ?? 0);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < 4; i++) { dot += va[i] * vb[i]; na += va[i] ** 2; nb += vb[i] ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0.5;
}

/** Day/night agreement, 0..1. Neutral (0.5) when either lacks the data. */
function dayNightSim(a: Perfume, b: Perfume): number {
  const da = a.profile.dayNight, db = b.profile.dayNight;
  if (!da || !db) return 0.5;
  const fa = da.day / (da.day + da.night || 1);
  const fb = db.day / (db.day + db.night || 1);
  return 1 - Math.abs(fa - fb);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function roleFor(baseDepth: number, otherDepth: number, baseMap: Map<string, number>, otherMap: Map<string, number>): LayerMatch["role"] {
  const delta = otherDepth - baseDepth;
  const otherBright = axisTotal(otherMap, BRIGHT_AXES);
  const otherDeep = axisTotal(otherMap, DEEP_AXES);
  const baseDeep = axisTotal(baseMap, DEEP_AXES);

  if (delta > 0.55 || (otherDeep > baseDeep + 0.7 && otherDeep > otherBright)) return "anchor";
  if (delta < -0.55 || otherBright > otherDeep + 0.55) return "topper";
  return "bridge";
}

function wearingPlan(role: LayerMatch["role"]): Pick<LayerMatch, "order" | "ratio"> {
  if (role === "anchor") return { order: "Partner first", ratio: "1 spray partner, 2 sprays current" };
  if (role === "topper") return { order: "Current first", ratio: "2 sprays current, 1 spray partner" };
  return { order: "Either order", ratio: "1 spray each" };
}

function clashWarnings(
  base: Perfume,
  other: Perfume,
  baseMap: Map<string, number>,
  otherMap: Map<string, number>,
  baseDepth: number,
  otherDepth: number
): { multiplier: number; warnings: string[] } {
  const warnings: string[] = [];
  let multiplier = 1;

  const baseAquatic = hasAny(baseMap, ["aquatic", "marine", "ozonic", "watery", "salty", "mineral"]);
  const otherAquatic = hasAny(otherMap, ["aquatic", "marine", "ozonic", "watery", "salty", "mineral"]);
  const baseDark = axisStrength(baseMap, "dark");
  const otherDark = axisStrength(otherMap, "dark");
  if ((baseAquatic > 0.55 && otherDark > 0.7) || (otherAquatic > 0.55 && baseDark > 0.7)) {
    multiplier *= 0.78;
    warnings.push("Test lightly: aquatic and dark notes can clash");
  }

  const basePowdery = hasAny(baseMap, ["powdery", "soapy", "iris", "violet"]);
  const otherPowdery = hasAny(otherMap, ["powdery", "soapy", "iris", "violet"]);
  const baseSmoke = hasAny(baseMap, ["smoky", "leather", "tobacco", "incense"]);
  const otherSmoke = hasAny(otherMap, ["smoky", "leather", "tobacco", "incense"]);
  if ((basePowdery > 0.6 && otherSmoke > 0.65) || (otherPowdery > 0.6 && baseSmoke > 0.65)) {
    multiplier *= 0.84;
    warnings.push("Powder and smoke can turn harsh");
  }

  const baseSweet = axisStrength(baseMap, "sweet");
  const otherSweet = axisStrength(otherMap, "sweet");
  const summer = Math.min(
    base.profile.seasons.find((s) => s.season === "summer")?.strength ?? 0,
    other.profile.seasons.find((s) => s.season === "summer")?.strength ?? 0
  );
  if (Math.max(baseSweet, otherSweet) > 0.82 && summer > 0.65) {
    multiplier *= 0.9;
    warnings.push("Go lighter in heat");
  }

  const baseLoud = baseDepth > 2.1 || base.profile.sillage === "strong" || base.profile.sillage === "enormous";
  const otherLoud = otherDepth > 2.1 || other.profile.sillage === "strong" || other.profile.sillage === "enormous";
  if (baseLoud && otherLoud) {
    multiplier *= 0.82;
    warnings.push("Both are dense; keep sprays low");
  }

  return { multiplier, warnings: warnings.slice(0, 2) };
}

interface Scored extends LayerMatch {
  map: Map<string, number>;
}

/** Rank layering partners for `base` from the collection. */
export function layeringPartners(base: Perfume, all: Perfume[], limit = 6): LayerMatch[] {
  const baseFam = base.profile.family;
  const complements = COMPLEMENT[baseFam] ?? [];
  const baseMap = accordMap(base);
  const baseNotes = noteMap(base);
  const baseDepth = depth(base, baseMap);

  const scored: Scored[] = [];
  for (const other of all) {
    if (other.id === base.id) continue;
    // Layering two clones of the *same* original is pointless.
    if (base.impressionOf && other.impressionOf && base.impressionOf === other.impressionOf) continue;

    const otherMap = accordMap(other);
    const otherNotes = noteMap(other);
    const otherDepth = depth(other, otherMap);

    // 1) Bridge — weighted overlap of shared accords (so they blend).
    let bridge = 0;
    const shared: [string, number][] = [];
    for (const [k, bw] of baseMap) {
      const ow = otherMap.get(k);
      if (ow) { const v = Math.min(bw, ow); bridge += v; shared.push([k, v]); }
    }

    // Exact note bridges are especially useful for real-world layering.
    let noteBridge = 0;
    const sharedNotes: [string, number][] = [];
    for (const [k, bw] of baseNotes) {
      const ow = otherNotes.get(k);
      if (ow) { const v = Math.min(bw, ow); noteBridge += v; sharedNotes.push([k, v]); }
    }

    // 2) Complement — partner brings an axis the base lacks (valued most),
    //    plus the base returning the favour (valued less).
    let comp = 0;
    let bestAdd = { axis: "", gain: 0 };
    for (const axis of AXIS_KEYS) {
      const b = axisStrength(baseMap, axis);
      const o = axisStrength(otherMap, axis);
      const adds = Math.max(0, o - b);
      comp += adds + Math.max(0, b - o) * 0.4;
      if (adds > bestAdd.gain) bestAdd = { axis, gain: adds };
    }

    // 3) Role pairing — anchor + lifter. Reward depth contrast.
    const contrast = Math.abs(baseDepth - otherDepth);

    // 4) Curated family prior — a light, rank-weighted nudge.
    const compIndex = complements.indexOf(other.profile.family);
    const famBonus = compIndex >= 0 ? 1 - compIndex * 0.15 : other.profile.family === baseFam ? 0.2 : 0;

    let score = bridge * 1.35 + noteBridge * 1.25 + comp * 1.1 + contrast * 0.7 + famBonus;

    // No common ground reads as a clash risk — discount hard.
    if (bridge < 0.25 && noteBridge < 0.35) score *= 0.45;

    // 5) Context — share a season window and a time of day.
    const context = seasonSim(base, other) * 0.6 + dayNightSim(base, other) * 0.4;
    score *= 0.65 + 0.5 * context;

    // 6) Trust the data — estimated profiles are noisier.
    if (other.profile.confidence === "low") score *= 0.85;

    const clash = clashWarnings(base, other, baseMap, otherMap, baseDepth, otherDepth);
    score *= clash.multiplier;

    if (score < 0.8) continue;

    // ── reason ──
    const reasons: string[] = [];
    const role = roleFor(baseDepth, otherDepth, baseMap, otherMap);
    const plan = wearingPlan(role);
    if (role === "topper") reasons.push("fresh lift over a warmer base");
    else if (role === "anchor") reasons.push("anchors this with depth");
    if (sharedNotes.length) {
      const top = sharedNotes.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      reasons.push(`shared ${top.join(" + ")}`);
    } else if (shared.length) {
      const top = shared.sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
      reasons.push(`shared ${top.join(" + ")}`);
    }
    if (bestAdd.gain > 0.45 && reasons.length < 2) reasons.push(`adds ${bestAdd.axis}`);
    const reason = reasons.length ? cap(reasons.slice(0, 2).join(" · ")) : "Complementary accords";

    scored.push({ perfume: other, score, reason, role, ...plan, warnings: clash.warnings, map: otherMap });
  }

  scored.sort((a, b) => b.score - a.score);

  // 7) Diversify — greedily pick, demoting candidates too similar (by accord
  //    profile) to ones already chosen, so the list spans different scents.
  const picked: Scored[] = [];
  while (picked.length < limit && scored.length) {
    let bestIdx = 0, bestAdj = -Infinity;
    for (let i = 0; i < scored.length; i++) {
      const c = scored[i];
      let sim = 0;
      for (const p of picked) sim = Math.max(sim, accordCosine(c.map, p.map));
      const adj = c.score * (1 - 0.55 * sim);
      if (adj > bestAdj) { bestAdj = adj; bestIdx = i; }
    }
    picked.push(scored.splice(bestIdx, 1)[0]);
  }

  return picked.map(({ perfume, score, reason, role, order, ratio, warnings }) => ({
    perfume, score, reason, role, order, ratio, warnings,
  }));
}
