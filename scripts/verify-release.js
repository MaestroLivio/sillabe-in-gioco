#!/usr/bin/env node
"use strict";
/**
 * Verifica gli artefatti di una release pubblicata su GitHub.
 *
 * Non basta che la CI sia verde: questo script scarica i pacchetti
 * effettivamente pubblicati e controlla che contengano le 40 illustrazioni.
 * Nei pacchetti desktop le immagini stanno dentro `app.asar` (non come file
 * sciolti), quindi la verifica apre l'archivio invece di cercare per nome.
 *
 * Uso:
 *   node scripts/verify-release.js v2.0.2
 *   node scripts/verify-release.js v2.0.2 --keep   # conserva i download
 */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const TAG = process.argv[2] || "v2.0.2";
const KEEP = process.argv.includes("--keep");
const REPO = "MaestroLivio/sillabe-in-gioco";
const EXPECTED = 40;

const WORK = path.join(os.tmpdir(), `sillabe-release-${TAG.replace(/[^\w.]/g, "")}`);
const ASAR = path.join(__dirname, "..", "node_modules", ".bin", "asar");
const SEVEN = path.join(
  __dirname, "..", "node_modules", "7zip-bin", "mac",
  process.arch === "arm64" ? "arm64" : "x64", "7za"
);

function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 64 * 1024 * 1024,
    ...opts
  });
}

function trySh(cmd, args, opts = {}) {
  try {
    return sh(cmd, args, opts);
  } catch (e) {
    return null;
  }
}

function download(name) {
  try {
    sh("gh", ["release", "download", TAG, "--repo", REPO, "--pattern", name, "--dir", WORK, "--clobber"]);
    return path.join(WORK, name);
  } catch (e) {
    return null;
  }
}

/** Elenca i file dentro un app.asar. */
function asarList(asarPath) {
  if (!asarPath || !fs.existsSync(asarPath)) return null;
  const out = trySh(ASAR, ["list", asarPath]);
  return out ? out.split("\n").filter(Boolean) : null;
}

/** Conta le illustrazioni in una lista di percorsi asar. */
function countIllustrations(files) {
  if (!files) return 0;
  return files.filter(f => /^\/illustrations\/\d\d\.png$/.test(f.trim())).length;
}

/** Trova app.asar dentro una cartella estratta. */
function findAsar(dir) {
  if (!dir || !fs.existsSync(dir)) return null;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const entry of fs.readdirSync(cur, { withFileTypes: true })) {
      const p = path.join(cur, entry.name);
      if (entry.isFile() && entry.name === "app.asar") return p;
      if (entry.isDirectory()) stack.push(p);
    }
  }
  return null;
}

function countLoose(dir) {
  const out = trySh("find", [dir, "-path", "*/illustrations/*.png", "-name", "[0-9][0-9].png"]);
  return out ? out.split("\n").filter(Boolean).length : 0;
}

/* --- formati --- */

/** Zip (PWA, ChromeOS, macOS zip): immagini sciolte oppure dentro app.asar. */
function checkZip(file) {
  const dir = path.join(WORK, "x-" + path.basename(file, ".zip"));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  trySh("unzip", ["-q", "-o", file, "-d", dir]);

  const loose = countLoose(dir);
  if (loose >= EXPECTED) {
    if (!KEEP) fs.rmSync(dir, { recursive: true, force: true });
    return { count: loose, where: "file sciolti" };
  }

  const asarPath = findAsar(dir);
  const n = asarPath ? countIllustrations(asarList(asarPath)) : loose;
  if (!KEEP) fs.rmSync(dir, { recursive: true, force: true });
  return { count: n, where: asarPath ? "app.asar" : "nessun asar" };
}

/**
 * .deb: formato GNU ar. Il comando `ar` di macOS non legge i .deb moderni,
 * quindi l'archivio viene aperto direttamente, membro per membro.
 */
function checkDeb(file) {
  const buf = fs.readFileSync(file);
  if (buf.slice(0, 8).toString("latin1") !== "!<arch>\n") {
    return { count: 0, where: "intestazione ar assente" };
  }
  let i = 8;
  let data = null;
  while (i + 60 <= buf.length) {
    const name = buf.slice(i, i + 16).toString("latin1").trim().replace(/\/$/, "");
    const size = parseInt(buf.slice(i + 48, i + 58).toString("latin1").trim(), 10);
    const start = i + 60;
    if (name.startsWith("data.tar")) data = buf.slice(start, start + size);
    i = start + size + (size % 2);
  }
  if (!data) return { count: 0, where: "data.tar assente" };

  const tarPath = path.join(WORK, "deb-data.tar");
  fs.writeFileSync(tarPath, data);
  const outDir = path.join(WORK, "deb-x");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  // tar riconosce da solo .xz e .gz
  trySh("tar", ["xf", tarPath, "-C", outDir]);

  const asarPath = findAsar(outDir);
  const n = asarPath ? countIllustrations(asarList(asarPath)) : countLoose(outDir);
  if (!KEEP) fs.rmSync(outDir, { recursive: true, force: true });
  return { count: n, where: asarPath ? "app.asar" : "nessun asar" };
}

