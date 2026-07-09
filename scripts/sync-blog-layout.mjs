#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repo = resolve(process.cwd());
const blogDir = resolve(repo, 'blog');
const markerStart = '/* tara-blog-layout-v2:start */';
const markerEnd = '/* tara-blog-layout-v2:end */';

const layoutCss = `
      ${markerStart}
      main:not(.article) > .hero {
        margin-left: auto;
        margin-right: auto;
        max-width: 1120px;
        width: 100%;
      }
      .blog-list {
        gap: clamp(22px, 2.2vw, 32px);
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-left: auto;
        margin-right: auto;
        max-width: 1120px;
        width: 100%;
      }
      .blog-card {
        align-content: stretch;
        gap: 0;
        grid-template-rows: auto 1fr auto;
        min-height: 430px;
      }
      .blog-card > span {
        padding-bottom: 24px;
        padding-top: 28px;
      }
      .blog-card > p {
        padding-bottom: 28px;
        padding-top: 0;
      }
      .blog-card h2 {
        font-size: clamp(1.55rem, 2.1vw, 2rem);
        line-height: 1.12;
        margin-bottom: 16px;
        text-wrap: pretty;
      }
      .blog-card p {
        font-size: 1.04rem;
        line-height: 1.55;
      }
      .article {
        max-width: 1180px;
      }
      .article-hero {
        gap: clamp(36px, 4.5vw, 64px);
        margin-left: auto;
        margin-right: auto;
        max-width: 1120px;
        width: 100%;
      }
      .article-body {
        margin-left: auto;
        margin-right: auto;
        max-width: 780px;
        padding-top: clamp(34px, 4vw, 50px);
        width: 100%;
      }
      .article-body h2 {
        line-height: 1.14;
        margin-bottom: 18px;
        margin-top: clamp(48px, 5vw, 62px);
      }
      .article-body h3 {
        line-height: 1.2;
        margin-bottom: 14px;
        margin-top: 38px;
      }
      .article-body p,
      .article-body li {
        font-size: clamp(1.06rem, 1.12vw, 1.16rem);
        line-height: 1.75;
      }
      .article-body p {
        margin-bottom: 24px;
      }
      .article-body li {
        margin-bottom: 12px;
      }
      .article-body ul,
      .article-body ol {
        margin-bottom: 28px;
      }
      .article-body .callout {
        margin-bottom: 32px;
        margin-top: 32px;
        padding: 22px 24px;
      }
      .article-body .tldr {
        margin-bottom: 44px;
        padding: 24px 26px 22px;
      }
      .article-body .tldr li {
        font-size: 1.04rem;
        line-height: 1.58;
      }
      .article-cta,
      .source-list,
      .related {
        margin-left: auto;
        margin-right: auto;
        max-width: 960px;
        width: 100%;
      }
      .source-grid {
        gap: clamp(22px, 3vw, 36px);
      }
      @media (min-width: 900px) {
        .article-body .comparison-table {
          margin-left: 50%;
          max-width: none;
          transform: translateX(-50%);
          width: min(920px, calc(100vw - 64px));
        }
      }
      @media (max-width: 820px) {
        main:not(.article) > .hero {
          max-width: 38rem;
        }
        .blog-list {
          gap: 22px;
          grid-template-columns: 1fr;
          max-width: 38rem;
        }
        .blog-card {
          min-height: 0;
        }
        .article-hero {
          gap: 28px;
          max-width: 46rem;
        }
        .article-body p,
        .article-body li {
          font-size: 1.06rem;
          line-height: 1.7;
        }
        .article-cta,
        .source-list,
        .related {
          max-width: 46rem;
        }
      }
      @media (max-width: 520px) {
        .blog-card > span {
          padding-bottom: 20px;
          padding-top: 22px;
        }
        .blog-card > p {
          padding-bottom: 22px;
        }
        .blog-card h2 {
          font-size: 1.36rem;
          line-height: 1.16;
        }
        .article-body {
          max-width: calc(100vw - 44px);
          padding-top: 30px;
        }
        .article-body h2 {
          margin-top: 44px;
        }
        .article-body .tldr {
          margin-bottom: 36px;
          padding: 20px 18px 18px;
        }
      }
      ${markerEnd}`;
const renderedLayoutCss = layoutCss
  .replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,])\s*/g, '$1')
  .trim();

const targets = [resolve(repo, 'blog.html'), resolve(blogDir, 'index.html')];
for (const entry of readdirSync(blogDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const article = resolve(blogDir, entry.name, 'index.html');
  if (existsSync(article)) targets.push(article);
}

let changed = 0;
for (const path of targets) {
  if (!existsSync(path)) continue;
  const html = readFileSync(path, 'utf8');
  const start = html.indexOf(markerStart);
  const end = html.indexOf(markerEnd, start + markerStart.length);
  let next;

  if (start !== -1 && end !== -1) {
    next = `${html.slice(0, start)}${renderedLayoutCss}${html.slice(end + markerEnd.length)}`;
  } else {
    const styleEnd = html.lastIndexOf('</style>');
    if (styleEnd === -1) {
      throw new Error(`No closing style tag found in ${path}`);
    }
    next = `${html.slice(0, styleEnd)}\n      ${renderedLayoutCss}\n    ${html.slice(styleEnd)}`;
  }

  next = next.replace(/[ \t]+\n/g, '\n');

  if (next !== html) {
    writeFileSync(path, next);
    changed += 1;
  }
}

console.log(`Blog layout sync complete: ${changed} changed, ${targets.length} checked.`);
