"""Tạo lại public/og-image.png (1200x630) — chạy khi số trò chơi thay đổi.
Cần: Pillow, font Baloo2.ttf (tải từ github.com/google/fonts/ofl/baloo2) và font emoji màu Segoe UI Emoji của Windows.
    python scripts/make_og.py [đường_dẫn_Baloo2.ttf]
"""
import io
import os
import re
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.environ.get('TEMP', '.'), 'bvtest', 'Baloo2.ttf')
EMOJI_FONT = 'C:/Windows/Fonts/seguiemj.ttf'

n = len(re.findall(r"^\s{4}id: '", io.open(os.path.join(ROOT, 'lib', 'games.ts'), encoding='utf-8').read(), re.M))
W, H = 1200, 630
im = Image.new('RGB', (W, H))
px = im.load()
for y in range(H):
    t = y / (H - 1)
    c = (int(127 + (234 - 127) * t), int(216 + (251 - 216) * t), int(247 + (255 - 247) * t))
    for x in range(W):
        px[x, y] = c
d = ImageDraw.Draw(im, 'RGBA')
for cx, cy, r, a in [(120, 90, 160, 60), (1080, 120, 120, 50), (600, 40, 70, 45), (40, 560, 90, 40), (1160, 540, 130, 45)]:
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(255, 255, 255, a))


def F(size, var='ExtraBold'):
    f = ImageFont.truetype(FONT, size)
    try:
        f.set_variation_by_name(var)
    except Exception:
        pass
    return f


def centered(text, y, font, fill, shadow=None):
    w = d.textlength(text, font=font)
    x = (W - w) / 2
    if shadow:
        d.text((x, y + 5), text, font=font, fill=shadow)
    d.text((x, y), text, font=font, fill=fill)


centered('Bé Vui Vận Động', 36, F(100), (20, 69, 107, 255), (255, 255, 255, 235))
centered(f'{n} game vận động qua camera cho bé 4–6 tuổi', 166, F(40, 'SemiBold'), (74, 118, 160, 255))
emo = ImageFont.truetype(EMOJI_FONT, 92)
tiles = [('🏃', '#FFA53D'), ('🦖', '#E0A93B'), ('🥊', '#E14D5B'), ('🎈', '#5AA9FF'), ('✋', '#8B6FEA'), ('🐟', '#3C9BFF'),
         ('🎨', '#FF7EB6'), ('🥁', '#B983FF'), ('🕒', '#3C9BFF'), ('🍉', '#FF8A3D'), ('🧠', '#6C5CE7'), ('🏄', '#2D9CDB')]
tw = th = 140
gap = 24
cols = 6
x0 = (W - (cols * tw + (cols - 1) * gap)) // 2
for i, (e, col) in enumerate(tiles):
    r, c = divmod(i, cols)
    x = x0 + c * (tw + gap)
    y = 238 + r * (th + gap)
    rgb = tuple(int(col[k:k + 2], 16) for k in (1, 3, 5))
    d.rounded_rectangle((x, y + 7, x + tw, y + th + 7), radius=28, fill=(20, 69, 107, 60))
    d.rounded_rectangle((x, y, x + tw, y + th), radius=28, fill=rgb + (255,))
    d.rounded_rectangle((x + 7, y + 7, x + tw - 7, y + th - 7), radius=22, fill=(255, 255, 255, 55))
    tmp = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    bb = td.textbbox((0, 0), e, font=emo, embedded_color=True)
    ew, eh = bb[2] - bb[0], bb[3] - bb[1]
    td.text(((tw - ew) // 2 - bb[0], (th - eh) // 2 - bb[1]), e, font=emo, embedded_color=True)
    im.paste(tmp, (x, y), tmp)
centered('Miễn phí  •  Không cần cài app  •  Chiếu lên tivi', 558, F(32, 'Bold'), (20, 69, 107, 255))
out = os.path.join(ROOT, 'public', 'og-image.png')
im.save(out, optimize=True)
print('saved', out, os.path.getsize(out), 'bytes;', n, 'games')
