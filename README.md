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

Each zone plays its own bundled 15-second clip from `clips/`, matched to the zone by position (`clips/manifest.json`). The files carry no titles, artists or tags. `tools/cut-clips.py` cuts them from a private `music/` folder that stays out of git.

## Credits

Built in half a day with [Claude Fable](https://claude.ai). Single-file, zero dependencies.
