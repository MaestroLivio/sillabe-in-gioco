"use strict";
/**
 * Le 40 illustrazioni, una per frase.
 *
 * Ogni scena dichiara:
 *   id    numero del livello (1-40)
 *   sky   colori del cielo di sfondo (o "night")
 *   body  funzione che restituisce il contenuto SVG sovrapposto al fondale
 *
 * Composizione comune: cielo sfumato → colline/prato o parete/pavimento →
 * personaggi e oggetti. Nessun testo: l'illustrazione mostra il significato
 * della frase, non la sua scrittura.
 */
const D = require("./draw");
const P = require("./props");
const {
  W, H, n, C, circ, ell, rect, poly, path, line, grp, shadow,
  GROUP_SKY, NIGHT_SKY, sun, moon, star, cloud, rainCloud,
  hill, meadow, floor, water, street,
  cat, dog, fish, frog, mouse, bird, seagull, butterfly, person
} = D;

/** Cielo + prato: la base più frequente. */
function outdoor(sky = 0, o = {}) {
  return {
    sky: GROUP_SKY[sky],
    body:
      (o.sun === false ? "" : sun(o.sunX === undefined ? 552 : o.sunX, o.sunY === undefined ? 62 : o.sunY, o.sunR || 30)) +
      cloud(120, 62, 1, "#ffffff", 0.9) +
      cloud(330, 44, 0.72, "#ffffff", 0.72) +
      (o.extra || "") +
      meadow(o.horizon || 254)
  };
}

/** Interno: parete e pavimento. */
function indoor(wall = "#fdf3e3", fl = "#e8cfae", o = {}) {
  return {
    sky: ["#fdf3e3", "#f6e7d2"],
    body: P.room(wall, fl, 288) + (o.extra || "")
  };
}

/* ==================================================================
   PERCORSO 1 · Dalla parola alla frase (1-10)
   ================================================================== */

const SCENES = [];

/* 1 · Il gatto beve il latte */
SCENES.push(() => {
  const b = indoor("#fdf1e0", "#ecd3b2");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(438, 56, 104, 88, { curtain: "#f6bf4a" }) +
      P.rug(300, 330, 168, "#f2c8a3") +
      cat(232, 302, 1.12, { pose: "sit", tilt: -6, happy: true }) +
      P.bowlMilk(330, 300, 1.05) +
      ell(348, 286, 5, 3, "#ffffff", { opacity: 0.9 }) +
      ell(362, 292, 3.4, 2.2, "#ffffff", { opacity: 0.75 }) +
      ell(150, 250, 3, 4, "#f6bf4a", { opacity: 0.7 })
  };
});

/* 2 · La mamma lava i piatti */
SCENES.push(() => {
  const b = indoor("#eaf4fb", "#dfe6ee");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(60, 48, 96, 80, { curtain: "#7fb2e6" }) +
      P.sink(56, 300, 1.3) +
      // piatti che si asciugano
      P.plates(214, 292, 1) +
      // bolle di sapone
      circ(196, 214, 9, "#bfe4f6", { opacity: 0.85 }) +
      circ(228, 196, 6, "#d8f0fa", { opacity: 0.8 }) +
      circ(252, 224, 4.4, "#e4f5fc", { opacity: 0.75 }) +
      circ(176, 186, 5, "#d8f0fa", { opacity: 0.7 }) +
      person({
        x: 402, y: 302, s: 1.02, hairStyle: "bun", hair: C.hair.brown,
        shirt: C.cloth.pink, pants: C.cloth.blue, pose: "hold"
      }) +
      P.counter(496, 300, 116, 1) +
      P.plate(552, 292, 1) +
      P.plate(556, 280, 0.94)
  };
});

/* 3 · Il cane mangia l'osso */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 78, sunY: 58, sunR: 26 });
  return {
    sky: b.sky,
    body:
      b.body +
      P.flowerPatch(96, 330, 1) +
      P.flowerPatch(560, 316, 0.9) +
      dog(300, 304, 1.24, { pose: "sit" }) +
      P.bone(392, 300, 1.15, -12) +
      P.bone(112, 288, 0.8, 18) +
      ell(378, 268, 3, 2, "#ffffff", { opacity: 0.7 })
  };
});

/* 4 · Il bimbo apre la porta */
SCENES.push(() => {
  const b = indoor("#fdf6ea", "#e6cbab");
  return {
    sky: b.sky,
    body:
      b.body +
      P.door(392, 112, 116, 176, { open: true, color: "#cf9a63" }) +
      // luce che viene dal corridoio
      poly(
        [[392, 288], [508, 288], [560, 344], [356, 344]],
        "#fff6dd",
        { opacity: 0.55 }
      ) +
      P.rug(250, 336, 130, "#c8e0f2") +
      P.window(96, 52, 92, 78, { curtain: "#57bf7a" }) +
      person({
        x: 268, y: 304, s: 1.06, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.yellow, pants: C.cloth.blue, pose: "walk"
      }) +
      // maniglia + segno di apertura
      line(`M${n(500)} ${n(202)} q${n(26)} ${n(-6)} ${n(30)} ${n(-22)}`, "#8fa3b8", 4, { dash: "8 7" })
  };
});

/* 5 · La nonna cucina la torta */
SCENES.push(() => {
  const b = indoor("#fdf0e2", "#e9d0ae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(72, 50, 96, 80, { curtain: "#f58ba8" }) +
      P.stove(430, 302, 1.26) +
      person({
        x: 300, y: 304, s: 1.06, hairStyle: "bun", hair: C.hair.grey,
        shirt: C.cloth.purple, pants: C.cloth.navy, skirt: true,
        pose: "cook", glasses: true
      }) +
      // torta sul tavolo
      P.counter(64, 300, 132, 1) +
      rect(108, 250, 44, 34, 6, "#f2c98d") +
      rect(108, 242, 44, 12, 5, "#fff0d4") +
      circ(130, 236, 6, "#e0574f") +
      ell(130, 284, 30, 7, "#ffffff") +
      // vassoio con ingredienti
      ell(200, 292, 16, 5, "#ffffff") +
      circ(196, 286, 5, "#f6bf4a") +
      circ(208, 287, 4, "#e0574f")
  };
});

/* 6 · Il sole scalda i prati */
SCENES.push(() => {
  const b = outdoor(1, { sun: false });
  return {
    sky: ["#cfeaff", "#ffe7b8"],
    body:
      b.body +
      sun(320, 104, 52) +
      // raggi lunghi che scaldano il prato
      line(`M${n(320)} ${n(160)} L${n(180)} ${n(262)}`, "#ffe08a", 6, { opacity: 0.45 }) +
      line(`M${n(320)} ${n(160)} L${n(320)} ${n(268)}`, "#ffe08a", 6, { opacity: 0.45 }) +
      line(`M${n(320)} ${n(160)} L${n(462)} ${n(262)}`, "#ffe08a", 6, { opacity: 0.45 }) +
      P.flowerPatch(150, 326, 1.15) +
      P.flowerPatch(500, 320, 1.1) +
      P.flowerPatch(330, 340, 0.9) +
      ell(320, 302, 90, 12, "#ffe9a8", { opacity: 0.45 })
  };
});

/* 7 · La rana salta nel lago */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#bfe7d6"],
    body:
      sun(70, 58, 26) +
      cloud(250, 54, 0.8) +
      cloud(430, 68, 0.62, "#ffffff", 0.75) +
      hill(232, "#8fd694", 22, 1) +
      water(246) +
      // canneti
      line(`M${n(74)} ${n(252)} q${n(-6)} ${n(-38)} ${n(4)} ${n(-62)}`, "#4ea24d", 5) +
      line(`M${n(96)} ${n(252)} q${n(8)} ${n(-34)} ${n(-2)} ${n(-54)}`, "#5cc47f", 5) +
      line(`M${n(560)} ${n(252)} q${n(-8)} ${n(-36)} ${n(2)} ${n(-58)}`, "#4ea24d", 5) +
      // ninfea
      ell(520, 286, 34, 12, "#5cc47f") +
      ell(520, 284, 22, 7, "#78d495", { opacity: 0.7 }) +
      P.flower(520, 284, 0.7, "#f58ba8") +
      // rana in salto
      frog(300, 214, 1.05) +
      // schizzi
      line(`M${n(372)} ${n(250)} q${n(-10)} ${n(-16)} ${n(-4)} ${n(-26)}`, "#bfe4f6", 5, { opacity: 0.9 }) +
      ell(352, 236, 6, 4, "#d8f0fa", { opacity: 0.9 }) +
      ell(392, 228, 4, 3, "#d8f0fa", { opacity: 0.8 }) +
      ell(300, 300, 40, 9, "#bfe4f6", { opacity: 0.5 })
  };
});

/* 8 · Il pesce nuota nel mare */
SCENES.push(() => {
  let bubbles = "";
  const bpos = [[232, 200, 5], [252, 176, 4], [222, 156, 3], [270, 142, 3.4], [210, 128, 2.6]];
  bpos.forEach(([bx, by, br]) => { bubbles += circ(bx, by, br, "#d8f0fa", { opacity: 0.7 }); });
  let weed = "";
  [90, 130, 520, 560].forEach((wx, i) => {
    weed +=
      path(
        `M${n(wx)} ${n(316)} q${n(i % 2 ? 18 : -18)} ${n(-26)} 0 ${n(-52)} q${n(i % 2 ? -16 : 16)} ${n(-22)} 0 ${n(-44)}`,
        "none",
        { stroke: i % 2 ? "#4ea24d" : "#3ea363", sw: 8 }
      );
  });
  return {
    sky: ["#7fd0f0", "#1f6a94"],
    body:
      // raggi di luce dall'alto
      poly([[150, 0], [250, 0], [130, 340], [40, 340]], "#ffffff", { opacity: 0.12 }) +
      poly([[330, 0], [400, 0], [330, 340], [255, 340]], "#ffffff", { opacity: 0.09 }) +
      rect(-10, 306, 660, 70, 0, "#f3e0ba") +
      path(`M-10 306 q80 -18 160 0 t160 0 t160 0 t160 0 L660 380 L-10 380 Z`, "#e8d0a4", { opacity: 0.7 }) +
      weed +
      fish(300, 210, 1.5, { color: "#f2884b", dark: "#d96a2f" }) +
      fish(150, 250, 0.7, { color: "#5aa9e6", dark: "#3f8ec7" }) +
      fish(470, 268, 0.8, { color: "#f6bf4a", dark: "#e0a83a" }) +
      bubbles
  };
});

