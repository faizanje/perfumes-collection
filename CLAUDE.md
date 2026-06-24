# CLAUDE.md — Master Context for "Shelf"

> Read this first in any new chat. It's the single source of truth for what this
> project is, what the user wants, how the code/data/scraping/images work, and how to
> make changes. Deep dives live in [`docs/`](docs/). Keep this current.

---

## 1. What this is

**Shelf** — a premium personal web app for browsing a fragrance collection of
**313 perfumes** across ~27 decant "houses" (Arome, Scent It, Enchanté, etc.). Almost every
entry is a **clone / "impression"** of a real designer or niche original (e.g. *Check Mate →
Creed Aventus*). The app shows each perfume's real fragrance data — accords, note pyramid,
seasons, day/night — pulled from Fragrantica, plus bottle images, layering suggestions, and a
"what should I wear?" finder.

**Owner**: the user (sole editor). **Viewers**: his brother + friends (view-only share).
Built so two-way collaboration can be added later with minimal change.

## 2. The goal

A beautiful, **dark, colorful, premium** collection app that is:
- **Accurate** — real Fragrantica accords (with their true colors), note pyramids (with note
  icons), and season/day-night suitability. Never derived-data-presented-as-fact.
- **Scannable** — grouped by collection/house/family/season; navigate by color.
- **Shareable** — static, fast, deploys free to Vercel, opens on any phone.
- **Visual** — transparent bottle photos on every card, like Fragrantica.

## 3. User preferences — READ THIS (learned over many iterations)

**Likes / wants:**
- **Dark mode by default** (light mode available via toggle).
- **Bold, colorful, premium** look — the fragrance-family colors driving the design. (This is
  "option 2" below — the keeper.)
- **Real bottle images**, transparent (no white box), like Fragrantica.
- **Accurate Fragrantica data**: weighted accord bars in each accord's **true color**, the
  note pyramid with **note icons**, and **season + day/night** suitability as clear bars.
  Does **not** care about vote *counts/percentages* — just the accords/seasons/notes.
- **Proper icon library** (lucide-react), never hand-drawn/unicode glyphs.
- **Hybrids/fusions** shown as their two parent bottles.
- **Bigger cards.**
- **Correctness** — actively sends URL corrections for mis-matched originals; expects them
  applied precisely.
- **Efficiency** — pragmatic, token-aware; prefers automated/bulk solutions over manual work.
  Wants Claude to do the research/fetching/automation, not hand it back to him.
- **Confirm before risky/bulk ops** — e.g. "test on 2–3, show me, then proceed" before
  regenerating all images.

**Dislikes / rejected:**
- **Boring, plain, low-contrast, too-light** designs (rejected the first light-editorial look).
- **Over-restrained / minimal** premium (rejected a third, quieter direction — "still not it").
- **Cluttered** cards (too much packed in).
- **White backgrounds** on bottle images, **bad aspect ratios**, or **damaged** cutouts.
- **Distorted hand-drawn icons.**
- **A single color** used for all accords or all seasons.

