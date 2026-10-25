"use strict";
/**
 * Libreria di disegno vettoriale per le illustrazioni dei 40 livelli.
 *
 * Tutte le funzioni restituiscono stringhe SVG nel sistema di coordinate
 * 640×360 (16:9). Lo stile è quello di un libro illustrato per bambini:
 * forme piene, angoli arrotondati, colori caldi, nessun contorno pesante.
 *
 * Regola fondamentale: **nessuna lettera, numero o parola** dentro le
 * illustrazioni. L'app insegna a leggere: il disegno non deve suggerire la
 * soluzione mostrando del testo.
 *
 * Le coordinate `y` delle funzioni "in piedi" indicano la linea di appoggio
 * (i piedi), così comporre una scena resta semplice.
 */

const W = 640;
const H = 360;

/** Arrotonda a due decimali: tiene i file SVG leggeri e leggibili. */
const n = v => Math.round(v * 100) / 100;

const C = {
  ink: "#33475b",
  skin: { a: "#f9dcc0", b: "#efc5a2", c: "#cf9b72" },
  hair: {
    brown: "#5b3a26",
    black: "#2f2a28",
    blond: "#e3ad45",
    grey: "#bdb7b1",
    red: "#a8502f"
  },
  cloth: {
    red: "#ee5f5f",
    blue: "#4a90e2",
    green: "#57bf7a",
    yellow: "#f6bf4a",
    purple: "#9b72d8",
    pink: "#f58ba8",
    teal: "#39b3a6",
    orange: "#f2884b",
    navy: "#3c5a78"
  },
  wood: "#cd9053",
  woodD: "#a86c33",
  leaf: "#5cc47f",
  leafD: "#3ea363",
  water: "#63b9e6",
  waterD: "#3f9ccb",
  white: "#ffffff",
  cream: "#fff8ec",
  sand: "#f3e0ba",
  stone: "#c3ccd6",
  grey: "#a9b4c0",
  glass: "#d8ecf6"
};

/* ------------------------------------------------------------------
   Utilissimi: pezzi riutilizzabili
   ------------------------------------------------------------------ */

/** Cerchio. */
function circ(x, y, r, fill, o = {}) {
  return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}"${
    o.opacity ? ` opacity="${o.opacity}"` : ""
  }${o.stroke ? ` stroke="${o.stroke}" stroke-width="${n(o.sw || 3)}"` : ""}/>`;
}

/** Ellisse. */
function ell(x, y, rx, ry, fill, o = {}) {
  let t = "";
  if (o.rotate) t = ` transform="rotate(${n(o.rotate)} ${n(x)} ${n(y)})"`;
  return `<ellipse cx="${n(x)}" cy="${n(y)}" rx="${n(rx)}" ry="${n(ry)}" fill="${fill}"${
    o.opacity ? ` opacity="${o.opacity}"` : ""
  }${t}/>`;
}

/** Rettangolo arrotondato. `o.rotate` ruota attorno al centro del rettangolo. */
function rect(x, y, w, h, r, fill, o = {}) {
  let t = "";
  if (o.rotate) t = ` transform="rotate(${n(o.rotate)} ${n(x + w / 2)} ${n(y + h / 2)})"`;
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="${fill}"${
    o.opacity ? ` opacity="${o.opacity}"` : ""
  }${t}/>`;
}

/** Poligono da una lista di punti [x, y]. */
function poly(points, fill, o = {}) {
  const d = points.map(p => `${n(p[0])},${n(p[1])}`).join(" ");
  return `<polygon points="${d}" fill="${fill}"${
    o.opacity ? ` opacity="${o.opacity}"` : ""
  }${o.stroke ? ` stroke="${o.stroke}" stroke-width="${n(o.sw || 3)}"` : ""}/>`;
}

/** Tracciato arbitrario. */
function path(d, fill, o = {}) {
  return `<path d="${d}" fill="${fill}"${
    o.opacity ? ` opacity="${o.opacity}"` : ""
  }${o.stroke ? ` stroke="${o.stroke}" stroke-width="${n(o.sw || 3)}" stroke-linecap="round"${
    o.dash ? ` stroke-dasharray="${o.dash}"` : ""
  }` : ""}/>`;
}

/** Tratto (senza riempimento), con estremi arrotondati. */
function line(d, stroke, sw, o = {}) {
  return `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${n(sw)}" stroke-linecap="round"${
    o.dash ? ` stroke-dasharray="${o.dash}"` : ""
  }${o.opacity ? ` opacity="${o.opacity}"` : ""}/>`;
}

/** Gruppo con trasformazione (ignorata se vuota). */
function grp(content, transform) {
  return transform ? `<g transform="${transform}">${content}</g>` : content;
}

/** Ombra morbida a terra. */
function shadow(x, y, rx, o = {}) {
  return ell(x, y, rx, rx * 0.32, o.color || "#2f4459", { opacity: o.opacity || 0.13 });
}

