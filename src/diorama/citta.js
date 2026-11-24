/* =====================================================================
   LA CITTÀ: Todi su tre livelli, come nella versione isometrica (src/iso/citta.js)
   Livello 1 (z=0): strada ad anello, giardino, scuola, scalinata, gelateria, fornitore
   Livello 2 (z=Z2): Tempio della Consolazione, mura medievali con la porta
   Livello 3 (z=Z3): Duomo, Palazzo dei Priori con l'aquila, case
   Coordinate come nella versione isometrica: x a destra, y verso chi guarda, z in alto.
   ===================================================================== */
const Z2 = 1.4, Z3 = 2.8;
const PIASTRA = { x0: -3.6, x1: 21.3, y0: -3.0, y1: 12.0, r: 1.3, spessore: 2.6 };
PIASTRA.w = PIASTRA.x1 - PIASTRA.x0; PIASTRA.d = PIASTRA.y1 - PIASTRA.y0;
PIASTRA.cx = (PIASTRA.x0 + PIASTRA.x1) / 2; PIASTRA.cy = (PIASTRA.y0 + PIASTRA.y1) / 2;
const ANELLO = { xS: 1.2, xD: 20.1, yF: 10.35, cy: 9.15, yB: -2.0, cyB: -0.8, r: 1.2, w: 0.95 };   // linea di mezzo della strada
const GEL = { x: 13.0, y: 5.4, w: 4.4, d: 2.6, h: 2.8, porta: 16.35 };
const FORN = { x: -3.3, y: -1.3, w: 2.7, d: 2.9, h: 1.55 };
const CASSE = { x: 18.35, y: 6.95 };
const BANCO = { x: 13.5, y: 8.1 };
const LAMPIONI = [[2.5, 8.25, 0], [10.95, 8.25, 0], [17.75, 8.25, 0], [6.75, 4.95, Z2], [10.75, 4.95, Z2], [-0.55, 1.85, 0]];
const POZZE = [[4.5, 10.0, 0, 0.55], [9.0, 10.7, 0, 0.7], [13.6, 10.1, 0, 0.5], [1.2, 5.6, 0, 0.45], [20.1, 4.2, 0, 0.5], [-1.6, 4.4, 0, 0.45], [8.8, 4.4, Z2, 0.45], [15.4, 4.0, Z2, 0.4], [12.2, 0.4, Z3, 0.35]];

/* ---------- percorsi: una polilinea fitta con le lunghezze cumulate ---------- */
function percorso(tratti) {
  const pts = [];
  for (const t of tratti) {
    if (t.linea) { const [a, b] = t.linea, n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1)); for (let i = 0; i <= n; i++) pts.push([lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)]); }
    else { const { c, r, da, a } = t.arco, n = Math.max(4, Math.ceil(Math.abs(a - da) * r / 0.08)); for (let i = 0; i <= n; i++) { const f = lerp(da, a, i / n); pts.push([c[0] + r * Math.cos(f), c[1] + r * Math.sin(f)]); } }
  }
  const P = [pts[0]]; for (const p of pts) if (Math.hypot(p[0] - P[P.length - 1][0], p[1] - P[P.length - 1][1]) > 0.02) P.push(p);
  const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  return {
    pts: P, L, len: L[L.length - 1],
    // punto e direzione alla distanza s dall'inizio
    a(s) {
      s = clamp(s, 0, this.len); let lo = 1, hi = L.length - 1;
      while (lo < hi) { const m = (lo + hi) >> 1; if (L[m] < s) lo = m + 1; else hi = m; }
      const i = lo, k = (s - L[i - 1]) / (L[i] - L[i - 1] || 1), p0 = P[i - 1], p1 = P[i];
      const a = P[Math.max(0, i - 2)], b = P[Math.min(P.length - 1, i + 1)];
      return { x: lerp(p0[0], p1[0], k), y: lerp(p0[1], p1[1], k), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    },
  };
}
const { xS, xD, yF, cy: cyF, yB, cyB, r: rA } = ANELLO, xR = xD - rA;
// la strada ad anello intorno alla città (chiusa)
const STRADA_ANELLO = percorso([
  { linea: [[xR, yB], [2.4, yB]] }, { arco: { c: [2.4, cyB], r: rA, da: -Math.PI / 2, a: -Math.PI } }, { linea: [[xS, cyB], [xS, cyF]] },
  { arco: { c: [2.4, cyF], r: rA, da: Math.PI, a: Math.PI / 2 } }, { linea: [[2.4, yF], [xR, yF]] }, { arco: { c: [xR, cyF], r: rA, da: Math.PI / 2, a: 0 } },
  { linea: [[xD, cyF], [xD, cyB]] }, { arco: { c: [xR, cyB], r: rA, da: 0, a: -Math.PI / 2 } },
]);
// andata del furgone: dal fornitore, giù per la gamba sinistra, davanti fino alla gelateria
const FERMATA = 15.3;
const ANDATA = percorso([
  { linea: [[-1.6, 2.6], [0.0, 2.6]] }, { arco: { c: [0.0, 3.8], r: rA, da: -Math.PI / 2, a: 0 } }, { linea: [[xS, 3.8], [xS, cyF]] },
  { arco: { c: [2.4, cyF], r: rA, da: Math.PI, a: Math.PI / 2 } }, { linea: [[2.4, yF], [FERMATA, yF]] },
]);
// ritorno: prosegue a destra, risale, passa dietro la città e rientra dal fornitore
const RITORNO = percorso([
  { linea: [[FERMATA, yF], [xR, yF]] }, { arco: { c: [xR, cyF], r: rA, da: Math.PI / 2, a: 0 } }, { linea: [[xD, cyF], [xD, cyB]] },
  { arco: { c: [xR, cyB], r: rA, da: 0, a: -Math.PI / 2 } }, { linea: [[xR, yB], [2.4, yB]] }, { arco: { c: [2.4, cyB], r: rA, da: -Math.PI / 2, a: -Math.PI } },
  { linea: [[xS, cyB], [xS, 1.4]] }, { arco: { c: [0.0, 1.4], r: rA, da: 0, a: Math.PI / 2 } }, { linea: [[0.0, 2.6], [-1.6, 2.6]] },
]);

