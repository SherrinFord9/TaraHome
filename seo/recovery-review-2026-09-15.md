# Search recovery follow-up, September 15, 2026

## Result

Indexing has improved; traffic has not meaningfully recovered. Fresh authenticated
URL inspections show all four September 8 priority URLs indexed. No manual action,
security issue, sitemap failure, or host outage was reported in the checked views.
This is not evidence that the site has regained its previous rankings.

## Completed-day performance

Source: a fresh three-month Search Console Web export, with daily data through
September 13, plus a separate last-seven-days comparison export for recent page
rows. Raw workbooks remain in the private local audit directory. Sanitized daily
data and summaries are versioned beside this report.

| Window | Clicks | Impressions |
| --- | ---: | ---: |
| August 31-September 6 | 2 | 231 |
| September 7-13 | 3 | 216 |
| Prior matched weekdays, September 2-6 | 0 | 158 |
| Five completed post-fix days, September 9-13 | 2 | 165 |
| Previous 28 days, July 20-August 16 | 15 | 3,440 |
| Latest 28 days, August 17-September 13 | 15 | 1,081 |

The week gained one click but lost 15 impressions (6.49%). Calling the click
change a 50% recovery would hide the tiny sample. The 28-day impressions decline
is 68.58%, but most of that window predates September 8. It does not show that the
recent repairs caused another collapse. September 14-15 are excluded, not zeros.
Average position also changes with the mix of queries and is not a standalone
measure of recovery. Search Console does not establish kit inquiries or revenue.

## Current Google index evidence

These statuses came from entering each canonical URL into URL Inspection again.
Opening an old inspection URL can show its saved September 8 snapshot.

| Page | September 15 status | Last crawl displayed |
| --- | --- | --- |
| Homepage | Indexed | September 8, 10:14:05 AM |
| IKEA direct pairing | Indexed | September 8, 10:16:26 AM |
| Bluetooth proxy | Indexed | September 8, 10:16:26 AM |
| Main LAN versus IoT VLAN | Indexed | August 27, 1:38:27 AM |
| Energy Dashboard versus utility bill (August 22) | Discovered, not indexed | N/A |
| Washing-machine finished notification (September 8) | Discovered, not indexed | N/A |
| Trash reminder (September 9) | Discovered, not indexed | N/A |
| Wake-up light (September 13) | Unknown to Google | N/A |

The indexed pages have successful fetches, crawling and indexing allowed, a
recognized sitemap, and Google-selected canonical equal to the inspected URL.
The VLAN page's old crawl timestamp is a useful reminder that last crawl and
index inclusion are different facts. This review cannot attribute reindexing to
one particular repair or claim every recovered page was recrawled afterward.

The aggregate Pages report is still dated September 3 (145 indexed, 48 excluded).
It is stale for this follow-up. The sitemap reports Success, last read September
10, with 178 discovered pages. The live sitemap now contains 183 URLs, including
articles published after that read. Being unknown two days after publication
does not itself prove a defect.

Crawl Stats through September 12 reports 1,299 requests, 95% HTTP 200, a 105ms
average response, and no problems for either host. These are crawl-response
figures, not a Lighthouse measurement or proof that every resource always works.
Manual Actions and Security Issues both report no issues detected.

The washing-machine guide passed Google's live availability test on September 15
at 8:18 AM. One indexing request was accepted into the priority crawl queue.
That is not confirmation of indexing. No repeat requests were sent for the four
already indexed priority URLs.

## Daily publishing

The cron published one new article on every date September 9-15: trash reminders,
door-left-open notifications, low-battery alerts, scene snapshot/restore, wake-up
lights, actionable notifications, and heating schedules. September 8's laundry
guide was already verified in the previous review.

