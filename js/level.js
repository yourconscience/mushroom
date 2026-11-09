// --- Состояние ---
let running=false, gameOver=false;
let player, plats, enemies, parts, pickups, camX, speed, score, combo, comboT, dist, tQuote, zoneI, zoneN, lap, jetT, spT=0, hyT=0, mgT=0, fsT=0, noirTo=0, spCd=0, spores=[], wrenches=[], zTimer=0, sessBest={};
const G=2400, JUMP=-880, WG=1400;
// --- Боссы ---
// Ключ — индекс зоны (уровень-1). Перед боссом строится ровная арена без ям, зона и трек не меняются,
// пока босс жив (клип просто крутится по кругу). Босс на каждом 10-м уровне (индексы 9, 19, 29...):
// шесть в случайном порядке, потом Царь; повторы получают номер (II, III...).
const BOSS_KINDS=[
  {name:'ГЛАВНЫЙ САНТЕХНИК',kind:'plumber',hp:4},
  {name:'ГОЛУБИНЫЙ КОРОЛЬ', kind:'pigeon', hp:3},
  {name:'ДУТАЯ ФИГУРА',     kind:'balloon',hp:3},
  {name:'СТЕКЛЯННЫЙ ПЕТУХ', kind:'rooster',hp:3},
  {name:'ПОДЗЕМНЫЙ ЧЕРВЬ',  kind:'worm',   hp:4},
  {name:'ЛЕТАЮЩАЯ ТАРЕЛКА', kind:'ufo',    hp:3},
  {name:'ЦАРЬ ГРИБОВ',      kind:'king',   hp:5},
];
const ROMAN=['','II','III','IV','V'];
let bossOrder=[];
function bossAt(z){
  if(z%10!==9)return null;
  const i=(z-9)/10;
  while(bossOrder.length<=i){ // Царь всегда последний в круге
    const bag=[0,1,2,3,4,5];
    for(let j=bag.length-1;j>0;j--){ const r=(Math.random()*(j+1))|0; [bag[j],bag[r]]=[bag[r],bag[j]]; }
    bossOrder.push(...bag,6);
  }
  const k=bossOrder[i], d=BOSS_KINDS[k], c=bossOrder.slice(0,i).filter(x=>x===k).length;
  return c?{...d,name:d.name+' '+(ROMAN[c]||c+1)}:d;
}
let boss=null, arena=null, bossDone={}, bigGiven={};

function reset(){
  player={x:120,y:H*0.4,vx:0,vy:0,w:36,h:40,jumps:2,dead:false,squish:0,big:false,inv:0};
  plats=[]; enemies=[]; parts=[]; pickups=[]; texts=[]; camX=0; speed=230; score=0; combo=0; comboT=0; dist=0; tQuote=0; zoneI=0; zoneN=0; lap=0; beatI=0; nextBeat=0; jetT=0; spT=0; hyT=0; mgT=0; fsT=0; noirTo=0; document.body.style.filter=baseFilter(); spCd=0; spores=[]; wrenches=[]; shakeT=0; shakeA=0; slotCharges=0; spinning=false; zTimer=0; slotBtn.textContent='🎰 КРУТИТЬ'; slotBtn.classList.add('hidden');
  boss=null; arena=null; bossDone={}; bigGiven={}; bossOrder=[]; miniPlan={}; miniBag=[];
  if(charMode==='GNOY'){ dist=9*ZONE_LEN+60; speed=420; } // ГНОЙНЫЙ: сразу к первому боссу
  // стартовая земля
  plats.push({x:-100,y:H*0.72,w:900});
  if(charMode==='GNOY'){ arena=plats[0]; arena.w=1e7; arena.lvl=9; } // старт прямо на арене
  else { let x=800; while(x<3000){ x=addPlat(x); } }
  gameOver=false;
  shufflePlaylist();
}
// зона по мировой координате (dist == player.x-120)
function zoneAt(x){ return (((x-120)/ZONE_LEN)|0)%ZONES.length; }
function addPlat(afterX){
  const gap=60+Math.random()*100+speed*0.08;
  const w=200+Math.random()*260;
  const last=plats[plats.length-1];
  // арена босса: одна длинная ровная платформа без врагов и бонусов
  const pz=((dist+afterX+gap-player.x)/ZONE_LEN)|0;
  if((bossAt(pz)||miniAt(pz))&&!bossDone[pz]&&!arena&&!boss){
    const a={x:afterX+gap,y:Math.max(H*0.55,Math.min(H*0.74,last.y)),w:1e7,lvl:pz};
    plats.push(a); arena=a; return a.x+a.w;
  }
  let y=last.y+(Math.random()*220-110);
  y=Math.max(H*0.35,Math.min(H*0.82,y));
  const p={x:afterX+gap,y,w};
  plats.push(p);
  // начало 3-й, 6-й и 9-й сцены: гриб всегда и без врага рядом
  if((pz===2||pz===5||pz===8)&&!bigGiven[pz]&&!charMode){
    bigGiven[pz]=1; pickups.push({x:p.x+w*0.5,y:p.y-52,kind:'big',t:0});
    return p.x+w;
  }
  // враг
  if(Math.random()<0.45+lap*0.1+(charMode==='MARIO'?0.2:0) && w>150){
    // X сразу встречает весь зоопарк врагов
    const types=charMode==='X'?['walk','slide','fly','hop','spike','thrower','dive']:charMode==='MARIO'?['hop','hop','dive']:ZONES[zoneI].enemies.filter(t=>pz>=10||(t!=='hop'&&t!=='thrower')); // прыгуны и болтомёты только после 10-го уровня
    const type=types[(Math.random()*types.length)|0];
    enemies.push({x:p.x+w*0.5,y:p.y,w:34,h:42,dir:Math.random()<.5?-1:1,p,dead:0,t:Math.random()*6,type,vy:0,baseY:p.y,cd:0.15+Math.random()*0.3});
  }
  // бонус (Z и V не видят ничего, X — только деньги)
  if(charMode!=='Z'&&charMode!=='V'&&charMode!=='OKS'&&p.x-120>=noirTo){ // нуар: бонусов нет до конца
    const roll=Math.random(); let acc=0;
    for(const k in BONUSES){
      if(charMode==='X'&&k!=='loot')continue;
      if(k==='big'&&(player.big||zoneAt(p.x)===0||charMode==='GLASS'||charMode==='EZ'))continue; // один уровень роста, не в первой зоне
      acc+=BONUSES[k].chance;
      if(roll<acc){ pickups.push({x:p.x+w*(0.2+Math.random()*0.6),y:p.y-52,kind:k,t:Math.random()*6}); break; }
    }
  }
  return p.x+w;
}
