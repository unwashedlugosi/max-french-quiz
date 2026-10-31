// Lists every French string the app can speak, so tools/make-audio.py can pre-record them.
// Usage: node tools/list-speech.js > tools/speech.json
global.window = {};
require('../content.js');
const FR = window.FR;
const out = new Set();
const add = (s) => { if (s) out.add(String(s)); };
const isVowel = (w) => /^[aeiouhéèêàâîôûœ]/i.test(w);
const defArt = (n) => (isVowel(n.w) ? "l'" : n.g === 'f' ? 'la' : 'le');
const withDef = (n) => defArt(n) + (isVowel(n.w) ? '' : ' ') + n.w;
const indef = (n) => (n.g === 'f' ? 'une' : 'un');
const cleanFr = (s) => s.replace(/…$/, '').trim();
const de = (n) => (isVowel(n.w) ? "d'" : 'de ');
add("C'est"); add('Ce sont'); add('Il y a'); add("Qu'est-ce que c'est ?");
FR.items.forEach((it) => {
  (it.ex || []).forEach((e) => add(e[0]));
  if (it.kind === 'phrase' || it.kind === 'gram') { add(cleanFr(it.fr)); (it.accept || []).forEach(add); }
  if (it.kind === 'noun') {
    add(withDef(it)); add(it.w); add('les ' + it.pl); add('des ' + it.pl);
    if (it.g !== 'mf') add(indef(it) + ' ' + it.w);
    if (it.fem) add(it.fem); if (it.masc) add(it.masc);
    if (it.chunk === 'c8') {
      add("C'est " + indef(it) + ' ' + it.w); add('Ce sont des ' + it.pl); add('Il y a ' + indef(it) + ' ' + it.w);
      for (let k = 1; k <= 12; k++) add('Il y a ' + FR.numFr(k) + ' ' + it.pl);
      add('Il y a combien ' + de(it) + it.pl + ' ?');
    }
  }
});
for (let n = 0; n <= 100; n++) { add(FR.numFr(n)); for (let k = 0; k < FR.NUM_NOUNS.length; k++) add(FR.numSentence(n, k)[0]); }
add('mille'); add('quatre-vingt');
FR.NUM_NOUNS.forEach((z) => add('Il y a combien ' + (isVowel(z[0]) ? "d'" : 'de ') + z[0] + ' ?'));
for (let n = 2; n <= 100; n++) FR.NUM_NOUNS.forEach((z) => add('Il y a ' + FR.numFr(n) + ' ' + z[0]));
console.log(JSON.stringify([...out], null, 0));