/* 9 · Il gatto dorme sul letto */
SCENES.push(() => {
  const b = indoor("#edf5fc", "#e2d3bd");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(430, 48, 100, 84, { curtain: "#7fb2e6" }) +
      P.rug(300, 340, 170, "#c8d8e8") +
      P.bed(150, 300, 1.36, { duvet: "#7fb2e6", pillow: "#ffffff" }) +
      cat(300, 250, 0.92, { pose: "sleep", color: "#f0a355", dark: "#d9863c" }) +
      // luna sul comodino
      P.table(430, 300, 76, 0.9) +
      circ(468, 258, 11, "#f6d47a") +
      circ(468, 258, 11, "#f6d47a", { opacity: 0.35 }) +
      line(`M${n(468)} ${n(250)} v${n(8)}`, "#c99154", 4) +
      // "zzz" reso come nuvolette
      cloud(230, 176, 0.34, "#ffffff", 0.8) +
      cloud(268, 148, 0.24, "#ffffff", 0.7)
  };
});

/* 10 · La mamma legge un libro */
SCENES.push(() => {
  const b = indoor("#fdf3e6", "#e8cfae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(58, 46, 96, 82, { curtain: "#57bf7a" }) +
      P.armchair(408, 300, 1.4, "#8fb8d8") +
      P.rug(290, 336, 160, "#f2c8a3") +
      person({
        x: 286, y: 302, s: 1.06, hairStyle: "long", hair: C.hair.brown,
        shirt: C.cloth.teal, pants: C.cloth.navy, pose: "hold", glasses: true
      }) +
      P.book(324, 240, 1.05, -4) +
      // libreria sullo sfondo
      rect(556, 130, 62, 158, 6, "#c99a66") +
      rect(562, 138, 50, 42, 3, "#a97a4e") +
      rect(562, 188, 50, 42, 3, "#a97a4e") +
      rect(562, 238, 50, 42, 3, "#a97a4e") +
      rect(566, 144, 8, 30, 2, "#ee5f5f") +
      rect(578, 142, 8, 32, 2, "#57bf7a") +
      rect(590, 146, 8, 28, 2, "#f6bf4a") +
      rect(566, 194, 8, 30, 2, "#5aa9e6") +
      rect(578, 196, 8, 28, 2, "#c39bea")
  };
});

/* ==================================================================
   PERCORSO 2 · Frasi semplici (11-20)
   ================================================================== */

/* 11 · Il cane gioca con la palla */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 88, sunY: 56, sunR: 28 });
  return {
    sky: b.sky,
    body:
      b.body +
      dog(230, 300, 1.2, { pose: "jump", color: "#c98a5a" }) +
      P.ball(392, 288, 30, "#ee5f5f", "#f6bf4a") +
      line(`M${n(352)} ${n(250)} q${n(-22)} ${n(6)} ${n(-34)} ${n(-2)}`, "#a9b4c0", 4, { opacity: 0.5 }) +
      P.flowerPatch(520, 322, 1.05) +
      P.flowerPatch(96, 336, 0.9)
  };
});

/* 12 · La bambina disegna un fiore */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 560, sunY: 58, sunR: 26 });
  return {
    sky: b.sky,
    body:
      b.body +
      P.easel(316, 296, 1.34) +
      person({
        x: 200, y: 302, s: 1.0, hairStyle: "long", hair: C.hair.blond,
        shirt: C.cloth.pink, pants: C.cloth.blue, skirt: true, pose: "hold"
      }) +
      // matita in mano
      line(`M${n(232)} ${n(268)} l${n(16)} ${n(-14)}`, "#f6bf4a", 4) +
      P.flowerPatch(92, 328, 1.1) +
      P.flowerPatch(548, 316, 1)
  };
});

/* 13 · Il papà guida la macchina rossa */
SCENES.push(() => {
  return {
    sky: ["#cfe8fb", "#eaf4ff"],
    body:
      sun(88, 54, 26) +
      cloud(240, 48, 0.8) +
      cloud(470, 58, 0.6, "#ffffff", 0.7) +
      // palazzi sullo sfondo
      rect(20, 150, 62, 120, 4, "#cbd7e3") +
      rect(92, 118, 54, 152, 4, "#d8e2ec") +
      rect(470, 138, 66, 132, 4, "#cbd7e3") +
      rect(552, 162, 62, 108, 4, "#d8e2ec") +
      rect(30, 166, 12, 14, 2, "#a9bccf") +
      rect(52, 166, 12, 14, 2, "#a9bccf") +
      rect(30, 192, 12, 14, 2, "#a9bccf") +
      rect(52, 192, 12, 14, 2, "#a9bccf") +
      rect(102, 134, 12, 14, 2, "#a9bccf") +
      rect(124, 134, 12, 14, 2, "#a9bccf") +
      rect(102, 160, 12, 14, 2, "#a9bccf") +
      rect(124, 160, 12, 14, 2, "#a9bccf") +
      street(282) +
      P.car(206, 292, 1.03, "#ee5f5f") +
      // papà al volante
      circ(288, 250, 12, C.skin.a) +
      path(`M${n(276)} ${n(250)} a${n(12)} ${n(12)} 0 0 1 ${n(24)} 0 Z`, C.hair.brown) +
      circ(284, 250, 2, C.ink) +
      circ(292, 250, 2, C.ink) +
      line(`M${n(284)} ${n(256)} q${n(4)} ${n(3)} ${n(8)} 0`, C.ink, 2) +
      // alberi ai lati
      circ(600, 250, 26, C.leafD) +
      rect(596, 250, 9, 32, 3, C.woodD)
  };
});

/* 14 · I bambini giocano nel cortile */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#cfeedd"],
    body:
      sun(72, 52, 26) +
      cloud(250, 46, 0.8) +
      cloud(470, 56, 0.6, "#ffffff", 0.7) +
      // edificio scolastico sullo sfondo
      P.school(392, 250, 0.66) +
      P.fence(20, 268, 200, 0.9) +
      meadow(252) +
      P.ball(320, 296, 26, "#f6bf4a", "#ee5f5f") +
      person({
        x: 214, y: 306, s: 0.94, hairStyle: "short", hair: C.hair.black,
        shirt: C.cloth.red, pants: C.cloth.navy, pose: "arms"
      }) +
      person({
        x: 428, y: 306, s: 0.9, hairStyle: "curly", hair: C.hair.brown,
        shirt: C.cloth.green, pants: C.cloth.blue, pose: "wave"
      }) +
      P.flowerPatch(548, 330, 0.95) +
      line(`M${n(268)} ${n(262)} q${n(20)} ${n(-6)} ${n(40)} ${n(2)}`, "#a9b4c0", 3.4, { opacity: 0.45 })
  };
});

/* 15 · La maestra scrive alla lavagna */
SCENES.push(() => {
  const b = indoor("#f3f7fb", "#dfe6ee");
  return {
    sky: b.sky,
    body:
      b.body +
      P.blackboard(376, 76, 168, 118) +
      // banchi in primo piano
      rect(20, 250, 120, 12, 5, "#cf9a63") +
      rect(24, 262, 8, 32, 3, "#a97a4e") +
      rect(128, 262, 8, 32, 3, "#a97a4e") +
      rect(20, 222, 120, 10, 4, "#e0b183") +
      person({
        x: 268, y: 302, s: 1.04, hairStyle: "bun", hair: C.hair.red,
        shirt: C.cloth.purple, pants: C.cloth.navy, skirt: true,
        pose: "wave", glasses: true
      }) +
      // gesso in mano
      line(`M${n(298)} ${n(262)} l${n(14)} ${n(-10)}`, "#ffffff", 5)
  };
});

/* 16 · Il gatto insegue il topolino */
SCENES.push(() => {
  const b = indoor("#fdf3e6", "#e8cfae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(60, 48, 92, 80, { curtain: "#f6bf4a" }) +
      P.rug(320, 330, 176, "#e8d3f5") +
      cat(196, 300, 1.06, { pose: "sit", tilt: 10 }) +
      mouse(432, 302, 1.1) +
      // scie di movimento
      line(`M${n(258)} ${n(268)} h${n(46)}`, "#a9b4c0", 4, { opacity: 0.5, dash: "10 9" }) +
      line(`M${n(258)} ${n(288)} h${n(38)}`, "#a9b4c0", 4, { opacity: 0.4, dash: "10 9" }) +
      line(`M${n(180)} ${n(210)} q${n(14)} ${n(-10)} ${n(28)} ${n(2)}`, "#a9b4c0", 3.4, { opacity: 0.45 }) +
      // formaggino
      poly(
        [[492, 296], [540, 296], [516, 268]],
        "#f6d47a"
      ) +
      circ(508, 288, 4, "#e0b183") +
      circ(524, 284, 3, "#e0b183")
  };
});

/* 17 · Il contadino raccoglie le mele */
SCENES.push(() => {
  const b = outdoor(1, { sun: false });
  return {
    sky: ["#e6f6e2", "#cfe9d6"],
    body:
      b.body +
      sun(84, 54, 26) +
      P.appleTree(432, 306, 1.12) +
      person({
        x: 250, y: 306, s: 1.02, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.green, pants: C.cloth.navy, pose: "wave", hat: "straw"
      }) +
      P.basket(340, 300, 1.05) +
      // mela in mano
      circ(292, 240, 8, "#e0574f") +
      line(`M${n(292)} ${n(232)} q${n(2)} ${n(-6)} ${n(6)} ${n(-6)}`, "#5cc47f", 3) +
      P.flowerPatch(140, 332, 0.95)
  };
});

