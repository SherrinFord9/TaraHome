// Run with Playwright MCP after opening the target origin. Deliberately hold the app bundle.
async (page) => {
  const origin = await page.evaluate(() => location.origin);
  if (!/^https?:\/\//.test(origin)) throw new Error('Navigate to the target site first.');
  const results = [];
  for (const width of [1440, 390]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    let release;
    let intercepted = false;
    const gate = new Promise(resolve => { release = resolve; });
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort());
      await context.route(/\/assets\/configurator-[^/]+\.js$/, async route => {
        intercepted = true;
        await gate;
        await route.continue();
      });
      const target = await context.newPage();
      await target.goto(`${origin}/configurator/`, {waitUntil: 'commit'});
      const choice = target.getByRole('button', {name: /^Apartment or condo/});
      await choice.waitFor();
      const before = await target.evaluate(() => {
        const fallback = document.querySelector('#root > .tara-configurator');
        const buttons = [...fallback.querySelectorAll('button')];
        return {
          busy: fallback.getAttribute('aria-busy') === 'true',
          allDisabled: buttons.length === 6 && buttons.every(button => button.disabled),
          mounted: !!document.querySelector('#tara-bedrooms'),
        };
      });
      if (!before.busy || !before.allDisabled || before.mounted) {
        throw new Error(`Unsafe pre-load controls ${width}: ${JSON.stringify(before)}`);
      }
      // Playwright waits for the real control; disabled browser clicks are not queued.
      const selection = choice.click();
      release();
      await selection;
      await target.locator('#tara-bedrooms').waitFor();
      const selected = await choice.getAttribute('aria-pressed');
      const canContinue = await target.getByRole('button', {name: 'Continue', exact: true}).isEnabled();
      const stillBusy = await target.locator('#root > [aria-busy="true"]').count();
      if (!intercepted || selected !== 'true' || !canContinue || stillBusy) {
        throw new Error(`First enabled selection failed ${width}: ${JSON.stringify({intercepted, selected, canContinue, stillBusy})}`);
      }
      results.push({width, ...before, appBundleHeld: intercepted, firstEnabledSelectionWorks: true, canContinue});
    } finally {
      release();
      await context.close();
    }
  }
  return results;
}
