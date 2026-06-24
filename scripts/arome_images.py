#!/usr/bin/env python3
"""Fetch real Arome bottle photos from arome.pk (Shopify), background-remove them
(rembg birefnet-general-lite), and emit:

  public/img/a-<perfume-id>.png      transparent cutout, 3:4 canvas
  data/generated/arome_images.json   { id: {img, handle, title, source_img, confidence} }
  data/build/arome_matches.csv       audit table (confidence, our name -> arome.pk title)

Matching is name-based (cloneName -> arome.pk title) with normalization,
parenthetical stripping, and fuzzy fallback. Only HIGH/MED rows get an image;
the rest keep their inspired-by photo (graceful fallback in the app).

Runs rembg in a process pool across CPU cores and SKIPS bottles already cut, so
re-running only does what's missing.

  python3 scripts/arome_images.py                 # parallel, resume missing
  python3 scripts/arome_images.py --force         # re-cut everything
  python3 scripts/arome_images.py --workers 6     # cap worker processes
  python3 scripts/arome_images.py --dry-run       # just write the match CSV
"""
import os

# Single process, but cap inference threads so the machine stays responsive while
# it runs (leaves cores free for the OS). Must be set before onnxruntime imports.
os.environ.setdefault("OMP_NUM_THREADS", "4")

import csv
import difflib
import io
import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "public" / "img"
GEN = ROOT / "data" / "generated"
BUILD = ROOT / "data" / "build"
DRY = "--dry-run" in sys.argv
FORCE = "--force" in sys.argv


def _arg(flag, default):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


# Background-removal model. birefnet-general-lite = best edges (default, ~214MB);
# u2netp = tiny + fastest + lightest (~5MB), good for clean studio shots;
# isnet-general-use = middle ground.
MODEL = _arg("--model", "birefnet-general-lite")
MAX_W = int(_arg("--maxw", "800"))


def fetch(url):
    if url.startswith("//"):
        url = "https:" + url
    r = subprocess.run(["/usr/bin/curl", "-sL", "-A", "Mozilla/5.0", url], capture_output=True)
    return r.stdout if r.returncode == 0 and len(r.stdout) > 800 else None


def shopify_products():
    out = []
    for page in range(1, 8):
        raw = fetch(f"https://arome.pk/products.json?limit=250&page={page}")
        if not raw:
            break
        ps = json.loads(raw).get("products", [])
        if not ps:
            break
        out += ps
    return out


STOP = re.compile(r"\b(by arome|arome|extrait de parfum|extrait|eau de parfum|edp|edt|parfum|pour homme|pour femme|the|new|discontinued|vetiver edition|edition|exclusive)\b")


def norm(s):
    s = (s or "").lower()
    s = re.sub(r"\(.*?\)", " ", s)
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    s = STOP.sub(" ", s)
    return re.sub(r"\s+", " ", s).strip()


def squash(s):
    return re.sub(r"\s+", "", norm(s))


