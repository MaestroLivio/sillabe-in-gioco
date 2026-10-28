# Il viaggio delle sillabe

Modulo di letto-scrittura fonico-sillabica aggiunto a **Sillabe in gioco** a
partire dalla versione 2.3.0. Non sostituisce i percorsi esistenti: si apre
dalla home, ha una navigazione propria e riusa voce, illustrazioni, effetti,
token CSS e impostazioni dell'app.

## 1. Cosa c'è

- **8 livelli** di curricolo, dalle vocali ai gruppi complessi.
- **136 unità**: 104 sillabe, 20 segmenti fonologici, 3 grafemi, 9 moduli.
- **469 parole illustrate** con sillabazione esplicita, categoria, difficoltà
  lessicale, prerequisiti e stato di revisione.
- **109 frasi** con sillaba bersaglio e occorrenze calcolate sulla sillabazione
  vera.
- **1.971 esercizi generati** (minimo 12 per unità; 12–17 in tutte
  dei casi), distribuiti su 40 modelli didattici.
- **7 giochi**: mercato, bosco, trenino, pesca, ponte, detective, famiglie.
- **4 modalità di frase**: ascolta e osserva, ascolta e completa, costruisci,
  inventa (solo dove esistono almeno due soluzioni approvate).
- **Pannello insegnante** con PIN, selezione unità, ordine famiglie, numero di
  alternative, tipologie attive, parole/immagini/audio personali, sillabazioni
  corrette, frasi con parole del dizionario, risultati, CSV/PDF e azzeramento
  per unità.
- **Progressi per profilo** e per competenza: uditivo, iniziale, finale,
  interna, segmentazione, composizione, frase, lettura, posizione.
- **Ripasso consigliato** sulle unità con più errori o non riviste da tempo.

## 2. File

| File | Ruolo |
|---|---|
| `js/viaggio-dati.js` | dizionario, curricolo, frasi, moduli, generatore, validazione. Nessuna UI. |
| `js/viaggio.js` | schermate, sessione, risposte, memoria, ordine, frasi, giochi, pannello docente. |
| `css/viaggio.css` | stili del modulo, responsive e touch. |
| `scripts/validate-viaggio.js` | test dei contenuti e del generatore (Node). |
| `scripts/viaggio-audit.js` | test d'interfaccia in Electron. |
| `scripts/illustrations/word-cards.js` | genera le schede SVG delle parole che non hanno già un PNG. |
| `scripts/audio/extract.js` | estrae anche le unità, parole e frasi del viaggio per la voce. |
| `audio/frasiViaggio/*.mp3` | frasi del viaggio, un file per id stabile. |

I dati sono caricabili sia dal browser (`window.ViaggioDati`) sia da Node
(`require`): la stessa fonte alimenta app, test e generazione degli asset.

## 3. Scelte linguistiche

- La sillabazione è **sempre esplicita** in ogni parola e in ogni parola delle
  frasi. Non si ricava mai cercando lettere all'inizio o alla fine.
- Le trappole sono trattate come dati, non come eccezioni nel codice:
  - MAMMA → MAM-MA (MA è la sillaba **finale**);
  - MUCCA → MUC-CA (MU **non** è la prima sillaba);
  - GATTO → GAT-TO; CHIAVE → CHIA-VE; ZAINO → ZAI-NO;
  - GOMMA → GOM-MA; PALLA → PAL-LA; CAMPANA → CAM-PA-NA.
- **Segmenti** (`AM`, `EM`, … `UN`) e **grafemi** (`GLI`, `SCIE`, `ZU`) non
  sono presentati come sillabe: le consegne dicono «suono» o «gruppo». Solo le
  unità di tipo `sillaba` sono soggette alla regola delle dieci attività per
  sillaba.
- Dove l'italiano non offre parole aperte sufficienti (per esempio `VU`, `ZU`,
  `QUI`, `GNU`), il generatore usa attività di ascolto, segmentazione e
  riconoscimento del gruppo, e il limite è documentato nell'unità.
- I moduli del livello 7 (CVC, gruppi con L/R, gruppi con S, doppie, dittonghi,
  parole lunghe, accento, trappole) sono attività **lessicali**: non si pretende
  che ogni combinazione teorica abbia dieci parole familiari.

## 4. Generatore

`generaEsercizi(unitId, opzioni)` produce esercizi completi e validati:

1. ascolto della sillaba;
2. discriminazione con distrattori simili;
3. famiglia da completare;
4. immagine → prima sillaba;
5. sillaba → immagine che inizia così;
6. una seconda immagine per la stessa sillaba;
7. immagine → ultima sillaba;
8. caccia alla sillaba finale (una o più risposte);
9. completamento della parola;
10. treno delle sillabe;
11. memory immagine/sillaba;
12. conteggio delle sillabe;
13. posizione iniziale/mezzo/finale;
14. riordino della frase;
15. caccia alle occorrenze nella frase;
16. parola mancante nella frase;
17. invenzione di una frase con soluzioni approvate.

Se una tipologia non è applicabile (per esempio non esistono parole finali
adeguate), il generatore aggiunge un'attività di pari difficoltà: non riduce il
totale sotto le dieci. Il mescolamento delle risposte avviene a ogni rendering;
la risposta corretta non ha una posizione fissa.

Ogni esercizio dichiara: unità, modello, interazione, competenza, difficoltà,
consegna, stimolo, opzioni, soluzione, aiuto, feedback e prerequisiti.
`validaEsercizio` controlla una sola risposta corretta, opzioni uniche e
soluzione coerente.

