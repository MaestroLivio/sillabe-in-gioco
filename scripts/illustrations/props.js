"use strict";
/**
 * Oggetti e arredi ricorrenti nelle illustrazioni.
 *
 * Ogni funzione restituisce SVG nel sistema 640×360. Come in `draw.js`,
 * nessun oggetto contiene lettere o numeri: le illustrazioni devono
 * rappresentare il significato della frase, non la sua scrittura.
 */
const { n, C, circ, ell, rect, poly, path, line, grp, shadow } = require("./draw");

/* ---------- interni ---------- */

/** Parete + pavimento di una stanza. */
function room(wall = "#fdf3e3", fl = "#e8cfae", floorY = 286) {
  return (
    rect(-10, -10, 660, floorY + 12, 0, wall) +
    rect(-10, floorY - 10, 660, 12, 0, "#e2cba9") +
    rect(-10, floorY, 660, 110, 0, fl) +
    line(`M-10 ${floorY + 46} h660`, "#d8bd95", 2, { opacity: 0.5 }) +
    line(`M-10 ${floorY + 84} h660`, "#d8bd95", 2, { opacity: 0.35 })
  );
}

/** Finestra con tende e cielo azzurro. */
function window_(x, y, w = 96, h = 84, o = {}) {
  const sky = o.night ? "#2f3f6e" : "#bfe6ff";
  let out =
    rect(x - 7, y - 7, w + 14, h + 14, 8, "#ffffff") +
    rect(x, y, w, h, 4, sky);
  if (o.night) {
    out += circ(x + w * 0.7, y + h * 0.3, 9, "#fff4c9") + circ(x + w * 0.3, y + h * 0.25, 2, "#fff4c9");
  } else {
    out += ell(x + w * 0.3, y + h * 0.3, 20, 10, "#ffffff", { opacity: 0.9 });
  }
  out +=
    line(`M${n(x + w / 2)} ${n(y)} v${n(h)}`, "#ffffff", 5) +
    line(`M${n(x)} ${n(y + h / 2)} h${n(w)}`, "#ffffff", 5) +
    rect(x - 12, y - 10, 14, h + 20, 6, o.curtain || "#f6bf4a") +
    rect(x + w - 2, y - 10, 14, h + 20, 6, o.curtain || "#f6bf4a") +
    rect(x - 16, y - 16, w + 32, 8, 4, "#e8e0d0");
  return out;
}

/** Porta con pannelli e maniglia. */
function door(x, y, w = 96, h = 156, o = {}) {
  const open = o.open;
  let out = rect(x - 6, y - 6, w + 12, h + 6, 6, "#e0c9a6");
  if (open) {
    // vano aperto: luce calda oltre la porta
    out += rect(x, y, w, h, 4, "#fff6dd");
    out += rect(x + 8, y + 22, w - 16, h - 40, 4, "#ffe9b8");
    out += rect(x + w - 12, y, 26, h, 4, o.color || "#c98a5a");
    out += circ(x + w - 24, y + h / 2, 4, "#f6d47a");
  } else {
    out += rect(x, y, w, h, 4, o.color || "#c98a5a");
    out += rect(x + 12, y + 16, w - 24, 52, 5, "#b57544");
    out += rect(x + 12, y + 82, w - 24, 52, 5, "#b57544");
    out += circ(x + w - 16, y + h / 2, 5, "#f6d47a");
  }
  return out;
}

/** Tappeto ovale. */
function rug(x, y, rx = 130, color = "#f2a3b3") {
  return (
    ell(x, y, rx, rx * 0.3, color, { opacity: 0.85 }) +
    ell(x, y, rx * 0.72, rx * 0.21, "#fff3e2", { opacity: 0.7 })
  );
}

/** Cuscino per il gatto. */
function cushion(x, y, s = 1) {
  return (
    ell(x, y, 44 * s, 15 * s, "#c98fb0") +
    ell(x, y - 6 * s, 42 * s, 15 * s, "#e0aac7") +
    ell(x, y - 10 * s, 30 * s, 9 * s, "#f0c8db", { opacity: 0.8 })
  );
}

/** Letto con piumone e cuscino. */
function bed(x, y, s = 1, o = {}) {
  const w = 150 * s;
  const h = 60 * s;
  const top = y - h;
  return (
    rect(x, top, w, h, 8, "#b98b5e") +
    rect(x + 4 * s, top + 6 * s, w - 8 * s, h - 6 * s, 6, "#f7f2ea") +
    // testiera
    rect(x - 12 * s, top - 58 * s, 16 * s, 64 * s, 7, "#a97a4e") +
    rect(x - 8 * s, top - 54 * s, 14 * s, 56 * s, 6, "#c99a66") +
    // materasso e cuscino
    rect(x + 8 * s, top + 8 * s, w - 16 * s, 22 * s, 8 * s, "#dfeaf5") +
    rect(x + 12 * s, top - 2 * s, 42 * s, 20 * s, 8 * s, o.pillow || "#ffffff") +
    // piumone
    rect(x + 20 * s, top + 30 * s, w - 30 * s, h - 26 * s, 8 * s, o.duvet || "#7fb2e6") +
    rect(x + 20 * s, top + 30 * s, w - 30 * s, 12 * s, 6 * s, "#ffffff", { opacity: 0.35 }) +
    // gambe
    line(`M${n(x + 10 * s)} ${n(y)} v${n(10 * s)}`, "#8d6a45", 6 * s) +
    line(`M${n(x + w - 10 * s)} ${n(y)} v${n(10 * s)}`, "#8d6a45", 6 * s)
  );
}

/** Tavolo. */
function table(x, y, w = 170, s = 1) {
  return (
    ell(x + w / 2, y + 4 * s, w * 0.52, 10 * s, "#c9a67d", { opacity: 0.45 }) +
    rect(x, y - 10 * s, w, 12 * s, 5, "#cf9a63") +
    rect(x, y - 10 * s, w, 5 * s, 3, "#e0b183") +
    line(`M${n(x + 12 * s)} ${n(y + 2 * s)} v${n(34 * s)}`, "#a97a4e", 7 * s) +
    line(`M${n(x + w - 12 * s)} ${n(y + 2 * s)} v${n(34 * s)}`, "#a97a4e", 7 * s)
  );
}

