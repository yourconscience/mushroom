// --- Мини-боссы ---
// На 4-м уровне (лёгкий: два тычка, но атаки только первой фазы, медленнее и с паузами подлиннее), потом по одному в каждом блоке между боссами на случайном уровне; в режиме БАТТЛ на каждом 4-м. Два тычка: после первого уменьшается и меняет атаку.
const MINI_KINDS=[
  {name:'ОКСИ',   kind:'oxy',   hp:2,mini:1,line:'ОКСИ ЗАЧИТЫВАЕТ 📖'},
  {name:'ШОК',    kind:'shock', hp:2,mini:1,line:'ШОК-КОНТЕНТ ⚡'},
  {name:'ГНОЙНЫЙ',kind:'gnoy',  hp:2,mini:1,line:'ГНОЙНЫЙ НА СВЯЗИ 🟢'},
  {name:'ТАНЦОР', kind:'dancer',hp:2,mini:1,line:'ТАНЦПОЛ ОТКРЫТ 🕺'},
  {name:'РИКИ Ф', kind:'ricky', hp:2,mini:1,line:'РИКИ Ф НА БИТЕ 🎧'},
];
let miniPlan={}, miniBag=[], miniR=null, miniBlk=1; // miniBlk: с какого блока между боссами ещё не разыграно
function miniKind(){
  if(!miniBag.length){ miniBag=MINI_KINDS.map((_,i)=>i); const R=miniR||(miniR=rngFor('mini')); for(let j=miniBag.length-1;j>0;j--){ const r=(R()*(j+1))|0; [miniBag[j],miniBag[r]]=[miniBag[r],miniBag[j]]; } }
  return MINI_KINDS[miniBag.pop()];
}
function miniAt(z){
  if(z in miniPlan) return miniPlan[z];
  if(charMode==='BATTLE') return miniPlan[z]=z%4===3&&z%7!==6?miniKind():null;
  if(z===3) return miniPlan[z]={...miniKind(),easy:1}; // лёгкая форма: те же два тычка, но атаки мягче
  // блок b: уровни 7b+1..7b+6 (индексы 7b..7b+5), мини-босс на уровне 7b+2..7b+5; блоки разыгрываем строго по порядку
  for(;miniBlk<=((z/7)|0);miniBlk++){ const R=miniR||(miniR=rngFor('mini')); miniPlan[7*miniBlk+1+((R()*4)|0)]=miniKind(); }
  return z in miniPlan?miniPlan[z]:(miniPlan[z]=null);
}
Object.assign(BOSS_SIZE,{oxy:[28,88],shock:[28,88],gnoy:[28,88],dancer:[28,96],ricky:[28,88]});
Object.assign(BOSS_TIP,{
  oxy:'НИЗКОЕ СЛОВО — ПРЫГАЙ, ВЫСОКОЕ — СТОЙ. ПОШЁЛ НА ГРИБ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  shock:'РАЗРЯДЫ ПЕРЕПРЫГИВАЙ. ПОШЁЛ НА ГРИБ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  gnoy:'ЛУЖИ ПЕРЕПРЫГИВАЙ. ПОБЕЖАЛ НА ГРИБ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  dancer:'ДИСКИ И ВОЛНУ ПЕРЕЖДИ. ПОЕХАЛ НА ГРИБ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  ricky:'ФФФ НИЗКО — ПРЫГАЙ, ВЫСОКО — СТОЙ. ПОШЁЛ НА ГРИБ — ПРЫГАЙ НА ГОЛОВУ ⭐',
});
const MINI_PHASE2={
  oxy:'СДУЛСЯ И ЧИТАЕТ ВРАЗНОБОЙ 📖',
  shock:'МАЛЕНЬКИЙ, НО ПОЛ ПОД ТОКОМ: ВСПЫШКА — В ПРЫЖОК ⚡',
  gnoy:'СДУЛСЯ И ПУСКАЕТ ГАЗЫ 💨',
  dancer:'МЕНЬШЕ, НО ЗЛЕЕ: ДИСКИ И ВОЛНЫ 🕺',
  ricky:'СДУЛСЯ И КАЧАЕТ ПОЛ: ВОЛНЫ 🎧',
};
const MINI_WORDS=['ФЛОУ','ПАНЧ','РИФМА','БИФ','ДИСС','ХАЙП','СМЫСЛ','ВЕРСУС'];
// Приёмы: от каждого хватает одного прыжка, паузы между ними длиннее прыжка (0.73 с)
function miniWord(b,low,txt){ b.obs.push({x:b.x-b.hw,y:low?b.gy-20:b.gy-100,vx:speed-rand(240,340)*(b.easy?.8:1),vy:0,r:low?15:17,kind:low?'bubL':'bubH',txt:txt||MINI_WORDS[(Math.random()*MINI_WORDS.length)|0]}); beep(low?320:560,.08,'triangle',.1); }
function miniSpark(b){ b.obs.push({x:camX+W+rand(20,120),y:b.gy-14,vx:0,vy:0,r:14,kind:'spark'}); shake(4,.1); beep(1800,.06,'sawtooth',.06); }
function miniPulse(b){ b.st='pulse'; b.t=0; }
function miniGoo(b){ b.obs.push({x:b.x,y:b.y-b.hh*.8,vx:rand(-50,50),vy:rand(-470,-360),r:13,kind:'goo',grav:1}); beep(240,.08,'sawtooth',.08); }
function miniGas(b){ b.obs.push({x:b.x-b.hw,y:b.gy-36,vx:speed-rand(220,300)*(b.easy?.8:1),vy:0,r:28,kind:'gas'}); beep(160,.2,'sawtooth',.08); }
function miniDisc(b){ const low=chance(.55); b.obs.push({x:b.x-b.hw,y:low?b.gy-20:b.gy-100,vx:speed-rand(260,340)*(b.easy?.8:1),vy:0,r:16,kind:low?'ringL':'ringH'}); beep(low?660:990,.08,'square',.08); }
function miniWave(b){ b.waves.push({sx:b.sx-b.hw,d:-1}); b.rot=6; shake(6,.15); beep(90,.2,'square',.14); }
const MINI_MOVES={ // [до тычка, после тычка]
  oxy:   [[b=>miniWord(b,true),b=>miniWord(b,false)],[b=>miniWord(b,true),b=>miniWord(b,true),b=>miniWord(b,false)]],
  shock: [[miniSpark],[miniSpark,miniSpark,miniPulse]],
  gnoy:  [[miniGoo],[miniGoo,miniGas,miniGas]],
  dancer:[[miniDisc,miniDisc,miniWave],[miniDisc,miniWave,miniWave]],
  ricky: [[b=>miniWord(b,true,'ФФФ'),b=>miniWord(b,false,'ФФФ')],[b=>miniWord(b,true,'ФФФ'),b=>miniWord(b,false,'ФФФ'),miniWave]],
};
const miniAnchor=(b,dt)=>{ b.sx+=(Math.min(W*(b.ax||.72),player.x-camX+560)-b.sx)*Math.min(1,dt*4); };
function miniRound(b){ b.st='act'; b.t=0; b.n=0; b.cnt=b.easy?randi(1,2):chance(.25)?0:randi(1,2); b.gap=rand(.5,1)+(b.easy?.35:0); b.ax=rand(.66,.78); } // у полной формы иногда сразу идёт на гриб, у лёгкой всегда сначала одна-две атаки
// Мини-босс телом не бьёт: упал сверху — тычок, не попал — пробежит насквозь, уйдёт за экран и вернётся справа.
// У лёгкой формы пул приёмов и после тычка первый (rage&&!b.easy).
function updMini(b,dt,psx,gy,rage){
  if(b.rot>0) b.rot=Math.max(0,b.rot-dt*14);
  switch(b.st){
    case 'enter':
      b.sx+=(W*.72-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt;
      if(b.y>=gy){ b.y=gy; b.vy=0; shake(10,.25); miniRound(b); }
      break;
    case 'act':
      miniAnchor(b,dt); b.y=b.kind==='dancer'?gy-Math.abs(Math.sin(b.t*6))*20:gy;
      if(b.n>=b.cnt){ b.y=gy; b.st='wait'; b.t=0; b.rdy=rand(.3,.8); break; }
      if(b.t>b.gap){ b.t=0; b.n++; b.gap=rand(1.05,1.6)+(b.easy?.35:0); const pool=MINI_MOVES[b.kind][rage&&!b.easy?1:0]; pool[(Math.random()*pool.length)|0](b); }
      break;
    case 'pulse': // весь пол под током: на вспышке надо быть в воздухе
      b.y=gy; miniAnchor(b,dt); b.live=b.t>.85&&b.t<1.1;
      if(b.t>.97&&b.t<1.1&&player.vy===0) hit();
      if(b.t>1.35){ b.live=false; b.st='act'; b.t=0; b.gap=rand(.9,1.4); shake(5,.12); beep(1500,.08,'sawtooth',.08); }
      break;
    case 'wait': b.y=gy; if(b.t>b.rdy&&!obsAhead()&&!b.waves.length){ b.st='run'; b.t=0; rushStart(b,205,psx); b.fk=chance(.35); } break;
    case 'run': b.y=gy; bossRush(b,dt); if(b.sx<psx-110){ b.st='rise'; b.t=0; b.sx=W+80; } break;
    case 'hurt': b.rot=0; b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.vy+=G*dt; b.y+=b.vy*dt; if(b.y>=gy){ b.y=gy; b.vy=0; } if(b.t>.8){ b.st='rise'; b.t=0; } break;
    case 'rise': b.y=gy; miniAnchor(b,dt); if(b.t>.7) miniRound(b); break;
  }
  b.vuln=b.st==='run'; b.solid=b.vuln;
}
Object.assign(BOSS_UPD,{oxy:updMini,shock:updMini,gnoy:updMini,dancer:updMini,ricky:updMini});
// рисовка: общий человечек, поверх него приметы каждого
function miniDude(body,skin,label,t){
  const bob=Math.sin(t*9)*1.5;
  ob(-22,-58+bob,44,58-bob,body);
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(10,-58+bob,12,58-bob);
  ob(-16,-86+bob,32,28,skin);
  ctx.fillStyle='#222'; ctx.fillRect(-11,-76+bob,6,5); ctx.fillRect(3,-76+bob,6,5);
  ctx.fillStyle='#fff'; ctx.font="800 8px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center'; ctx.fillText(label,0,-30+bob); ctx.textAlign='left';
  return bob;
}
function drawOxy(b,t){
  const y=miniDude('#15151c','#e8c3a0','ОКСИ',t);
  ob(-18,-92+y,36,10,'#15151c');                                    // капюшон
  ctx.strokeStyle='#ddd'; ctx.lineWidth=1.5; ctx.strokeRect(-13,-78+y,10,8); ctx.strokeRect(1,-78+y,10,8);   // очки
  ob(-30,-52+y,5,16,'#333'); ctx.fillStyle='#888'; ctx.beginPath(); ctx.arc(-27.5,-56+y,5,0,7); ctx.fill();  // микрофон
}
function drawShock(b,t){
  const y=miniDude('#ffd21f','#e8c3a0','ШОК',t);
  ob(-18,-92+y,36,9,'#111'); ob(10,-88+y,16,5,'#111');              // кепка
  if(b.st!=='run'){ ctx.strokeStyle='#7ad7ff'; ctx.lineWidth=2; for(let i=0;i<3;i++){ const a=t*14+i*2.1, x=Math.cos(a)*34, yy=-50+Math.sin(a*1.3)*34;
    ctx.beginPath(); ctx.moveTo(x,yy); ctx.lineTo(x+6,yy+8); ctx.lineTo(x-2,yy+11); ctx.lineTo(x+4,yy+20); ctx.stroke(); } }
}
function drawGnoy(b,t){
  const y=miniDude('#7ccf2e','#d9e6c0','ГНОЙНЫЙ',t);
  ob(-18,-92+y,36,10,'#5a9c1f');                                    // капюшон
  ob(-16,-68+y,32,9,'#111');                                        // балаклава снизу
  ctx.fillStyle='rgba(124,207,46,.8)'; for(let i=0;i<3;i++){ const k=(t*1.4+i/3)%1; ctx.beginPath(); ctx.arc(-16+i*16,-4+k*6,3.5*(1-k),0,7); ctx.fill(); }  // капает
}
function drawDancer(b,t){
  if(b.rot) ctx.scale(Math.cos(b.rot),1);
  const y=miniDude('#ff3dc8','#e8c3a0','ТАНЦОР',t);
  ctx.fillStyle='#2a1a10'; ctx.beginPath(); ctx.arc(0,-90+y,23,Math.PI,0); ctx.fill();  // афро
  ctx.fillStyle='#d0d6e0'; ctx.beginPath(); ctx.arc(0,-124,10,0,7); ctx.fill();          // диско-шар
  ctx.fillStyle='hsl('+((t*200)%360|0)+',90%,65%)'; for(let i=0;i<4;i++) ctx.fillRect(Math.cos(t*4+i*1.57)*7-1.5,-124+Math.sin(t*4+i*1.57)*7-1.5,3,3);
}
function drawRicky(b,t){
  const y=miniDude('#2b2f8f','#e8c3a0','РИКИ Ф',t);
  ctx.strokeStyle='#111'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,-78+y,20,Math.PI,0); ctx.stroke();  // наушники
  ob(-24,-82+y,8,16,'#ffd84d'); ob(16,-82+y,8,16,'#ffd84d');
  ctx.strokeStyle='#ffd84d'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.arc(0,-58+y,13,.25,Math.PI-.25); ctx.stroke();  // цепь
}
Object.assign(BOSS_DRAW,{oxy:drawOxy,shock:drawShock,gnoy:drawGnoy,dancer:drawDancer,ricky:drawRicky});
function drawMiniObs(o,x,t){
  if(o.kind==='spark'){ ctx.strokeStyle='#ffe14d'; ctx.lineWidth=3; const j=Math.sin(t*40+o.x)*4; ctx.beginPath(); ctx.moveTo(x-12,o.y+14); ctx.lineTo(x-3+j,o.y-4); ctx.lineTo(x+2-j,o.y+6); ctx.lineTo(x+12,o.y-14); ctx.stroke(); ctx.fillStyle='rgba(122,215,255,.35)'; ctx.beginPath(); ctx.arc(x,o.y,o.r+4,0,7); ctx.fill(); return; }
  if(o.kind==='gas'){ ctx.globalAlpha=.75; ctx.fillStyle='#9fd64a'; for(const [dx,dy,r] of [[-18,6,22],[14,8,24],[0,-14,28]]){ ctx.beginPath(); ctx.arc(x+dx,o.y+dy+Math.sin(t*5+dx)*3,r,0,7); ctx.fill(); } ctx.globalAlpha=1; return; }
  if(o.kind==='goo'){ ctx.fillStyle='#7ccf2e'; ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,o.y+3,o.r+3,o.r*.7,0,0,7); ctx.fill(); ctx.stroke(); return; }
  ctx.font="900 13px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#10060c'; ctx.fillStyle=o.kind==='bubL'?'#ff7aa8':'#7ad7ff';
  ctx.strokeText(o.txt,x,o.y+5); ctx.fillText(o.txt,x,o.y+5); ctx.textAlign='left';
}
