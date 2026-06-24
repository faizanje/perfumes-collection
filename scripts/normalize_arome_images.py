#!/usr/bin/env python3
"""Normalize the local Arome house-bottle PNGs so every bottle renders the same
size and centered.

The raw arome.pk cutouts have wildly inconsistent framing: some bottles fill 18%
of their canvas and sit 19% off to the left, others fill 36% and are centered.
`object-contain` faithfully fits each whole PNG, so that variance shows through on
the cards. This trims each PNG to its bottle (alpha bbox) and re-pastes it,
centered, onto a uniform 3:4 canvas at a consistent fill — making the gallery
read evenly.

Usage:
  python3 scripts/normalize_arome_images.py --dry-run        # measure only
  python3 scripts/normalize_arome_images.py --out /tmp/prev --only 1-10 2-28
  python3 scripts/normalize_arome_images.py                  # normalize in place
"""
import argparse
import glob
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG_DIR = os.path.join(ROOT, "public", "img")

# Uniform output frame. 3:4 matches Fragrantica's 375x500 bottle thumbs so Arome
# and original bottles sit at the same proportion. The bottle is scaled so its
# HEIGHT fills TARGET_FILL of the canvas (width-capped so wide flacons don't
# overflow), then centered.
CANVAS_W, CANVAS_H = 600, 800
TARGET_FILL = 0.97      # bottle height as a fraction of canvas height
MAX_WIDTH_FILL = 0.92   # cap bottle width so squat bottles don't blow out


def normalize(path, out_path):
    im = Image.open(path).convert("RGBA")
    bbox = im.split()[3].getbbox()
    if not bbox:
        return False  # fully transparent — leave it
    content = im.crop(bbox)
    cw, ch = content.size

    # scale to target height, then cap by width
    scale = (CANVAS_H * TARGET_FILL) / ch
    if cw * scale > CANVAS_W * MAX_WIDTH_FILL:
        scale = (CANVAS_W * MAX_WIDTH_FILL) / cw
    new_w, new_h = max(1, round(cw * scale)), max(1, round(ch * scale))
    content = content.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    x = (CANVAS_W - new_w) // 2
    y = (CANVAS_H - new_h) // 2
    canvas.paste(content, (x, y), content)
    canvas.save(out_path)
    return True


def measure(path):
    im = Image.open(path).convert("RGBA")
    W, H = im.size
    bb = im.split()[3].getbbox()
    if not bb:
        return None
    l, t, r, b = bb
    return {
        "fill": (r - l) * (b - t) / (W * H) * 100,
        "off": ((l + r) / 2 - W / 2) / W * 100,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="measure only, write nothing")
    ap.add_argument("--out", default=None, help="output dir (default: in place)")
    ap.add_argument("--only", nargs="*", help="suffixes to limit to, e.g. 1-10 2-28")
    args = ap.parse_args()

    files = sorted(glob.glob(os.path.join(IMG_DIR, "a-arome-collection-*.png")))
    if args.only:
        files = [f for f in files if any(f.endswith(f"collection-{s}.png") for s in args.only)]
    if not files:
        print("no matching files", file=sys.stderr)
        return 1

    out_dir = args.out or IMG_DIR
    os.makedirs(out_dir, exist_ok=True)

    for f in files:
        name = os.path.basename(f)
        before = measure(f)
        if args.dry_run:
            print(f"{name:42} fill={before['fill']:.0f}% off={before['off']:+.0f}%")
            continue
        out_path = os.path.join(out_dir, name)
        ok = normalize(f, out_path)
        if not ok:
            print(f"{name:42} SKIPPED (empty)")
            continue
        after = measure(out_path)
        print(f"{name:42} fill {before['fill']:4.0f}% -> {after['fill']:4.0f}%   "
              f"off {before['off']:+4.0f}% -> {after['off']:+4.0f}%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
