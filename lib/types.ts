export type Season = "spring" | "summer" | "fall" | "winter";
export type Confidence = "high" | "medium" | "low";

export interface SeasonStrength {
  season: Season;
  strength: number;
}

/** The real bottle photo from the decant house (e.g. arome.pk), shown alongside
 *  the inspired-by original. Resolved in lib/data.ts from arome_images.json. */
export interface HouseBottle {
  img: string;
  title: string;
  handle: string;
}

export interface Profile {
  family: string;
  keyAccords: string[];
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  seasons: SeasonStrength[];
  occasions: string[];
  timeOfDay: string[];
  dayNight?: { day: number; night: number } | null;
  longevity: string | null;
  sillage: string | null;
  mood: string;
  confidence: Confidence;
  needsReview?: boolean;
  originalName?: string | null;
  originalBrand?: string | null;
  year?: string | null;
  gender?: string | null;
  rating?: number | null;
  isBlend?: boolean;
  parents?: string[];
  parentImages?: string[] | null;
  parentLinks?: { name: string; url: string | null }[] | null;
  isHouseOriginal?: boolean;
  accordWeights?: Record<string, number> | null;
  imageUrl?: string | null;
  originalUrl?: string | null;
  source?: string | null;
  /** Real house bottle photo (the decant the owner actually has). When present,
   *  the card/detail can show it next to the inspired-by original (imageUrl). */
  houseBottle?: HouseBottle | null;
}

export interface Perfume {
  id: string;
  cloneName: string;
  house: string;
  group: string;
  kind: "single" | "hybrid" | "own" | "original";
  isOriginal: boolean;
  impressionOf: string | null;
  impressionRaw: string | null;
  profile: Profile;
}

export interface Facets {
  total: number;
  families: [string, number][];
  houses: [string, number][];
  groups: string[];
  seasons: [string, number][];
  occasions: [string, number][];
}
