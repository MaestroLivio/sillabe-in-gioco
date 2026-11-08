"use strict";
/**
 * Controllo aggiornamenti — processo principale Electron.
 *
 * Come funziona:
 *   1. all'avvio (o dal menu Aiuto) si chiede a GitHub il manifest
 *      "aggiornamento.json" allegato all'ultima release;
 *   2. se la versione nel manifest è più recente di quella in uso, si chiede
 *      all'utente se vuole scaricarla;
 *   3. si scarica il pacchetto adatto al sistema, si verifica lo SHA-256
 *      dichiarato nel manifest e si apre l'installer.
 *
 * Perché un manifest e non l'API di GitHub: l'API REST consente 60 richieste
 * l'ora per indirizzo IP. In una scuola tutte le macchine escono dallo stesso
 * router, quindi il controllo smetterebbe di funzionare proprio dove serve.
 * L'indirizzo /releases/latest/download/<file> invece è stabile, non ha limiti
 * e non richiede autenticazione.
 *
 * Regole di sicurezza:
 *   - solo HTTPS e solo host della lista bianca, ricontrollati a ogni redirect;
 *   - il file scaricato viene verificato con l'hash del manifest: se non
 *     combacia non si apre nulla;
 *   - nessun download parte senza un click esplicito dell'utente.
 *
 * L'app resta utilizzabile senza rete: se il controllo fallisce (offline, DNS,
 * proxy scolastico) si resta in silenzio e non succede nulla.
 */
const { app, dialog, shell, net } = require("electron");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const REPO = "MaestroLivio/sillabe-in-gioco";
const MANIFEST_URL = `https://github.com/${REPO}/releases/latest/download/aggiornamento.json`;
const DOWNLOAD_BASE = `https://github.com/${REPO}/releases/latest/download`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;

/* Solo questi host: la pagina di download e i server degli allegati.
   Gli allegati vengono serviti da release-assets.githubusercontent.com. */
const ALLOWED_HOSTS = new Set([
  "github.com",
  "objects.githubusercontent.com",
  "release-assets.githubusercontent.com"
]);

const PREFS_FILE = () => path.join(app.getPath("userData"), "updater.json");
const DEFAULT_PREFS = { checkOnStartup: true, skippedVersion: null, lastCheck: null };

/* ---------- preferenze (restano nella cartella dati dell'app) ---------- */
function readPrefs() {
  try {
    const raw = fs.readFileSync(PREFS_FILE(), "utf8");
    return Object.assign({}, DEFAULT_PREFS, JSON.parse(raw));
  } catch (e) {
    return Object.assign({}, DEFAULT_PREFS);
  }
}
function writePrefs(patch) {
  const next = Object.assign(readPrefs(), patch);
  try {
    fs.mkdirSync(path.dirname(PREFS_FILE()), { recursive: true });
    fs.writeFileSync(PREFS_FILE(), JSON.stringify(next, null, 2), "utf8");
  } catch (e) { /* cartella non scrivibile: si riprova al prossimo avvio */ }
  return next;
}

/* ---------- confronto versioni ---------- */
/* Accetta "2.2.5", "v2.2.5", "2.3.0-beta.1". Il suffisso di pre-release conta
   come più vecchio della stessa versione stabile, come vuole il semver. */
function parseVersion(v) {
  const clean = String(v || "").trim().replace(/^v/i, "");
  const [core, pre] = clean.split("-");
  const nums = core.split(".").map(n => parseInt(n, 10));
  return {
    nums: [nums[0] || 0, nums[1] || 0, nums[2] || 0],
    pre: pre || ""
  };
}
function compareVersions(a, b) {
  const va = parseVersion(a);
  const vb = parseVersion(b);
  for (let i = 0; i < 3; i++) {
    if (va.nums[i] !== vb.nums[i]) return va.nums[i] > vb.nums[i] ? 1 : -1;
  }
  if (va.pre && !vb.pre) return -1;
  if (!va.pre && vb.pre) return 1;
  return va.pre === vb.pre ? 0 : (va.pre > vb.pre ? 1 : -1);
}

