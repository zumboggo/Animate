"""Split a two-column transparent talking-head sheet into aligned frames."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image


def alpha_box(image: Image.Image) -> tuple[int, int, int, int]:
    box = image.getchannel("A").getbbox()
    if not box:
        raise ValueError("Talking-head frame is empty")
    return box


def extract(sheet_path: Path, output_dir: Path) -> None:
    sheet = Image.open(sheet_path).convert("RGBA")
    split = sheet.width // 2
    cells = [sheet.crop((0, 0, split, sheet.height)), sheet.crop((split, 0, sheet.width, sheet.height))]
    subjects = [cell.crop(alpha_box(cell)) for cell in cells]
    padding = 16
    width = max(subject.width for subject in subjects) + padding * 2
    height = max(subject.height for subject in subjects) + padding * 2
    output_dir.mkdir(parents=True, exist_ok=True)

    for name, subject in zip(("head-closed-v2", "head-open-v2"), subjects, strict=True):
        frame = Image.new("RGBA", (width, height))
        left = (width - subject.width) // 2
        top = height - padding - subject.height
        frame.alpha_composite(subject, (left, top))
        frame.save(output_dir / f"{name}.png", optimize=True)
        print(f"{name}: {width}x{height}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: extract_talking_heads.py SHEET_ALPHA.png OUTPUT_DIR")
    extract(Path(sys.argv[1]), Path(sys.argv[2]))
