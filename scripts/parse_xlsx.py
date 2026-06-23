#!/usr/bin/env python3
"""Parse data/sources/Personal_Perfume_Collection.xlsx into structured JSON.

Outputs:
  data/build/raw_collection.json   - every owned perfume with group + impression-of
  data/build/unique_originals.json - deduped worklist of originals to enrich

The xlsx has inline strings (no sharedStrings table), so we parse the
worksheet XML directly.
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "data" / "sources"
BUILD = ROOT / "data" / "build"
XLSX = SOURCES / "Personal_Perfume_Collection.xlsx"
BUILD.mkdir(parents=True, exist_ok=True)

M = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def cell_value(c):
    isel = c.find("m:is", NS)
    v = c.find("m:v", NS)
    if isel is not None:
        t = isel.find("m:t", NS)
        return t.text if t is not None else None
    if v is not None:
        return v.text
    return None


def col_letter(ref):
    return "".join(ch for ch in ref for _ in [0] if ch.isalpha())


def read_rows(z, sheet):
    root = ET.fromstring(z.read(sheet))
    rows = []
    for row in root.iter(M + "row"):
        cells = {}
        for c in row.findall("m:c", NS):
            cells[col_letter(c.get("r"))] = cell_value(c)
        rows.append(cells)
    return rows


def slugify(s):
    s = s.lower().strip()
    s = re.sub(r"[''`]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# ---- Hybrid / non-original detection -------------------------------------
HYBRID_RE = re.compile(r"\b(hybrid|fusion)\b", re.I)
OWN_RE = re.compile(r"own (creation|blend)|arome.?s own", re.I)


def parse_impression(text):
    """Return (kind, payload).

    kind: 'single' | 'hybrid' | 'own'
    payload: cleaned original name, or list of parent names for hybrid.
    """
    if text is None:
        return ("own", None)
    raw = text.strip()
    if OWN_RE.search(raw):
        return ("own", raw)
    m = HYBRID_RE.search(raw)
    if m:
        inner = re.search(r"\(([^)]*)\)", raw)
        body = inner.group(1) if inner else raw
        parts = re.split(r"\s*\+\s*", body)
        parts = [p.strip() for p in parts if p.strip()]
        if len(parts) >= 2:
            return ("hybrid", parts)
        return ("single", raw)
    return ("single", raw)


def main():
    z = zipfile.ZipFile(XLSX)
    rows = read_rows(z, "xl/worksheets/sheet1.xml")

    collection = []
    current_group = None
    group_brand = None
    seen_header = False

    for cells in rows:
        a = (cells.get("A") or "").strip()
        b = cells.get("B")
        c = cells.get("C")
        d = cells.get("D")

        # header row
        if a == "#" and (b or "").strip() == "Name":
            seen_header = True
            continue

        # section header: only column A populated and not a row number
        is_data_number = a.isdigit()
        if a and not is_data_number and b is None:
            # e.g. "AROME — COLLECTION 1  |  77 Perfumes"
            label = re.split(r"\s*\|\s*", a)[0].strip()
            current_group = label
            # brand: take part before "—" if present
            group_brand = re.split(r"\s+—\s+", label)[0].strip().title()
            continue

        if not is_data_number or not b:
            continue

        clone_name = b.strip()
        impression_raw = (c or "").strip()
        house = (d or "").strip()
        kind, payload = parse_impression(impression_raw)

        is_original = current_group is not None and "MIDDLE EASTERN" in current_group.upper()

        entry = {
            "id": f"{slugify(current_group or 'misc')}-{a}",
            "index": int(a),
            "cloneName": clone_name,
            "impressionRaw": impression_raw,
            "house": house or group_brand,
            "group": current_group,
            "isOriginal": is_original,
            "kind": kind,
        }

        if is_original:
            # ME-house entries ARE the original; enrich by their own name.
            entry["kind"] = "original"
            entry["impressionOfSlug"] = slugify(clone_name)
            entry["originalName"] = clone_name
        elif kind == "single":
            entry["impressionOfSlug"] = slugify(payload) if payload else None
            entry["originalName"] = payload
        elif kind == "hybrid":
            entry["blendOf"] = [slugify(p) for p in payload]
            entry["blendNames"] = payload
            entry["impressionOfSlug"] = None
        else:  # own
            entry["impressionOfSlug"] = None
            entry["originalName"] = None

        collection.append(entry)

    # ---- dedupe unique originals ----
    uniques = {}

    def add_unique(name):
        if not name:
            return
        slug = slugify(name)
        if slug not in uniques:
            uniques[slug] = {"slug": slug, "name": name, "count": 0}
        uniques[slug]["count"] += 1

    for e in collection:
        if e["kind"] in ("single", "original"):
            add_unique(e.get("originalName"))
        elif e["kind"] == "hybrid":
            for n in e.get("blendNames", []):
                add_unique(n)

    unique_list = sorted(uniques.values(), key=lambda x: -x["count"])

    (BUILD / "raw_collection.json").write_text(json.dumps(collection, indent=2, ensure_ascii=False))
    (BUILD / "unique_originals.json").write_text(json.dumps(unique_list, indent=2, ensure_ascii=False))

    # ---- report ----
    print(f"Total perfumes parsed: {len(collection)}")
    groups = {}
    for e in collection:
        groups[e["group"]] = groups.get(e["group"], 0) + 1
    print("\nGroup counts:")
    for g, n in groups.items():
        print(f"  {n:>3}  {g}")
    kinds = {}
    for e in collection:
        kinds[e["kind"]] = kinds.get(e["kind"], 0) + 1
    print(f"\nKinds: {kinds}")
    print(f"Unique originals to enrich: {len(unique_list)}")
    print(f"Originals (actual, ME houses): {sum(1 for e in collection if e['isOriginal'])}")


if __name__ == "__main__":
    main()
