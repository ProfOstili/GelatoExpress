# Classifica online con Foglio Google

Configurazione da fare **una volta sola**, circa 5 minuti.

## 1. Crea il Foglio e lo script
1. Vai su [sheets.google.com](https://sheets.google.com) e crea un foglio vuoto (es. "Gelateria – Classifica").
2. Menu **Estensioni → Apps Script**.
3. Cancella il codice che trovi, incolla tutto il contenuto di `Codice.gs` e premi 💾 **Salva**.
4. In alto scegli la funzione **`prepara`** e premi ▶ **Esegui**.
   Google chiede le autorizzazioni: accetta con il tuo account.
   Se compare "Google non ha verificato questa app", scegli **Avanzate → Vai a … (non sicura)**: lo script è tuo.
   Nel Foglio compaiono le schede **Gruppi** e **Punteggi**.

## 2. Pubblica lo script come app web
1. In Apps Script: **Esegui il deployment → Nuovo deployment**.
2. Tipo (⚙️): **App web**.
3. *Esegui come*: **Me**. *Chi ha accesso*: **Chiunque**.
4. Premi **Esegui il deployment** e copia l'**URL dell'app web** (finisce con `/exec`).

## 3. Collega il gioco
In `index.html`, nell'oggetto `CONFIG` in cima, incolla l'URL:

```js
classificaOnline: { url: 'https://script.google.com/macros/s/……/exec', timeoutMs: 8000 },
```

## Uso quotidiano: i gruppi
Nella scheda **Gruppi** aggiungi una riga per ogni gruppo nuovo:

| Codice gruppo | Attivo (SI/NO) | Note |
|---|---|---|
| 3B-MATTINA | SI | Open day 25/11 |
| SCUOLA-ROSSI | SI | |

- I ragazzi scrivono nickname + codice gruppo (maiuscole/minuscole non contano).
- Un codice che non esiste o con **NO** nella colonna "Attivo" viene rifiutato.
- La classifica mostra solo i ragazzi dello stesso gruppo (miglior profitto di ogni nickname).
- Per togliere un nickname inappropriato basta cancellarne le righe nella scheda **Punteggi**.
- Se lo modifichi, `Codice.gs` va ripubblicato: **Esegui il deployment → Gestisci deployment → ✏️ → Nuova versione**. L'URL resta lo stesso.

## Note
- **Senza internet** il gioco funziona lo stesso: la classifica è quella del PC e i punteggi vengono inviati alla partita successiva con la connessione.
- **Dati salvati**: solo nickname, gruppo, profitto, tentativo e data. Nel gioco c'è l'avviso "Non usare il tuo vero nome".
- Chi conosce l'URL dello script potrebbe inviare un punteggio finto: per un'attività di orientamento è un rischio accettabile, e i punteggi impossibili (oltre ±10.000 €) vengono comunque scartati.
- La classifica online funziona con il gioco aperto dal PC (doppio clic) o pubblicato su GitHub Pages. Nell'anteprima su claude.ai non funziona, perché lì i collegamenti esterni sono bloccati: la classifica resta locale.