/* ------------------------------------------------------------------
   Fondali
   ------------------------------------------------------------------ */

const GROUP_SKY = [
  ["#d7f0ff", "#a9dcff"],
  ["#e2f8d9", "#a9e3a0"],
  ["#ffe9cc", "#ffcf9b"],
  ["#e6dcff", "#c2b1f5"]
];

const NIGHT_SKY = ["#2b3566", "#5d4a8c"];

/** Sole raggiante. */
function sun(x, y, r) {
  let rays = "";
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    const x1 = x + Math.cos(a) * (r + 6);
    const y1 = y + Math.sin(a) * (r + 6);
    const x2 = x + Math.cos(a) * (r + 15);
    const y2 = y + Math.sin(a) * (r + 15);
    rays += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#ffd257" stroke-width="5" stroke-linecap="round" opacity=".55"/>`;
  }
  return rays + circ(x, y, r, "#ffd257") + circ(x, y, r * 0.78, "#ffe38a");
}

/** Luna con qualche cratere. */
function moon(x, y, r) {
  return (
    circ(x, y, r, "#fff4c9") +
    circ(x - r * 0.3, y - r * 0.25, r * 0.16, "#f0e0a8") +
    circ(x + r * 0.28, y + r * 0.2, r * 0.2, "#f0e0a8") +
    circ(x + r * 0.1, y - r * 0.42, r * 0.11, "#f0e0a8")
  );
}

/** Stella a cinque punte. */
function star(x, y, r, fill = "#ffe27a", o = {}) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.44 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return poly(pts, fill, o);
}

/** Nuvola soffice. */
function cloud(x, y, s = 1, color = "#ffffff", opacity = 0.92) {
  return (
    `<g opacity="${opacity}">` +
    ell(x, y, 34 * s, 20 * s, color) +
    ell(x + 26 * s, y - 9 * s, 26 * s, 20 * s, color) +
    ell(x - 26 * s, y - 4 * s, 22 * s, 16 * s, color) +
    ell(x + 6 * s, y - 17 * s, 20 * s, 16 * s, color) +
    `</g>`
  );
}

/** Nuvola di pioggia con gocce. */
function rainCloud(x, y, s = 1) {
  let drops = "";
  for (let i = 0; i < 7; i++) {
    const dx = -40 + i * 14;
    const dy = 18 + (i % 3) * 12;
    drops += line(
      `M${n(x + dx * s)} ${n(y + dy * s)} l${n(-4 * s)} ${n(14 * s)}`,
      "#7cc4ea",
      n(5 * s)
    );
  }
  return (
    cloud(x, y, s, "#b9c8d6", 1) +
    drops
  );
}

/** Collina/ponte di terreno. */
function hill(y, color, amp = 26, opacity = 1) {
  return path(
    `M-10 ${n(y)} Q160 ${n(y - amp)} 330 ${n(y + 4)} T650 ${n(y - 2)} L650 370 L-10 370 Z`,
    color,
    { opacity }
  );
}

/** Prato: due colline verdi sovrapposte. */
function meadow(y = 268) {
  return (
    hill(y, "#8fd694", 30, 0.85) +
    hill(y + 26, "#6cc47a", 18, 1) +
    hill(y + 56, "#5ab868", 10, 1)
  );
}

/** Pavimento interno. */
function floor(y = 280, color = "#e8cfae") {
  return rect(-10, y, 660, 100, 0, color) + rect(-10, y - 8, 660, 16, 0, "#d3b48d");
}

/** Specchio d'acqua (lago/mare) con onde. */
function water(y = 262, color = C.water, deep = C.waterD) {
  let waves = "";
  for (let i = 0; i < 3; i++) {
    const wy = y + 24 + i * 26;
    waves += line(
      `M60 ${wy} q22 -9 44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0 t44 0`,
      deep,
      i === 0 ? 5 : 4,
      { opacity: 0.45 - i * 0.08 }
    );
  }
  return rect(-10, y, 660, 120, 0, color) + waves;
}

/** Strada cittadina. */
function street(y = 272) {
  return (
    rect(-10, y - 14, 660, 22, 0, "#c8ccd2") +
    rect(-10, y + 8, 660, 100, 0, "#8d949c") +
    line(`M20 ${y + 52} h60`, "#f4f6f8", 6, { dash: "26 22" })
  );
}

/* ------------------------------------------------------------------
   Animali
   ------------------------------------------------------------------ */

/**
 * Gatto seduto/disteso.
 * @param {number} x centro
 * @param {number} y linea dei piedi
 * @param {number} s scala (1 ≈ 95 px di altezza)
 */