def cut_one(session, url, out_path):
    """Download + (downscale) + bg-remove + 3:4 normalize + save. Returns ok bool."""
    from rembg import remove
    raw = fetch(url)
    if not raw:
        return False, "download failed"
    try:
        src = Image.open(io.BytesIO(raw)).convert("RGBA")
        # Downscale before bg-removal — inference cost scales with pixel count, and
        # the cutout displays small (card ~264px, detail ~96px). 800px is plenty.
        if MAX_W and src.width > MAX_W:
            src = src.resize((MAX_W, round(src.height * MAX_W / src.width)), Image.LANCZOS)
        cut = remove(src, session=session)
        bb = cut.getbbox()
        if bb:
            cut = cut.crop(bb)
        w, h = cut.size
        ratio, pad = 3 / 4, 0.10
        cw = max(w / (1 - 2 * pad), (h / (1 - 2 * pad)) * ratio)
        ch = cw / ratio
        canvas = Image.new("RGBA", (round(cw), round(ch)), (0, 0, 0, 0))
        canvas.paste(cut, ((round(cw) - w) // 2, (round(ch) - h) // 2), cut)
        canvas.save(out_path)
        return True, ""
    except Exception as e:  # noqa: BLE001 — report and continue
        return False, str(e)[:80]


# ── matching + driver ────────────────────────────────────────────────────────
def match(arome, products):
    idx = []
    for p in products:
        imgs = p.get("images") or []
        if not imgs:
            continue
        idx.append({"title": p["title"], "handle": p["handle"], "img": imgs[0]["src"],
                    "n": norm(p["title"]), "sq": squash(p["title"])})
    by_n = {x["n"]: x for x in idx}
    by_sq = {x["sq"]: x for x in idx}
    keys = list(by_n)
    out = []
    for a in arome:
        name = a.get("cloneName", "")
        n, sq = norm(name), squash(name)
        hit, conf = None, ""
        if n and n in by_n:
            hit, conf = by_n[n], "high"
        elif sq and sq in by_sq:
            hit, conf = by_sq[sq], "high"
        else:
            c = difflib.get_close_matches(n, keys, n=1, cutoff=0.86)
            if c:
                hit, conf = by_n[c[0]], "med"
            else:
                subs = [x for x in idx if n and (n in x["n"] or x["n"] in n) and len(n) > 3]
                if subs:
                    hit, conf = subs[0], "med"
        out.append((a, hit, conf))
    return out


def main():
    coll = json.load(open(GEN / "collection.json"))
    items = coll if isinstance(coll, list) else coll.get("perfumes", coll)
    arome = [p for p in items if p.get("house") == "Arome"]

    matches = match(arome, shopify_products())

    BUILD.mkdir(parents=True, exist_ok=True)
    with open(BUILD / "arome_matches.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["confidence", "our_name", "impression_of", "arome_title", "arome_handle", "id"])
        for a, hit, conf in matches:
            w.writerow([conf or "none", a.get("cloneName", ""), a.get("impressionOf", ""),
                        hit["title"] if hit else "", hit["handle"] if hit else "", a["id"]])
    n_hi = sum(1 for _, h, c in matches if c == "high")
    n_md = sum(1 for _, h, c in matches if c == "med")
    print(f"matched: {n_hi} high + {n_md} med = {n_hi + n_md} / {len(arome)}  (csv: data/build/arome_matches.csv)")
    if DRY:
        return

    OUTDIR.mkdir(parents=True, exist_ok=True)
    jobs, skipped = [], 0
    for a, hit, conf in matches:
        if not hit:
            continue
        out_path = OUTDIR / f"a-{a['id']}.png"
        if out_path.exists() and not FORCE:
            skipped += 1
            continue
        jobs.append((a["id"], hit["img"], str(out_path)))

    print(f"to cut: {len(jobs)}  (skipping {skipped} already done)  · model={MODEL} maxw={MAX_W}", flush=True)
    if jobs:
        from rembg import new_session
        session = new_session(MODEL)
        for i, (pid, url, out_path) in enumerate(jobs, 1):
            ok, err = cut_one(session, url, out_path)
            tag = "✓" if ok else "✗"
            print(f"  {tag} [{i}/{len(jobs)}] {pid}{'' if ok else '  ' + err}", flush=True)

    # Build the map from whatever cutouts exist on disk (fresh + previously made).
    out_map = {}
    for a, hit, conf in matches:
        if not hit:
            continue
        p = OUTDIR / f"a-{a['id']}.png"
        if p.exists():
            out_map[a["id"]] = {"img": f"/img/{p.name}", "handle": hit["handle"],
                                "title": hit["title"], "source_img": hit["img"], "confidence": conf}
    json.dump(out_map, open(GEN / "arome_images.json", "w"), indent=2)
    print(f"done: {len(out_map)} images in map -> data/generated/arome_images.json")


if __name__ == "__main__":
    main()
