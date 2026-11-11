// --- Трубы и тайные комнаты (v43) ---
// Зелёная труба стоит на длинной платформе. Приземлился на её верх: мир откладывается в room.sv, строится комната
// (один пол без ям, кирпичный фон, без врагов, скорость 300; уровень, зона и трек стоят, счёт идёт).
// Выход: гриб возвращается на платформу трубы с 1.5 с неуязвимости; ЧЁРНЫЙ ХОД вместо этого выходит на начале уровня впереди.
// Из консоли: enterRoom('cellar'|'casino'|'back'), exitRoom().
const ROOM_KINDS={
  cellar:{name:'ПОДВАЛ',    icon:'🟩',t:10,tint:'#3a2418'},
  casino:{name:'КАЗИНО',    icon:'🎰',t:12,tint:'#3a1840'},
  back:  {name:'ЧЁРНЫЙ ХОД',icon:'🕳',t:4, tint:'#18283a'},
};
const ROOM_ORDER=['cellar','casino','back'];
const PIPE_W=46, PIPE_H=56, ROOM_SPEED=300;
// Бросок трубы для платформы p. Числа берём из потока платформы R уже после всех прежних, дважды всегда, чтобы поток не зависел от условий.
function pipeRoll(p,R,pz){
  const rp=R(), rk=R();
  if(spar||pz<1||p.w<260||pz-pipeZ<3) return;
  if(rp>=(!daily&&goalDone('rooms')?0.06:0.03)) return;
  pipeZ=pz;
  p.pipe={x:p.x+p.w-100,kind:rk<.45?'cellar':rk<.75?'casino':'back',used:0};
}
// Приземление сверху на трубу: падает, ноги на уровне верха. Бок трубы ничего не делает.
function pipeCheck(dt){
  if(room||boss||player.dead||!running) return;
  for(const p of plats){
    const q=p.pipe; if(!q||q.used) continue;
    const top=p.y-PIPE_H;
    if(player.vy>0&&Math.abs(player.x-q.x)<PIPE_W/2+8&&player.y>=top&&player.y-player.vy*dt<=top+4){ q.used=1; enterRoom(q.kind,p); return; }
  }
}
// Куда выходит ЧЁРНЫЙ ХОД: min(уровень+2, первый уровень с ожидающей ареной), не менее чем на полуровня вперёд; иначе -1
function backTarget(){
  let lim=zoneN+2;
  for(let q=zoneN;q<=zoneN+2;q++) if((bossAt(q)||miniAt(q))&&!bossDone[q]){ lim=Math.min(lim,q); break; }
  return lim-dist/ZONE_LEN>=.5?lim:-1;
}
function enterRoom(kind,pl){
  if(room||boss||player.dead||!running) return;
  let tg=-1;
  if(kind==='back'){ tg=backTarget(); if(tg<0) kind='cellar'; }
  const K=ROOM_KINDS[kind];
  if(!pl) pl=plats.find(q=>q.w<1e6&&player.x>=q.x&&player.x<=q.x+q.w);
  room={kind,t:0,T:K.t,tg,pl,x0:player.x,endX:player.x+ROOM_SPEED*K.t,coins:[],done:0,
    sv:{plats,enemies,pickups,spores,wrenches,arena,camX,speed,px:player.x,py:player.y,slot:slotCharges}};
  const fl=H*0.72;
  plats=[{x:player.x-400,y:fl,w:1e7}]; enemies=[]; pickups=[]; spores=[]; wrenches=[]; arena=null; parts=[]; texts=[]; punches=[];
  speed=ROOM_SPEED; player.y=fl; player.vy=0; player.jumps=maxJumps();
  if(kind==='cellar') for(let k=0;k<4;k++) for(let j=0;j<5;j++) room.coins.push({x:player.x+450+k*650+j*55,y:fl-30-Math.sin(j/4*Math.PI)*(90+k*15),got:0}); // 4 дуги по 5 монет
  if(kind==='casino'){ slotCharges=3; slotBtn.classList.remove('hidden'); if(!spinning) slotLabel(); } // три бесплатных вращения, запас остаётся на выходе
  showQuote('ТАЙНАЯ КОМНАТА: '+K.name+' '+K.icon,true); beep(220,.15,'square',.1); setTimeout(()=>beep(440,.2,'square',.1),120); shake(5,.2);
  track('room:'+kind); metaEvent('room',kind);
}
function updRoom(dt){
  const r=room; r.t+=dt; speed=ROOM_SPEED;
  for(const c of r.coins){
    if(c.got) continue;
    if(mgT>0){ const mx=player.x-c.x, my=player.y-20-c.y, md=Math.hypot(mx,my); if(md<260&&md>1){ c.x+=mx/md*600*dt; c.y+=my/md*600*dt; } }
    if(Math.abs(player.x-c.x)<30&&Math.abs(player.y-20-c.y)<44){ c.got=1; score+=150; popText(c.x,c.y-20,'+150','#ffd84d'); beep(1100,.05,'square',.06); }
  }
  if(r.kind==='casino'&&!r.done&&slotCharges<=0&&!spinning) r.done=1.4; // вращения кончились: пусть успеет прочитать исход
  if(r.done>0){ r.done-=dt; if(r.done<=0) r.done=-1; }
  if(r.done<0||player.x>=r.endX||r.t>=r.T+1) exitRoom();
}
function exitRoom(){
  if(!room) return;
  const r=room, sv=r.sv; room=null;
  parts=[]; texts=[]; punches=[]; spores=[]; wrenches=[];
  if(r.kind==='casino'){ slotCharges=sv.slot; slotBtn.classList.toggle('hidden',slotCharges<=0); if(!spinning&&slotCharges>0) slotLabel(); }
  if(r.kind==='back'&&r.tg>=0){ // выход на начале уровня впереди: платформы впереди строим заново
    dist=r.tg*ZONE_LEN+1;
    for(const k in zoneIdx) if(+k>=r.tg) delete zoneIdx[k]; // счётчики платформ уровней впереди с нуля: забег дня одинаков у всех
    for(const k in bigGiven) if(+k>=r.tg) delete bigGiven[k];
    speed=sv.speed; arena=null; enemies=[]; pickups=[];
    player.y=H*0.72; player.vy=0;
    plats=[{x:player.x-100,y:player.y,w:900}];
    let x=plats[0].x+900; while(x<player.x+W*3) x=addPlat(x);
  } else {
    plats=sv.plats; enemies=sv.enemies; pickups=sv.pickups; spores=sv.spores; wrenches=sv.wrenches; arena=sv.arena; speed=sv.speed;
    const pl=r.pl;
    player.x=pl&&pl.pipe?pl.pipe.x-70:sv.px; player.y=pl?pl.y:sv.py; player.vy=0;
  }
  camX=player.x-Math.min(100,W*0.16);
  player.inv=Math.max(player.inv,1.5); player.jumps=maxJumps();
}
// --- Рисовка ---
function drawPipe(x,y,used){ // x — центр на экране, y — верх платформы
  ctx.save(); ctx.translate(x,y);
  const a=used?'#1f5a33':'#2fa84f', b=used?'#17402a':'#1d7a37', c=used?'#2a7a46':'#5fdc7e';
  ctx.fillStyle=OL; ctx.fillRect(-PIPE_W/2-1,-PIPE_H-1,PIPE_W+2,PIPE_H+1);
  ctx.fillStyle=a; ctx.fillRect(-PIPE_W/2+3,-PIPE_H+14,PIPE_W-6,PIPE_H-14);
  ctx.fillStyle=b; ctx.fillRect(PIPE_W/2-12,-PIPE_H+14,9,PIPE_H-14);
  ctx.fillStyle=OL; ctx.fillRect(-PIPE_W/2-5,-PIPE_H-1,PIPE_W+10,16);
  ctx.fillStyle=a; ctx.fillRect(-PIPE_W/2-4,-PIPE_H,PIPE_W+8,14);
  ctx.fillStyle=c; ctx.fillRect(-PIPE_W/2-2,-PIPE_H+2,5,10);
  ctx.fillStyle=b; ctx.fillRect(PIPE_W/2-3,-PIPE_H+2,7,12);
  ctx.restore();
}
const roomPat={};
function roomPattern(kind){ // кирпичный узор 112x56, кэш по комнате
  if(roomPat[kind]) return roomPat[kind];
  const c=document.createElement('canvas'); c.width=112; c.height=56; const g=c.getContext('2d');
  g.fillStyle=ROOM_KINDS[kind].tint; g.fillRect(0,0,112,56); g.strokeStyle='rgba(0,0,0,.45)'; g.lineWidth=3;
  for(let r=0;r<2;r++){ const y=r*28, o=r?28:0; g.strokeRect(-o+0.5,y+0.5,56,28); g.strokeRect(-o+56.5,y+0.5,56,28); g.strokeRect(-o+112.5,y+0.5,56,28); }
  return roomPat[kind]=ctx.createPattern(c,'repeat');
}
function drawRoomBg(t){
  ctx.fillStyle='#0a0608'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.translate(-((camX*0.5)%112),0); ctx.fillStyle=roomPattern(room.kind); ctx.fillRect(0,0,W+112,H); ctx.restore();
  ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(0,0,W,H);
}
function drawRoom(t){
  const r=room, K=ROOM_KINDS[r.kind];
  for(const c of r.coins){
    if(c.got) continue;
    const bob=Math.sin(t*5+c.x*.01)*3;
    ctx.fillStyle=OL; ctx.beginPath(); ctx.arc(c.x-camX,c.y+bob,11,0,7); ctx.fill();
    ctx.fillStyle='#ffd84d'; ctx.beginPath(); ctx.arc(c.x-camX,c.y+bob,9,0,7); ctx.fill();
    ctx.fillStyle='#fff3a8'; ctx.fillRect(c.x-camX-3,c.y+bob-6,3,8);
  }
  drawPipe(r.endX-camX,H*0.72,0); // выходная труба
  ctx.textAlign='center'; ctx.font='bold '+Math.max(18,Math.round(14/S))+'px monospace'; ctx.fillStyle='#fff'; ctx.strokeStyle='#000'; ctx.lineWidth=4;
  const s=K.icon+' '+K.name+' '+Math.max(0,Math.ceil(r.T-r.t));
  ctx.strokeText(s,W/2,Math.round(H*0.2)); ctx.fillText(s,W/2,Math.round(H*0.2)); ctx.textAlign='left';
}
