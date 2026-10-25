# Informativa sulla privacy · Sillabe in Gioco

**Ultimo aggiornamento:** 24 ottobre 2026
**Versione applicazione:** 2.0.2
**Titolare:** Livio Luppino

## In sintesi

Sillabe in Gioco **non raccoglie alcun dato personale**. Non ci sono account, server,
analytics, pubblicità o tracciamenti. L'applicazione funziona interamente sul dispositivo
dell'utente e non effettua connessioni di rete verso servizi remoti.

## Immagini e asset

Le 40 illustrazioni delle frasi sono **disegni vettoriali originali inclusi nel
pacchetto dell'app** (`illustrations/`). Vengono caricate dal disco del
dispositivo: nessuna immagine è richiesta a un server, a un CDN o a un servizio
di intelligenza artificiale, e nessun dato dell'utente viene inviato altrove per
generarle.

## Quali dati vengono trattati

L'app salva **solo sul dispositivo** due categorie di informazioni:

| Dato | Dove | Perché | Chi può vederlo |
|---|---|---|---|
| Progressi di gioco (livelli completati, stelle, errori, tempi, trofei) | `localStorage` del browser o cartella dati dell'app | Mostrare avanzamento, statistiche e trofei | Solo chi usa quel dispositivo |
| Impostazioni (dimensione testo, velocità voce, tema, suoni) | `localStorage` del browser o cartella dati dell'app | Ricordare le preferenze di accessibilità | Solo chi usa quel dispositivo |

Non vengono salvati nomi, età, email, indirizzi, foto, testi digitati liberamente né
identificatori del dispositivo. Non esiste alcun campo che raccolga dati del bambino.

## Cosa NON viene fatto

- Nessun invio di dati a server propri o di terzi.
- Nessun servizio di analytics (Google Analytics, Firebase, Sentry, ecc.).
- Nessuna pubblicità, nessun SDK pubblicitario, nessun profilo pubblicitario.
- Nessun cookie di tracciamento (l'app non usa cookie).
- Nessuna geolocalizzazione, nessun accesso a microfono o camera.
- Nessuna sincronizzazione cloud e nessun backup remoto.

## Sintesi vocale

La lettura ad alta voce usa la **Web Speech API** del sistema operativo con voce italiana
(`it-IT`). Il testo viene passato al motore di sintesi locale del dispositivo. Se il sistema
operativo dell'utente è configurato con una voce cloud (per esempio su alcune
distribuzioni ChromeOS o Android), la sintesi può avvenire tramite il servizio del
fornitore del sistema operativo: questa scelta dipende esclusivamente dalle impostazioni
del dispositivo e non dall'applicazione. L'app non invia il testo a server propri.

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
| App desktop | Nessun permesso di rete | Solo sintesi vocale in uscita |

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

*Sillabe in Gioco è distribuita con licenza MIT. È uno strumento didattico di supporto:
non sostituisce la valutazione di un logopedista, di un neuropsichiatra infantile o di un
insegnante specializzato.*
