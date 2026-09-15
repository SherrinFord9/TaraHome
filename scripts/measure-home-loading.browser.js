// Synthetic first-visit observations, not Lighthouse or field Core Web Vitals.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const conditions = {latency: 150, downloadThroughput: 200000, uploadThroughput: 93750};
  const samples = [];
  for (let run = 1; run <= 3; run++) {
    const context = await page.context().browser().newContext({viewport: {width: 390, height: 844},
      deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block'});
    try {
      await context.route(/google-analytics|googletagmanager|formspree/, route => route.abort());
      await context.addInitScript(() => {
        window.__homeLab = {lcp: [], shifts: [], tasks: [], states: []};
        for (const type of ['largest-contentful-paint', 'layout-shift', 'longtask']) {
          new PerformanceObserver(list => {
            for (const e of list.getEntries()) {
              if (type === 'largest-contentful-paint') window.__homeLab.lcp.push({time: e.startTime, element: e.element?.tagName});
              if (type === 'layout-shift' && !e.hadRecentInput) window.__homeLab.shifts.push({time: e.startTime, value: e.value});
              if (type === 'longtask') window.__homeLab.tasks.push({time: e.startTime, duration: e.duration});
            }
          }).observe({type, buffered: true});
        }
        const observe = () => {
          const root = document.querySelector('[data-tara-ready]');
          const state = root ? root.dataset.taraReady : document.querySelector('.seo-static-fallback') ? 'fallback' : document.querySelector('.tara-rx-hero') ? 'legacy-react' : null;
          if (state && window.__homeLab.states.at(-1)?.state !== state) window.__homeLab.states.push({state, time: performance.now()});
          requestAnimationFrame(observe);
        };
        requestAnimationFrame(observe);
      });
      const target = await context.newPage();
      const cdp = await context.newCDPSession(target);
      await cdp.send('Network.enable');
      await cdp.send('Network.setCacheDisabled', {cacheDisabled: true});
      await cdp.send('Network.emulateNetworkConditions', {offline: false, ...conditions});
      await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4});
      await target.goto(origin, {waitUntil: 'load', timeout: 60000});
      await target.waitForFunction(() => window.__taraAnalyticsReady === true);
      await target.waitForTimeout(1000);
      samples.push(await target.evaluate(run => ({run,
        ...window.__homeLab,
        fcpMs: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        loadMs: performance.getEntriesByType('navigation')[0].loadEventEnd,
        htmlBytes: performance.getEntriesByType('navigation')[0].encodedBodySize,
        resources: performance.getEntriesByType('resource').filter(e => /\.(js|css|woff2)(\?|$)/.test(e.name))
          .map(e => ({path: new URL(e.name).pathname, bytes: e.encodedBodySize, endMs: e.responseEnd})),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      }), run));
    } finally {await context.close();}
  }
  return {origin, viewport: '390x844', deviceScaleFactor: 1, cpuSlowdown: 4, conditions,
    cache: 'disabled, fresh context per run', analyticsAndForms: 'blocked', samples};
}
