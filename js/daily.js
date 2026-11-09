// --- Забег дня ---
// Один сид на сутки (по Москве): у всех те же платформы, враги, бонусы, порядок боссов, мини-боссов и треков.
// Без тайных режимов и стартовых перков. Свой топ (ключи day:ДАТА:НИК) и серия дней подряд.
let daily=''; // дата забега дня или '' в обычной игре
function hash32(s){ let h=2166136261; for(const c of s){ h^=c.codePointAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function mulberry(a){ return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
// свой поток случайных чисел на каждый ключ: платформа в зоне, порядок боссов, треки. В обычной игре Math.random
function rngFor(...k){ return daily?mulberry(hash32(daily+'|'+k.join('|'))):Math.random; }
function dayPrefix(d){ return 'day:'+(d||daily)+':'; }
function dayLabel(d){ const [,m,dd]=d.split('-'); return dd+'.'+m; }
function prevDay(d){ return new Date(Date.parse(d)-864e5).toISOString().slice(0,10); }
function streakData(){ try{ return JSON.parse(localStorage.gribStreak||'{}'); }catch(e){ return {}; } }
function streakNow(){ const s=streakData(), t=today(); return s.last===t||s.last===prevDay(t)?(s.n||0):0; }
function markDaily(){ // сыграл сегодня: серия растёт, пропуск дня обнуляет
  const s=streakData(), t=today(); if(s.last===t) return s.n;
  const n=s.last===prevDay(t)?(s.n||0)+1:1;
  try{ localStorage.gribStreak=JSON.stringify({last:t,n}); }catch(e){}
  return n;
}
function syncDailyBtn(){ const n=streakNow(); document.getElementById('dailyBtn').textContent='Забег дня'+(n?' · 🔥 '+n:''); }
