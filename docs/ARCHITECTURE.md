# Architecture

## Overview

A static Next.js (App Router) app. There is **no backend** yet — all fragrance data is
compiled to JSON at build time by the Python pipeline and imported directly. Per-user state
(favorites, notes, ratings) lives in the browser's `localStorage`.

```
                         build time                         runtime (browser)
  data/sources/*  ──▶  scripts/*.py  ──▶  data/generated/*.json
                                                  │
                                                  ▼
                                           lib/data.ts  ──▶  server components (page.tsx)
                                                  │                     │ props
                                                  ▼                     ▼
                                       lib/{layering,recommend,filter}  client islands
                                                                        │
                                              lib/userMeta.tsx (localStorage) ◀── favorites/notes
```

## The two seams (most important design decision)

Everything that could change when we add collaboration is funneled through **two files**:

| Seam | File | v1 (now) | v2 (collaboration) |
| --- | --- | --- | --- |
| Fragrance data | `lib/data.ts` | imports static JSON | Supabase `select` queries |
| User state | `lib/userMeta.tsx` | React context over `localStorage` | Supabase rows keyed by user id |

No component imports `data/**` or calls `localStorage` directly. So moving to a real backend
is a change to these two files — the component tree, types, and logic are untouched.

## Server vs. client

- **Server components** (`app/page.tsx`, `app/wear/page.tsx`) call `lib/data.ts`, then pass
  plain serializable data into client islands. They ship no JS for data loading.
- **Client islands** (`"use client"`): `GalleryClient`, `WearClient`, `PerfumeDetail`,
  `Filters`, `PerfumeCard`, `FavoriteButton` — anything with state or interaction.
- `UserMetaProvider` (in `app/layout.tsx`) wraps the app so favorites/notes are global.

## Module map (`lib/`)

| File | Responsibility |
| --- | --- |
| `types.ts` | `Perfume`, `Profile`, `Facets`, `Season`, `Confidence` |
| `data.ts` | `getCollection()`, `getPerfume(id)`, `getFacets()`, `getByFamily()` — the data seam |
| `userMeta.tsx` | `UserMetaProvider` + `useUserMeta()` — favorites, notes, ratings (the state seam) |
| `families.ts` | family metadata, season labels/glyphs |
| `filter.ts` | `applyFilters()` — search + multi-facet filter + sort |
| `layering.ts` | `layeringPartners()` — complementary-family + bridge-accord scoring |
| `recommend.ts` | `recommend()` — season/occasion/time scoring for "what to wear" |

## Data shape

Each of the 313 entries in `collection.json`:

```ts
{
  id, cloneName, house, group, kind,        // kind: single | hybrid | own | original
  isOriginal, impressionOf, impressionRaw,
  profile: {
    family, keyAccords[], topNotes[], heartNotes[], baseNotes[],
    seasons: [{season, strength}], occasions[], timeOfDay[],
    longevity, sillage, mood,
    confidence: "high"|"medium"|"low", needsReview,
    originalName, originalBrand, year, gender, rating,
    isBlend?, parents?, isHouseOriginal?
  }
}
```

`facets.json` carries pre-counted families / houses / seasons / occasions for the filters.

## Routing

- `/` — masthead + family legend + gallery (search, filters, sort, detail drawer).
- `/wear` — season × occasion × time finder.
- Detail is an in-page drawer (not a route) so it overlays from anywhere; Escape/scrim close.

## Why these choices

- **Static JSON, no DB:** 313 records are tiny; static means free hosting, instant loads, and
  a trivially shareable URL — matching the brief (view-only share, easy mobile access).
- **Drawer over per-perfume route:** keeps the gallery context; the whole-site share link is
  the sharing unit, not deep links.
- **Derived fields in the pipeline:** season/occasion/mood are computed from accords once, so
  the UI never re-derives and data stays consistent across the app.
