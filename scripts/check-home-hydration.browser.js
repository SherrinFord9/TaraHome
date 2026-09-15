// Hold the entry to verify useful, stable HTML before hydration. Never send leads or analytics.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  for (const [width, height] of [[1440, 900], [390, 844], [360, 800], [820, 900], [1024, 900], [412, 12000]]) {
    const context = await page.context().browser().newContext({viewport: {width, height}});
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const errors = [];
    let held = false;
    try {
      await context.route(/google-analytics|googletagmanager|formspree/, route => route.abort());
      await context.route(/\/assets\/homepage-[^/]+\.js$/, async route => {
        held = true;
        await gate;
        await route.continue();
      });
      const target = await context.newPage();
      target.on('pageerror', error => errors.push(error.message));
      target.on('console', message => {
        if (message.type() === 'error' && /hydration|Minified React error/i.test(message.text())) errors.push(message.text());
      });
      await target.goto(origin, {waitUntil: 'commit'});
      await target.locator('[data-tara-ready="false"]').waitFor();
      await target.evaluate(async () => {
        await document.fonts.ready;
        await document.querySelector('.tara-rx-hero img').decode();
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        window.__originalHomeHeading = document.querySelector('h1');
      });
      const boxes = () => target.evaluate(() => {
        const selectors = ['h1', '.tara-rx-hero .tara-rx-lede', '.tara-rx-nav', '.tara-rx-hero .tara-rx-cta-row'];
        return selectors.map(selector => {
          const b = document.querySelector(selector).getBoundingClientRect();
          return {selector, x: b.x, y: b.y + scrollY, width: b.width, height: b.height};
        });
      });
      const before = await boxes();
      const prefix = `/tmp/tara-home-hydration-${origin.includes('127.0.0.1') ? 'local' : 'live'}-${width}`;
      await target.screenshot({path: prefix + '-before.png', clip: {x: 0, y: 0, width, height: Math.min(height, 1000)}});
      if (!await target.getByRole('button', {name: 'Use dark theme', exact: true}).isDisabled()) throw new Error('Inactive control accepts input');
      const heroLink = target.getByRole('link', {name: 'See how it works', exact: true});
      if (await heroLink.getAttribute('href') !== '#features') throw new Error('Wrong hero destination');
      if (await target.locator('#root h1').count() !== 1 || await target.locator('#root section').count() < 10) throw new Error('Incomplete static page');
      release();
      await target.locator('[data-tara-ready="true"]').waitFor();
      const after = await boxes();
      const stable = before.every((a, i) => ['x', 'y', 'width', 'height'].every(k => Math.abs(a[k] - after[i][k]) < 1));
      const retained = await target.evaluate(() => document.querySelector('h1') === window.__originalHomeHeading);
      if (!held || !stable || !retained) throw new Error(JSON.stringify({width, held, stable, retained, before, after}));
      await target.screenshot({path: prefix + '-after.png', clip: {x: 0, y: 0, width, height: Math.min(height, 1000)}});
      await target.getByRole('button', {name: 'Use dark theme', exact: true}).click();
      await target.locator('[data-tara-theme="dark"]').waitFor();
      await target.getByRole('button', {name: 'Use light theme', exact: true}).click();
      await heroLink.click();
      await target.waitForTimeout(700);
      const featureTop = await target.locator('#features').evaluate(e => e.getBoundingClientRect().top);
      if (featureTop < -1 || featureTop > 220) throw new Error(`Wrong feature scroll: ${featureTop}`);
      await target.evaluate(() => scrollTo({top: 0, behavior: 'instant'}));
      const menu = target.getByRole('button', {name: 'Open menu', exact: true});
      if (await menu.isVisible()) {
        await menu.click();
        const link = target.locator('#tara-mobile-menu').getByRole('link', {name: 'How it works', exact: true});
        if (await link.getAttribute('href') !== '#how-it-works') throw new Error('Wrong menu target');
        await link.click();
        await target.waitForTimeout(700);
        if (await target.locator('#tara-mobile-menu').count()) throw new Error('Menu did not close');
      }
      const faq = target.locator('.tara-rx-faq-item').first();
      await faq.locator('summary').click();
      if (await faq.getAttribute('open') === null) throw new Error('FAQ did not open');
      const overflow = await target.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      if (overflow || errors.length) throw new Error(JSON.stringify({width, overflow, errors}));
      results.push({width, height, stable, retained, errors});
    } finally {
      release();
      await context.close();
    }
  }
  for (const width of [390, 1440]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    try {
      await context.route(/google-analytics|googletagmanager|formspree/, route => route.abort());
      await context.route(/\/assets\/homepage-[^/]+\.js$/, async route => {await gate; await route.continue();});
      const target = await context.newPage();
      await target.goto(origin, {waitUntil: 'commit'});
      await target.locator('[data-tara-ready="false"]').waitFor();
      await target.evaluate(() => document.fonts.ready);
      await target.getByRole('link', {name: 'See how it works', exact: true}).click();
      await target.waitForTimeout(1200);
      if (!target.url().endsWith('/#features')) throw new Error('Early native link failed');
      const faq = target.locator('.tara-rx-faq-item').first();
      await faq.scrollIntoViewIfNeeded();
      await target.waitForTimeout(1200);
      await faq.locator('summary').click();
      const before = await target.evaluate(() => {
        window.__earlyFaq = document.querySelector('.tara-rx-faq-item');
        return scrollY;
      });
      release();
      await target.locator('[data-tara-ready="true"]').waitFor();
      await target.waitForTimeout(400);
      const after = await target.evaluate(() => ({scroll: scrollY,
        sameFaq: window.__earlyFaq === document.querySelector('.tara-rx-faq-item'),
        open: document.querySelector('.tara-rx-faq-item').open}));
      if (!after.sameFaq || !after.open || Math.abs(before - after.scroll) > 1) {
        throw new Error(`Early interaction lost: ${JSON.stringify({width, before, after})}`);
      }
      await target.goto(origin + '/#how-it-works');
      await target.waitForFunction(() => {
        const section = document.getElementById('how-it-works');
        return Math.abs(section.getBoundingClientRect().top - parseFloat(getComputedStyle(section).scrollMarginTop)) < 2;
      });
      const top = await target.locator('#how-it-works').evaluate(el => el.getBoundingClientRect().top);
      if (top < -1 || top > 220) throw new Error(`Deep link missed: ${top}`);
      await target.locator('.tara-rx-footer-links a[href="#pricing"]').click();
      await target.waitForTimeout(1200);
      await target.goBack();
      if (!target.url().endsWith('/#how-it-works')) throw new Error('Fragment history lost');
      results.push({width, earlyFaqRetained: true, readingPositionRetained: true, deepLinkAndBack: true});
    } finally {
      release();
      await context.close();
    }
  }
  for (const width of [390, 1440]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}, javaScriptEnabled: false});
    try {
      const target = await context.newPage();
      await target.goto(origin, {waitUntil: 'load'});
      await target.getByRole('link', {name: 'See how it works', exact: true}).click();
      if (!target.url().endsWith('/#features')) throw new Error('No-JS section link failed');
      await target.waitForTimeout(1200);
      const faq = target.locator('.tara-rx-faq-item').first();
      await faq.scrollIntoViewIfNeeded();
      await target.waitForTimeout(1200);
      await faq.locator('summary').click();
      if (await faq.getAttribute('open') === null) throw new Error('No-JS FAQ failed');
      if (await target.locator('a[href="/configurator/"]').count() < 1) throw new Error('No-JS planner link missing');
      results.push({width, javaScript: false, nativeNavigation: true, nativeFaq: true});
    } finally {
      await context.close();
    }
  }
  return {origin, results};
}
