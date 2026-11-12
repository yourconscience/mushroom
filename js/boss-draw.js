// --- рисовка боссов ---
function crown(y,w){ ctx.fillStyle='#ffd84d'; ctx.strokeStyle=OL; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(-w,y); ctx.lineTo(-w,y-8); ctx.lineTo(-w/2,y-3); ctx.lineTo(0,y-10); ctx.lineTo(w/2,y-3); ctx.lineTo(w,y-8); ctx.lineTo(w,y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
function drawPlumberB(b,t){
  ctx.scale(2.2,2.2);
  drawEnemy({x:camX,y:0,type:'walk',dir:-1,t:0,dead:0},t); // тот же сантехник, только огромный
  crown(-45,10);
  if(b.st==='throw'&&b.wind){ ctx.fillStyle='#b8bcc4'; ctx.strokeStyle=OL; ctx.lineWidth=1; ctx.fillRect(10,-66,4,20); ctx.strokeRect(10,-66,4,20); ctx.fillRect(7,-70,10,6); ctx.strokeRect(7,-70,10,6); }
}
function drawPigeonB(b,t){
  if(b.st==='stuck') ctx.rotate(-0.5); // клюв в земле
  ctx.scale(3,3);
  drawEnemy({x:camX,y:0,type:'dive',dir:-1,t:b.t,dead:0,dv:b.st==='dive',dvx:-1,dvy:1},t);
  ctx.save(); ctx.translate(-12,-23); ctx.scale(0.55,0.55); crown(0,12); ctx.restore();
}
function drawBalloonB(b,t){
  const s=b.scale, rx=b.hw*s, ry=b.hh*s/2, cy=-ry, wob=Math.sin(t*5)*1.5;
  // тень на земле: где будет следующее касание, растёт к касанию; красная — упадёт на гриб
  if(b.st==='bounce'&&b.touchX!=null){
    const tx=b.touchX-b.sx, gy=b.gy, apex=b.apex||150;
    const hgt=Math.max(0,gy-b.y), grow=Math.min(1,Math.max(0,1-hgt/apex)); // 0 на вершине, 1 у земли
    const fin=b.touchIdx===0;
    ctx.globalAlpha=fin?0.75+0.2*Math.sin(t*10):0.5; // красная с белым кольцом: видна и на красной земле
    ctx.fillStyle=fin?'#ff2a2a':'#000';
    ctx.beginPath(); ctx.ellipse(tx,gy-b.y+3,(rx+10)*(0.35+0.65*grow),9*(0.35+0.65*grow),0,0,7); ctx.fill();
    if(fin){ ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke(); } ctx.globalAlpha=1;
  }
  ctx.strokeStyle=OL; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-6,8); ctx.lineTo(6,8); ctx.closePath(); ctx.fillStyle='#d94c80'; ctx.fill(); ctx.stroke(); // узелок
  ctx.beginPath(); ctx.ellipse(0,cy,rx+wob,ry-wob,0,0,7); ctx.fillStyle='#ff7aa8'; ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-rx*0.35,cy-ry*0.45,rx*0.22,ry*0.18,-.5,0,7); ctx.fill();
  // лицо «дутой фигуры»: надменные глаза, усы, бабочка
  ctx.fillStyle='#fff'; ctx.fillRect(-rx*0.45,cy-ry*0.2,rx*0.3,ry*0.16); ctx.fillRect(rx*0.12,cy-ry*0.2,rx*0.3,ry*0.16);
  ctx.fillStyle='#222'; ctx.fillRect(-rx*0.42,cy-ry*0.12,rx*0.14,ry*0.08); ctx.fillRect(rx*0.15,cy-ry*0.12,rx*0.14,ry*0.08);
  ctx.fillRect(-rx*0.5,cy-ry*0.3,rx*0.38,3); ctx.fillRect(rx*0.1,cy-ry*0.3,rx*0.38,3);
  ctx.fillStyle='#3d2b1f'; ctx.fillRect(-rx*0.32,cy+ry*0.12,rx*0.64,ry*0.1);
  ctx.fillStyle='#222'; ctx.beginPath(); ctx.moveTo(0,cy+ry*0.55); ctx.lineTo(-rx*0.25,cy+ry*0.45); ctx.lineTo(-rx*0.25,cy+ry*0.68); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0,cy+ry*0.55); ctx.lineTo(rx*0.25,cy+ry*0.45); ctx.lineTo(rx*0.25,cy+ry*0.68); ctx.closePath(); ctx.fill();
  crown(cy-ry+4,12*s);
}
function drawRoosterB(b,t){
  const glass='rgba(170,230,255,.6)', edge='#e8fbff';
  ctx.strokeStyle=edge; ctx.lineWidth=2;
  if(b.st==='play'&&b.t<0.12) ctx.translate(0,2); // клюёт на каждый бит
  // ноты песни над головой (показываются до вылета)
  if(b.st==='show'&&b.list){ const n=b.list.length; ctx.textAlign='center';
    for(let i=0;i<n;i++){ const x=(i-(n-1)/2)*20, k=b.list[i];
      if(i===b.hide){ ctx.fillStyle='#fff'; ctx.font='bold 15px monospace'; ctx.fillText('?',x,-104); }
      else if(k==='s'){ ctx.fillStyle='#bfefff'; ctx.beginPath(); ctx.moveTo(x-6,-104); ctx.lineTo(x,-94); ctx.lineTo(x+6,-104); ctx.lineTo(x,-114); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      else { const low=k==='L'; ctx.fillStyle=low?'#ff7aa8':'#7ad7ff'; ctx.fillRect(x-6,(low?-100:-112),12,5); ctx.strokeRect(x-6,(low?-100:-112),12,5); } }
    ctx.textAlign='left'; }
  // хвост
  for(let i=0;i<4;i++){ ctx.beginPath(); ctx.moveTo(18,-50); ctx.lineTo(48+i*4,-92+i*14); ctx.lineTo(30+i*3,-46+i*2); ctx.closePath(); ctx.fillStyle=glass; ctx.fill(); ctx.stroke(); }
  // ноги
  ctx.fillStyle='#ff9f1c'; ctx.fillRect(-10,-22,5,22); ctx.fillRect(6,-22,5,22);
  // тело и голова
  ctx.beginPath(); ctx.ellipse(4,-44,30,24,0,0,7); ctx.fillStyle=glass; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-20,-76,13,15,0,0,7); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#ff3d3d'; for(let i=0;i<3;i++){ ctx.beginPath(); ctx.arc(-26+i*7,-92,5,0,7); ctx.fill(); } // гребешок
  ctx.fillStyle='#ff3d3d'; ctx.beginPath(); ctx.ellipse(-30,-66,4,6,0,0,7); ctx.fill();          // серёжка
  ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.moveTo(-32,-80); ctx.lineTo(-44,-76); ctx.lineTo(-32,-72); ctx.closePath(); ctx.fill(); // клюв
  ctx.fillStyle='#10202a'; ctx.fillRect(-24,-81,4,4);
  ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(-6,-60,10,3); ctx.fillRect(-2,-56,4,8);    // блик
  // трещины: по одной за каждый тычок
  ctx.strokeStyle='rgba(255,255,255,.9)'; ctx.lineWidth=1.5;
  for(let i=0;i<b.max-b.hp;i++){ const x0=-14+i*9; ctx.beginPath(); ctx.moveTo(x0,-64); ctx.lineTo(x0+5,-54); ctx.lineTo(x0-2,-46); ctx.lineTo(x0+4,-34); ctx.stroke(); }
  crown(-90,9);
}
function drawWormB(b,t){
  if(b.st==='dig'||b.st==='enter')return; // под землёй виден только маркер
  for(let i=4;i>=0;i--){ const x=-i*20, r=24-i*3, y=-r*0.55+Math.sin(t*6-i*0.7)*4;
    ctx.beginPath(); ctx.ellipse(x,y,r,r*0.8,0,0,7); ctx.fillStyle=i%2?'#b57a4e':'#9a6238'; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.ellipse(14,-24,24,19,0,0,7); ctx.fillStyle='#d9a06a'; ctx.fill(); ctx.stroke();
  ctx.fillStyle='#3b1f12'; ctx.beginPath(); ctx.ellipse(28,-18,12,8,0,0,7); ctx.fill();
  ctx.fillStyle='#fff'; for(let i=0;i<4;i++) ctx.fillRect(20+i*5,-23,4,5);
  ctx.fillStyle='#222'; ctx.fillRect(20,-36,5,5);
}
function drawUfoB(b,t){
  const glow=(Math.sin(t*8)+1)/2;
  ctx.beginPath(); ctx.ellipse(0,-34,30,24,0,Math.PI,0); ctx.fillStyle='rgba(150,235,255,.55)'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,-24,56,15,0,0,7); ctx.fillStyle='#5a6472'; ctx.fill(); ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(-12,-28,30,6,0,0,7); ctx.fill();
  for(let i=-2;i<=2;i++){ ctx.fillStyle='rgba(255,'+((60+glow*140)|0)+',90,'+(.45+glow*.55)+')'; ctx.beginPath(); ctx.arc(i*20,-20,4,0,7); ctx.fill(); }
  const bx=(b.beamX||0)-(b.x-camX);
  if(b.st==='mark'){ // метка на земле под грибом: три мига, на третьем замирает; потом вспышка
    const gyy=b.gy-b.y, lock=b.t>=b.M, live=b.t>b.liveAt&&b.t<b.liveEnd;
    if(!live){ let lit=lock; for(let i=0;i<3;i++){ const d=b.t-(b.M-.6+i*.3); if(d>=0&&d<.14) lit=true; }
      ctx.strokeStyle=lock?'#fff':'rgba(255,80,120,'+(lit?.95:.35)+')'; ctx.lineWidth=lock?7:lit?5:3; ctx.setLineDash(lock?[]:[10,10]); ctx.beginPath(); ctx.moveTo(bx,-20); ctx.lineTo(bx,gyy-8); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle='rgba(255,60,100,'+(lit?.55:.15)+')'; ctx.beginPath(); ctx.ellipse(bx,gyy-2,34,9,0,0,7); ctx.fill(); ctx.stroke(); }
    else { ctx.fillStyle='rgba(255,80,120,.30)'; ctx.fillRect(bx-24,-20,48,H); ctx.fillStyle='rgba(255,255,255,.25)'; ctx.fillRect(bx-8,-20,16,H); } }
}
function drawKingB(b,t){
  ctx.globalAlpha=b.alpha==null?1:b.alpha;
  ob(-26,-58,52,58,'#ddd0b4');
  ctx.fillStyle='#8a5a3c'; ctx.fillRect(-18,-46,36,6);
  ctx.fillStyle='#fff'; ctx.fillRect(-14,-62,10,7); ctx.fillRect(4,-62,10,7);
  ctx.fillStyle='#222'; ctx.fillRect(-11,-60,4,4); ctx.fillRect(7,-60,4,4);
  ctx.fillStyle='#6b4423'; ctx.fillRect(-16,-52,32,4);
  ctx.beginPath(); ctx.ellipse(0,-80,56,32,0,0,7); ctx.fillStyle='#c1121f'; ctx.fill(); ctx.stroke();
  ctx.fillStyle='#fff'; for(const [px,py,r] of [[-28,-88,7],[10,-94,9],[30,-82,6],[-6,-78,5]]){ ctx.beginPath(); ctx.arc(px,py,r,0,7); ctx.fill(); }
  crown(-104,16);
  ob(30,-74,7,74,'#b08a2e');
  ctx.beginPath(); ctx.arc(33,-80,10,0,7); ctx.fillStyle='#7CFC00'; ctx.fill(); ctx.stroke();
  if(b.armor){ ctx.strokeStyle='rgba(122,215,255,.85)'; ctx.lineWidth=5; ctx.beginPath(); ctx.arc(0,-55,74+Math.sin(t*6)*3,0,7); ctx.stroke(); }
  ctx.globalAlpha=1;
}
const BOSS_DRAW={plumber:drawPlumberB,pigeon:drawPigeonB,balloon:drawBalloonB,rooster:drawRoosterB,worm:drawWormB,ufo:drawUfoB,king:drawKingB};
function drawBoss(t){
  const b=boss, gy=b.gy;
  if(!(b.hitT>0&&((t*24)|0)%2)){
    ctx.save(); ctx.translate(b.x-camX,b.y);
    if(b.st==='dead') ctx.rotate(b.rot);
    BOSS_DRAW[b.kind](b,t);
    ctx.restore();
  }
  // червь под землёй: только дрожащий маркер на земле
  if(b.kind==='worm'&&(b.st==='dig'||b.st==='enter')){
    ctx.strokeStyle='rgba(255,216,77,.85)'; ctx.lineWidth=3; ctx.beginPath();
    ctx.arc(b.x-camX,b.gy-4,16+Math.sin(t*10)*4,0,7); ctx.stroke();
    ctx.fillStyle='rgba(138,106,74,.5)'; ctx.beginPath(); ctx.ellipse(b.x-camX,b.gy,30,7,0,0,7); ctx.fill();
  }
  // можно бить: звёздочки над головой
  if(b.vuln){
    ctx.fillStyle='#ffd84d';
    for(let i=0;i<3;i++){ const a=t*5+i*2.1; ctx.fillRect(b.x-camX+Math.cos(a)*26-3,(b.below?b.y+30:b.y-b.hh*b.scale-26)+Math.sin(a)*7-3,6,6); }
  }
  // прицел голубя
  if(b.kind==='pigeon'&&b.st==='aim'&&((t*8)|0)%2){ ctx.strokeStyle='#ff3d3d'; ctx.lineWidth=3; const x=b.tx; ctx.beginPath(); ctx.moveTo(x-12,gy-12); ctx.lineTo(x+12,gy+2); ctx.moveTo(x+12,gy-12); ctx.lineTo(x-12,gy+2); ctx.stroke(); }
  // ударные волны
  for(const w of b.waves){ ctx.fillStyle='rgba(255,216,77,.8)'; ctx.fillRect(w.sx-14,gy-10,28,10); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(w.sx-8,gy-18,16,8); }
  // снаряды
  for(const o of b.obs){
    const x=o.x-camX;
    if(o.act){ ctx.fillStyle='#fff3b0'; for(let i=0;i<3;i++){ const a=t*5+i*2.1; ctx.fillRect(x+Math.cos(a)*(o.r+12)-2,o.y+Math.sin(a)*(o.r+6)-2,5,5); } }
    if(o.kind==='plate'){ ctx.fillStyle='#ffd84d'; ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,o.y,o.r+8,o.r*.6,0,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle='rgba(255,255,255,.55)'; ctx.fillRect(x-10,o.y-4,20,3); }
    else if(o.kind==='decoy'){ ctx.fillStyle='#b5402e'; ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,o.y+4,o.r+2,o.r,0,0,7); ctx.fill(); ctx.stroke(); ctx.fillStyle='#fff'; for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(x+i*9-5,o.y-o.r+6); ctx.lineTo(x+i*9,o.y-o.r-12); ctx.lineTo(x+i*9+5,o.y-o.r+6); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    else if(o.kind==='egg'){ ctx.fillStyle=o.act?'#ffd84d':'#fff6e0'; ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.beginPath(); ctx.ellipse(x,o.y,o.r*0.8,o.r,0,0,7); ctx.fill(); ctx.stroke();
      if(o.mark!=null&&!o.bounced){ ctx.strokeStyle='#ff3d3d'; ctx.lineWidth=2; const mx=o.mark-camX; ctx.beginPath(); ctx.moveTo(mx-9,gy-9); ctx.lineTo(mx+9,gy); ctx.moveTo(mx+9,gy-9); ctx.lineTo(mx-9,gy); ctx.stroke(); } }
    else if(o.kind==='shard'){ ctx.fillStyle='#bfefff'; ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(x-10,o.y+9); ctx.lineTo(x-2,o.y-10); ctx.lineTo(x+4,o.y+2); ctx.lineTo(x+10,o.y+9); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    else if(b.kind==='rooster'){ // ноты песни: стеклянные, низкая — одна, высокая — пара под ребром
      const hi=o.kind==='ringH'; ctx.fillStyle='#bfefff'; ctx.strokeStyle=OL; ctx.lineWidth=2;
      for(const dx of hi?[-9,9]:[0]){ ctx.beginPath(); ctx.ellipse(x+dx-3,o.y+9,8,6,-.4,0,7); ctx.fill(); ctx.stroke(); ctx.fillRect(x+dx+3,o.y-17,3,25); ctx.strokeRect(x+dx+3,o.y-17,3,25); }
      if(hi){ ctx.fillRect(x-6,o.y-19,21,6); ctx.strokeRect(x-6,o.y-19,21,6); } else { ctx.beginPath(); ctx.moveTo(x+6,o.y-17); ctx.lineTo(x+17,o.y-9); ctx.lineTo(x+6,o.y-9); ctx.closePath(); ctx.fill(); ctx.stroke(); } }
    else if(b.kind==='ufo'){ // диски тарелки: металл и бегущие огни
      ctx.strokeStyle=OL; ctx.lineWidth=2; ctx.fillStyle='#9aa3b5'; ctx.beginPath(); ctx.ellipse(x,o.y,o.r+7,o.r*.45,0,0,7); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#d5dbe8'; ctx.beginPath(); ctx.ellipse(x,o.y-4,o.r*.55,o.r*.32,0,Math.PI,0); ctx.fill(); ctx.stroke();
      for(let i=-1;i<=1;i++){ ctx.fillStyle=((t*8+i)|0)%2?'#ffe14d':'#ff5a4d'; ctx.fillRect(x+i*10-2,o.y+1,4,4); } }
    else { const ring=o.kind[0]==='r', low=o.kind.endsWith('L');
      ctx.globalAlpha=.85; ctx.strokeStyle=low?'#ff7aa8':'#7ad7ff'; ctx.lineWidth=ring?4:2.5;
      ctx.fillStyle=ring?'rgba(0,0,0,0)':(low?'rgba(255,122,168,.35)':'rgba(122,215,255,.35)');
      ctx.beginPath(); ctx.arc(x,o.y,o.r,0,7); ctx.fill(); ctx.stroke(); ctx.globalAlpha=1; }
  }
  // полоска здоровья
  if(b.st!=='dead'){
    ctx.save(); ctx.scale(1/S,1/S); // в CSS-пикселях: не сжимается на узком экране и читается
    const bw=Math.min(260,W*S*0.6), x0=(W*S-bw)/2, y0=62;
    ctx.fillStyle='rgba(10,10,18,.6)'; ctx.fillRect(x0-8,y0-22,bw+16,40);
    ctx.fillStyle='#fff'; ctx.font="800 12px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center'; ctx.fillText(b.name,W*S/2,y0-6); ctx.textAlign='left';
    const pw=(bw-6*(b.max-1))/b.max;
    for(let i=0;i<b.max;i++){ ctx.fillStyle=i<b.hp?'#ff3d7f':'rgba(255,255,255,.18)'; ctx.fillRect(x0+i*(pw+6),y0,pw,8); }
    ctx.restore();
  }
}
