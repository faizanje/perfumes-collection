import type { Perfume, Season } from "./types";

export interface WearQuery {
  season: Season | null;
  occasion: string | null;
  time: "Day" | "Night" | null;
}

export interface WearMatch {
  perfume: Perfume;
  score: number;
  fit: "Excellent" | "Strong" | "Good";
  reasons: string[];
}

const DEEP_ACCORDS = ["amber", "warm spicy", "leather", "smoky", "tobacco", "oud", "animalic", "incense", "vanilla", "sweet"];
const FRESH_ACCORDS = ["citrus", "fresh", "aromatic", "green", "aquatic", "marine", "ozonic", "soapy", "musky", "lavender"];

function accordMap(p: Perfume): Map<string, number> {
  const m = new Map<string, number>();
  const w = p.profile.accordWeights;
  if (w && Object.keys(w).length) {
    const max = Math.max(...Object.values(w)) || 1;
    for (const [k, v] of Object.entries(w)) m.set(k.toLowerCase(), v / max);
  } else {
    p.profile.keyAccords.forEach((k, i) => m.set(k.toLowerCase(), Math.max(0.35, 1 - i * 0.14)));
  }
  return m;
}

function maxAccord(m: Map<string, number>, keys: string[]): number {
  return keys.reduce((best, k) => Math.max(best, m.get(k) ?? 0), 0);
}

function seasonStrength(p: Perfume, season: Season): number {
  return p.profile.seasons.find((x) => x.season === season)?.strength ?? 0;
}

function timeStrength(p: Perfume, time: "Day" | "Night"): number {
  const dn = p.profile.dayNight;
  if (dn) return time === "Day" ? dn.day : dn.night;
  return p.profile.timeOfDay.includes(time) ? 0.72 : 0.32;
}

function occasionFit(p: Perfume, occasion: string, m: Map<string, number>): { value: number; reason: string } {
  const exact = p.profile.occasions.includes(occasion) ? 0.58 : 0.18;
  const fresh = maxAccord(m, FRESH_ACCORDS);
  const deep = maxAccord(m, DEEP_ACCORDS);
  const day = timeStrength(p, "Day");
  const night = timeStrength(p, "Night");

  if (occasion === "Office") {
    const value = exact + fresh * 0.24 + day * 0.22 - deep * 0.18;
    return { value, reason: value >= 0.72 ? "Office-safe profile" : "Usable for office" };
  }
  if (occasion === "Daily" || occasion === "Casual") {
    const value = exact + fresh * 0.2 + Math.max(day, night) * 0.16 - Math.max(0, deep - 0.72) * 0.12;
    return { value, reason: occasion === "Daily" ? "Easy daily wear" : "Relaxed casual fit" };
  }
  if (occasion === "Versatile") {
    const seasonAverage = p.profile.seasons.reduce((sum, s) => sum + s.strength, 0) / Math.max(1, p.profile.seasons.length);
    const balance = 1 - Math.abs(day - night);
    const value = exact + seasonAverage * 0.22 + balance * 0.2 + p.profile.occasions.length / 40;
    return { value, reason: "Versatile across settings" };
  }
  if (occasion === "Date night") {
    const value = exact + night * 0.24 + Math.max(deep, maxAccord(m, ["sweet", "vanilla", "amber", "musky"])) * 0.22;
    return { value, reason: "Date-night leaning" };
  }
  if (occasion === "Evening") {
    const value = exact + night * 0.2 + deep * 0.18 + maxAccord(m, ["woody", "amber", "musky"]) * 0.1;
    return { value, reason: "Evening-ready" };
  }
  if (occasion === "Night out" || occasion === "Special occasion") {
    const rating = p.profile.rating ? Math.min(1, Math.max(0, (p.profile.rating - 3.7) / 0.9)) : 0.45;
    const value = exact + night * 0.2 + deep * 0.18 + rating * 0.14;
    return { value, reason: occasion === "Night out" ? "Has night-out presence" : "Feels more dressed-up" };
  }

  return { value: exact, reason: `${occasion} match` };
}

function fitLabel(score: number): WearMatch["fit"] {
  if (score >= 8) return "Excellent";
  if (score >= 6.2) return "Strong";
  return "Good";
}

function recommendationKey(p: Perfume): string {
  return p.profile.originalUrl || p.impressionOf || p.profile.originalName || p.cloneName;
}

/** Score the collection for a season / occasion / time-of-day request. */
export function recommend(query: WearQuery, all: Perfume[], limit = 12): WearMatch[] {
  const out: WearMatch[] = [];
  for (const p of all) {
    let score = 0;
    const reasons: string[] = [];
    const m = accordMap(p);

    if (query.season) {
      const strength = seasonStrength(p, query.season);
      score += strength * 4.2;
      if (strength >= 0.78) reasons.push(`${query.season} ${Math.round(strength * 100)}%`);
      else if (strength >= 0.55) reasons.push(`Works in ${query.season}`);
      else score -= 0.7;
    }

    if (query.occasion) {
      const fit = occasionFit(p, query.occasion, m);
      score += Math.max(0, Math.min(1, fit.value)) * 3.4;
      if (fit.value >= 0.58) reasons.push(fit.reason);
      else score -= 0.45;
    }

    if (query.time) {
      const strength = timeStrength(p, query.time);
      score += strength * 2.4;
      if (strength >= 0.72) reasons.push(`${query.time}-leaning`);
      else score -= 0.35;
    }

    // Small quality/trust nudges. Keep these below fit signals.
    if (p.profile.rating != null) score += Math.min(0.55, Math.max(0, p.profile.rating - 3.8) * 0.55);
    if (p.profile.confidence === "high") score += 0.45;
    else if (p.profile.confidence === "low") score -= 0.65;

    const asked = Number(Boolean(query.season)) + Number(Boolean(query.occasion)) + Number(Boolean(query.time));
    const minScore = asked >= 3 ? 3.5 : asked === 2 ? 2.6 : 1.6;
    if (score >= minScore) {
      if (reasons.length === 0) reasons.push("Closest overall fit");
      out.push({ perfume: p, score, fit: fitLabel(score), reasons: reasons.slice(0, 3) });
    }
  }

  const ranked = out.sort((a, b) => b.score - a.score);
  const picked: WearMatch[] = [];
  const seen = new Set<string>();
  const familyCounts = new Map<string, number>();

  for (const match of ranked) {
    const key = recommendationKey(match.perfume);
    const familyCount = familyCounts.get(match.perfume.profile.family) ?? 0;
    if (seen.has(key) || familyCount >= 4) continue;
    picked.push(match);
    seen.add(key);
    familyCounts.set(match.perfume.profile.family, familyCount + 1);
    if (picked.length === limit) return picked;
  }

  for (const match of ranked) {
    if (picked.some((p) => p.perfume.id === match.perfume.id)) continue;
    picked.push(match);
    if (picked.length === limit) break;
  }

  return picked;
}
