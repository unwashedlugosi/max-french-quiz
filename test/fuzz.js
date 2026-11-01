const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const page = await b.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(e.message));
  await page.goto('http://localhost:8080/index.html?debug=1'); await page.waitForSelector('.today');
  const res = await page.evaluate(() => {
    const out = []; const seen = {};
    const A = window.FR_AUDIO, key = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.,;:«»—…"]/g, ' ').replace(/\s+/g, ' ').trim();
    const missingAudio = new Set();
    for (const it of window.__fr.items) for (let lvl = 0; lvl < 4; lvl++) for (let r = 0; r < 60; r++) {
      let q; try { q = window.__fr.buildQ({ id: it.id, lvl }); } catch (e) { out.push(it.id + ' L' + lvl + ' THROW ' + e.message); break; }
      const txt = JSON.stringify(q, (k, v) => (k === 'item' || k === 'noun' ? undefined : v));
      if (/undefined|NaN|null,"|\[object/.test(txt)) out.push(it.id + ' L' + lvl + ' bad: ' + txt.slice(0, 300));
      if (q.type === 'mc') { if (q.choices.indexOf(q.answer) < 0) out.push(it.id + ' L' + lvl + ' answer not in choices ' + q.answer + ' | ' + q.choices); if (q.choices.length < 2 || new Set(q.choices).size !== q.choices.length) out.push(it.id + ' L' + lvl + ' choices ' + q.choices); }
      if (q.type === 'type' && (!q.answers || !q.answers[0])) out.push(it.id + ' no answers');
      if (q.type === 'build' && (!q.pieces || q.pieces.length < 2)) out.push(it.id + ' build pieces');
      [q.say, q.listen].filter(Boolean).forEach((t) => { if (!A[key(t)]) missingAudio.add(t); });
      if (q.show) { const t = String(q.show).replace(/\s*\(.*\)$/, ''); if (!A[key(t)] && !/^\d/.test(t)) missingAudio.add(t); }
      if (q.type === 'mc' && q.frChoices && !A[key(q.answer)]) missingAudio.add(q.answer);
      const k2 = it.id + lvl + q.type; seen[k2] = 1;
    }
    return { problems: [...new Set(out)].slice(0, 40), missingAudio: [...missingAudio].slice(0, 40), types: Object.keys(seen).length };
  });
  console.log(JSON.stringify(res, null, 1)); console.log('errs', errs); await b.close();
})();
