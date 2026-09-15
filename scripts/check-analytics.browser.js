// Run with Playwright MCP after opening the target origin. All remote measurement and form delivery are blocked.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const results = [];
  for (const width of [1440, 390]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    let releaseApp;
    const gate = new Promise(resolve => { releaseApp = resolve; });
    let appHeld = false;
    let formAttempts = 0;
    let acceptForm = false;
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      await context.route(/\/assets\/main-[^/]+\.js$/, async route => {
        appHeld = true;
        await gate;
        await route.continue();
      });
      await context.route('https://formspree.io/**', async route => {
        formAttempts += 1;
        await route.fulfill({status: acceptForm ? 200 : 503,
          headers: {'Access-Control-Allow-Origin': origin},
          contentType: 'application/json', body: JSON.stringify({ok: acceptForm})});
      });
      const target = await context.newPage();
      await target.goto(origin, {waitUntil: 'commit'});
      await target.locator('.seo-static-fallback').waitFor();
      const clickCount = () => target.evaluate(() =>
        window.dataLayer.filter(row => row[0] === 'event' && row[1] === 'site_click').length);
      await target.locator('.seo-secondary').click();
      const beforeApp = await clickCount();
      if (beforeApp !== 1) throw new Error(`Fallback click count: ${beforeApp}`);
      releaseApp();
      await target.locator('.tara-rx-hero').waitFor();
      await target.waitForFunction(() => window.__taraAnalyticsReady === true);
      const beforeClick = await clickCount();
      await target.getByRole('button', {name: 'See how it works', exact: true}).click();
      const afterClick = await clickCount();
      if (!appHeld || afterClick - beforeClick !== 1) {
        throw new Error(`Duplicate/missing app click: ${JSON.stringify({appHeld, beforeClick, afterClick})}`);
      }

      await target.goto(`${origin}/configurator/`, {waitUntil: 'load'});
      await target.locator('#tara-bedrooms').waitFor();
      await target.getByRole('button', {name: /^Apartment or condo/}).click();
      await target.locator('#tara-bedrooms').fill('1');
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: /^Recommend the core system for me/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: 'Review my plan', exact: true}).click();
      await target.getByRole('button', {name: 'Continue to contact', exact: true}).click();
      const form = target.locator('.tara-cfg-contact-form');
      const submit = target.getByRole('button', {name: 'Send my plan', exact: true});
      const eventCount = name => target.evaluate(name =>
        window.dataLayer.filter(row => row[0] === 'event' && row[1] === name).length, name);
      await submit.click();
      if (formAttempts || await eventCount('configurator_submit_started')) {
        throw new Error('An invalid form was treated as a submission.');
      }
      const privateFields = {
        name: 'Measurement QA Example', email: 'measurement-qa@example.com',
        zipCode: '99999', phone: '202-555-0100', message: 'PRIVATE_MEASUREMENT_TEST_NOTE',
      };
      for (const [name, value] of Object.entries(privateFields)) {
        await form.locator(`[name="${name}"]`).fill(value);
      }
      await submit.click();
      await target.getByRole('alert').waitFor();
      if (formAttempts !== 1 || await eventCount('configurator_submit_success') !== 0 ||
          await eventCount('configurator_submit_error') !== 1) {
        throw new Error('A failed form response was counted as a lead.');
      }
      acceptForm = true;
      await submit.click();
      await target.locator('.tara-cfg-success').waitFor();
      const successCount = await eventCount('configurator_submit_success');
      const analytics = await target.evaluate(() => JSON.stringify({
        dataLayer: window.dataLayer, localEvents: window.taraClickEvents,
      }));
      const leaked = Object.keys(privateFields).filter(key => analytics.includes(privateFields[key]));
      if (formAttempts !== 2 || successCount !== 1 || leaked.length) {
        throw new Error(`Submission measurement: ${JSON.stringify({formAttempts, successCount, leaked})}`);
      }
      results.push({width, fallbackClicks: beforeApp, appClicks: afterClick - beforeClick,
        invalidFormBlocked: true, failedResponseNotCounted: true,
        mockedSuccessEvents: successCount, privateFormFieldsInEvents: false,
        mockedFormRequests: formAttempts, realFormRequests: 0});
    } finally {
      releaseApp();
      await context.close();
    }
  }
  return results;
}
