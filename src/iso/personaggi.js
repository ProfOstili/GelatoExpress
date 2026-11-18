/* Mascotte (cono gelato), clienti e icona del cono — disegno vettoriale pulito */
function mascotte(sx, sy, s, emo, t){
  const ink = COL.ink, hy = sy - 62*s;
  g.strokeStyle = ink; g.lineWidth = 3.2*s; g.lineCap = 'round';
  const su = emo==='sorpreso' ? -1 : emo==='triste' ? .7 : emo==='preoccupato' ? -.4 : 0;
  const saluto = (emo==='felice' || emo==='fiero') ? Math.sin(t*8)*.6 : 0;
  g.beginPath(); g.moveTo(sx - 14*s, sy - 38*s); g.quadraticCurveTo(sx - 26*s, sy - (34 - su*16)*s, sx - 32*s, sy - (36 - su*28)*s); g.stroke();
  g.beginPath(); g.moveTo(sx + 14*s, sy - 38*s); g.quadraticCurveTo(sx + 26*s, sy - (34 - su*16 + saluto*10)*s, sx + 32*s, sy - (36 - su*28 + saluto*22)*s); g.stroke();
  g.fillStyle = COL.cono; g.beginPath(); g.moveTo(sx - 20*s, sy - 44*s); g.lineTo(sx + 20*s, sy - 44*s); g.lineTo(sx, sy); g.closePath(); g.fill();
  g.save(); g.clip(); g.strokeStyle = COL.conoGriglia; g.lineWidth = 1.6*s;
  for(let k=-4; k<5; k++){ g.beginPath(); g.moveTo(sx + k*9*s, sy - 46*s); g.lineTo(sx + k*9*s + 30*s, sy); g.stroke(); g.beginPath(); g.moveTo(sx + k*9*s, sy - 46*s); g.lineTo(sx + k*9*s - 30*s, sy); g.stroke(); }
  g.restore();
  g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(sx + 4*s, sy - 44*s); g.lineTo(sx + 20*s, sy - 44*s); g.lineTo(sx, sy); g.closePath(); g.fill();
  sfera(sx, hy, 26*s, COL.pallina, .45);
  g.fillStyle = COL.pallina;
  for(const [dx, h] of [[-14, 9], [3, 6], [15, 11]]){ g.beginPath(); g.ellipse(sx + dx*s, hy + 20*s + h*s*.5, 4.2*s, h*s*.6, 0, 0, 7); g.fill(); }
  g.strokeStyle = '#4FA372'; g.lineWidth = 2*s; g.beginPath(); g.moveTo(sx + 1*s, hy - 30*s); g.quadraticCurveTo(sx + 4*s, hy - 40*s, sx + 11*s, hy - 42*s); g.stroke();
  sfera(sx, hy - 28*s, 6.5*s, COL.ciliegia, .5);
  g.fillStyle = ink;
  const occhio = x => {
    if(emo==='fiero'){ g.lineWidth = 2.4*s; g.strokeStyle = ink; g.beginPath(); g.arc(x, hy + 1*s, 4*s, Math.PI*1.1, Math.PI*1.9); g.stroke(); return; }
    const k = emo==='sorpreso' ? 1.3 : 1;
    if(frac(t*.3) < .03){ g.fillRect(x - 4*s, hy - 1*s, 8*s, 2*s); return; }
    g.beginPath(); g.ellipse(x, hy - 2*s, 3.4*s*k, 4.8*s*k, 0, 0, 7); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 1.2*s, hy - 4*s, 1.3*s, 0, 7); g.fill(); g.fillStyle = ink;
  };
  occhio(sx - 9*s); occhio(sx + 9*s);
  g.fillStyle = 'rgba(242,108,140,.45)'; g.beginPath(); g.ellipse(sx - 16*s, hy + 6*s, 4.5*s, 2.6*s, 0, 0, 7); g.ellipse(sx + 16*s, hy + 6*s, 4.5*s, 2.6*s, 0, 0, 7); g.fill();
  g.strokeStyle = ink; g.lineWidth = 2.2*s; g.fillStyle = '#9B3651';
  const my = hy + 9*s;
  if(emo==='felice' || emo==='fiero'){ g.beginPath(); g.moveTo(sx - 6*s, my - 1*s); g.quadraticCurveTo(sx, my + 8*s, sx + 6*s, my - 1*s); g.closePath(); g.fill(); }
  else if(emo==='triste'){ g.beginPath(); g.arc(sx, my + 6*s, 5*s, Math.PI*1.15, Math.PI*1.85); g.stroke(); }
  else if(emo==='sorpreso'){ g.beginPath(); g.ellipse(sx, my + 2*s, 3.4*s, 4.2*s, 0, 0, 7); g.fill(); }
  else if(emo==='preoccupato'){ g.beginPath(); g.moveTo(sx - 6*s, my + 2*s); g.quadraticCurveTo(sx - 3*s, my - 1*s, sx, my + 2*s); g.quadraticCurveTo(sx + 3*s, my + 5*s, sx + 6*s, my + 2*s); g.stroke(); }
  else { g.beginPath(); g.moveTo(sx - 4*s, my + 2*s); g.lineTo(sx + 4*s, my + 1*s); g.stroke(); }
  if(emo==='preoccupato' || emo==='triste'){ g.lineWidth = 2*s; g.beginPath(); g.moveTo(sx - 13*s, hy - 11*s); g.lineTo(sx - 6*s, hy - 13*s); g.moveTo(sx + 6*s, hy - 13*s); g.lineTo(sx + 13*s, hy - 11*s); g.stroke(); }
  const ex = sx + 26*s, ey = hy - 26*s;
  if(emo==='preoccupato' || emo==='triste'){ const dd = frac(t*1.2)*8*s; g.fillStyle = '#7EC8F5'; g.beginPath(); g.moveTo(ex, ey - 7*s + dd); g.quadraticCurveTo(ex + 6*s, ey + 2*s + dd, ex, ey + 4*s + dd); g.quadraticCurveTo(ex - 6*s, ey + 2*s + dd, ex, ey - 7*s + dd); g.fill(); }
  if(emo==='triste'){ const cy = hy - 54*s; g.fillStyle = '#AEB7C8'; [[-10,0,9],[0,-4,11],[11,0,9]].forEach(([dx,dy,r]) => { g.beginPath(); g.arc(sx + dx*s, cy + dy*s, r*s, 0, 7); g.fill(); });
    g.strokeStyle = '#7EC8F5'; g.lineWidth = 2*s; for(let i=0; i<3; i++){ const yy = frac(t*2 + i/3)*14*s; g.beginPath(); g.moveTo(sx + (i-1)*9*s, cy + 9*s + yy); g.lineTo(sx + (i-1)*9*s - 2*s, cy + 14*s + yy); g.stroke(); } }
  if(emo==='sorpreso'){ g.fillStyle = '#F5A623'; g.beginPath(); g.roundRect(ex - 3*s, ey - 16*s, 6*s, 16*s, 3*s); g.fill(); g.beginPath(); g.arc(ex, ey + 6*s, 3.4*s, 0, 7); g.fill(); }
  if(emo==='fiero' || emo==='felice'){ const k = .8 + .2*Math.sin(t*9); stella(ex, ey, 9*s*k, '#FFD66B'); stella(ex + 12*s, ey + 14*s, 5*s*k, '#FFFFFF'); }
  if(emo==='pensieroso') for(let i=0; i<3; i++){ g.fillStyle = ink; g.beginPath(); g.arc(ex - 6*s + i*8*s, ey + (i === Math.floor(t*3) % 3 ? -3*s : 0), 2.4*s, 0, 7); g.fill(); }
}

