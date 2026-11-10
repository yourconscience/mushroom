// нуар: на ZONE_LEN пути всё ч/б, текущие бонусы сгорают (кроме большого гриба), новых нет
function startNoir(){
  noirTo=dist+ZONE_LEN; jetT=0; spT=0; hyT=0; fsT=0; mgT=0; // большой гриб остаётся
  slotCharges=0; slotBtn.classList.add('hidden'); pickups=[];
  document.body.style.filter='grayscale(1)';
}
// удар: большой гриб уменьшается и неуязвим 1.5 с, маленький умирает
function hit(){
  if(player.dead||player.inv>0)return;
  if(boss) boss.touched=1;
  if(!player.big){ die(); return; }
  player.big=false; player.inv=1.5;
  sHurt(); shake(9,.35); showQuote('ГРИБ СДУЛСЯ, НО ЖИВ 🍄',true);
  for(let i=0;i<14;i++)parts.push({x:player.x,y:player.y-24,vx:(Math.random()-.5)*450,vy:-Math.random()*350,l:.6,c:'#e63946'});
}
function die(){
  if(player.dead)return;
  track('end:'+(zoneN+1)+':'+(boss&&boss.st!=='dead'?boss.kind:player.y>H+80?'pit':'enemy')); // где и от чего кончился забег
  player.dead=true; player.vy=-500; if(AC)stopClip(); sDie(); scratch(); shake(14,.5);
  if(navigator.vibrate)navigator.vibrate([60,40,80]);
  setTimeout(()=>{
    running=false; hud.classList.add('hidden'); slotBtn.classList.add('hidden');
    const s=(score*SM)|0, key=myKey();
    sessBest[key]=Math.max(sessBest[key]||0,s); // лучшее за визит, отдельно для каждого ника
    const line=DEATH_LINES[(Math.random()*DEATH_LINES.length)|0];
    const overTop=document.getElementById('overTop'), overBest=document.getElementById('overBest');
    document.getElementById('overLine').textContent=line;
    document.getElementById('overScore').textContent=s;
    overBest.textContent=sessBest[key];
    document.getElementById('overBestL').textContent=daily?'Лучшее сегодня':'Лучшее за сессию';
    document.getElementById('overRec').classList.add('hidden');
    document.getElementById('overPool').classList.add('hidden');
    menuEl.classList.add('hidden'); overEl.classList.remove('hidden'); overlay.classList.remove('hidden');
    document.body.style.filter=baseFilter(); // нуар не тянем на экран смерти
    shareFile=null; shareKey=''; prepShare(s,line);
    confetti(45);
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
  },900);
}
