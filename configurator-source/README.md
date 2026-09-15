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
Tests must block analytics and mock form delivery; never send production leads.

## Placement Contract

- Layout units are feet, with half-foot drag snapping and rectangular rooms.
- Camera and mmWave wedges are illustrative. Walls, furniture, mounting height,
  model specifications, and actual detection performance are not simulated.
- Floor plan images are decoded locally, resized and saved in the existing browser
  draft. They are never sent to analytics or attached to the inquiry. Users can
  export a floor map with its image. PNG/JPEG/WebP only; bounded input/storage sizes.
- Placement geometry and room names are included in the inquiry only on submission.
  Generic analytics ignores the entire private map workspace.
- Drawing never changes the price. The explicit apply-counts command updates camera
  and presence planning zones, not confirmed hardware quantities or product SKUs.
- Recommending a new scope can change quote counts independently of the map. The map
  and review display both sets of counts so no synchronization is implied.
- The canvas engine and editor styles load only when the map is opened.
- No dependency on cron-generated HTML or article styles. Article jobs must not
  build, edit, or publish this application as part of writing a post.

Canvas interaction and export use [Konva](https://konvajs.org/docs/react/Drag_And_Drop.html).
