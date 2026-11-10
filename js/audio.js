// --- Звук (WebAudio пиканья) ---
let AC=null;
let musicOn=true; try{ musicOn=localStorage.gribMusic!=='0'; }catch(e){}
function beep(f,d,type='square',v=.12){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain();
  o.type=type;o.frequency.value=f;g.gain.value=v;g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);
  o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d); }
function sJump(){ beep(330,.12); setTimeout(()=>beep(520,.1),60); }
function sStomp(){ beep(620,.08); setTimeout(()=>beep(880,.12),50); }
function sHurt(){ beep(260,.15,'sawtooth'); setTimeout(()=>beep(170,.25,'sawtooth'),90); }
function sDie(){ beep(220,.2,'sawtooth'); setTimeout(()=>beep(140,.35,'sawtooth'),120); }
function airhorn(){ [0,170,340].forEach(d=>setTimeout(()=>{ beep(466,.15,'sawtooth',.11); beep(698,.15,'sawtooth',.07); },d)); }
function scratch(){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(),n=AC.currentTime; o.type='sawtooth'; o.frequency.setValueAtTime(900,n); o.frequency.exponentialRampToValueAtTime(120,n+.24); g.gain.setValueAtTime(.12,n); g.gain.exponentialRampToValueAtTime(.001,n+.26); o.connect(g); g.connect(AC.destination); o.start(); o.stop(n+.26); }
function sJingle(z){ let d=0; for(const [f,dur] of z.jingle){ setTimeout(()=>beep(f,dur,z.wave,.16),d*1000); d+=dur; } }
// фоновый рифф зоны
let nextBeat=0, beatI=0;
function tickMusic(){
  if(!AC||!musicOn||!running||player.dead)return;
  if(clipSrc){ clipSrc.playbackRate.value=hyT>0?0.5:fsT>0?1.4:1; return; } // играет живой трек
  const z=ZONES[zoneI], spb=60/z.bpm/2*(hyT>0?2:fsT>0?1/1.4:1); // восьмые
  if(AC.currentTime>=nextBeat){
    const f=z.loop[beatI%z.loop.length];
    if(f)beep(f,spb*0.9,z.wave,.045);
    beatI++; nextBeat=Math.max(AC.currentTime,nextBeat)+spb;
  }
}
// музыка лежит в отдельном репозитории (mushroom-clips), чтобы релиз игры не перезаливал 96 МБ.
// manifest.json = {"files":[фрагменты],"t":[названия]}. Каждый забег перемешивает пул.
// Фрагмент качается, когда до него дошла очередь (текущая зона и следующая заранее), а не все 400 сразу (96 МБ).
// Декодированных в кэше 3.
const CLIPS_URL='https://yourconscience.github.io/mushroom-clips/';
let clipMeta=null, clipBytes=[], clipSrc=null, clipGain=null;
const clipDecoded=new Map();
let playlist=[], lastFirst=-1, clipToken=0, clipsLoading=false;
const CLIP_GAIN=0.7;

function renderPool(){
  const box=document.getElementById('poolList'); if(!box||!clipMeta)return;
  const t=clipMeta.titles||[];
  box.textContent='';
  t.forEach((n,i)=>{ if(!n)return; const d=document.createElement('div'); d.textContent=(i+1)+'. '+n; box.appendChild(d); });
  const c=document.getElementById('poolCount'); if(c)c.textContent=t.length;
}
// названия в манифесте лежат не открытым текстом: XOR с ключом + base64 (tools/cut-clips.py)
const OBF_KEY=Array.from('grib-versus',c=>c.charCodeAt(0));
function deob(s){
  if(!s)return s;
  try{ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++)u[i]=b.charCodeAt(i)^OBF_KEY[i%OBF_KEY.length]; return new TextDecoder().decode(u); }catch(e){ return ''; }
}
async function loadClips(){
  clipsLoading=true;
  try{
    clipMeta=await (await fetch(CLIPS_URL+'manifest.json')).json();
    if(clipMeta.t) clipMeta.titles=clipMeta.t.map(deob);
    const files=clipMeta.files||[];
    clipBytes=new Array(files.length);
    renderPool();
    shufflePlaylist();
    if(running&&!player.dead&&!clipSrc) playZone(zoneN);
  }catch(e){ clipsLoading=false; } // манифест не дошёл: следующий старт попробует ещё раз
}
// байты фрагмента: один запрос на трек, неудачный не запоминаем
function clipFetch(i){
  const f=clipMeta&&clipMeta.files&&clipMeta.files[i]; if(!f) return Promise.resolve(null);
  return clipBytes[i]||(clipBytes[i]=fetch(CLIPS_URL+f).then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).catch(()=>{ clipBytes[i]=null; return null; }));
}
function shufflePlaylist(){
  const n=clipBytes.length; if(!n)return;
  playlist=Array.from({length:n},(_,i)=>i);
  const R=rngFor('tracks'); // забег дня: одинаковый порядок у всех
  for(let i=n-1;i>0;i--){ const j=(R()*(i+1))|0; const t=playlist[i]; playlist[i]=playlist[j]; playlist[j]=t; }
  if(n>1&&!daily&&playlist[0]===lastFirst){ const t=playlist[0]; playlist[0]=playlist[1]; playlist[1]=t; }
  lastFirst=playlist[0];
}
async function clipBuffer(pick){
  if(clipDecoded.has(pick)){ const b=clipDecoded.get(pick); clipDecoded.delete(pick); clipDecoded.set(pick,b); return b; }
  const raw=await clipFetch(pick); if(!raw)return null;
  const b=await AC.decodeAudioData(raw.slice(0));
  clipDecoded.set(pick,b);
  if(clipDecoded.size>3) clipDecoded.delete(clipDecoded.keys().next().value);
  return b;
}
function stopClip(){
  if(!clipSrc)return;
  const s=clipSrc; clipGain.gain.setTargetAtTime(0,AC.currentTime,0.15);
  setTimeout(()=>{ try{ s.stop(); }catch(e){} },700);
  clipSrc=null;
}
function pickFor(zn){
  if(!playlist.length)return -1;
  return playlist[zn%playlist.length];
}
function trackTitle(zn){
  const p=pickFor(zn);
  if(p<0||!clipMeta||!clipMeta.titles)return '';
  return clipMeta.titles[p]||'';
}
async function playZone(zn){
  if(!AC)return;
  const token=++clipToken;
  stopClip();
  if(!musicOn)return;
  const pick=pickFor(zn);
  if(pick===-1){ sJingle(ZONES[zoneI]); return; }
  clipFetch(pickFor(zn+1)); // следующий трек качаем заранее
  let buf=null;
  try{ buf=await clipBuffer(pick); }catch(e){}
  if(token!==clipToken||player.dead)return;
  if(!buf){ sJingle(ZONES[zoneI]); return; }
  clipGain=AC.createGain(); clipGain.gain.value=0;
  clipGain.gain.setTargetAtTime(CLIP_GAIN,AC.currentTime,0.2);
  clipGain.connect(AC.destination);
  clipSrc=AC.createBufferSource(); clipSrc.buffer=buf; clipSrc.loop=true; clipSrc.connect(clipGain); clipSrc.start();
}
