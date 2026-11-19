"""Tiles the phone screenshots of a run (phone.mjs) into sheets, several phones wide, so
many sections can be looked at together at their real size.

    python3 scripts/variety-test/phone-sheets.py <run> [site-prefix ...]

Writes .prototype-cache/runs/<run>/phone/sheet-1.jpg, sheet-2.jpg and so on. A section
that phone.mjs flagged gets its caption in red, with what was found. Give one or more
site-id prefixes to tile only those sites.
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
if len(sys.argv) < 2:
    sys.exit("Name a run, for example: python3 scripts/variety-test/phone-sheets.py variety-3")
run = root / ".prototype-cache" / "runs" / sys.argv[1]
prefixes = sys.argv[2:]
phone = run / "phone"
manifest = json.loads((run / "phone.json").read_text())

BG, INK, DIM, RED = (24, 24, 27), (240, 240, 240), (160, 160, 165), (255, 120, 100)
W, GAP, CAP, MAXH, COLS = 390, 14, 46, 1860, 4


def font(size):
    for name in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


F1, F2 = font(13), font(11)

# Every section becomes a tile: caption above, picture below, cut if taller than a column.
tiles = []
for site, entries in manifest.items():
    if prefixes and not any(site.startswith(p) for p in prefixes):
        continue
    for e in entries:
        img = Image.open(phone / e["file"]).convert("RGB")
        cut = img.height > MAXH - CAP
        if cut:
            img = img.crop((0, 0, img.width, MAXH - CAP))
        label = " · ".join(x for x in (e["type"], e["hero"], e["variant"], e["layout"]) if x)
        tiles.append({"img": img, "title": f"{site} / {e['page']}", "label": label + (" (cut)" if cut else ""), "issues": e["issues"]})

# Flow the tiles down columns, a few columns to a sheet.
sheets, columns, column, used = [], [], [], 0
for t in tiles:
    need = CAP + t["img"].height + GAP
    if column and used + need > MAXH:
        columns.append(column)
        column, used = [], 0
        if len(columns) == COLS:
            sheets.append(columns)
            columns = []
    column.append(t)
    used += need
if column:
    columns.append(column)
if columns:
    sheets.append(columns)

for old in phone.glob("sheet-*.jpg"):
    old.unlink()
for n, cols in enumerate(sheets, 1):
    height = max(sum(CAP + t["img"].height + GAP for t in col) for col in cols) + GAP
    sheet = Image.new("RGB", (GAP + len(cols) * (W + GAP), height), BG)
    d = ImageDraw.Draw(sheet)
    for c, col in enumerate(cols):
        x, y = GAP + c * (W + GAP), GAP
        for t in col:
            d.text((x, y), t["title"], fill=RED if t["issues"] else INK, font=F1)
            d.text((x, y + 16), (t["issues"][0] if t["issues"] else t["label"])[:70], fill=RED if t["issues"] else DIM, font=F2)
            sheet.paste(t["img"], (x, y + CAP - 12))
            y += CAP + t["img"].height + GAP
    sheet.save(phone / f"sheet-{n}.jpg", quality=84)
    print(f"sheet-{n}.jpg", sheet.size, sum(len(col) for col in cols), "sections")
print(len(tiles), "sections on", len(sheets), "sheets")
