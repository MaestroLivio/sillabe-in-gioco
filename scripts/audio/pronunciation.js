/**
 * Correzioni di pronuncia per la voce sintetica.
 *
 * La voce di sistema legge il testo senza contesto: alcune sillabe, scritte
 * così come compaiono nella frase, le legge come sigle (lettera per lettera)
 * o con la vocale sbagliata. La tabella qui sotto associa a ogni token la
 * forma grafemica da *pronunciare* (non quella mostrata a schermo: i testi
 * dell'app non cambiano).
 *
 * Regola: `spoken` deve produrre la stessa sillaba del token, non un'altra.
 *  - forme con "c"/"g" dolci si tengono dolci (ci, gia, ge, ...);
 *  - le forme accentate servono solo se la voce sbaglia la vocale;
 *  - mai sostituire con forme che cambiano il suono (es. "gi" -> "ghi"
 *    cambierebbe /dʒi/ in /gi/: sbagliato).
 *
 * L'audit (`node scripts/audio/audit.js`) verifica che ogni `spoken`
 * differisca dalla lettura lettera per lettera e sonori come una sillaba
 * sola; le voci non corrette restano identiche al token.
 */
const OVERRIDES = {
  /* --- forme che la voce compita come sigla ---
     (verificate con audit: durata > soglia E audio == lettere separate) */
};

/* sillabe accentate: servono a evitare che la voce chiuda la vocale */
const ACCENTS = {
  "ché": "ché",
  "perché": "perché",
  "poiché": "poiché",
  "pà": "pà"
};

module.exports = { OVERRIDES, ACCENTS };
