// Logica aplicației. Datele orarului sunt în data.js (DAYS, PERIODS, HOLIDAYS, ORAR_VERSION).

const LUNI_SCURT = ['ian','feb','mar','apr','mai','iun','iul','aug','sep','oct','noi','dec'];
const DAY_MS = 86400000;
const TEACH_TOTAL = 14; // săptămâni de predare în semestrul I (12 + 2)

// --- calendarul semestrului: o listă de săptămâni calendaristice, luni → duminică ---
// Fiecare element: { type:'teach'|'vac'|'session', monday:Date, wk:număr săpt. de predare | null,
//                    pos:poziția în perioadă (1..n), of:câte săptămâni are perioada }
const CAL = [];
PERIODS.forEach(p => {
  for (let i = 0; i < p.weeks; i++){
    CAL.push({
      type: p.type,
      monday: new Date(p.from[0], p.from[1], p.from[2] + 7 * i),
      wk: p.type === 'teach' ? p.first + i : null,
      pos: i + 1,
      of: p.weeks,
    });
  }
});

const BLOCKS = {};   // toate blocurile orare, după id (ca să le re-desenăm când se schimbă săptămâna)

let actualIdx = 0;     // indexul în CAL al săptămânii de azi (dacă semState === 'in')
let selectedIdx = 0;   // indexul săptămânii afișate
let semState = 'in';   // 'before' | 'in' | 'after' — unde e azi față de semestru
let initDay = '';      // ziua (yyyy-m-d) la care s-a făcut ultima inițializare

