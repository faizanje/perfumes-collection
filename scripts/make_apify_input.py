#!/usr/bin/env python3
"""Generate the input for an Apify Fragrantica scrape so we can ingest ACCURATE
accords / season / day-night / notes for the collection's originals.

Outputs (in data/build/):
  apify_startUrls.json  - [{"url": ...}] for originals we have a Fragrantica URL for
  apify_urls.txt        - same URLs, one per line (easy copy-paste)
  apify_needs_search.csv- originals without a URL (search by name or skip)
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / "data" / "build"


def main():
    originals = json.loads((BUILD / "originals.json").read_text())

    have, missing = [], []
    seen = set()
    for slug, o in originals.items():
        url = o.get("originalUrl")
        if url and url not in seen:
            seen.add(url)
            have.append({"slug": slug, "name": o["matchedName"], "url": url,
                         "confidence": o.get("confidence"), "score": o.get("matchScore")})
        elif not url:
            missing.append({"slug": slug, "name": o.get("matchedName") or o.get("name"),
                            "brand": o.get("brand") or "", "source": o.get("source")})

    (BUILD / "apify_startUrls.json").write_text(
        json.dumps([{"url": h["url"]} for h in have], indent=2))
    (BUILD / "apify_urls.txt").write_text("\n".join(h["url"] for h in have) + "\n")

    with open(BUILD / "apify_needs_search.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["slug", "name", "brand", "source"])
        w.writeheader()
        w.writerows(missing)

    # low-confidence URL matches worth double-checking (URL may point at wrong frag)
    suspect = [h for h in have if (h["score"] or 1) < 0.74]
    print(f"URLs ready to scrape: {len(have)}  ->  data/build/apify_urls.txt")
    print(f"No URL (search by name or skip): {len(missing)}  ->  data/build/apify_needs_search.csv")
    print(f"\nLow-confidence URL matches to sanity-check ({len(suspect)}):")
    for h in suspect[:15]:
        print(f"  {h['score']}  {h['name']}\n        {h['url']}")


if __name__ == "__main__":
    main()
