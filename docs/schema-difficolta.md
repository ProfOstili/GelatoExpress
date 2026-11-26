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

**Ogni cliente compra un cono.** Nella città si vedono tutti i clienti: il contatore sul tetto si riempie all'alba (il robot ha lavorato di notte) e scende di uno per ogni cliente servito.

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
| 1 | ☀️ sole | 10 | SE meteo è sole ALLORA produci **15** coni | senza regole il robot non fa niente; i 5 coni avanzati si buttano |
| 2 | 🌧️ pioggia | 4 | SE meteo è pioggia ALLORA produci **5** coni | con la pioggia vengono in pochi: con 15 coni ne avresti buttati 11 |
| 3 | ⛅ nuvoloso | 8 | SE meteo è nuvoloso ALLORA produci **10** coni | serve una regola per ogni tempo |

Nel tutorial non c'è l'affitto (si guadagna sempre qualcosa) e il magazzino si riempie da solo.
Prima della sfida un messaggio avvisa che da ora **arriverà molta più gente**.

---

## 3. La sfida: 30 giorni, 10 turni da 3 giorni, 7 fasi

Ogni "AVVIA" fa giocare **3 giorni** (un round), poi si torna al gestionale (risultati, poi EVENTI). Le novità arrivano sempre all'inizio di un turno.

| Fase | Giorni | Turni | Novità (meccanica) | Blocchi nuovi | Magazzino |
|---|---|---|---|---|---|
| 1 | 1–3 | 1 | ☁️ **Meteo** (e arriva molta più gente che nella prova) | SE meteo è… · ALLORA produci… | automatico (il fornitore riporta a 10 kg) |
| 2 | 4–6 | 1 | 📅 **Weekend** | SE oggi è weekend · ALLORA produci in più / in meno | automatico |
| 3 | 7–9 | 1 | 🌡️ **Temperatura** | SE temperatura > / < … | automatico |
| 4 | 10–15 | 2 | 🏷️ **Prezzo** (selettore "Prezzo del gelato in Einaudi" nelle regole) | ALLORA metti il prezzo a… | automatico |
| 5 | 16–18 | 1 | 📦 **Magazzino** a carico dello studente | SE magazzino < / > … · ALLORA riordina … kg | **manuale** |
| 6 | 19–21 | 1 | 🍨 **Ieri** | SE ieri ho finito / ho buttato… | manuale |
| 7 | 22–30 | 3 | 📡💥 **Stazione meteo rotta** (niente previsioni) | — | manuale |

La moneta del gioco è l'**Einaudi**. Il simbolo è una moneta d'oro con la sagoma del Tempio della Consolazione di Todi e viene presentato nel primo messaggio del tutorial.

Nel gestionale, in basso nel blocco "Cosa c'è da fare?", il riquadro **💰 I conti della gelateria** ricorda quanto vale ogni cono venduto (il prezzo scelto), il costo degli ingredienti per ogni cono preparato, l'affitto e, quando il magazzino è manuale, il costo della consegna.

**Suoni e segnali:** quando parte un round si sente una fanfara 8-bit. A ogni gelato venduto suona il «cha-ching!» della cassa e accanto al cliente sale per poco la scritta col prezzo e la moneta (es. «+2,50 🪙»). Il pulsante 🔊/🔇 spegne anche gli effetti sonori.

Alla fine di ogni round di 3 giorni compaiono due schermate:
1. **i risultati**: guadagno, coni venduti, clienti persi, coni buttati, il conto del guadagno (incassi − ingredienti − affitto − consegne − multa) ed eventuale esito del controllo ASL;
2. **📣 EVENTI**: la novità del nuovo round (per esempio il weekend). Con la stessa intestazione compaiono anche gli annunci delle altre materie.

**Quanti clienti:** ogni cliente compra un cono. In un giorno normale di sole vengono **20–30 persone** (di più col caldo sopra i 30 °C e nel weekend: +30%), con le nuvole circa 12–18, con la pioggia circa 4–8. Magazzino: 10 kg all'inizio (1 kg = 10 coni), al massimo 25 kg. Affitto 15 al giorno, consegna 3, ingredienti 0,80 a cono, prezzo normale 2,50 Einaudi.

---

## 4. Gli eventi delle altre materie del corso SIA

Ogni evento è **annunciato nel gestionale**, all'inizio di un turno, e accade **sempre in un giorno successivo**, così il giocatore fa in tempo a scrivere le regole. Da quel momento c'è l'avviso con il conto alla rovescia; durante la simulazione compaiono solo avvisi brevi.

