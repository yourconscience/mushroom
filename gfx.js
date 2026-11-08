// Процедурная графика: фоны (кэш в offscreen-канвасах), текстуры платформ.
// rnd(n) — детерминированный хэш из index.html. Фон строится в «пикселях» PS x PS,
// на экран выводится без сглаживания. Всё тяжёлое строится один раз на зону и размер экрана.
function makeGfx(rnd){
const PS=2, OL='#10060c', FADE=0.8, CAP=5;
const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,f)=>{ const A=hx(a),B=hx(b); return '#'+A.map((v,i)=>{ const n=Math.round(v+(B[i]-v)*f); return (n<16?'0':'')+n.toString(16); }).join(''); };
const rgba=(h,a)=>{ const A=hx(h); return 'rgba('+A[0]+','+A[1]+','+A[2]+','+a+')'; };
const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
let ga=1; // общая прозрачность при кросс-фейде зон
const A=(c,a)=>{ c.globalAlpha=ga*a; };
const TAU=Math.PI*2;

// --- кирпичики для построения ---
let noisePat=null;
function noise(x){
  if(!noisePat){
    const c=mk(64,64), n=c.getContext('2d');
    for(let i=0;i<300;i++){ n.fillStyle=i&1?'rgba(255,255,255,.05)':'rgba(0,0,0,.07)'; n.fillRect((rnd(i)*64)|0,(rnd(i+999)*64)|0,1,1); }
    noisePat=x.createPattern(c,'repeat');
  }
  return noisePat;
}
function glow(x,cx,cy,rad,col,a,sy){
  x.save(); x.translate(cx,cy); if(sy)x.scale(1,sy);
  const g=x.createRadialGradient(0,0,0,0,0,rad);
  g.addColorStop(0,rgba(col,a)); g.addColorStop(1,rgba(col,0));
  x.fillStyle=g; x.fillRect(-rad,-rad,2*rad,2*rad); x.restore();
}
function disc(x,cx,cy,rad,col){ x.fillStyle=col; x.beginPath(); x.arc(cx,cy,rad,0,TAU); x.fill(); }
function dots(x,r,sd,n,w,hh,col,aMin){
  for(let i=0;i<n;i++){ x.fillStyle=rgba(col,aMin+r(sd+i*3+2)*0.6); x.fillRect((r(sd+i*3)*w)|0,(r(sd+i*3+1)*hh)|0,1,1); }
}
function twinkles(r,sd,n,W,maxY){
  const o=[]; for(let i=0;i<n;i++) o.push({x:(r(sd+i*3)*W)|0,y:(r(sd+i*3+1)*maxY)|0,s:r(sd+i*3+2),ph:i*1.7});
  return o;
}
function moon(x,r,cx,cy,rad,col,sky0,hal){
  glow(x,cx,cy,rad*hal,col,.22); glow(x,cx,cy,rad*1.8,col,.3);
  x.save(); x.beginPath(); x.arc(cx,cy,rad,0,TAU); x.clip();
  x.fillStyle=mix(col,'#000000',.4); x.fillRect(cx-rad,cy-rad,rad*2,rad*2);
  disc(x,cx-rad*.2,cy-rad*.08,rad*.95,col);
  for(let i=0;i<7;i++){
    const ox=cx+(r(300+i*3)-.5)*rad*1.4, oy=cy+(r(301+i*3)-.5)*rad*1.4, cr=rad*(.1+.13*r(302+i*3));
    disc(x,ox,oy,cr,rgba(mix(col,sky0,.35),.55)); disc(x,ox-cr*.25,oy-cr*.25,cr*.7,rgba(col,.5));
  }
  x.restore();
}
function planet(x,r,Z,cx,cy,R){
  const ring=(front)=>{
    x.save(); x.translate(cx,cy); x.rotate(-.35);
    x.lineCap='butt';
    x.strokeStyle=rgba(mix(Z.win,'#ffffff',.3),.8); x.lineWidth=3;
    x.beginPath(); x.ellipse(0,0,R*1.9,R*.5,0,front?0:Math.PI,front?Math.PI:TAU); x.stroke();
    x.strokeStyle=rgba('#c9a0ff',.6); x.lineWidth=1.5;
    x.beginPath(); x.ellipse(0,0,R*2.25,R*.6,0,front?0:Math.PI,front?Math.PI:TAU); x.stroke();
    x.restore();
  };
  ring(false);
  x.save(); x.beginPath(); x.arc(cx,cy,R,0,TAU); x.clip();
  const g=x.createRadialGradient(cx-R*.45,cy-R*.45,R*.1,cx,cy,R*1.15);
  g.addColorStop(0,'#9ad0ff'); g.addColorStop(.55,'#3a6ea5'); g.addColorStop(1,'#101a3a');
  x.fillStyle=g; x.fillRect(cx-R,cy-R,R*2,R*2);
  for(let i=0;i<5;i++){ x.fillStyle=rgba(i&1?'#ffffff':'#1a2a60',.14); x.fillRect(cx-R,cy-R+R*(.25+i*.36),R*2,R*.14); }
  disc(x,cx-R*.35,cy-R*.4,R*.2,rgba('#ffffff',.15));
  x.restore();
  ring(true);
}