/** Sedia. */
function chair(x, y, s = 1, color = "#d09a63") {
  return (
    rect(x - 2 * s, y - 46 * s, 34 * s, 8 * s, 4, color) +
    rect(x - 2 * s, y - 78 * s, 8 * s, 40 * s, 4, color) +
    rect(x - 2 * s, y - 78 * s, 34 * s, 30 * s, 5, color) +
    line(`M${n(x + 4 * s)} ${n(y - 40 * s)} v${n(40 * s)}`, "#a97a4e", 6 * s) +
    line(`M${n(x + 28 * s)} ${n(y - 40 * s)} v${n(40 * s)}`, "#a97a4e", 6 * s)
  );
}

/** Poltrona con braccioli. */
function armchair(x, y, s = 1, color = "#8fb8d8") {
  return (
    ell(x + 40 * s, y + 3 * s, 52 * s, 9 * s, "#c9a67d", { opacity: 0.4 }) +
    rect(x, y - 56 * s, 80 * s, 58 * s, 12 * s, color) +
    rect(x + 6 * s, y - 78 * s, 68 * s, 34 * s, 12 * s, color) +
    rect(x - 10 * s, y - 44 * s, 16 * s, 34 * s, 8 * s, color) +
    rect(x + 74 * s, y - 44 * s, 16 * s, 34 * s, 8 * s, color) +
    rect(x + 10 * s, y - 40 * s, 60 * s, 26 * s, 10 * s, "#a9cbe4")
  );
}

/* ---------- stoviglie e cibo ---------- */

/** Piatto visto di lato. */
function plate(x, y, s = 1, color = "#ffffff") {
  return (
    ell(x, y, 26 * s, 7 * s, "#dfe6ee") +
    ell(x, y - 3 * s, 24 * s, 6 * s, color) +
    ell(x, y - 4 * s, 16 * s, 4 * s, "#eef3f8")
  );
}

/** Pila di piatti da lavare. */
function plates(x, y, s = 1) {
  return (
    plate(x, y, s) +
    plate(x, y - 12 * s, s * 0.96) +
    plate(x, y - 23 * s, s * 0.92) +
    ell(x, y - 38 * s, 14 * s, 5 * s, "#ffffff") +
    ell(x, y - 42 * s, 13 * s, 4 * s, "#eef3f8")
  );
}

/** Ciotola di latte. */
function bowlMilk(x, y, s = 1) {
  return (
    shadow(x, y + 4 * s, 30 * s) +
    path(
      `M${n(x - 30 * s)} ${n(y - 16 * s)} q${n(4 * s)} ${n(20 * s)} ${n(30 * s)} ${n(20 * s)} q${n(
        26 * s
      )} 0 ${n(30 * s)} ${n(-20 * s)} Z`,
      "#5aa9e6"
    ) +
    ell(x, y - 16 * s, 30 * s, 9 * s, "#7cc0ea") +
    ell(x, y - 15 * s, 24 * s, 7 * s, "#ffffff") +
    ell(x - 7 * s, y - 16 * s, 7 * s, 3 * s, "#f2f7fb")
  );
}

/** Osso. */
function bone(x, y, s = 1, rot = -18) {
  return grp(
    rect(x - 26 * s, y - 7 * s, 52 * s, 14 * s, 7 * s, "#f6efe2") +
      circ(x - 26 * s, y - 7 * s, 8 * s, "#f6efe2") +
      circ(x - 26 * s, y + 7 * s, 8 * s, "#f6efe2") +
      circ(x + 26 * s, y - 7 * s, 8 * s, "#f6efe2") +
      circ(x + 26 * s, y + 7 * s, 8 * s, "#f6efe2") +
      ell(x, y - 2 * s, 20 * s, 3 * s, "#e3d8c4", { opacity: 0.8 }),
    `rotate(${rot} ${n(x)} ${n(y)})`
  );
}

/** Palla a spicchi. */
function ball(x, y, r = 26, c1 = "#ee5f5f", c2 = "#f6bf4a") {
  return (
    shadow(x, y + r * 0.9, r * 0.9, { opacity: 0.1 }) +
    circ(x, y, r, "#ffffff") +
    path(`M${n(x - r)} ${n(y)} a${n(r)} ${n(r)} 0 0 1 ${n(2 * r)} 0 Z`, c1) +
    path(`M${n(x - r)} ${n(y)} a${n(r)} ${n(r)} 0 0 0 ${n(2 * r)} 0 Z`, c2) +
    circ(x, y, r, "none", { stroke: "#ffffff", sw: 2 }) +
    circ(x - r * 0.35, y - r * 0.4, r * 0.16, "#ffffff", { opacity: 0.7 })
  );
}

/** Fiore con gambo e foglie. */
function flower(x, y, s = 1, petal = "#f58ba8", center = "#f6bf4a") {
  let petals = "";
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    petals += ell(x + Math.cos(a) * 9 * s, y - 30 * s + Math.sin(a) * 9 * s, 8 * s, 6 * s, petal, {
      rotate: (a * 180) / Math.PI
    });
  }
  return (
    line(`M${n(x)} ${n(y)} v${n(-28 * s)}`, C.leafD, 4 * s) +
    ell(x - 9 * s, y - 12 * s, 9 * s, 5 * s, C.leaf, { rotate: -22 }) +
    ell(x + 9 * s, y - 18 * s, 9 * s, 5 * s, C.leaf, { rotate: 22 }) +
    petals +
    circ(x, y - 30 * s, 7 * s, center) +
    circ(x - 2 * s, y - 32 * s, 2 * s, "#e8a83a", { opacity: 0.6 })
  );
}

