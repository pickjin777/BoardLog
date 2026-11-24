#!/usr/bin/env python3
"""Redraw BoardLog shell art: a gold chest on navy #0E1628.

No purple. Icons, maskable and adaptive layers, splashes, and the Play
graphic are drawn here and written over the PNGs already in the tree.
The Korean line on the feature graphic and splash uses the system
WenQuanYi Micro Hei file when it is installed. That font is not copied
into the app. Pillow is a local drawing tool, not an app dependency.

Adaptive foreground keeps the chest inside the 66dp safe circle on a
108dp canvas. Maskable art keeps it inside the center 80%.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
NAVY = (0x0E, 0x16, 0x28, 255)
BROWN = (0x3A, 0x2C, 0x22, 255)
LID = (0x5C, 0x46, 0x32, 255)
GOLD = (0xE2, 0xB6, 0x57, 255)
GOLD_HI = (0xF3, 0xD4, 0x8A, 255)
CREAM = (0xF6, 0xEB, 0xD4, 255)
INK = (0x1C, 0x16, 0x0E, 255)
FONT_CANDIDATES = (
    '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
)

# Chest width as a fraction of the shorter side. Foreground and maskable
# stay inside the circular safe zones (radius 33/108 and 0.40).
FIT = {
    'full': 0.62,
    'maskable': 0.52,
    'foreground': 0.40,
    'splash': 0.42,
}


def font(size: int) -> ImageFont.ImageFont | None:
    for path in FONT_CANDIDATES:
        if Path(path).is_file():
            return ImageFont.truetype(path, size)
    return None


def rounded(draw: ImageDraw.ImageDraw, box, radius: float, fill) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill)


def chest(draw: ImageDraw.ImageDraw, cx: float, cy: float, width: float) -> None:
    """Gold-framed chest. The body sits slightly below the center so the lid reads."""
    stroke = max(2.0, width * 0.055)
    body_h = width * 0.58
    x0 = cx - width / 2
    y0 = cy - body_h * 0.08
    x1 = cx + width / 2
    y1 = y0 + body_h
    radius = width * 0.1
    rounded(draw, (x0, y0, x1, y1), radius, GOLD)
    inset = stroke
    rounded(
        draw,
        (x0 + inset, y0 + inset, x1 - inset, y1 - inset),
        max(2.0, radius - inset * 0.4),
        BROWN,
    )
    lid_h = width * 0.36
    lx0, lx1 = x0 + width * 0.06, x1 - width * 0.06
    ly0, ly1 = y0 - lid_h * 0.72, y0 + width * 0.1
    rounded(draw, (lx0, ly0, lx1, ly1), width * 0.14, GOLD)
    rounded(
        draw,
        (lx0 + inset, ly0 + inset, lx1 - inset, ly1 - inset * 0.3),
        max(2.0, width * 0.1),
        LID,
    )
    draw.rectangle((x0 + inset, y0 - stroke * 0.15, x1 - inset, y0 + stroke * 0.85), fill=GOLD)
    clasp_w, clasp_h = width * 0.18, width * 0.24
    rounded(
        draw,
        (cx - clasp_w / 2, y0 - clasp_h * 0.35, cx + clasp_w / 2, y0 + clasp_h * 0.85),
        width * 0.04,
        GOLD_HI,
    )
    rounded(
        draw,
        (
            cx - clasp_w / 2 + stroke * 0.35,
            y0 - clasp_h * 0.35 + stroke * 0.35,
            cx + clasp_w / 2 - stroke * 0.35,
            y0 + clasp_h * 0.85 - stroke * 0.35,
        ),
        width * 0.03,
        GOLD,
    )
    hole = width * 0.035
    draw.ellipse((cx - hole, y0 + clasp_h * 0.15 - hole, cx + hole, y0 + clasp_h * 0.15 + hole), fill=INK)


def supersample(width: int, height: int, paint, scale: int = 4) -> Image.Image:
    big = Image.new('RGBA', (width * scale, height * scale), (0, 0, 0, 0))
    paint(ImageDraw.Draw(big), scale)
    return big.resize((width, height), Image.Resampling.LANCZOS)


def pin_opaque_corners(image: Image.Image, color=NAVY) -> None:
    w, h = image.size
    for x, y in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        image.putpixel((x, y), color)


def draw_mark(width: int, height: int, kind: str) -> Image.Image:
    def paint(draw: ImageDraw.ImageDraw, scale: int) -> None:
        w, h = width * scale, height * scale
        if kind != 'foreground':
            draw.rectangle((0, 0, w, h), fill=NAVY)
        shorter = min(w, h)
        chest(draw, w / 2, h / 2 + shorter * 0.02, shorter * FIT[kind])

    image = supersample(width, height, paint)
    if kind != 'foreground':
        pin_opaque_corners(image)
    return image


def circle_mask(image: Image.Image) -> Image.Image:
    w, h = image.size
    scale = 4
    mask = Image.new('L', (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse((1, 1, w * scale - 2, h * scale - 2), fill=255)
    mask = mask.resize((w, h), Image.Resampling.LANCZOS)
    out = image.copy()
    out.putalpha(mask)
    return out


def draw_splash(width: int, height: int) -> Image.Image:
    label = font(max(16, int(min(width, height) * 0.075)))

    def paint(draw: ImageDraw.ImageDraw, scale: int) -> None:
        w, h = width * scale, height * scale
        draw.rectangle((0, 0, w, h), fill=NAVY)
        shorter = min(w, h)
        chest(draw, w / 2, h * 0.46, shorter * FIT['splash'])
        if label is not None:
            text = '보드로그'
            sized = font(max(16, int(shorter * 0.075)))
            if sized is None:
                return
            box = draw.textbbox((0, 0), text, font=sized)
            tw, th = box[2] - box[0], box[3] - box[1]
            draw.text(((w - tw) / 2, h * 0.72), text, font=sized, fill=CREAM)

    image = supersample(width, height, paint, scale=2 if max(width, height) > 900 else 4)
    pin_opaque_corners(image)
    return image


def draw_feature() -> Image.Image:
    width, height = 1024, 500

    def paint(draw: ImageDraw.ImageDraw, scale: int) -> None:
        w, h = width * scale, height * scale
        draw.rectangle((0, 0, w, h), fill=NAVY)
        margin = 18 * scale
        stroke = 8 * scale
        draw.rounded_rectangle((margin, margin, w - margin, h - margin), radius=28 * scale, outline=GOLD, width=stroke)
        chest(draw, w * 0.28, h * 0.52, h * 0.62)
        title_font = font(int(78 * scale))
        sub_font = font(int(32 * scale))
        if title_font is None or sub_font is None:
            return
        title = '보드로그'
        sub = '나만의 보드게임 보물 상자'
        tx = w * 0.48
        title_box = draw.textbbox((0, 0), title, font=title_font)
        draw.text((tx, h * 0.34), title, font=title_font, fill=CREAM)
        draw.text((tx, h * 0.34 + (title_box[3] - title_box[1]) + 18 * scale), sub, font=sub_font, fill=GOLD)

    image = supersample(width, height, paint, scale=2)
    pin_opaque_corners(image)
    return image.convert('RGB')


def save(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format='PNG', optimize=True)


def existing_pngs(folder: Path) -> list[Path]:
    return sorted(folder.rglob('*.png'))


def main() -> int:
    if font(20) is None:
        print('draw-brand-assets: Korean font not found; splash and feature graphic have no words', file=sys.stderr)

    public = {
        ROOT / 'public/favicon-32.png': (32, 32, 'full'),
        ROOT / 'public/apple-touch-icon.png': (180, 180, 'full'),
        ROOT / 'public/icon-192.png': (192, 192, 'full'),
        ROOT / 'public/icon-512.png': (512, 512, 'full'),
        ROOT / 'public/icon-maskable-512.png': (512, 512, 'maskable'),
        ROOT / 'assets/icon.png': (1024, 1024, 'full'),
        ROOT / 'docs/play/store-icon-512.png': (512, 512, 'full'),
    }
    for path, (w, h, kind) in public.items():
        save(draw_mark(w, h, kind), path)

    res = ROOT / 'android/app/src/main/res'
    for path in existing_pngs(res):
        with Image.open(path) as current:
            w, h = current.size
        name = path.name
        if name == 'ic_launcher_background.png':
            image = Image.new('RGBA', (w, h), NAVY)
            pin_opaque_corners(image)
        elif name == 'ic_launcher_foreground.png':
            image = draw_mark(w, h, 'foreground')
        elif name == 'ic_launcher_round.png':
            image = circle_mask(draw_mark(w, h, 'full'))
        elif name == 'ic_launcher.png':
            image = draw_mark(w, h, 'full')
        elif name == 'splash.png':
            image = draw_splash(w, h)
        else:
            print(f'skip {path}', file=sys.stderr)
            continue
        save(image, path)

    save(draw_feature(), ROOT / 'docs/play/feature-graphic-1024x500.png')
    print('draw-brand-assets: navy and gold shell art written')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
