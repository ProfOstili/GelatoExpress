/* =====================================================================
   DIORAMA 3D — "Tiny Diorama" per La Gelateria Automatica
   Un piccolo mondo su una sola piastrella sospesa: il fornitore, la strada
   e la gelateria, collegati dal furgoncino. Stile ripreso da Futurepedia
   3D Style Atlas #04 (docs/tiny-diorama-prompt.md): stessi materiali,
   luce, camera e finitura, ma rifatto per il tempo reale (un solo render
   per fotogramma + un passaggio di post-produzione leggero).

   Uso:   Diorama.monta(contenitore)  poi gli agganci:
          setMeteo, setOra, camion, cliente, setConi, setFinito,
          setVenduto, setStock, nuovoGiorno, setSpeed
   Richiede la variabile globale THREE (three.js 0.187.0, solo core).
   ===================================================================== */
const Diorama = (() => {
  const THREE = window.THREE;

  /* ---------------------------------------------------------------
     MATEMATICA E CASO CON SEME (niente Math.random nella scena)
     --------------------------------------------------------------- */
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const liscio = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
  // molla smorzata da 0 a 1 (t in secondi): per i cartelli che si girano e le cose che rimbalzano
  const molla = (t, freq = 2.2, damp = 0.45) => {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
    return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
  };
  // generatore pseudo-casuale con seme (mulberry32)
  const rng = (seme) => {
    let a = seme >>> 0;
    const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    return r;
  };
  const hash = (x, y = 0) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123; return h - Math.floor(h); };

  /* ---------------------------------------------------------------
     CONTENUTO: posizioni sulla piastrella (x sinistra→destra, z dietro(−)→davanti(+), y in alto, 0 = erba)
     --------------------------------------------------------------- */
  const TILE = { w: 13, d: 8.6, r: 1.0 }, FLOOR = -3.6;
  const STRADA = [[-2.3, -1.9], [-1.0, -1.9], [0.2, -1.85], [1.2, -1.6], [1.85, -0.9], [1.9, 0.1], [1.35, 0.95], [1.0, 1.85], [1.5, 2.65], [2.6, 2.85], [3.9, 2.85], [5.2, 2.85], [6.6, 2.85]];
  const FORN = { x: -4.0, z: -2.0, w: 3.0, d: 2.6, h: 1.45 };      // tappa 1: il fornitore
  const GEL = { x: 3.65, z: 0.55, w: 2.7, d: 1.9, h: 1.65 };        // tappa 3: la gelateria
  const CASSE = { x: 5.65, z: 0.15 };                               // la pila di casse del magazzino
  const CARTELLI = [
    { parola: 'ORDINATO', at: [-3.4, -3.05], h: 2.35 },             // sul tetto del fornitore
    { parola: 'IN VIAGGIO', at: [0.35, 0.15], h: 1.35 },          // lungo la strada
    { parola: 'VENDUTO', at: [4.75, -0.55], h: 2.85 },             // dietro la gelateria
  ];
  // la passeggiata dei clienti: arrivano da sinistra, si fermano al bancone, ripartono
  const CLIENTI = { da: [0.3, 2.08], banco: [3.05, 2.08], via: [6.3, 2.12] };
  const FURGONE_PARTENZA = -1.15, FURGONE_ARRIVO = 3.2;            // x sulla strada dove parte e dove si ferma

  // pochi colori di vernice opaca; UN solo accento, riservato al gelato
  const PAL = {
    sfondo: '#b4d2de', sera: '#8fa6c6', notte: '#4d556c', pioggia: '#97a7b5', nuvole: '#aebfcb',
    erba: '#9fc47c', foglie: ['#5fa574', '#3f866c', '#84ba6b'], tronco: '#8b5b3e',
    terra: ['#5c4135', '#8f6248', '#c9955f', '#7c7f8e'], sasso: ['#a9a9b0', '#d9cdb8', '#8d8f9c'],
    crema: '#f6ebd8', ardesia: '#44718a', senape: '#f0b040', accento: '#ff6fa5', vetro: '#2c4658', scuro: '#272b36',
    strada: '#6e7080', cartone: '#cb9c68', pelle: '#f2c8a2', fumo: '#ffffff', acqua: '#7f9fb8', lampada: '#ffc56e',
    travertino: '#eee4d0', cupola: '#9aa3b4', cialda: '#e0a85a', cioccolato: '#7a4a35', menta: '#bfe3cf',
  };
  const FONT = '600 160px "Fredoka"';

  /* ---------------------------------------------------------------
     STATO (impostato dagli agganci del gioco)
     --------------------------------------------------------------- */
  const stato = {
    meteo: 'sole', meteoK: { pioggia: 0, nuvole: 0 }, ora: 10,
    camion: { attivo: false, kg: 0, ore: 0 }, coni: 0, finito: false, venduto: false, stock: 40, stockMax: 100,
    speed: 1, qualita: 'alta',
  };
  let R, scena, camera, rt, post, quad, tela, contenitore, avviato = false;
  const tReale = () => performance.now() / 1000;
  let tGioco = 0, ultimoT = 0;                                      // orologio che segue la velocità (1×, 2×, 4×)
  const eventi = [];                                                // animazioni a tempo (clienti, ritorno del furgone)

  /* ---------------------------------------------------------------
     FORME (dal kit del riferimento): anelli arrotondati, estrusioni, scatole morbide
     --------------------------------------------------------------- */
  // un rettangolo con gli angoli arrotondati, come anello di punti con le normali verso l'esterno
  function anello(w, d, r, n = 10) {
    const pts = [], hx = w / 2 - r, hz = d / 2 - r; let u = 0, px = 0, pz = 0;
    for (let k = 0; k < 4; k++) for (let i = 0; i <= n; i++) {
      const a = (k + i / n) * Math.PI / 2, x = (k === 0 || k === 3 ? hx : -hx) + r * Math.cos(a), z = (k < 2 ? hz : -hz) + r * Math.sin(a);
      if (pts.length) u += Math.hypot(x - px, z - pz);
      px = x; pz = z; pts.push({ x, z, nx: Math.cos(a), nz: Math.sin(a), u });
    }
    pts.push({ ...pts[0], u: u + Math.hypot(pts[0].x - px, pts[0].z - pz) });
    pts.giro = pts[pts.length - 1].u;
    return pts;
  }
  // un profilo laterale fatto girare lungo l'anello: piastrella, bordo d'erba, zoccoli, pozzanghere
  function loft(giro, profilo, tappo = true) {
    const Pf = profilo.map(([ins, y, a], j) => { const p0 = profilo[Math.max(0, j - 1)], p1 = profilo[Math.min(profilo.length - 1, j + 1)]; return [ins, y, a == null ? Math.atan2(p0[1] - p1[1], p0[0] - p1[0]) : a]; });
    const M = giro.length, pos = [], nor = [], uv = [], idx = [], y0 = Pf[0][1], y1 = Pf[Pf.length - 1][1];
    for (const [ins, y, a] of Pf) for (const p of giro) { pos.push(p.x - p.nx * ins, y, p.z - p.nz * ins); nor.push(p.nx * Math.sin(a), Math.cos(a), p.nz * Math.sin(a)); uv.push(p.u / giro.giro, (y - y1) / (y0 - y1 || 1)); }
    for (let j = 0; j < Pf.length - 1; j++) for (let i = 0; i < M - 1; i++) { const a = j * M + i, b = a + 1, c = a + M, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(), nLati = idx.length;
    if (tappo) {
      const base = pos.length / 3; pos.push(0, y0, 0); nor.push(0, 1, 0); uv.push(0, 0);
      for (const p of giro) { const x = p.x - p.nx * Pf[0][0], z = p.z - p.nz * Pf[0][0]; pos.push(x, y0, z); nor.push(0, 1, 0); uv.push(x, z); }
      for (let i = 0; i < M - 1; i++) idx.push(base, base + 2 + i, base + 1 + i);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.addGroup(0, nLati, 0); if (tappo) g.addGroup(nLati, idx.length - nLati, 1);
    return g;
  }
  const bordino = (r, y, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI / 2; return [r * (1 - Math.sin(a)), y - r * (1 - Math.cos(a)), a]; });
  // una sagoma con gli angoli arrotondati, estrusa con i bordi morbidi (tetti, furgone)
  function prisma(pts, r, prof, bev = 0.04) {
    const s = new THREE.Shape(), n = pts.length;
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(Array.isArray(r) ? r[i] : r, da / 2, db / 2);
      const p0 = [p[0] + (a[0] - p[0]) * k / da, p[1] + (a[1] - p[1]) * k / da], p1 = [p[0] + (b[0] - p[0]) * k / db, p[1] + (b[1] - p[1]) * k / db];
      if (i === 0) s.moveTo(p0[0], p0[1]); else s.lineTo(p0[0], p0[1]);
      s.quadraticCurveTo(p[0], p[1], p1[0], p1[1]);
    });
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: prof - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelOffset: -bev, bevelSegments: 2, curveSegments: 5 });
    g.translate(0, 0, -(prof - 2 * bev) / 2);
    return g;
  }
  // scatola con gli spigoli arrotondati (geometrie messe in cache: la stessa misura si costruisce una volta sola)
  const cacheGeo = new Map();
  function scatolaGeo(w, h, d, r = 0.05, seg = 3) {
    const key = [w, h, d, r, seg].map((v) => v.toFixed(3)).join('|');
    if (cacheGeo.has(key)) return cacheGeo.get(key);
    r = Math.max(1e-4, Math.min(r, w / 2, h / 2, d / 2));
    const N = 2 * seg + 1, g = new THREE.BoxGeometry(2, 2, 2, N, N, N), p = g.attributes.position, nrm = g.attributes.normal;
    const half = [w / 2 - r, h / 2 - r, d / 2 - r], v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const c = [p.getX(i), p.getY(i), p.getZ(i)], inner = [0, 0, 0], a = [0, 0, 0];
      for (let k = 0; k < 3; k++) { const ix = Math.round((c[k] + 1) * N / 2), lato = ix <= seg ? -1 : 1; a[k] = ix <= seg ? -(1 - ix / seg) : (ix - seg - 1) / seg; inner[k] = lato * half[k]; }
      v.set(Math.tan(a[0] * Math.PI / 4), Math.tan(a[1] * Math.PI / 4), Math.tan(a[2] * Math.PI / 4)).normalize();
      p.setXYZ(i, inner[0] + v.x * r, inner[1] + v.y * r, inner[2] + v.z * r); nrm.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeBoundingSphere(); cacheGeo.set(key, g);
    return g;
  }
  function rettangoloGeo(w, h, r = 0.05) {
    const s = new THREE.Shape(), x = w / 2, y = h / 2; r = Math.min(r, x, y);
    s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
    s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
    const g = new THREE.ShapeGeometry(s, 6), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return g;
  }
  function texCanvas(w, h, disegna, ripeti) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d'); if (disegna) disegna(ctx, w, h);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (ripeti) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(ripeti[0], ripeti[1]); }
    t.ridisegna = (fn) => { ctx.clearRect(0, 0, w, h); fn(ctx, w, h); t.needsUpdate = true; };
    return t;
  }

  /* ---------------------------------------------------------------
     VERNICE: tutto opaco da modellino, un materiale per colore (condiviso)
     --------------------------------------------------------------- */
  const vernici = new Map();
  const vernice = (hex, rough = 0.86) => { const k = hex + rough; if (!vernici.has(k)) vernici.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 })); return vernici.get(k); };
  // qualcosa che si accende: vetro scuro di giorno, lampadina calda quando sale emissiveIntensity
  const luminosa = (hex = PAL.vetro, glow = PAL.lampada) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, emissive: glow, emissiveIntensity: 0 });
  function metti(padre, geo, mat, p = [0, 0, 0], r, ombra = true) {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? vernice(mat) : mat);
    m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
    m.castShadow = ombra; m.receiveShadow = true; padre.add(m); return m;
  }
  const scatola = (padre, w, h, d, col, p, r = 0.06, rot) => metti(padre, scatolaGeo(w, h, d, r), col, p, rot);
  const pannello = (padre, w, h, r, mat, p, rot) => metti(padre, rettangoloGeo(w, h, r), mat, p, rot, false);   // pannello dipinto appena fuori da una superficie
  // ombra di contatto: una macchia morbida sotto le cose (il cielo freddo che scurisce i contatti)
  let texContatto;
  function contatto(padre, w, d, p, forza = 0.5) {
    if (!texContatto) texContatto = texCanvas(128, 128, (ctx, W) => { const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(20,35,45,1)'); g.addColorStop(0.55, 'rgba(20,35,45,0.45)'); g.addColorStop(1, 'rgba(20,35,45,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: texContatto, transparent: true, opacity: forza, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(p[0], (p[1] || 0) + 0.012, p[2]); m.renderOrder = 1; padre.add(m); return m;
  }

  /* ---------------------------------------------------------------
     LA PIASTRELLA: erba floccata con un bordino morbido, poi il taglio con terra, argilla e roccia
     --------------------------------------------------------------- */
  function piastrella(padre) {
    const g = new THREE.Group(); padre.add(g);
    const rr = rng(7);
    const erba = texCanvas(1024, 1024, (ctx, W) => {
      ctx.fillStyle = PAL.erba; ctx.fillRect(0, 0, W, W);
      for (let i = 0; i < 90; i++) { const x = rr.range(0, W), y = rr.range(0, W), s = rr.range(60, 190), c = rr.chance(0.5) ? '255,246,190' : '60,120,70'; for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, s); gr.addColorStop(0, `rgba(${c},0.11)`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.fillRect(x + ox - s, y + oy - s, 2 * s, 2 * s); } }
      for (let i = 0; i < 22000; i++) { ctx.fillStyle = rr.chance(0.5) ? 'rgba(255,255,210,0.10)' : 'rgba(40,90,50,0.10)'; ctx.fillRect(rr.range(0, W), rr.range(0, W), 2, 2); }
    }, [1 / 5, 1 / 5]);
    const matErba = new THREE.MeshPhysicalMaterial({ map: erba, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
    const matBordo = new THREE.MeshPhysicalMaterial({ color: PAL.erba, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
    const cap = metti(g, loft(anello(TILE.w + 0.18, TILE.d + 0.18, TILE.r + 0.09, 12), [...bordino(0.11, 0), [0, -0.19, Math.PI / 2], [0.1, -0.27, Math.PI]]), [matBordo, matErba]);
    cap.castShadow = false;
    // il taglio: una sezione dipinta a mano che gira intorno alla piastrella
    const H = 1.8, strati = texCanvas(2048, 512, (ctx, W, Hh) => {
      const onda = (base, amp, k, ph) => (x) => base + amp * Math.sin(x / W * Math.PI * 2 * k + ph) + amp * 0.5 * Math.sin(x / W * Math.PI * 2 * (k * 2 + 1) + ph * 2.3);
      const fascia = (top, colore) => { ctx.fillStyle = colore; ctx.beginPath(); ctx.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top(x)); ctx.lineTo(W, Hh); ctx.fill(); };
      ctx.fillStyle = PAL.terra[0]; ctx.fillRect(0, 0, W, Hh);
      fascia(onda(44, 7, 5, 0.4), PAL.terra[1]); fascia(onda(170, 14, 3, 1.9), PAL.terra[2]); fascia(onda(292, 16, 2, 4.0), PAL.terra[3]);
      const sasso = (x, y, a, b, rot, colore) => { for (const ox of [-W, 0, W]) { ctx.fillStyle = colore; ctx.beginPath(); ctx.ellipse(x + ox, y, a, b, rot, 0, 7); ctx.fill(); } };
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(255,240,205,0.28)'; ctx.lineWidth = 5; ctx.beginPath(); const f = onda(194 + i * 15, 12, 3, 1.9 + i * 0.25); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, f(x)); ctx.stroke(); }
      for (let i = 0; i < 46; i++) sasso(rr.range(0, W), rr.range(66, 160), rr.range(7, 20), rr.range(5, 12), rr.range(-0.5, 0.5), rr.pick(['#d7c4a6', '#a88a70', '#6f4c3b']));
      for (let i = 0; i < 30; i++) sasso(rr.range(0, W), rr.range(322, 500), rr.range(24, 70), rr.range(10, 24), rr.range(-0.3, 0.3), rr.pick(['#8b8e9d', '#6e7181', '#73768a']));
      for (let i = 0; i < 40; i++) { const x = rr.range(0, W); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = rr.range(2, 4); ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + rr.range(-18, 18), 30, x + rr.range(-26, 26), rr.range(40, 90)); ctx.stroke(); }
    }, [2, 1]);
    metti(g, loft(anello(TILE.w, TILE.d, TILE.r, 12), [[0, -0.19, Math.PI / 2], [0, -1.32, Math.PI / 2], [0.07, -1.52], [0.3, -1.76], [0.62, -1.9], [0.95, -H - 0.19]], false), new THREE.MeshStandardMaterial({ map: strati, roughness: 0.9 })).castShadow = false;
    metti(g, loft(anello(TILE.w - 1.9, TILE.d - 1.9, 0.3), [[0, -H - 0.17, 0]]), PAL.terra[3]);
    // sassi veri incastrati a metà nel taglio
    const giro = anello(TILE.w, TILE.d, TILE.r, 12), sassi = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), vernice('#ffffff', 0.9), 30);
    sassi.receiveShadow = true; g.add(sassi);
    const o = new THREE.Object3D();
    for (let i = 0; i < sassi.count; i++) {
      const at = rr.range(0, giro.giro), j = giro.findIndex((q) => q.u >= at), a = giro[Math.max(0, j - 1)], b = giro[j], f = (at - a.u) / (b.u - a.u || 1);
      const x = lerp(a.x, b.x, f), z = lerp(a.z, b.z, f), y = rr.range(-0.45, -1.25), s = rr.range(0.05, 0.11);
      o.position.set(x - b.nx * s * 0.25, y, z - b.nz * s * 0.25); o.rotation.set(rr.range(0, 3), rr.range(0, 3), 0); o.scale.set(s * rr.range(1, 1.7), s * rr.range(0.6, 1), s); o.updateMatrix();
      sassi.setMatrixAt(i, o.matrix); sassi.setColorAt(i, new THREE.Color(y > -1.0 ? rr.pick(PAL.sasso) : PAL.sasso[2]));
    }
    g.userData.matErba = matErba; g.userData.matBordo = matBordo;
    return g;
  }
  // un nastro rialzato lungo un percorso (la strada); restituisce la curva su cui viaggia il furgone
  function nastro(padre, pts, larg, tex, periodo) {
    const curva = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'); curva.arcLengthDivisions = 600;
    const len = curva.getLength(), n = Math.ceil(len * 12), pos = [], uv = [], idx = [], sez = [[-larg / 2, 0, 0], [-larg / 2 + 0.05, 0.05, 0.06], [larg / 2 - 0.05, 0.05, 0.94], [larg / 2, 0, 1]];
    for (let i = 0; i <= n; i++) {
      const p = curva.getPointAt(i / n), tg = curva.getTangentAt(i / n);
      for (const [o, y, v] of sez) { pos.push(p.x - tg.z * o, y, p.z + tg.x * o); uv.push(i / n * len / periodo, v); }
      if (i < n) for (let k = 0; k < 3; k++) { const a = i * 4 + k; idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    metti(padre, g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }), [0, 0, 0], null, false);
    return Object.assign(curva, { len });
  }

  /* ---------------------------------------------------------------
     MATTONCINI: finestre, omini a piolo, alberi a lecca-lecca, cartelli, furgone, sbuffi
     --------------------------------------------------------------- */
  const capanna = (w, h, len, r = 0.1) => prisma([[-w / 2, 0], [w / 2, 0], [0, h]], [r, r, r * 1.6], len, 0.05);
  function finestra(padre, w, h, p, rotY = 0, cornice = PAL.crema) {
    const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = rotY; padre.add(g);
    scatola(g, w + 0.12, h + 0.12, 0.07, cornice, [0, 0, 0], 0.03);
    const m = luminosa(); pannello(g, w, h, 0.04, m, [0, 0, 0.04]); scatola(g, 0.035, h, 0.02, cornice, [0, 0, 0.045], 0.008);
    return m;
  }
  // gli omini sono pioli di legno tornito: corpo, testa a pallina e un dettaglio che dice chi sono
  const geoCorpo = () => new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.185, 0.04], [0.17, 0.3], [0.12, 0.43], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 16);
  let GEO_CORPO, GEO_TESTA, GEO_CAPELLI, GEO_CONO, GEO_PALLINA;
  function piolo(padre, colore, capelli) {
    GEO_CORPO ??= geoCorpo(); GEO_TESTA ??= new THREE.SphereGeometry(0.15, 16, 12); GEO_CAPELLI ??= new THREE.SphereGeometry(0.162, 16, 8, 0, 7, 0, 1.75);
    const g = new THREE.Group(); padre.add(g);
    const corpo = new THREE.Group(); g.add(corpo);
    metti(corpo, GEO_CORPO, colore); metti(corpo, GEO_TESTA, PAL.pelle, [0, 0.58, 0]);
    if (capelli) metti(corpo, GEO_CAPELLI, capelli, [0, 0.59, -0.012], [-0.35, 0, 0]);
    g.userData.corpo = corpo;
    return g;
  }
  // un cono gelato in miniatura: cialda e pallina color accento
  function cono(padre, s = 1) {
    GEO_CONO ??= new THREE.ConeGeometry(0.07, 0.2, 12); GEO_PALLINA ??= new THREE.SphereGeometry(0.08, 14, 10);
    const g = new THREE.Group(); g.scale.setScalar(s); padre.add(g);
    metti(g, GEO_CONO, PAL.cialda, [0, -0.1, 0], [Math.PI, 0, 0]); metti(g, GEO_PALLINA, PAL.accento, [0, 0.02, 0]);
    return g;
  }
  function albero(padre, x, z, s, tipo) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); padre.add(g);
    metti(g, new THREE.CylinderGeometry(0.06, 0.09, 0.6, 8), PAL.tronco, [0, 0.3, 0]);
    if (tipo === 'cipresso') metti(g, new THREE.LatheGeometry([[0, 0.3], [0.26, 0.38], [0.3, 0.7], [0.22, 1.4], [0.1, 1.95], [0, 2.05]].map(([a, b]) => new THREE.Vector2(a, b)), 16), PAL.foglie[1]);
    else if (tipo === 'gommina') metti(g, new THREE.LatheGeometry([[0, 0.38], [0.4, 0.4], [0.5, 0.52], [0.47, 0.72], [0.3, 1.2], [0.1, 1.68], [0, 1.75]].map(([a, b]) => new THREE.Vector2(a, b)), 18), PAL.foglie[1]);
    else {
      metti(g, new THREE.SphereGeometry(0.52, 20, 14), PAL.foglie[tipo === 'chiaro' ? 2 : 0], [0, 0.98, 0]).scale.set(1, 0.92, 1);
      metti(g, new THREE.SphereGeometry(0.3, 16, 12), PAL.foglie[tipo === 'chiaro' ? 2 : 0], [0.3, 0.74, 0.22]);
    }
    contatto(padre, 1.2 * s, 1.2 * s, [x + 0.12, 0, z + 0.1], 0.35);
    return g;
  }
  // il cartello di una tappa: un cartoncino su un'asta che guarda sempre l'obiettivo. Un lato grigio ("non ancora"),
  // l'altro color accento ("fatto"): si gira ruotando `giro` di PI intorno a x.
  function cartello(padre, parola, numero) {
    const g = new THREE.Group(), giro = new THREE.Group(); padre.add(g); g.add(giro);
    const PX = 380, SP = 0.05, m = document.createElement('canvas').getContext('2d'); m.font = FONT; m.letterSpacing = SP * 160 + 'px';
    const capPx = m.measureText('H').actualBoundingBoxAscent, k = 0.3 * PX / capPx, textW = m.measureText(parola).width * k / PX;
    const bh = 0.62, moneta = 0.4, bw = textW + moneta * 2 + 0.34, tx = -bw / 2 + moneta * 2 + 0.08;
    const faccia = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas(Math.round(bw * PX), Math.round(bh * PX), (ctx, W, Hh) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', 160 * k + 'px'); ctx.letterSpacing = SP * 160 * k + 'px'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(parola, (tx + bw / 2) * PX, Hh / 2 + 0.15 * PX);
    }) });
    const disco = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas(256, 256, (ctx) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', '190px'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const mm = ctx.measureText(String(numero)); ctx.fillText(String(numero), 128, 128 + mm.actualBoundingBoxAscent / 2);
    }) });
    scatola(giro, bw, bh, 0.1, PAL.crema, [0, 0, 0], 0.05);
    metti(giro, new THREE.CylinderGeometry(moneta + 0.07, moneta + 0.07, 0.16, 32), PAL.crema, [-bw / 2 + moneta, 0, 0], [Math.PI / 2, 0, 0]);
    for (const [lato, bg, fg, cbg, cfg] of [[1, '#ece8df', '#7d8996', '#aab3bd', '#f4f1ea'], [-1, PAL.accento, '#fff6e6', '#fff6e6', PAL.accento]]) {
      const s = new THREE.Group(); s.rotation.x = lato > 0 ? 0 : Math.PI; giro.add(s);
      pannello(s, bw - 0.09, bh - 0.09, 0.03, faccia(bg, fg), [0, 0, 0.052]);
      metti(s, new THREE.CircleGeometry(moneta, 32), disco(cbg, cfg), [-bw / 2 + moneta, 0, 0.082], null, false);
    }
    const asta = metti(g, new THREE.CylinderGeometry(0.05, 0.06, 1, 10), PAL.crema, [0, 0, -0.1]);
    metti(g, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 14), PAL.ardesia, [0, 0.04, -0.1]);
    return { g, giro, asta, fatto: false, quando: -99, altezza(h) { giro.position.y = h; asta.scale.y = h; asta.position.y = h / 2; } };
  }
  // il furgoncino: una sagoma estrusa di lato, quattro ruote, vetri, fari e un portellone. x è "avanti".
  function furgone(padre, colore) {
    const g = new THREE.Group(), corpo = new THREE.Group(); padre.add(g); g.add(corpo);
    metti(corpo, prisma([[-0.92, 0.2], [0.92, 0.2], [0.94, 0.52], [0.68, 0.61], [0.4, 1.05], [-0.92, 1.05]], [0.08, 0.1, 0.1, 0.05, 0.14, 0.12], 0.86, 0.06), colore);
    const vetro = vernice(PAL.vetro, 0.6), n = new THREE.Vector3(0.44, 0.28, 0).normalize();
    const parabrezza = pannello(corpo, 0.66, 0.38, 0.07, vetro, [0.54 + n.x * 0.012, 0.835 + n.y * 0.012, 0]); parabrezza.lookAt(parabrezza.position.clone().add(n));
    for (const s of [1, -1]) {
      const rot = [0, s > 0 ? 0 : Math.PI, 0];
      pannello(corpo, 0.3, 0.26, 0.05, vetro, [0.2, 0.83, s * 0.432], rot);
      pannello(corpo, 1.5, 0.09, 0.03, PAL.crema, [-0.1, 0.44, s * 0.432], rot);
      pannello(corpo, 0.46, 0.4, 0.05, PAL.crema, [-0.42, 0.78, s * 0.432], rot);
      // un cono dipinto sulla fiancata
      const c = new THREE.Group(); c.position.set(-0.42, 0.78, s * 0.44); c.rotation.y = rot[1]; corpo.add(c);
      metti(c, new THREE.CircleGeometry(0.09, 20), vernice(PAL.accento), [0, 0.06, 0.002], null, false);
      metti(c, new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.08, 0.02), new THREE.Vector2(0.08, 0.02), new THREE.Vector2(0, -0.16)])), vernice(PAL.cialda), [0, 0, 0.001], null, false);
    }
    scatola(corpo, 0.09, 0.1, 0.82, PAL.ardesia, [0.93, 0.27, 0], 0.03); scatola(corpo, 0.09, 0.1, 0.82, PAL.ardesia, [-0.92, 0.25, 0], 0.03);
    const fari = luminosa('#fff3d6', '#fff0c8'); for (const s of [1, -1]) metti(corpo, new THREE.CylinderGeometry(0.065, 0.065, 0.04, 14), fari, [0.945, 0.42, s * 0.28], [0, 0, Math.PI / 2]);
    pannello(corpo, 0.72, 0.62, 0.05, PAL.scuro, [-0.923, 0.64, 0], [0, -Math.PI / 2, 0]);
    const portellone = new THREE.Group(); portellone.position.set(-0.94, 1.0, 0); corpo.add(portellone);
    scatola(portellone, 0.05, 0.74, 0.76, colore, [0, -0.37, 0], 0.025); scatola(portellone, 0.02, 0.2, 0.44, PAL.vetro, [-0.02, -0.2, 0], 0.01);
    const ruote = [];
    for (const [x, z] of [[0.56, 0.37], [0.56, -0.37], [-0.56, 0.37], [-0.56, -0.37]]) {
      const w = new THREE.Group(); w.position.set(x, 0.2, z); g.add(w); ruote.push(w);
      metti(w, new THREE.CylinderGeometry(0.2, 0.2, 0.17, 20), PAL.scuro, [0, 0, 0], [Math.PI / 2, 0, 0]);
      metti(w, new THREE.CylinderGeometry(0.1, 0.1, 0.19, 12), PAL.crema, [0, 0, 0], [Math.PI / 2, 0, 0]);
      metti(w, new THREE.CylinderGeometry(0.028, 0.028, 0.2, 6), PAL.scuro, [0.055, 0, 0], [Math.PI / 2, 0, 0]);
    }
    // le casse dentro (si vedono quando si alza il portellone)
    const carico = scatola(corpo, 0.5, 0.36, 0.6, PAL.cartone, [-0.62, 0.42, 0], 0.03);
    return { g, corpo, portellone, ruote, fari, carico };
  }
  // sbuffi: palline bianche opache che si gonfiano, salgono e spariscono
  function sbuffi(padre, n) {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), vernice(PAL.fumo, 0.95), n); m.castShadow = true; m.frustumCulled = false; padre.add(m);
    const o = new THREE.Object3D();
    return { m, set(i, at, eta, opz) {
      const s = eta <= 0 || eta >= 1 ? 1e-4 : opz.size * liscio(0, 0.3, eta) * (1 - liscio(0.55, 1, eta)) * (0.7 + 0.5 * eta);
      o.position.set(at[0] + (opz.drift || 0) * eta * eta, at[1] + opz.rise * eta, at[2] + (opz.driftZ || 0) * eta); o.scale.setScalar(Math.max(s, 1e-4)); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    } };
  }
  // percorso del furgone: accelera per `a` del tempo, va a velocità costante, frena per `b`
  const trap = (u, a, b) => { u = clamp(u); const v = 1 / (1 - a / 2 - b / 2); return u < a ? v * u * u / (2 * a) : u < 1 - b ? v * (u - a / 2) : 1 - v * (1 - u) * (1 - u) / (2 * b); };
  // un saltello da un punto all'altro: [x, y, z, schiacciamento]
  const saltello = (u, da, a, alt) => { u = clamp(u); const e = easeInOut(u); return [da[0] + (a[0] - da[0]) * e, alt * Math.sin(Math.PI * u), da[1] + (a[1] - da[1]) * e]; };

  /* ---------------------------------------------------------------
     COSTRUZIONE DELLA SCENA
     --------------------------------------------------------------- */
  const O = {};                                                     // tutto ciò che si anima
  function costruisci() {
    scena = new THREE.Scene();
    scena.background = new THREE.Color(PAL.sfondo);
    camera = new THREE.PerspectiveCamera(20, 16 / 9, 1, 200);

    // luce: un sole caldo e morbido davanti a sinistra, un cielo freddo che riempie
    O.ambiente = ambiente();
    O.sole = new THREE.DirectionalLight('#ffe3c0', 3.0);
    O.sole.position.set(-9, 13, 9); O.sole.castShadow = true;
    const c = O.sole.shadow.camera; c.left = -8.5; c.right = 8.5; c.top = 8.5; c.bottom = -8.5; c.near = 1; c.far = 50;
    O.sole.shadow.mapSize.setScalar(2048); O.sole.shadow.bias = -0.0004; O.sole.shadow.normalBias = 0.025; O.sole.shadow.radius = 4;
    scena.add(O.sole, O.sole.target);
    O.cielo = new THREE.HemisphereLight('#bcd3ff', '#9db39a', 0.9); scena.add(O.cielo);
    O.lunetta = new THREE.DirectionalLight('#a9c0ff', 0.0); O.lunetta.position.set(6, 10, -4); scena.add(O.lunetta);

    // la carta su cui poggia il plastico, con l'ombra della piastrella dipinta (sempre morbida e pulita)
    O.carta = metti(scena, new THREE.PlaneGeometry(300, 300), new THREE.MeshBasicMaterial({ color: PAL.sfondo }), [0, FLOOR, 0], [-Math.PI / 2, 0, 0], false);
    O.carta.receiveShadow = false;
    O.ombraTile = metti(scena, new THREE.PlaneGeometry(TILE.w + 8, TILE.d + 8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: texCanvas(512, 512, (ctx, W) => {
      const sx = W / (TILE.w + 8), sz = W / (TILE.d + 8); ctx.filter = 'blur(26px)'; ctx.fillStyle = 'rgba(38,62,92,0.55)'; ctx.beginPath(); ctx.roundRect(4 * sx, 4 * sz, TILE.w * sx, TILE.d * sz, 50); ctx.fill();
    }) }), [1.4, FLOOR + 0.02, -0.8], [-Math.PI / 2, 0, 0], false);

    // il mondo sulla piastrella (oscilla piano tutto insieme)
    O.mondo = new THREE.Group(); scena.add(O.mondo);
    O.terra = piastrella(O.mondo);
    const L = O.terra;
    const texStrada = texCanvas(256, 128, (ctx, W, H) => { ctx.fillStyle = PAL.strada; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f3ead8'; ctx.fillRect(40, H / 2 - 5, 120, 10); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, 12, W, 5); ctx.fillRect(0, H - 17, W, 5); });
    texStrada.wrapS = THREE.RepeatWrapping;
    O.strada = nastro(L, STRADA, 1.14, texStrada, 0.8);
    const distX = (x, da, a) => { let lo = da, hi = a; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (O.strada.getPointAt(m / O.strada.len).x < x) lo = m; else hi = m; } return lo; };
    O.s0 = distX(FURGONE_PARTENZA, 0, 3); O.s1 = distX(FURGONE_ARRIVO, O.strada.len - 5, O.strada.len);

    costruisciFornitore(L);
    costruisciGelateria(L);
    costruisciCasse(L);
    costruisciTodi(L);
    costruisciPaesaggio(L);

    // il furgoncino, color accento (è lui che porta il gelato), e il suo fumo
    O.furgone = furgone(L, PAL.accento);
    O.fumo = sbuffi(L, 18);
    O.scia = [];                                                    // sbuffi lasciati dal furgone (posizione e istante)

    // i cartelli delle tre tappe
    O.cartelli = CARTELLI.map((s, i) => { const o = cartello(L, s.parola, i + 1); o.g.position.set(s.at[0], 0, s.at[1]); o.altezza(s.h); return o; });

    // i clienti: una piccola riserva di omini a piolo riutilizzati
    const colori = [PAL.ardesia, PAL.senape, PAL.foglie[1], PAL.crema, PAL.cartone, '#8a7fb0', '#5f8fae'];
    const capelli = [PAL.tronco, '#3a2c25', '#d9b26a', null, '#5a3b2c', '#2b2b33', null];
    O.clienti = Array.from({ length: 12 }, (_, i) => { const p = piolo(L, colori[i % colori.length], capelli[i % capelli.length]); p.visible = false; p.userData.cono = cono(p.userData.corpo, 1); p.userData.cono.position.set(0.16, 0.5, 0.08); return p; });

    // la pioggia: trattini sottili che cadono, e pozzanghere lucide che si allargano
    const NP = 260;
    O.gocce = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.28, 4), new THREE.MeshBasicMaterial({ color: '#dbe7f2', transparent: true, opacity: 0.55 }), NP);
    O.gocce.frustumCulled = false; O.gocce.visible = false; L.add(O.gocce);
    const rg = rng(99); O.goccePos = Array.from({ length: NP }, () => [rg.range(-TILE.w / 2 + 0.3, TILE.w / 2 - 0.3), rg.range(0, 1), rg.range(-TILE.d / 2 + 0.3, TILE.d / 2 - 0.3), rg.range(0.8, 1.2)]);
    const matPozza = new THREE.MeshStandardMaterial({ color: PAL.acqua, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.6, transparent: true, opacity: 0.9 });
    O.pozze = [[-0.9, -1.9, 0.55], [1.85, 0.4, 0.4], [3.2, 2.9, 0.5], [-3.2, 0.6, 0.45], [0.2, 2.3, 0.38], [5.0, 1.9, 0.35]].map(([x, z, s]) => {
      const m = metti(L, loft(anello(s * 2.2, s * 1.4, s * 0.65, 6), [[0, 0.058, 0]]), matPozza, [x, 0, z], [0, hash(x, z) * 3, 0], false);
      m.userData.s = s; m.scale.setScalar(0.001); return m;
    });
    O.matPozza = matPozza;

    // nuvole: gruppi di palline bianche sospese sopra la piastrella
    O.nuvole = [[-0.9, 3.3, -2.9, 0.6], [2.5, 3.5, -3.1, 0.65]].map(([x, y, z, s], i) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(0.001); L.add(g); g.userData = { x, s };
      const rn = rng(40 + i);
      for (let k = 0; k < 6; k++) { const m = metti(g, new THREE.SphereGeometry(1, 16, 12), vernice('#ffffff', 0.95), [rn.range(-1, 1), rn.range(-0.1, 0.3), rn.range(-0.5, 0.5)], null, true); m.scale.setScalar(rn.range(0.45, 0.8)); m.receiveShadow = false; }
      return g;
    });
  }
  // l'ambiente per i riflessi (pozzanghere, vetri): un cielo a gradiente costruito in codice, niente HDRI
  function ambiente() {
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color('#c4dcf2') }, hor: { value: new THREE.Color('#f2e8da') }, bot: { value: new THREE.Color('#9db39a') } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vD; uniform vec3 top, hor, bot; void main(){ float y = normalize(vD).y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.6)) : mix(hor, bot, pow(-y, 0.5)); gl_FragColor = vec4(c, 1.0); }',
    })));
    const pm = new THREE.PMREMGenerator(R), t = pm.fromScene(es, 0.02, 0.1, 200).texture; pm.dispose();
    scena.environment = t; scena.environmentIntensity = 0.4;
    return t;
  }

  // TAPPA 1: il fornitore. Un capannone con il tetto a denti di sega, la saracinesca e il comignolo.
  function costruisciFornitore(L) {
    const F = new THREE.Group(); F.position.set(FORN.x, 0, FORN.z); L.add(F);
    metti(F, loft(anello(FORN.w + 0.24, FORN.d + 0.24, 0.16), [...bordino(0.05, 0.12), [0, 0, Math.PI / 2]]), PAL.ardesia);
    scatola(F, FORN.w, FORN.h, FORN.d, PAL.crema, [0, FORN.h / 2 + 0.08, 0], 0.09);
    contatto(L, FORN.w + 1.4, FORN.d + 1.4, [FORN.x + 0.2, 0, FORN.z + 0.2], 0.45);
    O.vetriFornitore = luminosa(PAL.vetro, '#ffe2a8');
    for (let i = -1; i <= 1; i++) {
      metti(F, prisma([[-0.52, 0], [0.52, 0], [0.52, 0.56]], [0.05, 0.07, 0.08], FORN.d + 0.12, 0.05), PAL.ardesia, [i * 1.0, FORN.h + 0.06, 0]);
      pannello(F, FORN.d - 0.5, 0.26, 0.05, O.vetriFornitore, [i * 1.0 + 0.525, FORN.h + 0.34, 0], [0, Math.PI / 2, 0]);
    }
    // la saracinesca sul lato che guarda la strada (+x)
    const fx = FORN.w / 2, dz = 0.1;
    scatola(F, 0.12, 1.24, 1.5, PAL.senape, [fx, 0.7, dz], 0.05);
    pannello(F, 1.26, 1.04, 0.04, PAL.scuro, [fx + 0.062, 0.64, dz], [0, Math.PI / 2, 0]);
    const lamelle = texCanvas(64, 64, (ctx) => { ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = 'rgba(90,70,50,0.35)'; ctx.fillRect(0, 0, 64, 9); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 9, 64, 6); }, [1, 7]);
    const geo = new THREE.PlaneGeometry(1.26, 1.04); geo.translate(0, -0.52, 0);
    O.saracinesca = metti(F, geo, new THREE.MeshStandardMaterial({ map: lamelle, roughness: 0.7 }), [fx + 0.068, 1.16, dz], [0, Math.PI / 2, 0], false); O.lamelle = lamelle;
    scatola(F, 0.2, 0.2, 1.54, PAL.senape, [fx + 0.03, 1.26, dz], 0.06);
    // la facciata: due finestre e un pacco dipinto
    const zf = FORN.d / 2;
    O.finestreFornitore = [finestra(F, 0.5, 0.42, [-0.95, 0.98, zf + 0.01]), finestra(F, 0.5, 0.42, [-0.2, 0.98, zf + 0.01])];
    pannello(F, 0.78, 0.78, 0.12, PAL.ardesia, [0.75, 0.85, zf + 0.004]); scatola(F, 0.44, 0.36, 0.03, PAL.cartone, [0.75, 0.83, zf + 0.012], 0.02); scatola(F, 0.09, 0.365, 0.034, PAL.crema, [0.75, 0.83, zf + 0.012], 0.01);
    metti(F, new THREE.CylinderGeometry(0.13, 0.15, 0.8, 14), PAL.ardesia, [-1.15, FORN.h + 0.6, 0.85]); metti(F, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 14), PAL.crema, [-1.15, FORN.h + 1.0, 0.85]);
    O.comignolo = [FORN.x - 1.15, FORN.h + 1.08, FORN.z + 0.85];
    // pacchi in attesa vicino al muro
    for (const [x, z, r, s] of [[-5.0, -0.25, 0.3, 1], [-4.55, -0.15, -0.15, 1.1], [-4.8, 0, 0.1, 0.9]]) {
      const p = new THREE.Group(); p.position.set(x, 0.16 * s, z); p.rotation.y = r; p.scale.setScalar(s); L.add(p);
      scatola(p, 0.42, 0.32, 0.36, PAL.cartone, [0, 0, 0], 0.035); scatola(p, 0.1, 0.326, 0.366, PAL.crema, [0, 0, 0], 0.01);
    }
    O.magazziniere = piolo(L, PAL.ardesia, null);
    metti(O.magazziniere.userData.corpo, new THREE.SphereGeometry(0.17, 16, 8, 0, 7, 0, 1.5), PAL.senape, [0, 0.6, 0]);
    O.magazziniere.position.set(-2.3, 0, -1.1); O.magazziniere.rotation.y = -0.6;
  }

  // TAPPA 3: la gelateria. Tenda a strisce, bancone, vetrina luminosa con i coni, porta scorrevole, cono sul tetto.
  function costruisciGelateria(L) {
    const G = new THREE.Group(); G.position.set(GEL.x, 0, GEL.z); L.add(G);
    metti(G, loft(anello(GEL.w + 0.26, GEL.d + 0.26, 0.16), [...bordino(0.05, 0.1), [0, 0, Math.PI / 2]]), PAL.sasso[1]);
    scatola(G, GEL.w, GEL.h, GEL.d, PAL.crema, [0, GEL.h / 2 + 0.06, 0], 0.09);
    contatto(L, GEL.w + 1.5, GEL.d + 1.5, [GEL.x + 0.2, 0, GEL.z + 0.15], 0.45);
    scatola(G, GEL.w + 0.22, 0.14, GEL.d + 0.22, PAL.ardesia, [0, GEL.h + 0.13, 0], 0.06);   // il tetto piatto
    const zf = GEL.d / 2;
    // la vetrina luminosa: mostra quanti coni restano
    O.texConi = texCanvas(512, 256);
    O.matVetrina = new THREE.MeshStandardMaterial({ map: O.texConi, emissiveMap: O.texConi, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.5 });
    scatola(G, 1.22, 0.66, 0.07, PAL.crema, [-0.55, 1.0, zf + 0.01], 0.03);
    pannello(G, 1.1, 0.55, 0.04, O.matVetrina, [-0.55, 1.0, zf + 0.05]);
    // la porta scorrevole a destra
    O.vanoPorta = luminosa(PAL.scuro, '#ffca7a');
    scatola(G, 0.7, 1.02, 0.07, PAL.ardesia, [0.75, 0.57, zf + 0.01], 0.03);
    pannello(G, 0.56, 0.9, 0.04, O.vanoPorta, [0.75, 0.52, zf + 0.05]);
    O.porta = scatola(G, 0.56, 0.9, 0.05, PAL.menta, [0.75, 0.52, zf + 0.08], 0.025);
    metti(O.porta, new THREE.SphereGeometry(0.03, 8, 6), PAL.crema, [-0.2, 0, 0.035]);
    O.finestreGel = [finestra(G, 0.42, 0.36, [GEL.w / 2 + 0.01, 0.85, -0.3], Math.PI / 2, PAL.crema)];
    // la tenda a strisce: accento e crema, leggermente inclinata
    const tenda = new THREE.Group(); tenda.position.set(0, GEL.h - 0.05, zf + 0.02); tenda.rotation.x = 0.42; G.add(tenda);
    const n = 9, lw = (GEL.w + 0.1) / n;
    for (let i = 0; i < n; i++) scatola(tenda, lw + 0.005, 0.04, 0.48, i % 2 ? PAL.crema : PAL.accento, [-(GEL.w + 0.1) / 2 + lw * (i + 0.5), 0, 0.24], 0.015);
    for (let i = 0; i < n; i++) metti(tenda, new THREE.CylinderGeometry(lw / 2, lw / 2, 0.05, 12, 1, false, 0, Math.PI), vernice(i % 2 ? PAL.crema : PAL.accento), [-(GEL.w + 0.1) / 2 + lw * (i + 0.5), -0.02, 0.48], [Math.PI / 2, 0, 0]);
    // il bancone con le vaschette
    scatola(G, 1.3, 0.42, 0.36, PAL.crema, [-0.55, 0.25, zf + 0.25], 0.05);
    scatola(G, 1.38, 0.06, 0.42, PAL.ardesia, [-0.55, 0.48, zf + 0.25], 0.02);
    [PAL.accento, PAL.crema, PAL.cioccolato, PAL.menta].forEach((c, i) => metti(G, new THREE.SphereGeometry(0.11, 14, 10), c, [-1.0 + i * 0.3, 0.53, zf + 0.25]).scale.set(1, 0.55, 0.9));
    // il cono gelato sul tetto: l'insegna
    O.conone = new THREE.Group(); O.conone.position.set(-0.3, GEL.h + 0.2, -0.1); G.add(O.conone);
    metti(O.conone, new THREE.ConeGeometry(0.28, 0.8, 18), PAL.cialda, [0, 0.42, 0], [Math.PI, 0, 0]);
    metti(O.conone, new THREE.SphereGeometry(0.34, 20, 14), PAL.accento, [0, 0.92, 0]);
    metti(O.conone, new THREE.SphereGeometry(0.1, 12, 8), PAL.crema, [0.12, 1.22, 0.08]);
    // il cartellino "GELATO FINITO!" appeso sotto la tenda: si gira quando i coni finiscono
    O.finito = new THREE.Group(); O.finito.position.set(0.75, 1.33, zf + 0.42); O.finito.scale.setScalar(1.35); G.add(O.finito);
    metti(O.finito, new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), PAL.scuro, [-0.22, 0.12, 0]); metti(O.finito, new THREE.CylinderGeometry(0.008, 0.008, 0.22, 6), PAL.scuro, [0.22, 0.12, 0]);
    O.finitoCarta = new THREE.Group(); O.finito.add(O.finitoCarta);
    scatola(O.finitoCarta, 0.74, 0.3, 0.04, PAL.crema, [0, 0, 0], 0.03);
    const scritta = (testo, bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: texCanvas(512, 200, (ctx, W, H) => { ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', testo.length > 8 ? '74px' : '96px'); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(testo, W / 2, H / 2 + 6); }) });
    pannello(O.finitoCarta, 0.68, 0.25, 0.025, scritta('APERTO', '#ece8df', PAL.ardesia), [0, 0, 0.022]);
    pannello(O.finitoCarta, 0.68, 0.25, 0.025, scritta('GELATO FINITO!', PAL.scuro, PAL.accento), [0, 0, -0.022], [0, Math.PI, 0]);
    // il lampione davanti
    const lamp = new THREE.Group(); lamp.position.set(1.85, 0, 2.0); L.add(lamp);
    metti(lamp, new THREE.CylinderGeometry(0.04, 0.055, 1.25, 8), PAL.ardesia, [0, 0.625, 0]); metti(lamp, new THREE.CylinderGeometry(0.1, 0.07, 0.07, 10), PAL.ardesia, [0, 1.27, 0]);
    O.bulbo = luminosa('#fff4dd', PAL.lampada); metti(lamp, new THREE.SphereGeometry(0.13, 14, 10), O.bulbo, [0, 1.42, 0]);
    O.luceLampione = new THREE.PointLight(PAL.lampada, 0, 5, 2); O.luceLampione.position.set(1.85, 1.42, 2.0); L.add(O.luceLampione);
    O.luceNegozio = new THREE.PointLight('#ffb866', 0, 4, 2); O.luceNegozio.position.set(GEL.x - 0.3, 1.0, GEL.z + zf + 0.7); L.add(O.luceNegozio);
    O.gelataio = piolo(L, PAL.crema, PAL.tronco);
    metti(O.gelataio.userData.corpo, new THREE.CylinderGeometry(0.11, 0.13, 0.12, 14), '#ffffff', [0, 0.73, 0]);   // il cappellino bianco
    O.gelataio.position.set(GEL.x - 0.55, 0.06, GEL.z + zf + 0.02);
    disegnaVetrina();
  }
  function disegnaVetrina() {
    if (!O.texConi) return;                                         // la scena non è ancora pronta: si disegna alla costruzione
    const n = Math.max(0, Math.round(stato.coni)), finiti = stato.finito || n <= 0;
    O.texConi.ridisegna((ctx, W, H) => {
      ctx.fillStyle = '#2a2433'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL.cialda; ctx.beginPath(); ctx.moveTo(58, 120); ctx.lineTo(118, 120); ctx.lineTo(88, 214); ctx.closePath(); ctx.fill();
      ctx.fillStyle = PAL.accento; ctx.beginPath(); ctx.arc(88, 100, 36, 0, 7); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = finiti ? '#ff8a9e' : '#fff6e6'; ctx.font = FONT.replace('160px', finiti ? '96px' : '150px');
      ctx.fillText(finiti ? '0' : String(n), 320, 112);
      ctx.font = FONT.replace('160px', '46px'); ctx.fillStyle = finiti ? '#ff8a9e' : '#c9bfd6'; ctx.fillText(finiti ? 'FINITI' : 'CONI', 320, 204);
    });
  }

  // il magazzino: una pila di casse accanto alla gelateria, che cresce e cala con i kg
  function costruisciCasse(L) {
    const G = new THREE.Group(); G.position.set(CASSE.x, 0, CASSE.z); L.add(G);
    scatola(G, 1.2, 0.08, 1.0, PAL.sasso[1], [0, 0.04, 0], 0.03);                    // il pallet
    contatto(L, 1.8, 1.5, [CASSE.x + 0.1, 0, CASSE.z + 0.1], 0.35);
    const posti = [[-0.32, 0, -0.24], [0.32, 0, -0.24], [-0.32, 0, 0.24], [0.32, 0, 0.24], [-0.32, 1, -0.24], [0.32, 1, -0.24], [-0.32, 1, 0.24], [0.32, 1, 0.24], [0, 2, 0], [0, 3, 0]];
    O.casse = posti.map(([x, l, z], i) => {
      const c = new THREE.Group(); c.position.set(x, 0.08 + 0.2 + l * 0.4, z); c.rotation.y = (hash(i) - 0.5) * 0.25; G.add(c);
      scatola(c, 0.58, 0.4, 0.44, PAL.cartone, [0, 0, 0], 0.035); scatola(c, 0.1, 0.406, 0.446, PAL.crema, [0, 0, 0], 0.01);
      c.userData = { visibile: true, da: 0, base: c.position.y };
      return c;
    });
  }

  // un richiamo a Todi: il Tempio della Consolazione in miniatura e una torre merlata
  function costruisciTodi(L) {
    const T = new THREE.Group(); T.position.set(4.9, 0, -2.75); L.add(T);
    contatto(L, 2.4, 2.4, [5.0, 0, -2.65], 0.45);
    scatola(T, 0.95, 1.1, 0.95, PAL.travertino, [0, 0.55, 0], 0.06);
    for (const [x, z] of [[0.48, 0], [-0.48, 0], [0, 0.48], [0, -0.48]]) {
      metti(T, new THREE.CylinderGeometry(0.34, 0.34, 0.72, 20), PAL.travertino, [x, 0.36, z]);
      metti(T, new THREE.SphereGeometry(0.34, 20, 10, 0, 7, 0, Math.PI / 2), PAL.cupola, [x, 0.72, z]);
    }
    metti(T, new THREE.CylinderGeometry(0.4, 0.4, 0.32, 24), PAL.travertino, [0, 1.26, 0]);
    metti(T, new THREE.SphereGeometry(0.42, 24, 12, 0, 7, 0, Math.PI / 2), PAL.cupola, [0, 1.42, 0]).scale.y = 1.15;
    metti(T, new THREE.CylinderGeometry(0.07, 0.07, 0.18, 10), PAL.travertino, [0, 1.98, 0]);
    metti(T, new THREE.SphereGeometry(0.075, 10, 8), PAL.cupola, [0, 2.09, 0]);
    // la torre merlata
    const tw = new THREE.Group(); tw.position.set(1.0, 0, -3.25); L.add(tw);
    contatto(L, 1.3, 1.3, [1.1, 0, -3.15], 0.4);
    scatola(tw, 0.7, 1.9, 0.7, '#d8c39c', [0, 0.95, 0], 0.05);
    for (const [x, z] of [[-0.25, 0.25], [0.25, 0.25], [-0.25, -0.25], [0.25, -0.25], [0, 0.25], [0.25, 0], [-0.25, 0], [0, -0.25]]) scatola(tw, 0.16, 0.2, 0.16, '#d8c39c', [x, 2.0, z], 0.03);
    O.finestraTorre = finestra(tw, 0.16, 0.28, [0, 1.4, 0.36], 0, '#e9d9b8');
  }

  // il paesaggio: alberi a lecca-lecca, cipressi, cespugli, fiori, una panchina
  function costruisciPaesaggio(L) {
    for (const [x, z, s, tipo] of [[-5.6, -3.2, 0.9, 'cipresso'], [-1.4, -3.3, 1.0, 'cipresso'], [-0.6, -3.35, 0.8, 'cipresso'], [2.5, -3.2, 1.05, 'tondo'], [3.6, -3.4, 0.8, 'cipresso'], [6.0, -3.0, 0.9, 'gommina'],
      [-5.7, 1.2, 1.0, 'tondo'], [-4.9, 2.6, 0.9, 'gommina'], [-5.6, 3.3, 0.75, 'chiaro'], [-1.9, 3.3, 0.85, 'tondo'], [-0.6, 0.75, 0.75, 'gommina'], [6.0, 3.4, 0.7, 'chiaro'], [-2.6, 1.3, 0.7, 'tondo']]) albero(L, x, z, s, tipo);
    for (const [x, z, s] of [[2.3, 1.45, 0.28], [6.0, 1.1, 0.3], [-2.9, -0.05, 0.26], [2.6, -0.3, 0.26], [-3.7, 3.3, 0.32], [0.9, 3.55, 0.26], [4.4, 3.65, 0.3], [-1.0, 1.4, 0.28]]) {
      metti(L, new THREE.SphereGeometry(1, 14, 10), PAL.foglie[x > 3 ? 0 : 2], [x, s * 0.55, z]).scale.set(s * 1.25, s, s * 1.1);
      contatto(L, s * 3.2, s * 3, [x + 0.05, 0, z + 0.05], 0.3);
    }
    const fiori = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), vernice('#ffffff', 0.8), 72), fr = rng(21), o = new THREE.Object3D();
    fiori.receiveShadow = true; L.add(fiori);
    [[-4.1, 3.4], [-1.0, 3.6], [-0.4, 2.0], [2.6, 1.7], [2.8, 3.7], [5.1, 3.6], [-1.7, 0.4], [0.9, -2.9], [4.2, -1.6], [-5.8, -0.1], [-3.9, 1.0], [0.1, 1.2]].forEach(([x, z], c) => {
      for (let i = 0; i < 6; i++) { const a = fr.range(0, 6.3), d = fr.range(0.05, 0.38), s = fr.range(0.035, 0.055); o.position.set(x + Math.cos(a) * d, s * 0.7, z + Math.sin(a) * d); o.scale.set(s, s * 0.7, s); o.updateMatrix(); fiori.setMatrixAt(c * 6 + i, o.matrix); fiori.setColorAt(c * 6 + i, new THREE.Color(fr.pick(['#fff7ea', '#fff7ea', PAL.senape, '#f7c9c0']))); }
    });
    const panca = new THREE.Group(); panca.position.set(-3.1, 0, 3.2); panca.rotation.y = 0.15; L.add(panca);
    scatola(panca, 0.85, 0.06, 0.28, PAL.cartone, [0, 0.24, 0], 0.025); scatola(panca, 0.85, 0.2, 0.06, PAL.cartone, [0, 0.42, 0.13], 0.025); for (const x of [-0.32, 0.32]) scatola(panca, 0.07, 0.24, 0.26, PAL.ardesia, [x, 0.12, 0], 0.02);
    O.passante = piolo(L, PAL.foglie[1], PAL.tronco); O.passante.position.set(-3.0, 0.2, 3.05); O.passante.rotation.y = 0.2;   // seduto sulla panchina
  }

  /* ---------------------------------------------------------------
     POST-PRODUZIONE: tilt-shift (una fascia nitida, i bordi sfocati), colore, vignettatura
     --------------------------------------------------------------- */
  function creaPost() {
    post = new THREE.ShaderMaterial({
      uniforms: { tCol: { value: null }, res: { value: new THREE.Vector2(1, 1) }, fuoco: { value: 0.5 }, fascia: { value: 0.17 }, sfoc: { value: 5.5 }, vign: { value: 0.2 }, sat: { value: 1.08 }, con: { value: 1.03 }, esposizione: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tCol; uniform vec2 res; uniform float fuoco, fascia, sfoc, vign, sat, con, esposizione; varying vec2 vUv;
        const vec2 DISCO[12] = vec2[12](vec2(-0.326,-0.406), vec2(-0.840,-0.074), vec2(-0.696,0.457), vec2(-0.203,0.621), vec2(0.962,-0.195), vec2(0.473,-0.480),
                                        vec2(0.519,0.767), vec2(0.185,-0.893), vec2(0.507,0.064), vec2(0.896,0.412), vec2(-0.322,-0.933), vec2(-0.792,-0.598));
        void main(){
          // quanto è lontano dalla fascia a fuoco: nitido dentro, sempre più sfocato verso il bordo vicino e quello lontano
          float d = abs(vUv.y - fuoco), r = smoothstep(fascia, fascia + 0.32, d) * sfoc;
          vec3 c = texture2D(tCol, vUv).rgb;
          if (r > 0.35) {
            vec3 acc = c; float w = 1.0; float ang = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
            mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
            for (int i = 0; i < 12; i++) { acc += texture2D(tCol, vUv + rot * DISCO[i] * r / res).rgb; w += 1.0; }
            c = acc / w;
          }
          c *= esposizione;
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = max(mix(vec3(l), c, sat), 0.0);
          c = max((c - 0.18) * con + 0.18, 0.0);
          vec2 q = vUv - 0.5; c *= 1.0 - vign * smoothstep(0.35, 0.85, length(q * vec2(1.0, 1.15)) * 1.2);
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      depthTest: false, depthWrite: false,
    });
    const s = new THREE.Scene(), cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    s.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
    quad = { s, cam };
  }
  function creaTarget(w, h) {
    if (rt) rt.dispose();
    rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true });
    post.uniforms.tCol.value = rt.texture; post.uniforms.res.value.set(w, h);
  }

  /* ---------------------------------------------------------------
     DIMENSIONI E QUALITÀ (si abbassa da sola se gli fps scendono)
     --------------------------------------------------------------- */
  let W = 1, H = 1, pr = 1;
  const QUALITA = { alta: { pr: 1.5, ombre: 2048, post: true }, media: { pr: 1, ombre: 1024, post: true }, bassa: { pr: 0.75, ombre: 1024, post: false } };
  function ridimensiona() {
    const r = contenitore.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
    const q = QUALITA[stato.qualita]; pr = Math.min(window.devicePixelRatio || 1, q.pr);
    R.setPixelRatio(pr); R.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    if (q.post) creaTarget(Math.round(W * pr), Math.round(H * pr));
  }
  function impostaQualita(q) {
    if (stato.qualita === q) return;
    stato.qualita = q;
    const Q = QUALITA[q];
    if (O.sole.shadow.mapSize.x !== Q.ombre) { O.sole.shadow.mapSize.setScalar(Q.ombre); if (O.sole.shadow.map) { O.sole.shadow.map.dispose(); O.sole.shadow.map = null; } }
    ridimensiona();
  }
  const fps = { campioni: [], valore: 60, lento: 0 };
  function misuraFps(dt) {
    if (dt <= 0 || dt > 0.5) return;
    fps.campioni.push(dt); if (fps.campioni.length > 60) fps.campioni.shift();
    fps.valore = fps.campioni.length / fps.campioni.reduce((a, b) => a + b, 0);
    // se resta sotto i 50 fps per un paio di secondi, scende di un gradino
    if (fps.campioni.length >= 60 && fps.valore < 50) { fps.lento += dt; if (fps.lento > 2) { fps.lento = 0; fps.campioni = []; impostaQualita(stato.qualita === 'alta' ? 'media' : 'bassa'); } }
    else fps.lento = Math.max(0, fps.lento - dt);
  }

  /* ---------------------------------------------------------------
     AGGIORNAMENTO DI OGNI FOTOGRAMMA
     --------------------------------------------------------------- */
  const col = (hex) => new THREE.Color(hex);
  const C = { soleCaldo: col('#ffb978'), soleMezzodi: col('#fff1dc'), soleLuna: col('#9fb0ff'), cielo: col('#bcd3ff'), cieloSera: col('#a9b8f5'), cieloNotte: col('#6a78a0'), cieloGrigio: col('#c8d0d8'),
    sfondo: col(PAL.sfondo), sera: col(PAL.sera), notte: col(PAL.notte), pioggia: col(PAL.pioggia), nuvole: col(PAL.nuvole), tmp: col('#ffffff'), tmp2: col('#ffffff') };
  const furgoneStato = { s: 0, sPrec: 0, v: 0, vPrec: 0, beccheggio: 0, ritorno: -1, ultimoAttivo: false, visibile: true };
  function aggiorna(t, dt) {
    // --- meteo: le quantità si avvicinano piano al valore richiesto (niente scatti)
    const obPioggia = stato.meteo === 'pioggia' ? 1 : 0, obNuvole = stato.meteo === 'sole' ? 0 : 1;
    stato.meteoK.pioggia += (obPioggia - stato.meteoK.pioggia) * Math.min(1, dt * 1.5);
    stato.meteoK.nuvole += (obNuvole - stato.meteoK.nuvole) * Math.min(1, dt * 1.5);
    const kp = stato.meteoK.pioggia, kn = stato.meteoK.nuvole;

    // --- ora: il sole sale e scende davanti a sinistra, si scalda verso sera; poi la notte
    const h = stato.ora, p = clamp((h - 8) / 12), notte = h <= 20 ? 0 : h < 31 ? liscio(20, 21, h) : 1 - liscio(31, 32, h);
    const alto = Math.sin(Math.PI * p);
    O.sole.position.set(-11 + 5 * p, 6 + 9 * alto, 10 - 3 * p);
    C.tmp.copy(C.soleCaldo).lerp(C.soleMezzodi, Math.pow(alto, 0.7));
    O.sole.color.copy(C.tmp).lerp(C.soleLuna, notte);
    O.sole.intensity = lerp(lerp(3.2, 1.1, kn), 0.25, notte) * (0.75 + 0.25 * alto);
    O.cielo.color.copy(C.cielo).lerp(C.cieloSera, liscio(0.7, 1, p)).lerp(C.cieloGrigio, kn * 0.6).lerp(C.cieloNotte, notte);
    O.cielo.intensity = lerp(lerp(0.9, 1.35, kn), 0.45, notte);
    O.lunetta.intensity = 0.6 * notte;
    O.sole.shadow.radius = lerp(3, 9, kn);                          // col cielo coperto le ombre si allargano
    C.tmp2.copy(C.sfondo).lerp(C.sera, liscio(0.75, 1, p)).lerp(C.nuvole, kn * (1 - kp)).lerp(C.pioggia, kp).lerp(C.notte, notte);
    scena.background.copy(C.tmp2); O.carta.material.color.copy(C.tmp2);
    scena.environmentIntensity = lerp(0.4, 0.15, notte);
    post.uniforms.esposizione.value = lerp(1, 0.92, kp);
    post.uniforms.sat.value = lerp(1.08, 0.9, kp);

    // --- le lampadine prendono il sopravvento la sera
    const luci = liscio(19.2, 20.4, h) * (h < 31.5 ? 1 : 1 - liscio(31.5, 32, h));
    O.bulbo.emissiveIntensity = 5 * luci; O.luceLampione.intensity = 4 * luci;
    const negozioChiuso = luci > 0.5;
    O.vanoPorta.emissiveIntensity = negozioChiuso ? 1.6 * luci : 0.4;
    O.luceNegozio.intensity = 1.4 * luci;
    O.finestreGel.forEach((m) => { m.emissiveIntensity = 3 * luci; });
    O.finestreFornitore.forEach((m, i) => { m.emissiveIntensity = (0.4 + 2.4 * luci) * (i ? 1 : 0.8); });
    O.vetriFornitore.emissiveIntensity = 0.3 + 1.4 * luci;
    O.finestraTorre.emissiveIntensity = 2.5 * luci;
    O.matVetrina.emissiveIntensity = 0.55 + 0.9 * luci;
    O.fari = O.furgone.fari; O.fari.emissiveIntensity = 2.6 * Math.max(luci, kp * 0.6, furgoneStato.v > 0.05 ? 0.4 : 0);
    // la porta scorre: aperta di giorno, chiusa di notte
    const apertura = 1 - liscio(20, 20.6, h) + liscio(31.4, 32, h);
    O.porta.position.x = 0.75 - 0.5 * clamp(apertura);

    // --- l'oscillazione lenta della piastrella e la "respirazione" della camera (niente giro completo)
    const th = (-6 + 4 * Math.sin(t * 0.07)) * Math.PI / 180;
    O.mondo.rotation.y = th; O.ombraTile.rotation.z = th;
    const az = (-4 + 2 * Math.sin(t * 0.05)) * Math.PI / 180, el = (27 + 1.2 * Math.sin(t * 0.09)) * Math.PI / 180, dist = 25.5 + 0.4 * Math.sin(t * 0.11);
    const aim = [0.35, 0.35, 0.1];
    // se la scena è stretta e alta, la camera si allontana un po' per tenere tutta la piastrella
    const adatta = Math.max(1, 1.78 / camera.aspect);
    camera.position.set(aim[0] + dist * adatta * Math.sin(az) * Math.cos(el), aim[1] + dist * adatta * Math.sin(el), aim[2] + dist * adatta * Math.cos(az) * Math.cos(el));
    camera.lookAt(aim[0], aim[1], aim[2]);

    // --- il furgone
    aggiornaFurgone(t, dt, luci);

    // --- sbuffi dal comignolo del fornitore (non si ferma mai) e scia del furgone
    for (let i = 0; i < 6; i++) { const eta = ((t + 10) / 2.4 + i / 6) % 1; O.fumo.set(i, O.comignolo, eta, { size: 0.24, rise: 1.4, drift: 0.6, driftZ: -0.12 + 0.1 * hash(i, Math.floor((t + 10) / 2.4 + i / 6)) }); }
    for (let i = 0; i < 12; i++) {
      const sb = O.scia[i];
      if (!sb) { O.fumo.set(6 + i, [0, -5, 0], 0, { size: 0, rise: 0 }); continue; }
      O.fumo.set(6 + i, sb.at, (t - sb.t0) / 0.8, { size: 0.12, rise: 0.4, drift: 0 });
    }
    O.fumo.m.instanceMatrix.needsUpdate = true;

    // --- il cono sul tetto ruota piano; il gelataio dondola
    O.conone.rotation.y = t * 0.6;
    O.gelataio.visible = apertura > 0.5;
    O.gelataio.userData.corpo.rotation.z = Math.sin(t * 2.2) * 0.04;
    O.magazziniere.userData.corpo.rotation.x = Math.max(0, Math.sin(t * 1.3)) * 0.12;

    // --- cartelli: guardano l'obiettivo e si girano al colore accento quando la loro tappa è fatta
    const ore = stato.camion.ore, attivo = stato.camion.attivo;
    const fatti = [attivo, attivo && ore >= 1.5 && ore < 24, stato.venduto];
    O.cartelli.forEach((s, i) => {
      if (fatti[i] !== s.fatto) { s.fatto = fatti[i]; s.quando = tGioco; }
      const wp = s.g.getWorldPosition(V1), f = tGioco - s.quando;
      s.g.rotation.y = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z) - th;
      const k = molla(f, 2.0, 0.5);
      s.giro.rotation.x = -0.3 + Math.PI * (s.fatto ? k : 1 - k);
      s.giro.position.y = CARTELLI[i].h + (f > 0 && f < 1.5 ? Math.exp(-f * 7) * Math.sin(f * 14) * 0.16 : 0);
    });
    // il cartellino "GELATO FINITO!" si gira
    const ff = tGioco - (O.finito.userData.quando ?? -99), kf = molla(ff, 1.8, 0.45);
    O.finitoCarta.rotation.y = Math.PI * (stato.finito ? kf : 1 - kf);
    O.finito.rotation.z = (ff > 0 && ff < 2 ? Math.exp(-ff * 3) * Math.sin(ff * 9) * 0.25 : 0) + Math.sin(t * 1.7) * 0.02;

    // --- la pila di casse: ogni cassa compare o sparisce con un piccolo balzo
    const nCasse = clamp(Math.ceil(stato.stock / (stato.stockMax / 10) - 0.01), 0, 10);
    O.casse.forEach((c, i) => {
      const vuole = i < nCasse;
      if (vuole !== c.userData.visibile) { c.userData.visibile = vuole; c.userData.da = tGioco; }
      const u = clamp((tGioco - c.userData.da) / 0.35), s = vuole ? easeOutBack(u) : 1 - easeInOut(u);
      c.scale.setScalar(Math.max(1e-3, s)); c.visible = s > 0.01; c.position.y = c.userData.base + (vuole ? (1 - u) * 0.4 : 0);
    });

    // --- clienti ed eventi
    aggiornaClienti(t);

    // --- pioggia: gocce che cadono, pozzanghere che si allargano lucide
    O.gocce.visible = kp > 0.02;
    if (O.gocce.visible) {
      const o = O3; O.gocce.material.opacity = 0.55 * kp;
      O.goccePos.forEach(([x, f, z, v], i) => { const y = 5.5 - ((t * 4.2 * v + f * 5.5) % 5.5); o.position.set(x + y * 0.06, y, z); o.rotation.set(0, 0, 0.06); o.scale.setScalar(1); o.updateMatrix(); O.gocce.setMatrixAt(i, o.matrix); });
      O.gocce.instanceMatrix.needsUpdate = true;
    }
    stato.bagnato = clamp((stato.bagnato || 0) + (kp > 0.5 ? dt * 0.35 : -dt * 0.15));
    O.pozze.forEach((m, i) => { const s = Math.max(0.001, liscio(0.05 + i * 0.08, 0.6 + i * 0.06, stato.bagnato)); m.scale.set(s, 1, s); m.visible = s > 0.01; });
    O.terra.userData.matErba.roughness = lerp(0.95, 0.75, kp);

    // --- nuvole: compaiono col cielo coperto e passano piano
    O.nuvole.forEach((g, i) => { const s = Math.max(0.001, kn * g.userData.s); g.scale.setScalar(s); g.visible = s > 0.02; g.position.x = g.userData.x + Math.sin(t * 0.05 + i) * 0.8;
      g.children.forEach((m) => { m.material = vernice(kp > 0.5 ? '#c9ced6' : '#ffffff', 0.95); }); });

    // --- la fascia a fuoco segue la gelateria (o il furgone quando viaggia)
    const soggetto = V2.set(GEL.x - 0.4, 0.6, GEL.z + 0.6);
    if (attivo && ore < 20) { const fp = O.furgone.g.position; soggetto.lerp(V3.set(fp.x, 0.5, fp.z), 0.55); }
    O.mondo.localToWorld(soggetto); soggetto.project(camera);
    post.uniforms.fuoco.value += ((soggetto.y * 0.5 + 0.5) - post.uniforms.fuoco.value) * Math.min(1, dt * 2);
  }
  const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3(), O3 = new THREE.Object3D();

  // il furgone: carica al fornitore, viaggia per la strada, si ferma alla gelateria; poi riparte e torna a casa
  function aggiornaFurgone(t, dt, luci) {
    const F = O.furgone, cs = stato.camion, fs = furgoneStato, Lr = O.strada.len;
    // fine consegna: era attivo e ora non più → riparte dalla gelateria e sparisce dal bordo
    if (fs.ultimoAttivo && !cs.attivo) fs.ritorno = tGioco;
    if (cs.attivo) fs.ritorno = -1;
    fs.ultimoAttivo = cs.attivo;
    let s, portellone = 0, visibile = true;
    if (cs.attivo) {
      const ore = cs.ore;
      portellone = 1 - seg(ore, 1.0, 1.6);                         // alle 0–1 h carica, poi chiude
      s = O.s0 + (O.s1 - O.s0) * trap(seg(ore, 2, 20), 0.22, 0.3);
      if (ore >= 22) portellone = seg(ore, 22, 23);                  // arrivato: apre per scaricare
    } else if (fs.ritorno >= 0) {
      const u = (tGioco - fs.ritorno) / 1.6;
      s = O.s1 + (Lr - O.s1 + 0.6) * Math.pow(clamp(u), 2);
      if (u >= 1) visibile = false;
      if (u >= 1.25) { fs.ritorno = -1; }
    } else s = O.s0;                                               // parcheggiato davanti al fornitore
    // velocità e accelerazione dal movimento (per beccheggio e rollio: il furgone "pesa")
    fs.v = dt > 0 ? (s - fs.s) / dt : 0; const acc = dt > 0 ? (fs.v - fs.vPrec) / dt : 0; fs.vPrec = fs.v;
    if (Math.abs(s - fs.s) > 0.02 && fs.v > 0.05) {
      const dove = Math.min(0.999, s / Lr); if (!fs.ultimaScia || tGioco - fs.ultimaScia > 0.12) {
        fs.ultimaScia = tGioco; const p = O.strada.getPointAt(dove), tg = O.strada.getTangentAt(dove);
        O.scia.push({ at: [p.x - tg.x * 0.98, 0.25, p.z - tg.z * 0.98], t0: t }); if (O.scia.length > 12) O.scia.shift();
      }
    }
    fs.s = s;
    const u = clamp(s / Lr, 0, 0.9999), p = O.strada.getPointAt(Math.min(u, 0.9999)), tg = O.strada.getTangentAt(Math.min(u, 0.9999));
    const extra = Math.max(0, s - Lr); p.addScaledVector(tg, extra);
    F.g.position.set(p.x, 0.045, p.z); F.g.rotation.y = Math.atan2(-tg.z, tg.x);
    fs.beccheggio += (clamp(acc * 0.004, -0.09, 0.09) - fs.beccheggio) * Math.min(1, dt * 8);
    const curva = O.strada.getTangentAt(Math.min(0.9999, u + 0.01)), piega = Math.atan2(-curva.z, curva.x) - F.g.rotation.y;
    F.corpo.rotation.set(clamp(piega * Math.min(1, Math.abs(fs.v)) * 0.6, -0.1, 0.1), 0, fs.beccheggio);
    F.corpo.position.y = Math.abs(Math.sin(s * 5.3)) * 0.008 * clamp(Math.abs(fs.v));
    F.ruote.forEach((w) => { w.rotation.z = -s / 0.2; });
    F.portellone.rotation.z = -1.78 * portellone;
    F.carico.visible = cs.attivo && cs.ore < 23.5;
    F.g.visible = visibile;
    // la saracinesca del fornitore si alza mentre carica
    const aperta = cs.attivo ? 1 - seg(cs.ore, 1.6, 2.6) : 0;
    O.saracinesca.scale.y = Math.max(0.03, 1 - aperta * 0.96); O.lamelle.repeat.y = 7 * O.saracinesca.scale.y; O.lamelle.offset.y = -O.lamelle.repeat.y;
  }

  // i clienti: arrivano saltellando al bancone; se serviti ripartono con un cono, se no se ne vanno a testa bassa
  function aggiornaClienti(t) {
    for (let i = eventi.length - 1; i >= 0; i--) {
      const e = eventi[i], u = (t - e.t0) / e.dur, p = e.piolo, corpo = p.userData.corpo;
      if (u >= 1) { p.visible = false; e.piolo.userData.libero = true; eventi.splice(i, 1); continue; }
      p.visible = true;
      const da = [CLIENTI.da[0], CLIENTI.da[1] + e.dz], banco = [CLIENTI.banco[0] + e.dx, CLIENTI.banco[1] + e.dz], via = e.servito ? [CLIENTI.via[0], CLIENTI.via[1] + e.dz] : da;
      let pos, testa = 0, verso = 0, saltA = 0.14;
      if (u < 0.45) {                                               // arriva saltellando
        const k = u / 0.45, nS = 4, f = (k * nS) % 1, q = Math.floor(k * nS);
        const a = [lerp(da[0], banco[0], q / nS), lerp(da[1], banco[1], q / nS)], b = [lerp(da[0], banco[0], (q + 1) / nS), lerp(da[1], banco[1], (q + 1) / nS)];
        pos = saltello(f, a, b, saltA); verso = 0;
      } else if (u < 0.6) {                                         // al bancone
        pos = [banco[0], 0, banco[1]]; verso = -Math.PI / 2 * liscio(0.45, 0.5, u);
        if (!e.servito) testa = liscio(0.52, 0.6, u);
      } else {                                                      // riparte
        const k = (u - 0.6) / 0.4;
        if (e.servito) { const nS = 5, f = (k * nS) % 1, q = Math.floor(k * nS); const a = [lerp(banco[0], via[0], q / nS), lerp(banco[1], via[1], q / nS)], b = [lerp(banco[0], via[0], (q + 1) / nS), lerp(banco[1], via[1], (q + 1) / nS)]; pos = saltello(f, a, b, 0.2); verso = 0; }
        else { pos = [lerp(banco[0], via[0], easeInOut(k)), 0, lerp(banco[1], via[1], easeInOut(k))]; verso = Math.PI; testa = 1; }
      }
      p.position.set(pos[0], 0.02 + pos[1], pos[2]);
      p.rotation.y = verso;
      corpo.rotation.x = testa * 0.45;                              // a testa bassa
      const comparsa = Math.min(liscio(0, 0.08, u), 1 - liscio(0.9, 1, u));
      p.scale.setScalar(Math.max(1e-3, comparsa));
      p.userData.cono.visible = e.servito && u > 0.55;
    }
  }

  /* ---------------------------------------------------------------
     CICLO
     --------------------------------------------------------------- */
  function ciclo() {
    requestAnimationFrame(ciclo);
    const t = tReale(), dt = ultimoT ? Math.min(0.1, t - ultimoT) : 0.016; ultimoT = t;
    tGioco += dt * stato.speed;
    misuraFps(dt);
    aggiorna(t, dt);
    if (QUALITA[stato.qualita].post) {
      R.setRenderTarget(rt); R.render(scena, camera);
      R.setRenderTarget(null); R.render(quad.s, quad.cam);
    } else { R.setRenderTarget(null); R.render(scena, camera); }
  }

  /* ---------------------------------------------------------------
     AGGANCI PUBBLICI
     --------------------------------------------------------------- */
  return {
    async monta(el) {
      if (avviato) return;
      contenitore = el;
      try { await document.fonts.load(FONT); } catch (e) { /* senza font si usa il ripiego */ }
      tela = document.createElement('canvas'); tela.className = 'diorama-tela'; tela.setAttribute('aria-hidden', 'true');
      el.prepend(tela);
      R = new THREE.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance' });
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;          // in r187 PCFSoftShadowMap è stato tolto: PCFShadowMap con shadow.radius fa le ombre morbide
      R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
      costruisci(); creaPost();
      ridimensiona(); new ResizeObserver(ridimensiona).observe(el);
      avviato = true; ciclo();
    },
    setMeteo(m) { stato.meteo = m; },
    setOra(h) { stato.ora = h; },
    camion(attivo, kg, ore) { stato.camion.attivo = !!attivo; stato.camion.kg = kg || 0; stato.camion.ore = ore || 0; },
    cliente(servito, durataMs) {
      if (!O.clienti) return;
      const libero = O.clienti.find((p) => p.userData.libero !== false && !eventi.some((e) => e.piolo === p));
      if (!libero) return;
      libero.userData.libero = false;
      const n = eventi.length;
      eventi.push({ piolo: libero, servito, t0: tReale(), dur: Math.max(0.45, durataMs / 1000), dx: ((n % 3) - 1) * 0.28, dz: (n % 2) * 0.18 });
    },
    setConi(n) { if (Math.round(n) !== Math.round(stato.coni)) { stato.coni = n; disegnaVetrina(); } },
    setFinito(v) { if (!!v !== stato.finito) { stato.finito = !!v; if (O.finito) O.finito.userData.quando = tGioco; disegnaVetrina(); } },
    setVenduto(v) { stato.venduto = !!v; },
    setStock(kg, max) { stato.stock = kg; if (max) stato.stockMax = max; },
    nuovoGiorno() { stato.venduto = false; if (stato.finito) this.setFinito(false); },
    setSpeed(s) { stato.speed = s; },
    get fps() { return fps.valore; }, get qualita() { return stato.qualita; },
    forzaQualita(q) { impostaQualita(q); fps.campioni = []; },
    // dove si trova la gelateria sullo schermo (in %), per mettere i cartellini dei guadagni
    posizioneSchermo(cosa = 'gelateria') {
      if (!O.mondo) return [50, 50];
      const v = cosa === 'casse' ? V1.set(CASSE.x, 1.2, CASSE.z) : cosa === 'fornitore' ? V1.set(FORN.x, 2, FORN.z) : V1.set(GEL.x - 0.3, 2.2, GEL.z);
      O.mondo.localToWorld(v); v.project(camera);
      return [(v.x * 0.5 + 0.5) * 100, (0.5 - v.y * 0.5) * 100];
    },
  };
})();
