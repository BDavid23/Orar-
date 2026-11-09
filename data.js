// ============================================================
//  ORARUL TĂU — aici modifici orele, sălile, profesorii.
//  Restul aplicației (app.js, style.css) nu trebuie atins.
//
//  t       = interval orar ('08–10')
//  c       = numele cursului
//  tag     = curs | sem | lab | opt | sport
//  room    = sala
//  prof    = profesor / notă
//  free    = true pentru ore libere
//  altId   = id unic pentru ore care alternează impar/par
//            (odd = săpt. impare, even = săpt. pare, null = liber)
//  from    = (opțional) ora apare doar începând cu săptămâna asta
//  until   = (opțional) ora apare doar până în săptămâna asta (inclusiv);
//            după ea slotul se afișează „liber”. Se poate pune și pe odd/even.
//
//  Săptămânile sunt numerotate ca la predare: 1–12, apoi 13–14 (după vacanță).
//  Impar/par se calculează după numărul acesta.
// ============================================================

// Schimbă data asta când actualizezi orarul: o vezi în subsolul aplicației
// și știi că ai primit ultima versiune.
const ORAR_VERSION = '2026-11-09';

// Calendarul semestrului I 2026/2027 — Hotărârea Senatului UPT nr. 26 / 19.03.2026, Anexa 1
// (toți anii de studiu). Perioadele se succed fără goluri; `from` = luni (an, lună de la 0, zi).
const PERIODS = [
  { type:'teach',   from:[2026, 8, 28], weeks:12, first:1  },  // 28.09 – 18.12  predare
  { type:'vac',     from:[2026, 11, 21], weeks:3            },  // 21.12 – 10.01  vacanță
  { type:'teach',   from:[2027, 0, 11], weeks:2, first:13 },  // 11.01 – 22.01  predare
  { type:'session', from:[2027, 0, 25], weeks:4            },  // 25.01 – 21.02  sesiune (programările 1 și 2)
  { type:'vac',     from:[2027, 1, 22], weeks:1            },  // 22.02 – 28.02  vacanță
];

// Zile libere legale în timpul predării (nu sunt în hotărârea Senatului; adăugate separat).
// d = [an, lună de la 0, zi]
const HOLIDAYS = [
  { d:[2026, 10, 30], t:'Sfântul Andrei' },
  { d:[2026, 11, 1],  t:'Ziua Națională a României' },
];

const DAYS = [
  { key:'luni', label:'Luni', jsday:1, blocks:[
    { t:'08–10', c:'Analiză Matematică', tag:'curs', room:'A117', prof:'A. Juratoni' },
    { t:'10–13', c:'Programarea Calculatoarelor', tag:'curs', room:'A117', prof:'V. Stangaciu' },
    { t:'13–14', c:'Oră de tutoriat', tag:'curs', room:'A117', prof:'V. Stangaciu' },
    { t:'14–16', altId:'luni1416',
      odd:null,
      even:{ c:'Educație Fizică — Culturism', tag:'sport', room:'Baza 1, sala', prof:'Sarandan' } },
    { t:'16–18', altId:'luni1618', skipWeek1:true,
      // orarul facultății: Electrotehnică săpt. 3,5,7,9 · Algebră săpt. 2,4,6,8,10
      odd:{ c:'Electrotehnică', tag:'curs', room:'M304, MEC', until:9 },
      even:{ c:'Algebră și Geometrie', tag:'curs', room:'M304, MEC', until:10 } },
  ]},
  { key:'marti', label:'Marți', jsday:2, blocks:[
    { t:'08–10', c:'Logică și Structuri Discrete', tag:'curs', room:'ASPC', prof:'C. Iapa' },
    { t:'10–12', c:'Fizică', tag:'curs', room:'ASPC', prof:'D. Trif' },
    { t:'12–14', c:'liber', free:true },
    // orarul facultății: Electrotehnică „săptămânile 1–10”
    { t:'14–16', c:'Electrotehnică', tag:'curs', room:'A2 Chimie', prof:'I. Tatai', until:10 },
    // Algebră (marți) nu are interval în orar → rămâne în toate săptămânile; pune `until:10` dacă se oprește
    { t:'16–18', c:'Algebră și Geometrie', tag:'curs', room:'A2 Chimie', prof:'C. Lăzureanu' },
  ]},
  { key:'miercuri', label:'Miercuri', jsday:3, blocks:[
    { t:'08–10', c:'Analiză Matematică', tag:'sem', room:'SPM202', prof:'comun cu 2.1' },
    { t:'10–12', altId:'miercuri1012',
      odd:{ c:'Fizică', tag:'lab', room:'C217' },
      even:null },
    { t:'12–14', c:'liber', free:true },
    { t:'14–16', c:'Algebră și Geometrie', tag:'sem', room:'304CP', prof:'comun cu 2.1' },
    { t:'16–18', c:'Programarea Calculatoarelor', tag:'lab', room:'B418b' },
  ]},
  { key:'joi', label:'Joi', jsday:4, blocks:[
    { t:'08–10', c:'liber', free:true },
    { t:'10–12', altId:'joi1012',
      odd:null,
      even:{ c:'Electrotehnică', tag:'lab', room:'C302' } },
    { t:'12–14', c:'liber', free:true },
    { t:'14–16', c:'Engleză', tag:'sem', room:'A110', prof:'comun cu 2.1' },
    { t:'16–18', c:'Logică și Structuri Discrete', tag:'lab', room:'B418a' },
  ]},
  { key:'vineri', label:'Vineri', jsday:5, blocks:[
    { t:'08–12', c:'liber', free:true },
    { t:'12–14', c:'Recapitulare Fizică', tag:'opt', room:'303CP', prof:'D. Trif', from:2 },
    { t:'14–16', c:'liber', free:true },
    { t:'16–18', c:'Recapitulare Matematică', tag:'opt', room:'ASPC', prof:'D. Popescu', from:2, until:8 },
  ]},
];
