#!/usr/bin/env python3
"""Tier-1 enrichment: fuzzy-match the 194 unique originals against bulk
Fragrantica datasets and derive family / season / occasion / mood offline.

PRIMARY  dataset (notes, accords, rating, year, gender):
  Kaggle "fra_cleaned.csv" (24,063 rows, ';'-delimited, latin-1)
  cols: url;Perfume;Brand;Country;Gender;Rating Value;Rating Count;Year;
        Top;Middle;Base;Perfumer1;Perfumer2;mainaccord1..5
SECONDARY dataset (longevity + sillage vote distributions):
  andrewhryn/DA_Fragrance_Analysis frag_dataset.csv (37,925 rows)

Outputs:
  data/build/originals.json        - enriched canonical originals
  data/build/coverage_report.json  - matched + unmatched diagnostics
"""
import csv
import json
import re
import sys
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
BUILD = ROOT / "data" / "build"
KAGGLE = SOURCES / "fra_cleaned.csv"
GH = SOURCES / "frag_dataset.csv"

# ---------------------------------------------------------------- normalize
BRAND_ALIASES = {
    r"\bpdm\b": "parfums de marly", r"\blv\b": "louis vuitton",
    r"\bjpg\b": "jean paul gaultier", r"\bysl\b": "yves saint laurent",
    r"\bd&g\b": "dolce gabbana", r"\bd ?& ?g\b": "dolce gabbana",
    r"\bmfk\b": "maison francis kurkdjian", r"\bbr ?540\b": "baccarat rouge 540",
    r"\btf\b": "tom ford", r"\ba&f\b": "abercrombie fitch",
    r"\bbdc\b": "bleu de chanel", r"\bck\b": "calvin klein",
    r"\bbdk\b": "bdk parfums", r"\bbtv\b": "boadicea the victorious",
    r"\bmab\b": "marc antoine barrois", r"\btsod\b": "the spirit of dubai",
    r"\bkillian\b": "kilian",
}
QUALIFIERS = re.compile(
    r"\b(edt|edp|edc|eau de toilette|eau de parfum|eau de cologne|parfum|extrait|"
    r"intense|cologne|elixir|le parfum|pour homme|pour femme|for men|for women|"
    r"for him|for her|limited edition|first formulation|discontinued|tweaked|"
    r"smoky|fruity|new|edition)\b", re.I)
# Pure connectors only. "homme/men/femme" are deliberately NOT here — for a
# product like Prada "L'Homme" they ARE the identity. Phrase-level noise such as
# "pour homme" / "for men" is stripped by the QUALIFIERS regex instead.
STOPWORDS = {"de", "di", "du", "da", "la", "le", "les", "des", "the", "of", "by",
             "pour", "eau", "and", "el", "al", "von", "para", "a", "an"}


def strip_accents(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s)
                   if not unicodedata.combining(c))