/**
 * AppImage e installer NSIS: si estraggono con il 7za incluso in 7zip-bin.
 *
 * Un'AppImage è uno script con l'immagine squashfs in coda: `7za` estrae
 * solo lo script, quindi l'immagine va ritagliata all'offset del superblocco
 * (`hsqs` seguito dalla versione 4) e aperta con unsquashfs.
 */
function checkSevenZip(file) {
  const dir = path.join(WORK, "7z-" + path.basename(file).replace(/\W+/g, "_"));
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  trySh(SEVEN, ["x", "-y", "-o" + dir, file]);

  let asarPath = findAsar(dir);

  // AppImage: ritaglia l'immagine squashfs e la espande
  if (!asarPath && /\.AppImage$/i.test(file)) {
    const buf = fs.readFileSync(file);
    let offset = -1;
    for (let i = 0; i + 30 <= buf.length; i++) {
      if (buf[i] === 0x68 && buf[i + 1] === 0x73 && buf[i + 2] === 0x71 && buf[i + 3] === 0x73) {
        if (buf.readUInt16LE(i + 28) === 4) { offset = i; break; }
      }
    }
    if (offset > 0) {
      const img = path.join(dir, "image.squashfs");
      fs.writeFileSync(img, buf.subarray(offset));
      const out = path.join(dir, "squash");
      fs.mkdirSync(out, { recursive: true });
      trySh("unsquashfs", ["-quiet", "-f", "-d", out, img]);
      asarPath = findAsar(out);
    }
  }

  const n = asarPath ? countIllustrations(asarList(asarPath)) : countLoose(dir);
  if (!KEEP) fs.rmSync(dir, { recursive: true, force: true });
  return { count: n, where: asarPath ? "app.asar" : "nessun asar" };
}

/**
 * DMG macOS: si monta in sola lettura con hdiutil e si ispeziona l'app.
 * `7za` non apre questo formato, quindi serve lo strumento di sistema.
 */
function checkDmg(file) {
  if (process.platform !== "darwin") return { count: 0, where: "hdiutil non disponibile" };
  const mnt = fs.mkdtempSync(path.join(os.tmpdir(), "sillabe-dmg-"));
  try {
    sh("hdiutil", ["attach", file, "-nobrowse", "-readonly", "-mountpoint", mnt]);
    const asarPath = findAsar(mnt);
    const n = asarPath ? countIllustrations(asarList(asarPath)) : 0;
    return { count: n, where: asarPath ? "app.asar" : "nessun asar" };
  } catch (e) {
    return { count: 0, where: "DMG non montabile" };
  } finally {
    trySh("hdiutil", ["detach", mnt, "-quiet", "-force"]);
    fs.rmSync(mnt, { recursive: true, force: true });
  }
}

/* --- main --- */

(async () => {
  console.log(`Verifica della release ${TAG} di ${REPO}\n`);
  fs.mkdirSync(WORK, { recursive: true });

  const info = JSON.parse(
    sh("gh", ["release", "view", TAG, "--repo", REPO, "--json", "assets,tagName,publishedAt"])
  );
  console.log(`Release ${info.tagName} — ${info.assets.length} asset, pubblicata il ${info.publishedAt}\n`);

  const problems = [];
  const rows = [];

  for (const asset of info.assets) {
    const name = asset.name;
    const file = download(name);
    if (!file) {
      problems.push(`${name}: download fallito`);
      continue;
    }

    let res;
    if (/\.zip$/i.test(name)) res = checkZip(file);
    else if (/\.deb$/i.test(name)) res = checkDeb(file);
    else if (/\.dmg$/i.test(name)) res = checkDmg(file);
    else res = checkSevenZip(file);

    rows.push({ name, count: res.count, where: res.where, mb: (asset.size / 1048576).toFixed(0) });
    if (res.count !== EXPECTED) problems.push(`${name}: ${res.count}/${EXPECTED} illustrazioni (${res.where})`);
  }

  console.log("Artefatto".padEnd(42) + "PNG".padStart(5) + "  " + "Dove".padEnd(14) + "MB".padStart(4));
  console.log("-".repeat(70));
  rows.forEach(r => {
    console.log(r.name.padEnd(42) + String(r.count).padStart(5) + "  " + r.where.padEnd(14) + String(r.mb).padStart(4));
  });

  console.log("");
  if (problems.length) {
    console.error(`✖ ${problems.length} problemi:`);
    problems.forEach(p => console.error("  " + p));
    process.exitCode = 1;
  } else {
    console.log(`✔ Tutti i ${rows.length} artefatti pubblicati contengono le ${EXPECTED} illustrazioni`);
  }

  if (!KEEP) fs.rmSync(WORK, { recursive: true, force: true });
  else console.log(`\nDownload conservati in ${WORK}`);
})().catch(e => {
  console.error(e);
  process.exit(1);
});