function cat(x, y, s = 1, o = {}) {
  const color = o.color || "#f0a355";
  const dark = o.dark || "#d9863c";
  const pose = o.pose || "sit";
  const tilt = o.tilt || 0;

  if (pose === "sleep") {
    // gatto acciambellato, occhi chiusi
    const cy = y - 26 * s;
    return (
      shadow(x, y + 4 * s, 52 * s) +
      ell(x, cy, 50 * s, 26 * s, color) +
      ell(x - 30 * s, cy - 8 * s, 16 * s, 22 * s, dark, { opacity: 0.35 }) +
      line(`M${n(x + 30 * s)} ${n(cy - 10 * s)} q30 0 22 22`, dark, 11 * s) +
      grp(
        circ(x + 30 * s, cy - 20 * s, 20 * s, color) +
          poly(
            [
              [x + 16 * s, cy - 34 * s],
              [x + 22 * s, cy - 50 * s],
              [x + 32 * s, cy - 36 * s]
            ],
            color
          ) +
          poly(
            [
              [x + 40 * s, cy - 36 * s],
              [x + 52 * s, cy - 48 * s],
              [x + 52 * s, cy - 30 * s]
            ],
            color
          ) +
          line(`M${n(x + 22 * s)} ${n(cy - 20 * s)} q5 4 10 0`, C.ink, 3 * s) +
          line(`M${n(x + 38 * s)} ${n(cy - 20 * s)} q5 4 10 0`, C.ink, 3 * s) +
          poly(
            [
              [x + 30 * s, cy - 12 * s],
              [x + 35 * s, cy - 12 * s],
              [x + 32.5 * s, cy - 8 * s]
            ],
            "#e88098"
          ),
        `rotate(-8 ${n(x + 30 * s)} ${n(cy - 20 * s)})`
      )
    );
  }

  const headY = y - 76 * s;
  let out = shadow(x, y + 3 * s, 36 * s);

  // coda
  out += line(
    `M${n(x + 22 * s)} ${n(y - 26 * s)} q${n(34 * s)} ${n(6 * s)} ${n(24 * s)} ${n(-32 * s)}`,
    dark,
    12 * s
  );
  // corpo
  out += ell(x, y - 32 * s, 27 * s, 33 * s, color);
  // zampa chiara
  out += ell(x - 8 * s, y - 6 * s, 11 * s, 8 * s, C.cream);
  out += ell(x + 10 * s, y - 6 * s, 11 * s, 8 * s, C.cream);

  // testa (con eventuale inclinazione)
  let head =
    poly(
      [
        [x - 24 * s, headY - 8 * s],
        [x - 15 * s, headY - 32 * s],
        [x - 2 * s, headY - 14 * s]
      ],
      color
    ) +
    poly(
      [
        [x + 24 * s, headY - 8 * s],
        [x + 15 * s, headY - 32 * s],
        [x + 2 * s, headY - 14 * s]
      ],
      color
    ) +
    poly(
      [
        [x - 19 * s, headY - 12 * s],
        [x - 15 * s, headY - 26 * s],
        [x - 8 * s, headY - 15 * s]
      ],
      "#f7b6c2"
    ) +
    poly(
      [
        [x + 19 * s, headY - 12 * s],
        [x + 15 * s, headY - 26 * s],
        [x + 8 * s, headY - 15 * s]
      ],
      "#f7b6c2"
    ) +
    circ(x, headY, 24 * s, color) +
    ell(x - 15 * s, headY + 3 * s, 8 * s, 6 * s, "#ffffff", { opacity: 0.25 }) +
    // occhi
    (pose === "meow" || o.happy
      ? line(`M${n(x - 13 * s)} ${n(headY - 1 * s)} q6 -6 12 0`, C.ink, 3 * s) +
        line(`M${n(x + 1 * s)} ${n(headY - 1 * s)} q6 -6 12 0`, C.ink, 3 * s)
      : circ(x - 8 * s, headY - 2 * s, 3.4 * s, C.ink) +
        circ(x + 8 * s, headY - 2 * s, 3.4 * s, C.ink) +
        circ(x - 9.2 * s, headY - 3.4 * s, 1.2 * s, "#ffffff") +
        circ(x + 6.8 * s, headY - 3.4 * s, 1.2 * s, "#ffffff")) +
    // naso e bocca
    poly(
      [
        [x - 4 * s, headY + 6 * s],
        [x + 4 * s, headY + 6 * s],
        [x, headY + 10 * s]
      ],
      "#e88098"
    ) +
    path(
      `M${n(x)} ${n(headY + 10 * s)} q${n(-5 * s)} ${n(6 * s)} ${n(-10 * s)} ${n(1 * s)} M${n(x)} ${n(
        headY + 10 * s
      )} q${n(5 * s)} ${n(6 * s)} ${n(10 * s)} ${n(1 * s)}`,
      "none",
      { stroke: C.ink, sw: 2.4 * s }
    ) +
    // baffi
    line(`M${n(x - 20 * s)} ${n(headY + 4 * s)} h${n(-13 * s)}`, C.ink, 2 * s, { opacity: 0.5 }) +
    line(`M${n(x - 20 * s)} ${n(headY + 10 * s)} h${n(-12 * s)}`, C.ink, 2 * s, { opacity: 0.5 }) +
    line(`M${n(x + 20 * s)} ${n(headY + 4 * s)} h${n(13 * s)}`, C.ink, 2 * s, { opacity: 0.5 }) +
    line(`M${n(x + 20 * s)} ${n(headY + 10 * s)} h${n(12 * s)}`, C.ink, 2 * s, { opacity: 0.5 });

  out += grp(head, `rotate(${tilt} ${n(x)} ${n(headY + 20 * s)})`);
  return out;
}

