// Drives a full session in Chromium: learns chunk 1 (with a few deliberate misses), checks saving and the parent page.
const { chromium } = require('playwright');
const OUT = process.argv[2] || '/tmp';
(async () => {
  const b = await chromium.launch();
  const page = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:8080/index.html?k=testkey&debug=1');
  await page.waitForSelector('[data-act="start"]');
  await page.screenshot({ path: OUT + '/home.png', fullPage: true });
  async function runSession(tag, missEvery) {
    await page.click('[data-act="start"]');
    let n = 0, shots = {};
    for (let guard = 0; guard < 400; guard++) {
      await page.waitForTimeout(40);
      if (await page.$('.card.end')) break;
      const kind = await page.evaluate(() => { const s = window.__fr.ses(); if (!s) return 'none'; const st = s.steps[s.i]; if (!st) return 'end'; if (st.t !== 'q') return st.t; return s.fb ? 'fb' : s.q ? s.q.type : 'q'; });
      if (!shots[kind]) { shots[kind] = 1; await page.screenshot({ path: OUT + '/' + tag + '-' + kind + '.png', fullPage: true }); }
      if (['phase', 'concept', 'card'].includes(kind)) { await page.click('[data-act="next"]'); continue; }
      if (kind === 'fb') { await page.click('[data-act="cont"]'); continue; }
      n++; const miss = missEvery && n % missEvery === 0;
      const q = await page.evaluate(() => { const q = window.__fr.ses().q; return { type: q.type, answer: q.answer, choices: q.choices, answers: q.answers, pieces: q.pieces, idx: window.__fr.ses().build && window.__fr.ses().build.idx, fixing: window.__fr.ses().build && window.__fr.ses().build.fixing }; });
      if (q.type === 'mc') { let i = q.choices.indexOf(q.answer); if (miss) i = (i + 1) % q.choices.length; await page.click('[data-choice="' + i + '"]'); }
      else if (q.type === 'type') { await page.fill('#answer', miss ? 'zzz' : q.answers[0]); await page.click('form [type=submit]'); }
      else if (q.type === 'build') { await page.fill('#answer', miss && !q.fixing ? 'zzz' : q.pieces[q.idx].replace(/^-/, '')); await page.click('form [type=submit]'); }
    }
    await page.screenshot({ path: OUT + '/' + tag + '-end.png', fullPage: true });
    console.log(tag, 'answered', n, await page.textContent('.card.end h2'));
    await page.click('[data-act="home"]'); await page.waitForTimeout(1500);
  }
  await runSession('s1', 5);
  await page.screenshot({ path: OUT + '/home2.png', fullPage: true });
  const db = await (await page.request.get('http://localhost:8080/__db')).json();
  console.log('db chunks', Object.keys(db.state.chunks || {}), 'events', db.events.length, 'items', Object.keys(db.state.items).length);
  // reload: progress must come back from the "database"
  await page.reload(); await page.waitForSelector('.today');
  console.log('after reload:', (await page.textContent('.today h2')));
  // learn everything else quickly
  for (let k = 0; k < 9; k++) { if (!(await page.$('[data-act="start"]'))) { const a = await page.$('[data-act="ahead"]'); if (!a) break; await a.click(); await page.waitForTimeout(100); await page.evaluate(() => {}); } else { } if (await page.$('.sesbar')) { /* already in session via ahead */ } else if (await page.$('[data-act="start"]')) { } await runSessionFrom(); }
  async function runSessionFrom() { if (!(await page.$('.sesbar'))) { const s = await page.$('[data-act="start"]'); if (!s) return; } else { await page.evaluate(() => {}); }
    // reuse runSession logic but start may already be clicked
    if (await page.$('.sesbar')) { await page.evaluate(() => {}); }
  }
  console.log('errors:', errs.slice(0, 10));
  const pp = await b.newPage({ viewport: { width: 1366, height: 900 } });
  await pp.goto('http://localhost:8080/parent.html?p=parentkey'); await pp.waitForSelector('.wrap');
  await pp.screenshot({ path: OUT + '/parent.png', fullPage: true });
  const ph = await b.newPage({ viewport: { width: 400, height: 860 } });
  await ph.goto('http://localhost:8080/index.html?k=testkey&debug=1'); await ph.waitForSelector('.today');
  await ph.screenshot({ path: OUT + '/phone-home.png', fullPage: true });
  console.log('overflow phone:', await ph.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await b.close();
})();
