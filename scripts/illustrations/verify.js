#!/usr/bin/env node
"use strict";
/**
 * Controllo di qualità delle illustrazioni.
 *
 * Non potendo "guardare" i disegni, verifica in modo oggettivo che ogni PNG
 * contenga davvero i colori dei soggetti previsti dalla scena (gatto arancio,
 * cielo notturno, acqua, ecc.). Un soggetto finito fuori dal riquadro o un
 * errore di composizione fanno sparire il colore e il controllo fallisce.
 *
 * Verifica inoltre:
 *  - dimensione 1280×720 e trasparenza assente
 *  - nessuna tessera vuota o monocroma (soglia di colori distinti)
 *  - nessun PNG duplicato (60 scene tutte diverse)
 *
 * Uso: node scripts/illustrations/verify.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const { SCENES } = require("./scenes");

const ROOT = path.join(__dirname, "..", "..");
const DIR = path.join(ROOT, "illustrations");

const pad = n => String(n).padStart(2, "0");

/* Colori "firma" per livello: almeno uno deve comparire nel disegno.
   Servono a dimostrare che il soggetto principale è stato disegnato. */
const SIGNATURE = {
  1: ["#f0a355", "#ee6a5f"],      // gatto arancio + ciotola
  2: ["#e4f1fa", "#f58ba8"],      // acqua/lavandino + grembiule rosa
  3: ["#c98a5a", "#f6efe2"],      // cane marrone + osso
  4: ["#c98a5a", "#ffe9b8"],      // porta + luce del corridoio
  5: ["#f2c98d", "#ee6a5f"],      // torta + pentola
  6: ["#ffd257", "#8fd694"],      // sole + prato
  7: ["#6ec46b", "#63b9e6"],      // rana + lago
  8: ["#f2884b", "#1f6a94"],      // pesce + mare profondo
  9: ["#7fb2e6", "#f0a355"],      // piumone + gatto
  10: ["#f58ba8", "#ffffff"],     // libro + pagine
  11: ["#ee5f5f", "#c98a5a"],     // palla + cane
  12: ["#f58ba8", "#f6bf4a"],     // fiore sul cavalletto
  13: ["#ee5f5f", "#8d949c"],     // macchina rossa + strada
  14: ["#f7e9d3", "#f6bf4a"],     // scuola + palla
  15: ["#3f5a48", "#c39bea"],     // lavagna + vestito
  16: ["#a8b3c0", "#f6d47a"],     // topolino + formaggio
  17: ["#e0574f", "#57bf7a"],     // mele + prato
  18: ["#7cc4ea", "#b9c8d6"],     // gocce + nuvola di pioggia
  19: ["#ee5f5f", "#3a4753"],     // treno + ruote
  20: ["#f58ba8", "#6cc47a"],     // farfalla + prato
  21: ["#f0a355", "#c98a5a"],     // gatto + cane
  22: ["#ee6a5f", "#cf9a63"],     // pentola + tavolo
  23: ["#ee5f5f", "#9fb4c6"],     // ombrello + cielo di pioggia
  24: ["#a8b3c0", "#f0a355"],     // topo + gatto
  25: ["#fff4c9", "#2b3566"],     // luna + cielo notturno
  26: ["#cfe0ee", "#b9c8d6"],     // vento + nuvola
  27: ["#f58ba8", "#f6bf4a"],     // cuori + maglia
  28: ["#e6b06a", "#5aa9e6"],     // pane + ciotola zuppa
  29: ["#5aa9e6", "#c98a5a"],     // palla + cane
  30: ["#3c5a78", "#4fa8d8"],     // scafo nave + mare
  31: ["#5aa9e6", "#9aa9b8"],     // ombrello + cielo
  32: ["#ffd257", "#f58ba8"],     // sole + fiori
  33: ["#3d4a7a", "#6f8fc0"],     // stanza notturna + piumone
  34: ["#d9705f", "#5aa9e6"],     // tetto scuola + scivolo
  35: ["#8fb8d8", "#fbf6ec"],     // poltrona + giornale
  36: ["#5aa9e6", "#f7b6c2"],     // uccellino + fiori di pesco
  37: ["#f2884b", "#7cc0ea"],     // maglia + acqua nel bicchiere
  38: ["#4a90e2", "#cf9a63"],     // cappotto + porta
  39: ["#f7e9d3", "#f6bf4a"],     // scuola + campana
  40: ["#d9705f", "#ee5f5f"],     // tetto scuola + palloncino

  /* --- formazione di parole (41-60): una figura per parola --- */
  41: ["#f6bf4a", "#f58ba8"],     // ape + fiore
  42: ["#e0574f", "#6cc47a"],     // mela + prato
  43: ["#ffd257", "#6cc47a"],     // sole + prato
  44: ["#fff4c9", "#2b3566"],     // luna + cielo notturno
  45: ["#e6b06a", "#cd9053"],     // pagnotta + tavolo
  46: ["#d9705f", "#f3e0ba"],     // tetto + muri della casa
  47: ["#ee5f5f", "#ffffff"],     // punti del dado + faccia
  48: ["#ee5f5f", "#4fa8d8"],     // fasce del faro + mare
  49: ["#f0a355", "#5aa9e6"],     // gatto + palla
  50: ["#c98a5a", "#8fd694"],     // cane + prato
  51: ["#f2884b", "#f3e0ba"],     // pesce + sabbia
  52: ["#6ec46b", "#63b9e6"],     // rana + acqua
  53: ["#a8b3c0", "#f6d47a"],     // topo + formaggio
  54: ["#f58ba8", "#f6bf4a"],     // petali + centro del fiore
  55: ["#ee5f5f", "#f6bf4a"],     // palla rossa e gialla
  56: ["#57bf7a", "#ee5f5f"],     // vagone + caldaia del treno
  57: ["#3c5a78", "#4fa8d8"],     // scafo + mare
  58: ["#f58ba8", "#ffffff"],     // copertina + pagine
  59: ["#ee5f5f", "#9fb4c6"],     // ombrello + cielo di pioggia
  60: ["#f6bf4a", "#a86c33"]      // campana + trave di legno
};

