# July decline: device, country and change cohorts

Reviewed September 15, 2026. This examines the historical July collapse, not new
traffic since the September repairs. The last completed reporting day remains
September 13. It does not establish a ranking recovery or a single cause.

## Evidence

The authenticated `july-cliff-comparison.xlsx` export compares July 12-18 with
July 20-26. Its device and country counts reconcile exactly with the daily series
in `search-performance-2026-09-15.json`: 81 to zero clicks, and 9,486 to 1,206
impressions. The raw workbook remains private. Sanitized comparison rows and
Git-derived classifications are in `search-change-cohorts-2026-09-15.json`.

| Segment | Before impressions | After impressions | Change |
| --- | ---: | ---: | ---: |
| Desktop | 7,426 | 1,120 | -84.92% |
| Mobile | 1,985 | 85 | -95.72% |
| Tablet | 75 | 1 | -98.67% |
| United States | 3,221 | 580 | -81.99% |
| United Kingdom | 773 | 60 | -92.24% |
| Germany | 595 | 25 | -95.80% |
| Netherlands | 590 | 15 | -97.46% |
| Australia | 548 | 44 | -91.97% |
| Canada | 401 | 16 | -96.01% |

The broad loss is not confined to mobile or to visitors outside the US. These
country figures describe search impressions, not customer eligibility, visitor
quality, actual purchases, or the place where a kit would be installed. Mobile
quality still matters; this comparison does not rule out a site-wide effect from
mobile rendering or any other shared site change.

## July 17 change cohorts

For each exported canonical article URL, compare its HTML in commit
`9bd4bf431e3ab00e0e7fbe9c32b53f47db3e41fb` with the first parent. Title comparisons
use an HTML parser with decoded entities and normalized whitespace. Other HTML
changes remain a separate group. Do not call an article unmodified merely because
its title was not edited.

Only articles with impressions in the earlier window enter these cohort totals:

| HTML in the July 17 commit | Articles | Before impressions | After impressions | Change |
| --- | ---: | ---: | ---: | ---: |
| Title changed | 11 | 3,128 | 282 | -90.98% |
| Other HTML changed | 24 | 2,402 | 120 | -95.00% |
| HTML unchanged | 46 | 3,805 | 783 | -79.42% |

All 11 retitled articles, all 24 other-edited articles, and 42 of the 46 untouched
articles lost impressions. The unchanged IKEA guide alone went from 1,513 to 60.
The unchanged Apple TV/HomePod guide grew from 99 to 483 and accounts for 61.69%
of the unchanged group's later impressions. As a sensitivity check only, removing
that one growing row makes the remaining unchanged group 3,706 to 300 (-91.91%).
The official cohort above retains the Apple row; it must not be discarded to
manufacture a preferred conclusion.

These are descriptive groups, not an experiment. The baseline includes July 17-18
and is not entirely pre-change. Git time is not deployment or Google recrawl time.
Untouched HTML can still be affected by changed navigation, shared assets, internal
links, site-wide evaluation, later changes, demand, and competitors. Different
topics also have different starting conditions. The evidence does not exonerate
the July deployment, but does not support a promise that restoring 11 titles alone
would reverse the broader decline. Restoring factually false IKEA protocol claims
is specifically inappropriate.

## Reporting and external checks

The page table sums to 9,536 then 1,261 impressions, not the site totals of 9,486
then 1,206. This is not itself an export defect. Google aggregates page rows
differently from property-level chart totals. The query table has only five of
the earlier 81 clicks; its visible rows are not a complete account of demand.
See [Google's explanation of chart and table aggregation](https://support.google.com/webmasters/answer/7576553?hl=en).
Fragment rows such as `/#camera-kit` remain separate and are not merged into the
homepage or article cohorts.

Checked September 15: Google's [ranking update history](https://status.search.google.com/products/rGHU1u87FJnkP6W2GwMi/history)
lists no announced July update. Its June spam update began June 24, and its next
listed spam update began August 18. Google's [data anomalies record](https://support.google.com/webmasters/answer/6211453)
does not list a July 19-20 Web-report incident. That does not exclude unannounced
ranking changes or a site-specific issue; it means neither a named July update
nor a documented July reporting outage is established by these sources.

## Decision

- Keep the current stable titles, URLs and factual corrections. Do not rerun the
  bulk metadata migration or roll back the entire site on this evidence.
- Keep demand-led Home Assistant and practical home-automation research. Do not
  ban Apple/Google topics, force a platform rotation, pivot countries, or infer
  buyer demand from the incomplete query sample.
- Preserve the daily maximum of one strong distinct new article. A traffic drop
  is not a reason to fill the quota with weak or overlapping articles.
- Keep factual refreshes separate from daily publishing. Remaining commercial
  proof requires the owner's real kit details and installation evidence, not
  another round of generic keyword copy.
- On September 22, compare completed September 14-20 with September 7-13, then
  repeat on later complete weeks. Review indexed state, priority pages, devices,
  US visibility and genuine inquiries separately. One week can show direction;
  it cannot prove sustained recovery or isolate today's many changes.

Google's [traffic-drop guidance](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
recommends comparing affected segments and allowing time to evaluate substantial
improvements. Rankings can take much longer than a week to respond and are not
guaranteed. No new indexing requests, public articles, layout changes, outreach,
or real inquiry submissions were made in this review.

## Reproduce and verify

```sh
uv run --with openpyxl scripts/analyze-search-change.py /private/path/july-cliff-comparison.xlsx \
  --performance seo/search-performance-2026-09-15.json \
  --change-ref 9bd4bf431e3ab00e0e7fbe9c32b53f47db3e41fb \
  --output /tmp/search-change-cohorts.json
uv run --with openpyxl scripts/test-search-change.py
```

The importer rejects cumulative headers, unequal or mismatched periods, extra
filters, missing daily dates, duplicate labels and invalid counts. Country and
device sums must reconcile with the daily report. It does not infer site totals
from page/query rows. Eight regression cases cover these boundaries and reading
historical Git blobs rather than the current worktree.
