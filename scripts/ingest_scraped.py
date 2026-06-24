#!/usr/bin/env python3
"""Ingest our own scraper's output (data/sources/fragrantica_scraped.json) into
data/build/originals.json — same accurate fields as the Apify ingest, keyed by slug.

Schema produced by scrape_fragrantica.mjs:
  { slug: { name, url, accords:[{name,pct}], notes:{top,middle,base},
            whenToWear:{winter,spring,summer,fall,day,night} } }
"""
import json
from pathlib import Path

from enrich_from_dataset import derive_family, derive_occasions, BUILD

ROOT = Path(__file__).resolve().parent.parent
SCRAPED = ROOT / "data" / "sources" / "fragrantica_scraped.json"


def season_strengths(w):
    if not w:
        return None
    s = {k: (w.get(k) or 0) for k in ("spring", "summer", "fall", "winter")}
    mx = max(s.values()) or 1
    out = [{"season": k, "strength": round(v / mx, 2)} for k, v in s.items()]
    out.sort(key=lambda x: -x["strength"])
    return out


def time_of_day(w):
    if not w:
        return None
    day, night = w.get("day") or 0, w.get("night") or 0
    if not day and not night:
        return None
    hi = max(day, night) or 1
    out = []
    if day / hi >= 0.6:
        out.append("Day")
    if night / hi >= 0.6:
        out.append("Night")
    return out or (["Day"] if day >= night else ["Night"])


def day_night(w):
    if not w:
        return None
    day, night = w.get("day") or 0, w.get("night") or 0
    hi = max(day, night) or 1
    if not day and not night:
        return None
    return {"day": round(day / hi, 2), "night": round(night / hi, 2)}


def main():
    if not SCRAPED.exists():
        print("No scraped file yet:", SCRAPED)
        return
    scraped = json.loads(SCRAPED.read_text())
    originals = json.loads((BUILD / "originals.json").read_text())

    updated = 0
    for slug, r in scraped.items():
        o = originals.get(slug)
        if not o or not r.get("ok"):
            continue
        accords = [a["name"] for a in (r.get("accords") or []) if a.get("name")]
        weights = {a["name"]: a["pct"] for a in (r.get("accords") or []) if a.get("name")}
        notes = r.get("notes") or {}
        w = r.get("whenToWear")
        seasons = season_strengths(w)
        if not accords and not notes.get("top"):
            continue
        o.update({
            "keyAccords": accords or o.get("keyAccords", []),
            "accordWeights": weights or o.get("accordWeights"),
            "topNotes": notes.get("top") or o.get("topNotes", []),
            "heartNotes": notes.get("middle") or o.get("heartNotes", []),
            "baseNotes": notes.get("base") or o.get("baseNotes", []),
            "family": derive_family(accords) if accords else o.get("family"),
            "seasons": seasons or o.get("seasons"),
            "timeOfDay": time_of_day(w) or o.get("timeOfDay"),
            "dayNight": day_night(w) or o.get("dayNight"),
            "occasions": derive_occasions(accords, o.get("sillage")) if accords else o.get("occasions"),
            "source": "fragrantica", "confidence": "high",
            "verified": True, "needsReview": False,
        })
        updated += 1

    (BUILD / "originals.json").write_text(json.dumps(originals, indent=2, ensure_ascii=False))
    print(f"Ingested {updated} originals from our own scraper.")


if __name__ == "__main__":
    main()
