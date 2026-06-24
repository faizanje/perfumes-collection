#!/usr/bin/env python3
"""Join the 313 collection entries to their enriched originals and emit
app-ready JSON the frontend imports directly.

  data/generated/collection.json - 313 perfumes, each with a resolved `profile`
  data/generated/originals.json  - 221 canonical originals (for detail lookups)
  data/generated/facets.json     - filter facets + counts

Resolution rules:
  single / original -> originals[impressionOfSlug]
  hybrid            -> merge accords + notes of the two parents
  own               -> derive from the parenthetical hint (green / fresh / coffee)
"""
import json
import re
from pathlib import Path
from collections import Counter

from enrich_from_dataset import (derive_family, derive_seasons, derive_occasions,
                                 derive_time, derive_mood)

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "data" / "build"
OUT = ROOT / "data" / "generated"
PUBLIC_IMG = ROOT / "public" / "img"
OUT.mkdir(parents=True, exist_ok=True)


def local_image(orig):
    """Bottle image — hotlink Fragrantica's own **transparent** dark-mode webp
    (`dark-375x500.<id>.webp`): a bottle on a transparent background that works on any
    surface. No downloading/processing/storage, no artifacts, consistent 375x500 sizing.
    A manual clone-house image by slug wins for the ~21 not on Fragrantica."""
    slug = orig.get("slug")
    if slug and (PUBLIC_IMG / f"m-{slug}.png").exists():
        return f"/img/m-{slug}.png"
    m = re.search(r"-(\d+)\.html", orig.get("originalUrl") or "")
    if m:
        return f"https://fimgs.net/mdimg/perfume-thumbs/dark-375x500.{m.group(1)}.webp"
    return orig.get("imageUrl")

OWN_HINTS = {
    "green": (["aromatic", "green", "woody", "fresh"], "Aromatic / Fresh",
              ["Galbanum", "Basil"], ["Violet Leaf", "Geranium"], ["Vetiver", "Moss"]),
    "fresh": (["fresh", "citrus", "aquatic", "aromatic", "musky"], "Fresh / Citrus",
              ["Bergamot", "Lemon", "Sea Notes"], ["Lavender", "Geranium"], ["White Musk", "Cedar"]),
    "coffee": (["coffee", "sweet", "warm spicy", "amber"], "Gourmand / Sweet",
               ["Coffee", "Bergamot"], ["Cardamom", "Praline"], ["Vanilla", "Tonka Bean"]),
}


def merge_profiles(a, b, name):
    """Blend two originals into a hybrid profile."""
    seen, accords = set(), []
    for src in (a, b):
        for ac in src["keyAccords"]:
            if ac not in seen:
                seen.add(ac)
                accords.append(ac)
    accords = accords[:6]

    def merge_notes(key):
        out, s = [], set()
        for src in (a, b):
            for n in src[key]:
                nl = n.lower()
                if nl not in s:
                    s.add(nl)
                    out.append(n)
        return out[:8]

    return {
        "family": derive_family(accords), "keyAccords": accords,
        "topNotes": merge_notes("topNotes"), "heartNotes": merge_notes("heartNotes"),
        "baseNotes": merge_notes("baseNotes"), "seasons": derive_seasons(accords),
        "occasions": derive_occasions(accords, None), "timeOfDay": derive_time(accords),
        "longevity": None, "sillage": None,
        "mood": f"A hybrid blend of {a['name']} and {b['name']}.",
        "confidence": "medium", "verified": False, "needsReview": False,
        "isBlend": True, "parents": [a["name"], b["name"]],
        "parentImages": [img for img in (local_image(a), local_image(b)) if img],
        "parentLinks": [{"name": p["name"], "url": p.get("originalUrl")} for p in (a, b)],
    }