/* ---------- rete ---------- */
function assertAllowed(url) {
  let u;
  try { u = new URL(url); } catch (e) { throw new Error("indirizzo non valido"); }
  if (u.protocol !== "https:") throw new Error("connessione non cifrata");
  if (!ALLOWED_HOSTS.has(u.hostname)) throw new Error("host non consentito: " + u.hostname);
  return u;
}

/* Ogni singolo salto di redirect viene ricontrollato: senza questo, un host
   consentito potrebbe rimandare a uno qualsiasi e la lista bianca non
   servirebbe a niente. */
function followSafely(req) {
  req.on("redirect", (statusCode, method, redirectUrl) => {
    try {
      assertAllowed(redirectUrl);
      req.followRedirect();
    } catch (e) {
      req.abort();
    }
  });
}

function fetchText(url, { accept = "application/json", timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = assertAllowed(url); } catch (e) { reject(e); return; }

    const req = net.request({ url: u.toString(), redirect: "manual" });
    followSafely(req);
    req.setHeader("User-Agent", `SillabeInGioco/${app.getVersion()}`);
    req.setHeader("Accept", accept);

    let settled = false;
    const done = (err, value) => {
      if (settled) return;
      settled = true;
      if (err) reject(err); else resolve(value);
    };

    /* Se la rete è lenta o il proxy non risponde, non si resta appesi:
       il controllo è un extra, non deve bloccare l'avvio. */
    const timer = setTimeout(() => {
      try { req.abort(); } catch (e) {}
      done(new Error("tempo scaduto"));
    }, timeoutMs);

    let body = "";
    req.on("response", res => {
      res.on("data", chunk => { body += chunk.toString(); });
      res.on("end", () => {
        clearTimeout(timer);
        if (res.statusCode !== 200) {
          done(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        done(null, body);
      });
      res.on("error", err => { clearTimeout(timer); done(err); });
    });
    req.on("error", err => { clearTimeout(timer); done(err); });
    req.on("abort", () => { clearTimeout(timer); done(new Error("richiesta annullata")); });
    req.end();
  });
}

/* Scarica in streaming, calcolando l'hash mentre scrive: così non si legge
   due volte un file da cento megabyte.
   La contropressione è rispettata: se il disco è più lento della rete si mette
   in pausa la risposta invece di accumulare tutto in memoria. */
function downloadTo(url, destPath, onProgress, getRequest) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = assertAllowed(url); } catch (e) { reject(e); return; }

    const req = net.request({ url: u.toString(), redirect: "manual" });
    followSafely(req);
    req.setHeader("User-Agent", `SillabeInGioco/${app.getVersion()}`);
    if (typeof getRequest === "function") getRequest(req);

    let settled = false;
    const fail = err => { if (!settled) { settled = true; reject(err); } };

    req.on("response", res => {
      if (res.statusCode !== 200) {
        res.on("data", () => {});
        fail(new Error(`HTTP ${res.statusCode} durante il download`));
        return;
      }
      const total = Number(res.headers["content-length"]) || 0;
      const hash = crypto.createHash("sha256");
      const out = fs.createWriteStream(destPath);
      let received = 0;

      out.on("error", err => { try { req.abort(); } catch (e) {} fail(err); });

      res.on("data", chunk => {
        received += chunk.length;
        hash.update(chunk);
        if (!out.write(chunk)) {
          res.pause();
          out.once("drain", () => res.resume());
        }
        if (typeof onProgress === "function") onProgress(received, total);
      });
      res.on("end", () => {
        if (settled) return;
        out.end(() => { settled = true; resolve({ sha256: hash.digest("hex"), bytes: received }); });
      });
      res.on("error", err => { out.destroy(); fail(err); });
    });
    req.on("error", fail);
    req.on("abort", () => fail(new Error("annullato")));
    req.end();
  });
}