/* 18 · La pioggia bagna i fiori del giardino */
SCENES.push(() => {
  return {
    sky: ["#bccfdd", "#dfe8ef"],
    body:
      rainCloud(150, 34, 1.05) +
      rainCloud(400, 26, 0.9) +
      rainCloud(560, 46, 0.7) +
      hill(232, "#8fd694", 20, 0.9) +
      meadow(248) +
      P.fence(20, 276, 130, 0.78) +
      P.flowerPatch(210, 320, 1.15) +
      P.flowerPatch(330, 336, 1.05) +
      P.flowerPatch(470, 316, 1.1) +
      P.puddle(160, 348, 44) +
      P.puddle(420, 352, 38) +
      // gocce che cadono sui petali
      line(`M${n(204)} ${n(276)} l${n(-3)} ${n(12)}`, "#7cc4ea", 4) +
      line(`M${n(336)} ${n(286)} l${n(-3)} ${n(12)}`, "#7cc4ea", 4) +
      line(`M${n(474)} ${n(272)} l${n(-3)} ${n(12)}`, "#7cc4ea", 4)
  };
});

/* 19 · Il treno arriva alla stazione */
SCENES.push(() => {
  return {
    sky: ["#cfe4f5", "#e8f1f8"],
    body:
      sun(80, 50, 24) +
      cloud(250, 42, 0.72) +
      cloud(470, 54, 0.58, "#ffffff", 0.7) +
      // pensilina della stazione
      rect(40, 92, 300, 12, 4, "#d9705f") +
      rect(40, 104, 300, 8, 3, "#f0dcc0") +
      line(`M${n(58)} ${n(112)} v${n(96)}`, "#b6c2ce", 7) +
      line(`M${n(322)} ${n(112)} v${n(96)}`, "#b6c2ce", 7) +
      rect(60, 128, 46, 34, 4, "#cfe3f2") +
      rect(240, 128, 46, 34, 4, "#cfe3f2") +
      // marciapiede
      rect(-10, 296, 660, 16, 0, "#c8ccd2") +
      rect(-10, 312, 660, 60, 0, "#8d949c") +
      line(`M20 336 h60`, "#f4f6f8", 6, { dash: "26 22" }) +
      line(`M-10 296 h660`, "#b0b7be", 4) +
      // binari
      line(`M-10 288 h660`, "#7c848c", 6) +
      P.train(150, 288, 1.28) +
      // segnale
      line(`M${n(560)} ${n(288)} v${n(-72)}`, "#8d99a6", 7) +
      circ(560, 210, 11, "#57bf7a") +
      circ(560, 210, 5, "#ffffff", { opacity: 0.6 })
  };
});

/* 20 · La farfalla vola sopra il prato */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 78, sunY: 54, sunR: 28 });
  return {
    sky: b.sky,
    body:
      b.body +
      P.flowerPatch(120, 330, 1.1) +
      P.flowerPatch(300, 344, 0.95) +
      P.flowerPatch(510, 328, 1.05) +
      butterfly(320, 176, 1.5, { c1: "#f58ba8", c2: "#f6bf4a", rotate: -8 }) +
      butterfly(452, 132, 0.85, { c1: "#c39bea", c2: "#5aa9e6", rotate: 12 }) +
      // scia del volo
      line(`M${n(180)} ${n(268)} q${n(40)} ${n(-30)} ${n(96)} ${n(-56)}`, "#ffffff", 4, {
        opacity: 0.6,
        dash: "9 12"
      })
  };
});

/* ==================================================================
   PERCORSO 3 · Frasi coordinate (21-30)
   ================================================================== */

/* 21 · Il gatto dorme e il cane abbaia */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#cfeedd"],
    body:
      sun(320, 42, 22) +
      cloud(120, 54, 0.7) +
      cloud(520, 50, 0.66, "#ffffff", 0.75) +
      meadow(250) +
      P.cushion(168, 300, 1.25) +
      cat(168, 288, 0.9, { pose: "sleep" }) +
      cloud(112, 216, 0.3, "#ffffff", 0.75) +
      cloud(146, 194, 0.22, "#ffffff", 0.65) +
      dog(462, 302, 1.2, { pose: "bark", color: "#c98a5a" }) +
      P.flowerPatch(300, 330, 1)
  };
});

/* 22 · La mamma cucina e il papà apparecchia */
SCENES.push(() => {
  const b = indoor("#fdf1e4", "#e9d0ae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(270, 48, 96, 80, { curtain: "#f6bf4a" }) +
      P.stove(56, 300, 1.08) +
      person({
        x: 196, y: 302, s: 0.98, hairStyle: "bun", hair: C.hair.brown,
        shirt: C.cloth.pink, pants: C.cloth.navy, skirt: true, pose: "cook"
      }) +
      P.table(360, 300, 168, 1) +
      P.plate(408, 288, 1) +
      P.plate(486, 288, 1) +
      P.glass(500, 288, 0.9, 0.5) +
      P.plate(342, 288, 0.86) +
      person({
        x: 584, y: 302, s: 0.98, hairStyle: "short", hair: C.hair.black,
        shirt: C.cloth.blue, pants: C.cloth.navy, pose: "hold"
      }) +
      P.plate(556, 276, 0.8)
  };
});

/* 23 · Piove forte ma il bambino esce */
SCENES.push(() => {
  return {
    sky: ["#9fb4c6", "#c6d5e0"],
    body:
      rainCloud(140, 26, 1.2) +
      rainCloud(400, 20, 1.05) +
      rainCloud(560, 40, 0.8) +
      // pioggia fitta
      (() => {
        let r = "";
        for (let i = 0; i < 16; i++) {
          const rx = 20 + i * 40;
          const ry = 120 + (i % 4) * 26;
          r += line(`M${n(rx)} ${n(ry)} l${n(-5)} ${n(20)}`, "#7cb6d8", 5, { opacity: 0.75 });
        }
        return r;
      })() +
      meadow(258) +
      P.puddle(140, 352, 52) +
      P.puddle(520, 348, 48) +
      person({
        x: 322, y: 306, s: 1.06, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.yellow, pants: C.cloth.blue, pose: "walk"
      }) +
      P.umbrella(322, 236, 1.15, true, "#ee5f5f") +
      // stivaletti
      ell(300, 306, 12, 6, "#3c5a78") +
      ell(342, 306, 12, 6, "#3c5a78")
  };
});

/* 24 · Il topo corre e il gatto lo insegue */
SCENES.push(() => {
  const b = indoor("#fdf3e6", "#e8cfae");
  return {
    sky: b.sky,
    body:
      b.body +
      // zoccolo sul muro
      rect(-10, 300, 660, 12, 0, "#e2cba9") +
      mouse(468, 302, 1.16) +
      cat(252, 302, 1.08, { pose: "sit", tilt: 12 }) +
      // scie di corsa
      line(`M${n(332)} ${n(266)} h${n(54)}`, "#a9b4c0", 4.4, { opacity: 0.5, dash: "11 9" }) +
      line(`M${n(316)} ${n(288)} h${n(48)}`, "#a9b4c0", 4.4, { opacity: 0.4, dash: "11 9" }) +
      line(`M${n(552)} ${n(276)} h${n(46)}`, "#a9b4c0", 4, { opacity: 0.45, dash: "10 8" }) +
      line(`M${n(560)} ${n(292)} h${n(34)}`, "#a9b4c0", 4, { opacity: 0.35, dash: "10 8" }) +
      P.rug(360, 336, 160, "#d8e8f5")
  };
});

/* 25 · La luna sorge e le stelle brillano */
SCENES.push(() => {
  let stars = "";
  const sp = [[80, 54, 5], [150, 96, 3.4], [232, 40, 4.2], [300, 78, 3], [372, 46, 5], [438, 96, 3.4], [500, 36, 4.4], [566, 82, 3.6], [40, 120, 3], [596, 140, 3]];
  sp.forEach(([sx, sy, sr]) => { stars += star(sx, sy, sr); });
  return {
    sky: NIGHT_SKY,
    body:
      stars +
      moon(180, 250, 46) +
      // onde di luce della luna
      ell(180, 250, 74, 74, "#fff4c9", { opacity: 0.12 }) +
      hill(268, "#2f4a52", 24, 1) +
      hill(300, "#26404a", 16, 1) +
      // alberi scuri
      poly([[520, 320], [546, 262], [572, 320]], "#1f353d") +
      poly([[556, 320], [578, 274], [600, 320]], "#1b2f36") +
      rect(542, 316, 8, 18, 3, "#1f353d") +
      rect(574, 312, 8, 20, 3, "#1b2f36") +
      star(316, 168, 7, "#ffe27a", { opacity: 0.9 })
  };
});

/* 26 · Il vento soffia poi arriva la pioggia */
SCENES.push(() => {
  return {
    sky: ["#a9c4d6", "#d2dfe7"],
    body:
      // vento a sinistra
      P.wind(180, 150, 1.25) +
      P.wind(150, 214, 0.9) +
      // pioggia in arrivo da destra
      rainCloud(486, 40, 1.15) +
      (() => {
        let r = "";
        for (let i = 0; i < 7; i++) {
          r += line(`M${n(430 + i * 26)} ${n(108 + (i % 3) * 16)} l${n(-6)} ${n(22)}`, "#7cb6d8", 5, { opacity: 0.8 });
        }
        return r;
      })() +
      hill(250, "#8fd694", 22, 0.95) +
      meadow(264) +
      // foglie portate dal vento
      ell(300, 186, 9, 5, "#8fce6f", { rotate: -24 }) +
      ell(340, 156, 8, 4.4, "#f6bf4a", { rotate: 16 }) +
      ell(268, 128, 7, 4, "#8fce6f", { rotate: 30 }) +
      P.flowerPatch(120, 330, 1) +
      P.flowerPatch(430, 336, 1.05)
  };
});

