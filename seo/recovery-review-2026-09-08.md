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

All 175 URLs in the live sitemap returned 200, one H1, the correct self-canonical,
and no noindex on September 8. robots.txt allows crawling. The latest Pages build
succeeded. These checks rule out a current obvious serving/configuration outage;
they do not establish Google's chosen canonical, indexing status, or manual
action status. That requires authenticated Search Console access.

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

## Search Console follow-up

Compare July 12-18 with July 20-26 by page/query, then August 10-September 6 with
July 13-August 9. Inspect Manual Actions, Security Issues, Page Indexing, Crawl
Stats, and URL Inspection for homepage, IKEA, Bluetooth and a recent August post.
Record Google's last crawl date, chosen canonical, and rendered HTML. Export
Links for actual external linking evidence. An absent public search result is
not proof that a URL is unindexed.

Review on September 15 and September 22 using a new dated export. Track non-brand
clicks, total impressions, individual affected page/query pairs, and actual kit
inquiries. Do not count more published URLs as SEO progress. If the new work has
not been recrawled, distinguish that from a ranking failure. Meaningful quality
reassessment can take weeks or months.

## References

- [Google: diagnosing search traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Google Search Status Dashboard](https://status.search.google.com/summary)
- [Google: people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Google: generative AI content guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content)
- [Google: title links](https://developers.google.com/search/docs/appearance/title-link)
