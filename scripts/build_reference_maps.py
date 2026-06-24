#!/usr/bin/env python3
"""Extract canonical reference maps from the rich Apify Fragrantica data:
  data/generated/accord_colors.json  { accord(lower) : "#hex" }   (real Fragrantica colors)
  data/generated/note_images.json    { note(lower)   : img_url }   (round note icons)

These are applied universally in the UI (works for accords/notes from any source).
"""
import glob
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
OUT = ROOT / "data" / "generated"


def main():
    files = glob.glob(str(SOURCES / "dataset_fragrantica_*.json"))
    recs = []
    for f in files:
        recs += json.loads(Path(f).read_text())

    accord_hex = {}
    for r in recs:
        for a in r.get("mainAccords") or []:
            name = (a.get("accord") or "").strip().lower()
            hexv = (a.get("hex") or "").strip()
            if name and hexv:
                accord_hex.setdefault(name, Counter())[hexv] += 1
    accord_colors = {k: c.most_common(1)[0][0] for k, c in accord_hex.items()}

    note_images = {}
    for r in recs:
        pyr = r.get("pyramid") or {}
        for key in ("topNotes", "middleNotes", "baseNotes"):
            for n in pyr.get(key) or []:
                name = (n.get("name") or "").strip().lower()
                img = (n.get("img") or "").strip()
                if name and img and name not in note_images:
                    note_images[name] = img

    (OUT / "accord_colors.json").write_text(json.dumps(accord_colors, indent=2, ensure_ascii=False))
    (OUT / "note_images.json").write_text(json.dumps(note_images, indent=2, ensure_ascii=False))
    print(f"accord_colors: {len(accord_colors)} accords")
    print(f"note_images: {len(note_images)} notes")
    print("sample accords:", dict(list(accord_colors.items())[:8]))


if __name__ == "__main__":
    main()