/** Cespuglio di fiori sul prato. */
function flowerPatch(x, y, s = 1) {
  return (
    flower(x - 26 * s, y, 0.85 * s, "#f58ba8") +
    flower(x, y + 3 * s, s, "#f6bf4a", "#f2884b") +
    flower(x + 26 * s, y, 0.8 * s, "#c39bea", "#f6bf4a")
  );
}

/** Albero con mele. */
function appleTree(x, y, s = 1) {
  let apples = "";
  const spots = [
    [-34, -150], [10, -170], [40, -138], [-14, -122], [26, -108], [-46, -116]
  ];
  spots.forEach(([dx, dy]) => {
    apples += circ(x + dx * s, y + dy * s, 7 * s, "#e0574f") + circ(x + dx * s - 2 * s, y + dy * s - 2 * s, 2 * s, "#f58b84", { opacity: 0.8 });
  });
  return (
    shadow(x, y + 4 * s, 62 * s) +
    rect(x - 12 * s, y - 96 * s, 24 * s, 100 * s, 8 * s, C.woodD) +
    rect(x - 8 * s, y - 96 * s, 8 * s, 98 * s, 4 * s, C.wood, { opacity: 0.6 }) +
    line(`M${n(x)} ${n(y - 96 * s)} q${n(-24 * s)} ${n(-14 * s)} ${n(-30 * s)} ${n(-34 * s)}`, C.woodD, 8 * s) +
    circ(x, y - 150 * s, 58 * s, C.leafD) +
    circ(x - 42 * s, y - 126 * s, 40 * s, C.leaf) +
    circ(x + 44 * s, y - 128 * s, 38 * s, C.leaf) +
    circ(x - 6 * s, y - 178 * s, 34 * s, C.leaf) +
    apples
  );
}

/* ---------- veicoli ---------- */

/** Automobile vista di lato. */
function car(x, y, s = 1, color = "#ee5f5f") {
  const w = 200 * s;
  return (
    ell(x + w / 2, y + 6 * s, w * 0.48, 10 * s, "#2f4459", { opacity: 0.16 }) +
    // carrozzeria
    path(
      `M${n(x)} ${n(y - 26 * s)} q${n(2 * s)} ${n(-14 * s)} ${n(18 * s)} ${n(-16 * s)} l${n(
        26 * s
      )} 0 q${n(12 * s)} ${n(-30 * s)} ${n(38 * s)} ${n(-30 * s)} l${n(46 * s)} 0 q${n(24 * s)} 0 ${n(
        32 * s
      )} ${n(30 * s)} l${n(24 * s)} 0 q${n(14 * s)} ${n(2 * s)} ${n(14 * s)} ${n(16 * s)} l0 ${n(
        12 * s
      )} q0 ${n(8 * s)} ${n(-8 * s)} ${n(8 * s)} l${n(-8 * s)} 0 l${n(-6 * s)} 0 l${n(-6 * s)} 0 l${n(
        -140 * s
      )} 0 l${n(-8 * s)} 0 q${n(-8 * s)} 0 ${n(-8 * s)} ${n(-8 * s)} Z`,
      color
    ) +
    // finestrini
    path(
      `M${n(x + 58 * s)} ${n(y - 42 * s)} l${n(22 * s)} ${n(-24 * s)} l${n(26 * s)} 0 l0 ${n(24 * s)} Z`,
      "#cfeaf8"
    ) +
    path(`M${n(x + 114 * s)} ${n(y - 42 * s)} l0 ${n(-24 * s)} l${n(24 * s)} 0 q${n(16 * s)} ${n(4 * s)} ${n(22 * s)} ${n(24 * s)} Z`, "#cfeaf8") +
    // fanali
    rect(x + w - 14 * s, y - 26 * s, 12 * s, 9 * s, 4, "#ffe38a") +
    rect(x, y - 26 * s, 10 * s, 8 * s, 4, "#f8d0d0") +
    // ruote
    circ(x + 52 * s, y, 20 * s, "#3a4753") +
    circ(x + 52 * s, y, 9 * s, "#b9c4cf") +
    circ(x + 152 * s, y, 20 * s, "#3a4753") +
    circ(x + 152 * s, y, 9 * s, "#b9c4cf")
  );
}

/** Treno a vapore (muso a destra). */
function train(x, y, s = 1) {
  return (
    ell(x + 70 * s, y + 4 * s, 80 * s, 9 * s, "#2f4459", { opacity: 0.15 }) +
    // vagone
    rect(x, y - 54 * s, 76 * s, 44 * s, 8 * s, "#57bf7a") +
    rect(x + 8 * s, y - 46 * s, 22 * s, 20 * s, 4 * s, "#cfeaf8") +
    rect(x + 36 * s, y - 46 * s, 22 * s, 20 * s, 4 * s, "#cfeaf8") +
    rect(x, y - 58 * s, 76 * s, 8 * s, 4 * s, "#3ea363") +
    // caldaia
    rect(x + 74 * s, y - 44 * s, 68 * s, 34 * s, 8 * s, "#ee5f5f") +
    // fumaiolo
    rect(x + 120 * s, y - 74 * s, 16 * s, 32 * s, 6 * s, "#3a4753") +
    rect(x + 116 * s, y - 78 * s, 24 * s, 8 * s, 4 * s, "#546575") +
    // cabina
    rect(x + 140 * s, y - 62 * s, 26 * s, 52 * s, 6 * s, "#d9534f") +
    rect(x + 146 * s, y - 54 * s, 14 * s, 16 * s, 3 * s, "#cfeaf8") +
    // ruote
    circ(x + 22 * s, y, 13 * s, "#3a4753") +
    circ(x + 58 * s, y, 13 * s, "#3a4753") +
    circ(x + 100 * s, y, 16 * s, "#3a4753") +
    circ(x + 132 * s, y, 16 * s, "#3a4753") +
    circ(x + 100 * s, y, 7 * s, "#b9c4cf") +
    circ(x + 132 * s, y, 7 * s, "#b9c4cf") +
    // vapore
    ell(x + 128 * s, y - 96 * s, 13 * s, 11 * s, "#ffffff", { opacity: 0.9 }) +
    ell(x + 145 * s, y - 108 * s, 10 * s, 9 * s, "#ffffff", { opacity: 0.75 }) +
    ell(x + 160 * s, y - 96 * s, 7 * s, 6 * s, "#ffffff", { opacity: 0.6 })
  );
}

