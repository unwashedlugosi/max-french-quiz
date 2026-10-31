/* parent.js — Dave's read-only tracker: what Max studied, what he typed, what he keeps missing. */
(function () {
  'use strict';
  const FR = window.FR, $app = document.getElementById('app');
  const ITEMS = {}; FR.items.forEach((it) => { ITEMS[it.id] = it; });
  const CHUNK = {}; FR.chunks.forEach((c) => { CHUNK[c.id] = c; });
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isVowel = (w) => /^[aeiouhéèêàâîôûœ]/i.test(w);
  const withDef = (n) => (isVowel(n.w) ? 'l\'' : n.g === 'f' ? 'la ' : 'le ') + n.w;
  const ymd = (d) => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmtTime = (d) => new Date(d).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  const LVL = ['recognize', 'pick', 'spell', 'write'];
  function label(itemId) {
    const [id, n] = String(itemId).split(':');
    const it = ITEMS[id]; if (!it) return itemId;
    if (it.kind === 'num') return n != null ? n + ' (' + FR.numFr(+n) + ')' : 'Numbers ' + it.label;
    if (it.kind === 'noun') return withDef(it) + ' = ' + it.en;
    return it.fr + ' = ' + it.en;
  }
  function minutesOf(evs) { // active time: gaps under 3 minutes count
    const ts = evs.map((e) => +new Date(e.at)).sort((a, b) => a - b); let m = 0;
    for (let i = 1; i < ts.length; i++) { const g = ts[i] - ts[i - 1]; if (g < 180e3) m += g; }
    return Math.round(m / 60e3);
  }
  const dots = (box) => '<span class="dots">' + [1, 2, 3, 4].map((k) => '<i class="' + (box >= k ? 'on' : '') + '"></i>').join('') + '</span>';

  function render(d) {
    const S = d.state && d.state.items ? d.state : { items: {}, chunks: {}, sessions: 0 };
    const evs = d.events || [];
    const today = ymd(Date.now());
    const evToday = evs.filter((e) => ymd(e.at) === today);
    const firstTry = (list) => list.filter((e) => e.mode !== 'retry');
    const acc = (list) => { const f = firstTry(list); return f.length ? Math.round(100 * f.filter((e) => e.ok).length / f.length) + '%' : '–'; };
    const done = FR.chunks.filter((c) => S.chunks[c.id] && S.chunks[c.id].done);
    const plannedByNow = []; FR.plan.forEach((p, i) => { if (p.date <= today || i === 0) plannedByNow.push(...p.chunks); });
    const behind = plannedByNow.filter((cid) => !(S.chunks[cid] && S.chunks[cid].done));
    const last = evs[0] ? fmtTime(evs[0].at) : 'not yet';

    const tiles = '<div class="tiles">'
      + '<div class="tile"><span>Parts learned</span><b>' + done.length + ' / ' + FR.chunks.length + '</b><span>' + (behind.length ? behind.length + ' behind plan' : 'on plan') + '</span></div>'
      + '<div class="tile"><span>Today</span><b>' + evToday.length + '</b><span>answers · ' + minutesOf(evToday) + ' min</span></div>'
      + '<div class="tile"><span>Right first try today</span><b>' + acc(evToday) + '</b><span>all time ' + acc(evs) + '</span></div>'
      + '<div class="tile"><span>Last active</span><b style="font-size:1.2rem">' + esc(last) + '</b><span>' + (S.sessions || 0) + ' sessions started</span></div></div>';

    const planRows = FR.plan.map((p) => {
      const cells = p.quiz ? '<span class="pill next">Quiz day: warm-up + practice quiz</span>' : p.chunks.map((cid) => {
        const c = CHUNK[cid], ok = S.chunks[cid] && S.chunks[cid].done;
        const cls = ok ? 'ok' : (p.date <= today ? 'behind' : 'next');
        return '<span class="pill ' + cls + '">' + (ok ? '✓ ' : '') + esc(c.name) + (ok ? ' · ' + fmtTime(S.chunks[cid].done) : '') + '</span>';
      }).join(' ');
      return '<tr><th>' + p.label + ' ' + p.date.slice(5).replace('-', '/') + '</th><td>' + cells + '</td></tr>';
    }).join('');

    // needs attention: items missed in the last 3 days, by miss count
    const since = Date.now() - 3 * 86400e3; const missCount = {};
    evs.forEach((e) => { if (!e.ok && +new Date(e.at) > since) { const id = String(e.item_id).split(':')[0]; missCount[id] = (missCount[id] || 0) + 1; } });
    const attention = Object.keys(missCount).sort((a, b) => missCount[b] - missCount[a]).slice(0, 12);
    const attHtml = attention.length ? '<table class="ptable"><thead><tr><th>Item</th><th>Misses (3 days)</th><th>Strength now</th></tr></thead><tbody>'
      + attention.map((id) => '<tr><td>' + esc(label(id)) + '</td><td class="n">' + missCount[id] + '</td><td>' + dots((S.items[id] || {}).box || 0) + '</td></tr>').join('') + '</tbody></table>'
      : '<p class="muted">No misses in the last 3 days.</p>';

    const wrong = evs.filter((e) => !e.ok).slice(0, 30);
    const wrongHtml = wrong.length ? '<div class="tablewrap"><table class="ptable"><thead><tr><th>When</th><th>Item</th><th>He answered</th><th>Right answer</th></tr></thead><tbody>'
      + wrong.map((e) => '<tr><td class="muted">' + esc(fmtTime(e.at)) + '<br>' + esc(LVL[e.lvl] || '') + '</td><td>' + esc(label(e.item_id)) + '</td><td class="typed">' + esc(e.answer || '') + '</td><td class="exp">' + esc(e.expected || '') + '</td></tr>').join('') + '</tbody></table></div>'
      : '<p class="muted">No mistakes yet.</p>';

    // activity by day
    const byDay = {}; evs.forEach((e) => { const k = ymd(e.at); (byDay[k] = byDay[k] || []).push(e); });
    const days = Object.keys(byDay).sort().reverse();
    const maxN = Math.max(1, ...days.map((k) => byDay[k].length));
    const dayHtml = days.length ? '<div class="bars">' + days.map((k) => '<div class="barrow"><span>' + new Date(k + 'T12:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + '</span><span class="track"><span style="width:' + Math.round(100 * byDay[k].length / maxN) + '%"></span></span><span class="muted">' + byDay[k].length + ' · ' + acc(byDay[k]) + ' · ' + minutesOf(byDay[k]) + 'm</span></div>').join('') + '</div>'
      : '<p class="muted">No activity yet.</p>';

    const rows = FR.chunks.map((c) => '<tr class="ch"><th colspan="4">' + esc(c.name) + (S.chunks[c.id] && S.chunks[c.id].done ? ' ✓' : '') + '</th></tr>' + FR.items.filter((it) => it.chunk === c.id).map((it) => {
      const s = S.items[it.id] || { box: 0, right: 0, wrong: 0, due: 0 };
      const lab = it.kind === 'num' ? it.label : it.kind === 'noun' ? withDef(it) : it.fr;
      return '<tr><td>' + esc(lab) + '</td><td class="n">' + s.right + ' / ' + s.wrong + '</td><td>' + dots(s.box) + '</td><td class="n muted">' + (s.due && S.chunks[c.id] && S.chunks[c.id].done ? (s.due <= Date.now() ? 'due now' : fmtTime(s.due)) : '') + '</td></tr>';
    }).join('')).join('');

    $app.innerHTML = '<header class="top"><p class="eyebrow">Parent tracker · Unit 1, Leçon 1A</p><h1>Max\'s French</h1><p class="count">Quiz Wednesday, Nov 4 · updated ' + esc(fmtTime(Date.now())) + ' (refreshes every minute)</p></header>'
      + '<div class="wrap">' + tiles
      + '<section class="panel"><h3>Study plan</h3><div class="tablewrap"><table class="ptable"><tbody>' + planRows + '</tbody></table></div><p class="note">Green = learned, red = scheduled for today or earlier but not learned yet. The app moves him to the next part automatically.</p></section>'
      + '<div class="grid2"><section class="panel"><h3>Needs attention</h3>' + attHtml + '</section><section class="panel"><h3>Activity by day</h3>' + dayHtml + '<p class="note">answers · right first try · active minutes</p></section></div>'
      + '<section class="panel"><h3>Recent mistakes</h3><p class="note">Exactly what he typed or picked. Each miss is explained to him on the spot and asked again a few questions later.</p>' + wrongHtml + '</section>'
      + '<section class="panel"><h3>Every item</h3><p class="note">Right / wrong counts every answer. Dots = how solid it is (4 = solid). Next review = when the app brings it back.</p><div class="tablewrap"><table class="ptable"><thead><tr><th>Item</th><th>Right / wrong</th><th>Strength</th><th>Next review</th></tr></thead><tbody>' + rows + '</tbody></table></div></section>'
      + '</div>';
  }

  async function refresh() {
    const d = await window.Store.parent();
    if (d.error) {
      const msg = { nokey: 'This link is missing its parent key (?p=…).', badkey: 'This parent key doesn\'t match.', noconfig: 'The database isn\'t connected yet.', offline: 'Can\'t reach the database right now. Retrying in a minute.' }[d.error];
      if (d.error !== 'offline' || !$app.querySelector('.wrap')) $app.innerHTML = '<main class="stage"><div class="card"><h2>Tracker unavailable</h2><p>' + esc(msg) + '</p></div></main>';
      return;
    }
    render(d);
  }
  refresh(); setInterval(refresh, 60e3);
})();
