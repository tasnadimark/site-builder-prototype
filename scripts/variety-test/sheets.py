"""Tiles the screenshots of a test run into a few contact sheets, so twenty sites can be
compared at a glance.

    python3 scripts/variety-test/sheets.py [batch]

Writes into .prototype-cache/runs/<batch>/sheets/:
    first-screens.jpg     the first screen of all sites, one row per business type
    home-<type>.jpg       the whole Home page of the five sites of one type, side by side
    pages-<type>.jpg      every other page of those five sites, one row per site
"""

import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[2]
batch = sys.argv[1] if len(sys.argv) > 1 else "variety-1"
run = root / ".prototype-cache" / "runs" / batch
shots = run / "shots"
out = run / "sheets"
out.mkdir(exist_ok=True)

analysis = json.loads((run / "analysis.json").read_text())
manifest = json.loads((run / "shots.json").read_text())
sites = analysis["sites"]
types = []
for s in sites:
    if s["type"] not in types:
        types.append(s["type"])

BG = (24, 24, 27)
INK = (240, 240, 240)
DIM = (160, 160, 165)
PAD = 16
LABEL = 40


def font(size):
    for name in ("/System/Library/Fonts/Helvetica.ttc", "/System/Library/Fonts/Supplemental/Arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


F1, F2 = font(15), font(12)


def label(draw, x, y, site, extra=""):
    draw.text((x, y), site["name"], fill=INK, font=F1)
    note = f'{site["angle"]} · {site["look"]["preset"]} · {site.get("composition") or site["hero"]["shown"]}{extra}'
    draw.text((x, y + 19), note, fill=DIM, font=F2)


def fit(img, width, max_height=None):
    h = round(img.height * width / img.width)
    img = img.resize((width, h), Image.LANCZOS)
    if max_height and h > max_height:
        img = img.crop((0, 0, width, max_height))
    return img


# The first screen of every site, one row per type.
W = 420
tiles = [[fit(Image.open(shots / manifest[s["id"]][0]["fold"]), W) for s in sites if s["type"] == t] for t in types]
cols = max(len(r) for r in tiles)
th = tiles[0][0].height
sheet = Image.new("RGB", (PAD + cols * (W + PAD), PAD + len(tiles) * (th + LABEL + PAD)), BG)
d = ImageDraw.Draw(sheet)
for r, t in enumerate(types):
    row = [s for s in sites if s["type"] == t]
    for c, s in enumerate(row):
        x, y = PAD + c * (W + PAD), PAD + r * (th + LABEL + PAD)
        label(d, x, y, s)
        sheet.paste(tiles[r][c], (x, y + LABEL))
sheet.save(out / "first-screens.jpg", quality=86)

# Whole Home pages of one type side by side, and the other pages one row per site.
for t in types:
    row = [s for s in sites if s["type"] == t]

    W = 340
    homes = [fit(Image.open(shots / manifest[s["id"]][0]["full"]), W) for s in row]
    sheet = Image.new("RGB", (PAD + len(row) * (W + PAD), PAD + LABEL + max(h.height for h in homes) + PAD), BG)
    d = ImageDraw.Draw(sheet)
    for c, s in enumerate(row):
        x = PAD + c * (W + PAD)
        label(d, x, PAD, s)
        sheet.paste(homes[c], (x, PAD + LABEL))
    sheet.save(out / f"home-{t}.jpg", quality=84)

    W, CUT = 300, 900
    inner = [[(p["page"], fit(Image.open(shots / p["full"]), W, CUT)) for p in manifest[s["id"]][1:]] for s in row]
    cols = max((len(r) for r in inner), default=0)
    if not cols:
        continue
    heights = [max((img.height for _, img in r), default=0) for r in inner]
    sheet = Image.new("RGB", (PAD + cols * (W + PAD), PAD + sum(h + LABEL + PAD for h in heights)), BG)
    d = ImageDraw.Draw(sheet)
    y = PAD
    for s, r, h in zip(row, inner, heights):
        for c, (page, img) in enumerate(r):
            x = PAD + c * (W + PAD)
            d.text((x, y), s["name"] if c == 0 else "", fill=INK, font=F1)
            d.text((x, y + 19), page, fill=DIM, font=F2)
            sheet.paste(img, (x, y + LABEL))
        y += h + LABEL + PAD
    sheet.save(out / f"pages-{t}.jpg", quality=84)

print("sheets:", ", ".join(sorted(p.name for p in out.iterdir())))
