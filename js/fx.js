// --- Спецэффекты ---
let shakeT=0, shakeA=0, texts=[];
function shake(amp,dur){ shakeA=Math.max(shakeA,amp); shakeT=Math.max(shakeT,dur); }
function popText(x,y,txt,c){ texts.push({x,y,txt,c:c||'#ffe14d',l:0.9}); }
function firework(x,y){
  const hue=(Math.random()*360)|0;
  for(let i=0;i<26;i++){
    const a=i/26*Math.PI*2, sp=180+Math.random()*260;
    parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-120,l:.7+Math.random()*.4,c:'hsl('+((hue+i*9)%360)+',90%,65%)'});
  }
}
function stamp(txt,c){ const d=document.createElement('div'); d.className='stamp'; d.textContent=txt; if(c)d.style.color=c; document.body.appendChild(d); setTimeout(()=>d.remove(),1150); }
const COMBO_STAMPS={3:['ПАНЧ!','#ffd84d'],5:['ДАБЛ-ТАЙМ!','#c6ff3d'],7:['БЭНГЕР!','#ff3d7f'],10:['ЛЕГЕНДАРНО!','#7ad7ff'],15:['ОСТАНОВИТЕ ЕГО','#ffffff']};
const BOSS_KO=['НОКАУТ ПАНЧЕМ','ДЖАДЖИ: 3-0','MIC DROP','СЛИТ','ГРИБ ЗАБРАЛ РАУНД'];
let roundN=0;
function vsCard(name,mini){
  roundN++;
  const d=document.createElement('div'); d.className='vs';
  const line=(cls,t)=>{ const e=document.createElement('div'); if(cls)e.className=cls; e.textContent=t; d.append(e); };
  line('rd',(mini?'МИНИ-РАУНД ':'РАУНД ')+roundN); line('','ГРИБ'); line('v','VS'); line('',name);
  document.body.appendChild(d); setTimeout(()=>d.remove(),1650);
}
function emojiRain(list,n){
  for(let i=0;i<n;i++){
    const d=document.createElement('div'); d.className='confetti';
    d.textContent=list[(Math.random()*list.length)|0]; d.style.fontSize=(18+Math.random()*18)+'px';
    d.style.left=(Math.random()*100)+'vw'; d.style.animationDuration=(1.8+Math.random()*2)+'s'; d.style.animationDelay=(Math.random()*.8)+'s';
    document.body.appendChild(d); setTimeout(()=>d.remove(),4500);
  }
}
function confetti(n){
  for(let i=0;i<n;i++){
    const d=document.createElement('div'); d.className='confetti';
    const s=6+Math.random()*8;
    d.style.left=(Math.random()*100)+'vw';
    d.style.width=s+'px'; d.style.height=(s*0.6)+'px';
    d.style.background='hsl('+((Math.random()*360)|0)+',90%,60%)';
    d.style.animationDuration=(1.8+Math.random()*2.2)+'s';
    d.style.animationDelay=(Math.random()*1.2)+'s';
    document.body.appendChild(d); setTimeout(()=>d.remove(),4500);
  }
}
