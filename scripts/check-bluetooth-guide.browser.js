// Website checks only. No firmware flashing, device calls, form delivery, or analytics.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const path = '/blog/home-assistant-bluetooth-proxy-guide/';
  const title = 'Home Assistant Bluetooth Proxy: Setup, Range and Limits';
  const results = [];
  for (const width of [1440, 390, 360]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    const errors = [];
    try {
      await context.route(/google-analytics|googletagmanager|formspree/, route => route.abort());
      const target = await context.newPage();
      target.on('pageerror', error => errors.push(error.message));
      const response = await target.goto(origin + path, {waitUntil: 'load'});
      if (response.status() !== 200) throw new Error(`Article HTTP ${response.status()}`);
      await target.evaluate(async () => {
        await document.fonts.ready;
        await document.querySelector('.article-cover img').decode();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      });
      const state = await target.evaluate(() => {
        const q = selector => document.querySelector(selector);
        const graph = JSON.parse(q('script[type="application/ld+json"]').textContent)['@graph'];
        const post = graph.find(n => n['@type'] === 'BlogPosting');
        const faq = graph.find(n => n['@type'] === 'FAQPage');
        const box = q('.article-body').getBoundingClientRect();
        const headers = ['h1', '.lede', '.article-byline', '.research-method'].map(s => q(s).getBoundingClientRect());
        const ids = [...document.querySelectorAll('[id]')].map(n => n.id);
        return {
          title: document.title, h1: q('h1').textContent.trim(),
          canonical: q('link[rel="canonical"]').href,
          publication: post.datePublished, modified: post.dateModified,
          description: q('meta[name="description"]').content,
          schemaDescription: post.description,
          centered: Math.abs(box.left - (innerWidth - box.right)) < 1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          headerOverlap: headers.some((box, i) => i && headers[i - 1].bottom > box.top + 1),
          regularHeading: getComputedStyle(q('h1')).fontWeight === '400',
          fontLoaded: [...document.fonts].some(f => f.family === 'Tara Avenir' && f.status === 'loaded'),
          tldr: document.querySelectorAll('.tldr li').length,
          tldrRegular: [...document.querySelectorAll('.tldr li')].every(n => getComputedStyle(n).fontWeight === '400'),
          image: q('.article-cover img').currentSrc,
          imageLoaded: q('.article-cover img').naturalWidth > 0,
          tables: document.querySelectorAll('.comparison-table[tabindex="0"][role="region"]').length,
          modeSteps: q('#scanning-mode-checklist').children.length,
          capacityExample: q('#connection-budget-example').textContent,
          uniqueIds: ids.length === new Set(ids).size,
          faqMatches: faq.mainEntity.every(item => [...document.querySelectorAll('.article-body h3')].some(h => h.textContent.trim() === item.name && h.nextElementSibling.textContent.trim() === item.acceptedAnswer.text)),
        };
      });
      if (state.title !== title || state.h1 !== title || state.canonical !== 'https://tarahome.ai' + path ||
          state.publication !== '2026-06-17' || state.modified !== '2026-09-15' ||
          state.description !== state.schemaDescription || !state.centered || state.overflow ||
          state.headerOverlap || !state.regularHeading || !state.fontLoaded || state.tldr !== 4 ||
          !state.tldrRegular || !state.imageLoaded || !state.image.endsWith('.webp') || state.tables !== 4 ||
          state.modeSteps !== 4 || !state.capacityExample.includes('not a tested device count') ||
          !state.uniqueIds || !state.faqMatches) throw new Error(JSON.stringify({width, state}));
      const prefix = `/tmp/tara-bluetooth-${origin.includes('127.0.0.1') ? 'local' : 'live'}-${width}`;
      await target.screenshot({path: prefix + '-hero.png'});
      await target.locator('.tldr').screenshot({path: prefix + '-tldr.png'});
      for (const name of ['Proxy or direct adapter', 'Bluetooth proxy hardware choices', 'Upstairs sensor checklist', 'Bluetooth troubleshooting symptoms']) {
        const table = target.getByRole('region', {name, exact: true});
        await table.focus();
        if (width < 900) {
          await target.keyboard.press('ArrowRight');
          await target.waitForFunction(name => document.querySelector(`[aria-label="${name}"]`).scrollLeft > 0, name);
        }
      }
      await target.locator('#connection-budget-example').screenshot({path: prefix + '-capacity.png'});
      await target.locator('#scanning-mode-checklist').screenshot({path: prefix + '-scanning.png'});
      for (const library of ['/blog/', '/blog.html']) {
        await target.goto(origin + library);
        const card = target.locator(`a.blog-card[href="${path}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(image => image.decode());
        if (await card.locator('h2').innerText() !== title) throw new Error('Library title changed');
        const regular = await card.locator('h2').evaluate(n => getComputedStyle(n).fontWeight === '400');
        if (!regular) throw new Error('Library font changed');
      }
      if (errors.length) throw new Error(errors.join('\n'));
      results.push({width, state, errors});
    } finally {await context.close();}
  }
  return {origin, results};
}
