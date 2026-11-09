// --- Слот-машина ---
const slotBtn=document.getElementById('slotBtn');
let slotCharges=0, spinning=false;
const SLOT_REELS=['🍒','🍋','🍄','💀','💰','7️⃣'];
function applySlot(k){
  switch(k){
    case 'jackpot': score+=2000; confetti(60); break;
    case 'double':  score*=2; confetti(40); break;
    case 'lose':    score=Math.max(0,score-500); shake(8,.3); break;
    case 'wipe':
      for(const e of enemies){
        if(!e.dead&&e.x>camX&&e.x<camX+W){ e.dead=0.01; score+=100; firework(e.x,e.y-40); }
      }
      shake(10,.4); break;
    case 'slow':    speed=Math.max(200,speed-120); break;
    case 'hypno':   hyT=BONUSES.hypno.dur; break;
    case 'jet':     jetT=6; break;
    case 'none':    break;
  }
}
function spinSlot(){
  if(spinning||slotCharges<=0||!running||player.dead)return;
  spinning=true; slotCharges--;
  let n=0;
  const iv=setInterval(()=>{
    slotBtn.textContent=SLOT_REELS[(Math.random()*6)|0]+SLOT_REELS[(Math.random()*6)|0]+SLOT_REELS[(Math.random()*6)|0];
    beep(300+n*40,.05,'square',.08); n++;
    if(n>=12){
      clearInterval(iv);
      const o=SLOT_OUTCOMES[(Math.random()*SLOT_OUTCOMES.length)|0];
      applySlot(o.k);
      showQuote(o.t,true);
      beep(880,.15); setTimeout(()=>beep(1175,.2),120);
      if(navigator.vibrate)navigator.vibrate([40,30,60]);
      slotBtn.textContent='🎰 КРУТИТЬ';
      if(slotCharges<=0)slotBtn.classList.add('hidden');
      spinning=false;
    }
  },90);
}
slotBtn.addEventListener('click',spinSlot);
