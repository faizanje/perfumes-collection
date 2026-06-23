// dataProvider abstraction — the single seam between the UI and the data source.
//
// v1 (now): reads the static JSON built by scripts/build_app_data.py.
// v2 (collaboration): swap the bodies of these functions for Supabase queries.
// Nothing in the component layer imports the JSON directly — it all comes
// through here, so the migration is a change to this one file.

import collectionData from "@/data/generated/collection.json";
import facetsData from "@/data/generated/facets.json";
import type { Facets, Perfume } from "./types";

const COLLECTION = collectionData as unknown as Perfume[];
const FACETS = facetsData as unknown as Facets;

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
