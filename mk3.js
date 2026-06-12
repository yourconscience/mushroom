#!/usr/bin/env node
// ГРИБ MK3 — терминальный ран. Один акцентный цвет, палитра мутирует по зонам.
// Запуск: node mk3.js   (SPACE — прыжок, R — ещё раз, Q — выход)
'use strict';

const out = process.stdout;
if (!out.isTTY) { console.error('mk3 нужен настоящий терминал (TTY)'); process.exit(1); }

// --- Палитры: [имя, R, G, B] — весь кадр рисуется одним цветом разной яркости
const THEMES = [
  ['CLAUDE',   217, 119,  87],
  ['ЦИАН',       0, 229, 200],
  ['КИСЛОТА',  124, 252,   0],
  ['НЕОН',     255,  45, 120],
  ['ЗОЛОТО',   255, 210,  77],
  ['ЛЁД',      150, 200, 255],
];
const QUOTES = ['МЕЖДУ НАМИ ТАЕТ ЛЁД', 'ЭТО ПРОСТО ДЫМ', 'GIMME THE LOOT', 'ГОРОД ПОД ПОДОШВОЙ', 'ЭЩКЕРЕ!', 'МАЛО НАМ, МАЛО', 'ПАНЕЛЬКА, ХРУЩЁВКА'];
const DEATHS = ['Это фиаско, братан.', 'Тебя забрали в суп.', 'Гриб откисает в панельке.', 'Сантехник прочистил тебя.'];

// --- Терминал
let W = 0, H = 0;
function resize() { W = out.columns || 80; H = out.rows || 24; }
resize(); out.on('resize', resize);

const ESC = '\x1b[';
function color(rgb, k, bg) { // k — яркость 0..1.3
  const r = Math.min(255, rgb[0] * k) | 0, g = Math.min(255, rgb[1] * k) | 0, b = Math.min(255, rgb[2] * k) | 0;
  return ESC + (bg ? 48 : 38) + ';2;' + r + ';' + g + ';' + b + 'm';
}

// --- Состояние
const FPS = 30, G = 60, JUMP = -22;
let theme = 0, invertT = 0, flashT = 0, t = 0;
let player, plats, enemies, parts, texts, camX, speed, score, combo, comboT, dist, zoneN, dead, deadLine, quote, quoteT;
let best = 0;
const os = require('os'), fs = require('fs'), path = require('path');
const BEST_FILE = path.join(os.homedir(), '.grib-mk3-best');
try { best = +fs.readFileSync(BEST_FILE, 'utf8') || 0; } catch (e) {}

function reset() {
  const ground = Math.floor(H * 0.7);
  player = { x: 10, y: ground, vy: 0, jumps: 2 };
  plats = [{ x: -10, y: ground, w: 70 }];
  enemies = []; parts = []; texts = [];
  camX = 0; speed = 14; score = 0; combo = 0; comboT = 0; dist = 0; zoneN = 0;
  dead = false; deadLine = ''; quote = ''; quoteT = 0; invertT = 0; flashT = 0;
  while (plats[plats.length - 1].x < 200) addPlat();
}
function addPlat() {
  const last = plats[plats.length - 1];
  const gap = 6 + Math.random() * 8 + speed * 0.15;
  const w = 14 + Math.random() * 22;
  let y = last.y + ((Math.random() * 12 - 6) | 0);
  y = Math.max(6, Math.min(H - 4, y));
  const p = { x: last.x + last.w + gap, y, w };
  plats.push(p);
  if (Math.random() < 0.5 && w > 12) {
    enemies.push({ x: p.x + w / 2, y: p.y, dir: Math.random() < 0.5 ? -1 : 1, p, dead: 0 });
  }
  return p;
}

// --- Эффекты
function pop(x, y, txt) { texts.push({ x, y, txt, l: 0.9 }); }
function burst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 6 + Math.random() * 14;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, l: 0.5 + Math.random() * 0.4 });
  }
}

