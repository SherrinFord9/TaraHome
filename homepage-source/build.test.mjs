import test from 'node:test';
import assert from 'node:assert/strict';
import {updateHomepage} from './html.mjs';

const original = `<!doctype html><html><head><title>Keep title</title>
<meta name="description" content="Keep description">
<link rel="preload" as="style" href="/assets/main-CHkScHI6.css" crossorigin>
<script>window.__loadTaraApp = function () {}</script>
<script>window.gtag = function () {}</script></head><body>
<div id="root"><main>Old fallback</main></div><p>Outside root</p></body></html>`;

test('only replaces root, stylesheet link and owned loader', () => {
  const result = updateHomepage(original, '<main>Real page</main>', '/assets/homepage-ABCD.js', 2026);
  for (const text of ['<title>Keep title</title>', '<meta name="description" content="Keep description">',
    '<script>window.gtag = function () {}</script>', '<p>Outside root</p>']) assert.ok(result.includes(text));
  assert.ok(result.includes('<div id="root" data-tara-render-year="2026"><main>Real page</main></div>'));
  assert.ok(result.includes('rel="stylesheet"'));
  assert.ok(!result.includes('window.__loadTaraApp'));
  assert.ok(result.includes('data-tara-home-entry>import("/assets/homepage-ABCD.js");'));
  assert.equal(updateHomepage(result, '<main>Real page</main>', '/assets/homepage-ABCD.js', 2026), result);
});

test('fails closed on missing or duplicate owned sections and bad input', () => {
  for (const source of [original.replace('id="root"', 'id="different"'),
    original.replace('</body>', '<div id="root"></div></body>'),
    original.replace('main-CHkScHI6.css', 'unknown.css')]) {
    assert.throws(() => updateHomepage(source, '<main />', '/assets/homepage-ABCD.js', 2026));
  }
  assert.throws(() => updateHomepage(original, '', 'https://other.test/x.js', 2026));
  assert.throws(() => updateHomepage(original, '', '/assets/homepage-ABCD.js', NaN));
});
