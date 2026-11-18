/* =====================================================================
   MOTORE ISOMETRICO
   x verso destra-basso, y verso sinistra-basso, z verso l'alto.
   Chi guarda sta "davanti" (verso +x+y): si vedono le facce +x, +y e quelle in alto.
   ===================================================================== */
const LW = 1280, LH = 820;
const S = 40, A = S*Math.cos(Math.PI/6), B = S*.5;
const OX = 640, OY = 420;
const DX = 20, DY = 12;                       // plastico 20 x 12
const Z2 = 1.4, Z3 = 2.8;                      // altezza del 2° e del 3° livello
const iso = (x, y, z=0) => [OX + (x - y - 4)*A, OY + (x + y - 16)*B - z*S];

const tela = document.getElementById('tela');
const DPR = Math.min(2, window.devicePixelRatio || 1);
tela.width = LW*DPR; tela.height = LH*DPR;
const g = tela.getContext('2d'); g.scale(DPR, DPR);

const clamp = (x,a=0,b=1) => Math.max(a, Math.min(b, x));
const lerp = (a,b,x) => a + (b-a)*x;
const ease = x => { x = clamp(x); return x*x*(3-2*x); };
const easeOutQ = x => 1 - Math.pow(1 - clamp(x), 2), easeInQ = x => Math.pow(clamp(x), 2);
const frac = x => x - Math.floor(x);
const seg = (t,a,b) => clamp((t-a)/(b-a));
const hash = i => { const x = Math.sin(i*127.1 + 311.7)*43758.5453; return x - Math.floor(x); };
function rgb(hex){ const n = parseInt(hex.slice(1), 16); return [n>>16, (n>>8)&255, n&255]; }
function tono(hex, k){ const f = c => Math.round(k >= 0 ? c + (255-c)*k : c*(1+k)); return `rgb(${rgb(hex).map(f).join(',')})`; }
function mix(a, b, k){ const A1 = rgb(a), B1 = rgb(b); return '#' + A1.map((v,i) => Math.round(lerp(v, B1[i], clamp(k))).toString(16).padStart(2,'0')).join(''); }
function scala(stops, k){ k = clamp(k); for(let i=1;i<stops.length;i++) if(k <= stops[i][0]) return mix(stops[i-1][1], stops[i][1], (k - stops[i-1][0])/(stops[i][0] - stops[i-1][0])); return stops[stops.length-1][1]; }

