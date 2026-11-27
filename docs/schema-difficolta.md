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

## 3. La sfida: 30 giorni, 10 turni da 3 giorni, 5 fasi

Ogni "AVVIA" fa giocare **3 giorni** (un round), poi si torna al gestionale (risultati, poi EVENTI). Le novità arrivano sempre all'inizio di un turno.

**Il magazzino è sempre automatico:** ogni notte il fornitore riempie il congelatore (il camioncino arriva e scarica, come prima), quindi non ci sono regole sul riordino. Non ci sono nemmeno le regole su "ieri".
**Regole:** al massimo **10** (prima erano 6), così c'è posto per meteo, weekend, temperatura, gara, turisti e prezzo anche quando la stazione meteo è rotta.

### La progressione giorno per giorno

| Giorni | Fase | Novità nel gestionale (inizio del turno) | Eventi annunciati | Cosa succede nei giorni |
|---|---|---|---|---|
| **1–3** | 1 · ☁️ Meteo | Regole sul meteo: SE meteo è… ALLORA 🍦 produci… (arriva molta più gente che nella prova) | — | — |
| **4–6** | 2 · 📅 Weekend | SE oggi è weekend · ALLORA ➕ produci in più / ➖ produci in meno | — | — |
| **7–9** | 3 · 🌡️ Temperatura | SE temperatura > / < … (esempio: > 30 °C → ➕ 4) | 🏅 gara (giorno 13) | — |
| **10–12** | 4 · 🏷️ Prezzo | Selettore "Prezzo del gelato in Einaudi" e ALLORA metti il prezzo a… | 🆚 concorrenza (dal giorno 14) | — |
| **13–15** | 4 · 🏷️ Prezzo | — | 🚌 turisti (dal giorno 14) | **13** gara · **14** apre la Rivale, primo pullman |
| **16–18** | 4 · 🏷️ Prezzo | — | — | **17** pullman |
| **19–21** | 4 · 🏷️ Prezzo | — | 🕵️ controllo ASL (giorno 24) | **20** pullman · **21** primo giorno che conta per l'ASL |
| **22–24** | 5 · 📡💥 Stazione meteo rotta | Niente più previsioni | — | **22–23** contano per l'ASL · **23** pullman · **24** controllo ASL |
| **25–27** | 5 · 📡💥 Stazione meteo rotta | — | — | **26** pullman |
| **28–30** | 5 · 📡💥 Stazione meteo rotta | — | — | **29** pullman · fine e classifica |

La moneta del gioco è l'**Einaudi**. Il simbolo è una moneta d'oro con la sagoma del Tempio della Consolazione di Todi e viene presentato nel primo messaggio del tutorial.

Nel gestionale, sotto "Partiamo!", il riquadro **📝 Ricorda** dice quanto vale ogni cono venduto (il prezzo scelto) e quanto costano gli ingredienti di ogni cono preparato e l'affitto. 

**Suoni e segnali:** quando parte un round si sente una fanfara 8-bit. A ogni gelato venduto suona il «cha-ching!» della cassa e accanto al cliente sale per poco la scritta col prezzo e la moneta (es. «+2,50 🪙»). Il pulsante 🔊/🔇 spegne anche gli effetti sonori.

