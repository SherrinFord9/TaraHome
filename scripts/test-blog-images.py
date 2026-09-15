#!/usr/bin/env python3
"""Keep responsive descriptors truthful for full-size and smaller product images."""

import shutil
import subprocess
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

from PIL import Image


class Images(HTMLParser):
    def __init__(self, markup):
        super().__init__()
        self.images = []
        self.feed(markup)

    def handle_starttag(self, tag, attrs):
        if tag == 'img':
            self.images.append(dict(attrs))


class BlogImagesTest(unittest.TestCase):
    def check_source(self, source_size, expected_widths):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script = root / 'scripts/optimize-blog-images.py'
            script.parent.mkdir()
            shutil.copyfile(Path(__file__).with_name(script.name), script)
            cover = root / 'assets/generated/blog/test-guide/cover.png'
            cover.parent.mkdir(parents=True)
            Image.new('RGB', source_size, '#ffffff').save(cover)
            source_bytes = cover.read_bytes()
            unrelated = '<img src="/unrelated.png" width="40" height="20">'
            markup = '<img src="/assets/generated/blog/test-guide/cover.png" alt="Product" loading="lazy">' + unrelated
            files = [root / p for p in ('blog/test-guide/index.html', 'blog.html', 'blog/index.html')]
            for file in files:
                file.parent.mkdir(parents=True, exist_ok=True)
                file.write_text(markup)
            command = [sys.executable, str(script), '--article', 'blog/test-guide/index.html']
            subprocess.run(command, check=True, capture_output=True)
            for file in files:
                html = file.read_text()
                self.assertIn(unrelated, html)
                attrs = Images(html).images[0]
                self.assertEqual(attrs['alt'], 'Product')
                self.assertEqual(attrs['loading'], 'lazy')
                self.assertEqual((int(attrs['width']), int(attrs['height'])), source_size)
                widths = []
                for candidate in attrs['srcset'].split(', '):
                    url, descriptor = candidate.rsplit(' ', 1)
                    advertised = int(descriptor.removesuffix('w'))
                    with Image.open(root / url.lstrip('/')) as image:
                        self.assertEqual(image.width, advertised)
                        self.assertLessEqual(image.width, source_size[0])
                    widths.append(advertised)
                self.assertEqual(widths, expected_widths)
                self.assertEqual(len(widths), len(set(widths)))
            self.assertEqual(cover.read_bytes(), source_bytes)
            before = [file.read_bytes() for file in files]
            subprocess.run(command, check=True, capture_output=True)
            self.assertEqual([file.read_bytes() for file in files], before)

    def test_full_size_source(self):
        self.check_source((1536, 1024), [480, 1200])

    def test_medium_manufacturer_source(self):
        self.check_source((700, 500), [480, 700])

    def test_small_source_has_no_duplicate_descriptors(self):
        self.check_source((320, 240), [320])


if __name__ == '__main__':
    unittest.main()
