/* =====================================================================
   CIELO, SOLE, METEO
   ===================================================================== */
const SOLE = [[0,'#FFF27A'],[.35,'#FFE14D'],[.6,'#FFC93C'],[.8,'#FF9A3C'],[1,'#D9531E']];
function posSole(p){ const a = Math.PI*clamp(p); return [640 - 600*Math.cos(a), 700 - 640*Math.sin(a)]; }
let LAMPO = 0;
function cielo(meteo, p, t){
  const cieloAlto = scala([[0,'#9CCBF0'],[.3,'#79B8EE'],[.7,'#86BDEB'],[.88,'#C59AD0'],[1,'#3E3F7A']], p);
  const cieloBasso = scala([[0,'#FFE9C2'],[.25,'#E9F4FB'],[.7,'#F3EBD9'],[.88,'#FFB98A'],[1,'#B9708A']], p);
  const gr = g.createLinearGradient(0, 0, 0, LH); gr.addColorStop(0, cieloAlto); gr.addColorStop(1, cieloBasso);
  g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
  if(meteo === 'pioggia'){ g.fillStyle = 'rgba(60,66,90,.6)'; g.fillRect(0, 0, LW, LH); }
  if(meteo === 'nuvoloso'){ g.fillStyle = 'rgba(205,212,225,.5)'; g.fillRect(0, 0, LW, LH); }
  if(NOTTE > 0) for(let i=0; i<50; i++){ g.fillStyle = `rgba(255,255,255,${NOTTE*(.3 + .7*hash(i))*(meteo === 'pioggia' ? .2 : 1)})`; g.beginPath(); g.arc(hash(i)*LW, hash(i+9)*LH*.4, .8 + hash(i+3)*1.4, 0, 7); g.fill(); }
  // il sole: arco di 180° da est a ovest, dal giallo acceso all'arancione scuro
  const [sx, sy] = posSole(p), col = scala(SOLE, p), vis = meteo === 'pioggia' ? .15 : meteo === 'nuvoloso' ? .6 : 1;
  const gl = g.createRadialGradient(sx, sy, 10, sx, sy, 190); gl.addColorStop(0, col + 'aa'); gl.addColorStop(1, col + '00');
  g.globalAlpha = vis; g.fillStyle = gl; g.fillRect(sx-190, sy-190, 380, 380);
  g.fillStyle = col; g.beginPath(); g.arc(sx, sy, 36, 0, Math.PI*2); g.fill(); g.globalAlpha = 1;
  // temporale all'orizzonte: nuvoloni neri e fulmini
  LAMPO = 0;
  if(meteo === 'pioggia'){
    const k = Math.floor(t/2.6), ph = frac(t/2.6);
    if(ph < .1){
      const bx = 140 + hash(k)*1000; g.strokeStyle = '#FFF6C8'; g.lineWidth = 3; g.shadowColor = '#FFF6C8'; g.shadowBlur = 14;
      g.beginPath(); g.moveTo(bx, 470); let x = bx, y = 470; for(let i=0;i<6;i++){ x += (hash(k*7+i) - .5)*40; y += 22; g.lineTo(x, y); } g.stroke(); g.shadowBlur = 0;
      LAMPO = ph < .05 ? 1 - ph/.05 : 0;
    }
    g.save(); g.beginPath(); g.rect(0, 0, LW, 600); g.clip();                       // banco di nuvoloni neri all'orizzonte
    const nb = g.createLinearGradient(0, 430, 0, 600); nb.addColorStop(0, '#5C637A'); nb.addColorStop(1, '#2B3042');
    g.fillStyle = nb;
    for(let i=0; i<10; i++){ const cx = i*140 - 30 + Math.sin(t*.25 + i)*12, h = 60 + hash(i+4)*50;
      g.beginPath(); g.ellipse(cx, 600 - h*.4, 100, h, 0, 0, 7); g.ellipse(cx + 55, 600 - h*.7, 60, h*.6, 0, 0, 7); g.ellipse(cx - 50, 600 - h*.55, 55, h*.5, 0, 0, 7); g.fill(); }
    g.restore();
  }
  // colline umbre (più cupe col maltempo)
  const strati = [['#B9D3B4', 590, 40, .004], ['#9DC29A', 640, 34, .006], ['#86B386', 690, 28, .009]];
  strati.forEach(([c, base, amp, f], i) => {
    let colore = mix(c, cieloBasso, .15*(2-i));
    if(meteo === 'pioggia') colore = mix(c, '#4C566B', .55);
    if(meteo === 'nuvoloso') colore = mix(c, '#B7C0CC', .3);
    g.fillStyle = mix(colore, '#2C3060', NOTTE*.6);
    g.beginPath(); g.moveTo(0, LH);
    for(let x=0; x<=LW; x+=16) g.lineTo(x, base - amp*Math.sin(x*f + i*1.7) - amp*.5*Math.sin(x*f*2.3 + i));
    g.lineTo(LW, LH); g.closePath(); g.fill();
  });
}
function uccellini(t){
  g.strokeStyle = '#3A3355'; g.lineWidth = 2; g.lineCap = 'round';
  for(let i=0; i<7; i++){
    const x = ((t*45 + i*210) % 1600) - 150, y = 70 + (i%4)*28 + Math.sin(t*1.3 + i)*14, ali = Math.sin(t*11 + i*2)*6, s = .8 + (i%3)*.2;
    g.beginPath(); g.moveTo(x - 9*s, y - ali*s); g.quadraticCurveTo(x - 4*s, y - 3*s, x, y); g.quadraticCurveTo(x + 4*s, y - 3*s, x + 9*s, y - ali*s); g.stroke();
  }
}
function farfalle(t){
  for(let i=0; i<3; i++){
    const [cx, cy] = iso(3 + i*1.3 + Math.sin(t*.7 + i)*.6, 6.6 + Math.cos(t*.9 + i)*.6, .7 + Math.sin(t*2 + i)*.25);
    const ali = Math.abs(Math.sin(t*14 + i))*5 + 1;
    g.fillStyle = ['#F28CA8','#F5C04A','#9B7BE0'][i];
    g.beginPath(); g.ellipse(cx - ali*.7, cy, ali, 3.5, -.4, 0, 7); g.ellipse(cx + ali*.7, cy, ali, 3.5, .4, 0, 7); g.fill();
  }
}
const POZZE = [[4.5,10.0,0,.55],[9.0,10.7,0,.7],[13.6,10.1,0,.5],[1.2,5.6,0,.45],[18.8,4.2,0,.5],[8.2,8.7,.1,.35],[3.1,8.6,.1,.3],[8.8,4.4,Z2,.45],[15.4,4.0,Z2,.4],[12.2,1.3,Z3,.35]];
function pozzanghere(k, t, livello){
  POZZE.forEach(([x, y, z, r], i) => {
    if(livello !== z) return;
    ellisse(x, y, z + .006, r*k, 'rgba(140,168,204,.7)', .9);
    ellisse(x - r*.2*k, y - r*.1*k, z + .007, r*.45*k, 'rgba(220,235,250,.45)', .6);
    const [sx, sy] = iso(x, y, z + .01), rr = frac(t*1.4 + i*.37);
    g.strokeStyle = `rgba(255,255,255,${.6*(1-rr)*k})`; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, sy, RX(r*k*rr), RY(r*k*rr)*.9, 0, 0, 7); g.stroke();
  });
}
function quotaSuolo(x, y){ if(x > 7 && x < 17.6 && y < 2.6) return Z3; if(x > 2.2 && x < 17.6 && y < 5.4) return Z2; return 0; }
function pioggia(t){
  g.strokeStyle = 'rgba(160,205,245,.8)'; g.lineWidth = 1.5;
  for(let i=0; i<170; i++){
    const x = hash(i)*DX, y = hash(i+30)*DY, zb = quotaSuolo(x, y), ph = frac(hash(i+60) + t*1.7), z = zb + 7 - ph*7;
    const [sx, sy] = iso(x, y, z); g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 3, sy + 13); g.stroke();
  }
}
function nebbia(t){                                   // banchi di nebbia sul terzo livello
  for(let i=0; i<5; i++){
    const cx = ((t*14 + i*380) % 1900) - 300, cy = 175 + (i%3)*45, rx = 280 + (i%2)*120;
    const gr = g.createRadialGradient(cx, cy, 10, cx, cy, rx);
    gr.addColorStop(0, 'rgba(245,247,252,.85)'); gr.addColorStop(.6, 'rgba(245,247,252,.5)'); gr.addColorStop(1, 'rgba(245,247,252,0)');
    g.save(); g.translate(cx, cy); g.scale(1, .28); g.translate(-cx, -cy); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rx, 0, 7); g.fill(); g.restore();
  }
}