// un nastro rialzato lungo una polilinea (la strada)
function nastro(padre, pts, larg, mat, periodo, chiuso, alto = 0.05) {
  const n = pts.length, pos = [], uv = [], idx = [], sez = [[-larg / 2, 0, 0], [-larg / 2 + 0.05, alto, 0.06], [larg / 2 - 0.05, alto, 0.94], [larg / 2, 0, 1]];
  let s = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[chiuso ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[chiuso ? (i + 1) % n : Math.min(n - 1, i + 1)], p = pts[i];
    const tx = b[0] - a[0], ty = b[1] - a[1], l = Math.hypot(tx, ty) || 1;
    if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    for (const [o, y, v] of sez) { pos.push(p[0] - ty / l * o, y, p[1] + tx / l * o); uv.push(s / periodo, v); }
  }
  const m = chiuso ? n : n - 1;
  for (let i = 0; i < m; i++) for (let k = 0; k < 3; k++) { const a = i * 4 + k, b = ((i + 1) % n) * 4 + k; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  return metti(padre, g, mat, [0, 0, 0], null, false);
}

/* ---------- texture dipinte (in coordinate "del mondo": 1 unità = 1) ---------- */
let TEX = null;
function texture() {
  if (TEX) return TEX;
  const rr = rng(11);
  TEX = {
    // conci di pietra: chiari, il colore lo mette la vernice
    conci: texCanvas(384, 256, (ctx, W, H) => {
      ctx.fillStyle = '#bdb3a3'; ctx.fillRect(0, 0, W, H);
      const righe = 3, rh = H / righe, bw = W / 2;
      for (let r = 0; r < righe; r++) for (let c = -1; c < 3; c++) {
        const x = c * bw + (r % 2) * bw / 2, k = 236 + Math.floor(rr.range(-14, 12));
        ctx.fillStyle = `rgb(${k},${k - 4},${k - 12})`; ctx.beginPath(); ctx.roundRect(x + 4, r * rh + 4, bw - 8, rh - 8, 8); ctx.fill();
      }
    }, [1 / 1.5, 1 / 0.96]),
    // lastricato delle piazze
    lastricato: texCanvas(256, 256, (ctx, W) => {
      ctx.fillStyle = '#cfc4b0'; ctx.fillRect(0, 0, W, W);
      for (let r = 0; r < 4; r++) for (let c = -1; c < 4; c++) { const x = c * 64 + (r % 2) * 32, k = 240 + Math.floor(rr.range(-10, 8)); ctx.fillStyle = `rgb(${k},${k - 3},${k - 10})`; ctx.beginPath(); ctx.roundRect(x + 3, r * 64 + 3, 58, 58, 6); ctx.fill(); }
    }, [1, 1]),
    // mattoni (la porta della città)
    mattoni: texCanvas(256, 128, (ctx, W, H) => {
      ctx.fillStyle = '#c9b8a8'; ctx.fillRect(0, 0, W, H);
      for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const x = c * 64 + (r % 2) * 32, k = 236 + Math.floor(rr.range(-14, 8)); ctx.fillStyle = `rgb(${k},${k - 2},${k - 6})`; ctx.fillRect(x + 2, r * 16 + 2, 60, 12); }
    }, [1 / 1.2, 1 / 0.6]),
    // strada con la linea tratteggiata
    strada: (() => { const t = texCanvas(256, 128, (ctx, W, H) => { ctx.fillStyle = PAL.strada; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f3ead8'; ctx.fillRect(50, H / 2 - 4, 110, 8); ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(0, 10, W, 4); ctx.fillRect(0, H - 14, W, 4); }); t.wrapS = THREE.RepeatWrapping; return t; })(),
  };
  return TEX;
}
const matConci = (col) => { const k = 'conci' + col; if (!vernici.has(k)) vernici.set(k, new THREE.MeshStandardMaterial({ color: col, map: texture().conci, roughness: 0.9 })); return vernici.get(k); };
const matLastricato = () => { if (!vernici.has('lastr')) vernici.set('lastr', new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture().lastricato, roughness: 0.88 })); return vernici.get('lastr'); };
const matMattoni = () => { if (!vernici.has('matt')) vernici.set('matt', new THREE.MeshStandardMaterial({ color: PAL.mattoni, map: texture().mattoni, roughness: 0.9 })); return vernici.get('matt'); };

/* =====================================================================
   COSTRUZIONE (O = gli oggetti che si animano, condivisi con diorama.js)
   ===================================================================== */
function costruisciCitta(L, O) {
  O.finestreAccese = luminosa(PAL.vetro, '#ffd68a');            // finestre che la sera si accendono
  O.finestreSpente = vernice('#3b4d63', 0.5);
  O.bulbi = luminosa('#fff4dd', PAL.lampada);
  const finestra = (faccia, x, y, z, w, h, id, cornice = PAL.crema) => {
    const mat = hash(id) > 0.35 ? O.finestreAccese : O.finestreSpente;
    sulMuro(L, faccia, x, y, z, w + 0.1, h + 0.1, cornice, 0.03);
    const m = sulMuro(L, faccia, x, y, z, w, h, mat, 0.025); m.position[faccia.includes('x') ? 'x' : 'z'] += (faccia[0] === '-' ? -1 : 1) * 0.008;
    return m;
  };

  piastrella(L);
  strade(L);
  livelli(L);
  mura(L);
  tempio(L, finestra);
  duomo(L, finestra);
  casa(L, 11.6, -0.65, 1.5, 2.5, 3, PAL.pietra, Z3, finestra, 900);
  palazzoPriori(L, finestra);
  scuola(L, finestra, O);
  gelateria(L, O);
  fornitore(L, finestra, O);
  verde(L, O);
  lampioni(L, O);
  casse(L, O);
}

/* ---------- la piastrella: erba floccata, bordino morbido, taglio con terra, argilla e roccia ---------- */
function piastrella(L) {
  const { w, d, r, cx, cy, spessore: H } = PIASTRA, rr = rng(7);
  const erba = texCanvas(1024, 1024, (ctx, W) => {
    ctx.fillStyle = PAL.erba; ctx.fillRect(0, 0, W, W);
    for (let i = 0; i < 90; i++) { const x = rr.range(0, W), y = rr.range(0, W), s = rr.range(60, 190), c = rr.chance(0.5) ? '255,246,190' : '60,120,70'; for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, s); gr.addColorStop(0, `rgba(${c},0.11)`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.fillRect(x + ox - s, y + oy - s, 2 * s, 2 * s); } }
    for (let i = 0; i < 22000; i++) { ctx.fillStyle = rr.chance(0.5) ? 'rgba(255,255,210,0.10)' : 'rgba(40,90,50,0.10)'; ctx.fillRect(rr.range(0, W), rr.range(0, W), 2, 2); }
  }, [1 / 5, 1 / 5]);
  const matErba = new THREE.MeshPhysicalMaterial({ map: erba, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
  const matBordo = new THREE.MeshPhysicalMaterial({ color: PAL.erba, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
  const cap = metti(L, loft(anello(w + 0.2, d + 0.2, r + 0.1, 12, cx, cy), [...bordino(0.12, 0), [0, -0.2, Math.PI / 2], [0.1, -0.29, Math.PI]]), [matBordo, matErba]);
  cap.castShadow = false;
  L.userData.matErba = matErba;
  // il taglio: una sezione dipinta a mano che gira intorno alla piastrella
  const strati = texCanvas(2048, 512, (ctx, W, Hh) => {
    const onda = (base, amp, k, ph) => (x) => base + amp * Math.sin(x / W * Math.PI * 2 * k + ph) + amp * 0.5 * Math.sin(x / W * Math.PI * 2 * (k * 2 + 1) + ph * 2.3);
    const fascia = (top, colore) => { ctx.fillStyle = colore; ctx.beginPath(); ctx.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top(x)); ctx.lineTo(W, Hh); ctx.fill(); };
    ctx.fillStyle = PAL.terra[0]; ctx.fillRect(0, 0, W, Hh);
    fascia(onda(44, 7, 7, 0.4), PAL.terra[1]); fascia(onda(170, 14, 4, 1.9), PAL.terra[2]); fascia(onda(292, 16, 3, 4.0), PAL.terra[3]);
    const sasso = (x, y, a, b, rot, colore) => { for (const ox of [-W, 0, W]) { ctx.fillStyle = colore; ctx.beginPath(); ctx.ellipse(x + ox, y, a, b, rot, 0, 7); ctx.fill(); } };
    for (let i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(255,240,205,0.28)'; ctx.lineWidth = 5; ctx.beginPath(); const f = onda(194 + i * 15, 12, 4, 1.9 + i * 0.25); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, f(x)); ctx.stroke(); }
    for (let i = 0; i < 60; i++) sasso(rr.range(0, W), rr.range(66, 160), rr.range(6, 16), rr.range(4, 10), rr.range(-0.5, 0.5), rr.pick(['#d7c4a6', '#a88a70', '#6f4c3b']));
    for (let i = 0; i < 40; i++) sasso(rr.range(0, W), rr.range(322, 500), rr.range(20, 56), rr.range(8, 20), rr.range(-0.3, 0.3), rr.pick(['#8b8e9d', '#6e7181', '#73768a']));
    for (let i = 0; i < 60; i++) { const x = rr.range(0, W); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = rr.range(2, 4); ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + rr.range(-18, 18), 30, x + rr.range(-26, 26), rr.range(40, 90)); ctx.stroke(); }
  }, [3, 1]);
  metti(L, loft(anello(w, d, r, 12, cx, cy), [[0, -0.2, Math.PI / 2], [0, -H * 0.72, Math.PI / 2], [0.1, -H * 0.82], [0.4, -H * 0.94], [0.8, -H * 1.0], [1.25, -H - 0.2]], false), new THREE.MeshStandardMaterial({ map: strati, roughness: 0.9 })).castShadow = false;
  metti(L, loft(anello(w - 2.5, d - 2.5, 0.4, 6, cx, cy), [[0, -H - 0.18, 0]]), PAL.terra[3]);
  // sassi veri incastrati a metà nel taglio
  const giro = anello(w, d, r, 12, cx, cy), sassi = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), vernice('#ffffff', 0.9), 54), o = new THREE.Object3D();
  sassi.receiveShadow = true; sassi.userData.vivo = true; L.add(sassi);
  for (let i = 0; i < sassi.count; i++) {
    const at = rr.range(0, giro.giro), j = Math.max(1, giro.findIndex((q) => q.u >= at)), a = giro[j - 1], b = giro[j], f = (at - a.u) / (b.u - a.u || 1);
    const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f), y = rr.range(-0.55, -H * 0.7), s = rr.range(0.07, 0.15);
    o.position.set(x - b.nx * s * 0.25, y, z - b.nz * s * 0.25); o.rotation.set(rr.range(0, 3), rr.range(0, 3), 0); o.scale.set(s * rr.range(1, 1.7), s * rr.range(0.6, 1), s); o.updateMatrix();
    sassi.setMatrixAt(i, o.matrix); sassi.setColorAt(i, new THREE.Color(y > -H * 0.5 ? rr.pick(PAL.sasso) : PAL.sasso[2]));
  }
}

/* ---------- strada ad anello, vialetto del fornitore, marciapiede e strisce pedonali ---------- */
function strade(L) {
  const mat = new THREE.MeshStandardMaterial({ map: texture().strada, roughness: 0.9 });
  nastro(L, STRADA_ANELLO.pts.slice(0, -1), 2 * ANELLO.w, mat, 1.6, true);
  nastro(L, [[-2.9, 2.6], [-1.6, 2.6], [-0.4, 2.6], [0.6, 2.6]], 1.6, vernice(PAL.strada, 0.9), 2, false, 0.045);
  // il marciapiede davanti a scuola e gelateria
  blocco(L, 2.2, 8.0, 0, xR - 2.2, 1.2, 0.1, PAL.marciapiede, 0.04);
  for (let x = 3.2; x < xR; x += 1) sulMuro(L, 'y', x, 8.6, 0.101, 0.03, 1.15, '#c9cad1', 0).rotation.x = -Math.PI / 2;
  // strisce pedonali davanti alla scuola
  for (let k = 0; k < 6; k++) { const m = sulMuro(L, 'y', 8.8, 9.56 + k * 0.32, 0.056, 1.0, 0.17, '#f4f6fa', 0.02); m.rotation.x = -Math.PI / 2; m.position.z = 9.56 + k * 0.32; }
}

/* ---------- livello 2 e livello 3 (con le mura medievali) ---------- */
function livelli(L) {
  const top = (x, y, z, w, d) => { const m = metti(L, rettangoloGeo(w, d, 0.04, true), matLastricato(), [x + w / 2, z + 0.004, y + d / 2], [-Math.PI / 2, 0, 0], false); };
  metti(L, scatolaGeo(15.4, Z2, 6.4, 0.08), matConci(PAL.pietra), [2.2 + 7.7, Z2 / 2, -1 + 3.2]);
  top(2.25, -0.95, Z2, 15.3, 6.3);
  for (const [a, b] of [[2.2, 11.2], [12.8, 17.6]]) blocco(L, a, 5.22, Z2, b - a, 0.18, 0.24, '#e6d5b5', 0.05);      // parapetto
  metti(L, scatolaGeo(10.6, Z3 - Z2, 3.4, 0.08), matConci(PAL.mura), [7 + 5.3, Z2 + (Z3 - Z2) / 2, -1 + 1.7]);
  top(7.05, -0.95, Z3, 10.5, 3.3);
  contatto(L, 9.9, 5.6, 0, 16.6, 7.6, 0.4);
  contatto(L, 12.3, 1.9, Z2, 11.4, 4.2, 0.35);
}
function mura(L) {
  const C = PAL.mura;
  for (let x = 7.05; x < 17.4; x += 0.5) { if (x > 10.5 && x < 13.2) continue; blocco(L, x, 2.22, Z3, 0.26, 0.18, 0.3, C, 0.04); }   // merli davanti
  for (let y = -0.85; y < 2.3; y += 0.5) { blocco(L, 7.0, y, Z3, 0.18, 0.26, 0.3, C, 0.04); blocco(L, 17.42, y, Z3, 0.18, 0.26, 0.3, C, 0.04); }
  // la torre delle mura all'angolo
  metti(L, scatolaGeo(0.9, Z3 - Z2 + 1.0, 0.9, 0.06), matConci(C), [7.45, Z2 + (Z3 - Z2 + 1.0) / 2, 2.15]);
  sulMuro(L, 'y', 7.45, 2.6, Z3 + 0.5, 0.2, 0.4, PAL.scuro, 0.08, arcoGeo(0.22, 0.42)).position.y = Z3 + 0.3;
  for (let i = 0; i < 3; i++) { blocco(L, 7.02 + i * 0.33, 2.42, Z3 + 1.0, 0.2, 0.18, 0.22, C, 0.03); blocco(L, 7.72, 1.72 + i * 0.33, Z3 + 1.0, 0.18, 0.2, 0.22, C, 0.03); blocco(L, 7.02 + i * 0.33, 1.7, Z3 + 1.0, 0.2, 0.18, 0.22, C, 0.03); blocco(L, 7.0, 1.72 + i * 0.33, Z3 + 1.0, 0.18, 0.2, 0.22, C, 0.03); }
  // la porta della città: mattoni, arco bugnato in pietra, attico; dentro, le scale che salgono
  const x = 10.8, y = 2.0, w = 2.4, d = 0.8, z = Z2, h = Z3 - Z2 + 1.3, fy = y + d;
  metti(L, scatolaGeo(w, h, d, 0.06), matMattoni(), [x + w / 2, z + h / 2, y + d / 2]);
  sulMuro(L, 'y', x + w / 2, fy, z, 1.4, 2.2, '#e5e1d6', 0, arcoGeo(1.5, 2.25));
  sulMuro(L, 'y', x + w / 2, fy + 0.004, z, 1.0, 1.9, '#3e3440', 0, arcoGeo(1.04, 1.95)).position.z = fy + 0.012;
  for (let r = 0; r < 6; r++) { const zz = z + 0.12 + r * 0.33; blocco(L, x + 0.46, fy - 0.02, zz, 0.3, 0.07, 0.26, '#d8d3c6', 0.03); blocco(L, x + w - 0.76, fy - 0.02, zz, 0.3, 0.07, 0.26, '#d8d3c6', 0.03); }
  blocco(L, x - 0.06, fy - 0.04, z + h - 0.46, w + 0.12, 0.1, 0.46, '#e5e1d6', 0.04);
  for (let i = 0; i < 3; i++) sulMuro(L, 'y', x + 0.5 + i * 0.7, fy + 0.07, z + h - 0.23, 0.48, 0.28, '#d1ccbe', 0.03);
  // le scalinate: dalla strada al livello 2, poi dentro la porta
  scalinata(L, 11.2, 1.6, 8.0, 5.4, 0, Z2, 7);
  scalinata(L, 11.2, 1.6, 5.4, 2.8, Z2, Z2 + 0.7, 6);
}
function scalinata(L, x, w, y0, y1, za, zb, n) {
  const dd = (y0 - y1) / n;
  for (let i = 0; i < n; i++) blocco(L, x, y0 - (i + 1) * dd, za, w, dd + 0.02, (i + 1) * (zb - za) / n, i % 2 ? '#e8d9bb' : '#e3d3b3', 0.03);
  blocco(L, x - 0.12, y1, za, 0.12, y0 - y1, zb - za + 0.18, '#d2bf9c', 0.03); blocco(L, x + w, y1, za, 0.12, y0 - y1, zb - za + 0.18, '#d2bf9c', 0.03);
}

/* ---------- Tempio della Consolazione: cubo, quattro absidi poligonali, tamburo, cupola, lanterna ---------- */
function tempio(L, finestra) {
  const cx = 4.4, cy = 2.6, z = Z2, m = 1.15, r = 1.03, col = PAL.travertino, cup = PAL.cupola, hc = 2.45, ha = 1.2, att = 0.38;
  contatto(L, cx + 0.3, cy + 0.3, z, 4.6, 4.6, 0.45);
  blocco(L, cx - m, cy - m, z, 2 * m, 2 * m, hc, col, 0.05);
  // le absidi: mezzi dodecagoni a due ordini con la mezza cupola a spicchi
  for (const [dx, dy, rot] of [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]) {
    const ax = cx + dx * m, ay = cy + dy * m;
    const g = new THREE.Group(); g.position.set(ax, z, ay); g.rotation.y = rot; L.add(g);
    metti(g, new THREE.CylinderGeometry(r, r, ha, 12, 1, false, -Math.PI / 2, Math.PI), col, [0, ha / 2, 0]);
    metti(g, new THREE.CylinderGeometry(r * 0.97, r * 0.97, att, 12, 1, false, -Math.PI / 2, Math.PI), '#f2eadb', [0, ha + att / 2, 0]);
    metti(g, new THREE.CylinderGeometry(r + 0.04, r + 0.04, 0.07, 12, 1, false, -Math.PI / 2, Math.PI), '#f6eedd', [0, ha, 0]);
    metti(g, new THREE.SphereGeometry(r * 0.9, 12, 6, 0, Math.PI, 0, Math.PI / 2), cup, [0, ha + att, 0]).scale.y = 0.62;
    for (let k = 0; k < 3; k++) { const a = (-0.33 + k * 0.33) * Math.PI, wx = Math.sin(a) * (r + 0.005), wz = Math.cos(a) * (r + 0.005);
      const f = metti(g, rettangoloGeo(0.14, 0.32, 0.06), O_finestra(), [wx, ha * 0.55, wz], null, false); f.rotation.y = a; }
  }
  // paraste, cornicione, finestre del cubo
  for (const k of [-m, m - 0.14]) { blocco(L, cx + k, cy + m, z, 0.14, 0.04, hc, '#f4ebd9', 0.01); blocco(L, cx + m, cy + k, z, 0.04, 0.14, hc, '#e6dac4', 0.01); }
  blocco(L, cx - m - 0.05, cy - m - 0.05, z + hc - 0.16, 2 * m + 0.1, 2 * m + 0.1, 0.16, '#f6eedd', 0.03);
  for (const k of [-0.55, 0.55]) { finestra('y', cx + k, cy + m, z + 1.92, 0.2, 0.34, 11 + k); finestra('x', cx + m, cy + k, z + 1.92, 0.2, 0.34, 13 + k); }
  // balaustra, tamburo, cupola e lanterna
  for (let k = 0; k < 10; k++) { blocco(L, cx - m + 0.08 + k * 0.23, cy + m - 0.1, z + hc, 0.07, 0.07, 0.2, '#f6eedd', 0.02); blocco(L, cx + m - 0.1, cy - m + 0.08 + k * 0.23, z + hc, 0.07, 0.07, 0.2, '#e9dfcb', 0.02); }
  blocco(L, cx - m, cy + m - 0.12, z + hc + 0.2, 2 * m, 0.1, 0.05, '#f6eedd', 0.02); blocco(L, cx + m - 0.12, cy - m, z + hc + 0.2, 0.1, 2 * m, 0.05, '#e9dfcb', 0.02);
  metti(L, new THREE.CylinderGeometry(0.84, 0.84, 0.62, 24), col, [cx, z + hc + 0.31, cy]);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; const f = metti(L, rettangoloGeo(0.12, 0.3, 0.05), O_finestra(), [cx + Math.sin(a) * 0.845, z + hc + 0.3, cy + Math.cos(a) * 0.845], null, false); f.rotation.y = a; }
  metti(L, new THREE.CylinderGeometry(0.9, 0.9, 0.06, 24), '#f6eedd', [cx, z + hc + 0.63, cy]);
  metti(L, new THREE.SphereGeometry(0.84, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cup, [cx, z + hc + 0.64, cy]).scale.y = 1.08;
  metti(L, new THREE.CylinderGeometry(0.15, 0.15, 0.26, 10), col, [cx, z + hc + 1.66, cy]);
  metti(L, new THREE.SphereGeometry(0.15, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), cup, [cx, z + hc + 1.79, cy]);
  metti(L, new THREE.CylinderGeometry(0.015, 0.015, 0.26, 6), '#6b7488', [cx, z + hc + 2.05, cy]); metti(L, new THREE.BoxGeometry(0.14, 0.025, 0.025), '#6b7488', [cx, z + hc + 2.1, cy]);
}
let _finTempio; const O_finestra = () => (_finTempio ??= luminosa('#4f5a75', '#ffd68a'));

/* ---------- il Duomo: facciata a fasce rosa, rosone, portali; il campanile dietro a destra ---------- */
function duomo(L, finestra) {
  const x = 8.0, y = -0.8, w = 2.6, d = 2.8, z = Z3, h = 2.9, col = '#eee6da', rosa = '#e3b9a6';
  contatto(L, x + 1.6, y + 1.6, z, 4.2, 4.4, 0.4);
  // campanile
  const cx0 = 10.75, cy0 = -0.5, cw = 0.75, ch = 4.5;
  blocco(L, cx0, cy0, z, cw, cw, ch, '#e2d8c8', 0.04);
  for (const k of [0, 1]) { const zz = z + 2.7 + k * 0.85;
    sulMuro(L, 'y', cx0 + cw / 2, cy0 + cw, zz, 0, 0, '#3e3a48', 0, arcoGeo(0.34, 0.6)); sulMuro(L, 'x', cx0 + cw, cy0 + cw / 2, zz, 0, 0, '#3e3a48', 0, arcoGeo(0.34, 0.6));
    metti(L, new THREE.SphereGeometry(0.09, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#9c7a3c', [cx0 + cw / 2, zz + 0.32, cy0 + cw / 2]); }
  blocco(L, cx0 - 0.03, cy0 - 0.03, z + 2.55, cw + 0.06, cw + 0.06, 0.06, '#f2ebdf', 0.02);
  padiglione(L, cx0 - 0.04, cy0 - 0.04, z + ch, cw + 0.08, cw + 0.08, 0.3, PAL.coppi);
  metti(L, new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6), '#4b4f60', [cx0 + cw / 2, z + ch + 0.42, cy0 + cw / 2]); metti(L, new THREE.BoxGeometry(0.15, 0.025, 0.025), '#4b4f60', [cx0 + cw / 2, z + ch + 0.48, cy0 + cw / 2]);
  // navata con il tetto rosso
  blocco(L, x, y, z, w, d, h - 0.3, col, 0.05);
  for (let k = 0; k < 3; k++) finestra('x', x + w, y + 0.6 + k * 0.75, z + 1.6, 0.2, 0.7, 950 + k);
  capanna(L, x + 0.05, y, z + h - 0.3, w - 0.1, d - 0.1, 0.75, PAL.coppi, false, 0.1);
  // la facciata che copre la navata davanti
  const fy0 = y + d + 0.12, H = h + 0.35;
  blocco(L, x - 0.05, y + d, z, w + 0.1, 0.12, H, col, 0.03);
  for (const k of [0, 0.82, 1.78, 2.6]) blocco(L, x - 0.07 + k, fy0 - 0.01, z, 0.16, 0.04, H, rosa, 0.01);
  for (const zz of [1.62, 2.12]) blocco(L, x - 0.07, fy0 - 0.01, z + zz, w + 0.14, 0.05, 0.07, '#d7c8b6', 0.01);
  blocco(L, x - 0.07, fy0 - 0.01, z + H - 0.1, w + 0.14, 0.05, 0.1, '#d7c8b6', 0.01);
  const ros = (cx, cz, r, lum) => { metti(L, new THREE.CircleGeometry(r * 1.25, 24), '#dccdbb', [cx, cz, fy0 + 0.04], null, false); metti(L, new THREE.CircleGeometry(r, 24), lum ? O_finestra() : '#77748a', [cx, cz, fy0 + 0.047], null, false); };
  ros(x + w / 2, z + 2.75, 0.4, true); metti(L, new THREE.CircleGeometry(0.1, 16), '#e8c770', [x + w / 2, z + 2.75, fy0 + 0.05], null, false);
  for (const k of [0.46, w - 0.46]) ros(x + k, z + 1.3, 0.15, false);
  sulMuro(L, 'y', x + w / 2, fy0 + 0.03, z, 0, 0, rosa, 0, arcoGeo(0.9, 1.42)); sulMuro(L, 'y', x + w / 2, fy0 + 0.036, z, 0, 0, '#f2ebdf', 0, arcoGeo(0.76, 1.32)); sulMuro(L, 'y', x + w / 2, fy0 + 0.042, z, 0, 0, '#6e4e3a', 0, arcoGeo(0.56, 1.12));
  for (const k of [0.46, w - 0.46]) { sulMuro(L, 'y', x + k, fy0 + 0.03, z, 0, 0, '#dccdbb', 0, arcoGeo(0.44, 0.92)); sulMuro(L, 'y', x + k, fy0 + 0.036, z, 0, 0, '#6e4e3a', 0, arcoGeo(0.3, 0.78)); }
}

/* ---------- una casa umbra in pietra con le persiane e il tetto di coppi ---------- */
function casa(L, x, y, w, d, piani, col, z, finestra, id) {
  const h = piani * 0.95 + 0.15;
  contatto(L, x + w / 2 + 0.2, y + d / 2 + 0.2, z, w + 1.2, d + 1.2, 0.35);
  blocco(L, x, y, z, w, d, h, col, 0.05);
  const nf = Math.max(1, Math.floor(w / 1.0));
  for (let f = 0; f < piani; f++) for (let j = 0; j < nf; j++) {
    const cx = x + (j + 0.5) * w / nf, z0 = z + 0.25 + f * 0.95;
    if (f === 0 && j === Math.floor(nf / 2)) { sulMuro(L, 'y', cx, y + d, z, 0, 0, PAL.porta, 0, arcoGeo(0.48, 0.8)); continue; }
    finestra('y', cx, y + d, z0 + 0.33, 0.26, 0.42, id + f * 10 + j);
    for (const s of [-1, 1]) blocco(L, cx + s * 0.2 - 0.06, y + d, z0 + 0.12, 0.12, 0.03, 0.43, PAL.persiana, 0.015);
  }
  for (let f = 0; f < piani; f++) finestra('x', x + w, y + d / 2, z + 0.58 + f * 0.95, 0.24, 0.4, id + 500 + f);
  capanna(L, x, y, z + h, w, d, 0.6, PAL.coppi, true, 0.12);
  blocco(L, x + w * 0.7, y + d * 0.3, z + h + 0.2, 0.22, 0.22, 0.55, '#c9b08c', 0.03);
}

/* ---------- Palazzo dei Priori: bifore, merli guelfi, torre con l'aquila ---------- */
function palazzoPriori(L, finestra) {
  const x = 13.3, y = -0.7, w = 3.9, d = 2.75, z = Z3, h = 2.6, col = '#cdb38d';
  contatto(L, x + w / 2 + 0.2, y + d / 2 + 0.2, z, w + 1.3, d + 1.2, 0.4);
  blocco(L, x, y, z, w, d, h, col, 0.05);
  for (let i = 0; i < 4; i++) { const cx = x + 0.55 + i * 0.95;
    sulMuro(L, 'y', cx, y + d, z + 1.18, 0, 0, '#e8dcc6', 0, arcoGeo(0.46, 0.64));
    for (const k of [-0.1, 0.1]) { const m = sulMuro(L, 'y', cx + k, y + d + 0.006, z + 1.25, 0, 0, hash(700 + i * 2 + (k > 0)) > 0.35 ? O_finestra() : '#3b4d63', 0, arcoGeo(0.14, 0.48)); m.position.z += 0.004; }
    blocco(L, cx - 0.24, y + d, z + 1.12, 0.48, 0.05, 0.06, '#e8dcc6', 0.01); }
  for (let i = 0; i < 3; i++) sulMuro(L, 'y', x + 0.8 + i * 1.15, y + d, z, 0, 0, '#6b5a4e', 0, arcoGeo(0.55, 0.85));
  for (let i = 0; i < 9; i++) blocco(L, x + 0.05 + i * 0.44, y + d - 0.2, z + h, 0.22, 0.2, 0.22, col, 0.03);
  for (let i = 0; i < 7; i++) blocco(L, x + w - 0.2, y + 0.05 + i * 0.4, z + h, 0.2, 0.22, 0.22, col, 0.03);
  const tx = 16.3, ty = -0.6;
  blocco(L, tx, ty, z + h, 0.85, 0.85, 1.5, col, 0.04);
  finestra('y', tx + 0.42, ty + 0.85, z + h + 0.92, 0.26, 0.42, 720);
  for (let i = 0; i < 3; i++) { blocco(L, tx + 0.02 + i * 0.31, ty + 0.65, z + h + 1.5, 0.2, 0.2, 0.22, col, 0.03); blocco(L, tx + 0.65, ty + 0.02 + i * 0.31, z + h + 1.5, 0.2, 0.2, 0.22, col, 0.03); blocco(L, tx + 0.02 + i * 0.31, ty, z + h + 1.5, 0.2, 0.2, 0.22, col, 0.03); blocco(L, tx, ty + 0.02 + i * 0.31, z + h + 1.5, 0.2, 0.2, 0.22, col, 0.03); }
  aquila(L, tx + 0.42, ty + 0.42, z + h + 1.5);
}
// l'aquila di Todi in bronzo, come quella del Palazzo dei Priori: ali alzate e aperte, penne lunghe che scendono
// con la patina verde in fondo, testa girata di lato, artigli su una sbarra appoggiata a due mensole di pietra
let texAla = null;
function aquila(L, x, y, z) {
  const bronzo = '#3d4438', bronzoChiaro = '#4d564a', patina = '#5d8c7c', pietra = PAL.travertino;
  const g = new THREE.Group(); g.position.set(x, z, y); g.scale.setScalar(1.35); L.add(g);
  // mensole e sbarra
  metti(g, scatolaGeo(0.5, 0.07, 0.16, 0.02), pietra, [0, 0.035, 0]);
  for (const s of [-0.16, 0.16]) metti(g, scatolaGeo(0.09, 0.16, 0.13, 0.02), pietra, [s, -0.07, 0]);
  metti(g, new THREE.CylinderGeometry(0.018, 0.018, 0.4, 6), bronzo, [0, 0.085, 0.02], [0, 0, Math.PI / 2]);
  // zampe e artigli
  for (const s of [-1, 1]) {
    metti(g, new THREE.CylinderGeometry(0.022, 0.03, 0.2, 6), bronzo, [s * 0.05, 0.19, 0.01], [0, 0, s * 0.12]);
    for (const k of [-1, 0, 1]) metti(g, new THREE.ConeGeometry(0.012, 0.05, 5), bronzo, [s * 0.05 + k * 0.022, 0.08, 0.04], [Math.PI / 2.4, 0, 0]);
  }
  // corpo, coda, collo, testa girata e becco adunco
  metti(g, new THREE.SphereGeometry(0.1, 14, 12), bronzo, [0, 0.4, 0.01]).scale.set(1.3, 1.75, 1.0);
  metti(g, prisma([[-0.07, 0], [0.07, 0], [0.04, 0.16], [-0.04, 0.16]], 0.02, 0.03, 0.008), bronzo, [0, 0.06, -0.06], [0.25, 0, 0]);
  metti(g, new THREE.CylinderGeometry(0.05, 0.08, 0.1, 10), bronzo, [0, 0.6, 0.015]);
  const testa = new THREE.Group(); testa.position.set(0, 0.68, 0.03); testa.rotation.y = 0.55; g.add(testa);
  metti(testa, new THREE.SphereGeometry(0.068, 12, 10), bronzoChiaro, [0, 0, 0]).scale.set(0.9, 1, 1.15);
  metti(testa, new THREE.ConeGeometry(0.03, 0.09, 8), bronzoChiaro, [0, -0.01, 0.1], [Math.PI / 2, 0, 0]);
  metti(testa, new THREE.ConeGeometry(0.014, 0.04, 6), bronzoChiaro, [0, -0.035, 0.135], [Math.PI, 0, 0]);
  // le ali: sagoma con il bordo alto arrotondato e le penne lunghe che pendono, dipinta con scaglie e patina
  texAla ??= texCanvas(256, 448, (ctx, W, H) => {
    ctx.fillStyle = bronzo; ctx.fillRect(0, 0, W, H);
    const pat = ctx.createLinearGradient(0, H * 0.45, 0, H); pat.addColorStop(0, 'rgba(93,140,124,0)'); pat.addColorStop(0.35, patina); pat.addColorStop(1, '#79a898');
    ctx.fillStyle = pat; ctx.fillRect(0, H * 0.45, W, H * 0.55);
    ctx.strokeStyle = '#556050'; ctx.lineWidth = 4;
    for (let r = 0; r < 7; r++) for (let c = 0; c < 9; c++) { ctx.beginPath(); ctx.arc(c * 30 + (r % 2) * 15, 20 + r * 26, 14, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(30,40,34,0.55)'; ctx.lineWidth = 5;
    for (let x = 12; x < W; x += 26) { ctx.beginPath(); ctx.moveTo(x, H * 0.42); ctx.lineTo(x + 6, H); ctx.stroke(); }
  });
  texAla.wrapS = texAla.wrapT = THREE.RepeatWrapping; texAla.repeat.set(1 / 0.4, 1 / 0.7); texAla.offset.set(0, 0.45 / 0.7);
  const matAla = new THREE.MeshStandardMaterial({ map: texAla, roughness: 0.55, metalness: 0.35 });
  const sagoma = [[0, 0], [0.06, 0.12], [0.16, 0.21], [0.27, 0.22], [0.35, 0.14], [0.38, 0.01], [0.37, -0.18], [0.34, -0.38], [0.31, -0.43], [0.28, -0.34], [0.25, -0.43], [0.22, -0.33], [0.18, -0.41], [0.15, -0.3], [0.11, -0.33], [0.07, -0.14]];
  for (const s of [-1, 1]) {
    const ala = metti(g, prisma(sagoma, 0.015, 0.045, 0.01), [matAla, vernice(bronzo, 0.6)], [s * 0.09, 0.46, -0.03]);
    ala.scale.set(s * 1.3, 1.3, 1); ala.rotation.set(0, -s * 0.3, -s * 0.14);       // ali grandi, alzate e un po' aperte verso l'esterno
  }
}
/* ---------- la scuola: istituto Ciuffelli-Einaudi ---------- */
function scuola(L, finestra, O) {
  const y = 5.4, h = 3.3, col = PAL.scuola;
  contatto(L, 8.9, 6.9, 0, 6.2, 4.2, 0.45);
  const finestre = (x0, x1, yf, id) => { const cx = (x0 + x1) / 2; for (let f = 0; f < 3; f++) finestra('y', cx, yf, 0.62 + f * 1.0, 0.28, 0.6, id + f, '#f5eedc'); };
  const corpo = (x0, x1, yf, id) => {
    blocco(L, x0, y, 0, x1 - x0, yf - y, h, col, 0.04);
    blocco(L, x0 - 0.01, yf - 0.03, 0, x1 - x0 + 0.02, 0.06, 0.85, '#e5d3a6', 0.02);
    blocco(L, x0 - 0.01, yf - 0.03, h - 0.16, x1 - x0 + 0.02, 0.06, 0.16, '#f5ead0', 0.02);
    blocco(L, x0 - 0.01, yf - 0.03, 1.13, x1 - x0 + 0.02, 0.05, 0.05, '#f5ead0', 0.01);
    finestre(x0, x1, yf, id);
  };
  corpo(6.6, 7.55, 8.0, 3000); corpo(7.55, 8.1, 7.72, 3010);
  padiglione(L, 6.5, 5.3, h, 1.7, 2.82, 0.5, PAL.coppi);
  // il corpo centrale sporgente: pietra in basso, portone, balcone, timpano, attico con l'insegna
  const c0 = 8.1, c1 = 9.5, yc = 8.18, hc = 3.75, cx = (c0 + c1) / 2;
  blocco(L, c0, y, 0, c1 - c0, yc - y, hc, col, 0.04);
  blocco(L, c0 - 0.02, yc - 0.03, 0, c1 - c0 + 0.04, 0.06, 1.15, PAL.scuolaPietra, 0.02);
  for (const k of [-0.48, 0.48]) finestra('y', cx + k, yc + 0.03, 0.6, 0.22, 0.52, 3050 + (k > 0), '#eeede6');
  sulMuro(L, 'y', cx, yc + 0.035, 0, 0, 0, '#2f3a33', 0, arcoGeo(0.5, 1.0));
  blocco(L, c0 - 0.05, yc, 1.15, c1 - c0 + 0.1, 0.32, 0.08, '#dcdbd3', 0.02);            // balcone
  for (let k = 0; k < 8; k++) blocco(L, c0 + 0.02 + k * 0.185, yc + 0.26, 1.23, 0.05, 0.05, 0.22, '#d0cfc6', 0.015);
  blocco(L, c0 - 0.05, yc + 0.24, 1.45, c1 - c0 + 0.1, 0.08, 0.05, '#e6e5de', 0.02);
  finestra('y', cx, yc, 1.66, 0.4, 0.78, 3060, '#eeede6');
  metti(L, prisma([[-0.4, 0], [0.4, 0], [0, 0.28]], 0.03, 0.08, 0.015), '#e6e5de', [cx, 2.12, yc + 0.04]);
  for (const k of [-0.5, 0.5]) finestra('y', cx + k, yc, 1.65, 0.2, 0.62, 3061 + (k > 0), '#f5eedc');
  for (const k of [-0.48, 0, 0.48]) finestra('y', cx + k, yc, 2.75, 0.2, 0.4, 3070 + k * 10, '#f5eedc');
  blocco(L, c0 - 0.02, yc - 0.03, 2.98, c1 - c0 + 0.04, 0.06, 0.06, '#f5ead0', 0.01);
  // l'insegna SCUOLA in facciata
  const insegna = texCanvas(512, 200, (ctx, W, H) => { ctx.fillStyle = '#fbf6ea'; ctx.beginPath(); ctx.roundRect(8, 8, W - 16, H - 16, 26); ctx.fill(); ctx.strokeStyle = '#6e9f38'; ctx.lineWidth = 12; ctx.stroke();
    ctx.fillStyle = '#2f5f2a'; ctx.font = fontPx(118); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SCUOLA', W / 2, H / 2 + 8); });
  sulMuro(L, 'y', cx, yc + 0.03, 3.38, 1.25, 0.48, new THREE.MeshStandardMaterial({ map: insegna, roughness: 0.8 }), 0.06);
  for (let k = 0; k < 8; k++) blocco(L, c0 + 0.04 + k * 0.18, yc - 0.1, hc, 0.08, 0.08, 0.22, '#efe6d0', 0.02);   // balaustra della terrazza
  blocco(L, c0, yc - 0.1, hc + 0.22, c1 - c0, 0.1, 0.05, '#f5ead0', 0.02);
  for (let f = 0; f < 3; f++) finestra('x', c1, y + 2.45, 0.65 + f * 1.0, 0.26, 0.5, 3080 + f);
  blocco(L, cx - 0.7, yc, 0, 1.4, 0.32, 0.06, '#d6d5ce', 0.02); blocco(L, cx - 0.5, yc + 0.32, 0, 1.0, 0.2, 0.04, '#d6d5ce', 0.02);   // gradini
  corpo(9.5, 10.05, 7.72, 3020); corpo(10.05, 11.0, 8.0, 3030);
  for (let f = 0; f < 3; f++) for (let j = 0; j < 2; j++) finestra('x', 11.0, y + 0.65 + j * 1.2, 0.62 + f * 1.0, 0.3, 0.55, 3100 + f * 3 + j);
  padiglione(L, 9.45, 5.3, h, 1.65, 2.82, 0.5, PAL.coppi);
  // il logo della scuola, come un'insegna rotonda sulla terrazza del tetto
  const logo = new THREE.Group(); logo.position.set(cx, hc, y + 1.4); L.add(logo);
  for (const s of [-1, 1]) metti(logo, new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), '#5b6075', [s * 0.32, 0.2, 0]);
  metti(logo, new THREE.CylinderGeometry(0.62, 0.62, 0.08, 32), '#6e9f38', [0, 0.95, 0], [Math.PI / 2, 0, 0]);
  const img = typeof document !== 'undefined' && document.getElementById('logo-scuola');
  const texLogo = new THREE.Texture(); texLogo.colorSpace = THREE.SRGBColorSpace;
  if (img) { const pronto = () => { texLogo.image = img; texLogo.needsUpdate = true; }; if (img.complete && img.naturalWidth) pronto(); else img.addEventListener('load', pronto); }
  metti(logo, new THREE.CircleGeometry(0.56, 32), img ? new THREE.MeshStandardMaterial({ map: texLogo, roughness: 0.8 }) : vernice('#ffffff'), [0, 0.95, 0.045], null, false);
  metti(logo, new THREE.CircleGeometry(0.56, 32), '#ffffff', [0, 0.95, -0.045], [0, Math.PI, 0], false);
  // la bandiera italiana: asta che sporge dal balcone verso la strada
  const asta = new THREE.Vector3(cx + 0.55, 1.5, yc + 0.3), cima = new THREE.Vector3(cx + 0.55, 2.55, yc + 1.05);
  const m = metti(L, new THREE.CylinderGeometry(0.02, 0.02, asta.distanceTo(cima), 6), '#4b5270', [(asta.x + cima.x) / 2, (asta.y + cima.y) / 2, (asta.z + cima.z) / 2]);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), cima.clone().sub(asta).normalize());
  metti(L, new THREE.SphereGeometry(0.04, 8, 6), '#d9a93a', [cima.x, cima.y, cima.z]);
  const tex = texCanvas(96, 64, (ctx) => { ['#2e8b57', '#ffffff', '#d2353f'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(i * 32, 0, 32, 64); }); });
  const geoB = new THREE.PlaneGeometry(0.66, 0.44, 8, 1); geoB.translate(0.33, -0.22, 0);
  O.bandiera = metti(L, geoB, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }), [cima.x + 0.01, cima.y - 0.02, cima.z]);
  O.bandiera.rotation.y = -0.5; O.bandiera.userData.vivo = true; O.bandiera.userData.base = Float32Array.from(geoB.attributes.position.array);
}

/* ---------- la gelateria: tetto rosa, vetrina coi coni, porta, tenda a strisce, bancone, display sul fianco ---------- */
function gelateria(L, O) {
  const { x, y, w, d, h } = GEL, fy = y + d;
  contatto(L, x + w / 2 + 0.2, y + d / 2 + 0.3, 0, w + 1.8, d + 1.8, 0.45);
  blocco(L, x, y, 0, w, d, h, PAL.crema, 0.06);
  blocco(L, x - 0.02, fy - 0.03, 0, w + 0.04, 0.06, 0.3, '#e9d7b8', 0.02); blocco(L, x + w - 0.03, y - 0.02, 0, 0.06, d + 0.04, 0.3, '#d9c6a6', 0.02);
  blocco(L, x - 0.15, y - 0.15, h, w + 0.3, d + 0.3, 0.25, PAL.accento, 0.08);                         // il tetto rosa
  // la vetrina: coni e vaschette dipinti, la sera si accende
  O.texVetrina = texCanvas(512, 236, (ctx, W, H) => {
    ctx.fillStyle = '#2a2433'; ctx.fillRect(0, 0, W, H);
    [PAL.accento, PAL.pistacchio, '#fff1dc', PAL.cioccolato, PAL.accento, PAL.menta].forEach((c, i) => { const x = 50 + i * 82;
      ctx.fillStyle = PAL.cialda; ctx.beginPath(); ctx.moveTo(x - 22, 120); ctx.lineTo(x + 22, 120); ctx.lineTo(x, 200); ctx.fill();
      ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, 104, 26, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#fff6e6'; ctx.font = fontPx(40); ctx.textAlign = 'center'; ctx.fillText('GELATI', W / 2, 52);
  });
  O.matVetrina = new THREE.MeshStandardMaterial({ map: O.texVetrina, emissiveMap: O.texVetrina, emissive: '#ffffff', emissiveIntensity: 0.4, roughness: 0.5 });
  blocco(L, 13.2, fy - 0.02, 0.92, 2.7, 0.08, 1.32, PAL.crema, 0.04);
  sulMuro(L, 'y', 14.55, fy + 0.06, 1.575, 2.5, 1.15, O.matVetrina, 0.05);
  // il contatore dei coni: un'insegna luminosa sul tetto, ben visibile
  O.texConi = texCanvas(512, 256);
  O.matConi = new THREE.MeshStandardMaterial({ map: O.texConi, emissiveMap: O.texConi, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.5 });
  const ins = new THREE.Group(); ins.position.set(14.3, h + 0.25, y + 1.75); ins.rotation.x = -0.12; L.add(ins);
  for (const s of [-0.75, 0.75]) metti(ins, new THREE.CylinderGeometry(0.05, 0.05, 0.45, 8), PAL.ardesia, [s, 0.22, -0.05]);
  metti(ins, scatolaGeo(2.0, 1.05, 0.14, 0.07), PAL.ardesia, [0, 0.95, 0]);
  metti(ins, rettangoloGeo(1.84, 0.9, 0.06), O.matConi, [0, 0.95, 0.075], null, false);
  // la porta che scorre (aperta di giorno, chiusa di notte)
  O.vanoPorta = luminosa(PAL.scuro, '#ffca7a');
  sulMuro(L, 'y', GEL.porta, fy + 0.005, 0, 0, 0, PAL.ardesia, 0, arcoGeo(0.9, 1.98));
  sulMuro(L, 'y', GEL.porta, fy + 0.012, 0, 0, 0, O.vanoPorta, 0, arcoGeo(0.75, 1.85));
  O.porta = metti(L, scatolaGeo(0.72, 1.55, 0.05, 0.02), PAL.porta, [GEL.porta, 0.78, fy + 0.07]); O.porta.userData.vivo = true;
  metti(O.porta, new THREE.SphereGeometry(0.035, 8, 6), PAL.senape, [-0.24, 0, 0.035]);
  // la tenda a strisce: accento e crema
  const tenda = new THREE.Group(); tenda.position.set(x, 2.6, fy); L.add(tenda);
  const n = 12, lw = w / n, falda = Math.hypot(0.5, 0.3), inc = Math.atan2(0.3, 0.5);
  for (let i = 0; i < n; i++) {
    const c = i % 2 ? PAL.crema : PAL.accento;
    const f = metti(tenda, scatolaGeo(lw + 0.004, 0.035, falda, 0.012), c, [lw * (i + 0.5), -0.15, 0.25]); f.rotation.x = inc;
    metti(tenda, new THREE.CylinderGeometry(lw / 2, lw / 2, 0.04, 12, 1, false, 0, Math.PI), c, [lw * (i + 0.5), -0.31, 0.5], [Math.PI / 2, 0, Math.PI / 2]);
  }
  // il cono gelato sul tetto: l'insegna, gira piano
  O.conone = new THREE.Group(); O.conone.position.set(x + 3.75, h + 0.25, y + 1.0); O.conone.userData.vivo = true; L.add(O.conone);
  metti(O.conone, new THREE.ConeGeometry(0.34, 1.0, 18), PAL.cialda, [0, 0.52, 0], [Math.PI, 0, 0]);
  metti(O.conone, new THREE.SphereGeometry(0.42, 20, 14), PAL.accento, [0, 1.12, 0]);
  metti(O.conone, new THREE.SphereGeometry(0.11, 12, 8), '#e2465e', [0.05, 1.56, 0.05]);
  // il cartellino APERTO / GELATO FINITO! appeso sotto la tenda: si gira quando i coni finiscono
  O.finito = new THREE.Group(); O.finito.position.set(GEL.porta, 2.02, fy + 0.42); O.finito.userData.vivo = true; L.add(O.finito);
  for (const s of [-1, 1]) metti(O.finito, new THREE.CylinderGeometry(0.008, 0.008, 0.3, 6), PAL.scuro, [s * 0.36, 0.15, 0]);
  O.finitoCarta = new THREE.Group(); O.finito.add(O.finitoCarta);
  metti(O.finitoCarta, scatolaGeo(1.05, 0.4, 0.04, 0.03), PAL.crema);
  const scritta = (testo, bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas(512, 196, (ctx, W, H) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = fg; ctx.font = fontPx(testo.length > 8 ? 76 : 100); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(testo, W / 2, H / 2 + 6); }) });
  metti(O.finitoCarta, rettangoloGeo(0.98, 0.34, 0.025), scritta('APERTO', '#ece8df', PAL.ardesia), [0, 0, 0.022], null, false);
  metti(O.finitoCarta, rettangoloGeo(0.98, 0.34, 0.025), scritta('GELATO FINITO!', PAL.scuro, PAL.accento), [0, 0, -0.022], [0, Math.PI, 0], false);
  // il bancone con le vaschette (la sera il gelataio lo porta dentro)
  O.bancone = new THREE.Group(); O.bancone.userData.vivo = true; L.add(O.bancone);
  metti(O.bancone, scatolaGeo(2.2, 0.8, 0.5, 0.05), PAL.menta, [1.1, 0.5, 0.25]);
  metti(O.bancone, scatolaGeo(2.3, 0.07, 0.56, 0.02), PAL.ardesia, [1.1, 0.93, 0.25]);
  [PAL.accento, PAL.pistacchio, PAL.cioccolato, PAL.crema].forEach((c, i) => metti(O.bancone, new THREE.SphereGeometry(0.17, 14, 10), c, [0.3 + i * 0.53, 0.98, 0.25]).scale.set(1, 0.5, 0.8));
  // tre cartelli con la X rossa davanti al bancone: compaiono quando i coni finiscono (viaggiano col bancone)
  const texX = texCanvas(256, 256, (ctx) => { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 256, 256); ctx.strokeStyle = '#e8323f'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(62, 62); ctx.lineTo(194, 194); ctx.moveTo(194, 62); ctx.lineTo(62, 194); ctx.stroke(); });
  const matX = new THREE.MeshStandardMaterial({ map: texX, roughness: 0.8 });
  O.cartelliX = [0.4, 1.1, 1.8].map((x, i) => {
    const c = new THREE.Group(); c.position.set(x, 0, 0.72); c.rotation.y = (i - 1) * 0.12; c.visible = false; O.bancone.add(c);
    metti(c, new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), PAL.ardesia, [0, 0.25, 0]);
    metti(c, new THREE.CylinderGeometry(0.1, 0.12, 0.04, 12), PAL.ardesia, [0, 0.02, 0]);
    metti(c, scatolaGeo(0.52, 0.52, 0.05, 0.06), PAL.crema, [0, 0.72, 0]);
    metti(c, rettangoloGeo(0.44, 0.44, 0.05), matX, [0, 0.72, 0.027], null, false);
    return c;
  });
  // i pacchi della consegna: il furgone li lascia sul pallet di fianco alla gelateria, la mattina il gelataio li porta dentro
  // il magazzino: fino a 12 pacchi sul pallet di fianco, a strati da 4 (2×2)
  O.posPacchi = Array.from({ length: 12 }, (_, i) => { const j = i % 4; return [CASSE.x + (j % 2 ? 0.23 : -0.23), CASSE.y + (j < 2 ? -0.2 : 0.2), Math.floor(i / 4)]; });
  O.pacchi = O.posPacchi.map(() => { const c = new THREE.Group(); c.userData.vivo = true; c.visible = false; L.add(c);
    metti(c, scatolaGeo(0.42, 0.32, 0.36, 0.035), PAL.cartone, [0, 0.16, 0]); metti(c, scatolaGeo(0.08, 0.326, 0.366, 0.01), PAL.crema, [0, 0.16, 0]); return c; });
  // le luci del negozio
  O.luceNegozio = new THREE.PointLight('#ffb866', 0, 6, 2); O.luceNegozio.position.set(14.6, 1.4, fy + 1.0); L.add(O.luceNegozio);
}

