from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

# The two hero assets have .jpg names but were stored as lossless PNG data.
# Re-encode them as progressive JPEG at quality 90 while preserving dimensions.
for relative in (
    "client/public/images/hurghada-budgie-card.jpg",
    "client/public/images/hurghada-parrot-hero.jpg",
):
    path = ROOT / relative
    image = Image.open(path).convert("RGB")
    temporary = path.with_suffix(".optimized.jpg")
    image.save(temporary, format="JPEG", quality=90, optimize=True, progressive=True, subsampling=0)
    temporary.replace(path)

# Keep the PWA artwork at its original 1024px dimensions, but use a compact
# adaptive palette with dithering; this keeps the icon sharp while avoiding a
# multi-megabyte raw RGB PNG in the checkpoint.
path = ROOT / "client/public/icons/bird-lovers-icon-1024.png"
image = Image.open(path).convert("RGB")
temporary = path.with_suffix(".optimized.png")
image.quantize(colors=256, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.FLOYDSTEINBERG).save(
    temporary, format="PNG", optimize=True
)
temporary.replace(path)

for relative in (
    "client/public/icons/bird-lovers-icon-1024.png",
    "client/public/images/hurghada-budgie-card.jpg",
    "client/public/images/hurghada-parrot-hero.jpg",
):
    path = ROOT / relative
    print(f"{path}: {path.stat().st_size} bytes")
