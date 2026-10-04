# Ekran görüntülerine numaralı pembe işaretler çizer
import sys, json
from PIL import Image, ImageDraw, ImageFont
UX = sys.argv[1]
F = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 30)
def rects(name):
    return {r[0]: r[1:5] for r in json.loads(json.load(open('%s/%s.json' % (UX, name))))}
def mark(name, items, out):
    im = Image.open('%s/%s.png' % (UX, name)).convert('RGB')
    d = ImageDraw.Draw(im)
    R = rects(name)
    for n, it in enumerate(items, 1):
        if isinstance(it, tuple) and isinstance(it[0], int):
            x, y = it
        else:
            key, where = it if isinstance(it, tuple) else (it, 'tl')
            l, t, w, h = R[key]
            x, y = {'tl': (l - 6, t - 6), 'r': (l + w + 26, t + h // 2), 'tr': (l + w - 6, t - 6)}[where]
        x = max(26, min(1894, x)); y = max(26, min(1054, y))
        d.ellipse((x - 25, y - 25, x + 25, y + 25), fill=(230, 0, 92), outline=(255, 255, 255), width=4)
        d.text((x, y + 1), str(n), font=F, fill='white', anchor='mm')
    im.resize((1280, 720), Image.LANCZOS).save('%s/%s.png' % (UX, out), optimize=True)
S = {
 'a-login': ('u-login-en', ['l-mode-xtream', 'l-mode-m3u', 'l-m3u', 'l-go']),
 'a-profiles': ('s5-profiles-en', ['pt-p1', 'pt-add', 'pt-manage']),
 'a-home': ('s1-home-en', [('rail-profiles', 'r'), ('rail-search', 'r'), ('rail-home', 'r'), ('rail-movies', 'r'), ('rail-series', 'r'), ('rail-live', 'r'), ('rail-mylist', 'r'), ('rail-settings', 'r'), 'hero-play', 'hero-info', ('hero-fav', 'tr'), 'cw-m4', (156, 1046)]),
 'a-movie': ('s2-detail-en', [(76, 330), 'd-play', 'd-restart', ('d-fav', 'tr'), 'sim-4']),
 'a-series': ('s3-series-en', ['d-play', ('d-fav', 'tr'), 'season-1', 'ep-5']),
 'a-live': ('s6-live-en', ['cat-l0', 'g0']),
 'a-search': ('u-search-en', ['k-a', 'k-sp', 'k-del', 'k-clr', (850, 125)]),
 'a-settings': ('s4-subs-en', ['tab-profile', 'sub-size', 'sub-color', 'sub-pos', (1310, 800)]),
}
for out, (name, items) in S.items():
    mark(name, items, out)
print('ok')