// --- Апдейт
function update(dt) {
  t += dt;
  if (invertT > 0) invertT -= dt;
  if (flashT > 0) flashT -= dt;
  if (quoteT > 0) quoteT -= dt;
  for (const p of parts) { p.l -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 40 * dt; }
  parts = parts.filter(p => p.l > 0);
  for (const x of texts) { x.l -= dt; x.y -= 4 * dt; }
  texts = texts.filter(x => x.l > 0);
  if (dead) return;

  speed = Math.min(34, speed + dt * 0.15); dist += speed * dt;
  player.x += speed * dt;
  camX = player.x - 10;

  const zn = (dist / 280) | 0;
  if (zn !== zoneN) {
    zoneN = zn; theme = zn % THEMES.length;
    invertT = 0.25; quote = 'ЗОНА: ' + THEMES[theme][0]; quoteT = 1.6;
  }

  player.vy += G * dt; player.y += player.vy * dt;
  for (const p of plats) {
    if (player.x > p.x - 1 && player.x < p.x + p.w + 1 && player.vy >= 0 && player.y >= p.y - 0.5 && player.y <= p.y + Math.max(1.6, player.vy * dt + 0.5)) {
      player.y = p.y; player.vy = 0; player.jumps = 2;
    }
  }
  if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 0; }

  while (plats[plats.length - 1].x < camX + W * 2) addPlat();
  plats = plats.filter(p => p.x + p.w > camX - 20);
  enemies = enemies.filter(e => e.x > camX - 20 && e.dead < 0.6);

  for (const e of enemies) {
    if (e.dead) { e.dead += dt; continue; }
    e.x += e.dir * 7 * dt;
    if (e.x < e.p.x + 1) e.dir = 1;
    if (e.x > e.p.x + e.p.w - 1) e.dir = -1;
    if (Math.abs(player.x - e.x) < 1.6 && player.y > e.y - 2.4 && player.y - 2 < e.y) {
      if (player.vy > 4 && player.y < e.y - 0.8) {
        e.dead = 0.01; player.vy = JUMP * 0.65; player.jumps = 2;
        combo++; comboT = 2.2; const pts = 100 * combo; score += pts;
        pop(e.x, e.y - 3, '+' + pts); burst(e.x, e.y - 1, 10 + combo * 3);
        flashT = 0.08;
        if (combo >= 3) { quote = QUOTES[(Math.random() * QUOTES.length) | 0]; quoteT = 1.4; }
      } else { die(); }
    }
  }
  if (player.y > H + 4) die();
  score += speed * dt * 0.12;
}
function die() {
  if (dead) return;
  dead = true; deadLine = DEATHS[(Math.random() * DEATHS.length) | 0];
  invertT = 0.4; burst(player.x, player.y - 1, 30);
  const s = score | 0;
  if (s > best) { best = s; try { fs.writeFileSync(BEST_FILE, String(best)); } catch (e) {} }
}
function jump() {
  if (dead) return;
  if (player.jumps > 0) { player.vy = JUMP * (player.jumps === 2 ? 1 : 0.85); player.jumps--; burst(player.x, player.y, 4); }
}

