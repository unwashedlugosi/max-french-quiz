/* store.js — saves Max's progress to the Supabase database. No login and no browser storage:
 * the link carries a key (?k=… for Max, ?p=… for the parent tracker), and the database only
 * answers through three functions that check that key (see supabase/french-schema.sql).
 */
(function () {
  'use strict';
  const cfg = window.FR_CONFIG || {};
  const URL_ = String(cfg.supabaseUrl || '').replace(/\/+$/, '');
  const ANON = cfg.anonKey || '';
  const params = new URLSearchParams(location.search);
  const KEY = params.get('k') || '';
  const PKEY = params.get('p') || '';
  const BACKOFF = [2000, 5000, 15000, 30000];

  async function rpc(fn, body, timeoutMs) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs || 12000);
    try {
      const res = await fetch(URL_ + '/rest/v1/rpc/' + fn, {
        method: 'POST', signal: ctl.signal,
        headers: Object.assign({ 'Content-Type': 'application/json', apikey: ANON }, /^eyJ/.test(ANON) ? { Authorization: 'Bearer ' + ANON } : {}),
        body: JSON.stringify(body),
      });
      if (!res.ok) { const txt = await res.text().catch(() => ''); const e = new Error('HTTP ' + res.status + ' ' + txt.slice(0, 200)); e.status = res.status; throw e; }
      return await res.json();
    } finally { clearTimeout(t); }
  }

  let latest = null, dirty = false, inFlight = false, events = [], fails = 0, timer = null;
  const listeners = [];
  function status(kind, text) { listeners.forEach((f) => { try { f({ kind, text }); } catch (e) { /* ignore */ } }); }

  function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, ms); }
  async function flush() {
    if (inFlight || (!dirty && !events.length) || !KEY) return;
    inFlight = true; status('saving', 'Saving…');
    const batch = events.splice(0, 150); const snap = latest; dirty = false;
    try {
      await rpc('fr_save', { p_key: KEY, p_state: snap, p_events: batch });
      fails = 0; status('saved', 'Saved');
    } catch (e) {
      events = batch.concat(events); dirty = true;
      status('error', 'Not saved yet. Check the Wi-Fi; it keeps trying.');
      schedule(BACKOFF[Math.min(fails++, BACKOFF.length - 1)]);
    } finally { inFlight = false; }
    if ((dirty || events.length) && fails === 0) schedule(300);
  }

  window.Store = {
    key: KEY, parentKey: PKEY, configured: !!(URL_ && ANON),
    async load() {
      if (!KEY) return { error: 'nokey' };
      if (!URL_ || !ANON) return { error: 'noconfig' };
      for (let i = 0; i < 3; i++) {
        try {
          const r = await rpc('fr_load', { p_key: KEY });
          if (r == null) return { error: 'badkey' };
          return { state: r.state || {} };
        } catch (e) { await new Promise((ok) => setTimeout(ok, 1500 * (i + 1))); }
      }
      return { error: 'offline' };
    },
    save(state) { latest = state; dirty = true; schedule(700); },
    event(ev) { events.push(ev); },
    pending() { return dirty || events.length > 0 || inFlight; },
    onStatus(f) { listeners.push(f); },
    async parent() {
      if (!PKEY) return { error: 'nokey' };
      if (!URL_ || !ANON) return { error: 'noconfig' };
      try { const r = await rpc('fr_parent', { p_key: PKEY }); return r == null ? { error: 'badkey' } : r; }
      catch (e) { return { error: 'offline' }; }
    },
  };
  window.addEventListener('beforeunload', (e) => { if (window.Store.pending()) { flush(); e.preventDefault(); e.returnValue = ''; } });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
})();
