# Buyer-page review, September 15, 2026

## Evidence and decision

The previous goal turn made real progress: it deployed an evidence-backed
doorbell refresh and verified production. Neither that deployment nor this
review establishes ranking recovery or completes the top-visibility objective.

The three-month Search Console export covers June 14-September 13. Its page rows
show zero clicks for the commercial kit pages reviewed here: 63 impressions for
home-automation-kit, 25 for smart-home-kit, and one each for starter-kit and the
Home Assistant kit. These are cumulative, not last-week results. The one starter
impression at position 2 is not evidence of a reliable high ranking. Absence of
the Spokane page from the export does not by itself establish nonindexing.

Fresh authenticated URL inspections resolve that distinction:

| Page | Index status | Last crawl displayed |
| --- | --- | --- |
| /smart-home-kit/ | Indexed, inspected canonical | July 31, 4:59:23 PM |
| /smart-home-starter-kit/ | Indexed, inspected canonical | July 31, 5:10:41 PM |
| /home-assistant-smart-home-kit/ | Indexed, inspected canonical | July 24, 12:00:25 AM |
| /spokane-smart-home/ | Discovered, currently not indexed | N/A |

The starter and Home Assistant kit inspection panels show a temporary processing
error in their sitemap field, but successful page fetches and indexed state.
Do not treat that field alone as a sitemap outage. The Spokane live test passed
at 9:00 AM and one indexing request was accepted. That is not proof of indexing.
Details are also in `search-console-review-2026-09-15.json`, already read by cron.

The starter page had a $2,999 price but no example counts, little purchase
information, and a 1,901,442-byte illustrative image. Improve that existing URL,
not its title or a new keyword variation. No general homepage rollback, keyword
pivot, new-city page, or additional daily blog post is warranted by this sample.

## Implemented

- Added an explicit planning price near the heading and a concrete one-bedroom,
  one-level apartment example, checked in the live configurator with the guided
  core-system choice and no exterior cameras. The planner returned $2,999 and
  counts of 1 server, 1 door sensor, 5 window sensors, 8 lights or zones,
  3 presence zones, 1 thermostat, 1 doorbell, and 0 camera zones: 20 total.
- Explained that zones and planning counts are not an inventory guarantee.
  Different home types or counts can change the estimate. Exact products,
  installation boundaries, delivery timing, and purchase/support terms remain
  subject to confirmation. No hardware, delivery, or warranty facts were invented.
- Added clear self-install, rental, existing-device, camera, storage, and
  third-party-fee boundaries. A single lamp does not automatically need a whole
  kit. Retained a direct contact path and added a contextual Spokane planning link.
- Kept the established title, H1, description, canonical, and illustrative art.
  Switched visible image delivery to the existing 640/1280 WebP derivatives:
  13,884 and 41,908 bytes, with dimensions and responsive source descriptors.
  This is an image-transfer reduction, not a measured Lighthouse/LCP gain.
- Aligned all five FAQ schema answers with visible answers. No Product Offer,
  InStock availability, review stars, or guaranteed price markup was added.
- Updated only this page's sitemap lastmod and WebPage modification date.
- Added a browser regression check and cron guidance against copying changing
  estimates or inventing commercial promises in daily articles.

## Verification

`scripts/check-starter-kit.browser.js` runs through the actual planner at 1440,
390, and 360 pixels using separate browser contexts. It compares every count
and the displayed price with the public page, checks FAQ/schema agreement,
canonical, hero image loading and page overflow, and closes its test contexts.
No contact form is submitted; the check blocks analytics and Formspree requests.
Run it through the Playwright MCP code-file tool after opening the target origin.

Local browser checks passed at all three widths. Desktop and mobile screenshots
were inspected, and the mobile heading was tightened without changing its text.
The SEO ownership gate passes for all 17 protected pages and 67 keyword variants.
This is a buyer page, not a new blog article; daily article quota is unchanged.

The first post-deployment cold-browser check exposed a separate existing planner
bug: the static placeholder home-type buttons were enabled before React attached
the working controls. With the configurator entry bundle delayed 1.8 seconds,
clicking Apartment left its eventual selected state false and Continue disabled.
This is reproducible lost input, not evidence of a ranking cause. Disable the
placeholder buttons and mark the fallback busy until the app replaces it. The
same markup correction is applied to the local source configurator HTML, without
rebuilding the old generator over production. A separate
`scripts/check-configurator-loading.browser.js` test holds the bundle and checks
disabled placeholders, then releases it and verifies the first enabled selection
and Continue action work at desktop and mobile widths. This prevents inactive
placeholders from accepting input; it does not queue clicks on disabled buttons.

The old `tara-Website_latest` generator is not the production publishing path.
Do not rebuild that source folder over this static production repository: its
generator still contains an older version of this page and other manual fixes.
The versioned static page is authoritative here. Run the browser regression
check after any future planner or starter-page replacement, including a rebuild.

## Remaining evidence needed

The owner was asked for confirmed starter-kit models, lead times, and warranty
or support terms. Until supplied, the page must stay a planning offer and must
not claim a ready-to-order SKU or a tested installation. Authentic product and
customer evidence would strengthen this offer more than more keyword repetition.

Next Search Console comparison remains September 22. Check the newly requested
Spokane URL then, and compare complete days without interpreting missing recent
data as zeros. Search Console alone does not establish inquiries or revenue.

## Search context

The query `smart home starter kit apartment preconfigured Home Assistant kit`
surfaced product/bundle pages with concrete included hardware, not merely
protocol definitions. These were intent context, not sources for Tara inventory,
pricing, rankings, or stock claims:

- [Seeed Home Assistant starter kit](https://www.seeedstudio.com/Home-Assistant-Starter-Kit.html)
- [Pulcro starter kit](https://pulcro.io/product/pulcro-zigbee-starter-kit/)
- [Ritchie IoT configured starter kit](https://ritchieiot.co.za/product/the-ultimate-local-smart-home-starter-kit-pre-configured-home-assistant-hub-isolated-wi-fi/)

The specific Tara counts and $2,999 example were verified directly in
[the live planner](https://tarahome.ai/configurator/), not inferred from those
competitors. No search-volume estimate or Google number-one claim was made.
