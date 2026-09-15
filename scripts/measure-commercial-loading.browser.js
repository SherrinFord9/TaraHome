// Synthetic cold-load measurements, not Lighthouse scores or field Core Web Vitals.
// Run through Playwright MCP after navigating to the origin being measured.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const conditions = {latency: 150, downloadThroughput: 200000, uploadThroughput: 93750};
  const samples = [];
  for (const path of ['/smart-home-kit/', '/camera-kit/', '/home-assistant-smart-home-kit/']) {
    for (let run = 1; run <= 3; run += 1) {
      const context = await page.context().browser().newContext({
        viewport: {width: 390, height: 844}, deviceScaleFactor: 1,
        isMobile: true, hasTouch: true, serviceWorkers: 'block',
      });
      try {
        await context.route(/google-analytics\.com|googletagmanager\.com|formspree\.io/, route => route.abort());
        await context.addInitScript(() => {
          window.__taraLabLcp = [];
          window.__taraLabShifts = [];
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) window.__taraLabLcp.push({
              time: entry.startTime, size: entry.size, url: entry.url,
              element: entry.element?.tagName, id: entry.element?.id,
            });
          }).observe({type: 'largest-contentful-paint', buffered: true});
          new PerformanceObserver(list => {
            for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
              window.__taraLabShifts.push({time: entry.startTime, value: entry.value});
            }
          }).observe({type: 'layout-shift', buffered: true});
        });
        const target = await context.newPage();
        const cdp = await context.newCDPSession(target);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
        await cdp.send('Network.emulateNetworkConditions', {offline: false, ...conditions});
        await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
        const response = await target.goto(origin + path, {waitUntil: 'load', timeout: 60000});
        if (response.status() !== 200) throw new Error(`${path}: HTTP ${response.status()}`);
        await target.locator('.hero-visual img').evaluate(image => image.decode());
        await target.waitForTimeout(750);
        const sample = await target.evaluate(() => {
          const image = document.querySelector('.hero-visual img');
          const resource = performance.getEntriesByName(image.currentSrc).at(-1);
          return {
            lcp: window.__taraLabLcp.at(-1),
            fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            loadMs: performance.getEntriesByType('navigation')[0].loadEventEnd,
            image: image.currentSrc,
            imageBytes: resource?.encodedBodySize,
            imageTransferBytes: resource?.transferSize,
            imageLoadMs: resource?.responseEnd,
            imageLoaded: image.complete && image.naturalWidth > 0,
            layoutShifts: window.__taraLabShifts,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
          };
        });
        if (!sample.imageLoaded || !sample.imageBytes || !sample.lcp || sample.overflow) {
          throw new Error(`${path}: incomplete sample ${JSON.stringify(sample)}`);
        }
        samples.push({path, run, ...sample});
      } finally {
        await context.close();
      }
    }
  }
  return {origin, viewport: '390x844', deviceScaleFactor: 1, cpuSlowdown: 4,
    conditions, cache: 'disabled, fresh context per run',
    note: 'Analytics and forms blocked; no interaction. Layout-shift entries are observations, not a field CLS score.', samples};
}
