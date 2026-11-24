/* =====================================================================
   KIT DEL DIORAMA: matematica, caso con seme, forme morbide, vernici,
   e la "fusione" dei pezzi fermi (meno chiamate di disegno = più fps).
   Coordinate: si lavora come nella versione isometrica (src/iso):
   x verso destra, y verso chi guarda, z in alto. In three.js diventano
   (x, z, y): la funzione V() fa la conversione.
   ===================================================================== */

/* ---------- matematica ---------- */
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const liscio = (a, b, x) => { const t = seg(x, a, b); return t * t * (3 - 2 * t); };
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
// molla smorzata da 0 a 1 (t in secondi): cartelli che si girano, cose che rimbalzano
const molla = (t, freq = 2.2, damp = 0.45) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq, wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
};
// generatore pseudo-casuale con seme (mulberry32): niente Math.random nella scena
const rng = (seme) => {
  let a = seme >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r();
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
};
const hash = (x, y = 0) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123; return h - Math.floor(h); };
// accelera per `a` del tempo, va costante, frena per `b`
const trap = (u, a, b) => { u = clamp(u); const v = 1 / (1 - a / 2 - b / 2); return u < a ? v * u * u / (2 * a) : u < 1 - b ? v * (u - a / 2) : 1 - v * (1 - u) * (1 - u) / (2 * b); };

/* ---------- colori: pochi, opachi; UN solo accento (rosa), riservato al gelato ---------- */
const PAL = {
  sfondo: '#b4d2de', sera: '#9fb0cf', notte: '#4d556c', pioggia: '#97a7b5', nuvole: '#c6d0d8',
  erba: '#9fc47c', erbaScura: '#8db86c', foglie: ['#5fa574', '#3f866c', '#84ba6b'], tronco: '#8b5b3e',
  terra: ['#5c4135', '#8f6248', '#c9955f', '#7c7f8e'], sasso: ['#a9a9b0', '#d9cdb8', '#8d8f9c'],
  crema: '#f6ebd8', ardesia: '#44718a', senape: '#f0b040', accento: '#ff6fa5', vetro: '#2c4658', scuro: '#272b36',
  strada: '#6e7080', marciapiede: '#dcdde2', cartone: '#cb9c68', pelle: '#f2c8a2', fumo: '#ffffff', acqua: '#7f9fb8', lampada: '#ffc56e',
  pietra: '#d9c4a0', mura: '#c9b48e', lastricato: '#e4d8c2', travertino: '#eee4d0', cupola: '#9aa3b4', coppi: '#c46a47',
  mattoni: '#c98f6e', scuola: '#eeddb2', scuolaPietra: '#cdccc4', persiana: '#6e8b5b', porta: '#8f6248',
  cialda: '#e0a85a', cioccolato: '#7a4a35', menta: '#bfe3cf', pistacchio: '#b8d98a', bronzo: '#6e5236',
};
const FONT = '600 160px "Fredoka"';
const fontPx = (px) => FONT.replace('160px', px + 'px');
const fontGrassetto = (px) => '700 ' + px + 'px "Fredoka"';            // per le scritte che si devono leggere da lontano

/* ---------- conversione di coordinate ---------- */
const V = (x, y, z) => new THREE.Vector3(x, z, y);

