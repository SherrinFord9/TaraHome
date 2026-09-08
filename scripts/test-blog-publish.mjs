#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'tara-publish-test-'));
const canonical = 'https://tarahome.ai/blog/test-guide/';
const article = 'blog/test-guide/index.html';
const write = (name, contents) => {
  fs.mkdirSync(path.dirname(path.join(fixture, name)), {recursive: true});
  fs.writeFileSync(path.join(fixture, name), contents);
};
const baseline = `<html><head><link rel="canonical" href="${canonical}">
<script type="application/ld+json">{"@type":"BlogPosting","datePublished":"2026-09-08"}</script>
</head><body><h1>Test guide</h1><p class="article-byline">By Tara Home</p>
<p class="research-method">Based on official documentation.</p>
<aside class="tldr"><ul><li>First answer</li><li>Second answer</li><li>Main caveat</li></ul></aside>
<img src="/assets/generated/blog/test-guide/cover.webp" width="480" height="320">
</body></html>`;
try {
  write('scripts/check-blog-publish.mjs', fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'check-blog-publish.mjs')));
  for (const file of ['blog/index.html', 'blog.html', 'sitemap.xml', 'llms.txt']) write(file, canonical);
  write('blog/test-guide.html', `<meta http-equiv="refresh" content="0;url=${canonical}">`);
  write('assets/generated/blog/test-guide/cover.webp', 'fixture image');
  write('seo/editorial-reviews/test-guide.json', JSON.stringify({action: 'new', publicationDate: '2026-09-08'}));
  const cases = [
    ['valid article', baseline, true],
    ['noindex', baseline.replace('</head>', '<meta name="robots" content="noindex"></head>'), false],
    ['conflicting canonical', baseline.replace('</head>', '<link rel="canonical" href="https://example.invalid/"></head>'), false],
    ['missing image', baseline.replace('/cover.webp', '/missing.webp'), false],
    ['internal commentary', baseline.replace('</body>', '<p>Demand signals prove this was worth publishing.</p></body>'), false],
    ['wrong date', baseline.replace('2026-09-08', '2026-08-23'), false],
    ['empty TLDR', baseline.replace('<li>First answer</li><li>Second answer</li><li>Main caveat</li>', ''), false],
  ];
  for (const [name, html, expected] of cases) {
    write(article, html);
    const result = spawnSync(process.execPath, ['scripts/check-blog-publish.mjs', '--article', article], {cwd: fixture, encoding: 'utf8'});
    assert.equal(result.status === 0, expected, name + ': ' + result.stderr);
  }
  console.log(`${cases.length} publishing gate tests passed.`);
} finally {
  fs.rmSync(fixture, {recursive: true, force: true});
}