// --- слои ---
function skyline(r,Lv,Z,tw,lh,col,litP,neon){
  const c=mk(tw,lh), x=c.getContext('2d'), dyn=[];
  const hi=mix(col,'#ffffff',.14), lo=mix(col,'#000000',.3), off=mix(col,Z.win,.07);
  const dc=Lv===0?mix(Z.win,col,.55):Lv===1?mix(Z.win,col,.15):Z.win;
  const s0=Lv*5000;
  let px=0,i=0,nw=0,nb=0;
  while(px<tw){
    let bw=14+Lv*8+((r(s0+i)*(12+Lv*4))|0);
    if(px+bw>tw-8)bw=tw-px;
    const bh=Math.round(lh*(.38+r(s0+i+50)*.55)), by=lh-bh, cx=px+((bw/2)|0);
    x.fillStyle=col; x.fillRect(px,by,bw,bh);
    x.fillStyle=hi; x.fillRect(px,by,bw,1);
    x.fillStyle=lo; x.fillRect(px+bw-2,by+1,2,bh-1);
    const rt=r(s0+i+100);
    if(rt<.18){ x.fillStyle=col; x.fillRect(px,by-2,bw,2); x.fillStyle=hi; x.fillRect(px,by-2,bw,1); }
    else if(rt<.34){
      const ah=6+((r(s0+i+101)*8)|0);
      x.fillStyle=lo; x.fillRect(cx,by-ah,1,ah); x.fillRect(cx-2,by-ah+2,5,1);
      if(nb<5){ dyn.push({x:cx-1,y:by-ah-2,k:1,s:nb*7+Lv}); nb++; }
    } else if(rt<.5){
      x.fillStyle=lo; x.fillRect(cx-3,by-3,1,3); x.fillRect(cx+2,by-3,1,3);
      x.fillStyle=col; x.fillRect(cx-3,by-8,6,5); x.fillStyle=hi; x.fillRect(cx-3,by-8,6,1); x.fillStyle=lo; x.fillRect(cx-3,by-5,6,1);
      x.fillRect(cx-2,by-9,4,1);
    } else if(rt<.64){
      x.fillStyle=lo; x.fillRect(cx,by-4,1,4);
      x.fillStyle=hi; x.beginPath(); x.arc(cx,by-5,4,Math.PI*.15,Math.PI); x.fill();
      x.fillStyle=lo; x.fillRect(cx+2,by-9,1,4);
    } else if(rt<.78){
      const nw2=Math.max(6,bw-8); x.fillStyle=col; x.fillRect(px+4,by-6,nw2,6); x.fillStyle=hi; x.fillRect(px+4,by-6,nw2,1); x.fillStyle=lo; x.fillRect(px+4+nw2-2,by-5,2,5);
    } else if(rt<.9){
      x.fillStyle=col; x.beginPath(); x.moveTo(px,by); x.lineTo(px+bw,by); x.lineTo(px+bw,by-6); x.fill();
    } else {
      x.fillStyle=lo; x.fillRect(cx,by-14,1,14); x.fillStyle=col; x.fillRect(cx-1,by-3,3,3);
    }
    for(let wy=by+3,row=0;wy<lh-4;wy+=8,row++){
      for(let wx=px+3,cl=0;wx<px+bw-5;wx+=6,cl++){
        const v=r(s0+i*131+row*17+cl+400);
        if(v<litP){ x.fillStyle=dc; x.fillRect(wx,wy,3,4); }
        else if(v<litP+.05&&nw<8){ x.fillStyle=off; x.fillRect(wx,wy,3,4); dyn.push({x:wx,y:wy,k:0,s:nw*11+Lv*3}); nw++; }
        else { x.fillStyle=off; x.fillRect(wx,wy,3,4); }
      }
    }
    if(neon&&Lv>0&&r(s0+i+200)<.12&&bw>16){
      const nc=['#ff2d78','#4cc9f0',Z.win][(r(s0+i+201)*3)|0], sy=by+4+((r(s0+i+202)*6)|0);
      x.fillStyle=rgba(nc,.22); x.fillRect(px+bw-6,sy-1,6,12); x.fillStyle=nc; x.fillRect(px+bw-5,sy,2,10);
    }
    px+=bw+(Lv<2&&r(s0+i+300)<.3?2:0); i++;
  }
  return {c,dyn,dc};
}
function hills(r,sd,tw,lh,col,rim,base,amp){
  const c=mk(tw,lh), x=c.getContext('2d'), ys=[];
  const k1=2+((r(sd)*3)|0), k2=5+((r(sd+1)*4)|0), p1=r(sd+2)*TAU, p2=r(sd+3)*TAU, q=TAU/tw;
  for(let i=0;i<tw;i++) ys.push(Math.round(lh*base+lh*amp*(Math.sin(i*q*k1+p1)+.5*Math.sin(i*q*k2+p2))));
  x.fillStyle=col; for(let i=0;i<tw;i++) x.fillRect(i,ys[i],1,lh-ys[i]);
  if(rim){ x.fillStyle=rim; for(let i=0;i<tw;i++) x.fillRect(i,ys[i],1,1); }
  return {c};
}
function mountains(r,sd,tw,lh,col,cap,n){
  const c=mk(tw,lh), x=c.getContext('2d');
  for(let i=0;i<n;i++){
    const mx=(i+.5)/n*tw+(r(sd+i)-.5)*tw/n*.6, ht=lh*(.5+r(sd+i+60)*.45);
    for(const o of [-tw,0,tw]){
      const m=mx+o; if(m+ht<0||m-ht>tw)continue;
      x.fillStyle=col; x.beginPath(); x.moveTo(m-ht,lh); x.lineTo(m,lh-ht); x.lineTo(m+ht,lh); x.fill();
      x.fillStyle=rgba('#000000',.2); x.beginPath(); x.moveTo(m,lh-ht); x.lineTo(m+ht,lh); x.lineTo(m,lh); x.fill();
      const cc=ht*.32; x.fillStyle=cap; x.beginPath(); x.moveTo(m,lh-ht); x.lineTo(m-cc,lh-ht+cc); x.lineTo(m-cc*.5,lh-ht+cc*.7); x.lineTo(m,lh-ht+cc); x.lineTo(m+cc*.5,lh-ht+cc*.7); x.lineTo(m+cc,lh-ht+cc); x.fill();
    }
  }
  return {c};
}
function firs(r,sd,tw,lh,col,n,minH,maxH){
  const c=mk(tw,lh), x=c.getContext('2d'), lo=mix(col,'#000000',.3);
  for(let i=0;i<n;i++){
    const bx=(i+.5)/n*tw+(r(sd+i)-.5)*tw/n*.8, th=lh*(minH+r(sd+i+100)*(maxH-minH)), T=th>lh*.6?5:4;
    for(const o of [-tw,0,tw]){
      const m=bx+o; if(m<-30||m>tw+30)continue;
      x.fillStyle=lo; x.fillRect(m-1,lh-th*.12,2,th*.12);
      for(let k=0;k<T;k++){
        const y0=lh-th+k*th*.2, hw=(k+1.2)*th*.065+1, hh=th*.34;
        x.fillStyle=col; x.beginPath(); x.moveTo(m,y0); x.lineTo(m-hw,y0+hh); x.lineTo(m+hw,y0+hh); x.fill();
        x.fillStyle=rgba('#000000',.25); x.beginPath(); x.moveTo(m,y0); x.lineTo(m+hw,y0+hh); x.lineTo(m,y0+hh); x.fill();
      }
    }
  }
  return {c};
}
function clouds(r,sd,tw,lh,body,shade,a,n,wmin,wmax,sy){
  const c=mk(tw,lh), x=c.getContext('2d'), hi=mix(body,'#ffffff',.35);
  for(let i=0;i<n;i++){
    const cw=wmin+r(sd+i*50)*(wmax-wmin), cx0=r(sd+i*50+1)*tw, cy0=lh*(.2+.6*r(sd+i*50+2)), m=5+((r(sd+i*50+3)*3)|0);
    for(const o of [-tw,0,tw]){
      if(cx0+o+cw/2<0||cx0+o-cw/2>tw)continue;
      const bl=[];
      for(let j=0;j<m;j++){ const u=j/(m-1), sn=Math.sin(u*Math.PI); bl.push([cx0+o+(u-.5)*cw,cy0-sn*cw*.06,cw*(.11+.09*sn)+r(sd+i*50+10+j)*2]); }
      for(const b of bl) glow(x,b[0]+1,b[1]+b[2]*.35,b[2]*1.3,shade,a*.8,sy);
      for(const b of bl) glow(x,b[0],b[1],b[2]*1.15,body,a,sy);
      for(const b of bl) glow(x,b[0]-b[2]*.2,b[1]-b[2]*.3,b[2]*.7,hi,a*.7,sy);
    }
  }
  return {c};
}
function mist(r,sd,tw,lh,col,a,n){
  const c=mk(tw,lh), x=c.getContext('2d');
  for(let i=0;i<n;i++){
    const bx=r(sd+i*3)*tw, by=lh*(.35+.3*r(sd+i*3+1)), rad=lh*(.9+.9*r(sd+i*3+2));
    for(const o of [-tw,0,tw]) if(bx+o+rad>0&&bx+o-rad<tw) glow(x,bx+o,by,rad,col,a,.4);
  }
  // пятна больше высоты слоя: гасим верх и низ, иначе край полосы режется в линию
  const g=x.createLinearGradient(0,0,0,lh);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.3,'#000'); g.addColorStop(.7,'#000'); g.addColorStop(1,'rgba(0,0,0,0)');
  x.globalCompositeOperation='destination-in'; x.fillStyle=g; x.fillRect(0,0,tw,lh); x.globalCompositeOperation='source-over';
  return {c};
}
function bokeh(r,sd,tw,lh,col,n,rMin,rMax,a){
  const c=mk(tw,lh), x=c.getContext('2d');
  for(let i=0;i<n;i++){
    const bx=r(sd+i*4)*tw, by=r(sd+i*4+1)*lh, rad=rMin+r(sd+i*4+2)*(rMax-rMin), al=a*(.5+r(sd+i*4+3));
    for(const o of [-tw,0,tw]){
      if(bx+o+rad<0||bx+o-rad>tw)continue;
      glow(x,bx+o,by,rad,col,al);
      x.strokeStyle=rgba(col,al*1.6); x.lineWidth=1; x.beginPath(); x.arc(bx+o,by,rad*.8,0,TAU); x.stroke();
    }
  }
  return {c};
}
function starTile(r,sd,tw,lh,n,col,big){
  const c=mk(tw,lh), x=c.getContext('2d');
  dots(x,r,sd,n,tw,lh,col,.2);
  for(let i=0;i<big;i++){ const sx=(r(sd+900+i*2)*tw)|0, sy=(r(sd+901+i*2)*lh)|0; x.fillStyle=rgba(col,.9); x.fillRect(sx,sy,2,2); x.fillStyle=rgba(col,.25); x.fillRect(sx-1,sy,4,2); x.fillRect(sx,sy-1,2,4); }
  return {c};
}
function rocks(r,sd,tw,lh,col,n){
  const c=mk(tw,lh), x=c.getContext('2d');
  for(let i=0;i<n;i++){
    const bx=r(sd+i*7)*tw, by=lh*(.1+.8*r(sd+i*7+1)), rad=2+r(sd+i*7+2)*5;
    for(const o of [-tw,0,tw]){
      if(bx+o+rad<0||bx+o-rad>tw)continue;
      x.fillStyle=col; x.beginPath();
      for(let k=0;k<7;k++){ const a=k/7*TAU, rr=rad*(.7+.5*r(sd+i*7+10+k)); x[k?'lineTo':'moveTo'](bx+o+Math.cos(a)*rr,by+Math.sin(a)*rr*.8); }
      x.fill();
      x.fillStyle=rgba('#ffffff',.25); x.fillRect(bx+o-rad*.5,by-rad*.5,rad*.6,1);
      x.fillStyle=rgba('#000000',.3); x.fillRect(bx+o,by+rad*.2,rad*.7,rad*.4);
    }
  }
  return {c};
}
function crowd(r,sd,tw,lh,col){
  const c=mk(tw,lh), x=c.getContext('2d');
  x.fillStyle=col; x.strokeStyle=col; x.lineWidth=1.5;
  for(let px=0,i=0;px<tw;px+=4+((r(sd+i)*3)|0),i++){
    const hy=lh*.45+r(sd+i+500)*6;
    x.fillRect(px-2,hy+3,5,lh); disc(x,px,hy,2.5,col);
    if(r(sd+i+900)<.35){ x.beginPath(); x.moveTo(px-2,hy+4); x.lineTo(px-5,hy-5); x.moveTo(px+2,hy+4); x.lineTo(px+5,hy-5); x.stroke(); }
  }
  return {c};
}

