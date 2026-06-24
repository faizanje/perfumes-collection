// dataProvider abstraction — the single seam between the UI and the data source.
//
// v1 (now): reads the static JSON built by scripts/build_app_data.py.
// v2 (collaboration): swap the bodies of these functions for Supabase queries.
// Nothing in the component layer imports the JSON directly — it all comes
// through here, so the migration is a change to this one file.

import collectionData from "@/data/generated/collection.json";
import facetsData from "@/data/generated/facets.json";
import aromeImages from "@/data/generated/arome_images.json";
import type { Facets, HouseBottle, Perfume } from "./types";

const FACETS = facetsData as unknown as Facets;

// Real house bottle photos (arome.pk), keyed by perfume id. Merged onto the
// profile here so the rest of the app sees a single `profile.houseBottle` field
// and nothing else imports the JSON. See scripts/arome_images.py.
const HOUSE_BOTTLES = aromeImages as Record<string, HouseBottle & { confidence?: string }>;

const COLLECTION = (collectionData as unknown as Perfume[]).map((p) => {
  const hb = HOUSE_BOTTLES[p.id];
  if (!hb) return p;
  return { ...p, profile: { ...p.profile, houseBottle: { img: hb.img, title: hb.title, handle: hb.handle } } };
});

export function getCollection(): Perfume[] {
  return COLLECTION;
}

export function getPerfume(id: string): Perfume | undefined {
  return COLLECTION.find((p) => p.id === id);
}

export function getFacets(): Facets {
  return FACETS;
}

export function getByFamily(family: string): Perfume[] {
  return COLLECTION.filter((p) => p.profile.family === family);
}