Alla fine di ogni round di 3 giorni compaiono due schermate:
1. **i risultati**: guadagno, coni venduti, clienti persi, coni buttati, il conto voce per voce: soldi fatti con i coni, costi per preparare i coni, affitto (più la multa, se c'è) e guadagno ed eventuale esito del controllo ASL;
2. **📣 EVENTI**: la novità del nuovo round (per esempio il weekend). Con la stessa intestazione compaiono anche gli annunci delle altre materie.

**Quanti clienti:** ogni cliente compra un cono. In un giorno normale di sole vengono **20–30 persone** (di più col caldo sopra i 30 °C e nel weekend: +30%), con le nuvole circa 12–18, con la pioggia circa 4–8. Magazzino automatico: 10 kg all'inizio (1 kg = 10 coni), poi il fornitore lo riempie ogni notte fino a 25 kg (250 coni). Affitto 15 al giorno, ingredienti 0,80 a cono, prezzo normale 2,50 Einaudi.

---

## 4. Gli eventi delle altre materie del corso SIA

Ogni evento è **annunciato nel gestionale**, all'inizio di un turno, e accade **sempre in un giorno successivo**, così il giocatore fa in tempo a scrivere le regole. Da quel momento c'è l'avviso con il conto alla rovescia; durante la simulazione compaiono solo avvisi brevi.

| Annuncio (gestionale del giorno) | Materia | Evento | Quando | Effetto nel gioco |
|---|---|---|---|---|
| **7** | 🏃 Educazione fisica | Giochi studenteschi: gara a Todi | giorno **13** | clienti ×1,6 · blocco **SE 🏅 oggi c'è la gara** · in 3D la corsa con l'arco a scacchi e il cartellone "Giochi Studenteschi" |
| **10** | 📈 Economia politica | Apre la Gelateria Rivale (cono a 2,50) | dal giorno **14** | oltre 2,50 si perdono molti clienti · chiosco con il cartellone "Gelati più buoni!" |
| **13** | 🇬🇧🇫🇷 Inglese e Francese | Arrivano i turisti col pullman | giorni **14, 17, 20, 23, 26, 29** | +9 clienti circa · fumetti con le bandiere · blocco **SE 🚌 oggi arrivano i turisti** |
| **19** | ⚖️ Diritto | Controllo dell'ASL sugli sprechi | giorno **24** | se nei 3 giorni prima (21, 22, 23) si buttano **più di 8 coni**, **multa di 25** |

Soglia dell'ASL: un giocatore attento butta 2–3 coni in quei 3 giorni, uno che produce troppo (es. sole 35, nuvoloso 22, pioggia 12) ne butta circa 9 e prende la multa.

## 5. Come conta il robot: il meteo dà la base, le altre regole la correggono

- **Solo le regole sul ☁️ meteo** possono dire **🍦 produci X**: è la base del giorno, come `coni = X`. Ogni giorno c'è un solo meteo, quindi vale una sola regola.
- **Tutte le altre regole** (weekend, temperatura, gara, turisti) possono solo **➕ produrre in più** o **➖ produrre in meno**, come `coni = coni + X`.
- **L'ordine delle regole non conta.** Il robot prende la base del meteo e poi somma e sottrae le altre regole vere. Il risultato non scende mai sotto 0.

Esempio: SE ⛅ nuvoloso → produci 16, SE 📅 weekend → ➕ 8, SE 🌡️ temperatura > 30 → ➕ 4. In un weekend nuvoloso e caldo il robot fa 16 + 8 + 4 = **28 coni**.

Nel gestionale:
- Nel menu dell'azione, "🍦 produci" compare **solo se la condizione è il meteo**. Se si cambia la condizione da meteo a un'altra, l'azione diventa "➕ in più"; se si torna al meteo, ridiventa "🍦 produci".
- Se ci sono due regole "produci" per lo stesso meteo, compare l'avviso "⚠️ Hai più regole per ☀️ sole: il robot usa quella più in basso".
- Dalla fase del weekend, il riquadro "🧮 Come conta il robot" spiega tutto in una riga con l'esempio.

Nella simulazione, "🧮 Il conto del robot" mostra il calcolo: prima la base del meteo, poi i ➕ e i ➖. Se manca la regola per il meteo del giorno, scrive "nessuna regola del meteo → base 0".

Perché così: meteo e temperatura descrivono la stessa giornata. Se la temperatura potesse dire "produci", "SE sole → produci 26" e "SE temperatura > 30 → produci 30" si sostituirebbero o si sommerebbero (56 coni). Come correzione (➕ 4) invece funzionano bene insieme.

Il codice è in `src/index.html`, funzione `eseguiProgramma`. Le regole salvate in precedenza con "produci" fuori dal meteo valgono come "➕ in più".

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
