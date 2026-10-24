#!/usr/bin/env node
/**
 * Costruisce le icone native:
 *  - build/icon.icns  (macOS, via iconutil di macOS)
 *  - build/icon.ico   (Windows, file ICO multi-risoluzione con payload PNG)
 *
 * Uso: node build/make-native-icons.js
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const buildDir = __dirname;
const iconsDir = path.join(root, "icons");

const ICNS_SET_SIZES = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
  [1024, "icon_512x512@2x.png"]
];

const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

async function makeIcns() {
  const svg = fs.readFileSync(path.join(buildDir, "icon.svg"));
  const iconset = path.join(buildDir, "icon.iconset");
  fs.rmSync(iconset, { recursive: true, force: true });
  fs.mkdirSync(iconset, { recursive: true });

  for (const [size, name] of ICNS_SET_SIZES) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconset, name));
  }

  if (process.platform === "darwin") {
    execFileSync("iconutil", ["-c", "icns", iconset, "-o", path.join(buildDir, "icon.icns")]);
    fs.rmSync(iconset, { recursive: true, force: true });
    console.log("✔ build/icon.icns");
  } else {
    console.warn("! iconutil non disponibile: icon.icns non generato");
  }
}

/** Crea un file .ico multi-immagine con payload PNG (supportato da Windows Vista+). */
async function makeIco() {
  const buffers = [];
  for (const size of ICO_SIZES) {
    const png = await sharp(path.join(iconsDir, `icon-${size}.png`))
      .resize(size, size)
      .png()
      .toBuffer();
    buffers.push({ size, png });
  }

  const count = buffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);   // riservato
  header.writeUInt16LE(1, 2);   // tipo: icona
  header.writeUInt16LE(count, 4);

  const dirSize = 16 * count;
  let offset = 6 + dirSize;
  const entries = [];

  buffers.forEach(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);      // larghezza (0 = 256)
    e.writeUInt8(size >= 256 ? 0 : size, 1);      // altezza
    e.writeUInt8(0, 2);                           // palette
    e.writeUInt8(0, 3);                           // riservato
    e.writeUInt16LE(1, 4);                        // piani
    e.writeUInt16LE(32, 6);                       // bit per pixel
    e.writeUInt32LE(png.length, 8);               // dimensione dati
    e.writeUInt32LE(offset, 12);                  // offset dati
    entries.push(e);
    offset += png.length;
  });

  const out = Buffer.concat([header, ...entries, ...buffers.map(b => b.png)]);
  fs.writeFileSync(path.join(buildDir, "icon.ico"), out);
  console.log("✔ build/icon.ico");

  // copie usate da electron-builder / Linux
  fs.copyFileSync(path.join(iconsDir, "icon-512.png"), path.join(buildDir, "icon-512.png"));
  fs.copyFileSync(path.join(iconsDir, "icon-1024.png"), path.join(buildDir, "icon.png"));
}

(async () => {
  await makeIco();
  await makeIcns();
  console.log("✔ icone native pronte");
})().catch(err => {
  console.error("Errore icone native:", err);
  process.exit(1);
});
