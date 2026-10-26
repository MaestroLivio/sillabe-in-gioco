"use strict";
/**
 * Prova d'integrazione del controllo aggiornamenti dentro Electron.
 *
 * Non usa la rete: sostituisce il modulo "net" di Electron con un finto
 * server che risponde al manifest e al pacchetto. Serve a verificare i rami
 * che con la rete vera non si possono provocare a comando:
 *
 *   1. versione uguale      → nessuna proposta
 *   2. versione più recente → proposta, e "Più tardi" non scarica
 *   3. "Salta questa versione" → la volta dopo non ripropone
 *   4. hash sbagliato       → il download viene rifiutato e non si apre nulla
 *   5. manifest malformato  → nessun crash, esito "bad-manifest"
 *   6. offline (HTTP 500)   → nessun crash, esito "offline"
 *
 * Le finestre di dialogo sono finte: rispondono da sole e registrano cosa
 * sarebbe stato mostrato. Così la prova gira senza intervento umano.
 *
 * Uso: electron scripts/test-updater-integration.js
 */
const { app, net } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");
const Module = require("module");

/* ---------- ambiente finto ---------- */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "upd-int-"));
const PAYLOAD = Buffer.from("contenuto finto del pacchetto di aggiornamento");

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✔ ${label}`);
  } else {
    failures++;
    console.log(`  ✘ ${label}\n      atteso:   ${JSON.stringify(expected)}\n      ottenuto: ${JSON.stringify(actual)}`);
  }
}

/* stato del finto server, riscritto prima di ogni caso */
const server = {
  manifest: null,
  payload: PAYLOAD,
  payloadHash: crypto.createHash("sha256").update(PAYLOAD).digest("hex"),
  failManifest: false,
  requested: []
};

/* risposte dei dialoghi: una coda, consumata in ordine */
const dialogState = { queue: [], shown: [] };

/* Registriamo i nostri finti moduli prima che updater.js li richieda. */
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "electron") {
    return {
      app: {
        getVersion: () => process.env.FAKE_VERSION || "2.2.5",
        getName: () => "Sillabe in Gioco",
        getPath: name => (name === "userData" ? path.join(TMP, "userData") : TMP)
      },
      dialog: {
        showMessageBox: async (win, opts) => {
          dialogState.shown.push({ message: opts.message, detail: opts.detail, buttons: opts.buttons });
          const next = dialogState.queue.shift();
          return { response: typeof next === "number" ? next : 0 };
        },
        showErrorBox: (title, content) => {
          dialogState.shown.push({ message: title, detail: content, error: true });
        }
      },
      shell: {
        openPath: async p => { server.requested.push({ openPath: p }); return ""; },
        openExternal: url => { server.requested.push({ openExternal: url }); },
        showItemInFolder: p => { server.requested.push({ showItemInFolder: p }); }
      },
      BrowserWindow: class {
        constructor(opts) { this.opts = opts; this.destroyed = false; }
        static getAllWindows() { return []; }
        loadFile() {}
        once() {}
        show() {}
        setMenuBarVisibility() {}
        isDestroyed() { return this.destroyed; }
        destroy() { this.destroyed = true; }
        get webContents() { return { executeJavaScript: async () => {} }; }
        setProgressBar() {}
      },
      ipcMain: { handle() {}, once() {}, removeListener() {} },
      net: {
        request: opts => makeRequest(opts)
      }
    };
  }
  return originalLoad.apply(this, arguments);
};

/* ---------- finto net.request ---------- */
function makeRequest(opts) {
  const { EventEmitter } = require("events");
  const req = new EventEmitter();
  req.setHeader = () => {};
  req.abort = () => { req.emit("abort"); };
  req.followRedirect = () => {};
  let ended = false;
  req.end = () => {
    if (ended) return;
    ended = true;
    setImmediate(() => {
      const url = opts.url;

      if (/aggiornamento\.json$/.test(url)) {
        if (server.failManifest) {
          respondWith(500, Buffer.from("errore"));
          return;
        }
        if (!server.manifest) {
          respondWith(404, Buffer.from("non trovato"));
          return;
        }
        const body = Buffer.from(JSON.stringify(server.manifest));
        respondWith(200, body, body.length);
        return;
      }

      if (/\/releases\/latest\/download\/.+/.test(url)) {
        respondWith(200, server.payload, server.payload.length);
        return;
      }

      respondWith(404, Buffer.from("non trovato"));
    });
  };

  function respondWith(statusCode, body, contentLength) {
    if (req.__aborted) return;
    const res = new EventEmitter();
    res.statusCode = statusCode;
    res.headers = { "content-length": String(contentLength === undefined ? body.length : contentLength) };
    req.emit("response", res);
    setImmediate(() => {
      if (req.__aborted) return;
      res.emit("data", body);
      res.emit("end");
    });
  }

  const originalAbort = req.abort;
  req.abort = () => { req.__aborted = true; originalAbort(); };

  return req;
}

/* ---------- i casi ---------- */
function manifestFor(version, hash, file) {
  return {
    version,
    data: new Date().toISOString(),
    pacchetti: {
      "darwin-arm64": { file, sha256: hash, byte: PAYLOAD.length },
      "darwin-x64": { file, sha256: hash, byte: PAYLOAD.length },
      "win32-x64": { file, sha256: hash, byte: PAYLOAD.length },
      "linux-x64": { file, sha256: hash, byte: PAYLOAD.length }
    }
  };
}

function reset(prefs = {}) {
  dialogState.queue = [];
  dialogState.shown = [];
  server.requested = [];
  server.failManifest = false;
  const p = Object.assign({ checkOnStartup: true, skippedVersion: null, lastCheck: null }, prefs);
  fs.mkdirSync(path.join(TMP, "userData"), { recursive: true });
  fs.writeFileSync(path.join(TMP, "userData", "updater.json"), JSON.stringify(p));
}

app.whenReady().then(async () => {
  const updater = require(path.join(__dirname, "..", "desktop", "updater.js"));

  try {
    /* 1. versione uguale */
    console.log("\n— 1. versione uguale alla mia —");
    reset();
    server.manifest = manifestFor("2.2.5", server.payloadHash, "SillabeInGioco-2.2.5.dmg");
    let r = await updater.checkForUpdates(null, { manual: true });
    check("esito up-to-date", r.status, "up-to-date");
    check("un solo messaggio, nessun download", dialogState.shown.length, 1);
    check("il messaggio dice che è l'ultima", /ultima versione/.test(dialogState.shown[0].message), true);

    /* 2. versione più recente: l'utente dice "Più tardi" (pulsante 1) */
    console.log("\n— 2. c'è una versione nuova, l'utente rimanda —");
    reset();
    server.manifest = manifestFor("2.2.6", server.payloadHash, "SillabeInGioco-2.2.6.dmg");
    dialogState.queue = [1];
    r = await updater.checkForUpdates(null, {});
    check("esito postponed", r.status, "postponed");
    check("nessun download avviato", server.requested.length, 0);
    check("il dialogo propone di scaricare", /Scarica e installa/.test(dialogState.shown[0].buttons.join("|")), true);
    check("il dialogo mostra il peso", /MB/.test(dialogState.shown[0].detail), true);

    /* 3. "Salta questa versione" (pulsante 2): non deve riproporre */
    console.log("\n— 3. l'utente salta la versione —");
    reset();
    server.manifest = manifestFor("2.2.6", server.payloadHash, "SillabeInGioco-2.2.6.dmg");
    dialogState.queue = [2];
    r = await updater.checkForUpdates(null, {});
    check("esito skipped", r.status, "skipped");
    check("versione salvata fra le preferenze", updater.readPrefs().skippedVersion, "2.2.6");

    dialogState.queue = [];
    dialogState.shown = [];
    r = await updater.checkForUpdates(null, {});
    check("alla riapertura non ripropone", r.status, "skipped");
    check("nessun dialogo mostrato", dialogState.shown.length, 0);

    /* 4. hash sbagliato: non deve aprire nulla */
    console.log("\n— 4. il file scaricato non corrisponde all'hash —");
    reset();
    server.manifest = manifestFor("2.2.6", "b".repeat(64), "SillabeInGioco-2.2.6.dmg");
    dialogState.queue = [0];
    r = await updater.checkForUpdates(null, {});
    check("esito checksum-mismatch", r.status, "checksum-mismatch");
    const openCalls = server.requested.filter(x => x.openPath);
    check("l'installer NON è stato aperto", openCalls.length, 0);
    check("è stato mostrato un errore", dialogState.shown.some(d => d.error), true);

    /* 5. manifest malformato */
    console.log("\n— 5. manifest senza hash —");
    reset();
    server.manifest = { version: "2.2.6", pacchetti: { "darwin-arm64": { file: "x.dmg", sha256: "non-un-hash" } } };
    r = await updater.checkForUpdates(null, {});
    check("esito bad-manifest", r.status, "bad-manifest");
    check("nessun download", server.requested.filter(x => x.openPath).length, 0);

    /* 6. rete che risponde 500 */
    console.log("\n— 6. il server risponde con errore —");
    reset();
    server.failManifest = true;
    r = await updater.checkForUpdates(null, {});
    check("esito offline", r.status, "offline");
    check("all'avvio automatico nessun dialogo", dialogState.shown.length, 0);

    /* 7. controllo disattivato dall'utente */
    console.log("\n— 7. controllo disattivato nelle impostazioni —");
    reset({ checkOnStartup: false });
    server.manifest = manifestFor("2.2.6", server.payloadHash, "SillabeInGioco-2.2.6.dmg");
    r = await updater.checkForUpdates(null, {});
    check("esito disabled", r.status, "disabled");
    check("nessuna richiesta di rete", server.requested.length, 0);

    /* 8. percorso felice: scarica, verifica l'hash e apre il pacchetto */
    console.log("\n— 8. percorso completo fino all'apertura del pacchetto —");
    reset();
    server.manifest = manifestFor("2.2.6", server.payloadHash, "SillabeInGioco-2.2.6.dmg");
    dialogState.queue = [0];
    r = await updater.checkForUpdates(null, {});
    check("esito installing", r.status, "installing");
    const opened = server.requested.filter(x => x.openPath);
    check("il pacchetto è stato aperto", opened.length, 1);
    check("il file ha il nome giusto", /SillabeInGioco-2\.2\.6\.dmg$/.test(opened[0].openPath), true);
    check("il messaggio finale conferma la verifica",
      dialogState.shown.map(d => `${d.message} :: ${d.detail || ""}`).join("\n").includes("verificato"), true);
    if (failures) console.log("    messaggi mostrati: " + JSON.stringify(dialogState.shown.map(d => d.message)));
  } catch (err) {
    failures++;
    console.log("\n✘ eccezione non gestita: " + err.stack + "\n");
  }

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) {}

  if (failures) {
    console.log(`\n✘ ${failures} controlli falliti\n`);
    app.exit(1);
  } else {
    console.log("\n✔ Tutti i casi dell'aggiornamento superati\n");
    app.exit(0);
  }
});
