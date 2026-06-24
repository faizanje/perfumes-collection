#!/usr/bin/env python3
"""Manual bottle images for perfumes NOT on Fragrantica (local/clone houses).
Add `slug: image_url` below — usually the clone house's own product photo.
Each is background-removed (rembg) and saved to public/img/m-<slug>.png, which
build_app_data.py prefers over the Fragrantica image.

  python3 scripts/manual_images.py
"""
import io
import subprocess
from pathlib import Path

from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
OUTDIR = ROOT / "public" / "img"
OUTDIR.mkdir(parents=True, exist_ok=True)

# slug -> source image URL (from the clone house's site)
MANUAL_IMAGES = {
    "addicted": "https://www.junaidjamshed.com/cdn/shop/files/addicted_1_4e7c7020-0508-4f0f-a765-71936c5ba9de.jpg?v=1776961785&width=880",
}


def fetch(url):
    r = subprocess.run(["/usr/bin/curl", "-sL", url], capture_output=True)
    return r.stdout if r.returncode == 0 and len(r.stdout) > 800 else None


def main():
    session = new_session("birefnet-general-lite")
    for slug, url in MANUAL_IMAGES.items():
        raw = fetch(url)
        if not raw:
            print(f"  ✗ {slug}: download failed")
            continue
        cut = remove(Image.open(io.BytesIO(raw)).convert("RGBA"), session=session)
        bb = cut.getbbox()
        if bb:
            cut = cut.crop(bb)
        w, h = cut.size
        ratio, pad = 3 / 4, 0.10
        cw = max(w / (1 - 2 * pad), (h / (1 - 2 * pad)) * ratio)
        ch = cw / ratio
        canvas = Image.new("RGBA", (round(cw), round(ch)), (0, 0, 0, 0))
        canvas.paste(cut, ((round(cw) - w) // 2, (round(ch) - h) // 2), cut)
        out = OUTDIR / f"m-{slug}.png"
        canvas.save(out)
        print(f"  ✓ {slug} -> {out.name}")


if __name__ == "__main__":
    main()
