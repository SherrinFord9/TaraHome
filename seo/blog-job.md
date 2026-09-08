# Daily Tara article job

Use $tarahome-blog-research and $tarahome-grandma-proofread. Read
seo/article-schedule.json, its strategyInputs.latestSearchPerformance file,
seo/recovery-review-2026-09-08.md, seo/keyword-strategy.json, seo/keyword-map.json,
and existing article titles and topic briefs before choosing a question.
Use a JSON parser to read the performance summary and relevant page/query rows;
do not dump the entire export into the working context. Treat dated evidence as
historical, not as a live ranking report, and verify present-day demand separately.

This is an isolated draft worktree supplied by scripts/blog-runner.py.
Prepare exactly one useful new article per day at most. The runner owns commit,
push, quota accounting, and live deployment verification. Do not commit, push,
change branches, edit the runner, change the strategy, or edit other articles.
When checks pass, leave the draft files for the runner to validate and publish.
If no strong distinct question exists, explain why and stop without manufacturing
an article to satisfy a quota. A failed attempt is retained and the retry starts
from a new clean worktree.

Compare at least three concrete candidate questions using current Reddit or Home
Assistant Community discussions, exact-query search results, and current primary
documentation. Community interest does not establish search volume. Prefer
questions about Home Assistant and practical local automation when evidence is
comparable. Apple Home, Google Home, Alexa and other platforms are valid when the
question calls for them; no calendar-driven platform rotation. Avoid another
Thread/Matter variation already answered by a Tara page. Do not confuse cumulative
three-month page metrics with recent performance or interpret query-row totals as
sitewide totals. Record demand evidence in seo/topic-briefs/<slug>.json only.

Give the reader a direct answer in a useful 3-5 bullet TLDR, then an ordered
procedure or a concrete model comparison with clear decision criteria. Add at
least one useful original worked example, troubleshooting decision table,
configuration walkthrough, or evidence-backed product comparison. A paraphrase
of documentation and a generated cover are not enough by themselves. Match the
title to what the article actually answers; there is no Google-required word
count or hard title-length ranking limit. Keep existing URLs and topic ownership
stable. Never rerun scripts/apply-search-opportunity-metadata.mjs.

Use current primary sources for claims. Do not invent product testing, screenshots,
measurements, credentials, authors, expert review, or community statistics.
State that a guide is researched from documentation when that is its basis.
Only describe hardware as tested when real evidence exists. Add a visible
"By Tara Home" credit linked to /#about and a brief honest research-method note.
Do not call an automated proofreading pass a human or expert review.

Never put demand signals, keyword selection, competitor gaps, research notes,
"why this question keeps coming up", "worth publishing", or similar internal
editorial discussion in published copy. Sources must retain the professional
Sources / Documentation and further reading labels. Readability is not a substitute
for technical correctness or original usefulness.

Follow the skills' image requirements: unique post-local assets, actual product
imagery for product guides, no fake hardware/graphs/overlays, and visual inspection.
Keep /assets/generated/blog/<slug>/cover.png as the source image and metadata asset.
Run `uv run --with pillow scripts/optimize-blog-images.py --article blog/<slug>/index.html`
after adding the article and its library cards to create compressed responsive
WebP delivery images. Do not change other articles' image paths.

Preserve Tara Avenir typography and the existing centered layout. Update both blog
indexes, the new canonical article, its .html redirect, sitemap.xml, and llms.txt.
Use the true publication date supplied by the runner, including visible dates and
JSON-LD. Do not update old article dates for cosmetic edits. Run the skills' gates,
check local internal links and source links, inspect desktop and mobile in a
browser, then correct all findings.
Save verification screenshots and temporary test files in the external directory
named by TARAHOME_BLOG_ARTIFACTS, not in the website root. Only the article's
publishable files may remain as changes in this worktree.

Write seo/editorial-reviews/<slug>.json with this structure using concrete findings:

```json
{
  "slug": "the-article-slug",
  "action": "new",
  "publicationDate": "YYYY-MM-DD",
  "verdict": "PASS",
  "readerQuestion": "The concrete question the reader needs answered.",
  "directAnswer": "The actual recommendation, its caveat, and next step.",
  "originalContribution": "Where to find the worked example or useful comparison and what it adds.",
  "limitations": "What was not tested, uncertain support, or unavailable evidence.",
  "proofreadFixes": "Actual findings and corrections from the final proofreading pass.",
  "noInventedTesting": true,
  "intentComparedAgainstExistingPages": true,
  "claimChecks": [
    {"claim": "First important checked claim", "sourceUrl": "https://primary-source.example/page"},
    {"claim": "Second important checked claim", "sourceUrl": "https://primary-source.example/page"},
    {"claim": "Third important checked claim", "sourceUrl": "https://primary-source.example/page"}
  ],
  "browserChecks": {
    "desktop": "Viewport, readable title, working image, and layout observations.",
    "mobile": "Viewport, readable text/table behavior, image, and overflow observations."
  }
}
```

This file is an auditable editorial record, not proof of ranking quality or a
replacement for checking the article. All placeholders must be replaced.
