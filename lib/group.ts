import type { Facets, Perfume, Season } from "./types";
import { FAMILY_ORDER, SEASON_LABEL } from "./families";

export type GroupBy = "collection" | "house" | "family" | "season";

export const GROUP_BY_LABELS: [GroupBy, string][] = [
  ["collection", "Collection"],
  ["house", "House"],
  ["family", "Family"],
  ["season", "Season"],
];

export interface Group {
  key: string;
  label: string;
  items: Perfume[];
  /** family name to color the header, when grouping by family */
  family?: string;
  /** the house, when every item in the group shares one (for the house logo) */
  house?: string;
}

const SEASON_SORT: Season[] = ["spring", "summer", "fall", "winter"];

function topSeason(p: Perfume): Season {
  const best = [...p.profile.seasons].sort((a, b) => b.strength - a.strength)[0];
  return best?.season ?? "spring";
}

/** Bucket perfumes by the chosen dimension, in a sensible, stable order. */
export function groupPerfumes(items: Perfume[], by: GroupBy, facets: Facets): Group[] {
  const map = new Map<string, Perfume[]>();
  const push = (k: string, p: Perfume) => {
    const arr = map.get(k) ?? [];
    arr.push(p);
    map.set(k, arr);
  };

  for (const p of items) {
    if (by === "collection") push(p.group, p);
    else if (by === "house") push(p.house, p);
    else if (by === "family") push(p.profile.family, p);
    else push(topSeason(p), p);
  }

  let order: string[];
  if (by === "collection") order = facets.groups.filter((g) => map.has(g));
  else if (by === "house") order = facets.houses.map(([h]) => h).filter((h) => map.has(h));
  else if (by === "family") order = FAMILY_ORDER.filter((f) => map.has(f));
  else order = SEASON_SORT.filter((s) => map.has(s));

  // any keys not in the canonical order (safety) appended alphabetically
  for (const k of [...map.keys()].sort()) if (!order.includes(k)) order.push(k);

  return order.map((key) => {
    const items = map.get(key) ?? [];
    const houses = new Set(items.map((p) => p.house));
    return {
      key,
      label: by === "season" ? SEASON_LABEL[key] ?? key : key,
      items,
      family: by === "family" ? key : undefined,
      // a single-house group (e.g. any collection group, or house grouping) → show its logo
      house: houses.size === 1 ? items[0]?.house : undefined,
    };
  });
}