function hexToRgb(h) {
  const v = h.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

(async () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith(".png")).sort();
  const expected = SCENES.length;
  if (files.length !== expected) {
    console.error(`✖ Attesi ${expected} PNG, trovati ${files.length}`);
    process.exit(1);
  }

  const errors = [];
  const hashes = new Map();

  for (const file of files) {
    const id = Number(file.slice(0, 2));
    const full = path.join(DIR, file);
    const buf = fs.readFileSync(full);

    // nessun duplicato
    const h = crypto.createHash("sha1").update(buf).digest("hex");
    if (hashes.has(h)) errors.push(`${file}: identico a ${hashes.get(h)}`);
    else hashes.set(h, file);

    const meta = await sharp(full).metadata();
    if (meta.width !== 1280 || meta.height !== 720) {
      errors.push(`${file}: dimensione ${meta.width}×${meta.height}, attesa 1280×720`);
    }

    // FigCraft esporta RGBA: va bene, purché l'immagine sia completamente
    // opaca (un'illustrazione semitrasparente rovinerebbe la TV del livello).
    if (meta.hasAlpha) {
      const { data: a, info: ai } = await sharp(full).raw().toBuffer({ resolveWithObject: true });
      let translucent = 0;
      for (let i = ai.channels - 1; i < a.length; i += ai.channels) if (a[i] < 250) translucent++;
      if (translucent > 0) errors.push(`${file}: ${translucent} pixel non opachi`);
    }

    // campiona a 320×180 e cerca i colori firma
    const { data } = await sharp(full).resize(320, 180).raw().toBuffer({ resolveWithObject: true });
    const wanted = (SIGNATURE[id] || []).map(hexToRgb);
    const found = wanted.map(() => false);
    let distinct = new Set();

    for (let i = 0; i < data.length; i += 3) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      distinct.add((r >> 3) + "," + (g >> 3) + "," + (b >> 3));
      wanted.forEach(([wr, wg, wb], k) => {
        if (!found[k] && Math.abs(r - wr) < 26 && Math.abs(g - wg) < 26 && Math.abs(b - wb) < 26) {
          found[k] = true;
        }
      });
    }

    if (distinct.size < 40) errors.push(`${file}: solo ${distinct.size} colori distinti (disegno troppo povero)`);
    found.forEach((ok, k) => {
      if (!ok) errors.push(`${file}: colore firma mancante ${SIGNATURE[id][k]} (soggetto non disegnato?)`);
    });

    console.log(
      `${found.every(Boolean) && distinct.size >= 40 ? "✔" : "✖"} ${file}  ${meta.width}×${meta.height}  ${distinct.size} colori  firma ${found.filter(Boolean).length}/${found.length}`
    );
  }

  console.log("");
  if (errors.length) {
    console.error(`✖ ${errors.length} problemi:`);
    errors.forEach(e => console.error("  " + e));
    process.exit(1);
  }
  console.log("✔ " + `${files.length}/${expected}` + " illustrazioni valide, distinte e con i soggetti attesi");
})().catch(e => {
  console.error(e);
  process.exit(1);
});
