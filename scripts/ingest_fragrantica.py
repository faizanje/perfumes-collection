#!/usr/bin/env python3
"""Ingest the Apify Fragrantica export → overwrite accords / notes / when-to-wear
with ACCURATE data, keyed by Fragrantica perfume id.

Reads:  data/sources/dataset_fragrantica_*.json  (Apify export)
Updates: data/build/originals.json  (in place; source='fragrantica', verified)
Then run build_app_data.py to regenerate the app data.
"""
import glob
import json
import re
from pathlib import Path

from enrich_from_dataset import derive_family, derive_occasions, BUILD

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"


def perfume_id(url):
    m = re.search(r"-(\d+)\.html", url or "")
    return int(m.group(1)) if m else None


def season_strengths(sb):
    """seasonBreakout counts -> [{season, strength}] normalized to the strongest season."""
    if not sb:
        return None
    seasons = {"spring": sb.get("spring", 0), "summer": sb.get("summer", 0),
               "fall": sb.get("autumn", sb.get("fall", 0)), "winter": sb.get("winter", 0)}
    mx = max(seasons.values()) or 1
    out = [{"season": s, "strength": round(v / mx, 2)} for s, v in seasons.items()]
    out.sort(key=lambda x: -x["strength"])
    return out


def time_of_day(sb):
    if not sb:
        return None
    day, night = sb.get("day", 0), sb.get("night", 0)
    if not day and not night:
        return None
    hi = max(day, night) or 1
    out = []
    if day / hi >= 0.6:
        out.append("Day")
    if night / hi >= 0.6:
        out.append("Night")
    return out or (["Day"] if day >= night else ["Night"])


def day_night(sb):
    if not sb:
        return None
    day, night = sb.get("day", 0), sb.get("night", 0)
    hi = max(day, night) or 1
    if not day and not night:
        return None
    return {"day": round(day / hi, 2), "night": round(night / hi, 2)}


def main():
    files = sorted(glob.glob(str(SOURCES / "dataset_fragrantica_*.json")))
    if not files:
        print("No Apify export found in data/sources/ (dataset_fragrantica_*.json)")
        return
    records = []
    for f in files:
        records += json.loads(Path(f).read_text())
    by_id = {int(r["id"]): r for r in records if str(r.get("id", "")).isdigit()}
    print(f"Loaded {len(records)} Apify records from {len(files)} file(s).")

    originals = json.loads((BUILD / "originals.json").read_text())
    updated = 0
    for slug, o in originals.items():
        pid = perfume_id(o.get("originalUrl"))
        rec = by_id.get(pid)
        if not rec:
            continue

        accords = [(a.get("accord") or "").strip().lower() for a in (rec.get("mainAccords") or [])]
        accords = [a for a in accords if a]
        weights = {(a.get("accord") or "").strip().lower(): round(a.get("value", 0), 1)
                   for a in (rec.get("mainAccords") or []) if a.get("accord")}

        pyr = rec.get("pyramid") or {}
        def names(key):
            return [n.get("name", "").strip() for n in (pyr.get(key) or []) if n.get("name")]
        top, mid, base = names("topNotes"), names("middleNotes"), names("baseNotes")
        # some pyramids are "unisex/linear": only a flat notes list under topNotes
        sb = rec.get("seasonBreakout")
        seasons = season_strengths(sb)

        o.update({
            "keyAccords": accords or o.get("keyAccords", []),
            "accordWeights": weights or None,
            "topNotes": top or o.get("topNotes", []),
            "heartNotes": mid or o.get("heartNotes", []),
            "baseNotes": base or o.get("baseNotes", []),
            "family": derive_family(accords) if accords else o.get("family"),
            "seasons": seasons or o.get("seasons"),
            "timeOfDay": time_of_day(sb) or o.get("timeOfDay"),
            "dayNight": day_night(sb) or o.get("dayNight"),
            "occasions": derive_occasions(accords, o.get("sillage")) if accords else o.get("occasions"),
            "rating": rec.get("perfumeRating") or o.get("rating"),
            "imageUrl": rec.get("primaryImageUrl") or o.get("imageUrl"),
            "gender": rec.get("gender") or o.get("gender"),
            "source": "fragrantica", "confidence": "high",
            "verified": True, "needsReview": False,
        })
        updated += 1

    (BUILD / "originals.json").write_text(json.dumps(originals, indent=2, ensure_ascii=False))
    print(f"Updated {updated} originals with accurate Fragrantica data.")
    print("Now run: python3 scripts/build_app_data.py")


if __name__ == "__main__":
    main()
