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
// ============================================================

// Schimbă data asta când actualizezi orarul: o vezi în subsolul aplicației
// și știi că ai primit ultima versiune.
const ORAR_VERSION = '2026-10-10';

// Luni din săptămâna 1 (an, lună de la 0, zi)
const WEEK1_MONDAY = new Date(2026, 8, 28); // 28 sept 2026

const DAYS = [
  { key:'luni', label:'Luni', jsday:1, blocks:[
    { t:'08–10', c:'Analiză Matematică', tag:'curs', room:'A117', prof:'A. Juratoni' },
    { t:'10–13', c:'Programarea Calculatoarelor', tag:'curs', room:'A117', prof:'V. Stangaciu' },
    { t:'13–14', c:'Oră de tutoriat', tag:'curs', room:'A117', prof:'V. Stangaciu' },
    { t:'14–16', altId:'luni1416',
      odd:null,
      even:{ c:'Educație Fizică — Culturism', tag:'sport', room:'Baza 1, sala', prof:'Sarandan' } },
    { t:'16–18', altId:'luni1618', skipWeek1:true,
      odd:{ c:'Electrotehnică', tag:'curs', room:'M304, MEC' },
      even:{ c:'Algebră și Geometrie', tag:'curs', room:'M304, MEC' } },
  ]},
  { key:'marti', label:'Marți', jsday:2, blocks:[
    { t:'08–10', c:'Logică și Structuri Discrete', tag:'curs', room:'ASPC', prof:'C. Iapa' },
    { t:'10–12', c:'Fizică', tag:'curs', room:'ASPC', prof:'D. Trif' },
    { t:'12–14', c:'liber', free:true },
    { t:'14–16', c:'Electrotehnică', tag:'curs', room:'A2 Chimie', prof:'I. Tatai' },
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
    { t:'12–14', c:'Recapitulare Fizică', tag:'opt', room:'303CP', prof:'D. Trif · începând săpt. 2' },
    { t:'14–16', c:'liber', free:true },
    { t:'16–18', c:'Recapitulare Matematică', tag:'opt', room:'ASPC', prof:'D. Popescu · doar săpt. 2–8' },
  ]},
];
