#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const keywordMapPath = path.join(repo, 'seo', 'keyword-map.json');
const keywordMap = JSON.parse(fs.readFileSync(keywordMapPath, 'utf8'));
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1 || !args[index + 1]) return '';
  return args[index + 1].trim();
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&ndash;', '-')
    .replaceAll('&mdash;', '-')
    .replaceAll('&nbsp;', ' ');
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? stripTags(match[1]) : '';
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match ? decodeHtml(match[2]) : '';
}

function readPage(file) {
  const html = fs.readFileSync(file, 'utf8');
  const descriptionTag = (html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i) || [])[0] || '';
  const canonicalTag = (html.match(/<link\b[^>]*\brel=["']canonical["'][^>]*>/i) || [])[0] || '';
  return {
    file,
    html,
    title: extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i),
    description: attribute(descriptionTag, 'content'),
    canonical: attribute(canonicalTag, 'href'),
    h1: extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i),
    h1Count: (html.match(/<h1\b/gi) || []).length,
  };
}

function fileForPath(urlPath) {
  if (urlPath === '/') return path.join(repo, 'index.html');
  return path.join(repo, urlPath.replace(/^\//, ''), 'index.html');
}

function pagePathFromFile(file) {
  const relative = path.relative(repo, file).replaceAll(path.sep, '/');
  if (relative === 'index.html') return '/';
  return `/${relative.replace(/\/index\.html$/, '')}/`;
}

const stopWords = new Set([
  'a', 'an', 'and', 'are', 'be', 'best', 'can', 'do', 'does', 'for', 'from',
  'guide', 'home', 'assistant', 'how', 'in', 'is', 'it', 'of', 'on', 'or',
  'smart', 'tara', 'the', 'this', 'to', 'use', 'with', 'without', 'you', 'your',
  'why', 'will', '2026',
]);

function normalized(value) {
  return decodeHtml(value)
    .toLowerCase()
    .replace(/\|.*$/, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function topicTokens(value) {
  return [...new Set(normalized(value).split(' ').filter((token) => token.length > 1 && !stopWords.has(token)))];
}

function score(leftValue, rightValue) {
  const left = new Set(topicTokens(leftValue));
  const right = new Set(topicTokens(rightValue));
  const shared = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size || 1;
  const smaller = Math.min(left.size, right.size) || 1;
  return {
    shared,
    jaccard: shared / union,
    containment: shared / smaller,
    leftCount: left.size,
    rightCount: right.size,
  };
}

function collectIndexFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, {withFileTypes: true})
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, 'index.html'))
    .filter((file) => fs.existsSync(file));
}

function collectComparablePages() {
  const files = new Set(keywordMap.protectedPages.map((page) => fileForPath(page.path)));
  for (const section of ['blog', 'guides']) {
    for (const file of collectIndexFiles(path.join(repo, section))) files.add(file);
  }
  return [...files].filter((file) => fs.existsSync(file)).map(readPage);
}

