/**
 * LA GELATERIA AUTOMATICA — classifica online su Foglio Google
 *
 * Il Foglio ha due schede:
 *  - "Gruppi":    Codice gruppo | Attivo (SI/NO) | Note     <- le compili tu
 *  - "Punteggi":  Data | Gruppo | Nickname | Profitto | Tentativo   <- le scrive il gioco
 *
 * Il gioco chiama questo script con:
 *   ?azione=gruppo&codice=XXX                     -> il gruppo esiste ed è attivo?
 *   ?azione=salva&gruppo=XXX&nick=YYY&profitto=N&tentativo=N
 *   ?azione=classifica&gruppo=XXX                 -> miglior profitto di ogni nickname del gruppo
 */
const FOGLIO_GRUPPI = 'Gruppi';
const FOGLIO_PUNTEGGI = 'Punteggi';
const INTEST_GRUPPI = ['Codice gruppo', 'Attivo (SI/NO)', 'Note'];
const INTEST_PUNTEGGI = ['Data', 'Gruppo', 'Nickname', 'Profitto', 'Tentativo'];
const PROFITTO_MASSIMO = 10000; // scarta punteggi impossibili

function doGet(e) {
  const p = (e && e.parameter) || {};
  let out;
  try {
    if (p.azione === 'gruppo') out = verificaGruppo(p.codice);
    else if (p.azione === 'salva') out = salva(p);
    else if (p.azione === 'classifica') out = classifica(p.gruppo);
    else out = { ok: false, errore: 'azione sconosciuta' };
  } catch (err) {
    out = { ok: false, errore: String(err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

/** Esegui questa funzione UNA volta per creare le due schede. */
function prepara() {
  const g = foglio(FOGLIO_GRUPPI, INTEST_GRUPPI);
  if (g.getLastRow() < 2) g.appendRow(['PROVA', 'SI', 'gruppo per provare il gioco']);
  foglio(FOGLIO_PUNTEGGI, INTEST_PUNTEGGI);
}

function norm(s) { return String(s == null ? '' : s).trim().toLowerCase(); }

// Evita che un nickname come "=SOMMA(...)" diventi una formula nel foglio.
function testoSicuro(s) {
  const t = String(s == null ? '' : s).trim();
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function foglio(nome, intestazioni) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(intestazioni);
    sh.setFrozenRows(1);
  }
  return sh;
}

function trovaGruppo(codice) {
  const k = norm(codice);
  if (!k) return null;
  const righe = foglio(FOGLIO_GRUPPI, INTEST_GRUPPI).getDataRange().getValues().slice(1);
  for (const r of righe) {
    const cod = String(r[0]).trim();
    if (cod && norm(cod) === k && norm(r[1]) !== 'no') return cod;
  }
  return null;
}

function verificaGruppo(codice) {
  const g = trovaGruppo(codice);
  return g ? { ok: true, codice: g } : { ok: false, errore: 'gruppo non trovato' };
}

function salva(p) {
  const g = trovaGruppo(p.gruppo);
  if (!g) return { ok: false, errore: 'gruppo non trovato' };
  const nick = String(p.nick || '').trim().slice(0, 14);
  const profitto = Math.round(Number(p.profitto));
  if (!nick) return { ok: false, errore: 'nickname mancante' };
  if (!isFinite(profitto) || Math.abs(profitto) > PROFITTO_MASSIMO) return { ok: false, errore: 'punteggio non valido' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    foglio(FOGLIO_PUNTEGGI, INTEST_PUNTEGGI)
      .appendRow([new Date(), g, testoSicuro(nick), profitto, Number(p.tentativo) || '']);
  } finally {
    lock.releaseLock();
  }
  return { ok: true };
}

function classifica(codice) {
  const g = trovaGruppo(codice);
  if (!g) return { ok: false, errore: 'gruppo non trovato' };
  const righe = foglio(FOGLIO_PUNTEGGI, INTEST_PUNTEGGI).getDataRange().getValues().slice(1);
  const migliori = {};
  for (const r of righe) {
    if (norm(r[1]) !== norm(g)) continue;
    const nick = String(r[2]).replace(/^'/, '');
    const k = norm(nick), pr = Number(r[3]);
    if (!k || !isFinite(pr)) continue;
    if (!migliori[k]) migliori[k] = { nick: nick, best: pr, tentativi: 0 };
    migliori[k].tentativi++;
    if (pr > migliori[k].best) migliori[k].best = pr;
  }
  const lista = Object.keys(migliori).map(k => migliori[k]).sort((a, b) => b.best - a.best);
  return { ok: true, gruppo: g, righe: lista.slice(0, 50), totale: lista.length };
}
