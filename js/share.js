// --- Шер-карточка ---
// Картинку собираем заранее, на экране смерти: по клику остаётся только navigator.share.
// Делимся ТОЛЬКО файлом: если передать ещё text, Telegram и часть приложений берут текст и теряют картинку.
const GAME_URL='yourconscience.github.io/mushroom';
let lastScores=null, shareBlob=null, shareFile=null, shareKey='', shareTok=0;
function buildShareCard(s,line){
  const Wc=1080, Hc=1350, c=document.createElement('canvas'); c.width=Wc; c.height=Hc;
  const x=c.getContext('2d'), D="'Unbounded',system-ui,sans-serif", T="system-ui,-apple-system,'Segoe UI',sans-serif";
  x.fillStyle='#0b0b14'; x.fillRect(0,0,Wc,Hc);
  // фон: текущий кадр игры, обрезанный по карточке
  try{ const k=Math.max(Wc/cv.width,Hc/cv.height), w=cv.width*k, h=cv.height*k; x.drawImage(cv,(Wc-w)/2,(Hc-h)/2,w,h); }catch(e){}
  const g=x.createLinearGradient(0,0,0,Hc);
  g.addColorStop(0,'rgba(8,8,16,.55)'); g.addColorStop(.45,'rgba(8,8,16,.7)'); g.addColorStop(1,'rgba(8,8,16,.94)');
  x.fillStyle=g; x.fillRect(0,0,Wc,Hc);
  const pad=80; x.textBaseline='alphabetic'; x.textAlign='left';
  // шапка
  x.fillStyle='#f4f4f8'; x.font='900 120px '+D; x.fillText('ГРИБ',pad,200);
  const gw=x.measureText('ГРИБ').width;
  x.font='800 30px '+D; const tw=x.measureText('VERSUS').width+44;
  x.fillStyle='#c6ff3d'; x.beginPath(); x.roundRect(pad+gw+26,138,tw,56,28); x.fill();
  x.fillStyle='#0b0b14'; x.fillText('VERSUS',pad+gw+48,177);
  // итог забега
  x.fillStyle='#ff3d7f'; x.font='900 64px '+D; x.fillText('RIP ГРИБ',pad,360);
  x.fillStyle='#c9c9da'; x.font='500 38px '+T; x.fillText(line,pad,420);
  x.fillStyle='#71718a'; x.font='600 30px '+T; x.fillText(daily?'ЗАБЕГ ДНЯ · '+dayLabel(daily):'СЧЁТ',pad,540);
  x.fillStyle='#ffffff'; x.font='900 190px '+D; x.fillText(String(s),pad-6,720);
  x.fillStyle='#a6a6bc'; x.font='800 40px '+D; x.fillText(daily?'ЛУЧШЕЕ СЕГОДНЯ '+myBest()+' · СЕРИЯ '+streakNow():'ЛУЧШЕЕ ЗА СЕССИЮ '+myBest(),pad,800);
  const me=playerName||'АНОНИМ', rank=lastScores?lastScores.findIndex(r=>r.n===me):-1;
  if(rank>=0&&rank<10){
    const lbl='#'+(rank+1)+(daily?' ЗА ДЕНЬ':isSecret(me)?' В СЕКРЕТНОМ ТОПЕ':' В ТОПЕ'); x.font='800 32px '+D; const lw=x.measureText(lbl).width+48;
    x.fillStyle='#ffd84d'; x.beginPath(); x.roundRect(pad,840,lw,60,30); x.fill();
    x.fillStyle='#0b0b14'; x.fillText(lbl,pad+24,882);
  }
  // топ-5
  if(lastScores&&lastScores.length){
    const sec=!daily&&isSecret(me); x.font='600 30px '+T; x.fillStyle=sec?'#ffd84d':'#71718a'; x.fillText(daily?'ТОП ДНЯ':sec?'СЕКРЕТНЫЙ ТОП':'ТОП ГРИБОВ',pad,990);
    lastScores.slice(0,5).forEach((r,i)=>{
      const y=1040+i*44, mine=r.n===me;
      x.font=(mine?'700 ':'500 ')+'32px '+T; x.fillStyle=mine?'#c6ff3d':'#d6d6e4';
      x.textAlign='left'; x.fillText((i+1)+'. '+r.n,pad,y);
      x.textAlign='right'; x.fillText(String(r.s),Wc-pad,y);
    });
    x.textAlign='left';
  }
  // подвал со ссылкой
  x.fillStyle='#c6ff3d'; x.font='800 34px '+D; x.fillText(GAME_URL,pad,Hc-70);
  return c;
}
async function prepShare(s,line){
  const key=s+'|'+(lastScores?lastScores.length:0);
  if(key===shareKey&&shareFile)return;
  const tok=++shareTok; // сборки идут параллельно: сохраняем только последнюю (с топом)
  try{ await document.fonts.load("900 120px 'Unbounded'"); }catch(e){}
  const c=buildShareCard(s,line);
  const blob=await new Promise(r=>c.toBlob(r,'image/png'));
  if(!blob||tok!==shareTok)return;
  shareBlob=blob; shareFile=new File([blob],'grib-'+s+'.png',{type:'image/png'}); shareKey=key;
}
function shareNote(t){ const b=document.getElementById('btnShare'), o=b.dataset.t||b.textContent; b.dataset.t=o; b.textContent=t; setTimeout(()=>{ b.textContent=o; },1800); }
async function shareScore(s,line){
  track('share');
  // ссылка на картинке не кликается: кладём её в буфер ещё в момент клика, чтобы вставить следующим сообщением
  let linkCopied=false;
  try{ navigator.clipboard.writeText('https://'+GAME_URL+'/').then(()=>{ linkCopied=true; },()=>{}); }catch(e){}
  if(!shareFile) await prepShare(s,line);
  try{
    if(shareFile&&navigator.canShare&&navigator.canShare({files:[shareFile]})){ await navigator.share({files:[shareFile]}); if(linkCopied) shareNote('Ссылка в буфере: вставь следом'); return; }
  }catch(e){ if(e.name==='AbortError')return; }
  // нет шеринга файлов (десктоп без Web Share) — картинка в буфер
  try{ await navigator.clipboard.write([new ClipboardItem({'image/png':shareBlob})]); shareNote('Картинка в буфере ✓'); return; }catch(e){}
  // буфер недоступен — хотя бы текст со ссылкой
  try{ if(navigator.share){ await navigator.share({text:'Мой гриб набрал '+s+' в ГРИБ: Versus https://'+GAME_URL+'/'}); return; } }catch(e){ if(e.name==='AbortError')return; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(shareBlob); a.download='grib-'+s+'.png';
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}
