// Playwright MCP: navigate to a production-format local origin before running.
async page => {
  const origin = await page.evaluate(() => location.origin);
  const results = [];
  for (const width of [1440, 390, 360]) {
    const context = await page.context().browser().newContext({viewport: {width, height: 950}, hasTouch: width < 500});
    let posts = 0;
    let payload = '';
    let phase = 'opening';
    let target;
    const errors = [];
    try {
      await context.route(/google-analytics\.com|googletagmanager\.com/, r => r.abort());
      await context.route('https://formspree.io/**', async r => {posts++; payload = r.request().postData() || ''; await r.fulfill({status: 200, contentType: 'application/json', headers: {'Access-Control-Allow-Origin': origin}, body: '{"ok":true}'});});
      target = await context.newPage();
      target.on('pageerror', e => errors.push(e.message));
      await target.goto(`${origin}/configurator/`);
      await target.getByRole('button', {name: /^Apartment or condo/}).click();
      await target.locator('#tara-bedrooms').fill('1');
      await target.locator('#tara-levels').fill('2');
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      await target.getByRole('button', {name: /^Recommend the core system/}).click();
      await target.getByRole('button', {name: 'Continue', exact: true}).click();
      const originalPrice = await target.locator('.tara-cfg-preview-price strong').innerText();
      const early = await target.evaluate(() => performance.getEntriesByType('resource').some(e => /PlacementPlanner/.test(e.name)));
      if (early) throw new Error('Canvas editor loaded before opening the map.');
      await target.getByRole('button', {name: 'Open placement map', exact: true}).click();
      const dialog = target.getByRole('dialog');
      await dialog.waitFor();
      await target.getByRole('button', {name: 'Add first room', exact: true}).click();
      await dialog.getByLabel('Name', {exact: true}).fill('QA_PRIVATE_ROOM_742');
      await dialog.getByRole('button', {name: 'QA_PRIVATE_ROOM_742', exact: true}).click();
      if (await target.evaluate(() => JSON.stringify({events: window.taraClickEvents, dataLayer: window.dataLayer}).includes('QA_PRIVATE_ROOM_742'))) throw new Error('Private room label leaked on selection.');
      const editNumber = async (label, value) => {const input = dialog.getByLabel(label, {exact: true}); await input.fill(String(value)); await input.press('Tab');};
      await editNumber('X (ft)', 4); await editNumber('Y (ft)', 4); await editNumber('Width (ft)', 20); await editNumber('Depth (ft)', 16);
      await dialog.getByRole('button', {name: 'Add camera', exact: true}).click();
      await editNumber('X (ft)', 42); await editNumber('Y (ft)', 10);
      await editNumber('Range (ft)', 18); await editNumber('Angle (deg)', 80);
      await dialog.getByLabel('Direction', {exact: false}).fill('45');
      await dialog.getByRole('button', {name: 'Add mmWave sensor', exact: true}).click();
      await editNumber('X (ft)', 12); await editNumber('Y (ft)', 14);
      await editNumber('Range (ft)', 9); await editNumber('Angle (deg)', 120);
      // Read the persisted public contract, not React internals, to verify edits.
      const stored = async () => target.evaluate(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement);
      await target.waitForFunction(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement.items.length === 3);
      await target.waitForFunction(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement.items.find(i => i.kind === 'presence').range === 9);
      const map = await stored();
      await target.locator('.tp-surface').scrollIntoViewIfNeeded();
      const box = await target.locator('.tp-surface').boundingBox();
      const dimensions = await target.locator('.tp-surface').evaluate(el => ({width: el.clientWidth, height: el.clientHeight}));
      const scale = Math.min((dimensions.width - 32) / map.width, (dimensions.height - 40) / map.depth);
      const x = box.x + 1 + (dimensions.width - map.width * scale) / 2 + 12 * scale;
      const y = box.y + 1 + (dimensions.height - map.depth * scale) / 2 + 14 * scale;
      if (width < 500) {
        const cdp = await context.newCDPSession(target);
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
        for (let n = 1; n <= 5; n++) await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + 5 * scale * n / 5, y: y + 3 * scale * n / 5}]});
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
        await cdp.detach();
      } else {
        await target.mouse.move(x, y); await target.mouse.down(); await target.mouse.move(x + 5 * scale, y + 3 * scale, {steps: 8}); await target.mouse.up();
      }
      await target.waitForFunction(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement.items.find(i => i.kind === 'presence').x !== 12);
      const dragged = (await stored()).items.find(i => i.kind === 'presence');
      if (Math.abs(dragged.x - 17) > 0.5) throw new Error(`Drag failed at ${width}: ${JSON.stringify(dragged)}`);
      await dialog.getByRole('button', {name: 'Undo', exact: true}).click();
      await dialog.getByRole('button', {name: 'Redo', exact: true}).click();
      phase = 'draw room';
      await dialog.getByRole('button', {name: 'Draw room', exact: true}).click();
      await target.locator('.tp-surface').scrollIntoViewIfNeeded();
      const drawBox = await target.locator('.tp-surface').boundingBox();
      const startX = drawBox.x + 1 + (dimensions.width - map.width * scale) / 2 + 28 * scale;
      const startY = drawBox.y + 1 + (dimensions.height - map.depth * scale) / 2 + 25 * scale;
      if (width < 500) {
        const cdp = await context.newCDPSession(target);
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: startX, y: startY}]});
        for (let n = 1; n <= 8; n++) await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: startX + 16 * scale * n / 8, y: startY + 10 * scale * n / 8}]});
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
        await cdp.detach();
      } else {
        await target.mouse.move(startX, startY); await target.mouse.down();
        await target.mouse.move(startX + 16 * scale, startY + 10 * scale, {steps: 8}); await target.mouse.up();
      }
      await target.waitForFunction(() => JSON.parse(localStorage.getItem('tara-configurator-plan-v2')).draft.placement.items.filter(i => i.kind === 'room').length === 2);
      const drawnRoom = (await stored()).items.filter(i => i.kind === 'room')[1];
      if (Math.abs(drawnRoom.width - 16) > 0.5 || Math.abs(drawnRoom.depth - 10) > 0.5) throw new Error(`Room drawing failed: ${JSON.stringify(drawnRoom)}`);
      await dialog.getByRole('button', {name: 'Delete selected placement', exact: true}).click();
      await dialog.getByRole('button', {name: 'Undo', exact: true}).click();
      await dialog.getByRole('button', {name: 'Redo', exact: true}).click();
      await dialog.getByRole('button', {name: 'Zoom in', exact: true}).click();
      await dialog.getByRole('button', {name: 'Fit map', exact: true}).click();
      await dialog.getByLabel('Floor', {exact: true}).selectOption('2');
      await dialog.getByRole('button', {name: 'Add first room', exact: true}).click();
      await dialog.getByLabel('Name', {exact: true}).fill('Bedroom');
      await dialog.getByLabel('Floor', {exact: true}).selectOption('1');
      // A small raster fixture exercises decode, local storage, and export without external image requests.
      phase = 'upload';
      await target.locator('input[type=file]').evaluate(input => {
        const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 600, 400); ctx.strokeStyle = '#475f52'; ctx.lineWidth = 8; ctx.strokeRect(40, 40, 520, 320); ctx.strokeRect(40, 40, 220, 180);
        const bytes = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]), c => c.charCodeAt(0));
        const data = new DataTransfer(); data.items.add(new File([bytes], 'qa-floor.png', {type: 'image/png'})); input.files = data.files; input.dispatchEvent(new Event('change', {bubbles: true}));
      });
      await dialog.getByRole('button', {name: 'Remove floor-plan image', exact: true}).waitFor();
      const pixels = await target.locator('canvas').evaluate(el => {
        const data = el.getContext('2d').getImageData(0, 0, el.width, el.height).data;
        let blue = 0, orange = 0, opaque = 0;
        for (let n = 0; n < data.length; n += 4) {if (data[n + 3]) opaque++; if (data[n+2] > data[n] + 15 && data[n+2] > data[n+1]) blue++; if (data[n] > data[n+2] + 25 && data[n] > data[n+1]) orange++;}
        return {blue, orange, opaque};
      });
      if (pixels.blue < 50 || pixels.orange < 50 || pixels.opaque < 10000) throw new Error(`Blank/missing map coverage: ${JSON.stringify(pixels)}`);
      const downloadEvent = target.waitForEvent('download');
      await dialog.getByRole('button', {name: 'Download floor map', exact: true}).click();
      const download = await downloadEvent; await download.saveAs(`/tmp/tara-map-export-${width}.png`);
      if (await target.locator('.tara-cfg-preview-price strong').innerText() !== originalPrice) throw new Error('Drawing silently changed the quote.');
      await dialog.getByRole('button', {name: 'Apply counts to quote', exact: true}).click();
      await dialog.getByRole('status').waitFor();
      const price = await target.locator('.tara-cfg-preview-price strong').innerText();
      if (price === originalPrice) throw new Error('Applying camera counts did not update the quote.');
      await target.locator('.tp-body').evaluate(el => {el.scrollTop = 0;});
      await dialog.screenshot({path: `/tmp/tara-map-dialog-${width}.png`});
      const overflow = await dialog.evaluate(el => el.scrollWidth > el.clientWidth + 1);
      if (overflow) throw new Error(`Dialog overflows at ${width}`);
      await target.keyboard.press('Escape');
      phase = 'restore';
      await target.reload();
      await target.getByRole('button', {name: 'Open placement map', exact: true}).click();
      await target.getByRole('button', {name: 'QA_PRIVATE_ROOM_742', exact: true}).waitFor();
      await target.getByRole('button', {name: 'Remove floor-plan image', exact: true}).waitFor();
      await target.getByRole('button', {name: 'Remove floor-plan image', exact: true}).click();
      await target.locator('input[type=file]').evaluate(input => {
        const data = new DataTransfer(); data.items.add(new File(['not a raster'], 'qa.svg', {type: 'image/svg+xml'})); input.files = data.files; input.dispatchEvent(new Event('change', {bubbles: true}));
      });
      await target.getByRole('alert').filter({hasText: 'Choose a PNG'}).waitFor();
      await target.getByRole('button', {name: 'Close placement planner', exact: true}).click();
      await target.getByRole('button', {name: 'Review my plan', exact: true}).click();
      await target.getByRole('button', {name: 'Continue to contact', exact: true}).click();
      const form = target.locator('.tara-cfg-contact-form');
      await form.locator('[name=name]').fill('Planner QA'); await form.locator('[name=email]').fill('planner-qa@example.com'); await form.locator('[name=zipCode]').fill('99999');
      await target.getByRole('button', {name: 'Send my plan', exact: true}).click();
      await target.locator('.tara-cfg-success').waitFor();
      const analytics = await target.evaluate(() => JSON.stringify({events: window.taraClickEvents, dataLayer: window.dataLayer}));
      if (analytics.includes('QA_PRIVATE_ROOM_742') || analytics.includes('data:image')) throw new Error('Private map data leaked into analytics.');
      if (posts !== 1 || !payload.includes('QA_PRIVATE_ROOM_742') || payload.includes('data:image')) throw new Error('Incorrect placement submission payload.');
      if (await target.evaluate(() => localStorage.getItem('tara-configurator-plan-v2'))) throw new Error('Submitted draft not cleared.');
      if (errors.length) throw new Error(errors.join('\n'));
      results.push({width, lazyLoaded: true, drag: width < 500 ? 'touch' : 'mouse', pixels, restored: true, quoteApplied: price, privateAnalytics: true, mockedSubmissions: posts, realSubmissions: 0});
    } catch (error) {
      if (target) await target.screenshot({path: `/tmp/tara-map-failure-${width}.png`});
      const state = target && await target.evaluate(() => {const p = JSON.parse(localStorage.getItem('tara-configurator-plan-v2') || 'null'); return {images: Object.keys(p?.draft?.placement?.images || {}), itemCount: p?.draft?.placement?.items?.length, text: document.querySelector('dialog')?.innerText};});
      throw new Error(`${width}px / ${phase}: ${error.message}\n${JSON.stringify(state)}`);
    } finally {await context.close();}
  }
  return results;
}
