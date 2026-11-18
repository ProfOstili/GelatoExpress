/* =====================================================================
   LA CITTÀ: Todi su tre livelli
   Livello 1 (z=0): strada a U, giardino, scuola, scalinata, gelateria
   Livello 2 (z=Z2): Tempio della Consolazione, mura medievali con la porta
   Livello 3 (z=Z3): Duomo, Palazzo dei Priori, case
   ===================================================================== */
const COL = {
  erba:'#9BD77E', erbaLato:'#7CC36A', terra:'#C8946A', terraScura:'#A9754F', roccia:'#8E6D5A',
  pietra:'#D9C4A0', mura:'#C9B48E', travertino:'#EFE5D2', lastricato:'#E4D8C2', strada:'#8A93A6', marciapiede:'#E3E7EF',
  coppi:'#C8663E', persiana:'#6E8B5B', persiana2:'#8A5A3C', vetroScuro:'#4F5A78', mattoni:'#C98F6E',
  muro:'#FFF4E2', tetto:'#F28CA8', tenda:'#F7A8BE', banco:'#6FC7B5', porta:'#9A6845', vetro:'#BFE7F7',
  cipresso:'#3F8F5E', albero:'#6CC08A', tronco:'#9A6B4B',
  cono:'#F2B866', conoGriglia:'#D9963F', pallina:'#F7A1BC', ciliegia:'#E2465E', ink:'#3A3355',
  cabina:'#6EB8F0', ruota:'#3A3F55', scuola:'#EEDDB2', scuolaPietra:'#CDCCC4'
};
const COL_CLIENTI = ['#6C8CF5', '#F28C6E', '#9B7BE0', '#5CC4A8', '#F5C04A', '#E86A8F'];
let NOTTE = 0;                 // 0 = giorno, 1 = notte piena
let LUCI = [], LAMPIONI = [];  // finestre accese e lampioni, disegnati dopo il buio

// finestra: di notte si accende (non tutte)
function finestraY(y, x0, x1, z0, z1, id){
  const acc = NOTTE > .25 && hash(id) > .3;
  const pts = P([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]);
  poli(pts, COL.vetroScuro); if(acc) LUCI.push(pts);
}
function finestraX(x, y0, y1, z0, z1, id){
  const acc = NOTTE > .25 && hash(id) > .45;
  const pts = P([x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]);
  poli(pts, '#3E4763'); if(acc) LUCI.push(pts);
}
// conci di pietra su una faccia
function conci(asse, fisso, a0, a1, z0, z1, col, seme){
  const righe = Math.max(1, Math.round((z1 - z0)/.32));
  for(let r=0; r<righe; r++) for(let a=a0 + (r%2)*.35; a < a1 - .5; a += .75){
    const zz = z0 + .05 + r*(z1 - z0)/righe, hh = (z1 - z0)/righe - .08, k = hash(a*13 + r*7 + seme) > .5 ? -.05 : -.11;
    if(asse === 'y') fy(fisso, a, a + .65, zz, zz + hh, tono(col, k)); else fx(fisso, a, a + .65, zz, zz + hh, tono(col, k));
  }
}