/* ---------- manifest ---------- */
/* Forma attesa (prodotta da scripts/make-update-manifest.js):
   {
     "version": "2.2.6",
     "data": "2026-10-26T10:00:00Z",
     "pacchetti": {
       "darwin-arm64": { "file": "…dmg", "sha256": "…", "byte": 110820130 },
       "darwin-x64":   { … },
       "win32-x64":    { … },
       "linux-x64":    { … }
     }
   }
   Il campo si chiama "pacchetti" per restare coerente con il resto del
   progetto, che è interamente in italiano. */
function platformKey(platform = process.platform, arch = process.arch) {
  if (platform === "darwin") return arch === "arm64" ? "darwin-arm64" : "darwin-x64";
  if (platform === "win32") return "win32-x64";
  if (platform === "linux") return "linux-x64";
  return null;
}

function validateManifest(m) {
  if (!m || typeof m !== "object") return "manifest vuoto";
  if (!m.version || typeof m.version !== "string") return "manca la versione";
  if (!m.pacchetti || typeof m.pacchetti !== "object") return "mancano i pacchetti";
  for (const [key, entry] of Object.entries(m.pacchetti)) {
    if (!entry || typeof entry.file !== "string") return `pacchetto ${key} senza nome file`;
    if (typeof entry.sha256 !== "string" || !/^[0-9a-f]{64}$/i.test(entry.sha256)) {
      return `pacchetto ${key} senza hash valido`;
    }
    /* il nome file non deve poter uscire dalla cartella né puntare altrove */
    if (entry.file.includes("/") || entry.file.includes("\\") || entry.file.includes("..")) {
      return `pacchetto ${key} con nome file sospetto`;
    }
  }
  return null;
}

