"use strict";
/**
 * Processo principale Electron — finestra dell'app "Sillabe in Gioco".
 * Sicurezza: contextIsolation attivo, nessun nodeIntegration nel renderer,
 * navigazione esterna bloccata, permessi concessi solo per la sintesi vocale.
 */
const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");

const APP_TITLE = "Sillabe in Gioco";
const isMac = process.platform === "darwin";
let mainWindow = null;

/* ---------- istanza singola ---------- */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 760,
    minHeight: 620,
    title: APP_TITLE,
    backgroundColor: "#dff1ff",
    show: false,
    autoHideMenuBar: false,
    icon: path.join(__dirname, "..", "icons", isMac ? "icon-512.png" : "icon-256.png"),
    titleBarStyle: isMac ? "hiddenInset" : "default",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged
    }
  });

  mainWindow.loadFile(path.join(__dirname, "..", "index.html"));

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
  });

  /* link esterni aperti nel browser di sistema, mai dentro l'app */
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("file://")) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

/* ---------- permessi: solo sintesi vocale / audio ---------- */
const ALLOWED_PERMISSIONS = new Set(["speechSynthesis", "media", "audioCapture", "clipboard-sanitized-write"]);
app.whenReady().then(() => {
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler((wc, permission, callback) => {
    callback(ALLOWED_PERMISSIONS.has(permission));
  });

  Menu.setApplicationMenu(buildMenu());
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});

/* ---------- menu in italiano ---------- */
function buildMenu() {
  const template = [
    ...(isMac
      ? [{
          label: APP_TITLE,
          submenu: [
            { role: "about", label: `Informazioni su ${APP_TITLE}` },
            { type: "separator" },
            { label: "Impostazioni…", accelerator: "Cmd+,", click: () => mainWindow?.webContents.executeJavaScript("document.getElementById('homeSettingsBtn')?.click()") },
            { type: "separator" },
            { role: "hide", label: "Nascondi" },
            { role: "hideOthers", label: "Nascondi gli altri" },
            { role: "unhide", label: "Mostra tutto" },
            { type: "separator" },
            { role: "quit", label: `Esci da ${APP_TITLE}` }
          ]
        }]
      : []),
    {
      label: "File",
      submenu: [
        { label: "Home", accelerator: "CmdOrCtrl+H", click: () => mainWindow?.webContents.executeJavaScript("document.getElementById('levelHomeBtn')?.click() || document.getElementById('quizHomeBtn')?.click()") },
        { label: "Stampa scheda…", accelerator: "CmdOrCtrl+P", click: printSheet },
        { type: "separator" },
        isMac ? { role: "close", label: "Chiudi finestra" } : { role: "quit", label: "Esci" }
      ]
    },
    {
      label: "Modifica",
      submenu: [
        { role: "undo", label: "Annulla" },
        { role: "redo", label: "Ripeti" },
        { type: "separator" },
        { role: "cut", label: "Taglia" },
        { role: "copy", label: "Copia" },
        { role: "paste", label: "Incolla" },
        { role: "selectAll", label: "Seleziona tutto" }
      ]
    },
    {
      label: "Vista",
      submenu: [
        { role: "resetZoom", label: "Dimensione normale" },
        { role: "zoomIn", label: "Ingrandisci" },
        { role: "zoomOut", label: "Riduci" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Schermo intero" },
        ...(app.isPackaged ? [] : [{ type: "separator" }, { role: "toggleDevTools", label: "Strumenti sviluppatore" }])
      ]
    },
    {
      label: "Aiuto",
      submenu: [
        { label: "Come si gioca", click: () => mainWindow?.webContents.executeJavaScript("document.getElementById('toolHelp')?.click()") },
        { label: "Impostazioni di accessibilità", click: () => mainWindow?.webContents.executeJavaScript("document.getElementById('homeSettingsBtn')?.click()") },
        { type: "separator" },
        { label: "Apri la cartella dei dati", click: () => shell.openPath(app.getPath("userData")) },
        { label: "Informazioni", click: showAbout }
      ]
    }
  ];
  return Menu.buildFromTemplate(template);
}

async function printSheet() {
  if (!mainWindow) return;
  try {
    await mainWindow.webContents.executeJavaScript(
      "(() => { const b=document.getElementById('printBtn')||document.getElementById('toolPrint'); b && b.click(); return true; })()"
    );
    mainWindow.webContents.print({ silent: false, printBackground: true }, (ok, reason) => {
      if (!ok && reason && reason !== "cancelled") dialog.showErrorBox("Stampa non riuscita", String(reason));
    });
  } catch (e) {
    dialog.showErrorBox("Stampa non disponibile", "Non è stato possibile avviare la stampa: " + e.message);
  }
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: `Informazioni su ${APP_TITLE}`,
    message: `${APP_TITLE} ${app.getVersion()}`,
    detail:
      "Laboratorio di letto-scrittura per bambini.\n" +
      "Trascina le sillabe, ascolta la voce italiana, componi le frasi.\n\n" +
      "40 livelli · 4 percorsi · esercizi · schede stampabili · trofei\n\n" +
      "Tecnologie: HTML5, CSS3, JavaScript ES6, Web Speech API.\n" +
      "Licenza MIT — nessun dato lasciato uscire dal dispositivo.",
    buttons: ["Chiudi"],
    noLink: true
  });
}

/* ---------- IPC dal renderer ---------- */
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:platform", () => process.platform);
ipcMain.handle("app:print", () => { printSheet(); return true; });
ipcMain.on("app:close", () => { if (mainWindow) mainWindow.close(); });
ipcMain.handle("app:openDataFolder", () => shell.openPath(app.getPath("userData")));
ipcMain.handle("app:exportProgress", async (_e, payload) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "Salva i progressi",
    defaultPath: path.join(app.getPath("documents"), "sillabe-progressi.json"),
    filters: [{ name: "JSON", extensions: ["json"] }]
  });
  if (canceled || !filePath) return null;
  try {
    fs.writeFileSync(filePath, payload, "utf8");
    return filePath;
  } catch (err) {
    dialog.showErrorBox("Salvataggio non riuscito", err.message);
    return null;
  }
});