/** Cane. pose: "sit" | "jump" | "bark" | "run" */
function dog(x, y, s = 1, o = {}) {
  const color = o.color || "#c98a5a";
  const dark = o.dark || "#a86c3f";
  const pose = o.pose || "sit";
  const lift = pose === "jump" ? 34 * s : 0;
  const by = y - lift;
  let out = shadow(x, y + 3 * s, 40 * s, { opacity: pose === "jump" ? 0.08 : 0.13 });

  // coda
  out += line(
    `M${n(x + 26 * s)} ${n(by - 34 * s)} q${n(20 * s)} ${n(-6 * s)} ${n(16 * s)} ${n(-24 * s)}`,
    dark,
    10 * s
  );
  // corpo
  out += ell(x, by - 32 * s, 34 * s, 26 * s, color);
  // pancia chiara
  out += ell(x + 2 * s, by - 20 * s, 22 * s, 14 * s, "#f2d9bd");
  // zampe
  if (pose === "run") {
    out += line(`M${n(x - 18 * s)} ${n(by - 14 * s)} l${n(-14 * s)} ${n(14 * s)}`, dark, 9 * s);
    out += line(`M${n(x + 14 * s)} ${n(by - 14 * s)} l${n(16 * s)} ${n(12 * s)}`, dark, 9 * s);
  } else if (pose === "jump") {
    out += line(`M${n(x - 16 * s)} ${n(by - 16 * s)} l${n(-12 * s)} ${n(10 * s)}`, dark, 9 * s);
    out += line(`M${n(x + 12 * s)} ${n(by - 16 * s)} l${n(14 * s)} ${n(8 * s)}`, dark, 9 * s);
  } else {
    out += rect(x - 20 * s, by - 16 * s, 12 * s, 16 * s, 5 * s, dark);
    out += rect(x + 8 * s, by - 16 * s, 12 * s, 16 * s, 5 * s, dark);
  }

  // testa
  const hx = x - 22 * s;
  const hy = by - 58 * s;
  const mouthOpen = pose === "bark";
  let head =
    // orecchie pendenti
    ell(hx - 19 * s, hy + 4 * s, 9 * s, 15 * s, dark) +
    ell(hx + 19 * s, hy + 4 * s, 9 * s, 15 * s, dark) +
    circ(hx, hy, 21 * s, color) +
    // muso
    ell(hx + 8 * s, hy + 8 * s, 15 * s, 11 * s, "#f2d9bd") +
    circ(hx + 20 * s, hy + 4 * s, 4.5 * s, C.ink) +
    // occhi
    circ(hx - 5 * s, hy - 4 * s, 3.2 * s, C.ink) +
    circ(hx + 9 * s, hy - 4 * s, 3.2 * s, C.ink) +
    circ(hx - 6.1 * s, hy - 5.2 * s, 1.1 * s, "#ffffff") +
    circ(hx + 7.9 * s, hy - 5.2 * s, 1.1 * s, "#ffffff") +
    (mouthOpen
      ? ell(hx + 10 * s, hy + 14 * s, 7 * s, 7 * s, "#c2564f") +
        ell(hx + 10 * s, hy + 17 * s, 5 * s, 3.5 * s, "#f08a8a")
      : path(
          `M${n(hx + 2 * s)} ${n(hy + 14 * s)} q${n(7 * s)} ${n(5 * s)} ${n(13 * s)} 0`,
          "none",
          { stroke: C.ink, sw: 2.4 * s }
        ));

  out += head;

  if (pose === "bark") {
    // onde sonore
    out += line(`M${n(hx + 30 * s)} ${n(hy - 6 * s)} q${n(10 * s)} ${n(8 * s)} 0 ${n(16 * s)}`, "#8fa3b8", 3 * s);
    out += line(`M${n(hx + 40 * s)} ${n(hy - 12 * s)} q${n(14 * s)} ${n(14 * s)} 0 ${n(28 * s)}`, "#8fa3b8", 3 * s);
  }
  if (pose === "jump") {
    out += line(`M${n(x - 46 * s)} ${n(by - 20 * s)} q${n(-8 * s)} ${n(10 * s)} 0 ${n(20 * s)}`, "#8fa3b8", 3 * s);
  }
  return out;
}