/* =====================================================================
   IL CAMION: percorre la strada a U (arriva da sinistra, riparte a destra)
   ===================================================================== */
const PERCORSO = (() => {
  const pts = [], { xS, xD, yF, cy, r } = CL;
  for(let y=-2.5; y<cy; y+=.1) pts.push([xS, y]);
  for(let i=0; i<=24; i++){ const f = Math.PI - i/24*Math.PI/2; pts.push([2.4 + r*Math.cos(f), cy + r*Math.sin(f)]); }
  for(let x=2.5; x<17.6; x+=.1) pts.push([x, yF]);
  for(let i=0; i<=24; i++){ const f = Math.PI/2 - i/24*Math.PI/2; pts.push([17.6 + r*Math.cos(f), cy + r*Math.sin(f)]); }
  for(let y=cy - .1; y>-3; y-=.1) pts.push([xD, y]);
  const L = [0]; for(let i=1; i<pts.length; i++) L.push(L[i-1] + Math.hypot(pts[i][0]-pts[i-1][0], pts[i][1]-pts[i-1][1]));
  const iStop = pts.findIndex(([x, y]) => y === yF && x >= 15.2);
  return { pts, L, tot:L[L.length-1], sStop:L[iStop] };
})();
function lungoPercorso(s){
  const { pts, L } = PERCORSO; let i = 1; while(i < L.length - 1 && L[i] < s) i++;
  const k = clamp((s - L[i-1]) / (L[i] - L[i-1] || 1)), x = lerp(pts[i-1][0], pts[i][0], k), y = lerp(pts[i-1][1], pts[i][1], k);
  const a = pts[Math.max(0, i-2)], b = pts[Math.min(pts.length-1, i+1)];
  return { x, y, ang: Math.atan2(b[1]-a[1], b[0]-a[0]) };
}
function camion(px, py, ang, t, fermo){
  const u = [Math.cos(ang), Math.sin(ang)], v = [-Math.sin(ang), Math.cos(ang)];
  const pt = (a, b, z) => [px + u[0]*a + v[0]*b, py + u[1]*a + v[1]*b, z];
  const b = fermo ? 0 : Math.abs(Math.sin(t*16))*.03;
  ombra(px, py, .01, 95, 34, .2);
  if(!fermo) for(let i=0; i<6; i++){ const a = frac(t*1.3 + i/6), [sx, sy] = iso(...pt(-2.3 - a*1.3, -.45, .45 + a*1.5));
    g.fillStyle = `rgba(214,219,230,${.85*(1-a)})`; g.beginPath(); g.arc(sx, sy, 6 + a*20, 0, 7); g.fill(); }
  const [c1x, c1y] = pt(-.6, 0, 0), [c2x, c2y] = pt(1.55, 0, 0);
  scatolaRuotata(c1x, c1y, .35 + b, 3.0, 1.35, 1.6, ang, '#FFFFFF', { top:'#FFFFFF' });
  scatolaRuotata(c2x, c2y, .35 + b, 1.2, 1.25, 1.15, ang, COL.cabina);
  const s = (v[0] + v[1]) > 0 ? 1 : -1, w = .69*s;
  poli(P(pt(-2.1, w, .75+b), pt(.9, w, .75+b), pt(.9, w, 1.0+b), pt(-2.1, w, 1.0+b)), COL.tenda);
  const [cx, cy] = iso(...pt(-.6, w, 1.5 + b)); coneIcona(cx, cy - 4, .8);
  poli(P(pt(1.15, .64*s, .85+b), pt(1.95, .64*s, .85+b), pt(1.95, .64*s, 1.35+b), pt(1.15, .64*s, 1.35+b)), '#E8F7FD');
  if(u[0] + u[1] > 0) poli(P(pt(2.16, -.5, .85+b), pt(2.16, .5, .85+b), pt(2.16, .5, 1.35+b), pt(2.16, -.5, 1.35+b)), '#CDEFFB');
  if(u[0] + u[1] < 0) linea(pt(-2.11, 0, .4+b), pt(-2.11, 0, 1.9+b), '#C9CCD6', 2);
  for(const a of [-1.5, 1.45]){
    const ruota = (rr, col) => { const q = []; for(let i=0;i<20;i++){ const f = i/20*Math.PI*2; q.push(pt(a + Math.cos(f)*rr, .7*s, .3 + Math.sin(f)*rr)); } poli(P(...q), col); };
    ruota(.3, COL.ruota); ruota(.12, '#C5CBD8');
  }
}

