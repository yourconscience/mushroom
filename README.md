# Mushroom

ГРИБ: Versus is a browser runner: a mushroom stomps plumbers to a shuffled 400-track soundtrack and meets a random boss every 10 levels.
The mushroom is a nod to the Oxxxymiron vs Слава КПСС Versus battle.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=5)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect bonuses: 🍄 big mushroom (survives one hit), 🚀 jetpack, 🦠 spores, 🌀 slow-mo (then a short speed-up), 🧲 magnet, 💰 loot, 🎰 slot machine, 🎞 noir (one zone in black and white, bonuses burn, the big mushroom stays)
- Hedgehogs can't be stomped; wrench throwers and diving pigeons can
- Bosses: every 10th level brings one of seven at random (all seven before any repeats, repeats get numbered II, III). The track loops until the boss goes down; hit a boss from above only when gold stars are over its head
  - ГЛАВНЫЙ САНТЕХНИК: wrenches in bursts, leap and shockwave on rage, then a charge; 5 stomps
  - ГОЛУБИНЫЙ КОРОЛЬ: eggs, then a dive; stomp while the beak is stuck; 5 stomps
  - ДУТАЯ ФИГУРА: low bubbles to jump, high ones to duck, then it sags down and rolls; 5 stomps
  - СТЕКЛЯННЫЙ ПЕТУХ: shards in pairs and triples, feints on rage; 6 stomps
  - ПОДЗЕМНЫЙ ЧЕРВЬ: burrows and surfaces next to you, chasing underground; stomp him only while he is up and crawling; 5 stomps
  - ЛЕТАЮЩАЯ ТАРЕЛКА: fans of discs, then a telegraphed beam from above; stomp while it vents; 5 stomps
  - ЦАРЬ ГРИБОВ: jumps and sends shockwaves plus falling spores, teleports, calls two walkers on rage; 6 stomps
- Mini-bosses: from level 12 a level has a 30% chance of ОКСИ, ШОК, ГНОЙНЫЙ or ТАНЦОР; 3 stomps each, same gold-star rule
- Z key -- spin the slot machine

## Features
- 15 zones on a loop with procedural backgrounds, 7 enemy types, each with its own temper: speed, lunges, dips, bursts
- A random boss every 10 levels, seven kinds, each with its own movement and hit window
- Menu with nickname, music toggle, bonus and level info, online top-10
- Share card for Telegram and other apps (the game link is copied for the next message)
- Mobile-friendly (touch controls)
- Hip-hop quotes as kill banners

## Progress

Reaching the first boss opens a Секреты tab in the menu with every secret nickname. Seven goals (first boss, beating a boss, meeting and beating all seven, all mini-bosses, top 10, every secret hero) unlock start perks, the БАТТЛ mode and the ЛЕГЕНДА hero. Progress lives in the browser.

## Audio

The game ships 400 15-second clips in `clips/`. Their titles are kept in `clips/manifest.json` lightly obfuscated (XOR plus base64), so no artist or track name sits in the repo as plain text. The tracklist is Russian hip-hop only: the first 200 come from the owner's own library (favourites, Kunteynir, Бабангида, Паша Техник), the rest are the channel's 2023-2026 picks — year-end top lists, release reviews and profiles from @psyterrormagazine — downloaded and cut per track. Every run shuffles the pool, so each zone gets a different track and its banner shows that track's name. Boss fights also get a random track. The full pool list is a hidden menu tab that unlocks once your nickname reaches the top 5 of the leaderboard. `tools/cut-clips.py` cuts the clips from a private `music/` folder that stays out of git, and the audio files themselves carry no tags.

## Leaderboard

Scores live in one place: a small Go + SQLite server (`server/`) that keeps the best score per nickname, with names in caps. The public API can only read and add. Deleting goes through an admin port that only the server itself can reach:

```
ssh <vps> grib-lb ls            # every row
ssh <vps> grib-lb rm NAME       # NAME on both boards; or v2:NAME / v2s:NAME for one
```

Scores that fail to send wait in the browser and go out on the next visit.

The page reads two sources and shows the best score per nickname: the server, and the public kvdb.io mirror of the same keys. The mirror exists because a public page cannot call a tailnet address — Chrome blocks it as local network access — so the top list stays visible either way. Writes go to both.

## Version

Current build: **v27** (shown in the bottom-right corner of the game).

## Credits

The first version took half a day with Claude Fable. Version 2 (zones, bonuses, enemies, audio, graphics, menu and bosses) grew over several sessions with Claude Opus and Sonnet. Plain HTML and JavaScript: no build step, no libraries.
