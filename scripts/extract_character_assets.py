"""Extract transparent character sprites from a manually measured source sheet.

Usage:
    python scripts/extract_character_assets.py public/assets/characters/<name>/extraction-map.json

The script deliberately uses explicit crop coordinates.  It only removes the
connected, near-neutral background around each crop, so light clothes and eye
highlights enclosed by the illustration are preserved.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int16)

    # The generated sheets use a warm, almost-white paper backdrop.  Mark only
    # low-chroma, bright pixels as possible background, then retain the region
    # connected to a crop edge.  Dark outlines prevent the fill from entering
    # light clothes, white socks, eyes, or shoe highlights.
    brightest = rgb.max(axis=2)
    darkest = rgb.min(axis=2)
    candidate = (darkest >= 205) & ((brightest - darkest) <= 48)
    seed = np.zeros(candidate.shape, dtype=bool)
    seed[0, :] = candidate[0, :]
    seed[-1, :] = candidate[-1, :]
    seed[:, 0] = candidate[:, 0]
    seed[:, -1] = candidate[:, -1]
    background = ndimage.binary_propagation(seed, mask=candidate)

    # Feather the first two subject pixels so the result stays soft on both
    # high- and normal-density screens.
    subject_distance = ndimage.distance_transform_edt(~background)
    alpha = np.clip(subject_distance / 1.7, 0, 1) * 255
    alpha[background] = 0
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def trim_transparent(image: Image.Image, padding: int) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 8)
    if len(xs) == 0:
        raise ValueError("Crop became fully transparent; check its coordinates")
    left = max(0, int(xs.min()) - padding)
    top = max(0, int(ys.min()) - padding)
    right = min(image.width, int(xs.max()) + padding + 1)
    bottom = min(image.height, int(ys.max()) + padding + 1)
    return image.crop((left, top, right, bottom))


def keep_largest_subject(image: Image.Image) -> Image.Image:
    """Drop sheet labels and neighboring-character fragments from a crop."""
    rgba = np.asarray(image, dtype=np.uint8).copy()
    labels, count = ndimage.label(rgba[:, :, 3] > 8, structure=np.ones((3, 3), dtype=np.uint8))
    if count <= 1:
        return image
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    largest = int(sizes.argmax())
    rgba[labels != largest, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def remove_small_subjects(image: Image.Image, minimum_pixels: int) -> Image.Image:
    """Keep paired face features while discarding isolated sheet specks."""
    rgba = np.asarray(image, dtype=np.uint8).copy()
    labels, count = ndimage.label(rgba[:, :, 3] > 8, structure=np.ones((3, 3), dtype=np.uint8))
    if count == 0:
        return image
    sizes = np.bincount(labels.ravel())
    remove = sizes < minimum_pixels
    remove[0] = False
    rgba[remove[labels], 3] = 0
    return Image.fromarray(rgba, "RGBA")


def main(config_path: Path) -> None:
    config_path = config_path.resolve()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    root = config_path.parent
    padding = int(config.get("padding", 14))

    sources: dict[str, Image.Image] = {}
    for key, relative_path in config["sources"].items():
        sources[key] = Image.open(root / relative_path).convert("RGB")

    for name, item in config["crops"].items():
        source = sources[item["source"]]
        x, y, width, height = (int(value) for value in item["rect"])
        crop = source.crop((x, y, x + width, y + height))
        sprite = remove_connected_background(crop)
        if item.get("keepLargestSubject", True):
            sprite = keep_largest_subject(sprite)
        elif item.get("minComponentPixels"):
            sprite = remove_small_subjects(sprite, int(item["minComponentPixels"]))
        sprite = trim_transparent(sprite, padding)
        destination = root / item["output"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(destination, optimize=True)
        print(f"{name}: {destination.relative_to(root)} {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Pass one extraction-map.json path")
    main(Path(sys.argv[1]))
