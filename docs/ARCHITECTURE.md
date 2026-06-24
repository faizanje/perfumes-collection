# Architecture

Static Next.js (App Router) app. **No backend** — fragrance data is compiled to JSON by the
Python pipeline and imported; per-user state (favorites/notes) lives in `localStorage`.

```
data/sources/*  ──▶  scripts/*  ──▶  data/generated/*.json + public/img/*.png
                                              │
                                              ▼
                                       lib/data.ts ──▶ server components (page.tsx, wear/page.tsx)
                                              │                    │ props (plain data)
                                              ▼                    ▼
                              lib/{group,filter,layering,recommend}   client islands
                                                                      │
                                  lib/userMeta.tsx (localStorage) ◀── favorites/notes/ratings
```

## The two seams (key decision)

Everything that changes when collaboration is added is funneled through **two files**:

| Seam | File | v1 (now) | v2 (collaboration) |
| --- | --- | --- | --- |
| Fragrance data | `lib/data.ts` | imports generated JSON | Supabase queries |
| User state | `lib/userMeta.tsx` | React context over `localStorage` | Supabase rows per user |

No component imports `data/**` or calls `localStorage` directly.

## Server vs client

- **Server components** (`app/page.tsx`, `app/wear/page.tsx`) read `lib/data.ts`, pass plain data
  to client islands.
- **Client islands** (`"use client"`): `GalleryClient`, `WearClient`, `PerfumeDetail`,
  `GroupSection`, `PerfumeCard`, `Filters`, `FavoriteButton`, `ThemeToggle`.
- `UserMetaProvider` wraps the app in `app/layout.tsx`; the theme is set pre-paint by an inline
  script (no flash) and toggled by `ThemeToggle`.

## Module map (`lib/`)

| File | Responsibility |
| --- | --- |
| `types.ts` | `Perfume`, `Profile` (accords, notes, seasons, dayNight, accordWeights, imageUrl, parentImages…) |
| `data.ts` | `getCollection / getPerfume / getFacets` — the data seam |
| `userMeta.tsx` | favorites / notes / ratings (the state seam) |
| `families.ts` | fragrance-family metadata (name, short blurb) |
| `seasons.tsx` | season → lucide icon + color; day/night meta |
| `refData.ts` | `accordColor(name)` + `noteImage(name)` from the generated reference maps |
| `group.ts` | bucket perfumes by collection / house / family / season |
| `filter.ts` | search + multi-facet filter + sort |
| `layering.ts` | complementary-family + bridge-accord layering partners |
| `recommend.ts` | season/occasion/time scoring for "what to wear" |

## Components

- **PerfumeCard** — transparent bottle on a family-glow panel (or two parent bottles for hybrids,
  or a monogram); family pill, season icons, name, "after <original>", accords, house.
- **PerfumeDetail** (drawer) — bottle, weighted accord bars (real colors, `viz.AccordBars`), note
  pyramid with icons (`viz.NoteRow`), when-to-wear season + day/night bars (`viz.SeasonStrip`),
  layering partners, personal notes/rating, Fragrantica link.
- **GalleryClient** — control bar (search, view toggle, group-by, sort, favorites, filters),
  desktop filter rail, grouped/gallery content, mobile filter sheet, detail drawer.
- **GroupSection** — collapsible section per group with colored header + count.
- **viz.tsx** — `AccordBars`, `SeasonStrip`, `SeasonGlyphs`, `NoteRow` (shared data visuals).

## Data shape (each of 313 in `collection.json`)

```ts
{ id, cloneName, house, group, kind /* single|hybrid|own|original */, isOriginal,
  impressionOf, profile: {
    family, keyAccords[], accordWeights{accord:pct}, topNotes[], heartNotes[], baseNotes[],
    seasons:[{season,strength}], dayNight:{day,night}, timeOfDay[], occasions[],
    mood, longevity, sillage, rating, gender, confidence, needsReview, source,
    originalName, originalUrl, imageUrl, parentImages[]  // hybrids
  } }
```

`facets.json` = pre-counted families/houses/groups/seasons/occasions for filters.
`accord_colors.json` / `note_images.json` = reference maps used by `lib/refData.ts`.

## Routing

`/` masthead + gallery (grouped default) · `/wear` finder. Detail is an in-page drawer
(overlays from anywhere; Esc/scrim closes) — the share unit is the whole site, not deep links.