// --- Рендер: grid символов + яркостей, один проход в строку
function render() {
  const rgb = THEMES[theme].slice(1);
  const inv = invertT > 0;
  const ch = [], br = [];
  for (let y = 0; y < H; y++) { ch.push(new Array(W).fill(' ')); br.push(new Array(W).fill(0)); }
  function put(x, y, s, k) {
    x |= 0; y |= 0;
    for (let i = 0; i < s.length; i++) {
      const xx = x + i;
      if (xx >= 0 && xx < W && y >= 0 && y < H) { ch[y][xx] = s[i]; br[y][xx] = k; }
    }
  }
  // фон: редкие мерцающие точки (звёзды/снег в одном цвете)
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 73 + ((t * (4 + i % 5)) | 0)) % W);
    const sy = (i * 37) % (H - 2) + 1;
    put(sx, sy, '·', 0.25 + 0.2 * Math.abs(Math.sin(t * 2 + i)));
  }
  // платформы
  for (const p of plats) {
    const px = Math.round(p.x - camX);
    for (let i = 0; i < p.w; i++) {
      const xx = px + i;
      if (xx < 0 || xx >= W) continue;
      put(xx, p.y, '▀', 1.0);
      for (let yy = p.y + 1; yy < Math.min(H, p.y + 3); yy++) put(xx, yy, '░', 0.3);
    }
  }
  // враги
  for (const e of enemies) {
    const ex = Math.round(e.x - camX);
    if (e.dead) { put(ex - 1, e.y, '▂▂▂', 0.5); continue; }
    put(ex - 1, e.y - 2, '╔М╗', 0.85);
    put(ex - 1, e.y - 1, e.dir > 0 ? '▐█▶' : '◀█▌', 0.7);
  }
  // гриб (2 ряда: шляпка + ножка)
  {
    const px = Math.round(player.x - camX), py = Math.round(player.y);
    put(px - 1, py - 2, '▟█▙', 1.25);
    put(px - 1, py - 1, ' ▌ ', 0.9);
  }
  // частицы
  for (const p of parts) {
    const px = Math.round(p.x - camX), py = Math.round(p.y);
    put(px, py, '✦', Math.min(1.2, p.l * 2.4));
  }
  // всплывающие очки
  for (const x of texts) put(Math.round(x.x - camX - x.txt.length / 2), Math.round(x.y), x.txt, 1.2);
  // HUD
  const hud = ' СЧЁТ ' + (score | 0) + '  РЕКОРД ' + best + (combo > 1 ? '  x' + combo + ' КОМБО' : '');
  put(1, 0, hud, 1.1);
  const zname = THEMES[theme][0];
  put(W - zname.length - 2, 0, zname, 0.6);
  if (quoteT > 0) put(((W - quote.length) / 2) | 0, 2, quote, 1.25);
  // экран смерти
  if (dead) {
    const s = score | 0;
    const lines = ['', '  R I P   Г Р И Б  ', '', ' ' + deadLine + ' ', '', ' СЧЁТ: ' + s + '   РЕКОРД: ' + best + ' ', '', ' SPACE/R — ЕЩЁ РАЗ   Q — ВЫХОД ', ''];
    const bw = Math.max(...lines.map(l => l.length)) + 2;
    const bx = ((W - bw) / 2) | 0, by = ((H - lines.length) / 2 - 1) | 0;
    lines.forEach((l, i) => {
      const pad = l + ' '.repeat(bw - l.length);
      put(bx, by + i, pad, i === 1 ? 1.3 : 0.9);
    });
    put(bx, by - 1, '█'.repeat(bw), 0.4);
    put(bx, by + lines.length, '█'.repeat(bw), 0.4);
  }
  // вывод: построчно, цвет меняем только при смене яркости
  const flash = flashT > 0;
  let buf = ESC + 'H';
  const bg = inv ? color(rgb, flash ? 1.2 : 0.9, true) : ESC + '48;2;8;8;12m';
  for (let y = 0; y < H; y++) {
    buf += ESC + (y + 1) + ';1H' + bg;
    let lastK = -1;
    for (let x = 0; x < W; x++) {
      let k = br[y][x];
      if (flash && k > 0) k = Math.min(1.3, k + 0.3);
      if (k !== lastK) {
        buf += inv ? ESC + '38;2;10;10;14m' : color(rgb, Math.max(k, 0.001));
        lastK = k;
      }
      buf += ch[y][x];
    }
  }
  out.write(buf);
}

// --- Ввод
const stdin = process.stdin;
stdin.setRawMode(true); stdin.resume(); stdin.setEncoding('utf8');
function quit() { out.write(ESC + '0m' + ESC + '2J' + ESC + 'H' + ESC + '?25h'); process.exit(0); }
stdin.on('data', k => {
  if (k === 'q' || k === 'Q' || k === '\x03') quit();
  if (k === ' ' || k === '\x1b[A' || k === 'w') { dead ? restart() : jump(); }
  if ((k === 'r' || k === 'R') && dead) restart();
});
function restart() { reset(); }

// --- Цикл
out.write(ESC + '?25l' + ESC + '2J');
process.on('exit', () => out.write(ESC + '0m' + ESC + '?25h'));
reset();
setInterval(() => { update(1 / FPS); render(); }, 1000 / FPS);
