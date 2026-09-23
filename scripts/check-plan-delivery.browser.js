// All form delivery and analytics are intercepted; never creates production leads.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  for (const width of [1440, 390, 320]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 900}});
    let mode = 'html';
    const requests = [], errors = [];
    try {
      await context.route(/google-analytics|googletagmanager/, r => r.abort());
      await context.route('https://formspree.io/**', async r => {
        requests.push({body: r.request().postData(), contentType: r.request().headers()['content-type']});
        if (mode === 'hang') return;
        if (mode === 'network') return r.abort('failed');
        await r.fulfill({status: mode === 'limit' ? 429 : 200,
          contentType: mode === 'html' ? 'text/html' : 'application/json',
          body: mode === 'html' ? '<html>Verification required</html>' :
            mode === 'errors' ? '{"ok":true,"errors":[{"message":"blocked"}]}' :
            mode === 'limit' ? '{"error":"Too many requests"}' : '{"ok":true}'});
      });
      const target = await context.newPage();
      target.on('pageerror', e => errors.push(e.message));
      await target.addInitScript(() => {
        const original = window.setTimeout;
        window.setTimeout = (fn, ms, ...args) => original(fn, ms === 30000 && window.__fastDeliveryTimeout ? 50 : ms, ...args);
        const create = URL.createObjectURL;
        URL.createObjectURL = blob => {
          if (blob.type === 'application/json') window.__requestCopy = blob.text();
          return create(blob);
        };
      });
      await target.goto(origin + '/configurator/');
      await target.getByRole('button', {name: /^Apartment or condo/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: /^Recommend the core/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: 'Review my plan', exact: true}).click();
      await target.getByRole('button', {name: 'Continue to contact', exact: true}).click();
      const privateFields = {name: 'PRIVATE_DELIVERY_QA', email: 'delivery-qa@example.com', zipCode: '99999', message: 'PRIVATE_DELIVERY_MESSAGE'};
      for (const [name, value] of Object.entries(privateFields)) await target.locator('.tara-cfg-contact-form [name="' + name + '"]').fill(value);
      const submit = target.getByRole('button', {name: 'Send my plan', exact: true});
      for (const failure of ['html', 'errors', 'limit', 'network', 'hang']) {
        mode = failure;
        await target.evaluate(fast => window.__fastDeliveryTimeout = fast, failure === 'hang');
        await submit.click();
        await target.getByRole('alert').waitFor();
        await submit.waitFor({state: 'visible'});
        if (await submit.isDisabled() || await target.locator('.tara-cfg-success').count()) throw new Error('False success or stuck submit: ' + failure);
        if (!(await target.evaluate(() => localStorage.getItem('tara-configurator-plan-v2')))) throw new Error('Failed request erased plan');
        if (await target.locator('input[name="email"]').inputValue() !== privateFields.email) throw new Error('Contact lost on failure');
      }
      await target.getByRole('alert').screenshot({path: '/tmp/tara-delivery-error-' + width + '.png'});
      const download = target.waitForEvent('download');
      await target.getByRole('button', {name: 'Download request', exact: true}).click();
      await (await download).saveAs('/tmp/tara-delivery-unconfirmed-' + width + '.json');
      const unconfirmed = await target.evaluate(async () => JSON.parse(await window.__requestCopy));
      if (unconfirmed.status !== 'receipt_unconfirmed' || unconfirmed.emailDelivery !== 'not_verified') throw new Error('Unconfirmed copy claims delivery');
      mode = 'success';
      await target.evaluate(() => {
        window.__fastDeliveryTimeout = false;
        window.gtag = (...args) => {if (String(args[1]).startsWith('configurator_submit_')) throw new Error('Simulated broken analytics');};
      });
      // Two same-tick submissions must produce only one request.
      const before = requests.length;
      await target.locator('.tara-cfg-contact-form').evaluate(form => {form.requestSubmit(); form.requestSubmit();});
      await target.locator('.tara-cfg-success').waitFor();
      if (requests.length !== before + 1 || errors.length) throw new Error('Analytics or duplicate-submit failure: ' + JSON.stringify(errors));
      const sent = await target.evaluate(async reqs => {
        const parsed = [];
        for (const r of reqs) parsed.push(Object.fromEntries(await new Response(r.body, {headers: {'Content-Type': r.contentType}}).formData()));
        return parsed;
      }, requests);
      if (new Set(sent.map(s => s.requestReference)).size !== 1 || sent[0].requestReference !== unconfirmed.reference) throw new Error('Retries lost request identity');
      const acceptedDownload = target.waitForEvent('download');
      await target.getByRole('button', {name: 'Download request', exact: true}).click();
      await (await acceptedDownload).saveAs('/tmp/tara-delivery-accepted-' + width + '.json');
      const accepted = await target.evaluate(async () => JSON.parse(await window.__requestCopy));
      if (accepted.status !== 'accepted_by_form_service' || accepted.emailDelivery !== 'not_verified' || accepted.payload.email !== privateFields.email) throw new Error('Incorrect accepted copy');
      if (await target.evaluate(() => localStorage.getItem('tara-configurator-plan-v2'))) throw new Error('Accepted plan draft not cleared');
      await target.getByRole('link', {name: 'Email Tara', exact: true}).evaluate(link => {
        link.addEventListener('click', e => e.preventDefault(), {once: true});
        link.click();
      });
      const analytics = await target.evaluate(() => JSON.stringify({queue: window.dataLayer, events: window.taraClickEvents}));
      if ([privateFields.name, privateFields.email, privateFields.message, accepted.reference].some(v => analytics.includes(v))) throw new Error('Private request data in analytics');
      if (await target.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('Horizontal overflow');
      await target.locator('.tara-cfg-success').screenshot({path: '/tmp/tara-delivery-success-' + width + '.png'});
      results.push({width,failuresHandled:5,duplicateBlocked:true,analyticsCannotBlock:true,referenceStable:true,privateCopies:true,realSubmissions:0,errors});
    } finally {
      await context.close();
    }
  }
  return results;
}