/* ---------- forme ---------- */
// un rettangolo con gli angoli arrotondati, come anello di punti con le normali verso l'esterno (nel piano x-z di three)
function anello(w, d, r, n = 10, cx = 0, cz = 0) {
  const pts = [], hx = w / 2 - r, hz = d / 2 - r; let u = 0, px = 0, pz = 0;
  for (let k = 0; k < 4; k++) for (let i = 0; i <= n; i++) {
    const a = (k + i / n) * Math.PI / 2, x = cx + (k === 0 || k === 3 ? hx : -hx) + r * Math.cos(a), z = cz + (k < 2 ? hz : -hz) + r * Math.sin(a);
    if (pts.length) u += Math.hypot(x - px, z - pz);
    px = x; pz = z; pts.push({ x, z, nx: Math.cos(a), nz: Math.sin(a), u });
  }
  pts.push({ ...pts[0], u: u + Math.hypot(pts[0].x - px, pts[0].z - pz) });
  pts.giro = pts[pts.length - 1].u;
  return pts;
}
// un profilo laterale fatto girare lungo l'anello: piastrella, bordi, pozzanghere
function loft(giro, profilo, tappo = true) {
  const Pf = profilo.map(([ins, y, a], j) => { const p0 = profilo[Math.max(0, j - 1)], p1 = profilo[Math.min(profilo.length - 1, j + 1)]; return [ins, y, a == null ? Math.atan2(p0[1] - p1[1], p0[0] - p1[0]) : a]; });
  const M = giro.length, pos = [], nor = [], uv = [], idx = [], y0 = Pf[0][1], y1 = Pf[Pf.length - 1][1];
  for (const [ins, y, a] of Pf) for (const p of giro) { pos.push(p.x - p.nx * ins, y, p.z - p.nz * ins); nor.push(p.nx * Math.sin(a), Math.cos(a), p.nz * Math.sin(a)); uv.push(p.u / giro.giro, (y - y1) / (y0 - y1 || 1)); }
  for (let j = 0; j < Pf.length - 1; j++) for (let i = 0; i < M - 1; i++) { const a = j * M + i, b = a + 1, c = a + M, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(), nLati = idx.length;
  if (tappo) {
    const base = pos.length / 3; pos.push(giro[0].x * 0, y0, 0); nor.push(0, 1, 0); uv.push(0, 0);
    let mx = 0, mz = 0; for (const p of giro) { mx += p.x / M; mz += p.z / M; } pos[base * 3] = mx; pos[base * 3 + 2] = mz; uv[base * 2] = mx; uv[base * 2 + 1] = mz;
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
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, prof - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelOffset: -bev, bevelSegments: 2, curveSegments: 5 });
  g.translate(0, 0, -Math.max(0.001, prof - 2 * bev) / 2);
  return g;
}
// scatola con gli spigoli arrotondati (in cache: la stessa misura si costruisce una volta sola)
const cacheGeo = new Map();
function scatolaGeo(w, h, d, r = 0.05, seg = 2) {
  const key = [w, h, d, r, seg].map((v) => v.toFixed(3)).join('|');
  if (cacheGeo.has(key)) return cacheGeo.get(key);
  r = Math.max(1e-4, Math.min(r, w / 2, h / 2, d / 2));
  const N = 2 * seg + 1, g = new THREE.BoxGeometry(2, 2, 2, N, N, N), p = g.attributes.position, nrm = g.attributes.normal, uv = g.attributes.uv;
  const half = [w / 2 - r, h / 2 - r, d / 2 - r], v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const c = [p.getX(i), p.getY(i), p.getZ(i)], inner = [0, 0, 0], a = [0, 0, 0];
    for (let k = 0; k < 3; k++) { const ix = Math.round((c[k] + 1) * N / 2), lato = ix <= seg ? -1 : 1; a[k] = ix <= seg ? -(1 - ix / seg) : (ix - seg - 1) / seg; inner[k] = lato * half[k]; }
    v.set(Math.tan(a[0] * Math.PI / 4), Math.tan(a[1] * Math.PI / 4), Math.tan(a[2] * Math.PI / 4)).normalize();
    p.setXYZ(i, inner[0] + v.x * r, inner[1] + v.y * r, inner[2] + v.z * r); nrm.setXYZ(i, v.x, v.y, v.z);
  }
  // coordinate uv "del mondo" (1 unità = 1), così le texture ripetute non si stirano
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i)), nz = Math.abs(nrm.getZ(i));
    if (ny >= nx && ny >= nz) uv.setXY(i, p.getX(i), p.getZ(i)); else if (nx >= nz) uv.setXY(i, p.getZ(i), p.getY(i)); else uv.setXY(i, p.getX(i), p.getY(i));
  }
  g.computeBoundingSphere(); cacheGeo.set(key, g);
  return g;
}
// pannello piatto con gli angoli arrotondati; uv da 0 a 1 oppure "del mondo" (mondo = true)
function rettangoloGeo(w, h, r = 0.05, mondo = false) {
  const s = new THREE.Shape(), x = w / 2, y = h / 2; r = Math.min(r, x, y);
  if (r < 0.002) { s.moveTo(-x, -y); s.lineTo(x, -y); s.lineTo(x, y); s.lineTo(-x, y); }
  else { s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
    s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5); }
  const g = new THREE.ShapeGeometry(s, 5), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, mondo ? p.getX(i) : p.getX(i) / w + 0.5, mondo ? p.getY(i) : p.getY(i) / h + 0.5);
  return g;
}
// un arco (rettangolo con il mezzo cerchio sopra): porte, portali, bifore
function arcoGeo(w, h) {
  const s = new THREE.Shape(), r = w / 2, hr = Math.max(0, h - r);
  s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, hr); s.absarc(0, hr, r, 0, Math.PI); s.lineTo(-r, 0);
  const g = new THREE.ShapeGeometry(s, 10), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h);
  return g;
}
// filtraggio anisotropico: tiene nitide le immagini viste di sbieco (insegne, scritte); il massimo lo dice la scheda grafica
let ANISO = 8;
function texCanvas(w, h, disegna, ripeti) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d'); if (disegna) disegna(ctx, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = ANISO;
  if (ripeti) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(ripeti[0], ripeti[1]); }
  t.ridisegna = (fn) => { ctx.clearRect(0, 0, w, h); fn(ctx, w, h); t.needsUpdate = true; };
  return t;
}

