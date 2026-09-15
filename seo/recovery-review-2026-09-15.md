# Search recovery follow-up, September 15, 2026

## Bluetooth setup follow-up

A later pass refreshed the established Bluetooth proxy guide without changing its
title, canonical, publication date, or image. Current official documentation
exposes a missing setup detail: Home Assistant's saved scanning mode owns the
running choice for an already connected ESPHome proxy. The update adds that check,
a manual IP/API connection path, exact installer board/revision boundaries, a
three-slot capacity example, and a harmless sensor-reading check. It scopes the
battery-saving claim to scan-related drain, not total battery life. Four comparison
tables are keyboard-scrollable, and visible/schema FAQ answers agree.

The page's latest completed-week impressions were 10 versus 4, with zero clicks.
This is a reason to inspect an established owner, not proof of recovery or grounds
for another keyword/title pivot. Detailed sources and verification boundaries are
in `seo/editorial-reviews/home-assistant-bluetooth-proxy-guide.json`. Cron now
checks setting ownership, exact board revisions, and the distinction between
scanning and active connections. No extra daily article or hardware action ran.

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

No homepage redesign, bulk metadata migration, title change, new URL, forced
platform rotation, or publishing-volume increase is included. The initial two
refreshes do not replace their images; the subsequent doorbell refresh below does.
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

## Additional buyer-guide refresh

A subsequent September 15 pass reviewed the existing best-doorbell guide. Fresh
URL Inspection confirmed it indexed with a September 11 crawl, successful fetch,
and self-selected canonical. Recent impressions were 4 versus 7 with zero clicks;
this is too small for a CTR diagnosis. The identified issues are factual and
practical gaps, not evidence of a crawl block or grounds for a new competing URL.

The refresh adds Aqara G400 Wired and UniFi G6 options without claiming their full
Home Assistant behavior has been tested. It separates video, physical button
events, recording playback and two-way talk. It distinguishes UniFi connection
modes, Tapo D230 from RTSP-capable configurations, Ring real-time alerts from
status polling, and battery power from cloud dependence. Reolink's exact variant
and chime restrictions, Apple recording prerequisites, a worked purchase plan,
and non-destructive acceptance checks make the recommendation more actionable.

The crowded product collage is replaced with a single attributed Reolink
manufacturer image. It is not represented as a Tara installation or test. The
700px source exposed an optimizer bug: it advertised a 1200w candidate even though
the saved derivative remained 700px wide. The optimizer now uses actual encoded
widths, avoids duplicate width candidates for small originals, and does not
upscale. Three new regression tests cover normal and smaller source sizes, both
library indexes, unrelated-image preservation, and idempotence. All 18 existing
tests were rerun successfully, giving 21 passing cases for this pass.

The article and both library cards were checked in Chromium at 1440, 390 and 360px.
The product stays visible, the Avenir typography and centered layout remain,
and the table scrolls inside its focusable container with the keyboard. The
mobile TLDR was shortened after screenshot review. Original title, canonical and
publication date stay unchanged; only this refreshed article's modified date and
sitemap entry advance. Its concrete source checks and research limits are in
`seo/editorial-reviews/best-doorbell-camera-home-assistant-2026.json`.

The daily prompt now requires these feature-by-feature checks for cameras. Its
one-new-article limit and separate-task rule for old-page refreshes are unchanged.
No number-one ranking is claimed from a search tool listing Tara first: that is
not a Google rank tracker. The goal of top search visibility remains unachieved
until sustained, relevant performance provides stronger evidence.

## Local-voice factual refresh

The existing local-voice guide incorrectly made openWakeWord mandatory for Voice
Preview Edition, treated every pipeline link as Wyoming, recommended unsupported
installation methods, and promised that audio was never stored. Current primary
documentation contradicts those statements. The refreshed guide distinguishes
on-device microWakeWord, ESPHome endpoints, Wyoming speech services, optional
debug recording, and cloud-dependent agents or device actions. It adds a staged
one-lamp test and explains the maintained satellite-software path.

This is a refresh of `/blog/home-assistant-local-voice-assistant-no-cloud/`, not a
new daily article. Its title, H1, canonical, March 11 publication date and image
paths remain unchanged. The updated description is synchronized with both library
cards and schema, and only this article's sitemap lastmod advances. Its cumulative
165 impressions and zero clicks cover June 14-September 13, not the last week;
there was no fresh URL Inspection for this page in this pass.

The daily prompt now requires the same local-voice factual checks. The runner still
fetches the prompt from main and retains one new article per day. No scheduler
restart or additional daily publication is needed. The manual intent checker can
preserve a long existing title using `--refresh-from-ref <full-commit-SHA>` only
when the article's title, H1 and canonical match that historical page. It does not
waive description or collision checks, and daily new-article validation stays
strict. Thirteen regression cases cover this path; publishing and runner tests
also pass.

Chromium checks cover the article and both library cards at 1440, 390 and 360px,
including loaded images, Avenir, centered text, non-overlapping header text and
keyboard scrolling of the comparison table. Source checks, limitations and the
automated proofreading review are in
`seo/editorial-reviews/home-assistant-local-voice-assistant-no-cloud.json`.
These corrections improve factual usefulness, not proof of a ranking recovery.

## Contextual navigation

