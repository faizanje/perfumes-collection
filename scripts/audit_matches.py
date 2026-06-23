#!/usr/bin/env python3
"""Deterministic match audit — NO LLM tokens.

For every perfume, show which original it was matched to, the match score, the
source (dataset/manual), and the top-3 alternative dataset candidates the matcher
considered. Lets a human eyeball "did we pick the right fragrance?" in chunks.

Outputs:
  data/build/review.csv   - open in a spreadsheet; sort/filter, flag wrong rows
Console: the most suspicious rows (low score, or chosen != best candidate).
"""
import csv
import json
from pathlib import Path

from enrich_from_dataset import (KAGGLE, normalize, core_tokens, score, BUILD)

ROOT = Path(__file__).resolve().parent.parent


def load_candidates():
    cands = []
    for r in csv.DictReader(open(KAGGLE, encoding="latin-1"), delimiter=";"):
        full = normalize(f"{r['Brand']} {r['Perfume']}")
        cands.append((full, core_tokens(full), f"{r['Brand']} {r['Perfume']}".replace("-", " ")))
    return cands


def top_candidates(name, cands, k=3):
    qn = normalize(name)
    qt = core_tokens(qn)
    scored = []
    for cn, ct, label in cands:
        s = score(qn, qt, cn, ct)
        scored.append((s, label))
    scored.sort(reverse=True)
    return scored[:k]


def main():
    raw = json.loads((BUILD / "raw_collection.json").read_text())
    originals = json.loads((BUILD / "originals.json").read_text())
    cands = load_candidates()

    rows = []
    for e in raw:
        kind = e.get("kind")
        slug = e.get("impressionOfSlug")
        o = originals.get(slug) if slug else None
        chosen = o["matchedName"] if o else (
            " + ".join(e.get("blendNames", [])) if kind == "hybrid" else "(house blend)")
        sc = o.get("matchScore") if o else None
        src = o.get("source") if o else kind
        conf = o.get("confidence") if o else "—"
        notes = ", ".join((o.get("topNotes") or [])[:4]) if o else ""

        # alternatives only worth computing for dataset/single matches that aren't clearly solid
        alts = ""
        impression = e.get("originalName") or e.get("impressionRaw") or ""
        suspicious = kind in ("single", "original") and (
            sc is None or sc < 0.82 or conf in ("medium", "low") or src == "manual")
        if suspicious and impression and not impression.startswith("—"):
            tc = top_candidates(impression, cands)
            alts = " | ".join(f"{lbl} ({s:.2f})" for s, lbl in tc)

        rows.append({
            "id": e["id"],
            "clone": e["cloneName"],
            "house": e["house"],
            "group": e["group"],
            "kind": kind,
            "impression_of (you wrote)": e.get("impressionRaw") or "",
            "matched_to (we used)": chosen,
            "score": f"{sc:.2f}" if isinstance(sc, (int, float)) else "",
            "source": src or "",
            "confidence": conf,
            "family": (o.get("family") if o else e_family(e, originals)) or "",
            "top_notes": notes,
            "alt_candidates (better match?)": alts,
            "VERDICT (you fill: ok / wrong→<correct name>)": "",
        })

    # sort: most suspicious first (manual + low score), then by score asc
    def rank(r):
        s = float(r["score"]) if r["score"] else -1
        bump = 0 if r["source"] == "manual" else 1
        return (bump, s)
    rows.sort(key=rank)

    out = BUILD / "review.csv"
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    flagged = [r for r in rows if r["source"] == "manual" or (r["score"] and float(r["score"]) < 0.74)]
    print(f"Wrote {out}  ({len(rows)} perfumes)")
    print(f"Most suspicious (manual or score < 0.74): {len(flagged)}\n")
    print(f"{'CLONE':22} {'IMPRESSION OF':30} {'MATCHED TO':32} {'SCORE':5} {'SRC'}")
    print("-" * 110)
    for r in rows[:34]:
        print(f"{r['clone'][:21]:22} {r['impression_of (you wrote)'][:29]:30} "
              f"{r['matched_to (we used)'][:31]:32} {r['score']:5} {r['source']}")


def e_family(e, originals):
    return ""


if __name__ == "__main__":
    main()
