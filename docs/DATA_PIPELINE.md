# Data Pipeline

Turns the owner's spreadsheet into the enriched JSON the app reads. Pure Python stdlib,
fully offline after the source datasets are present. Run all four stages with:

```bash
npm run data
```

## Source of truth

`data/sources/Personal_Perfume_Collection.xlsx` — columns: `#`, **Name** (the decant
house's clone name), **Impression Of** (the real designer/niche original it clones),
**Brand** (the house). 313 perfumes across 18 collection groups. 29 Middle-Eastern entries
are *actual originals* (no "impression of") and are enriched by their own name.

## The four stages

| # | Script | In → Out |
| --- | --- | --- |
| 1 | `parse_xlsx.py` | xlsx → `build/raw_collection.json` (313) + `build/unique_originals.json` (221 deduped) |
| 2 | `enrich_from_dataset.py` | match 221 uniques vs. Fragrantica datasets → `build/originals.json` + `build/coverage_report.json` |
| 3 | `merge_manual.py` | hand-curated overrides merged into `build/originals.json` |
| 4 | `build_app_data.py` | join 313 entries to originals → `generated/{collection,originals,facets}.json` |

## Datasets (in `data/sources/`, gitignored)

- **`fra_cleaned.csv`** — Kaggle Fragrantica export (~24k rows; `;`-delimited, latin-1).
  Primary source: notes (top/middle/base), 5 main accords, rating, year, gender.
- **`frag_dataset.csv`** — GitHub Fragrantica scrape (~38k rows). Secondary: longevity +
  sillage vote distributions only.

Re-download these if regenerating on a fresh clone (see commit history / dataset notes).
The app does **not** need them — `data/generated/*.json` is committed.

## Matching (stage 2)

The hard part is mapping messy clone references ("PDM Sedley", "BR540", "Bleu de Chanel
EDP") to dataset rows. Techniques:

- **Normalize**: strip accents, lowercase, drop qualifiers (EDT/EDP/intense/smoky…),
  split apostrophes (`L'Homme → l homme`), expand brand abbreviations (PDM→Parfums de Marly,
  LV→Louis Vuitton, BTV→Boadicea the Victorious, MAB→Marc-Antoine Barrois, …).
- **Score**: blend of sequence similarity + token Jaccard + token containment, with a small
  penalty for extra candidate tokens (prefers the tightest match).
- **Gate against false positives**: require a distinctive (non-brand) query token to appear
  (exact or fuzzy) in the candidate — kills "LV Imagination → LV Reminiscences" type errors.

Result: **166 / 221** matched from datasets.

## Derived fields

The datasets give notes + accords; **family, season, occasion, time-of-day, mood** are
derived from the accords with explicit weight tables in `enrich_from_dataset.py`
(`FAMILY_RULES`, `SEASON_WEIGHTS`, `OCC_*`). Longevity/sillage come from vote distributions.
This keeps every entry consistent regardless of source.

## Manual tier (stage 3)

The 55 the matcher couldn't safely resolve — post-2020 niche, Fragrance One "Office for
Men", LV exclusives, and bare-name Middle-Eastern originals — are hand-authored in
`merge_manual.py` from fragrance knowledge. Each supplies `keyAccords` (+ notes when known);
season/occasion/mood are derived with the **same functions** as stage 2.

## Confidence & honesty

Every original carries `confidence`:

- **high** — well-known fragrance, reliable profile (143).
- **medium** — known house, reasonable profile (49).
- **low** — obscure local blend, best-effort guess (29) → also flagged `needsReview: true`.

`needsReview` entries (36 perfumes once mapped to clones) render an **"unverified"** mark in
the UI. They are listed in [README.md](../README.md) for the owner to confirm and correct.

## Special cases (stage 4)

- **Hybrids** ("BR540 + Aventus"): merge both parents' accords + notes, derive a blended
  profile, label `isBlend`.
- **House "own creations"**: derive from the parenthetical hint ("green notes" / "fresh
  scent" / "coffee"); marked `isHouseOriginal` + low confidence.
