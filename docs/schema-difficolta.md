# La Gelateria Automatica — schema della difficoltà

Il gioco non mostra tutto subito: parte da una sola idea (il meteo) e aggiunge **una cosa nuova alla volta**.
Il robot della gelateria applica le regole SE… ALLORA… che scrive lo studente.

I numeri si cambiano in `src/index.html`:
- giorni e contenuto delle fasi → `CONFIG.fasi`
- eventi delle altre materie → `CONFIG.eventi`
- tutorial → `CONFIG.tutorial` e `TUT`
- durata delle animazioni → `GRAFICA3D`

---

## 1. Panoramica iniziale (circa 1 minuto e mezzo, si può saltare)

Una giornata raccontata dalla camera, che scorre da sinistra a destra:
1. 🌅 Mattina: i ragazzi entrano a scuola.
2. 🍦 Il gelataio apre.
3. 😍 Arrivano i clienti contenti.
4. 😠 I coni finiscono e chi arriva dopo si arrabbia.
5. 🌇 Sera: il gelataio chiude.
6. 🌙 Notte: il furgone porta gli ingredienti.
7. 🔄 La camera gira sulla città.
8. 🌧️ Un nuovo giorno con la pioggia.

---

## 2. Tutorial (3 giorni, meteo noto, clienti fissi)

Il primo blocco del gestionale, **"Cosa c'è da fare?"**, è diviso in tre parti:

| Parte | Titolo | Cosa c'è |
|---|---|---|
| **A** | Guarda il meteo | Pulsante **📡 Ricevi dati meteo**: si apre una schermata con l'antenna che manda onde, i numeri 0/1 che viaggiano fino allo schermo e poi la previsione (es. ☀️ SOLE). |
| **B** | Decidi cosa fare | Es. "Se domani c'è il ☀️ sole: arriveranno tantissimi clienti! Bisogna dire al robot cosa fare." |
| **C** | Insegna al robot | "Il robot preparerà i coni gelato già pronti per essere venduti. Ma tu gli devi dire quanti coni preparare, il giorno prima per il giorno dopo." Sotto c'è la regola da copiare (blocchi giallo e azzurro). |

Note:
- B e C restano **chiuse con un lucchetto** finché non si ricevono i dati meteo.
- Anche "AVVIA" chiede di ricevere prima i dati meteo.
- Il pulsante **✨ Aiutami** è nel blocco 2 ("Regole del robot"), accanto a ➕ Aggiungi regola.

| Giorno | Meteo | Clienti | Regola da scrivere | Cosa impara |
|---|---|---|---|---|
| 1 | ☀️ sole | 20 | SE meteo è sole ALLORA produci **30** coni | senza regole il robot non fa niente; i 10 coni avanzati si buttano |
| 2 | 🌧️ pioggia | 8 | SE meteo è pioggia ALLORA produci **10** coni | con la pioggia vengono in pochi: con 30 coni ne avresti buttati 22 |
| 3 | ⛅ nuvoloso | 15 | SE meteo è nuvoloso ALLORA produci **20** coni | serve una regola per ogni tempo |

Nel tutorial non c'è l'affitto (si guadagna sempre qualcosa) e il magazzino si riempie da solo.
Prima della sfida un messaggio avvisa che da ora **arriverà molta più gente**.

---

## 3. La sfida: 30 giorni in 7 fasi (ogni fase 3-4 giorni, l'ultima 8)

Alla fine di ogni fase il gioco si ferma: riepilogo della fase e **novità** della fase successiva.

| Fase | Giorni | Durata | Novità (meccanica) | Blocchi nuovi | Magazzino |
|---|---|---|---|---|---|
| 1 | 1–4 | 4 | ☁️ **Meteo** (e arriva molta più gente che nella prova) | SE meteo è… · ALLORA produci… | automatico (il fornitore riporta a 40 kg) |
| 2 | 5–8 | 4 | 📅 **Weekend** | SE oggi è weekend · ALLORA produci in più / in meno | automatico |
| 3 | 9–11 | 3 | 🌡️ **Temperatura** | SE temperatura > / < … | automatico |
| 4 | 12–15 | 4 | 💶 **Prezzo** | ALLORA metti il prezzo a… | automatico |
| 5 | 16–19 | 4 | 📦 **Magazzino** a carico dello studente | SE magazzino < / > … · ALLORA riordina … kg | **manuale** |
| 6 | 20–22 | 3 | 🍨 **Ieri** | SE ieri ho finito / ho buttato… | manuale |
| 7 | 23–30 | **8** | 📡💥 **Stazione meteo rotta** (niente previsioni) | — | manuale |

