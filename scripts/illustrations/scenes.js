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
