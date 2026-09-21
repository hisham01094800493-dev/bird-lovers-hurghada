from pathlib import Path
from PIL import Image, ImageOps

source = Path("client/public/images/hurghada-budgie-card.jpg")
out_dir = Path("client/public/icons")
out_dir.mkdir(parents=True, exist_ok=True)

with Image.open(source) as image:
    image = ImageOps.exif_transpose(image).convert("RGB")
    side = min(image.size)
    left = (image.width - side) // 2
    top = (image.height - side) // 2
    square = image.crop((left, top, left + side, top + side))
    for size in (192, 512, 1024):
        square.resize((size, size), Image.Resampling.LANCZOS).save(
            out_dir / f"bird-lovers-icon-{size}.png", format="PNG", optimize=True
        )