function poli(pts, fill, stroke, lw=1){
  g.beginPath(); pts.forEach(([x,y],i) => i ? g.lineTo(x,y) : g.moveTo(x,y)); g.closePath();
  if(fill){ g.fillStyle = fill; g.fill(); }
  if(stroke){ g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
const P = (...pts) => pts.map(p => iso(...p));
function linea(a, b, col, lw=1){ const [x0,y0] = iso(...a), [x1,y1] = iso(...b); g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(x0,y0); g.lineTo(x1,y1); g.stroke(); }
// parallelepipedo: sopra chiaro, faccia +y (sinistra) media, faccia +x (destra) scura
function scatola(x, y, z, w, d, h, col, o={}){
  const top = o.top || tono(col, .2), sx = o.left || col, dx = o.right || tono(col, -.15);
  poli(P([x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]), sx);
  poli(P([x+w,y,z],[x+w,y+d,z],[x+w,y+d,z+h],[x+w,y,z+h]), dx);
  if(!o.noTop) poli(P([x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]), top);
}
const piano = (x, y, z, w, d, col) => poli(P([x,y,z],[x+w,y,z],[x+w,y+d,z],[x,y+d,z]), col);
const fy = (y, x0, x1, z0, z1, col) => poli(P([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]), col);
const fx = (x, y0, y1, z0, z1, col) => poli(P([x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]), col);
function arcoY(y, cx, z0, w, h, col){
  const pts = [[cx - w/2, y, z0], [cx + w/2, y, z0], [cx + w/2, y, z0 + h - w/2]];
  for(let i=1; i<12; i++){ const a = i/12*Math.PI; pts.push([cx + Math.cos(a)*w/2, y, z0 + h - w/2 + Math.sin(a)*w/2]); }
  pts.push([cx - w/2, y, z0 + h - w/2]); poli(P(...pts), col);
}
function cerchioY(y, cx, cz, r, col){ const pts = []; for(let i=0;i<24;i++){ const a = i/24*Math.PI*2; pts.push([cx + Math.cos(a)*r, y, cz + Math.sin(a)*r]); } poli(P(...pts), col); }
const RX = r => r*Math.SQRT2*A, RY = r => r*Math.SQRT2*B;
function ellisse(x, y, z, r, col, sq=1){ const [sx, sy] = iso(x, y, z); g.fillStyle = col; g.beginPath(); g.ellipse(sx, sy, RX(r), RY(r)*sq, 0, 0, Math.PI*2); g.fill(); }
function cilindro(cx, cy, z, r, h, col, top){
  const [bx, by] = iso(cx, cy, z), [tx, ty] = iso(cx, cy, z + h), rx = RX(r), ry = RY(r);
  const gr = g.createLinearGradient(bx - rx, 0, bx + rx, 0); gr.addColorStop(0, tono(col, .12)); gr.addColorStop(.45, col); gr.addColorStop(1, tono(col, -.22));
  g.fillStyle = gr; g.beginPath(); g.moveTo(tx - rx, ty); g.lineTo(bx - rx, by); g.ellipse(bx, by, rx, ry, 0, Math.PI, 0, true); g.lineTo(tx + rx, ty); g.closePath(); g.fill();
  g.fillStyle = top || tono(col, .2); g.beginPath(); g.ellipse(tx, ty, rx, ry, 0, 0, Math.PI*2); g.fill();
}
function cupola(cx, cy, z, r, h, col){
  const [x, y] = iso(cx, cy, z), rx = RX(r), ry = RY(r);
  const gr = g.createRadialGradient(x - rx*.4, y - h*S*.7, 2, x, y - h*S*.3, rx*1.3); gr.addColorStop(0, tono(col, .35)); gr.addColorStop(1, tono(col, -.2));
  g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI); g.ellipse(x, y, rx, h*S, 0, Math.PI, 0); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
  for(const k of [-.55, 0, .55]){ g.beginPath(); g.ellipse(x, y, Math.abs(k)*rx || .1, h*S, 0, Math.PI, 0); g.stroke(); }
}
function sfera(sx, sy, r, col, luce=.35){
  const gr = g.createRadialGradient(sx - r*.35, sy - r*.4, r*.1, sx, sy, r);
  gr.addColorStop(0, tono(col, luce)); gr.addColorStop(.7, col); gr.addColorStop(1, tono(col, -.12));
  g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, Math.PI*2); g.fill();
}
let OMBRA_DX = 0;
function ombra(x, y, z, rx, ry, a=.16){ const [sx, sy] = iso(x, y, z); g.fillStyle = `rgba(46,51,80,${a})`; g.beginPath(); g.ellipse(sx + OMBRA_DX*rx*.6, sy, rx, ry, 0, 0, Math.PI*2); g.fill(); }

