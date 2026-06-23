# Roadmap & Status

## Done (v1)

- [x] Data pipeline: 313 perfumes parsed, 221 originals enriched (166 dataset + 55 manual),
      hybrids/own-creations resolved, confidence flags.
- [x] Gallery: responsive grid, family color-coding, live search, family/season/occasion/
      house filters, sort.
- [x] Detail drawer: note pyramid, accords, when-to-wear, longevity/sillage, layering
      partners, owner notes + rating, unverified flag.
- [x] "What should I wear?" finder (season × occasion × time).
- [x] Favorites + personal notes + ratings (localStorage, owner-only).
- [x] PWA manifest, mobile passes (no horizontal scroll 320–768px), static build.
- [x] Clean repo structure + context docs.

## Next

- [ ] **Deploy to Vercel** (owner action): `vercel` → share the `*.vercel.app` URL.
- [ ] Confirm the **36 `needsReview` entries** (listed in README) and correct any guesses.
- [ ] Optional: per-perfume share links / OG images; "surprise me"; collection stats page.

## Collaboration (v2) — designed-in, not built

Goal: owner edits, brother views; later both can edit.

1. **Add Supabase** (Postgres + Auth, free tier). Tables: `perfumes` (or keep static JSON
   for the catalog), `user_perfume_meta` (favorites/notes/ratings keyed by `user_id`).
2. **Swap the two seams only:**
   - `lib/data.ts` → Supabase `select` for the catalog (or keep static + Supabase for
     overrides/edits).
   - `lib/userMeta.tsx` → replace the `localStorage` read/write bodies with Supabase calls
     keyed by the signed-in user; migrate existing localStorage on first sign-in.
3. **Roles:** owner = editor (write), brother = viewer (read-only). Enforce with Supabase
   Row-Level Security.

Because all data access already funnels through those two files
(see [ARCHITECTURE.md](ARCHITECTURE.md)), the component tree, types, and logic don't change.

## Known limitations

- Low-confidence local/Middle-Eastern entries are best-effort guesses (flagged in-app).
- Favorites/notes are per-device until v2 (localStorage).
- No bottle images by design (v1).