## 5. Frasi e lettura animata

Le frasi hanno parole con sillabazione esplicita e `occorrenze` calcolate. La
modalità «Leggi a pezzi» pronuncia una sillaba alla volta e illumina la tessera
corrispondente: la sincronizzazione è quella del clip, non una stima. La frase
intera ha un file dedicato in `audio/frasiViaggio/`.

Per la modalità «Inventa» il sistema non valuta testo libero con un confronto
di stringhe: confronta la sequenza con `soluzioniValide`, approvate nel dato.
Se non ci sono almeno due soluzioni, la modalità non viene proposta.

## 6. Pannello insegnante

Il PIN predefinito è `1234`. Non è una protezione crittografica: evita le
modifiche accidentali. Dal pannello si può:

- scegliere le unità attive (o un solo livello);
- riordinare le famiglie;
- mettere in evidenza iniziale/finale/interna;
- scegliere 2–5 alternative;
- regolare la soglia di acquisizione (50–100%);
- attivare bassa stimolazione, percorso semplificato (2 alternative), voce lenta, stampato maiuscolo/minuscolo;
- disattivare tipologie di esercizio (se il filtro scende sotto 10, l'app
  avvisa e mostra tutte);
- aggiungere parole con immagine (file o emoji) e audio;
- correggere una sillabazione dopo verifica linguistica;
- creare frasi usando parole del dizionario o già presenti nelle frasi;
- esportare CSV e PDF/stampa;
- azzerare i progressi di una singola unità o dell'intero profilo;
- creare più profili.

Tutto resta nel browser (localStorage). Non ci sono account né servizi online.

## 7. Immagini e audio

- Le parole che hanno già un'illustrazione vettoriale dell'app usano il PNG
  esistente (`illustrations/NN.png`).
- Le altre usano una scheda SVG generata (`illustrations/parole/<id>.svg`):
  sfondo per categoria, cornice, ombra e pittogramma emoji. Le schede non
  contengono testo, così non suggeriscono la risposta.
- L'audio è preregistrato con la voce neurale italiana «Emma» (macOS `say`) e
  indicizzato in `audio/manifest.json`. Le unità rare e i gruppi complessi
  vanno ascoltati e, se necessario, sostituiti dal docente: il pannello accetta
  un audio personalizzato per ogni parola.
- Le immagini e gli audio personali sono data URL locali, con limiti di
  dimensione (320 KB immagine, 900 KB audio) per non saturare lo spazio.

## 8. Test

```bash
npm run test:viaggio       # contenuti, generatore, trappole, immagini, audio
npm run test:viaggio:ui    # interfaccia Electron: mappa, unità, esercizi, frasi, docente
npm run validate           # controlli storici dell'app
npm test                   # suite completa
```

Il test dei contenuti verifica, tra l'altro:

- ricomposizione di ogni parola dalle sillabe;
- esistenza di ogni immagine;
- occorrenze delle frasi ricalcolate in modo indipendente;
- almeno 12 esercizi validi per unità;
- almeno 3 interazioni, 2 attività uditive, 2 associazioni con immagini,
  1 costruzione e 1 frase per ogni sillaba;
- trappole MAMMA/MUCCA/GATTO/CHIAVE/ZAINO/GOMMA/PALLA/CAMPANA;
- copertura audio dei gruppi `syl`, `parole`, `frasiViaggio`, `ui`.

## 9. Limiti dichiarati

- **Audio TTS**: è una voce neurale, non una registrazione di un insegnante.
  Le unità rare (`GNE`, `GNI`, `SCIA`, `SCIO`, `SCIU`, `ACQUA`, `CQU`) e le
  parole con accento vanno riascoltate e validate dal docente. Ogni clip è
  sostituibile.
- **Immagini emoji**: per molte parole la scheda è un pittogramma emoji, non un
  disegno vettoriale originale. È coerente, offline e riconoscibile, ma non ha
  la stessa fattura delle 67 scene storiche. Le parole astratte usano un
  contesto (per esempio un libro per l'articolo IL) e sono marcate come tali.
- **Livello 7**: i moduli non sono scomposti in una unità per ogni combinazione
  teorica; sarebbero stati necessari contenuti artificiali. Le attività sono
  lessicali e verificano i gruppi dentro parole reali.
- **Frasi**: ogni sillaba ha almeno una frase; non tutte hanno più varianti per
  la modalità «Inventa». Dove manca, la modalità è disattivata e spiegata.
- **Sillabe rare**: `ZU` è un grafema (zucca, zuppa, zucchero hanno ZUC/ZUP);
  `VU`, `QUI`, `GNU` hanno pochissime parole aperte. Le attività sostitutive
  sono dichiarate nell'unità.
- **PIN**: non è sicurezza informatica, solo una soglia d'accesso.

## 10. Come aggiungere contenuti

1. Aggiungi la parola in `js/viaggio-dati.js` con `P(id, TESTO, "SIL-LA-BE", "@emoji" o "42", categoria, livello)`.
2. Se usi `@emoji`, esegui `npm run illustrations:parole`.
3. Aggiungi la frase con `S(id, "SILLABA", livello, [["PAROLA","SIL-LA-BE"]], ["emoji"], { soluzioni: [...] })`.
4. Esegui `npm run test:viaggio`; se mancano audio, `npm run audio -- --missing`
   (o i singoli gruppi) e poi `npm run test:audio`.
5. Per un modulo nuovo, aggiungilo a `MODULI` con `parole` e `tipi`.
