// Logica aplicației. Datele orarului sunt în data.js (DAYS, WEEK1_MONDAY, ORAR_VERSION).

const LUNI_SCURT = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','noi','dec'];
const ALT_BLOCKS = {};

let actualWeek = 1;
let selectedWeek = 1;
let initDay = '';   // ziua (yyyy-m-d) la care s-a făcut ultima inițializare

function dateForDay(wk, jsday){
  // jsday: 1=luni .. 5=vineri
  const d = new Date(WEEK1_MONDAY);
  d.setDate(d.getDate() + (wk - 1) * 7 + (jsday - 1));
  return `${d.getDate()} ${LUNI_SCURT[d.getMonth()]}`;
}

function renderDayDates(wk){
  DAYS.forEach(day => {
    const el = document.querySelector(`nav.days button[data-key="${day.key}"] .date`);
    if (el) el.textContent = dateForDay(wk, day.jsday);
  });
}

function getAcademicWeek(d){
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((day - WEEK1_MONDAY) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

function clampWeek(w){ return Math.min(10, Math.max(1, w)); }

function weekStatusText(wk){
  if (wk === 1){
    return '<b>Săptămâna 1</b> — orar special (vezi anunțul de deschidere), nu cel de mai jos.';
  }
  const isEven = wk % 2 === 0;
  const course = isEven ? 'Algebră și Geometrie' : 'Electrotehnică';
  return `<b>Săptămâna ${wk}</b> din 10. Luni 16–18: <b>${course}</b>.`;
}

function renderWeekBadge(){
  const numEl = document.getElementById('weekNum');
  const txtEl = document.getElementById('weekTxt');
  const prevBtn = document.getElementById('weekPrev');
  const nextBtn = document.getElementById('weekNext');

  numEl.textContent = selectedWeek;
  prevBtn.disabled = selectedWeek <= 1;
  nextBtn.disabled = selectedWeek >= 10;

  const isPreview = selectedWeek !== actualWeek;
  if (!isPreview){
    if (actualWeek < 1){
      txtEl.innerHTML = 'Semestrul nu a început încă — mai jos previzualizezi săpt. 1.';
    } else if (actualWeek > 10){
      txtEl.innerHTML = 'După săpt. 10 (posibil sesiune) — mai jos previzualizezi săpt. 10.';
    } else {
      txtEl.innerHTML = weekStatusText(actualWeek);
    }
  } else {
    const back = actualWeek >= 1 && actualWeek <= 10 ? actualWeek : (actualWeek < 1 ? '—' : '10+');
    txtEl.innerHTML = `<span class="preview-tag">preview</span>${weekStatusText(selectedWeek)}
      <button class="reset-week" id="resetWeek">↩ înapoi la azi (săpt. ${back})</button>`;
    const rb = document.getElementById('resetWeek');
    if (rb) rb.addEventListener('click', () => { selectedWeek = clampWeek(actualWeek); refresh(); });
  }

  // re-calculează fiecare slot care alternează impar/par pentru săptămâna aleasă
  document.querySelectorAll('[data-alt-id]').forEach(el => {
    const block = ALT_BLOCKS[el.dataset.altId];
    el.innerHTML = altSlotHTML(block, selectedWeek);
  });
}

function refresh(){
  renderWeekBadge();
  renderDayDates(selectedWeek);
  updateNowIndicator();
}

function updateNowIndicator(){
  document.querySelectorAll('.block.now').forEach(b => {
    b.classList.remove('now');
    const dot = b.querySelector('.nowdot');
    if (dot) dot.remove();
  });
  if (selectedWeek !== actualWeek) return; // ambiguu cât timp previzualizezi altă săptămână

  const now = new Date();
  const todayInfo = DAYS.find(d => d.jsday === now.getDay());
  if (!todayInfo) return; // weekend — nimic programat

  const panel = document.getElementById('panel-' + todayInfo.key);
  if (!panel) return;
  const curHour = now.getHours() + now.getMinutes() / 60;

  panel.querySelectorAll('.block').forEach(row => {
    const timeEl = row.querySelector('.time');
    if (!timeEl) return;
    const parts = timeEl.textContent.trim().split('–');
    if (parts.length !== 2) return;
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (curHour >= start && curHour < end){
      row.classList.add('now');
      const dot = document.createElement('span');
      dot.className = 'nowdot';
      timeEl.appendChild(dot);
    }
  });
}

function wkMarker(isEven){
  const label = isEven ? 'P' : 'I';
  const title = isEven ? 'doar săptămânile pare (2,4,6,8,10)' : 'doar săptămânile impare (1,3,5,7,9)';
  return `<span class="tag wk" title="${title}">${label}</span>`;
}

function altSlotHTML(block, wk){
  if (block.skipWeek1 && wk === 1){
    return `<div class="course dim">orar special săpt. 1 (nu acest slot)</div>`;
  }
  const isEven = wk % 2 === 0;
  const variant = isEven ? block.even : block.odd;
  if (!variant){
    return `<div class="course dim">liber ${wkMarker(isEven)}</div>`;
  }
  const tagHtml = variant.tag ? `<span class="tag ${variant.tag}">${variant.tag}</span>` : '';
  const bits = [];
  if (variant.room) bits.push(`<span class="room">${variant.room}</span>`);
  if (variant.prof) bits.push(variant.prof);
  const metaHtml = bits.length ? `<div class="meta">${bits.join(' · ')}</div>` : '';
  return `<div class="course">${variant.c}${tagHtml} ${wkMarker(isEven)}</div>${metaHtml}`;
}

function buildPanels(wk, activeKey){
  const nav = document.getElementById('dayNav');
  const panels = document.getElementById('panels');
  nav.innerHTML = '';
  panels.innerHTML = '';

  const today = new Date().getDay(); // 0 duminică .. 6 sâmbătă

  DAYS.forEach(day => {
    const isToday = day.jsday === today;

    const btn = document.createElement('button');
    btn.dataset.key = day.key;
    if (isToday) btn.classList.add('today');
    btn.innerHTML = `<span>${day.label}<span class="dot"></span></span><span class="date"></span>`;
    nav.appendChild(btn);

    const panel = document.createElement('div');
    panel.className = 'day-panel';
    panel.id = 'panel-' + day.key;

    day.blocks.forEach(b => {
      const row = document.createElement('div');
      let inner;
      let altAttr = '';
      if (b.altId){
        ALT_BLOCKS[b.altId] = b;
        altAttr = ` data-alt-id="${b.altId}"`;
        row.className = 'block';
        inner = altSlotHTML(b, wk);
      } else {
        row.className = 'block' + (b.free ? ' free' : '');
        const tagHtml = b.tag ? `<span class="tag ${b.tag}">${b.tag}</span>` : '';
        inner = `<div class="course">${b.c}${tagHtml}</div>`;
        if (!b.free){
          const bits = [];
          if (b.room) bits.push(`<span class="room">${b.room}</span>`);
          if (b.prof) bits.push(b.prof);
          if (bits.length) inner += `<div class="meta">${bits.join(' · ')}</div>`;
        }
      }
      row.innerHTML = `<div class="time">${b.t}</div><div class="content"${altAttr}>${inner}</div>`;
      panel.appendChild(row);
    });

    panels.appendChild(panel);
  });

  renderDayDates(selectedWeek);
  activate(activeKey);
}

function lastBlockEndHour(dayInfo){
  let maxEnd = 0;
  dayInfo.blocks.forEach(b => {
    const parts = b.t.split('–');
    if (parts.length === 2){
      const end = parseInt(parts[1], 10);
      if (end > maxEnd) maxEnd = end;
    }
  });
  return maxEnd;
}

// Pe ce zi (și în ce săptămână academică) se deschide aplicația:
// azi cât timp programul de azi încă rulează, altfel următoarea zi cu program,
// în săptămâna ei (deci sâmbătă, duminică și vineri seara se deschid pe luni viitoare).
function getEffectiveTarget(){
  const now = new Date();
  const todayInfo = DAYS.find(d => d.jsday === now.getDay());
  if (todayInfo){
    const endHour = lastBlockEndHour(todayInfo);
    const curHour = now.getHours() + now.getMinutes() / 60;
    if (curHour < endHour) return { key: todayInfo.key, week: clampWeek(actualWeek) };
  }
  for (let i = 1; i <= 7; i++){
    const nd = new Date(now);
    nd.setDate(now.getDate() + i);
    const info = DAYS.find(d => d.jsday === nd.getDay());
    if (info) return { key: info.key, week: clampWeek(getAcademicWeek(nd)) };
  }
  return { key: 'luni', week: clampWeek(actualWeek) };
}

function activate(key){
  document.querySelectorAll('nav.days button').forEach(b => b.classList.toggle('active', b.dataset.key === key));
  document.querySelectorAll('.day-panel').forEach(p => p.classList.toggle('active', p.id === 'panel-' + key));
}

function dayStamp(){
  const n = new Date();
  return `${n.getFullYear()}-${n.getMonth()}-${n.getDate()}`;
}

// Inițializează (sau re-inițializează) tot ecranul pe baza datei de acum.
function init(){
  actualWeek = getAcademicWeek(new Date());
  const target = getEffectiveTarget();
  selectedWeek = target.week;
  initDay = dayStamp();
  buildPanels(selectedWeek, target.key);
  renderWeekBadge();
  updateNowIndicator();
}

// --- evenimente (atașate o singură dată) ---
document.getElementById('dayNav').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  activate(b.dataset.key);
});
document.getElementById('weekPrev').addEventListener('click', () => {
  if (selectedWeek > 1){ selectedWeek--; refresh(); }
});
document.getElementById('weekNext').addEventListener('click', () => {
  if (selectedWeek < 10){ selectedWeek++; refresh(); }
});

// Aplicația instalată rămâne în memorie zile întregi: când o redeschizi,
// dacă s-a schimbat ziua, reconstruiește tot; altfel doar mută indicatorul „acum”.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (dayStamp() !== initDay) init(); else updateNowIndicator();
});
window.addEventListener('pageshow', () => {
  if (dayStamp() !== initDay) init();
});

init();
setInterval(updateNowIndicator, 60000);

const verEl = document.getElementById('verLine');
if (verEl && typeof ORAR_VERSION !== 'undefined') verEl.textContent = 'orar actualizat: ' + ORAR_VERSION;

// --- offline: service worker ---
if ('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* ex. deschis direct din fișier */ });
  });
}
