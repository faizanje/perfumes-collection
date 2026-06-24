# Data Pipeline (full)

Turns the spreadsheet + Fragrantica into the accurate JSON + images the app uses. Two kinds of
steps: **offline** (deterministic, in `npm run data`) and **network/ML** (scraping + images, run
individually).

## Source of truth

`data/sources/Personal_Perfume_Collection.xlsx` — 313 perfumes. Columns: clone name, **Impression
Of** (the real original it clones), house. ~313 entries collapse to **~221 unique originals**
(Aventus, BR540, etc. repeat). We enrich each unique original once, then map clones onto it.

## Offline steps (`npm run data`)

| # | Script | In → Out |
| --- | --- | --- |
| 1 | `parse_xlsx.py` | xlsx → `build/raw_collection.json` (313) + `build/unique_originals.json` (~221) |
| 2 | `enrich_from_dataset.py` | fuzzy-match uniques → Kaggle `fra_cleaned.csv` (notes/accords/rating) + GitHub `frag_dataset.csv` (image ids); first-pass derive |
| 3 | `merge_manual.py` | hand-curated `MANUAL` dict + `FOUND_URLS` + `URL_OVERRIDES` (see below) |
| 4 | `ingest_fragrantica.py` | overlay ACCURATE data from Apify exports (`sources/dataset_fragrantica_*.json`), keyed by Fragrantica perfume id (note: Apify `id` is a string) |
| 5 | `ingest_scraped.py` | overlay ACCURATE data from our own scraper (`sources/fragrantica_scraped.json`), keyed by slug |
| 6 | `build_reference_maps.py` | extract `generated/accord_colors.json` (real hex per accord) + `generated/note_images.json` (note icon URLs) from Apify data |
| 7 | `build_app_data.py` | join 313 → `generated/{collection,originals,facets}.json`; resolve hybrids; wire local images |

**Coverage:** ~**200/221** originals on real Fragrantica data; ~21 local clones not on Fragrantica.

## Datasets (in `data/sources/`, gitignored)

- **`fra_cleaned.csv`** — Kaggle Fragrantica export (~24k; `;`-delimited, latin-1). Notes,
  5 accords, rating, year, gender, **url**.
- **`frag_dataset.csv`** — GitHub Fragrantica scrape (~38k). Used for the bottle **image id**.
- **`dataset_fragrantica_*.json`** — the user's **Apify** exports (rich: accords w/ hex,
  pyramid w/ note images, season breakout, day/night, primaryImage).
- **`fragrantica_scraped.json`** — output of our own scraper (§ scraping).

## Scraping (how we beat Cloudflare)

`curl` / WebFetch → **403** (Cloudflare; not real browsers). Solutions:

- **Apify** — hosted real browser; the user ran it (rich JSON). Ingested by `ingest_fragrantica.py`.
- **`scripts/scrape_fragrantica.mjs`** — drives **local headless Chrome via CDP** on the user's
  home IP → **passes Cloudflare**. Extracts from Fragrantica's Tailwind DOM:
  - accords: `div[style*=width]` with class `rounded-br-lg` → `{name, pct}`
  - notes: parsed from the "Top notes are … middle … base …" description sentence
  - season/day-night: the `.tw-rating-card` containing both "winter" and "night" → 6 bar widths
  - Targets originals with a URL but `source != "fragrantica"`; resumable; polite delays.
  Ingested by `ingest_scraped.py`.

Missing **URLs** are found by `WebSearch` (agents read the URL from results — they must not fetch
fragrantica.com directly). Found URLs go into `FOUND_URLS` in `merge_manual.py`.

## Corrections workflow

- **Wrong match** (user sends correct Fragrantica URL): add `"<slug>": "<url>"` to **`URL_OVERRIDES`**
  in `merge_manual.py` (it sets the URL + flags the entry for re-scrape). Then run:
  `parse_xlsx → enrich → merge_manual → ingest_fragrantica → ingest_scraped → scrape_fragrantica.mjs
  → ingest_scraped → process_images.py → build_app_data`. Find slugs in `data/build/originals.json`.
- **Not on Fragrantica**: set accords/family in the **`MANUAL`** dict (pull from the clone house's
  site if needed) + add a manual image.
- **Audit**: `audit_matches.py` → `data/build/review.csv` (spreadsheet review, zero tokens).

## Images (hotlink Fragrantica's transparent webp — current approach)

**Key finding:** Fragrantica's perfume `<picture>` element hosts a **transparent dark-mode webp**
alongside the white-bg JPEG:

```
https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.<id>.webp   ← transparent bottle (use this)
https://fimgs.net/mdimg/perfume-thumbs/375x500.<id>.jpg          ← white background
```

The `dark-` webp is a true RGBA transparent bottle that renders cleanly on **any** background.
So we **hotlink it directly** — no downloading, no ML processing, no storage, no artifacts,
consistent 375×500 sizing. `build_app_data.py` → `local_image()` builds this URL from the
perfume id; `parentImages` (hybrids) use the same.

- **Not on Fragrantica (~21 local clones):** add `"<slug>": "<clone-house image url>"` to
  **`MANUAL_IMAGES`** in `scripts/manual_images.py`; it background-removes (rembg) + normalizes →
  committed `public/img/m-<slug>.png`, which `local_image()` prefers. (Only these few are
  self-hosted — currently just `m-addicted.png`.)
- **Deprecated:** `process_images.py` (rembg/birefnet self-hosting of ALL bottles) is no longer
  used — it created cutout artifacts on white/clear bottles. Kept only as an optional fallback.

History (for context): tried `u2net` flood-fill (broke white/clear bottles), then `birefnet`
(better but still some artifacts), before discovering Fragrantica's own transparent webp — which
is strictly better than any local processing.

## Confidence & honesty

`source: "fragrantica"` = verified real data. `manual` / low-confidence entries carry
`needsReview` / show an "estimated" (◌) mark in the UI. The 313 collection count and group counts
reconcile to the spreadsheet's summary.