/** Pesce. */
function fish(x, y, s = 1, o = {}) {
  const color = o.color || "#f2884b";
  const dark = o.dark || "#d96a2f";
  return (
    shadow(x, y + 30 * s, 34 * s, { opacity: 0.1 }) +
    poly(
      [
        [x + 26 * s, y],
        [x + 48 * s, y - 18 * s],
        [x + 48 * s, y + 18 * s]
      ],
      dark
    ) +
    ell(x, y, 32 * s, 21 * s, color) +
    path(`M${n(x - 4 * s)} ${n(y - 20 * s)} q${n(10 * s)} ${n(-12 * s)} ${n(20 * s)} ${n(2 * s)}`, "none", {
      stroke: dark,
      sw: 6 * s
    }) +
    ell(x - 2 * s, y + 8 * s, 18 * s, 9 * s, "#ffd9bd", { opacity: 0.6 }) +
    circ(x - 18 * s, y - 4 * s, 4 * s, C.ink) +
    circ(x - 19.4 * s, y - 5.4 * s, 1.4 * s, "#ffffff") +
    line(`M${n(x + 6 * s)} ${n(y + 2 * s)} q${n(6 * s)} ${n(6 * s)} 0 ${n(8 * s)}`, dark, 2.6 * s)
  );
}

/** Rana. */
function frog(x, y, s = 1, o = {}) {
  const color = o.color || "#6ec46b";
  const dark = o.dark || "#4ea24d";
  return (
    shadow(x, y + 3 * s, 36 * s) +
    // zampe
    ell(x - 24 * s, y - 6 * s, 13 * s, 8 * s, dark) +
    ell(x + 24 * s, y - 6 * s, 13 * s, 8 * s, dark) +
    // corpo
    ell(x, y - 26 * s, 34 * s, 26 * s, color) +
    ell(x, y - 16 * s, 22 * s, 13 * s, "#c9efc0", { opacity: 0.7 }) +
    // occhi a sfera
    circ(x - 16 * s, y - 48 * s, 13 * s, color) +
    circ(x + 16 * s, y - 48 * s, 13 * s, color) +
    circ(x - 16 * s, y - 48 * s, 8 * s, "#ffffff") +
    circ(x + 16 * s, y - 48 * s, 8 * s, "#ffffff") +
    circ(x - 15 * s, y - 47 * s, 4.4 * s, C.ink) +
    circ(x + 17 * s, y - 47 * s, 4.4 * s, C.ink) +
    // bocca
    path(`M${n(x - 18 * s)} ${n(y - 26 * s)} q${n(18 * s)} ${n(14 * s)} ${n(36 * s)} 0`, "none", {
      stroke: dark,
      sw: 3.6 * s
    })
  );
}

/** Topolino. */
function mouse(x, y, s = 1, o = {}) {
  const color = o.color || "#a8b3c0";
  const dark = o.dark || "#8b96a3";
  return (
    shadow(x, y + 2 * s, 26 * s) +
    // coda
    line(`M${n(x + 22 * s)} ${n(y - 12 * s)} q${n(26 * s)} ${n(2 * s)} ${n(20 * s)} ${n(-20 * s)}`, "#e3a3a3", 4 * s) +
    ell(x, y - 16 * s, 24 * s, 17 * s, color) +
    circ(x - 24 * s, y - 34 * s, 15 * s, color) +
    circ(x - 24 * s, y - 34 * s, 9 * s, "#e6b8c2") +
    circ(x + 16 * s, y - 40 * s, 12 * s, color) +
    circ(x + 16 * s, y - 40 * s, 7 * s, "#e6b8c2") +
    ell(x, y - 20 * s, 18 * s, 12 * s, "#d4dbe3", { opacity: 0.8 }) +
    circ(x + 30 * s, y - 20 * s, 3.4 * s, C.ink) +
    circ(x + 28 * s, y - 22 * s, 2.6 * s, C.ink)
  );
}

