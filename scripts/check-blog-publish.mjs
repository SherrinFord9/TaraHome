#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const article = args[args.indexOf('--article') + 1];
if (!args.includes('--article') || !/^blog\/[a-z0-9-]+\/index\.html$/.test(article || '')) {
  throw new Error('Use --article blog/<slug>/index.html');
}
const html = fs.readFileSync(path.join(root, article), 'utf8');
const slug = article.split('/')[1];
const canonical = `https://tarahome.ai/blog/${slug}/`;
const errors = [];
const attributes = (tag) => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map((match) => [match[1].toLowerCase(), match[3]]));

const tags = [...html.matchAll(/<(?:meta|link|img|a)\b[^>]*>/gi)].map((match) => ({tag: match[0], attrs: attributes(match[0])}));
const canonicals = tags.filter(({attrs}) => attrs.rel === 'canonical');
if (canonicals.length !== 1 || canonicals[0]?.attrs.href !== canonical) errors.push('Expected exactly one self-canonical URL.');
if (tags.some(({attrs}) => /^(robots|googlebot)$/i.test(attrs.name || '') && /noindex|none/i.test(attrs.content || ''))) errors.push('Article blocks indexing.');
if ((html.match(/<h1\b/gi) || []).length !== 1) errors.push('Expected exactly one H1.');
const tldr = html.match(/<aside\b[^>]*class=["'][^"']*\btldr\b[^"']*["'][^>]*>([\s\S]*?)<\/aside>/i);
const bulletCount = (tldr?.[1].match(/<li\b/gi) || []).length;
if (bulletCount < 3 || bulletCount > 5) errors.push('TLDR must contain 3-5 useful bullets.');
if (/demand signals?|worth publishing|why this question keeps|source dump|research notes|references used\./i.test(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''))) errors.push('Internal research language is visible.');
if (!/class=["'][^"']*\barticle-byline\b/.test(html) || !/class=["'][^"']*\bresearch-method\b/.test(html)) errors.push('Missing visible authorship or honest research-method disclosure.');

for (const {tag, attrs} of tags) {
  const value = attrs.src || attrs.href;
  if (!value || /^(?:mailto:|tel:|data:|javascript:|#)/.test(value)) continue;
  const url = new URL(value.replaceAll('&amp;', '&'), canonical);
  if (url.origin !== 'https://tarahome.ai') continue;
  let target = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!target.startsWith(root + path.sep) && target !== root) { errors.push('Path escapes site root.'); continue; }
  if (url.pathname.endsWith('/')) target = path.join(target, 'index.html');
  if (!fs.existsSync(target)) errors.push('Missing internal target: ' + url.pathname);
  if (/^<img/i.test(tag)) {
    if (!attrs.width || !attrs.height) errors.push('Image needs explicit dimensions: ' + value);
    if (!url.pathname.startsWith(`/assets/generated/blog/${slug}/`) && !url.pathname.startsWith('/assets/logo/')) errors.push('Article uses an image outside its own assets: ' + value);
    if (fs.existsSync(target) && fs.statSync(target).size > 500_000) errors.push('Visible image exceeds 500 KB; serve a compressed derivative: ' + value);
  }
}

const posting = [];
for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
  try {
    const parsed = JSON.parse(match[1]);
    const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] || [parsed];
    posting.push(...nodes.filter((node) => node['@type'] === 'BlogPosting'));
  } catch { errors.push('Invalid JSON-LD.'); }
}
if (posting.length !== 1) errors.push('Expected one BlogPosting schema.');
const reviewFile = path.join(root, `seo/editorial-reviews/${slug}.json`);
if (fs.existsSync(reviewFile)) {
  const review = JSON.parse(fs.readFileSync(reviewFile, 'utf8'));
  if (review.action === 'new' && posting[0]?.datePublished !== review.publicationDate) errors.push('Publication date does not match the editorial review.');
}
for (const file of ['blog/index.html', 'blog.html', 'sitemap.xml', 'llms.txt']) {
  if (!fs.readFileSync(path.join(root, file), 'utf8').includes(`/blog/${slug}/`)) errors.push('Missing article from ' + file);
}
const redirect = fs.readFileSync(path.join(root, `blog/${slug}.html`), 'utf8');
if (!redirect.includes(canonical) || !/http-equiv=["']refresh["']/i.test(redirect)) errors.push('Legacy .html URL must redirect to the article.');

if (errors.length) {
  console.error('Blog publish check FAIL:\n' + errors.map((error) => '- ' + error).join('\n'));
  process.exit(1);
}
console.log('Blog publish check PASS: links, dates, index entries, images, and article metadata.');
