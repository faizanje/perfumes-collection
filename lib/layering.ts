import type { Perfume } from "./types";

// Which families bridge well when layered (fresh opener + warm base, etc.).
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

export interface LayerMatch {
  perfume: Perfume;
  score: number;
  reason: string;
}

function bridgeAccords(a: Perfume, b: Perfume): string[] {
  const sb = new Set(b.profile.keyAccords);
  return a.profile.keyAccords.filter((x) => sb.has(x));
}

/** Rank layering partners for `base` from the collection. */
export function layeringPartners(base: Perfume, all: Perfume[], limit = 6): LayerMatch[] {
  const baseFam = base.profile.family;
  const complements = COMPLEMENT[baseFam] ?? [];

  const matches: LayerMatch[] = [];
  for (const other of all) {
    if (other.id === base.id) continue;
    const fam = other.profile.family;
    let score = 0;
    const reasons: string[] = [];

    const compIndex = complements.indexOf(fam);
    if (compIndex >= 0) {
      score += 5 - compIndex * 0.4;
      reasons.push(`${baseFam.split(" / ")[0]} + ${fam.split(" / ")[0]}`);
    } else if (fam === baseFam) {
      score += 0.6; // same family — safe but flat
    }

    const bridge = bridgeAccords(base, other);
    if (bridge.length) {
      score += Math.min(bridge.length, 3) * 0.8;
      reasons.push(`shared ${bridge.slice(0, 2).join(" + ")}`);
    }

    // a deep/warm base pairs best under a fresh opener and vice-versa
    const baseDeep = ["Amber / Oriental", "Oud / Animalic", "Gourmand / Sweet", "Leather / Smoky"].includes(baseFam);
    const otherFresh = ["Fresh / Citrus", "Aromatic / Fresh"].includes(fam);
    if (baseDeep && otherFresh) {
      score += 1.2;
      reasons.push("fresh lift over a warm base");
    }

    if (score >= 2) {
      matches.push({
        perfume: other,
        score,
        reason: reasons[0] ?? "complementary accords",
      });
    }
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}
