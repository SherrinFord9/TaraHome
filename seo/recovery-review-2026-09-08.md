# Search and publishing review, September 8, 2026

## Measured decline

Source: `tarahome.ai-Performance-on-Search-2026-09-08.xlsx`, Web, last three months,
June 7 through September 6. The daily Chart sheet establishes the actual timeline.

| Window | Clicks | Impressions | Approximate position |
| --- | ---: | ---: | ---: |
| July 6-12 | 65 | 10,558 | 8.96 |
| July 13-19 | 78 | 7,807 | 8.99 |
| July 20-26 | 0 | 1,206 | 16.51 |
| August 31-September 6 | 2 | 231 | 19.61 |
| Previous 28 days, July 13-August 9 | 91 | 10,704 | 12.32 |
| Latest 28 days, August 10-September 6 | 14 | 1,408 | 29.31 |

Latest 28-day clicks fell 84.62%; impressions fell 86.85%. The first sharp break
was July 19-20, not August 23. The September workbook's Pages, Queries, Countries,
and Devices sheets are cumulative for the entire three-month period. Do not use
them as recent period comparisons. Daily position is weighted from rounded
averages and changes when the mix of queries changes.

The August diagnosis overstated confidence: stable average position on one page
does not establish that search demand declined. Missing low-ranking queries can
leave a better average among the surviving impressions. More URLs in a cumulative
report also does not demonstrate that new pages are currently gaining. The
August 5 query-only report did not measure site totals and has been marked as
superseded. Never use its old visibility-increased statement as the current
strategy premise.

## What the automation was doing

- One article per day, a 06:00 primary run and 18:00 retry, America/Los_Angeles.
- Last successful article commit and Pages deployment: August 22, `d2743e5`.
- August 23 left an unfinished `how-to-stop-security-camera-false-alerts` draft,
  image assets, topic brief, and modified library/sitemap files in the main folder.
- The log is interrupted after that draft. It has a null-filled gap before the
  next available August 28 entry, so the exact interruption cause is unknown.
- The subsequent available runs repeatedly stop on the same dirty worktree.
- The wrapper swallowed a no-publication result and exited successfully after a
  "finished" message. Local commits could also count as published before any
  remote or deployment verification.
- Both prompt and schedule hard-coded the August 5 query-only data. There was no
  useful feedback from the new export to the writer.
- Production research/SEO rationale survived the editorial checker because its
  patterns mostly covered source headings rather than article body copy.

## Timeline and causal limits

July 17 commit `9bd4bf4` changed the homepage/brand copy, 11 established article
titles and metadata, commercial pages, and many lastmod dates. The July 19-20
cliff is close enough to investigate that deployment, but timing alone cannot
prove that shortening titles caused a broad ranking loss. The original IKEA
article was not part of those 11 title changes.

August 5 commit `add1a91` subsequently narrowed the successful IKEA pairing guide
to a Thread-border-router requirements headline. That changed its central reader
question and overlapped existing border-router coverage. Restoring the pairing
intent is justified while keeping the August factual corrections about Zigbee
versus Matter models. The August change cannot explain the July cliff.

Google's status dashboard lists an August 18-21 spam update. It could relate to
the later deterioration, but it happened a month after the initial drop and is
not proof of a penalty. No current crawl/index incident is reported.

The article flood, repeated query variations, weak research-only introductions,
and lack of original evidence remain plausible quality problems. Technical checks
and good formatting do not establish that the content deserves to outrank the
primary documentation. Do not promise recovery after a title edit or cadence
change. AI authorship itself is not a demonstrated penalty.

## Technical audit

All 175 URLs in the original live sitemap returned 200, one H1, the correct
self-canonical, and no noindex on September 8. The post-publication check covered
176 URLs. robots.txt allows crawling, and Pages deployment succeeded. These
serving checks do not establish inclusion in Google's index. The authenticated
follow-up below found important URLs excluded despite those successful checks.

## Recovery priorities

1. Fix the writer's isolation, timeout, real exit status, and verified publication
   accounting. Keep the user's daily maximum of one new article and retry slot.
2. Use the daily performance series and honest limits of cumulative data.
3. Remove internal publishing rationale and repair unusable TLDR bullets.
4. Restore the IKEA guide's direct-pairing question; improve the Bluetooth guide's
   actual setup answer, preserving their URLs and factual corrections.
5. Require useful original examples or comparisons, current primary-source claim
   checks, honest research disclosure, and a saved proofreading record for new
   articles. A schema-valid record is not an independent expert review.
6. Freeze unrelated existing titles and commercial pages during this recovery.
   Do not rerun the historical bulk metadata migration or delete/redirect large
   groups of articles without query-by-page evidence.
