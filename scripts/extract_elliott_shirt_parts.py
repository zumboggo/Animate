"""Extract Elliott's seam-safe torso and sleeve-capped upper arms.

The source sheet is generated on chroma green, keyed with the imagegen helper,
and arranged left-arm / torso / right-arm across one row.  Keeping this tiny
extractor in the repository makes the source art reproducible without baking
crop coordinates into the runtime.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
CHARACTER = ROOT / "public" / "assets" / "characters" / "elliott"
SOURCE = CHARACTER / "reference" / "shirt-parts-v2-sheet-alpha.png"


def trim(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 8)
    if not len(xs):
        raise ValueError("Sprite region became fully transparent")
    return image.crop((
        max(0, int(xs.min()) - padding),
        max(0, int(ys.min()) - padding),
        min(image.width, int(xs.max()) + padding + 1),
        min(image.height, int(ys.max()) + padding + 1),
    ))


def main() -> None:
    sheet = Image.open(SOURCE).convert("RGBA")
    third = sheet.width // 3
    regions = {
        "left-upper-arm": (0, 0, third, sheet.height),
        "torso-clean-v2": (third, 0, third * 2, sheet.height),
        "right-upper-arm": (third * 2, 0, sheet.width, sheet.height),
    }

    output = CHARACTER / "parts"
    output.mkdir(parents=True, exist_ok=True)
    for name, box in regions.items():
        sprite = trim(sheet.crop(box))
        path = output / f"{name}.png"
        sprite.save(path, optimize=True)
        print(f"{name}: {path} {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    main()
