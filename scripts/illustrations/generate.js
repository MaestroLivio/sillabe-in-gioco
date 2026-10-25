#!/usr/bin/env node
"use strict";
/**
 * Genera le 40 illustrazioni vettoriali dei livelli.
 *
 * Il flusso è quello richiesto: le scene sono composte in SVG (vettoriale,
 * `scripts/illustrations/*.js`) e vengono rasterizzate **da FigCraft**, che
 * importa ogni SVG come frame modificabile ed esporta il PNG alla dimensione
 * esatta. FigCraft è pilotato dal suo canale di controllo locale (lo stesso
 * che usa l'MCP `figcraft`), così le 40 esportazioni non richiedono 40
 * passaggi manuali.
 *
 * Output:
 *   illustrations/01.png … 40.png   (1280×720, per la TV del livello)
 *   illustrations/01.svg … 40.svg   (sorgenti vettoriali, versionabili)
 *   illustrations/manifest.json     (indice usato dai test e dall'app)
 *
 * Uso:
 *   node scripts/illustrations/generate.js            # solo PNG via FigCraft
 *   node scripts/illustrations/generate.js --sharp    # rasterizza con sharp
 *   node scripts/illustrations/generate.js --svg      # solo i sorgenti SVG
 */

const fs = require("fs");
const os = require("os");
const net = require("net");
const path = require("path");
const { execFileSync } = require("child_process");

const { SCENES, buildScene } = require("./scenes");

const ROOT = path.join(__dirname, "..", "..");
const OUT = path.join(ROOT, "illustrations");
const TMP = path.join(os.tmpdir(), "sillabe-illustrations");

const PORT = Number(process.env.FIGCRAFT_PORT || 7806);
const HOST = "127.0.0.1";
const SCALE = 2; // 640×360 → 1280×720

const args = process.argv.slice(2);
const SVG_ONLY = args.includes("--svg");
const USE_SHARP = args.includes("--sharp");

const pad = n => String(n).padStart(2, "0");

/* ------------------------------------------------------------------
   1. Scrittura dei sorgenti SVG
   ------------------------------------------------------------------ */

function writeSources() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(TMP, { recursive: true });
  const index = [];
  for (let i = 1; i <= SCENES.length; i++) {
    const svg = buildScene(i);
    const file = `illustrations/${pad(i)}.svg`;
    fs.writeFileSync(path.join(ROOT, file), svg);
    fs.writeFileSync(path.join(TMP, `${pad(i)}.svg`), svg);
    index.push({
      id: i,
      png: `illustrations/${pad(i)}.png`,
      svg: file,
      bytes: Buffer.byteLength(svg)
    });
  }
  return index;
}

/* ------------------------------------------------------------------
   2. Rasterizzazione con FigCraft (canale di controllo JSON-lines)
   ------------------------------------------------------------------ */

/** Una richiesta/risposta sul canale di controllo di FigCraft. */
function openChannel() {
  return new Promise((resolve, reject) => {
    const sock = net.connect(PORT, HOST);
    sock.setEncoding("utf8");
    let buffer = "";
    const queue = [];

    sock.on("connect", () => resolve(api));
    sock.on("error", reject);

    sock.on("data", chunk => {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);
        const job = queue.shift();
        if (!job) continue;
        try {
          job.resolve(JSON.parse(line));
        } catch (e) {
          job.reject(new Error("risposta non JSON: " + line.slice(0, 200)));
        }
      }
    });

    sock.on("close", () => {
      while (queue.length) queue.shift().reject(new Error("FigCraft ha chiuso il canale"));
    });

    const api = {
      call(method, params) {
        return new Promise((res, rej) => {
          queue.push({ resolve: res, reject: rej });
          sock.write(JSON.stringify({ id: 1, method, params }) + "\n");
        });
      },
      close() { sock.end(); }
    };
  });
}

/** Estrae il valore utile da una risposta del canale. */
async function run(channel, command, params) {
  const reply = await channel.call("engine.execute", { command, params });
  if (!reply.ok) throw new Error(`${command}: ${reply.error || JSON.stringify(reply)}`);
  return reply.result;
}

function figcraftAlive() {
  return new Promise(resolve => {
    const s = net.connect(PORT, HOST);
    s.on("connect", () => { s.destroy(); resolve(true); });
    s.on("error", () => resolve(false));
  });
}

async function rasterizeWithFigCraft(index) {
  if (!(await figcraftAlive())) {
    throw new Error(
      `FigCraft non risponde su ${HOST}:${PORT}. Avvialo con:\n` +
      `  /Applications/FigCraft.app/Contents/MacOS/FigCraft --control ${PORT}`
    );
  }
  const ch = await openChannel();
  try {
    for (const entry of index) {
      const src = path.join(TMP, `${pad(entry.id)}.svg`);
      const dest = path.join(ROOT, entry.png);
      const imported = await run(ch, "file.import", { path: src });
      const id = imported.id;
      if (id === undefined) throw new Error(`import di ${entry.png}: nessun id restituito`);
      const exp = await run(ch, "file.export", {
        ids: [id], format: "png", scale: SCALE, path: dest
      });
      const size = fs.existsSync(dest) ? fs.statSync(dest).size : 0;
      if (!size) throw new Error(`export di ${entry.png} non ha scritto il file`);
      console.log(`  ✔ ${pad(entry.id)}.png  ${exp.bytes || size} B`);
    }
  } finally {
    ch.close();
  }
}

/* ------------------------------------------------------------------
   3. Rasterizzazione con sharp (riserva, senza FigCraft)
   ------------------------------------------------------------------ */

async function rasterizeWithSharp(index) {
  const sharp = require("sharp");
  for (const entry of index) {
    const src = path.join(TMP, `${pad(entry.id)}.svg`);
    const dest = path.join(ROOT, entry.png);
    await sharp(fs.readFileSync(src), { density: 288 })
      .resize(640 * SCALE, 360 * SCALE, { fit: "contain", background: "#ffffff" })
      .png({ compressionLevel: 9 })
      .toFile(dest);
    console.log(`  ✔ ${pad(entry.id)}.png  ${fs.statSync(dest).size} B`);
  }
}

/* ------------------------------------------------------------------
   4. Main
   ------------------------------------------------------------------ */

(async () => {
  console.log(`Illustrazioni: ${SCENES.length} scene\n`);
  console.log("— sorgenti SVG —");
  const index = writeSources();
  index.forEach(e => console.log(`  ✔ ${e.svg}  ${e.bytes} B`));

  if (SVG_ONLY) {
    console.log("\nSolo sorgenti SVG richiesti: nessun PNG generato.");
  } else {
    console.log(`\n— PNG ${640 * SCALE}×${360 * SCALE} —`);
    if (USE_SHARP) {
      await rasterizeWithSharp(index);
    } else {
      await rasterizeWithFigCraft(index);
    }
  }

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        size: { width: 640 * SCALE, height: 360 * SCALE },
        count: index.length,
        items: index.map(e => ({ id: e.id, png: path.basename(e.png), svg: path.basename(e.svg) }))
      },
      null,
      2
    ) + "\n"
  );
  console.log("\n✔ illustrations/manifest.json");
})().catch(err => {
  console.error("\n✖ " + err.message);
  process.exit(1);
});
