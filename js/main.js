// Запуск: только здесь, когда загружены все файлы (цели, например, читают MINI_KINDS из minis.js)
syncMeta();
try{ const me=upName(localStorage.gribName); if(me&&!poolOpen()) fetchScores().then(sc=>checkPool(sc,me)).catch(()=>{}); }catch(e){}
requestAnimationFrame(loop);
loadClips();
