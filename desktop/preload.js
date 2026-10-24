"use strict";
/**
 * Preload — espone al renderer solo API controllate (contextBridge).
 * Nessun accesso diretto a Node o al filesystem dal codice dell'app.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  isDesktop: true,
  platform: () => ipcRenderer.invoke("app:platform"),
  version: () => ipcRenderer.invoke("app:version"),
  close: () => ipcRenderer.send("app:close"),
  print: () => ipcRenderer.invoke("app:print"),
  openDataFolder: () => ipcRenderer.invoke("app:openDataFolder"),
  exportProgress: data => ipcRenderer.invoke("app:exportProgress", data)
});
