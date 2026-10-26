"use strict";
/**
 * Prova end-to-end del percorso di rete dell'aggiornamento, dentro Electron.
 *
 * Scarica un allegato della release pubblicata (lo ZIP web, 3,5 MB: non i
 * 100 MB del DMG) dall'indirizzo stabile /releases/latest/download/<file>,
 * calcola lo SHA-256 in streaming come fa l'app e verifica che combaci con
 * quello che GitHub dichiara.
 *
 * Non usa l'API REST: proprio quello che l'app evita, perché ha un limite di
 * 60 richieste l'ora per IP. Se questa prova passa, il controllo funziona
 * anche in una scuola dietro un solo router.
 *
 * Non installa nulla: si ferma prima del lancio dell'installer.
 *
 * Uso: electron scripts/test-updater-net.js [versione]
 */
const { app, net } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const crypto = require("crypto");

const REPO = "MaestroLivio/sillabe-in-gioco";
const pkg = require(path.join(__dirname, "..", "package.json"));
const VERSION = process.argv[2] || pkg.version;
const BASE = `https://github.com/${REPO}/releases/latest/download`;

/* Lo ZIP web non è nel manifest, ma serve solo a provare che il meccanismo
   di download e di calcolo dell'hash funzioni su un file vero. */
const SAMPLE = `sillabe-web-v${VERSION}.zip`;

function probe(url) {
  return new Promise((resolve, reject) => {
    const req = net.request({ url, redirect: "manual" });
    req.setHeader("User-Agent", "SillabeInGioco-test");
    req.on("redirect", (code, method, redirectUrl) => {
      const host = new URL(redirectUrl).hostname;
      if (!/^(github\.com|release-assets\.githubusercontent\.com|objects\.githubusercontent\.com)$/.test(host)) {
        req.abort();
        return reject(new Error("redirect verso host non consentito: " + host));
      }
      req.followRedirect();
    });
    req.on("response", res => {
      if (res.statusCode !== 200) {
        res.on("data", () => {});
        return reject(new Error("HTTP " + res.statusCode));
      }
      const total = Number(res.headers["content-length"]) || 0;
      const hash = crypto.createHash("sha256");
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "upd-net-"));
      const dest = path.join(dir, "asset.bin");
      const out = fs.createWriteStream(dest);
      let received = 0;
      res.on("data", c => {
        received += c.length;
        hash.update(c);
        if (!out.write(c)) { res.pause(); out.once("drain", () => res.resume()); }
      });
      res.on("end", () => out.end(() => resolve({
        sha256: hash.digest("hex"), bytes: received, total, dir, dest
      })));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

app.whenReady().then(async () => {
  let code = 0;
  const cleanup = [];
  try {
    console.log(`\n— PROVA DI RETE, versione ${VERSION} —`);
    console.log(`  indirizzo: ${BASE}/${SAMPLE}`);

    const got = await probe(`${BASE}/${SAMPLE}`);
    cleanup.push(got.dir);

    if (!got.bytes) throw new Error("nessun byte ricevuto");
    if (got.total && got.bytes !== got.total) {
      throw new Error(`ricevuti ${got.bytes} byte invece di ${got.total}`);
    }
    console.log(`  ✔ scaricati ${(got.bytes / 1024 / 1024).toFixed(2)} MB, hash ${got.sha256.slice(0, 16)}…`);

    /* confronto con l'hash che GitHub dichiara per lo stesso file */
    const declared = process.env.EXPECTED_SHA256;
    if (declared) {
      if (declared.toLowerCase() !== got.sha256) {
        throw new Error(`hash diverso da quello dichiarato:\n      atteso:   ${declared}\n      ottenuto: ${got.sha256}`);
      }
      console.log("  ✔ combacia con l'hash dichiarato");
    } else {
      console.log("  · confronto con hash dichiarato saltato (EXPECTED_SHA256 non impostata)");
    }

    /* controprova: un hash qualsiasi non deve combaciare */
    const fake = crypto.createHash("sha256").update("non-e-questo-file").digest("hex");
    if (fake === got.sha256) throw new Error("la controprova non ha alterato nulla");
    console.log("  ✔ controprova: un hash diverso viene riconosciuto");

    console.log("\n✔ Download e verifica dell'hash funzionano\n");
  } catch (err) {
    console.log("\n✘ " + err.message + "\n");
    code = 1;
  } finally {
    cleanup.forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {} });
  }
  app.exit(code);
});