/* 27 · Il bimbo ride e la mamma sorride */
SCENES.push(() => {
  const b = indoor("#fff6e6", "#ecd6b8");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(430, 46, 100, 84, { curtain: "#f6bf4a" }) +
      P.rug(320, 340, 190, "#ffe0c9") +
      person({
        x: 214, y: 306, s: 0.98, hairStyle: "short", hair: C.hair.blond,
        shirt: C.cloth.blue, pants: C.cloth.green, pose: "laugh"
      }) +
      person({
        x: 430, y: 306, s: 1.06, hairStyle: "long", hair: C.hair.brown,
        shirt: C.cloth.pink, pants: C.cloth.navy, skirt: true, pose: "wave"
      }) +
      // cuoricini
      path(`M${n(316)} ${n(186)} c${n(-6)} ${n(-9)} ${n(-19)} ${n(-2)} 0 ${n(13)} c${n(19)} ${n(-15)} ${n(6)} ${n(-22)} 0 ${n(-13)} Z`, "#f58ba8", { opacity: 0.9 }) +
      path(`M${n(356)} ${n(158)} c${n(-4)} ${n(-6)} ${n(-13)} ${n(-1)} 0 ${n(9)} c${n(13)} ${n(-10)} ${n(4)} ${n(-15)} 0 ${n(-9)} Z`, "#f58ba8", { opacity: 0.7 })
  };
});

/* 28 · Il pane è pronto ma la zuppa è fredda */
SCENES.push(() => {
  const b = indoor("#f4f7fa", "#e4d8c4");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(56, 46, 96, 80, { curtain: "#7fb2e6" }) +
      P.rug(320, 342, 180, "#d8e8f5") +
      P.table(200, 302, 220, 1.1) +
      P.bread(258, 288, 1.28) +
      // tovagliolo
      ell(258, 292, 42, 9, "#ffffff") +
      P.soupBowl(388, 288, 1.05, false) +
      // fiocchi di freddo sopra la zuppa
      line(`M${n(378)} ${n(252)} h${n(20)}`, "#9fd2ef", 3) +
      line(`M${n(388)} ${n(242)} v${n(20)}`, "#9fd2ef", 3) +
      line(`M${n(381)} ${n(245)} l${n(14)} ${n(14)}`, "#9fd2ef", 2.6) +
      line(`M${n(395)} ${n(245)} l${n(-14)} ${n(14)}`, "#9fd2ef", 2.6) +
      line(`M${n(420)} ${n(250)} h${n(14)}`, "#9fd2ef", 2.6, { opacity: 0.7 }) +
      // vassoio del pane
      rect(204, 288, 108, 8, 4, "#c99a66")
  };
});

/* 29 · Il cane salta e la palla rotola */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#cfeedd"],
    body:
      sun(76, 54, 26) +
      cloud(250, 46, 0.78) +
      cloud(480, 58, 0.6, "#ffffff", 0.7) +
      meadow(252) +
      dog(240, 292, 1.16, { pose: "jump", color: "#c98a5a" }) +
      P.ball(420, 292, 26, "#5aa9e6", "#f6bf4a") +
      // palla che rotola: archi di movimento
      line(`M${n(372)} ${n(282)} q${n(18)} ${n(-14)} ${n(36)} ${n(-2)}`, "#a9b4c0", 4, { opacity: 0.5, dash: "9 8" }) +
      line(`M${n(444)} ${n(282)} q${n(18)} ${n(10)} ${n(34)} ${n(2)}`, "#a9b4c0", 4, { opacity: 0.4, dash: "9 8" }) +
      line(`M${n(276)} ${n(210)} q${n(-10)} ${n(-14)} ${n(0)} ${n(-22)}`, "#a9b4c0", 3.4, { opacity: 0.5 }) +
      P.flowerPatch(560, 330, 0.95)
  };
});

/* 30 · La nave parte e il gabbiano vola */
SCENES.push(() => {
  return {
    sky: ["#bfe4f7", "#e8f4fb"],
    body:
      sun(560, 56, 30) +
      cloud(140, 52, 0.8) +
      cloud(300, 38, 0.6, "#ffffff", 0.7) +
      // mare
      rect(-10, 246, 660, 120, 0, "#4fa8d8") +
      (() => {
        let w = "";
        for (let i = 0; i < 4; i++) {
          const wy = 266 + i * 28;
          w += line(`M40 ${wy} q26 -10 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0`, "#2f8cbd", 5, { opacity: 0.4 - i * 0.06 });
        }
        return w;
      })() +
      P.ship(96, 268, 1.16) +
      seagull(452, 128, 1.4) +
      seagull(548, 96, 0.95) +
      // scia della nave
      line(`M${n(40)} ${n(292)} q${n(-20)} ${n(4)} ${n(-34)} ${n(1)}`, "#ffffff", 6, { opacity: 0.7 })
  };
});

/* ==================================================================
   PERCORSO 4 · Frasi complesse (31-40)
   ================================================================== */

/* 31 · Quando piove il bambino apre l'ombrello */
SCENES.push(() => {
  return {
    sky: ["#9aa9b8", "#c2cfda"],
    body:
      rainCloud(120, 24, 1.1) +
      rainCloud(380, 18, 0.95) +
      rainCloud(548, 38, 0.72) +
      meadow(260) +
      P.puddle(180, 350, 46) +
      person({
        x: 330, y: 306, s: 1.08, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.purple, pants: C.cloth.navy, pose: "wave"
      }) +
      P.umbrella(330, 242, 1.25, true, "#5aa9e6") +
      // gocce fermate sull'ombrello
      ell(300, 200, 3, 5, "#bfe4f6", { opacity: 0.9 }) +
      ell(352, 194, 3, 5, "#bfe4f6", { opacity: 0.85 }) +
      ell(372, 214, 3, 5, "#bfe4f6", { opacity: 0.8 })
  };
});

/* 32 · Se il sole splende i fiori si aprono */
SCENES.push(() => {
  let rays = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    rays += line(
      `M${n(200 + Math.cos(a) * 66)} ${n(110 + Math.sin(a) * 66)} L${n(200 + Math.cos(a) * 104)} ${n(110 + Math.sin(a) * 104)}`,
      "#ffe08a", 6, { opacity: 0.5 }
    );
  }
  return {
    sky: ["#cfeeff", "#fff0c4"],
    body:
      sun(200, 110, 44) +
      rays +
      cloud(400, 46, 0.7) +
      cloud(552, 70, 0.55, "#ffffff", 0.65) +
      meadow(250) +
      // fiori aperti con petali grandi
      P.flower(120, 330, 1.3, "#f58ba8") +
      P.flower(300, 340, 1.45, "#f6bf4a", "#f2884b") +
      P.flower(480, 326, 1.25, "#c39bea", "#f6bf4a") +
      P.flower(580, 344, 1, "#ee5f5f", "#f6bf4a") +
      P.fence(20, 288, 120, 0.7)
  };
});

/* 33 · Perché è tardi il bimbo va a letto */
SCENES.push(() => {
  return {
    sky: ["#2b3566", "#4a4680"],
    body:
      rect(-10, -10, 660, 306, 0, "#3d4a7a") +
      rect(-10, 286, 660, 110, 0, "#2f3a62") +
      rect(-10, 282, 660, 10, 0, "#28325a") +
      P.window(64, 40, 96, 86, { night: true, curtain: "#5f6fa8" }) +
      // luna visibile dalla finestra
      circ(140, 66, 4, "#fff4c9") +
      circ(84, 96, 2.6, "#fff4c9") +
      circ(112, 108, 2, "#fff4c9") +
      P.bed(220, 300, 1.44, { duvet: "#6f8fc0", pillow: "#eef3f8" }) +
      // bambino sotto il piumone
      grp(
        circ(298, 244, 15, C.skin.a) +
          path(`M${n(283)} ${n(244)} a${n(15)} ${n(15)} 0 0 1 ${n(30)} 0 Z`, C.hair.brown) +
          line(`M${n(291)} ${n(246)} q${n(3)} ${n(4)} ${n(6)} 0`, C.ink, 2) +
          line(`M${n(303)} ${n(246)} q${n(3)} ${n(4)} ${n(6)} 0`, C.ink, 2) +
          path(`M${n(297)} ${n(252)} q${n(4)} ${n(4)} ${n(8)} 0`, "none", { stroke: C.ink, sw: 2 }),
        ""
      ) +
      // libricino sul comodino
      P.table(410, 300, 70, 0.86) +
      rect(424, 276, 26, 16, 3, "#f6bf4a") +
      // nuvolette di sonno
      cloud(200, 190, 0.3, "#c8d2f0", 0.75) +
      cloud(164, 164, 0.22, "#c8d2f0", 0.6)
  };
});

/* 34 · Dopo la scuola i bambini giocano al parco */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#d9f0e2"],
    body:
      sun(70, 50, 26) +
      cloud(260, 44, 0.76) +
      cloud(470, 56, 0.6, "#ffffff", 0.7) +
      P.school(360, 246, 0.72) +
      meadow(248) +
      P.slide(120, 300, 1.1) +
      person({
        x: 268, y: 306, s: 0.9, hairStyle: "short", hair: C.hair.black,
        shirt: C.cloth.red, pants: C.cloth.navy, pose: "arms"
      }) +
      person({
        x: 452, y: 306, s: 0.86, hairStyle: "curly", hair: C.hair.blond,
        shirt: C.cloth.teal, pants: C.cloth.blue, pose: "walk"
      }) +
      P.ball(352, 330, 19, "#f6bf4a", "#5aa9e6") +
      P.flowerPatch(560, 326, 0.95)
  };
});

