#!/usr/bin/env python3
"""Tier-3 enrichment: hand-curated overrides for originals the dataset matcher
missed or matched wrongly (bare-name Middle-Eastern originals, post-2020 niche,
Fragrance One 'Office for Men', LV exclusives, local Arabian houses).

For each entry I supply keyAccords (+ notes where known) from fragrance
knowledge; seasons / occasions / time-of-day / mood are DERIVED with the same
functions used for the dataset tier, so the data stays consistent.

confidence: "high"  -> well-known fragrance, profile is reliable
            "medium"-> known house, profile reasonable
            "low"   -> obscure local blend, best-effort guess (needsReview)

Merges on top of data/build/originals.json (manual wins) and rewrites it.
"""
import json
from pathlib import Path

from enrich_from_dataset import (derive_family, derive_seasons, derive_occasions,
                                 derive_time, derive_mood)

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "data" / "build"


def E(name, brand, accords, top=None, heart=None, base=None, conf="medium",
      family=None, gender="men", year=None, review=False):
    return {"name": name, "brand": brand, "keyAccords": accords,
            "top": top or [], "heart": heart or [], "base": base or [],
            "confidence": conf, "family": family, "gender": gender,
            "year": year, "needsReview": review}


# Office for Men by Fragrance One (Jeremy Fragrance) — shared by all variants.
OFM = E("Office for Men", "Fragrance One",
        ["aromatic", "fresh", "citrus", "musky", "marine"],
        top=["Bergamot", "Grapefruit", "Sea Notes"],
        heart=["Lavender", "Geranium", "Ginger"],
        base=["White Musk", "Ambroxan", "Cedar"], conf="high",
        family="Aromatic / Fresh")

# 9pm by Afnan family — amber / vanilla / cinnamon.
NINE_PM = E("9pm", "Afnan", ["amber", "sweet", "warm spicy", "vanilla"],
            top=["Apple", "Bergamot", "Cinnamon"],
            heart=["Lavender", "Orange Blossom"],
            base=["Vanilla", "Tonka Bean", "Amberwood"], conf="high",
            family="Amber / Oriental")

# Khamrah by Lattafa family — sweet spicy gourmand.
KHAMRAH = E("Khamrah", "Lattafa", ["sweet", "warm spicy", "vanilla", "gourmand"],
            top=["Cinnamon", "Nutmeg", "Bergamot"],
            heart=["Praline", "Dates", "Tuberose"],
            base=["Vanilla", "Tonka Bean", "Myrrh", "Benzoin"], conf="high",
            family="Gourmand / Sweet")