/* ---------- finestra di avanzamento ---------- */
function openProgressWindow(parent) {
  const { BrowserWindow } = require("electron");
  const win = new BrowserWindow({
    width: 460,
    height: 210,
    /* NON modale: l'app resta usabile durante il download, come dice il testo
       nella finestra. Se fosse modale bloccherebbe tutto. */
    parent: undefined,
    modal: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    title: "Aggiornamento",
    backgroundColor: "#eaf5ff",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "update-progress-preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile(path.join(__dirname, "update-progress.html"));
  win.once("ready-to-show", () => win.show());
  return win;
}

function setProgress(win, percent, label, cancelable) {
  if (!win || win.isDestroyed()) return;
  const payload = JSON.stringify({
    percent: Math.max(0, Math.min(100, Math.round(percent))),
    label: label || "",
    cancelable: !!cancelable
  });
  win.webContents.executeJavaScript(`window.setProgress(${payload})`).catch(() => {});
}

/* ---------- controllo principale ---------- */
let busy = false;

async function checkForUpdates(parentWindow, { manual = false } = {}) {
  if (busy) return { status: "busy" };
  const prefs = readPrefs();
  if (!manual && !prefs.checkOnStartup) return { status: "disabled" };

  busy = true;
  try {
    const current = app.getVersion();
    let manifest;
    try {
      const raw = await fetchText(MANIFEST_URL);
      manifest = JSON.parse(raw);
    } catch (err) {
      // offline, proxy che blocca, manifest assente: non è un errore da mostrare
      writePrefs({ lastCheck: new Date().toISOString() });
      if (manual) await showNetworkProblem(parentWindow, err);
      return { status: "offline", error: err.message };
    }

    writePrefs({ lastCheck: new Date().toISOString() });

    const invalid = validateManifest(manifest);
    if (invalid) {
      if (manual) await showNetworkProblem(parentWindow, new Error("manifest non valido: " + invalid));
      return { status: "bad-manifest", error: invalid };
    }

    const latest = String(manifest.version).replace(/^v/i, "");

    if (compareVersions(latest, current) <= 0) {
      if (manual) {
        await dialog.showMessageBox(parentWindow, {
          type: "info",
          title: "Aggiornamenti",
          message: "Hai già l'ultima versione.",
          detail: `${appName()} ${current} è la versione più recente pubblicata.`,
          buttons: ["Chiudi"],
          noLink: true
        });
      }
      return { status: "up-to-date", current, latest };
    }

    /* versione già saltata dall'utente: non si insiste */
    if (!manual && prefs.skippedVersion === latest) {
      return { status: "skipped", current, latest };
    }

    const key = platformKey();
    const entry = key ? manifest.pacchetti[key] : null;
    const mb = entry && entry.byte ? Math.round(entry.byte / 1024 / 1024) : 0;

    const detail = entry
      ? `Versione installata: ${current}\nNuova versione: ${latest}\n\n` +
        `Il pacchetto per questo computer (${describePlatform()}) pesa circa ${mb} MB.\n` +
        "Viene scaricato e verificato prima di essere aperto. L'app resta utilizzabile " +
        "durante il download."
      : `Versione installata: ${current}\nNuova versione: ${latest}\n\n` +
        `Per questo sistema (${describePlatform()}) non c'è un pacchetto automatico: ` +
        "puoi scaricarlo dalla pagina delle release.";

    const buttons = entry
      ? ["Scarica e installa", "Più tardi", "Salta questa versione"]
      : ["Apri le release", "Più tardi", "Salta questa versione"];

    const answer = await dialog.showMessageBox(parentWindow, {
      type: "info",
      title: "Aggiornamento disponibile",
      message: `È disponibile ${appName()} ${latest}.`,
      detail,
      buttons,
      defaultId: 0,
      cancelId: 1,
      noLink: true
    });

    if (answer.response === 1) return { status: "postponed", current, latest };
    if (answer.response === 2) {
      writePrefs({ skippedVersion: latest });
      return { status: "skipped", current, latest };
    }
    if (!entry) {
      shell.openExternal(RELEASES_PAGE);
      return { status: "manual", current, latest };
    }

    return await downloadAndInstall(parentWindow, entry, latest);
  } finally {
    busy = false;
  }
}

async function showNetworkProblem(parentWindow, err) {
  const answer = await dialog.showMessageBox(parentWindow, {
    type: "warning",
    title: "Controllo non riuscito",
    message: "Non è stato possibile controllare gli aggiornamenti.",
    detail:
      "Puoi comunque aprire la pagina delle release e scaricare l'ultima versione a mano.\n\n" +
      "Dettaglio tecnico: " + err.message,
    buttons: ["Apri le release", "Chiudi"],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  });
  if (answer.response === 0) shell.openExternal(RELEASES_PAGE);
}

function appName() {
  return app.getName() === "Electron" ? "Sillabe in Gioco" : app.getName();
}

function describePlatform() {
  if (process.platform === "darwin") {
    return process.arch === "arm64" ? "macOS Apple Silicon" : "macOS Intel";
  }
  if (process.platform === "win32") return "Windows";
  return "Linux";
}

/* ---------- download + avvio dell'installer ---------- */
async function downloadAndInstall(parentWindow, entry, version) {
  const ext = path.extname(entry.file) || ".bin";
  const destDir = path.join(app.getPath("temp"), "sillabe-aggiornamento");
  const destPath = path.join(destDir, `SillabeInGioco-${version}${ext}`);
  const url = `${DOWNLOAD_BASE}/${encodeURIComponent(entry.file)}`;

  try {
    fs.mkdirSync(destDir, { recursive: true });
    fs.rmSync(destPath, { force: true });
  } catch (err) {
    dialog.showErrorBox("Download non riuscito", "Non è possibile scrivere nella cartella temporanea:\n" + err.message);
    return { status: "error", error: err.message };
  }

  const { ipcMain } = require("electron");
  const progressWin = openProgressWindow(parentWindow);
  let cancelled = false;
  let activeRequest = null;
  let lastSent = 0;
  setProgress(progressWin, 0, "Preparazione…", true);

  /* annulla: chiude la richiesta HTTP e butta il file parziale */
  const onCancel = () => { cancelled = true; try { activeRequest && activeRequest.abort(); } catch (e) {} };
  ipcMain.once("update:cancel", onCancel);

  try {
    setProgress(progressWin, 0, "Scarico…", true);

    const result = await downloadTo(
      url,
      destPath,
      (received, total) => {
        if (cancelled) return;
        const now = Date.now();
        if (now - lastSent < 120) return; // non martellare la finestra
        lastSent = now;
        const full = total || entry.byte || 0;
        const percent = full ? (received / full) * 100 : 0;
        const mb = (received / 1024 / 1024).toFixed(1);
        const totMb = (full / 1024 / 1024).toFixed(1);
        setProgress(progressWin, percent, `Scarico… ${mb} di ${totMb} MB`, true);
        if (parentWindow && parentWindow.setProgressBar && full) {
          parentWindow.setProgressBar(Math.min(1, received / full));
        }
      },
      req => { activeRequest = req; }
    );

    if (cancelled) {
      fs.rmSync(destPath, { force: true });
      return { status: "cancelled" };
    }

    /* verifica dell'hash dichiarato nel manifest */
    setProgress(progressWin, 100, "Verifico il file…", false);
    const expected = String(entry.sha256).toLowerCase();
    if (expected !== result.sha256.toLowerCase()) {
      fs.rmSync(destPath, { force: true });
      if (progressWin && !progressWin.isDestroyed()) progressWin.destroy();
      if (parentWindow && parentWindow.setProgressBar) parentWindow.setProgressBar(-1);
      dialog.showErrorBox(
        "File danneggiato",
        "Il file scaricato non corrisponde a quello pubblicato: l'aggiornamento è stato annullato.\n\n" +
        "Atteso:   " + expected + "\n" +
        "Ottenuto: " + result.sha256 + "\n\n" +
        "Riprova più tardi o scarica dalla pagina delle release."
      );
      return { status: "checksum-mismatch" };
    }
    if (entry.byte && result.bytes !== entry.byte) {
      fs.rmSync(destPath, { force: true });
      if (progressWin && !progressWin.isDestroyed()) progressWin.destroy();
      if (parentWindow && parentWindow.setProgressBar) parentWindow.setProgressBar(-1);
      dialog.showErrorBox(
        "File incompleto",
        `Il file scaricato ha ${result.bytes} byte invece di ${entry.byte}: l'aggiornamento è stato annullato.`
      );
      return { status: "size-mismatch" };
    }

    if (progressWin && !progressWin.isDestroyed()) progressWin.destroy();
    if (parentWindow && parentWindow.setProgressBar) parentWindow.setProgressBar(-1);

    return await launchInstaller(parentWindow, destPath, version);
  } catch (err) {
    if (progressWin && !progressWin.isDestroyed()) progressWin.destroy();
    if (parentWindow && parentWindow.setProgressBar) parentWindow.setProgressBar(-1);
    fs.rmSync(destPath, { force: true });
    if (cancelled) return { status: "cancelled" };
    await dialog.showMessageBox(parentWindow, {
      type: "error",
      title: "Download non riuscito",
      message: "Non è stato possibile scaricare l'aggiornamento.",
      detail: err.message + "\n\nPuoi scaricarlo a mano dalla pagina delle release.",
      buttons: ["Apri le release", "Chiudi"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    }).then(r => { if (r.response === 0) shell.openExternal(RELEASES_PAGE); });
    return { status: "error", error: err.message };
  } finally {
    ipcMain.removeListener("update:cancel", onCancel);
  }
}

/* ---------- lancio dell'installer ---------- */
async function launchInstaller(parentWindow, filePath, version) {
  const verifica = "Il file è stato verificato: corrisponde all'impronta SHA-256 pubblicata.";

  if (process.platform === "darwin") {
    /* il DMG si apre nel Finder: l'utente trascina l'app in Applicazioni */
    const err = await shell.openPath(filePath);
    if (err) {
      await showManualFallback(parentWindow, filePath, err);
      return { status: "error", error: err };
    }
    await dialog.showMessageBox(parentWindow, {
      type: "info",
      title: "Aggiornamento pronto",
      message: `Si apre la finestra di installazione della versione ${version}.`,
      detail:
        "Trascina «Sillabe in Gioco» nella cartella Applicazioni, sostituendo la versione " +
        "precedente, poi riapri l'app.\n\n" +
        verifica + "\n\n" +
        "Se macOS chiede conferma al primo avvio, è normale: l'app non ha un certificato " +
        "Apple Developer. Usa «Apri» dal menu contestuale.",
      buttons: ["Ho capito"],
      noLink: true
    });
    return { status: "installing", version };
  }

  if (process.platform === "win32") {
    const err = await shell.openPath(filePath);
    if (err) {
      await showManualFallback(parentWindow, filePath, err);
      return { status: "error", error: err };
    }
    await dialog.showMessageBox(parentWindow, {
      type: "info",
      title: "Aggiornamento pronto",
      message: `Si avvia l'installazione della versione ${version}.`,
      detail: verifica + "\n\nSegui la procedura di installazione, poi riapri l'app.",
      buttons: ["Ho capito"],
      noLink: true
    });
    return { status: "installing", version };
  }

  /* Linux: un AppImage in esecuzione non può sostituire sé stesso in modo
     sicuro, quindi si prepara il file e si spiega cosa fare. */
  try { fs.chmodSync(filePath, 0o755); } catch (e) {}
  shell.showItemInFolder(filePath);
  await dialog.showMessageBox(parentWindow, {
    type: "info",
    title: "Aggiornamento scaricato",
    message: `La versione ${version} è pronta.`,
    detail:
      "Il file è nella cartella che si è appena aperta.\n" +
      "Chiudi l'app, sostituisci il vecchio AppImage con questo e rendilo eseguibile " +
      "(Permessi → Consenti l'esecuzione come programma).\n\n" +
      verifica,
    buttons: ["Ho capito"],
    noLink: true
  });
  return { status: "downloaded", version, path: filePath };
}

async function showManualFallback(parentWindow, filePath, err) {
  shell.showItemInFolder(filePath);
  await dialog.showMessageBox(parentWindow, {
    type: "warning",
    title: "Apertura non riuscita",
    message: "L'aggiornamento è stato scaricato ma non è stato possibile aprirlo.",
    detail: err + "\n\nIl file è nella cartella che si è appena aperta.",
    buttons: ["Chiudi"],
    noLink: true
  });
}

/* ---------- integrazione con il menu e le impostazioni ---------- */
function registerIpc() {
  const { ipcMain, BrowserWindow } = require("electron");
  ipcMain.handle("updater:prefs", () => {
    const p = readPrefs();
    return { checkOnStartup: !!p.checkOnStartup, skippedVersion: p.skippedVersion || null };
  });
  ipcMain.handle("updater:setCheckOnStartup", (_e, value) => {
    writePrefs({ checkOnStartup: !!value, skippedVersion: null });
    return { checkOnStartup: !!value };
  });
  ipcMain.handle("updater:checkNow", async () => {
    /* finestra principale = quella senza genitore (la finestra di avanzamento
       è figlia, quindi non va scelta come riferimento per i dialoghi) */
    const win = BrowserWindow.getAllWindows().find(w => !w.isDestroyed() && !w.getParentWindow()) || null;
    return checkForUpdates(win, { manual: true });
  });
}

module.exports = {
  checkForUpdates,
  registerIpc,
  readPrefs,
  writePrefs,
  compareVersions,
  platformKey,
  validateManifest
};