/* 35 · Mentre la mamma cucina il papà legge il giornale */
SCENES.push(() => {
  const b = indoor("#fdf2e6", "#e9d0ae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.stove(48, 302, 1.06) +
      person({
        x: 190, y: 304, s: 0.98, hairStyle: "bun", hair: C.hair.brown,
        shirt: C.cloth.pink, pants: C.cloth.navy, skirt: true, pose: "cook"
      }) +
      // divisorio: la stessa stanza ma due attività
      P.armchair(452, 302, 1.16, "#8fb8d8") +
      person({
        x: 452, y: 300, s: 1, hairStyle: "short", hair: C.hair.black,
        shirt: C.cloth.blue, pants: C.cloth.navy, pose: "hold"
      }) +
      P.newspaper(492, 240, 1.08, -5) +
      P.rug(420, 340, 130, "#d8e8f5") +
      P.window(560, 44, 80, 72, { curtain: "#f6bf4a" })
  };
});

/* 36 · Quando arriva la primavera gli uccelli cantano */
SCENES.push(() => {
  return {
    sky: ["#d2f0ff", "#f7f3d0"],
    body:
      sun(560, 54, 28) +
      cloud(140, 46, 0.8) +
      cloud(340, 38, 0.62, "#ffffff", 0.7) +
      meadow(252) +
      // ramo fiorito
      line(`M${n(60)} ${n(268)} q${n(60)} ${n(-30)} ${n(120)} ${n(-16)}`, C.woodD, 9) +
      line(`M${n(120)} ${n(258)} q${n(8)} ${n(-26)} ${n(22)} ${n(-34)}`, C.woodD, 6) +
      P.flower(104, 262, 0.8, "#f7b6c2") +
      P.flower(138, 244, 0.7, "#ffffff") +
      P.flower(160, 268, 0.72, "#f7b6c2") +
      bird(230, 196, 1.15, { color: "#5aa9e6", singing: true }) +
      bird(360, 148, 1.0, { color: "#ee5f5f", singing: true }) +
      bird(474, 204, 0.86, { color: "#f6bf4a", singing: true }) +
      P.flowerPatch(220, 332, 1.05) +
      P.flowerPatch(520, 322, 1.1)
  };
});

/* 37 · Se bevi poca acqua hai sete */
SCENES.push(() => {
  const b = indoor("#fdf6ea", "#e8cfae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(430, 46, 96, 80, { curtain: "#f6bf4a" }) +
      P.counter(240, 300, 130, 1.1) +
      P.glass(304, 288, 1.5, 0.18) +
      // poche gocce rimaste nel fondo
      ell(304, 278, 9, 3, "#7cc0ea") +
      person({
        x: 160, y: 304, s: 1.1, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.orange, pants: C.cloth.blue, pose: "hold"
      }) +
      // sete: lingua fuori e goccioline
      ell(166, 214, 4, 6, "#e88098") +
      ell(190, 196, 3, 4, "#bfe4f6", { opacity: 0.85 }) +
      ell(210, 214, 2.4, 3.4, "#bfe4f6", { opacity: 0.7 }) +
      // sole caldo dalla finestra
      ell(478, 84, 26, 26, "#ffe08a", { opacity: 0.35 })
  };
});

/* 38 · Prima di uscire il bimbo mette il cappotto */
SCENES.push(() => {
  const b = indoor("#f4f7fb", "#e0d6c4");
  return {
    sky: b.sky,
    body:
      b.body +
      P.door(470, 116, 104, 172, { color: "#cf9a63" }) +
      P.coat(160, 296, 1.2, "#4a90e2") +
      person({
        x: 320, y: 304, s: 1.06, hairStyle: "short", hair: C.hair.blond,
        shirt: C.cloth.yellow, pants: C.cloth.navy, pose: "walk"
      }) +
      // sciarpa
      rect(302, 214, 36, 10, 4, "#ee5f5f") +
      rect(316, 218, 12, 22, 4, "#ee5f5f") +
      P.rug(300, 340, 150, "#d8e8f5")
  };
});

/* 39 · Quando la campana suona gli alunni entrano in classe */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#d9f0e2"],
    body:
      sun(74, 50, 24) +
      cloud(250, 44, 0.74) +
      cloud(470, 56, 0.58, "#ffffff", 0.7) +
      P.school(360, 250, 0.9) +
      P.bell(196, 190, 1.5) +
      // onde sonore della campana
      line(`M${n(238)} ${n(176)} q${n(16)} ${n(10)} ${n(0)} ${n(22)}`, "#8fa3b8", 4, { opacity: 0.75 }) +
      line(`M${n(258)} ${n(166)} q${n(24)} ${n(16)} ${n(0)} ${n(36)}`, "#8fa3b8", 4, { opacity: 0.55 }) +
      meadow(250) +
      // vialetto verso la porta
      poly([[424, 296], [452, 296], [492, 356], [384, 356]], "#e8dcc4") +
      person({
        x: 206, y: 306, s: 0.86, hairStyle: "short", hair: C.hair.brown,
        shirt: C.cloth.red, pants: C.cloth.navy, pose: "walk"
      }) +
      person({
        x: 286, y: 308, s: 0.82, hairStyle: "long", hair: C.hair.black,
        shirt: C.cloth.purple, pants: C.cloth.blue, skirt: true, pose: "walk"
      }) +
      P.fence(20, 286, 130, 0.7)
  };
});

/* 40 · Poiché è festa la scuola resta chiusa */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#ffe9c4"],
    body:
      sun(560, 50, 28) +
      cloud(150, 44, 0.8) +
      cloud(340, 36, 0.6, "#ffffff", 0.7) +
      P.school(300, 250, 0.94) +
      P.bunting(240, 96, 300, 1.1) +
      P.balloon(160, 236, 1.05, "#ee5f5f") +
      P.balloon(120, 246, 0.86, "#f6bf4a") +
      P.balloon(560, 240, 1, "#5aa9e6") +
      meadow(250) +
      // porta chiusa con cartello "chiuso" reso come catenaccio
      rect(378, 210, 30, 9, 4, "#8d99a6") +
      circ(380, 214, 5, "#5c6b7a") +
      circ(406, 214, 5, "#5c6b7a") +
      // coriandoli
      rect(210, 180, 8, 5, 2, "#ee5f5f", { rotate: 20 }) +
      rect(250, 160, 8, 5, 2, "#57bf7a", { rotate: -26 }) +
      rect(430, 166, 8, 5, 2, "#f6bf4a", { rotate: 34 }) +
      rect(486, 190, 8, 5, 2, "#c39bea", { rotate: -14 }) +
      P.flowerPatch(96, 330, 1)
  };
});

/* ==================================================================
   FORMAZIONE DI PAROLE · 20 figure (41-60)

   Una figura per parola del laboratorio «Formazione di parole». Ogni
   scena mostra l'oggetto o l'animale della parola, senza testo: il
   bambino deve riconoscere il significato, non leggere la scritta.
   ================================================================== */

/* 41 · ape */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 520, sunY: 58, sunR: 26 });
  // ape: corpo a strisce, ali chiare, antenne
  const bee =
    ell(322, 232, 42, 30, "#f6bf4a") +
    rect(300, 216, 10, 32, 5, "#33475b") +
    rect(318, 212, 10, 40, 5, "#33475b") +
    rect(336, 216, 10, 32, 5, "#33475b") +
    circ(360, 232, 18, "#33475b") +
    circ(364, 228, 4, "#ffffff") +
    line(`M${n(372)} ${n(214)} q${n(8)} ${n(-10)} ${n(16)} ${n(-4)}`, "#33475b", 3) +
    line(`M${n(360)} ${n(212)} q${n(2)} ${n(-12)} ${n(10)} ${n(-14)}`, "#33475b", 3) +
    ell(316, 200, 22, 13, "#e8f6ff", { opacity: 0.85, rotate: -18 }) +
    ell(306, 214, 18, 10, "#e8f6ff", { opacity: 0.7, rotate: 12 }) +
    // scia di volo
    line(`M${n(430)} ${n(250)} q${n(-26)} ${n(6)} ${n(-42)} ${n(0)}`, "#ffffff", 5, { opacity: 0.6 });
  return {
    sky: b.sky,
    body:
      b.body +
      bee +
      P.flower(180, 320, 1.1, "#f58ba8", "#f6bf4a") +
      P.flower(250, 336, 0.85, "#ffffff", "#ffd257") +
      P.flowerPatch(520, 330, 1.05)
  };
});

/* 42 · mela */
SCENES.push(() => {
  const b = outdoor(1, { sun: false });
  return {
    sky: ["#e8f7e4", "#cfe9d6"],
    body:
      b.body +
      sun(88, 54, 28) +
      // mela grande, con picciolo e foglia
      circ(320, 226, 74, "#e0574f") +
      circ(300, 202, 18, "#f58b84", { opacity: 0.45 }) +
      path(`M${n(320)} ${n(154)} q${n(4)} ${n(-24)} ${n(18)} ${n(-30)}`, "none", { stroke: "#8d6a45", sw: 7 }) +
      ell(356, 130, 24, 12, "#5cc47f", { rotate: -26 }) +
      line(`M${n(356)} ${n(126)} q${n(-10)} ${n(2)} ${n(-18)} ${n(2)}`, "#3ea363", 2.6) +
      shadow(320, 306, 66) +
      P.basket(510, 314, 1.1) +
      P.flowerPatch(120, 334, 0.9)
  };
});

/* 43 · sole */
SCENES.push(() => {
  return {
    sky: ["#ffeccb", "#ffd9a0"],
    body:
      sun(320, 168, 92) +
      // raggi lunghi
      (() => {
        let r = "";
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI * 2) / 12;
          r += line(
            `M${n(320 + Math.cos(a) * 118)} ${n(168 + Math.sin(a) * 118)} l${n(Math.cos(a) * 26)} ${n(Math.sin(a) * 26)}`,
            "#ffd257", 7, { opacity: 0.6 }
          );
        }
        return r;
      })() +
      cloud(96, 74, 0.8, "#ffffff", 0.85) +
      cloud(546, 96, 0.62, "#ffffff", 0.7) +
      meadow(268) +
      P.flowerPatch(90, 336, 1.05) +
      P.flowerPatch(556, 330, 0.95)
  };
});

