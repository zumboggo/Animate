"""Extract pose sprites and a two-piece puppet rig from generated art sheets.

Usage:
    python scripts/extract_generated_hybrid_character.py \
        public/assets/characters/grace/extraction-map.json
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage


PART_NAMES = (
    "head",
    "torso",
    "pelvis",
    "left-upper-arm",
    "left-forearm",
    "right-upper-arm",
    "right-forearm",
    "left-thigh",
    "left-shin",
    "right-thigh",
    "right-shin",
)


def remove_white_background(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    brightest = rgb.max(axis=2)
    darkest = rgb.min(axis=2)
    candidate = (darkest >= 202) & ((brightest - darkest) <= 52)
    seed = np.zeros(candidate.shape, dtype=bool)
    seed[0, :] = candidate[0, :]
    seed[-1, :] = candidate[-1, :]
    seed[:, 0] = candidate[:, 0]
    seed[:, -1] = candidate[:, -1]
    background = ndimage.binary_propagation(seed, mask=candidate)
    subject_distance = ndimage.distance_transform_edt(~background)
    alpha = np.clip(subject_distance / 1.7, 0, 1) * 255
    alpha[background] = 0
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def sample_key(image: Image.Image) -> np.ndarray:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32)
    border = np.concatenate((
        rgb[:8, :, :].reshape(-1, 3),
        rgb[-8:, :, :].reshape(-1, 3),
        rgb[:, :8, :].reshape(-1, 3),
        rgb[:, -8:, :].reshape(-1, 3),
    ))
    return np.median(border, axis=0)


def remove_chroma(image: Image.Image, key: np.ndarray) -> Image.Image:
    rgba = np.asarray(image.convert("RGBA"), dtype=np.uint8).copy()
    rgb = rgba[:, :, :3].astype(np.int16)
    red, green, blue = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]

    # Generated chroma backgrounds contain gentle tonal variation even when
    # prompted as flat.  Segment by the key's dominant channel relationship,
    # then keep only the region connected to the crop edge.
    if key[2] > key[0] + 60 and key[2] > key[1] + 60:  # blue key
        candidate = blue > np.maximum(red, green) + 24
    elif key[1] > key[0] + 60 and key[1] > key[2] + 60:  # green key
        candidate = green > np.maximum(red, blue) + 24
    else:  # magenta key
        candidate = (np.minimum(red, blue) > green + 24) & (np.minimum(red, blue) > 105)

    seed = np.zeros(candidate.shape, dtype=bool)
    seed[0, :] = candidate[0, :]
    seed[-1, :] = candidate[-1, :]
    seed[:, 0] = candidate[:, 0]
    seed[:, -1] = candidate[:, -1]
    background = ndimage.binary_propagation(seed, mask=candidate)
    subject_distance = ndimage.distance_transform_edt(~background)
    alpha = np.clip(subject_distance / 1.45, 0, 1) * 255
    alpha[background] = 0
    rgba[:, :, 3] = alpha.astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def trim(image: Image.Image, padding: int = 12) -> Image.Image:
    alpha = np.asarray(image.getchannel("A"))
    ys, xs = np.nonzero(alpha > 8)
    if not len(xs):
        raise ValueError("Crop became fully transparent")
    left = max(0, int(xs.min()) - padding)
    top = max(0, int(ys.min()) - padding)
    right = min(image.width, int(xs.max()) + padding + 1)
    bottom = min(image.height, int(ys.max()) + padding + 1)
    return image.crop((left, top, right, bottom))


def keep_largest_subject(image: Image.Image) -> Image.Image:
    rgba = np.asarray(image, dtype=np.uint8).copy()
    labels, count = ndimage.label(rgba[:, :, 3] > 96, structure=np.ones((3, 3)))
    if count <= 1:
        return image
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    largest = int(sizes.argmax())
    # Retain small components near the main body (loose curls, shoe gaps) while
    # dropping remote fragments from neighboring grid cells.
    main_y, main_x = np.nonzero(labels == largest)
    left, right = main_x.min() - 36, main_x.max() + 36
    top, bottom = main_y.min() - 36, main_y.max() + 36
    keep = labels == largest
    for label in range(1, count + 1):
        if label == largest:
            continue
        ys, xs = np.nonzero(labels == label)
        if len(xs) and xs.max() >= left and xs.min() <= right and ys.max() >= top and ys.min() <= bottom:
            keep |= labels == label
    keep = ndimage.binary_dilation(keep, iterations=2)
    rgba[~keep, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def keep_only_largest_subject(image: Image.Image) -> Image.Image:
    """Keep the actor while discarding fragments from adjacent pose cells."""
    rgba = np.asarray(image, dtype=np.uint8).copy()
    labels, count = ndimage.label(rgba[:, :, 3] > 96, structure=np.ones((3, 3)))
    if count <= 1:
        return image
    sizes = np.bincount(labels.ravel())
    sizes[0] = 0
    keep = ndimage.binary_dilation(labels == int(sizes.argmax()), iterations=2)
    rgba[~keep, 3] = 0
    return Image.fromarray(rgba, "RGBA")


def apply_vertical_keep(image: Image.Image, keep: list[float] | None) -> Image.Image:
    if not keep:
        return image
    top, bottom = keep
    cropped = image.crop((0, int(image.height * top), image.width, int(image.height * bottom)))
    return trim(cropped, padding=8)


def extract(config_path: Path) -> None:
    config_path = config_path.resolve()
    config = json.loads(config_path.read_text(encoding="utf-8"))
    root = config_path.parent

    pose_sheet = Image.open(root / config["sources"]["poses"]).convert("RGB")
    for name, rect in config["poseCrops"].items():
        x, y, width, height = (int(value) for value in rect)
        sprite = pose_sheet.crop((x, y, x + width, y + height))
        sprite = trim(keep_only_largest_subject(remove_white_background(sprite)), padding=14)
        output = root / "poses" / f"{name}.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(output, optimize=True)
        print(f"pose {name}: {sprite.width}x{sprite.height}")

    parts_sheet = Image.open(root / config["sources"]["parts"]).convert("RGB")
    key = sample_key(parts_sheet)
    vertical_keep = config.get("verticalKeep", {})
    for index, name in enumerate(PART_NAMES):
        column = index % 4
        row = index // 4
        left = round(column * parts_sheet.width / 4)
        top = round(row * parts_sheet.height / 3)
        right = round((column + 1) * parts_sheet.width / 4)
        bottom = round((row + 1) * parts_sheet.height / 3)
        sprite = trim(keep_largest_subject(remove_chroma(parts_sheet.crop((left, top, right, bottom)), key)))
        sprite = apply_vertical_keep(sprite, vertical_keep.get(name))
        output = root / "parts" / f"{name}.png"
        output.parent.mkdir(parents=True, exist_ok=True)
        sprite.save(output, optimize=True)
        print(f"part {name}: {sprite.width}x{sprite.height}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Pass an extraction-map.json path")
    extract(Path(sys.argv[1]))
