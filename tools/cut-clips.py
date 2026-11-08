#!/usr/bin/env python3
"""Cut a short loop from each zone's real track for local play.

Reads music/sources.json:
  {"ДРОЗД": {"src": "~/Music/favourite/Kunteynir - Дрозд.mp3", "start": null, "len": 15}, ...}
"start": null picks the loudest window of "len" seconds (usually the chorus).
Writes music/NN.mp3 and music/clips.json, which index.html loads if present.
music/ is gitignored: the clips are copyrighted and must not be published.
Needs ffmpeg.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, "music")


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


def main():
    sources = json.load(open(os.path.join(MUSIC, "sources.json"), encoding="utf8"))
    clips = []
    for i, (zone, cfg) in enumerate(sources.items(), 1):
        src = os.path.expanduser(cfg["src"])
        length = int(cfg.get("len") or 15)
        if not os.path.exists(src):
            print(f"skip {zone}: no file {src}", file=sys.stderr)
            continue
        start = cfg.get("start")
        if start is None:
            start = loudest_start(rms_per_second(src), length)
        name = f"{i:02d}.mp3"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length), "-i", src,
             "-af", f"afade=t=in:d=0.25,afade=t=out:st={length - 0.4}:d=0.4",
             "-ac", "2", "-b:a", "128k", os.path.join(MUSIC, name)], check=True)
        clips.append({"zone": zone, "file": name, "start": start})
        print(f"{zone}: {name} from {start}s, {length}s")
    json.dump(clips, open(os.path.join(MUSIC, "clips.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