/** Uccellino. */
function bird(x, y, s = 1, o = {}) {
  const color = o.color || "#5aa9e6";
  const dark = o.dark || "#3f8ec7";
  const singing = o.singing;
  return (
    shadow(x, y + 2 * s, 22 * s, { opacity: 0.1 }) +
    // coda
    poly(
      [
        [x + 16 * s, y - 16 * s],
        [x + 34 * s, y - 26 * s],
        [x + 32 * s, y - 12 * s]
      ],
      dark
    ) +
    ell(x, y - 18 * s, 20 * s, 15 * s, color) +
    // ala
    path(`M${n(x - 2 * s)} ${n(y - 22 * s)} q${n(16 * s)} ${n(2 * s)} ${n(12 * s)} ${n(14 * s)} q${n(-14 * s)} ${n(-2 * s)} ${n(-12 * s)} ${n(-14 * s)}`, dark) +
    circ(x - 16 * s, y - 32 * s, 13 * s, color) +
    poly(
      [
        [x - 28 * s, y - 32 * s],
        [x - 40 * s, y - 28 * s],
        [x - 28 * s, y - 25 * s]
      ],
      "#f6bf4a"
    ) +
    circ(x - 19 * s, y - 35 * s, 3 * s, C.ink) +
    (singing
      ? line(`M${n(x - 38 * s)} ${n(y - 40 * s)} q${n(-8 * s)} ${n(4 * s)} 0 ${n(9 * s)}`, "#8fa3b8", 2.6 * s) +
        line(`M${n(x - 46 * s)} ${n(y - 46 * s)} q${n(-10 * s)} ${n(8 * s)} 0 ${n(16 * s)}`, "#8fa3b8", 2.6 * s)
      : "") +
    // zampe
    line(`M${n(x - 4 * s)} ${n(y - 4 * s)} l0 ${n(6 * s)}`, "#d98b3c", 3 * s) +
    line(`M${n(x + 6 * s)} ${n(y - 4 * s)} l0 ${n(6 * s)}`, "#d98b3c", 3 * s)
  );
}

/** Gabbiano in volo. */
function seagull(x, y, s = 1) {
  return (
    line(`M${n(x - 30 * s)} ${n(y)} q${n(14 * s)} ${n(-14 * s)} ${n(28 * s)} ${n(-2 * s)}`, "#ffffff", 7 * s) +
    line(`M${n(x - 2 * s)} ${n(y - 2 * s)} q${n(14 * s)} ${n(-14 * s)} ${n(28 * s)} ${n(0 * s)}`, "#ffffff", 7 * s) +
    ell(x, y + 2 * s, 9 * s, 7 * s, "#ffffff") +
    poly(
      [
        [x + 8 * s, y + 1 * s],
        [x + 16 * s, y + 3 * s],
        [x + 8 * s, y + 5 * s]
      ],
      "#f6bf4a"
    ) +
    circ(x + 4 * s, y, 1.8 * s, C.ink)
  );
}

/** Farfalla. */
function butterfly(x, y, s = 1, o = {}) {
  const c1 = o.c1 || "#f58ba8";
  const c2 = o.c2 || "#f6bf4a";
  return (
    grp(
      ell(x - 16 * s, y - 10 * s, 15 * s, 18 * s, c1, { rotate: -18, opacity: 0.95 }) +
        ell(x + 16 * s, y - 10 * s, 15 * s, 18 * s, c1, { rotate: 18, opacity: 0.95 }) +
        ell(x - 13 * s, y + 12 * s, 11 * s, 13 * s, c2, { rotate: -12 }) +
        ell(x + 13 * s, y + 12 * s, 11 * s, 13 * s, c2, { rotate: 12 }) +
        circ(x - 16 * s, y - 10 * s, 5 * s, C.cream, { opacity: 0.85 }) +
        circ(x + 16 * s, y - 10 * s, 5 * s, C.cream, { opacity: 0.85 }) +
        rect(x - 2.6 * s, y - 20 * s, 5.2 * s, 40 * s, 2.6 * s, "#4a3b33") +
        circ(x, y - 22 * s, 5 * s, "#4a3b33") +
        line(`M${n(x - 2 * s)} ${n(y - 26 * s)} q${n(-8 * s)} ${n(-10 * s)} ${n(-2 * s)} ${n(-14 * s)}`, "#4a3b33", 2 * s) +
        line(`M${n(x + 2 * s)} ${n(y - 26 * s)} q${n(8 * s)} ${n(-10 * s)} ${n(2 * s)} ${n(-14 * s)}`, "#4a3b33", 2 * s),
      `rotate(${o.rotate || 0} ${n(x)} ${n(y)})`
    )
  );
}

/* ------------------------------------------------------------------
   Persone
   ------------------------------------------------------------------ */

/** Braccio/gamba come rettangolo arrotondato ruotato attorno all'attacco. */
function limb(x, y, w, len, angle, color) {
  return grp(
    rect(x - w / 2, y, w, len, w / 2, color),
    `rotate(${n(angle)} ${n(x)} ${n(y)})`
  );
}

/**
 * Persona in piedi (stile "chibi" da libro illustrato).
 *
 * @param {object} o
 *  x, y      linea dei piedi
 *  s         scala (1 ≈ 130 px)
 *  skin      carnagione
 *  hair      capelli
 *  shirt     maglia
 *  pants     pantaloni/gonna
 *  hairStyle "short" | "long" | "bun" | "curly"
 *  pose      "stand" | "wave" | "walk" | "arms" | "hold" | "cook" | "laugh"
 *  glasses   occhiali
 *  hat       "straw" | "cap"
 *  skirt     gonna invece dei pantaloni
 */
