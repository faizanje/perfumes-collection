# Design System

Editorial-luxury, anti-templated. Built with the Hallmark design discipline. Warm paper &
ink, fragrance-family color-coding, serif display. No bottle photos — typography carries it.

## Tokens

All design values are CSS custom properties in [`app/globals.css`](../app/globals.css)
(`:root`) and surfaced to Tailwind in `tailwind.config.ts`. **Never inline raw hex/OKLCH in
components** — reference a token.

- **Neutrals (OKLCH):** `--color-paper` / `-2` / `-3` (warm off-whites), `--color-ink` /
  `-2` / `-3` (warm near-blacks), `--color-line` (hairline).
- **Type:** `--font-display` (Fraunces), `--font-sans` (Inter), `--font-mono` (IBM Plex
  Mono, used for the uppercase `.label` micro-labels).
- **Scale:** `--text-*` (xs → display), `--space-*` (4-pt), `--radius-*`, `--ease-*`,
  `--dur-*`.

## Fragrance-family colors

Nine families each get an OKLCH accent token (`--fam-fresh`, `--fam-woody`, …). Components
set `data-family="<family>"` on a wrapper; `globals.css` resolves `--fam` from it, so any
descendant can use `var(--fam)` for dots, spines, washes, and tints. Add a family by adding
one `--fam-*` token + one `[data-family="…"]` rule, and an entry in `lib/families.ts`.

| Family | Hue |
| --- | --- |
| Fresh / Citrus | sky blue |
| Aromatic / Fresh | teal-green |
| Woody | warm brown |
| Amber / Oriental | amber |
| Fruity | coral red |
| Gourmand / Sweet | caramel |
| Oud / Animalic | plum |
| Floral | rose pink |
| Leather / Smoky | dark tobacco |

## Type

- Headings: Fraunces, **roman only** (no italic headers — a deliberate anti-AI-slop rule),
  weight ~460, tight tracking, `overflow-wrap: anywhere`.
- Body: Inter. Micro-labels: IBM Plex Mono uppercase via the `.label` utility.

## Motion

- Transitions only on `transform` / `opacity`; named easings (`--ease-out`, etc.), never raw
  `ease`. Card hover = subtle lift; drawer = slide-in; sheet = rise. Max a few primitives.
- `prefers-reduced-motion` collapses everything to near-instant.

## Layout & responsiveness

- `max-w-shell` (78rem) content column. Gallery grid: 1 col → 2 (sm) → 3 (xl), with
  `minmax(0,1fr)` tracks.
- Mobile: filters move into a bottom sheet; `overflow-x: clip` on `html`/`body` guarantees no
  horizontal scroll. Verified at 320 / 375 / 414 / 768 px.

## Components

- **PerfumeCard** — family spine + tinted wash, serif name, "impression of", accords, house,
  favourite heart. Opens the drawer.
- **PerfumeDetail** — drawer: note pyramid (top/heart/base), accords, when-to-wear
  (seasons/time/occasions), longevity/sillage, **layering partners with reasons**, and the
  owner's note + star rating. Shows an "unverified" mark for low-confidence data.
- **Filters** — family / season / occasion / house, with live counts.
- **GalleryClient / WearClient** — the two interactive surfaces.

## Stamp

`app/globals.css` begins with the Hallmark stamp recording the macrostructure/theme; the
design log is `.hallmark/log.json`. If redesigning, rotate per Hallmark's diversification
rule.
