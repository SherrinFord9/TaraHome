# Daily Tara article job

Use $tarahome-blog-research and $tarahome-grandma-proofread. Read
seo/article-schedule.json, the files named by its
strategyInputs.latestSearchPerformance, strategyInputs.latestSearchConsoleReview,
and strategyInputs.recoveryReview,
seo/keyword-strategy.json, seo/keyword-map.json,
and existing article titles and topic briefs before choosing a question.
Use a JSON parser to read the performance summary and relevant page/query rows;
do not dump the entire export into the working context. Treat dated evidence as
historical, not as a live ranking report, and verify present-day demand separately.

Fresh September 15 inspections confirm the homepage, IKEA direct-pairing,
Bluetooth-proxy, and main-LAN/IoT-VLAN pages are indexed. Do not repeat the older
September 8 exclusions as their current state. Traffic has not meaningfully
recovered: September 7-13 had 3 clicks and 216 impressions, versus 2 and 231 in
the previous week. Some newer guides remain discovered but not crawled. Neither
successful publication nor an indexing request proves indexing or traffic
recovery. Keep the one-per-day maximum; do not flood new URLs to compensate.
Preserve established topic owners even when they are not indexed.
Flag refresh opportunities in the internal brief for a separate task; the daily
writer still must not edit existing articles or the homepage. Do not restore
factually wrong claims to chase historical queries, including queries that
mistakenly describe PARASOLL or VALLHORN as Matter-over-Thread products.

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
Use only completed reporting days when comparing periods. A one-click change or
one-impression query is not enough to pivot the topic strategy. Separate lack of
crawling, indexed-but-low-visibility pages, and low click-through rate; they are
different observations, not interchangeable diagnoses. Cite the dated evidence
and its reporting cutoff in the internal brief when using Search Console.

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

During proofreading, check the actual behavior and prerequisites of each proposed
fix, not just whether it sounds clear. Record the important checks in claimChecks:
- Distinguish electrical current (A), real power (W/kW), and energy (Wh/kWh).
  Integral alone does not convert amps to kWh. Match the target Energy Dashboard
  field, preserve unit scaling, and do not prescribe Utility Meter merely because
  a correctly classified increasing counter resets. Use current Energy FAQ,
  Integral, Utility Meter, and sensor state-class documentation.
- Distinguish UI visibility and kiosk mode from server-enforced authorization.
  A non-admin Home Assistant account plus hidden cards or tabs does not establish
  room-only access to cameras, locks, or other entities. Check the official view
  visibility and permission documentation before making an access-control claim.
- State paid licenses and hardware prerequisites next to the recommendation,
  including Fully PLUS for the Fully Kiosk Remote Admin integration. Identify
  version-dependent settings instead of assuming every installed release matches.
- For cameras and doorbells, verify live video, physical button events, recording
  playback, and two-way talk separately for the exact model and integration mode.
  Do not equate RTSP video, a supported-device listing, or a Matter bridge with
  support for all four functions. Separate battery sleep/streaming limits from
  cloud dependence, and check existing-chime and power-supply compatibility.
  A polling interval for device status does not establish alert latency when a
  separate real-time event channel exists. State uncertainty instead of inventing
  tested compatibility, prices, or measured response times.
- Give a harmless verification step and expected result. Do not tell readers to
  delete historical data, unlock doors, or disable safety controls as a first test.

Link to an existing relevant guide when it genuinely answers the next reader
question, including recent guides. Do not add a block of unrelated links or make
new pages to compete with an existing unindexed topic owner.

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