**Design journey (so you don't repeat rejected directions):**
1. *Light editorial* (Hallmark skill) → **rejected**: boring, hard to scan, too light.
2. *Dark, colorful, family-immersive* → **liked the direction**, but cards felt cluttered.
3. *Premium restrained / Aesop-like* (Impeccable skill) → **rejected**: "still not it."
4. **Elevated #2** — dark + colorful + accurate data + transparent images + real colors +
   lucide icons → **the keeper.** This is the current design.

## 4. Tech stack

- **Next.js 15 (App Router) + TypeScript + Tailwind 3 + lucide-react** — static, deploys to Vercel.
- **Python 3** for the offline data pipeline (stdlib + Pillow + rembg).
- **rembg (birefnet-general-lite model)** + **ImageMagick** + **Pillow** — bottle background removal.
- **Local headless Chrome via CDP** — our Fragrantica scraper (see §6).
- Fonts: Fraunces (display) · Inter (body) · IBM Plex Mono (labels), via `next/font`.
- **Git**: work is on branch **`redesign-impeccable`**; `main` holds the original light version.

## 5. Repository map

```
app/                 Next routes: layout (theme, fonts), page (gallery), wear/ (finder)
components/           UI — PerfumeCard, PerfumeDetail, GalleryClient, GroupSection,
                      Filters, viz (accord/season/note visuals), ThemeToggle, SiteHeader…
lib/                  logic & data access (the app's brain) — see docs/ARCHITECTURE.md
  data.ts            ← DATA SEAM: only file that imports the generated JSON
  userMeta.tsx       ← STATE SEAM: favorites/notes/ratings (localStorage)
  types.ts           shared types (Perfume, Profile, …)
  families.ts        fragrance-family metadata
  seasons.tsx        season icons (lucide) + colors
  refData.ts         accord colors + note images lookups
  group.ts · filter.ts · layering.ts · recommend.ts
scripts/             Python/Node data + image pipeline (see docs/DATA_PIPELINE.md)
data/
  sources/           raw inputs (xlsx, datasets, Apify exports, scrape output) — GITIGNORED
  build/             intermediate pipeline artifacts — GITIGNORED
  generated/         JSON the app reads (collection/originals/facets/accord_colors/note_images) — COMMITTED
public/img/          self-hosted transparent bottle PNGs — COMMITTED
docs/                ARCHITECTURE · DATA_PIPELINE · DESIGN · USER_PREFERENCES · ROADMAP
```

**Golden rule:** the app reads data only through `lib/data.ts` and user state only through
`lib/userMeta.tsx`. Adding a backend later = change those two files, not the UI.

## 6. How data is generated (the heart of the project)

Source of truth: `data/sources/Personal_Perfume_Collection.xlsx` (313 perfumes; columns: clone
name, "impression of" original, house). Pipeline (`npm run data`, offline steps):

1. **`parse_xlsx.py`** → `build/raw_collection.json` (313) + `build/unique_originals.json` (~221 deduped).
2. **`enrich_from_dataset.py`** → fuzzy-match each unique original to two bulk Fragrantica
   datasets (Kaggle `fra_cleaned.csv` primary; GitHub `frag_dataset.csv` for image ids). Derives
   a first-pass family/season/etc.
3. **`merge_manual.py`** → hand-curated tier + **`FOUND_URLS`** (URLs found via search for
   originals the datasets missed) + **`URL_OVERRIDES`** (corrections — see §8).
4. **`ingest_fragrantica.py`** → overlays **accurate** accords (with weights) / notes / season /
   day-night from the **Apify** Fragrantica exports (`data/sources/dataset_fragrantica_*.json`),
   keyed by Fragrantica perfume id.
5. **`ingest_scraped.py`** → same, from **our own scraper's** output (`fragrantica_scraped.json`).
6. **`build_reference_maps.py`** → `generated/accord_colors.json` (real per-accord hex) +
   `generated/note_images.json` (note icon URLs), extracted from the Apify data.
7. **`build_app_data.py`** → joins everything → `generated/{collection,originals,facets}.json`;
   resolves hybrids (merge 2 parents, expose `parentImages`), wires local bottle images.

**Result:** ~**200 / 221** originals carry real Fragrantica data (accurate accords/seasons/notes);
the ~21 remaining are local clones not on Fragrantica (handled manually).

**Confidence:** `source: "fragrantica"` = verified; `manual`/low-confidence entries show an
"estimated"/◌ mark in the UI.

## 7. How scraping works (the breakthrough)

Fragrantica is **Cloudflare-protected**: `curl` and `WebFetch` get **403** (they aren't real
browsers). Two ways through, both used:

- **Apify** (hosted real browser + rotating proxies) — the user ran this for the first ~204
  records. Rich JSON (accords with hex, pyramid with note images, season breakout, etc.).
- **Our own scraper — `scripts/scrape_fragrantica.mjs`** — drives the **local Chrome** (CDP) on
  the user's home IP, which **passes Cloudflare**. Navigates each perfume page, extracts from
  Fragrantica's current Tailwind DOM: accords = `div.rounded-br-lg` with `width%`, notes from the
  description sentence, season/day-night from `.tw-rating-card` containing winter+night. Polite
  delays, resumable. **No cost, no Apify needed.** This is how we fill gaps and apply corrections.

Agents can find missing Fragrantica **URLs** via `WebSearch` (they read the URL from results;
they must NOT fetch fragrantica.com directly — it's blocked).

## 8. How to make corrections (common tasks)

- **Wrong original matched** (user sends a Fragrantica URL): add `"<slug>": "<url>"` to
  **`URL_OVERRIDES`** in `scripts/merge_manual.py`, then run: `parse_xlsx → enrich → merge_manual
  → ingest_fragrantica → ingest_scraped → scrape_fragrantica.mjs → ingest_scraped → process_images
  → build_app_data`. Find the slug via `data/build/originals.json`.
- **Not on Fragrantica**: set its accords/family in the **`MANUAL`** dict in `merge_manual.py`
  (pull from the clone house's site if needed), and add a **manual image** (see §9).
- **Audit matches**: `scripts/audit_matches.py` → `data/build/review.csv` (open in a spreadsheet,
  flag wrong rows — zero tokens).

## 9. How images work

**We hotlink Fragrantica's own transparent bottle images** — no downloading/processing/storage.
Fragrantica's `<picture>` hosts a transparent dark-mode webp next to the white-bg JPEG:
`https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.<id>.webp` (transparent RGBA — works on any
background). `build_app_data.py` → `local_image()` builds this URL from the perfume id.

- **Not on Fragrantica (~21 local clones):** add `"<slug>": "<clone-house image url>"` to
  **`MANUAL_IMAGES`** in `scripts/manual_images.py` → background-removed (rembg) + committed
  `public/img/m-<slug>.png`, which `local_image()` prefers. (Currently just `m-addicted.png`.)
- **Hybrids** show their two parent bottles fanned with a "+" (`parentImages`).
- **Deprecated:** `process_images.py` (self-hosting ALL bottles via rembg) — caused artifacts;
  the Fragrantica webp is strictly better. Kept only as a fallback.

## 10. UI overview

Dark-default dual theme (`data-theme` on `<html>`, no-flash inline script, `ThemeToggle`). Nine
fragrance-family colors resolve via `[data-family]`. See [docs/DESIGN.md](docs/DESIGN.md).

- **Card**: transparent bottle on a family-glow panel · family pill · season icons · name ·
  "after <original>" · accords · house. Hybrids = two parent bottles.
- **Detail drawer**: bottle · weighted **accord bars in real colors** · **note pyramid with note
  icons** · **when-to-wear** (season + day/night bars, real colors) · layering · personal notes/rating · Fragrantica link.
- **Views**: Grouped (by collection/house/family/season, collapsible) ⇄ Gallery (flat grid).
  Search + filters (family/season/occasion/house). Separate **/wear** finder.

## 11. Commands

```bash
npm run dev          # local dev → http://localhost:3000  (dark by default)
npm run build        # production build (static)
npm run data         # regenerate data/generated/* (offline steps; needs sources restored)
# image + scrape steps are run individually (network/ML, not in `npm run data`):
node scripts/scrape_fragrantica.mjs       # scrape new/corrected URLs (local Chrome)
python3 scripts/process_images.py --force # regenerate transparent bottles (birefnet)
python3 scripts/manual_images.py          # process MANUAL_IMAGES
```

## 12. Status & next

- Accurate data + transparent images + the elevated dark UI are **done** on `redesign-impeccable`.
- **Not yet deployed** (owner runs `vercel`) and **not yet committed** (waiting for user's go).
- Ongoing: the user is sending one-off **corrections** (URL overrides, manual images) — apply per §8/§9.
- Collaboration (Supabase, brother-as-viewer) is designed-in but not built — see [docs/ROADMAP.md](docs/ROADMAP.md).

## 13. Related docs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — components, data flow, seams, types
- [docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md) — pipeline, datasets, scraping, images, corrections (full)
- [docs/DESIGN.md](docs/DESIGN.md) — colors, tokens, families, cards, motion
- [docs/USER_PREFERENCES.md](docs/USER_PREFERENCES.md) — likes/dislikes + the design journey (full)
- [docs/ROADMAP.md](docs/ROADMAP.md) — done / next / collaboration
- [README.md](README.md) — quick start + deploy
