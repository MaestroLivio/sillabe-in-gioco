#!/usr/bin/env node
"use strict";
/**
 * Genera le schede illustrate delle parole del «Viaggio delle sillabe».
 *
 * Le parole già presenti in illustrations/NN.png usano quel disegno. Le altre
 * ricevono una scheda SVG coerente: sfondo per categoria, cornice, ombra e
 * un grande pittogramma emoji. Il file non contiene testo: la parola scritta
 * non deve suggerire la risposta negli esercizi di riconoscimento.
 *
 * Uso: node scripts/illustrations/word-cards.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "illustrations", "parole");
const data = require(path.join(ROOT, "js", "viaggio-dati.js"));

const CATEGORY = {
  animali: ["#e8f7ff", "#bfe9ff", "#7cc7f0"],
  cibo: ["#fff7e6", "#ffe6b8", "#f4b860"],
  oggetti: ["#f2f7ff", "#dce9ff", "#9dbcf0"],
  persone: ["#fff0f6", "#ffd9e8", "#f09cc0"],
  natura: ["#effbe8", "#cff0c2", "#83c977"],
  luoghi: ["#eef8f1", "#d2eedb", "#87c9a1"],
  azioni: ["#fff3e8", "#ffdcc0", "#f2a56e"],
  numeri: ["#f5f0ff", "#e1d4ff", "#a98bf0"],
  colori: ["#f7f7fb", "#e3e3ef", "#a7a7bd"],
  corpo: ["#fff1ee", "#ffd9d1", "#f09a8a"],
  scuola: ["#eef6ff", "#d4e8ff", "#86b8ef"],
  trasporti: ["#eefaff", "#cdefff", "#72c6e8"],
  giochi: ["#fff8e6", "#ffe9b0", "#f0c15a"],
  abbigliamento: ["#fdf0ff", "#f2d6ff", "#c99aef"],
  feste: ["#fff4e6", "#ffd9a8", "#f0a44e"],
  tempo: ["#eef9ff", "#cdeeff", "#7cc7e8"],
  astratto: ["#f8f4ef", "#ece2d4", "#c2b09a"],
  altro: ["#f5f7fa", "#e2e8ef", "#aebcc9"]
};

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function card(word) {
  const [c1, c2, c3] = CATEGORY[word.categoria] || CATEGORY.altro;
  const emoji = word.immagine.emoji || "✨";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360" role="img" aria-label="${esc(word.immagine.alt)}">
  <title>${esc(word.immagine.alt)}</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="62%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fff8cc"/><stop offset="100%" stop-color="#ffe27a"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="7" flood-color="#25384d" flood-opacity=".2"/>
    </filter>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <circle cx="554" cy="62" r="32" fill="url(#sun)" opacity=".95"/>
  <g fill="#ffffff" opacity=".72">
    <ellipse cx="110" cy="62" rx="44" ry="22"/><ellipse cx="146" cy="54" rx="30" ry="18"/>
    <ellipse cx="330" cy="42" rx="34" ry="16"/><ellipse cx="360" cy="48" rx="22" ry="13"/>
  </g>
  <path d="M0 280 Q160 250 320 274 T640 268 L640 360 L0 360 Z" fill="#ffffff" opacity=".28"/>
  <path d="M0 306 Q170 282 330 302 T640 296 L640 360 L0 360 Z" fill="#ffffff" opacity=".22"/>
  <rect x="36" y="28" width="568" height="294" rx="30" fill="none" stroke="#ffffff" stroke-width="6" opacity=".55"/>
  <ellipse cx="320" cy="318" rx="112" ry="16" fill="#25384d" opacity=".12"/>
  ${word.id === "pipa" ? `<g filter="url(#soft)">
    <path d="M246 240 q-2 38 34 38 h58 q26 0 26 -24 v-18 h-38 v14 q0 8 -8 8 h-38 q-10 0 -10 -18 z" fill="#8b5a2b"/>
    <rect x="330" y="222" width="128" height="13" rx="6.5" fill="#6b4423"/>
    <rect x="246" y="216" width="62" height="14" rx="7" fill="#a9713f"/>
    <ellipse cx="277" cy="216" rx="30" ry="5" fill="#c98a5a"/>
  </g>` : `<text x="320" y="218" font-size="172" text-anchor="middle" dominant-baseline="middle"
    font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif"
    filter="url(#soft)">${emoji}</text>`}
  <g fill="#ffffff" opacity=".55">
    <circle cx="82" cy="286" r="7"/><circle cx="104" cy="270" r="5"/><circle cx="556" cy="286" r="8"/><circle cx="534" cy="266" r="5"/>
  </g>
</svg>
`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const cards = data.PAROLE.filter(w => w.immagine && w.immagine.tipo === "card");
  const items = [];
  cards.forEach(w => {
    const file = path.join(OUT, `${w.id}.svg`);
    fs.writeFileSync(file, card(w));
    items.push({ id: w.id, parola: w.testo, file: `illustrations/parole/${w.id}.svg`, alt: w.immagine.alt });
  });
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify({
    generated: new Date().toISOString(),
    count: items.length,
    items
  }, null, 2) + "\n");
  console.log(`✔ ${items.length} schede illustrate in illustrations/parole/`);
}

main();