/* ---------- vernici: tutto opaco da modellino, un materiale per colore (condiviso) ---------- */
const vernici = new Map();
const vernice = (hex, rough = 0.86) => { const k = hex + rough; if (!vernici.has(k)) vernici.set(k, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 })); return vernici.get(k); };
// qualcosa che si accende: scuro di giorno, lampadina calda quando sale emissiveIntensity
const luminosa = (hex = PAL.vetro, glow = PAL.lampada) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, emissive: glow, emissiveIntensity: 0 });

/* ---------- mettere le cose nel mondo (coordinate della versione isometrica) ---------- */
// mesh con posizione in coordinate three
function metti(padre, geo, mat, p = [0, 0, 0], r, ombra = true) {
  const m = new THREE.Mesh(geo, typeof mat === 'string' ? vernice(mat) : mat);
  m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
  m.castShadow = ombra; m.receiveShadow = true; padre.add(m); return m;
}
// scatola morbida dal suo angolo (x, y, z) con larghezza w (x), profondità d (y), altezza h (z), come scatola() della versione isometrica
function blocco(padre, x, y, z, w, d, h, col, r = 0.06) {
  return metti(padre, scatolaGeo(w, h, d, r), col, [x + w / 2, z + h / 2, y + d / 2]);
}
// pannello dipinto su una faccia: 'y' = faccia che guarda chi osserva (+y), 'x' = fianco destro (+x), '-x' = fianco sinistro
function sulMuro(padre, faccia, x, y, z, w, h, mat, r = 0.03, geo) {
  const m = new THREE.Mesh(geo || rettangoloGeo(w, h, r), typeof mat === 'string' ? vernice(mat) : mat);
  m.castShadow = false; m.receiveShadow = true;
  if (faccia === 'y') m.position.set(x, z, y + 0.006);
  else if (faccia === 'x') { m.position.set(x + 0.006, z, y); m.rotation.y = Math.PI / 2; }
  else if (faccia === '-x') { m.position.set(x - 0.006, z, y); m.rotation.y = -Math.PI / 2; }
  else if (faccia === '-y') { m.position.set(x, z, y - 0.006); m.rotation.y = Math.PI; }
  padre.add(m); return m;
}
// tetto a capanna lungo x (colmo parallelo a x) o lungo y
function capanna(padre, x, y, z, w, d, h, col, lungoX = true, sbalzo = 0.12) {
  const largo = lungoX ? d : w, lungo = lungoX ? w : d, rr = 0.07;
  const g = prisma([[-largo / 2 - sbalzo, 0], [largo / 2 + sbalzo, 0], [0, h]], [rr, rr, rr * 1.4], lungo + 2 * sbalzo, 0.05);
  const m = metti(padre, g, col, [x + w / 2, z, y + d / 2]);
  if (lungoX) m.rotation.y = Math.PI / 2;
  return m;
}
// tetto a padiglione (piramide schiacciata sul rettangolo)
function padiglione(padre, x, y, z, w, d, h, col) {
  const g = new THREE.CylinderGeometry(0.02, Math.SQRT1_2, 1, 4, 1); g.rotateY(Math.PI / 4); g.translate(0, 0.5, 0);
  const m = metti(padre, g, col, [x + w / 2, z, y + d / 2]); m.scale.set(w + 0.25, h, d + 0.25);
  return m;
}
// ombra di contatto: una macchia morbida sotto le cose (il cielo freddo che scurisce i contatti)
let texContatto;
function contatto(padre, x, y, z, w, d, forza = 0.45) {
  if (!texContatto) texContatto = texCanvas(128, 128, (ctx, W) => { const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(20,35,45,1)'); g.addColorStop(0.55, 'rgba(20,35,45,0.45)'); g.addColorStop(1, 'rgba(20,35,45,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W); });
  const key = 'contatto' + forza.toFixed(2);
  if (!vernici.has(key)) vernici.set(key, new THREE.MeshBasicMaterial({ map: texContatto, transparent: true, opacity: forza, depthWrite: false }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), vernici.get(key));
  m.rotation.x = -Math.PI / 2; m.position.set(x, z + 0.012, y); m.renderOrder = 1; padre.add(m); return m;
}

