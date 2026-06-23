# CLAUDE.md — Project Context

> Master context for this repo. Read this first in any new chat; it links out to
> `docs/` for depth. Keep it current when architecture or goals change.

## What this is

**The Vault** — a personal web app for browsing a fragrance collection of **313
perfumes** across 27 decant houses. Each fragrance is enriched with its note pyramid,
olfactive family, best seasons, occasions, layering partners, longevity/sillage, and a
data-confidence flag. Mobile-first, shareable by URL, installable as a PWA.

The collection is mostly **clones / "impressions"** of real designer & niche originals.
The original is the key to enrichment: we enrich each unique original **once**, then map
clones onto it.

## Goal & constraints

- **Primary:** a beautiful, fast, searchable view of the whole collection — usable on
  phone and desktop, shareable **view-only** with the owner's brother.
- **Owner edits, brother views.** Built so adding two-way collaboration later is a
  one-file swap (see the data seam in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)).
- **No bottle photos** (copyright/reliability) — typographic cards color-coded by
  fragrance family.
- **Honest data.** Auto-derived low-confidence entries are flagged `unverified` in the UI,
  never silently presented as fact.

## Tech stack

- **Next.js 15 (App Router) + TypeScript + Tailwind 3** — static export, deploys to Vercel.
- **Python 3** (stdlib only) for the offline data-enrichment pipeline.
- Fonts: Fraunces (display) · Inter (body) · IBM Plex Mono (labels), via `next/font`.
- No runtime DB yet — data is static JSON; favorites/notes live in `localStorage`.

## Repository structure

```
app/                 Next.js routes (App Router)
  layout.tsx         fonts, metadata, PWA, UserMetaProvider
  page.tsx           home — masthead + gallery
  wear/page.tsx      "What should I wear?" finder
components/          UI: cards, detail drawer, filters, gallery, header
lib/                 logic & data access (the app's brain)
  data.ts            ← data SEAM: only file that imports the JSON
  userMeta.tsx       ← favorites/notes SEAM: localStorage now, Supabase later
  types.ts           shared TypeScript types
  families.ts        fragrance-family metadata + labels
  filter.ts          search + filter + sort
  layering.ts        layering-partner engine
  recommend.ts       what-to-wear scoring
scripts/             Python enrichment pipeline (run via `npm run data`)
data/
  sources/           raw inputs (xlsx + datasets) — gitignored, kept local
  build/             intermediate pipeline artifacts — gitignored, regenerable
  generated/         final JSON the app reads — COMMITTED
docs/                ARCHITECTURE · DATA_PIPELINE · DESIGN · ROADMAP
public/              manifest + icon
```

**Golden rule:** the app reads data **only** through `lib/data.ts` (collection/facets) and
`lib/userMeta.tsx` (favorites/notes). Nothing else imports JSON or touches storage.

## Commands

```bash
npm run dev      # local dev → http://localhost:3000
npm run build    # production build (all routes prerender static)
npm run data     # regenerate data/generated/* from data/sources/* (needs the xlsx + CSVs)
```

## How the data flows (one line)

`xlsx → parse → enrich (match vs Fragrantica datasets + derive) → manual overrides →
build → data/generated/*.json → lib/data.ts → UI`. Full detail:
[docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md).

## Conventions (clean code)

- **One seam for data, one for user-state.** Never import `data/**` outside `lib/data.ts`;
  never touch `localStorage` outside `lib/userMeta.tsx`.
- **Server components fetch, client components interact.** Pages are server components that
  pass plain data to `"use client"` islands (`GalleryClient`, `WearClient`, `PerfumeDetail`).
- **Design tokens only.** Colours/fonts/spacing are CSS custom properties in
  `app/globals.css` (OKLCH). No inline hex. Family accents resolve via `[data-family]`.
- **Derived, not duplicated.** Season/occasion/time/mood are computed from accords in the
  pipeline (and mirrored in `lib/`), so they stay consistent. See
  [docs/DESIGN.md](docs/DESIGN.md).
- **Honesty in data.** Keep `confidence` + `needsReview`; surface them in the UI.

## Status & next steps

Core app complete and verified (gallery, search/filter, detail+notes, layering, what-to-wear,
favorites/notes). **Not yet deployed** — owner runs `vercel`. Roadmap (incl. Supabase
collaboration): [docs/ROADMAP.md](docs/ROADMAP.md).

## Related docs

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components, data flow, the collaboration seam
- [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md) — enrichment tiers, datasets, confidence
- [docs/DESIGN.md](docs/DESIGN.md) — design system, tokens, families, motion
- [docs/ROADMAP.md](docs/ROADMAP.md) — done / next / collaboration plan
- [README.md](README.md) — quick start + deploy
