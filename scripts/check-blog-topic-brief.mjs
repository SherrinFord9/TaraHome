#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const schedule = JSON.parse(fs.readFileSync(path.join(repo, 'seo', 'article-schedule.json'), 'utf8'));
const args = process.argv.slice(2);
const errors = [];

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1].trim() : '';
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&nbsp;', ' ');
}

function plainText(value) {
  return decodeHtml(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function extract(html, pattern) {
  const match = html.match(pattern);
  return match ? plainText(match[1]) : '';
}

function attribute(tag, name) {
  const match = String(tag || '').match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return match ? decodeHtml(match[2]) : '';
}

function nonEmptyString(value, label, minimum = 1) {
  if (typeof value !== 'string' || value.trim().length < minimum) {
    errors.push(`${label} must be a specific string of at least ${minimum} characters.`);
    return '';
  }
  return value.trim();
}

function parseRecentDate(value, label, windowDays) {
  const text = nonEmptyString(value, label);
  if (!text) return null;
  const parsed = new Date(text.length === 10 ? `${text}T12:00:00Z` : text);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${label} is not a valid date: ${text}.`);
    return null;
  }

  const now = new Date();
  const ageDays = (now.getTime() - parsed.getTime()) / 86_400_000;
  if (ageDays < -2) errors.push(`${label} is in the future: ${text}.`);
  if (ageDays > windowDays) errors.push(`${label} is older than the ${windowDays}-day research window: ${text}.`);
  return parsed;
}

function validHttpUrl(value, label) {
  const text = nonEmptyString(value, label);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url;
  } catch {
    errors.push(`${label} must be an absolute HTTP(S) URL: ${text}.`);
    return null;
  }
}

const articleArg = valueAfter('--article');
if (!articleArg) errors.push('Use --article with blog/<slug>/index.html.');

const articleFile = articleArg ? path.resolve(repo, articleArg) : '';
const relativeArticle = articleFile ? path.relative(repo, articleFile).replaceAll(path.sep, '/') : '';
const articleMatch = relativeArticle.match(/^blog\/([^/]+)\/index\.html$/);
if (articleArg && !articleMatch) errors.push(`Article must use blog/<slug>/index.html; received ${relativeArticle}.`);
if (articleMatch && !fs.existsSync(articleFile)) errors.push(`Article does not exist: ${relativeArticle}.`);

const slug = articleMatch?.[1] || '';
const briefArg = valueAfter('--brief') || (slug ? `seo/topic-briefs/${slug}.json` : '');
const briefFile = briefArg ? path.resolve(repo, briefArg) : '';
const relativeBrief = briefFile ? path.relative(repo, briefFile).replaceAll(path.sep, '/') : '';
if (slug && relativeBrief !== `seo/topic-briefs/${slug}.json`) {
  errors.push(`Topic brief must be seo/topic-briefs/${slug}.json; received ${relativeBrief}.`);
}
if (briefFile && !fs.existsSync(briefFile)) errors.push(`Topic brief does not exist: ${relativeBrief}.`);

let brief = {};
if (briefFile && fs.existsSync(briefFile)) {
  try {
    brief = JSON.parse(fs.readFileSync(briefFile, 'utf8'));
  } catch (error) {
    errors.push(`Topic brief is not valid JSON: ${error.message}`);
  }
}

const researchReviewWindowDays = Number(schedule.dailyStrategy?.researchReviewWindowDays || 14);
const minimumCandidates = Number(schedule.dailyStrategy?.minimumCandidatesCompared || 3);
const minimumSignals = Number(schedule.dailyStrategy?.minimumIndependentDemandSignals || 2);
const minimumCommunitySignals = Number(schedule.dailyStrategy?.minimumCommunitySignals || 1);
const legacyMinimumScore = Number(schedule.dailyStrategy?.minimumSelectionScore || 0);
const allowedSignalSources = new Set(schedule.demandSignalSources || [
  'reddit',
  'home-assistant-community',
]);
const communitySignalSources = new Set([
  'reddit',
  'home-assistant-community',
  'github',
  'official-forum',
  'vendor-community',
  'other-community',
]);

if (Object.keys(brief).length) {
  if (![1, 2].includes(brief.version)) errors.push('Topic brief version must be 1 or 2.');
  if (brief.slug !== slug) errors.push(`Topic brief slug must be "${slug}".`);

  const primaryQuery = nonEmptyString(brief.primaryQuery, 'primaryQuery', 12);
  nonEmptyString(brief.readerQuestion, 'readerQuestion', 30);
  nonEmptyString(brief.selectedBecause, 'selectedBecause', 60);
  parseRecentDate(brief.researchedAt, 'researchedAt', researchReviewWindowDays);

  if (brief.version === 2) {
    const candidates = Array.isArray(brief.candidatesConsidered) ? brief.candidatesConsidered : [];
    if (candidates.length < minimumCandidates) {
      errors.push(`candidatesConsidered must compare at least ${minimumCandidates} viable queries before selection.`);
    }

    const selectedQueries = [];
    const candidateQueries = new Set();
    candidates.forEach((candidate, index) => {
      const label = `candidatesConsidered[${index}]`;
      const query = nonEmptyString(candidate?.query, `${label}.query`, 12);
      nonEmptyString(candidate?.evidenceSummary, `${label}.evidenceSummary`, 40);
      nonEmptyString(candidate?.reason, `${label}.reason`, 30);
      if (!['selected', 'rejected'].includes(candidate?.decision)) {
        errors.push(`${label}.decision must be "selected" or "rejected".`);
      }
      if (query) {
        const normalizedQuery = normalize(query);
        if (candidateQueries.has(normalizedQuery)) errors.push(`${label}.query repeats another candidate.`);
        candidateQueries.add(normalizedQuery);
        if (candidate.decision === 'selected') selectedQueries.push(normalizedQuery);
      }
    });

    if (selectedQueries.length !== 1) {
      errors.push('candidatesConsidered must contain exactly one selected query.');
    } else if (primaryQuery && selectedQueries[0] !== normalize(primaryQuery)) {
      errors.push('The selected candidate query must match primaryQuery exactly after normalization.');
    }
  }

  const signals = Array.isArray(brief.demandSignals) ? brief.demandSignals : [];
  if (signals.length < minimumSignals) {
    errors.push(`demandSignals must contain at least ${minimumSignals} independent demand URLs.`);
  }

  const signalUrls = new Set();
  const communitySignalUrls = new Set();
  signals.forEach((signal, index) => {
    const label = `demandSignals[${index}]`;
    if (!allowedSignalSources.has(signal?.source)) {
      errors.push(`${label}.source must be one of: ${[...allowedSignalSources].join(', ')}.`);
    }
    const url = validHttpUrl(signal?.url, `${label}.url`);
    if (url) {
      const normalizedUrl = url.href.replace(/\/$/, '');
      signalUrls.add(normalizedUrl);
      if (communitySignalSources.has(signal.source)) communitySignalUrls.add(normalizedUrl);
      if (signal.source === 'reddit' && !/(^|\.)reddit\.com$/i.test(url.hostname)) {
        errors.push(`${label}.url must point to Reddit when source is "reddit".`);
      }
      if (signal.source === 'home-assistant-community' && url.hostname !== 'community.home-assistant.io') {
        errors.push(`${label}.url must point to community.home-assistant.io.`);
      }
      if (signal.source === 'google-search' && !/(^|\.)google\.[a-z.]+$/i.test(url.hostname)) {
        errors.push(`${label}.url must point to Google when source is "google-search".`);
      }
      if (signal.source === 'github' && url.hostname !== 'github.com') {
        errors.push(`${label}.url must point to github.com when source is "github".`);
      }
    }
    parseRecentDate(signal?.observedAt, `${label}.observedAt`, researchReviewWindowDays);
    nonEmptyString(signal?.evidence, `${label}.evidence`, 40);
  });
  if (signalUrls.size < minimumSignals) errors.push('Demand signals must use independent URLs, not repeated links.');
  if (communitySignalUrls.size < minimumCommunitySignals) {
    errors.push(`Demand signals must include at least ${minimumCommunitySignals} independent community URL(s).`);
  }

  const searchReview = brief.searchReview || {};
  const searchedQuery = nonEmptyString(searchReview.query, 'searchReview.query', 12);
  if (primaryQuery && searchedQuery && normalize(primaryQuery) !== normalize(searchedQuery)) {
    errors.push('searchReview.query must match primaryQuery exactly after normalization.');
  }
  parseRecentDate(searchReview.reviewedAt, 'searchReview.reviewedAt', researchReviewWindowDays);
  nonEmptyString(searchReview.intent, 'searchReview.intent', 12);
  nonEmptyString(searchReview.resultGap, 'searchReview.resultGap', 60);
  const reviewedResults = Array.isArray(searchReview.resultsReviewed) ? searchReview.resultsReviewed : [];
  if (reviewedResults.length < 2) errors.push('searchReview.resultsReviewed must contain at least two competing result URLs.');
  const resultUrls = new Set();
  reviewedResults.forEach((value, index) => {
    const url = validHttpUrl(value, `searchReview.resultsReviewed[${index}]`);
    if (url) resultUrls.add(url.href.replace(/\/$/, ''));
  });
  if (resultUrls.size < 2) errors.push('Search review must use at least two distinct result URLs.');

  const officialSources = Array.isArray(brief.officialSources) ? brief.officialSources : [];
  if (!officialSources.length) errors.push('officialSources must contain at least one current primary source.');
  officialSources.forEach((source, index) => {
    const label = `officialSources[${index}]`;
    nonEmptyString(source?.name, `${label}.name`, 5);
    validHttpUrl(source?.url, `${label}.url`);
    nonEmptyString(source?.supports, `${label}.supports`, 30);
  });

  const existingCoverage = brief.existingCoverage || {};
  if (existingCoverage.checked !== true) errors.push('existingCoverage.checked must be true.');
  nonEmptyString(existingCoverage.decision, 'existingCoverage.decision', 60);
  if (!Array.isArray(existingCoverage.closestUrls)) errors.push('existingCoverage.closestUrls must be an array.');
  (existingCoverage.closestUrls || []).forEach((value, index) => {
    const url = nonEmptyString(value, `existingCoverage.closestUrls[${index}]`);
    if (url && !url.startsWith('/')) errors.push(`existingCoverage.closestUrls[${index}] must be a site-relative path.`);
  });

  if (brief.version === 1) {
    const score = brief.selectionScore || {};
    const positiveKeys = ['communityDemand', 'queryClarity', 'answerability', 'siteFit', 'freshness', 'resultGap'];
    const ranges = {communityDemand: 3, queryClarity: 2, answerability: 2, siteFit: 2, freshness: 2, resultGap: 2};
    let computedScore = 0;
    positiveKeys.forEach((key) => {
      const value = score[key];
      if (!Number.isInteger(value) || value < 0 || value > ranges[key]) {
        errors.push(`selectionScore.${key} must be an integer from 0 to ${ranges[key]}.`);
      } else {
        computedScore += value;
      }
    });
    if (!Number.isInteger(score.cannibalizationRisk) || score.cannibalizationRisk < 0 || score.cannibalizationRisk > 3) {
      errors.push('selectionScore.cannibalizationRisk must be an integer from 0 to 3.');
    } else {
      computedScore -= score.cannibalizationRisk;
    }
    if (score.total !== computedScore) errors.push(`selectionScore.total must equal the computed score ${computedScore}.`);
    if (computedScore < legacyMinimumScore) {
      errors.push(`Selection score ${computedScore} is below the required legacy minimum of ${legacyMinimumScore}.`);
    }
  }
}

if (articleFile && fs.existsSync(articleFile)) {
  const html = fs.readFileSync(articleFile, 'utf8');
  const title = extract(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const h1 = extract(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const descriptionTag = (html.match(/<meta\b[^>]*\bname=["']description["'][^>]*>/i) || [])[0] || '';
  const description = attribute(descriptionTag, 'content');
  for (const [label, value] of [['HTML title', title], ['H1', h1], ['meta description', description]]) {
    if (!normalize(value)) errors.push(`${label} must not be empty.`);
  }
}

if (errors.length) {
  console.error(`Blog topic brief check FAIL (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

const briefSummary = brief.version === 2
  ? 'candidate comparison, demand, search intent, official sources, and distinct coverage'
  : 'legacy demand, search intent, official sources, and distinct coverage';
console.log(`Blog topic brief check PASS: ${relativeBrief} documents ${briefSummary}.`);
