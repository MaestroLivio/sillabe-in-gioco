"use strict";
/**
 * Service worker dell'estensione ChromeOS / Chrome.
 * Apre l'app in una finestra dedicata (stile app desktop) al click sull'icona
 * e alla prima installazione.
 */
const APP_URL = "index.html";
const WINDOW_W = 1200;
const WINDOW_H = 860;

async function openApp() {
  const url = chrome.runtime.getURL(APP_URL);
  const existing = await chrome.windows.getAll({ populate: true });
  for (const win of existing) {
    for (const tab of win.tabs || []) {
      if (tab.url && tab.url.startsWith(url)) {
        await chrome.windows.update(win.id, { focused: true });
        if (tab.id) await chrome.tabs.update(tab.id, { active: true });
        return;
      }
    }
  }
  await chrome.windows.create({
    url,
    type: "popup",
    width: WINDOW_W,
    height: WINDOW_H,
    focused: true
  });
}

chrome.action.onClicked.addListener(openApp);
chrome.runtime.onInstalled.addListener(details => {
  if (details.reason === "install") openApp();
});
