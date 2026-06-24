#!/usr/bin/env python3
"""Download each original's Fragrantica bottle image and remove the background
with ML segmentation (rembg / U^2-Net) — handles white, clear and dark bottles
alike — then self-host the transparent PNG at public/img/<id>.png.

  python3 scripts/process_images.py [--force]

Resumable: skips ids already present unless --force.
Requires: pip install rembg onnxruntime
"""
import io
import re
import subprocess
import sys
from pathlib import Path

import json
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
ORIG = ROOT / "data" / "build" / "originals.json"
OUTDIR = ROOT / "public" / "img"
OUTDIR.mkdir(parents=True, exist_ok=True)
FORCE = "--force" in sys.argv


def pid(url):
    m = re.search(r"-(\d+)\.html", url or "")
    return m.group(1) if m else None


def normalize(im, ratio=3 / 4, pad=0.10):
    """Center the bottle on a consistent 3:4 transparent canvas so tall and wide
    bottles render at the same scale (no aspect-ratio surprises)."""
    bb = im.getbbox()
    if bb:
        im = im.crop(bb)
    w, h = im.size
    cw = max(w / (1 - 2 * pad), (h / (1 - 2 * pad)) * ratio)
    ch = cw / ratio
    canvas = Image.new("RGBA", (round(cw), round(ch)), (0, 0, 0, 0))
    canvas.paste(im, ((round(cw) - w) // 2, (round(ch) - h) // 2), im)
    return canvas


def fetch(id_):
    # curl avoids the Python SSL cert issue on this machine
    r = subprocess.run(
        ["/usr/bin/curl", "-s", f"https://fimgs.net/mdimg/perfume/375x500.{id_}.jpg"],
        capture_output=True,
    )
    return r.stdout if r.returncode == 0 and len(r.stdout) > 800 else None


def main():
    originals = json.loads(ORIG.read_text())
    ids = sorted({pid(o.get("originalUrl")) for o in originals.values() if pid(o.get("originalUrl"))})
    print(f"{len(ids)} unique bottle images")

    session = new_session("birefnet-general-lite")
    ok = skip = fail = 0
    for i, id_ in enumerate(ids):
        out = OUTDIR / f"{id_}.png"
        if out.exists() and not FORCE:
            skip += 1
            continue
        raw = fetch(id_)
        if not raw:
            fail += 1
            continue
        try:
            cut = remove(Image.open(io.BytesIO(raw)).convert("RGBA"), session=session)
            normalize(cut).save(out)
            ok += 1
            if ok % 20 == 0:
                print(f"  processed {ok}…")
        except Exception as e:
            fail += 1
            print(f"  fail {id_}: {e}")
    print(f"Done. processed={ok} skipped={skip} failed={fail} -> public/img/")


if __name__ == "__main__":
    main()
