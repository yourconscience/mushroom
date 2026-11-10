// --- Лидерборд ---
// Лидерборд: одно место — свой сервер (SQLite на VPS, server/). Хранит максимум по нику;
// удалить запись можно только на самом сервере (grib-lb rm).
// Адрес публичный, не tailnet: иначе браузер на устройстве в tailnet считает его локальной сетью и блокирует.
const LB_URL='https://207-180-207-128.sslip.io:8445/';
// анонимный счётчик: на сервере только (день, событие) -> сколько раз, без id и адресов. Ответ не нужен.
function track(k){ try{ if(!(navigator.sendBeacon&&navigator.sendBeacon(LB_URL+'ev',k))) fetch(LB_URL+'ev',{method:'POST',body:k,keepalive:true}).catch(()=>{}); }catch(e){} }
function today(){ return new Date(Date.now()+3*3600e3).toISOString().slice(0,10); } // день по Москве
function trackStart(){ // новый браузер, вернулся в другой день или снова сегодня
  let last=''; try{ last=localStorage.gribDay||''; }catch(e){}
  const kind=!last?'first':last!==today()?'ret':'same';
  let first=''; try{ first=localStorage.gribFirst; if(!first){ first=today(); localStorage.gribFirst=first; } }catch(e){ first=today(); }
  try{ localStorage.gribDay=today(); }catch(e){}
  track('start:'+kind);
  if(kind==='first'||kind==='ret'){ // первый заход за день: неделя с первого визита
    let n=0; try{ n=Math.floor((Date.parse(today())-Date.parse(first))/(7*864e5)); }catch(e){}
    if(n<0)n=0; if(n>12)n=12;
    track('week:w'+n);
  }
}
// секретные ники (режимы и Z/X/V) живут в отдельном топе с ключами v2s:, в общем их нет
function upName(n){ return String(n||'').trim().slice(0,8).toUpperCase(); }
function isSecret(n){ return !!MODES[String(n||'').toUpperCase()]; }
// таймаут, чтобы зависший сервер (или вопрос браузера про доступ к локальной сети) не держал топ вечно
function tmo(ms){ return window.AbortSignal&&AbortSignal.timeout?AbortSignal.timeout(ms):undefined; }
async function getJSON(u){ const r=await fetch(u,{signal:tmo(6000)}); if(!r.ok) throw new Error(r.status); return r.json(); }
// keepalive: запрос доживает, даже если вкладку закрыли сразу после смерти
async function postScore(key,s){
  const r=await fetch(LB_URL+encodeURIComponent(key),{method:'POST',body:String(s),keepalive:true,signal:tmo(8000)});
  if(!r.ok) throw new Error(r.status);
}
async function fetchScores(secret,board){
  const pre=board||(secret?'v2s:':'v2:'), cache='gribTop'+pre;
  let rows;
  try{ rows=await getJSON(LB_URL+'?prefix='+pre+'&_='+Date.now()); try{ localStorage[cache]=JSON.stringify(rows); }catch(e){} }
  catch(e){ rows=JSON.parse(localStorage[cache]||'null'); if(!rows) throw e; } // нет сети: последний виденный топ
  return rows.map(([k,v])=>({n:String(k).slice(pre.length).toUpperCase(),s:+v||0})).filter(r=>secret||pre!=='v2:'||!isSecret(r.n)).sort((a,b)=>b.s-a.s);
}
// очки, которые не дошли до сервера, ждут в localStorage и уходят при следующей возможности
function outbox(){ try{ return JSON.parse(localStorage.gribOutbox||'{}'); }catch(e){ return {}; } }
function saveOutbox(o){ try{ localStorage.gribOutbox=JSON.stringify(o); }catch(e){} }
function queueScore(key,s){ const o=outbox(); if(s>(o[key]??-1)){ o[key]=s; saveOutbox(o); } }
async function flushOutbox(){
  for(const [k,s] of Object.entries(outbox())){
    try{ await postScore(k,s); }catch(e){ if(e.message!=='400') return; } // 400: сервер такое не примет, не держим
    const o=outbox(); if(o[k]===s){ delete o[k]; saveOutbox(o); }
  }
}
flushOutbox();
addEventListener('online',flushOutbox);
let playerName=''; // выбирается один раз за визит
function myKey(){ return (daily?'D:':'')+(playerName||'АНОНИМ').toUpperCase(); } // забег дня считается отдельно
function myBest(){ return sessBest[myKey()]||0; }
let charMode=''; // секретный персонаж: код режима из MODES (modes.js) или ''
