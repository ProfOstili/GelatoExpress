/* =====================================================================
   DIORAMA 3D — "Tiny Diorama" per La Gelateria Automatica
   Todi su una sola piastrella sospesa, come un plastico da architetto:
   il fornitore (tappa 1), la strada ad anello (tappa 2), la gelateria (tappa 3),
   la scuola, le mura, la Consolazione, il Duomo e il Palazzo dei Priori.
   Un solo render per fotogramma + un passaggio di post-produzione leggero.

   Richiede: three.js 0.187.0 (window.THREE), src/diorama/kit.js, src/diorama/citta.js
   Uso:   Diorama.monta(contenitore)  poi gli agganci:
          setMeteo, setOra, camion, cliente, setConi, setFinito,
          setVenduto, setStock, nuovoGiorno, setSpeed, posizioneSchermo
   ===================================================================== */
window.Diorama = (() => {
  /* ---------------------------------------------------------------
     STATO (impostato dagli agganci del gioco)
     --------------------------------------------------------------- */
  const stato = {
    meteo: 'sole', meteoK: { pioggia: 0, nuvole: 0 }, ora: 10, bagnato: 0, sboccio: 0.3,
    camion: { attivo: false, kg: 0, ore: 0 }, pila: 0, portaOgni: 4, coni: 0, coniMax: 12, finito: false, venduto: false, stock: 40, stockMax: 100,
    speed: 1, qualita: 'alta', auto: true, manuale: null, inquadratura: 'auto', negozioAuto: true, pausa: false,
    bus: { modo: null, t0: 0 }, rivale: { vis: false, t0: -99 }, corsa: { vis: false, t0: -99 }, ispettore: { vis: false, t0: -99 },
  };
  let R, scena, camera, rt, post, quad, tela, contenitore, avviato = false;
  const O = {};                                                     // tutto ciò che si anima
  const tReale = () => performance.now() / 1000;
  let tGioco = 0, ultimoT = 0;                                      // orologio che segue la velocità (1×, 2×, 4×)
  const eventi = [];                                                // clienti in arrivo

  /* ---------------------------------------------------------------
     MATTONCINI CHE SI MUOVONO: omini a piolo, ombrelli, il gelataio, furgone, sbuffi, faccine
     --------------------------------------------------------------- */
  let GEO = null;
  const geo = () => GEO ??= {
    corpo: new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.185, 0.04], [0.17, 0.3], [0.12, 0.43], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 14),
    testa: new THREE.SphereGeometry(0.15, 14, 10), capelli: new THREE.SphereGeometry(0.162, 14, 8, 0, 7, 0, 1.75),
    cono: new THREE.ConeGeometry(0.07, 0.2, 10), pallina: new THREE.SphereGeometry(0.08, 12, 8), zaino: scatolaGeo(0.27, 0.3, 0.15, 0.05), bretella: scatolaGeo(0.04, 0.26, 0.03, 0.012),
  };
  // un omino a piolo: corpo tornito, testa a pallina, capelli; il gruppo "corpo" si piega e si schiaccia
  function piolo(padre, colore, capelli, s = 1.25) {
    const g = new THREE.Group(); g.scale.setScalar(s); g.userData.vivo = true; padre.add(g);
    const corpo = new THREE.Group(); g.add(corpo);
    metti(corpo, geo().corpo, colore); metti(corpo, geo().testa, PAL.pelle, [0, 0.58, 0]);
    if (capelli) metti(corpo, geo().capelli, capelli, [0, 0.59, -0.012], [-0.35, 0, 0]);
    g.userData.corpo = corpo;
    // l'ombrello, aperto solo quando piove
    const om = new THREE.Group(); om.position.set(0.13, 0, 0.05); om.visible = false; corpo.add(om);
    metti(om, new THREE.CylinderGeometry(0.012, 0.012, 0.62, 5), PAL.scuro, [0, 0.72, 0]);
    metti(om, new THREE.SphereGeometry(0.36, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), [PAL.ardesia, PAL.senape, PAL.foglie[1], '#8a7fb0', '#5f8fae'][Math.floor(hash(colore.length + (capelli || '').length + O.ombrelli.length) * 5)], [-0.13, 1.02, -0.05]).scale.y = 0.5;
    g.userData.ombrello = om; O.ombrelli.push(om);
    return g;
  }
  // le faccine che volano via: occhi a cuore se contento, arrabbiata se resta senza gelato
  function faccina(tipo) {
    return texCanvas(128, 128, (ctx) => {
      ctx.fillStyle = tipo === 'cuori' ? '#ffd34d' : '#ff7a59'; ctx.beginPath(); ctx.arc(64, 64, 58, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.beginPath(); ctx.arc(64, 70, 52, 0.2, Math.PI - 0.2); ctx.fill();
      ctx.strokeStyle = '#5a2d1a'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      if (tipo === 'cuori') {
        ctx.fillStyle = '#ff3d6e';
        for (const x of [42, 86]) { ctx.beginPath(); ctx.moveTo(x, 66); ctx.bezierCurveTo(x - 26, 48, x - 12, 28, x, 42); ctx.bezierCurveTo(x + 12, 28, x + 26, 48, x, 66); ctx.fill(); }
        ctx.beginPath(); ctx.arc(64, 78, 24, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
      } else {
        ctx.fillStyle = '#5a2d1a'; for (const x of [44, 84]) { ctx.beginPath(); ctx.arc(x, 58, 7, 0, 7); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(28, 38); ctx.lineTo(54, 48); ctx.moveTo(100, 38); ctx.lineTo(74, 48); ctx.stroke();
        ctx.beginPath(); ctx.arc(64, 104, 22, 1.2 * Math.PI, 1.8 * Math.PI); ctx.stroke();
      }
    });
  }
  // la campanella della scuola: una campana gialla in 3D con il batacchio e, ai lati, due onde di suono per parte.
  // Sale verso l'alto oscillando e vibrando, mentre le onde pulsano una dopo l'altra. Sta sempre davanti a tutto.
  function campanella3D() {
    const g = new THREE.Group(); g.visible = false; g.renderOrder = 20;
    const sopra = (m, ordine) => { m.material.depthTest = false; m.material.depthWrite = false; m.renderOrder = ordine; m.castShadow = false; m.receiveShadow = false; return m; };
    const oro = () => new THREE.MeshStandardMaterial({ color: '#ffc63a', roughness: 0.45, emissive: '#ffb21a', emissiveIntensity: 0.25, transparent: true });
    const corpo = new THREE.Group(); g.add(corpo);                    // oscilla intorno al gancio in alto
    const profilo = [[0, -0.02], [0.34, -0.02], [0.37, 0.03], [0.33, 0.08], [0.25, 0.18], [0.21, 0.32], [0.2, 0.44], [0.16, 0.55], [0.08, 0.61], [0, 0.62]];
    const campana = new THREE.Mesh(new THREE.LatheGeometry(profilo.map(([a, b]) => new THREE.Vector2(a, b - 0.62)), 28), oro()); corpo.add(sopra(campana, 22));
    const pomello = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.06, 4, 10), oro()); pomello.position.y = 0.04; corpo.add(sopra(pomello, 22));
    const batacchio = new THREE.Group(); batacchio.position.y = -0.62; corpo.add(batacchio);
    const palla = new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), new THREE.MeshStandardMaterial({ color: '#f29a1e', roughness: 0.45, transparent: true })); palla.position.y = -0.06; batacchio.add(sopra(palla, 21));
    // le onde del suono: archi azzurri ai due lati
    const onde = [];
    for (const lato of [1, -1]) for (const [r, k] of [[0.55, 0], [0.75, 1]]) {
      const arco = 1.05, m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 8, 20, arco), new THREE.MeshBasicMaterial({ color: '#9db4ff', transparent: true, fog: false }));
      m.rotation.z = lato > 0 ? -arco / 2 : Math.PI - arco / 2; m.position.y = -0.3;
      g.add(sopra(m, 23)); onde.push({ m, k });
    }
    g.userData = { vivo: true, corpo, batacchio, onde, materiali: [campana.material, pomello.material, palla.material, ...onde.map((o) => o.m.material)] };
    return g;
  }
  const grandezzaSegni = () => (W && schermoPiccolo() ? 1 + 0.7 * clamp((CAM.z - 0.5) / 0.5) : 1);
  function suonaCampanella(x, y, z) {
    const c = O.campane.find((q) => !q.visible); if (!c) return;
    Object.assign(c.userData, { t0: tReale(), x, y, z }); c.visible = true;
  }
  function aggiornaCampane(t) {
    O.campane.forEach((c) => {
      if (!c.visible) return;
      const d = c.userData, u = (t - d.t0) / 3.6;
      if (u >= 1) { c.visible = false; return; }
      c.position.set(d.x + Math.sin(t * 2.2) * 0.15, d.y + easeInOut(u) * 8.5, d.z);
      c.quaternion.copy(camera.quaternion);                              // guarda sempre chi osserva
      c.scale.setScalar(1.2 * grandezzaSegni() * Math.max(0.001, easeOutBack(clamp(u * 5))));
      d.corpo.rotation.z = Math.sin(t * 16) * 0.32;                       // dondola
      d.corpo.position.x = Math.sin(t * 55) * 0.012;                      // e vibra
      d.batacchio.rotation.z = Math.sin(t * 16 - 0.9) * 0.45;
      d.onde.forEach(({ m, k }) => { const f = ((t * 2.6 - k * 0.45) % 1 + 1) % 1;   // ogni onda si allarga e svanisce, le esterne dopo le interne
        m.scale.setScalar(0.8 + 0.4 * f); m.material.opacity = Math.sin(Math.PI * f) * (1 - liscio(0.85, 1, u)); });
      d.materiali.slice(0, 3).forEach((mt) => { mt.opacity = 1 - liscio(0.85, 1, u); });
    });
  }
  function emetti(tipo, x, y, z) {
    const f = O.faccine.find((q) => !q.visible); if (!f) return;
    f.material = tipo === 'cuori' ? O.matCuori : O.matRabbia; f.visible = true;
    f.userData = { vivo: true, t0: tReale(), x, y, z, fase: hash(x, z) * 6 };
  }
  function cono(padre) {
    const g = new THREE.Group(); padre.add(g);
    metti(g, geo().cono, PAL.cialda, [0, -0.1, 0], [Math.PI, 0, 0]); metti(g, geo().pallina, PAL.accento, [0, 0.02, 0]);
    return g;
  }
  // il gelataio: un cono gelato vivente (la nostra mascotte), con gli occhi e la ciliegina
  function mascotte(padre) {
    const g = new THREE.Group(); g.userData.vivo = true; padre.add(g);
    const corpo = new THREE.Group(); g.add(corpo);
    metti(corpo, new THREE.LatheGeometry([[0, 0], [0.05, 0.02], [0.24, 0.62], [0.27, 0.66], [0, 0.66]].map(([x, y]) => new THREE.Vector2(x, y)), 16), PAL.cialda);
    metti(corpo, new THREE.SphereGeometry(0.31, 18, 14), PAL.accento, [0, 0.86, 0]);
    metti(corpo, new THREE.TorusGeometry(0.27, 0.06, 8, 20), PAL.accento, [0, 0.68, 0], [Math.PI / 2, 0, 0]);
    metti(corpo, new THREE.SphereGeometry(0.08, 10, 8), '#e2465e', [0.02, 1.2, 0.02]);
    for (const s of [-1, 1]) metti(corpo, new THREE.SphereGeometry(0.04, 8, 6), PAL.scuro, [s * 0.1, 0.9, 0.27]);
    const bocca = metti(corpo, new THREE.TorusGeometry(0.06, 0.016, 6, 12, Math.PI), PAL.scuro, [0, 0.8, 0.29], [0, 0, Math.PI]);
    g.userData = { vivo: true, corpo, bocca };
    return g;
  }
  // il furgoncino: una sagoma estrusa di lato, quattro ruote, vetri, fari e portellone. x locale = "avanti".
  function furgone(padre, colore) {
    const g = new THREE.Group(), corpo = new THREE.Group(); g.userData.vivo = true; g.scale.setScalar(1.55); padre.add(g); g.add(corpo);
    metti(corpo, prisma([[-0.92, 0.2], [0.92, 0.2], [0.94, 0.52], [0.68, 0.61], [0.4, 1.05], [-0.92, 1.05]], [0.08, 0.1, 0.1, 0.05, 0.14, 0.12], 0.86, 0.06), colore);
    const vetro = vernice(PAL.vetro, 0.6), n = new THREE.Vector3(0.44, 0.28, 0).normalize();
    metti(corpo, scatolaGeo(0.4, 0.035, 0.7, 0.015), vetro, [0.54 + n.x * 0.01, 0.83 + n.y * 0.01, 0], [0, 0, Math.atan2(0.44, -0.28) - Math.PI], false);   // parabrezza: lastra sulla falda del muso
    for (const s of [1, -1]) {
      const rot = [0, s > 0 ? 0 : Math.PI, 0];
      metti(corpo, rettangoloGeo(0.3, 0.26, 0.05), vetro, [0.2, 0.83, s * 0.432], rot, false);
      metti(corpo, rettangoloGeo(1.5, 0.09, 0.03), PAL.crema, [-0.1, 0.44, s * 0.432], rot, false);
      metti(corpo, rettangoloGeo(0.46, 0.4, 0.05), PAL.crema, [-0.42, 0.78, s * 0.432], rot, false);
      const c = new THREE.Group(); c.position.set(-0.42, 0.78, s * 0.44); c.rotation.y = rot[1]; corpo.add(c);       // un cono dipinto sulla fiancata
      metti(c, new THREE.CircleGeometry(0.09, 20), PAL.accento, [0, 0.06, 0.002], null, false);
      metti(c, new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.08, 0.02), new THREE.Vector2(0.08, 0.02), new THREE.Vector2(0, -0.16)])), PAL.cialda, [0, 0, 0.001], null, false);
    }
    metti(corpo, scatolaGeo(0.09, 0.1, 0.82, 0.03), PAL.ardesia, [0.93, 0.27, 0]); metti(corpo, scatolaGeo(0.09, 0.1, 0.82, 0.03), PAL.ardesia, [-0.92, 0.25, 0]);
    const fari = luminosa('#fff3d6', '#fff0c8'); for (const s of [1, -1]) metti(corpo, new THREE.CylinderGeometry(0.065, 0.065, 0.04, 14), fari, [0.945, 0.42, s * 0.28], [0, 0, Math.PI / 2]);
    metti(corpo, rettangoloGeo(0.72, 0.62, 0.05), PAL.scuro, [-0.923, 0.64, 0], [0, -Math.PI / 2, 0], false);
    const portellone = new THREE.Group(); portellone.position.set(-0.94, 1.0, 0); corpo.add(portellone);
    metti(portellone, scatolaGeo(0.05, 0.74, 0.76, 0.025), colore, [0, -0.37, 0]); metti(portellone, scatolaGeo(0.02, 0.2, 0.44, 0.01), PAL.vetro, [-0.02, -0.2, 0]);
    const ruote = [];
    for (const [x, z] of [[0.56, 0.37], [0.56, -0.37], [-0.56, 0.37], [-0.56, -0.37]]) {
      const w = new THREE.Group(); w.position.set(x, 0.2, z); g.add(w); ruote.push(w);
      metti(w, new THREE.CylinderGeometry(0.2, 0.2, 0.17, 18), PAL.scuro, [0, 0, 0], [Math.PI / 2, 0, 0]);
      metti(w, new THREE.CylinderGeometry(0.1, 0.1, 0.19, 12), PAL.crema, [0, 0, 0], [Math.PI / 2, 0, 0]);
      metti(w, new THREE.CylinderGeometry(0.028, 0.028, 0.2, 6), PAL.scuro, [0.055, 0, 0], [Math.PI / 2, 0, 0]);
    }
    const carico = new THREE.Group(); corpo.add(carico);
    metti(carico, scatolaGeo(0.5, 0.36, 0.6, 0.03), PAL.cartone, [-0.62, 0.42, 0]);
    return { g, corpo, portellone, ruote, fari, carico };
  }
  // sbuffi: palline bianche opache che si gonfiano, salgono e spariscono
  function sbuffi(padre, n) {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 12, 8), vernice(PAL.fumo, 0.95), n); m.castShadow = true; m.frustumCulled = false; m.userData.vivo = true; padre.add(m);
    const o = new THREE.Object3D();
    return { m, set(i, at, eta, opz) {
      const s = eta <= 0 || eta >= 1 ? 1e-4 : opz.size * liscio(0, 0.3, eta) * (1 - liscio(0.55, 1, eta)) * (0.7 + 0.5 * eta);
      o.position.set(at[0] + (opz.drift || 0) * eta * eta, at[1] + opz.rise * eta, at[2] + (opz.driftZ || 0) * eta); o.scale.setScalar(Math.max(s, 1e-4)); o.updateMatrix(); m.setMatrixAt(i, o.matrix);
    } };
  }
  // il pullman dei turisti: lungo, azzurro, con la fascia dei finestrini. x locale = "avanti", la porta sul lato del marciapiede (-z)
  function autobus(padre) {
    const g = new THREE.Group(), corpo = new THREE.Group(); g.userData.vivo = true; g.visible = false; padre.add(g); g.add(corpo);
    const col = '#5f8fae', vetro = vernice(PAL.vetro, 0.5);
    metti(corpo, scatolaGeo(3.1, 0.98, 0.96, 0.16), col, [0, 0.73, 0]);
    metti(corpo, scatolaGeo(2.9, 0.1, 0.86, 0.05), PAL.crema, [-0.05, 1.25, 0]);                 // il tetto chiaro
    metti(corpo, scatolaGeo(2.62, 0.36, 0.98, 0.05), vetro, [-0.16, 0.93, 0]);                     // i finestrini
    for (const x of [-1.05, -0.5, 0.05, 0.6]) metti(corpo, scatolaGeo(0.07, 0.37, 0.99, 0.01), col, [x, 0.93, 0]);
    metti(corpo, scatolaGeo(0.06, 0.52, 0.84, 0.03), vetro, [1.53, 0.86, 0]);                      // il parabrezza
    metti(corpo, scatolaGeo(3.12, 0.1, 0.98, 0.04), PAL.senape, [0, 0.52, 0]);                     // la fascia gialla
    metti(corpo, scatolaGeo(0.36, 0.68, 0.02, 0.02), vetro, [1.12, 0.62, -0.49]);                  // la porta, dal lato del marciapiede
    const fari = luminosa('#fff3d6', '#fff0c8'); fari.emissiveIntensity = 1.2;
    for (const s of [1, -1]) metti(corpo, new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), fari, [1.56, 0.38, s * 0.32], [0, 0, Math.PI / 2]);
    const ruote = [];
    for (const [x, z] of [[1.0, 0.42], [1.0, -0.42], [-1.0, 0.42], [-1.0, -0.42]]) {
      const w = new THREE.Group(); w.position.set(x, 0.21, z); g.add(w); ruote.push(w);
      metti(w, new THREE.CylinderGeometry(0.21, 0.21, 0.16, 18), PAL.scuro, [0, 0, 0], [Math.PI / 2, 0, 0]);
      metti(w, new THREE.CylinderGeometry(0.1, 0.1, 0.18, 12), PAL.crema, [0, 0, 0], [Math.PI / 2, 0, 0]);
    }
    return { g, corpo, ruote };
  }
  // il chiosco della Gelateria Rivale (la concorrenza): un carretto a righe con l'ombrellone e il cartello del prezzo
  function chiosco(padre) {
    const g = new THREE.Group(), corpo = new THREE.Group(); g.userData.vivo = true; g.visible = false; g.position.set(RIVALE.x, 0.02, RIVALE.y); padre.add(g); g.add(corpo);
    metti(corpo, scatolaGeo(0.92, 0.52, 0.5, 0.06), '#8fbcd4', [0, 0.44, 0]);
    for (const x of [-0.3, -0.1, 0.1, 0.3]) metti(corpo, scatolaGeo(0.09, 0.5, 0.01, 0.005), '#ffffff', [x, 0.44, 0.255], null, false);
    metti(corpo, scatolaGeo(0.98, 0.07, 0.56, 0.03), PAL.crema, [0, 0.73, 0]);
    for (const x of [-0.32, 0.32]) { const w = metti(corpo, new THREE.CylinderGeometry(0.13, 0.13, 0.06, 14), PAL.scuro, [x, 0.13, 0.27], [Math.PI / 2, 0, 0]); w.castShadow = false; }
    for (const [x, c] of [[-0.25, PAL.menta], [0, PAL.pistacchio], [0.25, PAL.cioccolato]]) { const k = new THREE.Group(); k.position.set(x, 0.88, 0.05); corpo.add(k); metti(k, geo().cono, PAL.cialda, [0, -0.07, 0], [Math.PI, 0, 0]); metti(k, geo().pallina, c, [0, 0.04, 0]); }
    metti(corpo, new THREE.CylinderGeometry(0.02, 0.02, 1.05, 6), PAL.scuro, [0.36, 1.2, -0.14]);
    metti(corpo, new THREE.SphereGeometry(0.62, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#5f8fae', [0.36, 1.62, -0.14]).scale.y = 0.42;
    const cartello = texCanvas(512, 200, (ctx, W, H) => {
      ctx.fillStyle = '#2a2433'; ctx.beginPath(); ctx.roundRect(4, 4, W - 8, H - 8, 30); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#9fd3ee'; ctx.font = fontGrassetto(56); ctx.fillText('RIVALE', W / 2, 58);
      ctx.fillStyle = '#fff6e6'; ctx.font = fontGrassetto(92); ctx.fillText('2,50 €', W / 2, 138);
    });
    metti(corpo, rettangoloGeo(0.78, 0.31, 0.04), new THREE.MeshStandardMaterial({ map: cartello, roughness: 0.6, emissive: '#ffffff', emissiveMap: cartello, emissiveIntensity: 0.25 }), [-0.08, 1.1, 0.08], null, false);
    cartellone(g, ['GELATI', 'PIÙ BUONI!'], '#5f8fae', '#ffffff', -0.45, -0.8, 1.9, 0.8, 2.0);        // il cartellone dietro il chiosco della concorrenza
    return { g, corpo };
  }
  // il robot della gelateria: dietro la vetrina prepara i coni, giorno e notte (è lui che segue le regole del gioco)
  function robot(padre) {
    const { x0, x1, z0, p } = VETRINA, fy = GEL.y + GEL.d;
    // la macchina del gelato a sinistra, il vassoio dei coni a destra
    const mac = new THREE.Group(); mac.position.set(x0 + 0.3, z0 + 0.02, fy - p + 0.3); padre.add(mac);
    metti(mac, scatolaGeo(0.42, 0.56, 0.36, 0.05), '#9cc3d6', [0, 0.28, 0]);
    metti(mac, scatolaGeo(0.3, 0.14, 0.04, 0.02), PAL.scuro, [0, 0.42, 0.18]);
    for (const [dx, c] of [[-0.09, PAL.accento], [0.09, PAL.pistacchio]]) { metti(mac, new THREE.CylinderGeometry(0.035, 0.02, 0.12, 8), PAL.crema, [dx, 0.2, 0.2]); metti(mac, new THREE.SphereGeometry(0.03, 8, 6), c, [dx, 0.47, 0.205]); }
    const vass = new THREE.Group(); vass.position.set(x1 - 0.28, z0 + 0.02, fy - p + 0.45); padre.add(vass);
    metti(vass, scatolaGeo(0.4, 0.06, 0.24, 0.02), PAL.crema, [0, 0.03, 0]);
    const coni = [-0.12, 0, 0.12].map((dx) => cono(vass)).map((k, i) => { k.position.set([-0.12, 0, 0.12][i], 0.18, 0); k.scale.setScalar(0.9); k.userData.vivo = true; return k; });
    // il robot: ruote, corpo, testa con gli occhi luminosi e l'antenna, due braccia a pinza
    const g = new THREE.Group(); g.userData.vivo = true; g.scale.setScalar(1.15); padre.add(g);
    const grigio = '#d5dce4', occhi = new THREE.MeshStandardMaterial({ color: '#5ff2ff', emissive: '#5ff2ff', emissiveIntensity: 1.5 });
    const luce = new THREE.MeshStandardMaterial({ color: PAL.accento, emissive: PAL.accento, emissiveIntensity: 1.5 });
    metti(g, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 16), PAL.scuro, [0, 0.04, 0]);
    const corpo = new THREE.Group(); g.add(corpo);
    metti(corpo, scatolaGeo(0.34, 0.3, 0.24, 0.07), grigio, [0, 0.25, 0]);
    metti(corpo, scatolaGeo(0.18, 0.12, 0.02, 0.02), PAL.accento, [0, 0.27, 0.12]);
    const testa = new THREE.Group(); testa.position.y = 0.48; corpo.add(testa);
    metti(testa, scatolaGeo(0.3, 0.2, 0.22, 0.07), grigio, [0, 0.06, 0]);
    metti(testa, scatolaGeo(0.24, 0.1, 0.02, 0.03), PAL.scuro, [0, 0.07, 0.11]);
    const oc = [-0.06, 0.06].map((dx) => metti(testa, new THREE.SphereGeometry(0.025, 10, 8), occhi, [dx, 0.07, 0.122], null, false));
    metti(testa, new THREE.CylinderGeometry(0.01, 0.01, 0.12, 6), PAL.scuro, [0, 0.22, 0]);
    metti(testa, new THREE.SphereGeometry(0.035, 10, 8), luce, [0, 0.29, 0], null, false);
    const braccia = [-1, 1].map((s) => {
      const b = new THREE.Group(); b.position.set(s * 0.2, 0.36, 0); corpo.add(b);
      metti(b, new THREE.CylinderGeometry(0.03, 0.03, 0.22, 8), PAL.ardesia, [0, -0.1, 0]);
      metti(b, new THREE.SphereGeometry(0.045, 10, 8), PAL.scuro, [0, -0.22, 0]);
      return b;
    });
    const inMano = cono(braccia[1]); inMano.position.set(0, -0.3, 0.04); inMano.scale.setScalar(0.9);
    return { g, corpo, testa, braccia, occhi: oc, luce, inMano, coni, da: x0 + 0.62, a: x1 - 0.62, y: fy - p + 0.42, z: z0 + 0.02 };
  }
  function aggiornaRobot(t) {
    const r = O.robot, T = 3.4, u = (tGioco / T) % 1, giro = Math.floor(tGioco / T);
    // 0-0.3 riempie il cono alla macchina · 0.3-0.5 va al vassoio · 0.5-0.75 posa il cono · 0.75-1 torna
    const k = u < 0.3 ? 0 : u < 0.5 ? easeInOut((u - 0.3) / 0.2) : u < 0.75 ? 1 : 1 - easeInOut((u - 0.75) / 0.25);
    r.g.position.set(lerp(r.da, r.a, k), r.z + Math.abs(Math.sin(tGioco * 14)) * 0.012 * (u > 0.3 && u < 0.5 || u > 0.75 ? 1 : 0), r.y);
    r.g.rotation.y = u < 0.3 ? -0.5 : u < 0.5 ? 0.25 : u < 0.75 ? 0.5 : -0.25;
    const alza = u < 0.3 ? Math.sin(u / 0.3 * Math.PI) : u > 0.5 && u < 0.75 ? Math.sin((u - 0.5) / 0.25 * Math.PI) : 0;
    r.braccia[0].rotation.x = -1.2 * alza; r.braccia[1].rotation.x = -1.2 * alza + 0.1 * Math.sin(tGioco * 3);
    r.testa.rotation.z = Math.sin(tGioco * 2.1) * 0.1;
    r.inMano.visible = u > 0.15 && u < 0.62;
    const n = giro % 4;                                                // il vassoio si riempie e si svuota (i coni vanno ai clienti)
    r.coni.forEach((c, i) => { c.visible = i < n || (i === n && u > 0.62); });
    const lamp = (tReale() * 1.3) % 1 < 0.08;                          // ogni tanto sbatte le palpebre
    r.occhi.forEach((o) => { o.scale.y = lamp ? 0.2 : 1; });
    r.luce.emissiveIntensity = 0.8 + 1.2 * (Math.sin(tGioco * 5) > 0 ? 1 : 0.2);
  }
  // un cartellone pubblicitario su due pali (x, z locali nel gruppo padre; guarda chi osserva)
  function cartellone(padre, righe, fondo, colore, x, z, w = 1.5, h = 0.62, alto = 1.25) {
    const g = new THREE.Group(); g.position.set(x, 0, z); padre.add(g);
    for (const s of [-1, 1]) metti(g, new THREE.CylinderGeometry(0.035, 0.035, alto, 8), PAL.ardesia, [s * w * 0.38, alto / 2, -0.03]);
    metti(g, scatolaGeo(w + 0.08, h + 0.08, 0.06, 0.03), PAL.scuro, [0, alto + h / 2 - 0.05, -0.04]);
    const tex = texCanvas(768, Math.round(768 * h / w), (ctx, W, H) => {
      ctx.fillStyle = fondo; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colore; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const fs = Math.min(H / (righe.length + 0.4), 120); ctx.font = fontGrassetto(fs);
      righe.forEach((r, i) => ctx.fillText(r, W / 2, H / 2 + (i - (righe.length - 1) / 2) * fs * 1.02, W * 0.92));
    });
    metti(g, rettangoloGeo(w, h, 0.03), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.15 }), [0, alto + h / 2 - 0.05, 0], null, false);
    return g;
  }
  // il fumetto sopra la testa dei turisti: la bandiera e il saluto nella loro lingua
  function fumetto(lingua) {
    return texCanvas(256, 210, (ctx, W) => {
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#3a4150'; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.roundRect(8, 8, W - 16, 150, 34); ctx.moveTo(108, 156); ctx.lineTo(128, 200); ctx.lineTo(150, 156); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(112, 146, 34, 14);
      const fx = 68, fy = 24, fw = 120, fh = 72;
      if (lingua === 'fr') { [['#2b4ea2', 0], ['#ffffff', 1], ['#e4343e', 2]].forEach(([c, i]) => { ctx.fillStyle = c; ctx.fillRect(fx + i * fw / 3, fy, fw / 3 + 1, fh); }); }
      else {
        ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
        ctx.fillStyle = '#26418f'; ctx.fillRect(fx, fy, fw, fh);
        const diag = (c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + fw, fy + fh); ctx.moveTo(fx + fw, fy); ctx.lineTo(fx, fy + fh); ctx.stroke(); };
        diag('#ffffff', 16); diag('#d8303d', 6);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(fx + fw / 2 - 12, fy, 24, fh); ctx.fillRect(fx, fy + fh / 2 - 12, fw, 24);
        ctx.fillStyle = '#d8303d'; ctx.fillRect(fx + fw / 2 - 7, fy, 14, fh); ctx.fillRect(fx, fy + fh / 2 - 7, fw, 14);
        ctx.restore();
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 3; ctx.strokeRect(fx, fy, fw, fh);
      ctx.fillStyle = '#272b36'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = fontGrassetto(40);
      ctx.fillText(lingua === 'fr' ? 'Bonjour!' : 'Hello!', W / 2, 126);
    });
  }
  const saltello = (u, da, a, alt) => { u = clamp(u); const e = easeInOut(u); return [da[0] + (a[0] - da[0]) * e, alt * Math.sin(Math.PI * u), da[1] + (a[1] - da[1]) * e]; };

  /* ---------------------------------------------------------------
     COSTRUZIONE DELLA SCENA
     --------------------------------------------------------------- */
  function costruisci() {
    scena = new THREE.Scene();
    scena.background = new THREE.Color(PAL.sfondo);
    scena.fog = new THREE.Fog(PAL.sfondo, 1e4, 2e4);
    camera = new THREE.PerspectiveCamera(20, 16 / 9, 5, 400);

    // luce: un sole caldo e morbido davanti a sinistra, un cielo freddo che riempie
    ambiente();
    O.sole = new THREE.DirectionalLight('#ffe3c0', 3.0); O.sole.castShadow = true;
    const c = O.sole.shadow.camera; c.left = -17; c.right = 17; c.top = 17; c.bottom = -17; c.near = 1; c.far = 90;
    O.sole.shadow.mapSize.setScalar(2048); O.sole.shadow.bias = -0.0005; O.sole.shadow.normalBias = 0.03; O.sole.shadow.radius = 4;
    scena.add(O.sole, O.sole.target);
    O.cielo = new THREE.HemisphereLight('#bcd3ff', '#9db39a', 0.9); scena.add(O.cielo);
    O.lunetta = new THREE.DirectionalLight('#a9c0ff', 0); O.lunetta.position.set(12, 20, -8); scena.add(O.lunetta);

    // la carta su cui poggia il plastico, con l'ombra della piastrella dipinta (sempre morbida)
    const FLOOR = -PIASTRA.spessore - 3.2;
    O.carta = metti(scena, new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: PAL.sfondo }), [0, FLOOR, 0], [-Math.PI / 2, 0, 0], false);
    O.ombraTile = metti(scena, new THREE.PlaneGeometry(PIASTRA.w + 12, PIASTRA.d + 12), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: texCanvas(512, 512, (ctx, W) => {
      const sx = W / (PIASTRA.w + 12), sz = W / (PIASTRA.d + 12); ctx.filter = 'blur(22px)'; ctx.fillStyle = 'rgba(38,62,92,0.5)'; ctx.beginPath(); ctx.roundRect(6 * sx, 6 * sz, PIASTRA.w * sx, PIASTRA.d * sz, 40); ctx.fill();
    }) }), [2.6, FLOOR + 0.02, -1.4], [-Math.PI / 2, 0, 0], false);

    // il mondo: un perno che oscilla piano, e dentro la città spostata al centro
    O.perno = new THREE.Group(); scena.add(O.perno);
    const L = O.L = new THREE.Group(); L.position.set(-PIASTRA.cx, 0, -PIASTRA.cy); O.perno.add(L);
    O.ombrelli = [];
    costruisciCitta(L, O);

    // i due furgoncini color accento: quello che viaggia e quello che aspetta al fornitore
    O.furgone = furgone(L, PAL.accento);
    O.fumo = sbuffi(L, 20);
    O.scia = [];
    O.casseVolanti = [0, 1, 2, 3, 4].map(() => { const c = new THREE.Group(); c.userData.vivo = true; c.visible = false; L.add(c); metti(c, scatolaGeo(0.42, 0.32, 0.36, 0.035), PAL.cartone); metti(c, scatolaGeo(0.08, 0.326, 0.366, 0.01), PAL.crema); return c; });

    // i clienti, i ragazzi della scuola, il gelataio-mascotte
    const colori = [PAL.ardesia, PAL.senape, PAL.foglie[1], '#e8dcc8', PAL.cartone, '#8a7fb0', '#5f8fae'];
    const capelli = [PAL.tronco, '#3a2c25', '#d9b26a', null, '#5a3b2c', '#2b2b33', null];
    O.clienti = Array.from({ length: 40 }, (_, i) => { const p = piolo(L, colori[i % colori.length], capelli[(i + 2) % capelli.length]); p.visible = false; p.userData.cono = cono(p.userData.corpo); p.userData.cono.position.set(0.16, 0.5, 0.08); return p; });
    O.ragazzi = Array.from({ length: 8 }, (_, i) => {
      const p = piolo(L, [PAL.ardesia, '#5f8fae', PAL.senape, '#8a7fb0'][i % 4], capelli[i % capelli.length] || PAL.tronco, 0.95), col = [PAL.accento, PAL.foglie[0], PAL.senape, '#5f8fae'][(i + 1) % 4];
      // lo zaino sulle spalle, con le bretelle che passano davanti
      metti(p.userData.corpo, geo().zaino, col, [0, 0.3, -0.2]); metti(p.userData.corpo, scatolaGeo(0.2, 0.1, 0.05, 0.02), col, [0, 0.2, -0.29]);
      for (const sx of [-0.08, 0.08]) metti(p.userData.corpo, geo().bretella, PAL.scuro, [sx, 0.32, 0.15], [-0.15, 0, 0]);
      p.visible = false; return p;
    });
    O.gelataio = mascotte(L);
    O.passante = piolo(L, PAL.foglie[1], PAL.tronco); O.passante.position.set(4.0, 0.25, 7.5); O.passante.userData.corpo.rotation.x = 0.05;   // seduto sulla panchina
    // i turisti hanno il fumetto con la bandiera; il pullman li porta in cima alla strada; il chiosco della concorrenza nel giardino
    O.matHello = new THREE.SpriteMaterial({ map: fumetto('gb'), depthTest: false, depthWrite: false, fog: false });
    O.matBonjour = new THREE.SpriteMaterial({ map: fumetto('fr'), depthTest: false, depthWrite: false, fog: false });
    O.clienti.forEach((p) => { const f = new THREE.Sprite(O.matHello); f.position.set(0, 1.36, 0); f.scale.set(0.78, 0.64, 1); f.renderOrder = 19; f.visible = false; p.add(f); p.userData.fumetto = f; });
    // 🏅 la corsa dei Giochi studenteschi: atleti con il pettorale che girano sulla strada ad anello, e l'arco del traguardo
    O.atleti = ['#e04a58', '#44718a', '#f0b040', '#5fa574', '#8a7fd0', '#ff6fa5'].map((c, i) => {
      const a = piolo(L, c, capelli[i % capelli.length] || PAL.tronco, 1.15); a.visible = false;
      metti(a.userData.corpo, scatolaGeo(0.17, 0.13, 0.02, 0.01), '#ffffff', [0, 0.3, 0.165], [-0.15, 0, 0], false);
      return a;
    });
    // l'arco del traguardo, sulla strada di sinistra (di fronte a chi guarda)
    O.traguardo = new THREE.Group(); O.traguardo.userData.vivo = true; O.traguardo.visible = false; O.traguardo.position.set(xS, 0, 4.6); L.add(O.traguardo);
    for (const x of [-1.0, 1.0]) metti(O.traguardo, new THREE.CylinderGeometry(0.05, 0.05, 2.0, 8), PAL.ardesia, [x, 1.0, 0]);
    const texT = texCanvas(512, 96, (ctx, W, H) => {
      for (let i = 0; i < 32; i++) for (let j = 0; j < 6; j++) { ctx.fillStyle = (i + j) % 2 ? '#272b36' : '#ffffff'; ctx.fillRect(i * 16, j * 16, 16, 16); }   // solo la bandiera a scacchi
    });
    metti(O.traguardo, new THREE.PlaneGeometry(2.1, 0.4), new THREE.MeshStandardMaterial({ map: texT, side: THREE.DoubleSide, roughness: 0.7 }), [0, 1.8, 0], null, false);
    cartellone(O.traguardo, ['GIOCHI', 'STUDENTESCHI'], '#ff6fa5', '#ffffff', -2.05, -0.45, 1.6, 0.8, 1.0);     // a lato della strada, vicino all'arrivo
    // 🕵️ l'ispettore dell'ASL: camice bianco e cartellina
    O.ispettore = piolo(L, '#f4f4f2', '#2b2b33', 1.25); O.ispettore.visible = false;
    metti(O.ispettore.userData.corpo, scatolaGeo(0.16, 0.2, 0.02, 0.01), PAL.cartone, [0.12, 0.3, 0.17], [-0.4, 0, 0], false);
    metti(O.ispettore.userData.corpo, scatolaGeo(0.12, 0.14, 0.01, 0.005), '#ffffff', [0.12, 0.3, 0.183], [-0.4, 0, 0], false);
    O.bus = autobus(L);
    O.robot = robot(L);
    O.chiosco = chiosco(L);

    // la pioggia: trattini sottili che cadono; pozzanghere lucide che si allargano
    // gocce abbastanza spesse da vedersi anche da lontano, e uno spruzzo (un anellino) quando toccano terra
    const NP = 460;
    O.gocce = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.6, 5), new THREE.MeshBasicMaterial({ color: '#e8f1fb', transparent: true, opacity: 0.8, fog: false }), NP);
    O.spruzzi = new THREE.InstancedMesh(new THREE.RingGeometry(0.7, 1, 16).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8f1fb', transparent: true, opacity: 0.7, fog: false, depthWrite: false }), NP);
    O.spruzzi.frustumCulled = false; O.spruzzi.visible = false; O.spruzzi.userData.vivo = true; L.add(O.spruzzi);
    O.gocce.frustumCulled = false; O.gocce.visible = false; O.gocce.userData.vivo = true; L.add(O.gocce);
    const rg = rng(99), quota = (x, y) => (y < -1 ? 0 : x > 7 && x < 17.6 && y < 2.4 ? Z3 : x > 2.2 && x < 17.6 && y < 5.4 ? Z2 : 0);
    O.goccePos = Array.from({ length: NP }, () => { const x = rg.range(PIASTRA.x0 + 0.4, PIASTRA.x1 - 0.4), y = rg.range(PIASTRA.y0 + 0.4, PIASTRA.y1 - 0.4); return [x, rg(), y, rg.range(0.85, 1.2), quota(x, y)]; });
    const matPozza = new THREE.MeshStandardMaterial({ color: PAL.acqua, roughness: 0.06, metalness: 0.1, envMapIntensity: 1.6, transparent: true, opacity: 0.9 });
    O.pozze = POZZE.map(([x, y, z, s]) => { const m = metti(L, loft(anello(s * 2.4, s * 1.5, s * 0.7, 6), [[0, 0.06, 0]]), matPozza, [x, z, y], [0, hash(x, y) * 3, 0], false); m.userData.vivo = true; m.scale.setScalar(0.001); return m; });

    // gli edifici alti (x0, x1, y0, y1, cima): le nuvole non devono mai attraversarli
    const EDIFICI = [[-3.5, -0.4, -1.5, 2.2, 2.8], [2.0, 6.8, 0.2, 5.0, 6.2], [7.8, 11.6, -1.0, 2.4, 7.9], [11.5, 13.2, -0.8, 2.0, 7.3], [13.2, 17.3, -0.8, 2.2, 8.4],
      [6.9, 8.0, 1.6, 2.7, 4.1], [10.7, 13.3, 1.9, 2.9, 4.2], [6.5, 11.1, 5.2, 8.6, 5.5], [12.8, 17.6, 5.2, 8.2, 4.9]];
    // alza la nuvola (x, y = pianta, z = quota, s = grandezza) finché sta tutta sopra gli edifici che ha sotto, anche quando scorre di lato
    const sopraGliEdifici = (x, y, z, s, scorre) => {
      const mx = 2.5 * s + scorre + 0.3, my = 1.9 * s + 0.3;
      for (const [x0, x1, y0, y1, cima] of EDIFICI) if (x + mx > x0 && x - mx < x1 && y + my > y0 && y - my < y1) z = Math.max(z, cima + 1.6 * s + 0.6);     // con margine abbondante
      return z;
    };
    // nuvole: grappoli di palline sospesi sopra la città
    O.nuvole = [[0.8, -2.0, 5.0, 0.85], [8.0, -2.6, 5.3, 1.0], [14.6, -2.5, 5.1, 0.9], [20.3, 1.5, 4.6, 0.7]].map(([x, y, z, s], i) => {
      z = sopraGliEdifici(x, y, z, s, 1.2);
      const g = new THREE.Group(); g.position.set(x, z, y); g.scale.setScalar(0.001); g.userData = { vivo: true, x, s }; L.add(g);
      const rn = rng(40 + i);
      for (let k = 0; k < 7; k++) { const m = metti(g, new THREE.SphereGeometry(1, 14, 10), '#ffffff', [rn.range(-1.3, 1.3), rn.range(-0.1, 0.35), rn.range(-0.6, 0.6)], null, true); m.scale.setScalar(rn.range(0.5, 0.9)); m.receiveShadow = false; }
      return g;
    });
    O.matNuvola = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, fog: false });
    O.matNuvolaScura = new THREE.MeshStandardMaterial({ color: '#5f6672', roughness: 0.95, fog: false, emissive: '#8b93a4', emissiveIntensity: 0 });
    // i nuvoloni neri del temporale: ce ne sono molti di più, e compaiono solo quando piove
    O.nuvoloni = [[-2.4, -0.6, 4.4, 0.9], [3.5, -3.2, 5.6, 1.1], [0.4, 5.6, 4.6, 0.8], [10.8, -3.4, 6.2, 1.15], [11.6, 3.6, 5.2, 0.85], [17.6, -3.0, 5.8, 1.05], [19.6, 6.0, 4.5, 0.8], [-1.6, 8.8, 4.3, 0.75]].map(([x, y, z, s], i) => {
      z = sopraGliEdifici(x, y, z, s, 1.0);
      const g = new THREE.Group(); g.position.set(x, z, y); g.scale.setScalar(0.001); g.visible = false; g.userData = { vivo: true, x, s }; L.add(g);
      const rn = rng(70 + i);
      for (let k = 0; k < 8; k++) { const m = metti(g, new THREE.SphereGeometry(1, 14, 10), O.matNuvolaScura, [rn.range(-1.5, 1.5), rn.range(-0.15, 0.4), rn.range(-0.7, 0.7)], null, true); m.scale.setScalar(rn.range(0.55, 0.95)); m.receiveShadow = false; }
      return g;
    });
    // il fulmine: una saetta di bastoncini luminosi
    O.fulmine = new THREE.Group(); O.fulmine.userData.vivo = true; O.fulmine.visible = false; L.add(O.fulmine);
    const matF = new THREE.MeshBasicMaterial({ color: '#fff6c8', fog: false }); let px = 0, py = 0;
    for (let i = 0; i < 7; i++) { const nx = px + (hash(i * 3) - 0.5) * 0.9, ny = py - 1.0; const a = new THREE.Vector3(px, py, 0), b = new THREE.Vector3(nx, ny, 0);
      const m = metti(O.fulmine, new THREE.CylinderGeometry(0.05, 0.05, a.distanceTo(b), 5), matF, [(px + nx) / 2, (py + ny) / 2, 0], null, false); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); px = nx; py = ny; }

    // uccellini e farfalle (col sole)
    // uccellini colorati posati sui tetti: ogni tanto battono le ali e fanno un saltello
    const posatoi = [[13.6, 6.4, GEL.h + 0.25, 0.4], [16.8, 7.7, GEL.h + 0.25, 2.6], [7.35, 6.71, 3.78, -0.5], [10.27, 6.71, 3.78, 2.2], [-2.38, 0.4, FORN.h + 0.55, 1.2],
      [9.3, 0.7, Z3 + 2.6 + 0.73, 0.3], [12.35, 0.4, Z3 + 3.0 + 0.58, 2.9], [14.6, 1.95, Z3 + 2.6 + 0.22, -0.2], [16.1, 2.31, Z3 + 0.3, 0.8], [5.4, 3.65, Z2 + 2.45 + 0.25, 2.5]];
    const coloriU = [['#4f9fd8', '#f3e6c9'], ['#f0b040', '#fff1d0'], ['#e0614a', '#f6e3cf'], ['#5fb38a', '#eaf2d8'], ['#8a7fd0', '#efe7ff']];
    O.uccelli = posatoi.map(([x, y, z, rot], i) => {
      const [c, petto] = coloriU[i % coloriU.length], g = new THREE.Group(); g.userData.vivo = true; g.position.set(x, z, y); g.rotation.y = rot; g.scale.setScalar(1.7); L.add(g);
      const corpo = new THREE.Group(); g.add(corpo);
      metti(corpo, new THREE.SphereGeometry(0.075, 12, 10), c, [0, 0.08, 0]).scale.set(1.35, 1, 1);
      metti(corpo, new THREE.SphereGeometry(0.06, 10, 8), petto, [0.04, 0.065, 0]).scale.set(1, 0.9, 0.8);
      const testa = new THREE.Group(); testa.position.set(0.09, 0.15, 0); corpo.add(testa);
      metti(testa, new THREE.SphereGeometry(0.05, 12, 10), c);
      metti(testa, new THREE.ConeGeometry(0.016, 0.05, 6), PAL.senape, [0.06, -0.005, 0], [0, 0, -Math.PI / 2]);
      for (const s of [-1, 1]) metti(testa, new THREE.SphereGeometry(0.01, 6, 4), PAL.scuro, [0.03, 0.015, s * 0.038]);
      metti(corpo, scatolaGeo(0.1, 0.012, 0.06, 0.005), c, [-0.12, 0.11, 0], [0, 0, 0.5]);
      for (const s of [-1, 1]) metti(corpo, new THREE.CylinderGeometry(0.005, 0.005, 0.04, 4), PAL.senape, [0.01, 0.02, s * 0.025]);
      const ali = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(0, 0.11, s * 0.06); corpo.add(a); metti(a, new THREE.SphereGeometry(0.06, 10, 6), c, [-0.02, 0, s * 0.02]).scale.set(1.2, 0.3, 0.75); a.userData.s = s; return a; });
      // da dove arriva in volo: dall'alto, da una direzione diversa per ognuno
      const a = hash(i, 3) * Math.PI * 2, volo = new THREE.Vector3(Math.cos(a) * 5, 7 + hash(i, 5) * 2, Math.sin(a) * 3);
      g.userData = { vivo: true, corpo, testa, ali, periodo: 3.5 + hash(i, 7) * 4, fase: hash(i, 9) * 10, base: g.position.clone(), rot, volo, pres: 0, ritardo: hash(i, 11) * 0.6 };
      return g;
    });
    O.farfalle = Array.from({ length: 3 }, (_, i) => { const g = new THREE.Group(); g.userData.vivo = true; L.add(g); const ali = [];
      for (const s of [-1, 1]) { const a = new THREE.Group(); g.add(a); metti(a, new THREE.CircleGeometry(0.08, 10), new THREE.MeshStandardMaterial({ color: [PAL.accento, PAL.senape, '#b9a6e0'][i], side: THREE.DoubleSide, roughness: 0.8 }), [s * 0.07, 0, 0], [-Math.PI / 2, 0, 0], false); ali.push(a); } g.userData.ali = ali; return g; });

    // le faccine (sprite sempre davanti a tutto)
    O.matCuori = new THREE.SpriteMaterial({ map: faccina('cuori'), depthTest: false, depthWrite: false, fog: false });
    O.matRabbia = new THREE.SpriteMaterial({ map: faccina('rabbia'), depthTest: false, depthWrite: false, fog: false });
    O.campane = [0, 1].map(() => { const c = campanella3D(); L.add(c); return c; });
    O.faccine = Array.from({ length: 36 }, () => { const sp = new THREE.Sprite(O.matCuori); sp.visible = false; sp.renderOrder = 20; sp.userData.vivo = true; L.add(sp); return sp; });
    // i banchi di nebbia del cielo coperto: scorrono piano sopra la città alta (leggeri)
    const texNebbia = texCanvas(256, 128, (ctx, W, H) => { ctx.save(); ctx.scale(1, H / W); const g = ctx.createRadialGradient(W / 2, W / 2, 0, W / 2, W / 2, W / 2); g.addColorStop(0, 'rgba(246,248,252,0.95)'); g.addColorStop(0.5, 'rgba(246,248,252,0.6)'); g.addColorStop(1, 'rgba(246,248,252,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, W); ctx.restore(); });
    O.matNebbia = new THREE.SpriteMaterial({ map: texNebbia, transparent: true, depthWrite: false, fog: false, opacity: 0 });
    const rb = rng(55);
    O.banchi = Array.from({ length: 18 }, () => { const sp = new THREE.Sprite(O.matNebbia); sp.userData = { vivo: true, x: rb.range(-2, 22), y: rb.range(-2.5, 3.6), z: rb.range(2.6, 6.2), v: rb.range(0.25, 0.6), w: rb.range(7, 11) }; sp.scale.set(sp.userData.w, sp.userData.w * 0.36, 1); sp.renderOrder = 5; L.add(sp); return sp; });
    // tutto ciò che è fermo viene fuso in poche mesh
    fondi(L);
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
  }
  function disegnaConi() {
    if (!O.texConi) return;                                         // la scena non è ancora pronta: si disegna alla costruzione
    const n = Math.max(0, Math.round(stato.coni)), finiti = stato.finito || n <= 0, pochi = !finiti && n <= stato.coniMax * 0.25;
    const colNum = finiti ? '#ff8a9e' : pochi ? '#ffd27a' : '#fff6e6';
    O.texConi.ridisegna((ctx, W, H) => {
      ctx.fillStyle = '#2a2433'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAL.cialda; ctx.beginPath(); ctx.moveTo(96, 230); ctx.lineTo(224, 230); ctx.lineTo(160, 430); ctx.fill();
      ctx.fillStyle = PAL.accento; ctx.beginPath(); ctx.arc(160, 186, 82, 0, 7); ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = colNum; ctx.font = fontGrassetto(400); ctx.fillText(finiti ? '0' : String(n), 640, 255);     // il numero grande, in grassetto
    });
  }

  /* ---------------------------------------------------------------
     POST-PRODUZIONE: tilt-shift (una fascia nitida, i bordi sfocati), colore, vignettatura
     --------------------------------------------------------------- */
  function creaPost() {
    post = new THREE.ShaderMaterial({
      uniforms: { tCol: { value: null }, res: { value: new THREE.Vector2(1, 1) }, fuoco: { value: 0.5 }, fascia: { value: 0.12 }, sfoc: { value: 6 }, riflessi: { value: 0 }, aspetto: { value: 1.8 }, vign: { value: 0.2 }, sat: { value: 1.08 }, con: { value: 1.03 }, esposizione: { value: 1 }, lampo: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: `
        uniform sampler2D tCol; uniform vec2 res; uniform float fuoco, fascia, sfoc, vign, sat, con, esposizione, lampo, riflessi, aspetto; varying vec2 vUv;
        const vec2 DISCO[12] = vec2[12](vec2(-0.326,-0.406), vec2(-0.840,-0.074), vec2(-0.696,0.457), vec2(-0.203,0.621), vec2(0.962,-0.195), vec2(0.473,-0.480),
                                        vec2(0.519,0.767), vec2(0.185,-0.893), vec2(0.507,0.064), vec2(0.896,0.412), vec2(-0.322,-0.933), vec2(-0.792,-0.598));
        void main(){
          // tilt-shift solo verso il bordo vicino (in basso): la parte alta resta nitida
          float d = fuoco - vUv.y, r = smoothstep(fascia, fascia + 0.3, d) * sfoc * res.y / 900.0;
          vec3 c = texture2D(tCol, vUv).rgb;
          if (r > 0.35) {
            vec3 acc = c; float ang = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
            mat2 rot = mat2(cos(ang), -sin(ang), sin(ang), cos(ang));
            for (int i = 0; i < 12; i++) acc += texture2D(tCol, vUv + rot * DISCO[i] * r / res).rgb;
            c = acc / 13.0;
          }
          c = c * esposizione + lampo * vec3(0.5, 0.52, 0.6);
          // riflessi del sole sull'obiettivo: un bagliore caldo in alto a sinistra e qualche cerchio lungo la diagonale
          if (riflessi > 0.001) {
            vec2 sp = vec2(-0.02, 1.04), asp = vec2(aspetto, 1.0);
            c += riflessi * vec3(1.0, 0.8, 0.52) * 0.55 * exp(-length((vUv - sp) * asp) * 2.4);
            for (int k = 1; k <= 4; k++) {
              float f = float(k), rr = 0.025 + 0.018 * mod(f * 1.7, 3.0);
              vec2 gp = sp + (vec2(0.5) - sp) * (0.32 * f);
              float g = smoothstep(rr, rr * 0.55, length((vUv - gp) * asp));
              c += riflessi * g * 0.07 * mix(vec3(1.0, 0.75, 0.5), vec3(0.6, 0.85, 1.0), mod(f, 2.0));
            }
            vec2 dd = (vUv - sp) * asp; c += riflessi * vec3(1.0, 0.86, 0.6) * 0.05 * exp(-abs(dd.x - dd.y * -1.0) * 9.0) * exp(-length(dd) * 1.2);
          }
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
    post.uniforms.tCol.value = rt.texture; post.uniforms.res.value.set(w, h); post.uniforms.aspetto.value = w / h;
  }

  /* ---------------------------------------------------------------
     DIMENSIONI, INQUADRATURA E QUALITÀ (si abbassa da sola se gli fps scendono)
     --------------------------------------------------------------- */
  let W = 1, H = 1;
  // tre livelli già pronti; in "automatica" si scende da soli se il PC rallenta. Dal menu si può scegliere a mano.
  const QUALITA = { alta: { pr: 2, aniso: 16, ombre: 2048, post: true }, media: { pr: 1.25, aniso: 8, ombre: 2048, post: true }, bassa: { pr: 0.75, aniso: 2, ombre: 1024, post: false } };
  let ANISO_MAX = 16;
  // le impostazioni in uso: pixel per pixel dello schermo, filtro anisotropico, effetti (sfocatura, riflessi, colore)
  function efficace() {
    if (!stato.auto && stato.manuale) return stato.manuale;
    const q = QUALITA[stato.qualita];
    return { pr: Math.min(window.devicePixelRatio || 1, q.pr), aniso: q.aniso, effetti: q.post };
  }
  function applicaAniso(a) {
    const v = Math.max(1, Math.min(ANISO_MAX, a));
    if (v === ANISO) return; ANISO = v;
    for (const t of TEXTURE) { t.anisotropy = v; t.needsUpdate = true; }
  }
  // z = quanto è vicina (1 = tutta la piastrella), off = quanto si usa lo spostamento che centra la piastrella
  const CAM = { az: 14 * Math.PI / 180, el: 31 * Math.PI / 180, dist: 60, miraBase: new THREE.Vector3(0, 1.2, 0.6), mira: new THREE.Vector3(0, 1.2, 0.6), z: 1, off: 1, offset: [0, 0] };
  // piazza la camera; d = distanza
  function piazzaCamera(az, el, d, m = CAM.mira) {
    camera.position.set(m.x + d * Math.sin(az) * Math.cos(el), m.y + d * Math.sin(el), m.z + d * Math.cos(az) * Math.cos(el));
    camera.lookAt(m);
  }
  // cerca la distanza a cui tutta la piastrella (con le torri) sta nell'inquadratura: teleobiettivo, piastrella che riempie
  function inquadra() {
    const pts = [], k = PIASTRA.r * 0.3, f = 1.25 + k;
    for (const [x, y] of [[PIASTRA.x0 + k, PIASTRA.y0 + k], [PIASTRA.x1 - k, PIASTRA.y0 + k], [PIASTRA.x0 + k, PIASTRA.y1 - k], [PIASTRA.x1 - k, PIASTRA.y1 - k]]) pts.push(new THREE.Vector3(x - PIASTRA.cx, 0.3, y - PIASTRA.cy));
    for (const [x, y] of [[PIASTRA.x0 + f, PIASTRA.y1 - f], [PIASTRA.x1 - f, PIASTRA.y1 - f], [PIASTRA.x0 + f, PIASTRA.y0 + f], [PIASTRA.x1 - f, PIASTRA.y0 + f]]) pts.push(new THREE.Vector3(x - PIASTRA.cx, -PIASTRA.spessore - 0.2, y - PIASTRA.cy));
    pts.push(new THREE.Vector3(11.1 - PIASTRA.cx, Z3 + 5.0, -0.1 - PIASTRA.cy), new THREE.Vector3(FORN.x + 0.35 - PIASTRA.cx, 3.4, FORN.y + 0.5 - PIASTRA.cy));
    let d = 60, box; const v = new THREE.Vector3();
    camera.clearViewOffset();
    const misura = () => {
      piazzaCamera(CAM.az, CAM.el, d, CAM.miraBase); camera.updateMatrixWorld();
      const b = [1e9, -1e9, 1e9, -1e9]; for (const p of pts) { v.copy(p).project(camera); b[0] = Math.min(b[0], v.x); b[1] = Math.max(b[1], v.x); b[2] = Math.min(b[2], v.y); b[3] = Math.max(b[3], v.y); }
      return b;
    };
    for (let it = 0; it < 6; it++) { box = misura(); d *= Math.max((box[1] - box[0]) / 2 / 0.95, (box[3] - box[2]) / 2 / 0.9); }
    box = misura();
    CAM.dist = d;
    // sposta l'inquadratura perché la piastrella stia al centro (la mira resta la stessa)
    CAM.offset = [(box[0] + box[1]) / 2 * W / 2, -(box[2] + box[3]) / 2 * H / 2];
    camera.setViewOffset(W, H, CAM.offset[0] * CAM.off, CAM.offset[1] * CAM.off, W, H);
  }
  /* ---------------------------------------------------------------
     INQUADRATURA CHE SEGUE L'AZIONE (schermi piccoli, come i telefoni)
     Di solito si avvicina a scuola e gelateria; quando il furgone viaggia lo segue;
     di notte, senza furgone, si allarga sulla città intera. Sui PC resta tutta la piastrella.
     --------------------------------------------------------------- */
  const MIRA = new THREE.Vector3();
  const schermoPiccolo = () => stato.inquadratura === 'segui' || (stato.inquadratura === 'auto' && (W < 700 || window.innerWidth < 760 || window.innerHeight < 500));   // telefono (non una scena bassa su un PC)
  function aggiornaInquadratura(dt, notte) {
    let zoom = 1, off = 1, az = 0, lento = false; MIRA.copy(CAM.miraBase);
    if (stato.regia) {                                               // la "regia" (panoramica iniziale): il gioco decide dove guardare
      const r = stato.regia; O.L.localToWorld(MIRA.set(r.x, r.h ?? 1.4, r.y)); zoom = r.zoom ?? 0.5; off = 0; az = (r.az || 0) * Math.PI / 180; lento = !!r.lento;
    } else if (schermoPiccolo()) {
      const cs = stato.camion, viaggia = O.furgone.g.visible && cs.attivo && cs.ore < 22.8;
      if (viaggia) { MIRA.copy(O.furgone.g.position).setY(0.8); O.L.localToWorld(MIRA); zoom = 0.6; off = 0; }
      else if (notte < 0.6) { O.L.localToWorld(MIRA.set(12.3, 1.6, 7.6)); zoom = W / H < 1.5 ? 0.42 : 0.5; off = 0; }   // più vicina se la scena è stretta
    }
    const k = Math.min(1, dt * (lento ? 0.55 : 1.6));
    CAM.mira.lerp(MIRA, k); CAM.z += (zoom - CAM.z) * k; CAM.off += (off - CAM.off) * k; CAM.azX = (CAM.azX || 0) + (az - (CAM.azX || 0)) * k;
    camera.setViewOffset(W, H, CAM.offset[0] * CAM.off, CAM.offset[1] * CAM.off, W, H);
  }
  function ridimensiona() {
    const r = contenitore.getBoundingClientRect(); W = Math.max(2, Math.round(r.width)); H = Math.max(2, Math.round(r.height));
    const e = efficace();
    R.setPixelRatio(e.pr); R.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix(); inquadra();
    if (e.effetti) creaTarget(Math.round(W * e.pr), Math.round(H * e.pr));
    applicaAniso(e.aniso);
  }
  function impostaQualita(q) {
    if (stato.qualita === q) return;
    stato.qualita = q;
    const Q = QUALITA[q];
    if (O.sole.shadow.mapSize.x !== Q.ombre) { O.sole.shadow.mapSize.setScalar(Q.ombre); if (O.sole.shadow.map) { O.sole.shadow.map.dispose(); O.sole.shadow.map = null; } }
    ridimensiona();
  }
  const fps = { campioni: [], valore: 60, lento: 0, inizio: tReale() };
  function misuraFps(dt) {
    if (dt <= 0 || dt > 0.5) return;
    fps.campioni.push(dt); if (fps.campioni.length > 60) fps.campioni.shift();
    fps.valore = fps.campioni.length / fps.campioni.reduce((a, b) => a + b, 0);
    // se resta sotto i 50 fps per un paio di secondi, scende di un gradino
    if (stato.auto && tReale() - fps.inizio > 6 && fps.campioni.length >= 60 && fps.valore < 50) { fps.lento += dt; if (fps.lento > 2 && stato.qualita !== 'bassa') { fps.lento = 0; fps.campioni = []; impostaQualita(stato.qualita === 'alta' ? 'media' : 'bassa'); } }
    else fps.lento = Math.max(0, fps.lento - dt);
  }

  /* ---------------------------------------------------------------
     AGGIORNAMENTO DI OGNI FOTOGRAMMA
     --------------------------------------------------------------- */
  const col = (hex) => new THREE.Color(hex);
  const C = { soleCaldo: col('#ffb978'), soleMezzodi: col('#fff1dc'), soleLuna: col('#9fb0ff'), cielo: col('#bcd3ff'), cieloSera: col('#a9b8f5'), cieloNotte: col('#6a78a0'), cieloGrigio: col('#c8d0d8'),
    sfondo: col(PAL.sfondo), sera: col(PAL.sera), notte: col(PAL.notte), pioggia: col(PAL.pioggia), nuvole: col(PAL.nuvole), tmp: col('#fff'), tmp2: col('#fff') };
  const V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), O3 = new THREE.Object3D();
  const oraDelGiorno = () => (stato.ora >= 32 ? stato.ora - 24 : stato.ora);
  function aggiorna(t, dt) {
    // --- meteo: le quantità si avvicinano piano al valore richiesto (niente scatti)
    const kStep = Math.min(1, dt * 1.5 * Math.max(1, stato.speed));
    stato.meteoK.pioggia += ((stato.meteo === 'pioggia' ? 1 : 0) - stato.meteoK.pioggia) * kStep;
    stato.meteoK.nuvole += ((stato.meteo === 'sole' ? 0 : 1) - stato.meteoK.nuvole) * kStep;
    const kp = stato.meteoK.pioggia, kn = stato.meteoK.nuvole, nebbia = kn * (1 - kp);

    // --- ora: il sole sale e scende davanti a sinistra e si scalda verso sera; poi la notte
    const h = oraDelGiorno(), p = clamp((h - 8) / 12), notte = h <= 20 ? 0 : h < 31 ? liscio(20, 21, h) : 1 - liscio(31, 32, h);
    const alto = Math.sin(Math.PI * p);
    O.sole.position.set(-22 + 10 * p, 10 + 18 * alto, 20 - 6 * p);
    C.tmp.copy(C.soleCaldo).lerp(C.soleMezzodi, Math.pow(alto, 0.7));
    O.sole.color.copy(C.tmp).lerp(C.soleLuna, notte);
    O.sole.intensity = lerp(lerp(3.2, 1.0, kn), 0.25, notte) * (0.75 + 0.25 * alto);
    O.cielo.color.copy(C.cielo).lerp(C.cieloSera, liscio(0.7, 1, p)).lerp(C.cieloGrigio, kn * 0.6).lerp(C.cieloNotte, notte);
    O.cielo.intensity = lerp(lerp(0.9, 1.35, kn), 0.5, notte);
    O.lunetta.intensity = 0.6 * notte;
    O.sole.shadow.radius = lerp(3, 9, kn);                          // col cielo coperto le ombre si allargano
    C.tmp2.copy(C.sfondo).lerp(C.sera, liscio(0.75, 1, p)).lerp(C.nuvole, nebbia).lerp(C.pioggia, kp).lerp(C.notte, notte);
    scena.background.copy(C.tmp2); O.carta.material.color.copy(C.tmp2);
    // la nebbia del cielo coperto: fitta sulla città alta (più lontana), leggera davanti
    // la nebbia del cielo coperto: più fitta sulla città alta (più lontana), leggera davanti
    scena.fog.color.copy(C.tmp2).lerp(C.tmp.set('#eef1f5'), 0.5 * (1 - notte));
    scena.fog.near = nebbia > 0.02 ? CAM.dist - 3 : 1e4; scena.fog.far = nebbia > 0.02 ? CAM.dist + 15 + 60 * (1 - nebbia) : 2e4;
    scena.environmentIntensity = lerp(0.4, 0.15, notte);
    post.uniforms.esposizione.value = lerp(1, 0.92, kp);
    post.uniforms.sat.value = lerp(1.08, 0.9, kp);

    // --- le lampadine prendono il sopravvento la sera
    const luci = liscio(19.2, 20.4, h) * (h < 31.5 ? 1 : 1 - liscio(31.5, 32, h));
    O.bulbi.emissiveIntensity = 5 * luci; O.matAlone.opacity = 0.85 * luci; O.luceLampione.intensity = 6 * luci;
    O.finestreAccese.emissiveIntensity = 2.6 * luci;
    O_finestra().emissiveIntensity = 2.2 * luci;
    O.vetriFornitore.emissiveIntensity = 0.3 + 1.4 * luci;
    O.matVetrina.emissiveIntensity = 0.4 + 0.9 * luci;
    // il robot lavora solo di notte: la sera il vetro nero con la scritta GELATO diventa trasparente e il laboratorio si accende
    O.vetroNero.material.opacity = 1 - notte; O.vetroNero.visible = notte < 0.99;
    O.robot.g.visible = notte > 0.01; O.luceLab.intensity = 2.2 * notte; O.matConi.emissiveIntensity = 0.6 + 0.8 * luci;
    O.luceNegozio.intensity = 3 * luci;
    O.furgone.fari.emissiveIntensity = 2.6 * Math.max(luci, kp * 0.6, Math.abs(furgoneStato.v) > 0.05 ? 0.4 : 0);

    // --- di notte il logo della scuola si accende, retroilluminato
    O.matLogo.emissiveIntensity = 0.45 * luci; O.matAnello.emissiveIntensity = 3.2 * luci;      // l'anello luminoso illumina il logo
    // --- apertura e chiusura della gelateria (porta, gelataio, pacchi, bancone)
    aggiornaNegozio(t, h, luci);

    // --- l'oscillazione lenta della piastrella e la "respirazione" della camera (niente giro completo)
    const th = (2.5 * Math.sin(t * 0.07)) * Math.PI / 180;
    O.perno.rotation.y = th; O.ombraTile.rotation.z = th;
    if (CAM.vista) { camera.position.copy(CAM.vista[0]); camera.lookAt(CAM.vista[1]); } else
    { aggiornaInquadratura(dt, notte); piazzaCamera(CAM.az + (CAM.azX || 0) + (1.2 * Math.sin(t * 0.05)) * Math.PI / 180, CAM.el + (0.8 * Math.sin(t * 0.09)) * Math.PI / 180, CAM.dist * CAM.z * (1 + 0.012 * Math.sin(t * 0.11))); }
    O.sole.target.position.set(0, 0, 0);

    // --- il furgone, il fumo del comignolo e la scia
    aggiornaFurgone(t, dt);
    for (let i = 0; i < 6; i++) { const eta = ((t + 10) / 2.4 + i / 6) % 1; O.fumo.set(i, O.comignolo, eta, { size: 0.26, rise: 1.6, drift: 0.7, driftZ: -0.15 + 0.12 * hash(i, Math.floor((t + 10) / 2.4 + i / 6)) }); }
    for (let i = 0; i < 14; i++) { const sb = O.scia[i]; if (!sb) { O.fumo.set(6 + i, [0, -50, 0], 0, { size: 0, rise: 0 }); continue; } O.fumo.set(6 + i, sb.at, (t - sb.t0) / 0.8, { size: 0.17, rise: 0.5 }); }
    O.fumo.m.instanceMatrix.needsUpdate = true;

    // --- il cono sul tetto ruota piano; la bandiera sventola
    O.conone.rotation.y = t * 0.6;
    const bp = O.bandiera.geometry.attributes.position, base = O.bandiera.userData.base;
    for (let i = 0; i < bp.count; i++) { const x = base[i * 3]; bp.setZ(i, Math.sin(t * 4 - x * 7) * 0.05 * (x / 0.66)); }
    bp.needsUpdate = true; O.bandiera.geometry.computeVertexNormals();


    // --- banchi di nebbia
    O.matNebbia.opacity = 0.86 * liscio(0.1, 0.8, nebbia);
    O.banchi.forEach((b) => { b.visible = O.matNebbia.opacity > 0.01; if (!b.visible) return; const u = b.userData;
      b.position.set(-3 + ((u.x + 3 + t * u.v) % 26), u.z + Math.sin(t * 0.3 + u.x) * 0.15, u.y); });
    // --- persone (con l'ombrello quando piove)
    const ombrello = kp > 0.4;
    if (O.ombrelli[0].visible !== ombrello) O.ombrelli.forEach((o) => { o.visible = ombrello; });
    O.faccine.forEach((f) => {
      if (!f.visible) return;
      const u = (t - f.userData.t0) / (f.userData.dur || 2.8);
      if (u >= 1) { f.visible = false; return; }
      f.position.set(f.userData.x + Math.sin(t * 3 + f.userData.fase) * 0.25, f.userData.y + u * (f.userData.sale || 17), f.userData.z);
      const sf = 0.85 * grandezzaSegni() * Math.max(0.001, easeOutBack(clamp(u * 5))); f.scale.set(sf * (f.userData.ax || 1), sf * (f.userData.ay || 1), 1);
    });
    aggiornaClienti(t, dt);
    aggiornaBus();
    aggiornaCorsa(t);
    aggiornaRobot(t);
    aggiornaRagazzi(t, h);
    aggiornaCampane(t);

    // --- pioggia, pozzanghere, fulmini
    O.gocce.visible = kp > 0.02; O.spruzzi.visible = O.gocce.visible;
    if (O.gocce.visible) {
      O.gocce.material.opacity = 0.8 * kp; O.spruzzi.material.opacity = 0.45 * kp;
      const ALTO = 7.5, VEL = 9;                                       // cadono dall'altezza delle nuvole
      O.goccePos.forEach(([x, f, y, v, zb], i) => {
        const d = (t * VEL * v + f * ALTO) % ALTO, z = zb + ALTO - d, eta = d / (VEL * v);   // eta = da quanto è caduta la goccia di prima
        O3.position.set(x + (z - zb) * 0.05, z + 0.3, y); O3.rotation.set(0, 0, 0.05); O3.scale.setScalar(1); O3.updateMatrix(); O.gocce.setMatrixAt(i, O3.matrix);
        const sp = eta < 0.22 ? 0.04 + eta * 0.7 : 0.0001;
        O3.position.set(x, zb + 0.07, y); O3.rotation.set(0, 0, 0); O3.scale.setScalar(sp); O3.updateMatrix(); O.spruzzi.setMatrixAt(i, O3.matrix);
      });
      O.gocce.instanceMatrix.needsUpdate = true; O.spruzzi.instanceMatrix.needsUpdate = true;
    }
    stato.bagnato = clamp(stato.bagnato + (kp > 0.5 ? dt * 0.35 : -dt * 0.15) * Math.max(1, stato.speed));
    O.pozze.forEach((m, i) => { const s = Math.max(0.001, liscio(0.05 + i * 0.06, 0.55 + i * 0.05, stato.bagnato)); m.scale.set(s, 1, s); m.visible = s > 0.01; });
    O.L.userData.matErba.roughness = lerp(0.95, 0.75, kp);
    const kf2 = Math.floor(t / 2.6), ph = (t / 2.6) % 1, lampo = kp > 0.6 && ph < 0.09 && hash(kf2) > 0.3;
    O.fulmine.visible = lampo && ph < 0.06;
    if (lampo) O.fulmine.position.set(lerp(1, 19, hash(kf2, 2)), 7.2, lerp(-2.5, 1.5, hash(kf2, 5)));
    post.uniforms.lampo.value = lampo ? (ph < 0.045 ? 1 - ph / 0.045 : 0) * 0.35 : 0;

    // --- nuvole: compaiono col cielo coperto e passano piano (scure col temporale)
    const matN = kp > 0.5 ? O.matNuvolaScura : O.matNuvola;
    O.matNuvolaScura.emissiveIntensity = 0.5 * Math.max(notte, liscio(0.7, 1, p)) + (post.uniforms.lampo.value > 0 ? 0.8 : 0);   // di sera restano grigie sul cielo scuro; il lampo le illumina
    O.nuvole.forEach((g, i) => { const s = Math.max(0.001, kn * g.userData.s); g.scale.setScalar(s); g.visible = s > 0.02; g.position.x = g.userData.x + Math.sin(t * 0.05 + i) * 1.2;
      if (g.userData.mat !== matN) { g.userData.mat = matN; g.children.forEach((m) => { m.material = matN; }); } });
    O.nuvoloni.forEach((g, i) => { const s = Math.max(0.001, liscio(0.2, 0.9, kp) * g.userData.s); g.scale.setScalar(s); g.visible = s > 0.02; g.position.x = g.userData.x + Math.sin(t * 0.06 + i * 1.7) * 1.0; });

    // --- fiori: col sole sbocciano, col maltempo si chiudono
    const sboccioVuole = stato.meteo === 'sole' && notte < 0.5 ? 1 : 0;          // col sole sbocciano, altrimenti si richiudono
    const sb = stato.sboccio + (sboccioVuole - stato.sboccio) * Math.min(1, dt * 0.8 * Math.max(1, stato.speed));
    if (Math.abs(sb - stato.sboccio) > 0.002 || !O.fiori.userData.pronti) {
      stato.sboccio = sb; O.fiori.userData.pronti = true;
      O.fioriPos.forEach(([x, y, z], i) => { const s = (0.014 + 0.066 * sb) * (0.8 + 0.4 * hash(i, 3)); O3.position.set(x, z + 0.2 + s * 0.3, y); O3.rotation.set(0, 0, 0); O3.scale.set(s, s * 0.7, s); O3.updateMatrix(); O.fiori.setMatrixAt(i, O3.matrix); });
      O.fiori.instanceMatrix.needsUpdate = true;
    }

    // --- uccellini e farfalle col bel tempo
    const bello = (1 - kn) * (1 - notte) > 0.5;
    post.uniforms.riflessi.value = (1 - kn) * (1 - notte) * (0.6 + 0.4 * Math.sin(Math.PI * p));
    // col sole arrivano in volo dall'alto e si posano sui tetti (uno dopo l'altro); al tramonto o col maltempo ripartono all'indietro
    const restano = bello && kp < 0.3;
    O.uccelli.forEach((g) => {
      const u = g.userData;
      u.pres = clamp(u.pres + (restano ? 1 : -1) * dt * Math.max(1, stato.speed) / 4.5);
      const k = clamp((u.pres * (1 + u.ritardo) - u.ritardo) / 1);           // ognuno parte col suo ritardo
      g.visible = k > 0.001; if (!g.visible) return;
      const e = 1 - Math.pow(1 - k, 2.2), lontano = 1 - e;                 // rallenta mentre si posa
      g.position.copy(u.base).addScaledVector(u.volo, lontano);
      g.position.y += Math.sin(Math.PI * k) * 0.6;                           // un arco morbido
      const inVolo = k < 1;
      // in volo guarda verso il tetto; da posato torna al suo verso
      const dirVolo = Math.atan2(u.volo.z, -u.volo.x);
      g.rotation.y = inVolo ? lerp(dirVolo, u.rot, liscio(0.85, 1, k)) : u.rot;
      const c = ((t + u.fase) % u.periodo), sbatte = inVolo || c < 0.7;
      const ali = inVolo ? 0.2 + 1.1 * Math.abs(Math.sin(t * 26 + u.fase)) : sbatte ? 0.3 + 0.9 * Math.abs(Math.sin(c * 28)) : 0;
      u.ali.forEach((a) => { a.rotation.x = -a.userData.s * ali; });
      u.corpo.position.y = inVolo ? 0 : sbatte ? Math.sin(Math.PI * c / 0.7) * 0.06 : 0;
      u.testa.rotation.y = Math.sin(t * 0.7 + u.fase) > 0.6 ? 0.6 : Math.sin(t * 0.7 + u.fase) < -0.6 ? -0.6 : 0;
      u.testa.rotation.z = c > 1.5 && c < 1.9 ? -0.35 : 0;                            // ogni tanto becchetta
    });
    O.farfalle.forEach((g, i) => {
      g.visible = bello; if (!bello) return;
      g.position.set(3 + i * 1.3 + Math.sin(t * 0.7 + i) * 0.6, 0.6 + Math.sin(t * 2 + i) * 0.2, 6.6 + Math.cos(t * 0.9 + i) * 0.6);
      g.rotation.y = t * 0.8 + i; const ali = Math.abs(Math.sin(t * 14 + i)) * 1.1; g.userData.ali[0].rotation.z = ali; g.userData.ali[1].rotation.z = -ali;
    });

    post.uniforms.fuoco.value = 0.3;                             // nitido dal 30% dell'altezza in su
  }

  // il furgone: carica al fornitore, viaggia giù per la strada, si ferma alla gelateria e scarica; poi riparte e fa il giro
  const furgoneStato = { s: 0, v: 0, vPrec: 0, beccheggio: 0, ritorno: -1, ultimoAttivo: false, ultimaScia: -9, ritornoT: 3 };
  const angolo = (a) => -a;                                         // dalla direzione isometrica alla rotazione three (asse y)
  function posa(F, punto, extraZ = 0) { F.g.position.set(punto.x, 0.05 + extraZ, punto.y); F.g.rotation.y = angolo(punto.ang); }
  // un pacco del furgone tocca il pallet: la pila cresce di uno (al massimo 12)
  function atterra(fs) { fs.atterrati++; if (stato.pila < 12) { (O.pacchiArrivo ??= [])[stato.pila] = tGioco; stato.pila++; } }
  function aggiornaFurgone(t, dt) {
    const F = O.furgone, cs = stato.camion, fs = furgoneStato;
    if (fs.ultimoAttivo && !cs.attivo) {
      fs.ritorno = tGioco;
      // se il furgone era già arrivato, tutti i suoi pacchi sono sul pallet anche se l'animazione è stata saltata
      if (fs.oreUltime >= 22 && fs.base != null) while (fs.atterrati < fs.n) atterra(fs);
      fs.base = null;
    }
    if (cs.attivo) { fs.oreUltime = cs.ore; if (cs.ore < 22) fs.base = null; else if (fs.base == null) { fs.base = stato.pila; fs.atterrati = 0; fs.n = cs.n ?? 5; } }
    if (cs.attivo) fs.ritorno = -1;
    fs.ultimoAttivo = cs.attivo;
    let portellone = 0, punto, percorsoS = 0, via = null;
    if (cs.attivo) {
      const ore = cs.ore;
      portellone = ore < 1.6 ? 1 - seg(ore, 1.0, 1.6) : ore >= 22 ? seg(ore, 22, 22.6) : 0;
      percorsoS = ANDATA.len * trap(seg(ore, 2, 21), 0.15, 0.25); punto = ANDATA.a(percorsoS); via = ANDATA;
    } else if (fs.ritorno >= 0) {
      const u = (tGioco - fs.ritorno) / fs.ritornoT;
      percorsoS = RITORNO.len * Math.min(0.42, 0.42 * trap(u, 0.3, 0.05)); punto = RITORNO.a(percorsoS); via = RITORNO;
      if (u >= 1) fs.ritorno = -1;
    }
    // il furgone che viaggia: visibile in andata e mentre se ne va (poi rimpicciolisce e sparisce)
    F.g.visible = !!punto;
    const uRit = fs.ritorno >= 0 ? (tGioco - fs.ritorno) / fs.ritornoT : 0;
    if (!punto) { fs.v = 0; fs.vPrec = 0; return; }
    // il furgone compare al fornitore solo quando parte il carico (con un balzo, già girato verso la Consolazione)
    // e dopo la consegna se ne va e rimpicciolisce fino a sparire
    if (fs.ritorno >= 0) F.g.scale.setScalar(1.55 * Math.max(0.001, 1 - liscio(0.75, 1, uRit)));
    else F.g.scale.setScalar(1.55 * Math.max(0.001, easeOutBack(clamp(cs.ore / 0.6))));
    // velocità e accelerazione (per beccheggio e rollio: il furgone "pesa")
    const v = dt > 0 ? (percorsoS - fs.s) / dt : 0; fs.v = Math.abs(percorsoS - fs.s) > 5 ? 0 : v;
    const acc = dt > 0 ? (fs.v - fs.vPrec) / dt : 0; fs.vPrec = fs.v; fs.s = percorsoS;
    posa(F, punto);
    fs.beccheggio += (clamp(acc * 0.003, -0.08, 0.08) - fs.beccheggio) * Math.min(1, dt * 8);
    const avanti = via.a(percorsoS + 0.6), piega = Math.atan2(Math.sin(avanti.ang - punto.ang), Math.cos(avanti.ang - punto.ang));
    F.corpo.rotation.set(clamp(-piega * Math.min(1, Math.abs(fs.v) * 0.3) * 0.5, -0.1, 0.1), 0, fs.beccheggio);
    F.corpo.position.y = Math.abs(Math.sin(percorsoS * 3.3)) * 0.01 * clamp(Math.abs(fs.v) * 0.3);
    F.ruote.forEach((w) => { w.rotation.z = -percorsoS / (0.2 * 1.55); });
    F.portellone.rotation.z = -1.78 * portellone;
    F.carico.visible = cs.attivo && cs.ore < 22.8;
    // sbuffi dietro quando si muove
    if (Math.abs(fs.v) > 0.3 && tGioco - fs.ultimaScia > 0.1 / Math.max(1, stato.speed)) {
      fs.ultimaScia = tGioco; const dx = Math.cos(punto.ang), dy = Math.sin(punto.ang);
      O.scia.push({ at: [punto.x - dx * 1.5, 0.35, punto.y - dy * 1.5], t0: t }); if (O.scia.length > 14) O.scia.shift();
    }
    // la saracinesca del fornitore si alza mentre carica
    const aperta = cs.attivo ? 1 - seg(cs.ore, 1.6, 2.6) : 0;
    O.saracinesca.scale.y = Math.max(0.03, 1 - aperta * 0.96); O.lamelle.repeat.y = 7 * O.saracinesca.scale.y;
    // i pacchi volano dal furgone sul pallet di fianco alla gelateria (domattina il gelataio li porta dentro)
    O.casseVolanti.forEach((c, i) => {
      const u = cs.attivo ? seg(cs.ore, 22.4 + i * 0.3, 23.2 + i * 0.15) : 1;
      if (fs.base == null || i >= Math.min(5, fs.n)) { c.visible = false; return; }        // al massimo 5 pacchi in volo; gli altri si aggiungono all'arrivo
      if (u >= 1 && fs.atterrati <= i) { atterra(fs); if (i === Math.min(5, fs.n) - 1) while (fs.atterrati < fs.n) atterra(fs); }
      c.visible = u > 0 && u < 1; if (!c.visible) return;
      const dx = Math.cos(punto.ang), dy = Math.sin(punto.ang), da = [punto.x - dx * 1.6, punto.y - dy * 1.6], [ax, ay, al] = O.posPacchi[Math.min(11, fs.base + i)];
      c.position.set(lerp(da[0], ax, u), lerp(0.8, 0.26 + al * 0.32, u) + Math.sin(Math.PI * u) * 1.4, lerp(da[1], ay, u)); c.rotation.set(u * 3, u * 2, 0);
    });
  }

  /* ---------------------------------------------------------------
     LA GELATERIA CHE APRE E CHIUDE
     Mattina, in quest'ordine: apre la porta (scorre a destra), esce il gelataio, porta dentro i pacchi
     uno alla volta, porta fuori il bancone, torna a chiudere la porta, si rimette a fianco del bancone.
     Sera: va alla porta, la apre, spinge dentro il bancone, entra e chiude.
     Le durate sono in secondi di gioco (seguono la velocità 1×, 2×, 4×).
     --------------------------------------------------------------- */
  const negozio = { stato: 'aperto', seq: null, verso: null, promessa: null, risolvi: null };
  const N = { porta: 0, gx: 0, gy: 0, gs: 1, gr: 0.3, gh: 0, bx: BANCO.x, by: BANCO.y, bs: 1, carico: -1, spinge: false };
  const DENTRO = () => [GEL.porta, 7.75], SOGLIA = () => [GEL.porta, 8.45], FIANCO = [BANCO.x - 0.45, 8.55];
  const passo = (dur, fn) => ({ dur, fn });
  // cammina saltellando da a ad b (u da 0 a 1), girandosi nella direzione del passo
  function cammina(a, b, u) {
    const e = easeInOut(u); N.gx = lerp(a[0], b[0], e); N.gy = lerp(a[1], b[1], e);
    N.gh = Math.abs(Math.sin(u * Math.PI * Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2.5)))) * 0.08;
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.05) N.gr = Math.atan2(b[0] - a[0], b[1] - a[1]);
  }
  function posaRiposo(st) {
    Object.assign(N, { carico: -1, presi: 0, spinge: false, gh: 0, porta: 0 });
    if (st === 'aperto') Object.assign(N, { gx: FIANCO[0], gy: FIANCO[1], gs: 1, gr: 0.3, bx: BANCO.x, by: BANCO.y, bs: 1 });
    else Object.assign(N, { gx: GEL.porta, gy: 7.75, gs: 0, gr: 0, bx: GEL.porta - 1.1, by: 7.75, bs: 0 });
  }
  function seqApertura() {
    const P = GEL.porta, passi = [], base = stato.pila, n = Math.min(stato.portaOgni, base);
    const da = Array.from({ length: n }, (_, i) => base - 1 - i);      // dalla cima della pila in giù
    negozio.base = base; negozio.nPortati = n;
    passi.push(passo(0.5, (u) => { N.porta = easeInOut(u); }));
    passi.push(passo(0.5, (u) => { N.gs = Math.min(1, u * 2); cammina(DENTRO(), SOGLIA(), u); }));
    for (const k of da) {
      const [px] = O.posPacchi[k], vicino = [px, CASSE.y + 0.75];          // davanti al pallet
      passi.push(passo(0.45, (u) => cammina(SOGLIA(), vicino, u)));
      passi.push(passo(0.55, (u) => { N.carico = k; N.presi = base - k; cammina(vicino, SOGLIA(), u); }));
      passi.push(passo(0.3, (u) => { cammina(SOGLIA(), DENTRO(), u); N.gs = 1 - 0.5 * u; if (u >= 1) N.carico = -1;
        if (u >= 1 && k === da[da.length - 1] && !negozio.seq.rifornito) { negozio.seq.rifornito = true; rifornisci(); } }));
      passi.push(passo(0.3, (u) => { cammina(DENTRO(), SOGLIA(), u); N.gs = 0.5 + 0.5 * u; }));
    }
    passi.push(passo(0.35, (u) => { cammina(SOGLIA(), DENTRO(), u); N.gs = 1 - u; }));
    passi.push(passo(0.7, (u) => { N.bx = P - 1.1; N.by = lerp(7.75, 8.1, easeInOut(u)); N.bs = 0.3 + 0.7 * u; }));
    passi.push(passo(0.35, (u) => { N.gs = Math.min(1, u * 2); cammina(DENTRO(), [P + 1.4, 8.4], u); }));
    passi.push(passo(1.2, (u) => { N.spinge = true; N.bx = lerp(P - 1.1, BANCO.x, easeInOut(u)); N.gx = N.bx + 2.5; N.gy = 8.4; N.gr = -Math.PI / 2; N.gh = Math.abs(Math.sin(u * Math.PI * 4)) * 0.05; if (u >= 1) N.spinge = false; }));
    passi.push(passo(0.6, (u) => cammina([BANCO.x + 2.5, 8.4], SOGLIA(), u)));
    passi.push(passo(0.5, (u) => { N.porta = 1 - easeInOut(u); N.gr = Math.PI; }));
    passi.push(passo(0.8, (u) => { cammina(SOGLIA(), FIANCO, u); if (u >= 1) N.gr = 0.3; }));
    return passi;
  }
  function seqChiusura() {
    const P = GEL.porta;
    return [
      passo(0.6, (u) => cammina(FIANCO, SOGLIA(), u)),
      passo(0.5, (u) => { N.porta = easeInOut(u); N.gr = Math.PI; }),
      passo(0.5, (u) => cammina(SOGLIA(), [BANCO.x + 2.5, 8.4], u)),
      passo(1.2, (u) => { N.bx = lerp(BANCO.x, P - 1.1, easeInOut(u)); N.gx = N.bx + 2.5; N.gy = 8.4; N.gr = -Math.PI / 2; N.gh = Math.abs(Math.sin(u * Math.PI * 4)) * 0.05; }),
      passo(0.6, (u) => { N.by = lerp(8.1, 7.75, easeInOut(u)); N.bs = 1 - 0.7 * u; if (u >= 1) N.bs = 0; }),
      passo(0.55, (u) => { cammina([P + 1.4, 8.4], DENTRO(), u); N.gs = 1 - u; }),
      passo(0.5, (u) => { N.porta = 1 - easeInOut(u); }),
    ];
  }
  function avviaNegozio(verso, durataMs) {
    if (negozio.stato === verso && !negozio.seq) return Promise.resolve();
    if (negozio.seq && negozio.verso === verso) return negozio.promessa;
    if (negozio.seq) return negozio.promessa.then(() => avviaNegozio(verso, durataMs));   // finisce prima quella in corso
    negozio.verso = verso; negozio.da = negozio.stato;
    const passi = verso === 'aperto' ? seqApertura() : seqChiusura();
    // se il gioco chiede una durata, tutta la sequenza si accorcia (o si allunga) per starci dentro
    if (durataMs) { const tot = passi.reduce((a, q) => a + q.dur, 0), k = durataMs / 1000 / tot; passi.forEach((q) => { q.dur *= k; }); }
    negozio.seq = { passi, t0: tGioco };
    negozio.promessa = new Promise((r) => { negozio.risolvi = r; });
    return negozio.promessa;
  }
  // i pacchi sono dentro: i coni tornano al massimo e il cartello con la X sparisce
  function rifornisci() {
    stato.coni = stato.coniMax; if (stato.finito) { stato.finito = false; O.finito.userData.quando = tGioco; }
    disegnaConi(); if (typeof api.onRifornito === 'function') api.onRifornito(stato.coniMax);
  }
  function aggiornaNegozio(t, h, luci) {
    // da solo: apre di mattina e chiude la sera (se nessuno lo comanda)
    if (!negozio.seq && stato.negozioAuto) {
      if (h >= 8 && h < 20 && negozio.stato === 'chiuso') avviaNegozio('aperto');
      else if ((h >= 20 || h < 8) && negozio.stato === 'aperto') avviaNegozio('chiuso');
    }
    if (negozio.seq) {
      posaRiposo(negozio.da);
      let tt = tGioco - negozio.seq.t0, finito = true;
      for (const p of negozio.seq.passi) { p.fn(clamp(tt / p.dur)); if (tt < p.dur) { finito = false; break; } tt -= p.dur; }
      if (finito) { if (negozio.verso === 'aperto') stato.pila = Math.max(0, negozio.base - negozio.nPortati); negozio.stato = negozio.verso; negozio.seq = null; negozio.risolvi(); }
    } else posaRiposo(negozio.stato);
    // porta, bancone, pacchi
    O.porta.position.x = GEL.porta + 0.7 * N.porta;                 // scorre verso destra
    O.vanoPorta.emissiveIntensity = N.porta * (0.25 + 1.6 * luci);
    O.bancone.position.set(N.bx, 0, N.by); O.bancone.visible = N.bs > 0.01; O.bancone.scale.setScalar(Math.max(0.001, N.bs));
    const sulPallet = negozio.seq && negozio.verso === 'aperto' ? negozio.base - N.presi : stato.pila;
    O.pacchi.forEach((c, k) => {
      const fuori = k < sulPallet;
      c.visible = fuori || N.carico === k;
      if (N.carico === k) { c.position.set(N.gx + Math.sin(N.gr) * 0.25, 0.1 + N.gh + 0.75, N.gy + Math.cos(N.gr) * 0.25); c.scale.setScalar(Math.max(0.001, N.gs)); }
      else if (fuori) { const [x, y, l] = O.posPacchi[k], u = clamp((tGioco - (O.pacchiArrivo?.[k] ?? -99)) / 0.3); c.position.set(x, 0.1 + l * 0.32, y); c.rotation.y = (hash(k) - 0.5) * 0.2; c.scale.setScalar(Math.max(0.001, easeOutBack(u))); }
    });
    // il neon accanto alla porta: verde quando è aperto, rosso appena inizia a chiudere (e finché non ha finito di aprire)
    const verde = negozio.stato === 'aperto' && !negozio.seq;
    if (O.matNeon.userData.verde !== verde) { O.matNeon.userData.verde = verde; const tx = verde ? O.texNeonAperto : O.texNeonChiuso; O.matNeon.map = tx; O.matNeon.emissiveMap = tx; O.matNeon.needsUpdate = true; }
    O.matNeon.emissiveIntensity = 1.1 + 1.2 * luci + 0.08 * Math.sin(t * 23) * (hash(Math.floor(t * 3)) > 0.93 ? 1 : 0);
    // il cartello con la X rossa davanti al bancone
    const ux = clamp((tGioco - (O.finito.userData.quando ?? -99)) / 0.4);
    O.cartelliX.forEach((c, i) => { const u = clamp(ux * 1.4 - i * 0.2);           // uno dopo l'altro
      c.visible = stato.finito || u < 1; c.scale.setScalar(Math.max(0.001, stato.finito ? easeOutBack(u) : 1 - u)); });
    // il gelataio
    const g = O.gelataio, aperto = negozio.stato === 'aperto' && !negozio.seq;
    const salto = aperto ? Math.max(0, Math.sin(clamp((tGioco - (g.userData.vendita ?? -99)) / 0.35) * Math.PI)) * 0.3 : 0;
    g.position.set(N.gx, 0.1 + N.gh + salto + (aperto ? Math.abs(Math.sin(t * 3)) * 0.02 : 0), N.gy);
    g.visible = N.gs > 0.01; g.scale.setScalar(1.15 * Math.max(0.001, N.gs)); g.rotation.y = N.gr;
    g.userData.corpo.rotation.z = Math.sin(t * 2.2) * 0.05;
    // la bocca: sorride, ma si gira all'ingiù se il gelato è finito
    g.userData.bocca.rotation.z = stato.finito ? 0 : Math.PI; g.userData.bocca.position.y = stato.finito ? 0.76 : 0.8;
  }

  // il pullman: arriva giù per la strada di sinistra e si ferma in cima alla strada davanti; la sera riparte verso destra e sparisce
  function aggiornaBus() {
    const B = O.bus, sb = stato.bus;
    // il chiosco della concorrenza: compare con un balzo, sparisce rimpicciolendo
    const ur = (tGioco - stato.rivale.t0) / 0.8, kc = stato.rivale.vis ? easeOutBack(clamp(ur)) : 1 - liscio(0, 1, ur);
    O.chiosco.g.visible = kc > 0.01; O.chiosco.g.scale.setScalar(Math.max(0.001, kc));
    if (!sb.modo) { B.g.visible = false; return; }
    let s = BUS.ferma, sc = 1;
    if (sb.modo === 'arriva') { const u = clamp((tGioco - sb.t0) / 2.6); s = BUS.ferma * trap(u, 0.05, 0.45); sc = easeOutBack(clamp(u / 0.15)); if (u >= 1) sb.modo = 'fermo'; }
    else if (sb.modo === 'parte') { const u = clamp((tGioco - sb.t0) / 3.2); s = lerp(BUS.ferma, BUS.len, trap(u, 0.45, 0.02)); sc = 1 - liscio(0.75, 1, u); if (u >= 1) { sb.modo = null; B.g.visible = false; return; } }
    B.g.visible = true;
    const p = BUS.a(s); B.g.position.set(p.x, 0.05, p.y); B.g.rotation.y = angolo(p.ang); B.g.scale.setScalar(Math.max(0.001, sc));
    B.ruote.forEach((w) => { w.rotation.z = -s / 0.21; });
  }
  // la corsa: gli atleti girano sulla strada ad anello (passano sotto l'arco); l'ispettore va a controllare il magazzino
  function aggiornaCorsa(t) {
    const c = stato.corsa, kc = c.vis ? clamp((tGioco - c.t0) / 0.6) : 1 - clamp((tGioco - c.t0) / 0.6);
    O.traguardo.visible = kc > 0.01; O.traguardo.scale.setScalar(Math.max(0.001, c.vis ? easeOutBack(kc) : kc));
    O.atleti.forEach((a, i) => {
      a.visible = kc > 0.01; if (!a.visible) return;
      const L = STRADA_ANELLO.len, sp = (((tGioco - c.t0) * (1.9 + 0.08 * (i % 3)) + 21.2 - i * 0.75) % L + L) % L, pt = STRADA_ANELLO.a(sp);
      const lat = (i % 2 ? 0.24 : -0.24), nx = -Math.sin(pt.ang), ny = Math.cos(pt.ang);
      a.position.set(pt.x + nx * lat, 0.1 + Math.abs(Math.sin(t * 13 + i)) * 0.14, pt.y + ny * lat);
      a.rotation.y = angolo(pt.ang) + Math.PI / 2; a.userData.corpo.rotation.x = 0.18;
      a.scale.setScalar(1.15 * Math.max(0.001, kc));
    });
    const s = stato.ispettore, u = (tGioco - s.t0) / 4.5, ki = s.vis ? 1 : 1 - clamp((tGioco - s.t0) / 0.5);
    const P = O.ispettore; P.visible = ki > 0.01; if (!P.visible) return;
    const da = [2.6, 8.95], a = [17.7, 8.75], k = s.vis ? clamp(u) : 1;
    const passo = k < 1 ? Math.abs(Math.sin(k * Math.PI * 14)) * 0.12 : 0;
    P.position.set(lerp(da[0], a[0], k), 0.1 + passo, lerp(da[1], a[1], k));
    P.rotation.y = k < 1 ? Math.PI / 2 : Math.PI + 0.7;                 // arrivato, guarda i pacchi del magazzino
    P.userData.corpo.rotation.x = k < 1 ? 0 : 0.3 + Math.sin(t * 2) * 0.05;
    P.scale.setScalar(1.25 * Math.max(0.001, Math.min(ki, s.vis ? clamp(u * 8) : 1)));
  }
  // i clienti: arrivano saltellando lungo il marciapiede fino al bancone; se serviti ripartono col cono, se no tornano indietro a testa bassa
  // (i turisti scendono dal pullman con il fumetto della loro lingua; chi va dalla concorrenza si ferma al chiosco e torna indietro)
  function aggiornaClienti(t, dt) {
    // mentre i ragazzi attraversano, chi arriva si mette in coda prima delle strisce (uno ogni 0,72), senza sovrapporsi
    for (const e of eventi) e.limite = null;
    if (stato.ragazziInStrada) {
      eventi.filter((e) => !e.rivale && e.fase === 'va' && e.x < 7.96).sort((a, b) => b.x - a.x).forEach((e, k) => { e.limite = 7.9 - 0.72 * k; });
      eventi.filter((e) => !e.rivale && e.fase === 'torna' && e.x > 9.64).sort((a, b) => a.x - b.x).forEach((e, k) => { e.limite = 9.7 + 0.72 * k; });
    }
    for (let i = eventi.length - 1; i >= 0; i--) {
      const e = eventi[i], p = e.piolo, corpo = p.userData.corpo;
      // se i ragazzi stanno attraversando, chi sta per passare davanti alle strisce si ferma e aspetta
      const fermo = stato.ragazziInStrada && e.limite != null && (e.fase === 'va' ? e.xLibero >= e.limite : e.xLibero <= e.limite);
      if (!fermo) e.el += dt;
      const u = e.el / e.dur;
      if (u >= 1) { p.visible = false; eventi.splice(i, 1); continue; }
      p.visible = true;
      const da = e.da || [2.6, 8.95 + e.dz], banco = e.banco || [BANCO.x + 1.1 + e.dx, 9.0 + e.dz], via = e.servito ? (e.via || [19.0, 8.95 + e.dz]) : [da[0], da[1] + 0.35];   // chi torna indietro passa più verso la strada
      let pos, testa = 0, verso = 0;
      const passi = (a, b, k, n, alt) => { const f = (k * n) % 1, q = Math.floor(k * n); return saltello(f, [lerp(a[0], b[0], q / n), lerp(a[1], b[1], q / n)], [lerp(a[0], b[0], (q + 1) / n), lerp(a[1], b[1], (q + 1) / n)], alt); };
      e.fase = u < 0.45 ? 'va' : u > 0.6 && !e.servito ? 'torna' : '';
      if (u < 0.45) { pos = passi(da, banco, u / 0.45, e.rivale ? 5 : 9, 0.16); verso = banco[0] < da[0] ? Math.PI : 0; }
      else if (u < 0.6) {
        pos = [banco[0], 0, banco[1]]; verso = Math.PI / 2 * liscio(0.45, 0.5, u);
        if (!e.servito) testa = liscio(0.52, 0.6, u);
        if (!e.alBancoFatto && u > 0.5) { e.alBancoFatto = true; if (e.alBanco) e.alBanco(); }       // per il gioco: il cliente è al bancone
        if (e.servito && !e.venduto && u > 0.5 && !e.rivale) { e.venduto = true; O.gelataio.userData.vendita = tGioco; }
        // appena prende il gelato (o capisce che non c'è) dalla testa esce la faccina
        if (!e.faccina && u > 0.53) { e.faccina = true; emetti(e.servito ? 'cuori' : 'rabbia', banco[0], 1.75, banco[1]); }
      } else {
        const k = (u - 0.6) / 0.4;
        if (e.servito) { pos = passi(banco, via, k, e.rivale ? 4 : 6, 0.22); verso = via[0] < banco[0] ? Math.PI : 0; }
        else { pos = [lerp(banco[0], via[0], easeInOut(k)), 0, lerp(banco[1], via[1], easeInOut(k))]; verso = Math.PI; testa = 1; }
      }
      e.xLibero = pos[0];                                             // dove sarebbe senza fermarsi
      if (fermo) { pos[1] = 0; pos[0] = e.fase === 'va' ? Math.min(pos[0], e.limite) : Math.max(pos[0], e.limite); }   // fermo al suo posto in coda
      e.x = pos[0];
      p.position.set(pos[0], 0.1 + pos[1], pos[2]);
      p.rotation.y = verso + Math.PI / 2;                             // il corpo guarda verso +x quando cammina
      corpo.rotation.x = testa * 0.45;
      const comparsa = Math.min(liscio(0, 0.06, u), 1 - liscio(0.92, 1, u));
      p.scale.setScalar(1.25 * Math.max(1e-3, comparsa));
      p.userData.cono.visible = e.servito && u > 0.55;
      p.userData.fumetto.visible = !!e.turista && (u < 0.44 || u > 0.62);
    }
  }
  // i ragazzi attraversano sulle strisce ed entrano a scuola; escono dopo pranzo
  const fila = { modo: null, F: 0, hPrec: 0 };
  function aggiornaRagazzi(t, h) {
    // in fila indiana sulle strisce, uno ogni 0,6 di distanza: si contano bene
    const LUNGO = 3.9, PASSO = 0.6, n = O.ragazzi.length, tot = LUNGO + PASSO * (n - 1);
    const entra = seg(h, 8.6, 10.0), esce = seg(h, 13.0, 14.4);
    const modo = entra > 0 && (entra < 1 || (fila.modo === 'entra' && fila.F < tot)) ? 'entra'
      : esce > 0 && h >= 13 && (esce < 1 || (fila.modo === 'esce' && fila.F < tot)) ? 'esce' : null;
    const obiettivo = modo === 'entra' ? entra * tot : modo === 'esce' ? esce * tot : 0;
    if (modo !== fila.modo) {
      fila.F = Math.min(obiettivo, 0.2); fila.modo = modo;
      if (modo) suonaCampanella(8.8, 3.6, 8.6);                      // suona la campanella
    }
    const dh = h - fila.hPrec; fila.hPrec = h;
    if (dh < 0 || dh > 1) fila.F = obiettivo;                          // l'ora è saltata: si va subito al posto giusto
    const posizione = (i, F) => { const s = modo === 'entra' ? F - i * PASSO : LUNGO - (F - i * PASSO); return s; };
    // c'è un cliente che sta passando davanti alla scuola?
    const cliente = eventi.some((e) => e.piolo.visible && Math.abs(e.x - 8.8) < 0.85);
    // un ragazzo sta per entrare sul marciapiede?
    const sulBordo = (F) => O.ragazzi.some((_, i) => { const y = 12.2 - posizione(i, F); return modo === 'entra' ? y > 9.55 && y < 9.95 : y > 8.2 && y < 8.45; });
    if (modo && !(cliente && sulBordo(fila.F))) fila.F = Math.min(obiettivo, fila.F + Math.max(0, dh) * tot / 1.4 * 3);
    stato.ragazziInStrada = !!modo;
    O.ragazzi.forEach((r, i) => {
      const s = modo ? posizione(i, fila.F) : -1, dir = modo === 'esce' ? -1 : 1;
      r.visible = s > 0 && s < LUNGO; if (!r.visible) return;
      const y = 12.2 - s, hop = Math.abs(Math.sin(t * 9 + i)) * 0.08;
      r.position.set(8.8, (y < 9.2 ? 0.1 : 0.05) + hop, y);
      r.rotation.y = dir > 0 ? Math.PI : 0;
      r.scale.setScalar(0.95 * Math.max(1e-3, Math.min(seg(s, 0, 0.35), seg(LUNGO - s, 0, 0.35))));
    });
  }

  /* ---------------------------------------------------------------
     CICLO
     --------------------------------------------------------------- */
  function ciclo() {
    requestAnimationFrame(ciclo);
    if (stato.pausa || contenitore.getClientRects().length === 0) { ultimoT = 0; fps.campioni = []; return; }   // nascosto: non lavora
    const t = tReale(), dt = ultimoT ? Math.min(0.1, t - ultimoT) : 0.016; ultimoT = t;
    tGioco += dt * stato.speed;
    misuraFps(dt);
    aggiorna(t, dt);
    if (efficace().effetti && rt) {
      R.setRenderTarget(rt); R.render(scena, camera);
      R.setRenderTarget(null); R.render(quad.s, quad.cam);
    } else { R.setRenderTarget(null); R.render(scena, camera); }
  }

  /* ---------------------------------------------------------------
     AGGANCI PUBBLICI
     --------------------------------------------------------------- */
  const api = {
    async monta(el) {
      if (avviato) return;
      avviato = true; contenitore = el; fps.inizio = tReale();
      try { await document.fonts.load(FONT); } catch (e) { /* senza font si usa il ripiego */ }
      tela = document.createElement('canvas'); tela.className = 'diorama-tela'; tela.setAttribute('aria-hidden', 'true');
      el.prepend(tela);
      R = new THREE.WebGLRenderer({ canvas: tela, antialias: false, powerPreference: 'high-performance' });
      ANISO_MAX = R.capabilities.getMaxAnisotropy(); ANISO = Math.min(ANISO_MAX, efficace().aniso);
      R.shadowMap.enabled = true; R.shadowMap.type = THREE.PCFShadowMap;      // in r187 PCFSoftShadowMap non c'è più: PCFShadowMap con shadow.radius fa le ombre morbide
      R.toneMapping = THREE.NeutralToneMapping; R.toneMappingExposure = 1.0; R.outputColorSpace = THREE.SRGBColorSpace;
      costruisci(); creaPost(); disegnaConi();
      ridimensiona(); new ResizeObserver(ridimensiona).observe(el);
      ciclo();
    },
    setMeteo(m) { stato.meteo = m; },
    setOra(h) { stato.ora = h; },
    camion(attivo, kg, ore, nPacchi) { stato.camion.attivo = !!attivo; stato.camion.kg = kg || 0; stato.camion.ore = ore || 0; stato.camion.n = nPacchi ?? 5; },
    // opz: { turista: 'gb' | 'fr' } (scende dal pullman con il fumetto), { rivale: true } (va al chiosco della concorrenza)
    cliente(servito, durataMs, alBanco, opz = {}) {
      if (!O.clienti) return;
      if (stato.finito && !opz.rivale) servito = false;          // coni finiti: resta senza (e si arrabbia)
      const libero = O.clienti.find((p) => !eventi.some((e) => e.piolo === p));
      if (!libero) { if (alBanco) setTimeout(alBanco, durataMs * 0.5 / Math.max(1, stato.speed)); return; }   // troppa gente: non si vede, ma compra lo stesso
      const n = eventi.length, e = { piolo: libero, servito, el: 0, x: 0, fase: 'va', alBanco, dur: Math.max(0.5, durataMs / 1000), dx: ((n % 3) - 1) * 0.3, dz: (n % 2) * 0.16 };
      if (opz.turista) { e.turista = opz.turista; e.da = [3.9 + (n % 3) * 0.3, 9.5]; libero.userData.fumetto.material = opz.turista === 'fr' ? O.matBonjour : O.matHello; }
      if (opz.rivale) { e.rivale = true; e.banco = [RIVALE.x + ((n % 3) - 1) * 0.28, 8.35]; e.via = [2.6, 8.95 + e.dz]; e.dur *= 0.8; }
      eventi.push(e);
    },
    // il pullman dei turisti: true arriva e si ferma, false riparte, null sparisce subito
    autobus(v) {
      const b = stato.bus;
      if (v === null) { b.modo = null; return; }
      if (v && (!b.modo || b.modo === 'parte')) { b.modo = 'arriva'; b.t0 = tGioco; }
      else if (!v && (b.modo === 'arriva' || b.modo === 'fermo')) { b.modo = 'parte'; b.t0 = tGioco; }
    },
    // 🏅 la corsa dei Giochi studenteschi e 🕵️ l'ispettore dell'ASL
    corsa(v) { if (!!v !== stato.corsa.vis) { stato.corsa.vis = !!v; stato.corsa.t0 = tGioco; } },
    ispettore(v) { if (!!v !== stato.ispettore.vis) { stato.ispettore.vis = !!v; stato.ispettore.t0 = tGioco; } },
    // il chiosco della concorrenza
    rivale(v) { if (!!v !== stato.rivale.vis) { stato.rivale.vis = !!v; stato.rivale.t0 = tGioco - (O.chiosco ? 0 : 99); } },
    setConi(n, max) { if (max) stato.coniMax = max; if (Math.round(n) !== Math.round(stato.coni) || max) { stato.coni = n; disegnaConi(); } },
    setFinito(v) { if (!!v !== stato.finito) { stato.finito = !!v; if (O.finito) O.finito.userData.quando = tGioco; disegnaConi(); } },
    setVenduto(v) { stato.venduto = !!v; },
    setStock(kg, max) { stato.stock = kg; if (max) stato.stockMax = max; },
    nuovoGiorno() { stato.venduto = false; },          // i coni tornano al massimo solo quando il gelataio porta dentro i pacchi
    setSpeed(s) { stato.speed = s; },
    // la gelateria: apre o chiude con tutta la sequenza (restituiscono una promessa che si risolve alla fine)
    apri(nPacchi, durataMs) { if (nPacchi != null) stato.portaOgni = nPacchi; return O.L ? avviaNegozio('aperto', durataMs) : Promise.resolve(); },
    chiudi(durataMs) { return O.L ? avviaNegozio('chiuso', durataMs) : Promise.resolve(); },
    // il gioco comanda apertura e chiusura (false) oppure il negozio apre e chiude da solo con l'ora (true)
    negozioAutomatico(v) { stato.negozioAuto = !!v; },
    // chiude subito, senza animazione (all'inizio di una nuova simulazione)
    chiudiSubito() { negozio.seq = null; negozio.stato = 'chiuso'; },
    // ferma il disegno (per esempio quando si usa la grafica classica)
    pausa(v) {
      stato.pausa = !!v;
      // in pausa il tempo si ferma: una sequenza in corso finisce subito, così chi la aspetta non resta bloccato
      if (v && negozio.seq) { negozio.stato = negozio.verso; negozio.seq = null; negozio.risolvi(); }
    },
    // pacchi già pronti davanti alla porta (consegnati la sera prima)
    // quanti pacchi ci sono sul pallet (il magazzino rimasto) e quanti ne porta dentro ogni mattina
    setPacchi(n) { stato.pila = clamp(Math.round(n), 0, 12); },
    get pacchi() { return stato.pila; },
    // per le etichette sopra la scena (telefono)
    get coni() { return stato.finito ? 0 : Math.max(0, Math.round(stato.coni)); }, get aperto() { return negozio.stato === 'aperto' && !negozio.seq; },
    get schermoPiccolo() { return !!R && schermoPiccolo(); },
    // 'auto' (segue l'azione sugli schermi piccoli), 'segui' (sempre), 'tutto' (sempre tutta la piastrella)
    setInquadratura(m) { stato.inquadratura = m; },
    // la regia della camera: { x, y (coordinate della città), h (altezza), zoom (1 = tutta la piastrella), az (gradi), lento } oppure null
    regia(r) { stato.regia = r || null; },
    // toglie dalla scena clienti in giro e faccine (quando si passa da una scena all'altra)
    svuota() { eventi.length = 0; stato.bus.modo = null; stato.corsa.vis = false; stato.ispettore.vis = false; stato.corsa.t0 = stato.ispettore.t0 = -99; if (O.clienti) O.clienti.forEach((p) => { p.visible = false; }); if (O.faccine) O.faccine.forEach((f) => { f.visible = false; }); },
    setPortaOgni(n) { stato.portaOgni = Math.max(0, Math.round(n)); },
    onRifornito: null,
    get fps() { return fps.valore; }, get qualita() { return stato.qualita; },
    vistaProva(pos, mira) { CAM.vista = pos ? [new THREE.Vector3(...pos), new THREE.Vector3(...mira)] : null; camera.near = pos ? 0.05 : 5; camera.updateProjectionMatrix(); if (pos) camera.clearViewOffset(); else inquadra(); },
    forzaQualita(q) { impostaQualita(q); fps.campioni = []; },
    // il menu della grafica: { auto: true } per la regolazione automatica, oppure { pr, aniso, effetti } a mano
    impostaGrafica(opz) {
      if (opz.auto) { stato.auto = true; stato.manuale = null; if (opz.qualita) stato.qualita = opz.qualita; }
      else { stato.manuale = { ...efficace(), ...opz }; delete stato.manuale.auto; stato.auto = false; }
      fps.campioni = []; fps.lento = 0;
      if (R) ridimensiona();
    },
    get grafica() { const e = efficace(); return { auto: stato.auto, qualita: stato.qualita, pr: e.pr, aniso: Math.min(e.aniso, ANISO_MAX), anisoMax: ANISO_MAX, effetti: e.effetti }; },
    // dove si trova qualcosa sullo schermo (in %), per mettere i cartellini dei guadagni nel DOM
    posizioneSchermo(cosa = 'gelateria') {
      if (!O.L) return [50, 50];
      const v = cosa === 'casse' ? V1.set(CASSE.x, 1.8, CASSE.y) : cosa === 'fornitore' ? V1.set(FORN.x + 1.3, 2.6, FORN.y + 1.4) : V1.set(GEL.x + 1.6, 3.4, GEL.y + 1.3);
      O.L.localToWorld(v.set(v.x, v.y, v.z)); v.project(camera);
      return [(v.x * 0.5 + 0.5) * 100, (0.5 - v.y * 0.5) * 100];
    },
  };
  return api;
})();