/* ---------- il fornitore (tappa 1): capannone con il tetto a denti di sega, saracinesca, comignolo ---------- */
function fornitore(L, finestra, O) {
  const { x, y, w, d, h } = FORN, fy = y + d;
  contatto(L, x + w / 2 + 0.2, y + d / 2 + 0.3, 0, w + 1.8, d + 1.8, 0.45);
  blocco(L, x - 0.12, y - 0.12, 0, w + 0.24, d + 0.24, 0.1, PAL.ardesia, 0.05);
  blocco(L, x, y, 0.06, w, d, h, PAL.crema, 0.09);
  O.vetriFornitore = luminosa(PAL.vetro, '#ffe2a8');
  for (let i = 0; i < 3; i++) {
    const cx = x + 0.45 + i * 0.9;
    metti(L, prisma([[-0.47, 0], [0.47, 0], [0.47, 0.5]], [0.05, 0.07, 0.08], d + 0.12, 0.05), PAL.ardesia, [cx, h + 0.04, y + d / 2]);
    sulMuro(L, 'x', cx + 0.475, y + d / 2, h + 0.3, d - 0.5, 0.24, O.vetriFornitore, 0.05);
  }
  // la saracinesca davanti (si alza quando il furgone carica)
  const sx = x + w / 2 + 0.35;
  blocco(L, sx - 0.75, fy - 0.02, 0.06, 1.5, 0.12, 1.25, PAL.senape, 0.05);
  sulMuro(L, 'y', sx, fy + 0.1, 0.66, 1.26, 1.04, PAL.scuro, 0.04);
  O.lamelle = texCanvas(64, 64, (ctx) => { ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = 'rgba(90,70,50,0.35)'; ctx.fillRect(0, 0, 64, 9); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 9, 64, 6); }, [1, 7]);
  const geo = new THREE.PlaneGeometry(1.26, 1.04); geo.translate(0, -0.52, 0);
  O.saracinesca = metti(L, geo, new THREE.MeshStandardMaterial({ map: O.lamelle, roughness: 0.7 }), [sx, 1.18, fy + 0.11], null, false); O.saracinesca.userData.vivo = true;
  blocco(L, sx - 0.77, fy + 0.02, 1.16, 1.54, 0.2, 0.2, PAL.senape, 0.06);
  O.finestreFornitore = [finestra('y', x + 0.45, fy, 1.0, 0.42, 0.38, 1, PAL.crema)];
  finestra('x', x + w, y + 0.8, 1.0, 0.42, 0.38, 2); finestra('x', x + w, y + 2.0, 1.0, 0.42, 0.38, 3);
  metti(L, new THREE.CylinderGeometry(0.13, 0.15, 0.8, 14), PAL.ardesia, [x + 0.35, h + 0.6, y + 0.5]); metti(L, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 14), PAL.crema, [x + 0.35, h + 1.0, y + 0.5]);
  O.comignolo = [x + 0.35, h + 1.08, y + 0.5];                     // coordinate three
  // pacchi in attesa vicino al muro
  for (const [px, py, r, s] of [[-3.15, 3.95, 0.3, 1], [-2.7, 4.05, -0.15, 1.1], [-2.95, 3.75, 0.1, 0.9]]) {
    const p = new THREE.Group(); p.position.set(px, 0.16 * s, py); p.rotation.y = r; p.scale.setScalar(s); L.add(p);
    metti(p, scatolaGeo(0.42, 0.32, 0.36, 0.035), PAL.cartone); metti(p, scatolaGeo(0.1, 0.326, 0.366, 0.01), PAL.crema);
  }
}

