// Navigate the MCP page to the desired origin before running this script.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  const response = await page.request.get(origin + '/seo/commercial-images.json');
  if (!response.ok()) throw new Error('Image manifest unavailable');
  const manifest = await response.json();
  const allPaths = manifest.images.flatMap(image => image.pages);
  const representativePaths = manifest.images.map(image => image.pages[0]);
  const results = [];
  const errors = [];
  const profiles = [
    {width: 1440, height: 1000, dpr: 1, paths: allPaths},
    {width: 390, height: 844, dpr: 1, paths: allPaths},
    {width: 360, height: 800, dpr: 3, paths: representativePaths},
    {width: 820, height: 1100, dpr: 2, paths: representativePaths},
    {width: 821, height: 1100, dpr: 2, paths: representativePaths},
    {width: 390, height: 844, dpr: 1, js: false,
      paths: ['smart-home-kit', 'camera-kit', 'home-assistant-smart-home-kit']},
  ];
  for (const profile of profiles) {
    for (const path of profile.paths) {
      // A fresh context prevents a cached larger candidate from hiding srcset behavior.
      const context = await page.context().browser().newContext({
        viewport: {width: profile.width, height: profile.height},
        deviceScaleFactor: profile.dpr, javaScriptEnabled: profile.js !== false,
        serviceWorkers: 'block',
      });
      try {
        await context.route(/google-analytics\.com|googletagmanager\.com|formspree\.io/, route => route.abort());
        const target = await context.newPage();
        target.on('pageerror', error => errors.push(`${path}: ${error.message}`));
        const response = await target.goto(`${origin}/${path}/`, {waitUntil: 'load'});
        if (response.status() !== 200) throw new Error(`${path}: HTTP ${response.status()}`);
        await target.locator('.hero-visual img').evaluate(image => image.decode());
        await target.evaluate(() => document.fonts.ready);
        const state = await target.evaluate(() => {
          const img = document.querySelector('.hero-visual img');
          const figure = img.parentElement;
          const rect = figure.getBoundingClientRect();
          const hero = document.querySelector('.hero').getBoundingClientRect();
          const heading = document.querySelector('h1').getBoundingClientRect();
          const cta = document.querySelector('.hero a[href="/configurator/"]');
          const resource = performance.getEntriesByName(img.currentSrc).at(-1);
          const style = getComputedStyle(img);
          return {
            loaded: img.complete && img.naturalWidth > 0,
            currentSrc: img.currentSrc, bytes: resource?.encodedBodySize,
            figure: {x: rect.x, y: rect.y, width: rect.width, height: rect.height},
            fit: style.objectFit,
            headingOverlap: heading.right > rect.left + 1 && heading.left < rect.right - 1 &&
              heading.bottom > rect.top + 1 && heading.top < rect.bottom - 1,
            contained: rect.bottom <= hero.bottom + 1 && rect.left >= hero.left - 1 && rect.right <= hero.right + 1,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
            font: document.fonts.check('16px "Tara Avenir"'),
            cta: Boolean(cta),
          };
        });
        if (!state.loaded || !state.currentSrc.endsWith('.webp') || !state.bytes ||
            state.bytes > manifest.maxDeliveryBytes || state.fit !== 'cover' ||
            Math.abs(state.figure.width / state.figure.height - 16 / 9) > 0.02 ||
            state.headingOverlap || !state.contained || state.overflow || !state.font || !state.cta) {
          throw new Error(`${path} ${profile.width}@${profile.dpr}: ${JSON.stringify(state)}`);
        }
        if (representativePaths.includes(path) && [390, 1440].includes(profile.width) && profile.js !== false) {
          await target.locator('.hero').screenshot({
            path: `/tmp/tarahome-delivery-${origin.includes('127.0.0.1') ? 'local' : 'live'}-${path}-${profile.width}.png`,
          });
        }
        if (['smart-home-kit', 'camera-kit', 'home-assistant-smart-home-kit'].includes(path) &&
            [390, 1440].includes(profile.width)) {
          await target.locator('.hero a[href="/configurator/"]').first().focus();
          await target.keyboard.press('Enter');
          await target.waitForURL('**/configurator/');
          await target.waitForLoadState('domcontentloaded');
        }
        results.push({path, viewport: `${profile.width}x${profile.height}`, dpr: profile.dpr,
          javaScript: profile.js !== false, ...state});
      } finally {
        await context.close();
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return {origin, checks: results.length, pageErrors: errors, analyticsAndForms: 'blocked', results};
}
