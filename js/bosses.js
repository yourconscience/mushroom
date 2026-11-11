// --- Боссы ---
// Общее для всех: позиция босса в координатах экрана (sx), гриб всегда на psx, потому что камера едет вместе с ним.
// Бить можно, только когда b.vuln (босс ползёт, катится или бежит на гриб по земле): прыгни сверху.
// Касание сбоку — удар по грибу. Пока босс жив, зона стоит, а трек крутится по кругу.
const BOSS_SIZE={plumber:[34,96],pigeon:[44,62],balloon:[46,92],rooster:[36,92],worm:[30,56],ufo:[58,34],king:[42,96]}; // полуширина и рост
const BOSS_TIP={
  plumber:'ПРЫГАЙ НА ГОЛОВУ, КОГДА ОН ПРЁТ ⭐',
  pigeon:'ЯЙЦА СКАЧУТ: ПОД ВЫСОКОЙ ДУГОЙ СТОЙ, НИЗКОЕ КАСАНИЕ ПЕРЕПРЫГНИ; ТОПНИ ЗОЛОТОЕ ⭐',
  balloon:'МЯЧ СКАЧЕТ К ТЕБЕ: НЕ СТОЙ, ГДЕ ТЕНЬ ПРИЗЕМЛИТСЯ; ПРОБЕЙ СНИЗУ В ПРЫЖКЕ ⭐',
  rooster:'ЗАПОМНИ НОТЫ И НЕ ПОПАДИСЬ: ЧИСТАЯ ПЕСНЯ — И ОН ТРЕСНЕТ ⭐',
  worm:'БУГОР ДОШЁЛ — БУДЬ В ВОЗДУХЕ; БЕЙ ГОЛОВУ СО ЗВЁЗДАМИ, КОЛЮЧАЯ ЖАЛИТ ⭐',
  ufo:'ДИСКИ: НИЗКИЙ — ПРЫГАЙ, ВЫСОКИЙ — СТОЙ. МЕТКА ЗАСТЫЛА — ПРЫГАЙ. ЗОЛОТОЙ ДИСК ПОДБРОСИТ НА ТАРЕЛКУ ⭐',
  king:'СЕЛ И ПОЛЗЁТ — БЕЙ В ШЛЯПКУ; В БРОНЕ — СНАЧАЛА РАЗДАВИ СОЛДАТА ⭐',
};
function startBoss(){
  const d=bossAt(arena.lvl)||miniAt(arena.lvl), sz=BOSS_SIZE[d.kind];
  boss={easy:d.easy||0,mini:!!d.mini,lvl:arena.lvl,kind:d.kind,name:d.name,hp:d.hp,max:d.hp,hw:sz[0],hh:sz[1],gy:arena.y,sx:W+80,y:d.kind==='plumber'||d.kind==='rooster'?-200:H*0.1,
        vy:0,vsx:0,st:'enter',t:0,n:0,hitT:0,rot:0,scale:1,alpha:1,waves:[],obs:[],vuln:false,solid:false};
  boss.x=camX+boss.sx;
  enemies=enemies.filter(e=>e.x<player.x-40);
  showQuote((d.mini?'МИНИ-БОСС: ':'БОСС: ')+boss.name,true); if(d.line) showQuote(d.line,false); shake(10,.4); beep(110,.5,'sawtooth',.15); setTimeout(()=>beep(82,.6,'sawtooth',.15),250);
  const lvl=boss.lvl; setTimeout(()=>{ if(boss&&boss.lvl===lvl&&boss.hp===boss.max) showQuote(BOSS_TIP[boss.kind],false); },d.easy?0:1800); // у лёгкого мини-босса подсказка сразу
  metaEvent(d.mini?'mini':'boss',d.kind);
  vsCard(boss.name,d.mini); airhorn();
}
const rand=(a,b)=>a+Math.random()*(b-a), randi=(a,b)=>a+((Math.random()*(b-a+1))|0), chance=p=>Math.random()<p; // разброс поведения
// Рывок на гриб: своя скорость и иногда заминка, но только издалека: заминка рядом ловит того, кто уже прыгнул.
function rushStart(b,v,psx){ b.v=v*rand(.9,1.12); b.fx=psx+rand(270,340); b.fk=b.sx>b.fx+20&&chance(.28); b.hold=0; }
function bossRush(b,dt){ if(b.hold>0){ b.hold-=dt; return; } if(b.fk&&b.sx<b.fx){ b.fk=false; b.hold=rand(.25,.5); return; } b.sx-=b.v*dt; }
function bossGap(rage){ return 0.9-rage*0.07; } // пауза между ключами: дольше прыжка (0.73 с)
function bossThrow(b){
  const tdx=Math.max(120,b.x-player.x), T=0.55+tdx/1600, x0=b.x-24, y0=b.y-b.hh*0.8;
  const tx=player.x+speed*T+(Math.random()-.5)*40, ty=b.gy-20;
  wrenches.push({x:x0,y:y0,vx:(tx-x0)/T,vy:(ty-y0-0.5*WG*T*T)/T,r:0,l:4});
  beep(420,.06,'triangle');
}
function obsAhead(){ return boss.obs.some(o=>o.x>player.x-20); }
function bossKill(b){
  b.st='dead'; b.t=0; b.vsx=520; b.vy=-900; b.waves=[]; b.obs=[]; b.frz=0;
  score+=b.mini?(b.easy?750:1500):5000; confetti(b.mini?30:90); shake(18,.6);
  if(b.kind==='rooster') for(let i=0;i<40;i++) parts.push({x:b.x,y:b.y-b.hh/2,vx:(Math.random()-.5)*900,vy:-Math.random()*700,l:1,c:Math.random()<.5?'#bfefff':'#ffffff'});
  if(b.kind==='balloon') beep(160,.8,'sawtooth',.14);
  for(let i=0;i<3;i++) setTimeout(()=>firework(camX+W*(0.3+Math.random()*0.5),H*(0.2+Math.random()*0.3)),i*220);
  showQuote(b.mini?(b.easy?'МИНИ-БОСС СЛИТ +750 🎤':'МИНИ-БОСС СЛИТ +1500 🎤'):'БОСС ПОВЕРЖЕН +5000 🏆',true);
  stamp(BOSS_KO[(Math.random()*BOSS_KO.length)|0]); airhorn(); emojiRain(['🎤','🔥','🍄','💿'],b.mini?14:30);
  bossDone[b.lvl]=true;
  if(!b.mini) metaEvent('beat',b.kind); else metaEvent('minibeat',b.kind);
  if(b.mini&&!spar) pickups.push({x:player.x+300,y:b.gy-52,kind:'life',t:0}); // мини-босс всегда роняет 1UP впереди гриба; арена режется до камеры+1.6W, 300 впереди остаётся
  if(spar){ sparWon=1; sparT=setTimeout(()=>{ if(spar) overCard(); },2500); } // спарринг: через 2.5 с карточка
  if(arena){ // обрезаем арену и убираем всё, что генератор успел поставить за ней
    arena.w=Math.max(200,camX+W*1.6-arena.x); const end=arena.x+arena.w;
    plats=plats.filter(p=>p.x<end); enemies=enemies.filter(e=>e.x<end); pickups=pickups.filter(b=>b.x<end);
    arena=null;
  }
  if(!b.mini) dist=(zoneN+1)*ZONE_LEN+1; // следующий уровень и новый трек начинаются сразу; мини-босс зону не сбрасывает
}
// №1 ГЛАВНЫЙ САНТЕХНИК: ключи → (после первого тычка прыжок с волной) → устал и прёт на гриб
function plumberRound(b,rage){ b.st='throw'; b.t=0; b.n=0; b.cnt=randi(1,2+(rage>=2?1:0)); b.gap=rand(bossGap(rage),bossGap(rage)+.5); b.ax=rand(.66,.82); }
function updPlumber(b,dt,psx,gy,rage){
  const anchor=W*(b.ax||.72);
  switch(b.st){
    case 'enter':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(12,.3); plumberRound(b,rage); }
      break;
    case 'throw':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*4); b.y=gy;
      b.wind=b.t>b.gap-0.35; // замах: ключ над головой
      if(b.t>b.gap){ b.t=0; b.n++; b.gap=rand(bossGap(rage),bossGap(rage)+.5); bossThrow(b);
        if(b.n>=b.cnt){ b.n=0; b.t=0; if(rage>0&&chance(.65)){ b.st='leap'; b.vy=-1250; b.lx=b.sx; b.tx=psx+rand(270,410); } else { b.st='charge'; rushStart(b,250+rage*40,psx); } } }
      break;
    case 'leap':
      b.vy+=G*dt; b.y+=b.vy*dt; b.sx=b.lx+(b.tx-b.lx)*Math.min(1,b.t/0.9);
      if(b.y>=gy&&b.vy>0){ b.y=gy; b.vy=0; b.st='slam'; b.t=0; shake(16,.4); beep(70,.35,'square',.2);
        b.waves.push({sx:b.sx-b.hw,d:-1},{sx:b.sx+b.hw,d:1}); }
      break;
    case 'slam': b.y=gy; if(b.t>1.1){ b.st='charge'; b.t=0; rushStart(b,250+rage*40,psx); } break; // сначала волна, потом рывок
    case 'charge':
      b.y=gy; bossRush(b,dt);
      if(b.sx<-120){ b.st='back'; b.t=0; b.sx=W+100; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; }
      if(b.t>0.8){ b.st='back'; b.t=0; }
      break;
    case 'back':
      b.y=gy; b.sx+=(anchor-b.sx)*Math.min(1,dt*3);
      if(Math.abs(anchor-b.sx)<10) plumberRound(b,rage);
      break;
  }
  b.vuln=b.st==='charge'; b.solid=b.st!=='enter'&&b.st!=='leap';
}
// №2 ГОЛУБИНЫЙ КОРОЛЬ: сам недосягаем. Несёт яйца, они скачут по земле к грибу:
// под высокой дугой стой, низкое касание перепрыгни. Последнее яйцо золотое и тоже скачет —
// топни его, и оно полетит обратно в голубя. Пропустил — пикирует и проносится по земле, это надо перепрыгнуть.
const PIGEON_EGGS={ hi:{a:170,bv:850,r:13}, mid:{a:240,bv:700,r:13}, lo:{a:380,bv:490,r:13} }; // a — скорость подхода по экрану, bv — скорость отскока (дуга bv²/2G)
function pigeonRound(b,rage){
  b.st='hover'; b.t=0; b.n=0; b.gap=rand(.8,1.1); b.ao=rand(0,60);
  b.eggs=rage===0?[]:rage===1?['mid']:['mid','lo']; // незолотые яйца; золотое — всегда последнее
}
function pigeonEgg(b,psx,gy,prof,gold){
  const a=prof.a, bv=prof.bv, r=prof.r, sx=b.sx-b.hw, sy=b.y;
  const dropH=Math.max(40,sy-(gy-r)), T=Math.sqrt(2*dropH/G), mark=camX+sx-a*T; // первая точка касания земли
  b.obs.push({x:camX+sx,y:sy,vx:speed-a,vy:0,r,bv,bounced:0,mark,kind:'egg',grav:1,act:gold?'kick':null,
              stopAt:gold?(psx+34):null,sit:gold?1.5:0});
  beep(gold?880:520,.06,'triangle');
}
function updPigeon(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.7,psx+560)+(b.ao||0), ay=Math.max(110,gy-300);
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>1.2) pigeonRound(b,rage); break;
    case 'hover':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*3)*14;
      if(b.t>b.gap){ b.t=0; b.n++; const gold=b.n>b.eggs.length;
        const prof=PIGEON_EGGS[gold?'hi':b.eggs[b.n-1]];
        pigeonEgg(b,psx,gy,prof,gold);
        b.gap=gold?rand(1.5,1.9):rand(.8,1.15)-rage*.04; // золотое с паузой, чтобы успеть приземлиться
        if(gold){ b.n=0; b.st='wait'; b.t=0; b.dv=chance(.7); b.tx=psx+rand(270,400); } }
      break;
    case 'wait': // ждёт, пока все яйца позади; золотое топнули — новый круг, пропустил — пикирует
      b.sx+=(ax+40-b.sx)*Math.min(1,dt*3); b.y+=(ay-30-b.y)*Math.min(1,dt*3);
      if(b.t>0.7&&!obsAhead()){ if(b.dv){ b.st='dive'; b.t=0; b.lx=b.sx; b.ly=b.y; b.dd=rand(.38,.55); b.sp=rand(.85,1.15); beep(1400,.15,'square',.06); } else pigeonRound(b,rage); }
      break;
    case 'dive':{ const k=Math.min(1,b.t/b.dd); b.sx=b.lx+(b.tx-b.lx)*k; b.y=b.ly+(gy-b.ly)*k*k;
      if(k>=1){ b.y=gy; b.st='stuck'; b.t=0; shake(14,.35); beep(80,.3,'square',.2);
        for(let i=0;i<10;i++) parts.push({x:b.x,y:gy,vx:(Math.random()-.5)*300,vy:-Math.random()*300,l:.5,c:'#8a6a4a'}); }
      break; }
    case 'stuck': b.y=gy; b.sx-=(420+rage*30)*b.sp*dt; if(b.sx<psx-110){ b.st='rise'; b.t=0; } break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.7) pigeonRound(b,rage); break;
  }
  b.vuln=false; b.solid=b.st==='stuck';
}
// №3 ДУТАЯ ФИГУРА: теперь он сам — мяч. Скачет по арене к грибу, как пляжный мяч: тень на земле показывает, где приземлится.
// Под высокой дугой пробеги, не стой, где приземлится; бей снизу макушкой в прыжке. Каждый тычок сдувает его (меньше, ниже, чаще),
// со второго тычка приземление бьёт коротким кольцом по земле — перепрыгни.
function balloonRound(b,rage){ b.st='bounce'; b.t=0; b.vy=0; }
function updBalloon(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.7,psx+560), ay=gy-H*0.26;
  const approach=170+rage*50, GB=800, apex=150-rage*25, bv=Math.sqrt(2*GB*apex), spacing=approach*2*bv/GB;
  b.approach=approach; b.bv=bv; b.gb=GB; // для предсказания в боте
  b.below=true;
  const launch=()=>{ // вершина дуги — ровно над грибом: бей снизу в прыжке, когда он плывёт над тобой
    b.st='bounce'; b.t=0; b.y=gy-apex; b.vy=0;
    const k=Math.max(1,Math.round((ax-psx)/spacing)); b.sx=psx+k*spacing;
  };
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2); b.y+=(ay-b.y)*Math.min(1,dt*2); if(b.t>1.3) launch(); break;
    case 'bounce':
      b.sx-=approach*dt; b.vy+=GB*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=-bv; shake(6,.15); beep(120,.12,'sawtooth',.06);
        if(rage>=1){ const x0=b.sx-b.hw*b.scale, x1=b.sx+b.hw*b.scale; b.waves.push({sx:x0,d:-1,span:60,d0:x0},{sx:x1,d:1,span:60,d0:x1}); } }
      if(b.sx<psx-140){ b.st='reset'; b.t=0; }
      break;
    case 'reset': b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>0.6) launch(); break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='reset'; b.t=0; } break;
  }
  b.vuln=false; b.solid=b.st==='bounce'||b.st==='reset';
}
// №4 СТЕКЛЯННЫЙ ПЕТУХ: его не бьют. Песня: сначала ноты над головой (низкая/высокая/осколок) не меньше 1.2 с,
// потом на ровном бите (клюёт на каждый). Серия без единого удара по грибу — трещина. Каждая трещина добавляет ноту
// и ускоряет бит ~12%; со второй трещины одна нота спрятана до вылета. Он не бежит на гриб.
function roosterRound(b,rage){
  b.st='show'; b.t=0; b.n=0; b.touched=0; b.beat=1.0*Math.pow(0.88,rage);
  b.list=[];
  for(let i=0;i<4+rage;i++){ // не больше двух прыжковых нот подряд: иначе не увернуться
    let k; do { const r=Math.random(); k=r<0.4?'L':r<0.7?'H':'s'; }
    while(i>=2&&k!=='H'&&b.list[i-1]!=='H'&&b.list[i-2]!=='H');
    b.list.push(k);
  }
  b.hide=rage>=2?randi(0,b.list.length-1):-1;
}
function roosterNote(b,gy,k){
  if(k==='s'){ b.obs.push({x:b.x-b.hw,y:gy-9,vx:speed-400,vy:0,r:10,kind:'shard'}); beep(1300,.04,'square',.06); }
  else { const low=k==='L'; b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-360,vy:0,r:low?15:17,kind:low?'ringL':'ringH'}); beep(low?700:1000,.1,'triangle',.1); }
}
function updRooster(b,dt,psx,gy,rage){
  const anchor=Math.min(W*0.72,psx+560), list=b.list;
  switch(b.st){
    case 'enter':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(12,.3); roosterRound(b,rage); }
      break;
    case 'show':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.y=gy;
      if(b.t>1.2){ b.st='play'; b.t=0; }
      break;
    case 'play':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.y=gy;
      if(b.t>b.beat){ b.t=0; roosterNote(b,gy,list[b.n++]);
        if(b.n>=list.length){ b.n=0; b.st='wait'; b.t=0; } }
      break;
    case 'wait':
      b.y=gy;
      if(b.t>0.5&&!obsAhead()){
        if(b.touched){ b.st='back'; b.t=0; showQuote('СЕРИЯ НЕ В СЧЁТ, ЕЩЁ РАЗ 🐓',false); }
        else { for(let i=0;i<14;i++) parts.push({x:b.x,y:gy-b.hh+20,vx:(Math.random()-.5)*500,vy:-Math.random()*400,l:.6,c:'#bfefff'}); bossHit(b,gy-b.hh); }
      }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; }
      if(b.t>0.8){ b.st='back'; b.t=0; }
      break;
    case 'back': b.y=gy; b.sx+=(anchor-b.sx)*Math.min(1,dt*3); if(Math.abs(anchor-b.sx)<10) roosterRound(b,rage); break;
  }
  b.vuln=false; b.solid=false;
}
// №5 ПОДЗЕМНЫЙ ЧЕРВЬ: бугор идёт к грибу — будь в воздухе, когда дойдёт. Потом вылезают головы: настоящая со звёздами
// и колючая, что жалит. Эскалация детерминирована: 0 тычков — один бугор, 1 — два через 0.9 с, 2 — три (средний быстрее), 3 — две колючие.
function wormDig(b,rage){ b.dug=0; b.moundN=0; b.mounds=1+Math.min(rage,2); b.st='dig'; b.t=0; }
function updWorm(b,dt,psx,gy,rage){
  const v=155; // скорость головы постоянна — тычок предсказуем
  switch(b.st){
    case 'enter':
      b.sx+=(W*0.7-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(10,.25); wormDig(b,rage); }
      break;
    case 'dig':{
      if(!b.dug){ b.dug=1; b.sx=psx+Math.min(W*0.85,480); b.ph=Math.random()*6;
        const D=Math.min(W*0.85,480), mid=b.mounds===3&&b.moundN===1; // средний из трёх — быстрее
        b.mv=D/(mid?0.62:0.9); b.fr=(mid?6.5:4)+Math.random()*2; }
      b.y=gy+b.hh+14; b.sx-=b.mv*dt;
      if(Math.random()<dt*22) parts.push({x:camX+b.sx+(Math.random()-.5)*36,y:gy-2,vx:(Math.random()-.5)*120,vy:-80-Math.random()*120,l:.5,c:'#8a6a4a'});
      if(b.sx>psx-6&&b.sx<psx+18&&player.vy===0) hit();
      if(b.sx<psx-60){ b.dug=0; b.moundN++;
        if(b.moundN<b.mounds){ b.t=0; break; } // ещё бугор
        b.st='rise'; b.t=0; beep(130,.22,'sawtooth',.1);
        b.sx=psx+rand(150,190); // настоящая голова всегда ближе всех — успеваешь топнуть
        const decN=rage>=3?2:1;
        for(let i=0;i<decN;i++) b.obs.push({x:camX+psx+rand(330,380)+i*120,y:gy-22,vx:speed-400,vy:0,r:20,kind:'decoy'}); } // колючая пролетает быстро
      break; }
    case 'rise':
      b.sx-=v*dt; b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(Math.abs(gy-b.y)<3){ b.y=gy; b.st='surface'; b.t=0; b.sd=rand(2.2,3.2); shake(11,.28); beep(90,.2,'square',.12); }
      break;
    case 'surface':
      b.sx-=v*dt;
      if(b.t>b.sd||b.sx<psx-110) wormDig(b,rage);
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(b.t>.7) wormDig(b,rage);
      break;
  }
  b.vuln=b.st==='surface'||b.st==='rise'; b.solid=b.vuln;
}
// №6 ЛЕТАЮЩАЯ ТАРЕЛКА: до неё не допрыгнуть. Каждый приём проходится одним прыжком или стоянием на земле, знак виден за 0.6 с и больше:
// диски летят по одному на двух высотах (низкий — прыгай, высокий — стой), промежуток между ними дольше прыжка;
// луч: метка мигает 3 раза и застывает, ЗАМИРАНИЕ — сигнал: прыжок по нему (с реакцией 0.15 с) или чуть раньше накрывает вспышку; потом катится золотой диск:
// прыгни на него, он подбросит вверх, и тарелка окажется под ногами.
function ufoRound(b,rage){ b.st='hover'; b.t=0; b.n=0; b.cnt=randi(1,2+rage); b.gap=rand(1.1,1.4); }
function updUfo(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.68,psx+560), ay=Math.max(96,gy-300);
  switch(b.st){
    case 'enter':
      b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5);
      if(b.t>1.1) ufoRound(b,rage);
      break;
    case 'hover':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*2.6)*18; // по горизонтали стоит: диски вылетают из одной точки с одной скоростью, интервал на подходе не плывёт
      if(b.t>b.gap){ b.t=0; b.n++; b.gap=rand(1.1,1.5)-rage*.05; // не короче 1.05 с: прыжок 0.73 с и запас на реакцию
        const low=chance(.55);
        b.obs.push({x:camX+ax-b.hw,y:low?gy-20:gy-100,vx:speed-(300+rage*20),vy:0,r:low?15:17,kind:low?'ringL':'ringH'}); beep(low?660:990,.08,'sine',.1);
        if(b.n>=b.cnt){ b.n=0; b.st='wait'; b.t=0; } }
      break;
    case 'wait': // последний диск прошёл мимо гриба
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*2.6)*18;
      if(b.t>.5&&!obsAhead()){ b.st='mark'; b.t=0; b.mk=0; b.beamX=psx; b.M=1-rage*.05; b.liveAt=b.M+.26; b.liveEnd=b.M+.36; } // метка 1.0 с (не меньше 0.9); вспышка через 0.26 с после замирания и на 0.1 с: прыжок от замирания (реакция до 0.26 с) или на 0.35 с раньше накрывает её
      break;
    case 'mark': // метка на земле под грибом: три мига, на третьем замирает; вспышка жжёт землю, увернуться можно только прыжком
      b.sx+=(psx-b.sx)*Math.min(1,dt*6); b.y+=(ay-20-b.y)*Math.min(1,dt*3); b.beamX=psx;
      if(b.mk<3&&b.t>=b.M-.6+b.mk*.3){ b.mk++; beep(b.mk<3?700:1300,b.mk<3?.08:.25,'square',b.mk<3?.1:.16); if(b.mk===3) shake(5,.12); } // третий миг и есть замирание: громче и с толчком
      if(b.t>b.liveAt&&b.t<b.liveEnd&&player.vy===0) hit();
      if(b.t>b.liveAt&&!b.fired){ b.fired=1; beep(300,.4,'sawtooth',.12); }
      if(b.t>b.liveEnd+.15){ b.fired=0; b.st='plate'; b.t=0; beep(880,.12,'triangle',.1);
        b.obs.push({x:camX+psx+Math.min(W*0.8,520)*rand(.7,1),y:gy-16,vx:speed-rand(220,300),vy:0,r:20,kind:'plate',act:'tramp'}); }
      break;
    case 'plate': // катится золотой диск; пропустил — всё сначала
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*3);
      if(!b.obs.some(o=>o.act)) ufoRound(b,rage);
      break;
    case 'stun': b.sx+=(psx+20-b.sx)*Math.min(1,dt*6); b.y=ay; if(b.t>1.7){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>0.8) ufoRound(b,rage); break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3);
      if(b.t>.8) ufoRound(b,rage);
      break;
  }
  b.vuln=b.st==='stun'; b.solid=b.st==='stun'&&player.vy>0;
}
// №7 ЦАРЬ ГРИБОВ: прыгает и бьёт волнами, сыплет спорами, телепортируется к грибу.
// Уязвим, когда сел после прыжка и ползёт на гриб. С третьего тычка в броне: сначала раздави солдата, которого он позвал.
function kingStomp(b,rage){ b.st='stomp'; b.t=0; b.gap=rand(.6,1.25)-rage*.05; }
function updKing(b,dt,psx,gy,rage){
  if(rage>=2&&b.armorFor!==b.hp){ b.armorFor=b.hp; b.armor=1; }
  switch(b.st){
    case 'enter':
      b.sx+=(W*0.7-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(14,.35); kingStomp(b,rage); }
      break;
    case 'stomp':
      b.y=gy; b.sx+=(psx+320-b.sx)*Math.min(1,dt*2.5);
      if(b.t>b.gap){ const r=Math.random(); b.t=0;
        if(b.armor&&r<.45) b.st='vanish'; // броню снимает только солдат, а зовёт он их после телепорта
        else if(r<.72){ b.st='jump'; b.vy=(-1150-rage*40)*rand(.92,1.08); b.jx=rand(150,240); }
        else if(r<.87){ b.st='charge'; rushStart(b,270+rage*40,psx); }
        else b.st='vanish'; }
      break;
    case 'jump':
      b.vy+=G*dt; b.y+=b.vy*dt; b.sx+=(psx+b.jx-b.sx)*Math.min(1,dt*1.2);
      if(b.y>=gy&&b.vy>0){ b.y=gy; b.vy=0; b.st='land'; b.t=0; b.v=240*rand(.85,1.2); shake(18,.45); beep(60,.4,'square',.22);
        b.waves.push({sx:b.sx-b.hw,d:-1},{sx:b.sx+b.hw,d:1});
        for(let i=0,c=randi(1,3);i<c;i++) b.obs.push({x:b.x+280+Math.random()*320,y:b.y-120,vy:-200-Math.random()*220,vx:(Math.random()-.5)*120,r:12,kind:'egg',grav:1}); }
      break;
    case 'land': // сел и ползёт на гриб: прыжок через волну как раз приходится на шляпку
      b.y=gy; b.sx-=b.v*dt;
      if(b.sx<psx-110){ b.st='vanish'; b.t=0; }
      break;
    case 'summon':
      b.y=gy;
      if(b.t>0.5&&!b.sdid){ b.sdid=1;
        for(let i=0;i<2;i++) spawnMinion(b.x+160+i*150,gy,arena); // впереди царя, чтобы успеть прицелиться
        showQuote('ЦАРЬ В БРОНЕ: РАЗДАВИ СОЛДАТА 🛡',false); beep(300,.2,'triangle',.1); }
      if(b.t>1.3){ b.st='charge'; b.t=0; rushStart(b,270+rage*40,psx); }
      break;
    case 'vanish':
      b.y=gy; b.alpha=Math.max(0,1-b.t*3);
      if(b.t>0.5){ b.sx=psx+rand(220,320); b.st='appear'; b.t=0; beep(1500,.12,'square',.05); }
      break;
    case 'appear':
      b.y=gy; b.alpha=Math.min(1,b.t*4);
      if(b.t>0.35){ b.alpha=1; b.t=0; if(b.armor) b.st='summon'; else { b.st='charge'; rushStart(b,270+rage*40,psx); } }
      break;
    case 'charge':
      b.y=gy; bossRush(b,dt);
      if(b.sx<psx-120){ kingStomp(b,rage); b.sx=W+80; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(gy-b.y)*Math.min(1,dt*4);
      if(b.t>.7){ b.st='vanish'; b.t=0; } // после тычка весь круг заново, а не цепочка ударов
      break;
    case 'rise': b.y=gy; b.sx+=(psx+320-b.sx)*Math.min(1,dt*3); if(b.t>.7) kingStomp(b,rage); break;
  }
  if(b.st!=='summon') b.sdid=0;
  b.vuln=b.st==='land'&&!b.armor;
  b.solid=b.st!=='enter'&&b.st!=='vanish'&&b.st!=='rise';
}
function spawnMinion(x,y,p){
  enemies.push({x,y,w:34,h:42,dir:Math.random()<.5?-1:1,p,dead:0,t:Math.random()*6,type:'walk',vy:0,baseY:y,cd:0.2,royal:1});
}
const BOSS_UPD={plumber:updPlumber,pigeon:updPigeon,balloon:updBalloon,rooster:updRooster,worm:updWorm,ufo:updUfo,king:updKing};
function updBoss(dt,onGround){
  const b=boss, psx=player.x-camX, gy=b.gy, rage=b.max-b.hp;
  if(b.frz>0) b.frz-=dt; else b.t+=dt; // молния: босс замер, его таймеры стоят
  b.hitT=Math.max(0,b.hitT-dt);
  if(b.st==='dead'){ b.sx+=b.vsx*dt; b.vy+=G*0.55*dt; b.y+=b.vy*dt; b.rot+=dt*9; b.x=camX+b.sx; if(b.t>2.2) boss=null; return; }
  if(!(b.frz>0)) BOSS_UPD[b.kind](b,dt,psx,gy,rage);
  b.x=camX+b.sx;
  // ударная волна по земле: перепрыгни
  for(const w of b.waves){ w.sx+=w.d*(430+rage*25)*(b.easy?.8:1)*dt;
    if(w.span&&Math.abs(w.sx-w.d0)>w.span){ w.dead=1; continue; }
    if(!player.dead&&ghostT<=0&&onGround&&Math.abs(w.sx-psx)<16){ w.dead=1; hit(); } } // призрак: волны проходят; звезда: hit() ничего не делает, волна гаснет
  b.waves=b.waves.filter(w=>!w.dead&&w.sx>-60&&w.sx<W+60);
  // снаряды: яйца падают и лежат, пузыри и осколки летят на гриб
  const psc=player.big?1.35:1;
  for(const o of b.obs){
    if(o.grav){ o.vy+=G*dt; o.y+=o.vy*dt; if(o.y>=gy-o.r){ o.y=gy-o.r; if(o.bv){ o.vy=-o.bv; o.bounced=(o.bounced||0)+1; } else { o.vy=0; o.grav=0; } } }
    else o.y+=(o.vy||0)*dt;
    o.x+=o.vx*dt;
    if(o.stopAt!=null&&o.x-camX<o.stopAt){ // золотое яйцо: замирает у гриба, потом скатывается, если не топнули
      if(o.sit>0){ o.sit-=dt; o.bv=0; o.vx=speed; if(o.sit<=0){ o.vx=speed-360; o.sit=-1; } }
    }
    if(o.act){ // золотое: прыгни сверху
      if(!player.dead&&ghostT<=0&&player.vy>40&&Math.abs(player.x-o.x)<o.r+26*psc&&player.y>o.y-o.r-36&&player.y<=o.y+o.r+4){ o.dead=1; bossAct(b,o); }
      continue;
    }
    if(!player.dead&&player.inv<=0&&ghostT<=0&&Math.abs(player.x-o.x)<o.r+12*psc&&Math.abs(player.y-20*psc-o.y)<o.r+18*psc){ o.dead=1; hit(); }
  }
  b.obs=b.obs.filter(o=>!o.dead&&o.x>camX-80&&o.x<camX+W+600);
  // контакт с самим боссом
  if(player.dead||!b.solid||ghostT>0)return; // призрак проходит сквозь босса, без тычков
  const hh=b.hh*b.scale, top=b.y-hh, dx=Math.abs(player.x-b.x);
  if(b.mini){ // телом не бьёт, поэтому окно для тычка широкое
    if(player.vy>0&&dx<b.hw+34*psc&&player.y>top-10&&player.y<top+hh*.7){ player.vy=JUMP*0.78; player.jumps=maxJumps(); bossHit(b,top); }
    return;
  }
  if(b.below){ // бьётся снизу макушкой; приземление на гриб или касание стоя/падая — удар по грибу
    if(player.vy<0&&dx<b.hw*b.scale+16*psc&&player.y-40*psc<b.y+10&&player.y-40*psc>top){ player.vy=120; bossHit(b,b.y); }
    else if(player.vy>=0&&dx<b.hw*b.scale+20*psc&&player.y-40*psc<b.y+6&&player.y>top-8){ hit(); }
    return;
  }
  if(dx<b.hw*b.scale+20*psc&&player.y>top-4&&player.y-40*psc<b.y){
    if(player.vy>60&&player.y<top+30){
      player.vy=JUMP*0.78; player.jumps=maxJumps(); player.y=Math.min(player.y,top-5); // выталкиваем, иначе следующий кадр считает боковым касанием
      if(b.vuln) bossHit(b,top); else beep(900,.05,'square',.08); // не время: дзынь
    } else if(b.st!=='hurt'&&starT<=0){ hit(); b.st=(b.kind==='plumber'||b.kind==='rooster')?'back':b.kind==='worm'?'dig':'rise'; b.t=0; }
  }
}
// молния в бою: атаки гаснут, босс стоит 2.5 с (уязвимый остаётся уязвимым)
function zapBoss(){
  if(!boss||boss.st==='dead')return;
  boss.obs=[]; boss.waves=[]; wrenches=[]; boss.frz=2.5;
  popText(boss.x,boss.y-boss.hh-20,'⚡','#ffe14d'); shake(5,.2);
}
// панч: выстрел; по боссу — один тычок через bossHit, иначе до трёх ближайших врагов впереди на экране
function firePunch(){
  const px=player.x, py=player.y-24;
  if(boss&&boss.st!=='dead'){
    const b=boss; punches.push({x0:px,y0:py,x1:b.x,y1:b.y-b.hh*b.scale/2,l:.3});
    if(b.kind==='worm') b.dug=0;
    bossHit(b,b.y-b.hh*b.scale); return;
  }
  const t=enemies.filter(e=>!e.dead&&e.x>px&&e.x<camX+W).sort((a,c)=>a.x-c.x).slice(0,3);
  if(!t.length) punches.push({x0:px,y0:py,x1:camX+W,y1:py,l:.3});
  for(const e of t){
    e.dead=0.01; score+=100; punches.push({x0:px,y0:py,x1:e.x,y1:e.y-20,l:.3});
    popText(e.x,e.y-60,'+100','#ff7aa8'); firework(e.x,e.y-40);
  }
  sStomp(); shake(4,.15);
}
function bossAct(b,o){
  sStomp(); shake(6,.2); player.jumps=maxJumps();
  if(o.act==='tramp'){ player.vy=-Math.sqrt(2*G*(b.gy-b.y+b.hh+50)); b.st='stun'; b.t=0; return; } // диск подбрасывает как раз на тарелку
  player.vy=JUMP*0.78;
  const tx=b.x, ty=b.y-b.hh/2; // золотое яйцо летит обратно
  for(let i=0;i<24;i++){ const k=i/24; parts.push({x:o.x+(tx-o.x)*k,y:o.y+(ty-o.y)*k,vx:(Math.random()-.5)*80,vy:(Math.random()-.5)*80,l:.45,c:'#ffd84d'}); }
  bossHit(b,ty);
}
function bossHit(b,top){
  b.hp--; b.hitT=0.5; score+=1000; sStomp(); shake(12,.3); firework(b.x,top-20);
  popText(b.x,top-40,'+1000','#ffd84d');
  if(b.kind==='balloon'){ b.scale=0.55+0.45*b.hp/b.max; beep(200,.4,'sawtooth',.1); }
  if(b.kind==='rooster') for(let i=0;i<14;i++) parts.push({x:b.x,y:top+20,vx:(Math.random()-.5)*500,vy:-Math.random()*400,l:.6,c:'#bfefff'});
  if(b.hp<=0){ bossKill(b); return; }
  if(b.mini){ b.scale=0.65; b.waves=[]; b.obs=[]; showQuote(b.easy?'СДУЛСЯ — ЕЩЁ ОДИН ТЫЧОК 👊':MINI_PHASE2[b.kind],true); } // сдулся; полная форма меняет атаку, лёгкая нет
  else showQuote('ТЫЧОК '+(b.max-b.hp)+'/'+b.max+' 👊',true);
  b.st='hurt'; b.t=0; b.vsx=900; b.vy=-520;
}
