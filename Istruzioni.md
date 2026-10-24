Agisci come uno sviluppatore web senior specializzato in ed-tech, accessibilità e Comunicazione Aumentativa Alternativa (CAA). 
Crea un'applicazione web interattiva completa (in un unico file standalone con HTML5, CSS3 inline e JavaScript ES6) per l'apprendimento della letto-scrittura basato sul trascinamento delle sillabe e sintesi vocale.

---

### 1. INTERFACCIA GRAFICA (UI/UX)
L'interfaccia deve replicare lo stile visivo dei software didattici per l'infanzia:
* **Tema visivo:** Sfondo celeste/azzurro chiaro con elementi colorati, angoli arrotondati e uno stile cartoon/didattico.
* **Barra di Titolo Superiore:** 
  - Titolo dinamico del livello (es. "2. DALLA PAROLA ALLA FRASE" oppure "4. DALLA FRASE SEMPLICE ALLA FRASE COORDINATA").
  - Pulsante rosso di chiusura/uscita (X) in alto a destra.
* **Area Visiva (TV Container):**
  - Un riquadro a forma di TV vintage color verde petrolio/ottanio contenente l'immagine illustrativa della frase corrente.
* **Riproduttore Audio (Radio Vintage):**
  - Un'icona/pulsante a forma di radio rossa con altoparlante. Cliccandoci sopra viene riprodotta la frase completa via sintesi vocale.
* **Area di Costruzione (Slot Frase):**
  - Contenitori rettangolari azzurri dove inserire le sillabe trascinabili, con separatori arancioni verticali tra gli slot.
  - **Modalità Semplice (con Guida/Suggerimento):** Mostra sopra la riga di composizione la frase completa di esempio. Alcuni slot possono essere pre-riempiti in grigio per guidare il bambino, lasciando solo alcuni slot vuoti da completare.
  - **Modalità Avanzata (Frasi Coordinate):** Presenta due righe separate ("FRASE 1" e "FRASE 2") collegate da un connettore centrale (es. il cerchio arancione/azzurro con la congiunzione "E").
* **Area di Gioco (Tessere Sillabiche):**
  - Tessere rettangolari trascinabili (drag-and-drop) contenenti le sillabe mescolate, comprese delle sillabe "distrattore" (errate).
* **Barra di Navigazione e Strumenti (In basso):**
  - Personaggio/mascotte (es. orsetto o burattino) in basso a sinistra.
  - Pulsanti interattivi: "SUGGERIMENTO" (icona lampada), "STAMPA" (stampante), "ESERCIZI" (cassetta attrezzi), "RIFAI" (ruota cromatica), "HO FINITO" (scatola giochi).
  - Controller di navigazione in basso a destra con frecce avanti/indietro e contatore del livello (es. "3 / 10" o "1 / 40").

---

### 2. FUNZIONALITÀ INTERATTIVE E LOGICA (JavaScript)

1. **Web Speech API (Text-to-Speech in Italiano `it-IT`):**
   * **Sillaba singola:** Quando l'utente clicca o inizia il drag su una tessera sillabica, il sistema deve pronunciarne la fonetica.
   * **Frase completa:** Cliccando sulla Radio rossa, la voce guida legge la frase bersaglio.
   * **Lettura finale automatica:** Quando la frase viene completata correttamente, gli slot si evidenziano di verde, viene riprodotto un effetto sonoro di vittoria e la sintesi vocale legge l'intera frase (o le frasi coordinate) a ritmo scandito.

2. **Drag & Drop (Compatibile con Desktop e Touch Screen):**
   * Supporto sia per eventi mouse (HTML5 Drag and Drop) sia per eventi touch su tablet/LIM (`touchstart`, `touchmove`, `touchend`).
   * Aggancio magnetico (snap-in) delle tessere negli slot corretti.
   * Se la sillaba trascinata è errata o finisce fuori da uno slot, ritorna nella posizione iniziale con un'animazione.

3. **Sistema di Suggerimento e Reset:**
   * Cliccando sul pulsante "SUGGERIMENTO", la prossima sillaba corretta e il rispettivo slot target lampeggiano.
   * Cliccando su "RIFAI", le tessere tornano nella zona di partenza e gli slot si svuotano.

4. **Navigazione tra i Livelli:**
   * Possibilità di scorrere avanti e indietro tra i livelli tramite le frecce.

---

### 3. STRUTTURA DATI (Array JSON di 40 Livelli)
Includi una struttura dati `LEVELS` ben organizzata contenente 40 esercizi divisi in 4 macro-gruppi di difficoltà:

1. **Livelli 1-10 (Dalla Parola alla Frase - Modalità Guidata):**
   - Frasi brevissime (Soggetto + Verbo + Oggetto) con riga di suggerimento e slot pre-riempiti.
2. **Livelli 11-20 (Frasi Semplici con Espansioni):**
   - Frasi lineari complete da ricomporre interamente (es. "Il cane gioca con la palla").
3. **Livelli 21-30 (Frasi Coordinate):**
   - Struttura a doppia frase ("FRASE 1" e "FRASE 2") unite da congiunzioni come "e", "ma", "poi" (es. "Il gatto dorme E il topo va nella tana").
4. **Livelli 31-40 (Frasi Subordinate e Complesse):**
   - Frasi con causali, temporali e relative (es. "Quando piove il bambino apre l'ombrello").

Ogni oggetto livello deve avere la seguente struttura JSON:
```json
{
  "id": 1,
  "title": "2. DALLA PAROLA ALLA FRASE",
  "mode": "simple", // "simple" o "coordinated"
  "image": "path/to/image.jpg",
  "hintText": "il filo è lungo",
  "sentences": [
    {
      "label": "FRASE 1",
      "target": ["il", "fi", "lo", "è", "lun", "go"],
      "prefilled": [true, true, true, true, false, false] // true = slot grigio pre-compilato
    }
  ],
  "distractors": ["co", "vi", "e"]
}