# Informativa sulla privacy · Sillabe in Gioco

**Ultimo aggiornamento:** 26 ottobre 2026
**Versione applicazione:** 2.2.6
**Titolare:** Livio Luppino

## In sintesi

Sillabe in Gioco **non raccoglie alcun dato personale**. Non ci sono account, server,
analytics, pubblicità o tracciamenti. L'applicazione funziona interamente sul dispositivo
dell'utente.

L'unica connessione di rete è il **controllo degli aggiornamenti** della versione desktop:
all'avvio l'app chiede a GitHub se esiste una versione più recente. È una richiesta
anonima, senza dati dell'utente, e si può disattivare dalle impostazioni. Dettagli nella
sezione [Controllo aggiornamenti](#controllo-aggiornamenti).

## Controllo aggiornamenti

La versione desktop (macOS, Windows, Linux) può avvisare quando esce una versione nuova.
Per farlo scarica un piccolo file di testo — `aggiornamento.json` — dall'indirizzo
pubblico del progetto su GitHub, poi chiede all'utente se vuole aggiornare.

| Aspetto | Comportamento |
|---|---|
| Cosa viene inviato | Solo la richiesta del file. Nessun identificativo, nessun dato di gioco, nessun dato del bambino |
| Quando | All'avvio, una volta sola, dopo 2,5 secondi; oppure quando l'utente preme «Controlla adesso» |
| Dove va | `github.com` e i server degli allegati di GitHub (`release-assets.githubusercontent.com`) |
| Si può disattivare | Sì, dalle impostazioni: «Avvisami delle nuove versioni» |
| Se non c'è rete | Il controllo fallisce in silenzio, senza messaggi. L'app funziona normalmente |
| Chi lo riceve | GitHub, che come qualsiasi sito registra l'indirizzo IP della richiesta nei propri log |
| Se si accetta il download | Si scarica il pacchetto solo dopo un click esplicito; il file viene verificato con l'impronta SHA-256 pubblicata prima di essere aperto |

Nella versione **web e ChromeOS** il controllo non esiste: gli aggiornamenti li gestisce il
browser o il sistema che ospita l'app.

## Immagini e asset

Le 60 illustrazioni (40 frasi + 20 parole) sono **disegni vettoriali originali inclusi nel
pacchetto dell'app** (`illustrations/`). Vengono caricate dal disco del
dispositivo: nessuna immagine è richiesta a un server, a un CDN o a un servizio
di intelligenza artificiale, e nessun dato dell'utente viene inviato altrove per
generarle.

## Quali dati vengono trattati

L'app salva **solo sul dispositivo** due categorie di informazioni:

| Dato | Dove | Perché | Chi può vederlo |
|---|---|---|---|
| Progressi di gioco (livelli completati, stelle, errori, tempi, trofei) | `localStorage` del browser o cartella dati dell'app | Mostrare avanzamento, statistiche e trofei | Solo chi usa quel dispositivo |
| Impostazioni (dimensione testo, velocità voce, tema, suoni, maiuscolo, lettura parole, esercizio scelto) | `localStorage` del browser o cartella dati dell'app | Ricordare le preferenze di accessibilità | Solo chi usa quel dispositivo |

Non vengono salvati nomi, età, email, indirizzi, foto, testi digitati liberamente né
identificatori del dispositivo. Non esiste alcun campo che raccolga dati del bambino.

## Cosa NON viene fatto

- Nessun invio di dati a server propri o di terzi. L'unica richiesta in uscita è il file
  `aggiornamento.json` per il controllo delle nuove versioni (vedi [Controllo aggiornamenti](#controllo-aggiornamenti)):
  non trasporta alcun dato dell'utente e si può disattivare.
- Nessun servizio di analytics (Google Analytics, Firebase, Sentry, ecc.).
- Nessuna pubblicità, nessun SDK pubblicitario, nessun profilo pubblicitario.
- Nessun cookie di tracciamento (l'app non usa cookie).
- Nessuna geolocalizzazione, nessun accesso a microfono o camera.
- Nessuna sincronizzazione cloud e nessun backup remoto.

## Voce e audio

La lettura ad alta voce usa **file audio preregistrati**, inclusi nel pacchetto
dell'applicazione: 182 sillabe e lettere, 40 frasi, 163 parole e le battute dell'interfaccia
(393 clip in tutto).
Sono file statici, letti da disco o dal service worker: nessun testo viene inviato a
un motore di sintesi e nessun dato esce dal dispositivo.

Se un file audio non è disponibile, l'app ripiega sulla **Web Speech API** del sistema
operativo con voce italiana (`it-IT`). In quel caso il testo viene passato al motore di
sintesi locale del dispositivo; se il sistema operativo è configurato con una voce cloud
(per esempio su alcune distribuzioni ChromeOS o Android), la sintesi può avvenire tramite
il servizio del fornitore del sistema operativo. Questa scelta dipende esclusivamente
dalle impostazioni del dispositivo e non dall'applicazione. L'app non invia il testo a
server propri.

I file audio sono generati in fase di sviluppo con una voce neurale italiana e non
contengono dati dell'utente.

## Minori

L'applicazione è progettata per l'uso da parte di bambini, anche in contesti scolastici e
sanitari. Poiché non raccoglie alcun dato, non tratta dati personali di minori e non
richiede il consenso dei genitori ai sensi del GDPR (Reg. UE 2016/679) per il trattamento
di dati personali: non vi è trattamento.

## Dati salvati localmente: come cancellarli

- **Web / PWA:** impostazioni del browser → dati dei siti → elimina i dati del sito.
- **App desktop:** menu *Aiuto → Apri la cartella dei dati*, poi elimina la cartella.
- **In-app:** schermata *Trofei* → **Azzera i progressi** (cancella livelli, stelle e trofei).

## Permessi richiesti

| Piattaforma | Permessi | Motivo |
|---|---|---|
| Web / PWA | Nessuno (solo storage locale) | Salvare i progressi |
| Estensione ChromeOS | `storage` | Salvare i progressi |
| App desktop | Nessun permesso di rete | Riproduzione dei clip audio inclusi nel pacchetto |

## Sicurezza

L'app desktop usa un contesto isolato (`contextIsolation`), sandbox del renderer,
`nodeIntegration` disattivato, blocco della navigazione verso siti esterni e una
Content Security Policy restrittiva. Non esegue codice remoto.

## Modifiche

Eventuali modifiche a questa informativa saranno pubblicate in questo file e riportate
nel `CHANGELOG.md`. Poiché l'app non raccoglie dati, non sono previste modifiche
sostanziali al trattamento.

## Contatti

Per domande sulla privacy: aprire una issue sul repository GitHub del progetto
(`MaestroLivio/sillabe-in-gioco`).

---

*Sillabe in Gioco è distribuita con licenza CC BY 4.0. È uno strumento didattico di supporto:
non sostituisce la valutazione di un logopedista, di un neuropsichiatra infantile o di un
insegnante specializzato.*
