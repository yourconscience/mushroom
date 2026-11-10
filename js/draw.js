// --- Фон: панельки ---
// детерминированный псевдошум по целому сиду — фон не мерцает
function rnd(n){ n=(n*374761393+1)|0; n=Math.imul(n^(n>>>13),1274126177); return ((n^(n>>>16))>>>0)/4294967296; }

// фон и текстуры платформ: см. gfx.js (слои кэшируются по зоне и размеру экрана)
const gfx=makeGfx(rnd);
function drawBg(t){
  const warm=running&&dist%ZONE_LEN>ZONE_LEN*0.5?(zoneI+1)%ZONES.length:-1; // следующий фон строим заранее
  gfx.bg(ctx,W,H,zoneI||0,camX||0,t,warm);
}

// --- Рисовка гриба ---
const OL='#10060c';
function ob(x,y,w,h,c){ ctx.fillStyle=OL; ctx.fillRect(x-1,y-1,w+2,h+2); ctx.fillStyle=c; ctx.fillRect(x,y,w,h); }
function fs(c){ ctx.fillStyle=c; ctx.fill(); ctx.stroke(); } // заливка + тёмный контур
function drawGrib(p,t){
  if(p.inv>0&&((t*20)|0)%2)return; // мигаем при неуязвимости
  ctx.save(); ctx.translate(p.x-camX,p.y);
  if(charMode==='GLASS')ctx.globalAlpha=0.55;
  if(ghostT>0)ctx.globalAlpha=0.5; // призрак: полупрозрачный
  if(charMode==='PUFF')ctx.scale(1.18,1.1);
  if(p.big)ctx.scale(1.35,1.35);
  const sq=p.squish; ctx.scale(1-sq*.6,1+sq);
  const blink=(t%3.6)<0.12;
  // ножка
  ctx.fillStyle=OL; ctx.fillRect(-11.5,-19.5,23,20);
  ctx.fillStyle='#f5e9d0'; ctx.fillRect(-10,-18,20,18);
  ctx.fillStyle='#dccba6'; ctx.fillRect(4,-18,6,18); ctx.fillRect(-10,-2,20,2);
  // глаза
  const ey=blink?-10.5:-14, eh=blink?1.5:6;
  ctx.fillStyle='#222'; ctx.fillRect(-7,ey,4,eh); ctx.fillRect(3,ey,4,eh);
  if(!blink){ ctx.fillStyle='#fff'; ctx.fillRect(-6,-13,1.5,1.5); ctx.fillRect(4,-13,1.5,1.5); }
  ctx.fillStyle='rgba(255,110,110,.5)'; ctx.fillRect(-10,-8,4,2); ctx.fillRect(6,-8,4,2);
  // шляпка: обводка, тень, свет
  ctx.fillStyle=OL;
  ctx.beginPath(); ctx.ellipse(0,-20,21.5,14.5,0,Math.PI,0); ctx.fill();
  ctx.fillRect(-21.5,-21.5,43,7.5);
  const sh=(t*400)%360|0, stc=starT>0; // звезда: шляпка переливается
  ctx.fillStyle=stc?'hsl('+sh+',85%,38%)':meta.top?'#b8902a':'#b82432';
  ctx.beginPath(); ctx.ellipse(0,-20,20,13,0,Math.PI,0); ctx.fill();
  ctx.fillRect(-20,-20,40,4);
  ctx.fillStyle=stc?'hsl('+sh+',90%,60%)':meta.top?'#ffd84d':'#e63946';
  ctx.beginPath(); ctx.ellipse(-1.5,-21,18.5,12,0,Math.PI,0); ctx.fill();
  ctx.fillRect(-20,-21,38,3);
  // точки
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.arc(-8,-26,3.4,0,7); ctx.arc(8,-25,3,0,7); ctx.arc(0,-30,2.6,0,7); ctx.fill();
  // блик на шляпке (мерцает)
  ctx.globalAlpha=.35+.2*Math.sin(t*3);
  ctx.beginPath(); ctx.ellipse(-12.5,-30,4.5,2,-.6,0,7); ctx.fill();
  ctx.fillRect(-5,-34,2,1.5);
  ctx.globalAlpha=1;
  ctx.restore();
}
// --- Враги ---
const SKINS={
  walk: {cap:'#d62828', body:'#2a5fd0', letter:'М'},
  slide:{cap:'#4cc9f0', body:'#1b3b5e', letter:'Л'},
  hop:  {cap:'#ffd700', body:'#7a0f3f', letter:'$'},
  thrower:{cap:'#ff9f1c', body:'#2d6a4f', letter:'К'},
};
function drawEnemy(e,t){
  ctx.save(); ctx.translate(e.x-camX,e.y);
  if(zapT>0)ctx.scale(.6,.6); // молния: враги 60% размера
  if(e.dead){ ctx.scale(1,0.25); ctx.globalAlpha=Math.max(0,1-e.dead*2); }
  ctx.scale(e.dir,1);
  if(e.type==='hop'&&e.wait>0)ctx.scale(1.12,0.82); // присел перед прыжком
  ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.lineJoin='round';
  if(e.type==='fly'){
    // голубь
    const flap=Math.sin(t*16+e.t)*9;
    ctx.beginPath(); ctx.ellipse(0,-14,15,10,0,0,7); fs('#9a9aae');
    ctx.fillStyle='#b9b9cc'; ctx.beginPath(); ctx.ellipse(3,-11,9,4.5,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(13,-22,7,0,7); fs('#9a9aae');
    ctx.fillStyle='#78c8a0'; ctx.fillRect(8,-18,4,2);
    ob(19,-23,7,3,'#ff8c42');
    ctx.fillStyle='#222'; ctx.fillRect(14,-25,3,3); ctx.fillStyle='#fff'; ctx.fillRect(15,-25,1,1);
    ctx.beginPath(); ctx.moveTo(-4,-16); ctx.lineTo(-14,-26-flap); ctx.lineTo(4,-18); ctx.closePath(); fs('#6e6e85');
    ob(-3,-9,4,4,'#4cc9f0');
    ctx.restore(); return;
  }
  if(e.type==='spike'){
    // ёж
    for(let i=0;i<7;i++){ const sx=-16+i*5; ctx.beginPath(); ctx.moveTo(sx-4,-14); ctx.lineTo(sx+0.5,-30-(i%2)*4); ctx.lineTo(sx+5,-14); ctx.closePath(); fs('#4a2f1d'); }
    ctx.beginPath(); ctx.ellipse(-2,-12,17,12,0,0,7); fs('#8a5a3c');
    ctx.fillStyle='rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(-2,-7,14,5,0,0,7); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.22)'; ctx.beginPath(); ctx.ellipse(-8,-18,6,2.5,-.3,0,7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(14,-9,8,6,0,0,7); fs('#e8c9a0');
    const bl=((t+e.t)%3.4)<0.12;
    ctx.fillStyle='#222'; ctx.fillRect(10,bl?-12:-14,3,bl?1:3); ctx.fillRect(20,-11,3,3);
    if(!bl){ ctx.fillStyle='#fff'; ctx.fillRect(11,-14,1,1); }
    ob(-12,-3,5,3,'#d62828'); ob(4,-3,5,3,'#d62828');
    ctx.restore(); return;
  }
  if(e.type==='dive'){
    // пикирующий голубь: тёмно-фиолетовый, злые брови, крылья складываются в пике
    if(e.dv)ctx.rotate(Math.atan2(e.dvy,Math.abs(e.dvx)));
    const flap=e.dv?-6:Math.sin(t*12+e.t)*7;
    ctx.beginPath(); ctx.ellipse(0,-16,16,9,0,0,7); fs('#4b2a78');
    ctx.fillStyle='#6a42a0'; ctx.beginPath(); ctx.ellipse(3,-13,10,4,0,0,7); ctx.fill();
    ctx.beginPath(); ctx.arc(14,-18,7,0,7); fs('#4b2a78');
    ctx.beginPath(); ctx.moveTo(20,-20); ctx.lineTo(29,-17); ctx.lineTo(20,-15); ctx.closePath(); fs('#ffd23f');
    ctx.fillStyle='#fff'; ctx.fillRect(15,-23,5,3); ctx.fillStyle='#c1121f'; ctx.fillRect(16,-21,3,3);
    ctx.beginPath(); ctx.moveTo(-6,-18); ctx.lineTo(-18,-34-flap); ctx.lineTo(4,-20); ctx.closePath(); fs('#7a4fc0');
    ctx.beginPath(); ctx.moveTo(-6,-14); ctx.lineTo(-18,2+flap); ctx.lineTo(4,-13); ctx.closePath(); fs('#7a4fc0');
    ob(-20,-17,6,4,'#ff2d78');
    if(e.aim>0){ ctx.fillStyle='#ff3d3d'; ctx.font='bold 22px monospace'; ctx.fillText('!',-5,-40); }
    ctx.restore(); return;
  }
  const sk=SKINS[e.type]||SKINS.walk;
  const bob=e.type==='hop'?0:Math.sin(t*10+e.t)*2;
  ob(-12,-26+bob,24,26-bob,sk.body);
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.fillRect(4,-26+bob,8,26-bob);
  ob(-10,-38+bob,20,14,'#f0b27a');
  ctx.fillStyle='rgba(0,0,0,.12)'; ctx.fillRect(6,-38+bob,4,10);
  const blk=((t+e.t)%3.2)<0.12;
  ctx.fillStyle='#fff'; ctx.fillRect(-6,blk?-33+bob:-35+bob,4,blk?1:4); ctx.fillRect(2,blk?-33+bob:-35+bob,4,blk?1:4);
  if(!blk){ ctx.fillStyle='#222'; ctx.fillRect(-4,-34+bob,2,2); ctx.fillRect(4,-34+bob,2,2); }
  ctx.fillStyle='#d9965f'; ctx.fillRect(-1,-32+bob,3,3);
  ctx.fillStyle='#3d2b1f'; ctx.fillRect(-9,-29+bob,18,4);
  ob(-12,-44+bob,24,8,sk.cap); ob(2,-42+bob,16,5,sk.cap);
  ctx.fillStyle='rgba(255,255,255,.3)'; ctx.fillRect(-12,-44+bob,24,2);
  ctx.fillStyle='rgba(0,0,0,.2)'; ctx.fillRect(-12,-38+bob,24,2);
  ctx.fillStyle=e.type==='hop'?'#000':'#fff'; ctx.font='bold 8px monospace'; ctx.fillText(sk.letter,-4,-37+bob);
  ob(13,-24+bob,3,18,'#8d5a2b');
  ob(9,-8+bob,11,6,'#c1121f');
  ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(9,-8+bob,11,2);
  if(e.type==='thrower'&&e.cd<0.4){ ob(12,-62,4,20,'#b8bcc4'); ob(9,-66,10,6,'#b8bcc4'); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(12,-62,1,20); } // замах
  ctx.restore();
}