Today's runner status is `published`, with commit `9bb3614`. Its exact
[Pages deployment succeeded](https://github.com/SherrinFord9/TaraHome/actions/runs/34974041777),
and the live heating-schedule guide returned 200 with the correct date and title.
Seven new articles since the last review are publication progress, not seven
indexed pages or evidence of recovered demand.

Keep the existing one-new-article maximum, 06:00 primary and 18:00 retry. The
launcher reads the runner and prompt from remote main; the user's unfinished
August draft remains untouched in the original working directory.

## Targeted changes

Two established pages still have impressions and contain concrete problems worth
fixing independently of rankings. The recent comparison gives Energy sensor
missing 14 impressions versus 13, and wall tablets 4 versus 2, both with zero
clicks. These small samples do not justify another keyword or title pivot.

1. Energy sensor missing: distinguish power fields from energy fields, stop
   implying Integral converts amps to kWh, explain correct counter-reset handling,
   add actual W-to-kWh helper steps and a 100 W/two-hour worked example, and avoid
   promising accuracy merely because the next Utility Meter cycle has started.
   Add contextual next steps to the energy-bill and washing-machine guides.
2. Wall tablet: remove the false implication that a non-admin login plus hidden
   cards enforces room-only permissions. Explain the visibility/authorization
   distinction, identify the Fully PLUS Remote Admin requirement, and add setup
   and harmless wake/reconnect/access checks.
3. Add honest documentation-based authorship disclosures to these two refreshes,
   align their visible FAQs with structured answers, and preserve original
   publication dates. Only their modified dates and sitemap lastmods change.
4. Point the daily cron to this dated evidence. Add explicit technical checks for
   units, permissions, paid prerequisites, and safe verification to proofreading.
   Continue flagging existing-page refreshes separately, not letting the daily
   writer rewrite established posts or the homepage.

No homepage redesign, bulk metadata migration, title change, new URL, image
replacement, forced platform rotation, or publishing-volume increase is included.
The two refreshes retain Tara Avenir, centered reading columns, and their unique
responsive cover images. Hardware behavior was researched, not physically tested.

## Verification

Both refreshed articles pass publishing checks for links, dates, metadata, TLDRs,
images, and index entries. Site-wide typography, layout, editorial-copy, cover,
and protected SEO-intent gates pass. All 18 runner/importer/publishing tests pass.

Chromium checks at 1440x1000 and 390x844 confirm readable headings, bylines, TLDRs
and correction sections, loaded responsive covers, regular-weight Tara Avenir,
centered article bodies, and no horizontal document overflow. Screenshots remain
outside the public repository. These checks verify presentation and publishing
integrity, not real Home Assistant hardware, rankings, or human expert review.

## Next measurement

Review on September 22 with completed days, using the same sitewide windows and
a separate recent page comparison. Reinspect the waiting guides and the two
refreshed URLs before declaring their content changes a ranking failure. Track
non-brand query/page evidence where available, without summing incomplete query
rows as site totals. Use actual kit inquiries separately for business outcomes.

Prioritize documented usefulness and genuine first-hand evidence for subsequent
refreshes. Do not restore incorrect historical protocol claims, buy backlinks,
spam communities, mass-delete pages, or duplicate an unindexed existing topic.
Google indexing and quality reassessment have no promised completion date.

## References

- [Google: diagnosing traffic drops](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops)
- [Google: URL Inspection and live-test limits](https://support.google.com/webmasters/answer/9012289)
- [Home Assistant Energy FAQ](https://www.home-assistant.io/docs/energy/faq/)
- [Integral helper](https://www.home-assistant.io/integrations/integration/)
- [Utility Meter](https://www.home-assistant.io/integrations/utility_meter/)
- [Sensor state classes](https://developers.home-assistant.io/docs/core/entity/sensor/)
- [Dashboard visibility](https://www.home-assistant.io/dashboards/views/#visible)
- [Authorization checks](https://developers.home-assistant.io/docs/auth_permissions/)
- [Fully Kiosk integration](https://www.home-assistant.io/integrations/fully_kiosk/)
