# Changelog

Tutte le modifiche rilevanti di questo progetto sono documentate in questo file.
Il formato segue [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e il progetto
usa il [Versionamento Semantico](https://semver.org/lang/it/).

## [2.2.6] — 2026-10-26

### Aggiunto
- **Avviso automatico delle nuove versioni** (versione desktop macOS/Windows/Linux).
  All'avvio l'app controlla se nel repository c'è una release più recente e, se
  c'è, chiede se scaricarla. Il pacchetto viene scaricato con una barra di
  avanzamento, verificato e poi aperto: su macOS e Windows si apre l'installer,
  su Linux si prepara l'AppImage e si spiega come sostituirlo.
  - Tre pulsanti: **Scarica e installa**, **Più tardi**, **Salta questa versione**.
    «Salta» non ripropone quella versione ai successivi avvii.
  - Si può disattivare dalle impostazioni («Avvisami delle nuove versioni») e
    c'è **Verifica aggiornamenti…** nel menu Aiuto.
  - **Il file scaricato viene verificato con l'impronta SHA-256** dichiarata
    nella release: se non combacia, il file viene buttato e non si apre nulla.

### Come è fatto, e perché
- **Un manifest allegato alla release, non l'API di GitHub.** Il controllo legge
  `aggiornamento.json` da `/releases/latest/download/`, un indirizzo stabile.
  L'API REST di GitHub consente **60 richieste l'ora per indirizzo IP**: in una
  scuola tutte le macchine escono dallo stesso router, quindi il controllo
  avrebbe smesso di funzionare proprio dove serve — e proprio con l'app usata da
  venti computer in aula. Il file allegato non ha questo limite.
- Il manifest è generato in CI dagli artefatti veri
  (`scripts/make-update-manifest.js`), non in locale: gli hash devono essere
  quelli dei file che finiscono nella release. Un manifest costruito su una
  build locale non combacerebbe, e la verifica dell'hash — cioè la protezione
  contro un file manomesso — rifiuterebbe ogni aggiornamento.
- **I nomi dei DMG cambiano fra locale e release**: `actions/upload-artifact`
  sostituisce gli spazi con i punti, quindi lo stesso file è
  `Sillabe in Gioco-2.2.6.dmg` sul disco e `Sillabe.in.Gioco-2.2.6.dmg` nella
  release. Lo script accetta entrambe le forme e scrive nel manifest il nome
  vero trovato.
- Solo HTTPS e solo host di GitHub, **ricontrollati a ogni redirect**: senza
  questo controllo un host consentito potrebbe rimandare a uno qualsiasi e la
  lista bianca non servirebbe a niente.
- Nessun download parte senza un click esplicito. Se non c'è rete il controllo
  fallisce in silenzio e l'app funziona normalmente.

### Cambiato
- **La privacy diceva «nessuna connessione remota»: non è più vero.** Il
  controllo aggiornamenti è una richiesta in uscita. `PRIVACY.md` ora ha una
  sezione dedicata con cosa viene inviato (solo la richiesta del file, nessun
  dato dell'utente), quando, dove, come disattivarlo e il fatto che GitHub
  registra l'indirizzo IP nei propri log come qualsiasi sito. Aggiornati anche
  `README.md`, `Istruzioni.md`, il contratto `build/eula.txt` e la finestra
  «Informazioni su».
- Il controllo esiste **solo nella versione desktop**. Nella PWA e
  nell'estensione ChromeOS gli aggiornamenti li gestisce il browser: non c'è
  nulla da controllare e nessuna richiesta in più.

### Verificato
- 8 casi provati automaticamente con un finto server
  (`scripts/test-updater-integration.js`): versione uguale, rimanda, salta,
  hash sbagliato, manifest malformato, server in errore, controllo disattivato,
  percorso completo fino all'apertura del pacchetto. In tutti i casi di errore
  l'installer **non** viene aperto.
- Download e calcolo dell'hash provati **contro la release vera** su GitHub
  (`scripts/test-updater-net.js`): hash calcolato = hash dichiarato.

## [Non pubblicato]

### Cambiato
- **Licenza: da MIT a CC BY 4.0** (Creative Commons Attribuzione 4.0
  Internazionale), su tutto il progetto — codice sorgente, illustrazioni,
  registrazioni audio e testi didattici. Il testo legale integrale è in
  `LICENSE`, che ora riporta in apertura un riepilogo in italiano con le
  condizioni d'uso e l'esempio di attribuzione, seguito dal testo ufficiale
  inglese (l'unico vincolante).
  - La differenza pratica rispetto a MIT è che CC BY 4.0 **richiede**
    l'attribuzione: chi ridistribuisce o modifica l'opera deve citare
    «Sillabe in Gioco» di Livio Luppino, indicare la licenza e segnalare le
    modifiche. MIT, invece, chiedeva solo di allegare l'avviso di copyright.
  - Il campo `license` di `package.json` e `package-lock.json` ora è
    `CC-BY-4.0`, il valore SPDX corretto per questa licenza.
  - Aggiornati di conseguenza: il contratto `build/eula.txt` davanti
    all'installer Windows (con un paragrafo dedicato all'obbligo di
    attribuzione), la finestra «Informazioni su» dell'app desktop,
    `README.md`, `PRIVACY.md`, `Istruzioni.md` e le note `README.txt` dentro i
    pacchetti web e ChromeOS.
  - **Il file `LICENSE` ora viaggia dentro i pacchetti**: è elencato in
    `build.files` di `package.json` (quindi entra in `app.asar` per macOS,
    Windows e Linux) e viene copiato in `dist/web` e `dist/chromeos` da
    `scripts/package-web.js`. Prima restava solo nel repository, quindi chi
    installava l'app non riceveva il testo della licenza — cosa che MIT
    tollerava ma CC BY 4.0 no, perché l'attribuzione deve accompagnare l'opera.

## [2.2.5] — 2026-10-25

### Corretto
- **Il tremolio sulle vocali era un'arcata di intonazione, non un loop.** La
  2.2.4 costruiva le vocali facendo pronunciare alla voce la lettera ripetuta
  (`"aaaaaa"`), dando per buono che una vocale ripetuta resti un solo suono
  tenuto. Misurata, quella stringa non produce affatto una vocale tenuta: la
  voce ci disegna sopra una **grande arcata di intonazione** — su `/a/` la F0
  sale da 202 a 315 Hz e ridiscende — e all'orecchio quell'onda è il tremolio
  segnalato. Non era una ripetizione di blocchi (il clip era correttamente un
  suono solo), quindi il controllo sui blocchi di 2.2.4 non poteva vederla.
  - Le vocali ora seguono la stessa strada delle consonanti: si **ritaglia**
    dalla parola portatrice un tratto di vocale a **F0 ferma e livello pieno**
    e lo si **rallenta** con `atempo`. Il clip finito misura una deviazione di
    F0 di 0,9–4,8 Hz contro 20–45 Hz di prima: una vocale dritta;
  - le finestre di ritaglio sono state rimisurate su 24–30 parole portatrici
    per vocale, con tre criteri insieme: F0 piatta (escursione < 5 Hz), livello
    pieno fino ai bordi (mai una coda in dissolvenza) e **correlazione
    spettrale ≥ 0,9** con la vocale isolata. Quest'ultimo serve perché in
    «lupo» la /l/ e la /u/ hanno la stessa altezza: senza il confronto di
    spettro si rischia di ritagliare la consonante;
  - la lunghezza scende da 0,50 a 0,45 s: il tratto di partenza è più corto,
    quindi il fattore di rallentamento è minore e `atempo` resta pulito.
- **Il test di pronuncia controllava la cosa sbagliata.** La misura della
  «ripetizione dell'inviluppo» non distingue un loop da una vocale **tenuta**:
  su un suono stazionario — cioè esattamente il risultato voluto — la varianza
  dell'inviluppo è quasi nulla e l'autocorrelazione non misura niente. Con la
  normalizzazione dell'intera finestra dava 0,89–1,02 su vocali corrette,
  quindi il test bocciava i clip giusti; con quella della sola sovrapposizione
  non riconosceva più nemmeno un loop ricostruito apposta (0,32). Al suo posto
  c'è un controllo che misura il difetto **reale**: la deviazione dell'altezza
  della voce (F0), che sull'arcata di intonazione schizza a 45 Hz. Soglia
  12 Hz, metà della vecchia vocale meno sbilanciata. `/r/` è esclusa perché è
  un trillo e l'altezza su un trillo si muove per definizione.
  Verificato in entrambe le direzioni: con il vecchio clip di `/a/` il test
  fallisce (45,1 Hz), con i nuovi passa.
- **La versione per Apple Silicon non si apriva.** La CI esporta
  `CSC_IDENTITY_AUTO_DISCOVERY=false`, quindi electron-builder non firma affatto
  il pacchetto: l'app usciva con la sola firma *linker-signed* che Electron si
  porta dietro (`Info.plist` non legato, nessuna risorsa sigillata) e
  `codesign --verify --deep --strict` la rifiutava. macOS su Apple Silicon
  controlla la firma prima di avviare, mentre la build x86_64 parte anche sotto
  Rosetta, che non fa lo stesso controllo: da qui «la versione per Apple Silicon
  non si apre, quella universal sì».
  - nuovo `scripts/sign-mac.js`, chiamato da `build:mac`, `build:mac:arm64` e
    `build:mac:x64` **dopo** electron-builder e **prima** di `make-dmg.js` (che
    altrimenti impacchetterebbe la copia non firmata): firma ad-hoc con
    `--options runtime` e le entitlements di Electron, verifica con
    `codesign --verify --deep --strict` e rigenera lo ZIP, che electron-builder
    aveva creato prima della firma;
  - la firma è **ad-hoc** (`--sign -`): non avendo un certificato Apple
    Developer non è riconosciuta da Gatekeeper come sviluppatore, ma è valida
    sul disco, lega l'`Info.plist` e sigilla le risorse. **Gatekeeper chiederà
    comunque conferma al primo avvio** di un pacchetto scaricato.

### Nota di onestà
Il crash della versione arm64 **non è stato riprodotto** su questa macchina:
anche la build non firmata si avviava. È provato solo il fatto oggettivo che la
firma pubblicata era invalida (`codesign --verify` falliva, `Info.plist` non
legato, nessuna risorsa sigillata). La correzione rende il pacchetto firmato e
verificabile, ma non è possibile affermare che la causa del mancato avvio fosse
solo quella finché qualcuno non riprova su un Mac Apple Silicon che prima
falliva.

## [2.2.4] — 2026-10-25

### Corretto
- **Il test headless aspettava un tempo fisso invece della schermata.** La
  verifica «schermata parole attiva» falliva a intermittenza: dopo aver
  completato il livello 1 l'app arma il passaggio ai risultati a 1,5 s, mentre
  il test fra quel momento e il controllo dormiva in tutto 1,09 s. Finché il
  codice in mezzo durava meno di ~0,4 s il timer scattava prima del cambio di
  schermata e il test passava; su una macchina più lenta scattava dopo e
  riportava la schermata sui risultati. Ora il test **aspetta la condizione**
  (schermata dei risultati prima, schermata delle parole poi) invece di un
  numero indovinato, e il controllo resta severo: rimuovendo l'apertura del
  laboratorio il test fallisce ancora.
- **La verifica dell'audio non conosceva i fonemi tenuti.** Le soglie di
  durata di `verify.js` citavano ancora il vecchio campo `reps`, quindi un
  fonema rallentato a 0,47 s non aveva un limite proprio; ora ogni tipo ha la
  sua soglia (vocale 1,4 s, fonema tenuto 0,75 s, scoppio 0,45 s) e si
  controlla anche che un fonema non sia **troppo corto** per essere udibile.

## [2.2.3] — 2026-10-25

### Corretto
- **I fonemi «vibravano»: il loop era il difetto.** La 2.2.2 allungava il
  fonema ripetendolo con un `acrossfade`, e all'orecchio quel giro continuo è
  una vibrazione (su `/s/` un ronzio). Ora il tratto ritagliato viene
  **rallentato** con `atempo`, un passaggio per volta e misurando ogni volta la
  durata reale: ne esce **un solo fonema continuo**, lo stesso suono
  pronunciato adagio. Nessun loop, nessuna ripetizione.
  - `atempo` conserva l'altezza: su «emme» il primo picco armonico resta
    159 Hz contro 157 Hz dell'originale, e il centroide spettrale di `/s/`
    passa da 8445 a 8423 Hz. Il fonema è lo stesso, non una voce più grave;
  - il ricampionamento (`asetrate`) dimezza l'altezza (79 Hz) e non si usa;
  - la lunghezza è ora un **bersaglio** (0,38–0,40 s), non un fattore di
    velocità: è la durata in cui `atempo` resta pulito. A 0,60 s la modulazione
    di `/s/` sale a 4,9 dB e si sente «pompare».
- **Il test approvava i loop e bocciava i clip giusti.** Il controllo sulla
  modulazione periodica 2–12 Hz (il «flutter») non distingue il loop dalla
  voce: sulla 2.2.2 il loop di `/m/` misurava 1,3 dB, indistinguibile dal
  tremolio naturale della voce, mentre su `/s/` corretto misura 3,7 dB e
  veniva bocciato. Ora `test-pronunciation.js` misura la **ripetizione
  dell'inviluppo** (autocorrelazione fra 0,10 e 0,40 s): un loop rimette in
  fila lo stesso frammento e sale a 0,77–0,97, un `atempo` resta a 0,00–0,48.
  Provato sui clip della 2.2.2, il nuovo controllo ne **boccia 7 su 8**.
- **Gli scoppi delle occlusive cadevano nel silenzio.** I tagli della 2.2.2
  erano misurati male: per `c` la finestra 0,382–0,412 s di «secco» è dentro
  la chiusura, cioè silenzio (centroide 1744 Hz), e il clip era il rumore di
  fondo e non `/k/`. Ogni occlusiva è stata rimisurata e ora la finestra
  comprende **chiusura + scoppio**, che è ciò che rende il colpo riconoscibile
  come consonante:
  - `b` da «gabbia» 0,434–0,470 s (centroide 2046 Hz);
  - `c` da «cima» 0,000–0,030 s (centroide 6119 Hz, il rumore vero di `/k/`);
  - `d` da «freddo» 0,462–0,492 s (centroide 3798 Hz);
  - `g` da «gallo» 0,070–0,096 s (centroide 2160 Hz);
  - `p` da «pala» 0,014–0,042 s (centroide 2174 Hz);
  - `t` da «tana» 0,001–0,025 s (centroide 3593 Hz).
- **La lettera `z` era una fricativa che l'italiano non ha.** In italiano la
  zeta è un'**affricata** `/ts/` (o `/dz/`), non una fricativa sonora: il clip
  ora è lo scoppio dell'affricata, preso da «zio» in posizione iniziale. La
  2.2.2 usava «pezzo», che è la stessa affricata ma con lo scoppio sepolto.

## [2.2.2] — 2026-10-25

### Corretto
- **Le lettere dicevano il nome tre volte («esse esse esse»).** La correzione
  della 2.2.1 era sbagliata: scrivere la lettera ripetuta (`sss`, `mmm`, `fff`)
  non produce un suono tenuto, perché la voce interpreta la stringa come una
  sigla e compita il **nome** della lettera per ogni lettera scritta. Il clip
  di `s` durava 1,40 s ed era «e-ss-e e-ss-e e-ss-e» (8 blocchi di suono
  separati, misurati): il bambino sentiva esattamente ciò che non doveva.
  Le sole stringhe ripetute che restano un suono unico sono quelle delle
  vocali.

  Ora i 19 clip delle lettere sono il fonema **ritagliato dall'audio della
  voce** e allungato:
  - **vocali** (`a e i o u`): la voce tiene già la vocale, si allunga la
    stringa (`aaaaaa`) e si tiene una /a:/ sola;
  - **continue** (`f l m n r s`): la geminata che ogni nome di lettera
    contiene (*e**ss**e*, *e**mm**e*, *e**ll**e*, *e**nn**e*, *e**ff**e*,
    *e**rr**e*) viene tagliata nei punti misurati sull'audio e allungata a
    0,78 s con un **loop sfumato** (`acrossfade`): la vocale del nome non si
    sente mai. Per `v` e `z`, il cui nome non ha la geminata, si parte da una
    parola vera (*a**vv**io*, *pe**zz**o*);
  - **occlusive** (`p b t d c g`): il clip è il solo **scoppio**, preso da una
    parola con la doppia (*fa**tt**o*, *do**pp**io*, *se**cc**o*) e ripetuto
    due volte, a picco uniforme: prima `/t/` usciva 30 dB sotto `/b/`.
- **Il test non poteva accorgersene.** La verifica della 2.2.1 chiedeva solo
  che il clip fosse *più lungo del nome della lettera*: «esse esse esse»
  (1,40 s) è più lungo di «esse» (0,66 s), quindi passava. Ora
  `test-pronunciation.js` analizza la **forma d'onda** dei clip: un fonema
  tenuto deve essere **un solo blocco di suono** senza pause interne, di
  durata fra 0,5 e 1,2 s, senza modulazione periodica 2–12 Hz (il «pompaggio»
  del loop); un'occlusiva deve avere esattamente `reps` scoppi. Il test è
  stato provato sui clip della 2.2.1 e li **boccia tutti** (`s`: 8 blocchi,
  `z`: 5, `f`: 4, `i`: 3).
- **Anche la riserva della sintesi di sistema ripeteva il nome.** `LETTER_SAY`
  in [index.html](index.html) mappava `s` su `"sss"`: se il clip preregistrato
  mancava, la sintesi diceva di nuovo «esse esse esse». Ora passa una lettera
  sola.
- **I fonemi erano troppo deboli.** `loudnorm` misura l'energia su tutto il
  clip: su un rumore sordo come /s/ o /f/ sbaglia e li lasciava 10 dB sotto le
  vocali (misurato: /s/ a −28,8 dB RMS contro −16/−17 delle vocali), con
  l'MP3 a 32 kbps che toglieva altri 7 dB alle alte frequenze. Ora il livello
  si misura **dopo la codifica**, si normalizza l'energia media e la codifica
  si rifà una sola volta dal WAV (nessuna doppia generazione lossy).

### Limite dichiarato
- `/v/` non è una fricativa pura: questa voce produce una labiodentale
  **approssimante** ([ʋ], centroide ~820 Hz), non un rumore in alta
  frequenza. È il suono più vicino che la voce sappia fare; resta distinto da
  `/b/`, `/f/` e `/l/`.

## [2.2.1] — 2026-10-25

### Corretto
- **Le singole lettere venivano lette con il loro nome.** Nel laboratorio
  «Formazione di parole» la tessera `s` diceva «esse», la `z` «zeta», la `m`
  «emme»: la voce di sistema legge una lettera isolata sempre come nome (la
  forma `say -v Emma "s"` è identica byte per byte a `"esse"`). I 19 clip delle
  lettere sono stati riscritti come fonema: per i suoni continui ripetendo la
  lettera (`sss`, `zzz`, `mmm`…) al 30% della velocità, per le occlusive
  tenendo il solo scoppio.

  **Attenzione:** la strategia dei suoni continui era sbagliata — `sss` non è un
  suono tenuto, è il nome compitato tre volte. Corretto in [2.2.2].
- **`c` e `g` usano il suono duro** (`/k/`, `/g/` come in *casa*, *gatto*),
  coerente con le parole della tappa «lettere». (Tuttora valido.)
- **Regola unica.** La tabella `LETTER_PHONEMES` in
  [pronunciation.js](scripts/audio/pronunciation.js) è la sola fonte di verità,
  letta da `build.js` e da `verify.js`. (Tuttora valido.)

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
