"""Extract the eight chroma-keyed sprites from a generated two-piece limb sheet.

The image generator is asked for a 4x2 grid with a flat #00ff00 background.
This script makes that generation reproducible: each grid cell is keyed,
decontaminated to avoid a green fringe, trimmed, and written to the existing
rig part names.  Hands are included in forearms; shoes are included in shins.

Usage:
    python scripts/extract_two_piece_limbs.py public/assets/characters/anna
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


PARTS = (
    "left-upper-arm",
    "left-forearm",
    "right-upper-arm",
    "right-forearm",
    "left-thigh",
    "left-shin",
    "right-thigh",
    "right-shin",
)

# The generator intentionally draws a generous knee-cap overlap.  It may also
# continue the fabric past that cap; trim that redundant material so the two
# exported leg sprites meet at the knee instead of each resembling a full leg.
VERTICAL_KEEP = {
    "left-thigh": (0.0, 0.74),
    "right-thigh": (0.0, 0.74),
    "left-shin": (0.28, 1.0),
    "right-shin": (0.28, 1.0),
}

SARAH_ARM_KEEP = {
    "left-upper-arm": (0.0, 0.74),
    "right-upper-arm": (0.0, 0.78),
    "left-forearm": (0.18, 1.0),
    "right-forearm": (0.18, 1.0),
}


def remove_green_screen(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]

    # Distance from the exact green backdrop provides a soft edge alpha.
    distance = np.sqrt(
        rgb[:, :, 0] ** 2
        + (rgb[:, :, 1] - 255.0) ** 2
        + rgb[:, :, 2] ** 2
    )
    alpha = np.clip((distance - 14.0) / 52.0, 0.0, 1.0)

    # Generated anti-aliasing can produce a darker lime outline that is far
    # enough from #00ff00 to fool distance-only keying.  When green clearly
    # dominates both other channels, use their coverage as the matte instead.
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    green_dominant = green > np.maximum(red, blue) + 14.0
    edge_coverage = np.maximum(red, blue) / 255.0
    alpha[green_dominant] = np.minimum(alpha[green_dominant], edge_coverage[green_dominant] * 1.12)

    # Keep only the largest connected subject so isolated generation specks do
    # not become tiny invisible assets in the stage bundle.
    labels, count = ndimage.label(alpha > 0.08, structure=np.ones((3, 3)))
    if count:
        sizes = np.bincount(labels.ravel())
        sizes[0] = 0
        alpha[labels != int(sizes.argmax())] = 0

    # Reverse the green composite on feathered pixels to prevent a neon rim.
    safe_alpha = np.maximum(alpha, 1 / 255.0)
    foreground = rgb.copy()
    foreground[:, :, 0] = rgb[:, :, 0] / safe_alpha
    foreground[:, :, 1] = (rgb[:, :, 1] - (1 - alpha) * 255.0) / safe_alpha
    foreground[:, :, 2] = rgb[:, :, 2] / safe_alpha
    foreground = np.clip(foreground, 0, 255)

    output = np.dstack((foreground, alpha * 255.0)).astype(np.uint8)
    return Image.fromarray(output, "RGBA")


def trim(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 8)
    if not len(xs):
        raise ValueError("Grid cell became fully transparent")
    left = max(0, int(xs.min()) - padding)
    top = max(0, int(ys.min()) - padding)
    right = min(image.width, int(xs.max()) + padding + 1)
    bottom = min(image.height, int(ys.max()) + padding + 1)
    return image.crop((left, top, right, bottom))


def extract(character_dir: Path) -> None:
    source_path = character_dir / "reference" / "limbs-v2-sheet.png"
    sheet = Image.open(source_path).convert("RGB")
    cell_width = sheet.width // 4
    cell_height = sheet.height // 2
    destination = character_dir / "parts"
    destination.mkdir(parents=True, exist_ok=True)

    for index, name in enumerate(PARTS):
        column = index % 4
        row = index // 4
        left = column * cell_width
        top = row * cell_height
        right = sheet.width if column == 3 else (column + 1) * cell_width
        bottom = sheet.height if row == 1 else (row + 1) * cell_height
        sprite = trim(remove_green_screen(sheet.crop((left, top, right, bottom))))
        keep = VERTICAL_KEEP.get(name)
        if character_dir.name.lower() == "sarah":
            keep = SARAH_ARM_KEEP.get(name, keep)
        if keep:
            keep_top, keep_bottom = keep
            sprite = sprite.crop((
                0,
                int(sprite.height * keep_top),
                sprite.width,
                int(sprite.height * keep_bottom),
            ))
            sprite = trim(sprite, padding=8)
        output = destination / f"{name}.png"
        sprite.save(output, optimize=True)
        print(f"{name}: {output} {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Pass a character asset directory")
    extract(Path(sys.argv[1]).resolve())