// --- анимированные куски (fn слоя) ---
function drawTile(ctx,L,camX,t,W){
  const c=L.c, tw=c.width*PS, th=c.height*PS;
  const off=Math.round((((camX*L.par+t*L.dr)%tw)+tw)%tw);
  A(ctx,L.a||1);
  for(let k=0;k<2;k++){ const sx=k*tw-off; if(sx<W) ctx.drawImage(c,sx,L.y,tw,th); }
  if(L.dyn){
    A(ctx,1);
    for(const d of L.dyn) for(let k=0;k<2;k++){
      const sx=d.x*PS-off+k*tw; if(sx<-8||sx>W)continue;
      if(d.k===0){ if(rnd(Math.floor(t*0.7+d.s*0.13)*31+d.s)<.55){ ctx.fillStyle=L.dc; ctx.fillRect(sx,L.y+d.y*PS,6,8); } }
      else if(((t+d.s*.37)%1.8)<.3){ ctx.fillStyle='#ff4040'; ctx.fillRect(sx,L.y+d.y*PS,4,4); }
    }
  }
}
function drawTwinkle(ctx,z,t,col){
  ctx.fillStyle=col;
  for(const s of z.twk){
    A(ctx,.25+.75*Math.abs(Math.sin(t*(1.1+s.s*2)+s.ph)));
    ctx.fillRect(s.x,s.y,2,2);
    if(s.s>.65){ ctx.fillRect(s.x-2,s.y,6,2); ctx.fillRect(s.x,s.y-2,2,6); }
  }
  A(ctx,1);
}