A subsequent static-link audit found all 183 sitemap pages reachable, with a
maximum shortest-link distance of three from the homepage. It did not establish a
crawl-depth defect. Fifty-seven of 155 blog articles had no incoming body link
outside the library and navigation/related boilerplate. Seven relevant next-step
links were added across five guides, reducing that count to 50. All eight guides
published September 8-15 now have at least one such incoming link. Those targets
were already reachable from the library; they were not wholly orphaned pages.

This navigation-only pass preserves titles, H1s, canonicals, descriptions, all
dates, images, original article copy and styles. Desktop/mobile keyboard links and
browser Back passed, including mobile without JavaScript. The scope, method,
limitations and source-to-target links are recorded in
`seo/internal-link-review-2026-09-15.json`. The cron now records up to two relevant
incoming-link suggestions for a separate review, without permission to edit old
articles. No new page or publishing-volume change is included, and no ranking or
indexing improvement is claimed from these navigation counts.

The notification-delivery guide retains a pre-existing 168-character description,
which fails the local candidate check's 160-character editorial target. The
navigation review records that result explicitly. Its head is unchanged, and
the new-article checker was not weakened or presented as passing for that page.
This is not a Google indexing limit or a justification for another snippet rewrite
in a link-only task.

## Commercial image delivery follow-up

Twenty-one static commercial/guide pages still loaded 1.46-2.09 MB hero PNGs.
They now serve responsive WebP versions of the same artwork, with no text,
metadata, layout, font, publication-date, homepage, or configurator changes.
The daily runner and prompt protect the optimized delivery attributes.
Seventy-two local and seventy-two live browser checks passed.

Three representative live cold-load comparisons showed median hero download
completion falling from 9.54-11.01s to 0.59-0.70s under identical throttling.
These are synthetic image-loading results, not field Core Web Vitals or ranking
recovery: the heading was the LCP element and its timings were materially unchanged.
Full evidence, limitations, deployment, and reproduction instructions are in
`seo/commercial-delivery-review-2026-09-15.md` and
`seo/commercial-loading-2026-09-15.json`. The next matched traffic comparison
remains September 22; do not reread today's unchanged export as new evidence.

## Backup and recovery refresh

The established backup guide implied that Container users still needed manual
restore workarounds, although built-in restoration has supported Container since
2025.1. It also proposed restoring to a spare VM without warning that copied
credentials and enabled automations could reconnect to the live home.

This focused refresh corrects both issues, clarifies matching encryption keys
and decrypted browser downloads, adds upload/status checks and a hypothetical
household recovery checklist, and distinguishes isolated configuration inspection
from actual device validation. Authorship and documentation-research disclosure
are now visible; FAQ schema matches the revised visible answers.

Title, H1, canonical, description, June 18 publication date, cover images and both
library cards are unchanged. Only this article's modified date and sitemap lastmod
advance. A browser-observed legacy TLDR weight override is corrected locally to
regular Avenir sentences with bold labels; no global style migration was made.
The daily prompt now requires the same backup/restore checks without expanding
its scope or publishing quota.

The page's 495 impressions and zero clicks are cumulative June 14-September 13
data, not a recent-week result. No fresh URL Inspection or ranking improvement is
claimed. Local browser checks cover the article and both cards at 1440, 390 and
360px, including keyboard table scrolling. The repeatable live gate and source
checks are in `seo/editorial-reviews/how-to-back-up-home-assistant.json` and
`scripts/check-backup-guide.browser.js`. No real Home Assistant restore was run.

## VLAN guide refresh

The established main-LAN/IoT-VLAN guide still treated two Home Assistant network
interfaces as an easy balanced default. It understated direct host exposure,
called one layout categorically strictest, grouped Thread with non-IP radios,
and proposed re-pairing a device as routine verification. The refresh corrects
those recommendations without changing its title, H1, canonical, description,
June 17 publication date, existing fragment IDs, or image paths.

A three-layout decision table now separates discovery convenience from access
control. The new Matter section explains local IPv6 and the border-router LAN
path. A fictional first-generation Shelly lamp example distinguishes commands
from device-initiated updates and stateful replies; it is not a tested deployment
or a universal firewall configuration. The verification sequence uses a reversible
non-critical test, not factory resets or interruption of safety devices.

Both library cards retained an older recommendation in their summaries. Only
this card's description was synchronized to the unchanged metadata. The guide
now includes honest authorship/research disclosure, matching FAQ schema, regular
TLDR text, and two keyboard-scrollable comparison tables. Original art is retained.
Browser tests at 1440, 390, and 360px cover the article and both cards, fonts,
images, alignment, and overflow. A decoded-but-not-yet-painted cover in the first
screenshot was resolved by waiting for browser paint in the test, with no
production image or loading change.

The daily prompt now checks discovery versus control and callbacks, integration-
specific topology, multi-interface exposure, IPv6, and safe verification. No new
URL, extra daily article, or scheduler change was made. Claim checks and a
repeatable live browser gate are in
`seo/editorial-reviews/home-assistant-main-lan-vs-iot-vlan.json` and
`scripts/check-vlan-guide.browser.js`. The 1,374 impressions and eight clicks are
cumulative June 14-September 13 figures, not a current ranking. Today's earlier
inspection reported indexed with an August 27 crawl; no repeat indexing request
was made. There is no claimed ranking effect from this content refresh.

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