function validateSite() {
  const errors = [];
  const seenQueries = new Map();
  const maxTitle = keywordMap.rules.recommendedTitleMax;
  const maxDescription = keywordMap.rules.recommendedDescriptionMax;

  for (const page of keywordMap.protectedPages) {
    const query = normalized(page.primaryQuery);
    if (seenQueries.has(query)) {
      errors.push(`Duplicate protected primary query: "${page.primaryQuery}" on ${seenQueries.get(query)} and ${page.path}`);
    }
    seenQueries.set(query, page.path);

    const file = fileForPath(page.path);
    if (!fs.existsSync(file)) {
      errors.push(`Missing protected page: ${page.path}`);
      continue;
    }

    const actual = readPage(file);
    if (actual.title !== page.expectedTitle) errors.push(`${page.path} title differs from keyword map: "${actual.title}"`);
    if (actual.title.length > maxTitle) errors.push(`${page.path} title is ${actual.title.length} characters; target is ${maxTitle} or fewer.`);
    if (!actual.description || actual.description.length > maxDescription) errors.push(`${page.path} description is missing or longer than ${maxDescription} characters.`);
    if (actual.h1Count !== 1) errors.push(`${page.path} must contain exactly one H1; found ${actual.h1Count}.`);
    if (!actual.canonical) errors.push(`${page.path} is missing a canonical URL.`);
    if (/Search intent Tara can answer|Related smart home searches/i.test(actual.html)) errors.push(`${page.path} exposes internal SEO workflow language.`);
  }

  if (errors.length) {
    console.error(`SEO intent check FAIL (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`SEO intent check PASS: ${keywordMap.protectedPages.length} protected pages match unique roles, metadata, canonicals, and H1 rules.`);
}

function checkCandidate({title, query, articleFile = ''}) {
  const errors = [];
  const maxTitle = keywordMap.rules.recommendedTitleMax;
  const maxDescription = keywordMap.rules.recommendedDescriptionMax;
  let description = '';
  let candidatePath = valueAfter('--candidate-slug');

  if (articleFile) {
    const article = readPage(articleFile);
    title = article.title;
    description = article.description;
    query ||= article.h1 || article.title;
    candidatePath = pagePathFromFile(articleFile);
    if (article.h1Count !== 1) errors.push(`Article must contain exactly one H1; found ${article.h1Count}.`);
    if (!article.canonical) errors.push('Article is missing a canonical URL.');
  }

  if (!title) errors.push('Candidate title is required.');
  if (!query) errors.push('Candidate primary query is required.');
  if (title && title.length > maxTitle) errors.push(`Candidate title is ${title.length} characters; target is ${maxTitle} or fewer.`);
  if (description && description.length > maxDescription) errors.push(`Article description is ${description.length} characters; target is ${maxDescription} or fewer.`);

  const candidateText = `${query} ${title}`;
  const collisions = [];
  for (const page of collectComparablePages()) {
    const pagePath = pagePathFromFile(page.file);
    if (candidatePath && (pagePath === candidatePath || page.file === articleFile)) continue;

    const mapped = keywordMap.protectedPages.find((item) => item.path === pagePath);
    const comparisonText = [page.title, page.h1, mapped?.primaryQuery, ...(mapped?.secondaryQueries || [])].filter(Boolean).join(' ');
    const result = score(candidateText, comparisonText);
    const exactQuery = mapped && [mapped.primaryQuery, ...(mapped.secondaryQueries || [])]
      .some((mappedQuery) => normalized(mappedQuery) === normalized(query));
    const overlaps = result.shared >= keywordMap.rules.minimumSharedTopicTokens && (
      result.jaccard >= keywordMap.rules.candidateJaccardBlock ||
      result.containment >= keywordMap.rules.candidateContainmentBlock
    );

    if (exactQuery || overlaps) collisions.push({pagePath, title: page.title, exactQuery, ...result});
  }

  collisions.sort((left, right) => right.containment - left.containment || right.jaccard - left.jaccard);
  if (collisions.length) {
    errors.push(`Candidate overlaps ${collisions.length} existing page${collisions.length === 1 ? '' : 's'}. Refresh the strongest existing page or choose a distinct question.`);
  }

  if (errors.length) {
    console.error('SEO candidate check FAIL:');
    for (const error of errors) console.error(`- ${error}`);
    for (const collision of collisions.slice(0, 8)) {
      console.error(`- ${collision.pagePath} (${collision.exactQuery ? 'exact protected query' : `shared=${collision.shared}, containment=${collision.containment.toFixed(2)}, jaccard=${collision.jaccard.toFixed(2)}`}): ${collision.title}`);
    }
    process.exit(1);
  }

  console.log(`SEO candidate check PASS: "${title}" has a distinct search intent and concise metadata.`);
}

if (args.includes('--site') || args.length === 0) {
  validateSite();
} else if (args.includes('--article')) {
  const article = path.resolve(repo, valueAfter('--article'));
  if (!fs.existsSync(article)) {
    console.error(`SEO candidate check FAIL: article does not exist: ${article}`);
    process.exit(1);
  }
  checkCandidate({articleFile: article, query: valueAfter('--candidate-query')});
} else {
  checkCandidate({title: valueAfter('--candidate-title'), query: valueAfter('--candidate-query')});
}