/* 44 · luna */
SCENES.push(() => {
  let st = "";
  [[70, 52, 6], [140, 96, 4], [216, 44, 5], [286, 88, 3.4], [510, 50, 5.5], [578, 104, 4],
   [46, 138, 3.6], [608, 60, 3]].forEach(([sx, sy, sr]) => { st += star(sx, sy, sr); });
  return {
    sky: NIGHT_SKY,
    body:
      st +
      ell(400, 216, 128, 128, "#fff4c9", { opacity: 0.12 }) +
      moon(400, 216, 86) +
      hill(276, "#2f4a52", 26, 1) +
      hill(306, "#26404a", 16, 1) +
      // casetta illuminata in basso a sinistra
      poly([[110, 262], [176, 210], [242, 262]], "#8d5a3c") +
      rect(124, 258, 104, 70, 5, "#f3e0ba") +
      rect(146, 282, 26, 46, 3, "#8d6a45") +
      rect(190, 274, 26, 24, 3, "#ffd257") +
      line(`M${n(203)} ${n(274)} v${n(24)}`, "#8d6a45", 2.4) +
      line(`M${n(190)} ${n(286)} h${n(26)}`, "#8d6a45", 2.4)
  };
});

/* 45 · pane */
SCENES.push(() => {
  const b = indoor("#fdf3e3", "#e8cfae");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(58, 44, 96, 84, { curtain: "#f6bf4a" }) +
      P.table(340, 300, 250, 1.5) +
      P.bread(272, 292, 1.7) +
      P.basket(432, 296, 1.2) +
      P.plate(560, 296, 1.15, "#ffffff") +
      // farina sparsa sul tavolo
      circ(220, 296, 5, "#ffffff") + circ(238, 300, 3.4, "#ffffff") + circ(204, 300, 3, "#ffffff")
  };
});

/* 46 · casa */
SCENES.push(() => {
  return {
    sky: ["#d7f0ff", "#cfeaff"],
    body:
      sun(78, 52, 26) +
      cloud(214, 44, 0.78) +
      cloud(520, 58, 0.64, "#ffffff", 0.8) +
      meadow(266) +
      // casa: muri, tetto, porta, finestre, comignolo
      rect(186, 176, 268, 152, 6, "#f3e0ba") +
      poly([[166, 180], [320, 92], [474, 180]], "#d9705f") +
      rect(376, 108, 26, 46, 4, "#b0b7be") +
      ell(402, 106, 12, 7, "#e7edf2", { opacity: 0.7 }) +
      rect(288, 248, 56, 80, 4, "#8d6a45") +
      circ(334, 288, 5, "#f6bf4a") +
      rect(214, 210, 44, 40, 4, "#cfe3f2") +
      rect(384, 210, 44, 40, 4, "#cfe3f2") +
      line(`M${n(236)} ${n(210)} v${n(40)}`, "#f3e0ba", 3) +
      line(`M${n(214)} ${n(230)} h${n(44)}`, "#f3e0ba", 3) +
      line(`M${n(406)} ${n(210)} v${n(40)}`, "#f3e0ba", 3) +
      line(`M${n(384)} ${n(230)} h${n(44)}`, "#f3e0ba", 3) +
      P.fence(20, 300, 130, 0.8) +
      P.flowerPatch(536, 330, 1.0)
  };
});

/* 47 · dado */
SCENES.push(() => {
  const b = indoor("#fdf3e6", "#e8cfae");
  const cx = 320, cy = 240, r = 92;
  // cinque punti rossi come su un dado a cinque
  const dots = [[0, 0], [-46, -46], [46, -46], [-46, 46], [46, 46]];
  let pip = "";
  dots.forEach(([dx, dy]) => { pip += circ(cx + dx, cy + dy, 15, "#ee5f5f"); });
  return {
    sky: b.sky,
    body:
      b.body +
      P.rug(320, 336, 190, "#d8e8f5") +
      shadow(cx, cy + r + 8, 84) +
      rect(cx - r, cy - r, r * 2, r * 2, 26, "#ffffff") +
      rect(cx - r, cy - r, r * 2, 22, 26, "#eef4f9") +
      circ(cx, cy, r, "none", { stroke: "#c3ccd6", sw: 4 }) +
      pip +
      // secondo dado piccolo accanto
      shadow(508, 300, 40) +
      rect(478, 244, 60, 60, 14, "#fff8ec") +
      circ(494, 260, 8, "#ee5f5f") +
      circ(522, 288, 8, "#ee5f5f") +
      P.table(120, 306, 130, 1)
  };
});

/* 48 · faro */
SCENES.push(() => {
  const sea = rect(-10, 254, 660, 120, 0, "#4fa8d8");
  let waves = "";
  for (let i = 0; i < 3; i++) {
    const wy = 276 + i * 26;
    waves += line(`M40 ${wy} q26 -10 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0`, "#2f8cbd", 5, { opacity: 0.4 - i * 0.07 });
  }
  return {
    sky: ["#bfe4f7", "#e8f4fb"],
    body:
      cloud(96, 52, 0.8) +
      cloud(520, 44, 0.62, "#ffffff", 0.72) +
      sea +
      waves +
      // scogliera
      poly([[196, 262], [252, 230], [322, 250], [374, 268], [374, 300], [196, 300]], "#8d949c") +
      // torre a fasce
      poly([[288, 240], [352, 240], [340, 92], [300, 92]], "#ffffff") +
      poly([[288, 240], [352, 240], [350.6, 214], [289.4, 214]], "#ee5f5f") +
      poly([[297, 168], [343, 168], [341, 142], [299, 142]], "#ee5f5f") +
      // lanterna
      rect(296, 66, 48, 28, 6, "#ffd257") +
      poly([[292, 66], [320, 42], [348, 66]], "#b03a35") +
      // fasci di luce
      poly([[344, 66], [500, 24], [500, 108]], "#ffe38a", { opacity: 0.35 }) +
      poly([[296, 66], [140, 24], [140, 108]], "#ffe38a", { opacity: 0.25 }) +
      seagull(486, 168, 1.15)
  };
});

/* 49 · gatto */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 92, sunY: 58, sunR: 28 });
  return {
    sky: b.sky,
    body:
      b.body +
      P.ball(462, 300, 34, "#5aa9e6", "#f6bf4a") +
      cat(260, 306, 1.45, { pose: "sit", tilt: -4, happy: true }) +
      // ciotola dell'acqua accanto
      ell(396, 310, 34, 10, "#d8ecf6") +
      ell(396, 306, 26, 7, "#7cc0ea") +
      P.flowerPatch(90, 336, 1.0)
  };
});

/* 50 · cane */
SCENES.push(() => {
  const b = outdoor(1, { sun: false });
  return {
    sky: ["#e6f4ff", "#d3ecff"],
    body:
      b.body +
      sun(556, 56, 26) +
      dog(300, 304, 1.55, { pose: "sit", color: "#c98a5a" }) +
      P.bone(468, 312, 1.3, -14) +
      P.fence(40, 288, 150, 0.85) +
      P.flowerPatch(560, 332, 0.95)
  };
});

/* 51 · pesce */
SCENES.push(() => {
  let bubbles = "";
  [[250, 128, 6], [274, 106, 4.6], [238, 88, 3.4], [296, 74, 3]].forEach(([bx, by, br]) => {
    bubbles += circ(bx, by, br, "#d8f0fa", { opacity: 0.7 });
  });
  let weed = "";
  [86, 132, 486, 536].forEach((wx, i) => {
    weed += path(
      `M${n(wx)} ${n(318)} q${n(i % 2 ? 20 : -20)} ${n(-28)} 0 ${n(-56)} q${n(i % 2 ? -18 : 18)} ${n(-24)} 0 ${n(-46)}`,
      "none", { stroke: i % 2 ? "#4ea24d" : "#3ea363", sw: 9 }
    );
  });
  return {
    sky: ["#7fd0f0", "#18618a"],
    body:
      poly([[160, 0], [256, 0], [136, 336], [46, 336]], "#ffffff", { opacity: 0.13 }) +
      poly([[340, 0], [412, 0], [336, 336], [262, 336]], "#ffffff", { opacity: 0.09 }) +
      rect(-10, 314, 660, 70, 0, "#f3e0ba") +
      weed +
      fish(330, 214, 2.1, { color: "#f2884b", dark: "#d96a2f" }) +
      bubbles
  };
});

/* 52 · rana */
SCENES.push(() => {
  let ripples = "";
  [[220, 306, 60], [220, 306, 92], [220, 306, 124]].forEach(([rx, ry, rr], i) => {
    ripples += ell(rx, ry, rr, rr * 0.24, "none", { stroke: "#ffffff", sw: 4, opacity: 0.35 - i * 0.08 });
  });
  return {
    sky: ["#d9f2ff", "#bfe4f7"],
    body:
      sun(556, 56, 28) +
      cloud(120, 48, 0.82) +
      cloud(320, 38, 0.6, "#ffffff", 0.7) +
      meadow(238) +
      water(288, "#63b9e6", "#3f9ccb") +
      // ninfee
      ell(120, 300, 40, 13, "#5cc47f") +
      ell(432, 318, 34, 11, "#4eb26c") +
      ell(120, 300, 40, 13, "none", { stroke: "#3ea363", sw: 2.6 }) +
      ripples +
      frog(220, 302, 1.5, { color: "#6ec46b" }) +
      butterfly(470, 176, 1.2, { c1: "#f58ba8", c2: "#f6bf4a" })
  };
});

