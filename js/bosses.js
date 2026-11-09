// --- Боссы ---
// Общее для всех: позиция босса в координатах экрана (sx), гриб всегда на psx, потому что камера едет вместе с ним.
// Бить можно, только когда b.vuln (босс ползёт, катится или бежит на гриб по земле): прыгни сверху.
// Касание сбоку — удар по грибу. Пока босс жив, зона стоит, а трек крутится по кругу.
const BOSS_SIZE={plumber:[34,96],pigeon:[44,62],balloon:[46,92],rooster:[36,92],worm:[30,56],ufo:[58,34],king:[42,96]}; // полуширина и рост
const BOSS_TIP={
  plumber:'ПРЫГАЙ НА ГОЛОВУ, КОГДА ОН ПРЁТ ⭐',
  pigeon:'ЯЙЦА ПЕРЕПРЫГИВАЙ, КЛЮВ В ЗЕМЛЕ — БЕЙ ⭐',
  balloon:'НИЗКИЙ ПУЗЫРЬ — ПРЫГАЙ, ВЫСОКИЙ — СТОЙ ⭐',
  rooster:'ОСКОЛКИ — ПРЫЖОК (ДВОЙНОЙ), ФИНТ — ЖДИ ⭐',
  worm:'ОН ПОД ЗЕМЛЁЙ: БЕГИ, НА ПОВЕРХНОСТИ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  ufo:'ЛУЧ ЖЖЁТ ЗЕМЛЮ — БУДЬ В ПРЫЖКЕ; СЕЛА И ПОЛЗЁТ — БЕЙ ⭐',
  king:'ПОСЛЕ ПРЫЖКА ЦАРЬ СЕЛ И ПОЛЗЁТ — ПРЫГАЙ НА ШЛЯПКУ ⭐',
};
function startBoss(){
  const d=bossAt(arena.lvl)||miniAt(arena.lvl), sz=BOSS_SIZE[d.kind];
  boss={mini:!!d.mini,lvl:arena.lvl,kind:d.kind,name:d.name,hp:d.hp,max:d.hp,hw:sz[0],hh:sz[1],gy:arena.y,sx:W+80,y:d.kind==='plumber'||d.kind==='rooster'?-200:H*0.1,
        vy:0,vsx:0,st:'enter',t:0,n:0,hitT:0,rot:0,scale:1,alpha:1,waves:[],obs:[],vuln:false,solid:false};
  boss.x=camX+boss.sx;
  enemies=enemies.filter(e=>e.x<player.x-40);
  showQuote((d.mini?'МИНИ-БОСС: ':'БОСС: ')+boss.name,true); if(d.line) showQuote(d.line,false); shake(10,.4); beep(110,.5,'sawtooth',.15); setTimeout(()=>beep(82,.6,'sawtooth',.15),250);
  const lvl=boss.lvl; setTimeout(()=>{ if(boss&&boss.lvl===lvl&&boss.hp===boss.max) showQuote(BOSS_TIP[boss.kind],false); },1800);
  metaEvent(d.mini?'mini':'boss',d.kind);
  vsCard(boss.name,d.mini); airhorn();
}
function bossGap(rage){ return 0.9-rage*0.07; } // пауза между ключами: дольше прыжка (0.73 с)
function bossThrow(b){
  const tdx=Math.max(120,b.x-player.x), T=0.55+tdx/1600, x0=b.x-24, y0=b.y-b.hh*0.8;
  const tx=player.x+speed*T+(Math.random()-.5)*40, ty=b.gy-20;
  wrenches.push({x:x0,y:y0,vx:(tx-x0)/T,vy:(ty-y0-0.5*WG*T*T)/T,r:0,l:4});
  beep(420,.06,'triangle');
}
function obsAhead(){ return boss.obs.some(o=>o.x>player.x-20); }
function bossKill(b){
  b.st='dead'; b.t=0; b.vsx=520; b.vy=-900; b.waves=[]; b.obs=[];
  score+=b.mini?1500:5000; confetti(b.mini?30:90); shake(18,.6);
  if(b.kind==='rooster') for(let i=0;i<40;i++) parts.push({x:b.x,y:b.y-b.hh/2,vx:(Math.random()-.5)*900,vy:-Math.random()*700,l:1,c:Math.random()<.5?'#bfefff':'#ffffff'});
  if(b.kind==='balloon') beep(160,.8,'sawtooth',.14);
  for(let i=0;i<3;i++) setTimeout(()=>firework(camX+W*(0.3+Math.random()*0.5),H*(0.2+Math.random()*0.3)),i*220);
  showQuote(b.mini?'МИНИ-БОСС СЛИТ +1500 🎤':'БОСС ПОВЕРЖЕН +5000 🏆',true);
  stamp(BOSS_KO[(Math.random()*BOSS_KO.length)|0]); airhorn(); emojiRain(['🎤','🔥','🍄','💿'],b.mini?14:30);
  bossDone[b.lvl]=true;
  if(!b.mini) metaEvent('beat',b.kind);
  if(arena){ // обрезаем арену и убираем всё, что генератор успел поставить за ней
    arena.w=Math.max(200,camX+W*1.6-arena.x); const end=arena.x+arena.w;
    plats=plats.filter(p=>p.x<end); enemies=enemies.filter(e=>e.x<end); pickups=pickups.filter(b=>b.x<end);
    arena=null;
  }
  if(!b.mini) dist=(zoneN+1)*ZONE_LEN+1; // следующий уровень и новый трек начинаются сразу; мини-босс зону не сбрасывает
}
// №1 ГЛАВНЫЙ САНТЕХНИК: ключи → (после первого тычка прыжок с волной) → устал и прёт на гриб
function updPlumber(b,dt,psx,gy,rage){
  const anchor=W*0.72;
  switch(b.st){
    case 'enter':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(12,.3); b.st='throw'; b.t=0; b.n=0; }
      break;
    case 'throw':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*4); b.y=gy;
      b.wind=b.t>bossGap(rage)-0.35; // замах: ключ над головой
      if(b.t>bossGap(rage)){ b.t=0; b.n++; bossThrow(b);
        if(b.n>=2+(rage>=2?1:0)){ b.n=0; b.t=0; if(rage>0){ b.st='leap'; b.vy=-1250; b.lx=b.sx; b.tx=psx+340; } else b.st='charge'; } }
      break;
    case 'leap':
      b.vy+=G*dt; b.y+=b.vy*dt; b.sx=b.lx+(b.tx-b.lx)*Math.min(1,b.t/0.9);
      if(b.y>=gy&&b.vy>0){ b.y=gy; b.vy=0; b.st='slam'; b.t=0; shake(16,.4); beep(70,.35,'square',.2);
        b.waves.push({sx:b.sx-b.hw,d:-1},{sx:b.sx+b.hw,d:1}); }
      break;
    case 'slam': b.y=gy; if(b.t>1.1){ b.st='charge'; b.t=0; } break; // сначала волна, потом рывок
    case 'charge':
      b.y=gy; b.sx-=(250+rage*40)*dt;
      if(b.sx<-120){ b.st='back'; b.t=0; b.sx=W+100; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; }
      if(b.t>0.8){ b.st='back'; b.t=0; }
      break;
    case 'back':
      b.y=gy; b.sx+=(anchor-b.sx)*Math.min(1,dt*3);
      if(Math.abs(anchor-b.sx)<10){ b.st='throw'; b.t=0; b.n=0; }
      break;
  }
  b.vuln=b.st==='charge'; b.solid=b.st!=='enter'&&b.st!=='leap';
}
// №2 ГОЛУБИНЫЙ КОРОЛЬ: кружит и несёт яйца (лежат на земле, перепрыгни) → прицел → пике →
// клюв застрял в земле, ползёт на гриб: бей
function updPigeon(b,dt,psx,gy,rage){
  const ax=W*0.7, ay=H*0.22;
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>1.2){ b.st='hover'; b.t=0; b.n=0; } break;
    case 'hover':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*3)*14;
      if(b.t>(1.0-rage*0.06)){ b.t=0; b.n++; // яйца не чаще прыжка
        b.obs.push({x:b.x,y:b.y,vx:0,vy:0,r:13,kind:'egg',grav:1}); beep(520,.05,'triangle');
        if(b.n>=3+Math.min(rage,2)){ b.n=0; b.st='aim'; b.t=0; } }
      break;
    case 'aim': // ждёт, пока все яйца позади, и метит в землю впереди гриба
      b.sx+=(ax+40-b.sx)*Math.min(1,dt*3); b.y+=(ay-30-b.y)*Math.min(1,dt*3); b.tx=psx+330;
      if(b.t>0.7&&!obsAhead()){ b.st='dive'; b.t=0; b.lx=b.sx; b.ly=b.y; beep(1400,.15,'square',.06); }
      break;
    case 'dive':{ const k=Math.min(1,b.t/0.45); b.sx=b.lx+(b.tx-b.lx)*k; b.y=b.ly+(gy-b.ly)*k*k;
      if(k>=1){ b.y=gy; b.st='stuck'; b.t=0; shake(14,.35); beep(80,.3,'square',.2);
        for(let i=0;i<10;i++) parts.push({x:b.x,y:gy,vx:(Math.random()-.5)*300,vy:-Math.random()*300,l:.5,c:'#8a6a4a'}); }
      break; }
    case 'stuck': b.y=gy; b.sx-=(240+rage*25)*dt; if(b.sx<psx-90){ b.st='rise'; b.t=0; } break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(H*0.18-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.7){ b.st='hover'; b.t=0; b.n=0; } break;
  }
  b.vuln=b.st==='stuck'; b.solid=b.st==='stuck';
}
// №3 ДУТАЯ ФИГУРА: висит и пускает пузыри (низкий — прыгай, высокий — стой) → сдувается, падает впереди →
// скачет по земле на гриб: бей. С каждым тычком сдувается сильнее.
function updBalloon(b,dt,psx,gy,rage){
  const ax=W*0.7, ay=gy-H*0.26;
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2); b.y+=(ay-b.y)*Math.min(1,dt*2); if(b.t>1.3){ b.st='puff'; b.t=0; b.n=0; } break;
    case 'puff':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*2.4)*10;
      if(b.t>0.9){ b.t=0; b.n++; // пузыри не чаще прыжка: между ними 0.9 с
        const low=b.n===1||Math.random()<0.55;
        b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-300,vy:0,r:low?15:17,kind:low?'bubL':'bubH'}); beep(low?300:620,.08,'sine',.12);
        if(b.n>=4+Math.min(rage,2)){ b.n=0; b.st='sag'; b.t=0; beep(240,.6,'sawtooth',.08); } }
      break;
    case 'sag': b.sx+=(psx+360-b.sx)*Math.min(1,dt*2.5); b.y+=(gy-b.y)*Math.min(1,dt*3);
      if(b.t>0.9&&!obsAhead()){ b.y=gy; b.st='roll'; b.t=0; }
      break;
    case 'roll': b.sx-=(230+rage*25)*dt; b.y=gy-Math.abs(Math.sin(b.t*6))*24; if(b.sx<psx-100){ b.st='rise'; b.t=0; } break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>1){ b.st='puff'; b.t=0; b.n=0; } break;
  }
  b.vuln=b.st==='roll'; b.solid=b.st==='roll';
}
// №4 СТЕКЛЯННЫЙ ПЕТУХ (5 тычков): клюёт землю, осколки бегут очередью (двойной прыжок) →
// с ярости кукарекает пузырями на разной высоте → бежит на гриб, иногда с финтом: замирает и потом быстрее
function updRooster(b,dt,psx,gy,rage){
  const anchor=W*0.72;
  switch(b.st){
    case 'enter':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(12,.3); b.st='peck'; b.t=0; b.n=0; }
      break;
    case 'peck':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*4); b.y=gy;
      if(b.t>(b.n===0?0.7:0.38)){ b.t=0; b.n++; b.obs.push({x:b.x-b.hw,y:gy-9,vx:speed-430,vy:0,r:10,kind:'shard'}); beep(1300,.04,'square',.06); // 2 осколка берутся одним прыжком, 3-й — двойным
        if(b.n>=2+Math.min(rage,2)){ b.n=0; b.st=rage>=2?'crow':'wait'; b.t=0; } }
      break;
    case 'crow': // КУКАРЕКУ: кольца на разной высоте
      b.y=gy;
      if(b.t>0.9){ b.t=0; b.n++; const low=Math.random()<0.5;
        b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-340,vy:0,r:low?15:17,kind:low?'ringL':'ringH'}); beep(low?700:1000,.1,'triangle',.1);
        if(b.n>=3){ b.n=0; b.st='wait'; b.t=0; } }
      break;
    case 'wait': b.y=gy; if(b.t>0.5&&!obsAhead()){ b.st='charge'; b.t=0; b.fast=false; b.feint=rage>=1&&Math.random()<0.8; b.fdone=false; } break;
    case 'charge':
      b.y=gy;
      if(b.feint&&!b.fdone&&b.sx<psx+330){ b.st='feint'; b.t=0; b.fdone=true; break; }
      b.sx-=(b.fast?370:300)*dt;
      if(b.sx<-120){ b.st='back'; b.t=0; b.sx=W+100; }
      break;
    case 'feint': b.y=gy; if(b.t>0.6){ b.st='charge'; b.t=0; b.fast=true; } break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; }
      if(b.t>0.8){ b.st='back'; b.t=0; }
      break;
    case 'back': b.y=gy; b.sx+=(anchor-b.sx)*Math.min(1,dt*3); if(Math.abs(anchor-b.sx)<10){ b.st='peck'; b.t=0; b.n=0; } break;
  }
  b.vuln=b.st==='charge'||b.st==='feint'; b.solid=b.st!=='enter';
}
// №5 ПОДЗЕМНЫЙ ЧЕРВЬ: уходит под землю, всплывает рядом с грибом и ползёт на него.
// Бить можно только на поверхности; под землёй он быстро догоняет — надо бежать.
function updWorm(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter':
      b.sx+=(W*0.7-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(10,.25); b.st='dig'; b.t=0; }
      break;
    case 'dig':
      b.y=gy+b.hh+14; b.sx+=(psx+Math.sin(b.t*2.4)*70-b.sx)*Math.min(1,dt*1.7);
      if(Math.random()<dt*22) parts.push({x:camX+b.sx+(Math.random()-.5)*36,y:gy-2,vx:(Math.random()-.5)*120,vy:-80-Math.random()*120,l:.5,c:'#8a6a4a'});
      if(b.t>0.8-rage*0.06){ b.st='rise'; b.t=0; b.rx=psx+90+Math.random()*90; b.sx=b.rx; beep(130,.22,'sawtooth',.1); }
      break;
    case 'rise':
      b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(Math.abs(gy-b.y)<3){ b.y=gy; b.st='surface'; b.t=0; shake(11,.28); beep(90,.2,'square',.12); }
      break;
    case 'surface':
      b.sx-=(110+rage*25)*dt;
      if(b.t>1.2-rage*0.05){ b.st='dig'; b.t=0; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(b.t>.7){ b.st='dig'; b.t=0; }
      break;
  }
  b.vuln=b.st==='surface'; b.solid=b.st==='surface'||b.st==='rise';
}
// №6 ЛЕТАЮЩАЯ ТАРЕЛКА: висит зигзагом, стреляет веером дисков и жжёт лучом сверху.
// Луч заряжается по метке и жжёт землю, после выстрела тарелка садится низко и ползёт на гриб — в это время её можно бить.
function updUfo(b,dt,psx,gy,rage){
  const ax=W*0.68, ay=H*0.2;
  switch(b.st){
    case 'enter':
      b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5);
      if(b.t>1.1){ b.st='hover'; b.t=0; b.n=0; }
      break;
    case 'hover':
      b.sx=ax+Math.sin(b.t*1.6)*W*0.12; b.y=ay+Math.sin(b.t*2.6)*18;
      if(b.t>0.9){ b.t=0; b.n++;
        const sx=b.x, sy=b.y+10, ang=Math.atan2((player.y-24)-sy, player.x-sx);
        for(let i=-1;i<=1;i++){ const a=ang+i*0.28, v=330+rage*20;
          b.obs.push({x:sx,y:sy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:13,kind:i<0?'bubL':i>0?'bubH':'ringL'}); }
        beep(680,.07,'sine',.1);
        if(b.n>=2+Math.min(rage,2)){ b.n=0; b.st='charge'; b.t=0; b.beamX=psx+40; } }
      break;
    case 'charge':
      b.sx+=(psx-b.sx)*Math.min(1,dt*6); b.y+=(ay-20-b.y)*Math.min(1,dt*3); b.beamX=b.sx;
      if(b.t>0.8){ b.st='beam'; b.t=0; beep(300,.5,'sawtooth',.12); }
      break;
    case 'beam': // жжёт землю: увернуться можно только прыжком
      b.y=ay-20;
      if(b.t>0.12&&player.vy===0&&Math.abs(psx-b.beamX)<26) hit();
      if(b.t>0.55){ b.st='drop'; b.t=0; }
      break;
    case 'drop': // отстрелялась: отлетает вперёд и садится низко
      b.sx+=(psx+360-b.sx)*Math.min(1,dt*3); b.y+=(gy-30-b.y)*Math.min(1,dt*3);
      if(b.t>0.9&&!obsAhead()){ b.st='vent'; b.t=0; }
      break;
    case 'vent': // остывает и ползёт на гриб
      b.y=gy-30+Math.sin(b.t*5)*4; b.sx-=(220+rage*25)*dt;
      if(b.sx<psx-120){ b.st='rise'; b.t=0; }
      break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>0.8){ b.st='hover'; b.t=0; b.n=0; } break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3);
      if(b.t>.8){ b.st='hover'; b.t=0; }
      break;
  }
  b.vuln=b.st==='vent'; b.solid=b.st==='vent';
}
// №7 ЦАРЬ ГРИБОВ: прыгает и бьёт волнами, сыплет спорами, телепортируется к грибу и зовёт миньонов.
// Уязвим, когда сел после прыжка и ползёт на гриб.
function updKing(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter':
      b.sx+=(W*0.7-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(14,.35); b.st='stomp'; b.t=0; }
      break;
    case 'stomp':
      b.y=gy; b.sx+=(psx+320-b.sx)*Math.min(1,dt*2.5);
      if(b.t>1.0-rage*0.05){ b.st='jump'; b.t=0; b.vy=-1150-rage*40; }
      break;
    case 'jump':
      b.vy+=G*dt; b.y+=b.vy*dt; b.sx+=(psx+180-b.sx)*Math.min(1,dt*1.2);
      if(b.y>=gy&&b.vy>0){ b.y=gy; b.vy=0; b.st='land'; b.t=0; shake(18,.45); beep(60,.4,'square',.22);
        b.waves.push({sx:b.sx-b.hw,d:-1},{sx:b.sx+b.hw,d:1});
        for(let i=0;i<3;i++) b.obs.push({x:b.x+280+Math.random()*320,y:b.y-120,vy:-200-Math.random()*220,vx:(Math.random()-.5)*120,r:12,kind:'egg',grav:1}); }
      break;
    case 'land': // сел и ползёт на гриб: прыжок через волну как раз приходится на шляпку
      b.y=gy; b.sx-=240*dt;
      if(b.sx<psx-110){ b.st='vanish'; b.t=0; }
      break;
    case 'summon':
      b.y=gy;
      if(b.t>0.5&&!b.sdid){ b.sdid=1;
        for(let i=0;i<2;i++) spawnMinion(b.x+(i?70:-70),gy,arena);
        showQuote('ЦАРЬ ЗОВЁТ ГРИБОВ 🍄',false); beep(300,.2,'triangle',.1); }
      if(b.t>1.3){ b.st='charge'; b.t=0; }
      break;
    case 'vanish':
      b.y=gy; b.alpha=Math.max(0,1-b.t*3);
      if(b.t>0.5){ b.sx=psx+260; b.st='appear'; b.t=0; beep(1500,.12,'square',.05); }
      break;
    case 'appear':
      b.y=gy; b.alpha=Math.min(1,b.t*4);
      if(b.t>0.35){ b.alpha=1; b.st=rage>=2&&Math.random()<0.5?'summon':'charge'; b.t=0; }
      break;
    case 'charge':
      b.y=gy; b.sx-=(270+rage*40)*dt;
      if(b.sx<psx-120){ b.st='stomp'; b.t=0; b.sx=W+80; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(gy-b.y)*Math.min(1,dt*4);
      if(b.t>.7){ b.st='vanish'; b.t=0; } // после тычка весь круг заново, а не цепочка ударов
      break;
    case 'rise': b.y=gy; b.sx+=(psx+320-b.sx)*Math.min(1,dt*3); if(b.t>.7){ b.st='stomp'; b.t=0; } break;
  }
  if(b.st!=='summon') b.sdid=0;
  b.vuln=b.st==='land';
  b.solid=b.st!=='enter'&&b.st!=='vanish'&&b.st!=='rise';
}
function spawnMinion(x,y,p){
  enemies.push({x,y,w:34,h:42,dir:Math.random()<.5?-1:1,p,dead:0,t:Math.random()*6,type:'walk',vy:0,baseY:y,cd:0.2});
}
const BOSS_UPD={plumber:updPlumber,pigeon:updPigeon,balloon:updBalloon,rooster:updRooster,worm:updWorm,ufo:updUfo,king:updKing};
function updBoss(dt,onGround){
  const b=boss, psx=player.x-camX, gy=b.gy, rage=b.max-b.hp;
  b.t+=dt; b.hitT=Math.max(0,b.hitT-dt);
  if(b.st==='dead'){ b.sx+=b.vsx*dt; b.vy+=G*0.55*dt; b.y+=b.vy*dt; b.rot+=dt*9; b.x=camX+b.sx; if(b.t>2.2) boss=null; return; }
  BOSS_UPD[b.kind](b,dt,psx,gy,rage);
  b.x=camX+b.sx;
  // ударная волна по земле: перепрыгни
  for(const w of b.waves){ w.sx+=w.d*(430+rage*25)*dt;
    if(!player.dead&&onGround&&Math.abs(w.sx-psx)<16){ w.dead=1; hit(); } }
  b.waves=b.waves.filter(w=>!w.dead&&w.sx>-60&&w.sx<W+60);
  // снаряды: яйца падают и лежат, пузыри и осколки летят на гриб
  const psc=player.big?1.35:1;
  for(const o of b.obs){
    if(o.grav){ o.vy+=G*dt; o.y+=o.vy*dt; if(o.y>=gy-o.r){ o.y=gy-o.r; o.vy=0; o.grav=0; } }
    else o.y+=(o.vy||0)*dt;
    o.x+=o.vx*dt;
    if(!player.dead&&player.inv<=0&&Math.abs(player.x-o.x)<o.r+12*psc&&Math.abs(player.y-20*psc-o.y)<o.r+18*psc){ o.dead=1; hit(); }
  }
  b.obs=b.obs.filter(o=>!o.dead&&o.x>camX-80&&o.x<camX+W+600);
  // контакт с самим боссом
  if(player.dead||!b.solid)return;
  const hh=b.hh*b.scale, top=b.y-hh, dx=Math.abs(player.x-b.x);
  if(dx<b.hw*b.scale+20*psc&&player.y>top-4&&player.y-40*psc<b.y){
    if(player.vy>60&&player.y<top+30){
      player.vy=JUMP*0.78; player.jumps=maxJumps();
      if(b.vuln) bossHit(b,top); else beep(900,.05,'square',.08); // не время: дзынь
    } else if(b.st!=='hurt'){ hit(); b.st=(b.kind==='plumber'||b.kind==='rooster')?'back':b.kind==='worm'?'dig':'rise'; b.t=0; }
  }
}
function bossHit(b,top){
  b.hp--; b.hitT=0.5; score+=1000; sStomp(); shake(12,.3); firework(b.x,top-20);
  popText(b.x,top-40,'+1000','#ffd84d');
  if(b.kind==='balloon'){ b.scale=0.55+0.45*b.hp/b.max; beep(200,.4,'sawtooth',.1); }
  if(b.kind==='rooster') for(let i=0;i<14;i++) parts.push({x:b.x,y:top+20,vx:(Math.random()-.5)*500,vy:-Math.random()*400,l:.6,c:'#bfefff'});
  if(b.hp<=0){ bossKill(b); return; }
  showQuote('ТЫЧОК '+(b.max-b.hp)+'/'+b.max+' 👊',true);
  b.st='hurt'; b.t=0; b.vsx=900; b.vy=-520;
}
