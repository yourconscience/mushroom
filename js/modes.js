// Секретные ники-режимы: отсылки к мемам про Окси (Versus 2017) и к самой игре.
// sm — множитель очков; режим включается, если ник совпал (регистр не важен).
const MODES={
  'ОКСАНА': {k:'OKS',   sm:2,   info:'вечный нуар: всё ч/б, бонусов нет, очки x2', hint:'Женское имя, которым Гнойный звал Окси'},
  'ПЕТУШОК':{k:'GLASS', sm:3,   info:'стеклянный гриб: не вырастет, одно касание и всё, очки x3', hint:'Стеклянный … 🐓'},
  'ИЗИ':    {k:'EZ',    sm:0.5, info:'изи: мир медленнее, гриб большой и отрастает каждую зону, очки x0.5', hint:'Катка была … 😏 (три буквы)'},
  'ДУТЫЙ':  {k:'PUFF',  sm:1,   info:'дутая фигура: гриб надут, парит и прыгает трижды', hint:'Какая ты фигура? 🫧 (одно слово с Versus 2017)'},
  'МАРИО':  {k:'MARIO', sm:1.5, info:'Марио снова прыгает на грибы: сантехники скачут, их больше, очки x1.5', hint:'Главный сантехник всех времён'},
  'ГНОЙНЫЙ':{k:'GNOY',  sm:1,   info:'сразу в баттл: случайный босс на 7-м уровне', hint:'Кто забрал Versus в 2017-м'},
  'Z':      {k:'Z',     sm:1,   info:'казино крутится само каждые 5 с, бонусов нет', hint:'Одна латинская буква: ею крутят казино с клавиатуры'},
  'X':      {k:'X',     sm:1,   info:'ч/б хардкор: только лут, все враги сразу', hint:'Одна латинская буква: неизвестная в уравнении'},
  'V':      {k:'V',     sm:1,   info:'вечный джетпак, бонусов нет', hint:'Одна латинская буква: вечный полёт'},
  'БАТТЛ':  {k:'BATTLE',sm:1.5, info:'мини-босс каждые 4 уровня с самого начала, очки x1.5'},
  'ЛЕГЕНДА':{k:'LEG',   sm:1,   info:'всегда большой, шляпка отрастает каждую зону, тройной прыжок'},
};
let SM=1; // множитель очков режима
function baseFilter(){ return charMode==='X'||charMode==='OKS'?'grayscale(1)':''; }
function maxJumps(){ return charMode==='PUFF'||charMode==='LEG'?3:2; }
const nickEl=document.getElementById('nick');
try{ nickEl.value=localStorage.gribName||''; }catch(e){}
function applyName(){
  const v=upName(nickEl.value);
  playerName=v||'АНОНИМ';
  try{ localStorage.gribName=v; }catch(e){}
  const M=MODES[playerName];
  charMode=M?M.k:'';
  SM=M?M.sm:1;
  document.body.style.filter=baseFilter();
}
async function submitScore(s){
  const name=playerName||'АНОНИМ', sec=!daily&&isSecret(name), pre=daily?dayPrefix():sec?'v2s:':'v2:', key=pre+name;
  let scores=null; try{ scores=await fetchScores(sec,pre); }catch(e){}
  const mine=scores&&scores.find(r=>r.n===name);
  if(!mine||s>mine.s){
    // POST с текстовым телом — простой запрос, без CORS preflight
    queueScore(key,s); await flushOutbox();
  }
  if(!scores) return null;
  if(!mine||s>mine.s) scores=scores.filter(r=>r.n!==name).concat({n:name,s}).sort((a,b)=>b.s-a.s);
  return {scores,name,sec,day:daily,rec:s>0&&(!mine||s>mine.s)};
}

// Зоны: см. zones.js (ZONES, ZONE_LEN)

// дорожки, чтобы баннеры не накладывались друг на друга
const quoteLanes=[false,false,false,false];
// 🟢 в тексте — маркер второй жизни: рисуем зелёный гриб (CSS-фильтр красит 🍄)
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function upHtml(s){ return esc(s).replace(/🟢/g,'<span class="up">🍄</span>'); }
function showQuote(txt, big){
  let lane=quoteLanes.indexOf(false);
  if(lane<0)lane=0; // все заняты — кладём в нижнюю, хуже не будет
  quoteLanes[lane]=true;
  const el=document.createElement('div'); el.className='quote'; el.innerHTML=upHtml(txt);
  el.style.bottom=(H*S*(0.30+lane*0.075))+'px';
  if(big) el.classList.add('big');
  ui.appendChild(el);
  setTimeout(()=>{ el.remove(); quoteLanes[lane]=false; },1700);
}
