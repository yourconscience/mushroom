#!/usr/bin/env python3
"""Cut 15-second loops from a pool of real tracks.

Reads music/sources.json (private, gitignored):
  {"pool": [{"src": "~/Music/...", "start": null, "len": 15}, ...]}

"start": null picks the loudest window of "len" seconds (usually the chorus).

Writes NN.mp3 for the pool (in order), all with metadata tags stripped, into the
mushroom-clips checkout next to this repo (or $CLIPS_DIR), plus its manifest.json:
  {"files": ["01.mp3", ...], "t": [...]}
"t" holds the titles XOR-ed with a fixed key and base64-encoded, so the names
never sit in the public repo as plain text; js/audio.js decodes them (deob),
loads the manifest and reshuffles the pool on every run.
The artist/track mapping goes to music/TRACKLIST.md, which stays gitignored:
it is the only place the real names live.
Needs ffmpeg.
"""
import base64, json, os, re, subprocess, sys

OBF_KEY = b"grib-versus"  # same key as OBF_KEY in js/audio.js


def obf(s):
    if s is None:
        return None
    b = s.encode("utf8")
    return base64.b64encode(bytes(c ^ OBF_KEY[i % len(OBF_KEY)] for i, c in enumerate(b))).decode()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, "music")
CLIPS = os.environ.get("CLIPS_DIR") or os.path.join(os.path.dirname(ROOT), "mushroom-clips")


def rms_per_second(src):
    out = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-af",
         "aresample=8000,asetnsamples=n=8000,astats=metadata=1:reset=1,"
         "ametadata=print:key=lavfi.astats.Overall.RMS_level:file=-",
         "-f", "null", "-"],
        capture_output=True, text=True, check=True).stdout
    vals = [float(v) for v in re.findall(r"RMS_level=(-?[\d.]+|-inf)", out.replace("-inf", "-120"))]
    return [10 ** (v / 10) for v in vals]  # linear power per second


def loudest_start(power, length):
    n = len(power)
    if n <= length:
        return 0
    lo, hi = int(n * 0.1), max(int(n * 0.9) - length, int(n * 0.1) + 1)
    return max(range(lo, hi), key=lambda s: sum(power[s:s + length]))


def title_of(path):
    # "053 Artist - Title.mp3" -> "Artist - Title"
    t = os.path.basename(path)[:-4]
    return re.sub(r"^\d{1,3}[ .\-]+", "", t)


def cut(src, start, length, out):
    if start is None:
        start = loudest_start(rms_per_second(src), length)
    # aresample/aformat work around libmp3lame "inadequate AVFrame plane padding"
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length), "-i", src,
         "-af", f"aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo,"
                f"afade=t=in:d=0.25,afade=t=out:st={length - 0.4}:d=0.4",
         "-ac", "2", "-ar", "44100", "-b:a", "128k", "-map", "0:a:0", "-map_metadata", "-1",
         "-id3v2_version", "0", "-write_id3v1", "0", out], check=True)
    return start


def main():
    data = json.load(open(os.path.join(MUSIC, "sources.json"), encoding="utf8"))
    os.makedirs(CLIPS, exist_ok=True)
    files, titles, tracklist = [], [], ["| # | source | start |", "|---|--------|-------|"]
    for i, cfg in enumerate(data.get("pool") or [], 1):
        src = os.path.expanduser(cfg["src"])
        if not os.path.exists(src):
            print(f"skip {src}", file=sys.stderr)
            files.append(None)
            titles.append(None)
            continue
        name = f"{i:02d}.mp3"
        try:
            start = cut(src, cfg.get("start"), int(cfg.get("len") or 15), os.path.join(CLIPS, name))
        except subprocess.CalledProcessError:
            print(f"skip {src}: ffmpeg failed", file=sys.stderr)
            files.append(None)
            titles.append(None)
            continue
        files.append(name)
        titles.append(title_of(src))
        tracklist.append(f"| {i} | {title_of(src)} | {start}s |")
        print(f"{name} {start}s  {os.path.basename(src)}")
    json.dump({"files": files, "t": [obf(t) for t in titles]},
              open(os.path.join(CLIPS, "manifest.json"), "w"), indent=0, ensure_ascii=False)
    open(os.path.join(MUSIC, "TRACKLIST.md"), "w", encoding="utf8").write("\n".join(tracklist) + "\n")


if __name__ == "__main__":
    main()
