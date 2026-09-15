#!/usr/bin/env python3
"""Read-only delivery gate. --generate-missing encodes assets, never rewrites HTML."""

import argparse
from html.parser import HTMLParser
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


class HeroImages(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.in_hero = False
        self.images = []
        self.feed(html)

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'figure':
            self.in_hero = 'hero-visual' in attrs.get('class', '').split()
        if tag == 'img' and self.in_hero:
            self.images.append(attrs)

    def handle_endtag(self, tag):
        if tag == 'figure':
            self.in_hero = False


def webp_size(file):
    with Image.open(file) as image:
        if image.format != 'WEBP':
            raise ValueError(f'Not WebP: {file}')
        image.load()
        return image.size


def variants(entry):
    source = Path(entry['source'])
    return [(source.with_name(f'{source.stem}-{width}.webp'), width)
            for width in entry['widths']]


def generate_missing(root, manifest):
    for entry in manifest['images']:
        with Image.open(root / entry['source']) as source:
            for relative, width in variants(entry):
                target = root / relative
                if target.exists():
                    continue
                if source.width < width:
                    raise ValueError(f'Refusing to upscale {entry["source"]}')
                height = round(source.height * width / source.width)
                source.convert('RGB').resize((width, height), Image.Resampling.LANCZOS).save(
                    target, 'WEBP', quality=82, method=6)
                print(f'Encoded {relative}: {target.stat().st_size} bytes')


def check(root, manifest):
    count = 0
    seen = set()
    for entry in manifest['images']:
        if not (root / entry['source']).is_file():
            raise ValueError(f'Missing preserved source: {entry["source"]}')
        candidates = variants(entry)
        for relative, width in candidates:
            target = root / relative
            if not target.is_file() or target.stat().st_size > manifest['maxDeliveryBytes']:
                raise ValueError(f'Missing or oversized delivery image: {relative}')
            if webp_size(target)[0] != width:
                raise ValueError(f'Incorrect srcset width: {relative}')
        fallback = candidates[-1][0]
        width, height = webp_size(root / fallback)
        expected = {
            'src': '/' + fallback.as_posix(),
            'srcset': ', '.join(f'/{relative.as_posix()} {width}w' for relative, width in candidates),
            'sizes': manifest['sizes'], 'width': str(width), 'height': str(height),
            'loading': 'eager', 'decoding': 'async', 'fetchpriority': 'high',
        }
        for page in entry['pages']:
            if page in seen:
                raise ValueError(f'Duplicate page in manifest: {page}')
            seen.add(page)
            images = HeroImages((root / page / 'index.html').read_text()).images
            if len(images) != 1:
                raise ValueError(f'{page}: expected one hero image')
            for attribute, value in expected.items():
                if images[0].get(attribute) != value:
                    raise ValueError(f'{page}: restore responsive hero {attribute}')
            if not images[0].get('alt', '').strip():
                raise ValueError(f'{page}: missing hero alt text')
            count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--generate-missing', action='store_true')
    args = parser.parse_args()
    manifest = json.loads((ROOT / 'seo/commercial-images.json').read_text())
    if args.generate_missing:
        generate_missing(ROOT, manifest)
    count = check(ROOT, manifest)
    print(f'Commercial image delivery PASS: {count} pages; original art preserved.')


if __name__ == '__main__':
    main()
