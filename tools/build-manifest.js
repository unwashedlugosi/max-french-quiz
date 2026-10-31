// Rebuilds tools/speech-list.json and audio-manifest.js from tools/speech.json.
const fs = require('fs'), key = require('./speech-key.js');
const a = require('./speech.json'); const m = {}; const list = [];
a.forEach((t) => { const k = key(t); if (!k || m[k]) return; m[k] = 'audio/' + list.length + '.mp3'; list.push(t.replace(/[—…]/g, ' ').replace(/\s+/g, ' ').trim()); });
fs.writeFileSync(__dirname + '/speech-list.json', JSON.stringify(list));
fs.writeFileSync(__dirname + '/../audio-manifest.js', 'window.FR_AUDIO=' + JSON.stringify(m) + ';\n');
console.log(list.length);
