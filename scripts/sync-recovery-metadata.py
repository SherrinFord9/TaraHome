#!/usr/bin/env python3
"""Synchronize only the two explicitly reviewed September recovery articles."""

import html
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parents[1]
config = json.loads((root / 'seo/recovery-page-updates.json').read_text())
updates = config['pages']
files = list((root / 'blog').rglob('*.html')) + [root / 'blog.html', root / 'llms.txt']
changed = 0
for file in files:
    original = content = file.read_text()
    for update in updates:
        content = content.replace(update['oldTitle'] + ' | Tara Guides', update['title'])
        content = content.replace(update['oldTitle'], update['title'])
        if file == root / f"blog/{update['slug']}/index.html":
            soup = BeautifulSoup(content, 'html.parser')
            description = soup.select_one('meta[name=description]')['content']
            content = content.replace(html.escape(description, quote=True), html.escape(update['description'], quote=True))
            content = content.replace(description, update['description'])
            content = re.sub(r'("dateModified"\s*:\s*")[^"]+("\s*[,}])', lambda m: m[1] + config['updated'] + m[2], content)
    if content != original:
        file.write_text(content)
        changed += 1
sitemap = root / 'sitemap.xml'
content = sitemap.read_text()
for update in updates:
    pattern = r'(<loc>https://tarahome\.ai/blog/' + re.escape(update['slug']) + r'/</loc>\s*<lastmod>)[^<]+(</lastmod>)'
    content = re.sub(pattern, lambda m: m[1] + config['updated'] + m[2], content)
sitemap.write_text(content)
print(f'Synchronized the two reviewed titles across {changed} article/index/link files.')
