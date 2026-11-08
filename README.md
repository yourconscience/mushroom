# Mushroom

ГРИБ: Versus is a browser runner: a mushroom stomps plumbers to a shuffled 200-track soundtrack and meets bosses on levels 25, 50, 75 and 100.
The mushroom is a nod to the Oxxxymiron vs Слава КПСС Versus battle.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=5)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect bonuses: 🍄 big mushroom (survives one hit), 🚀 jetpack, 🦠 spores, 🌀 slow-mo (then a short speed-up), 🧲 magnet, 💰 loot, 🎰 slot machine, 🎞 noir (one zone in black and white, bonuses burn, the big mushroom stays)
- Hedgehogs can't be stomped; wrench throwers and diving pigeons can
- Bosses: the track loops until the boss goes down, and you can only hit a boss from above while it comes at you on the ground (gold stars over its head)
  - Level 25, ГЛАВНЫЙ САНТЕХНИК: dodge wrenches, jump the shockwave, 4 stomps
  - Level 50, ГОЛУБИНЫЙ КОРОЛЬ: jump the eggs, then stomp him while his beak is stuck in the ground, 4 stomps
  - Level 75, ДУТАЯ ФИГУРА: jump low bubbles, stay put under high ones, stomp it while it bounces, 4 stomps
  - Level 100, СТЕКЛЯННЫЙ ПЕТУХ: shards come in pairs (one jump) and triples (double jump), watch for feints, 5 stomps
- Z key -- spin the slot machine

## Features
- 15 zones on a loop with procedural backgrounds, 7 enemy types
- Four bosses on levels 25, 50, 75 and 100; more are planned up to level 200
- Menu with nickname, music toggle, bonus and level info, online top-10
- Share card for Telegram and other apps (the game link is copied for the next message)
- Mobile-friendly (touch controls)
- Hip-hop quotes as kill banners

## Audio

The game ships 200 15-second clips in `clips/`. Their titles are kept in `clips/manifest.json` lightly obfuscated (XOR plus base64), so no artist or track name sits in the repo as plain text. The tracklist is Russian hip-hop only: picks from the @psyterrormagazine channel (posts from the last three years) plus the owner's own library (favourites, Kunteynir, Бабангида, Паша Техник). Every run shuffles the pool, so each zone gets a different track and its banner shows that track's name; every 10th level plays `clips/special.mp3` at 1.2x volume. The full pool list is a hidden menu tab that unlocks once your nickname reaches the top 5 of the leaderboard. `tools/cut-clips.py` cuts the clips from a private `music/` folder that stays out of git, and the audio files themselves carry no tags.

## Version

Current build: **v13** (shown in the bottom-right corner of the game).

## Credits

The first version took half a day with Claude Fable. Version 2 (zones, bonuses, enemies, audio, graphics, menu and bosses) grew over several sessions with Claude Opus and Sonnet. Plain HTML and JavaScript: no build step, no libraries.