/* ---------- il verde: giardino della scuola, cipressi, alberi, fiori, panchina ---------- */
function albero(L, x, y, z, s, tipo) {
  const g = new THREE.Group(); g.position.set(x, z, y); g.scale.set(s, s * 1.45, s); L.add(g);          // alberi slanciati
  metti(g, new THREE.CylinderGeometry(0.06, 0.09, 0.6, 8), PAL.tronco, [0, 0.3, 0]);
  if (tipo === 'cipresso') metti(g, new THREE.LatheGeometry([[0, 0.3], [0.26, 0.38], [0.3, 0.7], [0.22, 1.4], [0.1, 1.95], [0, 2.05]].map(([a, b]) => new THREE.Vector2(a, b)), 14), PAL.foglie[1]);
  else if (tipo === 'gommina') metti(g, new THREE.LatheGeometry([[0, 0.38], [0.4, 0.4], [0.5, 0.52], [0.47, 0.72], [0.3, 1.2], [0.1, 1.68], [0, 1.75]].map(([a, b]) => new THREE.Vector2(a, b)), 16), PAL.foglie[1]);
  else {
    metti(g, new THREE.SphereGeometry(0.52, 18, 12), PAL.foglie[tipo === 'chiaro' ? 2 : 0], [0, 0.98, 0]).scale.set(1, 0.92, 1);
    metti(g, new THREE.SphereGeometry(0.3, 14, 10), PAL.foglie[tipo === 'chiaro' ? 2 : 0], [0.3, 0.74, 0.22]);
  }
  contatto(L, x + 0.12 * s, y + 0.1 * s, z, 1.2 * s, 1.2 * s, 0.35);
}
// vero se il punto (x, y) sta ad almeno m dalla linea di mezzo della strada ad anello (e dal vialetto del fornitore)
function lontanoDallaStrada(x, y, m) {
  if (x < 0.8 && x > -3.2 && Math.abs(y - 2.6) < m - 0.15) return false;
  for (const p of STRADA_ANELLO.pts) if (Math.hypot(p[0] - x, p[1] - y) < m) return false;
  return true;
}
function verde(L, O) {
  // il giardino della scuola
  metti(L, rettangoloGeo(4.0, 2.4, 0.2, true), PAL.erbaScura, [4.4, 0.008, 6.7], [-Math.PI / 2, 0, 0], false);
  for (const [x, y, z, s, t] of [
    [2.8, 5.8, 0, 0.85, 'cipresso'], [6.1, 5.75, 0, 0.75, 'cipresso'], [4.3, 6.0, 0, 0.75, 'tondo'],
    [2.7, -0.2, Z2, 0.8, 'cipresso'], [2.7, 0.8, Z2, 0.7, 'cipresso'], [6.65, -0.3, Z2, 0.75, 'gommina'], [16.9, 3.6, Z2, 0.6, 'chiaro'],
    [9.6, 11.6, 0, 0.55, 'tondo'], [14.5, 11.65, 0, 0.5, 'chiaro'], [5.0, 11.55, 0, 0.5, 'gommina'], [19.3, 11.3, 0, 0.6, 'tondo'],
    [-3.0, 4.4, 0, 0.9, 'cipresso'], [-2.2, 5.2, 0, 0.7, 'tondo'], [-3.0, 9.6, 0, 0.9, 'tondo'], [-1.0, 10.9, 0, 0.7, 'chiaro'], [-2.4, 11.0, 0, 0.65, 'gommina'],
    [-3.1, -2.4, 0, 0.8, 'cipresso'], [-0.6, -2.5, 0, 0.75, 'cipresso'], [20.8, -2.5, 0, 0.7, 'cipresso'], [18.4, 3.2, 0, 0.6, 'gommina'],
    [0.0, 6.5, 0, 0.6, 'tondo'], [-0.2, 8.4, 0, 0.55, 'chiaro'],
  ]) if (z > 0 || lontanoDallaStrada(x, y, 0.95 + 0.55 * s)) albero(L, x, y, z, s, t);
  for (const [x, y, s] of [[-1.3, 7.4, 0.3], [-2.9, 7.0, 0.26], [0.0, -0.3, 0.26], [19.2, 1.4, 0.28], [6.3, 7.5, 0.24], [2.6, 7.5, 0.24]]) {
    metti(L, new THREE.SphereGeometry(1, 14, 10), PAL.foglie[2], [x, s * 0.55, y]).scale.set(s * 1.25, s, s * 1.1);
    contatto(L, x + 0.05, y + 0.05, 0, s * 3.2, s * 3, 0.3);
  }
  // la panchina del giardino
  const p = new THREE.Group(); p.position.set(4.2, 0, 7.55); L.add(p);
  metti(p, scatolaGeo(1.2, 0.07, 0.3, 0.025), PAL.cartone, [0, 0.38, 0]); metti(p, scatolaGeo(1.2, 0.3, 0.06, 0.025), PAL.cartone, [0, 0.58, -0.14]);
  for (const s of [-0.5, 0.5]) metti(p, scatolaGeo(0.07, 0.36, 0.26, 0.02), PAL.ardesia, [s, 0.18, 0]);
  // i fiori: sbocciano col sole (si animano: restano fuori dalla fusione)
  const fr = rng(21), fiori = [];
  for (let i = 0; i < 18; i++) fiori.push([2.7 + fr() * 3.4, 6.2 + fr() * 1.55, 0]);
  for (let i = 0; i < 7; i++) fiori.push([2.6 + fr() * 1.2, 4.2 + fr() * 0.9, Z2]);
  for (let i = 0; i < 10; i++) fiori.push([-3.2 + fr() * 2.6, 6.0 + fr() * 3.2, 0]);
  // fiori sul bordo della strada: ciuffi sul lato esterno dell'anello
  for (let s = 0.5; s < STRADA_ANELLO.len; s += 1.15) {
    const p = STRADA_ANELLO.a(s), nx = Math.sin(p.ang), ny = -Math.cos(p.ang);
    const sgn = Math.hypot(p.x + nx - PIASTRA.cx, p.y + ny - PIASTRA.cy) > Math.hypot(p.x - PIASTRA.cx, p.y - PIASTRA.cy) ? 1 : -1;
    for (let k = 0; k < 3; k++) { const o = 1.2 + fr() * 0.35, x = p.x + sgn * nx * o + (fr() - 0.5) * 0.4, y = p.y + sgn * ny * o + (fr() - 0.5) * 0.4;
      if (x > PIASTRA.x0 + 0.35 && x < PIASTRA.x1 - 0.35 && y > PIASTRA.y0 + 0.35 && y < PIASTRA.y1 - 0.35 && !(x < 0.6 && y > 1.7 && y < 3.5) && lontanoDallaStrada(x, y, 1.1)) fiori.push([x, y, 0]); }
  }
  O.fiori = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), vernice('#ffffff', 0.8), fiori.length);
  O.fiori.userData.vivo = true; O.fiori.receiveShadow = true; L.add(O.fiori);
  O.fioriPos = fiori;
  fiori.forEach((_, i) => O.fiori.setColorAt(i, new THREE.Color([PAL.accento, PAL.senape, '#fff7ea', '#b9a6e0', '#f7c9c0'][i % 5])));
  O.steli = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 4), vernice(PAL.foglie[0]), fiori.length);
  const o = new THREE.Object3D();
  fiori.forEach(([x, y, z], i) => { o.position.set(x, z + 0.1, y); o.updateMatrix(); O.steli.setMatrixAt(i, o.matrix); });
  L.add(O.steli);
}