/* ---------- fusione dei pezzi fermi ----------
   Tutto ciò che non si muove viene "cotto" in poche mesh, una per materiale.
   Si salta ogni oggetto (e i suoi figli) con userData.vivo = true. */
function fondi(radice) {
  radice.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(radice.matrixWorld).invert(), gruppi = new Map(), daTogliere = [], M = new THREE.Matrix4(), N = new THREE.Matrix3();
  const visita = (o) => {
    if (o.userData.vivo) return;
    if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry.attributes.normal) {
      const k = o.material.uuid + (o.castShadow ? 'o' : 'n') + (o.renderOrder || 0);
      if (!gruppi.has(k)) gruppi.set(k, { mat: o.material, ombra: o.castShadow, ordine: o.renderOrder, parti: [] });
      gruppi.get(k).parti.push(o); daTogliere.push(o);
    }
    for (const c of o.children) visita(c);
  };
  visita(radice);
  for (const { mat, ombra, ordine, parti } of gruppi.values()) {
    let n = 0; const geos = parti.map((o) => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; n += g.attributes.position.count; return [o, g]; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let at = 0;
    const v = new THREE.Vector3();
    for (const [o, g] of geos) {
      M.multiplyMatrices(inv, o.matrixWorld); N.getNormalMatrix(M);
      const P = g.attributes.position, Nn = g.attributes.normal, U = g.attributes.uv;
      for (let i = 0; i < P.count; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(M); pos.set([v.x, v.y, v.z], (at + i) * 3);
        v.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize(); nor.set([v.x, v.y, v.z], (at + i) * 3);
        if (U) uv.set([U.getX(i), U.getY(i)], (at + i) * 2);
      }
      at += P.count;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.computeBoundingSphere();
    const m = new THREE.Mesh(g, mat); m.castShadow = ombra; m.receiveShadow = true; m.renderOrder = ordine || 0; m.matrixAutoUpdate = false;
    radice.add(m);
  }
  for (const o of daTogliere) o.parent.remove(o);
}
