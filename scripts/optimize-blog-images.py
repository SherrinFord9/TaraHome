#!/usr/bin/env python3
"""Create responsive delivery images while retaining original cover provenance."""

import argparse
import re
from pathlib import Path

from PIL import Image


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--article', help='blog/<slug>/index.html')
    parser.add_argument('--all', action='store_true')
    args = parser.parse_args()
    if not args.all and not args.article:
        parser.error('Select --article or --all')
    root = Path(__file__).resolve().parents[1]
    articles = sorted((root / 'blog').glob('*/index.html')) if args.all else [root / args.article]
    indexes = [root / 'blog.html', root / 'blog/index.html']
    markup = {file: file.read_text() for file in articles + indexes}
    original_bytes = delivered_bytes = count = 0
    for article in articles:
        slug = article.parent.name
        cover = root / 'assets/generated/blog' / slug / 'cover.png'
        if not cover.is_file():
            continue
        with Image.open(cover) as source:
            source = source.convert('RGB')
            width, height = source.size
            variants = {}
            for size in (480, 1200):
                derivative = source.copy()
                derivative.thumbnail((size, round(size * height / width)), Image.Resampling.LANCZOS)
                derivative.save(cover.with_name(f'cover-{size}.webp'), 'WEBP', quality=82, method=6)
                variants.setdefault(derivative.width, size)
        prefix = f'/assets/generated/blog/{slug}/'
        srcset = ', '.join(f'{prefix}cover-{size}.webp {actual_width}w'
                           for actual_width, size in variants.items())
        pattern = r'<img\b[^>]*\bsrc=["\']' + re.escape(prefix) + r'cover(?:-\d+\.webp|\.png)["\'][^>]*>'
        for file in [article] + indexes:
            def replace(match):
                tag = match[0]
                for attr in ('src', 'srcset', 'sizes', 'width', 'height', 'decoding'):
                    tag = re.sub(r'\s+' + attr + r'\s*=\s*(["\']).*?\1', '', tag)
                size = 1200 if file == article else 480
                sizes = '(max-width: 720px) 100vw, 1120px' if file == article else '(max-width: 720px) 100vw, 560px'
                attrs = f' src="{prefix}cover-{size}.webp" srcset="{srcset}" sizes="{sizes}" width="{width}" height="{height}" decoding="async"'
                return tag.replace('<img', '<img' + attrs, 1)
            markup[file] = re.sub(pattern, replace, markup[file])
        original_bytes += cover.stat().st_size
        delivered_bytes += cover.with_name('cover-480.webp').stat().st_size
        count += 1
    for file, updated in markup.items():
        if updated != file.read_text():
            file.write_text(updated)
    print(f'{count} articles optimized; original covers {original_bytes:,} bytes, 480px cards {delivered_bytes:,} bytes ({100 * (1 - delivered_bytes / original_bytes):.1f}% smaller).')


if __name__ == '__main__':
    main()