// tetto a capanna (colmo lungo x): si vedono ENTRAMBE le falde, più il timpano sul lato +x
function tettoCapanna(x, y, z, w, d, rh, col, muro){
  const e = .12;
  poli(P([x-e, y-e, z], [x+w+e, y-e, z], [x+w+e, y+d/2, z+rh], [x-e, y+d/2, z+rh]), tono(col, .12));          // falda dietro
  poli(P([x-e, y+d+e, z], [x+w+e, y+d+e, z], [x+w+e, y+d/2, z+rh], [x-e, y+d/2, z+rh]), col);                  // falda davanti
  for(let k=1; k<5; k++){ const t = k/5; linea([x-e, y+d+e - t*(d/2+e), z + t*rh], [x+w+e, y+d+e - t*(d/2+e), z + t*rh], 'rgba(120,50,30,.3)'); }
  poli(P([x+w, y+d, z], [x+w, y, z], [x+w, y+d/2, z+rh]), tono(muro, -.2));                                   // timpano
  linea([x+w+e, y-e, z], [x+w+e, y+d/2, z+rh], tono(col, -.25), 2); linea([x+w+e, y+d/2, z+rh], [x+w+e, y+d+e, z], tono(col, -.25), 2);
  linea([x-e, y+d/2, z+rh], [x+w+e, y+d/2, z+rh], tono(col, -.2), 2);                                          // colmo
}
// tetto a capanna con il colmo lungo y (facciata a capanna sul lato +y)
function tettoCapannaY(x, y, z, w, d, rh, col, muro){
  const e = .1;
  poli(P([x-e, y-e, z], [x-e, y+d+e, z], [x+w/2, y+d+e, z+rh], [x+w/2, y-e, z+rh]), tono(col, .12));           // falda sinistra
  poli(P([x+w+e, y-e, z], [x+w+e, y+d+e, z], [x+w/2, y+d+e, z+rh], [x+w/2, y-e, z+rh]), tono(col, -.08));      // falda destra
  poli(P([x, y+d, z], [x+w, y+d, z], [x+w/2, y+d, z+rh]), muro);                                               // timpano in facciata
}
// tetto a padiglione (quattro falde)
function tettoPadiglione(x, y, z, w, d, rh, col){
  const r = Math.min(w, d)/2;
  poli(P([x, y, z], [x+w, y, z], [x+w-r, y+d/2, z+rh], [x+r, y+d/2, z+rh]), tono(col, .14));
  poli(P([x, y, z], [x+r, y+d/2, z+rh], [x, y+d, z]), tono(col, .05));
  poli(P([x, y+d, z], [x+w, y+d, z], [x+w-r, y+d/2, z+rh], [x+r, y+d/2, z+rh]), col);
  poli(P([x+w, y, z], [x+w, y+d, z], [x+w-r, y+d/2, z+rh]), tono(col, -.15));
  linea([x+r, y+d/2, z+rh], [x+w-r, y+d/2, z+rh], tono(col, -.25), 2);
}
// disegno "appoggiato" su una parete: trasforma un quadrato 1x1 nella parete (per display, insegne)
function suParete(asse, fisso, a0, zTop, L, H, disegno){
  const o = asse === 'x' ? iso(fisso, a0, zTop) : iso(a0, fisso, zTop);
  const u = asse === 'x' ? iso(fisso, a0 - 1, zTop) : iso(a0 + 1, fisso, zTop);   // sulle facce +x si legge verso y decrescente
  const v = asse === 'x' ? iso(fisso, a0, zTop - 1) : iso(a0, fisso, zTop - 1);
  g.save(); g.transform((u[0]-o[0])*L, (u[1]-o[1])*L, (v[0]-o[0])*H, (v[1]-o[1])*H, o[0], o[1]); disegno(L/H); g.restore();
}
// scatola ruotata di un angolo qualsiasi nel piano (per il camion in curva)
function scatolaRuotata(cx, cy, z, L, W, h, ang, col, o={}){
  const u = [Math.cos(ang), Math.sin(ang)], v = [-Math.sin(ang), Math.cos(ang)];
  const c = (a, b) => [cx + u[0]*a + v[0]*b, cy + u[1]*a + v[1]*b];
  const C = [c(-L/2,-W/2), c(L/2,-W/2), c(L/2,W/2), c(-L/2,W/2)];
  const facce = [[0,1,[-v[0],-v[1]]], [1,2,u], [2,3,v], [3,0,[-u[0],-u[1]]]];
  for(const [i, j, n] of facce){
    if(n[0] + n[1] <= .001) continue;
    poli(P([...C[i], z], [...C[j], z], [...C[j], z+h], [...C[i], z+h]), tono(col, -.17*Math.max(0, n[0]) + .02*Math.max(0, n[1])));
  }
  poli(P(...C.map(p => [...p, z+h])), o.top || tono(col, .2));
}
