// --- Мини-боссы: элитные враги ---
// Арен нет: пятеро бродят по обычным уровням с 4-го (в БАТТЛ — с 1-го и на каждом), два тычка.
// idle (спит на платформе) → duel (держит дистанцию впереди гриба) → charge (присел с «!», потом таран) →
// behind (ушёл за левый край) → leap (высокая дуга над грибом) → duel. Третий таран без тычка — сбежал.
// Сверху бьют: первый тычок +500 и сдувается, второй +1500. Телом бьёт только стоя на земле в duel/charge.
const MINI_KINDS=[
  {name:'ОКСИ',   kind:'oxy',   hp:2,mini:1,line:'ОКСИ ЗАЧИТЫВАЕТ 📖'},
  {name:'ШОК',    kind:'shock', hp:2,mini:1,line:'ШОК-КОНТЕНТ ⚡'},
  {name:'ГНОЙНЫЙ',kind:'gnoy',  hp:2,mini:1,line:'ГНОЙНЫЙ НА СВЯЗИ 🟢'},
  {name:'ТАНЦОР', kind:'dancer',hp:2,mini:1,line:'ТАНЦПОЛ ОТКРЫТ 🕺'},
  {name:'РИКИ Ф', kind:'ricky', hp:2,mini:1,line:'РИКИ Ф НА БИТЕ 🎧'},
];
let miniBag=[], miniR=null, eliteLvl={}, eliteUp=0, eliteFlip=1; // eliteLvl: на каком уровне элита уже выпала; eliteUp: первая элита забег уже уронила 1UP
const ELITE_CHANCE=0.24; // доля подходящих платформ с элитой: целимся в половину уровней 4..12
function miniKind(){
  if(!miniBag.length){ miniBag=MINI_KINDS.map((_,i)=>i); const R=miniR||(miniR=rngFor('mini')); for(let j=miniBag.length-1;j>0;j--){ const r=(R()*(j+1))|0; [miniBag[j],miniBag[r]]=[miniBag[r],miniBag[j]]; } }
  return MINI_KINDS[miniBag.pop()];
}
// элита на платформе p: один на уровень, с 4-го уровня (БАТТЛ: с 1-го и на каждом), не на боссе, не в нуаре, не в трубе
function eliteRoll(p,R,pz,pd){
  if(spar||arena||boss||p.w<300||p.pipe||eliteLvl[pz]||pz<(charMode==='BATTLE'?1:3)||pz%7===6||pd<noirTo) return; // за ареной платформы всё равно срежут
  if(R()>=(charMode==='BATTLE'?1:ELITE_CHANCE)) return;
  eliteLvl[pz]=1;
  const i=enemies.findIndex(e=>e.p===p); if(i>=0) enemies.splice(i,1); // обычного врага с этой платформы убираем
  const k=miniKind();
  enemies.push({x:p.x+p.w*0.5,y:p.y,p,dead:0,t:R()*6,type:'elite',ek:k.kind,hp:2,st:'idle',tt:0,chg:0,stage:pz>=7?2:1,sc:0.85,dir:-1});
}
// земля под ногами элиты: платформа, в которую попадает x
function eliteGround(x){ for(const p of plats) if(x>=p.x-6&&x<=p.x+p.w+6) return p; return null; }
// прыжок на ближайшую платформу справа: дуга, в яму элита не падает и высота её не останавливает
function eliteHop(e,back){
  const q=plats.filter(p=>p.x>e.x&&p.x+p.w>e.x+10).sort((a,b)=>a.x-b.x)[0];
  if(!q) return false;
  e.back=back; e.bt=e.tt; e.st='hop'; e.tt=0; e.hx0=e.x; e.hy0=e.y; // bt: таймер прерванного состояния, после прыжка идёт дальше
  e.hx1=Math.min(q.x+44,q.x+q.w-30); e.hy1=q.y;
  e.hT=Math.max(.3,Math.min(.75,(e.hx1-e.x)/420)); e.hA=80+Math.max(0,e.hy0-e.hy1);
  return true;
}
// удар по элите: первым тычком сдувается и отлетает вперёд, вторым гибнет
function eliteHit(e){
  e.hp--;
  if(e.hp<=0){ eliteKill(e,0); return; }
  score+=500; popText(e.x,e.y-70,'+500','#ffe14d'); sStomp(); shake(5,.2);
  e.sc=0.64; e.stage=2; e.chg=0; e.st='hurt'; e.tt=0; // второй этап: быстрее и злее
}
// гибель: тычок сверху (star — звезда, тогда комбо не растёт)
function eliteKill(e,star){
  e.dead=0.01; score+=1500; confetti(30); firework(e.x,e.y-60); shake(8,.25);
  popText(e.x,e.y-70,'+1500','#ffd84d');
  showQuote('МИНИ-БОСС СЛИТ +1500 🎤',true);
  if(!star){ combo++; comboT=2.2; metaEvent('combo',combo); if(COMBO_STAMPS[combo]){ stamp(...COMBO_STAMPS[combo]); if(combo>=5) airhorn(); } }
  metaEvent('minibeat',e.ek);
  if(!spar&&!eliteUp){ eliteUp=1; pickups.push({x:player.x+300,y:e.y-52,kind:'life',t:0}); } // первая элита за забег роняет 1UP
  if(spar){ sparWon=1; sparT=setTimeout(()=>{ if(spar) overCard(); },2500); }
}
function updElite(e,dt,t){
  const D=Math.min(380,W*0.55), zm=zapT>0?.5:1; // молния: элита медленнее
  e.tt+=dt;
  if(e.st==='idle'){
    if(!player.dead&&Math.abs(player.x-e.x)<620&&!enemies.some(q=>q!==e&&q.type==='elite'&&!q.dead&&q.st!=='idle')){ // заметила гриба (пока другая элита в деле — ждёт): баннер, строка, горн
      const k=MINI_KINDS.find(m=>m.kind===e.ek);
      showQuote('МИНИ-БОСС: '+k.name,true); setTimeout(()=>showQuote(k.line,false),120); metaEvent('mini',e.ek);
      beep(110,.35,'sawtooth',.14); setTimeout(()=>beep(82,.45,'sawtooth',.14),220);
      e.st='duel'; e.tt=0; e.life=0;
    }
    return;
  }
  e.life+=dt;
  if(!e.noGive&&e.life>26&&(e.st==='duel'||e.st==='behind')){ // погоня не вечная: 26 с — и сбежала, даже если рельеф мешал таранить
    e.st='flee'; e.tt=0; showQuote(MINI_KINDS.find(m=>m.kind===e.ek).name+' СБЕЖАЛ',true); beep(300,.3,'triangle',.1); }
  switch(e.st){
    case 'duel':{ // держит дистанцию впереди гриба и бежит вместе со скроллом, лицом к грибу
      const q=eliteGround(e.x);
      if(!q){ if(eliteHop(e,'duel')) break; }
      else e.y=q.y;
      const tx=player.x+D; e.x+=speed*dt+(tx-e.x)*Math.min(1,dt*4);
      if(e.tt>(e.stage===2?0.8:1.2)){ e.st='charge'; e.tt=0; e.go=0; beep(1400,.1,'square',.08); }
      break;
    }
    case 'charge':
      if(!e.go){ // присел, «!» и писк: 0.45 с форы
        const q=eliteGround(e.x); if(!q){ if(eliteHop(e,'charge')) break; } else e.y=q.y;
        const tx=player.x+D; e.x+=speed*dt+(tx-e.x)*Math.min(1,dt*4);
        if(e.tt>=0.45){ e.go=1; e.tt=0; beep(70,.22,'sawtooth',.12); }
        break;
      }
      e.x+=(speed-(e.stage===2?260:210)*zm)*dt; // таран: сближается с грибом
      { const q=eliteGround(e.x); if(q) e.y=q.y; else if(eliteHop(e,'charge')) break; }
      if(e.x<player.x-20){ e.st='behind'; e.tt=0; e.chg++; } // прошла мимо
      break;
    case 'hop':{
      const k=Math.min(1,e.tt/e.hT);
      e.x=e.hx0+(e.hx1-e.hx0)*k; e.y=e.hy0+(e.hy1-e.hy0)*k-Math.sin(Math.PI*k)*e.hA;
      if(k>=1){ e.y=e.hy1; e.st=e.back; e.tt=e.bt+e.hT; }
      break;
    }
    case 'behind': // ушла за левый край; третий таран без тычка — сбежала
      e.x=Math.max(e.x-900*dt,camX-70);
      if(e.tt>1.3){
        const k=MINI_KINDS.find(m=>m.kind===e.ek);
        if(!e.noGive&&e.chg>=3){ e.st='flee'; e.tt=0; showQuote(k.name+' СБЕЖАЛ',true); beep(300,.3,'triangle',.1); }
        else { e.st='tell'; e.tt=0; e.x=camX+26; const q=eliteGround(e.x); if(q) e.y=q.y; beep(1200,.1,'triangle',.08); }
      }
      break;
    case 'tell': // «!» у левого края 0.6 с
      e.x=camX+26; { const q=eliteGround(e.x); if(q) e.y=q.y; }
      if(e.tt>0.6){ e.st='leap'; e.tt=0; e.lx=e.x; e.ly=e.y; e.tx=player.x+D+speed*0.9; beep(1400,.12,'square',.08); }
      break;
    case 'leap': // высокая дуга через гриба: не бьёт и её не топнуть, приземляется на D впереди
      { const k=Math.min(1,e.tt/0.9), land=eliteGround(e.tx)||eliteGround(player.x+D);
        e.x=e.lx+(e.tx-e.lx)*k;
        e.y=e.ly+((land?land.y:e.ly)-e.ly)*k-Math.sin(Math.PI*k)*300;
        if(k>=1){ e.st='duel'; e.tt=0; if(land) e.y=land.y; } }
      break;
    case 'hurt': // отлетела вперёд после тычка: не бьёт
      { const tx=player.x+D; e.x+=speed*dt+(tx-e.x)*Math.min(1,dt*3); }
      { const q=eliteGround(e.x); if(q) e.y=q.y; }
      if(e.tt>0.8){ e.st='duel'; e.tt=0; }
      break;
    case 'flee': // сбежала вправо быстрее скролла
      e.dir=1; e.x+=(speed+420)*dt;
      { const q=eliteGround(e.x); if(q) e.y=q.y; }
      if(e.x>camX+W+100) e.dead=1;
      break;
  }
  // касание и тычок: только стоя на земле в duel/charge
  if(player.dead||(e.st!=='duel'&&e.st!=='charge')) return;
  const sc=e.sc, psc=player.big?1.35:1, dx=Math.abs(player.x-e.x), top=e.y-86*sc;
  if(dx>22*sc+18*psc||player.y<=top||player.y-40*psc>=e.y) return;
  if(starT>0){ eliteKill(e,1); return; } // звезда: касание убивает
  if(ghostT>0) return; // призрак проходит сквозь
  if(player.vy>140&&player.y<e.y-14){ // сверху: отскок, выталкиваем из тела, чтобы следующий кадр не счёл боком
    player.vy=JUMP*0.7; player.jumps=maxJumps(); player.y=Math.min(player.y,top-2); eliteHit(e);
  } else hit();
}
Object.assign(BOSS_DRAW,{oxy:drawOxy,shock:drawShock,gnoy:drawGnoy,dancer:drawDancer,ricky:drawRicky});
// фигурка мимоходной элиты: тот же человечек, 0.85 (0.64 после тычка), лицом к грибу, пойнты и «!» над головой
function drawElite(e,t){
  const sc=e.sc*(zapT>0?.6:1), cr=(e.st==='charge'&&!e.go)?1:0; // присед на замахе
  ctx.save(); ctx.translate(e.x-camX,e.y);
  if(e.dead){ ctx.scale(1,.25); ctx.globalAlpha=Math.max(0,1-e.dead*2); }
  eliteFlip=e.st==='flee'?-1:1; // фигурки нарисованы лицом влево, к грибу; убегая, разворачивается
  ctx.scale(eliteFlip*sc*(1+cr*.1),sc*(1-cr*.22));
  BOSS_DRAW[e.ek](e,t);
  ctx.restore(); eliteFlip=1;
  if(e.dead)return;
  const x=e.x-camX, hy=e.y-86*sc;
  ctx.fillStyle='#ff2d78';
  for(let i=0;i<e.hp;i++){ ctx.beginPath(); ctx.arc(x-(e.hp-1)*5+i*10,hy-9,3.2,0,7); ctx.fill(); } // пойнты: сколько тычков осталось
  if(e.st==='charge'||e.st==='tell'||e.st==='leap'){ // «!» — знак приёма виден заранее
    ctx.fillStyle='#ffe14d'; ctx.strokeStyle='#10060c'; ctx.lineWidth=3; ctx.font="900 22px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center';
    ctx.strokeText('!',x,hy-16); ctx.fillText('!',x,hy-16); ctx.textAlign='left';
  }
}
// рисовка: общий человечек, поверх него приметы каждого
function miniDude(body,skin,label,t){
  const bob=Math.sin(t*9)*1.5;
  ob(-22,-58+bob,44,58-bob,body);
  ctx.fillStyle='rgba(0,0,0,.22)'; ctx.fillRect(10,-58+bob,12,58-bob);
  ob(-16,-86+bob,32,28,skin);
  ctx.fillStyle='#222'; ctx.fillRect(-11,-76+bob,6,5); ctx.fillRect(3,-76+bob,6,5);
  ctx.fillStyle='#fff'; ctx.font="800 8px 'Unbounded',system-ui,sans-serif"; ctx.textAlign='center'; ctx.save(); ctx.scale(eliteFlip,1); ctx.fillText(label,0,-30+bob); ctx.restore(); ctx.textAlign='left'; // надпись не зеркалим
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