/** Nave con due vele. */
function ship(x, y, s = 1) {
  return (
    ell(x + 60 * s, y + 8 * s, 74 * s, 9 * s, "#2f5a7a", { opacity: 0.25 }) +
    // scafo
    path(
      `M${n(x - 6 * s)} ${n(y - 16 * s)} l${n(132 * s)} 0 l${n(-16 * s)} ${n(24 * s)} q${n(-8 * s)} ${n(
        6 * s
      )} ${n(-20 * s)} ${n(6 * s)} l${n(-64 * s)} 0 q${n(-12 * s)} 0 ${n(-18 * s)} ${n(-6 * s)} Z`,
      "#3c5a78"
    ) +
    rect(x + 4 * s, y - 22 * s, 112 * s, 8 * s, 4 * s, "#e3e9ef") +
    // alberi
    line(`M${n(x + 24 * s)} ${n(y - 18 * s)} v${n(-96 * s)}`, "#8d6a45", 6 * s) +
    line(`M${n(x + 82 * s)} ${n(y - 18 * s)} v${n(-112 * s)}`, "#8d6a45", 6 * s) +
    // vele
    poly(
      [
        [x + 27 * s, y - 112 * s],
        [x + 27 * s, y - 26 * s],
        [x + 66 * s, y - 30 * s]
      ],
      "#ffffff"
    ) +
    poly(
      [
        [x + 78 * s, y - 128 * s],
        [x + 78 * s, y - 26 * s],
        [x + 104 * s, y - 26 * s]
      ],
      "#fff8ec"
    ) +
    poly(
      [
        [x + 21 * s, y - 112 * s],
        [x + 21 * s, y - 26 * s],
        [x - 12 * s, y - 30 * s]
      ],
      "#f6bf4a"
    ) +
    poly(
      [
        [x + 78 * s, y - 128 * s],
        [x + 78 * s, y - 22 * s],
        [x + 46 * s, y - 22 * s]
      ],
      "#ee5f5f"
    ) +
    circ(x + 82 * s, y - 134 * s, 4 * s, "#e0574f")
  );
}

/** Ombrello aperto o chiuso. */
function umbrella(x, y, s = 1, open = true, color = "#ee5f5f") {
  if (!open) {
    return (
      path(`M${n(x)} ${n(y)} q${n(4 * s)} ${n(-26 * s)} ${n(2 * s)} ${n(-46 * s)}`, "#8d6a45", {
        stroke: "#8d6a45",
        sw: 4 * s
      }) +
      path(`M${n(x + 2 * s)} ${n(y - 46 * s)} q${n(-2 * s)} ${n(-16 * s)} ${n(-8 * s)} ${n(-20 * s)}`, color, {
        stroke: color,
        sw: 8 * s
      }) +
      line(`M${n(x + 2 * s)} ${n(y - 6 * s)} q${n(-8 * s)} ${n(4 * s)} ${n(-10 * s)} ${n(-4 * s)}`, "#f6bf4a", 5 * s)
    );
  }
  let ribs = "";
  for (let i = 0; i < 3; i++) {
    ribs += line(
      `M${n(x)} ${n(y - 62 * s)} L${n(x - 44 * s + i * 44 * s)} ${n(y - 16 * s)}`,
      "#c94843",
      2 * s,
      { opacity: 0.5 }
    );
  }
  return (
    path(
      `M${n(x - 52 * s)} ${n(y - 16 * s)} Q${n(x - 40 * s)} ${n(y - 70 * s)} ${n(x)} ${n(y - 70 * s)} Q${n(
        x + 40 * s
      )} ${n(y - 70 * s)} ${n(x + 52 * s)} ${n(y - 16 * s)} Z`,
      color
    ) +
    path(
      `M${n(x - 26 * s)} ${n(y - 16 * s)} Q${n(x - 18 * s)} ${n(y - 66 * s)} ${n(x)} ${n(y - 70 * s)} L${n(
        x
      )} ${n(y - 16 * s)} Z`,
      "#ffffff",
      { opacity: 0.22 }
    ) +
    ribs +
    path(
      `M${n(x - 52 * s)} ${n(y - 16 * s)} q${n(6 * s)} ${n(10 * s)} ${n(13 * s)} 0 q${n(6 * s)} ${n(
        10 * s
      )} ${n(13 * s)} 0 q${n(6 * s)} ${n(10 * s)} ${n(13 * s)} 0 q${n(6 * s)} ${n(10 * s)} ${n(13 * s)} 0 q${n(
        6 * s
      )} ${n(10 * s)} ${n(13 * s)} 0`,
      color
    ) +
    line(`M${n(x)} ${n(y - 68 * s)} v${n(58 * s)}`, "#8d6a45", 5 * s) +
    line(`M${n(x)} ${n(y - 10 * s)} q${n(-8 * s)} ${n(6 * s)} ${n(-12 * s)} ${n(-2 * s)}`, "#8d6a45", 5 * s)
  );
}

/* ---------- scuola e arredi ---------- */

/** Lavagna su cavalletto, con disegni a gesso (nessuna lettera). */
function blackboard(x, y, w = 150, h = 110) {
  return (
    rect(x - 8, y - 8, w + 16, h + 16, 8, "#b98b5e") +
    rect(x, y, w, h, 4, "#3f5a48") +
    rect(x + 4, y + 4, w - 8, h - 8, 3, "#4a6b56", { opacity: 0.6 }) +
    // disegni a gesso: sole, collina, fiore
    circ(x + 30, y + 28, 11, "none", { stroke: "#f2f7f4", sw: 3 }) +
    line(`M${n(x + 20)} ${n(y + 58)} q${n(14)} ${n(-14)} ${n(28)} 0`, "#f2f7f4", 3) +
    line(`M${n(x + 70)} ${n(y + 74)} v${n(-22)}`, "#f2f7f4", 3) +
    circ(x + 70, y + 46, 7, "none", { stroke: "#f2f7f4", sw: 3 }) +
    line(`M${n(x + 108)} ${n(y + 70)} h${n(24)}`, "#f2f7f4", 3) +
    rect(x + 88, y + h - 10, 56, 7, 3, "#e0c9a6") +
    // gambe
    line(`M${n(x + 12)} ${n(y + h + 8)} l${n(-10)} ${n(24)}`, "#a97a4e", 7) +
    line(`M${n(x + w - 12)} ${n(y + h + 8)} l${n(10)} ${n(24)}`, "#a97a4e", 7)
  );
}

