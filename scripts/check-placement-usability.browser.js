// Run on a production-format origin. All inquiry delivery is mocked.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  const catalog = [
    ['window', 'Add window'], ['door', 'Add door'], ['camera', 'Add camera'],
    ['presence', 'Add mmWave sensor'], ['windowSensor', 'Add window sensor'],
    ['doorSensor', 'Add door sensor'], ['light', 'Add smart light'], ['switch', 'Add wall switch'],
    ['thermostat', 'Add thermostat'], ['doorbell', 'Add doorbell'], ['hub', 'Add local server'],
    ['speaker', 'Add speaker'], ['voice', 'Add voice assistant'], ['plug', 'Add smart plug'],
    ['shade', 'Add window shade'], ['lock', 'Add smart lock'], ['tv', 'Add tv'],
    ['vacuum', 'Add robot vacuum'], ['mower', 'Add lawn mower'], ['leak', 'Add leak sensor'],
  ];
  for (const width of [1440, 390, 360, 320]) {
    const context = await page.context().browser().newContext({viewport: {width, height: width <= 360 ? 640 : width === 390 ? 844 : 950}, hasTouch: width < 500});
    const errors = [];
    let payload = '', contentType = '', posts = 0, target, phase = 'open';
    try {
      await context.route(/google-analytics|googletagmanager/, r => r.abort());
      await context.route('https://formspree.io/**', async r => {
        posts++; payload = r.request().postData() || ''; contentType = r.request().headers()['content-type'];
        await r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': origin}, body: '{"ok":true}'});
      });
      target = await context.newPage();
      target.on('pageerror', e => errors.push(e.message));
      await target.goto(origin + '/configurator/');
      await target.getByRole('button', {name: /^Apartment or condo/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: /^Recommend the core/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      const originalPrice = await target.locator('.tara-cfg-preview-price strong').innerText();
      await target.getByRole('button', {name: 'Open placement map', exact: true}).click();
      const dialog = target.getByRole('dialog');
      await dialog.waitFor();
      const saved = () => target.evaluate(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement);
      const settle = async () => {
        // Let React paint the saving state before observing the debounced draft.
        await target.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await target.waitForFunction(() => document.querySelector('.tp-footer p')?.textContent.startsWith('Saved on this device.'));
      };
      const add = async name => {
        await dialog.getByRole('button', {name: 'Add items', exact: true}).click();
        await dialog.getByLabel('Find an item').fill('');
        await dialog.locator('.tp-catalog').getByRole('button', {name, exact: true}).click();
        await settle();
      };
      const choose = async name => {
        await dialog.getByRole('tab', {name: 'Items', exact: true}).click();
        await dialog.locator('.tp-item-list').getByRole('button', {name, exact: true}).click();
      };
      const edit = async (name, n) => {
        await dialog.getByRole('button', {name: 'Edit selected placement'}).click();
        const input = dialog.getByLabel(name, {exact: true});
        if (!(await input.isVisible())) await dialog.locator('.tp-exact summary').click();
        await input.fill(String(n)); await input.press('Tab'); await settle();
      };
      if (await dialog.locator('.tp-catalog button').count() !== 21) throw new Error('Incomplete visible item catalogue');
      const targets = await dialog.locator('.tp-catalog button').evaluateAll(nodes => nodes.map(el => ({text: el.textContent.trim(), height: el.getBoundingClientRect().height})));
      if (targets.some(t => !t.text || t.height < 48)) throw new Error('Missing catalogue names or undersized targets');
      await dialog.screenshot({path: '/tmp/tara-planner-usability-' + width + '-catalog.png'});
      await dialog.getByRole('button', {name: 'Add first room', exact: true}).click();
      await dialog.getByLabel('Name', {exact: true}).fill('QA_PRIVATE_LIVING_ROOM');
      await settle();
      await add('Add window');
      await dialog.getByRole('button', {name: 'Add window sensor', exact: true}).click();
      await settle();
      let plan = await saved();
      const window = plan.items.find(i => i.kind === 'window');
      if (plan.items.find(i => i.kind === 'windowSensor').attachedTo !== window.id) throw new Error('Quick-add sensor not attached');
      await choose(window.name);
      await dialog.getByRole('button', {name: 'Rotate right 45 degrees', exact: true}).click();
      await settle();
      plan = await saved();
      if (plan.items.find(i => i.kind === 'windowSensor').rotation !== 45) throw new Error('Attached sensor did not rotate with window');
      await dialog.getByRole('button', {name: 'Delete selected placement', exact: true}).click();
      await settle();
      if ((await saved()).items.some(i => i.kind === 'window' || i.kind === 'windowSensor')) throw new Error('Opening deletion left its sensor behind');
      await dialog.getByRole('button', {name: 'Undo', exact: true}).click();
      await settle();
      await add('Add door');
      await dialog.getByRole('button', {name: 'Add door sensor', exact: true}).click();
      await settle();
      await dialog.getByRole('button', {name: 'Add items', exact: true}).click();
      await dialog.getByLabel('Find an item').fill('speaker');
      if (await dialog.locator('.tp-catalog button').count() !== 1) throw new Error('Catalogue search not narrowed');
      await dialog.getByRole('button', {name: 'Add speaker', exact: true}).click();
      await settle();
      await add('Add camera');
      await edit('X (ft)', 30); await edit('Y (ft)', 20);
      await dialog.getByRole('button', {name: 'Rotate left 45 degrees', exact: true}).click(); await settle();
      if ((await saved()).items.find(i => i.kind === 'camera').rotation !== 315) throw new Error('Left rotation did not wrap');
      await dialog.getByRole('button', {name: 'Rotate right 45 degrees', exact: true}).focus();
      await target.keyboard.press('Enter'); await settle();
      if ((await saved()).items.find(i => i.kind === 'camera').rotation !== 0) throw new Error('Keyboard rotation failed');
      phase = 'direct rotation';
      await dialog.getByRole('button', {name: 'Fit map', exact: true}).click();
      await target.locator('.tp-surface').scrollIntoViewIfNeeded();
      const box = await target.locator('.tp-surface').boundingBox();
      const dims = await target.locator('.tp-surface').evaluate(el => ({width: el.clientWidth, height: el.clientHeight}));
      const scale = Math.min((dims.width - 32) / 60, (dims.height - 40) / 40);
      const x = box.x + 1 + dims.width / 2, y = box.y + 1 + dims.height / 2;
      if (width < 500) {
        const cdp = await context.newCDPSession(target);
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: x + 58, y}]});
        for (let n = 1; n <= 12; n++) await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + 58 * Math.cos(n / 12 * Math.PI / 2), y: y + 58 * Math.sin(n / 12 * Math.PI / 2)}]});
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []}); await cdp.detach();
      } else {
        await target.mouse.move(x + 58, y); await target.mouse.down();
        for (let n = 1; n <= 12; n++) await target.mouse.move(x + 58 * Math.cos(n / 12 * Math.PI / 2), y + 58 * Math.sin(n / 12 * Math.PI / 2));
        await target.mouse.up();
      }
      await settle();
      const camera = (await saved()).items.find(i => i.kind === 'camera');
      if (Math.abs(camera.rotation - 90) > 2 || camera.x !== 30 || camera.y !== 20) throw new Error('Rotation handle moved device or failed: ' + JSON.stringify(camera));
      await dialog.getByRole('button', {name: 'Undo', exact: true}).click(); await settle();
      if ((await saved()).items.find(i => i.kind === 'camera').rotation !== 0) throw new Error('Rotation drag did not undo as one action');
      await dialog.getByRole('button', {name: 'Redo', exact: true}).click(); await settle();
      await add('Add mmWave sensor');
      await dialog.screenshot({path: '/tmp/tara-planner-usability-' + width + '-devices.png'});
      phase = 'all devices';
      for (const [kind, name] of catalog) if (!(await saved()).items.some(i => i.kind === kind)) await add(name);
      plan = await saved();
      if (new Set(plan.items.map(i => i.kind)).size !== 21 || plan.version !== 2) throw new Error('Device types missing from saved plan');
      if (await target.locator('.tara-cfg-preview-price strong').innerText() !== originalPrice) throw new Error('Drawing changed the quote without approval');
      const overflow = await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      if (overflow || errors.length) throw new Error(JSON.stringify({overflow, errors}));
      const downloadEvent = target.waitForEvent('download');
      await dialog.getByRole('button', {name: 'Download floor map', exact: true}).click();
      await (await downloadEvent).saveAs('/tmp/tara-planner-usability-' + width + '-export.png');
      await dialog.getByRole('button', {name: 'Done', exact: true}).click();
      await target.reload();
      await target.getByRole('button', {name: 'Open placement map', exact: true}).click();
      await target.getByRole('tab', {name: 'Items', exact: true}).click();
      if (await target.locator('.tp-item-list button').count() !== plan.items.length) throw new Error('Expanded draft did not restore');
      await target.getByRole('button', {name: 'Done', exact: true}).click();
      await target.getByRole('button', {name: 'Review my plan', exact: true}).click();
      await target.getByRole('button', {name: 'Continue to contact', exact: true}).click();
      await target.locator('[name=name]').fill('Planner QA');
      await target.locator('[name=email]').fill('planner-qa@example.com');
      await target.locator('[name=zipCode]').fill('99999');
      await target.getByRole('button', {name: 'Send my plan', exact: true}).click();
      await target.locator('.tara-cfg-success').waitFor();
      const body = await target.evaluate(async ({payload, contentType}) =>
        Object.fromEntries((await new Response(payload, {headers: {'Content-Type': contentType}}).formData()).entries()), {payload, contentType});
      const submitted = JSON.parse(body.placementPlan);
      if (posts !== 1 || JSON.stringify(submitted.items) !== JSON.stringify(plan.items)) throw new Error('Device geometry not submitted correctly');
      const analytics = await target.evaluate(() => JSON.stringify({events: window.taraClickEvents, dataLayer: window.dataLayer}));
      if (analytics.includes('QA_PRIVATE_LIVING_ROOM') || analytics.includes('attachedTo')) throw new Error('Private placement data leaked to analytics');
      results.push({width, catalogueKinds: 21, namesVisible: true, attachment: true, rotationButtons: true, keyboard: true, rotationDrag: width < 500 ? 'touch' : 'mouse', restored: true, unchangedQuote: true, submittedKinds: 21, realSubmissions: 0, overflow: false, errors});
    } catch (error) {
      if (target) await target.screenshot({path: '/tmp/tara-planner-usability-failure-' + width + '.png'});
      throw new Error(width + 'px / ' + phase + ': ' + error.message);
    } finally {await context.close();}
  }
  return results;
}