MANUAL = {
    # ---- Fragrance One "Office for Men" + all tweaks/formulations ----
    "office-for-men": OFM,
    "office-for-men-tweaked": OFM,
    "office-for-men-first-formulation": OFM,
    "office-for-men-first-formulation-tweaked": OFM,
    "fragrance-one-office-for-men": OFM,
    "fragrance-one-office-for-men-tweaked": OFM,

    # ---- designer / niche the dataset lacked ----
    "issey-miyake-le-sel-dissey": E(
        "Le Sel d'Issey", "Issey Miyake", ["aromatic", "woody", "salty", "fresh spicy"],
        top=["Bergamot", "Pink Pepper"], heart=["Sage", "Clary Sage"],
        base=["Vetiver", "Musk", "Mineral Notes"], conf="high", family="Aromatic / Fresh"),
    "lv-symphony": E("Symphony", "Louis Vuitton", ["citrus", "woody", "floral", "aromatic"],
        top=["Bergamot", "Mandarin", "Blackcurrant"], heart=["Iris", "Orange Blossom"],
        base=["Ambrette", "Woods"], conf="high", family="Fresh / Citrus", gender="unisex"),
    "lv-stellar-times": E("Stellar Times", "Louis Vuitton", ["aromatic", "fresh", "woody", "green"],
        top=["Blackcurrant", "Mint", "Bergamot"], heart=["Cypress", "Iris"],
        base=["Woods", "Musk"], conf="high", family="Aromatic / Fresh", gender="unisex"),
    "louis-vuitton-rain-tea": E("Rain Tea", "Louis Vuitton", ["fresh", "green", "citrus", "aromatic"],
        top=["Bergamot", "Green Tea"], heart=["Tea Notes", "Jasmine"],
        base=["Musk", "Woods"], conf="medium", family="Fresh / Citrus", gender="unisex"),
    "ysl-myself": E("MYSLF", "Yves Saint Laurent", ["floral", "woody", "musky", "aromatic"],
        top=["Orange Blossom", "Bergamot"], heart=["Orange Blossom", "Patchouli"],
        base=["Woody Notes", "Ambrette", "Musk"], conf="high", family="Floral"),
    "ysl-y-ice-cologne": E("Y Ice Cologne", "Yves Saint Laurent", ["aromatic", "fresh", "citrus", "woody"],
        top=["Bergamot", "Aldehydes", "Ginger"], heart=["Sage", "Geranium"],
        base=["Ambergris", "Cedar"], conf="high", family="Aromatic / Fresh"),
    "le-labo-mousse-de-chene-30-amsterdam": E(
        "Mousse de Chêne 30 (Amsterdam)", "Le Labo", ["woody", "mossy", "green", "earthy"],
        top=["Oakmoss", "Bergamot"], heart=["Vetiver", "Patchouli"],
        base=["Oakmoss", "Cedar", "Musk"], conf="medium", family="Woody", gender="unisex"),
    "initio-side-effect": E("Side Effect", "Initio Parfums Prives",
        ["warm spicy", "sweet", "vanilla", "amber", "tobacco"],
        top=["Cinnamon", "Rum"], heart=["Tobacco", "Saffron", "Jasmine"],
        base=["Vanilla", "Sandalwood", "Amber"], conf="high", family="Amber / Oriental", gender="unisex"),
    "amouage-d-cision": E("Decision", "Amouage", ["aromatic", "warm spicy", "woody", "leather"],
        top=["Bergamot", "Pink Pepper", "Cardamom"], heart=["Geranium", "Incense"],
        base=["Leather", "Cedar", "Amber"], conf="medium", family="Aromatic / Fresh"),
    "amouage-outlands": E("Outlands", "Amouage", ["aromatic", "woody", "warm spicy", "green"],
        top=["Cardamom", "Juniper", "Bergamot"], heart=["Geranium", "Sage"],
        base=["Leather", "Cedar", "Vetiver"], conf="medium", family="Aromatic / Fresh"),
    "arabian-oud-al-farid": E("Al Farid", "Arabian Oud", ["oud", "rose", "warm spicy", "woody"],
        top=["Saffron", "Rose"], heart=["Oud", "Rose"], base=["Agarwood", "Musk", "Amber"],
        conf="medium", family="Oud / Animalic", gender="unisex"),
    "ajmal-amberwood": E("Amber Wood", "Ajmal", ["amber", "woody", "warm spicy"],
        top=["Saffron", "Raspberry"], heart=["Cedar", "Oud"], base=["Amber", "Musk"],
        conf="medium", family="Amber / Oriental", gender="unisex"),
    "maison-margiela-replica-french-riviera": E(
        "Replica French Riviera", "Maison Margiela", ["fresh", "aquatic", "white floral", "musky"],
        top=["Bergamot", "Coconut Water"], heart=["Neroli", "Orange Blossom"],
        base=["Musk", "Cedar", "Salty Notes"], conf="high", family="Fresh / Citrus", gender="unisex"),
    "wu-long-cha": E("Wulong Cha", "Nishane", ["woody", "tobacco", "fruity", "aromatic"],
        top=["Bergamot", "Tea"], heart=["Tobacco", "Osmanthus"], base=["Woods", "Tonka"],
        conf="medium", family="Woody", gender="unisex"),
    "jo-malone-cypress-and-grapevine": E(
        "Cypress & Grapevine", "Jo Malone", ["woody", "green", "aromatic", "fresh"],
        top=["Grape Leaf", "Bergamot"], heart=["Cypress", "Sage"], base=["Vetiver", "Cedar"],
        conf="medium", family="Woody", gender="unisex"),
    "imperial-valley-by-gissah": E("Imperial Valley", "Gissah", ["sweet", "amber", "fruity", "woody"],
        top=["Pineapple", "Bergamot"], heart=["Rose", "Amber"], base=["Oud", "Vanilla", "Musk"],
        conf="medium", family="Amber / Oriental", gender="unisex"),
    "brazilian-tobacco": E("Brazilian Tobacco", "Niche", ["tobacco", "sweet", "woody", "warm spicy"],
        top=["Tobacco", "Bergamot"], heart=["Cinnamon", "Tonka"], base=["Vanilla", "Woods"],
        conf="low", family="Leather / Smoky", review=True),
    "play-it-cool-by-cr7": E("Play It Cool", "CR7", ["aromatic", "fresh", "aquatic", "citrus"],
        top=["Bergamot", "Mint"], heart=["Lavender", "Sage"], base=["Musk", "Cedar"],
        conf="medium", family="Aromatic / Fresh"),
    "royal-musk-by-bonanza": E("Royal Musk", "Bonanza Satrangi", ["musky", "sweet", "powdery", "amber"],
        top=["Aldehydes"], heart=["White Musk", "Rose"], base=["Amber", "Vanilla"],
        conf="low", family="Amber / Oriental", gender="unisex", review=True),
    "9-00-pm-rebel": E("9PM Rebel", "Afnan", ["amber", "sweet", "warm spicy", "woody"],
        top=["Pineapple", "Bergamot"], heart=["Cinnamon", "Lavender"], base=["Amber", "Vanilla", "Tonka"],
        conf="medium", family="Amber / Oriental"),

    # ---- obscure local / Arabian houses: best-effort, flagged for review ----
    "tk-no-4": E("No. 4", "Local House", ["fresh", "citrus", "aromatic"], conf="low",
        family="Fresh / Citrus", review=True),
    "edt": E("Unknown (EDT)", "Local House", ["aromatic", "fresh"], conf="low",
        family="Aromatic / Fresh", review=True),
    "pdm-castley": E("Castley", "Parfums de Marly", ["fruity", "woody", "sweet"],
        conf="low", family="Fruity", review=True),
    "reef-33": E("Reef 33", "Niche", ["woody", "amber", "warm spicy"], conf="low",
        family="Woody", gender="unisex", review=True),
    "wave-child-room-1015": E("Wave Child", "Room 1015", ["fruity", "musky", "aromatic", "fresh"],
        conf="low", family="Fruity", gender="unisex", review=True),
    "maison-the-spirit-of-dubai": E("The Spirit of Dubai", "The Spirit of Dubai",
        ["oud", "amber", "woody", "warm spicy"], conf="low", family="Oud / Animalic",
        gender="unisex", review=True),
    "kharamana-al-haitham": E("Kharamana (Al Haitham)", "Al Haitham",
        ["oud", "amber", "woody", "warm spicy"], conf="low", family="Oud / Animalic",
        gender="unisex", review=True),
    "oud-al-barouz-asrar": E("Asrar", "Oud Al Barouz", ["oud", "amber", "woody", "rose"],
        conf="low", family="Oud / Animalic", gender="unisex", review=True),
    "oman-luxury-caden": E("Caden", "Oman Luxury", ["amber", "woody", "warm spicy", "sweet"],
        conf="low", family="Amber / Oriental", gender="unisex", review=True),
    "arome-king-opus-original": E("King Opus", "Arome", ["amber", "woody", "oud", "warm spicy"],
        conf="low", family="Amber / Oriental", review=True),
    "original-blend-coffee-notes": E("Coffee Blend", "House Original",
        ["coffee", "sweet", "warm spicy", "amber"], conf="low", family="Gourmand / Sweet", review=True),
    "spongebob-squarepants": E("SpongeBob (Novelty)", "Novelty", ["fruity", "sweet", "citrus"],
        conf="low", family="Fruity", gender="unisex", review=True),
    "hugo-boss-x-superman": E("Hugo x Superman", "Hugo Boss", ["aromatic", "fresh", "citrus", "woody"],
        conf="low", family="Aromatic / Fresh", review=True),

    # ---- Middle-Eastern originals: corrected / filled (override wrong matches) ----
    "khamra-kahwa": dict(KHAMRAH, name="Khamrah Kahwa", keyAccords=["sweet", "coffee", "warm spicy", "vanilla"],
        heart=["Coffee", "Praline", "Dates"]),
    "lattafa-khamra-dukhan": dict(KHAMRAH, name="Khamrah Dukhan", keyAccords=["smoky", "sweet", "warm spicy", "vanilla"],
        heart=["Incense", "Praline", "Dates"], family="Leather / Smoky"),
    "simple-9pm": NINE_PM,
    "9pm-elixir": E("9PM Elixir", "Afnan", ["amber", "sweet", "warm spicy", "vanilla", "woody"],
        top=["Cinnamon", "Apple", "Cardamom"], heart=["Orange Blossom", "Lavender"],
        base=["Vanilla", "Amberwood", "Tonka Bean", "Oud"], conf="medium",
        family="Amber / Oriental"),
    "supremacy-collector-edition": E("Supremacy Collector's Edition", "Afnan",
        ["aromatic", "fruity", "fresh", "citrus"], top=["Bergamot", "Pineapple"],
        heart=["Lavender", "Birch"], base=["Musk", "Ambergris", "Oakmoss"], conf="medium",
        family="Aromatic / Fresh"),
    "turathi-electric": E("Turathi Electric", "Afnan", ["fruity", "sweet", "aromatic", "fresh"],
        top=["Pineapple", "Bergamot"], heart=["Lavender", "Apple"], base=["Vanilla", "Amber", "Musk"],
        conf="medium", family="Fruity"),
    "urban-man-elixir": E("Urban Man Elixir", "Armaf", ["amber", "warm spicy", "sweet", "woody"],
        top=["Apple", "Cinnamon"], heart=["Lavender", "Orange Blossom"], base=["Amber", "Vanilla", "Tonka"],
        conf="medium", family="Amber / Oriental"),
    "milestone": E("Club de Nuit Milestone", "Armaf", ["fruity", "musky", "aromatic", "fresh"],
        top=["Pineapple", "Bergamot", "Apple"], heart=["Rose", "Jasmine", "Birch"],
        base=["Musk", "Vanilla", "Ambergris"], conf="medium", family="Fruity"),
    "blue": E("Blue", "Arabian House", ["aromatic", "fresh", "citrus", "woody"], conf="low",
        family="Aromatic / Fresh", review=True),
    "kaaf": E("Kaaf", "Lattafa", ["oud", "sweet", "amber", "woody"], conf="low",
        family="Oud / Animalic", gender="unisex", review=True),
    "marj": E("Marj", "Ahmed Al Maghribi", ["rose", "oud", "woody", "amber"], conf="low",
        family="Oud / Animalic", gender="unisex", review=True),
    "mani": E("Mani", "Arabian House", ["amber", "woody", "sweet"], conf="low",
        family="Amber / Oriental", gender="unisex", review=True),
    "victorioso": E("Victorioso", "Maison Alhambra", ["aquatic", "sweet", "fruity", "aromatic"],
        top=["Grapefruit", "Sea Notes", "Apple"], heart=["Jasmine", "Bay Leaf"],
        base=["Guaiac Wood", "Amber", "Patchouli"], conf="medium", family="Fresh / Citrus"),
    "monocline-05": E("Monocline 05", "Niche", ["woody", "aromatic", "amber"], conf="low",
        family="Woody", gender="unisex", review=True),
    "hawas-black": E("Hawas Black", "Rasasi", ["aquatic", "woody", "warm spicy", "aromatic"],
        top=["Apple", "Bergamot", "Cinnamon"], heart=["Sea Notes", "Lavender", "Cardamom"],
        base=["Amber", "Musk", "Driftwood"], conf="medium", family="Fresh / Citrus"),
    "shuhral-elixir": E("Shuhral Elixir", "Arabian House", ["oud", "amber", "sweet", "woody"],
        conf="low", family="Oud / Animalic", gender="unisex", review=True),
    "ocean-rush": E("Ocean Rush", "Maison Asrar", ["aquatic", "fresh", "citrus", "aromatic"],
        top=["Sea Notes", "Bergamot", "Mint"], heart=["Lavender", "Geranium"], base=["Musk", "Amber"],
        conf="low", family="Fresh / Citrus", review=True),
    "euphoric-oud": E("Euphoric Oud", "Arabian House", ["oud", "sweet", "amber", "woody"],
        conf="low", family="Oud / Animalic", gender="unisex", review=True),
    "addicted": E("Addicted", "Maison Alhambra", ["sweet", "amber", "warm spicy", "woody"],
        conf="low", family="Amber / Oriental", gender="unisex", review=True),
    "splendor": E("Splendor", "Arabian House", ["amber", "sweet", "woody"], conf="low",
        family="Amber / Oriental", gender="unisex", review=True),
    "crown": E("Crown", "Arabian House", ["oud", "amber", "woody", "warm spicy"], conf="low",
        family="Oud / Animalic", gender="unisex", review=True),
    "qissah-emperor-valley": E("Qissah Emperor Valley", "Arabian House",
        ["oud", "amber", "rose", "woody"], conf="low", family="Oud / Animalic",
        gender="unisex", review=True),
    "ahmed-al-maghrabi-marj": E("Marj", "Ahmed Al Maghribi", ["rose", "oud", "woody", "amber"],
        conf="low", family="Oud / Animalic", gender="unisex", review=True),
    "btv-emaan": E("Emaan", "BTV", ["sweet", "floral", "amber", "powdery"], conf="low",
        family="Floral", gender="unisex", review=True),
}