/** Fornello con pentola e vapore. */
function stove(x, y, s = 1) {
  return (
    rect(x, y - 60 * s, 96 * s, 62 * s, 8 * s, "#dfe6ee") +
    rect(x + 6 * s, y - 44 * s, 84 * s, 34 * s, 6 * s, "#c3ccd6") +
    rect(x + 14 * s, y - 38 * s, 30 * s, 22 * s, 4 * s, "#8d99a6") +
    rect(x + 52 * s, y - 38 * s, 30 * s, 22 * s, 4 * s, "#8d99a6") +
    circ(x + 22 * s, y - 54 * s, 6 * s, "#3a4753") +
    circ(x + 74 * s, y - 54 * s, 6 * s, "#3a4753") +
    // pentola
    rect(x + 18 * s, y - 92 * s, 60 * s, 34 * s, 8 * s, "#ee6a5f") +
    rect(x + 12 * s, y - 96 * s, 72 * s, 10 * s, 5 * s, "#c94843") +
    circ(x + 12 * s, y - 88 * s, 5 * s, "#c94843") +
    circ(x + 84 * s, y - 88 * s, 5 * s, "#c94843") +
    // vapore
    path(`M${n(x + 40 * s)} ${n(y - 100 * s)} q${n(-8 * s)} ${n(-10 * s)} ${n(2 * s)} ${n(-18 * s)}`, "#ffffff", {
      stroke: "#ffffff",
      sw: 4 * s,
      opacity: 0.9
    }) +
    path(`M${n(x + 58 * s)} ${n(y - 100 * s)} q${n(8 * s)} ${n(-10 * s)} ${n(-2 * s)} ${n(-16 * s)}`, "#ffffff", {
      stroke: "#ffffff",
      sw: 4 * s,
      opacity: 0.7
    })
  );
}

/** Lavandino con rubinetto. */
function sink(x, y, s = 1) {
  return (
    rect(x, y - 66 * s, 120 * s, 68 * s, 8 * s, "#e6eef5") +
    rect(x + 6 * s, y - 58 * s, 108 * s, 20 * s, 6 * s, "#cfe0ee") +
    rect(x + 8 * s, y - 24 * s, 104 * s, 20 * s, 6 * s, "#d8e4ee") +
    line(`M${n(x + 16 * s)} ${n(y - 12 * s)} h${n(88 * s)}`, "#b6c6d6", 3 * s) +
    path(
      `M${n(x + 60 * s)} ${n(y - 58 * s)} v${n(-22 * s)} q0 ${n(-8 * s)} ${n(-10 * s)} ${n(-8 * s)}`,
      "#9fb0c0",
      { stroke: "#9fb0c0", sw: 8 * s }
    ) +
    line(`M${n(x + 50 * s)} ${n(y - 84 * s)} v${n(6 * s)}`, "#7fc4e8", 5 * s)
  );
}

/** Banco di lavoro / credenza. */
function counter(x, y, w = 140, s = 1) {
  return (
    rect(x, y - 74 * s, w, 76 * s, 6 * s, "#d9b48a") +
    rect(x, y - 80 * s, w, 12 * s, 4 * s, "#efe2cd") +
    rect(x + 10 * s, y - 60 * s, w - 20 * s, 22 * s, 4 * s, "#c9a67d") +
    rect(x + 10 * s, y - 30 * s, w - 20 * s, 22 * s, 4 * s, "#c9a67d") +
    circ(x + w / 2 - 12 * s, y - 49 * s, 3 * s, "#8d6a45") +
    circ(x + w / 2 + 12 * s, y - 49 * s, 3 * s, "#8d6a45")
  );
}

/** Libro aperto. */
function book(x, y, s = 1, rot = 0) {
  return grp(
    path(
      `M${n(x - 34 * s)} ${n(y - 6 * s)} q${n(18 * s)} ${n(-10 * s)} ${n(34 * s)} ${n(-2 * s)} q${n(16 * s)} ${n(
        -8 * s
      )} ${n(34 * s)} ${n(2 * s)} l0 ${n(16 * s)} q${n(-18 * s)} ${n(-8 * s)} ${n(-34 * s)} ${n(2 * s)} q${n(
        -16 * s
      )} ${n(-10 * s)} ${n(-34 * s)} ${n(-2 * s)} Z`,
      "#ffffff"
    ) +
      line(`M${n(x)} ${n(y - 8 * s)} v${n(20 * s)}`, "#c3ccd6", 3 * s) +
      line(`M${n(x - 26 * s)} ${n(y - 2 * s)} h${n(20 * s)}`, "#c3ccd6", 2.4 * s) +
      line(`M${n(x - 26 * s)} ${n(y + 3 * s)} h${n(20 * s)}`, "#c3ccd6", 2.4 * s) +
      line(`M${n(x + 6 * s)} ${n(y - 2 * s)} h${n(20 * s)}`, "#c3ccd6", 2.4 * s) +
      line(`M${n(x + 6 * s)} ${n(y + 3 * s)} h${n(20 * s)}`, "#c3ccd6", 2.4 * s) +
      path(`M${n(x - 36 * s)} ${n(y - 6 * s)} q${n(20 * s)} ${n(-10 * s)} ${n(36 * s)} ${n(-2 * s)} q${n(16 * s)} ${n(-8 * s)} ${n(36 * s)} ${n(2 * s)} l0 ${n(-6 * s)} q${n(-20 * s)} ${n(-8 * s)} ${n(-36 * s)} ${n(-2 * s)} q${n(-16 * s)} ${n(-8 * s)} ${n(-36 * s)} ${n(2 * s)} Z`, "#f58ba8"),
    `rotate(${rot} ${n(x)} ${n(y)})`
  );
}