| Annuncio (gestionale del giorno) | Materia | Evento | Quando | Effetto nel gioco |
|---|---|---|---|---|
| **7** | 🏃 Educazione fisica | Giochi studenteschi: gara a Todi | giorno **13** | clienti ×1,6 · blocco **SE 🏅 oggi c'è la gara** · in 3D la corsa con l'arco a scacchi e il cartellone "Giochi Studenteschi" |
| **10** | 📈 Economia politica | Apre la Gelateria Rivale (cono a 2,50) | dal giorno **14** | oltre 2,50 si perdono molti clienti · chiosco con il cartellone "Gelati più buoni!" |
| **13** | 🇬🇧🇫🇷 Inglese e Francese | Arrivano i turisti col pullman | giorni **14, 17, 20, 23, 26, 29** | +9 clienti circa · fumetti con le bandiere · blocco **SE 🚌 oggi arrivano i turisti** |
| **19** | ⚖️ Diritto | Controllo dell'ASL | giorno **24** | ingredienti arrivati da 5 giorni o più = scaduti: buttati e **multa di 25** |

## 5. Come conta il robot (regole che valgono insieme)

Il robot legge le regole **dall'alto in basso** e applica tutte quelle vere:
- **🍦 produci X** imposta il numero, come `coni = X`: se ne valgono più di una, vince quella più in basso;
- **➕ produci in più X / ➖ produci in meno X** aggiungono o tolgono, come `coni = coni + X`.

Esempio: SE nuvoloso → produci 20, SE weekend → ➕ 35. In un weekend nuvoloso il robot fa 20 + 35 = **55 coni**.
Nel gestionale, dalla fase del weekend, il riquadro "🧮 Come conta il robot" lo spiega. Nella simulazione, "🧮 Il conto del robot" mostra il calcolo passo per passo.

**Perché "produci" non si somma:** meteo e temperatura descrivono la stessa giornata. Con "SE sole → produci 26" e "SE temperatura > 30 → produci 30", sommando si arriverebbe a 56 coni invece di 30.

**Alternative da valutare in futuro** (per ora non attive):
1. **Tutte le regole si sommano.** È la più intuitiva, ma bisogna riscrivere gli esempi della temperatura come "➕ in più" (es. temperatura > 30 → ➕ 6). C'è il rischio di raddoppiare la produzione a chi mette insieme meteo e temperatura.
2. **"Produci" solo nella prima regola che vale.** La prima regola vera fissa la base e le successive possono solo aggiungere o togliere (➕/➖). È chiara, ma lascia meno libertà.

Il codice da cambiare è in `src/index.html`, funzione `eseguiProgramma`.

## 6. Tempi (velocità 1×, grafica 3D)

- **Tutorial:** circa 25–30 s per giorno, più la ricezione del meteo (circa 4 s).
- **Sfida:** circa 12 s per giorno, quindi circa 6 minuti in tutto, più gli annunci e il tempo per scrivere le regole.
- **Velocità 2× e 4×:** i tempi si dimezzano o si riducono a un quarto.

---

## 7. Presentazione per l'open day

Si apre `index.html?promo` (online: https://profostili.github.io/GelatoExpress/?promo).
1. Si sceglie la musica (si può ascoltare un pezzetto): ⚡ Sfida elettronica, 👾 Arcade 8-bit, 🎬 Epica.
2. Si avvia la registrazione dello schermo e si preme "Avvia la presentazione".

La presentazione dura circa **1 minuto e 50 secondi**, con il tempo di leggere ogni scritta. La musica di base è 👾 Arcade 8-bit, usata anche nella panoramica del gioco.

| Secondi | Scena |
|---|---|
| 0–9 | Titolo: "ITCG Einaudi: SIAmo gli studenti che programmano il futuro" · "Pensi di essere in grado di gestire una GELATERIA AUTOMATICA!?" · "Ti aspetto all'open day" |
| 9–17 | Zoom out dalla scuola mentre i ragazzi entrano, poi tutta Todi |
| 17–25 | Il gelataio porta dentro i pacchi, porta fuori il bancone e apre |
| 25–40 | 3 coni e 5 clienti, uno alla volta: 3 felici, poi una pausa con i cartelli con la X rossa, poi 2 arrabbiati. Scritta "Studia il mercato e come fare impresa" |
| 40–51 | Sera e notte: il robot prepara i coni dietro la vetrina |
| 51–71 | Sole, nuvoloso, pioggia, con la scritta in alto "Dovrai scegliere quanto produrre in base… al METEO" |
| 71–96 | Gli eventi, circa 6 s ciascuno, con la scritta in alto "Dovrai scegliere quanto produrre in base… a degli EVENTI IMPREVISTI" e la materia in basso a destra: la gara (Potenziamento sportivo), la Gelateria Rivale (Economia Politica), i turisti (Inglese e Francese), il controllo ASL con la multa (Diritto) |
| 96–106 | "Chi vincerà?!" con la classifica e "Ti aspetto all'open day dell'ITCG Einaudi di Todi per sfidarmi!" |
| 106–109 | Dissolvenza in nero |

I tempi si cambiano in `avviaPromo()` (oggetto `T`, i secondi di inizio di ogni scena).
