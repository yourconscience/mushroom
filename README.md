# Mushroom

ГРИБ: Versus is a browser runner: a mushroom stomps plumbers to a shuffled 400-track soundtrack and meets a random boss every 7 levels.
The mushroom is a nod to the Oxxxymiron vs Слава КПСС Versus battle.

**[Play in browser](https://yourconscience.github.io/mushroom/)**

![gameplay](screenshot.png?v=5)

## How to play

- Tap / Space -- jump (tap again mid-air for double jump)
- Land ON enemies to stomp them
- Collect bonuses: 🍄 big mushroom (survives one hit), 🚀 jetpack, 🦠 spores, 🌀 slow-mo (then a short speed-up), 🧲 magnet, 💰 loot, 🎰 slot machine, 🎞 noir (one zone in black and white, bonuses burn, the big mushroom stays), and six more that open up through the ladder: ⭐ star (5 s: nothing hurts, faster, touch kills; pits still kill), 🟢 1UP (a second life in stock, a mini-boss always drops one), 🫧 bubble (held: saves you from the next pit), ⚡ zap (6 s: enemies smaller and half speed, the boss freezes for 2.5 s and its attacks vanish), 🎤 punch (instantly removes up to three enemies ahead, or hits a boss once), 👻 ghost (4 s: everything passes through you, no stomps). When a run goes badly (small mushroom, no stomp for 10 s) helpers drop twice as often and loot and slot machines half as often
- Hedgehogs can't be stomped; wrench throwers and diving pigeons can
- The first seven levels are gentler: a big mushroom always waits at the start of levels 3, 6 and 9 (except during the black-and-white zone), speed grows more slowly, and hoppers and wrench throwers only appear after level 7
- Bosses: every 7th level brings one of seven, the king always last in the round of seven; repeats get numbered II, III. Each one goes down a different way:
  - ГЛАВНЫЙ САНТЕХНИК (4): stomp him while he charges
  - ГОЛУБИНЫЙ КОРОЛЬ (3): out of reach; stomp the golden egg and it flies back at him
  - ДУТАЯ ФИГУРА (3): head-butt it from below as it floats over you
  - СТЕКЛЯННЫЙ ПЕТУХ (3): don't hit it; clear a whole series without being touched and the glass cracks
  - ПОДЗЕМНЫЙ ЧЕРВЬ (4): be in the air when the mound reaches you, then stomp the real head, not the thorny one
  - ЛЕТАЮЩАЯ ТАРЕЛКА (3): out of reach; stomp the golden disc, it throws you onto the saucer
  - ЦАРЬ ГРИБОВ (5): stomp him while he squats and crawls; from the third stomp he wears armour until you stomp a soldier he summons
- Mini-bosses: level 4 always has an easy one (a single stomp, 750 points), then each stretch between two bosses has one on a random level (every 4th level in БАТТЛ, never easy). Kinds: ОКСИ, ШОК, ГНОЙНЫЙ, ТАНЦОР or РИКИ Ф; the full form takes 2 stomps, attacks in random order; their body doesn't hurt, so a miss is free: they run off screen and come back
- Z key -- spin the slot machine (two charges at most, a third pickup gives +300; outcomes now include a star, a 1UP, 8 s of spores and turning every enemy on screen into pigeons)
- New players start every normal run with a second life (🟢) until they beat a first mini-boss or boss
- Sparring: every boss and mini-boss you have met has a Спарринг button in the Боссы tab: a practice fight that scores nothing and changes no goals

## Features
- 15 zones on a loop with procedural backgrounds, 7 enemy types, each with its own temper: speed, lunges, dips, bursts
- A random boss every 7 levels, seven kinds, each with its own movement and hit window
- Menu with nickname, music toggle, bonus and level info, online top-10
- Share card for Telegram and other apps (the game link is copied for the next message)
- Mobile-friendly: touch controls, and on screens narrower than 640 px the world is drawn zoomed out, so a phone sees about as far ahead as a small desktop window
- Hip-hop quotes as kill banners

## Daily run

The «Забег дня» button starts the run of the day (Moscow date): the same platforms, enemies, bonuses, boss, mini-boss and track order for everyone that day. Secret nicknames play as plain mushrooms and start perks are off, so the daily top (keys `day:YYYY-MM-DD:NAME`) compares like with like. The server takes scores for a day only while that Moscow day is today or yesterday. Boss attacks stay random. Playing on consecutive days builds a streak shown on the button and the share card.

## Progress

Reaching the first boss opens a Секреты tab in the menu with every secret nickname. Seven goals (first boss, beating a boss, meeting and beating all seven, all mini-bosses, top 10, every secret hero) unlock start perks, the БАТТЛ mode and the ЛЕГЕНДА hero. Progress lives in the browser. A player who has never beaten a mini-boss or a boss gets one extra life (🟢) in normal runs. Every met boss and mini-boss has a Спарринг chip in the Боссы tab: a practice fight on a plain mushroom that posts nothing to the top, the counter or the goals.

## Audio

The game plays 400 15-second clips that live in their own repo, [mushroom-clips](https://github.com/yourconscience/mushroom-clips), so a game release does not re-upload 96 MB. Their titles are kept in its `manifest.json` lightly obfuscated (XOR plus base64), so no artist or track name sits in the repo as plain text. The tracklist is Russian hip-hop only: the first 200 come from the owner's own library (favourites, Kunteynir, Бабангида, Паша Техник), the rest are the channel's 2023-2026 picks — year-end top lists, release reviews and profiles from @psyterrormagazine — downloaded and cut per track. Every run shuffles the pool, so each zone gets a different track and its banner shows that track's name. A clip is downloaded when its zone comes up, with the next one fetched ahead, so a visit costs a few hundred kilobytes per zone and not the whole 96 MB pool. Boss fights also get a random track. The full pool list is a hidden menu tab that unlocks once your nickname reaches the top 5 of the leaderboard. `tools/cut-clips.py` cuts the clips from a private `music/` folder that stays out of git into a `mushroom-clips` checkout next to this repo (or `CLIPS_DIR`), and the audio files themselves carry no tags.

## Leaderboard

Scores live in one place: a small Go + SQLite server (`server/`) that keeps the best score per nickname, with names in caps. The public API can only read and add. Deleting goes through an admin port that only the server itself can reach:

```
ssh <vps> grib-lb ls            # every row
ssh <vps> grib-lb rm NAME       # NAME on both boards; or v2:NAME / v2s:NAME / day:YYYY-MM-DD:NAME for one
ssh <vps> grib-lb stats [DAYS]  # anonymous run counter: new and returning players, shares, where runs end
```

The run counter stores only a UTC day, an event name and a count: run start (new browser, back on another day, again today), run end (level, cause: pit, enemy or the boss kind, and whether the screen was narrow) and share clicks. No ids, nicknames or addresses.

Scores that fail to send wait in the browser and go out on the next visit or when the network returns. With no network the menu shows the last board this browser saw.

The API is public HTTPS on the server's own address, not a tailnet name: a browser on a device inside the tailnet treats a tailnet address as local network and blocks it from a public page.

## Code

No build step. `index.html` holds the markup and loads `style.css` and `js/*.js` in a fixed order; the scripts share one global scope. Bosses live in `js/bosses.js` and `js/boss-draw.js`, mini-bosses in `js/minis.js`, zones in `js/zones.js`.

## Version

Current build: **v41** (shown in the bottom-right corner of the game).

## Credits

The first version took half a day with Claude Fable. Version 2 (zones, bonuses, enemies, audio, graphics, menu and bosses) grew over several sessions with Claude Opus and Sonnet. Plain HTML and JavaScript: no build step, no libraries.