/* ---------- terreno e strada a U ---------- */
const CL = { xS:1.2, xD:18.8, yF:10.35, cy:9.15, r:1.2, w:.95 };   // linea di mezzo della strada
function settore(cx, cy, r0, r1, a0, a1, col, z=.004){
  const pts = []; for(let i=0;i<=14;i++){ const a = a0 + (a1-a0)*i/14; pts.push([cx + r1*Math.cos(a), cy + r1*Math.sin(a), z]); }
  for(let i=14;i>=0;i--){ const a = a0 + (a1-a0)*i/14; pts.push([cx + r0*Math.cos(a), cy + r0*Math.sin(a), z]); }
  poli(P(...pts), col);
}
function terreno(){
  const z0 = -1.2;
  poli(P([0,DY,z0],[DX,DY,z0],[DX,DY,0],[0,DY,0]), COL.terra);
  poli(P([DX,0,z0],[DX,DY,z0],[DX,DY,0],[DX,0,0]), COL.terraScura);
  poli(P([0,DY,z0],[DX,DY,z0],[DX,DY,z0+.3],[0,DY,z0+.3]), tono(COL.roccia, .1));
  poli(P([DX,0,z0],[DX,DY,z0],[DX,DY,z0+.3],[DX,0,z0+.3]), COL.roccia);
  for(let i=0; i<14; i++){ const xx = .5 + i*1.4, zz = -.5 - hash(i)*.4; fy(DY, xx, xx+.5, zz, zz+.18, tono(COL.terra, -.1)); }
  poli(P([0,DY,-.15],[DX,DY,-.15],[DX,DY,0],[0,DY,0]), COL.erbaLato);
  poli(P([DX,0,-.15],[DX,DY,-.15],[DX,DY,0],[DX,0,0]), tono(COL.erbaLato, -.12));
  piano(0, 0, 0, DX, DY, COL.erba);
  // strada: gamba sinistra, curva, tratto davanti, curva, gamba destra
  const { xS, xD, yF, cy, r, w } = CL, c = COL.strada;
  piano(xS - w, 0, .004, 2*w, cy, c); piano(xD - w, 0, .004, 2*w, cy, c); piano(2.4, yF - w, .004, 15.2, 2*w, c);
  settore(2.4, cy, r - w, r + w, Math.PI/2, Math.PI, c); settore(17.6, cy, r - w, r + w, 0, Math.PI/2, c);
  for(let y=.3; y<8.8; y+=1.5){ piano(xS - .05, y, .006, .1, .7, '#FFFFFF'); piano(xD - .05, y, .006, .1, .7, '#FFFFFF'); }
  for(let x=3; x<17; x+=1.6) piano(x, yF - .05, .006, .8, .1, '#FFFFFF');
  for(const a of [.62, .88]){ settore(2.4, cy, r - .05, r + .05, Math.PI*(.5 + a*.5) - .12, Math.PI*(.5 + a*.5), '#FFFFFF', .006); settore(17.6, cy, r - .05, r + .05, Math.PI*a*.5 - .12, Math.PI*a*.5, '#FFFFFF', .006); }
  // marciapiede davanti alle case
  scatola(2.2, 8.0, 0, 15.6, 1.2, .1, COL.marciapiede, { left:'#C9CFDB', right:'#B9C0CC' });
  for(let x=2.2; x<17.8; x+=1) linea([x,8.0,.1],[x,9.2,.1],'rgba(46,51,80,.07)');
}

/* ---------- livello 2 e livello 3 (con le mura medievali) ---------- */
function livello2(){
  scatola(2.2, 0, 0, 15.4, 5.4, Z2, COL.pietra, { top:COL.lastricato, left:'#CDB690', right:'#B89F7B' });
  conci('y', 5.4, 2.2, 17.6, 0, Z2, '#CDB690', 1); conci('x', 17.6, 0, 5.4, 0, Z2, '#B89F7B', 2);
  for(let x=3; x<17.6; x+=1) linea([x,0,Z2],[x,5.4,Z2],'rgba(120,100,70,.1)');
  for(let y=1; y<5.4; y+=1) linea([2.2,y,Z2],[17.6,y,Z2],'rgba(120,100,70,.1)');
  for(const [a, b] of [[2.2, 11.2], [12.8, 17.6]]) scatola(a, 5.25, Z2, b - a, .15, .22, '#E6D5B5');   // parapetto
}
function livello3(){
  scatola(7, 0, Z2, 10.6, 2.6, Z3 - Z2, COL.mura, { top:COL.lastricato, left:'#C2AA82', right:'#AD956F' });
  conci('y', 2.6, 7, 17.6, Z2, Z3, '#C2AA82', 3); conci('x', 17.6, 0, 2.6, Z2, Z3, '#AD956F', 4);
  for(let x=8; x<17.6; x+=1) linea([x,0,Z3],[x,2.6,Z3],'rgba(120,100,70,.1)');
  for(let y=.15; y<2.5; y+=.5) scatola(7, y, Z3, .18, .26, .3, COL.mura);                      // merli sul lato sinistro
}
function merliDavanti(){
  for(let x=7.05; x<17.4; x+=.5){ if(x > 10.5 && x < 13.2) continue; scatola(x, 2.42, Z3, .26, .18, .3, COL.mura, { left:'#C2AA82' }); }
  for(let y=.15; y<2.5; y+=.5) scatola(17.42, y, Z3, .18, .26, .3, COL.mura, { right:'#AD956F' });
}
function torreMura(){                     // torre delle mura all'angolo
  scatola(7, 1.9, Z2, .9, .9, Z3 - Z2 + 1.0, COL.mura, { left:'#C2AA82', right:'#AD956F' });
  fy(2.8, 7.35, 7.55, Z3 + .3, Z3 + .7, '#4F4A62');
  for(let i=0; i<3; i++){ scatola(7.02 + i*.33, 2.62, Z3 + 1.0, .2, .18, .22, COL.mura); scatola(7.72, 1.92 + i*.33, Z3 + 1.0, .18, .2, .22, COL.mura); }
}
function portaCitta(){                   // la porta nelle mura (mattoni, arco bugnato in pietra, attico)
  const x = 10.8, y = 2.2, w = 2.4, d = .8, z = Z2, h = Z3 - Z2 + 1.3;
  scatola(x, y, z, w, d, h, COL.mattoni, { left:'#C98F6E', right:'#B07A5C', top:'#D8A586' });
  for(let r=0; r<9; r++) linea([x, y+d, z + .2 + r*.28], [x + w, y+d, z + .2 + r*.28], 'rgba(120,60,40,.25)');
  fy(y+d, x + .55, x + w - .55, z, z + 2.2, '#E5E1D6');                                            // cornice in pietra
  for(let r=0; r<6; r++){ const zz = z + .1 + r*.33; fy(y+d, x + .5, x + .78, zz, zz + .25, '#D8D3C6'); fy(y+d, x + w - .78, x + w - .5, zz, zz + .25, '#D8D3C6'); }
  arcoY(y+d, x + w/2, z + .7, 1.0, 1.4, '#E5E1D6');
  arcoY(y+d, x + w/2, z + .7, .82, 1.3, '#3E3440');
  for(let k=0; k<4; k++) fy(y+d, x + w/2 - .3, x + w/2 + .3, z + .9 + k*.16, z + .95 + k*.16, 'rgba(255,214,140,.45)');   // scale che salgono, dentro la porta
  fy(y+d, x - .05, x + w + .05, z + h - .45, z + h, '#E5E1D6');                                    // attico
  for(let i=0; i<3; i++) fy(y+d, x + .25 + i*.72, x + .75 + i*.72, z + h - .38, z + h - .08, '#D1CCBE');
}
function scalinata(x, w, y0, y1, za, zb, n){
  const dd = (y0 - y1)/n;
  for(let i=n-1; i>=0; i--) scatola(x, y0 - (i+1)*dd, za, w, dd, (i+1)*(zb - za)/n, '#E3D3B3', { top:'#F0E4CC', left:'#D2BF9C', right:'#C0AB86' });
}

