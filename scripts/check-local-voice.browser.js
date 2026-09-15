// Run with the Playwright MCP code-file tool after navigating to the target site.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const articlePath = '/blog/home-assistant-local-voice-assistant-no-cloud/';
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
      const response = await target.goto(origin + articlePath, {waitUntil: 'load'});
      if (response.status() !== 200) throw new Error(`Article HTTP ${response.status()}`);
      await target.evaluate(async () => {
        await document.fonts.ready;
        await document.querySelector('.article-cover img').decode();
      });
      const article = await target.evaluate(() => {
        const body = document.querySelector('.article-body');
        const bounds = body.getBoundingClientRect();
        const h1 = document.querySelector('h1');
        const lede = document.querySelector('.lede');
        const byline = document.querySelector('.article-byline');
        const image = document.querySelector('.article-cover img');
        const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph'];
        const posting = graph.find(node => node['@type'] === 'BlogPosting');
        const description = document.querySelector('meta[name="description"]').content;
        const ids = [...document.querySelectorAll('[id]')].map(node => node.id);
        return {
          title: document.title,
          h1Count: document.querySelectorAll('h1').length,
          h1: h1.textContent.trim(),
          canonical: document.querySelector('link[rel="canonical"]').href,
          indexable: ![...document.querySelectorAll('meta[name="robots"],meta[name="googlebot"]')]
            .some(node => /noindex|none/i.test(node.content)),
          fontLoaded: [...document.fonts].some(face => face.family === 'Tara Avenir' && face.status === 'loaded'),
          regularHeading: getComputedStyle(h1).fontWeight === '400',
          bodyWidth: bounds.width,
          centered: Math.abs(bounds.left - (innerWidth - bounds.right)) <= 1,
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          headerOverlap: h1.getBoundingClientRect().bottom > lede.getBoundingClientRect().top + 1 ||
            lede.getBoundingClientRect().bottom > byline.getBoundingClientRect().top + 1,
          image: image.currentSrc,
          imageLoaded: image.complete && image.naturalWidth > 0,
          tldrBullets: document.querySelectorAll('.tldr li').length,
          researchVisible: document.querySelector('.research-method').getBoundingClientRect().height > 0,
          workedExample: Boolean(document.querySelector('#one-lamp-acceptance-test')),
          uniqueIds: ids.length === new Set(ids).size,
          published: posting.datePublished,
          modified: posting.dateModified,
          description,
          matchingDescriptions: description === posting.description && description === lede.textContent.trim() &&
            description === document.querySelector('meta[property="og:description"]').content &&
            description === document.querySelector('meta[name="twitter:description"]').content,
          sourceHeading: document.querySelector('.source-list h2').textContent.trim(),
        };
      });
      if (article.h1Count !== 1 || article.h1 !== 'How to Set Up a Fully Local Voice Assistant in Home Assistant' ||
          article.title !== article.h1 + ' | Tara Guides' || article.canonical !== 'https://tarahome.ai' + articlePath ||
          !article.indexable || !article.fontLoaded || !article.regularHeading || !article.centered ||
          article.overflow || article.headerOverlap || !article.imageLoaded || !article.image.endsWith('.webp') ||
          article.tldrBullets !== 4 || !article.researchVisible || !article.workedExample || !article.uniqueIds ||
          article.published !== '2026-03-11' || article.modified !== '2026-09-15' || !article.matchingDescriptions ||
          article.sourceHeading !== 'Documentation and further reading') {
        throw new Error(`Article ${width}: ${JSON.stringify(article)}`);
      }
      await target.screenshot({path: `/tmp/tarahome-local-voice-${width}-hero.png`});
      await target.locator('.tldr').screenshot({path: `/tmp/tarahome-local-voice-${width}-tldr.png`});
      const table = target.getByRole('region', {name: 'Local speech engine comparison'});
      await table.screenshot({path: `/tmp/tarahome-local-voice-${width}-table.png`});
      await table.focus();
      if (width < 900) {
        await target.keyboard.press('ArrowRight');
        await target.waitForFunction(() => document.querySelector('.comparison-table').scrollLeft > 0);
      }
      const keyboardScroll = await table.evaluate(node => node.scrollLeft);
      await target.locator('#one-lamp-acceptance-test').scrollIntoViewIfNeeded();
      await target.screenshot({path: `/tmp/tarahome-local-voice-${width}-worked-test.png`});
      const cards = [];
      for (const path of ['/blog/', '/blog.html']) {
        const libraryResponse = await target.goto(origin + path, {waitUntil: 'load'});
        if (libraryResponse.status() !== 200) throw new Error(`Library HTTP ${libraryResponse.status()}`);
        const card = target.locator(`a.blog-card[href="${articlePath}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(image => image.decode());
        await target.evaluate(() => document.fonts.ready);
        const state = await card.evaluate(node => ({
          text: node.querySelector('span > p:not(.kicker)').textContent.trim(),
          title: node.querySelector('h2').textContent.trim(),
          image: node.querySelector('img').currentSrc,
          regularHeading: getComputedStyle(node.querySelector('h2')).fontWeight === '400',
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
        }));
        if (state.text !== article.description || state.title !== article.h1 || !state.regularHeading || state.overflow) {
          throw new Error(`Library card ${width} ${path}: ${JSON.stringify(state)}`);
        }
        await card.screenshot({path: `/tmp/tarahome-local-voice-${width}-${path === '/blog/' ? 'index' : 'legacy'}-card.png`});
        cards.push({path, ...state});
      }
      if (errors.length || submissions) throw new Error(JSON.stringify({errors, submissions}));
      results.push({width, article, keyboardScroll, cards, errors, submissions});
    } finally {
      await context.close();
    }
  }
  return results;
}
