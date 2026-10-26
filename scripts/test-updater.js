"use strict";
/* Verifica la logica pura dell'updater: confronto versioni e nomi dei pacchetti.
   Uso: node scripts/test-updater.js */

const path = require("path");
const Module = require("module");

/* updater.js richiede "electron" solo per app/dialog/net/shell: per questa
   prova bastano poche finte, così il file si può caricare fuori da Electron. */
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "electron") {
    return {
      app: { getVersion: () => "2.2.5", getName: () => "Sillabe in Gioco", getPath: () => "/tmp" },
      dialog: {},
      shell: {},
      net: {}
    };
  }
  return originalLoad.apply(this, arguments);
};

const fs = require("fs");
const { compareVersions, platformKey, validateManifest } = require(path.join(__dirname, "..", "desktop", "updater.js"));

let failures = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures++;
    console.log(`  ✘ ${label}\n      atteso:  ${JSON.stringify(expected)}\n      ottenuto: ${JSON.stringify(actual)}`);
  } else {
    console.log(`  ✔ ${label}`);
  }
}

console.log("\n— CONFRONTO VERSIONI —");
check("2.2.5 vs 2.2.5", compareVersions("2.2.5", "2.2.5"), 0);
check("2.2.6 vs 2.2.5 (nuova)", compareVersions("2.2.6", "2.2.5"), 1);
check("2.2.4 vs 2.2.5 (vecchia)", compareVersions("2.2.4", "2.2.5"), -1);
check("2.10.0 vs 2.9.9 (numero, non testo)", compareVersions("2.10.0", "2.9.9"), 1);
check("3.0.0 vs 2.99.99", compareVersions("3.0.0", "2.99.99"), 1);
check("tag con v: v2.2.6 vs 2.2.5", compareVersions("v2.2.6", "2.2.5"), 1);
check("pre-release è più vecchia: 2.3.0-beta vs 2.3.0", compareVersions("2.3.0-beta", "2.3.0"), -1);
check("stabile batte pre-release: 2.3.0 vs 2.3.0-beta", compareVersions("2.3.0", "2.3.0-beta"), 1);

console.log("\n— NOME DEL PACCHETTO —");
/* La mappa dei nomi vive in scripts/make-update-manifest.js: qui si controlla
   che quei nomi combacino con gli artifactName dichiarati in package.json.
   Se qualcuno rinomina un artefatto, questo controllo lo segnala. */
const pkg = require(path.join(__dirname, "..", "package.json"));
const manifestScript = fs.readFileSync(path.join(__dirname, "make-update-manifest.js"), "utf8");
check("il manifest riconosce SillabeInGioco-Setup-<ver>.exe",
  manifestScript.includes("SillabeInGioco-Setup-"), true);
/* i DMG hanno il nome con spazi in locale e con punti nella release, perché
   actions/upload-artifact li normalizza: il manifest deve accettare entrambi */
check("il manifest accetta i nomi con spazi", /Sillabe\[ \.\]in\[ \.\]Gioco/.test(manifestScript), true);
check("artifactName di package.json combacia",
  pkg.build.nsis.artifactName, "SillabeInGioco-Setup-${version}.${ext}");
check("artifactName portable combacia",
  pkg.build.portable.artifactName, "SillabeInGioco-Portable-${version}.${ext}");

console.log("\n— CHIAVE DI PIATTAFORMA —");
check("macOS arm64", platformKey("darwin", "arm64"), "darwin-arm64");
check("macOS x64", platformKey("darwin", "x64"), "darwin-x64");
check("Windows", platformKey("win32", "x64"), "win32-x64");
check("Linux", platformKey("linux", "x64"), "linux-x64");
check("sistema sconosciuto", platformKey("aix", "ppc"), null);

console.log("\n— VALIDAZIONE DEL MANIFEST —");
const buono = {
  version: "2.2.6",
  pacchetti: {
    "darwin-arm64": {
      file: "Sillabe in Gioco-2.2.6-arm64.dmg",
      sha256: "a".repeat(64),
      byte: 123
    }
  }
};
check("manifest corretto", validateManifest(buono), null);
check("manifest nullo", validateManifest(null), "manifest vuoto");
check("manca la versione", validateManifest({ pacchetti: {} }), "manca la versione");
check("mancano i pacchetti", validateManifest({ version: "2.2.6" }), "mancano i pacchetti");
check("hash non valido", validateManifest({
  version: "2.2.6",
  pacchetti: { "darwin-arm64": { file: "x.dmg", sha256: "corto" } }
}), "pacchetto darwin-arm64 senza hash valido");
check("nome file con percorso (tentativo di uscire dalla cartella)", validateManifest({
  version: "2.2.6",
  pacchetti: { "darwin-arm64": { file: "../../etc/passwd", sha256: "a".repeat(64) } }
}), "pacchetto darwin-arm64 con nome file sospetto");
check("nome file con ../ dentro", validateManifest({
  version: "2.2.6",
  pacchetti: { "darwin-arm64": { file: "..dmg", sha256: "a".repeat(64) } }
}), "pacchetto darwin-arm64 con nome file sospetto");

if (failures) {
  console.log(`\n✘ ${failures} controlli falliti\n`);
  process.exit(1);
}
console.log("\n✔ Controlli dell'aggiornamento superati\n");