def own_profile(impression_raw):
    hint = "fresh"
    m = re.search(r"\((.*?)\)", impression_raw or "")
    body = (m.group(1) if m else impression_raw or "").lower()
    for key in OWN_HINTS:
        if key in body:
            hint = key
            break
    if "office for men" in body:
        accords = ["aromatic", "fresh", "citrus", "musky", "marine"]
        fam, top, heart, base = ("Aromatic / Fresh", ["Bergamot", "Grapefruit"],
                                 ["Lavender", "Geranium"], ["White Musk", "Ambroxan"])
    else:
        accords, fam, top, heart, base = OWN_HINTS[hint]
    return {
        "family": fam, "keyAccords": accords, "topNotes": top, "heartNotes": heart,
        "baseNotes": base, "seasons": derive_seasons(accords),
        "occasions": derive_occasions(accords, None), "timeOfDay": derive_time(accords),
        "longevity": None, "sillage": None, "mood": derive_mood(accords),
        "confidence": "low", "verified": False, "needsReview": True,
        "isHouseOriginal": True,
    }


PROFILE_FIELDS = ["family", "keyAccords", "topNotes", "heartNotes", "baseNotes",
                  "seasons", "occasions", "timeOfDay", "dayNight", "longevity", "sillage",
                  "mood", "confidence", "needsReview"]


def slim(orig):
    p = {k: orig.get(k) for k in PROFILE_FIELDS}
    p["originalName"] = orig.get("matchedName")
    p["originalBrand"] = orig.get("brand")
    p["year"] = orig.get("year")
    p["gender"] = orig.get("gender")
    p["rating"] = orig.get("rating")
    p["imageUrl"] = local_image(orig)
    p["originalUrl"] = orig.get("originalUrl")
    p["accordWeights"] = orig.get("accordWeights")
    p["source"] = orig.get("source")
    return p


def main():
    rows = json.loads((BUILD / "raw_collection.json").read_text())
    originals = json.loads((BUILD / "originals.json").read_text())

    collection = []
    for r in rows:
        kind = r.get("kind")
        profile = None
        if kind == "hybrid":
            parents = [originals.get(s) for s in r.get("blendOf", [])]
            parents = [p for p in parents if p]
            if len(parents) == 2:
                profile = merge_profiles(parents[0], parents[1], r["cloneName"])
            elif len(parents) == 1:
                profile = slim(parents[0])
        elif kind == "own":
            profile = own_profile(r.get("impressionRaw"))
        else:  # single / original
            o = originals.get(r.get("impressionOfSlug"))
            if o:
                profile = slim(o)

        if profile is None:  # safety net
            profile = own_profile("fresh")

        collection.append({
            "id": r["id"], "cloneName": r["cloneName"], "house": r["house"],
            "group": r["group"], "kind": kind, "isOriginal": r["isOriginal"],
            "impressionOf": r.get("originalName") or (
                " + ".join(r.get("blendNames", [])) if kind == "hybrid" else None),
            "impressionRaw": r.get("impressionRaw"),
            "profile": profile,
        })

    # ---- facets ----
    fam = Counter(c["profile"]["family"] for c in collection)
    house = Counter(c["house"] for c in collection)
    group = [g for g in dict.fromkeys(c["group"] for c in collection)]
    season = Counter(s["season"] for c in collection for s in c["profile"]["seasons"]
                     if s["strength"] >= 0.6)
    occ = Counter(o for c in collection for o in c["profile"]["occasions"])
    facets = {
        "total": len(collection),
        "families": fam.most_common(),
        "houses": house.most_common(),
        "groups": group,
        "seasons": season.most_common(),
        "occasions": occ.most_common(),
    }

    (OUT / "collection.json").write_text(json.dumps(collection, ensure_ascii=False, indent=2))
    (OUT / "originals.json").write_text(json.dumps(originals, ensure_ascii=False, indent=2))
    (OUT / "facets.json").write_text(json.dumps(facets, ensure_ascii=False, indent=2))

    print(f"collection: {len(collection)} perfumes")
    print(f"families: {dict(fam)}")
    print(f"houses: {len(house)}  groups: {len(group)}")
    print(f"seasons(strong): {dict(season)}")
    print(f"occasions: {dict(occ)}")
    nr = sum(1 for c in collection if c['profile'].get('needsReview'))
    print(f"needsReview perfumes: {nr}")


if __name__ == "__main__":
    main()
