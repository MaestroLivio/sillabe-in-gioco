# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto
usa il [Versionamento Semantico](https://semver.org/lang/it/).

## [Non rilasciato]

### Corretto
- **Diagnostica di layout fuorviante su schermo piccolo**: l'audit misurava la
  sovrapposizione con la barra inferiore subito dopo un ridimensionamento della
  finestra, quando lo scroll non era ancora arrivato in fondo. Ora lo scroll viene
  ripetuto fino al fondo reale e, se non ci arriva, l'audit lo segnala invece di
  mostrare un falso allarme. Verificato: 15 px di margine a 390 px di larghezza.
- **Build macOS che falliva sul secondo avvio**: se una build precedente lasciava
  montato il volume `/Volumes/Sillabe in Gioco…`, `hdiutil detach` falliva e
  electron-builder usciva con codice 1 anche a DMG già scritti. Il nuovo
  `scripts/clean-volumes.js` (eseguito da `npm run build:mac`) smonta i residui.

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
