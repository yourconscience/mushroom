const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const overlay = document.getElementById('overlay'), btn = document.getElementById('btn');
const hud = document.getElementById('hud'), scoreEl = document.getElementById('score'), comboEl = document.getElementById('combo'), fxEl = document.getElementById('fx');
const ui = document.getElementById('ui');
document.getElementById('ver').textContent=VERSION;

let W=0,H=0,DPR=1;
// Размер берём с самого холста на экране, а не из innerWidth/innerHeight: на iPhone (Brave, Safari)
// 100vh и innerHeight расходятся, а после клавиатуры (ввод ника) innerHeight остаётся устаревшим —
// картинка растягивалась. ResizeObserver ловит любые изменения, даже без события resize.
function resize(){
  const r=cv.getBoundingClientRect(), w=Math.round(r.width)||innerWidth, h=Math.round(r.height)||innerHeight;
  DPR=Math.min(devicePixelRatio||1,2);
  if(w===W&&h===H&&cv.width===Math.round(w*DPR))return;
  W=w; H=h; cv.width=Math.round(W*DPR); cv.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize',resize); addEventListener('orientationchange',()=>setTimeout(resize,250));
if(window.visualViewport) visualViewport.addEventListener('resize',resize);
if(window.ResizeObserver) new ResizeObserver(resize).observe(cv);
resize();