/** Giornale piegato. */
function newspaper(x, y, s = 1, rot = 0) {
  let rows = "";
  for (let i = 0; i < 4; i++) {
    rows += line(`M${n(x - 24 * s)} ${n(y - 6 * s + i * 8 * s)} h${n(i === 3 ? 28 * s : 46 * s)}`, "#c3ccd6", 2.6 * s);
  }
  return grp(
    rect(x - 32 * s, y - 28 * s, 64 * s, 46 * s, 4 * s, "#fbf6ec") +
      rect(x - 28 * s, y - 24 * s, 26 * s, 16 * s, 3 * s, "#cfe3f2") +
      line(`M${n(x - 28 * s)} ${n(y - 4 * s)} h${n(56 * s)}`, "#c3ccd6", 2 * s) +
      rows +
      line(`M${n(x)} ${n(y - 28 * s)} v${n(46 * s)}`, "#ded6c8", 2 * s),
    `rotate(${rot} ${n(x)} ${n(y)})`
  );
}

/** Vetro d'acqua con livello. */
function glass(x, y, s = 1, level = 0.6) {
  const h = 52 * s;
  const w = 26 * s;
  const fillH = h * level;
  return (
    path(
      `M${n(x - w / 2)} ${n(y - h)} l${n(w)} 0 l${n(-3 * s)} ${n(h)} q0 ${n(4 * s)} ${n(-4 * s)} ${n(
        4 * s
      )} l${n(-w + 14 * s)} 0 q${n(-4 * s)} 0 ${n(-4 * s)} ${n(-4 * s)} Z`,
      "#e4f1fa"
    ) +
    rect(x - w / 2 + 3 * s, y - fillH - 2 * s, w - 6 * s, fillH, 2 * s, "#7cc0ea") +
    rect(x - w / 2 + 3 * s, y - fillH - 2 * s, w - 6 * s, 3 * s, 2 * s, "#a8d8f2") +
    line(`M${n(x + w / 2 - 2 * s)} ${n(y - h)} l${n(-3 * s)} ${n(h)}`, "#c3ccd6", 2 * s)
  );
}

/** Pagnotta con tagli. */
function bread(x, y, s = 1) {
  return (
    shadow(x, y + 3 * s, 30 * s) +
    path(
      `M${n(x - 32 * s)} ${n(y)} q${n(-4 * s)} ${n(-30 * s)} ${n(32 * s)} ${n(-30 * s)} q${n(36 * s)} 0 ${n(
        32 * s
      )} ${n(30 * s)} Z`,
      "#e6b06a"
    ) +
    path(
      `M${n(x - 26 * s)} ${n(y - 6 * s)} q${n(-2 * s)} ${n(-20 * s)} ${n(26 * s)} ${n(-20 * s)} q${n(28 * s)} 0 ${n(
        26 * s
      )} ${n(20 * s)}`,
      "#f2c98d"
    ) +
    line(`M${n(x - 14 * s)} ${n(y - 22 * s)} l${n(8 * s)} ${n(-8 * s)}`, "#c99154", 4 * s) +
    line(`M${n(x - 1 * s)} ${n(y - 25 * s)} l${n(8 * s)} ${n(-8 * s)}`, "#c99154", 4 * s) +
    line(`M${n(x + 12 * s)} ${n(y - 22 * s)} l${n(8 * s)} ${n(-8 * s)}`, "#c99154", 4 * s)
  );
}

/** Ciotola di zuppa con vapore (freddo = nessun vapore). */
function soupBowl(x, y, s = 1, warm = true) {
  let steam = "";
  if (warm) {
    steam =
      path(`M${n(x - 8 * s)} ${n(y - 26 * s)} q${n(-6 * s)} ${n(-10 * s)} ${n(2 * s)} ${n(-18 * s)}`, "none", {
        stroke: "#ffffff",
        sw: 4 * s
      }) +
      path(`M${n(x + 8 * s)} ${n(y - 26 * s)} q${n(6 * s)} ${n(-10 * s)} ${n(-2 * s)} ${n(-16 * s)}`, "none", {
        stroke: "#ffffff",
        sw: 4 * s
      });
  }
  return (
    shadow(x, y + 4 * s, 34 * s) +
    path(
      `M${n(x - 36 * s)} ${n(y - 18 * s)} q${n(6 * s)} ${n(22 * s)} ${n(36 * s)} ${n(22 * s)} q${n(30 * s)} 0 ${n(
        36 * s
      )} ${n(-22 * s)} Z`,
      "#5aa9e6"
    ) +
    ell(x, y - 18 * s, 36 * s, 10 * s, "#7cc0ea") +
    ell(x, y - 17 * s, 30 * s, 8 * s, "#e8734a") +
    ell(x - 8 * s, y - 18 * s, 6 * s, 2.4 * s, "#f2a06a", { opacity: 0.8 }) +
    steam
  );
}

/** Cappotto appeso al muro. */
function coat(x, y, s = 1, color = "#4a90e2") {
  return (
    circ(x, y - 84 * s, 4 * s, "#c3ccd6") +
    path(
      `M${n(x - 30 * s)} ${n(y - 20 * s)} l${n(6 * s)} ${n(-46 * s)} q${n(2 * s)} ${n(-10 * s)} ${n(10 * s)} ${n(
        -12 * s
      )} l${n(14 * s)} 0 q${n(8 * s)} ${n(2 * s)} ${n(10 * s)} ${n(12 * s)} l${n(6 * s)} ${n(46 * s)} q${n(
        -18 * s
      )} ${n(8 * s)} ${n(-46 * s)} 0 Z`,
      color
    ) +
    path(
      `M${n(x - 6 * s)} ${n(y - 78 * s)} l${n(6 * s)} ${n(14 * s)} l${n(6 * s)} ${n(-14 * s)}`,
      "#ffffff",
      { opacity: 0.5 }
    ) +
    line(`M${n(x)} ${n(y - 64 * s)} v${n(40 * s)}`, "#ffffff", 2.4 * s, { opacity: 0.45 }) +
    circ(x - 16 * s, y - 40 * s, 3 * s, "#f6bf4a") +
    circ(x + 16 * s, y - 40 * s, 3 * s, "#f6bf4a")
  );
}