7. Prioritize review of Bluetooth proxy, IKEA direct pairing, IoT VLAN, Energy
   Dashboard missing sensors, and doorbell selection. Inspect Google-selected
   canonicals and indexed rendering before deciding which topics to consolidate.

## Implemented safeguards and checks

The versioned runner creates a clean worktree from remote main for each attempt.
It limits writing to 60 minutes, rejects unrelated edits and extra articles,
requires a saved proofreading record, and independently runs the publishing
checks. It verifies the exact commit's Pages deployment and the live URL. A push
whose deployment is unverified remains a failure and is rechecked on retry.
The original August 23 draft remains untouched in the old main worktree.

Internal publishing rationale was removed from 49 articles, and the body-copy
checker now rejects it. Weak TLDR caveats were corrected in the Bluetooth,
backup, hardware migration and Zigbee coordinator migration guides. Only the
IKEA and Bluetooth guide titles were revised; other established titles are held
stable. Their research basis is disclosed instead of implying hands-on tests.

All 147 article covers now have 480px and 1200px WebP delivery variants. Original
PNGs and image provenance remain available. Combined 480px variants are 2.0 MB
versus 258 MB for the originals (99.2% smaller). Actual browser savings vary with
viewport, pixel density, selected variant and lazy loading. This is an asset-size
measurement, not a measured Lighthouse or ranking improvement.

Desktop (1440px) and mobile (390px) browser checks of the library, IKEA and
Bluetooth pages confirmed Avenir typography, loaded images and no horizontal
page overflow. Automated runner tests cover dirty-folder isolation, remote quota,
blocked unrelated edits, multiple articles, symlinks, writer commits and failed
deployment verification. The publishing gate is tested against malformed dates,
canonicals, indexing directives, images, TLDRs and internal commentary.

## Verified daily run

