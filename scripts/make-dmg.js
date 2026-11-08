"use strict";
/**
 * Crea il DMG di macOS direttamente con `hdiutil`, senza passare da electron-builder.
 *
 * Perché: electron-builder crea il DMG montandolo in /Volumes e impostando la
 * disposizione della finestra via AppleScript. Se il sistema non concede
 * l'automazione di Finder (o Finder/Spotlight tengono occupato il volume),
 * `hdiutil detach` restituisce "resource busy" e la build esce con codice 1
 * benché DMG e ZIP siano già stati scritti correttamente.
 *
 * Qui invece si prepara una cartella temporanea con l'app e il collegamento ad
 * /Applications e si crea l'immagine in un solo passaggio: nessun volume da
 * smontare, nessuna automazione di Finder, esito deterministico.
 *
 * Uso: node scripts/make-dmg.js arm64|x64
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const pkg = require(path.join(ROOT, "package.json"));
const productName = pkg.productName || pkg.name;
const version = pkg.version;

const arch = process.argv[2];
if (!["arm64", "x64"].includes(arch)) {
  console.error("Specifica l'architettura: arm64 oppure x64");
  process.exit(1);
}

const appDir = path.join(ROOT, "dist", arch === "arm64" ? "mac-arm64" : "mac");
const appPath = path.join(appDir, `${productName}.app`);
if (!fs.existsSync(appPath)) {
  console.error(`App non trovata: ${appPath}\nEsegui prima la build con electron-builder.`);
  process.exit(1);
}

const outName = arch === "arm64" ? `${productName}-${version}-arm64.dmg` : `${productName}-${version}.dmg`;
const outPath = path.join(ROOT, "dist", outName);

const staging = fs.mkdtempSync(path.join(os.tmpdir(), "dmg-"));

try {
  // `cp -c` usa la clonazione APFS: copia istantanea senza occupare spazio extra.
  const copy = (src, dest, clone) => {
    try {
      execFileSync("cp", clone ? ["-R", "-c", src, dest] : ["-R", src, dest], { stdio: "pipe" });
    } catch {
      execFileSync("cp", ["-R", src, dest], { stdio: "inherit" });
    }
  };

  copy(appPath, path.join(staging, `${productName}.app`), true);
  fs.symlinkSync("/Applications", path.join(staging, "Applications"), "dir");

  if (fs.existsSync(outPath)) fs.unlinkSync(outPath);

  const sizeMb = Math.max(64, Math.ceil(fs.statSync(path.join(staging, `${productName}.app`)).size / 1e6) + 512);
  execFileSync("hdiutil", [
    "create",
    "-srcfolder", staging,
    "-volname", `${productName} ${version}`,
    "-fs", "HFS+",
    "-format", "UDZO",
    "-size", `${sizeMb}m`,
    "-ov",
    "-quiet",
    outPath
  ], { stdio: "inherit" });

  const size = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
  console.log(`✔ ${outName} (${size} MB)`);
} finally {
  fs.rmSync(staging, { recursive: true, force: true });
}
