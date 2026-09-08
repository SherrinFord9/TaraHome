// Run with the Playwright MCP code-file tool after navigating to the target homepage.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const results = [];
  for (const [width, height] of [[390, 844], [1440, 900], [412, 12000], [1440, 12000]]) {
    const context = await page.context().browser().newContext({viewport: {width, height}});
    try {
      const target = await context.newPage();
      await target.goto(origin, {waitUntil: 'load'});
      await target.locator('.tara-rx-hero').waitFor({timeout: 15000});
      await target.evaluate(() => document.fonts.ready);
      const metrics = await target.evaluate(() => {
        const hero = document.querySelector('.tara-rx-hero');
        const heading = hero.querySelector('h1');
        const rect = heading.getBoundingClientRect();
        const image = hero.querySelector('img');
        return {
          headingTop: rect.top,
          headingBottom: rect.bottom,
          heroHeight: hero.getBoundingClientRect().height,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          imageLoaded: image.complete && image.naturalWidth > 0,
          configuratorLink: !!hero.querySelector('a[href="/configurator/"]'),
          h1Count: document.querySelectorAll('h1').length,
        };
      });
      if (metrics.headingTop < 0 || metrics.headingBottom > Math.min(height, 1744) ||
          metrics.overflow || !metrics.imageLoaded || !metrics.configuratorLink || metrics.h1Count !== 1) {
        throw new Error(`${width}x${height}: ${JSON.stringify(metrics)}`);
      }
      await target.screenshot({
        path: `/tmp/tarahome-hero-${width}x${height}.png`,
        clip: {x: 0, y: 0, width, height: Math.min(height, 1744)},
      });
      results.push({width, height, ...metrics});
    } finally {
      await context.close();
    }
  }
  return results;
}
