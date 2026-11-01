// Local test server: serves the site and fakes the three Supabase functions in memory.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.env.ROOT || path.join(__dirname, '..');
const db = { state: {}, events: [], updated_at: null };
const SK = 'testkey', PK = 'parentkey';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.json': 'application/json' };
http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }); return res.end(); }
  if (u.pathname.startsWith('/rest/v1/rpc/')) {
    let body = ''; req.on('data', (c) => body += c); req.on('end', () => {
      const b = JSON.parse(body || '{}'), fn = u.pathname.split('/').pop(); let out = null;
      if (fn === 'fr_load_max') out = { state: db.state, updated_at: db.updated_at };
      if (fn === 'fr_save_max') { db.state = b.p_state; db.updated_at = new Date().toISOString(); db.events.unshift(...(b.p_events || []).slice().reverse()); out = db.updated_at; }
      if (fn === 'fr_parent_max') out = { state: db.state, updated_at: db.updated_at, events: db.events };
      res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(out));
    }); return;
  }
  if (u.pathname === '/config.js') { res.writeHead(200, { 'Content-Type': 'text/javascript' }); return res.end("window.FR_CONFIG={supabaseUrl:location.origin,anonKey:'anon'};"); }
  if (u.pathname === '/__db') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(db)); }
  const f = path.join(ROOT, u.pathname === '/' ? 'index.html' : u.pathname);
  fs.readFile(f, (e, d) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); res.end(d); });
}).listen(8080, () => console.log('on 8080'));
