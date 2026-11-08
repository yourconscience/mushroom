# Mushroom

ГРИБ: Versus is an endless runner where a mushroom stomps plumbers through 15 zones named after Russian hip-hop tracks.
The mushroom is a nod to the Oxxxymiron vs Слава КПСС Versus battle.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=3)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect coins and bonuses: 🍄 big mushroom (survives one hit), 🦠 spores, 🌀 slow-mo, 🧲 magnet, 🎞 noir (one zone in black and white with no bonuses), 🚀 jetpack
- Hedgehogs can't be stomped; wrench throwers and diving pigeons can
- Z key -- spin the slot machine

## Features
- 15 music zones, 7 enemy types
- Online leaderboard (v2 board)
- Mobile-friendly (touch controls)
- Russian hip-hop quotes as kill banners

## Audio

The game ships 100 unnamed 15-second clips in `clips/` — no titles, artists or tags. Every run shuffles the pool, so each zone gets a different track; every 10th level plays a dedicated `clips/special.mp3` at 1.2x volume. `clips/manifest.json` lists the files. `tools/cut-clips.py` cuts them from a private `music/` folder that stays out of git.

## Credits

The first version took half a day with Claude Fable. Version 2 (zones, bonuses, enemies, audio and graphics) grew over several sessions with Claude Opus and Sonnet. Plain HTML and JavaScript: no build step, no dependencies.
