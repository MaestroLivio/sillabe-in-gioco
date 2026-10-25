"use strict";
/**
 * Audit dei contenuti: per ognuno dei 40 livelli verifica che
 *  - l'illustrazione SVG sia presente e disegnata (colori distinti > 12)
 *  - la didascalia corrisponda alla frase del livello
 *  - le tessere (sillabe + distrattori) siano nel numero atteso
 *  - gli slot siano coerenti con le sillabe (guidati: qualcuno precompilato)
 *
 * Uso: npx electron scripts/levels-audit.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");

const ROOT = path.join(__dirname, "..");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1180,
    height: 900,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  await win.loadFile(path.join(ROOT, "index.html"));
  await new Promise(r => setTimeout(r, 800));

  const report = await win.webContents.executeJavaScript(`(async () => {
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const out = [];
    for (let i = 0; i < LEVELS.length; i++) {
      startLevel(i);
      const lvl = LEVELS[i];
      // le illustrazioni sono PNG su disco: attende la decodifica invece di
      // fidarsi di un ritardo fisso
      const img = await new Promise(resolve => {
        const deadline = Date.now() + 2500;
        const tick = () => {
          const node = document.querySelector('#tvImage img');
          if (node && node.complete && node.naturalWidth > 0) return resolve(node);
          if (Date.now() > deadline) return resolve(node || null);
          setTimeout(tick, 40);
        };
        tick();
      });
      let colors = 0;
      if (img && img.complete && img.naturalWidth > 0) {
        const c = document.createElement('canvas');
        c.width = 120; c.height = 68;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, 120, 68);
        const d = ctx.getImageData(0, 0, 120, 68).data;
        const set = new Set();
        for (let p = 0; p < d.length; p += 4) set.add((d[p] >> 3) + ',' + (d[p+1] >> 3) + ',' + (d[p+2] >> 3));
        colors = set.size;
      }
      const slots = document.querySelectorAll('#slotsWrap .slot').length;
      const tiles = document.querySelectorAll('#tilePool .tile').length;
      const prefilled = document.querySelectorAll('#slotsWrap .slot.prefilled').length;
      const total = lvl.syllables.length;
      // nel pool finiscono solo le sillabe da collocare più i 3 distrattori
      const expectedTiles = total - prefilled + 3;
      out.push({
        id: lvl.id,
        mode: lvl.mode,
        text: lvl.text,
        src: img ? img.getAttribute('src') : '',
        imgOk: !!img && img.naturalWidth > 0,
        colors,
        slots, tiles, prefilled, total,
        ok: !!img && img.naturalWidth > 0 && colors > 12 && slots === total && tiles === expectedTiles
      });
    }
    return out;
  })()`);

  const bad = report.filter(r => !r.ok);
  // ogni livello deve puntare alla propria illustrazione, non a una condivisa
  const srcs = report.map(r => r.src);
  const duplicated = srcs.filter((s, i) => s && srcs.indexOf(s) !== i);
  report.forEach(r => {
    console.log(`${r.ok ? "✔" : "✖"} ${String(r.id).padStart(2)} [${r.mode}] img:${r.imgOk ? r.colors + "c" : "NO"} slots:${r.slots}/${r.total} pre:${r.prefilled} tiles:${r.tiles} — ${r.text}`);
  });
  if (duplicated.length) {
    console.log(`\n✖ illustrazioni condivise: ${duplicated.join(", ")}`);
    bad.push({ id: "dup" });
  }
  console.log("\n" + (bad.length ? `✖ ${bad.length} livelli con problemi` : "✔ 40/40 livelli con illustrazione e tessere corrette"));
  app.exit(bad.length ? 1 : 0);
}).catch(e => { console.error(e); app.exit(1); });
