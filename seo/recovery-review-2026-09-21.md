# Search recovery follow-up, September 21, 2026

## Bottom line

The flatline is real. Repairs and daily publishing have not yet produced a
meaningful acquisition recovery. Do not present three clicks instead of two as
a turnaround. All three current clicks appear under the exact query `tarahome`
and go to the homepage. The blog has zero clicks in the latest seven-day report.
Search Console does not identify whether these searchers are new people or buyers.

## Fresh measurements

Two authenticated Web exports were downloaded September 21: a three-month report
with its daily Chart and a separate seven-day comparison. Raw workbooks stay in
the private local audit directory; sanitized data is stored in
`search-performance-2026-09-21.json`, `search-daily-2026-09-21.csv` and
`search-comparison-2026-09-21.json`.

| Window | Clicks | Impressions |
| --- | ---: | ---: |
| September 6-12 | 2 | 205 |
| September 13-19 | 3 | 212 |
| September 7-12, matched Monday-Saturday | 2 | 174 |
| September 14-19, matched Monday-Saturday | 2 | 170 |
| July 26-August 22 | 21 | 2,700 |
| August 23-September 19 | 11 | 955 |

The latest 28 days have 64.63% fewer impressions and 47.62% fewer clicks than the
preceding 28 days. Most of that comparison predates the September 8/15 repairs;
it cannot attribute the loss to those repairs. The matched six-day view is also
flat. The export ends September 19. September 20-21 are missing, not zero.
The planned September 14-20 full-week comparison is not available yet.

US impressions fell from 111 to 72 (-35.14%) in the seven-day comparison, with two
clicks in each period. Desktop impressions were 176 to 185; mobile 28 to 27;
tablet 1 to 0. These small counts do not isolate a device-specific new defect.
Device and country sums reconcile with the daily property totals.

All three latest clicks are accounted for by the branded query and homepage.
The previous period's two clicks were one homepage click and one Eero-guide click.
Visible query impressions sum to only 51 of 212; anonymized queries are omitted.
Page impressions sum to 375, not 212: multiple URLs can contribute page-level
impressions within a property-level search appearance. Do not report their sum
as site growth or infer improved topic demand merely because many page rows rose.

For example, Bluetooth has 19 page impressions versus 8, water-leak sensors
14 versus 6, and IKEA 7 versus 0. Each still has zero clicks. Visible unbranded
examples include `home assistant bluetooth` at average position 55 on three
impressions, `esphome bluetooth proxy` at 53 on two, and
`home assistant water leak sensor` at 40 on three. These tiny samples illustrate
weak visibility for these queries, not stable keyword rankings or search volume.

## Technical and indexing evidence

Fresh checks are recorded in `search-console-review-2026-09-21.json`:

- No manual action or security issue is reported. This does not rule out
  algorithmic evaluation or establish that every page is high quality.
- Sitemap status is Success, last read September 19, with 187 discovered pages.
- Crawl Stats through September 18 shows 1,267 requests across both hosts,
  95% HTTP 200, 105ms average response and no host problems. This is not a
  browser performance measurement or proof against intermittent failures.
- The September 17 aggregate report has 145 indexed and 51 excluded URLs.
  Of those exclusions, 28 are discovered and 7 crawled but not indexed.
  The remaining redirect/noindex/canonical/404 rows are not all defects.
- Fresh inspections: IKEA remains indexed. Laundry and Spokane have become
  indexed since the prior review. Trash reminders and vacation lighting are
  discovered but not indexed, with no last crawl and a recognized sitemap.
- Live robots.txt allows crawling; sitemap, trash, vacation and today's Zigbee
  guide return 200, without an X-Robots-Tag response header. This limited HTTP
  check does not substitute for inspecting every page's HTML and rendered output.

There are two separate obstacles: existing indexed pages have little search
visibility, and some newer pages are not yet indexed. More publishing does not
itself solve either. No indexing requests were repeated in this review.

## What the cron is doing

Git history confirms one published article each day September 16-21. Today's
runner says published; its exact-commit Pages deployment is built and the Zigbee
binding article returns 200. The job is already writing Home Assistant topics:
vacation lighting, restart-safe timers, unavailable-device alerts, sunset lights,
NFC tags and Zigbee binding. This is not currently an Apple/Google rotation.

Today's internal brief compares three questions, cites community and primary
sources, checks existing coverage and includes a worked-example rationale.
Those process checks do not establish usefulness beyond competing search results
or guarantee indexing. Actual published output still needs independent review.

## Changes made in this review

The cron now reads the September 21 performance, inspection and recovery files.
Its prompt explicitly distinguishes branded clicks from discovery traffic and
warns against confusing page-impression sums with property totals. The one-article
maximum, quality gates, retry timing, topic ownership, titles, URLs, layout and
public article content are unchanged. No new article, paid link, outreach message,
contact submission, indexing request or blanket rollback was performed.

## Next work, in order

1. Review the established IKEA, Bluetooth, leak-sensor and doorbell owners against
   the actual competing answers. Add missing first-hand evidence where available:
   exact device/firmware, original pairing/settings screenshots, real limitations
   and an observed result. Do not manufacture tests or change titles just because
   these small recent samples have no clicks. Documentation-only research must
   remain labeled as such. Preserve the useful September 15 corrections.
2. Supply real buyer-page evidence: actual kit models, delivery/support terms and
   an example installed system. The September 15 commercial review records the
   missing owner-confirmed facts. Generated images cannot stand in for a real
   installation or establish product testing. This is a content priority, not a
   proven explanation of Google's July decision.
3. Review the unindexed backlog for distinct usefulness and navigation. Refresh
   useful existing owners; merge only genuinely duplicate intent with a deliberate
   redirect plan. Do not blanket-delete or noindex 35 URLs from their status alone.
4. Keep the daily maximum only for strong distinct questions; skipping remains
   allowed. Do not return to 2-6 articles daily. Keep factual refreshes separate
   from the new-article runner so they receive proper review.
5. Judge completed weeks using non-brand Google clicks, priority-page visibility,
   US impressions and genuine inquiries separately. Recheck September 14-20 once
   available, then September 21-27. A single week cannot prove lasting recovery.

## Causal limits and guidance

The July loss affected both edited and untouched articles, multiple countries and
both major device classes; see `search-change-review-2026-09-15.md`. This neither
exonerates shared site changes nor proves that restoring the old design or titles
will recover traffic. There is no verified single root cause in today's data.

Google's [traffic-drop guidance](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
recommends comparing affected segments and assessing the whole site after broad
ranking losses; substantial improvements can take weeks or months and are not
guaranteed to recover rankings. Its [content self-assessment](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
asks what original value the page adds beyond other sources. These support the
review priorities above, not a diagnosis of a specific penalty. The checked
[ranking update history](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history)
does not list a September ranking update or a July update explaining the original
cliff. Unannounced or site-specific changes remain possible.

## Reproduction

Run `uv run --with openpyxl scripts/analyze-search-export.py` with the private
three-month workbook, `--date 2026-09-21`, and the output JSON path. Run
`uv run --with openpyxl scripts/test-search-export.py` for importer regression
tests. The separate comparison dimensions come from the comparison workbook,
not the three-month Pages/Queries sheets. Inspection facts are dated UI readings.
