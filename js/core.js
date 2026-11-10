const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
const overlay = document.getElementById('overlay'), btn = document.getElementById('btn');
const hud = document.getElementById('hud'), scoreEl = document.getElementById('score'), comboEl = document.getElementById('combo'), fxEl = document.getElementById('fx');
const ui = document.getElementById('ui');
document.getElementById('ver').textContent=VERSION;

const MIN_VIEW=640;
let W=0,H=0,DPR=1,S=1,cw=0,ch=0; // W/H — логический мир, cw/ch — CSS-размер холста, S — CSS-пкс на логический
// Размер берём с самого холста на экране, а не из innerWidth/innerHeight: на iPhone (Brave, Safari)
// 100vh и innerHeight расходятся, а после клавиатуры (ввод ника) innerHeight остаётся устаревшим —
// картинка растягивалась. ResizeObserver ловит любые изменения, даже без события resize.
// Уже 640 логических пикселей в ширину мир отдаляется, а не сжимается: телефон видит столько же, сколько десктоп.
function resize(){
  const r=cv.getBoundingClientRect(), w=Math.round(r.width)||innerWidth, h=Math.round(r.height)||innerHeight;
  DPR=Math.min(devicePixelRatio||1,2);
  if(w===cw&&h===ch&&cv.width===Math.round(w*DPR)&&cv.height===Math.round(h*DPR))return;
  cw=w; ch=h; S=Math.min(1,w/MIN_VIEW); W=Math.round(w/S); H=Math.round(h/S);
  cv.width=Math.round(w*DPR); cv.height=Math.round(h*DPR); ctx.setTransform(DPR*S,0,0,DPR*S,0,0);
}
addEventListener('resize',resize); addEventListener('orientationchange',()=>setTimeout(resize,250));
if(window.visualViewport) visualViewport.addEventListener('resize',resize);
if(window.ResizeObserver) new ResizeObserver(resize).observe(cv);
resize();
