export type Season = "spring" | "summer" | "fall" | "winter";
export type Confidence = "high" | "medium" | "low";

export interface SeasonStrength {
  season: Season;
  strength: number;
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
  isHouseOriginal?: boolean;
  accordWeights?: Record<string, number> | null;
  imageUrl?: string | null;
  originalUrl?: string | null;
  source?: string | null;
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
