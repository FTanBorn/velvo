#!/usr/bin/env python3
"""PRIVACY.md -> docs/privacy.html (GitHub Pages). Run from the repo root: python3 tools/make-privacy-page.py"""
import html, re, unicodedata

def slug(t):
    t = unicodedata.normalize('NFKD', t.lower()).replace('ı', 'i')
    t = ''.join(c for c in t if not unicodedata.combining(c))
    return re.sub(r'[^a-z0-9]+', '-', t).strip('-')

def inline(t):
    t = html.escape(t, quote=False)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', t)
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: '<a href="%s">%s</a>' % ('#' + slug(m.group(2)[1:]) if m.group(2)[0] == '#' else m.group(2), m.group(1)), t)

out, lst, sub = [], None, False
def close_sub():
    global sub
    if sub: out.append('</ul></li>'); sub = False
def close():
    global lst
    close_sub()
    if lst: out.append('</%s>' % lst); lst = None
for line in open('PRIVACY.md', encoding='utf-8').read().splitlines():
    m = re.match(r'^(#{1,3}) (.*)', line)
    if m:
        close(); n = len(m.group(1))
        out.append('<h%d id="%s">%s</h%d>' % (n, slug(m.group(2)), inline(m.group(2)), n)); continue
    m = re.match(r'^ {2,}- (.*)', line)
    if m and lst:
        if not sub: out[-1] = out[-1][:-len('</li>')]; out.append('<ul>'); sub = True
        out.append('<li>%s</li>' % inline(m.group(1))); continue
    m = re.match(r'^(\d+\.|-) (.*)', line)
    if m:
        close_sub()
        kind = 'ol' if m.group(1)[0].isdigit() else 'ul'
        if lst != kind: close(); out.append('<%s>' % kind); lst = kind
        out.append('<li>%s</li>' % inline(m.group(2))); continue
    if line.strip() == '---': close(); out.append('<hr>'); continue
    if line.strip(): close(); out.append('<p>%s</p>' % inline(line))
close()

page = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Velvo Privacy</title>
<style>
:root { --bg: #ffffff; --fg: #1d1b1e; --mut: #6a6470; --acc: #c8004f; --line: #ece6ea; --code: #f6f1f4; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #120a0e; --fg: #f3eef1; --mut: #a99fa6; --acc: #ff4d8d; --line: #2c2028; --code: #23171d; } }
:root[data-theme="dark"] { --bg: #120a0e; --fg: #f3eef1; --mut: #a99fa6; --acc: #ff4d8d; --line: #2c2028; --code: #23171d; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.6 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 40px 16px 80px; }
h1 { font-size: 32px; line-height: 1.2; margin: 8px 0 4px; }
h2 { font-size: 21px; margin: 32px 0 6px; }
p, li { color: var(--fg); } p i { color: var(--mut); }
a { color: var(--acc); } code { background: var(--code); padding: 1px 6px; border-radius: 6px; font-size: .92em; white-space: nowrap; }
hr { border: 0; border-top: 1px solid var(--line); margin: 56px 0; }
.mark { width: 56px; height: 56px; }
</style></head><body><main>
<svg class="mark" viewBox="0 0 512 512" aria-hidden="true"><rect width="512" height="512" rx="112" fill="#1c0812"/><path d="M150 112 L256 300 L362 112" fill="none" stroke="#e6005c" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/><rect x="136" y="356" width="240" height="30" rx="15" fill="#fff"/><rect x="186" y="408" width="140" height="30" rx="15" fill="#fff" fill-opacity=".55"/></svg>
%s
</main></body></html>
''' % '\n'.join(out)
open('docs/privacy.html', 'w', encoding='utf-8').write(page)
print('docs/privacy.html written')
