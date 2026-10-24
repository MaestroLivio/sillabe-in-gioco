"use strict";
/**
 * Audit di layout e resa: verifica overflow, sovrapposizioni con la barra inferiore,
 * dimensioni minime dei target touch e presenza di "inchiostro" nelle illustrazioni.
 *
 * Uso: npx electron scripts/layout-audit.js
 */
const { app, BrowserWindow } = require("electron");
const path = require("path");

app.disableHardwareAcceleration();
app.commandLine.appendSwitch("mute-audio");

const ROOT = path.join(__dirname, "..");

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  await win.loadFile(path.join(ROOT, "index.html"));
  await new Promise(r => setTimeout(r, 800));

  const audit = async (label, code) => {
    const r = await win.webContents.executeJavaScript(`(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      ${code}
      await sleep(350);
      // Porta in fondo alla pagina: è lì che la barra fissa potrebbe coprire contenuti.
      // Ripete lo scroll più volte perché dopo un resize il primo tentativo può essere
      // troncato dall'altezza massima calcolata sul layout precedente.
      const toBottom = async () => {
        for (let i = 0; i < 8; i++) {
          document.scrollingElement.scrollTop = 1e6;
          document.body.scrollTop = 1e6;
          window.scrollTo(0, 1e6);
          await sleep(120);
          const d = document.documentElement;
          if (Math.abs(d.scrollHeight - d.clientHeight - d.scrollTop) <= 1) break;
        }
      };
      await toBottom();
      await sleep(200);

      const doc = document.documentElement;
      const overflowX = doc.scrollWidth - doc.clientWidth;
      const bottomBar = document.querySelector('.bottombar');
      const barRect = bottomBar ? bottomBar.getBoundingClientRect() : null;
      const barTop = barRect ? Math.round(barRect.top) : window.innerHeight;
      const app = document.querySelector('.app');
      const paddingBottom = app ? parseFloat(getComputedStyle(app).paddingBottom) : 0;

      // scostamento dal fondo: se positivo, l'ultimo contenuto resta sotto la barra
      const pool = document.querySelector('#tilePool');
      const poolRect = pool && pool.offsetParent ? pool.getBoundingClientRect() : null;
      const lastTile = poolRect ? Math.round(poolRect.bottom) : 0;
      const clearance = poolRect ? Math.round(barTop - poolRect.bottom) : null;

      // elementi cliccabili più piccoli di 40px
      const small = [];
      document.querySelectorAll('button, .slot, .tile, .group-card, .tool').forEach(el => {
        if (!el.offsetParent) return;
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) {
          small.push((el.id || el.className || el.tagName) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
      });

      return {
        overflowX,
        atBottom: doc.scrollHeight - doc.clientHeight - Math.round(doc.scrollTop) <= 1,
        barTop,
        lastTileBottom: lastTile,
        clearance,
        tileCleared: clearance === null ? true : clearance >= -2,
        paddingBottom,
        smallTargets: small.slice(0, 8),
        smallCount: small.length,
        docHeight: doc.scrollHeight,
        viewH: window.innerHeight
      };
    })()`);
    console.log(`\n— ${label} —`);
    console.log(JSON.stringify(r, null, 1));
    // Se lo scroll non arriva in fondo la misura di clearance non è attendibile:
    // è un problema dell'audit, non dell'app, ma va segnalato per non fidarsi del verde.
    if (r.clearance !== null && !r.atBottom) {
      problems.push(`${label}: scroll non arrivato in fondo (misura non attendibile)`);
    }
    return r;
  };

  const problems = [];

  const home = await audit("HOME desktop", `showScreen('home');`);
  if (home.overflowX > 0) problems.push("home: overflow orizzontale");
  if (home.smallCount > 6) problems.push(`home: ${home.smallCount} target sotto 40px`);

  const lvl = await audit("LIVELLO 1 desktop", `startLevel(0);`);
  if (lvl.overflowX > 0) problems.push("livello: overflow orizzontale");
  if (!lvl.tileCleared) problems.push("livello: la barra inferiore copre le tessere");

  const lvl40 = await audit("LIVELLO 40 desktop", `startLevel(39);`);
  if (!lvl40.tileCleared) problems.push("livello 40: la barra inferiore copre le tessere");

  const quiz = await audit("ESERCIZI desktop", `buildQuiz();`);
  if (quiz.overflowX > 0) problems.push("esercizi: overflow orizzontale");

  const troph = await audit("TROFEI desktop", `showScreen('trophies');`);
  if (troph.overflowX > 0) problems.push("trofei: overflow orizzontale");

  /* --- schermo piccolo (tablet 768 e telefono 390) --- */
  win.setSize(768, 1024);
  await new Promise(r => setTimeout(r, 400));
  const tablet = await audit("LIVELLO 21 tablet 768", `startLevel(20);`);
  if (tablet.overflowX > 0) problems.push("tablet: overflow orizzontale");

  win.setSize(390, 844);
  await new Promise(r => setTimeout(r, 400));
  const phone = await audit("LIVELLO 1 telefono 390", `startLevel(0);`);
  if (phone.overflowX > 0) problems.push("telefono: overflow orizzontale");
  if (!phone.tileCleared) problems.push("telefono: la barra inferiore copre le tessere");

  /* --- resa delle illustrazioni: quanti colori distinti nell'area TV --- */
  win.setSize(1180, 860);
  await new Promise(r => setTimeout(r, 300));
  const illustration = await win.webContents.executeJavaScript(`(async () => {
    startLevel(0);
    await new Promise(r => setTimeout(r, 400));
    const img = document.querySelector('#tvImage img');
    const box = img.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = 160; canvas.height = 90;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 160, 90);
    const data = ctx.getImageData(0, 0, 160, 90).data;
    const colors = new Set();
    let nonBg = 0;
    for (let i = 0; i < data.length; i += 4) {
      const key = (data[i] >> 3) + ',' + (data[i+1] >> 3) + ',' + (data[i+2] >> 3);
      colors.add(key);
    }
    return { distinctColors: colors.size, width: Math.round(box.width), height: Math.round(box.height) };
  })()`);
  console.log("\n— ILLUSTRAZIONE —");
  console.log(JSON.stringify(illustration));
  if (illustration.distinctColors < 12) problems.push("illustrazione: pochi colori, possibile mancata resa delle emoji");
  if (illustration.width < 200) problems.push("illustrazione: troppo piccola");

  /* --- testo: nessun testo troncato nei pulsanti principali --- */
  const clipping = await win.webContents.executeJavaScript(`(() => {
    const bad = [];
    document.querySelectorAll('.tool .tl, .btn, .nav-btn, .counter').forEach(el => {
      if (!el.offsetParent) return;
      if (el.scrollWidth > el.clientWidth + 2) bad.push((el.className || el.id) + ': ' + el.textContent.trim().slice(0, 24));
    });
    return bad;
  })()`);
  console.log("\n— TESTO TRONCATO —");
  console.log(clipping.length ? clipping : "nessuno");
  if (clipping.length) problems.push("testo troncato: " + clipping.join(", "));

  console.log("\n" + (problems.length ? "✖ PROBLEMI:\n  " + problems.join("\n  ") : "✔ AUDIT SUPERATO"));
  app.exit(problems.length ? 1 : 0);
}).catch(e => { console.error(e); app.exit(1); });