def build(slug, m):
    accords = [a.lower() for a in m["keyAccords"]]
    family = m.get("family") or derive_family(accords)
    return {
        "slug": slug, "name": m["name"], "matchedName": f"{m['brand']} {m['name']}",
        "brand": m["brand"], "year": m.get("year"), "gender": m.get("gender"),
        "rating": None, "family": family, "keyAccords": accords,
        "topNotes": m["top"], "heartNotes": m["heart"], "baseNotes": m["base"],
        "seasons": derive_seasons(accords), "occasions": derive_occasions(accords, None),
        "timeOfDay": derive_time(accords), "longevity": None, "sillage": None,
        "mood": derive_mood(accords), "confidence": m["confidence"],
        "verified": False, "needsReview": m.get("needsReview", False),
        "source": "manual", "matchScore": None,
    }


def main():
    originals = json.loads((BUILD / "originals.json").read_text())
    added = overridden = 0
    for slug, m in MANUAL.items():
        if slug in originals:
            overridden += 1
        else:
            added += 1
        originals[slug] = build(slug, m)
    (BUILD / "originals.json").write_text(json.dumps(originals, indent=2, ensure_ascii=False))

    rows = json.loads((BUILD / "raw_collection.json").read_text())
    needed = set()
    for r in rows:
        if r.get("impressionOfSlug"):
            needed.add(r["impressionOfSlug"])
        for b in r.get("blendOf", []):
            needed.add(b)
    missing = sorted(needed - set(originals))
    low = [s for s, o in originals.items() if o.get("needsReview")]
    print(f"Manual entries: added {added}, overrode {overridden}")
    print(f"Total enriched originals: {len(originals)}")
    print(f"Still missing (clones with no original profile): {len(missing)}")
    for s in missing:
        print("   -", s)
    print(f"\nFlagged needsReview (low confidence, user to confirm): {len(low)}")


if __name__ == "__main__":
    main()