/* ---------- edifici ---------- */
// abside poligonale (mezzo ottagono) con mezza cupola, appoggiata al cubo centrale; (dx,dy) = verso l'esterno
function apside(cx, cy, z, r, h, dx, dy, col, cup){
  const px = -dy, py = dx, pts = [];
  for(let k=0; k<=4; k++){ const th = -Math.PI/2 + k*Math.PI/4; pts.push([cx + r*(Math.cos(th)*dx + Math.sin(th)*px), cy + r*(Math.cos(th)*dy + Math.sin(th)*py)]); }
  for(let k=0; k<4; k++){
    const a = pts[k], b = pts[k+1], nx = (a[0]+b[0])/2 - cx, ny = (a[1]+b[1])/2 - cy, L = Math.hypot(nx, ny);
    if(nx + ny <= .01) continue;
    poli(P([...a,z],[...b,z],[...b,z+h],[...a,z+h]), tono(col, -.2*Math.max(0, nx/L) + .03*Math.max(0, ny/L)));
    const [wx, wy] = iso((a[0]+b[0])/2 + nx/L*.01, (a[1]+b[1])/2 + ny/L*.01, z + h*.5);
    g.fillStyle = NOTTE > .3 ? '#FFD98A' : '#5A6582'; g.beginPath(); g.roundRect(wx - 3, wy - 7, 6, 13, 3); g.fill();
    linea([...b, z], [...b, z + h], tono(col, -.28));
  }
  poli(P(...pts.map(q => [...q, z + h]), [cx, cy, z + h]), tono(col, -.05));
  for(let k=0; k<4; k++) linea([...pts[k], z + h], [...pts[k+1], z + h], '#E9DFCB', 3);
  cupola(cx + dx*.02, cy + dy*.02, z + h, r*.92, r*.62, cup);
}
// Tempio della Consolazione: cubo centrale alto, quattro absidi poligonali più basse, attico, tamburo, cupola e lanterna
function tempio(){
  const cx = 4.4, cy = 2.6, z = Z2, m = 1.15, r = .85, col = COL.travertino, cup = '#A3ACBD';
  ombra(cx + .7, cy + .7, z, 140, 58, .1);
  apside(cx - m, cy, z, r, 1.45, -1, 0, col, cup); apside(cx, cy - m, z, r, 1.45, 0, -1, col, cup);
  scatola(cx - m, cy - m, z, 2*m, 2*m, 2.3, col, { right:'#D9CDB6' });
  fy(cy + m, cx - m, cx + m, z + 2.12, z + 2.3, '#F6EEDD'); fx(cx + m, cy - m, cy + m, z + 2.12, z + 2.3, '#E2D6BF');   // cornicione
  for(const k of [-m, m - .14]){ fy(cy + m, cx + k, cx + k + .14, z, z + 2.12, '#F4EBD9'); fx(cx + m, cy + k, cy + k + .14, z, z + 2.12, '#E6DAC4'); } // paraste agli spigoli
  cerchioY(cy + m, cx, z + 1.82, .16, '#5A6582');
  apside(cx + m, cy, z, r, 1.45, 1, 0, col, cup); apside(cx, cy + m, z, r, 1.45, 0, 1, col, cup);
  scatola(cx - .85, cy - .85, z + 2.3, 1.7, 1.7, .3, col, { right:'#DCD0B9' });
  cilindro(cx, cy, z + 2.6, .78, .5, col);
  for(let k=0; k<6; k++){ const a = Math.PI*(.05 + k*.17); const [wx, wy] = iso(cx + Math.cos(a)*.78, cy + Math.sin(a)*.78, z + 2.85);
    g.fillStyle = NOTTE > .3 ? '#FFD98A' : '#5A6582'; g.fillRect(wx - 2, wy - 6, 4, 10); g.fillStyle = '#F6EEDD'; g.fillRect(wx + 5, wy - 9, 2, 16); }
  cupola(cx, cy, z + 3.1, .78, .82, cup);
  cilindro(cx, cy, z + 3.9, .16, .28, col); cupola(cx, cy, z + 4.18, .16, .14, cup);
}
function duomo(){                        // Duomo di Todi: facciata a capanna con rosone
  const x = 8.0, y = .2, w = 2.7, d = 2.0, z = Z3, h = 2.8, col = '#F1E4D0';
  scatola(x, y, z, w, d, h, col, { right:'#DCCCB3' });
  tettoCapannaY(x, y, z + h, w, d, .9, COL.coppi, col);
  linea([x, y+d, z+h], [x+w/2, y+d, z+h+.9], '#D8C7AD', 2); linea([x+w/2, y+d, z+h+.9], [x+w, y+d, z+h], '#D8C7AD', 2);
  for(let k=1;k<3;k++) fy(y+d, x, x+w, z + k*.95, z + k*.95 + .05, '#E2D2B8');
  cerchioY(y+d, x+w/2, z+2.05, .45, '#D9C9AF'); cerchioY(y+d, x+w/2, z+2.05, .34, NOTTE > .3 ? '#FFD98A' : '#6A6F8E'); cerchioY(y+d, x+w/2, z+2.05, .1, '#E8C770');
  cerchioY(y+d, x+.55, z+1.9, .2, '#6A6F8E'); cerchioY(y+d, x+w-.55, z+1.9, .2, '#6A6F8E');
  arcoY(y+d, x+w/2, z, .65, 1.15, '#7E5A42'); arcoY(y+d, x+.55, z, .36, .8, '#7E5A42'); arcoY(y+d, x+w-.55, z, .36, .8, '#7E5A42');
  for(let k=0;k<3;k++) finestraX(x+w, y + .4 + k*.55, y + .6 + k*.55, z + 1.0, z + 1.7, 900 + k);
}
function palazzoPriori(){                // Palazzo dei Priori: bifore, merli guelfi, torre
  const x = 13.3, y = .3, w = 3.9, d = 2.0, z = Z3, h = 2.4, col = '#CDB38D';
  scatola(x, y, z, w, d, h, col, { right:'#B89E79' });
  for(let i=0; i<4; i++){ const cx = x + .55 + i*.95;
    for(const k of [-.1, .1]) finestraY(y+d, cx+k-.07, cx+k+.07, z + 1.25, z + 1.75, 700 + i*2 + (k>0));
    fy(y+d, cx - .22, cx + .22, z + 1.18, z + 1.24, '#E8DCC6'); }
  for(let i=0; i<3; i++) arcoY(y+d, x + .8 + i*1.15, z, .55, .85, '#6B5A4E');
  for(let i=0; i<9; i++) scatola(x + .05 + i*.44, y + d - .2, z + h, .22, .2, .22, col);
  for(let i=0; i<5; i++) scatola(x + w - .2, y + .05 + i*.4, z + h, .2, .22, .22, col);
  const tx = 16.3, ty = .4;
  scatola(tx, ty, z + h, .85, .85, 1.5, col, { right:'#B89E79' });
  finestraY(ty + .85, tx + .28, tx + .57, z + h + .7, z + h + 1.15, 720);
  for(let i=0; i<3; i++){ scatola(tx + .02 + i*.31, ty + .65, z + h + 1.5, .2, .2, .22, col); scatola(tx + .65, ty + .02 + i*.31, z + h + 1.5, .2, .2, .22, col); }
}
function casa(x, y, w, d, piani, col, o={}){
  const h = piani*.95 + .15, z = o.z || 0, id = x*100 + y*10;
  scatola(x, y, z, w, d, h, col);
  if(o.pietra) for(let i=0; i<24; i++){ const xx = x + hash(i + x*7)*(w-.35), zz = z + hash(i*5 + x)*(h-.2); fy(y+d, xx, xx+.32, zz, zz+.14, tono(col, -.07)); }
  const nf = Math.max(1, Math.floor(w/1.0)), pers = o.persiane || COL.persiana;
  for(let f=0; f<piani; f++) for(let j=0; j<nf; j++){
    const cx = x + (j + .5)*w/nf, z0 = z + .25 + f*.95;
    if(f === 0 && j === Math.floor(nf/2) && !o.noPorta){ arcoY(y+d, cx, z, .5, .8, COL.porta); continue; }
    finestraY(y+d, cx - .14, cx + .14, z0 + .1, z0 + .55, id + f*10 + j);
    fy(y+d, cx - .27, cx - .14, z0 + .1, z0 + .55, pers); fy(y+d, cx + .14, cx + .27, z0 + .1, z0 + .55, pers);
    fy(y+d, cx - .18, cx + .18, z0 + .06, z0 + .1, '#F3EADB');
  }
  const nl = Math.max(1, Math.floor(d/1.1));
  for(let f=0; f<piani; f++) for(let j=0; j<nl; j++){ const cy = y + (j + .5)*d/nl, z0 = z + .35 + f*.95; finestraX(x+w, cy - .12, cy + .12, z0, z0 + .4, id + 500 + f*10 + j); }
  tettoCapanna(x, y, z + h, w, d, .65, COL.coppi, col);
  if(o.camino) scatola(x + w*.7, y + d*.3, z + h + .25, .22, .22, .55, '#C9B08C');
}
// la scuola: istituto Ciuffelli-Einaudi (facciata con corpo centrale in pietra, portone, balcone, timpano, bandiera)
function scuola(){
  const y = 5.4, h = 3.3, col = COL.scuola, dx = '#D9C79C';
  const finestre = (x0, x1, yf, id, sbarre) => { const cx = (x0 + x1)/2;
    for(let f=0; f<3; f++){ const z0 = .32 + f*1.0; fy(yf, cx - .19, cx + .19, z0 - .05, z0 + .66, '#F5EEDC'); finestraY(yf, cx - .14, cx + .14, z0, z0 + .6, id + f);
      if(f === 0 && sbarre) for(let k=0;k<3;k++) linea([cx - .09 + k*.09, yf, z0], [cx - .09 + k*.09, yf, z0 + .6], '#4B5270'); } };
  const corpo = (x0, x1, yf, id) => {                       // un tratto di facciata (ala o rientranza)
    scatola(x0, y, 0, x1 - x0, yf - y, h, col, { right:dx });
    fy(yf, x0, x1, 0, .85, '#E5D3A6'); for(let r=1; r<4; r++) linea([x0, yf, r*.21], [x1, yf, r*.21], 'rgba(150,120,70,.25)');
    fy(yf, x0, x1, h - .16, h, '#F5EAD0'); fy(yf, x0, x1, 1.13, 1.18, '#F5EAD0');
    finestre(x0, x1, yf, id, true);
  };
  // ala sinistra, rientranza sinistra, poi il tetto di questa metà
  corpo(6.6, 7.55, 8.0, 3000); corpo(7.55, 8.1, 7.72, 3010);
  tettoPadiglione(6.5, 5.3, h, 1.7, 2.82, .5, COL.coppi);
  // corpo centrale sporgente (in pietra in basso, con portone, balcone, timpano, attico con il logo)
  const c0 = 8.1, c1 = 9.5, yc = 8.18, hc = 3.75, cx = (c0 + c1)/2;
  scatola(c0, y, 0, c1 - c0, yc - y, hc, col, { right:dx });
  fy(yc, c0, c1, 0, 1.15, COL.scuolaPietra); fx(c1, y, yc, 0, 1.15, '#B9B8B0');
  for(let r=1; r<5; r++) linea([c0, yc, r*.23], [c1, yc, r*.23], 'rgba(90,90,90,.25)');
  for(const k of [-.48, .48]){ fy(yc, cx + k - .15, cx + k + .15, .3, .9, '#EEEDE6'); finestraY(yc, cx + k - .11, cx + k + .11, .34, .86, 3050 + (k > 0)); }
  arcoY(yc, cx, 0, .5, 1.0, '#2F3A33'); fy(yc, cx - .03, cx + .03, .2, .75, '#4A5A50');
  scatola(c0 - .05, yc, 1.15, c1 - c0 + .1, .3, .08, '#DCDBD3');                           // balcone
  for(let k=0; k<8; k++) linea([c0 + .05 + k*.185, yc + .3, 1.23], [c0 + .05 + k*.185, yc + .3, 1.46], '#D0CFC6', 2.5);
  linea([c0 - .05, yc + .3, 1.48], [c1 + .05, yc + .3, 1.48], '#E6E5DE', 3);
  fy(yc, cx - .28, cx + .28, 1.25, 2.1, '#EEEDE6'); finestraY(yc, cx - .2, cx + .2, 1.28, 2.05, 3060);
  poli(P([cx - .38, yc, 2.12], [cx + .38, yc, 2.12], [cx, yc, 2.4]), '#E6E5DE');
  for(const k of [-.5, .5]){ fy(yc, cx + k - .13, cx + k + .13, 1.3, 2.0, '#F5EEDC'); finestraY(yc, cx + k - .1, cx + k + .1, 1.33, 1.95, 3061 + (k > 0)); }
  for(const k of [-.48, 0, .48]) finestraY(yc, cx + k - .1, cx + k + .1, 2.55, 2.95, 3070 + k*10);
  fy(yc, c0, c1, 3.0, 3.75, '#F3E7CB'); fy(yc, c0, c1, 2.98, 3.03, '#F5EAD0');
  adesivo([cx - .34, yc, 3.71], [cx + .66, yc, 3.71], [cx - .34, yc, 2.71], () => {          // il logo della scuola, medaglione sull'attico
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.arc(34, 34, 34, 0, 7); g.fill(); g.strokeStyle = '#6E9F38'; g.lineWidth = 4; g.stroke();
    const logo = document.getElementById('logo-scuola');
    if(logo && logo.complete && logo.naturalWidth){ g.save(); g.beginPath(); g.arc(34, 34, 31, 0, 7); g.clip(); g.drawImage(logo, 2, 2, 64, 64); g.restore(); }
  });
  for(let k=0; k<8; k++) scatola(c0 + .04 + k*.18, yc - .1, hc, .08, .08, .22, '#EFE6D0');   // balaustra della terrazza
  scatola(c0, yc - .1, hc + .22, c1 - c0, .1, .05, '#F5EAD0');
  for(let f=0; f<3; f++) finestraX(c1, y + 2.3, y + 2.6, .4 + f*1.0, .9 + f*1.0, 3080 + f);
  // bandiera italiana sul balcone
  const [bx, by] = iso(c1 - .1, yc + .28, 1.48), sv = Math.sin(performance.now()/300)*2;
  g.strokeStyle = '#555'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + 16, by - 30); g.stroke();
  [['#2E8B57',0],['#FFFFFF',1],['#D2353F',2]].forEach(([c, i]) => { g.fillStyle = c; g.beginPath(); g.moveTo(bx + 16 + i*7, by - 30 + sv*i*.3); g.lineTo(bx + 23 + i*7, by - 30 + sv*(i+1)*.3); g.lineTo(bx + 23 + i*7, by - 20 + sv*(i+1)*.3); g.lineTo(bx + 16 + i*7, by - 20 + sv*i*.3); g.fill(); });
  scatola(cx - .7, yc, 0, 1.4, .32, .06, '#D6D5CE'); scatola(cx - .5, yc + .32, 0, 1.0, .2, .04, '#D6D5CE');   // gradini
  // rientranza destra, ala destra e il tetto di questa metà
  corpo(9.5, 10.05, 7.72, 3020); corpo(10.05, 11.0, 8.0, 3030);
  for(let f=0; f<3; f++) for(let j=0; j<2; j++) finestraX(11.0, y + .5 + j*1.2, y + .8 + j*1.2, .35 + f*1.0, .9 + f*1.0, 3100 + f*3 + j);
  tettoPadiglione(9.45, 5.3, h, 1.65, 2.82, .5, COL.coppi);
}
// la gelateria (a destra della scalinata), con il display dei coni sul fianco
const GEL = { x:13.0, y:5.4, w:4.4, d:2.6, h:2.8, porta:16.6 };
function gelateria(coni, maxConi, aperta, t){
  const { x, y, w, d, h } = GEL;
  scatola(x, y, 0, w, d, h, COL.muro, { left:'#FFF0D9', right:'#F1DFC2', top:'#FFF8EC' });
  fy(y+d, x, x+w, 0, .3, '#E9D7B8'); fx(x+w, y, y+d, 0, .3, '#D9C6A6');
  const luce = NOTTE > .3 && !aperta;
  fy(y+d, 13.3, 15.8, 1.0, 2.15, luce ? '#FFE7A6' : COL.vetro);
  if(luce) LUCI.push(P([13.3,y+d,1.0],[15.8,y+d,1.0],[15.8,y+d,2.15],[13.3,y+d,2.15]));
  if(!luce) poli(P([13.5,y+d,2.0],[14.05,y+d,2.0],[13.75,y+d,1.1],[13.4,y+d,1.1]), '#E8F7FD');
  // porta: aperta (scura) o chiusa (legno)
  arcoY(y+d, GEL.porta, 0, .75, 1.85, aperta ? '#3A2A22' : COL.porta);
  if(!aperta){ fy(y+d, GEL.porta - .02, GEL.porta + .02, 0, 1.6, '#7A5236'); fy(y+d, GEL.porta + .18, GEL.porta + .24, .85, .95, '#F5C04A'); }
  scatola(x - .15, y - .15, h, w + .3, d + .3, .25, COL.tetto);
  const [sx, sy] = iso(x + 2.2, y + 1.3, h + .25);
  coneIcona(sx, sy - 6 + Math.sin(t*2)*3, 1.3);
  displayConi(coni, maxConi, t);
}
function displayConi(coni, maxConi, t){                  // display luminoso sul fianco: si legge subito quanti coni restano
  const finiti = coni <= 0, lamp = finiti && Math.floor(t*3) % 2;
  suParete('x', GEL.x + GEL.w, GEL.y + GEL.d - .45, 2.5, 1, 1, () => {
    g.scale(1/100, 1/100);                               // 100 = 1 unità di mondo
    g.fillStyle = '#23283E'; g.beginPath(); g.roundRect(0, 0, 170, 110, 12); g.fill();
    g.strokeStyle = '#F7A8BE'; g.lineWidth = 5; g.stroke();
    g.fillStyle = '#F2B866'; g.beginPath(); g.moveTo(18, 40); g.lineTo(48, 40); g.lineTo(33, 92); g.fill();
    g.fillStyle = '#F7A1BC'; g.beginPath(); g.arc(33, 34, 16, 0, 7); g.fill();
    g.font = '900 64px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = finiti ? (lamp ? '#FF5A6E' : '#7A2A35') : coni <= maxConi*.25 ? '#FFC94A' : '#7CF0A0';
    g.fillText(String(Math.max(0, coni)), 112, 60);
    g.font = '800 15px Nunito, sans-serif'; g.fillStyle = '#AEB6D0'; g.fillText(finiti ? 'FINITI!' : 'CONI', 112, 98);
  });
  if(NOTTE > .2 || finiti){ const [cx, cy] = iso(GEL.x + GEL.w, GEL.y + 1.3, 2.0); LAMPIONI.push([cx, cy, finiti ? 'rgba(255,90,110,' : 'rgba(124,240,160,', 60, .35]); }
}
function tenda(){
  const n = 12;
  for(let i=0; i<n; i++){ const x0 = GEL.x + i*GEL.w/n, x1 = x0 + GEL.w/n, col = i % 2 ? '#FFFFFF' : COL.tenda;
    poli(P([x0,8.0,2.6],[x1,8.0,2.6],[x1,8.5,2.3],[x0,8.5,2.3]), col);
    poli(P([x0,8.5,2.3],[x1,8.5,2.3],[x1,8.5,2.14],[x0,8.5,2.14]), i % 2 ? '#EDEFF5' : tono(COL.tenda, -.12)); }
}
function bancone(bx, by, coni, maxConi){
  scatola(bx, by, .1, 2.2, .5, .9, COL.banco, { top:'#BDEBDD' });
  [COL.pallina, '#B8E07A', '#9C6B4E', '#9FE3F0'].forEach((c, i) => { const [sx, sy] = iso(bx + .25 + i*.52, by + .25, 1.0); g.fillStyle = c; g.beginPath(); g.ellipse(sx, sy, 9, 5, 0, 0, 7); g.fill(); });
  const n = Math.ceil(6 * Math.max(0, coni) / Math.max(1, maxConi));
  for(let i=0; i<n; i++){ const [sx, sy] = iso(bx + .15 + i*.36, by + .5, .6); g.fillStyle = COL.cono; g.beginPath(); g.moveTo(sx-5, sy-7); g.lineTo(sx+5, sy-7); g.lineTo(sx, sy+7); g.fill(); }
}
function pacco(x, y, z, k=1.5){                           // pacco con un cono disegnato sopra e davanti
  const s = .22*k, h = .38*k;
  scatola(x - s, y - s, z, 2*s, 2*s, h, '#D9A066', { top:'#EBB884', left:'#D29758', right:'#B97F45' });
  piano(x - s, y - .03, z + h + .002, 2*s, .06, '#C98F55');                                    // nastro
  adesivo([x - s + .07, y + s, z + h - .05], [x - s + 1.07, y + s, z + h - .05], [x - s + .07, y + s, z + h - 1.05], () => {
    g.fillStyle = '#FFF6E8'; g.beginPath(); g.roundRect(0, 0, (2*s - .14)*100, (h - .1)*100, 6); g.fill();
    disegnoCono((s - .07)*100, (h - .1)*36, (h - .1)*1.05);
  });
}
/* ---------- arredo: alberi, lampioni, panchine, fiori ---------- */
function cipresso(x, y, z, h=1.8){
  ombra(x, y, z, 13, 5, .14);
  const [bx, by] = iso(x, y, z), top = by - h*S;
  const gr = g.createLinearGradient(bx - 12, 0, bx + 12, 0); gr.addColorStop(0, '#55A673'); gr.addColorStop(1, '#2F7349');
  g.fillStyle = gr; g.beginPath(); g.moveTo(bx, top); g.bezierCurveTo(bx + 15, top + h*S*.35, bx + 12, by - 6, bx, by - 2); g.bezierCurveTo(bx - 12, by - 6, bx - 15, top + h*S*.35, bx, top); g.fill();
}
function albero(x, y, z, s=1, col=COL.albero){
  ombra(x, y, z, 24*s, 10*s, .12);
  scatola(x-.06, y-.06, z, .12, .12, .6*s, COL.tronco);
  const [sx, sy] = iso(x, y, z + .6*s + .4*s); sfera(sx, sy, 22*s, col, .3);
}
function lampione(x, y, z=0){
  scatola(x - .05, y - .05, z + .1, .1, .1, 1.9, '#4B5270');
  const [sx, sy] = iso(x, y, z + 2.05);
  g.fillStyle = NOTTE > .2 ? '#FFE08A' : '#F4F1E6'; g.beginPath(); g.arc(sx, sy, 6, 0, 7); g.fill();
  if(NOTTE > .2) LAMPIONI.push([sx, sy, 'rgba(255,222,140,', 95, .7]);
}
function panchina(x, y){ scatola(x, y, .35, 1.2, .3, .07, '#C98B5E'); scatola(x+.05, y+.05, .1, .07, .2, .25, '#7D6A62'); scatola(x+1.08, y+.05, .1, .07, .2, .25, '#7D6A62'); scatola(x, y-.03, .42, 1.2, .06, .32, '#C98B5E'); }
const FIORI = [];
for(let i=0; i<16; i++) FIORI.push([2.7 + hash(i)*3.4, 6.2 + hash(i+20)*1.6, 0, ['#F28CA8','#F5C04A','#FFFFFF','#9B7BE0'][i%4]]);
for(let i=0; i<6; i++) FIORI.push([2.6 + hash(i+50)*1.1, 4.2 + hash(i+60)*1.0, Z2, ['#F28CA8','#F5C04A','#FFFFFF'][i%3]]);
function fiore(x, y, z, col, sboccio){
  const [sx, sy] = iso(x, y, z);
  g.strokeStyle = '#4FA372'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx, sy - 8); g.stroke();
  if(sboccio < .15){ g.fillStyle = '#7CC36A'; g.beginPath(); g.ellipse(sx, sy - 9, 2.2, 3.4, 0, 0, 7); g.fill(); return; }
  const r = 1.2 + 3.2*sboccio;
  g.fillStyle = col; for(let k=0;k<5;k++){ const a = k/5*Math.PI*2; g.beginPath(); g.arc(sx + Math.cos(a)*r*.8, sy - 9 + Math.sin(a)*r*.8, r*.6, 0, 7); g.fill(); }
  g.fillStyle = '#F5C04A'; g.beginPath(); g.arc(sx, sy - 9, r*.35, 0, 7); g.fill();
}
function giardino(sboccio){
  piano(2.4, 5.5, .004, 4.0, 2.4, '#8FCB73');
  linea([2.4, 7.9, .01], [6.4, 7.9, .01], '#7CC36A', 2);
  for(const f of FIORI) if(f[2] === 0) fiore(f[0], f[1], f[2], f[3], sboccio);
  cipresso(2.8, 5.8, 0, 1.5); cipresso(6.1, 5.75, 0, 1.3); albero(4.3, 6.0, 0, .55);
  panchina(3.6, 7.45);
}
