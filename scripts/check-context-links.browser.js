// Run with the Playwright MCP code-file tool after navigating to the target site.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const response = await page.request.get(origin + '/seo/internal-link-review-2026-09-15.json');
  if (!response.ok()) throw new Error(`Review HTTP ${response.status()}`);
  const review = await response.json();
  const results = [];
  for (const settings of [
    {width: 1440, javaScriptEnabled: true},
    {width: 390, javaScriptEnabled: true},
    {width: 360, javaScriptEnabled: true},
    {width: 390, javaScriptEnabled: false},
  ]) {
    const context = await page.context().browser().newContext({
      viewport: {width: settings.width, height: 900}, javaScriptEnabled: settings.javaScriptEnabled,
    });
    const errors = [];
    let submissions = 0;
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      await context.route('https://formspree.io/**', route => {
        submissions += 1;
        return route.abort();
      });
      const target = await context.newPage();
      target.on('pageerror', error => errors.push(error.message));
      const followed = [];
      for (const link of review.links) {
        const sourceResponse = await target.goto(origin + link.source, {waitUntil: 'load'});
        if (sourceResponse.status() !== 200) throw new Error(`Source HTTP ${sourceResponse.status()}`);
        await target.evaluate(() => document.fonts.ready);
        const anchor = target.locator('.article-body').getByRole('link', {name: link.anchor, exact: true});
        await anchor.scrollIntoViewIfNeeded();
        const source = await anchor.evaluate(node => ({
          href: node.getAttribute('href'),
          font: getComputedStyle(node).fontFamily,
          regularHeading: getComputedStyle(document.querySelector('h1')).fontWeight === '400',
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          fits: [...node.getClientRects()].every(rect => rect.left >= 0 && rect.right <= innerWidth + 1),
          paragraph: node.closest('p').textContent.trim(),
        }));
        if (source.href !== link.target || !source.font.includes('Tara Avenir') ||
            !source.regularHeading || source.overflow || !source.fits) {
          throw new Error(`Source ${link.source}: ${JSON.stringify(source)}`);
        }
        await anchor.focus();
        const filename = link.target.split('/').filter(Boolean).pop();
        await anchor.locator('..').screenshot({
          path: `/tmp/tarahome-context-${settings.width}-${settings.javaScriptEnabled ? 'js' : 'nojs'}-${filename}.png`,
        });
        await anchor.press('Enter');
        await target.waitForURL(origin + link.target);
        await target.locator('h1').waitFor();
        const destination = await target.evaluate(() => ({
          title: document.querySelector('h1').textContent.trim(),
          canonical: document.querySelector('link[rel="canonical"]').href,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }));
        if (destination.title !== link.targetTitle || destination.canonical !== 'https://tarahome.ai' + link.target || destination.overflow) {
          throw new Error(`Destination ${link.target}: ${JSON.stringify(destination)}`);
        }
        await target.goBack({waitUntil: 'load'});
        if (target.url() !== origin + link.source) throw new Error('Back navigation did not return to the source.');
        followed.push({source: link.source, target: link.target, keyboardLinkAndBack: true});
      }
      if (errors.length || submissions) throw new Error(JSON.stringify({errors, submissions}));
      results.push({...settings, followed, errors, submissions});
    } finally {
      await context.close();
    }
  }
  return results;
}
