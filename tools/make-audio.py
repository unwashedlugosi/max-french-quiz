# Pre-records every phrase with the Kokoro neural voice (open source, Apache-2.0; voice ff_siwis).
# Usage: python3 tools/make-audio.py <dir with kokoro-v1.0.onnx & voices-v1.0.bin>
import json, os, subprocess, sys, soundfile as sf
from kokoro_onnx import Kokoro
mdir = sys.argv[1]
k = Kokoro(os.path.join(mdir, "kokoro-v1.0.onnx"), os.path.join(mdir, "voices-v1.0.bin"))
lst = json.load(open("tools/speech-list.json"))
os.makedirs("audio", exist_ok=True)
tmp = os.path.join(mdir, "tmp.wav")
for i, t in enumerate(lst):
    out = f"audio/{i}.mp3"
    if os.path.exists(out): continue
    words = len(t.split())
    s, sr = k.create(t, voice="ff_siwis", speed=0.82 if words <= 2 else 0.9, lang="fr-fr")
    sf.write(tmp, s, sr)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", tmp, "-af", "silenceremove=start_periods=1:start_threshold=-50dB,apad=pad_dur=0.15", "-ac", "1", "-b:a", "48k", out], check=True)
    if i % 100 == 0: print(i, t, flush=True)
print("done", len(lst))
