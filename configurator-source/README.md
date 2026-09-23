# Configurator Source

This directory owns the deployed configurator, including the optional placement
map. It is independent of the legacy full-site generator in tara-Website_latest.

From this directory, with Node 22.6+:

```sh
npm ci
npm test
npm run build
```

The build type-checks and emits versioned assets, then replaces only the marked
asset block in `../configurator/index.html`. It does not rewrite metadata, the
first-paint fallback, homepage, blog pages, sitemap, or fonts. Retain previous
hashed assets because cached pages can still reference them.

Serve the repository root with a local HTTP server and run
`scripts/check-placement.browser.js`, `scripts/check-analytics.browser.js`,
`scripts/check-configurator-loading.browser.js`, and
`scripts/check-starter-kit.browser.js` through Playwright MCP on that origin.
Also run scripts/check-placement-usability.browser.js for the named catalogue,
attached sensors, mouse/touch rotation handles, keyboard controls, expanded draft
restoration and complete mocked submission. Tests must block analytics and mock
form delivery; never send production leads.

Run scripts/check-plan-delivery.browser.js for malformed/HTML acknowledgements,
provider errors, rate limits, timeout, network failure, broken analytics,
same-tick duplicate submissions and private downloadable request copies.
Submission acceptance is not email delivery or a paid order. The Formspree
workflow recipient and spam inbox must be checked separately in the account.
The client does not automatically retry an ambiguous response. An unchanged
in-page retry reuses its reference for manual reconciliation, not server-side
idempotency. References and contact details are never sent to analytics.
Request copies are downloaded only on a visitor's action; they remain in memory
until then and are not a server-side backup or cross-browser recovery mechanism.

## Placement Contract

- Layout units are feet, with half-foot drag snapping and rectangular rooms.
- The named catalogue has 21 layout/device types: rooms, doors, windows, cameras,
  mmWave, door/window sensors, lights, switches, thermostats, doorbells, local
  servers, speakers, voice endpoints, plugs, shades, locks, TVs, robot vacuums,
  lawn mowers and leak sensors. Its category boundaries come from the homepage's
  core kit and compatible-device descriptions, not a confirmed hardware SKU list.
- Version-two placement drafts accept and migrate version-one maps. Existing
  configurator draft storage stays at version two; the nested map has its own
  version. A room move carries contained items; an opening move carries its
  attached sensor. Deleting an opening removes its attached sensor in the same
  undoable action. Duplicating an item does not duplicate attached children.
- Rotation has explicit left/right controls and a draggable on-map handle.
  Rooms rotate by swapping width/depth; other items rotate in 45-degree steps or
  continuously through the handle/slider. Attached sensors inherit their opening's
  direction. One-foot move buttons and exact fields avoid requiring dragging.
- Doors/windows snap to nearby drawn room walls on drag release, but uploaded
  images are not parsed into walls. Default device positions are editing starting
  points, not professionally validated mounting recommendations.
- Camera and mmWave wedges are illustrative. Walls, furniture, mounting height,
  model specifications, and actual detection performance are not simulated.
- Floor plan images are decoded locally, resized and saved in the existing browser
  draft. They are never sent to analytics or attached to the inquiry. Users can
  export a floor map with its image. PNG/JPEG/WebP only; bounded input/storage sizes.
- Placement geometry and room names are included in the inquiry only on submission.
  Generic analytics ignores the entire private map workspace.
- Drawing never changes the price. The explicit apply-counts command updates camera
  and presence planning zones, not confirmed hardware quantities or product SKUs.
- Other placements are included in the inquiry's map for scope review, not priced
  automatically. In particular, compatible add-ons are not represented as included
  inventory or verified compatible products.
- Recommending a new scope can change quote counts independently of the map. The map
  and review display both sets of counts so no synchronization is implied.
- The canvas engine and editor styles load only when the map is opened.
- No dependency on cron-generated HTML or article styles. Article jobs must not
  build, edit, or publish this application as part of writing a post.

Canvas interaction and export use [Konva](https://konvajs.org/docs/react/Drag_And_Drop.html).
Canvas device glyphs are generated locally from the same Lucide SVG icons as the
catalogue; imported floor-plan files are still limited to raster images. PNG export
omits editing handles and bounds the output height without stretching the map.
