# Design

## Theme

Dark-default, dual-theme "fragrance vault." A deep warm-charcoal canvas makes the nine
fragrance-family colors glow like bottles in a cabinet; a refined light theme mirrors it.
Bold & immersive: family color drives cards, group headers, and accents. Color strategy:
**Committed** (family hue carries 20–40% of each card surface), anchored on a neutral ink
system so it stays legible and calm where it needs to.

Theme is set via `data-theme="dark|light"` on `<html>`, default dark, persisted to
localStorage, applied pre-paint by an inline script (no flash).

## Color (OKLCH)

**Dark (default)**
- bg `oklch(16% 0.012 60)` · surface `oklch(20% 0.012 55)` · surface-2 `oklch(24% 0.014 55)`
- ink `oklch(96% 0.006 70)` · ink-2 `oklch(77% 0.01 65)` · ink-3 `oklch(62% 0.012 65)`
- line `oklch(30% 0.012 55)` · accent (gold) `oklch(82% 0.12 85)`

**Light**
- bg `oklch(98% 0.006 75)` · surface `oklch(99.5% 0.003 75)` · surface-2 `oklch(95% 0.008 75)`
- ink `oklch(24% 0.018 55)` · ink-2 `oklch(42% 0.014 55)` · ink-3 `oklch(54% 0.012 55)`
- line `oklch(88% 0.01 75)` · accent `oklch(58% 0.13 70)`

**Fragrance families** (theme-independent vivid hues; tints derived per theme via
`color-mix` into the surface, so one token works in both):
| Family | OKLCH |
| --- | --- |
| Fresh / Citrus | `oklch(70% 0.15 230)` azure |
| Aromatic / Fresh | `oklch(72% 0.16 158)` green |
| Woody | `oklch(64% 0.10 75)` tan |
| Amber / Oriental | `oklch(72% 0.15 60)` amber |
| Fruity | `oklch(66% 0.19 22)` coral-red |
| Gourmand / Sweet | `oklch(66% 0.14 40)` caramel |
| Oud / Animalic | `oklch(62% 0.16 322)` plum |
| Floral | `oklch(72% 0.15 350)` pink |
| Leather / Smoky | `oklch(60% 0.07 95)` bronze-olive |

Family color is used for surfaces, borders, glows, dots — **never body text** (contrast).
Resolved via `[data-family="…"]` → `--fam`.

## Typography

- **Display:** Fraunces (roman), for the masthead + perfume names — carries the luxury note.
- **UI/body:** Inter, fixed rem scale (product register: not fluid in-app).
- **Labels:** IBM Plex Mono uppercase, the `.label` utility, for kickers/meta only.
- Scale ratio ~1.2; headings `text-wrap: balance`.

## Layout

- Sticky control bar: search · view toggle (Grouped ⇄ Gallery) · group-by selector · sort ·
  favorites · theme toggle · filters (mobile sheet).
- **Grouped view (default):** collapsible sections by house/collection (switchable to family
  or season), each with a colored section header + count.
- **Gallery view:** flat responsive grid, `repeat(auto-fill, minmax(220px, 1fr))`.
- Detail stays a right-side drawer.

## Components

- **PerfumeCard** — family-tinted surface, family glow edge, big serif name, impression-of,
  accord chips, house, favourite. 8 states honored on interactive bits.
- **GroupSection** — colored header (family-aware when grouping by family), count, collapse.
- **ThemeToggle**, **Filters**, **PerfumeDetail** — consistent control vocabulary.

## Motion

150–250ms, ease-out. State + reveal only: card hover lift, drawer slide, section
collapse, staggered card fade-in per group. Full `prefers-reduced-motion` fallback.
