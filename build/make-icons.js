#!/usr/bin/env node
/**
 * Genera le icone PNG (PWA, desktop, installer) a partire dai file SVG.
 * Uso: node build/make-icons.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const root = path.join(__dirname, "..");
const outDir = path.join(root, "icons");
fs.mkdirSync(outDir, { recursive: true });

const SIZES = [16, 24, 32, 48, 64, 72, 96, 128, 152, 167, 180, 192, 256, 384, 512, 1024];
const NORMAL = path.join(__dirname, "icon.svg");
const MASKABLE = path.join(__dirname, "icon-maskable.svg");

(async () => {
  for (const size of SIZES) {
    const name = size === 1024 ? "icon-1024.png" : `icon-${size}.png`;
    await sharp(NORMAL).resize(size, size).png().toFile(path.join(outDir, name));
  }
  await sharp(MASKABLE).resize(512, 512).png().toFile(path.join(outDir, "icon-maskable-512.png"));

  // favicon a 32px + ICO per Windows
  await sharp(NORMAL).resize(32, 32).png().toFile(path.join(root, "favicon.png"));

  // icona social / Open Graph
  await sharp({
    create: { width: 1200, height: 630, channels: 4, background: "#dff1ff" }
  })
    .composite([{ input: await sharp(NORMAL).resize(430, 430).png().toBuffer(), gravity: "center" }])
    .png()
    .toFile(path.join(root, "build", "og-image.png"));

  console.log("✔ icone generate in icons/");
})().catch(err => {
  console.error("Errore nella generazione delle icone:", err);
  process.exit(1);
});
