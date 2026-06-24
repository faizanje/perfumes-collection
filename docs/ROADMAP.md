# Roadmap & Status

## Done

- [x] Data foundation: 313 perfumes parsed, ~221 unique originals.
- [x] **Accurate Fragrantica data** for ~200/221 originals (real accords + colors, note pyramid,
      season + day/night) via Apify exports **and** our own local-Chrome scraper.
- [x] **Own Fragrantica scraper** (Cloudflare-beating, no cost) — repeatable.
- [x] URL-correction mechanism (`URL_OVERRIDES`) — corrections applied: YSL Y, K by D&G, Date for
      Men, TK No.4, White Musk, Shuhrah Elixir, Monocline 05, Splendor (+ more as the user sends them).
- [x] **Transparent bottle images** (rembg/birefnet, normalized) self-hosted; manual clone-house
      images for the ones not on Fragrantica.
- [x] **Hybrid cards** showing both parent bottles.
- [x] UI: dark-default dual theme, real accord/season colors, note icons, lucide icons, bigger
      cards, grouped/gallery views, search/filters, detail drawer, what-to-wear finder, favorites/notes.
- [x] Full docs (this set + CLAUDE.md).

## In progress / next

- [ ] Finish applying the latest corrections (scrape + image the newest overrides) and re-verify.
- [ ] **Deploy to Vercel** (owner runs `vercel`) → shareable URL.
- [ ] **Commit** to `redesign-impeccable` (waiting for the owner's go) — includes `public/img/`.
- [ ] Continue one-off corrections / manual images as the owner reviews the collection.
- [ ] Optional: per-perfume share links, collection stats, "surprise me."

## Collaboration (v2 — designed-in, not built)

Owner edits, brother views; later both edit.
1. Add **Supabase** (Postgres + Auth). Keep the static catalog or move it to a table; add a
   `user_perfume_meta` table for favorites/notes/ratings keyed by user id.
2. Swap **only** `lib/data.ts` (reads) and `lib/userMeta.tsx` (favorites/notes). UI unchanged.
3. Roles via Row-Level Security: owner = editor, brother = viewer.

## Known limitations

- ~21 local clones aren't on Fragrantica → manual data/images, flagged "estimated."
- `matchedName` (original's display name) can lag after a URL override (cosmetic; data is correct).
- Favorites/notes are per-device until v2 (localStorage).
- Image regen with birefnet is slow on CPU (~8s/bottle) — fine as a one-off; future images are
  processed a few at a time.