// --- date și etichete ---
function addDays(d, n){
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function dateOf(idx, jsday){ // jsday: 1=luni .. 7=duminică
  return addDays(CAL[idx].monday, jsday - 1);
}

function fmtDay(d){ return `${d.getDate()} ${LUNI_SCURT[d.getMonth()]}`; }

function rangeText(idx){
  const a = CAL[idx].monday;
  const b = addDays(a, 6);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${LUNI_SCURT[b.getMonth()]}`
    : `${fmtDay(a)} – ${fmtDay(b)}`;
}

function sameDate(d, arr){
  return d.getFullYear() === arr[0] && d.getMonth() === arr[1] && d.getDate() === arr[2];
}

function holidayFor(d){
  return HOLIDAYS.find(h => sameDate(d, h.d)) || null;
}

// Unde e data `d` în calendar: { state:'before'|'in'|'after', idx }
function locate(d){
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (day < CAL[0].monday) return { state:'before', idx:0 };
  for (let i = 0; i < CAL.length; i++){
    const diff = Math.round((day - CAL[i].monday) / DAY_MS);
    if (diff >= 0 && diff <= 6) return { state:'in', idx:i };
  }
  return { state:'after', idx:CAL.length - 1 };
}

function numLabel(idx){
  const e = CAL[idx];
  if (e.type === 'teach') return String(e.wk);
  if (e.type === 'session') return 'S' + e.pos;
  return 'V';
}

function shortName(idx){
  const e = CAL[idx];
  if (e.type === 'teach') return `săpt. ${e.wk}`;
  return e.type === 'session' ? `sesiune, săpt. ${e.pos}` : 'vacanță';
}

// --- variante pentru blocurile cu from/until și cele care alternează impar/par ---
function outOfRange(b, wk){
  return (b.from && wk < b.from) || (b.until && wk > b.until);
}

function rangeReason(b){
  if (b.from && b.until) return `doar săpt. ${b.from}–${b.until}`;
  if (b.from) return `începând cu săpt. ${b.from}`;
  return `doar până în săpt. ${b.until}`;
}

function pickVariant(block, wk){
  const v = wk % 2 === 0 ? block.even : block.odd;
  return v && !outOfRange(v, wk) ? v : null;
}

function wkMarker(isEven){
  const label = isEven ? 'P' : 'I';
  const title = isEven ? 'doar săptămânile pare (2,4,6,…)' : 'doar săptămânile impare (1,3,5,…)';
  return `<span class="tag wk" title="${title}">${label}</span>`;
}

function metaHTML(b){
  const bits = [];
  if (b.room) bits.push(`<span class="room">${b.room}</span>`);
  if (b.prof) bits.push(b.prof);
  return bits.length ? `<div class="meta">${bits.join(' · ')}</div>` : '';
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
  if (outOfRange(variant, wk)){
    return `<div class="course dim">liber ${wkMarker(isEven)}</div>
      <div class="meta">${variant.c} — ${rangeReason(variant)}</div>`;
  }
  const tagHtml = variant.tag ? `<span class="tag ${variant.tag}">${variant.tag}</span>` : '';
  return `<div class="course">${variant.c}${tagHtml} ${wkMarker(isEven)}</div>${metaHTML(variant)}`;
}

// Conținutul unui bloc pentru săptămâna de predare `wk`: { cls, html }
function blockContent(b, wk){
  if (b.altId) return { cls:'block', html: altSlotHTML(b, wk) };
  if (b.free) return { cls:'block free', html:`<div class="course">${b.c}</div>` };
  if (outOfRange(b, wk)){
    return { cls:'block free',
      html:`<div class="course">liber</div><div class="meta">${b.c} — ${rangeReason(b)}</div>` };
  }
  const tagHtml = b.tag ? `<span class="tag ${b.tag}">${b.tag}</span>` : '';
  return { cls:'block', html:`<div class="course">${b.c}${tagHtml}</div>${metaHTML(b)}` };
}

// --- text pentru săptămâna selectată ---
function statusText(idx){
  const e = CAL[idx];
  const range = rangeText(idx);
  if (e.type === 'vac'){
    const part = e.of > 1 ? `săptămâna ${e.pos} din ${e.of} ` : '';
    return `<b>Vacanță</b> · ${part ? `${part}(${range})` : range}. Fără ore.`;
  }
  if (e.type === 'session'){
    return `<b>Sesiune</b> · săptămâna ${e.pos} din ${e.of} (${range}), programările 1 și 2.`;
  }
  if (e.wk === 1){
    return `<b>Săptămâna 1</b> · ${range} — orar special (vezi anunțul de deschidere), nu cel de mai jos.`;
  }
  const v = pickVariant(ALT_LUNI_1618, e.wk);
  const lunea = v ? `<b>${v.c}</b>` : '<b>liber</b>';
  return `<b>Săptămâna ${e.wk}</b> din ${TEACH_TOTAL} · ${range}. Luni 16–18: ${lunea}.`;
}

function nextTeachIdx(idx){
  for (let i = idx + 1; i < CAL.length; i++) if (CAL[i].type === 'teach') return i;
  return -1;
}
function prevTeachIdx(idx){
  for (let i = idx - 1; i >= 0; i--) if (CAL[i].type === 'teach') return i;
  return -1;
}

function offCardHTML(idx){
  const e = CAL[idx];
  const range = rangeText(idx);
  let title, text;
  if (e.type === 'vac'){
    title = 'Vacanță';
    const part = e.of > 1 ? `Săptămâna ${e.pos} din ${e.of} ` : 'Săptămâna ';
    text = `${part}(${range}). Nu sunt cursuri sau laboratoare.`;
  } else {
    title = 'Sesiune';
    text = `Săptămâna ${e.pos} din ${e.of} (${range}) · programările 1 și 2. În sesiune nu există orar săptămânal; datele examenelor nu sunt incluse aici.`;
  }
  const nx = nextTeachIdx(idx);
  const pv = prevTeachIdx(idx);
  let btn = '';
  if (nx >= 0){
    btn = `<button class="jump" data-idx="${nx}">→ săptămâna ${CAL[nx].wk} (${rangeText(nx)})</button>`;
  } else if (pv >= 0){
    btn = `<button class="jump" data-idx="${pv}">← ultima săptămână de predare (${CAL[pv].wk})</button>`;
  }
  return `<div class="off-title">${title}</div><div class="off-text">${text}</div>${btn}`;
}

// --- desenare ---
function renderDayDates(idx){
  DAYS.forEach(day => {
    const d = dateOf(idx, day.jsday);
    const holi = holidayFor(d);
    const tab = document.querySelector(`nav.days button[data-key="${day.key}"]`);
    if (tab){
      const el = tab.querySelector('.date');
      if (el) el.textContent = fmtDay(d);
      tab.classList.toggle('holi', !!holi);
    }
    const note = document.querySelector(`#panel-${day.key} .holiday`);
    if (note){
      note.hidden = !holi;
      note.textContent = holi
        ? `${fmtDay(d)} — ${holi.t}, zi liberă legală: de obicei fără ore (verifică anunțurile).`
        : '';
    }
  });
}

function renderWeekBadge(){
  const e = CAL[selectedIdx];
  const numEl = document.getElementById('weekNum');
  const txtEl = document.getElementById('weekTxt');
  const prevBtn = document.getElementById('weekPrev');
  const nextBtn = document.getElementById('weekNext');

  numEl.textContent = numLabel(selectedIdx);
  numEl.title = shortName(selectedIdx);
  prevBtn.disabled = selectedIdx <= 0;
  nextBtn.disabled = selectedIdx >= CAL.length - 1;

  const home = semState === 'in' ? actualIdx : (semState === 'before' ? 0 : CAL.length - 1);
  let html = statusText(selectedIdx);
  if (semState === 'before'){
    html = `<span class="preview-tag">preview</span>${html}<br>Semestrul I începe pe ${fmtDay(CAL[0].monday)}.`;
  } else if (semState === 'after'){
    html = `<span class="preview-tag">preview</span>${html}<br>Semestrul I s-a încheiat (${rangeText(CAL.length - 1)}).`;
  } else if (selectedIdx !== actualIdx){
    html = `<span class="preview-tag">preview</span>${html}`;
  }
  if (selectedIdx !== home){
    const back = semState === 'in' ? `azi · ${shortName(actualIdx)}` : (semState === 'before' ? 'începutul semestrului' : 'sfârșitul semestrului');
    html += `<button class="reset-week" id="resetWeek">↩ înapoi la ${back}</button>`;
  }
  txtEl.innerHTML = html;
  const rb = document.getElementById('resetWeek');
  if (rb) rb.addEventListener('click', () => { selectedIdx = home; refresh(); });

  // re-calculează conținutul fiecărui bloc pentru săptămâna aleasă
  if (e.type === 'teach'){
    document.querySelectorAll('[data-block-id]').forEach(row => {
      const b = BLOCKS[row.dataset.blockId];
      const c = blockContent(b, e.wk);
      row.className = c.cls;
      row.querySelector('.content').innerHTML = c.html;
    });
  }

  // vacanță / sesiune: în loc de zile și ore apare un card
  const off = e.type !== 'teach';
  document.getElementById('dayNav').hidden = off;
  document.getElementById('panels').hidden = off;
  const offEl = document.getElementById('offNote');
  offEl.hidden = !off;
  offEl.innerHTML = off ? offCardHTML(selectedIdx) : '';
}