// --- сборка фона зоны ---
function build(zi,W,H){
  const Z=ZONES[zi], w=Math.ceil(W/PS), h=Math.ceil(H/PS), tw=Math.ceil(w*1.5);
  const r=k=>rnd(zi*7919+k);
  const c=mk(w,h), x=c.getContext('2d'), L=[];
  const g=x.createLinearGradient(0,0,0,h);
  g.addColorStop(0,Z.sky[0]); g.addColorStop(.6,Z.sky[1]); g.addColorStop(1,Z.sky[2]);
  x.fillStyle=g; x.fillRect(0,0,w,h);
  x.fillStyle=noise(x); x.fillRect(0,0,w,h);
  const z={W,H,sky:c,L,twk:[]};
  const tile=(o,par,dr,yy,extra)=>{ L.push(Object.assign({c:o.c,par,dr,y:Math.round(yy)*PS},extra)); };
  const sk=(Lv,col,litP,par,hf,neon)=>{ const lh=Math.ceil(h*hf), s=skyline(r,Lv,Z,tw,lh,col,litP,neon); tile(s,par,0,h-lh,{dyn:s.dyn,dc:s.dc}); };
  const fn=f=>L.push({f});
  const farCol=mix(Z.build2,Z.sky[1],.45), starC=mix(Z.win,'#ffffff',.6);
  const cloudL=(sd,hf,top,par,dr,body,a,n,wmin,wmax,sy)=>{ const lh=Math.ceil(h*hf); tile(clouds(r,sd,tw,lh,body,Z.sky[0],a,n,wmin,wmax,sy),par,dr,top*h); };
  const drawMist=(sd,hf,top,par,dr,col,a)=>{ const lh=Math.ceil(h*hf); tile(mist(r,sd,tw,lh,col,a,12),par,dr,Math.round(top*h)); };
  switch(Z.bg){
    case 'city':
      dots(x,r,10,60,w,h*.6,starC,.25); z.twk=twinkles(r,20,10,W,H*.5);
      moon(x,r,Math.round(w*.8),Math.round(h*.16),13,Z.moon,Z.sky[0],3);
      fn((ctx,zz,t)=>drawTwinkle(ctx,z,t,starC));
      cloudL(100,.4,.04,.02,2.5,mix(Z.sky[2],'#ffffff',.12),.22,5,40,80,.6);
      sk(0,farCol,.1,.08,.5); sk(1,Z.build2,.2,.16,.46,true); sk(2,Z.build,.18,.3,.4,true);
      break;
    case 'sunset':{
      dots(x,r,10,30,w,h*.3,starC,.2); z.twk=twinkles(r,20,6,W,H*.25);
      const cy=Math.round(h*.5), R=h*.18;
      glow(x,w*.5,cy,R*3,Z.moon,.3); glow(x,w*.5,cy,R*1.7,Z.moon,.35);
      x.save(); x.beginPath(); x.arc(w*.5,cy,R,0,TAU); x.clip();
      const sg=x.createLinearGradient(0,cy-R,0,cy+R); sg.addColorStop(0,mix(Z.moon,'#ffffff',.4)); sg.addColorStop(1,Z.moon);
      x.fillStyle=sg; x.fillRect(w*.5-R,cy-R,2*R,2*R);
      x.fillStyle='rgba(0,0,0,0.2)';
      for(let i=0;i<5;i++) x.fillRect(w*.5-R,cy-R+i*h*.036+2,2*R,2.5+i);
      x.restore();
      fn((ctx,zz,t)=>drawTwinkle(ctx,z,t,starC));
      cloudL(100,.35,.2,.03,3,mix(Z.moon,Z.sky[0],.35),.4,5,60,120,.35);
      sk(0,farCol,.1,.08,.5); sk(1,Z.build2,.2,.16,.46,true); sk(2,Z.build,.18,.3,.4,true);
      break;}
    case 'snow':{
      dots(x,r,10,60,w,h*.6,starC,.25); z.twk=twinkles(r,20,8,W,H*.45);
      moon(x,r,Math.round(w*.2),Math.round(h*.15),9,Z.moon,Z.sky[0],3.5);
      fn((ctx,zz,t)=>drawTwinkle(ctx,z,t,starC));
      cloudL(100,.35,.05,.02,2,mix(Z.sky[2],'#ffffff',.3),.3,5,50,90,.5);
      const lhm=Math.ceil(h*.5);
      tile(mountains(r,200,tw,lhm,mix(Z.build2,Z.sky[1],.35),'#e8f4ff',6),.05,0,h-lhm);
      const l1=Math.ceil(h*.3), l2=Math.ceil(h*.22);
      tile(hills(r,300,tw,l1,mix(Z.sky[2],'#ffffff',.45),'#f4fbff',.35,.12),.14,0,h-l1);
      tile(hills(r,310,tw,l2,mix(Z.sky[2],'#ffffff',.7),'#ffffff',.4,.14),.26,0,h-l2);
      fn((ctx,zz,t,camX,Wd,Hd)=>{
        for(let b=0;b<3;b++){
          A(ctx,.35+b*.2); ctx.fillStyle='#e6f8ff'; ctx.beginPath();
          for(let n=b;n<70;n+=3){
            const sx=(r(n+500)*Wd+t*(14+r(n+600)*22)+Math.sin(t*.8+n)*8)%Wd, sy=(r(n+700)*Hd+t*(36+r(n+800)*40))%Hd, s=n%5?2:3;
            ctx.rect(sx,sy,s,s);
          }
          ctx.fill();
        }
        A(ctx,1);
      });
      break;}
    case 'fog':{
      moon(x,r,Math.round(w*.78),Math.round(h*.14),8,Z.moon,Z.sky[0],4);
      cloudL(100,.45,.02,.03,3,mix(Z.sky[2],'#ffffff',.35),.35,7,50,110,.5);
      const l1=Math.ceil(h*.45), l2=Math.ceil(h*.34), l3=Math.ceil(h*.22);
      tile(hills(r,200,tw,l1,mix(Z.build2,Z.sky[1],.5),null,.3,.16),.06,0,h-l1);
      drawMist(300,.25,.5,.1,6,mix(Z.sky[2],'#ffffff',.3),.4);
      tile(hills(r,210,tw,l2,Z.build2,null,.3,.14),.14,0,h-l2);
      drawMist(320,.22,.62,.18,-9,mix(Z.sky[2],'#ffffff',.25),.35);
      tile(hills(r,220,tw,l3,Z.build,mix(Z.build,'#ffffff',.08),.3,.14),.26,0,h-l3);
      break;}
    case 'rain':
      cloudL(100,.5,0,.02,3,mix(Z.sky[1],'#000000',.2),.55,7,70,130,.5);
      cloudL(160,.4,.06,.04,5,mix(Z.sky[2],'#000000',.1),.35,5,60,110,.45);
      sk(0,farCol,.1,.08,.5); sk(1,Z.build2,.2,.16,.46,true); sk(2,Z.build,.18,.3,.4,true);
      fn((ctx,zz,t,camX,Wd,Hd)=>{
        ctx.strokeStyle='rgba(150,170,210,0.30)'; ctx.lineWidth=1.5; ctx.beginPath();
        for(let n=0;n<46;n++){
          const rx=(r(n+3)*Wd+t*(380+r(n+99)*160))%(Wd+60)-30, ry=(r(n+200)*Hd+t*(620+r(n+300)*200))%Hd;
          ctx.moveTo(rx,ry); ctx.lineTo(rx-7,ry+16);
        }
        ctx.stroke();
      });
      break;
    case 'gold':{
      glow(x,w*.5,h*.62,w*.9,'#ffd24d',.2,.7); glow(x,w*.5,h*.9,w*.7,'#ffb000',.18,.5);
      tile(bokeh(r,100,tw,h,'#ffd24d',9,8,18,.12),.05,0,0);
      sk(0,farCol,.3,.08,.5); sk(1,Z.build2,.35,.16,.44);
      tile(bokeh(r,200,tw,h,'#ffe97a',12,4,9,.16),.14,0,0);
      fn((ctx,zz,t)=>{
        ctx.fillStyle='#fff3b0';
        for(let n=0;n<22;n++){
          const gx=r(n)*zz.W, gy=r(n+700)*zz.H*.8, tw2=.25+.75*Math.abs(Math.sin(t*1.4+n*1.7)), s=r(n+900)>.6?3:1.5;
          A(ctx,tw2*.9); ctx.fillRect(gx-s/2,gy-s/2,s,s); ctx.fillRect(gx-s*2,gy-.5,s*4,1); ctx.fillRect(gx-.5,gy-s*2,1,s*4);
        }
        A(ctx,1);
      });
      break;}
    case 'space':{
      const nc=['#7a2fb8','#1f7fa8','#b02f7a','#3a2f9a','#1f6f8a'];
      for(let i=0;i<7;i++) glow(x,r(i*3+1)*w,r(i*3+2)*h*.8,w*(.25+.25*r(i*3+3)),nc[i%5],.2+.1*r(i+40),.6);
      dots(x,r,10,90,w,h,'#ffffff',.2); z.twk=twinkles(r,20,14,W,H*.8);
      planet(x,r,Z,Math.round(w*.78),Math.round(h*.2),Math.round(Math.min(w,h)*.07));
      moon(x,r,Math.round(w*.15),Math.round(h*.45),6,'#c8c8d8',Z.sky[0],2.5);
      tile(starTile(r,100,tw,h,70,'#ffffff',3),.02,0,0);
      tile(starTile(r,200,tw,h,40,'#9af0ff',4),.06,0,0);
      fn((ctx,zz,t)=>drawTwinkle(ctx,z,t,'#ffffff'));
      tile(rocks(r,300,tw,h,mix(Z.build2,Z.sky[2],.5),9),.2,0,0);
      fn((ctx,zz,t,camX,Wd,Hd)=>{
        const k=Math.floor(t/7), ph=(t%7)/.9;
        if(ph>=1)return;
        const sx=r(k*3+800)*Wd, sy=r(k*3+801)*Hd*.4, dx=-260*ph, dy=130*ph;
        A(ctx,1-ph); ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(sx+dx,sy+dy); ctx.lineTo(sx+dx+70,sy+dy-35); ctx.stroke();
        ctx.fillStyle='#ffffff'; ctx.fillRect(sx+dx-1,sy+dy-1,3,3); A(ctx,1);
      });
      break;}
    case 'party':
      glow(x,w*.5,h,w*.8,'#ff2d78',.18,.5);
      sk(0,farCol,.3,.08,.5); sk(1,Z.build2,.35,.16,.46);
      tile(crowd(r,500,tw,Math.ceil(h*.14),mix(Z.build,'#000000',.45)),.34,0,h-Math.ceil(h*.14));
      fn((ctx,zz,t,camX,Wd,Hd)=>{
        ctx.fillStyle='hsla('+((t*40)%360|0)+',80%,55%,0.05)'; A(ctx,1); ctx.fillRect(0,0,Wd,Hd);
        // прожекторы
        for(let i=0;i<3;i++){
          const ox=Wd*(.2+i*.3), ang=Math.sin(t*(.5+i*.17)+i*2.1)*.5, ex=ox+Math.tan(ang)*Hd*.9, hw=Wd*.07+i*6;
          ctx.fillStyle='hsla('+((t*30+i*110)%360|0)+',90%,65%,0.07)';
          ctx.beginPath(); ctx.moveTo(ox-4,0); ctx.lineTo(ox+4,0); ctx.lineTo(ex+hw,Hd*.9); ctx.lineTo(ex-hw,Hd*.9); ctx.fill();
          ctx.beginPath(); ctx.ellipse(ex,Hd*.9,hw,hw*.2,0,0,TAU); ctx.fill();
        }
        // лазеры
        ctx.globalCompositeOperation='lighter';
        for(let i=0;i<6;i++){
          const ox=Wd*(i+.5)/6, ang=Math.sin(t*(.6+i*.13)+i*1.7)*.9, ex=ox+Math.sin(ang)*Hd*1.3, ey=Math.cos(ang)*Hd*1.3, hu=(t*30+i*60)%360|0;
          ctx.lineWidth=6; ctx.strokeStyle='hsla('+hu+',100%,60%,0.08)';
          ctx.beginPath(); ctx.moveTo(ox,0); ctx.lineTo(ex,ey); ctx.stroke();
          ctx.lineWidth=1.5; ctx.strokeStyle='hsla('+hu+',100%,70%,0.55)';
          ctx.beginPath(); ctx.moveTo(ox,0); ctx.lineTo(ex,ey); ctx.stroke();
        }
        ctx.globalCompositeOperation='source-over';
        // конфетти
        for(let b=0;b<4;b++){
          ctx.fillStyle='hsla('+(b*90+20)+',85%,65%,0.7)'; ctx.beginPath();
          for(let n=b;n<40;n+=4){
            ctx.rect((r(n+9)*Wd+t*(10+r(n+5)*20))%Wd,(r(n+100)*Hd+t*(60+r(n+200)*70))%Hd,3.5,5);
          }
          ctx.fill();
        }
      });
      break;
    case 'forest':{
      dots(x,r,10,50,w,h*.5,starC,.25); z.twk=twinkles(r,20,8,W,H*.4);
      moon(x,r,Math.round(w*.2),Math.round(h*.15),9,Z.moon,Z.sky[0],3.5);
      fn((ctx,zz,t)=>drawTwinkle(ctx,z,t,starC));
      const l1=Math.ceil(h*.55), l2=Math.ceil(h*.5), l3=Math.ceil(h*.46);
      tile(firs(r,200,tw,l1,mix(Z.build2,Z.sky[1],.4),Math.ceil(tw/12),.4,.8),.05,0,h-l1);
      drawMist(300,.25,.55,.1,5,mix(Z.sky[2],'#ffffff',.2),.35);
      tile(firs(r,400,tw,l2,Z.build2,Math.ceil(tw/18),.45,.9),.12,0,h-l2);
      tile(firs(r,600,tw,l3,Z.build,Math.ceil(tw/28),.5,.95),.26,0,h-l3);
      drawMist(700,.2,.72,.34,-7,mix(Z.sky[2],'#ffffff',.2),.3);
      fn((ctx,zz,t,camX,Wd,Hd)=>{
        ctx.fillStyle=Z.win;
        for(let n=0;n<14;n++){
          const fx=r(n)*Wd+Math.sin(t*.7+n)*20, fy=Hd*(.35+r(n+50)*.45)+Math.cos(t*.9+n)*14, a=.25+.6*Math.abs(Math.sin(t*1.6+n*2.1));
          A(ctx,a*.2); ctx.fillRect(fx-3,fy-3,8,8); A(ctx,a); ctx.fillRect(fx,fy,2,2);
        }
        A(ctx,1);
      });
      break;}
  }
  return z;
}

