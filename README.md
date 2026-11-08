# Mushroom

ГРИБ: Versus is an endless runner where a mushroom stomps plumbers through 15 zones named after Russian hip-hop tracks.
The mushroom is a nod to the Oxxxymiron vs Слава КПСС Versus battle.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=4)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect coins and bonuses: 🍄 big mushroom (survives one hit), 🦠 spores, 🌀 slow-mo, 🧲 magnet, 🎞 noir (one zone in black and white with no bonuses), 🚀 jetpack
- Hedgehogs can't be stomped; wrench throwers and diving pigeons can
- Level 25: boss fight with ГЛАВНЫЙ САНТЕХНИК. Dodge wrenches, jump the shockwave, stomp his head 4 times while he charges. The track loops until he goes down
- Z key -- spin the slot machine

## Features
- 15 music zones, 7 enemy types
- Online leaderboard (v2 board)
- Mobile-friendly (touch controls)
- Russian hip-hop quotes as kill banners

## Audio

The game ships 200 15-second clips in `clips/`. Their titles are kept in `clips/manifest.json` lightly obfuscated (XOR plus base64), so no artist or track name sits in the repo as plain text. Every run shuffles the pool, so each zone gets a different track and its banner shows that track's name; every 10th level plays `clips/special.mp3` at 1.2x volume. The full pool list is a hidden menu tab that unlocks once your nickname reaches the top 5 of the leaderboard. `tools/cut-clips.py` cuts the clips from a private `music/` folder that stays out of git, and the audio files themselves carry no tags.

## Version

Current build: **v10** (shown in the bottom-right corner of the game).

## Credits

The first version took half a day with Claude Fable. Version 2 (zones, bonuses, enemies, audio and graphics) grew over several sessions with Claude Opus and Sonnet. Plain HTML and JavaScript: no build step, no dependencies.
