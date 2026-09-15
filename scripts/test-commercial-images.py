#!/usr/bin/env python3
import copy
import importlib.util
from pathlib import Path
import tempfile
import unittest

from PIL import Image

spec = importlib.util.spec_from_file_location('delivery', Path(__file__).with_name('check-commercial-images.py'))
delivery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(delivery)


class DeliveryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'page').mkdir()
        Image.new('RGB', (128, 72), 'green').save(self.root / 'art.png')
        Image.new('RGB', (64, 36), 'green').save(self.root / 'art-64.webp')
        self.manifest = {'sizes': '100vw', 'maxDeliveryBytes': 120000, 'images': [
            {'source': 'art.png', 'widths': [64], 'pages': ['page']}]}
        self.html = '<figure class="hero-visual"><img src="/art-64.webp" srcset="/art-64.webp 64w" sizes="100vw" width="64" height="36" loading="eager" decoding="async" fetchpriority="high" alt="Original artwork" /></figure>'
        self.file = self.root / 'page/index.html'
        self.file.write_text(self.html)

    def test_valid_image_and_unrelated_images(self):
        self.file.write_text('<img src="/other.png">' + self.html)
        self.assertEqual(delivery.check(self.root, self.manifest), 1)

    def test_delivery_attribute_regressions_are_blocked(self):
        for old, new in [('src="/art-64.webp"', 'src="/art.png"'),
                         ('width="64"', ''), ('sizes="100vw"', ''),
                         ('loading="eager"', 'loading="lazy"'),
                         ('srcset="/art-64.webp 64w"', ''),
                         ('fetchpriority="high"', ''), ('decoding="async"', ''),
                         ('alt="Original artwork"', 'alt=""')]:
            with self.subTest(attribute=old):
                self.file.write_text(self.html.replace(old, new))
                with self.assertRaises(ValueError):
                    delivery.check(self.root, self.manifest)

    def test_missing_or_duplicate_hero_is_blocked(self):
        for html in ['', self.html * 2]:
            self.file.write_text(html)
            with self.assertRaisesRegex(ValueError, 'one hero image'):
                delivery.check(self.root, self.manifest)

    def test_wrong_width_and_disguised_png_are_blocked(self):
        for size, format in [((32, 18), 'WEBP'), ((64, 36), 'PNG')]:
            Image.new('RGB', size).save(self.root / 'art-64.webp', format)
            with self.assertRaises(ValueError):
                delivery.check(self.root, self.manifest)

    def test_missing_and_oversized_variant_are_blocked(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['maxDeliveryBytes'] = 1
        with self.assertRaisesRegex(ValueError, 'oversized'):
            delivery.check(self.root, manifest)
        (self.root / 'art-64.webp').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing'):
            delivery.check(self.root, self.manifest)

    def test_source_and_duplicate_manifest_page_are_checked(self):
        manifest = copy.deepcopy(self.manifest)
        manifest['images'][0]['pages'].append('page')
        with self.assertRaisesRegex(ValueError, 'Duplicate page'):
            delivery.check(self.root, manifest)
        (self.root / 'art.png').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing preserved source'):
            delivery.check(self.root, self.manifest)

    def test_generation_preserves_original_html_and_existing_variant(self):
        before = {name: (self.root / name).read_bytes()
                  for name in ['art.png', 'art-64.webp', 'page/index.html']}
        self.manifest['images'][0]['widths'].append(96)
        delivery.generate_missing(self.root, self.manifest)
        self.assertEqual(delivery.webp_size(self.root / 'art-96.webp'), (96, 54))
        for name, contents in before.items():
            self.assertEqual((self.root / name).read_bytes(), contents)

    def test_generation_refuses_upscaling(self):
        self.manifest['images'][0]['widths'].append(256)
        with self.assertRaisesRegex(ValueError, 'Refusing to upscale'):
            delivery.generate_missing(self.root, self.manifest)


if __name__ == '__main__':
    unittest.main()
