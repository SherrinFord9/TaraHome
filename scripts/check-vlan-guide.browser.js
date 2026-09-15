// Website checks only; no connections to a router, Home Assistant, or real devices.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  const path = '/blog/home-assistant-main-lan-vs-iot-vlan/';
  const title = 'Should Home Assistant Be on an IoT VLAN?';
  const results = [];
  for (const width of [1440, 390, 360]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    const errors = [];
    let submissions = 0;
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      await context.route('https://formspree.io/**', route => { submissions++; return route.abort(); });
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
        const body = q('.article-body').getBoundingClientRect();
        const graph = JSON.parse(q('script[type="application/ld+json"]').textContent)['@graph'];
        const posting = graph.find(n => n['@type'] === 'BlogPosting');
        const faq = graph.find(n => n['@type'] === 'FAQPage');
        const description = q('meta[name="description"]').content;
        const ids = [...document.querySelectorAll('[id]')].map(n => n.id);
        const header = ['h1', '.lede', '.article-byline', '.research-method'].map(s => q(s).getBoundingClientRect());
        return {
          title: document.title, h1: q('h1').textContent.trim(), h1Count: document.querySelectorAll('h1').length,
          canonical: q('link[rel="canonical"]').href, published: posting.datePublished, modified: posting.dateModified,
          description,
          descriptionsMatch: [posting.description, q('.lede').textContent.trim(),
            q('meta[property="og:description"]').content, q('meta[name="twitter:description"]').content].every(v => v === description),
          centered: Math.abs(body.left - (innerWidth - body.right)) <= 1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          headerOverlap: header.some((box, i) => i && header[i - 1].bottom > box.top + 1),
          fontLoaded: [...document.fonts].some(f => f.family === 'Tara Avenir' && f.status === 'loaded'),
          headingRegular: getComputedStyle(q('h1')).fontWeight === '400',
          image: q('.article-cover img').currentSrc,
          imageLoaded: q('.article-cover img').naturalWidth > 0,
          tldrCount: document.querySelectorAll('.tldr li').length,
          tldrWeights: [...document.querySelectorAll('.tldr li')].every(li => getComputedStyle(li).fontWeight === '400' && getComputedStyle(li.querySelector('strong')).fontWeight === '600'),
          exampleRows: q('[aria-label="Example connection checklist"] tbody').rows.length,
          research: q('.research-method').textContent,
          matter: q('#matter-and-thread').nextElementSibling.textContent,
          uniqueIds: ids.length === new Set(ids).size,
          faqMatches: faq.mainEntity.every(item => [...document.querySelectorAll('.article-body h3')].some(h => h.textContent.trim() === item.name && h.nextElementSibling.textContent.trim() === item.acceptedAnswer.text)),
        };
      });
      if (state.title !== title || state.h1 !== title || state.h1Count !== 1 ||
          state.canonical !== 'https://tarahome.ai' + path || state.published !== '2026-06-17' ||
          state.modified !== '2026-09-15' || !state.descriptionsMatch || !state.centered ||
          state.overflow || state.headerOverlap || !state.fontLoaded || !state.headingRegular ||
          !state.imageLoaded || !state.image.endsWith('.webp') || state.tldrCount !== 4 ||
          !state.tldrWeights || state.exampleRows !== 4 || !state.uniqueIds || !state.faqMatches ||
          !state.research.includes('not a tested Tara installation') || !state.matter.includes('IPv6')) {
        throw new Error(JSON.stringify({width, state}));
      }
      const prefix = `/tmp/tarahome-vlan-${origin.includes('127.0.0.1') ? 'local' : 'live'}-${width}`;
      await target.screenshot({path: prefix + '-hero.png'});
      await target.locator('.tldr').screenshot({path: prefix + '-tldr.png'});
      for (const name of ['Network layout comparison', 'Example connection checklist']) {
        const table = target.getByRole('region', {name, exact: true});
        await table.screenshot({path: prefix + (name.startsWith('Network') ? '-layouts.png' : '-example.png')});
        await table.focus();
        if (width < 900) {
          await target.keyboard.press('ArrowRight');
          await target.waitForFunction(name => document.querySelector(`[aria-label="${name}"]`).scrollLeft > 0, name);
        }
      }
      for (const id of ['matter-and-thread', 'worked-network-example', 'practical-setup-path']) {
        await target.locator('#' + id).scrollIntoViewIfNeeded();
        await target.screenshot({path: prefix + '-' + id + '.png'});
      }
      const cards = [];
      for (const library of ['/blog/', '/blog.html']) {
        await target.goto(origin + library, {waitUntil: 'load'});
        const card = target.locator(`a.blog-card[href="${path}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(async img => {
          await img.decode();
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        });
        const item = await card.evaluate(a => ({
          title: a.querySelector('h2').textContent.trim(),
          description: a.querySelector('span > p:not(.kicker)').textContent.trim(),
          regular: getComputedStyle(a.querySelector('h2')).fontWeight === '400',
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }));
        if (item.title !== title || item.description !== state.description || !item.regular || item.overflow) throw new Error(JSON.stringify(item));
        await card.screenshot({path: prefix + (library === '/blog/' ? '-index.png' : '-legacy.png')});
        cards.push(item);
      }
      if (errors.length || submissions) throw new Error(JSON.stringify({errors, submissions}));
      results.push({width, state, cards, errors, submissions});
    } finally {
      await context.close();
    }
  }
  return {origin, results};
}
