# Getting accurate Fragrantica data via Apify

We want **accurate accords, season/day-night suitability, and top/middle/base notes** for
the collection's original fragrances. Fragrantica blocks scraping and its full dataset is
paid — so we use **Apify** (a hosted scraper) once, then ingest the result. You don't need to
write any code; just run a scraper and hand me the output file.

> Note: accords + notes are *already accurate* for the ~135 dataset-matched originals. The
> main thing this adds is **accurate seasons/day-night** (currently derived) and accurate
> data for the ~63 niche/local originals we couldn't match.

## What I've prepared

- **`data/build/apify_urls.txt`** — 135 Fragrantica URLs (one per line). These are the
  originals we have exact pages for.
- **`data/build/apify_startUrls.json`** — the same URLs in Apify's `[{ "url": ... }]` format.
- **`data/build/apify_needs_search.csv`** — 63 originals with no known URL (mostly local /
  Middle-Eastern houses, some not on Fragrantica). Optional; handle later.

## Steps

1. Make a free account at **apify.com**.
2. In **Apify Store**, search **"Fragrantica"** and open a scraper that returns a perfume's
   **main accords, notes (top/middle/base), and season + day/night votes**. (Any reputable
   Fragrantica actor works — they expose the same page data.)
3. For the actor's **Start URLs** input, paste the contents of `data/build/apify_urls.txt`
   (or upload `apify_startUrls.json`).
4. **Run** it. 135 pages is small — it should finish quickly and stay within free credits.
5. **Export** the results as **JSON** (Dataset → Export → JSON).
6. Save the file as **`data/sources/apify_results.json`** in this project and tell me — I'll
   write the ingest, regenerate the data, and the app will show accurate accords / seasons /
   notes (no vote counts, just the qualitative data you asked for).

## What I need in each result row (so the ingest works)

Whatever the actor names them, ideally each row has: the source **url**, **accords**, **top /
middle / base notes**, and **season** + **day-night** signals. I'll adapt the ingest to the
actual field names in your exported JSON — don't worry about matching a schema exactly.

If a particular actor looks confusing or costs credits you'd rather not spend, tell me and
I'll instead improve the season accuracy by deriving from the full note list for free, and we
skip Apify.