/* =====================================================================
   LA GIORNATA
   ===================================================================== */
const GIORNI = [
  { meteo:'sole',     clienti:9, coni:6, camion:true },     // il gelato finisce; la sera arriva il camion
  { meteo:'pioggia',  clienti:3, coni:6 },                  // la mattina i pacchi entrano in negozio
  { meteo:'nuvoloso', clienti:6, coni:6 }
];
const CAM = { entra:.62, ferma:.76, riparte:.84, esce:.97 };
const CHIUDE = .87, BUIO = .95;
const PACCHI = [[16.25, 8.85, .1], [16.8, 8.85, .1], [16.52, 8.85, .48]];
let durataGiorno = 12, modo = 'scena';
function scena(t){
  const n = Math.floor(t / durataGiorno), p = frac(t / durataGiorno), G = GIORNI[n % 3], ieri = GIORNI[(n + 2) % 3];
  LUCI = []; LAMPIONI = [];
  NOTTE = Math.max(seg(p, CHIUDE, BUIO), 1 - seg(p, 0, .05));
  OMBRA_DX = -Math.cos(Math.PI*p);
  const sole = G.meteo === 'sole', piove = G.meteo === 'pioggia', k = piove ? seg(p, .03, .45) : 0;
  const sboccio = sole ? seg(p, .03, .3) : .1;
  cielo(G.meteo, p, t);
  terreno();
  if(piove) pozzanghere(k, t, 0);
  // camion (sulla gamba sinistra, dietro la città, va disegnato prima)
  let cam = null;
  if(G.camion && p > CAM.entra && p < CAM.esce){
    let s;
    if(p < CAM.ferma) s = lerp(0, PERCORSO.sStop, easeOutQ(seg(p, CAM.entra, CAM.ferma)));
    else if(p < CAM.riparte) s = PERCORSO.sStop;
    else s = lerp(PERCORSO.sStop, PERCORSO.tot, easeInQ(seg(p, CAM.riparte, CAM.esce)));
    cam = { ...lungoPercorso(s), fermo: p >= CAM.ferma && p < CAM.riparte };
    cam.alpha = clamp(Math.min(cam.y + 2.2, 99)*.8);
    cam.prima = cam.x < 2.3 && cam.y < 5;
  }
  const disegnaCamion = () => { g.globalAlpha = cam.alpha; camion(cam.x, cam.y, cam.ang, t, cam.fermo); g.globalAlpha = 1; };
  if(cam && cam.prima) disegnaCamion();
  // livello 2 e 3
  livello2();
  if(piove) pozzanghere(k, t, Z2);
  for(const f of FIORI) if(f[2] === Z2) fiore(f[0], f[1], f[2], f[3], sboccio);
  tempio(); lampione(6.75, 4.95, Z2);
  livello3(); torreMura();
  if(piove) pozzanghere(k, t, Z3);
  duomo(); casa(11.0, .35, 1.9, 1.7, 2, COL.pietra, { z:Z3, pietra:true, camino:true }); palazzoPriori();
  merliDavanti(); portaCitta();
  if(G.meteo === 'nuvoloso') nebbia(t);
  scalinata(11.2, 1.6, 5.4, 3.0, Z2, Z2 + .7, 4); lampione(10.75, 4.95, Z2);
  // livello 1
  giardino(sboccio); scuola();
  scalinata(11.2, 1.6, 8.0, 5.4, 0, Z2, 7);
  // clienti e coni
  const banco = 14.6, inizio = 2.3, walkT = .2;
  let serviti = 0, persi = 0, ultimoServito = -9;
  const dinamici = [];
  for(let i=0; i<G.clienti; i++){
    const pi = .08 + .56*(i+.5)/G.clienti, q = (p - pi)/walkT, servito = i < G.coni;
    if(q >= .5){ if(servito){ serviti++; ultimoServito = Math.max(ultimoServito, pi + walkT*.5); } else persi++; }
    if(q < 0 || q > 1) continue;
    let x, verso = 1, st = 0, cono = false, cammina = true;
    if(q < .5) x = lerp(inizio, banco, ease(q/.5));
    else if(q < .62){ x = banco; cammina = false; st = servito ? 1 : -1; cono = servito; }
    else { x = lerp(banco, servito ? 18.2 : inizio, ease((q - .62)/.38)); verso = servito ? 1 : -1; st = servito ? 1 : -1; cono = servito; }
    const y = 8.92 + (i % 2)*.18;
    dinamici.push({ y, f: () => { g.globalAlpha = clamp(Math.min(x - 2.3, 18.3 - x)*2.5); cliente(x, y, (i + n*2) % 6, cammina ? t*2.2 + i*.3 : 0, verso, st, cono); g.globalAlpha = 1; } });
  }
  // pacchi: il camion li lascia la sera, la mattina dopo entrano in negozio
  const pacchiStasera = G.camion && p > CAM.ferma;
  const pacchiStamattina = ieri.camion && p < .08;
  let coni = G.coni - serviti;
  if(pacchiStamattina) coni = p < .06 ? 0 : G.coni;
  if(pacchiStasera){
    PACCHI.forEach(([px, py, pz], i) => {
      const c = clamp((p - CAM.ferma)/(CAM.riparte - CAM.ferma)*1.5 - i*.25);
      if(c <= 0) return;
      const da = lungoPercorso(PERCORSO.sStop - 2.1), x = lerp(da.x, px, c), y = lerp(da.y, py, c), z = lerp(.9, pz, c) + Math.sin(c*Math.PI)*1.2;
      dinamici.push({ y, f: () => pacco(x, y, z) });
    });
  }
  if(pacchiStamattina) PACCHI.forEach(([px, py, pz], i) => {
    const c = seg(p, .015 + i*.012, .05 + i*.012); if(c >= 1) return;
    const x = lerp(px, GEL.porta, c), y = lerp(py, 8.05, c);
    dinamici.push({ y, f: () => { g.globalAlpha = 1 - seg(c, .7, 1); pacco(x, y, lerp(pz, .1, c)); g.globalAlpha = 1; } });
  });
  // apertura (mattina) e chiusura (sera): il gelataio porta dentro il bancone ed entra
  const chiusura = Math.max(seg(p, CHIUDE, CHIUDE + .06), 1 - seg(p, .02, .07));
  const aperta = chiusura < 1;
  const bancoX = lerp(13.5, 16.3, ease(seg(chiusura, 0, .6))), bancoY = lerp(8.1, 7.95, seg(chiusura, .4, .7));
  if(chiusura < .75) dinamici.push({ y: bancoY + .4, f: () => { g.globalAlpha = 1 - seg(chiusura, .55, .75); bancone(bancoX, bancoY, coni, G.coni); g.globalAlpha = 1; } });
  let emo = 'felice';
  if(G.camion && p > CAM.ferma - .02 && p < CAM.ferma + .03) emo = 'sorpreso';
  else if(G.camion && p >= CAM.ferma + .03) emo = 'fiero';
  else if(pacchiStamattina) emo = 'fiero';
  else if(coni <= 0 && persi > 0) emo = 'triste';
  else if(coni <= 1 && p > .1 && G.clienti > G.coni) emo = 'preoccupato';
  else if(piove && p > .5) emo = 'pensieroso';
  const salto = Math.max(0, Math.sin(clamp(((p - ultimoServito)*durataGiorno)/.3)*Math.PI))*10;
  const mx = lerp(13.15, GEL.porta, ease(seg(chiusura, .5, .95))), my = lerp(8.65, 8.1, ease(seg(chiusura, .5, .95)));
  if(chiusura < .97) dinamici.push({ y: my, f: () => { g.globalAlpha = 1 - seg(chiusura, .85, .97); ombra(mx, my, .1, 20, 8, .2); const [sx, sy] = iso(mx, my, .1); mascotte(sx, sy - salto + Math.sin(t*3)*1.5, .95, emo, t); g.globalAlpha = 1; } });
  gelateria(coni, G.coni, aperta, t);
  tenda();
  lampione(2.5, 8.2); lampione(10.95, 8.2); lampione(17.7, 8.2);
  dinamici.sort((a, b) => a.y - b.y).forEach(d => d.f());
  if(cam && !cam.prima) disegnaCamion();
  albero(9.6, 11.7, 0, .5, '#5FB57F'); albero(14.5, 11.75, 0, .45, '#5FB57F');
  // effetti del tempo
  if(piove) pioggia(t);
  if(sole && NOTTE < .5){ uccellini(t); farfalle(t); }
  // luce: mattino dorato, tramonto arancione, notte blu
  const mattino = 1 - seg(p, .03, .16), sera = seg(p, .7, .9);
  g.globalCompositeOperation = 'multiply';
  if(mattino > 0){ g.fillStyle = `rgba(255,236,190,${.3*mattino})`; g.fillRect(0, 0, LW, LH); }
  if(sera > 0){ g.fillStyle = `rgba(255,170,120,${.35*sera})`; g.fillRect(0, 0, LW, LH); }
  if(NOTTE > 0){ g.fillStyle = `rgba(55,62,140,${.68*NOTTE})`; g.fillRect(0, 0, LW, LH); }
  g.globalCompositeOperation = 'source-over';
  // di notte la città si accende: finestre e lampioni
  if(NOTTE > .25){
    const a = seg(NOTTE, .25, .7);
    for(const pts of LUCI){ g.globalAlpha = a; poli(pts, '#FFD47A'); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'lighter';
    for(const pts of LUCI){ const cx = pts.reduce((s,q)=>s+q[0],0)/pts.length, cy = pts.reduce((s,q)=>s+q[1],0)/pts.length;
      const gl = g.createRadialGradient(cx, cy, 1, cx, cy, 22); gl.addColorStop(0, `rgba(255,200,110,${.35*a})`); gl.addColorStop(1, 'rgba(255,200,110,0)'); g.fillStyle = gl; g.fillRect(cx-22, cy-22, 44, 44); }
    g.globalCompositeOperation = 'source-over';
  }
  g.globalCompositeOperation = 'lighter';
  for(const [x, y, c, r, a] of LAMPIONI){ const gl = g.createRadialGradient(x, y, 2, x, y, r); gl.addColorStop(0, c + (a*Math.max(NOTTE, .4)) + ')'); gl.addColorStop(1, c + '0)'); g.fillStyle = gl; g.fillRect(x - r, y - r, 2*r, 2*r); }
  g.globalCompositeOperation = 'source-over';
  if(LAMPO > 0){ g.fillStyle = `rgba(235,240,255,${.35*LAMPO})`; g.fillRect(0, 0, LW, LH); }
  const oraArrivo = 8 + 12*CAM.ferma;
  return { giorno:n+1, meteo:G.meteo, ora:8 + 12*p, coni, persi,
    camion:(G.camion && p < CAM.ferma) ? Math.max(1, Math.ceil(oraArrivo - (8 + 12*p))) : null, notte: NOTTE > .5 };
}
function schedaMascotte(t){
  const gr = g.createLinearGradient(0, 0, 0, LH); gr.addColorStop(0, '#DCEBFA'); gr.addColorStop(1, '#F6F2FA'); g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
  ['felice','preoccupato','triste','sorpreso','fiero','pensieroso'].forEach((e, i) => {
    const x = 120 + i*208, y = 560;
    g.fillStyle = 'rgba(46,51,80,.12)'; g.beginPath(); g.ellipse(x, y + 4, 46, 12, 0, 0, 7); g.fill();
    mascotte(x, y + Math.sin(t*3 + i)*3, 2.2, e, t + i*.7);
  });
}

/* =====================================================================
   CICLO
   ===================================================================== */
let t0 = performance.now(), T = 0, info = null, tempi = [], scatti = [], ultimo = 0, nF = 0;
const meteoIc = { sole:'☀️', pioggia:'🌧️', nuvoloso:'⛅' };
const media = a => a.reduce((s,x)=>s+x,0)/Math.max(1,a.length);
function ciclo(now){
  const ini = performance.now();
  T = Math.max(0, (ini - t0)/1000);
  info = modo === 'scena' ? scena(T) : (schedaMascotte(T), null);
  tempi.push(performance.now() - ini); if(tempi.length > 30) tempi.shift();
  if(ultimo){ scatti.push(now - ultimo); if(scatti.length > 30) scatti.shift(); } ultimo = now;
  document.getElementById('hud').innerHTML = info ? `<span>📅 Giorno ${info.giorno} ${meteoIc[info.meteo]}</span><span>${info.notte ? '🌙' : '🕗'} ${String(Math.floor(info.ora)).padStart(2,'0')}:00</span>` +
    (info.persi ? `<span>😞 ${info.persi} clienti persi</span>` : '') + (info.camion !== null ? `<span>🚚 arriva tra ${info.camion} h</span>` : '') : '';
  if(++nF % 15 === 0) document.getElementById('perf').innerHTML = `<b>${(1000/media(scatti)).toFixed(0)}</b> immagini/s · ${media(tempi).toFixed(1)} ms per immagine`;
  requestAnimationFrame(ciclo);
}
const $ = s => document.querySelector(s);
$('#b-scene').onclick = () => { modo = 'scena'; $('#b-scene').classList.add('on'); $('#b-sheet').classList.remove('on'); $('#labels').hidden = true; };
$('#b-sheet').onclick = () => { modo = 'scheda'; $('#b-sheet').classList.add('on'); $('#b-scene').classList.remove('on'); $('#labels').hidden = false; };
$('#b-speed').onclick = () => {
  const pos = T / durataGiorno; durataGiorno = durataGiorno === 12 ? 1.5 : 12;
  t0 = performance.now() - pos*durataGiorno*1000;
  $('#b-speed').textContent = durataGiorno === 12 ? '🐢 Rallentato' : '⚡ Ritmo del gioco'; $('#b-speed').classList.toggle('on', durataGiorno !== 12);
};
$('#b-full').onclick = () => { const s = $('#stage'); if(document.fullscreenElement) document.exitFullscreen(); else if(s.requestFullscreen) s.requestFullscreen().catch(()=>{}); };
window.addEventListener('error', e => { $('#perf').textContent = '⚠️ Errore: ' + e.message; });
window.PROVA = { get info(){ return info; }, get fps(){ return 1000/media(scatti); }, get ms(){ return media(tempi); }, set t(v){ t0 = performance.now() - v*1000; } };
document.fonts.ready.then(() => requestAnimationFrame(ciclo));