def normalize(s):
    s = strip_accents(s or "").lower()
    s = re.sub(r"\(.*?\)", " ", s)
    for pat, repl in BRAND_ALIASES.items():
        s = re.sub(pat, repl, s)
    s = s.replace("'", " ").replace("’", " ").replace("`", " ")  # split L'Homme -> l homme
    s = re.sub(r"[.,]", "", s)
    s = re.sub(r"[^a-z0-9& ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def core_tokens(s):
    s2 = QUALIFIERS.sub(" ", s)
    return set(t for t in s2.split() if len(t) > 1 and t not in STOPWORDS)


def score(qn, qt, cn, ct):
    seq = SequenceMatcher(None, qn, cn).ratio()
    if qt and ct:
        inter = len(qt & ct)
        jac = inter / len(qt | ct)
        contained = inter / len(qt)
        extra = len(ct - qt)  # candidate tokens not requested
    else:
        jac = contained = 0
        extra = len(ct)
    base = 0.20 * seq + 0.30 * jac + 0.50 * contained
    return base - min(0.08, 0.02 * extra)  # prefer the tightest candidate


# ---------------------------------------------------------- derivation maps
FAMILY_RULES = [
    ("Oud / Animalic", {"oud", "animalic"}),
    ("Leather / Smoky", {"leather", "smoky", "tobacco"}),
    ("Amber / Oriental", {"amber", "warm spicy", "oriental", "balsamic"}),
    ("Gourmand / Sweet", {"sweet", "vanilla", "gourmand", "caramel", "chocolate",
                          "honey", "cacao", "almond", "coffee"}),
    ("Floral", {"floral", "white floral", "yellow floral", "rose", "violet",
                "tuberose", "iris", "powdery"}),
    ("Fruity", {"fruity", "tropical"}),
    ("Woody", {"woody", "mossy", "earthy"}),
    ("Aromatic / Fresh", {"aromatic", "fougere", "green", "herbal", "lavender",
                          "fresh spicy", "conifer", "camphor"}),
    ("Fresh / Citrus", {"citrus", "fresh", "aquatic", "marine", "ozonic", "sour",
                        "salty", "mineral"}),
]
SEASON_WEIGHTS = {
    "citrus": {"summer": 3, "spring": 2}, "fresh": {"summer": 3, "spring": 2},
    "aquatic": {"summer": 3, "spring": 1}, "marine": {"summer": 3}, "salty": {"summer": 2},
    "ozonic": {"summer": 2, "spring": 1}, "mineral": {"summer": 2},
    "green": {"spring": 3, "summer": 2}, "conifer": {"winter": 2, "fall": 1},
    "aromatic": {"spring": 2, "summer": 2, "fall": 1}, "fougere": {"spring": 2, "fall": 1},
    "lavender": {"spring": 2, "summer": 1}, "herbal": {"spring": 2, "summer": 1},
    "fruity": {"spring": 2, "summer": 2}, "tropical": {"summer": 3},
    "floral": {"spring": 3, "summer": 1}, "white floral": {"spring": 2, "summer": 2},
    "yellow floral": {"spring": 2, "summer": 1},
    "rose": {"spring": 2, "fall": 1}, "powdery": {"fall": 1, "winter": 1},
    "violet": {"spring": 1, "winter": 1}, "iris": {"fall": 1, "winter": 1},
    "woody": {"fall": 3, "winter": 2}, "mossy": {"fall": 2}, "earthy": {"fall": 2},
    "fresh spicy": {"fall": 2, "spring": 1}, "warm spicy": {"winter": 3, "fall": 2},
    "leather": {"fall": 2, "winter": 2}, "tobacco": {"winter": 2, "fall": 2},
    "smoky": {"winter": 2, "fall": 1}, "amber": {"winter": 3, "fall": 1},
    "oriental": {"winter": 3, "fall": 1}, "balsamic": {"winter": 2, "fall": 1},
    "sweet": {"winter": 2, "fall": 2}, "vanilla": {"winter": 3, "fall": 1},
    "gourmand": {"winter": 3, "fall": 1}, "caramel": {"winter": 2}, "chocolate": {"winter": 2},
    "coffee": {"winter": 2, "fall": 1}, "honey": {"winter": 2, "fall": 1},
    "oud": {"winter": 3, "fall": 2}, "animalic": {"winter": 2},
    "almond": {"winter": 2, "fall": 1}, "cacao": {"winter": 2},
}
OCC_EVENING = {"amber", "oud", "leather", "smoky", "tobacco", "sweet", "vanilla",
               "gourmand", "warm spicy", "oriental", "animalic", "honey", "coffee"}
OCC_FRESH = {"citrus", "fresh", "aquatic", "marine", "ozonic", "green", "aromatic",
             "fougere", "lavender", "salty", "mineral"}
LONGEVITY_LABELS = ["very weak", "weak", "moderate", "long lasting", "eternal"]
SILLAGE_LABELS = ["intimate", "moderate", "strong", "enormous"]
ADJ = {"fruity": "fruity", "sweet": "sweet", "leather": "leathery", "woody": "woody",
       "smoky": "smoky", "citrus": "citrusy", "fresh": "fresh", "aquatic": "aquatic",
       "amber": "ambery", "warm spicy": "spicy", "vanilla": "vanillic", "floral": "floral",
       "aromatic": "aromatic", "green": "green", "oud": "oud-rich", "powdery": "powdery",
       "gourmand": "gourmand", "marine": "marine", "tobacco": "tobacco-laced",
       "fougere": "fougere", "lavender": "lavender", "fresh spicy": "fresh-spicy",
       "white floral": "white-floral", "iris": "iris-driven", "mossy": "mossy"}


def weighted_label(votes, labels):
    try:
        nums = [float(x) for x in votes]
    except (TypeError, ValueError):
        return None
    if not nums or sum(nums) == 0 or len(nums) != len(labels):
        return None
    idx = sum(i * n for i, n in enumerate(nums)) / sum(nums)
    return labels[round(idx)]


def derive_family(accords):
    for fam, keys in FAMILY_RULES:
        if accords and accords[0] in keys:
            return fam
    for fam, keys in FAMILY_RULES:
        if any(a in keys for a in accords):
            return fam
    return "Woody" if accords else "Unclassified"


def derive_seasons(accords):
    scores = {"spring": 0.0, "summer": 0.0, "fall": 0.0, "winter": 0.0}
    for i, a in enumerate(accords):
        w = SEASON_WEIGHTS.get(a)
        if not w:
            continue
        weight = 1.0 if i < 3 else 0.6
        for s, v in w.items():
            scores[s] += v * weight
    mx = max(scores.values()) or 1
    out = [{"season": s, "strength": round(v / mx, 2)}
           for s, v in scores.items() if v / mx >= 0.4]
    out.sort(key=lambda x: -x["strength"])
    return out or [{"season": "spring", "strength": 1.0}, {"season": "fall", "strength": 1.0}]


def derive_occasions(accords, sillage_label):
    a = set(accords)
    occ = set()
    fresh, evening = len(a & OCC_FRESH), len(a & OCC_EVENING)
    if fresh:
        occ |= {"Daily", "Office", "Casual"}
    if evening:
        occ |= {"Evening", "Date night"}
    if evening >= 2 or sillage_label in ("strong", "enormous"):
        occ |= {"Night out", "Special occasion"}
    if fresh and evening:
        occ.add("Versatile")
    if not occ:
        occ = {"Daily", "Versatile"}
    order = ["Daily", "Office", "Casual", "Versatile", "Evening", "Date night",
             "Night out", "Special occasion"]
    return [o for o in order if o in occ]


def derive_time(accords):
    a = set(accords)
    day, night = len(a & OCC_FRESH), len(a & OCC_EVENING)
    if day and not night:
        return ["Day"]
    if night and not day:
        return ["Night"]
    return ["Day", "Night"]


def derive_mood(accords):
    parts = [ADJ.get(a, a) for a in accords[:3]]
    if not parts:
        return "A balanced, wearable composition."
    if len(parts) == 1:
        body = parts[0]
    elif len(parts) == 2:
        body = f"{parts[0]} and {parts[1]}"
    else:
        body = f"{parts[0]}, {parts[1]} and {parts[2]}"
    return f"A {body} composition."


def split_notes(s):
    if not s:
        return []
    return [n.strip() for n in re.split(r"[;,]", s) if n.strip()]


# ---------------------------------------------------------------- main
def main():
    # ---- secondary index: longevity/sillage keyed by normalized full name ----
    perf_meta = {}
    if GH.exists():
        for r in csv.DictReader(open(GH, encoding="utf-8-sig")):
            key = normalize(f"{r['brand']} {r['perfume']}")
            try:
                lon = weighted_label(json.loads(r["longevity"]) if r["longevity"] else [],
                                     LONGEVITY_LABELS)
                sil = weighted_label(json.loads(r["sillage"]) if r["sillage"] else [],
                                     SILLAGE_LABELS)
            except (json.JSONDecodeError, TypeError):
                lon = sil = None
            if lon or sil:
                perf_meta.setdefault(key, (lon, sil))

    # ---- primary candidates: Kaggle ----
    cands = []
    for r in csv.DictReader(open(KAGGLE, encoding="latin-1"), delimiter=";"):
        full = normalize(f"{r['Brand']} {r['Perfume']}")
        cands.append((full, core_tokens(full), r))
    print(f"Kaggle rows: {len(cands)} | GH meta rows: {len(perf_meta)}", file=sys.stderr)

    uniques = json.loads((BUILD / "unique_originals.json").read_text())
    enriched, matched, unmatched = {}, [], []

    for u in uniques:
        name = u["name"]
        if name.startswith("—"):  # placeholder for ME-house originals
            unmatched.append({"slug": u["slug"], "name": name, "count": u["count"],
                              "bestGuess": None, "score": 0.0})
            continue
        qn = normalize(name)
        qt = core_tokens(qn)
        best, best_s, best_ct = None, 0.0, set()
        for cn, ct, r in cands:
            s = score(qn, qt, cn, ct)
            if s > best_s:
                best_s, best, best_ct = s, r, ct

        rejected = False
        if best is not None:
            brand_tokens = core_tokens(normalize(best["Brand"]))
            distinctive = qt - brand_tokens
            # A distinctive query token is satisfied if it equals OR is fuzzy-close
            # to any candidate token (handles greenly/greenley, farid/fareed,
            # khamra/khamrah, blu/blue, isola-blu/isola-blue spelling drift).
            def satisfied(tok):
                for c in best_ct:
                    if tok == c:
                        return True
                    if len(tok) >= 4 and len(c) >= 4 and \
                       SequenceMatcher(None, tok, c).ratio() >= 0.78:
                        return True
                    if len(tok) >= 4 and (c.startswith(tok) or tok.startswith(c)):
                        return True
                return False
            if distinctive and not any(satisfied(t) for t in distinctive):
                rejected = True

        if best is None or best_s < 0.56 or rejected:
            unmatched.append({"slug": u["slug"], "name": name, "count": u["count"],
                              "bestGuess": f"{best['Brand']} {best['Perfume']}" if best else None,
                              "score": round(best_s, 3), "rejected": rejected})
            continue

        accords = [best.get(f"mainaccord{i}", "").strip().lower() for i in range(1, 6)]
        accords = [a for a in accords if a and a != "nan"]
        matched_full = f"{best['Brand']} {best['Perfume']}".replace("-", " ").title()

        lon, sil = perf_meta.get(normalize(f"{best['Brand']} {best['Perfume']}"), (None, None))
        conf = "high" if best_s >= 0.80 else "medium"
        try:
            rating = round(float(best.get("Rating Value") or 0), 2) or None
        except ValueError:
            rating = None

        enriched[u["slug"]] = {
            "slug": u["slug"], "name": name, "matchedName": matched_full,
            "brand": best["Brand"].replace("-", " ").title(),
            "year": (best.get("Year") or "").strip() or None,
            "gender": (best.get("Gender") or "").strip() or None,
            "rating": rating,
            "family": derive_family(accords),
            "keyAccords": accords,
            "topNotes": split_notes(best.get("Top")),
            "heartNotes": split_notes(best.get("Middle")),
            "baseNotes": split_notes(best.get("Base")),
            "seasons": derive_seasons(accords),
            "occasions": derive_occasions(accords, sil),
            "timeOfDay": derive_time(accords),
            "longevity": lon,
            "sillage": sil,
            "mood": derive_mood(accords),
            "confidence": conf, "verified": False,
            "source": "kaggle", "matchScore": round(best_s, 3),
        }
        matched.append({"slug": u["slug"], "name": name, "matchedName": matched_full,
                        "score": round(best_s, 3), "confidence": conf})

    (BUILD / "originals.json").write_text(json.dumps(enriched, indent=2, ensure_ascii=False))
    report = {"matchedCount": len(matched), "unmatchedCount": len(unmatched),
              "matched": sorted(matched, key=lambda x: x["score"]),
              "unmatched": sorted(unmatched, key=lambda x: -x["count"])}
    (BUILD / "coverage_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False))

    print(f"\nMatched: {len(matched)}/{len(uniques)}   Unmatched: {len(unmatched)}")
    print("\nLowest-confidence matches (review top 20):")
    for m in sorted(matched, key=lambda x: x["score"])[:20]:
        print(f"  {m['score']:.2f}  {m['name']!r:42} -> {m['matchedName']}")
    print("\nUnmatched (tier 2/3, by frequency):")
    for u in sorted(unmatched, key=lambda x: -x["count"]):
        print(f"  (x{u['count']:>2}) {u['name']!r:42} best~ {u['bestGuess']} [{u['score']}]")


if __name__ == "__main__":
    main()
