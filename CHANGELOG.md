# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto
usa il [Versionamento Semantico](https://semver.org/lang/it/).

## [2.0.2] — 2026-10-25

### Aggiunto
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