/** Campanella scolastica. */
function bell(x, y, s = 1) {
  return (
    path(
      `M${n(x - 22 * s)} ${n(y)} q${n(2 * s)} ${n(-26 * s)} ${n(22 * s)} ${n(-26 * s)} q${n(20 * s)} 0 ${n(
        22 * s
      )} ${n(26 * s)} Z`,
      "#f6bf4a"
    ) +
    ell(x, y, 24 * s, 6 * s, "#e8a83a") +
    circ(x, y - 30 * s, 5 * s, "#e8a83a") +
    circ(x, y + 6 * s, 5 * s, "#c99154") +
    line(`M${n(x + 20 * s)} ${n(y - 2 * s)} q${n(14 * s)} ${n(0)} ${n(16 * s)} ${n(10 * s)}`, "#c99154", 4 * s)
  );
}

/** Scuola: edificio con porta e finestre, tetto a due falde. */
function school(x, y, s = 1) {
  const w = 190 * s;
  const h = 120 * s;
  return (
    shadow(x + w / 2, y + 4 * s, w * 0.55) +
    rect(x, y - h, w, h, 6 * s, "#f7e9d3") +
    poly(
      [
        [x - 14 * s, y - h],
        [x + w / 2, y - h - 46 * s],
        [x + w + 14 * s, y - h]
      ],
      "#d9705f"
    ) +
    // porta
    rect(x + w / 2 - 22 * s, y - 54 * s, 44 * s, 54 * s, 4 * s, "#a97a4e") +
    rect(x + w / 2 - 16 * s, y - 48 * s, 32 * s, 20 * s, 3 * s, "#cfe3f2") +
    rect(x + w / 2 - 16 * s, y - 22 * s, 32 * s, 16 * s, 3 * s, "#cfe3f2") +
    circ(x + w / 2 + 14 * s, y - 30 * s, 3 * s, "#f6d47a") +
    // finestre
    rect(x + 14 * s, y - h + 22 * s, 30 * s, 26 * s, 4 * s, "#cfe3f2") +
    rect(x + 54 * s, y - h + 22 * s, 30 * s, 26 * s, 4 * s, "#cfe3f2") +
    rect(x + w - 44 * s, y - h + 22 * s, 30 * s, 26 * s, 4 * s, "#cfe3f2") +
    rect(x + w - 84 * s, y - h + 22 * s, 30 * s, 26 * s, 4 * s, "#cfe3f2") +
    // campanile
    rect(x + w / 2 - 16 * s, y - h - 62 * s, 32 * s, 40 * s, 4 * s, "#f7e9d3") +
    poly(
      [
        [x + w / 2 - 22 * s, y - h - 62 * s],
        [x + w / 2, y - h - 88 * s],
        [x + w / 2 + 22 * s, y - h - 62 * s]
      ],
      "#d9705f"
    )
  );
}

/** Recinto di legno. */
function fence(x, y, w = 200, s = 1) {
  let out = rect(x, y - 40 * s, w, 8 * s, 3 * s, "#e3cba6") + rect(x, y - 22 * s, w, 8 * s, 3 * s, "#e3cba6");
  for (let px = 0; px < w; px += 34 * s) {
    out += rect(x + px, y - 52 * s, 11 * s, 52 * s, 4 * s, "#f0dcc0");
    out += poly(
      [
        [x + px, y - 52 * s],
        [x + px + 5.5 * s, y - 60 * s],
        [x + px + 11 * s, y - 52 * s]
      ],
      "#f0dcc0"
    );
  }
  return out;
}

/** Scivolo con scaletta. */
function slide(x, y, s = 1) {
  return (
    shadow(x + 40 * s, y + 4 * s, 54 * s) +
    line(`M${n(x)} ${n(y)} l${n(0)} ${n(-86 * s)}`, "#8d99a6", 7 * s) +
    line(`M${n(x + 26 * s)} ${n(y)} l${n(0)} ${n(-86 * s)}`, "#8d99a6", 7 * s) +
    line(`M${n(x)} ${n(y - 20 * s)} h${n(26 * s)}`, "#b6c2ce", 5 * s) +
    line(`M${n(x)} ${n(y - 44 * s)} h${n(26 * s)}`, "#b6c2ce", 5 * s) +
    line(`M${n(x)} ${n(y - 68 * s)} h${n(26 * s)}`, "#b6c2ce", 5 * s) +
    rect(x - 6 * s, y - 92 * s, 40 * s, 10 * s, 4 * s, "#f6bf4a") +
    path(
      `M${n(x + 26 * s)} ${n(y - 86 * s)} q${n(46 * s)} ${n(6 * s)} ${n(62 * s)} ${n(86 * s)} l${n(-26 * s)} 0 q${n(
        -8 * s
      )} ${n(-52 * s)} ${n(-40 * s)} ${n(-66 * s)} Z`,
      "#5aa9e6"
    )
  );
}

