// --- Мини-боссы ---
// С 12-го уровня с шансом 30% вместо обычной зоны: арена и правила как у боссов, но 3 тычка и зона не сбрасывается.
const MINI_KINDS=[
  {name:'ОКСИ',   kind:'oxy',   hp:3,mini:1,line:'ОКСИ ЗАЧИТЫВАЕТ 📖'},
  {name:'ШОК',    kind:'shock', hp:3,mini:1,line:'ШОК-КОНТЕНТ ⚡'},
  {name:'ГНОЙНЫЙ',kind:'gnoy',  hp:3,mini:1,line:'ГНОЙНЫЙ НА СВЯЗИ 🟢'},
  {name:'ТАНЦОР', kind:'dancer',hp:3,mini:1,line:'ТАНЦПОЛ ОТКРЫТ 🕺'},
];
let miniPlan={}, miniBag=[];
function miniAt(z){
  if(z in miniPlan) return miniPlan[z];
  const on=charMode==='BATTLE'?z>0&&z%2===0&&z%10!==9:z>10&&z%10!==9&&Math.random()<0.3;
  if(on&&!miniBag.length){ miniBag=[0,1,2,3]; for(let j=3;j>0;j--){ const r=(Math.random()*(j+1))|0; [miniBag[j],miniBag[r]]=[miniBag[r],miniBag[j]]; } }
  return miniPlan[z]=on?MINI_KINDS[miniBag.pop()]:null;
}
Object.assign(BOSS_SIZE,{oxy:[28,88],shock:[28,88],gnoy:[28,88],dancer:[28,96]});
Object.assign(BOSS_TIP,{
  oxy:'НИЗКОЕ СЛОВО — ПРЫГАЙ, ВЫСОКОЕ — СТОЙ ⭐',
  shock:'РАЗРЯДЫ НА ЗЕМЛЕ ПЕРЕПРЫГИВАЙ, ПОТОМ БЕЙ ⭐',
  gnoy:'ЛУЖИ ПЕРЕПРЫГИВАЙ, БЕЖИТ — ПРЫГАЙ НА ГОЛОВУ ⭐',
  dancer:'ВОЛНУ ПЕРЕПРЫГНИ, ЛУННАЯ ПОХОДКА — БЕЙ ⭐',
});
const MINI_WORDS=['ФЛОУ','ПАНЧ','РИФМА','БИФ','ДИСС','ХАЙП','СМЫСЛ','ВЕРСУС'];
function miniEnter(b,dt,gy,next){ b.sx+=(W*.72-b.sx)*Math.min(1,dt*3); b.vy+=G*dt; b.y+=b.vy*dt; if(b.y>=gy){ b.y=gy; b.vy=0; shake(10,.25); b.st=next; b.t=0; b.n=0; } }
function miniHurt(b,dt,gy){ b.sx+=b.vsx*dt; b.vsx*=Math.pow(.08,dt); b.vy+=G*dt; b.y+=b.vy*dt; if(b.y>=gy){ b.y=gy; b.vy=0; } if(b.t>.8){ b.st='rise'; b.t=0; } }
function miniRise(b,dt,gy,next){ b.y=gy; b.sx+=(W*.72-b.sx)*Math.min(1,dt*3); if(b.t>.7){ b.st=next; b.t=0; b.n=0; } }
function miniRun(b,dt,psx,v){ b.sx-=v*dt; if(b.sx<psx-110){ b.st='rise'; b.t=0; } }
// ОКСИ читает: слова летят на двух высотах, потом идёт на гриб с микрофоном
function updOxy(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter': miniEnter(b,dt,gy,'read'); break;
    case 'read':
      b.y=gy; b.sx+=(W*.72-b.sx)*Math.min(1,dt*4);
      if(b.t>.95){ b.t=0; b.n++; const low=b.n===1||Math.random()<.55;
        b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-300,vy:0,r:low?15:17,kind:low?'bubL':'bubH',txt:MINI_WORDS[(Math.random()*MINI_WORDS.length)|0]});
        beep(low?320:560,.08,'triangle',.1);
        if(b.n>=3+rage){ b.st='wait'; b.t=0; } }
      break;
    case 'wait': b.y=gy; if(b.t>.4&&!obsAhead()){ b.st='run'; b.t=0; } break;
    case 'run': b.y=gy; miniRun(b,dt,psx,250+rage*30); break;
    case 'hurt': miniHurt(b,dt,gy); break;
    case 'rise': miniRise(b,dt,gy,'read'); break;
  }
  b.vuln=b.st==='run'; b.solid=b.st!=='enter';
}
// ШОК: разряды ложатся на землю с шагом больше длины прыжка, разрядился — идёт на гриб
function updShock(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter': miniEnter(b,dt,gy,'zap'); break;
    case 'zap':
      b.y=gy; b.sx+=(W*.72-b.sx)*Math.min(1,dt*4);
      if(b.t>.9){ b.t=0; b.n++; b.obs.push({x:camX+W+40,y:gy-14,vx:0,vy:0,r:14,kind:'spark'}); shake(4,.1); beep(1800,.06,'sawtooth',.06);
        if(b.n>=3+rage){ b.st='wait'; b.t=0; } }
      break;
    case 'wait': b.y=gy; if(b.t>.4&&!obsAhead()){ b.st='run'; b.t=0; } break;
    case 'run': b.y=gy; miniRun(b,dt,psx,270+rage*30); break;
    case 'hurt': miniHurt(b,dt,gy); break;
    case 'rise': miniRise(b,dt,gy,'zap'); break;
  }
  b.vuln=b.st==='run'; b.solid=b.st!=='enter';
}
// ГНОЙНЫЙ: лужи гноя лежат на земле, потом бежит, с первого тычка с финтом
function updGnoy(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter': miniEnter(b,dt,gy,'lob'); break;
    case 'lob':
      b.y=gy; b.sx+=(W*.72-b.sx)*Math.min(1,dt*4);
      if(b.t>.9){ b.t=0; b.n++; b.obs.push({x:b.x,y:b.y-b.hh*.8,vx:0,vy:-420,r:13,kind:'goo',grav:1}); beep(240,.08,'sawtooth',.08);
        if(b.n>=3+rage){ b.st='wait'; b.t=0; } }
      break;
    case 'wait': b.y=gy; if(b.t>.4&&!obsAhead()){ b.st='run'; b.t=0; b.fdone=rage<1; } break;
    case 'run':
      b.y=gy;
      if(!b.fdone&&b.sx<psx+320){ b.st='feint'; b.t=0; b.fdone=true; break; }
      miniRun(b,dt,psx,b.fdone&&rage>=1?340:280);
      break;
    case 'feint': b.y=gy; if(b.t>.5){ b.st='run'; b.t=0; } break;
    case 'hurt': miniHurt(b,dt,gy); break;
    case 'rise': miniRise(b,dt,gy,'lob'); break;
  }
  b.vuln=b.st==='run'||b.st==='feint'; b.solid=b.st!=='enter';
}
// ТАНЦОР: качается и пускает диски, крутится (волна) и уезжает лунной походкой на гриб
function updDancer(b,dt,psx,gy,rage){
  switch(b.st){
    case 'enter': miniEnter(b,dt,gy,'dance'); break;
    case 'dance':
      b.sx+=(W*.72+Math.sin(b.t*3)*W*.08-b.sx)*Math.min(1,dt*4); b.y=gy-Math.abs(Math.sin(b.t*6))*26;
      if((b.lt=(b.lt||0)+dt)>.95){ b.lt=0; b.n++; const low=b.n%2===1;
        b.obs.push({x:b.x-b.hw,y:low?gy-20:gy-100,vx:speed-320,vy:0,r:16,kind:low?'ringL':'ringH'}); beep(low?660:990,.08,'square',.08);
        if(b.n>=3+rage){ b.st='spin'; b.t=0; b.y=gy; } }
      break;
    case 'spin': b.y=gy; b.rot=b.t*18;
      if(b.t>.7){ b.rot=0; b.waves.push({sx:b.sx-b.hw,d:-1},{sx:b.sx+b.hw,d:1}); shake(8,.2); beep(90,.2,'square',.14); b.st='wait'; b.t=0; }
      break;
    case 'wait': b.y=gy; if(b.t>.5&&!obsAhead()&&!b.waves.length){ b.st='moon'; b.t=0; } break;
    case 'moon': b.y=gy; miniRun(b,dt,psx,240+rage*30); break;
    case 'hurt': b.rot=0; miniHurt(b,dt,gy); break;
    case 'rise': miniRise(b,dt,gy,'dance'); break;
  }
  b.vuln=b.st==='moon'; b.solid=b.st!=='enter';
}
Object.assign(BOSS_UPD,{oxy:updOxy,shock:updShock,gnoy:updGnoy,dancer:updDancer});
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
Object.assign(BOSS_DRAW,{oxy:drawOxy,shock:drawShock,gnoy:drawGnoy,dancer:drawDancer});
function drawMiniObs(o,x,t){
  if(o.kind==='spark'){ ctx.strokeStyle='#ffe14d'; ctx.lineWidth=3; const j=Math.sin(t*40+o.x)*4; ctx.beginPath(); ctx.moveTo(x-12,o.y+14); ctx.lineTo(x-3+j,o.y-4); ctx.lineTo(x+2-j,o.y+6); ctx.lineTo(x+12,o.y-14); ctx.stroke(); ctx.fillStyle='rgba(122,215,255,.35)'; ctx.beginPath(); ctx.arc(x,o.y,o.r+4,0,7); ctx.fill(); return; }
  if(o.kind==='goo'){ ctx.fillStyle='#7ccf2e'; ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,o.y+3,o.r+3,o.r*.7,0,0,7); ctx.fill(); ctx.stroke(); return; }
  ctx.font="900 13px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center'; ctx.lineWidth=4; ctx.strokeStyle='#10060c'; ctx.fillStyle=o.kind==='bubL'?'#ff7aa8':'#7ad7ff';
  ctx.strokeText(o.txt,x,o.y+5); ctx.fillText(o.txt,x,o.y+5); ctx.textAlign='left';
}
