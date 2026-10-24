"use strict";
/**
 * Pulisce i volumi DMG rimasti montati da build precedenti.
 *
 * electron-builder crea il DMG montandolo in /Volumes e poi lo smonta con
 * `hdiutil detach`. Se una build interrotta lascia il volume agganciato, la build
 * successiva fallisce con "unable to execute hdiutil detach" — anche se il DMG è
 * già stato scritto correttamente. Su macOS arm64 e x64 il volume ha lo stesso
 * nome, quindi la seconda architettura trova spesso il residuo della prima.
 *
 * Su altri sistemi operativi non fa nulla.
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PREFIX = "Sillabe in Gioco";

if (process.platform !== "darwin") process.exit(0);

const volumes = fs.existsSync("/Volumes") ? fs.readdirSync("/Volumes") : [];
const stale = volumes.filter(name => name.startsWith(PREFIX));

for (const name of stale) {
  const target = path.join("/Volumes", name);
  let detached = false;
  for (const args of [["detach", target], ["detach", "-force", target]]) {
    try {
      execFileSync("hdiutil", args, { stdio: "ignore" });
      detached = true;
      break;
    } catch {
      /* riprova con -force, poi rinuncia */
    }
  }
  console.log(`${detached ? "Smontato" : "Non smontabile"}: ${name}`);
}

process.exit(0);
