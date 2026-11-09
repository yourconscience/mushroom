// --- Боссы ---
// Общее для всех: позиция босса в координатах экрана (sx), гриб всегда на psx, потому что камера едет вместе с ним.
// Бить можно, только когда b.vuln (босс ползёт, катится или бежит на гриб по земле): прыгни сверху.
// Касание сбоку — удар по грибу. Пока босс жив, зона стоит, а трек крутится по кругу.
const BOSS_SIZE={plumber:[34,96],pigeon:[44,62],balloon:[46,92],rooster:[36,92],worm:[30,56],ufo:[58,34],king:[42,96]}; // полуширина и рост
const BOSS_TIP={
  plumber:'ПРЫГАЙ НА ГОЛОВУ, КОГДА ОН ПРЁТ ⭐',
  pigeon:'ЯЙЦА ПЕРЕПРЫГИВАЙ, НА ЗОЛОТОЕ ПРЫГНИ — ПОЛЕТИТ В НЕГО ⭐',
  balloon:'ПЛЫВЁТ НАД ГОЛОВОЙ — ПРОБЕЙ СНИЗУ, МАКУШКОЙ ⭐',
  rooster:'НЕ БЕЙ ЕГО: ЧИСТАЯ СЕРИЯ — И ОН ТРЕСНЕТ ⭐',
  worm:'БУГОР ДОШЁЛ — БУДЬ В ПРЫЖКЕ; БЕЙ ГОЛОВУ СО ЗВЁЗДАМИ, КОЛЮЧАЯ ЖАЛИТ ⭐',
  ufo:'ЛУЧ — БУДЬ В ПРЫЖКЕ; ЗОЛОТОЙ ДИСК ПОДБРОСИТ НА ТАРЕЛКУ ⭐',
  king:'СЕЛ И ПОЛЗЁТ — БЕЙ В ШЛЯПКУ; В БРОНЕ — СНАЧАЛА РАЗДАВИ СОЛДАТА ⭐',
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
// №2 ГОЛУБИНЫЙ КОРОЛЬ: сам недосягаем. Несёт яйца, последнее золотое: прыгни на него, и оно полетит обратно в голубя.
// Пропустил золотое — пикирует и проносится по земле, это надо перепрыгнуть.
function updPigeon(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.7,psx+560), ay=Math.max(110,gy-300);
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>1.2){ b.st='hover'; b.t=0; b.n=0; } break;
    case 'hover':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*3)*14;
      if(b.t>(b.n+1>=3+rage?1.6:1.0-rage*0.06)){ b.t=0; b.n++; // золотое с паузой, чтобы успеть приземлиться и прыгнуть на него
        const gold=b.n>=3+rage;
        b.obs.push({x:b.x,y:b.y,vx:0,vy:0,r:gold?17:13,kind:'egg',grav:1,act:gold?'kick':null}); beep(gold?880:520,.06,'triangle');
        if(gold){ b.n=0; b.st='aim'; b.t=0; } }
      break;
    case 'aim': // ждёт, пока все яйца позади, и метит в землю впереди гриба
      b.sx+=(ax+40-b.sx)*Math.min(1,dt*3); b.y+=(ay-30-b.y)*Math.min(1,dt*3); b.tx=psx+330;
      if(b.t>0.7&&!obsAhead()){ b.st='dive'; b.t=0; b.lx=b.sx; b.ly=b.y; beep(1400,.15,'square',.06); }
      break;
    case 'dive':{ const k=Math.min(1,b.t/0.45); b.sx=b.lx+(b.tx-b.lx)*k; b.y=b.ly+(gy-b.ly)*k*k;
      if(k>=1){ b.y=gy; b.st='stuck'; b.t=0; shake(14,.35); beep(80,.3,'square',.2);
        for(let i=0;i<10;i++) parts.push({x:b.x,y:gy,vx:(Math.random()-.5)*300,vy:-Math.random()*300,l:.5,c:'#8a6a4a'}); }
      break; }
    case 'stuck': b.y=gy; b.sx-=(420+rage*30)*dt; if(b.sx<psx-110){ b.st='rise'; b.t=0; } break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.7){ b.st='hover'; b.t=0; b.n=0; } break;
  }
  b.vuln=false; b.solid=b.st==='stuck';
}
// №3 ДУТАЯ ФИГУРА: пускает пузыри (низкий — прыгай, высокий — стой), потом плывёт над грибом:
// бить только снизу, макушкой. С каждым тычком сдувается.
function updBalloon(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.7,psx+560), ay=gy-H*0.26, low=gy-175;
  b.below=true;
  switch(b.st){
    case 'enter': b.sx+=(ax-b.sx)*Math.min(1,dt*2); b.y+=(ay-b.y)*Math.min(1,dt*2); if(b.t>1.3){ b.st='puff'; b.t=0; b.n=0; } break;
    case 'puff':
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y=ay+Math.sin(b.t*2.4)*10;
      if(b.t>0.9){ b.t=0; b.n++; // пузыри не чаще прыжка: между ними 0.9 с
        const lowB=b.n===1||Math.random()<0.55;
        b.obs.push({x:b.x-b.hw,y:lowB?gy-20:gy-100,vx:speed-300,vy:0,r:lowB?15:17,kind:lowB?'bubL':'bubH'}); beep(lowB?300:620,.08,'sine',.12);
        if(b.n>=3+rage){ b.n=0; b.st='sag'; b.t=0; beep(240,.6,'sawtooth',.08); } }
      break;
    case 'sag': b.sx+=(psx+Math.min(W*0.8,460)-b.sx)*Math.min(1,dt*2.5); b.y+=(low-b.y)*Math.min(1,dt*3);
      if(b.t>0.9&&!obsAhead()){ b.st='roll'; b.t=0; }
      break;
    case 'roll': b.sx-=(230+rage*25)*dt; b.y=low+Math.sin(b.t*5)*5; if(b.sx<psx-110){ b.st='rise'; b.t=0; } break;
    case 'hurt': b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3); if(b.t>0.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>1){ b.st='puff'; b.t=0; b.n=0; } break;
  }
  b.vuln=b.st==='roll'; b.solid=b.st==='roll';
}
// №4 СТЕКЛЯННЫЙ ПЕТУХ: его не бьют. Осколки и кольца идут серией в ритме; серия без единого удара по грибу — трещина.
// На стекле можно подпрыгнуть, но вреда это ему не делает. Со второй серии он ещё и бежит на гриб, с третьей финтит.
const ROOSTER_SERIES=[['s','s','s','s'],['s','L','H','s','s','L'],['L','s','H','s','L','H','s']];
function updRooster(b,dt,psx,gy,rage){
  const anchor=Math.min(W*0.72,psx+560), list=ROOSTER_SERIES[Math.min(rage,2)];
  switch(b.st){
    case 'enter':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(12,.3); b.st='peck'; b.t=0; b.n=0; b.touched=0; }
      break;
    case 'peck':
      b.sx+=(anchor-b.sx)*Math.min(1,dt*4); b.y=gy;
      if(b.t>(b.n===0?0.7:0.8)){ b.t=0; const k=list[b.n++];
        if(k==='s'){ b.obs.push({x:b.x-b.hw,y:gy-9,vx:speed-400,vy:0,r:10,kind:'shard'}); beep(1300,.04,'square',.06); }
        else { const low=k==='L'; b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-400,vy:0,r:low?15:17,kind:low?'ringL':'ringH'}); beep(low?700:1000,.1,'triangle',.1); }
        if(b.n>=list.length){ b.n=0; b.st='wait'; b.t=0; b.ran=false; } }
      break;
    case 'wait':
      b.y=gy;
      if(b.t>0.5&&!obsAhead()){
        if(rage>=1&&!b.ran){ b.ran=true; b.st='charge'; b.t=0; b.fast=false; b.feint=rage>=2; b.fdone=false; }
        else if(b.touched){ b.st='back'; b.t=0; showQuote('СЕРИЯ НЕ В СЧЁТ, ЕЩЁ РАЗ 🐓',false); }
        else { for(let i=0;i<14;i++) parts.push({x:b.x,y:gy-b.hh+20,vx:(Math.random()-.5)*500,vy:-Math.random()*400,l:.6,c:'#bfefff'}); bossHit(b,gy-b.hh); }
      }
      break;
    case 'charge':
      b.y=gy;
      if(b.feint&&!b.fdone&&b.sx<psx+330){ b.st='feint'; b.t=0; b.fdone=true; break; }
      b.sx-=(b.fast?370:300)*dt;
      if(b.sx<-120){ b.st='wait'; b.t=0; b.sx=W+100; }
      break;
    case 'feint': b.y=gy; if(b.t>0.6){ b.st='charge'; b.t=0; b.fast=true; } break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(0.08,dt); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; }
      if(b.t>0.8){ b.st='back'; b.t=0; }
      break;
    case 'back': b.y=gy; b.sx+=(anchor-b.sx)*Math.min(1,dt*3); if(Math.abs(anchor-b.sx)<10){ b.st='peck'; b.t=0; b.n=0; b.touched=0; } break;
  }
  b.vuln=false; b.solid=b.st==='charge'||b.st==='feint';
}
// №5 ПОДЗЕМНЫЙ ЧЕРВЬ: бугор идёт к грибу рывками и бьёт снизу, в этот момент надо быть в воздухе.
// Потом вылезают две головы: настоящая со звёздами и колючая, которая жалит.
function updWorm(b,dt,psx,gy,rage){
  const v=130+rage*25;
  switch(b.st){
    case 'enter':
      b.sx+=(W*0.7-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(10,.25); b.st='dig'; b.t=0; }
      break;
    case 'dig':
      if(!b.dug){ b.dug=1; b.sx=psx+Math.min(W*0.85,520); b.ph=Math.random()*6; }
      b.y=gy+b.hh+14; b.sx-=(300+rage*30+220*Math.sin(b.t*4.5+b.ph))*dt;
      if(Math.random()<dt*22) parts.push({x:camX+b.sx+(Math.random()-.5)*36,y:gy-2,vx:(Math.random()-.5)*120,vy:-80-Math.random()*120,l:.5,c:'#8a6a4a'});
      if(Math.abs(b.sx-psx)<18&&player.vy===0) hit();
      if(b.sx<psx-60){ b.dug=0; b.st='rise'; b.t=0; beep(130,.22,'sawtooth',.1);
        const near=Math.random()<0.5, d1=150+Math.random()*40, d2=d1+150;
        b.sx=psx+(near?d1:d2);
        b.obs.push({x:camX+psx+(near?d2:d1),y:gy-22,vx:speed-v,vy:0,r:20,kind:'decoy'}); }
      break;
    case 'rise':
      b.sx-=v*dt; b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(Math.abs(gy-b.y)<3){ b.y=gy; b.st='surface'; b.t=0; shake(11,.28); beep(90,.2,'square',.12); }
      break;
    case 'surface':
      b.sx-=v*dt;
      if(b.t>2.6||b.sx<psx-110){ b.st='dig'; b.t=0; }
      break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(gy-b.y)*Math.min(1,dt*6);
      if(b.t>.7){ b.st='dig'; b.t=0; }
      break;
  }
  b.vuln=b.st==='surface'||b.st==='rise'; b.solid=b.vuln;
}
// №6 ЛЕТАЮЩАЯ ТАРЕЛКА: до неё не допрыгнуть. Веер дисков, луч по метке, потом катится золотой диск:
// прыгни на него, он подбросит вверх, и тарелка окажется под ногами.
function updUfo(b,dt,psx,gy,rage){
  const ax=Math.min(W*0.68,psx+560), ay=Math.max(96,gy-300);
  switch(b.st){
    case 'enter':
      b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5);
      if(b.t>1.1){ b.st='hover'; b.t=0; b.n=0; }
      break;
    case 'hover':
      b.sx=ax+Math.sin(b.t*1.6)*Math.min(W*0.12,120); b.y=ay+Math.sin(b.t*2.6)*18;
      if(b.t>0.9){ b.t=0; b.n++;
        const sx=b.x, sy=b.y+10, ang=Math.atan2((player.y-24)-sy, player.x-sx);
        for(let i=-1;i<=1;i++){ const a=ang+i*0.28, v=330+rage*20;
          b.obs.push({x:sx,y:sy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,r:13,kind:i<0?'bubL':i>0?'bubH':'ringL'}); }
        beep(680,.07,'sine',.1);
        if(b.n>=2+rage){ b.n=0; b.st='charge'; b.t=0; b.beamX=psx; } }
      break;
    case 'charge':
      b.sx+=(psx-b.sx)*Math.min(1,dt*6); b.y+=(ay-20-b.y)*Math.min(1,dt*3); b.beamX=b.sx;
      if(b.t>0.8){ b.st='beam'; b.t=0; beep(300,.5,'sawtooth',.12); }
      break;
    case 'beam': // жжёт землю: увернуться можно только прыжком
      b.y=ay-20;
      if(b.t>0.12&&player.vy===0&&Math.abs(psx-b.beamX)<26) hit();
      if(b.t>0.55){ b.st='plate'; b.t=0; beep(880,.12,'triangle',.1);
        b.obs.push({x:camX+psx+Math.min(W*0.8,520),y:gy-16,vx:speed-260,vy:0,r:20,kind:'plate',act:'tramp'}); }
      break;
    case 'plate': // катится золотой диск; пропустил — всё сначала
      b.sx+=(ax-b.sx)*Math.min(1,dt*3); b.y+=(ay-b.y)*Math.min(1,dt*3);
      if(!b.obs.some(o=>o.act)){ b.st='hover'; b.t=0; b.n=0; }
      break;
    case 'stun': b.sx+=(psx+20-b.sx)*Math.min(1,dt*6); b.y=ay; if(b.t>1.7){ b.st='rise'; b.t=0; } break;
    case 'rise': b.sx+=(ax-b.sx)*Math.min(1,dt*2.5); b.y+=(ay-b.y)*Math.min(1,dt*2.5); if(b.t>0.8){ b.st='hover'; b.t=0; b.n=0; } break;
    case 'hurt':
      b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.y+=(ay-b.y)*Math.min(1,dt*3);
      if(b.t>.8){ b.st='hover'; b.t=0; b.n=0; }
      break;
  }
  b.vuln=b.st==='stun'; b.solid=b.st==='stun'&&player.vy>0;
}
// №7 ЦАРЬ ГРИБОВ: прыгает и бьёт волнами, сыплет спорами, телепортируется к грибу.
// Уязвим, когда сел после прыжка и ползёт на гриб. С третьего тычка в броне: сначала раздави солдата, которого он позвал.
function updKing(b,dt,psx,gy,rage){
  if(rage>=2&&b.armorFor!==b.hp){ b.armorFor=b.hp; b.armor=1; }
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
        for(let i=0;i<2;i++) spawnMinion(b.x+160+i*150,gy,arena); // впереди царя, чтобы успеть прицелиться
        showQuote('ЦАРЬ В БРОНЕ: РАЗДАВИ СОЛДАТА 🛡',false); beep(300,.2,'triangle',.1); }
      if(b.t>1.3){ b.st='charge'; b.t=0; }
      break;
    case 'vanish':
      b.y=gy; b.alpha=Math.max(0,1-b.t*3);
      if(b.t>0.5){ b.sx=psx+260; b.st='appear'; b.t=0; beep(1500,.12,'square',.05); }
      break;
    case 'appear':
      b.y=gy; b.alpha=Math.min(1,b.t*4);
      if(b.t>0.35){ b.alpha=1; b.st=b.armor?'summon':'charge'; b.t=0; }
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
  b.vuln=b.st==='land'&&!b.armor;
  b.solid=b.st!=='enter'&&b.st!=='vanish'&&b.st!=='rise';
}
function spawnMinion(x,y,p){
  enemies.push({x,y,w:34,h:42,dir:Math.random()<.5?-1:1,p,dead:0,t:Math.random()*6,type:'walk',vy:0,baseY:y,cd:0.2,royal:1});
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
    if(o.act){ // золотое: прыгни сверху
      if(!player.dead&&player.vy>40&&Math.abs(player.x-o.x)<o.r+26*psc&&player.y>o.y-o.r-36&&player.y<=o.y+o.r+4){ o.dead=1; bossAct(b,o); }
      continue;
    }
    if(!player.dead&&player.inv<=0&&Math.abs(player.x-o.x)<o.r+12*psc&&Math.abs(player.y-20*psc-o.y)<o.r+18*psc){ o.dead=1; hit(); }
  }
  b.obs=b.obs.filter(o=>!o.dead&&o.x>camX-80&&o.x<camX+W+600);
  // контакт с самим боссом
  if(player.dead||!b.solid)return;
  const hh=b.hh*b.scale, top=b.y-hh, dx=Math.abs(player.x-b.x);
  if(b.below){ // бьётся только снизу, макушкой; сбоку и сверху не задевает
    if(player.vy<0&&dx<b.hw*b.scale+16*psc&&player.y-40*psc<b.y+10&&player.y-40*psc>top){ player.vy=120; bossHit(b,b.y); }
    return;
  }
  if(dx<b.hw*b.scale+20*psc&&player.y>top-4&&player.y-40*psc<b.y){
    if(player.vy>60&&player.y<top+30){
      player.vy=JUMP*0.78; player.jumps=maxJumps();
      if(b.vuln) bossHit(b,top); else beep(900,.05,'square',.08); // не время: дзынь
    } else if(b.st!=='hurt'){ hit(); b.st=(b.kind==='plumber'||b.kind==='rooster')?'back':b.kind==='worm'?'dig':'rise'; b.t=0; }
  }
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
  if(b.mini){ b.scale=0.65; b.waves=[]; b.obs=[]; showQuote(MINI_PHASE2[b.kind],true); } // сдулся и меняет атаку
  else showQuote('ТЫЧОК '+(b.max-b.hp)+'/'+b.max+' 👊',true);
  b.st='hurt'; b.t=0; b.vsx=900; b.vy=-520;
}
