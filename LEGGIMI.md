# Orar CTI D-2.2 — aplicație offline (PWA)

## Pune-o online (o singură dată, gratuit)
1. Cont pe github.com → New repository → nume `orar` → Public.
2. "uploading an existing file" → trage TOATE fișierele și folderele de aici (index.html, data.js, app.js, sw.js, style.css, fonts.css, manifest.webmanifest, folderele `icons` și `fonts`) → Commit.
3. Settings → Pages → Source: "Deploy from a branch" → Branch `main` / folder `/ (root)` → Save.
4. După ~1 minut ai adresa `https://USERNAME.github.io/orar/`.

## Instalează pe iPhone
Deschide adresa în **Safari** → Share → **Add to Home Screen** → Add.
Deschide-o o dată cu internet; de acum merge și fără.

## Actualizare
Modifici doar `data.js` (și schimbi `ORAR_VERSION`), îl încarci pe GitHub peste cel vechi.
Data viitoare când deschizi aplicația cu internet, ia singură versiunea nouă.

Dacă schimbi și `app.js`, `index.html` sau `style.css`, încarcă-le pe toate și pe `sw.js`
(în el e numărul `CACHE`, mărit la fiecare versiune nouă ca telefonul să arunce copia veche).

## Calendarul semestrului
În `data.js`, `PERIODS` ține perioadele din hotărârea Senatului UPT nr. 26/2026 (predare 1–12,
vacanță 3 săpt., predare 13–14, sesiune 4 săpt., vacanță 1 săpt.). `HOLIDAYS` ține zilele libere legale.
Un curs care se termină mai devreme se marchează cu `until: N` (ex. Electrotehnică `until:10`),
unul care începe mai târziu cu `from: N`.
