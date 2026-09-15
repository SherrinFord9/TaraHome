// Run with the Playwright MCP code-file tool after navigating to the target site.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const results = [];
  for (const width of [1440, 390, 360]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
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
      const response = await target.goto(`${origin}/smart-home-starter-kit/`, {waitUntil: 'load'});
      if (response.status() !== 200) throw new Error(`Starter page HTTP ${response.status()}`);
      await target.evaluate(() => document.fonts.ready);
      const published = await target.evaluate(() => {
        const rows = [...document.querySelectorAll('#starter-scope tbody tr, #starter-scope tfoot tr')];
        const counts = Object.fromEntries(rows.map(row => [
          row.querySelector('th').textContent.trim(), Number(row.querySelector('td').textContent),
        ]));
        const data = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
        const faq = data['@graph'].find(node => node['@type'] === 'FAQPage');
        const visible = [...document.querySelectorAll('.faq details')].map(node => ({
          question: node.querySelector('summary').textContent.trim(),
          answer: node.querySelector('p').textContent.trim(),
        }));
        const image = document.querySelector('.hero-visual img');
        return {
          counts,
          price: document.querySelector('#starter-price').textContent.match(/\$[\d,]+/)[0],
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          imageLoaded: image.complete && image.naturalWidth > 0,
          image: image.currentSrc,
          h1Count: document.querySelectorAll('h1').length,
          canonical: document.querySelector('link[rel="canonical"]').href,
          faqMatches: visible.length === faq.mainEntity.length && faq.mainEntity.every(item =>
            visible.some(row => row.question === item.name && row.answer === item.acceptedAnswer.text)),
        };
      });
      if (published.overflow || !published.imageLoaded || !published.image.endsWith('.webp') ||
          !published.faqMatches || published.h1Count !== 1 ||
          published.canonical !== 'https://tarahome.ai/smart-home-starter-kit/') {
        throw new Error(`Starter page ${width}: ${JSON.stringify(published)}`);
      }
      await target.screenshot({path: `/tmp/tarahome-starter-${width}-hero.png`});
      await target.locator('#starter-scope').screenshot({path: `/tmp/tarahome-starter-${width}-scope.png`});
      await target.getByRole('link', {name: 'Plan my starter kit', exact: true}).first().click();
      await target.getByRole('button', {name: /^Apartment or condo/}).click();
      await target.locator('#tara-bedrooms').fill('1');
      await target.locator('#tara-levels').fill('1');
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: /^Recommend the core system for me/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.locator('.tara-cfg-scope-summary').waitFor();
      const actual = await target.evaluate(() => ({
        counts: Object.fromEntries([...document.querySelectorAll('.tara-cfg-scope-summary > div')].map(row => [
          row.querySelector('span').textContent.trim(), Number(row.querySelector('strong').textContent),
        ])),
        price: document.querySelector('.tara-cfg-preview-price strong').textContent.trim(),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      }));
      if (JSON.stringify(actual.counts) !== JSON.stringify(published.counts) ||
          actual.price !== published.price || actual.overflow || errors.length || submissions) {
        throw new Error(`Planner mismatch ${width}: ${JSON.stringify({published, actual, errors, submissions})}`);
      }
      results.push({width, price: actual.price, counts: actual.counts, faqMatches: published.faqMatches,
        image: published.image, overflow: false, errors, submissions});
    } finally {
      await context.close();
    }
  }
  return results;
}
