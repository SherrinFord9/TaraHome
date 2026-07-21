#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1].trim() : '';
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ');
}

function plainText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? plainText(match[1]) : '';
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function containsTerm(value, term) {
  return ` ${normalize(value)} `.includes(` ${normalize(term)} `);
}

const laneRules = {
  'apple-home': {
    label: 'Apple Home',
    terms: ['apple home', 'homekit', 'siri', 'homepod', 'apple tv', 'eve', 'nanoleaf'],
  },
  'google-home': {
    label: 'Google Home',
    terms: ['google home', 'google nest', 'nest hub', 'nest wifi', 'google tv', 'gemini', 'android'],
  },
  'alexa-amazon': {
    label: 'Alexa and Amazon smart home',
    terms: ['alexa', 'amazon echo', 'echo hub', 'echo show', 'echo dot', 'eero', 'ring'],
  },
  'smartthings-samsung': {
    label: 'SmartThings and Samsung',
    terms: ['smartthings', 'samsung', 'aeotec'],
  },
  'matter-local-devices': {
    label: 'local smart-home standards and devices',
    terms: [
      'matter', 'thread', 'zigbee', 'z wave', 'no cloud', 'local smart home', 'ikea',
      'dirigera', 'aqara', 'eve', 'nanoleaf', 'philips hue', 'shelly', 'switchbot',
      'tapo', 'kasa', 'reolink', 'unifi',
    ],
  },
  'new-home-buyer-saturday': {
    label: 'Saturday new-home buyer planning',
    terms: ['new home', 'new house', 'new homeowner', 'home buyer', 'homebuyer', 'first home', 'move in', 'moving into', 'buying a home', 'building a home', 'building a smart home', 'just bought a home', 'just bought a house', 'before closing'],
  },
  'new-home-buyer-sunday': {
    label: 'Sunday new-home buyer decisions',
    terms: ['new home', 'new house', 'new homeowner', 'home buyer', 'homebuyer', 'first home', 'move in', 'moving into', 'buying a home', 'building a home', 'building a smart home', 'just bought a home', 'just bought a house', 'before closing'],
  },
};

const articleArg = valueAfter('--article');
const lane = valueAfter('--lane');
const errors = [];

if (!articleArg) errors.push('Use --article with the new canonical article path.');
if (!laneRules[lane]) errors.push(`Unknown or missing --lane value: "${lane}".`);

let articleFile = '';
let relativeArticle = '';
let html = '';
if (articleArg) {
  articleFile = path.resolve(repo, articleArg);
  relativeArticle = path.relative(repo, articleFile).replaceAll(path.sep, '/');
  if (!/^blog\/[^/]+\/index\.html$/.test(relativeArticle)) {
    errors.push(`Article must use blog/<slug>/index.html; received ${relativeArticle}.`);
  } else if (!fs.existsSync(articleFile)) {
    errors.push(`Article does not exist: ${relativeArticle}.`);
  } else {
    html = fs.readFileSync(articleFile, 'utf8');
  }
}

if (html && laneRules[lane]) {
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const rule = laneRules[lane];

  if (!title || !h1) errors.push('The article must have both a title and one visible H1.');
  if (rule.terms.length) {
    const titleMatches = rule.terms.some((term) => containsTerm(title, term));
    const h1Matches = rule.terms.some((term) => containsTerm(h1, term));
    if (!titleMatches || !h1Matches) {
      errors.push(`${rule.label} lane mismatch: both the title and H1 must center on one of: ${rule.terms.join(', ')}.`);
    }
  }

  if (['apple-home', 'google-home', 'alexa-amazon', 'smartthings-samsung', 'new-home-buyer-saturday', 'new-home-buyer-sunday'].includes(lane)) {
    if (/^home assistant\b/i.test(title) || /^home assistant\b/i.test(h1)) {
      errors.push(`${rule.label} lane mismatch: the title and H1 must lead with the required lane, not Home Assistant.`);
    }
  }

  const ikeaSpecific = /\b(ikea|dirigera|klippbok|myggbett|myggspray|timmerflotte|grillplats|alpstuga|kajplats|bilresa)\b/i.test(`${relativeArticle} ${title} ${h1}`);
  if (ikeaSpecific) {
    let recentFiles = [];
    try {
      recentFiles = execFileSync('git', [
        'log', '--since=7 days ago', '--diff-filter=A', '--name-only', '--format=', '--', 'blog/*/index.html',
      ], {cwd: repo, encoding: 'utf8'})
        .split(/\r?\n/)
        .map((entry) => entry.trim())
        .filter((entry) => /^blog\/[^/]+\/index\.html$/.test(entry) && entry !== relativeArticle);
    } catch (error) {
      errors.push(`Could not inspect the rolling seven-day IKEA limit: ${error.message}`);
    }
    const recentIkea = [...new Set(recentFiles)].filter((entry) => /\b(ikea|dirigera|klippbok|myggbett|myggspray|timmerflotte|grillplats|alpstuga|kajplats|bilresa)\b/i.test(entry));
    if (recentIkea.length >= 1) {
      errors.push(`IKEA limit exceeded: ${recentIkea.length} IKEA-specific article(s) were already added in the previous seven days.`);
    }
  }
}

if (errors.length) {
  console.error(`Blog schedule check FAIL (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Blog schedule check PASS: ${relativeArticle} matches the ${laneRules[lane].label} lane.`);
