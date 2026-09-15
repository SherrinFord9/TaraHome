// Website verification only: never connects to Home Assistant or performs a restore.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  const path = '/blog/how-to-back-up-home-assistant/';
  const title = 'How to Back Up and Restore Home Assistant Safely';
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
      });
      const state = await target.evaluate(() => {
        const bounds = document.querySelector('.article-body').getBoundingClientRect();
        const h1 = document.querySelector('h1');
        const lede = document.querySelector('.lede');
        const byline = document.querySelector('.article-byline');
        const image = document.querySelector('.article-cover img');
        const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
        const posting = graph.find(node => node['@type'] === 'BlogPosting');
        const faq = graph.find(node => node['@type'] === 'FAQPage');
        const description = document.querySelector('meta[name="description"]').content;
        const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
        return {
          title: document.title, h1: h1.textContent.trim(), h1Count: document.querySelectorAll('h1').length,
          canonical: document.querySelector('link[rel="canonical"]').href,
          published: posting.datePublished, modified: posting.dateModified,
          descriptionsMatch: description === posting.description && description === lede.textContent.trim() &&
            description === document.querySelector('meta[property="og:description"]').content &&
            description === document.querySelector('meta[name="twitter:description"]').content,
          description,
          fontLoaded: [...document.fonts].some(face => face.family === 'Tara Avenir' && face.status === 'loaded'),
          headingWeight: getComputedStyle(h1).fontWeight,
          centered: Math.abs(bounds.left - (innerWidth - bounds.right)) <= 1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          overlap: h1.getBoundingClientRect().bottom > lede.getBoundingClientRect().top + 1 ||
            lede.getBoundingClientRect().bottom > byline.getBoundingClientRect().top + 1,
          imageLoaded: image.complete && image.naturalWidth > 0, image: image.currentSrc,
          tldrBullets: document.querySelectorAll('.tldr li').length,
          tldrWeights: [...document.querySelectorAll('.tldr li')].every(item =>
            getComputedStyle(item).fontWeight === '400' && getComputedStyle(item.querySelector('strong')).fontWeight === '600'),
          research: document.querySelector('.research-method').textContent,
          checklistItems: document.querySelector('#household-example').nextElementSibling.nextElementSibling.nextElementSibling.querySelectorAll('li').length,
          restoreSteps: document.querySelector('#restore-procedure').nextElementSibling.querySelectorAll('li').length,
          uniqueIds: ids.length === new Set(ids).size,
          faqMatches: faq.mainEntity.every(item => [...document.querySelectorAll('.article-body h3')].some(
            heading => heading.textContent.trim() === item.name && heading.nextElementSibling.textContent.trim() === item.acceptedAnswer.text)),
        };
      });
      if (state.title !== title || state.h1 !== title || state.h1Count !== 1 ||
          state.canonical !== 'https://tarahome.ai' + path || state.published !== '2026-06-18' ||
          state.modified !== '2026-09-15' || !state.descriptionsMatch || !state.fontLoaded ||
          state.headingWeight !== '400' || !state.centered || state.overflow || state.overlap ||
          !state.imageLoaded || !state.image.endsWith('.webp') || state.tldrBullets !== 4 || !state.tldrWeights ||
          !state.research.includes('not reported Tara hardware tests') || state.checklistItems !== 5 ||
          state.restoreSteps !== 6 || !state.uniqueIds || !state.faqMatches) {
        throw new Error(JSON.stringify({width, state}));
      }
      const prefix = `/tmp/tarahome-backup-${origin.includes('127.0.0.1') ? 'local' : 'live'}-${width}`;
      await target.screenshot({path: prefix + '-hero.png'});
      await target.locator('.tldr').screenshot({path: prefix + '-tldr.png'});
      const table = target.getByRole('region', {name: 'Backup storage comparison'});
      await table.screenshot({path: prefix + '-table.png'});
      await table.focus();
      if (width < 900) {
        await target.keyboard.press('ArrowRight');
        await target.waitForFunction(() => document.querySelector('.comparison-table').scrollLeft > 0);
      }
      for (const id of ['household-example', 'test-restore', 'restore-procedure']) {
        await target.locator('#' + id).scrollIntoViewIfNeeded();
        await target.screenshot({path: prefix + '-' + id + '.png'});
      }
      const cards = [];
      for (const library of ['/blog/', '/blog.html']) {
        await target.goto(origin + library, {waitUntil: 'load'});
        const card = target.locator(`a.blog-card[href="${path}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(image => image.decode());
        const cardState = await card.evaluate(node => ({
          title: node.querySelector('h2').textContent.trim(),
          description: node.querySelector('span > p:not(.kicker)').textContent.trim(),
          regular: getComputedStyle(node.querySelector('h2')).fontWeight === '400',
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }));
        if (cardState.title !== title || cardState.description !== state.description || !cardState.regular || cardState.overflow) {
          throw new Error(JSON.stringify({library, width, cardState}));
        }
        await card.screenshot({path: prefix + (library === '/blog/' ? '-index' : '-legacy') + '.png'});
        cards.push(cardState);
      }
      if (errors.length || submissions) throw new Error(JSON.stringify({errors, submissions}));
      results.push({width, state, cards, errors, submissions});
    } finally {
      await context.close();
    }
  }
  return {origin, results};
}
