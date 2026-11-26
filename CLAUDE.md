# La Gelateria Automatica — istruzioni per Claude

- Il gioco è in italiano: testi e messaggi per ragazzi di 12–13 anni.
- I sorgenti sono in `src/`; i file pubblicati (`index.html`, `prova-diorama.html`) si generano con
  `python3 strumenti/build.py src/index.html index.html` (e lo stesso per `src/prova-diorama.html`).

## Versione del software

- Il numero di versione è nel file `VERSIONE` (es. `1.1`). La build lo scrive nella home, in basso a sinistra, insieme a data e ora della build (`@VERSIONE@` in `src/index.html`).
- **A ogni modifica pubblicata**: aumenta di 1 la seconda cifra di `VERSIONE` (1.1 → 1.2 → 1.3…), rifai la build, fai commit e push.
- **In fondo a ogni risposta** in cui pubblichi una modifica, scrivi sempre il numero della versione pubblicata, per esempio: `Versione pubblicata: v1.2`.
