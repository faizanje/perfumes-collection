# Design

Dark-default, dual-theme, **bold & colorful** "fragrance shelf." The nine fragrance-family colors
are the primary visual system. This is the *keeper* direction (see
[USER_PREFERENCES.md](USER_PREFERENCES.md) for the rejected ones — don't go back to pale/restrained).

## Theme

`data-theme="dark|light"` on `<html>`, **default dark**, persisted to `localStorage` (`pc.theme`),
applied pre-paint by an inline script (no flash). `ThemeToggle` (lucide Sun/Moon) in the header.

## Color (OKLCH, in `app/globals.css`)

- **Dark (default):** deep warm-charcoal canvas/surface, near-white ink, warm-gold accent.
- **Light:** warm off-white surfaces, dark ink.
- **9 fragrance families:** theme-independent vivid hues, resolved via `[data-family]` → `--fam`
  (Fresh=azure, Aromatic=green, Woody=tan, Amber=amber, Fruity=coral, Gourmand=caramel, Oud=plum,
  Floral=pink, Leather=bronze). Used for card glow/pill/borders.

### Real Fragrantica colors (important — NOT a single family color)

- **Accords**: each accord uses its **true Fragrantica hex** from `generated/accord_colors.json`
  (citrus=chartreuse, woody=brown, amber=orange…). Rendered as weighted horizontal bars
  (`viz.AccordBars`) using `accordWeights`.
- **Seasons**: each its own color + lucide icon (`lib/seasons.tsx`): spring=green Flower2,
  summer=red Umbrella, autumn=orange Leaf, winter=blue Snowflake; day=gold Sun, night=indigo Moon.
  Rendered as horizontal strength bars (`viz.SeasonStrip`) — long bar = more suitable.

## Typography

Fraunces (display/headings, roman only) · Inter (UI/body) · IBM Plex Mono (`.label` micro-labels).

## Imagery

Transparent bottle PNGs (background removed via rembg/birefnet, normalized to 3:4) on a dark
family-glow panel — like Fragrantica, no white box. Note pyramid uses round **note icons**
(`generated/note_images.json`). Hybrids show **two parent bottles** fanned with a "+". Image-less
entries get a typographic monogram tile. See [DATA_PIPELINE.md](DATA_PIPELINE.md) § Images.

## Icons

**lucide-react** everywhere (Heart, Sun/Moon, Search, ChevronDown, SlidersHorizontal, season
icons). No hand-drawn SVG paths or unicode glyphs.

## Layout

- Control bar: search · view toggle (Grouped ⇄ Gallery) · group-by · sort · favorites · filters.
- Grouped view (default): collapsible sections; group-by collection/house/family/season.
- Card grid: `repeat(auto-fill, minmax(264px, 1fr))` (bigger cards).
- Detail: right-side drawer.

## Motion

150–250ms, ease-out. Card hover lift + bottle scale, drawer slide, section collapse, bar grows.
Full `prefers-reduced-motion` fallback.

## Skills used

Built with **Hallmark** (early light version) then **Impeccable** (PRODUCT.md/DESIGN.md exist).
The current direction is "elevated option 2" — apply Impeccable discipline (real colors, hierarchy,
craft) but keep it dark and colorful, never restrained/pale.
