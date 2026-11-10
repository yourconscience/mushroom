// --- Цикл ---
let lt=0;
function loop(ts){
  requestAnimationFrame(loop);
  const t=ts/1000, rdt=Math.min((ts-lt)/1000,0.033); lt=ts;
  const dt=rdt*(hyT>0?0.5:fsT>0?1.4:1)*(charMode==='EZ'?0.8:1); // гипногриб: вдвое медленнее, потом отходняк x1.4; таймеры бонусов в реальном времени
  ctx.setTransform(DPR*S,0,0,DPR*S,0,0);
  if(running&&hyT>0){ ctx.translate(W/2,H/2); ctx.transform(1,Math.sin(t*2.3)*.015,Math.sin(t*1.9)*.015,1,0,0); ctx.translate(-W/2,-H/2); }
  if(shakeT>0){ shakeT-=rdt; const a=shakeA*Math.min(1,shakeT*4); ctx.translate((Math.random()-.5)*2*a,(Math.random()-.5)*2*a); if(shakeT<=0)shakeA=0; }
  drawBg(t);
  if(!running){ return; }

  if(!player.dead){
    jetT=Math.max(0,jetT-rdt); spT=Math.max(0,spT-rdt); if(hyT>0){ hyT-=rdt; if(hyT<=0){ hyT=0; fsT=3; showQuote('ОТХОДНЯК: ГАЗ В ПОЛ 🏎',true); } } mgT=Math.max(0,mgT-rdt); fsT=Math.max(0,fsT-rdt); starT=Math.max(0,starT-rdt); zapT=Math.max(0,zapT-rdt); ghostT=Math.max(0,ghostT-rdt);
    noKillT+=rdt; if(combo>pCombo)noKillT=0; pCombo=combo; // резинка: время без убийств
    if(noirTo&&dist>=noirTo){ noirTo=0; document.body.style.filter=baseFilter(); showQuote('ЦВЕТ ВЕРНУЛСЯ 🌈',true); } player.inv=Math.max(0,player.inv-rdt);
    if(charMode==='V')jetT=9; // вечный ранец
    const sm=starT>0?1.25:1; // звезда: гриб на 25% быстрее
    if(!boss){ speed=Math.min(560,speed+dt*(zoneN<7?1.2:2)); dist+=speed*sm*dt; } // пока жив босс, зона и скорость стоят
    player.x+=speed*sm*dt;
    // гриб ближе к левому краю — впереди видно больше
    camX=player.x-Math.min(100,W*0.16);
    // смена зоны: все зоны по разу, дальше круг II, III... с ускорением
    const zn=(dist/ZONE_LEN)|0;
    if(zn!==zoneN){
      zoneN=zn; zoneI=zn%ZONES.length; lap=(zn/ZONES.length)|0;
      metaEvent('level',zn+1);
      if((charMode==='EZ'||charMode==='LEG')&&!player.big){ player.big=true; showQuote('ИЗИИИИ 😏',false); }
      speed+=zn<7?5:8;
      announceZone(zn);
      playZone(zn);
    }
  }
  tickMusic();
  // персонаж Z: каждые 5 секунд срабатывает случайный эффект казино
  if(charMode==='Z'&&!player.dead){
    zTimer+=dt;
    if(zTimer>=5){
      zTimer=0;
      const o=slotPick();
      applySlot(o.k); showQuote('⚡ '+o.t,true);
      beep(880,.1); setTimeout(()=>beep(660,.12),80);
    }
  }
  // физика
  player.vy+=G*(charMode==='PUFF'?0.6:1)*dt; player.y+=player.vy*dt;
  player.squish+= (0-player.squish)*Math.min(1,dt*10);

  // платформы
  let onGround=false; const edge=player.big?30:14;
  for(const p of plats){
    if(player.x>p.x-edge&&player.x<p.x+p.w+edge&&player.vy>=0&&player.y>=p.y-6&&player.y<=p.y+Math.max(26,player.vy*dt+8)){
      player.y=p.y; player.vy=0; if(player.jumps<maxJumps()&&!onGround){ player.squish=0.22; } player.jumps=maxJumps(); onGround=true;
    }
  }
  if(onGround) { combo>0&&(comboT-=dt); if(comboT<=0) combo=0; }

  // генерация/чистка
  while(plats[plats.length-1].x<camX+W*2.5) addPlat(plats[plats.length-1].x+plats[plats.length-1].w);
  plats=plats.filter(p=>p.x+p.w>camX-200);
  enemies=enemies.filter(e=>e.x>camX-200&&e.dead<1);
  pickups=pickups.filter(b=>b.x>camX-100);

  // подбор бонусов
  for(const b of pickups){
    if(player.dead||b.got)continue;
    if(mgT>0){ const mx=player.x-b.x, my=player.y-20-b.y, md=Math.hypot(mx,my); if(md<260&&md>1){ b.x+=mx/md*600*dt; b.y+=my/md*600*dt; } }
    if(Math.abs(player.x-b.x)<32&&Math.abs(player.y-20-b.y)<44){
      b.got=true;
      const B=BONUSES[b.kind];
      showQuote(B.quote,true);
      beep(700,.08); setTimeout(()=>beep(1050,.12),60);
      if(navigator.vibrate)navigator.vibrate(40);
      shake(3,.15); popText(b.x,b.y-30,B.icon+(b.kind==='loot'?' +500':''),B.color);
      metaEvent('item',b.kind);
      if(b.kind==='jet')jetT=B.dur;
      else if(b.kind==='big')player.big=true;
      else if(b.kind==='spore')spT=B.dur;
      else if(b.kind==='hypno')hyT=B.dur;
      else if(b.kind==='magnet')mgT=B.dur;
      else if(b.kind==='noir'){ startNoir(); starT=0; zapT=0; ghostT=0; } // нуар сжигает и новые таймеры; пузырь и 1UP остаются
      else if(b.kind==='loot')score+=500;
      else if(b.kind==='slot'){ if(slotCharges<2){ slotCharges++; slotBtn.classList.remove('hidden'); if(!spinning)slotLabel(); } else { score+=300; popText(b.x,b.y-60,'+300',B.color); } } // в запасе не больше двух зарядов
      else if(b.kind==='star')starT=B.dur;
      else if(b.kind==='life')giveLife();
      else if(b.kind==='bubble'){ if(bubble>0){ score+=300; popText(b.x,b.y-60,'+300',B.color); } else bubble=1; }
      else if(b.kind==='zap'){ zapT=B.dur; zapBoss(); }
      else if(b.kind==='punch')firePunch();
      else if(b.kind==='ghost')ghostT=B.dur;
      for(let i=0;i<14;i++)parts.push({x:b.x,y:b.y,vx:(Math.random()-.5)*450,vy:-Math.random()*350,l:.6,c:B.color});
    }
  }
  pickups=pickups.filter(b=>!b.got);

  // враги: у каждого свой характер — скорость, ритм рывков, амплитуда, дистанция
  const emult=ZONES[zoneI].mult*(1+lap*0.25), zm=zapT>0?.5:1, zs=zapT>0?.6:1; // молния: враги вдвое медленнее и мельче
  for(const e of enemies){
    if(e.dead){ e.dead+=dt; continue; }
    if(e.spd===undefined){ // характер выбирается один раз
      e.spd=0.85+Math.random()*0.5; e.fr=2.2+Math.random()*1.6; e.amp=14+Math.random()*20;
      e.pat=Math.random(); e.cd2=0.8+Math.random()*2.4; e.lunge=0; e.hopV=340+Math.random()*120;
      e.burst=0; e.burstT=0; e.dvT=0; e.dip=0;
    }
    const base=(e.type==='slide'?150:e.type==='fly'?85:e.type==='hop'?70:e.type==='spike'?45:e.type==='thrower'?0:e.type==='dive'?40:60)*emult*e.spd*zm;
    let sp=base;
    if(e.dv){
      // пике: летит по прямой, потом возвращается и снова целится
      e.x+=e.dvx*dt*zm; e.y+=e.dvy*dt*zm; e.dir=e.dvx<0?-1:1; e.dvT+=dt;
      if(e.dvT>1.6||e.y>H+80||e.x<camX-140){
        e.dv=false; e.dvT=0; e.x=player.x+200+Math.random()*120; e.y=e.baseY-120; e.cd2=1.2+Math.random()*1.4;
        if(e.dives>=2) e.x=camX-500; // две атаки и улетел
      }
    } else if(e.type==='fly'){
      // маятник с паузами, иногда короткий нырок к грибу
      const ph=t*e.fr+e.t;
      e.x+=e.dir*sp*dt*(0.55+0.45*Math.sin(ph*0.6));
      e.y=e.baseY-58+Math.sin(ph)*e.amp;
      if(e.pat>0.5){ e.cd2-=dt; if(e.cd2<=0){ e.cd2=3.5+Math.random()*3; e.dip=1; } }
      if(e.dip>0){ e.dip-=dt*1.5; e.y+=(player.y-26-e.y)*0.5*Math.sin(Math.max(0,e.dip)*Math.PI); }
    } else if(e.type==='dive'){
      e.x+=e.dir*sp*dt;
      e.y=e.baseY-120+Math.sin(t*3+e.t)*8;
      e.cd2-=dt;
      if(!player.dead&&e.cd2<=0){ const ddx=e.x-player.x;
        if(e.aim>0){ e.aim-=dt; // замирает на 0.3 с с «!», потом пикирует
          if(e.aim<=0){ const tx=player.x-e.x, ty=player.y-20-(e.y-18), d=Math.hypot(tx,ty)||1;
            e.dv=true; e.dives=(e.dives||0)+1; e.dvx=tx/d*380; e.dvy=ty/d*380; } }
        else if(ddx>0&&ddx<320){ e.aim=0.3; beep(1200,.08,'square',.05); } }
    } else if(e.type==='hop'){
      // приседает на земле и подпрыгивает невысоко: одного прыжка гриба всегда хватает, чтобы встать сверху
      if(e.wait>0) e.wait-=dt;
      else { e.x+=e.dir*sp*0.5*dt; e.vy+=G*0.62*dt; e.y+=e.vy*dt;
        if(e.y>=e.baseY){ e.y=e.baseY; e.vy=-(e.pat>0.7&&Math.random()<0.4?e.hopV*0.6:e.hopV); e.wait=0.35+Math.random()*0.35; } }
    } else if(e.type==='thrower'){
      e.dir=player.x<e.x?-1:1;
      const tdx=e.x-player.x, toward=Math.sign(player.x-e.x)||-1;
      // держит дистанцию 240..460 и стреляет очередью из двух ключей
      if(!player.dead){ if(tdx>460)e.x+=toward*60*dt*emult*zm; else if(tdx<240)e.x-=toward*50*dt*emult*zm; }
      if(!player.dead&&e.x>camX&&e.x<camX+W&&tdx>0&&tdx<700){ e.cd-=dt*zm; if(e.cd<=0){ e.cd=1.6+Math.random()*0.7; e.burst=2; } }
      if(e.burst>0){ e.burstT+=dt;
        if(e.burstT>0.22){ e.burstT=0; e.burst--;
          const T=0.6+tdx/1500, x0=e.x, y0=e.y-40;
          const tx=player.x+speed*T+(Math.random()-.5)*70, ty=player.y-20;
          wrenches.push({x:x0,y:y0,vx:(tx-x0)/T,vy:(ty-y0-0.5*WG*T*T)/T,r:0,l:4});
          beep(420,.06,'triangle'); } }
    } else {
      // патруль с рывками: сантехник ускоряется, ёж просто ходит туда-сюда и к грибу не разворачивается
      e.cd2-=dt;
      if(e.lunge>0){ e.lunge-=dt; sp*=e.type==='slide'?2.4:1.9; }
      else if(e.cd2<=0){ e.cd2=2.2+Math.random()*3; e.lunge=e.type==='slide'?0.45:0.3; }
      e.x+=e.dir*sp*dt;
    }
    if(e.type!=='thrower'&&!e.dv){
      if(e.x<e.p.x+18){e.dir=1;} if(e.x>e.p.x+e.p.w-18){e.dir=-1;}
    }
    // коллизия
    const psc=player.big?1.35:1, eh=(e.type==='spike'?30:44)*zs;
    if(!player.dead&&Math.abs(player.x-e.x)<26*psc*zs&&player.y>e.y-eh&&player.y-40*psc<e.y){
      if(starT>0){ // звезда: касание убивает
        e.dead=0.01; if(e.royal&&boss) boss.armor=0;
        combo++; comboT=2.2; score+=100; sStomp(); popText(e.x,e.y-60,'+100','#ffd84d');
        for(let i=0;i<12;i++)parts.push({x:e.x,y:e.y-20,vx:(Math.random()-.5)*400,vy:-Math.random()*300,l:.6,c:'hsl('+((Math.random()*360)|0)+',90%,60%)'});
      } else if(ghostT>0){ /* призрак: проходит насквозь, не давит */
      } else if(player.vy>140&&player.y<e.y-14&&e.type==='spike'){
        // ёж колется: прыжок сверху = удар, но отскок
        player.vy=JUMP*0.6; hit();
      } else if(player.vy>(e.type==='hop'?40:140)&&player.y<e.y-(e.type==='hop'?6:14)){
        // СТОМП
        e.dead=0.01; player.vy=JUMP*0.7; player.jumps=maxJumps();
        if(e.royal&&boss) boss.armor=0;
        combo++; comboT=2.2; metaEvent('combo',combo);
        const pts=100*combo; score+=pts; sStomp();
        if(COMBO_STAMPS[combo]){ stamp(...COMBO_STAMPS[combo]); if(combo>=5) airhorn(); }
        popText(e.x,e.y-60,'+'+pts, combo>1?'#ff2d78':'#ffe14d');
        shake(3+Math.min(combo*1.5,8),.18);
        if(combo>=3) firework(e.x,e.y-80);
        showQuote(QUOTES[(Math.random()*QUOTES.length)|0], combo>=3);
        if(navigator.vibrate)navigator.vibrate(30);
        for(let i=0;i<12;i++)parts.push({x:e.x,y:e.y-20,vx:(Math.random()-.5)*400,vy:-Math.random()*300,l:.6,c:Math.random()<.5?'#d62828':'#2a5fd0'});
      } else if(!player.dead){ hit(); }
    }
  }

  // споры
  if(spT>0&&!player.dead){
    spCd-=dt;
    if(spCd<=0){ spCd=0.35; spores.push({x:player.x+16*(player.big?1.35:1),y:player.y-20*(player.big?1.35:1),vx:speed+500,l:1.2}); beep(900,.04,'triangle',.05); }
  }
  for(const sp of spores){
    sp.l-=dt; sp.x+=sp.vx*dt;
    for(const e of enemies){
      if(e.dead||sp.l<=0)continue;
      if(Math.abs(sp.x-e.x)<24&&sp.y>e.y-50&&sp.y<e.y+6){
        e.dead=0.01; sp.l=0; combo++; comboT=2.2; score+=100; sStomp();
        popText(e.x,e.y-60,'+100','#a6e22e');
        for(let i=0;i<12;i++)parts.push({x:e.x,y:e.y-20,vx:(Math.random()-.5)*400,vy:-Math.random()*300,l:.6,c:'#a6e22e'});
      }
    }
  }
  spores=spores.filter(sp=>sp.l>0);
  // гаечные ключи
  for(const w of wrenches){
    w.l-=dt; w.vy+=WG*dt; w.x+=w.vx*dt; w.y+=w.vy*dt; w.r+=12*dt;
    const wsc=player.big?1.35:1;
    if(!player.dead&&player.inv<=0&&ghostT<=0&&Math.abs(player.x-w.x)<20*wsc&&w.y>player.y-40*wsc-6&&w.y<player.y+4){ w.l=0; hit(); }
  }
  wrenches=wrenches.filter(w=>w.l>0&&w.y<H+100&&w.x>camX-200);
  // босс
  if(arena&&!boss&&!player.dead&&player.x>arena.x+60) startBoss();
  if(boss) updBoss(dt,onGround);
  // падение
  if(!player.dead&&player.y>H+80){ if(bubble>0) useBubble(); else die(); } // яма убивает всегда, звезда не спасает; пузырь — один раз

  if(!player.dead) score+=speed*dt*0.05; // после смерти счёт стоит

  // частицы
  for(const p of parts){ p.l-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=1200*dt; }
  parts=parts.filter(p=>p.l>0);

  // --- рендер мира ---
  for(const p of plats) gfx.plat(ctx,p,camX,t,H,zoneI);
  // бонусы (парят и пульсируют)
  ctx.textAlign='center';
  for(const b of pickups){
    const by=b.y+Math.sin(t*3+b.t)*6, B=BONUSES[b.kind];
    ctx.save(); ctx.translate(b.x-camX,by);
    ctx.globalAlpha=.25; ctx.fillStyle=B.color;
    ctx.beginPath(); ctx.arc(0,0,20+Math.sin(t*6+b.t)*3,0,7); ctx.fill();
    ctx.globalAlpha=1; ctx.font=(Math.max(22,Math.round(16/S)))+'px monospace'; ctx.fillText(B.icon,0,8);
    ctx.restore();
  }
  ctx.textAlign='left';
  if(starT>0&&!player.dead&&Math.random()<dt*40)parts.push({x:player.x+(Math.random()-.5)*30,y:player.y-Math.random()*40,vx:(Math.random()-.5)*120,vy:-60-Math.random()*100,l:.4,c:'hsl('+((t*400+Math.random()*90)%360|0)+',95%,65%)'});
  // выхлоп джетпака
  if(jetT>0&&!player.dead)parts.push({x:player.x-8,y:player.y-6,vx:-120-Math.random()*80,vy:120+Math.random()*120,l:.35,c:Math.random()<.5?'#ff8c42':'#4cc9f0'});
  for(const e of enemies) drawEnemy(e,t);
  if(boss) drawBoss(t);
  for(const sp of spores){
    ctx.globalAlpha=.35; ctx.fillStyle='#a6e22e'; ctx.beginPath(); ctx.arc(sp.x-camX,sp.y,10,0,7); ctx.fill();
    ctx.globalAlpha=1; ctx.fillStyle='#e6ff9e'; ctx.beginPath(); ctx.arc(sp.x-camX,sp.y,4.5,0,7); ctx.fill();
  }
  for(const s of punches){ // выстрел панча: розовая линия с белой сердцевиной
    s.l-=dt; ctx.globalAlpha=Math.max(0,Math.min(1,s.l*5)); ctx.lineCap='round';
    ctx.strokeStyle='#ff7aa8'; ctx.lineWidth=9; ctx.beginPath(); ctx.moveTo(s.x0-camX,s.y0); ctx.lineTo(s.x1-camX,s.y1); ctx.stroke();
    ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.stroke(); ctx.globalAlpha=1; ctx.lineCap='butt';
  }
  punches=punches.filter(s=>s.l>0);
  for(const w of wrenches){
    ctx.save(); ctx.translate(w.x-camX,w.y); ctx.rotate(w.r);
    ctx.fillStyle='#b8bcc4'; ctx.fillRect(-10,-2.5,20,5); ctx.fillRect(-14,-6,7,12);
    ctx.fillStyle='#0b0b14'; ctx.fillRect(-14,-2,4,4);
    ctx.restore();
  }
  for(const p of parts){ ctx.globalAlpha=Math.min(1,p.l*2); ctx.fillStyle=p.c; ctx.fillRect(p.x-camX-3,p.y-3,6,6); ctx.globalAlpha=1; }
  // всплывающие очки
  ctx.textAlign='center'; ctx.font='bold '+(Math.max(22,Math.round(16/S)))+'px monospace';
  for(const tx of texts){
    tx.l-=dt; tx.y-=70*dt;
    ctx.globalAlpha=Math.min(1,tx.l*2.5); ctx.fillStyle=tx.c;
    ctx.strokeStyle='#000'; ctx.lineWidth=4; ctx.strokeText(tx.txt,tx.x-camX,tx.y);
    ctx.fillText(tx.txt,tx.x-camX,tx.y); ctx.globalAlpha=1;
  }
  texts=texts.filter(tx=>tx.l>0);
  ctx.textAlign='left';
  if(!player.dead||player.y<H+200) drawGrib(player,t);

  scoreEl.textContent='СЧЁТ: '+((score*SM)|0);
  const fx=[oneUp>0?'🟢':'',bubble>0?'🫧':'',player.big?'🍄':'',noirTo?'🎞':''].concat([['jet',jetT],['spore',spT],['hypno',hyT],['magnet',mgT],['star',starT],['zap',zapT],['ghost',ghostT]].filter(a=>a[1]>0).map(a=>BONUSES[a[0]].icon+Math.ceil(a[1])),fsT>0?['🏎'+Math.ceil(fsT)]:[]).filter(Boolean).join(' ');
  fxEl.textContent=fx;
  if(hyT>0){ ctx.fillStyle='hsla('+((t*90)%360|0)+',90%,60%,0.14)'; ctx.fillRect(-20,-20,W+40,H+40); }
  comboEl.textContent=combo>1?('x'+combo+' КОМБО'):'';
}