// --- кэш фонов, кросс-фейд ---
const cache=new Map();
let cW=0,cH=0,cur=-1,prev=-1,fade=0,lastT=0;
function zoneBg(zi,W,H){
  if(W!==cW||H!==cH){ cache.clear(); cW=W; cH=H; }
  let z=cache.get(zi);
  if(z){ cache.delete(zi); }
  else {
    z=build(zi,W,H);
    for(const k of cache.keys()){ if(cache.size<CAP)break; if(k!==cur&&k!==prev)cache.delete(k); }
  }
  cache.set(zi,z); return z;
}
function drawZone(ctx,z,camX,t,W,H){
  ctx.drawImage(z.sky,0,0,z.sky.width*PS,z.sky.height*PS);
  for(const L of z.L){ if(L.f) L.f(ctx,z,t,camX,W,H); else drawTile(ctx,L,camX,t,W); }
  A(ctx,1);
}
function bg(ctx,W,H,zi,camX,t,warm){
  if(cur<0)cur=zi;
  if(zi!==cur){ prev=cur; cur=zi; fade=0; }
  const dt=Math.max(0,Math.min(t-lastT,.05)); lastT=t;
  ctx.imageSmoothingEnabled=false;
  if(prev>=0){ fade+=dt; if(fade>=FADE)prev=-1; }
  if(prev>=0){
    ga=1; drawZone(ctx,zoneBg(prev,W,H),camX,t,W,H);
    const f=fade/FADE; ga=f*f*(3-2*f); drawZone(ctx,zoneBg(cur,W,H),camX,t,W,H);
    ga=1; A(ctx,1);
  } else {
    ga=1; A(ctx,1); drawZone(ctx,zoneBg(cur,W,H),camX,t,W,H);
    if(warm>=0&&!cache.has(warm)){ zoneBg(warm,W,H); texOf(warm); zoneBg(cur,W,H); }
  }
  ctx.imageSmoothingEnabled=true;
}

