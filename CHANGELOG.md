# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto
usa il [Versionamento Semantico](https://semver.org/lang/it/).

## [2.2.1] — 2026-10-25

### Corretto
- **Le singole lettere venivano lette con il loro nome.** Nel laboratorio
  «Formazione di parole» la tessera `s` diceva «esse», la `z` «zeta», la `m`
  «emme»: la voce di sistema legge una lettera isolata sempre come nome (la
  forma `say -v Emma "s"` è identica byte per byte a `"esse"`). Ora i 19 clip
  delle lettere sono il **fonema lento**, non il nome:
  - i suoni che si possono tenere (vocali, `f l m n r s v z`) sono registrati
    ripetendo la lettera (`sss`, `zzz`, `mmm`, `fff`…) con la voce al **30%
    della velocità** (`-r 50`);
  - le occlusive (`p b t d c g`) non si possono tenere: il clip è lo **scoppio**
    della consonante, ricavato tagliando la vocale che la voce aggiunge e
    ripetuto 2–3 volte con una pausa breve, senza la /i/ di «ti», «pi», «ci»;
  - `c` e `g` usano il suono **duro** (`/k/`, `/g/` come in *casa*, *gatto*),
    coerente con le parole della tappa «lettere».
- **Regola unica e verificata.** La tabella `LETTER_PHONEMES` in
  [pronunciation.js](scripts/audio/pronunciation.js) è la sola fonte di verità:
  `build.js` genera i clip da lì, `verify.js` controlla che ogni lettera del
  pool abbia il fonema e che il clip non sia il nome, `test-pronunciation.js`
  confronta ogni lettera con la lettura del suo nome e — per i suoni tenuti —
  pretende un clip più lungo del nome. Anche la riserva (sintesi di sistema)
  usa la stessa forma e scende a velocità `0.3`.

## [2.2.0] — 2026-10-25

### Corretto
- **Sillaba letta due volte a ogni tocco.** Un tap produce un `pointerdown`
  *seguito* da un `click`: entrambi chiamavano `speak()`, quindi la sillaba
  partiva due volte e si sovrapponeva. Ora `pointerdown` non parla mai: parla il
  `click` per il tocco e `onDragMove` nel momento in cui il trascinamento
  comincia davvero. Un solo suono per gesto, verificato dallo smoke test che
  conta le chiamate a `speak()` durante un tap (`1`, non `2`).
- **La barra inferiore copriva le tessere del laboratorio parole.** La variabile
  `--bar-h` era misurata sulla prima barra del documento e non veniva ricalcolata
  al cambio di schermata; ora `syncBottomBarHeight()` misura la barra della
  schermata attiva e viene richiamata da `showScreen()`.

### Aggiunto
- **Formazione di parole: 20 parole illustrate**, in due tappe.
  - *Unisco le lettere* (8 parole): ape, mela, sole, luna, pane, casa, dado, faro.
  - *Unisco le sillabe* (12 parole): gatto, cane, pesce, rana, topo, fiore, palla,
    treno, nave, libro, ombrello, campana.
  - Ogni parola ha la sua figura (illustrazioni 41–60), i suoi pezzi e 3 distrattori.
  - La parola **cresce sotto le caselle** mentre viene composta.
  - Schermata dedicata con TV, radio, suggerimento, mescola, rifai e navigazione
    parola precedente/successiva; scorciatoie `←` `→` `H` `R`.
- **20 esercizi finali sui suoni difficili**: `che chi ce ci cia cio ciu ge gi ghe
  ghi gli gn gno sci sce spr str squ qua`. Si ascolta la parola
  (formiche, chitarra, cesto, città, camicia, ciotola, ciuffo, gelato, giraffa,
  alghe, ghiaccio, aglio, bagno, ragno, sciarpa, pesce, spremuta, strada, squalo,
  quaderno) e si sceglie la grafia giusta fra quattro. La scheda del suono mostra
  il gruppo e la parola con il gruppo evidenziato.
- **Tutto maiuscolo on/off** nelle impostazioni: tessere, caselle e parole in
  MAIUSCOLO, etichette dell'interfaccia invariate.
- **Lettura delle parole on/off**: spegne la voce sulle parole intere; i pulsanti
  ASCOLTA lo segnalano invece di contraddire l'impostazione.
- **Esercizio scelto dal docente** nel menu impostazioni: quiz misto, tutti e 20 i
  suoni difficili oppure un singolo suono, con ▶ *Avvia l'esercizio*.
- **Nuovi pulsanti in home**: 🔤 PAROLE e 👂 SUONI DIFFICILI, più l'elenco delle
  20 parole con lo stato di completamento.
- **60 illustrazioni** (erano 40): le 20 nuove scene delle parole sono disegnate
  dal generatore vettoriale e non contengono testo, come le altre.
- **25 nuovi clip audio**: 42 pezzi del laboratorio (lettere e sillabe) e 20 parole
  dei suoni difficili. In tutto **393 clip** con la voce neurale, sempre offline.

### Strumenti
- `scripts/audio/build.js --missing` sintetizza solo i clip assenti, senza
  riscrivere quelli già validati.
- `scripts/validate.js` controlla anche le 20 parole (pezzi che ricompongono la
  parola, distrattori, figura) e le 20 schede sui suoni (opzioni e unicità).
- Smoke test esteso a laboratorio parole, suoni difficili, impostazioni e
  regressione del doppio audio (48 controlli).
- L'audit di layout verifica anche le schermate PAROLE e SUONI DIFFICILI.

## [2.1.1] — 2026-10-25

### Corretto
- **Pacchetto Windows non più bloccante in CI**: le sillabe `con` producevano i file
  `audio/syl/con.mp3` e `audio/parole/con.mp3`. `CON` è un nome di dispositivo
  riservato di Windows, quindi il checkout del repository su `windows-latest`
  falliva con `invalid path 'audio/parole/con.mp3'` e il pacchetto Windows non
  veniva pubblicato. I file sono ora `con_.mp3` e lo slug del generatore
  (`scripts/audio/build.js`) aggiunge un `_` finale a tutti i nomi riservati, così
  una rigenerazione futura non può ricreare il problema.
- **Controllo di portabilità dei nomi audio** (`scripts/audio/verify.js`, §7):
  verifica nomi riservati (CON, PRN, AUX, NUL, COM1-9, LPT1-9), caratteri non
  ammessi, punto o spazio finale e collisioni case-insensitive prima del commit.

## [2.1.0] — 2026-10-25

### Aggiunto
- **Tutte le voci registrate con una voce neurale italiana e incluse nell'app.**
  Al posto della sintesi di sistema a runtime, l'app porta con sé 166 sillabe,
  40 frasi, 138 parole degli esercizi e le battute dell'interfaccia: 352 clip MP3
  (≈1 MB in tutto), identici su ogni dispositivo e disponibili anche senza alcuna
  voce italiana installata.
- **Riproduzione offline dei clip**: il service worker mette in cache i file al
  primo ascolto e li serve subito dopo; i clip sono inclusi nell'`app.asar` dei
  pacchetti desktop, nello ZIP PWA e nell'estensione ChromeOS.
- **Ripiego automatico**: se un file audio manca, l'app legge con la Web Speech
  API del sistema, preferendo le voci neurali/premium quando disponibili. Un test
  (`npm run test:audio`) verifica che nessuna sillaba, frase o parola resti senza clip.

### Corretto
- **Le sillabe non vengono più compitate come sigle.** Con la voce di sistema
  italiana (Alice) le sillabe isolate **`ac`, `ap`, `ia`, `ta`, `uc`** venivano lette
  lettera per lettera («a ci», «a pi», «i a», «ti a», «u ci»): un bambino sentiva
  un acronimo invece di una sillaba. La causa è stata isolata confrontando l'audio
  del token con quello delle lettere separate, che risultava **identico byte per byte**.
  Con la voce neurale le stesse cinque sillabe sono lette come sillabe singole
  (verificato: durata diversa e audio diverso dalla lettura compitata).
- **Test di regressione sulla pronuncia** (`npm run test:pronuncia`): confronta ogni
  sillaba critica con la sua lettura lettera per lettera e fallisce se l'audio
  coincide o se la durata è compatibile con una compitazione. Il test è nella CI,
  quindi una rigenerazione futura non può reintrodurre il difetto in silenzio.
- **Collisioni nei nomi dei file audio**: `e`/`è` e `pa`/`pà` sono sillabe diverse
  ma finivano nello stesso file; ora le vocali accentate hanno un suffisso dedicato.

### Strumenti
- `npm run audio` rigenera tutti i clip con la voce neurale (`--only=syl|frasi|parole|ui`
  per un solo gruppo), in parallelo su 8 processi.
- `npm run test:audio` valida copertura, durate, file mancanti e file orfani.
- `scripts/audio/` contiene estrazione dei testi da `index.html` (sorgente unica di
  verità), tabella delle correzioni di pronuncia, sintesi e verifica.

## [2.0.2] — 2026-10-25

### Aggiunto
- **Verifica automatica delle distribuzioni pubblicate** (`npm run test:release`):
  scarica gli artefatti della release da GitHub e controlla che ognuno contenga
  le 40 illustrazioni, aprendo `app.asar` per i pacchetti desktop e gestendo
  `.dmg` (hdiutil), `.deb` (formato ar) e `.AppImage` (immagine squashfs).
  Verificati tutti e 10 gli artefatti della release: 40/40 illustrazioni in
  ognuno, nessuna esclusa.
- **Un'illustrazione vettoriale per ognuna delle 40 frasi.** Ogni livello ha ora
  un disegno "da libro illustrato" al posto delle sole emoji: il gatto con la
  ciotola di latte, la mamma ai fornelli, il treno in stazione, la luna sul mare
  di notte, la festa a scuola. Scene complete di personaggi, animali, arredi e
  paesaggi (168 forme medie per scena), in 1280×720.
- **Sorgenti vettoriali versionati** in `illustrations/NN.svg`: le immagini
  possono essere modificate o ristampate a qualsiasi risoluzione. Le PNG sono
  generate da questi sorgenti.
- **Nessun testo dentro i disegni.** È un'app di letto-scrittura: l'illustrazione
  mostra il significato della frase, non la sua scrittura. Un controllo
  automatico (`scripts/illustrations/verify.js`) verifica che ogni PNG contenga
  i colori dei soggetti previsti e che tutte e 40 le scene siano diverse.
- `npm run illustrations` rigenera le 40 immagini; `npm run test:illustrations`
  le valida.

### Cambiato
- La TV del livello mostra il PNG dedicato alla frase, con lo SVG disegnato al
  volo come riserva se un file non fosse disponibile.
- La didascalia testuale sovraimpressa all'illustrazione è stata rimossa: la
  frase resta leggibile nel suggerimento guidato, nella lettura ad alta voce e
  nella schermata dei risultati.
- Le illustrazioni sono incluse nei pacchetti desktop, web/PWA e ChromeOS e
  precaricate dal service worker, quindi restano disponibili offline.
- `npm test` include ora il controllo delle illustrazioni.

## [2.0.1] — 2026-10-25

### Corretto
- **Diagnostica di layout fuorviante su schermo piccolo**: l'audit misurava la
  sovrapposizione con la barra inferiore subito dopo un ridimensionamento della
  finestra, quando lo scroll non era ancora arrivato in fondo. Ora lo scroll viene
  ripetuto fino al fondo reale e, se non ci arriva, l'audit lo segnala invece di
  mostrare un falso allarme. Verificato: 15 px di margine a 390 px di larghezza.
- **Build macOS inaffidabile**: electron-builder creava il DMG montando un volume
  in `/Volumes` e disponendo la finestra via automazione di Finder; se il volume
  restava occupato, `hdiutil detach` falliva e la build usciva con codice 1 anche a
  DMG e ZIP già scritti. Ora i DMG sono creati da `scripts/make-dmg.js` in un solo
  passaggio `hdiutil`, senza volume da smontare né AppleScript: app e collegamento
  ad *Applicazioni* restano identici. `scripts/clean-volumes.js` pulisce comunque
  i residui di build interrotte.

## [2.0.0] — 2026-10-24

### Aggiunto
- **Architettura a schermate multiple**: home con percorsi e statistiche, livello, esercizi,
  risultati, trofei. Navigazione con cronologia, tasto Home ed `Esc`.
- **40 livelli con 40 frasi diverse** (prima la stessa frase si ripeteva): 10 guidati,
  10 frasi semplici, 10 coordinate, 10 complesse con subordinate.
- **Illustrazioni SVG originali per ogni frase**, generate a runtime con personaggi,
  paesaggio e didascalia: nessun asset esterno, nessun diritto di terzi.
- **Modulo Esercizi**: 8 domande per sessione su quattro tipi (ascolto, sillaba iniziale,
  conteggio, lacuna), con punteggio, precisione, record e cronologia.
- **Sistema di trofei** con 8 traguardi e medagliere dedicato.
- **Scheda stampabile** per livello, con caselle, tessere da ritagliare e spazio per nome e data.
- **Impostazioni di accessibilità**: dimensione testo, velocità voce, scelta della voce
  italiana, tema scuro, effetti sonori, lettura automatica, riga suggerimento,
  riduzione animazioni.
- **Effetti sonori sintetizzati** con WebAudio (inserimento, errore, suggerimento, vittoria):
  nessun file audio.
- **Confetti e animazioni** rispettose di `prefers-reduced-motion`.
- **Tre modalità di input**: drag & drop con Pointer Events (mouse, dito, penna),
  tap tessera + tap casella, tastiera.
- **Pacchetti di distribuzione**: DMG e ZIP per macOS (arm64 + x64), installer NSIS e
  versione portabile per Windows, PWA installabile e estensione MV3 per ChromeOS.
- **App desktop Electron** con menu in italiano, stampa nativa, contesto isolato e
  allowlist dei permessi.
- **Service worker** per l'uso offline della PWA.
- **CI GitHub Actions** con matrice macOS, Windows e Linux.

### Modificato
- Interfaccia completamente ridisegnata: TV vintage, radio rossa, slot azzurri con
  separatori arancioni, tessere arancioni, mascotte Orsetto Lino.
- Lettura finale **scandita sillaba per sillaba** invece della sola frase intera.
- Le frasi coordinate mostrano due righe con connettore centrale (prima una sola riga).
- I suggerimenti sono contestuali: slot e tessera lampeggiano insieme.
- La sillaba viene pronunciata anche al tocco della tessera, non solo al drag.
- Distrattori generati automaticamente e verificati per non coincidere con sillabe corrette.
- Titoli dei livelli coerenti con il percorso (prima erano tutti uguali).

### Corretto
- Illustrazioni che mostravano la scritta generica "Livello N" invece della frase.
- Frasi duplicate tra livelli diversi.
- Mancata spaziatura nella didascalia delle illustrazioni.
- Tessere rimosse dal DOM senza aggiornare lo stato interno.
- Layout che si sovrapponeva alla barra inferiore su schermi piccoli.
- Nessuna gestione degli errori della sintesi vocale senza voci italiane installate.

### Sicurezza
- Content Security Policy restrittiva (`default-src 'self'`, `object-src 'none'`).
- Electron: `contextIsolation`, `sandbox`, `nodeIntegration: false`, blocco della
  navigazione esterna e dei popup.
- Nessuna connessione di rete a runtime: verificabile dai file inclusi nei pacchetti.

## [1.0.0] — 2026-10-18

### Aggiunto
- Prima versione dell'app in un singolo file HTML con 40 livelli, drag & drop,
  sintesi vocale italiana, suggerimento, rifai, stampa e navigazione.
- Struttura dati `LEVELS` con modalità semplice e coordinata.

[2.0.0]: https://github.com/MaestroLivio/sillabe-in-gioco/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/MaestroLivio/sillabe-in-gioco/releases/tag/v1.0.0
