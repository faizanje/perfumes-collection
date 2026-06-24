# User Preferences & Design Journey

The single most useful context for a new chat: what the owner likes, dislikes, and how we
arrived at the current design. Honor this to avoid re-litigating settled decisions.

## Likes / wants

| Area | Preference |
| --- | --- |
| **Theme** | **Dark by default**, with a light-mode toggle. Dislikes pale/low-contrast looks. |
| **Aesthetic** | **Bold, colorful, premium.** The 9 fragrance-family colors should drive the design. |
| **Images** | Real **transparent** bottle photos on cards and detail, like Fragrantica (no white box). |
| **Data accuracy** | Real Fragrantica **accords** (true colors), **note pyramid** (note icons), **season + day/night** suitability. Wants it *accurate*, not derived. |
| **Vote counts** | Does **NOT** want vote counts/percentages shown — just the qualitative accords/seasons/notes. |
| **Colors** | Each accord its **own** color; each season its **own** color. Not one family color for everything. |
| **Icons** | A proper **icon library** (lucide-react). Hates hand-drawn/unicode glyphs. |
| **Hybrids** | Show the **two parent bottles** (fanned, with a "+"), not a blank tile. |
| **Cards** | **Bigger** cards. Clean hierarchy (not cluttered). |
| **Grouping** | Browse **grouped by collection/house** (and switchable to family/season). |
| **Correctness** | Sends precise **URL corrections**; expects them applied exactly and the data re-pulled. |
| **Effort** | Wants Claude to **do the work** — research, fetch, automate, bulk-process. Token-aware/pragmatic. |
| **Caution** | For risky/bulk operations, **test on 2–3, show results, confirm, then proceed.** |

## Dislikes / rejected

- **Boring, plain, low-contrast, too-light** designs.
- **Over-restrained / minimal** "premium" (Aesop-quiet) — felt like "not it."
- **Cluttered** cards.
- **White backgrounds** on bottle images; **bad aspect ratios**; **damaged** ML cutouts (floating caps, halos).
- **Distorted hand-drawn icons.**
- **One color** for all accords / all seasons.
- **Inaccurate/derived data** shown as if it were fact.

## Design journey (chronological — don't repeat the rejected ones)

1. **Light editorial** (built with the *Hallmark* skill). Warm paper, serif, restrained.
   → **Rejected**: "too boring," hard to read/scan, too light.
2. **Dark, colorful, family-immersive** (dark canvas, glowing family-tinted cards).
   → **Liked the direction**, but the cards were too busy and color felt heavy.
3. **Premium-restrained** (built with the *Impeccable* skill; Aesop/boutique — neutral cards,
   color as a whisper). → **Rejected**: "still not it."
4. **Elevated #2 (current/keeper)** — dark + colorful, but with real craft + accurate data:
   transparent bottles, weighted accord bars in **real accord colors**, season bars in **real
   season colors**, note-icon pyramid, lucide icons, hybrid two-bottle cards, bigger cards.

## Working style notes

- The user iterates fast and sends frequent, specific feedback and corrections mid-task.
- Provides real artifacts (Apify exports, image URLs, Fragrantica links) — use them.
- Wants reproducible, scripted solutions (so re-running is cheap), not one-off manual edits.
- Has **not** asked to commit or deploy yet — wait for explicit go before `git commit` / `vercel`.
