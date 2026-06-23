import type { Perfume, Season } from "./types";

export interface FilterState {
  query: string;
  families: string[];
  seasons: Season[];
  occasions: string[];
  houses: string[];
  favoritesOnly: boolean;
  sort: "name" | "house" | "family" | "rating";
}

export const EMPTY_FILTER: FilterState = {
  query: "",
  families: [],
  seasons: [],
  occasions: [],
  houses: [],
  favoritesOnly: false,
  sort: "name",
};

function haystack(p: Perfume): string {
  return [
    p.cloneName,
    p.impressionOf ?? "",
    p.house,
    p.profile.family,
    p.profile.originalName ?? "",
    ...p.profile.keyAccords,
    ...p.profile.topNotes,
    ...p.profile.heartNotes,
    ...p.profile.baseNotes,
  ]
    .join(" ")
    .toLowerCase();
}

export function applyFilters(
  all: Perfume[],
  f: FilterState,
  favorites: Set<string>
): Perfume[] {
  const q = f.query.trim().toLowerCase();
  const terms = q ? q.split(/\s+/) : [];

  let out = all.filter((p) => {
    if (f.favoritesOnly && !favorites.has(p.id)) return false;
    if (f.families.length && !f.families.includes(p.profile.family)) return false;
    if (f.houses.length && !f.houses.includes(p.house)) return false;
    if (f.occasions.length && !f.occasions.some((o) => p.profile.occasions.includes(o)))
      return false;
    if (
      f.seasons.length &&
      !f.seasons.some((s) =>
        p.profile.seasons.some((ps) => ps.season === s && ps.strength >= 0.6)
      )
    )
      return false;
    if (terms.length) {
      const h = haystack(p);
      if (!terms.every((t) => h.includes(t))) return false;
    }
    return true;
  });

  out = [...out].sort((a, b) => {
    switch (f.sort) {
      case "house":
        return a.house.localeCompare(b.house) || a.cloneName.localeCompare(b.cloneName);
      case "family":
        return (
          a.profile.family.localeCompare(b.profile.family) ||
          a.cloneName.localeCompare(b.cloneName)
        );
      case "rating":
        return (b.profile.rating ?? 0) - (a.profile.rating ?? 0);
      default:
        return a.cloneName.localeCompare(b.cloneName);
    }
  });

  return out;
}
