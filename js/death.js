// нуар: на ZONE_LEN пути всё ч/б, текущие бонусы сгорают (кроме большого гриба), новых нет
function startNoir(){
  noirTo=dist+ZONE_LEN; jetT=0; spT=0; hyT=0; fsT=0; mgT=0; // большой гриб остаётся
  slotCharges=0; slotBtn.classList.add('hidden'); pickups=[];
  document.body.style.filter='grayscale(1)';
}
// удар: большой гриб уменьшается и неуязвим 1.5 с, маленький умирает
function hit(){
  if(player.dead||player.inv>0||starT>0||ghostT>0)return; // звезда и призрак: ничто не бьёт
  if(boss) boss.touched=1;
  if(!player.big){ die(); return; }
  player.big=false; player.inv=1.5;
  sHurt(); shake(9,.35); showQuote('ГРИБ СДУЛСЯ, НО ЖИВ 🍄',true);
  for(let i=0;i<14;i++)parts.push({x:player.x,y:player.y-24,vx:(Math.random()-.5)*450,vy:-Math.random()*350,l:.6,c:'#e63946'});
}
// запас новичка: вместо смерти встаёт на ближайшую платформу, которая тянется хотя бы на 60 px вперёд
function revive(){
  oneUp--;
  const p=plats.find(q=>q.x+q.w>Math.max(player.x,q.x+40)+60)||plats[plats.length-1];
  player.x=Math.max(player.x,p.x+40); player.y=p.y-160; player.vy=0; player.big=false; player.inv=2.5; player.jumps=maxJumps(); combo=0;
  showQuote('ВТОРАЯ ЖИЗНЬ 🟢',true); shake(10,.35); sJingle(ZONES[0]);
}
// пузырь: падение в яму — гриб возвращается на первую платформу впереди, 1 с неуязвимости
function useBubble(){
  bubble=0;
  const p=plats.find(q=>q.x+q.w>Math.max(player.x,q.x+40)+60)||plats[plats.length-1];
  player.x=Math.max(player.x,p.x+40); player.y=p.y-160; player.vy=0; player.inv=1; player.jumps=maxJumps();
  showQuote('ПУЗЫРЬ ЛОПНУЛ, ГРИБ СПАСЁН 🫧',true); shake(6,.2); beep(900,.1); setTimeout(()=>beep(1300,.12),70);
  for(let i=0;i<14;i++)parts.push({x:player.x,y:player.y,vx:(Math.random()-.5)*400,vy:-Math.random()*300,l:.6,c:'#7ad7ff'});
}
function die(){
  if(player.dead)return;
  if(oneUp>0){ revive(); return; }
  // где и от чего кончился забег; endn — на узком экране; активная элита (duel/charge/behind) важнее ямы и врага
  const el=enemies.find(e=>e.type==='elite'&&(e.st==='duel'||e.st==='charge'||e.st==='behind'));
  if(!spar) track((S<1?'endn:':'end:')+(zoneN+1)+':'+(boss&&boss.st!=='dead'?boss.kind:el?'e-'+el.ek:player.y>H+80?'pit':'enemy'));
  player.dead=true; player.vy=-500; if(AC)stopClip(); sDie(); scratch(); shake(14,.5);
  if(navigator.vibrate)navigator.vibrate([60,40,80]);
  dieT=setTimeout(overCard,900);
}
function overCard(){ // карточка конца забега; для спарринга зовётся и после победы
  if(!running)return;
  {
    running=false; hud.classList.add('hidden'); slotBtn.classList.add('hidden');
    const s=(score*SM)|0, key=myKey();
    if(AC)stopClip();
    if(!spar) sessBest[key]=Math.max(sessBest[key]||0,s); // лучшее за визит, отдельно для каждого ника
    const line=spar?'СПАРРИНГ: '+spar.name+(sparWon?' ПОВЕРЖЕН':''):DEATH_LINES[(Math.random()*DEATH_LINES.length)|0];
    const overTop=document.getElementById('overTop'), overBest=document.getElementById('overBest');
    document.getElementById('overTitle').textContent=spar?(sparWon?'ПОБЕДА':'СПАРРИНГ'):'RIP ГРИБ';
    document.getElementById('overLine').textContent=line;
    document.getElementById('overScore').textContent=s;
    overBest.textContent=sessBest[key]||0;
    document.getElementById('overBestL').textContent=daily?'Лучшее сегодня':'Лучшее за сессию';
    document.getElementById('overRec').classList.add('hidden');
    document.getElementById('overPool').classList.add('hidden');
    menuEl.classList.add('hidden'); overEl.classList.remove('hidden'); overlay.classList.remove('hidden');
    document.body.style.filter=baseFilter(); // нуар не тянем на экран смерти
    shareFile=null; shareKey='';
    confetti(45);
    document.getElementById('btnShare').classList.toggle('hidden',!!spar);
    if(spar){ overTop.textContent='Спарринг: очки не идут в топ'; return; }
    prepShare(s,line);
    document.getElementById('btnShare').onclick=()=>shareScore(s,line);
    overTop.textContent='Лидерборд грузится…';
    submitScore(s).then(res=>{
      if(!res){ overTop.textContent='Лидерборд недоступен (нет сети)'; return; }
      lastScores=res.scores;
      const mine=res.day&&res.scores.find(r=>r.n===res.name); // забег дня: лучшее сегодня берём из топа дня, не из сессии
      if(mine&&mine.s>sessBest[key]){ sessBest[key]=mine.s; overBest.textContent=mine.s; }
      // личный рекорд = побил свою строку в своём топе (общем или секретном)
      if(res.rec){ document.getElementById('overRec').classList.remove('hidden'); confetti(120); sJingle(ZONES[0]); }
      renderTop(overTop,res.scores,res.name,res.sec,res.day?'Забег дня · '+dayLabel(res.day):'');
      prepShare(s,line); // пересобрать картинку уже с топом
      if(!res.day&&checkPool(res.scores,res.name)) document.getElementById('overPool').classList.remove('hidden');
    });
  }
}
