// Зоны игры ГРИБ. Подключается из index.html перед основным скриптом.
// jingle: ноты входа [Гц, длительность]; loop: 8-шаговый рифф (0 = пауза);
// wave: тембр осциллятора зоны; bpm: темп рифф-лупа.
const ZONES=[
  {name:'ПАНЕЛЬКА', sub:'Хаски',
   sky:['#0d0d22','#1a1033','#2a1440'], plat:'#3dd13d', dirt:'#6b4226', dirt2:'#553319',
   build:'#171130', build2:'#241a3d', win:'#ffd166', moon:'#ffe9a8',
   enemies:['walk'], mult:1,
   wave:'square', bpm:100,
   jingle:[[330,.12],[392,.12],[494,.2]],
   loop:[131,0,165,0,131,0,196,165]},

  {name:'ТАЕТ ЛЁД', sub:'Грибы',
   sky:['#02101f','#06304a','#0a4a66'], plat:'#9fe8ff', dirt:'#23556b', dirt2:'#173b4d',
   build:'#0a2438', build2:'#143752', win:'#aef3ff', moon:'#dff6ff',
   enemies:['walk','slide'], mult:1.1,
   wave:'triangle', bpm:112,
   jingle:[[523,.1],[659,.1],[784,.1],[1047,.25]],
   loop:[262,330,392,330,262,330,392,523]},

  {name:'ЭТО ДЫМ', sub:'Скриптонит',
   sky:['#101410','#1d2a1d','#2c3a22'], plat:'#9fc463', dirt:'#3d4a2b', dirt2:'#2b351f',
   build:'#16201a', build2:'#22302a', win:'#c8ff8a', moon:'#e8ffcf',
   enemies:['walk','fly'], mult:1.2,
   wave:'sine', bpm:80,
   jingle:[[220,.25],[208,.25],[196,.4]],
   loop:[98,0,0,110,98,0,123,0]},

  {name:'ГОРОД ПОД ПОДОШВОЙ', sub:'Oxxxymiron',
   sky:['#141414','#262026','#3a2a2a'], plat:'#c0c0c8', dirt:'#4a4a55', dirt2:'#33333c',
   build:'#1e1e24', build2:'#2c2c34', win:'#ff5555', moon:'#e8e8f0',
   enemies:['walk','slide','fly'], mult:1.3,
   wave:'sawtooth', bpm:126,
   jingle:[[294,.1],[294,.1],[440,.2],[392,.2]],
   loop:[147,147,0,175,147,0,196,175]},

  {name:'РОЗОВОЕ ВИНО', sub:'Элджей & Feduk',
   sky:['#2a0a2e','#5c1050','#8a2a5e'], plat:'#ffb3da', dirt:'#6e2a52', dirt2:'#4d1d3a',
   build:'#3a1038', build2:'#55204e', win:'#ffd1e8', moon:'#ffb3da',
   enemies:['hop','fly'], mult:1.4,
   wave:'triangle', bpm:96,
   jingle:[[440,.15],[554,.15],[659,.3]],
   loop:[220,0,277,330,0,277,220,0]},

  {name:'GIMME THE LOOT', sub:'Big Baby Tape',
   sky:['#0a0a05','#1f1a08','#36300e'], plat:'#ffd700', dirt:'#5e4a14', dirt2:'#42350e',
   build:'#16140a', build2:'#262213', win:'#ffe97a', moon:'#ffd700',
   enemies:['slide','hop'], mult:1.5,
   wave:'square', bpm:140,
   jingle:[[392,.08],[392,.08],[392,.08],[622,.25]],
   loop:[196,196,0,233,196,233,0,311]},

  {name:'ПАНЕЛЬКА НА ЛУНЕ', sub:'Хаски x НАСА',
   sky:['#000008','#050518','#0a0a28'], plat:'#b8b8d8', dirt:'#3a3a5e', dirt2:'#28284a',
   build:'#0e0e20', build2:'#1a1a33', win:'#8af0ff', moon:'#ffffff',
   enemies:['walk','fly','hop'], mult:1.6,
   wave:'sine', bpm:90,
   jingle:[[523,.12],[440,.12],[349,.12],[262,.3]],
   loop:[131,0,262,0,196,0,330,262]},

  {name:'ВЕЧЕРИНКА У ДЕКСТЕРА', sub:'ЛСП x Oxxxymiron',
   sky:['#10001a','#33005c','#6a0a8a'], plat:'#5cff8a', dirt:'#3a1f5e', dirt2:'#281542',
   build:'#1c0a30', build2:'#2e1450', win:'#ff5cf0', moon:'#5cff8a',
   enemies:['slide','fly','hop'], mult:1.7,
   wave:'sawtooth', bpm:150,
   jingle:[[330,.07],[415,.07],[494,.07],[659,.07],[831,.2]],
   loop:[165,208,247,208,165,247,330,247]},
];
const ZONE_LEN=2400;
