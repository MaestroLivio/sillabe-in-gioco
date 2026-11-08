"use strict";
/**
 * Cattura screenshot delle schermate principali (per README e Chrome Web Store).
 * Uso: npx electron scripts/screenshots.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "build", "screenshots");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");
app.commandLine.appendSwitch("force-device-scale-factor", "2");

app.whenReady().then(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const win = new BrowserWindow({
    width: 1180,
    height: 900,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, offscreen: true }
  });

  await win.loadFile(path.join(ROOT, "index.html"));
  await new Promise(r => setTimeout(r, 900));

  const shot = async (name) => {
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(OUT, name + ".png"), img.toPNG());
    console.log("✔ " + name);
  };

  const run = async code => {
    await win.webContents.executeJavaScript(code);
    await new Promise(r => setTimeout(r, 450));
  };

  // HOME pulita
  await run(`localStorage.removeItem('sillabe.progress.v2'); progress = {levels:{},exercises:{sessions:0,best:0},listens:0,lastLevel:1}; renderHome(); showScreen('home');`);
  await shot("01-home");

  // livello guidato
  await run(`startLevel(0);`);
  await shot("02-livello-guidato");

  // livello guidato con alcune sillabe inserite e suggerimento
  await run(`
    (() => {
      const missing = L.slots.filter(s => !s.filled).slice(0, 2);
      missing.forEach(s => {
        const node = document.querySelector('.slot[data-index="' + s.index + '"]');
        const tile = Array.from(document.querySelectorAll('.tile')).find(t => t.textContent === s.syllable);
        if (tile && node) { L.selectedTile = { tile, data: L.tiles[Number(tile.dataset.tile)] }; onSlotClick(node); }
      });
      giveHint();
    })()
  `);
  await shot("03-livello-suggerimento");

  // livello semplice
  await run(`startLevel(12);`);
  await shot("04-livello-semplice");

  // livello coordinato
  await run(`startLevel(20);`);
  await shot("05-livello-coordinate");

  // livello complesso
  await run(`startLevel(32);`);
  await shot("06-livello-complessa");

  // esercizi
  await run(`buildQuiz();`);
  await shot("07-esercizi");

  // impostazioni
  await run(`showScreen('home'); openSettings();`);
  await shot("08-impostazioni");
  await run(`closeSheet();`);

  // trofei con alcuni progressi
  await run(`
    progress.levels = {1:{stars:3,mistakes:0,seconds:22},2:{stars:3,mistakes:0,seconds:19},3:{stars:2,mistakes:1,seconds:31},
                       4:{stars:3,mistakes:0,seconds:25},5:{stars:3,mistakes:0,seconds:28},6:{stars:2,mistakes:2,seconds:40}};
    progress.exercises = {sessions:5,best:8}; progress.listens = 26;
    saveJSON('sillabe.progress.v2', progress);
    showScreen('trophies');
  `);
  await shot("09-trofei");

  // risultati
  await run(`startLevel(1);`);
  await run(`
    (() => {
      L.slots.filter(s => !s.filled).forEach(s => {
        const node = document.querySelector('.slot[data-index="' + s.index + '"]');
        const tile = Array.from(document.querySelectorAll('.tile')).find(t => t.textContent === s.syllable);
        if (tile && node) { L.selectedTile = { tile, data: L.tiles[Number(tile.dataset.tile)] }; onSlotClick(node); }
      });
    })()
  `);
  await new Promise(r => setTimeout(r, 2200));
  await shot("10-risultati");

  // home con progressi
  await run(`showScreen('home');`);
  await shot("11-home-progressi");

  // mobile
  win.setSize(430, 860);
  await new Promise(r => setTimeout(r, 350));
  await run(`startLevel(23);`);
  await shot("12-mobile-livello");

  console.log("Screenshot in build/screenshots/");
  app.exit(0);
}).catch(e => { console.error(e); app.exit(1); });
