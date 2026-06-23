# The Vault — Personal Fragrance Collection

A mobile-first web app for browsing a personal fragrance collection of **313 perfumes**
across 27 houses. Each fragrance is enriched with its note pyramid, olfactive family,
best seasons, occasions, layering partners, longevity/sillage and a confidence flag.

Built with **Next.js (App Router) + TypeScript + Tailwind**. Static, fast, shareable by
URL, installable to a phone home screen (PWA). Designed so adding two-person collaboration
later is a one-file change.

---

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (all routes prerender static)
```

## Deploy to Vercel (free, shareable link)

The repo is deploy-ready — no config needed.

**Option A — CLI (fastest):**
```bash
npm i -g vercel      # once
vercel               # follow prompts; accept defaults
vercel --prod        # promote to the shareable production URL
```

**Option B — GitHub:** push this folder to a GitHub repo, then on
[vercel.com/new](https://vercel.com/new) "Import" it. Vercel auto-detects Next.js and gives
you a `https://<name>.vercel.app` URL. Send that to your brother — it opens read-only on any
phone or browser.

Favorites, personal notes and ratings are stored per-device in the browser (localStorage),
so only the editor's device keeps them. The data layer is abstracted (`lib/data.ts`,
`lib/userMeta.tsx`) — moving to Supabase for shared editing later means swapping those two
files, not rewriting the UI.

---

## Data pipeline

The app reads `data/generated/*.json` (committed), generated from
`data/sources/Personal_Perfume_Collection.xlsx` plus two public Fragrantica datasets. To
regenerate (needs the source files restored to `data/sources/` — see note):

```bash
npm run data
# = parse_xlsx → enrich_from_dataset → merge_manual → build_app_data
```

Full detail — stages, datasets, matching, confidence — is in
[docs/DATA_PIPELINE.md](docs/DATA_PIPELINE.md). Repo layout & architecture:
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Master context: [CLAUDE.md](CLAUDE.md).

**Source files** live in `data/sources/` and are **gitignored** (kept locally, not needed at
build/runtime): the `.xlsx` source of truth, `fra_cleaned.csv` (Kaggle — notes/accords/
rating), and `frag_dataset.csv` (GitHub — longevity/sillage). Restore them there to re-run
`npm run data`.

**Confidence:** every original is tagged `high` / `medium` / `low`. `low` entries are
auto-derived best guesses and show an "unverified" mark in the UI.

### 36 entries worth a personal check

These are obscure local / Middle-Eastern blends where public data was thin — the family and
season are sensible guesses. Open each, confirm, and (later, once editing is wired) correct:

Number Four · Pour Homme · Barber Shop · Casterly Rock · Big Apple · Faith · Auréva · Royal
Musk · Mr. 33 · Son of Ocean · Qatar · Al Hasham · Thai Oud · Caden · Samba Smoke ·
SpongeBob · Fresh Kryptonite · King · Mars · Phoenix 2.0 · Romantic Coffee · TK No. 4 · No
Name Exclusive · Legacy by Dynamo · Blue · Kaaf · Marj · Mani · Monocline 05 · Shuhral
Elixir · Ocean Rush · Euphoric Oud · Addicted · Splendor · Crown · Qissah Emperor Valley

---

## Roadmap to collaboration (designed-in, not built yet)

1. Add Supabase (Postgres + Auth, free tier).
2. Replace the bodies of `lib/data.ts` (reads) and `lib/userMeta.tsx` (favorites/notes) with
   Supabase queries. The component layer is untouched.
3. Roles: you = editor, brother = viewer. Notes/ratings move from localStorage to a
   `user_perfume_meta` table keyed by user id.