/* 53 · topo */
SCENES.push(() => {
  const b = indoor("#fdf5ea", "#e3c9a6");
  return {
    sky: b.sky,
    body:
      b.body +
      P.rug(300, 332, 150, "#e6d6c2") +
      P.table(452, 300, 170, 1.35) +
      // pezzo di formaggio con i buchi
      poly([[400, 300], [470, 262], [522, 300]], "#f6d47a") +
      rect(400, 300, 122, 4, 2, "#e0bb5c") +
      circ(438, 288, 7, "#e0bb5c") + circ(474, 296, 5, "#e0bb5c") + circ(496, 284, 4, "#e0bb5c") +
      mouse(232, 308, 1.7, { color: "#a8b3c0" })
  };
});

/* 54 · fiore */
SCENES.push(() => {
  const b = outdoor(1, { sun: false });
  let petals = "";
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8;
    petals += ell(320 + Math.cos(a) * 48, 206 + Math.sin(a) * 48, 30, 24, "#f58ba8", { rotate: (a * 180) / Math.PI });
  }
  return {
    sky: ["#eafaf1", "#d3f0dd"],
    body:
      b.body +
      sun(80, 52, 26) +
      // stelo e foglie
      line(`M${n(320)} ${n(232)} v${n(104)}`, "#3ea363", 10) +
      ell(288, 288, 30, 14, "#5cc47f", { rotate: -24 }) +
      ell(352, 306, 28, 13, "#5cc47f", { rotate: 22 }) +
      petals +
      circ(320, 206, 26, "#f6bf4a") +
      circ(320, 206, 13, "#e8a83a") +
      butterfly(486, 168, 1.35, { c1: "#f6bf4a", c2: "#5aa9e6" })
  };
});

/* 55 · palla */
SCENES.push(() => {
  const b = outdoor(1, { sunX: 92, sunY: 56, sunR: 28 });
  return {
    sky: b.sky,
    body:
      b.body +
      P.ball(320, 234, 96, "#ee5f5f", "#f6bf4a") +
      // rimbalzo
      line(`M${n(210)} ${n(300)} q${n(40)} ${n(-26)} ${n(84)} ${n(-16)}`, "#ffffff", 5, { opacity: 0.55 }) +
      ell(320, 336, 76, 14, "#2f4459", { opacity: 0.12 }) +
      P.flowerPatch(88, 334, 1.0) +
      P.flowerPatch(556, 330, 0.9)
  };
});

/* 56 · treno */
SCENES.push(() => {
  return {
    sky: ["#dcefff", "#eef7ff"],
    body:
      sun(78, 50, 24) +
      cloud(270, 44, 0.74) +
      cloud(500, 58, 0.6, "#ffffff", 0.7) +
      meadow(262) +
      street(300) +
      P.train(140, 296, 1.45) +
      // segnale
      line(`M${n(578)} ${n(296)} v${n(-70)}`, "#8d99a6", 7) +
      circ(578, 218, 11, "#57bf7a")
  };
});

/* 57 · nave */
SCENES.push(() => {
  let waves = "";
  for (let i = 0; i < 4; i++) {
    const wy = 268 + i * 26;
    waves += line(`M30 ${wy} q26 -10 52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0 t52 0`,
      "#2f8cbd", 5, { opacity: 0.4 - i * 0.06 });
  }
  return {
    sky: ["#bfe4f7", "#e8f4fb"],
    body:
      sun(560, 54, 30) +
      cloud(130, 50, 0.8) +
      cloud(300, 36, 0.6, "#ffffff", 0.7) +
      rect(-10, 248, 660, 120, 0, "#4fa8d8") +
      waves +
      P.ship(120, 272, 1.42) +
      // scia
      line(`M${n(66)} ${n(296)} q${n(-22)} ${n(5)} ${n(-40)} ${n(2)}`, "#ffffff", 6, { opacity: 0.7 }) +
      seagull(486, 132, 1.2)
  };
});

/* 58 · libro */
SCENES.push(() => {
  const b = indoor("#fdf3e3", "#e5c9a6");
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(66, 46, 92, 82, { curtain: "#5aa9e6" }) +
      P.table(320, 306, 230, 1.5) +
      P.book(320, 276, 2.1, 3) +
      // libreria sullo sfondo
      rect(540, 132, 74, 156, 6, "#c99a66") +
      rect(548, 142, 58, 40, 3, "#a97a4e") +
      rect(548, 190, 58, 40, 3, "#a97a4e") +
      rect(548, 238, 58, 40, 3, "#a97a4e") +
      rect(552, 148, 9, 28, 2, "#ee5f5f") +
      rect(566, 146, 9, 30, 2, "#57bf7a") +
      rect(580, 150, 9, 26, 2, "#f6bf4a") +
      rect(552, 196, 9, 28, 2, "#5aa9e6") +
      rect(566, 198, 9, 26, 2, "#c39bea")
  };
});

/* 59 · ombrello */
SCENES.push(() => {
  let rain = "";
  for (let i = 0; i < 18; i++) {
    const rx = 14 + i * 36;
    const ry = 112 + (i % 5) * 26;
    rain += line(`M${n(rx)} ${n(ry)} l${n(-5)} ${n(20)}`, "#7cb6d8", 5, { opacity: 0.7 });
  }
  return {
    sky: ["#9fb4c6", "#c6d5e0"],
    body:
      rainCloud(120, 24, 1.15) +
      rainCloud(392, 18, 1.05) +
      rainCloud(572, 40, 0.8) +
      rain +
      meadow(276) +
      P.puddle(140, 348, 54) +
      P.puddle(512, 344, 46) +
      P.umbrella(320, 306, 1.9, true, "#ee5f5f") +
      // stivaletti sotto l'ombrello
      ell(292, 312, 14, 7, "#3c5a78") +
      ell(348, 312, 14, 7, "#3c5a78")
  };
});

/* 60 · campana */
SCENES.push(() => {
  return {
    sky: ["#ffeccb", "#ffd9a0"],
    body:
      sun(90, 54, 24) +
      cloud(230, 42, 0.72) +
      cloud(500, 52, 0.6, "#ffffff", 0.7) +
      // trave di legno con corda
      rect(140, 92, 360, 18, 6, "#a86c33") +
      line(`M${n(320)} ${n(110)} v${n(38)}`, "#8d6a45", 6) +
      P.bell(320, 268, 3.0) +
      // onde sonore
      line(`M${n(196)} ${n(210)} q${n(-22)} ${n(26)} ${n(0)} ${n(52)}`, "#8fa3b8", 5, { opacity: 0.55 }) +
      line(`M${n(160)} ${n(192)} q${n(-34)} ${n(42)} ${n(0)} ${n(86)}`, "#8fa3b8", 4, { opacity: 0.4 }) +
      line(`M${n(444)} ${n(210)} q${n(22)} ${n(26)} ${n(0)} ${n(52)}`, "#8fa3b8", 5, { opacity: 0.55 }) +
      line(`M${n(480)} ${n(192)} q${n(34)} ${n(42)} ${n(0)} ${n(86)}`, "#8fa3b8", 4, { opacity: 0.4 }) +
      meadow(298)
  };
});

/* ==================================================================
   GRUPPI DIFFICILI · 7 figure mancanti (61-67)

   Parole della tappa «I gruppi difficili» che non avevano ancora una
   scena: il bambino le vede qui per la prima volta. Stessa regola delle
   altre: il disegno mostra il significato della parola, mai la scrittura.
   ================================================================== */

/* 61 · bagno */
SCENES.push(() => {
  const b = indoor("#eaf4fb", "#dfe9f2");
  let tiles = "";
  // piastrelle della parete
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 9; c++) {
      tiles += rect(24 + c * 70, 18 + r * 54, 62, 46, 6, "#ffffff", { opacity: 0.5 });
    }
  }
  let bubbles = "";
  [[214, 236, 11], [244, 214, 8], [272, 244, 13], [300, 220, 9], [330, 240, 7]].forEach(
    ([bx, by, br]) => { bubbles += circ(bx, by, br, "#ffffff", { opacity: 0.75 }); }
  );
  return {
    sky: b.sky,
    body:
      b.body +
      tiles +
      // vasca
      rect(150, 244, 300, 82, 22, "#ffffff") +
      rect(162, 254, 276, 62, 16, "#bfe4f6") +
      ell(300, 254, 138, 12, "#a5d8f2", { opacity: 0.9 }) +
      bubbles +
      // rubinetto
      rect(316, 176, 16, 62, 6, "#c3ccd6") +
      path("M324 180 q0 -18 26 -18", "none", { stroke: "#c3ccd6", sw: 12 }) +
      circ(352, 186, 5, "#9fb0c0") +
      // doccetta
      line("M404 96 q22 26 6 52", "#9fb0c0", 8) +
      ell(398, 152, 20, 12, "#c3ccd6") +
      ell(398, 158, 16, 8, "#9fb0c0") +
      // asciugamano
      rect(500, 150, 74, 96, 10, "#f58ba8") +
      rect(500, 150, 74, 14, 8, "#e88098") +
      shadow(300, 330, 150)
  };
});

/* 62 · aglio */
SCENES.push(() => {
  const b = indoor("#fdf8ee", "#e9d8b8");
  // testa d'aglio: spicchi a punta, buccia bianca venata
  let cloves = "";
  [[0, -46], [-30, -30], [30, -30], [-16, -6], [16, -6], [0, -70]].forEach(([dx, dy]) => {
    cloves += path(
      `M${n(300 + dx)} ${n(240 + dy)} q${n(16)} ${n(6)} ${n(14)} ${n(26)} q${n(-2)} ${n(16)} ${n(-14)} ${n(18)} q${n(-12)} ${n(-2)} ${n(-14)} ${n(-18)} q${n(-2)} ${n(-20)} ${n(14)} ${n(-26)} Z`,
      "#fffdf8"
    );
  });
  return {
    sky: b.sky,
    body:
      b.body +
      P.window(64, 40, 92, 78, { curtain: "#8fce6f" }) +
      P.counter(180, 300, 250, 1.3) +
      shadow(300, 292, 62) +
      cloves +
      // venature e punta secca
      line("M300 194 q-6 -22 4 -34", "#b9d6a8", 4) +
      line("M300 240 q-16 8 -20 26", "#dfe8d4", 3, { opacity: 0.9 }) +
      line("M300 240 q18 8 22 24", "#dfe8d4", 3, { opacity: 0.9 }) +
      // bulbo intero accanto
      ell(452, 268, 40, 34, "#fffdf8") +
      ell(452, 262, 26, 22, "#f4f7ec") +
      line("M452 234 q-4 -18 4 -28", "#b9d6a8", 4) +
      P.plate(120, 296, 1.2, "#ffffff")
  };
});