function refresh(){
  renderWeekBadge();
  renderDayDates(selectedIdx);
  updateNowIndicator();
}

function updateNowIndicator(){
  document.querySelectorAll('.block.now').forEach(b => {
    b.classList.remove('now');
    const dot = b.querySelector('.nowdot');
    if (dot) dot.remove();
  });
  if (semState !== 'in' || selectedIdx !== actualIdx) return; // ambiguu cât timp previzualizezi altă săptămână
  if (CAL[selectedIdx].type !== 'teach') return;

  const now = new Date();
  const todayInfo = DAYS.find(d => d.jsday === now.getDay());
  if (!todayInfo) return; // weekend — nimic programat
  if (holidayFor(now)) return; // zi liberă legală

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

let ALT_LUNI_1618 = null; // blocul Luni 16–18 (Electrotehnică/Algebră), folosit în textul de stare

function buildPanels(activeKey){
  const nav = document.getElementById('dayNav');
  const panels = document.getElementById('panels');
  nav.innerHTML = '';
  panels.innerHTML = '';

  const today = new Date().getDay(); // 0 duminică .. 6 sâmbătă
  const e = CAL[selectedIdx];
  const wk = e.type === 'teach' ? e.wk : 1; // pentru vacanță/sesiune conținutul se re-desenează la nevoie

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

    const holi = document.createElement('div');
    holi.className = 'holiday';
    holi.hidden = true;
    panel.appendChild(holi);

    day.blocks.forEach((b, i) => {
      const id = `${day.key}-${i}`;
      BLOCKS[id] = b;
      if (b.altId === 'luni1618') ALT_LUNI_1618 = b;
      const c = blockContent(b, wk);
      const row = document.createElement('div');
      row.className = c.cls;
      row.dataset.blockId = id;
      row.innerHTML = `<div class="time">${b.t}</div><div class="content">${c.html}</div>`;
      panel.appendChild(row);
    });

    panels.appendChild(panel);
  });

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

// Pe ce zi (și în ce săptămână) se deschide aplicația:
// azi cât timp programul de azi încă rulează, altfel următoarea zi cu program,
// în săptămâna ei (deci sâmbătă, duminică și vineri seara se deschid pe luni viitoare;
// înainte de o vacanță sau de sesiune se deschide cardul respectiv).
function getEffectiveTarget(){
  const now = new Date();
  const here = locate(now);
  const todayInfo = DAYS.find(d => d.jsday === now.getDay());
  if (todayInfo && here.state === 'in'){
    const endHour = lastBlockEndHour(todayInfo);
    const curHour = now.getHours() + now.getMinutes() / 60;
    if (curHour < endHour) return { key: todayInfo.key, idx: here.idx };
  }
  for (let i = 1; i <= 7; i++){
    const nd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const info = DAYS.find(d => d.jsday === nd.getDay());
    if (info) return { key: info.key, idx: locate(nd).idx };
  }
  return { key: 'luni', idx: here.idx };
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
  const here = locate(new Date());
  semState = here.state;
  actualIdx = here.idx;
  const target = getEffectiveTarget();
  selectedIdx = target.idx;
  initDay = dayStamp();
  buildPanels(target.key);
  refresh();
}

// --- evenimente (atașate o singură dată) ---
document.getElementById('dayNav').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  activate(b.dataset.key);
});
document.getElementById('weekPrev').addEventListener('click', () => {
  if (selectedIdx > 0){ selectedIdx--; refresh(); }
});
document.getElementById('weekNext').addEventListener('click', () => {
  if (selectedIdx < CAL.length - 1){ selectedIdx++; refresh(); }
});
document.getElementById('offNote').addEventListener('click', (e) => {
  const b = e.target.closest('button.jump');
  if (!b) return;
  selectedIdx = parseInt(b.dataset.idx, 10);
  refresh();
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
