# Homepage Source

This directory owns the homepage React tree and static HTML generation. It uses
the existing production stylesheet, `/assets/main-CHkScHI6.css`, unchanged.
It does not run the legacy full-site generator or rebuild the configurator/blog.

```sh
npm ci
npm test
npm run build
```

The build emits a content-hashed client entry and prerenders the same component
tree with React. Only the root contents, owned entry script, and stylesheet link
in `../index.html` are replaced. Metadata, analytics bootstrap, and the existing
tall-viewport hero caps are preserved. Old assets remain for cached pages.

The browser hydrates that HTML rather than replacing a different fallback.
An inline module starts the client import after parsing without waiting for idle
or an interaction. The import does not hold the document load event open, which
prevents late native fragment navigation from interrupting an early reader.
Native section/planner/library links and FAQ details work without JavaScript.
Theme/menu buttons remain disabled until their handlers are ready. Their geometry
and styling do not change when enabled. The render year is shared by server and
client so a year boundary cannot cause a hydration mismatch.

The landing component was brought from the existing local source. Its complete
rendered text, image attributes, and section order were compared with production
at 1440px and 390px before publishing. Native links replace the homepage's unused
client router; hash navigation no longer runs a second delayed scroll effect.
Subsequent changes belong here, not in the obsolete full-site generator. Keep
the settled copy, assets, responsive layout, navigation targets, and analytics
contract stable unless the requested change explicitly includes them.

Daily article jobs must not build or edit this directory or the homepage. Verify
desktop/mobile, JavaScript-disabled and delayed-hydration states, hash navigation,
theme/menu controls, FAQ, pricing alignment, and one click event per interaction
before publishing. Test contexts must block analytics and real inquiry delivery.

Run `scripts/check-home-hydration.browser.js`, `scripts/check-home-hero.browser.js`,
and `scripts/check-analytics.browser.js` through Playwright MCP on the preview
origin and again on production. The hydration test holds the client request,
checks retained DOM nodes and geometry, and preserves an early open FAQ and
reading position. It also covers native navigation without JavaScript.
`scripts/measure-home-loading.browser.js` captures three cold mobile samples.
Compare the same served origin and compression conditions; the Python preview
server does not compress CSS/JS like production does.