/* 63 · scivolo */
SCENES.push(() => {
  let grass = "";
  for (let i = 0; i < 22; i++) {
    grass += line(`M${n(30 + i * 28)} 336 q${n(4)} -10 ${n(9)} -3`, "#4ea24d", 4, { opacity: 0.7 });
  }
  return {
    sky: ["#d7f0ff", "#d9f0e2"],
    body:
      sun(72, 52, 26) +
      cloud(250, 44, 0.76) +
      cloud(486, 58, 0.6, "#ffffff", 0.7) +
      meadow(246) +
      grass +
      P.slide(146, 300, 1.55) +
      // bambino che scende
      person({
        x: 322, y: 268, s: 0.95, hairStyle: "short", hair: C.hair.black,
        shirt: C.cloth.red, pants: C.cloth.navy, pose: "arms"
      }) +
      P.ball(508, 322, 24, "#5aa9e6", "#f6bf4a") +
      P.flowerPatch(556, 330, 1.0)
  };
});

/* 64 · formiche */
SCENES.push(() => {
  let ants = "";
  [[180, 310, 1], [248, 322, 0.85], [316, 308, 1], [386, 320, 0.9], [452, 306, 0.8]].forEach(
    ([ax, ay, as]) => {
      // tre segmenti del corpo + zampe + antenne
      ants +=
        ell(ax - 14 * as, ay, 10 * as, 8 * as, "#3f4a55") +
        ell(ax, ay - 1 * as, 8 * as, 7 * as, "#33475b") +
        ell(ax + 13 * as, ay - 2 * as, 9 * as, 8 * as, "#3f4a55") +
        line(`M${n(ax - 20 * as)} ${n(ay + 4 * as)} l${n(-10 * as)} ${n(10 * as)}`, "#33475b", 2.6 * as) +
        line(`M${n(ax - 4 * as)} ${n(ay + 6 * as)} l${n(-4 * as)} ${n(11 * as)}`, "#33475b", 2.6 * as) +
        line(`M${n(ax + 8 * as)} ${n(ay + 6 * as)} l${n(4 * as)} ${n(11 * as)}`, "#33475b", 2.6 * as) +
        line(`M${n(ax + 19 * as)} ${n(ay - 8 * as)} q${n(5 * as)} ${n(-9 * as)} ${n(11 * as)} ${n(-10 * as)}`, "#33475b", 2.4 * as) +
        line(`M${n(ax + 21 * as)} ${n(ay - 6 * as)} q${n(8 * as)} ${n(-4 * as)} ${n(13 * as)} ${n(-2 * as)}`, "#33475b", 2.4 * as);
    }
  );
  // formicaio: cumulo di terra con buco
  return {
    sky: ["#e8f7e4", "#cfe9d6"],
    body:
      sun(86, 56, 26) +
      cloud(400, 46, 0.7) +
      meadow(258) +
      ell(556, 318, 74, 40, "#c7a06a") +
      ell(556, 306, 74, 34, "#d8b47e") +
      ell(556, 300, 18, 8, "#8d6a45") +
      ants +
      P.flowerPatch(96, 332, 1.0) +
      // briciole portate in fila
      circ(214, 300, 5, "#f6d47a") +
      circ(282, 316, 4, "#f6d47a") +
      circ(352, 300, 4.4, "#f6d47a")
  };
});

/* 65 · chitarra */
SCENES.push(() => {
  // corde tese dalla cassa al manico
  let strings = "";
  [286, 292, 298, 304, 310, 316].forEach(y => {
    strings += line(`M${n(196)} ${n(y)} L${n(392)} ${n(y - 34)}`, "#e8eef4", 1.8, { opacity: 0.95 });
  });
  // tasti del manico
  let frets = "";
  for (let i = 0; i < 6; i++) {
    const fx = 300 + i * 17;
    frets += line(`M${n(fx)} ${n(fx === 300 ? 244 : 244 - i * 5)} l${n(4)} ${n(-36)}`, "#c9a67d", 3);
  }
  return {
    sky: ["#fdf1e0", "#f7e3c8"],
    body:
      P.room("#fdf6ea", "#e8cfae", 288) +
      P.rug(320, 336, 190, "#d8e8f5") +
      // cassa armonica
      ell(228, 258, 74, 62, "#e6b06a") +
      ell(228, 258, 56, 46, "#d99a4e") +
      circ(228, 258, 20, "#3f4a55") +
      // manico e paletta
      rect(276, 214, 118, 26, 10, "#c9a67d") +
      frets +
      rect(388, 200, 40, 34, 8, "#8d6a45") +
      circ(398, 210, 5, "#f6bf4a") +
      circ(414, 206, 5, "#f6bf4a") +
      circ(430, 208, 5, "#f6bf4a") +
      // ponte
      rect(266, 246, 26, 14, 4, "#8d6a45") +
      strings +
      // plettro
      poly([[486, 300], [512, 288], [518, 316], [492, 322]], "#5aa9e6") +
      shadow(250, 330, 120)
  };
});

/* 66 · alghe */
SCENES.push(() => {
  let weeds = "";
  [70, 118, 166, 470, 520, 570].forEach((wx, i) => {
    const col = i % 2 ? "#3ea363" : "#4ea24d";
    weeds += path(
      `M${n(wx)} ${n(320)} q${n(i % 2 ? 26 : -26)} ${n(-30)} 0 ${n(-58)} q${n(i % 2 ? -20 : 20)} ${n(-26)} 0 ${n(-52)} q${n(i % 2 ? 14 : -14)} ${n(-20)} 0 ${n(-40)}`,
      "none", { stroke: col, sw: 11 }
    );
    weeds += path(
      `M${n(wx + 16)} ${n(318)} q${n(i % 2 ? -18 : 18)} ${n(-24)} 0 ${n(-44)}`,
      "none", { stroke: "#63b96f", sw: 7, opacity: 0.9 }
    );
  });
  // raggi di luce dall'alto
  let rays = "";
  [[150, 0.13], [300, 0.09], [450, 0.11]].forEach(([rx, op]) => {
    rays += poly([[rx, 0], [rx + 60, 0], [rx - 20, 330], [rx - 80, 330]], "#ffffff", { opacity: op });
  });
  return {
    sky: ["#7fd0f0", "#18618a"],
    body:
      rays +
      rect(-10, 312, 660, 70, 0, "#f3e0ba") +
      ell(300, 316, 90, 16, "#e4d3b2") +
      weeds +
      fish(320, 196, 1.35, { color: "#f2884b", dark: "#d96a2f" }) +
      circ(258, 150, 6, "#d8f0fa", { opacity: 0.7 }) +
      circ(282, 128, 4.6, "#d8f0fa", { opacity: 0.6 }) +
      circ(240, 112, 3.4, "#d8f0fa", { opacity: 0.5 })
  };
});

/* 67 · maglia */
SCENES.push(() => {
  return {
    sky: ["#fdf1e0", "#f7e3c8"],
    body:
      P.room("#fdf6ea", "#e8cfae", 288) +
      // stendibiancheria
      line("M96 150 h448", "#9a8f84", 6) +
      line("M120 150 v-40", "#9a8f84", 6) +
      line("M520 150 v-40", "#9a8f84", 6) +
      // maglia appesa: corpino, maniche, collo
      line("M320 150 v22", "#c98a5a", 4) +
      path("M270 176 q50 -14 100 0 l14 74 q-14 10 -30 2 l0 76 l-68 0 l0 -76 q-16 8 -30 -2 Z", "#5aa9e6") +
      // maniche
      path("M270 176 q-38 16 -46 54 l30 12 q12 -28 34 -38 Z", "#4a90e2") +
      path("M370 176 q38 16 46 54 l-30 12 q-12 -28 -34 -38 Z", "#4a90e2") +
      // collo
      path("M300 176 q20 20 40 0 q-20 -8 -40 0 Z", "#3c5a78") +
      // righe lavorate a maglia
      (() => {
        let knit = "";
        for (let i = 0; i < 6; i++) {
          const ky = 214 + i * 22;
          knit += line(`M${n(288)} ${n(ky)} q${n(16)} ${n(8)} ${n(32)} 0 q${n(16)} ${n(8)} ${n(32)} 0`, "#4a90e2", 3, { opacity: 0.55 });
        }
        return knit;
      })() +
      // gomitolo e ferri
      circ(500, 306, 30, "#f58ba8") +
      path("M486 288 q22 12 4 34 q-18 12 -20 -8", "none", { stroke: "#e88098", sw: 4 }) +
      line("M470 280 l52 44", "#c9a67d", 5) +
      line("M522 280 l-52 44", "#c9a67d", 5) +
      shadow(320, 334, 120) +
      P.rug(320, 336, 168, "#f2c8a3")
  };
});

/* ==================================================================
   Documento SVG
   ================================================================== */

/** Costruisce il documento SVG completo di una scena. */
function buildScene(id) {
  const scene = SCENES[id - 1]();
  const [c1, c2] = scene.sky || GROUP_SKY[0];
  const inner = scene.body;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${c1}"/>
<stop offset="100%" stop-color="${c2}"/>
</linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${inner}
</svg>`;
}

module.exports = { SCENES, buildScene, W, H };
