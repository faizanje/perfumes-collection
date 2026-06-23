import type { Perfume, Season } from "./types";

export interface WearQuery {
  season: Season | null;
  occasion: string | null;
  time: "Day" | "Night" | null;
}

export interface WearMatch {
  perfume: Perfume;
  score: number;
}

/** Score the collection for a season / occasion / time-of-day request. */
export function recommend(query: WearQuery, all: Perfume[], limit = 12): WearMatch[] {
  const out: WearMatch[] = [];
  for (const p of all) {
    let score = 0;
    let gated = true;

    if (query.season) {
      const s = p.profile.seasons.find((x) => x.season === query.season);
      if (s) score += s.strength * 5;
      else gated = false;
    }
    if (query.occasion) {
      if (p.profile.occasions.includes(query.occasion)) score += 3;
      else gated = false;
    }
    if (query.time) {
      if (p.profile.timeOfDay.includes(query.time)) score += 1.5;
    }

    // prefer confident data so recommendations are trustworthy
    if (p.profile.confidence === "high") score += 0.6;
    else if (p.profile.confidence === "low") score -= 0.5;

    if (gated && score > 0) out.push({ perfume: p, score });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit);
}
