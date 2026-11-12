// --- Меню: музыка, вкладки ---
const menuEl=document.getElementById('menu'), overEl=document.getElementById('over'), musicBtn=document.getElementById('musicBtn');
function syncMusicBtn(){ musicBtn.setAttribute('aria-pressed',musicOn); musicBtn.textContent='♪ Музыка: '+(musicOn?'вкл':'выкл'); }
syncMusicBtn();
musicBtn.addEventListener('click',()=>{
  musicOn=!musicOn; try{ localStorage.gribMusic=musicOn?'1':'0'; }catch(e){}
  syncMusicBtn(); if(!musicOn&&AC)stopClip();
});
const BONUS_INFO={
  big:['Большой гриб','переживёт один удар'],
  jet:['Джетпак','4 с прыгаешь без лимита'],
  spore:['Споры','6 с стреляешь во врагов, даже в ежа'],
  hypno:['Гипногриб','5 с всё медленнее, потом 3 с быстрее'],
  magnet:['Магнит','8 с тянет бонусы к тебе'],
  loot:['Лут','+500 очков'],
  slot:['Казино','заряд для кнопки КРУТИТЬ (или Z)'],
  noir:['Нуар','зона в ч/б, бонусы сгорают, большой гриб остаётся'],
  star:['Звезда','5 с ничто не бьёт (ямы убивают), гриб быстрее, враги гибнут от касания'],
  life:['1UP','вторая жизнь в запас; если уже есть, +500; мини-босс всегда роняет'],
  bubble:['Пузырь','в запасе: следующая яма не убьёт, вынесет на платформу'],
  zap:['Молния','6 с враги мельче и вдвое медленнее; босс стоит 2.5 с, его атаки гаснут'],
  punch:['Панч','сразу: до трёх врагов впереди, а в бою с боссом тычок'],
  ghost:['Призрак','4 с враги, ключи и атаки боссов проходят сквозь, но и давить нельзя'],
};
function el(tag,cls,txt){ const e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.innerHTML=upHtml(txt); return e; }
function fillBonus(p){
  p.textContent='';
  const list=el('div','blist');
  for(const k in BONUS_INFO){
    if(!BONUSES[k])continue;
    const open=bonusOpen(k); // новые предметы открываются в «Прогрессе»
    list.append(el('div','ic',open?BONUSES[k].icon:'🔒'));
    const d=el('div'); d.append(el('b',null,BONUS_INFO[k][0]),' — '+BONUS_INFO[k][1]+(open?'':'. Откроется в «Прогрессе»')); list.append(d);
  }
  p.append(list);
  p.append(el('div',null,'Сантехников и голубей дави сверху. Ежа только перепрыгнуть. От гаечных ключей уворачивайся.'));
  const M=MODES[nickEl.value.trim().toUpperCase()];
  if(M) p.append(el('div','sect','Твой режим «'+nickEl.value.trim().toUpperCase()+'»: '+M.info+'.'));
}
function fillLevels(p){
  p.textContent='';
  const n=(clipMeta&&clipMeta.files&&clipMeta.files.length)||400;
  const a=el('div'); a.append(el('b',null,ZONES.length+' зон'),' по кругу: '+ZONES.map(z=>z.name).join(' · ')+'. С 3-й зоны новые враги, прыгуны и метатели болтов только после 7-го уровня, после круга всё злее. В начале 3-го, 6-го и 9-го уровня всегда лежит гриб. Босс на каждом 7-м уровне, Царь последним в круге из семи. Мини-боссы бродят по обычным уровням с 4-го как элиты: два тычка, гоняются за грибом, на каждом уровне не больше одного. В режиме БАТТЛ элита с первого уровня и на каждом.'); p.append(a);
  const b=el('div'); b.append(el('b',null,n+' треков'),': каждый забег новый случайный порядок, боссы тоже под случайный трек.'); p.append(b);
}
function renderTop(p,scores,me,sec,title){
  p.textContent='';
  if(sec) p.append(el('b','sect','Секретный топ: только тайные ники'));
  else p.append(el('b',null,title||'Топ-10 грибов'));
  if(!scores.length){ p.append(el('div',null,'Пока пусто. Будь первым.')); return; }
  const g=el('div','top'+(sec?' sec':''));
  scores.slice(0,10).forEach((r,i)=>{
    const cls=r.n===me?'me':'';
    g.append(el('div','rk',String(i+1)),el('div',cls,r.n),el('div',cls,String(r.s)));
  });
  p.append(g);
}
function fillTop(p){
  p.textContent='Загрузка…';
  const me=upName(nickEl.value)||'АНОНИМ';
  const sec=isSecret(me);
  fetchScores(sec).then(sc=>{ renderTop(p,sc,me,sec); if(!sec) checkPool(sc,me);
    const d=el('div','daytop'); p.append(d); // ниже — топ сегодняшнего забега дня
    fetchScores(false,dayPrefix(today())).then(ds=>renderTop(d,ds,me,false,'Забег дня · '+dayLabel(today()))).catch(()=>d.remove());
  }).catch(()=>{ p.textContent='Лидерборд недоступен (нет сети)'; });
}
// секретный пул треков: открывается, когда ник попал в топ-5 лидерборда
function poolOpen(){ try{ return localStorage.gribPool==='1'; }catch(e){ return false; } }
function syncPoolChip(){ document.getElementById('poolChip').classList.toggle('hidden',!poolOpen()); }
function checkPool(scores,me){
  if(me&&me!=='АНОНИМ'&&!isSecret(me)&&scores.slice(0,10).some(r=>r.n===me)) metaEvent('top');
  if(poolOpen()||!me||me==='АНОНИМ'||isSecret(me))return false;
  if(!scores.slice(0,5).some(r=>r.n===me))return false;
  try{ localStorage.gribPool='1'; }catch(e){}
  syncPoolChip(); return true;
}
syncPoolChip();
