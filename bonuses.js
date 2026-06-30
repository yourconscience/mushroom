const BONUSES={
  jet:   {icon:'🚀', color:'#4cc9f0', dur:4,  chance:0.07,
          quote:'ПАНЕЛЬКА НА ЛУНЕ, Я ВЗЛЕТАЮ 🚀',
          hud:'ДЖЕТПАК'},
  boost: {icon:'🏎',  color:'#ffd700', dur:5,  chance:0.08,
          quote:'НОВЫЙ КАДИЛЛАК, ГАЗ В ПОЛ 🏎',
          hud:'УСКОРЕНИЕ'},
  loot:  {icon:'💰', color:'#7CFC00', dur:0,  chance:0.10,
          quote:'GIMME THE LOOT +500 💰',
          hud:''},
  slot:  {icon:'🎰', color:'#ff2d78', dur:0,  chance:0.07,
          quote:'КАЗИНО ОТКРЫТО, ЖМИ РУЧКУ 🎰',
          hud:''},
};
const SLOT_OUTCOMES=[
  {t:'ДЖЕКПОТ! +2000 💰', k:'jackpot'},
  {t:'X2 ОЧКОВ, ЭЩКЕРЕ 🔥', k:'double'},
  {t:'МИНУС 500, ЭТО ФИАСКО 📉', k:'lose'},
  {t:'ВСЕХ СНЕСЛО 💀', k:'wipe'},
  {t:'ПОЛЕГЧЕ, ТАЕТ ЛЁД 🧊', k:'slow'},
  {t:'ГАЗ В ПОЛ +1500 🏎', k:'rush'},
  {t:'ДЖЕТПАК С НЕБА 🚀', k:'jet'},
  {t:'НИЧЕГО. БЫВАЕТ 🚬', k:'none'},
];
