# La Gelateria Automatica — schema della difficoltà

Il gioco non mostra tutto subito: parte da una sola idea (il meteo) e aggiunge **una cosa nuova alla volta**.
Il robot della gelateria applica le regole SE… ALLORA… che scrive lo studente.

I numeri si cambiano in `src/index.html`:
- giorni e contenuto delle fasi → `CONFIG.fasi`
- durata delle animazioni → `GRAFICA3D`

---

## 1. Panoramica iniziale (circa 1 minuto e mezzo, si può saltare)

Una giornata raccontata dalla camera, che scorre da sinistra a destra:
1. 🌅 Mattina: i ragazzi entrano a scuola.
2. 🍦 Il gelataio apre: porta dentro gli ingredienti e fuori il bancone.
3. 😍 Arrivano i clienti: chi prende il gelato è felice.
4. 😠 I coni finiscono: chi arriva dopo si arrabbia.
5. 🌇 Sera: il gelataio chiude.
6. 🌙 Notte: il furgone porta gli ingredienti per domani.
7. 🔄 La camera gira sulla città.
8. 🌧️ Nuovo giorno con la pioggia… e si ricomincia.

**Cosa impara:** com'è fatta una giornata del gioco, senza leggere niente.

---

## 2. Tutorial (3 giorni, meteo noto)

Solo il **meteo**. Niente temperatura, magazzino o cassa: il magazzino lo riempie il fornitore da solo.

| Giorno | Meteo | Regola da scrivere | Cosa impara |
|---|---|---|---|
| 1 | ☀️ sole | SE meteo è sole ALLORA produci 100 coni | senza regole il robot non fa niente |
| 2 | 🌧️ pioggia | SE meteo è pioggia ALLORA produci 20 coni | produrre troppo = gelato buttato |
| 3 | ⛅ nuvoloso | SE meteo è nuvoloso ALLORA produci 60 coni | serve una regola per ogni caso |

Alla fine il robot ha 3 regole e sa cosa fare con ogni tempo.

---

## 3. La sfida: 30 giorni divisi in 7 fasi

Il gioco si ferma alla fine di ogni fase. Compare un riepilogo (guadagno, coni venduti, persi e buttati) con la **novità** della fase successiva. Lo studente aggiorna le regole e riparte.

| Fase | Giorni | Durata | Novità | Blocchi nuovi | Magazzino |
|---|---|---|---|---|---|
| 1 | 1–4 | 4 giorni | ☁️ **Meteo** | SE meteo è… · ALLORA produci… | automatico |
| 2 | 5–8 | 4 giorni | 🌡️ **Temperatura**: più caldo = più clienti | SE temperatura > / < … | automatico |
| 3 | 9–12 | 4 giorni | 📅 **Weekend**: sabato e domenica più gente | SE oggi è weekend · ALLORA produci in più / in meno | automatico |
| 4 | 13–17 | 5 giorni | 📦 **Magazzino**: il fornitore non porta più niente da solo, il camion arriva il giorno dopo | SE magazzino < / > … · ALLORA riordina … kg | **a carico dello studente** |
| 5 | 18–21 | 4 giorni | 💶 **Prezzo**: più caro = più guadagno a cono ma meno clienti | ALLORA metti il prezzo a… | a carico dello studente |
| 6 | 22–25 | 4 giorni | 🍨 **Ieri**: il robot ricorda se ieri il gelato è finito o è stato buttato | SE ieri ho finito / ho buttato… | a carico dello studente |
| 7 | 26–30 | 5 giorni | 📡💥 **Stazione meteo rotta**: niente più previsioni | (nessuno: il programma deve reggere da solo) | a carico dello studente |

**Regole del gioco:**
- Ogni fase dura **4 o 5 giorni**, quindi una novità ogni 4–5 giorni.
- In una fase si vedono sulla scena solo le informazioni già sbloccate: la temperatura dalla fase 2, il magazzino dalla 4, il prezzo dalla 5.
- **Nuovo tentativo:** riparte dal giorno 1 e tiene le regole. I blocchi già scoperti restano nel menu.
- **Classifica:** conta il **profitto totale dei 30 giorni**.
- **Senza regole** il robot produce 0 coni, e prima di partire compare un avviso.

**Tempi a velocità 1× (grafica 3D):**
- un giorno del tutorial dura circa 25–30 s;
- un giorno della sfida dura circa 12 s, cioè circa 50–60 s per fase e circa 6 minuti per tutta la sfida, senza contare il tempo per scrivere le regole;
- con 2× e 4× i tempi si dimezzano o si riducono a un quarto.

---

## 4. Idee per le altre materie del corso SIA

Ogni idea è pensata come **una novità di una fase**: un evento, un blocco nuovo per le regole o una schermata "Lo sapevi che…" collegata alla materia.

