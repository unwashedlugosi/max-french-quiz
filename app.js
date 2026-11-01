/* app.js — Max's French quiz coach (Unit 1, Leçon 1A).
 * How it decides what to study:
 *  - The material is split into 9 chunks (content.js). A day-by-day plan spreads them over Sat–Tue,
 *    with Wednesday for review and a practice quiz. If Max falls behind, the next session picks up
 *    the next unfinished chunk; if he's ahead he can start the next one early.
 *  - Learning a chunk: rule cards, then the items in groups of 4 (see it → recognize it → use it),
 *    then a spelling round where long phrases are typed one or two words at a time.
 *  - Every item has a box 0–4. A right answer moves it up and pushes its next review further out
 *    (6h, 20h, 44h, 96h). A miss drops it to 0, shows why, and brings it back 3 questions later.
 *  - Each session starts with a warm-up of items that are due, missed ones first.
 */
(function () {
  'use strict';
  const FR = window.FR;
  const $app = document.getElementById('app');
  const ITEMS = {}; FR.items.forEach((it) => { ITEMS[it.id] = it; });
  const CHUNK = {}; FR.chunks.forEach((c) => { CHUNK[c.id] = c; });
  const itemsOf = (cid) => FR.items.filter((it) => it.chunk === cid);
  const HOUR = 3600e3;
  const INT = [0, 6 * HOUR, 20 * HOUR, 44 * HOUR, 96 * HOUR];

  /* ---------------- helpers ---------------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (a) => a[rnd(a.length)];
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);
  const ymd = (d) => { d = new Date(d); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const today = () => ymd(Date.now());
  const isVowel = (w) => /^[aeiouhéèêàâîôûœ]/i.test(w);
  const defArt = (n) => (isVowel(n.w) ? 'l\'' : n.g === 'f' ? 'la' : 'le');
  const withDef = (n) => defArt(n) + (isVowel(n.w) ? '' : ' ') + n.w;
  const indef = (n) => (n.g === 'f' ? 'une' : 'un');
  const genderWord = (n) => (n.g === 'f' ? 'feminine' : n.g === 'm' ? 'masculine' : 'masculine or feminine');
  function pluralEn(en) {
    const m = en.match(/^([^(]+?)(\s*\(.*\))?$/);
    let head = m[1].trim(), tail = m[2] || '';
    head = head === 'library' ? 'libraries' : head === 'actress' ? 'actresses' : head + 's';
    tail = tail.replace('boy', 'boys').replace('girl', 'girls');
    return head + tail;
  }
  function daysLeft() {
    const a = new Date(today() + 'T00:00:00'), b = new Date(FR.quizDate + 'T00:00:00');
    return Math.round((b - a) / 86400e3);
  }

  /* ---------------- answer checking ---------------- */
  const strictN = (s) => String(s).replace(/[’‘`´]/g, '\'').replace(/[«»—]/g, ' ').replace(/…|\.\.\./g, ' ')
    .toLowerCase().replace(/[?!.,;:]/g, ' ').replace(/\s*'\s*/g, '\'').replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
  const looseN = (s) => strictN(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['-]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) {
    const d = []; for (let i = 0; i <= a.length; i++) d[i] = [i];
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  /* 'ok' exact · 'accent' right letters, missing accents/apostrophes/hyphens · 'almost' one letter off · 'no' */
  function check(input, answers) {
    const s = strictN(input), l = looseN(input);
    if (!l) return 'no';
    if (answers.some((a) => strictN(a) === s)) return 'ok';
    if (answers.some((a) => looseN(a) === l)) return 'accent';
    if (answers.some((a) => { const la = looseN(a); return la.length >= 5 && lev(la, l) <= 1; })) return 'almost';
    return 'no';
  }

  /* ---------------- speech ---------------- */
  const TTS = !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  let voice = null;
  function pickVoice() {
    if (!TTS) return;
    const vs = window.speechSynthesis.getVoices() || [];
    voice = vs.find((v) => /^fr[-_]FR/i.test(v.lang) && /google|amélie|thomas|audrey|aurélie/i.test(v.name))
      || vs.find((v) => /^fr[-_]FR/i.test(v.lang)) || vs.find((v) => /^fr/i.test(v.lang)) || null;
  }
  if (TTS) { pickVoice(); try { window.speechSynthesis.onvoiceschanged = pickVoice; } catch (e) { /* ignore */ } }
  const AUD = window.FR_AUDIO || {};
  const speechKey = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.,;:«»—…"]/g, ' ').replace(/\s+/g, ' ').trim();
  const hasAudio = (text) => !!AUD[speechKey(text)] || TTS;
  let player = null;
  function say(text) {
    if (!text) return;
    const f = AUD[speechKey(text)];
    if (f) {
      try { if (player) player.pause(); player = new Audio(f); const p = player.play(); if (p && p.catch) p.catch(() => sayTTS(text)); return; } catch (e) { /* fall through */ }
    }
    sayTTS(text);
  }
  function sayTTS(text) {
    if (!TTS || !text) return;
    try {
      const t = String(text).replace(/[—…]/g, ' ').replace(/___/g, ' ');
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'fr-FR'; if (voice) u.voice = voice; u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) { /* no audio */ }
  }
  const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const spk = (text, cls) => (hasAudio(text) ? '<button type="button" class="spk ' + (cls || '') + '" data-say="' + esc(text) + '" aria-label="Hear it">' + SPK + '</button>' : '');

  /* ---------------- saved progress (Supabase, see store.js) ---------------- */
  let S = null;
  function blank() { return { items: {}, chunks: {}, sessions: 0 }; }
  function save() { window.Store.save(S); }
  function logEvent(step, ok, given, expected) {
    window.Store.event({ at: new Date().toISOString(), item_id: step.id + (step.n != null ? ':' + step.n : ''), lvl: step.lvl, ok, answer: given == null ? null : String(given), expected: expected == null ? null : String(expected), mode: step.quiz ? 'quiz' : step.retry ? 'retry' : step.review ? 'review' : 'learn', session_id: SES ? SES.id : null });
  }
  const st = (id) => (S.items[id] = S.items[id] || { box: 0, due: 0, seen: 0, right: 0, wrong: 0, lastWrong: 0, exI: 0 });
  const chunkDone = (cid) => !!(S.chunks[cid] && S.chunks[cid].done);
  function chunkStrength(cid) {
    const its = itemsOf(cid);
    return its.reduce((a, it) => a + Math.min(3, (S.items[it.id] || { box: 0 }).box), 0) / (its.length * 3);
  }

  /* ---------------- the plan ---------------- */
  function plannedByToday() {
    const t = today(), out = [];
    FR.plan.forEach((d, i) => { if (d.date <= t || i === 0) out.push(...d.chunks); });
    return out;
  }
  const nextChunk = () => FR.chunks.find((c) => !chunkDone(c.id)) || null;
  function dueItems() {
    const now = Date.now();
    return FR.items.filter((it) => chunkDone(it.chunk) && S.items[it.id] && S.items[it.id].due <= now)
      .sort((a, b) => (st(b.id).lastWrong > 0) - (st(a.id).lastWrong > 0) || st(a.id).box - st(b.id).box || st(b.id).lastWrong - st(a.id).lastWrong);
  }
  function todayPlan() {
    const due = dueItems();
    const nc = nextChunk();
    const behind = nc && plannedByToday().indexOf(nc.id) >= 0;
    return { due, nc, behind, review: due.slice(0, 12) };
  }

  /* ---------------- question builders ---------------- */
  const phraseItems = () => FR.items.filter((it) => it.kind === 'phrase' || it.kind === 'gram');
  const nounsOf = (cid) => FR.items.filter((it) => it.kind === 'noun' && (!cid || it.chunk === cid));
  const piecesOf = (it) => it.pieces || [it.fr.replace(/…$/, '').replace(/\s*\?$/, '')];
  const cleanFr = (s) => s.replace(/…$/, '').trim();

  function mc(o) { // o: prompt, answer(label), others[], say
    const opts = shuffle(uniq([o.answer].concat(o.others)).slice(0, 4));
    return Object.assign({ type: 'mc', choices: opts }, o);
  }
  function distract(pool, avoid, n) { return shuffle(uniq(pool.filter((x) => avoid.indexOf(x) < 0))).slice(0, n); }

  function qPhrase(it, lvl) {
    const avoid = [it.en].concat((it.syn || []).map((s) => ITEMS[s].en));
    const same = phraseItems().filter((x) => x.chunk === it.chunk && x.id !== it.id && (it.syn || []).indexOf(x.id) < 0);
    const any = phraseItems().filter((x) => x.id !== it.id && (it.syn || []).indexOf(x.id) < 0);
    const ex = { why: it.why };
    if (lvl === 0) {
      const others = distract(same.map((x) => x.en), avoid, 3);
      const more = distract(any.map((x) => x.en), avoid.concat(others), 3 - others.length);
      return mc({ ...ex, kind: 'meaning', head: 'What does this mean?', big: it.fr, say: cleanFr(it.fr), answer: it.en, others: others.concat(more) });
    }
    if (lvl === 1) {
      const frPool = (it.pair ? [ITEMS[it.pair].fr] : []).concat(distract(same.map((x) => x.fr), [it.fr], 3)).concat(distract(any.map((x) => x.fr), [it.fr], 3));
      const others = uniq(frPool.filter((f) => f !== it.fr)).slice(0, 3);
      if (it.sit && Math.random() < 0.6) return mc({ ...ex, head: 'What do you say?', text: it.sit, answer: it.fr, others, frChoices: true });
      return mc({ ...ex, head: 'Pick the French', text: it.en, answer: it.fr, others, frChoices: true });
    }
    const answers = [cleanFr(it.fr)].concat(it.accept || []);
    if (lvl === 2 && it.pieces && it.pieces.length > 1) return { ...ex, type: 'build', head: 'Spell it, one piece at a time', text: it.en, pieces: it.pieces, pieceEn: it.pieceEn, full: it.fr };
    return { ...ex, type: 'type', head: 'Write it in French', text: it.sit && lvl >= 3 && Math.random() < 0.5 ? it.sit : it.en, hint: it.sit && lvl >= 3 ? '(' + it.en + ')' : '', answers, show: it.fr };
  }

  function qNoun(it, lvl) {
    const pool = nounsOf(it.chunk).filter((x) => x.id !== it.id);
    const people = it.chunk === 'c7';
    const ex = { why: it.why };
    if (lvl === 0) {
      let others = distract(pool.map((x) => x.en), [it.en], 3);
      const trick = { librairie: 'library', bibliotheque: 'bookstore', telephone: 'cell phone', portable: 'phone', examen: 'test', test: 'exam' }[it.id];
      if (trick) others = [trick].concat(others.filter((o) => o !== trick)).slice(0, 3);
      return mc({ ...ex, head: 'What does this mean?', big: withDef(it), say: withDef(it), answer: it.en, others });
    }
    if (lvl === 1) {
      const r = Math.random();
      if (people || r < 0.4) {
        const plural = Math.random() < 0.3;
        return mc({ ...ex, kind: 'def', noun: it, plural, head: 'Which word for "the"?', big: '___ ' + (plural ? it.pl : it.w), say: '', answer: plural ? 'les' : defArt(it), others: ['le', 'la', 'l\'', 'les'], fixedOrder: true, en: 'the ' + (plural ? pluralEn(it.en) : it.en) });
      }
      if (r < 0.75 && it.g !== 'mf') {
        const plural = Math.random() < 0.3;
        return mc({ ...ex, kind: 'indef', noun: it, plural, head: 'Which word for "a" / "some"?', big: '___ ' + (plural ? it.pl : it.w), answer: plural ? 'des' : indef(it), others: ['un', 'une', 'des'], fixedOrder: true, en: (plural ? 'some ' + pluralEn(it.en) : 'a ' + it.en) });
      }
      return mc({ ...ex, kind: 'gender', noun: it, head: 'Boy word or girl word?', big: it.w, say: it.w, answer: 'masculine (le, un)', others: ['feminine (la, une)'], fixedOrder: true, answerFix: it.g === 'f' ? 'feminine (la, une)' : 'masculine (le, un)' });
    }
    // typing
    if (people && lvl >= 2 && (it.fem || it.masc) && Math.random() < 0.45) {
      const other = it.fem || it.masc; const toGirl = !!it.fem;
      return { ...ex, type: 'type', head: toGirl ? 'Boy → girl' : 'Girl → boy', text: 'Write the ' + (toGirl ? 'girl' : 'boy') + ' version of « ' + it.w + ' »', answers: [other], show: other, why: it.why };
    }
    if (lvl >= 3 && Math.random() < 0.6) {
      const useDes = !people && Math.random() < 0.5;
      const ans = (useDes ? 'des ' : 'les ') + it.pl;
      return { ...ex, type: 'type', head: 'Write it in French', text: (useDes ? 'some ' : 'the ') + pluralEn(it.en), answers: [ans], show: ans, noun: it, plural: true, art: useDes ? 'des' : 'les' };
    }
    const useIndef = !people && it.g !== 'mf' && Math.random() < 0.5;
    const ans = useIndef ? indef(it) + ' ' + it.w : withDef(it);
    return { ...ex, type: 'type', head: 'Write it in French', text: (useIndef ? (/^[aeiou]/i.test(it.en) ? 'an ' : 'a ') : 'the ') + it.en, answers: [ans], show: ans, noun: it, art: useIndef ? indef(it) : defArt(it) };
  }

  function confusers(n) {
    if (n === 1000) return [100, 10, 1];
    if (n === 100) return [1000, 10, 90];
    const c = [];
    if (n <= 6 && n >= 2) c.push(n + 10);
    if (n >= 12 && n <= 16) c.push(n - 10);
    if (n >= 17 && n <= 19) c.push(n - 10, n + 50);
    if (n === 10) c.push(2, 12);
    if (n >= 60 && n < 70) c.push(n + 10, n + 30);
    if (n >= 70 && n < 80) c.push(n - 10, n + 20, n - 60 + 10);
    if (n >= 80 && n < 90) c.push(n + 10, n - 20, 4 + (n % 10 ? n % 10 + 20 : 0));
    if (n >= 90 && n < 100) c.push(n - 20, n - 10, n - 80);
    if (n >= 20 && n < 60) c.push(n + 10, n - 10, (n % 10) * 10 + Math.floor(n / 10));
    c.push(n + 1, n - 1, n + 2);
    return uniq(c.filter((x) => x >= 0 && x <= 100 && x !== n)).slice(0, 3);
  }
  function qNum(it, lvl, n) {
    const w = FR.numFr(n), why = FR.numWhy(n);
    const answers = [w].concat(n === 80 ? ['quatre-vingt'] : []);
    if (lvl === 0) return { type: 'mc', head: 'Which one is ' + n + ' ?', big: String(n), bigNum: true, choices: shuffle([w].concat(confusers(n).map(FR.numFr))), answer: w, why, frChoices: true };
    if (lvl === 1) {
      const nums = shuffle([n].concat(confusers(n))).map(String);
      if (AUD[speechKey(w)] && Math.random() < 0.5) return { type: 'mc', head: 'Listen. Which number is it?', listen: w, autoSay: w, choices: nums, answer: String(n), why, num: n };
      return { type: 'mc', head: 'Which number is this?', big: w, say: w, choices: nums, answer: String(n), why, num: n };
    }
    const pieces = FR.numPieces(n);
    if (lvl === 2 && pieces.length > 1) return { type: 'build', head: 'Spell ' + n + ', one piece at a time', text: String(n), bigNum: true, pieces, full: w, why, num: n };
    if (lvl >= 3 && AUD[speechKey(w)] && Math.random() < 0.4) return { type: 'type', head: 'Listen and write the number in digits', listen: w, autoSay: w, answers: [String(n)], show: n + ' (' + w + ')', why, num: n, digits: true };
    return { type: 'type', head: 'Write ' + n + ' in French', text: String(n), bigNum: true, answers, show: w, why, num: n };
  }

  const PIC_NOUNS = ['ordinateur', 'telephone', 'portable', 'examen', 'tele', 'bibliotheque', 'librairie', 'bureau'];
  function picRow(n, k) { return '<span class="pics" aria-label="' + k + ' ' + esc(k > 1 ? n.pl : n.w) + '">' + Array(k).fill(n.pic).join(' ') + '</span>'; }
  const de = (n) => (isVowel(n.w) ? 'd\'' : 'de ');
  function qGram(it, lvl) {
    const ex = { why: it.why };
    const things = nounsOf('c8');
    if (it.id === 'questce') {
      const others = ['What\'s your name?', 'How many are there?', 'There is / there are', 'Who is it?'];
      if (lvl === 0) return mc({ ...ex, head: 'What does this mean?', big: it.fr, say: it.fr, answer: it.en, others: shuffle(others).slice(0, 3) });
      if (lvl === 1) return mc({ ...ex, head: 'Pick the French', text: 'What is it?', answer: it.fr, others: ['Comment t\'appelles-tu ?', 'Il y a combien de… ?', 'C\'est…'], frChoices: true });
      if (lvl === 2) return { ...ex, type: 'build', head: 'Spell it, one piece at a time', text: it.en, pieces: it.pieces, pieceEn: it.pieceEn, full: it.fr };
      return { ...ex, type: 'type', head: 'Write it in French', text: 'What is it?', answers: ['Qu\'est-ce que c\'est'], show: it.fr };
    }
    if (it.id === 'cest' || it.id === 'cesont') {
      const pl = it.id === 'cesont';
      const n = pick(things.filter((x) => x.pic)); const k = pl ? 2 + rnd(2) : 1;
      const right = pl ? 'Ce sont des ' + n.pl : 'C\'est ' + indef(n) + ' ' + n.w;
      const enObj = pl ? 'some ' + pluralEn(n.en) : (/^[aeiou]/i.test(n.en) ? 'an ' : 'a ') + n.en;
      if (lvl === 0) return mc({ ...ex, head: 'C\'est or Ce sont?', big: '___ ' + (pl ? 'des ' + n.pl : indef(n) + ' ' + n.w), answer: pl ? 'Ce sont' : 'C\'est', others: [pl ? 'C\'est' : 'Ce sont'], fixedOrder: true, frChoices: true, ex2: [right + '.', (pl ? 'They are ' : 'It\'s ') + enObj + '.'] });
      if (lvl === 1) {
        const others = pl ? ['C\'est des ' + n.pl, 'Ce sont ' + indef(n) + ' ' + n.w, 'C\'est ' + indef(n) + ' ' + n.w]
          : ['Ce sont ' + indef(n) + ' ' + n.w, 'C\'est ' + (n.g === 'f' ? 'un' : 'une') + ' ' + n.w, 'Ce sont des ' + n.pl];
        return mc({ ...ex, head: 'Qu\'est-ce que c\'est ?', say: 'Qu\'est-ce que c\'est ?', pics: picRow(n, k), text: '(' + enObj + ')', answer: right, others, frChoices: true, ex2: [right + '.', (pl ? 'They are ' : 'It\'s ') + enObj + '.'] });
      }
      if (lvl === 2) return { ...ex, type: 'type', head: 'Fill in the blank', big: '___ ' + (pl ? 'des ' + n.pl : indef(n) + ' ' + n.w) + '.', text: '(' + (pl ? 'They are ' : 'It\'s ') + enObj + '.)', answers: [pl ? 'Ce sont' : 'C\'est'], show: right + '.' };
      return { ...ex, type: 'type', head: 'Answer in French', text: 'Qu\'est-ce que c\'est ? (' + enObj + ')', pics: picRow(n, k), answers: [right], show: right + '.' };
    }
    if (it.id === 'ilya') {
      const n = pick(things); const k = 2 + rnd(4);
      const fr = 'Il y a ' + FR.numFr(k) + ' ' + n.pl;
      if (lvl === 0) return mc({ ...ex, head: 'What does this mean?', big: 'Il y a', say: 'Il y a', answer: 'There is / there are', others: ['It is', 'How many', 'They are'] });
      if (lvl === 1) return mc({ ...ex, head: 'What does this mean?', big: fr + '.', say: fr, answer: 'There are ' + k + ' ' + pluralEn(n.en) + '.', others: ['How many ' + pluralEn(n.en) + ' are there?', 'They are ' + k + ' ' + pluralEn(n.en) + '.', 'There is one ' + n.en + '.'] });
      if (lvl === 2) return { ...ex, type: 'type', head: 'Fill in the blank', big: '___ ' + FR.numFr(k) + ' ' + n.pl + '.', text: '(There are ' + k + ' ' + pluralEn(n.en) + '.)', answers: ['Il y a'], show: fr + '.' };
      const one = Math.random() < 0.5;
      const ans = one ? 'Il y a ' + indef(n) + ' ' + n.w : fr;
      return { ...ex, type: 'type', head: 'Write it in French', text: one ? 'There is ' + (/^[aeiou]/i.test(n.en) ? 'an ' : 'a ') + n.en + '.' : 'There are ' + k + ' ' + pluralEn(n.en) + '.', answers: [ans], show: ans + '.' };
    }
    // combien
    const n = ITEMS[pick(PIC_NOUNS)]; const k = 2 + rnd(8);
    const q = 'Il y a combien ' + de(n) + n.pl + ' ?';
    if (lvl === 0) {
      return mc({ ...ex, head: 'What does this mean?', big: q, say: q, answer: 'How many ' + pluralEn(n.en) + ' are there?', others: ['There are ' + pluralEn(n.en) + '.', 'What is the ' + n.en + '?', 'Where are the ' + pluralEn(n.en) + '?'] });
    }
    if (lvl === 1) {
      const nums = uniq([k, k + 1, k - 1, k + 10].filter((x) => x >= 2)).slice(0, 4);
      return { ...ex, type: 'mc', head: 'Count and answer', big: q, say: q, pics: picRow(n, k), choices: shuffle(nums.map((x) => 'Il y a ' + FR.numFr(x) + ' ' + n.pl + '.')), answer: 'Il y a ' + FR.numFr(k) + ' ' + n.pl + '.', frChoices: true };
    }
    if (lvl === 2) return { ...ex, type: 'type', head: 'Count and answer', big: q, say: q, pics: picRow(n, k), text: 'Il y a ___ ' + n.pl + '.', answers: [FR.numFr(k)], show: 'Il y a ' + FR.numFr(k) + ' ' + n.pl + '.', why: it.why + ' Here there are ' + k + ' → ' + FR.numFr(k) + '.' };
    if (Math.random() < 0.5) {
      const big = 21 + rnd(78); const z = FR.NUM_NOUNS[rnd(FR.NUM_NOUNS.length)];
      const qq = 'Il y a combien ' + (isVowel(z[0]) ? 'd\'' : 'de ') + z[0] + ' ?';
      return { ...ex, type: 'type', head: 'Answer with the number in French', big: qq, say: qq, text: '(' + big + ' ' + z[1] + ')  Il y a ___ ' + z[0] + '.', answers: [FR.numFr(big)].concat(big === 80 ? ['quatre-vingt'] : []), show: 'Il y a ' + FR.numFr(big) + ' ' + z[0] + '.', why: FR.numWhy(big) };
    }
    return { ...ex, type: 'type', head: 'Write the question in French', text: 'How many ' + pluralEn(n.en) + ' are there?', answers: [q, 'Combien ' + de(n) + n.pl + ' y a-t-il'], show: q };
  }

  function buildQ(step) {
    const it = ITEMS[step.id];
    const lvl = Math.max(0, Math.min(3, step.lvl));
    let q;
    if (it.kind === 'num') { if (step.n == null) step.n = pick(it.nums); q = qNum(it, lvl, step.n); }
    else if (it.kind === 'noun') q = qNoun(it, lvl);
    else if (it.kind === 'gram') q = qGram(it, lvl);
    else q = qPhrase(it, lvl);
    if (q.answerFix) q.answer = q.answerFix;
    if (q.type === 'mc' && !q.fixedOrder) q.choices = shuffle(uniq(q.choices));
    if (q.type === 'mc' && q.fixedOrder) q.choices = uniq(q.choices.concat([q.answer])).sort((a, b) => (a < b ? -1 : 1));
    if (q.kind === 'gender') q.choices = ['masculine (le, un)', 'feminine (la, une)'];
    if (q.kind === 'def') q.choices = ['le', 'la', 'l\'', 'les'];
    if (q.kind === 'indef') q.choices = ['un', 'une', 'des'];
    if (q.fixedOrder && !q.kind) q.choices = uniq([q.answer].concat(q.others || [])).sort();
    q.item = it; q.lvl = lvl;
    return q;
  }

  /* why an article answer is what it is */
  function articleWhy(q) {
    const n = q.noun; if (!n) return '';
    if (q.kind === 'def' || q.art === 'les' || q.art === 'le' || q.art === 'la' || q.art === 'l\'') {
      if (q.plural) return 'More than one → **les**, for boy and girl words alike: les ' + n.pl + '.' + (n.id === 'bureau' ? ' (bureau → bureaux: -eau words add x.)' : '');
      if (isVowel(n.w)) return '**' + n.w + '** starts with a vowel, so le/la shrinks to **l\'** → l\'' + n.w + '.';
      return '**' + n.w + '** is ' + genderWord(n) + ', so it takes **' + defArt(n) + '** → ' + withDef(n) + '.';
    }
    if (q.kind === 'indef' || q.art === 'un' || q.art === 'une' || q.art === 'des') {
      if (q.plural) return 'More than one → **des** (some): des ' + n.pl + '.';
      return '**' + n.w + '** is ' + genderWord(n) + ', so "a" is **' + indef(n) + '** → ' + indef(n) + ' ' + n.w + '.';
    }
    if (q.kind === 'gender') return '**' + n.w + '** is ' + genderWord(n) + ': ' + withDef(n) + ', ' + indef(n) + ' ' + n.w + '.';
    return '';
  }

  /* example sentence after a right answer (rotates so it's different each time) */
  function exampleFor(q) {
    const it = q.item;
    if (q.ex2) return q.ex2;
    if (it.kind === 'num') { const s = st(it.id); s.exI = (s.exI || 0) + 1; return FR.numSentence(q.num != null ? q.num : it.nums[0], s.exI); }
    if (!it.ex || !it.ex.length) return null;
    const s = st(it.id); const e = it.ex[(s.exI || 0) % it.ex.length]; s.exI = (s.exI || 0) + 1; return e;
  }

  /* ---------------- sessions ---------------- */
  let SES = null;
  function learnSteps(cid) {
    const c = CHUNK[cid], its = itemsOf(cid), steps = [];
    c.intro.forEach((card, i) => steps.push({ t: 'concept', cid, i }));
    const size = its[0].kind === 'num' ? 2 : 4;
    for (let g = 0; g < its.length; g += size) {
      const grp = its.slice(g, g + size);
      const total = Math.ceil(its.length / size);
      steps.push({ t: 'phase', title: total > 1 ? 'Part ' + (g / size + 1) + ' of ' + total : 'New words', body: 'Meet ' + (grp.length === 1 ? 'this one' : 'these ' + grp.length) + ', then practice ' + (grp.length === 1 ? 'it' : 'them') + '.' });
      grp.forEach((it) => steps.push({ t: 'card', id: it.id }));
      shuffle(grp).forEach((it) => steps.push({ t: 'q', id: it.id, lvl: 0, learn: true }));
      shuffle(grp).forEach((it) => steps.push({ t: 'q', id: it.id, lvl: 1, learn: true }));
    }
    steps.push({ t: 'phase', title: 'Spelling round', body: 'Now write them. Long phrases come one or two words at a time.' });
    shuffle(its).forEach((it) => steps.push({ t: 'q', id: it.id, lvl: 2, learn: true, final: true }));
    if (its[0].kind === 'num') shuffle(its).forEach((it) => steps.push({ t: 'q', id: it.id, lvl: 1, learn: true }));
    return steps;
  }
  function startSession(mode) {
    const tp = todayPlan();
    let steps = [], cid = null, title = '';
    if (mode === 'quiz') {
      const pool = FR.items.filter((it) => chunkDone(it.chunk));
      steps = shuffle(pool).slice(0, 15).map((it) => ({ t: 'q', id: it.id, lvl: 2 + rnd(2), quiz: true }));
      title = 'Practice quiz';
    } else if (mode === 'extra') {
      const pool = FR.items.filter((it) => chunkDone(it.chunk)).sort((a, b) => st(a.id).box - st(b.id).box || st(b.id).wrong - st(a.id).wrong);
      steps = shuffle(pool.slice(0, 10)).map((it) => ({ t: 'q', id: it.id, lvl: Math.min(3, st(it.id).box + 1), review: true }));
      title = 'Extra practice';
    } else {
      if (tp.review.length) {
        steps.push({ t: 'phase', title: 'Warm-up', body: tp.review.length + ' from before' + (tp.review.some((it) => st(it.id).lastWrong) ? ', starting with ones you missed' : '') + '. This is what makes it stick.' });
        tp.review.forEach((it) => steps.push({ t: 'q', id: it.id, lvl: Math.max(1, Math.min(3, st(it.id).box + 1)), review: true }));
      }
      if (tp.nc && (tp.behind || mode === 'ahead' || !tp.review.length)) {
        cid = tp.nc.id; steps = steps.concat(learnSteps(cid));
        title = CHUNK[cid].name;
      } else title = 'Review';
    }
    SES = { id: Date.now().toString(36) + rnd(1e6).toString(36), mode, cid, title, steps, i: 0, asked: 0, firstRight: 0, missed: {}, missLog: [], fb: null, q: null, build: null, retries: {} };
    S.sessions++; save();
    if (cid) { S.chunks[cid] = S.chunks[cid] || {}; S.chunks[cid].started = S.chunks[cid].started || Date.now(); save(); }
    show('session');
  }

  function record(step, ok, given, expected) {
    const s = st(step.id), now = Date.now();
    s.seen++;
    logEvent(step, ok, given, expected);
    if (ok) {
      s.right++;
      if (step.learn) {
        if (step.final) { s.box = Math.max(s.box, 1); s.due = now + (SES.missed[step.id] ? 3 * HOUR : INT[1]); }
      } else if (step.retry) { s.box = Math.max(s.box, 1); s.due = now + 3 * HOUR; }
      else if (step.review || step.quiz) { s.box = Math.min(4, s.box + 1); s.due = now + INT[s.box]; }
    } else {
      s.wrong++; s.lastWrong = now; s.box = 0; s.due = now;
      SES.missed[step.id] = 1;
      if (!step.quiz) {
        SES.retries[step.id] = (SES.retries[step.id] || 0) + 1;
        if (SES.retries[step.id] <= 3) {
          const at = Math.min(SES.steps.length, SES.i + 4);
          SES.steps.splice(at, 0, { t: 'q', id: step.id, lvl: step.lvl, n: step.n, retry: true, learn: step.learn, final: step.final });
        }
      }
    }
    if (!step.retry) { SES.asked++; if (ok) SES.firstRight++; }
    save();
  }

  /* ---------------- rendering ---------------- */
  let view = 'home';
  function show(v) { view = v; render(); window.scrollTo(0, 0); }
  function render() {
    if (view === 'session' && SES) return renderSession();
    if (view === 'end' && SES) return renderEnd();
    if (view === 'sheet') return renderSheet();
    return renderHome();
  }

  function renderHome() {
    const tp = todayPlan(), dl = daysLeft();
    const doneCount = FR.chunks.filter((c) => chunkDone(c.id)).length;
    let when = dl > 1 ? dl + ' days to go' : dl === 1 ? 'Tomorrow' : dl === 0 ? 'Today' : 'Done';
    let todayHtml;
    if (tp.nc && (tp.behind || !tp.due.length)) {
      const mins = CHUNK[tp.nc.id].mins + Math.ceil(tp.review.length / 2);
      todayHtml = '<p class="kicker">Next session · about ' + mins + ' min</p>'
        + '<h2>' + esc(tp.nc.name) + '</h2>'
        + '<p>' + (tp.review.length ? 'Warm-up: ' + tp.review.length + ' from before. Then learn ' : 'Learn ') + itemsOf(tp.nc.id).length + ' new ' + (tp.nc.id >= 'c4' && tp.nc.id <= 'c6' ? 'number groups' : 'items') + ' in small parts.' + (tp.behind ? '' : ' You\'re ahead of plan.') + '</p>'
        + '<button class="btn primary big" data-act="start">Start</button>';
    } else if (tp.due.length) {
      todayHtml = '<p class="kicker">Review time · about ' + Math.max(3, Math.ceil(tp.review.length / 2)) + ' min</p><h2>' + tp.review.length + ' things to review</h2><p>Spaced review is how words move to long-term memory.' + (tp.nc && !tp.behind ? ' After this, today\'s new material is done.' : '') + '</p><button class="btn primary big" data-act="start">Start review</button>';
    } else {
      todayHtml = '<p class="kicker">All caught up</p><h2>' + (doneCount === FR.chunks.length ? 'Everything is learned' : 'You\'re done for today') + '</h2><p>' + (doneCount === FR.chunks.length ? 'Keep it fresh with a practice quiz or extra practice.' : 'Come back tomorrow for the next part. Want more?') + '</p>'
        + '<div class="row">' + (tp.nc ? '<button class="btn" data-act="ahead">Get ahead: ' + esc(tp.nc.short) + '</button>' : '') + (doneCount ? '<button class="btn" data-act="extra">Extra practice</button>' : '') + '</div>';
    }
    const t = today();
    const planHtml = FR.plan.map((d) => {
      const isToday = d.date === t;
      const chips = d.quiz ? '<span class="chip quiz">Quiz day: warm-up + practice quiz</span>'
        : d.chunks.map((cid) => {
          const c = CHUNK[cid], done = chunkDone(cid), pct = Math.round(chunkStrength(cid) * 100);
          return '<span class="chip' + (done ? ' done' : '') + '">' + (done ? '✓ ' : '') + esc(c.short) + (done ? ' <span class="pct">' + pct + '%</span>' : '') + '</span>';
        }).join('');
      return '<li class="' + (isToday ? 'today' : d.date < t ? 'past' : '') + '"><span class="day">' + d.label + (isToday ? ' <em>today</em>' : '') + '</span><span class="chips">' + chips + '</span></li>';
    }).join('');
    $app.innerHTML = '<header class="top"><p class="eyebrow">Unit 1 · Leçon 1A</p><h1>Max\'s French</h1><p class="count">Quiz: Wednesday, Nov 4 · <strong>' + when + '</strong></p></header>'
      + '<section class="today cahier">' + todayHtml + '</section>'
      + '<section class="plan"><h3>The plan</h3><ol class="days">' + planHtml + '</ol><p class="note">Strength % shows how solid each finished part is. It grows as you review on different days.</p></section>'
      + '<section class="more row">' + (doneCount >= 2 ? '<button class="btn" data-act="quiz">Practice quiz (15)</button>' : '<button class="btn" disabled title="Finish 2 parts first">Practice quiz (after 2 parts)</button>') + '<button class="btn" data-act="sheet">Study sheet</button></section>'
      + '<footer><span id="savestatus" class="savestatus"></span></footer>';
  }

  function progressBar() {
    const total = SES.steps.length, pct = Math.round((SES.i / total) * 100);
    return '<div class="sesbar"><button class="link" data-act="quit">✕ Stop</button><span class="sestitle">' + esc(SES.title) + '</span><span id="savestatus" class="savestatus"></span><div class="bar"><span style="width:' + pct + '%"></span></div></div>';
  }

  function renderSession() {
    const step = SES.steps[SES.i];
    if (!step) return finish();
    let body = '';
    if (step.t === 'phase') {
      body = '<div class="card phase"><h2>' + esc(step.title) + '</h2><p>' + rich(step.body) + '</p><button class="btn primary" data-act="next" autofocus>Go</button></div>';
    } else if (step.t === 'concept') {
      const card = CHUNK[step.cid].intro[step.i];
      const listen = card.listen ? '<div class="numgrid">' + card.listen.map((n) => '<button class="numchip" data-say="' + esc(FR.numFr(n)) + '"><b>' + n + '</b><span>' + esc(FR.numFr(n)) + '</span></button>').join('') + '</div><p class="note">Tap a number to hear it.</p>' : '';
      body = '<div class="card concept cahier"><p class="kicker">The rule</p><h2>' + esc(card.title) + '</h2><p class="rule">' + rich(card.body) + '</p>' + listen + '<button class="btn primary" data-act="next">Got it</button></div>';
    } else if (step.t === 'card') {
      body = renderCard(ITEMS[step.id]);
    } else {
      if (!SES.q) { SES.q = buildQ(step); SES.build = SES.q.type === 'build' ? { idx: 0, miss: false, fixing: false, typed: [] } : null; }
      body = SES.fb ? renderFeedback(step) : renderQuestion(SES.q, step);
    }
    $app.innerHTML = progressBar() + '<main class="stage">' + body + '</main>';
    const inp = document.getElementById('answer'); if (inp) inp.focus();
    else { const b = $app.querySelector('[data-act="next"],[data-act="cont"]'); if (b) b.focus(); }
    if (!SES.fb && SES.q && SES.q.autoSay && !SES.q._said) { const q = SES.q; q._said = true; setTimeout(() => { if (SES && SES.q === q) say(q.autoSay); }, 250); }
  }

  function renderCard(it) {
    let head = '', extra = '';
    if (it.kind === 'num') {
      head = '<p class="kicker">Numbers ' + esc(it.label) + '</p>';
      extra = '<div class="numgrid">' + it.nums.slice(0, 12).map((n) => '<button class="numchip" data-say="' + esc(FR.numFr(n)) + '"><b>' + n + '</b><span>' + esc(FR.numFr(n)) + '</span></button>').join('') + '</div>'
        + '<p class="why">' + rich(it.tip) + '</p>';
      return '<div class="card learn cahier">' + head + extra + '<button class="btn primary" data-act="next">Got it</button></div>';
    }
    if (it.kind === 'noun') {
      const forms = '<div class="forms"><span>' + esc(withDef(it)) + '</span>' + (it.g !== 'mf' ? '<span>' + esc(indef(it) + ' ' + it.w) + '</span>' : '<span>un / une élève</span>') + '<span>les ' + esc(it.pl) + '</span></div>';
      head = '<p class="kicker">' + (it.g === 'f' ? 'Feminine · girl word' : it.g === 'm' ? 'Masculine · boy word' : 'Boy or girl') + '</p><div class="bigfr">' + esc(withDef(it)) + spk(withDef(it)) + '</div><p class="en">= the ' + esc(it.en) + '</p>' + forms;
    } else {
      head = '<p class="kicker">New phrase</p><div class="bigfr">' + esc(it.fr) + spk(cleanFr(it.fr)) + '</div><p class="en">= ' + esc(it.en) + '</p>';
      if (it.pieces && it.pieces.length > 1) head += '<p class="pieces">' + it.pieces.map((p, i) => '<span>' + esc(p) + (it.pieceEn ? '<small>' + esc(it.pieceEn[i]) + '</small>' : '') + '</span>').join('') + '</p>';
    }
    const e = it.ex && it.ex[0];
    return '<div class="card learn cahier">' + head + '<p class="why">' + rich(it.why) + '</p>'
      + (e ? '<div class="example"><p class="kicker">In a sentence</p><p class="exfr">' + esc(e[0]) + spk(e[0], 'sm') + '</p><p class="exen">' + esc(e[1]) + '</p></div>' : '')
      + '<button class="btn primary" data-act="next">Got it</button></div>';
  }

  const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ô', 'û', '\'', '-'];
  function renderQuestion(q, step) {
    let h = '<div class="card q">' + (step.retry ? '<p class="kicker retry">Try this one again</p>' : '<p class="kicker">' + esc(q.head) + '</p>');
    if (step.retry) h += '<p class="qhead">' + esc(q.head) + '</p>';
    if (q.listen) h += '<div class="listen"><button class="btn listenbtn" data-say="' + esc(q.listen) + '">' + SPK + ' Play again</button></div>';
    if (q.pics) h += '<div class="picbox">' + q.pics + '</div>';
    if (q.big) h += '<div class="bigfr' + (q.bigNum ? ' num' : '') + '">' + esc(q.big) + (q.say ? spk(q.say) : '') + '</div>';
    if (q.text && q.type !== 'build') h += '<p class="qtext' + (q.bigNum && !q.big ? ' num' : '') + '">' + esc(q.text) + '</p>';
    if (q.hint) h += '<p class="note">' + esc(q.hint) + '</p>';
    if (q.type === 'mc') {
      h += '<div class="choices' + (q.choices.length <= 4 && q.choices.every((c) => c.length < 6) ? ' short' : '') + '">' + q.choices.map((c, i) => '<button class="choice' + (q.frChoices ? ' fr' : '') + '" data-choice="' + i + '"><kbd>' + (i + 1) + '</kbd>' + esc(c) + '</button>').join('') + '</div>';
    } else if (q.type === 'type') {
      h += '<form class="typeform" data-form="type" autocomplete="off"><input id="answer" class="answer" type="text" ' + (q.digits ? 'inputmode="numeric" ' : '') + 'autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="' + (q.digits ? 'digits' : 'type in French') + '" aria-label="Your answer">'
        + (q.digits ? '' : '<div class="accents">' + ACCENTS.map((a) => '<button type="button" class="acc" data-acc="' + esc(a) + '">' + esc(a) + '</button>').join('') + '</div>')
        + '<button class="btn primary" type="submit">Check</button></form>';
    } else if (q.type === 'build') {
      const b = SES.build;
      if (q.bigNum) h += '<div class="bigfr num">' + esc(q.text) + '</div>'; else h += '<p class="qtext">' + esc(q.text) + '</p>';
      h += '<p class="buildline">' + q.pieces.map((p, i) => {
        const shown = p.replace(/^-/, '');
        if (i < b.idx) return '<span class="pc done">' + (p[0] === '-' ? '-' : '') + esc(shown) + '</span>';
        if (i === b.idx) return '<span class="pc cur">' + (p[0] === '-' ? '-' : '') + '_'.repeat(Math.max(3, Math.min(10, shown.length))) + '</span>';
        return '<span class="pc todo">' + (p[0] === '-' ? '-' : '') + '…</span>';
      }).join(' ') + '</p>';
      const pe = q.pieceEn && q.pieceEn[b.idx];
      h += '<p class="note">Piece ' + (b.idx + 1) + ' of ' + q.pieces.length + (pe ? ': <b>' + esc(pe) + '</b>' : '') + '</p>';
      if (b.fixing) h += '<p class="fixmsg">The right spelling is <b class="frw">' + esc(q.pieces[b.idx].replace(/^-/, '')) + '</b>. Type it once to lock it in.</p>';
      h += '<form class="typeform" data-form="build" autocomplete="off"><input id="answer" class="answer" type="text" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="next piece" aria-label="Next piece">'
        + '<div class="accents">' + ACCENTS.map((a) => '<button type="button" class="acc" data-acc="' + esc(a) + '">' + esc(a) + '</button>').join('') + '</div>'
        + '<div class="row"><button class="btn primary" type="submit">Check</button>' + (b.fixing ? '' : '<button type="button" class="btn ghost" data-act="reveal">Show me</button>') + '</div></form>';
    }
    return h + '</div>';
  }

  const PRAISE = ['Oui !', 'Bravo !', 'Exactement !', 'Super !', 'Très bien !', 'Parfait !'];
  function renderFeedback(step) {
    const fb = SES.fb, q = SES.q;
    let h = '<div class="card fb ' + (fb.ok ? 'good' : 'bad') + '">';
    if (fb.ok) {
      h += '<h2 class="verdict">' + pick(PRAISE) + '</h2>';
      if (fb.note) h += '<p class="note warn">' + rich(fb.note) + '</p>';
      h += '<p class="answerline">' + esc(fb.shown) + spk(fb.sayShown || fb.shown, 'sm') + '</p>';
      const e = SES.quizMode ? null : fb.example;
      if (e) h += '<div class="example"><p class="kicker">Use it in a sentence</p><p class="exfr">' + esc(e[0]) + spk(e[0], 'sm') + '</p><p class="exen">' + esc(e[1]) + '</p></div>';
    } else {
      h += '<h2 class="verdict">' + (fb.almost ? 'So close: one letter off' : 'Pas tout à fait (not quite)') + '</h2>';
      if (fb.given) h += '<p class="yours">You put: <s>' + esc(fb.given) + '</s></p>';
      h += '<p class="answerline">' + esc(fb.shown) + spk(fb.sayShown || fb.shown, 'sm') + '</p>';
      const why = [articleWhy(q), q.why].filter(Boolean);
      h += '<div class="teach"><p class="kicker">Why</p>' + uniq(why).map((w) => '<p>' + rich(w) + '</p>').join('') + '</div>';
      const e = fb.example;
      if (e) h += '<div class="example"><p class="kicker">See it used</p><p class="exfr">' + esc(e[0]) + spk(e[0], 'sm') + '</p><p class="exen">' + esc(e[1]) + '</p></div>';
      if (!step.quiz) h += '<p class="note">This one comes back in a few questions.</p>';
    }
    return h + '<button class="btn primary" data-act="cont" autofocus>Continue</button></div>';
  }

  function sayForShown(q) {
    if (q.item.kind === 'num') return FR.numFr(q.num != null ? q.num : 0);
    return null;
  }
  function answerMc(idx) {
    const q = SES.q, step = SES.steps[SES.i];
    const chosen = q.choices[idx]; const ok = chosen === q.answer;
    record(step, ok, chosen, q.answer);
    const shown = q.item.kind === 'num' && q.num != null ? q.num + ' = ' + FR.numFr(q.num) : q.answer;
    SES.fb = { ok, given: ok ? '' : chosen, shown, sayShown: q.item.kind === 'num' ? FR.numFr(q.num != null ? q.num : FR.numFr) : (q.frChoices || /^(le|la|l'|les|un|une|des)$/.test(q.answer) ? null : (q.say || '')), example: exampleFor(q) };
    if (q.kind === 'def' || q.kind === 'indef') { const full = q.answer + (q.answer === 'l\'' ? '' : ' ') + (q.plural ? q.noun.pl : q.noun.w); SES.fb.shown = full + '  (' + q.en + ')'; SES.fb.sayShown = full; }
    if (q.kind === 'gender') { SES.fb.shown = q.noun.w + ' is ' + genderWord(q.noun) + ': ' + withDef(q.noun) + ', ' + indef(q.noun) + ' ' + q.noun.w; SES.fb.sayShown = indef(q.noun) + ' ' + q.noun.w; }
    if (q.item.kind === 'num' && q.num == null) SES.fb.sayShown = q.answer;
    if (q.item.kind === 'num' && q.num != null) SES.fb.sayShown = FR.numFr(q.num);
    if (!q.frChoices && q.item.kind !== 'num' && !q.kind) SES.fb.shown = (q.big || '') + ' = ' + q.answer, SES.fb.sayShown = q.say || '';
    if (q.item.kind === 'num' && q.listen) SES.fb.shown = q.num + ' = ' + FR.numFr(q.num);
    render();
  }
  function answerType(val) {
    const q = SES.q, step = SES.steps[SES.i];
    const r = check(val, q.answers);
    const ok = r === 'ok' || r === 'accent';
    record(step, ok, val, q.answers[0]);
    SES.fb = { ok, almost: r === 'almost', given: ok ? '' : val, shown: q.show, sayShown: q.digits ? FR.numFr(q.num) : String(q.show).replace(/\s*\(.*\)$/, ''), example: exampleFor(q),
      note: r === 'accent' ? 'Right word. Check the accents, apostrophes and hyphens: **' + esc(q.show) + '**' : '' };
    render();
  }
  function answerBuild(val) {
    const q = SES.q, b = SES.build, step = SES.steps[SES.i];
    const want = q.pieces[b.idx].replace(/^-/, '');
    const r = check(val.replace(/^-/, ''), [want]);
    if (!b.fixing) b.typed.push(val);
    if (r === 'ok' || r === 'accent') {
      if (r === 'accent' && !b.fixing) b.accentNote = true;
      b.idx++; b.fixing = false;
      if (b.idx >= q.pieces.length) {
        const ok = !b.miss;
        record(step, ok, b.typed.join(' | '), q.pieces.join(' | '));
        SES.fb = { ok, shown: q.full, sayShown: cleanFr(q.full), example: exampleFor(q), given: '',
          note: b.accentNote && ok ? 'Watch the accents: **' + esc(q.full) + '**' : '' };
        if (!ok) SES.fb.given = '';
      }
    } else { b.miss = true; b.fixing = true; }
    render();
  }

  function finish() {
    if (SES.cid && SES.mode !== 'quiz' && SES.mode !== 'extra') { S.chunks[SES.cid].done = Date.now(); }
    save(); show('end');
  }
  function renderEnd() {
    const missed = Object.keys(SES.missed).map((id) => ITEMS[id]);
    const tp = todayPlan();
    const label = (it) => it.kind === 'num' ? 'Numbers ' + it.label : it.kind === 'noun' ? withDef(it) : it.fr;
    let next = '';
    if (tp.nc && tp.behind) next = '<p>Next up today: <b>' + esc(tp.nc.name) + '</b>. Take a short break first if you like.</p><button class="btn primary" data-act="start">Start ' + esc(tp.nc.short) + '</button>';
    else if (tp.due.length) next = '<p>' + tp.due.length + ' items are ready for review.</p><button class="btn primary" data-act="start">Review now</button>';
    else next = '<p>That\'s everything for today. The app will bring these back at the right time.</p>';
    $app.innerHTML = '<main class="stage"><div class="card end cahier"><p class="kicker">' + esc(SES.title) + ' · finished</p><h2>' + SES.firstRight + ' / ' + SES.asked + ' right the first time</h2>'
      + (SES.cid && SES.mode !== 'quiz' ? '<p>New part learned: <b>' + esc(CHUNK[SES.cid].name) + '</b>.</p>' : '')
      + (missed.length ? '<div class="teach"><p class="kicker">You\'ll see these again soon</p><ul class="missed">' + missed.map((it) => '<li><b>' + esc(label(it)) + '</b>' + (it.en ? ' = ' + esc(it.en) : '') + (SES.mode === 'quiz' ? '<br><span class="why">' + rich(it.why || FR.numWhy(it.nums[0])) + '</span>' : '') + '</li>').join('') + '</ul></div>' : '<p>No misses. Très bien.</p>')
      + next + '<button class="btn" data-act="home">Home</button></div></main>';
  }

  function renderSheet() {
    const sec = FR.chunks.map((c) => {
      const its = itemsOf(c.id);
      let rows;
      if (its[0].kind === 'num') {
        const all = uniq([].concat(...its.map((it) => it.nums)));
        rows = '<div class="numgrid">' + all.map((n) => '<button class="numchip" data-say="' + esc(FR.numFr(n)) + '"><b>' + n + '</b><span>' + esc(FR.numFr(n)) + '</span></button>').join('') + '</div>';
      } else rows = '<ul class="sheetlist">' + its.map((it) => {
        const fr = it.kind === 'noun' ? withDef(it) + (it.g !== 'mf' ? ' · ' + indef(it) + ' ' + it.w : '') : it.fr;
        return '<li><span class="sfr">' + esc(fr) + spk(it.kind === 'noun' ? withDef(it) : cleanFr(it.fr), 'sm') + '</span><span class="sen">' + esc(it.en) + '</span></li>';
      }).join('') + '</ul>';
      return '<section class="sheetsec"><h3>' + esc(c.name) + '</h3>' + c.intro.map((card) => '<p class="rule small">' + rich(card.body) + '</p>').join('') + rows + '</section>';
    }).join('');
    $app.innerHTML = '<div class="sesbar"><button class="link" data-act="home">← Home</button><span class="sestitle">Study sheet</span></div><main class="sheet">' + sec + '</main>';
  }

  /* ---------------- events ---------------- */
  document.addEventListener('click', (e) => {
    const sp = e.target.closest('[data-say]'); if (sp) { e.preventDefault(); say(sp.getAttribute('data-say')); if (sp.classList.contains('spk') || sp.classList.contains('numchip') || sp.classList.contains('listenbtn')) return; }
    const acc = e.target.closest('[data-acc]');
    if (acc) { const inp = document.getElementById('answer'); if (inp) { const a = acc.getAttribute('data-acc'), s = inp.selectionStart != null ? inp.selectionStart : inp.value.length, en = inp.selectionEnd != null ? inp.selectionEnd : s; inp.value = inp.value.slice(0, s) + a + inp.value.slice(en); inp.focus(); inp.setSelectionRange(s + a.length, s + a.length); } return; }
    const ch = e.target.closest('[data-choice]'); if (ch && SES && !SES.fb) { answerMc(+ch.getAttribute('data-choice')); return; }
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.getAttribute('data-act');
    if (act === 'start') startSession('today');
    else if (act === 'ahead') startSession('ahead');
    else if (act === 'extra') startSession('extra');
    else if (act === 'quiz') startSession('quiz');
    else if (act === 'sheet') show('sheet');
    else if (act === 'home' || act === 'quit') { if (act === 'quit' && SES && SES.cid) { /* unfinished part restarts next time */ } SES = act === 'home' ? SES : null; show('home'); }
    else if (act === 'next') { SES.i++; SES.q = null; SES.fb = null; render(); }
    else if (act === 'cont') { SES.i++; SES.q = null; SES.fb = null; render(); }
    else if (act === 'reveal') { SES.build.miss = true; SES.build.fixing = true; SES.build.typed.push('(showed me)'); render(); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    const inp = document.getElementById('answer'); const v = inp ? inp.value : '';
    if (!v.trim()) { if (inp) inp.focus(); return; }
    if (f.getAttribute('data-form') === 'type') answerType(v); else answerBuild(v);
  });
  document.addEventListener('keydown', (e) => {
    if (view !== 'session' || !SES) return;
    if (e.target && e.target.tagName === 'INPUT') return;
    if (SES.q && !SES.fb && SES.q.type === 'mc' && /^[1-4]$/.test(e.key)) { const i = +e.key - 1; if (i < SES.q.choices.length) answerMc(i); }
  });

  if (/[?&]debug=1/.test(location.search)) window.__fr = { ses: () => SES, state: () => S, buildQ, items: FR.items };
  /* ---------------- start ---------------- */
  $app.innerHTML = '<main class="stage"><div class="card"><p>Loading your progress…</p></div></main>';
  window.Store.load().then((r) => {
    const msg = {
      noconfig: ['The database isn\'t connected yet', 'Your dad needs to finish setting it up.'],
      offline: ['Can\'t reach the database', 'Check the Wi-Fi, then reload the page.'] }[r.error];
    if (msg) { $app.innerHTML = '<main class="stage"><div class="card"><h2>' + msg[0] + '</h2><p>' + msg[1] + '</p><button class="btn" onclick="location.reload()">Try again</button></div></main>'; return; }
    S = r.state && r.state.items ? r.state : blank();
    if (!S.chunks) S.chunks = {}; if (!S.sessions) S.sessions = 0;
    render();
  });
  window.Store.onStatus((s) => { const el = document.getElementById('savestatus'); if (el) { el.textContent = s.text; el.className = 'savestatus ' + s.kind; } });
})();