---

## 4. Gli eventi delle altre materie del corso SIA

Ogni evento viene **annunciato durante una giornata** (mai nel primo giorno di una fase, quando arriva una meccanica nuova).
Da quel momento nel gestionale compare un **avviso con il conto alla rovescia**, e sopra la scena una pillola tipo "🏅 Gara tra 3 giorni".
Nel calendario i giorni speciali hanno un'icona (🏅 🚌 🕵️ 🆚).

| Giorno annuncio | Materia | Evento | Quando | Effetto nel gioco |
|---|---|---|---|---|
| **8** | 🏃 Educazione fisica | **Giochi studenteschi: gara a Todi** | giorno **13** | clienti ×1,6 quel giorno · nuovo blocco **SE 🏅 oggi c'è la gara** |
| **14** | 📈 Economia politica | **Arriva la concorrenza**: apre la Gelateria Rivale (cono a 2,50 €) | dal giorno **17** | se il tuo prezzo supera 2,50 €, perdi molti clienti in più (−60% per ogni € in più) · in 3D compare il chiosco "RIVALE 2,50 €" nel giardino e alcuni clienti vanno lì |
| **15** | 🇬🇧🇫🇷 Inglese e Francese | **Arrivano i turisti**: il pullman si ferma in cima alla strada | giorni **15, 18, 21, 26, 29** | +35 clienti circa (meno con la pioggia) · i turisti hanno sopra la testa un fumetto con la bandiera (inglese o francese) e "Hello!" / "Bonjour!" · nuovo blocco **SE 🚌 oggi arrivano i turisti** |
| **18** | ⚖️ Diritto | **Controllo dell'ASL** | giorno **24** | gli ingredienti arrivati da **5 giorni o più** sono scaduti: vengono buttati e c'è una **multa di 100 €** |

I testi degli annunci spiegano la materia:
- **🏃 Educazione fisica:** al SIA c'è la **curvatura sportiva**: 2 ore in più a settimana di educazione fisica con un esperto di uno sport, ogni anno diverso.
- **📈 Economia politica:** si studia il mercato. Quando più negozi vendono la stessa cosa, i clienti scelgono chi offre di più a meno: è la concorrenza.
- **🗣️ Inglese e Francese:** al SIA si studiano due lingue straniere, per parlare con clienti e aziende di tutto il mondo.
- **⚖️ Diritto:** si studiano le leggi, che valgono anche per le aziende. Il robot segue le tue regole, la gelateria anche quelle della legge.

**Il controllo ASL in pratica**
- Il magazzino è fatto di consegne ("lotti") e il robot usa sempre prima gli ingredienti più vecchi.
- Se si ordina troppo, gli ingredienti restano fermi e scadono.
- Esempi provati con la sfida standard:
  - `SE magazzino < 30 ALLORA riordina 40`: **nessuna multa**;
  - `SE magazzino < 40 ALLORA riordina 60`: **48 kg scaduti + multa**.
- Dall'annuncio in poi, nel gestionale si vede da quanti giorni sono fermi gli ingredienti più vecchi.

**Nei tentativi successivi:**
- gli annunci lunghi non si ripetono, ma compare un messaggio breve;
- i blocchi degli eventi già scoperti restano disponibili.

**Nei risultati:**
- c'è la riga "⚖️ Multa ASL";
- il debug dà consigli specifici: clienti persi alla gara, turisti senza gelato, clienti andati alla concorrenza, multa ASL.

---

## 5. Tempi (velocità 1×, grafica 3D)

- **Tutorial:** circa 25–30 s per giorno, più la ricezione del meteo (circa 4 s).
- **Sfida:** circa 12 s per giorno, quindi circa 6 minuti in tutto, più gli annunci e il tempo per scrivere le regole.
- **Velocità 2× e 4×:** i tempi si dimezzano o si riducono a un quarto.