// --- платформы ---
const texes=[];
function texOf(zi){
  if(texes[zi])return texes[zi];
  const Z=ZONES[zi], bgT=Z.bg, r=k=>rnd(zi*6113+k);
  const bc=mk(64,64), b=bc.getContext('2d');
  const style=(bgT==='city'||bgT==='sunset'||bgT==='rain'||bgT==='gold')?'brick':(bgT==='snow'||bgT==='space'||bgT==='party')?'stone':'dirt';
  b.fillStyle=style==='dirt'?Z.dirt:Z.dirt2; b.fillRect(0,0,64,64);
  if(style==='brick'){
    for(let row=0;row<8;row++) for(let col=0;col<4;col++){
      const v=r(row*9+col+20), bx=(col*16+(row&1)*8)%64, by=row*8, bcl=mix(Z.dirt,bgT==='gold'?Z.plat:Z.dirt2,v*(bgT==='gold'?.3:.8));
      for(const o of (bx+14>64?[0,-64]:[0])){
        b.fillStyle=bcl; b.fillRect(bx+o,by,14,6);
        b.fillStyle=mix(bcl,'#ffffff',.15); b.fillRect(bx+o,by,14,2);
      }
    }
  } else if(style==='stone'){
    for(let row=0;row<4;row++){
      const s=16+((r(row+40)*4)|0)*8;
      for(const [bx,bw] of [[0,s],[s,64-s]]){
        const bcl=mix(Z.dirt,Z.dirt2,r(row*7+bx+50)*.7);
        b.fillStyle=bcl; b.fillRect(bx,row*16,bw-2,14);
        b.fillStyle=mix(bcl,'#ffffff',.12); b.fillRect(bx,row*16,bw-2,2);
        if(bgT!=='snow'){ b.fillStyle=rgba(Z.win,.5); b.fillRect(bx+3,row*16+5,2,2); }
      }
    }
  } else {
    for(let i=0;i<70;i++){ b.fillStyle=i%3?Z.dirt2:mix(Z.dirt,'#ffffff',.1); b.fillRect((r(i)*32|0)*2,(r(i+200)*32|0)*2,2,2); }
    for(let i=0;i<6;i++){
      const px=r(i+400)*56+4, py=r(i+410)*56+4;
      b.fillStyle=OL; b.beginPath(); b.ellipse(px,py,5,3.5,0,0,TAU); b.fill();
      b.fillStyle=mix(Z.dirt,'#ffffff',.18); b.beginPath(); b.ellipse(px,py,3.5,2.2,0,0,TAU); b.fill();
    }
    if(bgT==='forest'){ b.strokeStyle=Z.dirt2; b.lineWidth=2; for(let i=0;i<3;i++){ b.beginPath(); b.moveTo(r(i+430)*64,0); b.quadraticCurveTo(r(i+440)*64,22,r(i+450)*64,50); b.stroke(); } }
  }
  const tc=mk(64,22), t=tc.getContext('2d');
  const lip=Z.plat, hi=mix(lip,'#ffffff',.4), lo=mix(lip,'#000000',.35);
  const mat=(bgT==='snow')?'snow':(bgT==='party'||bgT==='space')?'neon':bgT==='gold'?'gold':bgT==='rain'?'wet':'grass';
  if(mat==='snow'){
    const sc=mix('#f4fbff',lip,.18);
    t.fillStyle=sc; t.fillRect(0,6,64,8);
    for(let x2=0;x2<64;x2+=8){ const bh=2+((r(x2+60)*3)|0)*2; t.fillRect(x2+1,6-bh,6,bh); }
    t.fillStyle='#a9c4e0'; t.fillRect(0,12,64,2);
    for(let i=0;i<6;i++){ t.fillStyle=sc; t.fillRect(i*11+2,14,4,2+((r(i+70)*3)|0)*2); }
    t.fillStyle='#ffffff'; t.fillRect(0,6,64,2);
  } else {
    t.fillStyle=lip; t.fillRect(0,6,64,8);
    t.fillStyle=hi; t.fillRect(0,6,64,2);
    t.fillStyle=lo; t.fillRect(0,12,64,2);
    if(mat==='grass'){
      for(let x2=0,i=0;x2<62;x2+=4+((r(i+80)*3)|0)*2,i++){ const bh=2+((r(i+90)*3)|0)*2; t.fillStyle=i%3?lip:i%2?hi:lo; t.fillRect(x2,6-bh,2,bh); }
      for(let i=0;i<5;i++){ t.fillStyle=lo; t.fillRect((r(i+100)*30|0)*2,14,2,2+((r(i+110)*2)|0)*2); }
    } else if(mat==='neon'){
      const nc=bgT==='party'?'#ff2d78':'#4cc9f0';
      t.fillStyle=rgba(nc,.1); t.fillRect(0,2,64,2); t.fillStyle=rgba(nc,.25); t.fillRect(0,4,64,2);
      t.fillStyle=nc; t.fillRect(0,6,64,2);
      t.fillStyle=rgba(nc,.6); t.fillRect(0,12,64,2);
      t.fillStyle=lo; for(let x2=0;x2<64;x2+=16) t.fillRect(x2,8,2,4);
    } else if(mat==='gold'){
      t.fillStyle='#fff6c0'; t.fillRect(0,6,64,2);
      t.fillStyle=mix(lip,'#7a4a00',.6); t.fillRect(0,12,64,2);
      for(let x2=8;x2<64;x2+=16){ t.fillStyle=OL; t.fillRect(x2,9,2,2); t.fillStyle='#ffffff'; t.fillRect(x2,8,2,1); }
    } else {
      t.fillStyle=rgba('#000000',.25); t.fillRect(0,6,64,8);
      t.fillStyle=rgba('#dce8ff',.35); t.fillRect(0,6,64,1);
      for(let i=0;i<4;i++){ t.fillStyle=rgba('#ffffff',.5); t.fillRect(r(i+120)*40|0,7,8+((r(i+130)*12)|0),2); }
      t.fillStyle=rgba('#96b4ff',.25); for(let i=0;i<3;i++) t.fillRect(r(i+140)*40|0,10,10+((r(i+150)*10)|0),1);
    }
  }
  t.fillStyle='rgba(0,0,0,.4)'; t.fillRect(0,14,64,2); t.fillStyle='rgba(0,0,0,.2)'; t.fillRect(0,16,64,2);
  const sg=b.createLinearGradient(0,14,0,274);
  sg.addColorStop(0,'rgba(0,0,0,0)'); sg.addColorStop(1,'rgba(0,0,0,.6)');
  return texes[zi]={body:b.createPattern(bc,'repeat'),top:t.createPattern(tc,'repeat'),shade:sg,mat};
}
function plat(ctx,p,camX,t,H,zi){
  const T=texOf(zi), x=Math.round(p.x-camX), y=Math.round(p.y), w=p.w, bh=Math.max(0,H+30-y-8);
  ctx.save(); ctx.translate(x,y-6);
  ctx.fillStyle=T.body; ctx.fillRect(0,14,w,bh);
  ctx.fillStyle=T.shade; ctx.fillRect(0,14,w,bh);
  ctx.fillStyle=T.top; ctx.fillRect(0,0,w,22);
  ctx.fillStyle='rgba(0,0,0,.28)'; ctx.fillRect(0,6,2,bh+8); ctx.fillRect(w-2,6,2,bh+8);
  const m=T.mat;
  if(m==='neon'){
    ctx.globalAlpha=.3+.25*Math.sin(t*4+x*.01); ctx.fillStyle=ZONES[zi].bg==='party'?'hsl('+((t*60)%360|0)+',100%,70%)':'#9af0ff'; ctx.fillRect(0,6,w,2);
    ctx.globalAlpha=1;
  } else if(m==='gold'){
    const gx=((t*70+p.x*.3)%(w+160))-60, x0=Math.max(0,gx), x1=Math.min(w,gx+12);
    if(x1>x0){ ctx.globalAlpha=.6; ctx.fillStyle='#ffffff'; ctx.fillRect(x0,6,x1-x0,6); ctx.globalAlpha=1; }
  } else if(m==='wet'){
    const sd=Math.floor(p.x), n=Math.min(3,Math.floor(w/80)+1);
    ctx.fillStyle='rgb(200,225,255)';
    for(let i=0;i<n;i++){
      const ph=(t*1.7+rnd(sd+i*13)*5)%1;
      if(ph>=.6)continue;
      const sx=6+rnd(sd+i*7)*(w-12), rr=1+ph*7;
      ctx.globalAlpha=.6*(1-ph/.6);
      ctx.fillRect(sx-rr,5,rr*2,1); ctx.fillRect(sx-rr-1,4,1,1); ctx.fillRect(sx+rr,4,1,1);
    }
    ctx.globalAlpha=1;
  }
  ctx.restore();
}

return {bg,plat};
}
