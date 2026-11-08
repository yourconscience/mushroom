# Mushroom

A pixel-art platformer where you play as a mushroom stomping plumbers. 
A tongue-in-cheek role reversal of classic Mario.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=3)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect coins and bonuses: 🍄 big mushroom (survives one hit), 🦠 spores, 🌀 slow-mo, 🧲 magnet, ☂️ glider, 🚀 jetpack
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

Built in half a day with [Claude Fable](https://claude.ai). Single-file, zero dependencies.