/** Cavalletto da disegno con foglio e fiore disegnato. */
function easel(x, y, s = 1) {
  return (
    line(`M${n(x)} ${n(y)} l${n(14 * s)} ${n(-96 * s)}`, "#a97a4e", 7 * s) +
    line(`M${n(x + 60 * s)} ${n(y)} l${n(-14 * s)} ${n(-96 * s)}`, "#a97a4e", 7 * s) +
    line(`M${n(x + 30 * s)} ${n(y - 90 * s)} v${n(90 * s)}`, "#c99a66", 6 * s) +
    rect(x - 4 * s, y - 104 * s, 68 * s, 76 * s, 4 * s, "#ffffff") +
    rect(x - 4 * s, y - 104 * s, 68 * s, 76 * s, 4 * s, "none", {}) +
    rect(x - 2 * s, y - 32 * s, 64 * s, 7 * s, 3 * s, "#c99a66") +
    // disegno: un fiore
    circ(x + 30 * s, y - 76 * s, 9 * s, "#f58ba8") +
    circ(x + 30 * s, y - 76 * s, 4 * s, "#f6bf4a") +
    line(`M${n(x + 30 * s)} ${n(y - 64 * s)} v${n(22 * s)}`, "#57bf7a", 3 * s) +
    ell(x + 23 * s, y - 52 * s, 6 * s, 3.4 * s, "#57bf7a") +
    ell(x + 37 * s, y - 46 * s, 6 * s, 3.4 * s, "#57bf7a")
  );
}

/** Cestino di vimini con mele. */
function basket(x, y, s = 1) {
  return (
    shadow(x, y + 3 * s, 30 * s) +
    path(
      `M${n(x - 30 * s)} ${n(y - 26 * s)} l${n(6 * s)} ${n(26 * s)} q${n(2 * s)} ${n(4 * s)} ${n(6 * s)} ${n(
        4 * s
      )} l${n(36 * s)} 0 q${n(4 * s)} 0 ${n(6 * s)} ${n(-4 * s)} l${n(6 * s)} ${n(-26 * s)} Z`,
      "#d8a86a"
    ) +
    line(`M${n(x - 28 * s)} ${n(y - 16 * s)} h${n(56 * s)}`, "#b3813f", 2.6 * s) +
    line(`M${n(x - 26 * s)} ${n(y - 6 * s)} h${n(52 * s)}`, "#b3813f", 2.6 * s) +
    circ(x - 12 * s, y - 30 * s, 9 * s, "#e0574f") +
    circ(x + 4 * s, y - 33 * s, 9 * s, "#e0574f") +
    circ(x + 18 * s, y - 29 * s, 8 * s, "#e0574f") +
    ell(x - 14 * s, y - 34 * s, 3 * s, 2 * s, "#f58b84") +
    ell(x + 2 * s, y - 37 * s, 3 * s, 2 * s, "#f58b84") +
    path(
      `M${n(x - 30 * s)} ${n(y - 26 * s)} a${n(30 * s)} ${n(22 * s)} 0 0 1 ${n(60 * s)} 0`,
      "none",
      { stroke: "#b3813f", sw: 5 * s }
    )
  );
}

/** Bandierine colorate (festa). */
function bunting(x, y, w = 240, s = 1) {
  const colors = ["#ee5f5f", "#f6bf4a", "#57bf7a", "#5aa9e6", "#c39bea"];
  let out = path(`M${n(x)} ${n(y)} q${n(w / 2)} ${n(24 * s)} ${n(w)} 0`, "none", {
    stroke: "#c9a67d",
    sw: 3 * s
  });
  const count = 7;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const px = x + w * t;
    const py = y + Math.sin(Math.PI * t) * 24 * s;
    out += poly(
      [
        [px - 13 * s, py],
        [px + 13 * s, py],
        [px, py + 24 * s]
      ],
      colors[i % colors.length]
    );
  }
  return out;
}

/** Palloncino. */
function balloon(x, y, s = 1, color = "#ee5f5f") {
  return (
    ell(x, y - 26 * s, 16 * s, 20 * s, color) +
    ell(x - 5 * s, y - 32 * s, 4 * s, 5 * s, "#ffffff", { opacity: 0.5 }) +
    poly(
      [
        [x - 4 * s, y - 6 * s],
        [x + 4 * s, y - 6 * s],
        [x, y]
      ],
      color
    ) +
    line(`M${n(x)} ${n(y)} q${n(8 * s)} ${n(14 * s)} ${n(-2 * s)} ${n(26 * s)}`, "#a9b4c0", 2 * s)
  );
}

/** PoZZanghera. */
function puddle(x, y, rx = 40) {
  return (
    ell(x, y, rx, rx * 0.28, "#8fc9ea", { opacity: 0.85 }) +
    ell(x - rx * 0.2, y - rx * 0.06, rx * 0.4, rx * 0.08, "#bfe4f6", { opacity: 0.8 })
  );
}

/** Vortice di vento con foglie. */
function wind(x, y, s = 1) {
  return (
    line(`M${n(x - 60 * s)} ${n(y)} q${n(40 * s)} ${n(-18 * s)} ${n(70 * s)} ${n(-2 * s)} q${n(20 * s)} ${n(10 * s)} ${n(4 * s)} ${n(18 * s)}`, "#cfe0ee", 5 * s) +
    line(`M${n(x - 40 * s)} ${n(y + 24 * s)} q${n(46 * s)} ${n(-14 * s)} ${n(76 * s)} ${n(2 * s)}`, "#cfe0ee", 4 * s, { opacity: 0.8 }) +
    line(`M${n(x - 20 * s)} ${n(y + 46 * s)} q${n(30 * s)} ${n(-10 * s)} ${n(50 * s)} ${n(2 * s)}`, "#cfe0ee", 3.4 * s, { opacity: 0.6 }) +
    ell(x + 34 * s, y - 8 * s, 7 * s, 4 * s, "#8fce6f", { rotate: -26 }) +
    ell(x + 52 * s, y + 12 * s, 6 * s, 3.4 * s, "#f6bf4a", { rotate: 18 })
  );
}

module.exports = {
  room, window: window_, door, rug, cushion, bed, table, chair, armchair,
  plate, plates, bowlMilk, bone, ball, flower, flowerPatch, appleTree,
  car, train, ship, umbrella, blackboard, stove, sink, counter,
  book, newspaper, glass, bread, soupBowl, coat, bell, school,
  fence, slide, easel, basket, bunting, balloon, puddle, wind
};