On September 8, the installed cron launcher ran from 08:37 to 08:55 Pacific while
the original main working folder still contained the untouched August 23 draft.
It researched three candidates, wrote a new Home Assistant washing-machine
completion guide, generated a unique laundry cover and responsive variants,
corrected proofreading findings, and saved its topic brief and editorial review.
Independent checks passed before the runner committed and pushed `af7adf9`.
[The exact commit's Pages deployment succeeded](https://github.com/SherrinFord9/TaraHome/actions/runs/34247702494),
and the runner verified the [live article and canonical](https://tarahome.ai/blog/home-assistant-washing-machine-finished-notification/)
before recording state `published` and exiting zero. The new article's configuration
was syntax-checked and compared with documentation, not run on physical hardware.

The final runner also preserves the verified article/deployment record when a
later slot meets the daily quota; dry runs do not overwrite status. Browser
artifacts are excluded from publication and future jobs have a separate artifact
directory. Sparse future performance exports no longer fail on an empty list of
large-traffic changes. Automated coverage totals 18 cases across runner behavior,
publication gates and the workbook importer.

The existing 06:00 and 18:00 cron entries remain unchanged. The local launcher
loads the runner from remote main, so it does not depend on resetting or merging
the user's unfinished main-worktree edits. Inspect the current state with
`/home/sherrinford/bin/tarahome-blog-run.sh --status`.

## Search Console follow-up

Completed with authenticated access September 8. The structured observations are
in `seo/search-console-review-2026-09-08.json`. Raw comparison workbooks remain in
the local private audit directory, not in the public website repository.

### Current indexing, not just ranking

| Canonical page | Individual inspection | Last crawl displayed |
| --- | --- | --- |
| Homepage | Crawled - currently not indexed | September 7 |
| IKEA direct pairing | Crawled - currently not indexed | September 4 |
| Bluetooth proxy | Crawled - currently not indexed | August 22 |
| Main LAN versus IoT VLAN | Crawled - currently not indexed | August 27 |
| Energy Dashboard versus utility bill | Discovered - currently not indexed | N/A |

The four crawled pages show successful fetches, crawling and indexing allowed,
and Google-selected canonical "Inspected URL". This is direct URL Inspection
evidence, not a conclusion from a missing public `site:` result. Their last crawl
dates do not reveal when they stopped being indexed or prove July's cause.

The aggregate Page Indexing report is dated September 3: 145 indexed and 48 not
indexed, including 27 discovered and 5 crawled but not indexed. It predates these
individual checks. Its five example URLs are not a current exhaustive inventory
of the affected priority pages. Do not use the 145 total as reassurance that the
previous traffic leaders are indexed.

Manual Actions and Security Issues both report no issues. There are no temporary
removal requests in the last six months. The submitted sitemap reports Success,
last read September 5, with 175 discovered pages. Some inspections show a temporary
sitemap processing error, but that is not proof that the sitemap itself is broken.
The Crawl Stats report has no host problems, 1,272 requests over 90 days, 94% HTTP
200 responses and 107ms average response time. This is not a measured page-load
time or proof that every resource and historical crawl was healthy.

### Exact period comparisons

The authenticated July comparison is July 12-18 versus July 20-26: 81 to zero
clicks and 9,486 to 1,206 impressions. Of 90 page rows with impressions in the
earlier week, 82 lost impressions and 15 lost all impressions. Examples:

| Page | Before impressions | After impressions |
| --- | ---: | ---: |
| IKEA pairing | 1,513 | 60 |
| Wall tablet dashboard | 548 | 23 |
| Doorbell selection | 403 | 29 |
| Bluetooth proxy | 355 | 40 |
| Main LAN versus IoT VLAN | 283 | 48 |
| Apple TV/HomePod border router | 99 | 483 |

This was a broad decline across established Home Assistant topics, not simply
one IKEA trend ending. The Apple/HomePod exception also contradicts a blanket
claim that adding Apple/Google topics necessarily caused the decline. Topic
selection should remain demand-led rather than forced platform rotation.

The separate latest-28-day comparison confirms 91 to 14 clicks and 10,704 to
1,408 impressions. IKEA fell from 1,312 to 15 impressions; Bluetooth from 435 to
111. Historical impressions within a reporting window do not contradict a later
inspection showing that the URL is currently not indexed.

Some lost queries wrongly describe IKEA PARASOLL or VALLHORN as Matter over
Thread. These are queries to correct, not factual claims to restore in a rollback.
Visible query rows omit anonymized searches and cannot explain all lost clicks.
The earlier daily-export analysis remains the source for the overall timeline.

### Rendering and actions

Google's homepage live HTML contained the React app, one H1, the main sections,
and self-canonical, with all resources loaded. However, two smartphone screenshot
checks showed only navigation and background. The same visual failure was
reproduced locally at 412x12000: the bottom-aligned `100dvh` hero placed the H1 at
y=11022. Google's exact viewport height is not exposed by the screenshot; the
local reproduction identifies a matching layout failure, not an observed Google
viewport dimension.

Commit `fec07e4` caps the homepage hero and its inner grid at 64rem and 56rem,
respectively, including the static fallback. Normal viewport sizing still uses
viewport units. No user-agent targeting, hidden bot-only copy, content rewrite,
new title, or canonical change was added. The source theme has the same rules so
a rebuild preserves the fix. A reusable Playwright MCP regression checks normal
mobile/desktop and 12000px-tall viewports, H1 visibility, images and overflow.
[The exact commit's Pages deployment succeeded](https://github.com/SherrinFord9/TaraHome/actions/runs/34255787818).

Google's live availability tests passed for homepage, IKEA and Bluetooth. The
IKEA screenshot and rendered HTML show the revised direct-pairing title, full
article, unique cover and TLDR. All three indexing requests were accepted into
the priority crawl queue. This is not confirmation of reindexing or recovery;
repeated submissions do not raise priority. One post-deployment homepage live
test returned Search Console's generic "Something went wrong" error. The retry
at 10:17 AM passed: Google's tested HTML contains the new cap, and its smartphone
screenshot now visibly shows the headline, hero image, buttons, kit summary and
the next feature section. The fix is verified in Google's own rendering, not
only the local browser. This does not establish that the homepage defect caused
the broader blog decline or that Google has now indexed these pages.

The Links report currently shows one external link, from technikheim.de to the
IKEA article, and 766 internal links. This is Google's reported sample, not a
complete backlink census. There is little reported external endorsement; useful
first-hand evidence and relevant earned mentions deserve attention alongside
technical work. Do not buy links or spam community discussions.

The cron now reads the authenticated evidence as well as the daily export. It
must not count publishing as recovery, duplicate an unindexed topic owner, or
restore wrong protocol claims. The one-new-article daily maximum and retry slot
are unchanged. Refresh remaining high-loss pages in separate reviewed tasks,
starting with the wall-tablet, doorbell, restart/unavailable and VLAN guides.
Do not mass-delete, redirect, or revert pages without page/query evidence.

Review on September 15 and September 22 using a new dated export. Track non-brand
clicks, total impressions, individual affected page/query pairs, and actual kit
inquiries. Inspect the four priority canonicals for actual indexed state and a
crawl after their changes. If the new work has not been recrawled, distinguish
that from a ranking failure. Meaningful quality reassessment can take weeks or
months; no specific recovery date is promised.

## References

- [Google: diagnosing search traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Google Search Status Dashboard](https://status.search.google.com/summary)
- [Google: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: generative AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
- [Google: URL Inspection and live-test limitations](https://support.google.com/webmasters/answer/9012289)
- [Google: Page Indexing report](https://support.google.com/webmasters/answer/7440203)
