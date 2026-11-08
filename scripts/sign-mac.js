"use strict";
/**
 * Firma ad-hoc le app macOS dopo electron-builder e ricrea gli ZIP.
 *
 * Perché serve: la CI esporta `CSC_IDENTITY_AUTO_DISCOVERY=false`, quindi
 * electron-builder lascia l'app con la sola firma *linker-signed* che Electron
 * porta con sé (`Info.plist=not bound`, nessuna risorsa sigillata). Su Apple
 * Silicon macOS verifica la firma del bundle prima di avviarlo e quella firma
 * non basta: l'app arm64 si chiude subito, mentre la build x86_64 (eseguita da
 * Rosetta, che non fa lo stesso controllo) parte lo stesso. È il motivo per cui
 * «la versione per Apple Silicon non si apre, quella universal sì».
 *
 * Non avendo un certificato Apple Developer, la firma possibile è quella
 * **ad-hoc** (`--sign -`): non è riconosciuta da Gatekeeper come sviluppatore,
 * ma è valida sul disco, lega l'Info.plist e sigilla le risorse, quindi
 * `codesign --verify --deep --strict` passa e l'app parte. Gatekeeper chiederà
 * comunque conferma al primo avvio di un pacchetto scaricato.
 *
 * Uso: node scripts/sign-mac.js [arm64|x64]   (senza argomento: entrambe)
 */
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const ROOT = path.join(__dirname, "..");
const pkg = require(path.join(ROOT, "package.json"));
const productName = pkg.productName || pkg.name;
const ENTITLEMENTS = path.join(ROOT, "build", "entitlements.mac.plist");

const wanted = process.argv[2] ? [process.argv[2]] : ["arm64", "x64"];
const errors = [];

function sh(cmd, argv) {
  return execFileSync(cmd, argv, { stdio: ["ignore", "pipe", "pipe"] }).toString();
}

/** Lancia un comando e restituisce stdout+stderr insieme, senza lanciare.
    Serve per `codesign -dv`, che scrive i dettagli su stderr: passando da
    `execFileSync` con `stdio` esplicito il valore di ritorno è `null`. */
function run(cmd, argv) {
  const r = spawnSync(cmd, argv, { encoding: "utf8" });
  return { ok: r.status === 0, out: `${r.stdout || ""}${r.stderr || ""}` };
}

for (const arch of wanted) {
  const dir = path.join(ROOT, "dist", arch === "arm64" ? "mac-arm64" : "mac");
  const app = path.join(dir, `${productName}.app`);
  if (!fs.existsSync(app)) {
    errors.push(`${arch}: app non trovata (${app})`);
    continue;
  }

  try {
    // 0. Su macOS 15 (Sequoia) i file portano l'attributo `com.apple.provenance`
    //    e FinderInfo che codesign rifiuta («resource fork ... not allowed»).
    //    Si lavora su una copia pulita ottenuta con ditto --noextattr, si firma
    //    quella, e si ricopia il bundle firmato in dist/ (il DMG legge da lì).
    const cleanApp = path.join(os.tmpdir(), `sillabe-sign-${arch}.app`);
    if (fs.existsSync(cleanApp)) fs.rmSync(cleanApp, { recursive: true, force: true });
    execFileSync("ditto", ["--noextattr", "--norsrc", app, cleanApp], { stdio: "pipe" });

    // 1. firma ad-hoc del bundle con le entitlements di Electron (JIT, ecc.)
    sh("codesign", [
      "--force", "--deep", "--sign", "-",
      "--options", "runtime",
      "--entitlements", ENTITLEMENTS,
      cleanApp
    ]);

    // 2. verifica: se non passa, il pacchetto non va pubblicato
    sh("codesign", ["--verify", "--deep", "--strict", cleanApp]);

    // 3. dettagli per il log (identifier e Info.plist legato)
    const dv = run("codesign", ["-dv", "--verbose=2", cleanApp]).out;
    const id = (dv.match(/Identifier=(\S+)/) || [])[1] || "?";
    const plistOk = /Info\.plist entries=(\d+)/.test(dv);
    console.log(`✔ ${arch}: firmata ad-hoc (identifier ${id}, info.plist ${plistOk ? "legato" : "NON legato"})`);

    // 4. lo ZIP di electron-builder conteneva la copia non firmata: si rifà
    const zipName = arch === "arm64"
      ? `${productName}-${pkg.version}-arm64-mac.zip`
      : `${productName}-${pkg.version}-mac.zip`;
    const zipPath = path.join(ROOT, "dist", zipName);
    if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
    execFileSync("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", cleanApp, zipPath], { stdio: "pipe" });
    // copia il bundle firmato in dist/ per make-dmg.js (che legge da lì)
    if (fs.existsSync(app)) fs.rmSync(app, { recursive: true, force: true });
    execFileSync("ditto", ["--noextattr", "--norsrc", cleanApp, app], { stdio: "pipe" });
    fs.rmSync(cleanApp, { recursive: true, force: true });

    const mb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);
    console.log(`✔ ${arch}: ${zipName} ricreato dalla copia firmata (${mb} MB)`);
  } catch (e) {
    errors.push(`${arch}: ${String(e.stderr || e.message).trim().split("\n")[0]}`);
  }
}

if (errors.length) {
  console.error("✖ Firma macOS fallita:");
  for (const e of errors) console.error("  " + e);
  process.exit(1);
}
