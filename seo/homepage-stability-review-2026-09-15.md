# Homepage first-visit stability, September 15, 2026

## Finding

The homepage initially rendered an inline-styled SEO fallback, then replaced it
with React. Navigation geometry, paragraph wrapping, and button spacing differed
between the two versions. Screenshots showed a visible change despite no
layout-shift entries in the sampled initial loads. Matching H1 bounds alone did
not establish visual stability.

Three cold production samples at 390x844, DPR 1, 150ms latency, 200,000 bytes/s
download and 4x CPU slowdown recorded median FCP/LCP of 420ms. The fallback was
replaced around 1.75s. Those are synthetic observations, not Lighthouse scores,
field Core Web Vitals, or evidence about the cause of declining search traffic.

## Change

The homepage-only source in `homepage-source/` now generates the same React tree
at build time and hydrates the existing HTML. Its production stylesheet is applied
before first paint, not applied later on interaction. The client import begins
after document parsing without keeping the load event pending. This avoids a
native fragment jump when a reader follows a link and then scrolls elsewhere
before JavaScript arrives. The redundant delayed hash effect was removed.

This uses React's [matching server/client markup contract](https://react.dev/reference/react-dom/client/hydrateRoot).
It is not a redesign or a rollback. The complete rendered text, image attributes,
and section order matched the previously deployed page at desktop and mobile
widths. Metadata, schema, analytics bootstrap, original CSS and fonts are preserved.
The only generated HTML replacements are the root, stylesheet link, and entry
loader. Build tests enforce those boundaries and idempotence.

Serving the real stylesheet before paint trades the earlier, incorrectly styled
fallback paint for a later correctly styled paint. Do not claim that removing the
visual swap necessarily improves FCP/LCP. The local Python server sends CSS/JS
uncompressed; its timings are not comparable with compressed production timings.

## Local verification

- Delayed hydration retains the original H1 DOM node and hero/navigation geometry
  within 1px at 1440, 1024, 820, 390, 360, and 412px (including a tall viewport).
- Before/after screenshots were reviewed. Native FAQ and section links work
  without JavaScript at 390 and 1440px. Early FAQ state and reading position survive
  hydration; deep links, browser back, menu, theme, and hero destinations pass.
- Four hero checks cover ordinary and unusually tall phone/desktop viewports.
- Desktop/mobile analytics checks count each click once, reject invalid forms,
  distinguish failed and successful responses, and keep private fields out of
  events. Form delivery is mocked; no real inquiry was sent.
- The existing placement planner passed four mouse/touch browser cases, including
  a short phone, plus three geometry/storage unit tests. Coverage pixels, dragging,
  floor switching, image upload, export, undo/redo, persistence, explicit quote
  count application, and private submission boundaries were checked.
- Two homepage build tests, seven publishing tests, thirteen intent tests, and
  site-wide typography/layout/editorial/cover/commercial-image gates pass.

The configurator, blog documents, sitemap, llms metadata, fonts, and production
stylesheet are unchanged by this homepage migration. Daily writing remains
isolated and limited to one article per day at most. The writer prompt explicitly
forbids rebuilding this homepage or reverting its initial-render contract.

## Limits

Camera and mmWave coverage in the configurator is illustrative, not a physical
visibility/radio simulation or a guarantee of detection. No devices were tested.
This deployment does not demonstrate search recovery. Preserve the next matched
completed-week Search Console comparison on September 22; do not claim improvement
from deployment success or repeatedly pivot strategy on unchanged reporting data.
