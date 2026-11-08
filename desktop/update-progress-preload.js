"use strict";
/**
 * Preload della finestra di avanzamento del download.
 * Espone solo la possibilità di annullare: nient'altro è raggiungibile
 * da questa pagina, che è puramente informativa.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("updateBridge", {
  cancel: () => ipcRenderer.send("update:cancel")
});
