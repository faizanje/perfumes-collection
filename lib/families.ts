// Fragrance-family metadata: label, short tag, and the OKLCH token name used
// for the data-driven accent (resolved in globals.css via [data-family]).

export interface FamilyMeta {
  name: string;
  short: string;
  blurb: string;
}

export const FAMILIES: Record<string, FamilyMeta> = {
  "Fresh / Citrus": {
    name: "Fresh / Citrus",
    short: "Fresh",
    blurb: "Bright, aquatic and zesty. Built for heat and daylight.",
  },
  "Aromatic / Fresh": {
    name: "Aromatic / Fresh",
    short: "Aromatic",
    blurb: "Herbal, lavender-and-sage greenery with a clean spine.",
  },
  Woody: {
    name: "Woody",
    short: "Woody",
    blurb: "Cedar, vetiver and moss. Dry, grounded and refined.",
  },
  "Amber / Oriental": {
    name: "Amber / Oriental",
    short: "Amber",
    blurb: "Warm resins and spice for cold-weather richness.",
  },
  Fruity: {
    name: "Fruity",
    short: "Fruity",
    blurb: "Juicy and ripe, with pineapple, apple and berries up top.",
  },
  "Gourmand / Sweet": {
    name: "Gourmand / Sweet",
    short: "Gourmand",
    blurb: "Vanilla, praline and caramel. Edible warmth.",
  },
  "Oud / Animalic": {
    name: "Oud / Animalic",
    short: "Oud",
    blurb: "Agarwood, leather and musk. Opulent and intense.",
  },
  Floral: {
    name: "Floral",
    short: "Floral",
    blurb: "Rose, iris and blossom at the heart.",
  },
  "Leather / Smoky": {
    name: "Leather / Smoky",
    short: "Leather",
    blurb: "Tobacco, birch tar and smoke. Dark and tactile.",
  },
};

export const FAMILY_ORDER = Object.keys(FAMILIES);

export function familyMeta(name: string): FamilyMeta {
  return (
    FAMILIES[name] ?? {
      name,
      short: name,
      blurb: "A distinctive composition.",
    }
  );
}

export const SEASON_LABEL: Record<string, string> = {
  spring: "Spring",
  summer: "Summer",
  fall: "Autumn",
  winter: "Winter",
};

export const SEASON_GLYPH: Record<string, string> = {
  spring: "❀",
  summer: "☀",
  fall: "❧",
  winter: "❄",
};
