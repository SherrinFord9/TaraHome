#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'tara-intent-test-'));
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const article = 'blog/local-voice/index.html';
const title = 'How to Set Up a Fully Local Voice Assistant in Home Assistant | Tara Guides';
const canonical = 'https://tarahome.ai/blog/local-voice/';
const baseline = `<html><head><title>${title}</title><meta name="description" content="Configure local voice.">
<link rel="canonical" href="${canonical}"></head><body><h1>Set up local voice</h1></body></html>`;
const write = (name, text) => {
  fs.mkdirSync(path.dirname(path.join(fixture, name)), {recursive: true});
  fs.writeFileSync(path.join(fixture, name), text);
};
const git = (...args) => execFileSync('git', args, {cwd: fixture, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}).trim();
try {
  write('scripts/check-seo-intent.mjs', fs.readFileSync(path.join(source, 'scripts/check-seo-intent.mjs')));
  const rules = JSON.parse(fs.readFileSync(path.join(source, 'seo/keyword-map.json'), 'utf8')).rules;
  write('seo/keyword-map.json', JSON.stringify({rules, protectedPages: []}));
  write(article, baseline);
  git('init', '--quiet');
  git('add', '.');
  git('-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '--quiet', '-m', 'Fixture baseline');
  const reference = git('rev-parse', 'HEAD');
  const refresh = ['--refresh-from-ref', reference];
  const cases = [
    ['new-article title remains strict', article, baseline, [], false, 'title is 75 characters'],
    ['unchanged legacy title', article, baseline, refresh, true, 'verified unchanged legacy title'],
    ['new prose with unchanged metadata', article, baseline.replace('</body>', '<p>Updated answer.</p></body>'), refresh, true],
    ['changed title', article, baseline.replace(title, 'Local voice'), refresh, false, 'must preserve'],
    ['changed H1', article, baseline.replace('Set up local voice</h1>', 'New question</h1>'), refresh, false, 'must preserve'],
    ['changed canonical', article, baseline.replace(canonical, 'https://tarahome.ai/blog/new-voice/'), refresh, false, 'must preserve'],
    ['oversized description still fails', article, baseline.replace('Configure local voice.', 'x'.repeat(161)), refresh, false, 'description is 161'],
    ['second H1 still fails', article, baseline.replace('</body>', '<h1>Another</h1></body>'), refresh, false, 'exactly one H1'],
    ['unversioned new article cannot claim refresh', 'blog/new-voice/index.html', baseline, refresh, false, 'Cannot read'],
    ['mutable ref rejected', article, baseline, ['--refresh-from-ref', 'HEAD'], false, 'full Git commit SHA'],
    ['missing ref rejected', article, baseline, ['--refresh-from-ref', '0'.repeat(40)], false, 'Cannot read'],
    ['ordinary concise article', article, baseline.replace(title, 'Local voice setup'), [], true],
  ];
  for (const [name, file, html, options, expected, message] of cases) {
    write(file, html);
    const result = spawnSync(process.execPath, ['scripts/check-seo-intent.mjs', '--article', file,
      '--candidate-query', 'local voice', ...options], {cwd: fixture, encoding: 'utf8'});
    const output = result.stdout + result.stderr;
    assert.equal(result.status === 0, expected, `${name}: ${output}`);
    if (message) assert.ok(output.includes(message), `${name}: ${output}`);
    if (file !== article) fs.rmSync(path.join(fixture, file));
  }
  write(article, baseline);
  write('blog/another-voice/index.html', baseline.replace(canonical, 'https://tarahome.ai/blog/another-voice/'));
  const collision = spawnSync(process.execPath, ['scripts/check-seo-intent.mjs', '--article', article,
    '--candidate-query', 'local voice', ...refresh], {cwd: fixture, encoding: 'utf8'});
  assert.equal(collision.status, 1, collision.stdout + collision.stderr);
  assert.ok(collision.stderr.includes('overlaps 1 existing page'), collision.stderr);
  console.log(`${cases.length + 1} SEO intent tests passed, including unchanged-title refresh and collision checks.`);
} finally {
  fs.rmSync(fixture, {recursive: true, force: true});
}