### 🏃 Educazione fisica (curvatura sportiva)
- **Evento "Gara a Todi"**, per esempio una corsa o un torneo alla palestra della scuola. In certi giorni arrivano molti più clienti, segnati nel calendario come 🏅. Nuova condizione: `SE oggi c'è una gara`.
- **Nuovo prodotto: il sorbetto per sportivi** (frutta, niente latte). I clienti sportivi lo preferiscono, quindi il robot deve decidere *cosa* produrre e non solo *quanto*.
- **Il gelataio si stanca:** se lavora troppi giorni di fila senza riposo serve più lentamente. Si introduce il **giorno di chiusura settimanale**, con la regola `ALLORA chiudi oggi`. Collegamento: recupero e allenamento, come per un atleta.
- **"Lo sapevi che…":** idratazione e caldo, dieta dello sportivo, perché dopo l'allenamento si ha voglia di qualcosa di fresco.

### ⚖️ Diritto
- **Il controllo igienico (ASL):** ogni tanto arriva un ispettore. Se in magazzino ci sono ingredienti "vecchi" (troppi kg fermi da molti giorni) scatta una **multa**. Insegna che le regole non sono solo quelle del robot, ma anche quelle della legge.
- **Il contratto con il fornitore:** si può scegliere tra un contratto "fisso" (consegna ogni 2 giorni, prezzo più basso) e "a chiamata" (si ordina quando si vuole, prezzo più alto). Introduce il **contratto** e le sue clausole.
- **Assumere un aiutante:** un contratto di lavoro con uno stipendio giornaliero, che è un costo fisso. Con l'aiutante si servono più clienti all'ora. Collegamento a **diritti e doveri del lavoratore**.
- **Orari decisi dal Comune:** un'ordinanza obbliga a chiudere prima in certi giorni, per esempio per una festa. Le regole del robot devono rispettarla.
- **"Lo sapevi che…":** lo scontrino fiscale, gli allergeni da indicare, la licenza per aprire un'attività.

### 📈 Economia politica
- **Concorrenza:** a metà sfida apre un'altra gelateria in piazza e i clienti si dividono. Chi tiene il prezzo troppo alto ne perde di più. Collegamento: **mercato e concorrenza**.
- **Inflazione:** il prezzo degli ingredienti sale del 20% a partire da un certo giorno. Il guadagno a cono cala e bisogna decidere se alzare il prezzo.
- **Domanda e offerta:** un grafico semplice nei risultati mostra quanti clienti c'erano a ogni prezzo.
- **Tasse:** una parte dei ricavi (IVA) va allo Stato, e nei conti compare una riga "imposte". Collegamento a **Stato ed economia**.
- **"Lo sapevi che…":** che cos'è il PIL, perché i prezzi salgono, come funziona un mercato.

### 🇬🇧 Inglese
- **I turisti stranieri:** Todi è una città turistica. Nei giorni dei pullman di turisti, segnati come 🚌, arrivano clienti che parlano inglese. Nuova condizione: `SE arrivano i turisti`.
- **Le regole in inglese:** a partire da una fase il robot "parla inglese" e i blocchi diventano **IF / THEN**, come nei veri linguaggi di programmazione. Per esempio *IF weather is sunny THEN make 100 cones*. Collegamento diretto tra inglese e informatica.
- **Le recensioni:** a fine sfida compaiono 2–3 recensioni dei turisti in inglese semplice, per esempio *"Great ice cream, but they ran out at 3 pm!"*. Lo studente le legge e capisce cosa migliorare.
- **"Did you know…?":** alcuni "Lo sapevi che…" in inglese, con la traduzione sotto.

---

## 5. Una proposta per mettere tutto insieme (sempre 30 giorni)

Per non allungare la partita, le materie possono diventare **eventi** dentro le fasi che già ci sono, invece di fasi nuove:

| Fase | Giorni | Novità di base | Evento della materia |
|---|---|---|---|
| 1 | 1–4 | ☁️ meteo | — |
| 2 | 5–8 | 🌡️ temperatura | 🏅 Educazione fisica: gara a Todi il giorno 7 |
| 3 | 9–12 | 📅 weekend | 🚌 Inglese: arrivano i turisti, regole in IF / THEN |
| 4 | 13–17 | 📦 magazzino e riordino | ⚖️ Diritto: contratto con il fornitore e controllo ASL |
| 5 | 18–21 | 💶 prezzo | 📈 Economia politica: apre la concorrenza |
| 6 | 22–25 | 🍨 ieri | 📈 Economia politica: inflazione degli ingredienti |
| 7 | 26–30 | 📡💥 stazione rotta | 🇬🇧 Inglese: recensioni dei turisti nei risultati |

Così ogni materia compare **almeno una volta** e la difficoltà continua a salire di una cosa nuova ogni 4–5 giorni.
