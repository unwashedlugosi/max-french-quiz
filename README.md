# Max's French (Unit 1, Leçon 1A)

Study app for Max's French quiz on Wednesday, Nov 4, 2026. Plain static site (no build step) on GitHub Pages; progress is saved in Supabase.

- `index.html`: Max's app.
- `parent.html`: parent tracker (read-only).

Both open from plain addresses with nothing to type (Dave's choice). The database functions in `supabase/plain-links.sql` always use Max's record.

## How it works
- `content.js`: everything on the teacher's hand-out, split into 9 chunks, with why-notes, 3 easy example sentences per word, and spelling pieces for long phrases. The Sat–Wed plan is at the bottom.
- `app.js`: the coach. Each chunk is learned in groups of 4 (see it, recognize it, pick it), then a spelling round where long phrases are typed one or two words at a time. Misses are explained and asked again 3 questions later. Learned items come back on a spaced schedule (6h, 20h, 44h, 96h), missed ones first. After every right answer he sees the word in a simple sentence.
- `store.js`: saves to Supabase through three database functions (`fr_load_max`, `fr_save_max`, `fr_parent_max`). No login, no browser storage.
- `audio/` + `audio-manifest.js`: every phrase pre-recorded with the open-source Kokoro neural voice (Apache-2.0, voice `ff_siwis`). Anything not pre-recorded falls back to the browser's French voice.

## Setup
1. Run `supabase/french-schema.sql` in the Supabase SQL editor with real keys filled in (adds only `fr_` tables and functions).
2. Put the project URL and anon/publishable key in `config.js`.

## Regenerating audio
`node tools/list-speech.js > tools/speech.json && node tools/build-manifest.js`, then `python3 tools/make-audio.py <dir with kokoro-v1.0.onnx and voices-v1.0.bin>` (models from github.com/thewh1teagle/kokoro-onnx releases).

## Tests
`node test/mock-server.js` (fake database on :8080), then `node test/fuzz.js` and `node test/drive-all.js <screenshot dir>`.