function stella(x, y, r, col){ g.fillStyle = col; g.beginPath(); for(let i=0; i<8; i++){ const a = -Math.PI/2 + i*Math.PI/4, q = i%2 ? r*.35 : r; i ? g.lineTo(x + Math.cos(a)*q, y + Math.sin(a)*q) : g.moveTo(x + Math.cos(a)*q, y + Math.sin(a)*q); } g.closePath(); g.fill(); }

function cliente(x, y, ci, passo, verso, umore, cono){
  const [sx, sy0] = iso(x, y, .1), col = COL_CLIENTI[ci], s = .85 + hash(ci)*.2;
  const salto = -Math.abs(Math.sin(passo*Math.PI))*4, sy = sy0 + salto;
  ombra(x, y, .1, 13, 5, .18);
  g.save(); g.translate(sx, sy); g.scale(verso, 1);
  g.strokeStyle = COL.ink; g.lineWidth = 3; g.lineCap = 'round';
  const gamba = Math.sin(passo*Math.PI*2)*5;
  g.beginPath(); g.moveTo(-5, -10); g.lineTo(-5 + gamba, -salto); g.moveTo(5, -10); g.lineTo(5 - gamba, -salto); g.stroke();
  sfera(0, -26*s, 16*s, col, .3);
  g.fillStyle = COL.ink; g.beginPath(); g.ellipse(4*s, -30*s, 2*s, 3*s, 0, 0, 7); g.ellipse(11*s, -30*s, 2*s, 3*s, 0, 0, 7); g.fill();
  g.lineWidth = 2; g.beginPath();
  if(umore > 0) g.arc(7.5*s, -25*s, 3.5*s, .2, Math.PI - .2);
  else if(umore < 0) g.arc(7.5*s, -19*s, 3.5*s, Math.PI + .3, -.3);
  else { g.moveTo(5*s, -23*s); g.lineTo(10*s, -23*s); }
  g.stroke();
  if(cono){ g.fillStyle = COL.cono; g.beginPath(); g.moveTo(14*s, -24*s); g.lineTo(22*s, -24*s); g.lineTo(18*s, -12*s); g.fill(); sfera(18*s, -27*s, 5*s, ['#9FE3F0', COL.pallina, '#B8E07A'][ci % 3]); }
  if(umore < 0){ g.fillStyle = '#7EC8F5'; g.beginPath(); g.ellipse(-13*s, -40*s + frac(passo)*3, 2.5*s, 3.6*s, 0, 0, 7); g.fill(); }
  g.restore();
}

function coneIcona(sx, sy, s){
  g.fillStyle = COL.cono; g.beginPath(); g.moveTo(sx - 16*s, sy - 6*s); g.lineTo(sx + 16*s, sy - 6*s); g.lineTo(sx, sy + 34*s); g.fill();
  g.strokeStyle = COL.conoGriglia; g.lineWidth = 1.5*s;
  for(let k=1; k<4; k++){ g.beginPath(); g.moveTo(sx - 16*s + k*8*s, sy - 6*s); g.lineTo(sx - 16*s + k*8*s + 8*s*(1-k/4), sy + 34*s*(k/4)); g.stroke(); }
  sfera(sx, sy - 14*s, 18*s, '#9FE3F0');
}


