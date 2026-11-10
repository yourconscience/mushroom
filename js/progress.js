// --- Прогресс между забегами: цели открывают тайные ники, режимы и перки на старт (только для обычного ника) ---
function loadMeta(){ const d={found:0,top:0,seen:{},beat:{},minis:{},heroes:{}}; try{ return Object.assign(d,JSON.parse(localStorage.gribMeta||'{}')); }catch(e){ return d; } }
const meta=loadMeta();
const cnt=o=>Object.keys(o).length;
const HEROES=()=>Object.keys(MODES).filter(n=>n!=='ЛЕГЕНДА');
const GOALS=[
  {id:'found', t:'Дойти до первого босса (10-й уровень)', r:'вкладка «Секреты» в меню: все тайные ники', ok:()=>meta.found},
  {id:'beat',  t:'Завалить босса', r:'🍄 старт большим грибом и режим БАТТЛ', ok:()=>cnt(meta.beat)>0},
  {id:'seen',  t:'Встретить всех боссов', r:'🎰 заряд казино на старте', ok:()=>cnt(meta.seen)>=BOSS_KINDS.length, p:()=>cnt(meta.seen)+'/'+BOSS_KINDS.length},
  {id:'all',   t:'Завалить всех боссов', r:'🦠 споры на старте', ok:()=>cnt(meta.beat)>=BOSS_KINDS.length, p:()=>cnt(meta.beat)+'/'+BOSS_KINDS.length},
  {id:'minis', t:'Встретить всех мини-боссов', r:'🧲 магнит на старте', ok:()=>cnt(meta.minis)>=MINI_KINDS.length, p:()=>cnt(meta.minis)+'/'+MINI_KINDS.length},
  {id:'top',   t:'Попасть в топ-10', r:'золотая шляпка', ok:()=>meta.top},
  {id:'heroes',t:'Сыграть всеми тайными героями', r:'режим ЛЕГЕНДА', ok:()=>HEROES().every(n=>meta.heroes[n]), p:()=>HEROES().filter(n=>meta.heroes[n]).length+'/'+HEROES().length},
];
const goalDone=id=>!!GOALS.find(g=>g.id===id).ok();
let runUnlocks=[];
function renderRunUnlocks(){
  const p=document.getElementById('overUnlock'); p.textContent='';
  p.classList.toggle('hidden',!runUnlocks.length);
  if(runUnlocks.length) p.append(el('b','sect','🔓 Открыто за этот забег'));
  for(const g of runUnlocks) p.append(el('div',null,g.t+': '+g.r));
}
function syncMeta(){
  document.getElementById('secChip').classList.toggle('hidden',!goalDone('found'));
  document.getElementById('progCount').textContent=GOALS.filter(g=>g.ok()).length+'/'+GOALS.length;
  document.getElementById('bossChip').classList.toggle('hidden',!(cnt(meta.seen)+cnt(meta.minis)));
  document.getElementById('bossCount').textContent=cnt(meta.seen)+'/'+BOSS_KINDS.length;
}
function metaEvent(type,key){
  const before=GOALS.filter(g=>!g.ok());
  if(type==='boss'){ meta.seen[key]=1; if(charMode!=='GNOY') meta.found=1; } // ГНОЙНЫЙ стартует у босса, это не считается
  else if(type==='beat') meta.beat[key]=1;
  else if(type==='mini') meta.minis[key]=1;
  else if(type==='top') meta.top=1;
  else if(type==='hero') meta.heroes[key]=1;
  try{ localStorage.gribMeta=JSON.stringify(meta); }catch(e){}
  for(const g of before) if(g.ok()){ runUnlocks.push(g); showQuote('🔓 ОТКРЫТО: '+g.r,true); }
  renderRunUnlocks(); syncMeta();
}
function applyPerks(){
  if(goalDone('beat')) player.big=true;
  if(goalDone('seen')){ slotCharges=1; slotBtn.classList.remove('hidden'); }
  if(goalDone('all')) spT=BONUSES.spore.dur;
  if(goalDone('minis')) mgT=BONUSES.magnet.dur;
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
  ufo:['🛸','До неё не допрыгнуть. Веер дисков, потом луч по метке: он жжёт землю, будь в прыжке.','прыгни на золотой диск, он подбросит на тарелку'],
  king:['👑','Финальный босс круга. Волны, споры, телепорт и рывок. С третьего тычка зовёт солдат и надевает броню.','по шляпке, когда сел и ползёт; в броне сначала раздави солдата'],
  oxy:['📖','Слова летят на двух высотах, вразнобой. Телом не бьёт: не попал — убежит за экран и вернётся.','когда идёт на гриб с микрофоном'],
  shock:['⚡','Разряды ложатся на землю. После тычка иногда бьёт током по всему полу: на вспышку будь в прыжке. Телом не бьёт.','когда разрядился и идёт на гриб'],
  gnoy:['🟢','Лужи гноя лежат на земле, после тычка ещё и облака газа. Телом не бьёт: не попал — вернётся.','когда бежит на гриб'],
  dancer:['🕺','Диски на двух высотах и волны вразнобой. Телом не бьёт: не попал — вернётся.','когда уезжает лунной походкой на гриб'],
  ricky:['🎧','Кидает «ФФФ» на двух высотах, после тычка ещё и волны. Телом не бьёт: не попал — вернётся.','когда идёт на гриб'],
};
function fillBosses(p){
  p.textContent='';
  const sect=(title,kinds,seen,beat)=>{
    const met=kinds.filter(k=>seen[k.kind]);
    p.append(el('b','sect',title+': '+met.length+'/'+kinds.length));
    const list=el('div','blist');
    for(const k of met){
      const [ic,what,how]=BOSS_INFO[k.kind], d=el('div');
      list.append(el('div','ic',ic));
      d.append(el('b',null,k.name+(beat[k.kind]?' ✅':'')),' — '+k.hp+(k.hp<5?' тычка. ':' тычков. ')+what+' Как бить: '+how+'.');
      list.append(d);
    }
    p.append(list);
    if(met.length<kinds.length) p.append(el('div',null,'Ещё не встречено: '+(kinds.length-met.length)));
  };
  sect('Боссы',BOSS_KINDS,meta.seen,meta.beat);
  sect('Мини-боссы',MINI_KINDS,meta.minis,{});
}
function fillSecrets(p){
  p.textContent='';
  p.append(el('b','sect','Тапни ник и жми ИГРАТЬ. У тайных ников свой топ.'));
  const cur=upName(nickEl.value), row=el('div','row');
  for(const n in MODES){
    if((n==='БАТТЛ'&&!goalDone('beat'))||(n==='ЛЕГЕНДА'&&!goalDone('heroes'))){ row.append(el('div','chip','🔒 ???')); continue; }
    const c=el('button','chip',n); c.setAttribute('aria-pressed',n===cur);
    c.addEventListener('click',()=>{ try{ if(!isSecret(upName(nickEl.value))) localStorage.gribOwnName=upName(nickEl.value); }catch(e){} nickEl.value=n; fillSecrets(p); });
    row.append(c);
  }
  p.append(row);
  if(MODES[cur]) p.append(el('div',null,'«'+cur+'»: '+MODES[cur].info+'.'));
  let own=''; try{ own=localStorage.gribOwnName||''; }catch(e){}
  if(isSecret(cur)&&own){ const b=el('button','chip','← Вернуть ник '+own); b.addEventListener('click',()=>{ nickEl.value=own; fillSecrets(p); }); p.append(b); }
}
const FILL={bonus:fillBonus,levels:fillLevels,top:fillTop,pool:()=>renderPool(),prog:fillProg,bosses:fillBosses,secrets:fillSecrets};
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
  const on=b.getAttribute('aria-pressed')!=='true';
  document.querySelectorAll('[data-tab]').forEach(o=>{ o.setAttribute('aria-pressed','false'); document.getElementById('tab-'+o.dataset.tab).classList.add('hidden'); });
  if(on){ b.setAttribute('aria-pressed','true'); const p=document.getElementById('tab-'+b.dataset.tab); FILL[b.dataset.tab](p); p.classList.remove('hidden'); }
}));
document.getElementById('btn2').addEventListener('click',startGame);
document.getElementById('btnMenu').addEventListener('click',()=>{ daily=''; overEl.classList.add('hidden'); menuEl.classList.remove('hidden'); });
