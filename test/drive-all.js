const { chromium } = require('playwright');
const OUT = process.argv[2];
(async () => {
  const b = await chromium.launch(); const page = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('http://localhost:8080/index.html?debug=1'); await page.waitForSelector('.today');
  for (let c = 0; c < 10; c++) {
    const btn = (await page.$('[data-act="start"]')) || (await page.$('[data-act="ahead"]'));
    if (!btn) break; await btn.click();
    let n = 0; const shots = {}; const title = await page.textContent('.sestitle');
    for (let g = 0; g < 600; g++) {
      if (await page.$('.card.end')) break;
      const kind = await page.evaluate(() => { const s = window.__fr.ses(); const st = s.steps[s.i]; if (!st) return 'end'; if (st.t !== 'q') return st.t; return s.fb ? (s.fb.ok ? 'fbok' : 'fbbad') : s.q ? s.q.type + (s.q.listen ? '-listen' : '') + (s.q.pics ? '-pics' : '') : 'q'; });
      if (!shots[kind] && ['card','concept','mc','type','build','fbbad','mc-listen','mc-pics','type-pics'].includes(kind)) { shots[kind] = 1; await page.screenshot({ path: OUT + '/c' + c + '-' + kind + '.png' }); }
      if (['phase', 'concept', 'card'].includes(kind)) { await page.click('[data-act="next"]'); continue; }
      if (kind.startsWith('fb')) { await page.click('[data-act="cont"]'); continue; }
      n++; const miss = n % 7 === 0;
      const q = await page.evaluate(() => { const s = window.__fr.ses(), q = s.q; return { type: q.type, answer: q.answer, choices: q.choices, answers: q.answers, pieces: q.pieces, idx: s.build && s.build.idx, fixing: s.build && s.build.fixing }; });
      if (q.type === 'mc') { let i = q.choices.indexOf(q.answer); if (miss) i = (i + 1) % q.choices.length; await page.click('[data-choice="' + i + '"]'); }
      else if (q.type === 'type') { await page.fill('#answer', miss ? 'zzz' : q.answers[0]); await page.press('#answer', 'Enter'); }
      else { await page.fill('#answer', miss && !q.fixing ? 'zzz' : q.pieces[q.idx].replace(/^-/, '')); await page.press('#answer', 'Enter'); }
    }
    console.log(c, title, n, await page.textContent('.card.end h2'));
    await page.click('[data-act="home"]'); await page.waitForTimeout(900);
  }
  await page.screenshot({ path: OUT + '/home-end.png', fullPage: true });
  // practice quiz
  await page.click('[data-act="quiz"]'); await page.waitForTimeout(200); await page.screenshot({ path: OUT + '/quiz.png' });
  console.log('errors', errs); await b.close();
})();
