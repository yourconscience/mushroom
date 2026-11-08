#!/usr/bin/env python3
"""Cut a short loop from each zone's real track.

Reads music/sources.json (private, gitignored):
  {"ДРОЗД": {"src": "~/Music/favourite/Kunteynir - Дрозд.mp3", "start": 9, "len": 15}, ...}
"start": null picks the loudest window of "len" seconds (usually the chorus).

Writes clips/NN.mp3 with every metadata tag stripped, plus clips/manifest.json
(an ordered list of file names, no titles). index.html loads that manifest.
The artist/track mapping goes to music/TRACKLIST.md, which stays gitignored:
it is the only place the real names live.
Needs ffmpeg.
"""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC = os.path.join(ROOT, "music")
CLIPS = os.path.join(ROOT, "clips")


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
    os.makedirs(CLIPS, exist_ok=True)
    manifest, tracklist = [], ["| # | zone | source | start |", "|---|------|--------|-------|"]
    for i, (zone, cfg) in enumerate(sources.items(), 1):
        src = os.path.expanduser(cfg["src"])
        length = int(cfg.get("len") or 15)
        if not os.path.exists(src):
            print(f"skip {zone}: no file {src}", file=sys.stderr)
            manifest.append(None)
            continue
        start = cfg.get("start")
        if start is None:
            start = loudest_start(rms_per_second(src), length)
        name = f"{i:02d}.mp3"
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-ss", str(start), "-t", str(length), "-i", src,
             "-af", f"afade=t=in:d=0.25,afade=t=out:st={length - 0.4}:d=0.4",
             "-ac", "2", "-b:a", "128k", "-map", "0:a:0", "-map_metadata", "-1",
             "-id3v2_version", "0", "-write_id3v1", "0", os.path.join(CLIPS, name)], check=True)
        manifest.append(name)
        track = os.path.basename(src)[:-4]
        tracklist.append(f"| {i} | {zone} | {track} | {start}s |")
        print(f"{zone}: {name} from {start}s, {length}s")
    json.dump(manifest, open(os.path.join(CLIPS, "manifest.json"), "w"), indent=0)
    open(os.path.join(MUSIC, "TRACKLIST.md"), "w", encoding="utf8").write("\n".join(tracklist) + "\n")


if __name__ == "__main__":
    main()
