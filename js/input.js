// --- Ввод ---
function jump(){
  if(!running||player.dead) return;
  if(player.jumps>0||jetT>0){
    player.vy=(jetT>0?JUMP*0.75:JUMP*(player.jumps===maxJumps()?1:0.88))*(charMode==='PUFF'?0.775:1);
    if(jetT<=0)player.jumps--;
    player.squish=-0.25; sJump();
    for(let i=0;i<6;i++) parts.push({x:player.x,y:player.y,vx:(Math.random()-.5)*200,vy:100+Math.random()*100,l:.4,c:'#9be564'});
  }
}
addEventListener('pointerdown',e=>{ if(e.target.tagName!=='BUTTON') jump(); });
addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.code==='Space'||e.code==='ArrowUp'){
    if(!running){ e.preventDefault(); if(!overlay.classList.contains('hidden')) startGame(); return; } // старт/рестарт с клавиатуры
    jump();
  }
  if(e.code==='KeyZ') spinSlot(); // казино с клавиатуры
});

function announceZone(zn){
  const Z=ZONES[zn%ZONES.length], lapN=(zn/ZONES.length)|0;
  const mark=lapN?' '+(['II','III','IV','V','VI'][lapN-1]||'∞'):'';
  showQuote('ЗОНА '+(zn+1)+': '+(trackTitle(zn)||Z.name)+mark, true);
}

function startGame(){
  if(!AC){ try{ AC=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} } // звук включаем ещё в жесте
  if(AC&&AC.state==='suspended')AC.resume();
  // клавиатура после ввода ника: сначала убираем её и ждём, пока экран вернёт полный размер
  if(document.activeElement===nickEl){ nickEl.blur(); setTimeout(startGame,350); return; }
  resize();
  applyName();
  if(daily){ daily=today(); charMode=''; SM=1; markDaily(); syncDailyBtn(); track('daily:start'); } // у всех одинаковые условия
  if(!clipsLoading) loadClips();
  reset(); running=true; overlay.classList.add('hidden'); hud.classList.remove('hidden');
  if(charMode==='EZ'||charMode==='LEG')player.big=true;
  if(!charMode&&!daily) applyPerks();
  player.jumps=maxJumps();
  runUnlocks=[]; renderRunUnlocks(); roundN=0;
  trackStart();
  if(!daily&&isSecret(playerName)) metaEvent('hero',playerName.toUpperCase());
  const M=!daily&&MODES[playerName.toUpperCase()];
  if(daily) setTimeout(()=>showQuote('ЗАБЕГ ДНЯ '+dayLabel(daily)+': У ВСЕХ ОДИНАКОВЫЙ',true),400);
  else if(M) setTimeout(()=>showQuote('РЕЖИМ «'+playerName.toUpperCase()+'»: '+M.info,true),400);
  if(AC)playZone(zoneN);
  let tries=0;
  const sayStart=()=>{ if(!playlist.length&&tries++<10){ setTimeout(sayStart,300); return; } announceZone(zoneN); };
  setTimeout(sayStart,350);
}
btn.addEventListener('click',()=>{ daily=''; startGame(); });
document.getElementById('dailyBtn').addEventListener('click',()=>{ daily=today(); startGame(); });
syncDailyBtn();
nickEl.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); daily=''; startGame(); } });
