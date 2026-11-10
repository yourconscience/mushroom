// --- Состояние ---
let running=false, gameOver=false;
let spar=null, sparWon=0, sparT=0, oneUp=0; // спарринг {kind,mini,i,name} или null; запас «вторая жизнь» новичка (0/1)
let player, plats, enemies, parts, pickups, camX, speed, score, combo, comboT, dist, zoneI, zoneN, lap, jetT, spT=0, hyT=0, mgT=0, fsT=0, noirTo=0, spCd=0, spores=[], wrenches=[], zTimer=0, sessBest={};
const G=2400, JUMP=-880, WG=1400;
// --- Боссы ---
// Ключ — индекс зоны (уровень-1). Перед боссом строится ровная арена без ям, зона и трек не меняются,
// пока босс жив (клип просто крутится по кругу). Босс на каждом 7-м уровне (индексы 6, 13, 20...):
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
let bossOrder=[], bossR=null, zoneIdx={};
function bossAt(z){
  if(z%7!==6)return null;
  const i=(z-6)/7;
  while(bossOrder.length<=i){ // Царь всегда последний в круге
    const bag=[0,1,2,3,4,5], R=bossR||(bossR=rngFor('boss'));
    for(let j=bag.length-1;j>0;j--){ const r=(R()*(j+1))|0; [bag[j],bag[r]]=[bag[r],bag[j]]; }
    bossOrder.push(...bag,6);
  }
  const k=bossOrder[i], d=BOSS_KINDS[k], c=bossOrder.slice(0,i).filter(x=>x===k).length;
  return c?{...d,name:d.name+' '+(ROMAN[c]||c+1)}:d;
}
let boss=null, arena=null, bossDone={}, bigGiven={};

function reset(){
  player={x:120,y:H*0.4,vx:0,vy:0,w:36,h:40,jumps:2,dead:false,squish:0,big:false,inv:0};
  plats=[]; enemies=[]; parts=[]; pickups=[]; texts=[]; camX=0; speed=230; score=0; combo=0; comboT=0; dist=0; zoneI=0; zoneN=0; lap=0; beatI=0; nextBeat=0; jetT=0; spT=0; hyT=0; mgT=0; fsT=0; noirTo=0; document.body.style.filter=baseFilter(); spCd=0; spores=[]; wrenches=[]; shakeT=0; shakeA=0; slotCharges=0; spinning=false; zTimer=0; slotBtn.textContent='🎰 КРУТИТЬ'; slotBtn.classList.add('hidden');
  boss=null; arena=null; bossDone={}; bigGiven={}; bossOrder=[]; miniPlan={}; miniBag=[]; miniBlk=1; oneUp=0; sparWon=0; clearTimeout(sparT); zoneIdx={}; bossR=null; miniR=null;
  const sl=spar?(spar.mini?3:6):charMode==='GNOY'?6:-1; // ГНОЙНЫЙ и спарринг: старт прямо на арене нужного уровня
  if(sl>=0){ dist=sl*ZONE_LEN+60; speed=420; zoneN=sl; zoneI=sl%ZONES.length; }
  if(spar){ if(spar.mini) miniPlan[3]=MINI_KINDS[spar.i]; else bossOrder=[spar.i]; } // полная форма мини-босса, один босс в круге
  // стартовая земля
  plats.push({x:-100,y:H*0.72,w:900});
  if(sl>=0){ arena=plats[0]; arena.w=1e7; arena.lvl=sl; } // старт прямо на арене
  else { let x=800; while(x<3000){ x=addPlat(x); } }
  gameOver=false;
  shufflePlaylist();
}
function addPlat(afterX){
  // забег дня: случайность по ключу (зона, номер платформы в зоне), скорость в зазоре тоже по зоне
  const z0=((dist+afterX-player.x)/ZONE_LEN)|0, R=rngFor('p',z0,zoneIdx[z0]=(zoneIdx[z0]||0)+1);
  const gap=60+R()*100+(daily?Math.min(560,230+z0*(z0<7?16:20)):speed)*0.08;
  const w=200+R()*260;
  const last=plats[plats.length-1];
  // арена босса: одна длинная ровная платформа без врагов и бонусов
  // pd, pz — путь и зона платформы в координатах dist: после боя с боссом они расходятся с мировым x
  const pd=dist+afterX+gap-player.x, pz=(pd/ZONE_LEN)|0, pzi=pz%ZONES.length;
  if((bossAt(pz)||miniAt(pz))&&!bossDone[pz]&&!arena&&!boss){
    const a={x:afterX+gap,y:Math.max(H*0.55,Math.min(H*0.74,last.y)),w:1e7,lvl:pz};
    plats.push(a); arena=a; return a.x+a.w;
  }
  let y=last.y+(R()*220-110);
  y=Math.max(H*0.35,Math.min(H*0.82,y));
  const p={x:afterX+gap,y,w};
  plats.push(p);
  // начало 3-й, 6-й и 9-й сцены: гриб всегда и без врага рядом (в нуар пропускаем)
  if((pz===2||pz===5||pz===8)&&!bigGiven[pz]&&!charMode&&pd>=noirTo){
    bigGiven[pz]=1; pickups.push({x:p.x+w*0.5,y:p.y-52,kind:'big',t:0});
    return p.x+w;
  }
  // враг
  if(R()<0.6+((pz/ZONES.length)|0)*0.05+(charMode==='MARIO'?0.2:0) && w>150){
    // X сразу встречает весь зоопарк врагов
    const types=charMode==='X'?['walk','slide','fly','hop','spike','thrower','dive']:charMode==='MARIO'?['hop','hop','dive']:ZONES[pzi].enemies.filter(t=>pz>=7||(t!=='hop'&&t!=='thrower')); // прыгуны и болтомёты только после 7-го уровня
    const type=types[(R()*types.length)|0];
    enemies.push({x:p.x+w*0.5,y:p.y,w:34,h:42,dir:R()<.5?-1:1,p,dead:0,t:R()*6,type,vy:0,baseY:p.y,cd:0.15+R()*0.3});
  }
  // бонус (Z и V не видят ничего, X — только деньги)
  if(charMode!=='Z'&&charMode!=='V'&&charMode!=='OKS'&&pd>=noirTo){ // нуар: бонусов нет до конца
    const roll=R(); let acc=0;
    for(const k in BONUSES){
      if(charMode==='X'&&k!=='loot')continue;
      if(k==='big'&&(player.big||pzi===0||charMode==='GLASS'||charMode==='EZ'))continue; // один уровень роста, не в первой зоне
      acc+=BONUSES[k].chance;
      if(roll<acc){ pickups.push({x:p.x+w*(0.2+R()*0.6),y:p.y-52,kind:k,t:R()*6}); break; }
    }
  }
  return p.x+w;
}
