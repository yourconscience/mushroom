// --- Прогресс между забегами: лесенка из 15 шагов открывает предметы, вкладки, режимы и перки на старт (только для обычного ника) ---
function loadMeta(){
  const d={found:0,top:0,seen:{},beat:{},minis:{},miniBeat:{},heroes:{},maxLvl:0,combo:0,items:{},streak:0,rooms:{}};
  let m; try{ m=Object.assign(d,JSON.parse(localStorage.gribMeta||'{}')); }catch(e){ m=d; }
  // миграция: ветеран с found или любым seen уже доходил до 7-го уровня и делал комбо x3
  if(m.found||Object.keys(m.seen).length){ m.maxLvl=Math.max(m.maxLvl||0,7); m.combo=Math.max(m.combo||0,3); }
  m.streak=Math.max(m.streak||0,streakNow()); // лучшая серия забега дня
  return m;
}
const meta=loadMeta();
const cnt=o=>Object.keys(o).length;
const HEROES=()=>Object.keys(MODES).filter(n=>n!=='ЛЕГЕНДА');
// порядок, в котором загадки открывают ники (по числу сделанных шагов)
const SECRET_ORDER=['ИЗИ','ДУТЫЙ','МАРИО','V','Z','ОКСАНА','X','ПЕТУШОК','ГНОЙНЫЙ'];
const GOALS=[
  {id:'combo3',  t:'Комбо x3', r:'🫧 пузырь в игре', ok:()=>meta.combo>=3},
  {id:'lvl3',    t:'Дойти до 3-го уровня', r:'вкладка «Секреты»: первая загадка', ok:()=>meta.maxLvl>=3},
  {id:'mini',    t:'Встретить мини-босса (4-й уровень)', r:'вкладка «Коллекция» и спарринг', ok:()=>cnt(meta.minis)>0},
  {id:'minibeat',t:'Завалить мини-босса', r:'🟢 1UP в игре', ok:()=>cnt(meta.miniBeat)>0||!!meta.found}, // до босса не дойти, не завалив мини-босса
  {id:'found',   t:'Дойти до первого босса (7-й уровень)', r:'⚡ молния в игре', ok:()=>meta.found},
  {id:'beat',    t:'Завалить босса', r:'⭐ звезда в игре, 🍄 старт большим, режим БАТТЛ', ok:()=>cnt(meta.beat)>0},
  {id:'streak3', t:'Забег дня 3 дня подряд', r:'👻 призрак в игре', ok:()=>meta.streak>=3, p:()=>meta.streak+'/3'},
  {id:'beat3',   t:'Завалить трёх разных боссов', r:'🎤 панч в игре', ok:()=>cnt(meta.beat)>=3, p:()=>cnt(meta.beat)+'/3'},
  {id:'minis',   t:'Встретить всех мини-боссов', r:'🧲 магнит на старте', ok:()=>cnt(meta.minis)>=MINI_KINDS.length, p:()=>cnt(meta.minis)+'/'+MINI_KINDS.length},
  {id:'seen',    t:'Встретить всех боссов', r:'🎰 заряд казино на старте', ok:()=>cnt(meta.seen)>=BOSS_KINDS.length, p:()=>cnt(meta.seen)+'/'+BOSS_KINDS.length},
  {id:'top',     t:'Попасть в топ-10', r:'золотая шляпка', ok:()=>meta.top},
  {id:'streak7', t:'Забег дня 7 дней подряд', r:'ещё одна жизнь на старте', ok:()=>meta.streak>=7, p:()=>meta.streak+'/7'},
  {id:'rooms',   t:'Найти все тайные комнаты', r:'трубы встречаются вдвое чаще', ok:()=>cnt(meta.rooms)>=ROOM_ORDER.length, p:()=>cnt(meta.rooms)+'/'+ROOM_ORDER.length},
  {id:'all',     t:'Завалить всех боссов', r:'🦠 споры на старте', ok:()=>cnt(meta.beat)>=BOSS_KINDS.length, p:()=>cnt(meta.beat)+'/'+BOSS_KINDS.length},
  {id:'heroes',  t:'Сыграть всеми тайными героями', r:'режим ЛЕГЕНДА', ok:()=>HEROES().every(n=>meta.heroes[n]), p:()=>HEROES().filter(n=>meta.heroes[n]).length+'/'+HEROES().length},
];
const goalDone=id=>!!GOALS.find(g=>g.id===id).ok();
// какой новый предмет уже открыт: восемь старых — всем, новый — после своего шага, в забеге дня — всё
function bonusOpen(kind){
  if(daily) return true;
  const step={star:'beat',life:'minibeat',bubble:'combo3',zap:'found',punch:'beat3',ghost:'streak3'}[kind];
  return step?goalDone(step):true;
}
let runUnlocks=[];
function renderRunUnlocks(){
  const p=document.getElementById('overUnlock'); p.textContent='';
  p.classList.toggle('hidden',!runUnlocks.length);
  if(runUnlocks.length) p.append(el('b','sect','🔓 Открыто за этот забег'));
  for(const g of runUnlocks) p.append(el('div',null,g.t+': '+g.r));
}
function colDone(){ return cnt(meta.seen)+cnt(meta.beat)+cnt(meta.minis)+cnt(meta.miniBeat)+cnt(meta.items)+cnt(meta.heroes)+cnt(meta.rooms); }
function colTotal(){ return BOSS_KINDS.length*2+MINI_KINDS.length*2+Object.keys(BONUSES).length+HEROES().length+ROOM_ORDER.length; }
function syncMeta(){
  document.getElementById('secChip').classList.toggle('hidden',!goalDone('lvl3'));
  document.getElementById('progCount').textContent=GOALS.filter(g=>g.ok()).length+'/'+GOALS.length;
  document.getElementById('bossChip').classList.toggle('hidden',!(cnt(meta.seen)+cnt(meta.minis)));
  document.getElementById('bossCount').textContent=colDone()+'/'+colTotal();
}
function metaEvent(type,key){
  if(spar)return; // спарринг ничего не засчитывает
  const before=GOALS.filter(g=>!g.ok());
  let ch=false;
  if(type==='boss'){ if(!meta.seen[key]){meta.seen[key]=1;ch=true;} if(charMode!=='GNOY'&&!meta.found){meta.found=1;ch=true;} } // ГНОЙНЫЙ стартует у босса, это не считается
  else if(type==='beat'){ if(!meta.beat[key]){meta.beat[key]=1;ch=true;} }
  else if(type==='mini'){ if(!meta.minis[key]){meta.minis[key]=1;ch=true;} }
  else if(type==='minibeat'){ if(!meta.miniBeat[key]){meta.miniBeat[key]=1;ch=true;} }
  else if(type==='top'){ if(!meta.top){meta.top=1;ch=true;} }
  else if(type==='hero'){ if(!meta.heroes[key]){meta.heroes[key]=1;ch=true;} }
  else if(type==='item'){ if(!meta.items[key]){meta.items[key]=1;ch=true;} }
  else if(type==='room'){ if(!meta.rooms[key]){meta.rooms[key]=1;ch=true;} }
  else if(type==='level'){ if(key>meta.maxLvl){meta.maxLvl=key;ch=true;} }
  else if(type==='combo'){ if(key>meta.combo){meta.combo=key;ch=true;} }
  else if(type==='streak'){ if(key>meta.streak){meta.streak=key;ch=true;} }
  if(!ch) return; // ничего не изменилось: не пишем в localStorage и не перерисовываем
  try{ localStorage.gribMeta=JSON.stringify(meta); }catch(e){}
  for(const g of before) if(g.ok()){ runUnlocks.push(g); showQuote('🔓 ОТКРЫТО: '+g.r,true); }
  renderRunUnlocks(); syncMeta();
}
function applyPerks(){
  if(goalDone('beat')) player.big=true;
  if(goalDone('seen')){ slotCharges=1; slotBtn.classList.remove('hidden'); }
  if(goalDone('all')) spT=BONUSES.spore.dur;
  if(goalDone('minis')) mgT=BONUSES.magnet.dur;
  if(goalDone('streak7')) oneUp=1;
}
function fillProg(p){
  p.textContent='';
  const list=el('div','blist');
  for(const g of GOALS){
    list.append(el('div','ic',g.ok()?'✅':'🔒'));
    const d=el('div'); d.append(el('b',null,g.t+(g.p&&!g.ok()?' ('+g.p()+')':'')),' — '+g.r); list.append(d);
  }
  p.append(list);
}
const BOSS_INFO={
  plumber:['🔧','Кидает ключи очередями, с первого тычка прыгает и пускает волну по земле.','прыгни на голову, когда прёт на гриб'],
  pigeon:['🐦','Сам недосягаем. Несёт яйца, а если пропустишь золотое, пикирует и проносится по земле.','прыгни на золотое яйцо, оно полетит в голубя'],
  balloon:['🎈','Пускает пузыри: низкий перепрыгни, под высоким стой. От тычков сдувается.','снизу, макушкой, когда плывёт над грибом'],
  rooster:['🐓','Осколки и кольца идут серией в ритме, потом он бежит и финтит. Бить его бесполезно.','пройди серию без удара, и он треснет сам'],
  worm:['🪱','Бугор идёт к грибу рывками и бьёт снизу, надо быть в воздухе. Потом вылезают две головы.','по голове со звёздами, колючая жалит'],
  ufo:['🛸','До неё не допрыгнуть. Диски по одному: низкий перепрыгни, высокий пропусти стоя. Потом метка на земле мигает трижды: как застыла со звуком — прыгай, вспышка жжёт землю.','прыгни на золотой диск, он подбросит на тарелку'],
  king:['👑','Финальный босс круга. Волны, споры, телепорт и рывок. С третьего тычка зовёт солдат и надевает броню.','по шляпке, когда сел и ползёт; в броне сначала раздави солдата'],
  oxy:['📖','Слова летят на двух высотах, вразнобой. Телом не бьёт: не попал — убежит за экран и вернётся.','когда идёт на гриб с микрофоном'],
  shock:['⚡','Разряды ложатся на землю. После тычка иногда бьёт током по всему полу: на вспышку будь в прыжке. Телом не бьёт.','когда разрядился и идёт на гриб'],
  gnoy:['🟢','Лужи гноя лежат на земле, после тычка ещё и облака газа. Телом не бьёт: не попал — вернётся.','когда бежит на гриб'],
  dancer:['🕺','Диски на двух высотах и волны вразнобой. Телом не бьёт: не попал — вернётся.','когда уезжает лунной походкой на гриб'],
  ricky:['🎧','Кидает «ФФФ» на двух высотах, после тычка ещё и волны. Телом не бьёт: не попал — вернётся.','когда идёт на гриб'],
};
function fillCollection(p){
  p.textContent='';
  const sect=(title,kinds,seen,beat)=>{
    const met=kinds.filter(k=>seen[k.kind]);
    p.append(el('b','sect',title+': '+met.length+'/'+kinds.length));
    const list=el('div','blist');
    for(const k of met){
      const [ic,what,how]=BOSS_INFO[k.kind], d=el('div');
      list.append(el('div','ic',ic));
      d.append(el('b',null,k.name+(beat[k.kind]?' ✅':'')),' — '+k.hp+(k.hp<5?' тычка. ':' тычков. ')+what+' Как бить: '+how+'.',el('br'));
      const c=el('button','chip','Спарринг'); c.addEventListener('click',()=>{ spar={kind:k.kind,mini:!!k.mini,i:kinds.indexOf(k),name:k.name}; daily=''; startGame(); }); d.append(c);
      list.append(d);
    }
    p.append(list);
    if(met.length<kinds.length) p.append(el('div',null,'Ещё не встречено: '+(kinds.length-met.length)));
  };
  sect('Боссы',BOSS_KINDS,meta.seen,meta.beat);
  sect('Мини-боссы',MINI_KINDS,meta.minis,meta.miniBeat);
  { // предметы: все из BONUSES (14), собрал или ещё нет
    const iks=Object.keys(BONUSES);
    p.append(el('b','sect','Предметы: '+cnt(meta.items)+'/'+iks.length));
    const list=el('div','blist');
    for(const k of iks){
      const got=!!meta.items[k], name=(BONUS_INFO[k]&&BONUS_INFO[k][0])||k;
      list.append(el('div','ic',got?BONUSES[k].icon:'🔒'));
      list.append(el('div',null,name+(got?' ✅':'')));
    }
    p.append(list);
  }
  { // тайные комнаты: найденная показывает имя, ненайденная замок
    p.append(el('b','sect','Тайные комнаты: '+cnt(meta.rooms)+'/'+ROOM_ORDER.length));
    const list=el('div','blist');
    for(const k of ROOM_ORDER){ const got=!!meta.rooms[k]; list.append(el('div','ic',got?ROOM_KINDS[k].icon:'🔒')); list.append(el('div',null,got?ROOM_KINDS[k].name+' ✅':'???')); }
    p.append(list);
  }
  { // герои
    const hs=HEROES();
    p.append(el('b','sect','Герои: '+hs.filter(n=>meta.heroes[n]).length+'/'+hs.length));
    const list=el('div','blist');
    for(const n of hs){
      const got=!!meta.heroes[n];
      list.append(el('div','ic',got?'🦸':'🔒'));
      list.append(el('div',null,n+(got?' ✅':'')));
    }
    p.append(list);
  }
}
function fillSecrets(p){
  p.textContent='';
  p.append(el('b','sect','Тапни ник и жми ИГРАТЬ. У тайных ников свой топ.'));
  const cur=upName(nickEl.value), revealed=Math.min(SECRET_ORDER.length,GOALS.filter(g=>g.ok()).length);
  const list=el('div','blist');
  const addNick=(n,ok,lock)=>{
    if(!ok){ list.append(el('div','ic','🔒')); list.append(el('div','riddle',lock)); return; } // загадка без имени
    const c=el('button','chip',n); c.setAttribute('aria-pressed',n===cur);
    c.addEventListener('click',()=>{ try{ if(!isSecret(upName(nickEl.value))) localStorage.gribOwnName=upName(nickEl.value); }catch(e){} nickEl.value=n; fillSecrets(p); });
    list.append(el('div','ic','🔓')); list.append(c);
  };
  SECRET_ORDER.forEach((n,i)=>addNick(n,i<revealed,MODES[n].hint));
  addNick('БАТТЛ',goalDone('beat'),'???'); // БАТТЛ и ЛЕГЕНДА держат свои условия
  addNick('ЛЕГЕНДА',goalDone('heroes'),'???');
  p.append(list);
  if(MODES[cur]) p.append(el('div',null,'«'+cur+'»: '+MODES[cur].info+'.'));
  let own=''; try{ own=localStorage.gribOwnName||''; }catch(e){}
  if(isSecret(cur)&&own){ const b=el('button','chip','← Вернуть ник '+own); b.addEventListener('click',()=>{ nickEl.value=own; fillSecrets(p); }); p.append(b); }
}
const FILL={bonus:fillBonus,levels:fillLevels,top:fillTop,pool:()=>renderPool(),prog:fillProg,bosses:fillCollection,secrets:fillSecrets};
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  const on=b.getAttribute('aria-pressed')!=='true';
  document.querySelectorAll('[data-tab]').forEach(o=>{ o.setAttribute('aria-pressed','false'); document.getElementById('tab-'+o.dataset.tab).classList.add('hidden'); });
  if(on){ b.setAttribute('aria-pressed','true'); const p=document.getElementById('tab-'+b.dataset.tab); FILL[b.dataset.tab](p); p.classList.remove('hidden'); }
}));
document.getElementById('btn2').addEventListener('click',startGame);
document.getElementById('btnMenu').addEventListener('click',()=>{ daily=''; spar=null; overEl.classList.add('hidden'); menuEl.classList.remove('hidden'); });
