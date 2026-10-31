// Same normalization as speechKey() in app.js — keep them identical.
module.exports = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[?!.,;:«»—…"]/g, ' ').replace(/\s+/g, ' ').trim();