/* ---------- lampioni: la sera si accendono (bulbo luminoso + alone morbido) ---------- */
function lampioni(L, O) {
  const alone = texCanvas(128, 128, (ctx, W) => { const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(255,214,140,0.9)'); g.addColorStop(0.35, 'rgba(255,200,120,0.35)'); g.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W); });
  O.matAlone = new THREE.SpriteMaterial({ map: alone, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 });
  O.aloni = [];
  for (const [x, y, z] of LAMPIONI) {
    metti(L, new THREE.CylinderGeometry(0.11, 0.13, 0.12, 10), PAL.ardesia, [x, z + 0.06, y]);
    metti(L, new THREE.CylinderGeometry(0.04, 0.055, 1.9, 8), PAL.ardesia, [x, z + 1.05, y]);
    metti(L, new THREE.CylinderGeometry(0.12, 0.08, 0.08, 10), PAL.ardesia, [x, z + 2.02, y]);
    metti(L, new THREE.SphereGeometry(0.15, 14, 10), O.bulbi, [x, z + 2.18, y]);
    const s = new THREE.Sprite(O.matAlone); s.position.set(x, z + 2.18, y); s.scale.setScalar(1.6); s.userData.vivo = true; L.add(s); O.aloni.push(s);
  }
  O.luceLampione = new THREE.PointLight(PAL.lampada, 0, 6, 2); O.luceLampione.position.set(10.95, 2.18, 8.25); L.add(O.luceLampione);
}

/* ---------- il pallet accanto alla gelateria: qui il furgone lascia i pacchi, la mattina il gelataio li porta dentro ---------- */
function casse(L, O) {
  metti(L, scatolaGeo(1.25, 0.1, 1.05, 0.03), PAL.sasso[1], [CASSE.x, 0.05, CASSE.y]);
  contatto(L, CASSE.x + 0.1, CASSE.y + 0.1, 0, 1.9, 1.6, 0.35);
}