function person(o = {}) {
  const x = o.x;
  const y = o.y;
  const s = o.s || 1;
  const skin = o.skin || C.skin.a;
  const hair = o.hair || C.hair.brown;
  const shirt = o.shirt || C.cloth.blue;
  const pants = o.pants || C.cloth.navy;
  const pose = o.pose || "stand";
  const hs = o.hairStyle || "short";

  const headR = 19 * s;
  const headY = y - 96 * s;
  // il busto parte poco sotto il centro della testa, così non resta staccato
  const shoulderY = y - 80 * s;
  const hipY = y - 40 * s;

  let out = shadow(x, y + 3 * s, 26 * s);

  // gambe: da hipY fino alla linea dei piedi
  const legW = 9 * s;
  const legLen = 40 * s;
  let legs;
  if (o.skirt) {
    legs =
      limb(x - 7 * s, hipY, legW, legLen, pose === "walk" ? 8 : 3, skin) +
      limb(x + 7 * s, hipY, legW, legLen, pose === "walk" ? -8 : -3, skin) +
      ell(x - 9 * s, y - 2 * s, 8 * s, 5 * s, "#5c4a3e") +
      ell(x + 9 * s, y - 2 * s, 8 * s, 5 * s, "#5c4a3e");
  } else {
    legs =
      limb(x - 7 * s, hipY, legW, legLen, pose === "walk" ? 12 : 4, pants) +
      limb(x + 7 * s, hipY, legW, legLen, pose === "walk" ? -12 : -4, pants) +
      ell(x - 8 * s, y - 2 * s, 9 * s, 5 * s, "#4a3f38") +
      ell(x + 10 * s, y - 2 * s, 9 * s, 5 * s, "#4a3f38");
  }

  // braccia
  const armW = 8 * s;
  const armLen = 27 * s;
  let arms;
  if (pose === "wave") {
    arms =
      limb(x - 15 * s, shoulderY, armW, armLen, 16, shirt) +
      limb(x + 15 * s, shoulderY, armW, armLen, -128, shirt) +
      circ(x + 30 * s, shoulderY - 22 * s, 5.4 * s, skin);
  } else if (pose === "arms" || pose === "laugh") {
    arms =
      limb(x - 15 * s, shoulderY, armW, armLen, 145, shirt) +
      limb(x + 15 * s, shoulderY, armW, armLen, -145, shirt) +
      circ(x - 30 * s, shoulderY - 18 * s, 5.4 * s, skin) +
      circ(x + 30 * s, shoulderY - 18 * s, 5.4 * s, skin);
  } else if (pose === "hold" || pose === "cook") {
    arms =
      limb(x - 15 * s, shoulderY, armW, armLen, 34, shirt) +
      limb(x + 15 * s, shoulderY, armW, armLen, -34, shirt) +
      circ(x - 10 * s, shoulderY + 22 * s, 5.4 * s, skin) +
      circ(x + 20 * s, shoulderY + 22 * s, 5.4 * s, skin);
  } else if (pose === "walk") {
    arms =
      limb(x - 15 * s, shoulderY, armW, armLen, 26, shirt) +
      limb(x + 15 * s, shoulderY, armW, armLen, -22, shirt) +
      circ(x - 22 * s, shoulderY + 24 * s, 5.4 * s, skin) +
      circ(x + 22 * s, shoulderY + 24 * s, 5.4 * s, skin);
  } else {
    arms =
      limb(x - 15 * s, shoulderY, armW, armLen, 10, shirt) +
      limb(x + 15 * s, shoulderY, armW, armLen, -10, shirt) +
      circ(x - 18 * s, shoulderY + 26 * s, 5.4 * s, skin) +
      circ(x + 18 * s, shoulderY + 26 * s, 5.4 * s, skin);
  }

  // busto
  const torso = o.skirt
    ? path(
        `M${n(x - 16 * s)} ${n(shoulderY)} L${n(x + 16 * s)} ${n(shoulderY)} L${n(x + 26 * s)} ${
          n(hipY + 16 * s)
        } Q${n(x)} ${n(hipY + 26 * s)} ${n(x - 26 * s)} ${n(hipY + 16 * s)} Z`,
        shirt
      )
    : rect(x - 16 * s, shoulderY - 4 * s, 32 * s, hipY - shoulderY + 12 * s, 11 * s, shirt);

  // testa
  let head = circ(x, headY, headR, skin);

  // capelli
  if (hs === "long") {
    head +=
      path(
        `M${n(x - headR)} ${n(headY + 18 * s)} L${n(x - headR)} ${n(headY - 2 * s)} A${n(headR)} ${n(
          headR
        )} 0 0 1 ${n(x + headR)} ${n(headY - 2 * s)} L${n(x + headR)} ${n(headY + 24 * s)} Q${n(
          x + headR * 0.6
        )} ${n(headY + 14 * s)} ${n(x + headR * 0.5)} ${n(headY + 2 * s)} Q${n(x - headR * 0.5)} ${n(
          headY + 14 * s
        )} ${n(x - headR * 0.6)} ${n(headY + 26 * s)} Z`,
        hair
      );
  } else if (hs === "bun") {
    head +=
      circ(x - headR * 0.85, headY - headR * 0.75, 8 * s, hair) +
      path(
        `M${n(x - headR)} ${n(headY + 2 * s)} A${n(headR)} ${n(headR)} 0 0 1 ${n(x + headR)} ${n(
          headY + 2 * s
        )} Q${n(x)} ${n(headY - 4 * s)} ${n(x - headR)} ${n(headY + 2 * s)} Z`,
        hair
      );
  } else if (hs === "curly") {
    head +=
      circ(x - 13 * s, headY - 13 * s, 9 * s, hair) +
      circ(x, headY - 19 * s, 10 * s, hair) +
      circ(x + 13 * s, headY - 13 * s, 9 * s, hair) +
      circ(x - 18 * s, headY - 2 * s, 7 * s, hair) +
      circ(x + 18 * s, headY - 2 * s, 7 * s, hair);
  } else {
    head += path(
      `M${n(x - headR)} ${n(headY + 3 * s)} A${n(headR)} ${n(headR)} 0 0 1 ${n(x + headR)} ${n(
        headY + 3 * s
      )} Q${n(x + 6 * s)} ${n(headY - 8 * s)} ${n(x - headR)} ${n(headY + 3 * s)} Z`,
      hair
    );
  }

  // viso
  const eyeY = headY + 1 * s;
  const happy = pose === "laugh";
  head += happy
    ? line(`M${n(x - 12 * s)} ${n(eyeY)} q${n(5 * s)} ${n(-6 * s)} ${n(10 * s)} 0`, C.ink, 2.8 * s) +
      line(`M${n(x + 2 * s)} ${n(eyeY)} q${n(5 * s)} ${n(-6 * s)} ${n(10 * s)} 0`, C.ink, 2.8 * s)
    : circ(x - 7 * s, eyeY, 2.8 * s, C.ink) +
      circ(x + 7 * s, eyeY, 2.8 * s, C.ink) +
      circ(x - 7.8 * s, eyeY - 1 * s, 1 * s, "#ffffff") +
      circ(x + 6.2 * s, eyeY - 1 * s, 1 * s, "#ffffff");

  head += ell(x - 12 * s, headY + 8 * s, 4 * s, 2.6 * s, "#f2a3a3", { opacity: 0.5 });
  head += ell(x + 12 * s, headY + 8 * s, 4 * s, 2.6 * s, "#f2a3a3", { opacity: 0.5 });

  head += happy
    ? path(`M${n(x - 7 * s)} ${n(headY + 11 * s)} q${n(7 * s)} ${n(8 * s)} ${n(14 * s)} 0`, "#c2564f")
    : path(
        `M${n(x - 6 * s)} ${n(headY + 12 * s)} q${n(6 * s)} ${n(6 * s)} ${n(12 * s)} 0`,
        "none",
        { stroke: C.ink, sw: 2.4 * s }
      );

  if (o.glasses) {
    head +=
      circ(x - 7 * s, eyeY, 6.4 * s, "none", { stroke: C.ink, sw: 1.8 * s }) +
      circ(x + 7 * s, eyeY, 6.4 * s, "none", { stroke: C.ink, sw: 1.8 * s }) +
      line(`M${n(x - 0.6 * s)} ${n(eyeY)} h${n(1.2 * s)}`, C.ink, 1.8 * s);
  }

  if (o.hat === "straw") {
    head +=
      ell(x, headY - headR + 2 * s, 30 * s, 7 * s, "#e8c979") +
      path(
        `M${n(x - 14 * s)} ${n(headY - headR + 2 * s)} Q${n(x)} ${n(headY - headR - 14 * s)} ${n(
          x + 14 * s
        )} ${n(headY - headR + 2 * s)} Z`,
        "#efd894"
      );
  } else if (o.hat === "cap") {
    head +=
      path(
        `M${n(x - headR - 1 * s)} ${n(headY - 4 * s)} A${n(headR + 2 * s)} ${n(headR + 2 * s)} 0 0 1 ${n(
          x + headR + 1 * s
        )} ${n(headY - 4 * s)} Z`,
        "#e0574f"
      ) + ell(x + 12 * s, headY - 4 * s, 12 * s, 4 * s, "#c74843");
  }

  out += legs + torso + arms + head;
  return out;
}

/* Esportazioni ---------------------------------------------------- */
module.exports = {
  W, H, n, C,
  circ, ell, rect, poly, path, line, grp, shadow, limb,
  GROUP_SKY, NIGHT_SKY,
  sun, moon, star, cloud, rainCloud, hill, meadow, floor, water, street,
  cat, dog, fish, frog, mouse, bird, seagull, butterfly,
  person
};
