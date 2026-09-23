# Analytics measurement contract

## Separate the outcomes

- Search Console clicks measure clicks from Google's covered search surfaces.
  GA4 sessions, users, and on-site `site_click` events are different metrics.
- GA4 Organic Search includes other search engines. Use session source / medium
  when discussing Google specifically, rather than all organic sessions.
- A planner view is interest, not an inquiry. A submit-button click or form
  submission attempt is not confirmation that the form service accepted it.
- `configurator_submit_success` is emitted after an HTTP-success response and
  recognized JSON acknowledgement from the form endpoint. It represents a submitted planning request, not a qualified
  lead, an order, revenue, or proof that the follow-up email was delivered.
  Formspree may also filter accepted submissions into its spam inbox. Reconcile
  both provider inboxes and delivery status before counting confirmed leads.
- Test and staff activity can appear in historical analytics. Confirm a real
  inquiry in the business inbox before treating a submission as a customer lead.
- Average engagement is not a stopwatch for every visitor or proof of intent.
  Low engagement, location, and referrer alone do not prove traffic is automated.

## Implementation and verification

The homepage has two rendering phases. Its inline click listener covers the
static fallback only. Once `initSiteAnalytics` sets `__taraAnalyticsReady`, the
React listener owns click tracking. Do not remove that guard and double count
the same interaction. The local React source already has one click listener;
this duplication came from the production HTML's additional fallback listener.

The planner emits these events separately:

| Event | Meaning |
| --- | --- |
| configurator_view | Planner opened |
| configurator_review_reached | Review step reached |
| configurator_submit_started | Valid form submitted for delivery |
| configurator_submit_error | Form endpoint failed or could not be reached |
| configurator_submit_success | Form endpoint accepted the request |

Only the successful request should be the inquiry key event. Do not treat
`site_form_submit`, `form_start`, planner opens, or button clicks as completed
inquiries. Keep planning estimates separate from monetary conversion values.

`scripts/check-analytics.browser.js` can be run through the Playwright MCP
code-file tool after opening the target site origin. It checks desktop and
mobile behavior, holds the homepage app bundle to exercise fallback tracking,
then checks the initialized app's single-click delivery. It tests invalid form
input, a simulated HTTP failure, and a simulated success. Google measurement
requests are blocked, and Formspree is fulfilled locally with mock responses.
No real lead is sent. Fake contact fields are checked for leakage into queued
events and the local event buffer; this is not a comprehensive privacy audit.

Local and production browser checks are needed after changing the analytics
listener, form submission code, or the production HTML's loading behavior.
Passing mocks does not prove the external form service or business inbox is up.

## Reporting discipline

Check export headers and reporting timezone before comparing periods. GA4 can
retain the previous report's dates while a new view loads. File names alone do
not prove which dates were exported. Keep complete-day comparisons consistent,
and do not interpret an omitted or incomplete current day as zero traffic.

Detailed GA4 exports, account settings, and inquiry records belong in private
audit storage, not published articles or the public website repository. Use
aggregate findings only where necessary and authorized. Do not copy customer
contact details into analytics, article briefs, public reports, or test fixtures.

Marking a key event applies prospectively, not retroactively. Key-event reports
may take time to update. A zero revenue field on this planning site does not
establish that the business has no revenue. This site does not measure checkout.

Relevant documentation:

- [Google: mark events as key events](https://support.google.com/analytics/answer/13128484)
- [Google: Analytics and Search Console integration](https://support.google.com/analytics/answer/10737381)

Neither healthy analytics nor higher event totals establishes top search
visibility. Verify the requested ranking and business outcomes separately.
