const BONUSES={
  jet:   {icon:'🚀', color:'#4cc9f0', dur:4,  chance:0.05,
          quote:'ПАНЕЛЬКА НА ЛУНЕ, Я ВЗЛЕТАЮ 🚀'},
  loot:  {icon:'💰', color:'#7CFC00', dur:0,  chance:0.07,
          quote:'GIMME THE LOOT +500 💰'},
  slot:  {icon:'🎰', color:'#ff2d78', dur:0,  chance:0.04,
          quote:'КАЗИНО ОТКРЫТО, ЖМИ РУЧКУ 🎰'},
  big:   {icon:'🍄', color:'#ff5c5c', dur:0,  chance:0.05,
          quote:'ОГО, ГРИБ ПОДРОС 🍄'},
  spore: {icon:'🦠', color:'#a6e22e', dur:6,  chance:0.04,
          quote:'СПОРЫ ПОШЛИ, ДЕРЖИТЕСЬ 🦠'},
  hypno: {icon:'🌀', color:'#b388ff', dur:5,  chance:0.03,
          quote:'ОХЛАДИ СВОЙ ПЫЛ 🧊'},
  magnet:{icon:'🧲', color:'#ff6b6b', dur:8,  chance:0.03,
          quote:'ВСЁ ТЯНЕТСЯ К ГРИБУ 🧲'},
  noir:  {icon:'🎞', color:'#d0d0d0', dur:0,  chance:0.03,
          quote:'ЧЁРНО-БЕЛОЕ КИНО: БОНУСОВ НЕТ 🎞'},
  // v42: новые предметы (nw — открываются через bonusOpen, в нуар не падают)
  star:  {icon:'⭐', color:'#ffd84d', dur:5,  chance:0.015, nw:1,
          quote:'ЗВЕЗДА! НИЧТО НЕ ТРОГАЕТ ⭐'},
  life:  {icon:'🟢', color:'#4ade80', dur:0,  chance:0.01,  nw:1,
          quote:'ВТОРАЯ ЖИЗНЬ В ЗАПАСЕ 🟢'},
  bubble:{icon:'🫧', color:'#7ad7ff', dur:0,  chance:0.025, nw:1,
          quote:'ПУЗЫРЬ ПОДСТРАХУЕТ НАД ЯМОЙ 🫧'},
  zap:   {icon:'⚡', color:'#ffe14d', dur:6,  chance:0.02,  nw:1,
          quote:'ЭЛЕКТРОШОК: ВСЕ ТОРМОЗЯТ ⚡'},
  punch: {icon:'🎤', color:'#ff7aa8', dur:0,  chance:0.02,  nw:1,
          quote:'ПАНЧЛАЙН! 🎤'},
  ghost: {icon:'👻', color:'#cfd8ff', dur:4,  chance:0.02,  nw:1,
          quote:'ПРИЗРАК: СКВОЗЬ ВСЕХ 👻'},
};
// «резинка»: когда забег идёт плохо (маленький гриб и 10 с без убийств), шансы помощников x2, лута и казино x0.5
const BAND_UP={star:1,life:1,bubble:1,zap:1,punch:1}, BAND_DN={loot:1,slot:1};
const bOpen=k=>typeof bonusOpen!=='function'||bonusOpen(k); // предмет открыт? (bonusOpen — в progress.js)
let starT=0, zapT=0, ghostT=0, bubble=0, noKillT=0, pCombo=0, punches=[]; // таймеры звезды/молнии/призрака, пузырь в запасе, резинка, выстрелы панча
const SLOT_OUTCOMES=[
  {t:'ДЖЕКПОТ! +2000 💰', k:'jackpot'},
  {t:'X2 ОЧКОВ, ЭЩКЕРЕ 🔥', k:'double'},
  {t:'МИНУС 500, ЭТО ФИАСКО 📉', k:'lose'},
  {t:'ВСЕХ СНЕСЛО 💀', k:'wipe'},
  {t:'ПОЛЕГЧЕ, ТОРМОЗИ 🧊', k:'slow'},
  {t:'🍄 ГИПНОГРИБ ИЗ АВТОМАТА', k:'hypno'},
  {t:'ДЖЕТПАК С НЕБА 🚀', k:'jet'},
  {t:'НИЧЕГО. БЫВАЕТ 🚬', k:'none'},
  {t:'ЗВЕЗДА ИЗ АВТОМАТА ⭐', k:'star', g:'star'},
  {t:'ВТОРАЯ ЖИЗНЬ 🟢', k:'life', g:'life'},
  {t:'СПОРЫ НА 8 СЕКУНД 🦠', k:'spores'},
  {t:'ВСЕ ВРАГИ СТАЛИ ГОЛУБЯМИ 🕊', k:'pigeons'},
];
