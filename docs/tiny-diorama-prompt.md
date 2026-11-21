I want a short 3D motion graphic made with three.js in the "Tiny Diorama" style. Below is the complete source of a reference animation in this exact style, plus the small rendering kit and sound kit it runs on. Use them as your style guide and rebuild the animation around my content.

MY CONTENT:
[Describe your topic, or paste your script here. If this is left as is, ask me for it before building.]


STORYBOARD FIRST: before building the animation, make a VISUAL storyboard and wait for my OK.
- One HTML page (show it as an artifact if you can) with a grid of panels, one per beat (about 3-6). Each panel is a still of that beat's key frame, rendered with the STAGE kit from a block-out of the scene: simple forms in the reference's materials, lighting, camera angle and grade, so the panels already look like the finished piece. Render the stills one after another on one canvas with S.seek(time) at about 16 samples (enough for depth of field and soft shadows to read) and copy each into an image. Stills only, no animation or sound yet.
- Under each panel: the beat number, its start and end time, the exact on-screen text, what moves or changes to get there from the previous panel, what the camera does, and its key sounds.
- Below the grid, list any facts or numbers you had to assume.
When I approve it (or after my changes), build the full animation exactly as storyboarded, reusing the storyboard's scene code.

WHAT TO BUILD
One self-contained HTML file (show it as an artifact if you can):
- three.js 0.187.0 core only, loaded as an ES module from a CDN with an import map (no addons), then set window.THREE = THREE before running the kit and the style code.
- A 1920x1080 canvas scaled to fit the window, with a small control bar: play/pause, a scrub slider, the time, a sound toggle, loop on by default.
- A new style object, built the same way as the reference (content block first, then build(S) returning update(t)), that tells MY CONTENT in this style. 7-12 seconds unless my content needs more.
- Run it with the kit: const S = await K.run(canvas, style, { samples }). Use a low sample count (2-4) while playing live and the style's full count when rendering frames. Expose window.seek = (t) => S.seek(t) and window.DURATION.
- Play the style's sound(k) score in sync from the player: on play call stopSound = SOUND.live((k) => style.sound(k), currentT, { voiceover: false }), and call stopSound() on pause, on seek and when the sound toggle is turned off.
- Include the STAGE kit and the SOUND kit below unchanged.
- Load these Google Fonts before building (the kit awaits the specs in style.fonts): Fredoka

HOW TO STAY IN THE STYLE
- The reference shows the look, not the story. Its objects, layout and beats belong to its own topic: do not reuse them unless my content calls for them. Work out what my content needs to show first, then build those things in this look.
- Tell my content as an explainer, not a title card: things happen to objects or characters over three or four beats that follow from each other, and the picture does the telling. Words are small captions and labels, never the subject of a shot. End on the result of the process or the end of the story, not on a headline, slogan or logo.
- Keep the reference's materials, lighting, camera language, grade and the way things move. Change the story, the objects and the words; do not change the look.
- update(t) must set the whole scene for time t and nothing may build up between calls: the kit calls it many times per frame to make motion blur, depth of field and soft shadows. No Math.random, Date or timers; use K.rng(seed).
- Build everything in code: no downloaded models, images, HDRIs or textures.
- Simple forms, beautifully lit and finished, beat complicated models that look wrong. Draw my subject accurately and double-check any facts or numbers you show.
- It is video, often watched on a phone: keep every word the story needs large, sharp and on screen long enough to read, keep the subject filling most of the frame, and keep everything that matters inside the frame for the whole camera move. The first frame should already be worth looking at, and the last second should hold.

FLOW BETWEEN BEATS
- A new beat does not automatically mean a new scene. When the next idea builds on the last, stay in the same world: the things that matter stay on screen and move, grow, re-arrange or transform, and the camera travels to the part of the scene where the next idea happens.
- When the story really moves on (a new place or time, a before/after contrast, a reveal), change scene the way this look would: a turn of the set, a page, a passing object that wipes the frame, a change of light. No hard cuts.
- The reference's scene count is not a template: fit the number of beats to my content.

SOUND (no voiceover: a fuller mix)
- A sound starts on the exact frame its event appears: drive picture and sound from the same schedule, as the reference does.
- Score the events that land (things arriving, labels, contacts, transitions, the key number, the result) with sounds this material would make: glass, plastic, paper, metal, motors.
- A quiet ambience bed is welcome, and music only if it suits the style. Effects in front, bed and music clearly underneath, and small silences so the big hits read.


If you are Claude Code with a shell: render an MP4 in headless Chrome with the GPU enabled. Load the page, call window.seek(i / 30) for every frame, capture the canvas and pipe the frames into ffmpeg; render the sound with SOUND.renderOffline((k) => style.sound(k), DURATION, 48000, { voiceover: false }) and mux it in at about -15 LUFS. Look at a few rendered frames and fix framing, lighting or legibility problems before you call it done.

STYLE CARD
Name: Tiny Diorama
Family: Spaces and journeys
Use: explainer
Look: A whole little world on one floating tile, like a designer's model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.
Motion: Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop's sign flips to the accent colour when its part is done. The tile turns slowly the whole time.
Light: One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.
Materials: Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.
Camera: Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.
Finish: Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.
Good for: Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.

STAGE KIT (lib/stage.js)
```js
// STAGE: a small film-style rendering kit for three.js motion graphics. Classic script; needs a global THREE (core only,
// no addons). It gives every style the same pipeline:
//   - one clock: stage.seek(t) builds the whole frame for time t, so frames can be rendered alone and in any order
//   - accumulation rendering: each frame is the average of N sub-renders, which gives real motion blur, anti-aliasing,
//     true depth of field (the camera moves across a lens aperture) and soft area-light shadows (lights move across
//     their own surface), all without post-process tricks
//   - HDR bloom, tone mapping, vignette, grain, chromatic aberration and a crisp 2D overlay for captions
//   - code-built lighting environments (no HDRI files), a real mirror floor, canvas textures, text planes, easing,
//     seeded random and noise
// Globals: K (helpers) and registerStyle(). A style is { id, name, ..., render: {...}, build(S) -> { update(t), overlay? } }.
(function (root) {
  const THREE = root.THREE;
  const K = {};
  const STYLES = [];
  root.STYLES = STYLES;
  root.registerStyle = (s) => { STYLES.push(s); return s; };

  // ---------------------------------------------------------------- maths
  K.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.map = (x, a, b, c, d) => c + (d - c) * K.clamp((x - a) / (b - a));
  K.smooth = (a, b, x) => { const t = K.clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  // progress of time t through the window [a, b], 0..1, optionally eased: K.seg(t, 1, 2.5, K.ease.out)
  K.seg = (t, a, b, ease) => { const u = K.clamp((t - a) / (b - a)); return ease ? ease(u) : u; };
  K.ease = {
    linear: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuint: (t) => 1 - Math.pow(1 - t, 5),
    inOutQuint: (t) => (t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2),
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    outElastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
    outBounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  };
  // damped spring from 0 to 1 starting at time 0 (t in seconds). freq in Hz, damp 0..1 (1 = no overshoot)
  K.spring = (t, freq = 2.2, damp = 0.45) => {
    if (t <= 0) return 0;
    const w = 2 * Math.PI * freq;
    if (damp >= 1) return 1 - Math.exp(-w * t) * (1 + w * t);
    const wd = w * Math.sqrt(1 - damp * damp);
    return 1 - Math.exp(-damp * w * t) * (Math.cos(wd * t) + (damp * w / wd) * Math.sin(wd * t));
  };
  // keyframe track: K.track([[0, [0,2,8]], [3, [2,2,6], 'inOut'], [6, 5, K.ease.out]]) -> f(t). Values are numbers or
  // arrays; the ease on a key shapes the move INTO that key.
  K.track = (keys) => (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1, e] = keys[i];
        const fn = typeof e === 'function' ? e : K.ease[e || 'inOut'];
        const u = fn((t - t0) / (t1 - t0));
        return Array.isArray(v0) ? v0.map((a, k) => a + (v1[k] - a) * u) : v0 + (v1 - v0) * u;
      }
    }
    return keys[keys.length - 1][1];
  };

  // like K.track, but the value flows smoothly THROUGH the middle keys without stopping at them (it only eases in at
  // the first key and out at the last). Use it for camera moves that should feel like one continuous shot.
  K.path = (keys) => {
    const n = keys.length, arr = Array.isArray(keys[0][1]), val = (i) => (arr ? keys[i][1] : [keys[i][1]]), dim = val(0).length;
    const m = keys.map((_, i) => (i === 0 || i === n - 1 ? new Array(dim).fill(0) : val(i).map((_, k) => (val(i + 1)[k] - val(i - 1)[k]) / (keys[i + 1][0] - keys[i - 1][0]))));
    return (t) => {
      if (t <= keys[0][0]) return keys[0][1];
      if (t >= keys[n - 1][0]) return keys[n - 1][1];
      let i = 1; while (keys[i][0] < t) i++;
      const t0 = keys[i - 1][0], h = keys[i][0] - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      const a = val(i - 1), b = val(i), out = a.map((_, k) => (2 * u3 - 3 * u2 + 1) * a[k] + (u3 - 2 * u2 + u) * h * m[i - 1][k] + (-2 * u3 + 3 * u2) * b[k] + (u3 - u2) * h * m[i][k]);
      return arr ? out : out[0];
    };
  };

  // ---------------------------------------------------------------- seeded random and noise
  K.rng = (seed) => {
    let a = (typeof seed === 'string' ? [...seed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) : seed * 2654435761) >>> 0;
    const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.range = (lo, hi) => lo + (hi - lo) * r();
    r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r());
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    r.gauss = () => { let u = 0, v = 0; while (u === 0) u = r(); v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    r.sign = () => (r() < 0.5 ? -1 : 1);
    return r;
  };
  // a stable 0..1 hash of up to three numbers (handy for per-instance variation without storing arrays)
  K.hash = (x, y = 0, z = 0) => { let h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123; return h - Math.floor(h); };
  K.noise = (seed = 1) => {
    const r = K.rng(seed), p = new Uint8Array(512), perm = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const grad = (h, x, y, z) => { const u = (h & 15) < 8 ? x : y, v = (h & 15) < 4 ? y : (h & 15) === 12 || (h & 15) === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
    const n3 = (x, y, z) => {
      const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
      x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
      const u = fade(x), v = fade(y), w = fade(z), A = p[X] + Y, AA = p[A] + Z, AB = p[A + 1] + Z, B = p[X + 1] + Y, BA = p[B] + Z, BB = p[B + 1] + Z;
      const L = K.lerp;
      return L(L(L(grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z), u), L(grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z), u), v),
        L(L(grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1), u), L(grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1), u), v), w);
    };
    const fbm = (x, y, z = 0, oct = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * n3(x * f, y * f, z * f); a *= 0.5; f *= 2; } return s; };
    return { n3, n2: (x, y) => n3(x, y, 0), fbm };
  };
  const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
  K.halton = halton;

  // ---------------------------------------------------------------- textures, text, geometry
  // K.canvasTex(1024, 512, (ctx, w, h) => {...}) -> THREE.CanvasTexture (sRGB, mipmapped). Redraw with tex.redraw(fn).
  K.canvasTex = (w, h, draw, opts = {}) => {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (draw) draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = opts.data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
    tex.anisotropy = 8; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
    if (opts.repeat) { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(opts.repeat[0], opts.repeat[1]); }
    tex.redraw = (fn) => { ctx.clearRect(0, 0, w, h); fn(ctx, w, h); tex.needsUpdate = true; };
    tex.canvas2d = cv; tex.ctx = ctx;
    return tex;
  };
  // A flat piece of text living in the 3D world. K.textPlane('Hello', { font: '800 160px "Inter"', color: '#fff',
  // height: 0.5 }) -> Mesh whose world height is `height` units per line. opts: align, lineHeight, glow (emissive
  // multiplier for bloom), lit (use a lit material so it takes shadows), maxWidthPx, letterSpacing (px), pad (px).
  K.textPlane = (text, o = {}) => {
    const font = o.font || '700 160px "Inter"', px = +(/(\d+(?:\.\d+)?)px/.exec(font) || [0, 160])[1];
    const lines = String(text).split('\n'), lh = (o.lineHeight || 1.12) * px, pad = o.pad == null ? Math.ceil(px * 0.25) : o.pad;
    const m = document.createElement('canvas').getContext('2d'); m.font = font;
    if (o.letterSpacing) m.letterSpacing = o.letterSpacing + 'px';
    const wpx = Math.ceil(Math.max(...lines.map((l) => m.measureText(l).width))) + pad * 2, hpx = Math.ceil(lh * lines.length) + pad * 2;
    const tex = K.canvasTex(wpx, hpx, (ctx) => {
      ctx.font = font; if (o.letterSpacing) ctx.letterSpacing = o.letterSpacing + 'px';
      ctx.textBaseline = 'middle'; ctx.textAlign = o.align || 'center'; ctx.fillStyle = o.color || '#ffffff';
      const x = o.align === 'left' ? pad : o.align === 'right' ? wpx - pad : wpx / 2;
      lines.forEach((l, i) => ctx.fillText(l, x, pad + lh * (i + 0.5)));
    });
    const unit = (o.height || 1) / px, hWorld = hpx * unit, wWorld = wpx * unit; // `height` = world size of the font's px size
    const mat = o.lit
      ? new THREE.MeshStandardMaterial({ map: tex, transparent: true, alphaTest: 0.02, roughness: o.roughness == null ? 0.8 : o.roughness, metalness: 0 })
      : new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    if (o.glow && !o.lit) mat.color.setScalar(o.glow);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(wWorld, hWorld), mat);
    mesh.userData.size = [wWorld, hWorld]; mesh.userData.tex = tex;
    return mesh;
  };
  // Box with rounded edges, centred on the origin. r = edge radius, seg = roundness.
  K.roundedBox = (w, h, d, r = 0.05, seg = 6) => {
    r = Math.max(1e-4, Math.min(r, w / 2, h / 2, d / 2));
    const N = 2 * seg + 1, g = new THREE.BoxGeometry(2, 2, 2, N, N, N), p = g.attributes.position, nrm = g.attributes.normal;
    const half = [w / 2 - r, h / 2 - r, d / 2 - r], v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      const c = [p.getX(i), p.getY(i), p.getZ(i)], inner = [0, 0, 0], a = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        const idx = Math.round((c[k] + 1) * N / 2), side = idx <= seg ? -1 : 1;
        a[k] = idx <= seg ? -(1 - idx / seg) : (idx - seg - 1) / seg; inner[k] = side * half[k];
      }
      v.set(Math.tan(a[0] * Math.PI / 4), Math.tan(a[1] * Math.PI / 4), Math.tan(a[2] * Math.PI / 4)).normalize();
      p.setXYZ(i, inner[0] + v.x * r, inner[1] + v.y * r, inner[2] + v.z * r); nrm.setXYZ(i, v.x, v.y, v.z);
    }
    // UVs: each of the six sides is mapped flat, 0..1 across the whole side, so textures are not stretched at the corners
    const uv = g.attributes.uv, per = (N + 1) * (N + 1), sz = [w, h, d];
    const ax = [[2, 1, -1], [2, 1, 1], [0, 2, 1, -1], [0, 2, 1, 1], [0, 1, 1], [0, 1, -1]];   // [u axis, v axis, u sign, v sign] for +x -x +y -y +z -z
    for (let i = 0; i < p.count; i++) {
      const f = ax[Math.min(5, Math.floor(i / per))], c = [p.getX(i), p.getY(i), p.getZ(i)];
      uv.setXY(i, f[2] * c[f[0]] / sz[f[0]] + 0.5, (f[3] || 1) * c[f[1]] / sz[f[1]] + 0.5);
    }
    g.computeBoundingBox(); g.computeBoundingSphere();
    return g;
  };
  // Flat rounded rectangle (a card, a screen, a tile), in the XY plane facing +Z, with UVs 0..1 across it.
  K.roundedRect = (w, h, r = 0.05, seg = 8) => {
    const s = new THREE.Shape(), x = w / 2, y = h / 2; r = Math.min(r, x, y);
    s.moveTo(-x + r, -y); s.lineTo(x - r, -y); s.absarc(x - r, -y + r, r, -Math.PI / 2, 0); s.lineTo(x, y - r); s.absarc(x - r, y - r, r, 0, Math.PI / 2);
    s.lineTo(-x + r, y); s.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI); s.lineTo(-x, -y + r); s.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5);
    const g = new THREE.ShapeGeometry(s, seg), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
    return g;
  };
  // Tube along a list of [x,y,z] points (smooth Catmull-Rom). closed loops allowed.
  K.tube = (pts, radius = 0.05, o = {}) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2] || 0)), !!o.closed, 'centripetal');
    const g = new THREE.TubeGeometry(curve, o.segments || Math.max(8, pts.length * 3), radius, o.radial || 12, !!o.closed);
    g.userData.curve = curve;
    return g;
  };
  // Set instance i of an InstancedMesh: K.place(mesh, i, [x,y,z], [rx,ry,rz], scale | [sx,sy,sz]). Call
  // mesh.instanceMatrix.needsUpdate = true once after a batch.
  const _o = new THREE.Object3D();
  K.place = (mesh, i, p, r, s) => {
    _o.position.set(p[0], p[1], p[2]); if (r) _o.rotation.set(r[0], r[1], r[2]); else _o.rotation.set(0, 0, 0);
    if (s == null) _o.scale.set(1, 1, 1); else if (typeof s === 'number') _o.scale.set(s, s, s); else _o.scale.set(s[0], s[1], s[2]);
    _o.updateMatrix(); mesh.setMatrixAt(i, _o.matrix);
  };
  // Camera: position, look-at target, optional fov and roll. K.focus sets the lens: focus distance (or a point to
  // focus on) and aperture radius in world units (0 = everything sharp).
  const _v = new THREE.Vector3();
  K.look = (cam, pos, target, fov, roll) => {
    cam.position.set(pos[0], pos[1], pos[2]); cam.up.set(0, 1, 0); cam.lookAt(target[0], target[1], target[2]);
    if (roll) cam.rotateZ(roll);
    if (fov && fov !== cam.fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  };
  K.focus = (cam, at, aperture) => {
    cam.userData.focus = typeof at === 'number' ? at : _v.set(at[0], at[1], at[2]).distanceTo(cam.position);
    if (aperture != null) cam.userData.aperture = aperture;
  };

  // ---------------------------------------------------------------- lighting
  // Code-built lighting environment for reflections and soft fill (replaces an HDRI). K.env(S, { top, horizon,
  // bottom: sky gradient colours; panels: [{ pos:[x,y,z], size:[w,h], color, power }] bright rectangles that face the
  // origin (softboxes, windows, a sun); intensity; background: true to also show it behind the scene; blur }).
  // Metal and glass can only shine if the environment has something bright in it.
  K.env = (S, o = {}) => {
    const es = new THREE.Scene();
    const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color(o.top || '#0b0d12') }, hor: { value: new THREE.Color(o.horizon || o.top || '#14171f') }, bot: { value: new THREE.Color(o.bottom || o.horizon || '#050506') }, gain: { value: o.skyPower == null ? 1 : o.skyPower } },
      vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'varying vec3 vD; uniform vec3 top, hor, bot; uniform float gain; void main(){ float y = normalize(vD).y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.6)) : mix(hor, bot, pow(-y, 0.5)); gl_FragColor = vec4(c * gain, 1.0); }',
    }));
    es.add(sky);
    for (const p of o.panels || []) {
      const c = new THREE.Color(p.color || '#ffffff').multiplyScalar(p.power == null ? 5 : p.power);
      const m = new THREE.Mesh(p.round ? new THREE.CircleGeometry((p.size ? p.size[0] : 4) / 2, 40) : new THREE.PlaneGeometry(p.size ? p.size[0] : 4, p.size ? p.size[1] : 4), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.set(p.pos[0], p.pos[1], p.pos[2]); m.lookAt(0, p.aimY || 0, 0); es.add(m);
    }
    const pm = new THREE.PMREMGenerator(S.renderer);
    const rt = pm.fromScene(es, o.blur == null ? 0.02 : o.blur, 0.1, 200);
    pm.dispose();
    S.scene.environment = rt.texture;
    S.scene.environmentIntensity = o.intensity == null ? 1 : o.intensity;
    if (o.background) { S.scene.background = rt.texture; S.scene.backgroundBlurriness = o.backgroundBlur == null ? 0.5 : o.backgroundBlur; S.scene.backgroundIntensity = o.backgroundIntensity == null ? 1 : o.backgroundIntensity; }
    return rt.texture;
  };
  // A shadow-casting spot light with a real size: `soft` is the radius of the light's surface in world units, which
  // gives true soft-edged shadows (bigger = softer). o: pos, target, color, power, angle, penumbra, soft, mapSize, near, far.
  K.spot = (S, o = {}) => {
    const l = new THREE.SpotLight(o.color || '#ffffff', o.power == null ? 80 : o.power, o.distance || 0, o.angle == null ? 0.5 : o.angle, o.penumbra == null ? 0.6 : o.penumbra, o.decay == null ? 2 : o.decay);
    l.position.set(...(o.pos || [3, 6, 4])); l.target.position.set(...(o.target || [0, 0, 0]));
    l.castShadow = o.shadow !== false; l.shadow.mapSize.setScalar(o.mapSize || 2048); l.shadow.bias = o.bias == null ? -0.0004 : o.bias; l.shadow.normalBias = o.normalBias == null ? 0.02 : o.normalBias;
    l.shadow.camera.near = o.near || 0.5; l.shadow.camera.far = o.far || 60;
    S.scene.add(l, l.target);
    if (o.soft) S.softLights.push({ light: l, radius: o.soft });
    return l;
  };
  // A sun: parallel light with shadows. `size` is the half-width of the area that gets shadows, `soft` the blur of
  // shadow edges in world units at the light (0.3-1.5 looks natural). o: pos, target, color, power, size, soft, mapSize.
  K.sun = (S, o = {}) => {
    const l = new THREE.DirectionalLight(o.color || '#ffffff', o.power == null ? 3 : o.power);
    l.position.set(...(o.pos || [6, 10, 5])); l.target.position.set(...(o.target || [0, 0, 0]));
    const s = o.size || 8, c = l.shadow.camera;
    l.castShadow = o.shadow !== false; c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 0.5; c.far = o.far || 80;
    l.shadow.mapSize.setScalar(o.mapSize || 2048); l.shadow.bias = o.bias == null ? -0.0004 : o.bias; l.shadow.normalBias = o.normalBias == null ? 0.02 : o.normalBias;
    S.scene.add(l, l.target);
    if (o.soft) S.softLights.push({ light: l, radius: o.soft });
    return l;
  };
  // Sky light with real occlusion: light arrives from the whole dome and is blocked by objects, so creases, contact
  // points and the ground under things darken softly (ambient occlusion, but physically made). o: color, power,
  // size (half-width covered), center, mapSize, spread (1 = full dome, lower = more from above).
  K.skyLight = (S, o = {}) => {
    const l = new THREE.DirectionalLight(o.color || '#ffffff', o.power == null ? 1.5 : o.power);
    const s = o.size || 8, c = l.shadow.camera;
    l.castShadow = true; c.left = -s; c.right = s; c.top = s; c.bottom = -s; c.near = 0.5; c.far = (o.dist || 30) * 2;
    l.shadow.mapSize.setScalar(o.mapSize || 1024); l.shadow.bias = o.bias == null ? -0.0006 : o.bias; l.shadow.normalBias = o.normalBias == null ? 0.03 : o.normalBias;
    l.target.position.set(...(o.center || [0, 0, 0]));
    S.scene.add(l, l.target);
    S.skyLights.push({ light: l, dist: o.dist || 30, spread: o.spread == null ? 1 : o.spread });
    return l;
  };
  // A real mirror floor at height y: reflects the scene, and still takes light and shadows like a normal material.
  // o: y, size, color, roughness (0 = perfect mirror, 0.3 = soft blurred reflection), strength (0..1), metalness,
  // fresnel (true = reflects more at grazing angles, like polished stone or wet ground), map/normalMap etc via `material`.
  K.mirrorFloor = (S, o = {}) => {
    const y = o.y || 0, W = S.W, H = S.H, scale = o.resolution || 1;
    const rt = new THREE.WebGLRenderTarget(Math.round(W * scale), Math.round(H * scale), { type: THREE.HalfFloatType, samples: S.msaa, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
    const mat = new THREE.MeshStandardMaterial(Object.assign({ color: o.color || '#111114', roughness: o.surfaceRoughness == null ? 0.35 : o.surfaceRoughness, metalness: o.metalness || 0 }, o.material || {}));
    const u = { tMirror: { value: rt.texture }, uMirrorMatrix: { value: new THREE.Matrix4() }, uMirrorStrength: { value: o.strength == null ? 0.6 : o.strength }, uMirrorFresnel: { value: o.fresnel === false ? 0 : 1 }, uMirrorFade: { value: o.fade || 0 }, uMirrorBlur: { value: (o.roughness || 0) * 7 } };
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uMirrorMatrix; varying vec4 vMirrorCoord; varying vec3 vMirrorWorld;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvec4 mw = modelMatrix * vec4(transformed, 1.0); vMirrorWorld = mw.xyz; vMirrorCoord = uMirrorMatrix * mw;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tMirror; uniform float uMirrorStrength, uMirrorFresnel, uMirrorFade, uMirrorBlur; varying vec4 vMirrorCoord; varying vec3 vMirrorWorld;')
        .replace('#include <opaque_fragment>', `vec3 mRefl = min(texture2DProj(tMirror, vMirrorCoord, uMirrorBlur).rgb, vec3(12.0));
          float mF = pow(1.0 - saturate(dot(normalize(vViewPosition), normal)), 5.0);
          float mK = uMirrorStrength * mix(1.0, 0.06 + 0.94 * mF, uMirrorFresnel);
          if (uMirrorFade > 0.0) mK *= exp(-length(vMirrorWorld.xz) / uMirrorFade);
          outgoingLight += mRefl * mK;
          #include <opaque_fragment>`);
    };
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.size || 80, o.size || 80), mat);
    mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.receiveShadow = true;
    S.scene.add(mesh);
    S.mirrors.push({ mesh, rt, u, y, rough: o.roughness || 0, cam: new THREE.PerspectiveCamera() });
    return mesh;
  };

  // ---------------------------------------------------------------- the stage
  const QUAD_VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const TONE = `
    vec3 tmFilmic(vec3 c){ // ACES fitted (Stephen Hill)
      mat3 a = mat3(0.59719,0.07600,0.02840, 0.35458,0.90834,0.13383, 0.04823,0.01566,0.83777);
      mat3 b = mat3(1.60475,-0.10208,-0.00327, -0.53108,1.10813,-0.07276, -0.07367,-0.00605,1.07602);
      c = a * (c / 0.6); vec3 x = c * (c + 0.0245786) - 0.000090537; vec3 y = c * (0.983729 * c + 0.4329510) + 0.238081;
      return clamp(b * (x / y), 0.0, 1.0);
    }
    vec3 tmNeutral(vec3 c){ // Khronos PBR neutral: keeps colours true, only compresses highlights
      float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
      float peak = max(c.r, max(c.g, c.b)); if (peak < 0.76) return c;
      float d = 1.0 - 0.76; float np = 1.0 - d * d / (peak + d - 0.76); c *= np / peak;
      float g = 1.0 - 1.0 / (0.15 * (peak - np) + 1.0); return mix(c, vec3(np), g);
    }
    vec3 tmAgx(vec3 c){ // AgX (minimal, Benjamin Wrensch): soft, filmic, desaturates bright colours gracefully
      mat3 m = mat3(0.842479062253094,0.0423282422610123,0.0423756549057051, 0.0784335999999992,0.878468636469772,0.0784336, 0.0792237451477643,0.0791661274605434,0.879142973793104);
      mat3 mi = mat3(1.19687900512017,-0.0528968517574562,-0.0529716355144438, -0.0980208811401368,1.15190312990417,-0.0980434501171241, -0.0990297440797205,-0.0989611768448433,1.15107367264116);
      c = m * c; c = clamp((log2(max(c, 1e-10)) + 12.47393) / 16.5, 0.0, 1.0);
      vec3 x2 = c * c, x4 = x2 * x2;
      c = 15.5 * x4 * x2 - 40.14 * x4 * c + 31.96 * x4 - 6.868 * x2 * c + 0.4298 * x2 + 0.1191 * c - 0.00232;
      c = mi * c; return pow(max(c, 0.0), vec3(2.2));
    }`;

  function pass(frag, uniforms) {
    return new THREE.ShaderMaterial({ vertexShader: QUAD_VS, fragmentShader: 'precision highp float; varying vec2 vUv;\n' + frag, uniforms, depthTest: false, depthWrite: false });
  }

  // createStage(canvas, style, { samples }) -> S. S.seek(t) renders one finished frame.
  K.createStage = (canvas, style, opts = {}) => {
    const R = Object.assign({ samples: 32, preview: 3, shutter: 0.5, fps: 30, exposure: 1, tone: 'filmic', bloom: 0.25, bloomThreshold: 1.0, bloomRadius: 1, vignette: 0.25, grain: 0.03, ca: 0, saturation: 1, contrast: 1, lift: 0, fov: 35, near: 0.1, far: 200, background: '#000000', shadows: true }, style.render || {});
    const W = opts.width || 1920, H = opts.height || 1080;
    const N = Math.max(1, opts.samples || R.samples);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false);
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = !!R.shadows; renderer.shadowMap.type = R.shadowType === 'vsm' ? THREE.VSMShadowMap : THREE.PCFShadowMap;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(R.background);
    const camera = new THREE.PerspectiveCamera(R.fov, W / H, R.near, R.far);
    camera.position.set(0, 1.5, 8); camera.userData.aperture = 0; camera.userData.focus = 8;
    const msaa = N >= 8 ? 0 : 4;
    const S = { THREE, K, renderer, scene, camera, W, H, style, R, samples: N, msaa, softLights: [], skyLights: [], mirrors: [], duration: style.duration || 6 };

    const HF = { type: THREE.HalfFloatType, depthBuffer: false };
    const sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: msaa });
    const accRT = new THREE.WebGLRenderTarget(W, H, HF);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    const qScene = new THREE.Scene(); qScene.add(quad);
    const qCam = new THREE.Camera();
    const draw = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(qScene, qCam); };

    const mAcc = pass('uniform sampler2D tex; uniform float w; void main(){ gl_FragColor = vec4(min(texture2D(tex, vUv).rgb, vec3(64.0)) * w, w); }', { tex: { value: sceneRT.texture }, w: { value: 1 } });
    mAcc.blending = THREE.CustomBlending; mAcc.blendEquation = THREE.AddEquation; mAcc.blendSrc = THREE.OneFactor; mAcc.blendDst = THREE.OneFactor; mAcc.transparent = true;

    // bloom: threshold, then a chain of down-samples and smooth up-samples (wide, soft, no blockiness)
    const LV = 7, bl = [];
    for (let i = 0, w = W >> 1, h = H >> 1; i < LV && w > 4 && h > 4; i++, w >>= 1, h >>= 1) bl.push({ d: new THREE.WebGLRenderTarget(w, h, HF), u: new THREE.WebGLRenderTarget(w, h, HF), w, h });
    const mPre = pass('uniform sampler2D tex; uniform float thr; void main(){ vec3 c = min(texture2D(tex, vUv).rgb, vec3(60.0)); float l = max(c.r, max(c.g, c.b)); float k = clamp((l - thr) / max(thr * 0.5, 1e-3), 0.0, 1.0); gl_FragColor = vec4(c * k * k * (3.0 - 2.0 * k), 1.0); }', { tex: { value: accRT.texture }, thr: { value: R.bloomThreshold } });
    const mDown = pass(`uniform sampler2D tex; uniform vec2 px;
      void main(){ vec3 a = texture2D(tex, vUv + px * vec2(-2, 2)).rgb, b = texture2D(tex, vUv + px * vec2(0, 2)).rgb, c = texture2D(tex, vUv + px * vec2(2, 2)).rgb,
        d = texture2D(tex, vUv + px * vec2(-2, 0)).rgb, e = texture2D(tex, vUv).rgb, f = texture2D(tex, vUv + px * vec2(2, 0)).rgb,
        g = texture2D(tex, vUv + px * vec2(-2, -2)).rgb, h = texture2D(tex, vUv + px * vec2(0, -2)).rgb, i = texture2D(tex, vUv + px * vec2(2, -2)).rgb,
        j = texture2D(tex, vUv + px * vec2(-1, 1)).rgb, k = texture2D(tex, vUv + px * vec2(1, 1)).rgb, l = texture2D(tex, vUv + px * vec2(-1, -1)).rgb, m = texture2D(tex, vUv + px * vec2(1, -1)).rgb;
        gl_FragColor = vec4(e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125, 1.0); }`, { tex: { value: null }, px: { value: new THREE.Vector2() } });
    const mUp = pass(`uniform sampler2D tex, add; uniform vec2 px; uniform float r;
      void main(){ vec2 o = px * r; vec3 s = texture2D(tex, vUv).rgb * 4.0 + (texture2D(tex, vUv + vec2(o.x, 0)).rgb + texture2D(tex, vUv - vec2(o.x, 0)).rgb + texture2D(tex, vUv + vec2(0, o.y)).rgb + texture2D(tex, vUv - vec2(0, o.y)).rgb) * 2.0
        + texture2D(tex, vUv + o).rgb + texture2D(tex, vUv - o).rgb + texture2D(tex, vUv + vec2(o.x, -o.y)).rgb + texture2D(tex, vUv + vec2(-o.x, o.y)).rgb;
        gl_FragColor = vec4(s / 16.0 + texture2D(add, vUv).rgb, 1.0); }`, { tex: { value: null }, add: { value: null }, px: { value: new THREE.Vector2() }, r: { value: R.bloomRadius } });

    const ovCanvas = document.createElement('canvas'); ovCanvas.width = W; ovCanvas.height = H;
    const ovCtx = ovCanvas.getContext('2d');
    const ovTex = new THREE.CanvasTexture(ovCanvas); ovTex.colorSpace = THREE.NoColorSpace; ovTex.premultiplyAlpha = true; ovTex.generateMipmaps = false; ovTex.minFilter = THREE.LinearFilter;
    const mOut = pass(TONE + `
      uniform sampler2D tex, bloom; uniform float exposure, bloomK, vig, ca, sat, con, lift, levels; uniform int tone; uniform vec2 res;
      void main(){
        vec2 d = vUv - 0.5; float r2 = dot(d, d);
        vec3 c;
        if (ca > 0.0) { c.r = texture2D(tex, 0.5 + d * (1.0 + ca * r2)).r; c.g = texture2D(tex, vUv).g; c.b = texture2D(tex, 0.5 + d * (1.0 - ca * r2)).b; }
        else c = texture2D(tex, vUv).rgb;
        c += texture2D(bloom, vUv).rgb * bloomK / levels;
        c = max(c * exposure, 0.0);
        c = tone == 0 ? tmFilmic(c) : tone == 1 ? tmNeutral(c) : tone == 2 ? tmAgx(c) : clamp(c, 0.0, 1.0);
        float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        c = mix(vec3(l), c, sat); c = (c - 0.5) * con + 0.5; c = c + lift * (1.0 - c);
        c *= 1.0 - vig * smoothstep(0.22, 0.8, length(d * vec2(1.0, 0.82)));
        c = clamp(c, 0.0, 1.0);
        c = mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
        gl_FragColor = vec4(c, 1.0);
      }`, { tex: { value: accRT.texture }, bloom: { value: null }, exposure: { value: R.exposure }, bloomK: { value: R.bloom }, vig: { value: R.vignette }, ca: { value: R.ca }, sat: { value: R.saturation }, con: { value: R.contrast }, lift: { value: R.lift }, levels: { value: 1 }, tone: { value: { filmic: 0, neutral: 1, agx: 2, linear: 3 }[R.tone] ?? 0 }, res: { value: new THREE.Vector2(W, H) } });

    // after grading the picture is 8-bit display colour: optional style filters run here (painterly, dither, halftone...),
    // then grain and the 2D overlay go on top
    const LD = { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
    const ldA = new THREE.WebGLRenderTarget(W, H, LD), ldB = new THREE.WebGLRenderTarget(W, H, LD);
    const mFin = pass(`uniform sampler2D tex, ov; uniform float grain, seed, useOv;
      float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){ vec3 c = texture2D(tex, vUv).rgb; float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
        float g = (h21(gl_FragCoord.xy + seed) + h21(gl_FragCoord.xy * 1.37 + seed * 1.7) - 1.0);
        c += g * grain * (0.55 + 0.45 * (1.0 - l));
        if (useOv > 0.5) { vec4 o = texture2D(ov, vUv); c = o.rgb + c * (1.0 - o.a); }
        gl_FragColor = vec4(c, 1.0); }`, { tex: { value: ldA.texture }, ov: { value: ovTex }, grain: { value: R.grain }, seed: { value: 0 }, useOv: { value: 0 } });
    const filters = [];
    // S.addFilter(fragmentShaderBody, uniforms): a full-screen pass over the graded picture. The shader gets
    // `uniform sampler2D tex; uniform vec2 res; uniform float time; varying vec2 vUv;` and must set gl_FragColor.
    S.addFilter = (frag, uniforms = {}) => { const m = pass('uniform sampler2D tex; uniform vec2 res; uniform float time;\n' + frag, Object.assign({ tex: { value: null }, res: { value: new THREE.Vector2(W, H) }, time: { value: 0 } }, uniforms)); filters.push(m); return m; };

    let api = null;
    const cp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), nrm = new THREE.Vector3();
    const rot = new THREE.Matrix4(), plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4(), saved = [];

    function renderMirrors(i) {
      for (const m of S.mirrors) {
        const cam = m.cam;
        // roughness: tilt the mirror plane a little differently on each sub-render, which blurs the reflection
        const a = m.rough * 0.12, th = 2 * Math.PI * halton(i + 1, 7), rr = Math.sqrt(halton(i + 1, 11)) * a;
        nrm.set(Math.cos(th) * rr, 1, Math.sin(th) * rr).normalize();
        const origin = tmp2.set(0, m.y, 0);
        camera.getWorldPosition(cp);
        const view = tmp.copy(origin).sub(cp);
        if (view.dot(nrm) > 0) continue;
        view.reflect(nrm).negate().add(origin);
        rot.extractRotation(camera.matrixWorld);
        const look = new THREE.Vector3(0, 0, -1).applyMatrix4(rot).add(cp);
        const target = origin.clone().sub(look).reflect(nrm).negate().add(origin);
        cam.position.copy(view); cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(nrm); cam.lookAt(target);
        cam.near = camera.near; cam.far = camera.far; cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
        m.u.uMirrorMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
        // clip everything below the mirror (oblique near plane)
        plane.setFromNormalAndCoplanarPoint(nrm, origin).applyMatrix4(cam.matrixWorldInverse);
        clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
        const pm = cam.projectionMatrix.elements;
        q.x = (Math.sign(clip.x) + pm[8]) / pm[0]; q.y = (Math.sign(clip.y) + pm[9]) / pm[5]; q.z = -1; q.w = (1 + pm[10]) / pm[14];
        clip.multiplyScalar(2 / clip.dot(q));
        pm[2] = clip.x; pm[6] = clip.y; pm[10] = clip.z + 1 - 0.003; pm[14] = clip.w;
        m.mesh.visible = false;
        renderer.setRenderTarget(m.rt); renderer.render(scene, cam);
        m.mesh.visible = true;
      }
    }

    function subRender(t, i, n) {
      api.update(t);
      saved.length = 0;
      // lights with a size: sample a different point on the light each sub-render
      S.softLights.forEach((s, k) => {
        const l = s.light; saved.push([l, l.position.clone()]);
        if (n === 1) return;
        const u = (halton(i + 1, 3) + k * 0.37) % 1, v = (halton(i + 1, 5) + k * 0.61) % 1, r = Math.sqrt(u) * s.radius, a = 2 * Math.PI * v;
        tmp.copy(l.position).sub(l.target ? l.target.position : tmp2.set(0, 0, 0)).normalize();
        right.set(0, 1, 0).cross(tmp); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize(); up.crossVectors(tmp, right);
        l.position.addScaledVector(right, Math.cos(a) * r).addScaledVector(up, Math.sin(a) * r);
      });
      S.skyLights.forEach((s, k) => {
        const u = (halton(i + 1, 2) + k * 0.31) % 1, v = (halton(i + 1, 3) + k * 0.53) % 1;
        const sinT = Math.sqrt(u) * s.spread, cosT = Math.sqrt(Math.max(0, 1 - sinT * sinT)), a = 2 * Math.PI * v;
        const c = s.light.target.position;
        if (n === 1) s.light.position.set(c.x + 0.15 * s.dist, c.y + s.dist, c.z + 0.1 * s.dist);
        else s.light.position.set(c.x + Math.cos(a) * sinT * s.dist, c.y + cosT * s.dist, c.z + Math.sin(a) * sinT * s.dist);
      });
      // lens: move the camera across the aperture and shear the view so the focus plane stays put (true depth of field)
      camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      const camPos = camera.position.clone(), e = camera.projectionMatrix.elements;
      if (n > 1) {
        const ap = camera.userData.aperture || 0, fd = Math.max(0.05, camera.userData.focus || 8);
        if (ap > 0) {
          const r = Math.sqrt(halton(i + 1, 2)) * ap, a = 2 * Math.PI * halton(i + 1, 3), dx = Math.cos(a) * r, dy = Math.sin(a) * r;
          right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
          camera.position.addScaledVector(right, dx).addScaledVector(up, dy); camera.updateMatrixWorld();
          e[8] -= e[0] * dx / fd; e[9] -= e[5] * dy / fd;
        }
        e[8] += (halton(i + 1, 5) - 0.5) * 2 / W; e[9] += (halton(i + 1, 7) - 0.5) * 2 / H;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      }
      if (S.mirrors.length) renderMirrors(i);
      renderer.setRenderTarget(sceneRT); renderer.render(scene, camera);
      camera.position.copy(camPos); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
      for (const [l, p] of saved) l.position.copy(p);
    }

    S.seek = (t, sampleOverride) => {
      const n = sampleOverride || S.samples;
      renderer.setRenderTarget(accRT); renderer.setClearColor(0x000000, 0); renderer.clear();
      mAcc.uniforms.w.value = 1 / n;
      for (let i = 0; i < n; i++) {
        const ts = n > 1 ? t + ((i + 0.5) / n - 0.5) * R.shutter / R.fps : t;
        subRender(K.clamp(ts, 0, S.duration), i, n);
        renderer.autoClear = false; draw(mAcc, accRT); renderer.autoClear = true;
      }
      api.update(t); // leave the scene at the exact frame time (for the overlay and anything that reads it)
      let bloomTex = null;
      if (R.bloom > 0) {
        mPre.uniforms.thr.value = R.bloomThreshold; draw(mPre, bl[0].d);
        for (let i = 1; i < bl.length; i++) { mDown.uniforms.tex.value = bl[i - 1].d.texture; mDown.uniforms.px.value.set(1 / bl[i - 1].w, 1 / bl[i - 1].h); draw(mDown, bl[i].d); }
        let prev = bl[bl.length - 1].d;
        for (let i = bl.length - 2; i >= 0; i--) { mUp.uniforms.tex.value = prev.texture; mUp.uniforms.add.value = bl[i].d.texture; mUp.uniforms.px.value.set(1 / prev.width, 1 / prev.height); draw(mUp, bl[i].u); prev = bl[i].u; }
        bloomTex = prev.texture;
      }
      const o = mOut.uniforms;
      o.bloom.value = bloomTex; o.bloomK.value = bloomTex ? R.bloom : 0; o.levels.value = bl.length; o.exposure.value = R.exposure; o.vig.value = R.vignette; o.ca.value = R.ca; o.sat.value = R.saturation; o.con.value = R.contrast; o.lift.value = R.lift;
      draw(mOut, ldA);
      let src = ldA, dst = ldB;
      for (const f of filters) { f.uniforms.tex.value = src.texture; f.uniforms.time.value = t; draw(f, dst); [src, dst] = [dst, src]; }
      const fu = mFin.uniforms;
      fu.tex.value = src.texture; fu.grain.value = R.grain; fu.seed.value = Math.round(t * R.fps) * 17.0 % 1000;
      if (api.overlay) { ovCtx.clearRect(0, 0, W, H); ovCtx.save(); api.overlay(ovCtx, t, W, H); ovCtx.restore(); ovTex.needsUpdate = true; fu.useOv.value = 1; } else fu.useOv.value = 0;
      draw(mFin, null);
    };
    S.setApi = (a) => { api = typeof a === 'function' ? { update: a } : a; };
    return S;
  };

  // Load fonts, build the style and return its stage. `K.run(canvas, style, { samples })`.
  K.run = async (canvas, style, opts) => {
    if (style.fonts && document.fonts) await Promise.all(style.fonts.map((f) => document.fonts.load(f).catch(() => null)));
    const S = K.createStage(canvas, style, opts);
    S.setApi(await style.build(S));
    return S;
  };

  root.K = K;
})(typeof window !== 'undefined' ? window : globalThis);
```

SOUND KIT (lib/sound.js)
```js
// sound.js: a small synthesized sound kit for the style explainers. Plain Web Audio, no audio files.
// Voiceover mode: SOUND.kit(ctx, { voiceover: true }) drops beds and music, plays anything marked minor
// (play(..., { minor: true }), tone/noise { minor: true }, or scheduled inside k.withMinor(() => ...)) at about 60%
// volume instead of full, and sits all effects a little lower, so the narration stays on top while the piece still
// sounds alive. In the full mix, minor sounds play at full volume. Scores can read k.vo to branch further.
// A style adds   explainerSound(k) { k.bed('room', 0, D); k.play('pop', 1.25); ... }   and the same
// call schedules into a live AudioContext (the player) or an OfflineAudioContext (the video render).
// Times are seconds on the explainer's own clock. Randomness is seeded, so every render is identical.
(function () {
  'use strict';
  const SOUND = (window.SOUND = {});
  const TINY = 1e-4;

  // seeded random in [0,1), keyed by any string
  function rand(key) {
    let h = 2166136261;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = h >>> 0 || 1;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  // note names to Hz: 'A4' = 440, 'C#5', 'Eb3'
  const STEP = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function hz(n) {
    if (typeof n === 'number') return n;
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(n);
    const semis = STEP[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12 - 9;
    return 440 * Math.pow(2, semis / 12);
  }
  SOUND.hz = hz;

  SOUND.kit = function (ctx, opts) {
    const o = opts || {};
    const VO = !!o.voiceover;
    const MINOR = 0.6; // voiceover-mode volume for minor sounds
    let inMinor = false;
    const gainOf = (p, d) => (p.gain == null ? d : p.gain) * (VO && (p.minor || inMinor) ? MINOR : 1);
    const T0 = (o.start || 0) - 0; // explainer time that maps to ctx time `base`
    const base = ctx.currentTime + (o.delay || 0);
    // Start times snap to the sample grid (+ a quarter sample): in Chrome a source started a hair off the grid can
    // spike to about twice its set level.
    const SR = ctx.sampleRate;
    const at = (t) => (Math.round((base + (t - T0)) * SR) + 0.25) / SR;

    // ---- buses: sfx, amb, music -> compressor -> master; one shared reverb send
    const master = ctx.createGain(); master.gain.value = o.master == null ? 0.9 : o.master;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.18;
    comp.connect(master); master.connect(o.dest || ctx.destination);
    const bus = {};
    for (const [name, g] of Object.entries({ sfx: VO ? 0.7 : 0.85, amb: 0.5, music: 0.45 })) { bus[name] = ctx.createGain(); bus[name].gain.value = g; bus[name].connect(comp); }

    // generated room reverb: decaying stereo noise, darker toward the tail
    const verb = ctx.createConvolver();
    {
      const secs = 1.6, n = Math.floor(secs * ctx.sampleRate), ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (let c = 0; c < 2; c++) {
        const r = rand('verb' + c), d = ir.getChannelData(c); let lp = 0;
        for (let i = 0; i < n; i++) { const u = i / n; lp += (0.6 - 0.45 * u) * ((r() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - u, 3); }
      }
      verb.buffer = ir;
    }
    const verbIn = ctx.createGain(); verbIn.gain.value = 0.9; verbIn.connect(verb); verb.connect(comp);

    // seeded noise buffers: white, pink-ish and brown
    const noiseBuf = {};
    {
      const n = Math.floor(2.5 * ctx.sampleRate);
      for (const kind of ['white', 'pink', 'brown']) {
        const b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), r = rand('noise-' + kind);
        let p0 = 0, p1 = 0, p2 = 0, br = 0;
        for (let i = 0; i < n; i++) {
          const w = r() * 2 - 1;
          if (kind === 'white') d[i] = w;
          else if (kind === 'pink') { p0 = 0.997 * p0 + 0.029 * w; p1 = 0.985 * p1 + 0.032 * w; p2 = 0.95 * p2 + 0.048 * w; d[i] = (p0 + p1 + p2 + w * 0.05) * 2.2; }
          else { br = (br + 0.02 * w) / 1.02; d[i] = br * 3.2; }
        }
        noiseBuf[kind] = b;
      }
    }

    // ---- automation helpers
    // a value or [[dt, value], ...] from the voice start; ramps are exponential (frequencies)
    function sweep(param, v, t) {
      if (!Array.isArray(v)) { param.setValueAtTime(v, t); return; }
      param.setValueAtTime(v[0][1], t + v[0][0]);
      for (let i = 1; i < v.length; i++) param.exponentialRampToValueAtTime(Math.max(v[i][1], 1), t + v[i][0]);
    }
    // amplitude: linear attack to `gain`, optional hold, exponential release to silence by `dur`
    function shape(param, t, gain, dur, a, hold) {
      a = Math.min(a == null ? 0.004 : a, dur * 0.9);
      hold = Math.min(hold || 0, dur - a);
      param.setValueAtTime(0, t);
      param.linearRampToValueAtTime(gain, t + a);
      if (hold > 0) param.setValueAtTime(gain, t + a + hold);
      param.exponentialRampToValueAtTime(TINY, t + dur);
      param.setValueAtTime(0, t + dur + 0.001);
    }
    function out(node, p) {
      const pan = ctx.createStereoPanner(); pan.pan.value = Math.max(-1, Math.min(1, p.pan || 0));
      node.connect(pan); pan.connect(bus[p.bus || 'sfx']);
      if (p.verb) { const s = ctx.createGain(); s.gain.value = p.verb; pan.connect(s); s.connect(verbIn); }
    }
    function filterNode(p, t) {
      if (!p.filter) return null;
      const f = ctx.createBiquadFilter(); f.type = p.filter; f.Q.value = p.q == null ? 1 : p.q;
      sweep(f.frequency, p.f == null ? 1000 : p.f, t);
      return f;
    }

    // Live playback from the middle of a piece: a long sound (a bed, a pad) that began before that point has a start
    // time in the past, which Web Audio refuses. Pick it up now, at its held level, for the time it has left.
    function late(t, dur, p) {
      if (t >= ctx.currentTime) return null;   // never true in an offline render, so rendered sound is unchanged
      const now = ctx.currentTime + 0.01;
      const cut = now - t, left = dur - cut;
      if (left < 0.08) return { skip: true };
      const a = Math.min(0.05, left / 2);
      return { t: now, dur: left, p: Object.assign({}, p, { a, hold: Math.max(0, Math.min(left - a - 0.02, (p.a == null ? 0.004 : p.a) + (p.hold || 0) - cut)) }) };
    }

    // ---- primitives
    // tone(t, { f, type, dur, gain, a, hold, pan, verb, bus, filter, f2 (filter freq), q, detune })
    function tone(time, p) {
      let t = at(time), dur = p.dur || 0.2;
      if (t + dur < ctx.currentTime || (time < T0 - 0.001 && dur < 1.5)) return;
      const lt = late(t, dur, p); if (lt) { if (lt.skip) return; t = lt.t; dur = lt.dur; p = lt.p; }
      const osc = ctx.createOscillator(); osc.type = p.type || 'sine';
      sweep(osc.frequency, Array.isArray(p.f) ? p.f.map(([d, v]) => [d, hz(v)]) : hz(p.f || 440), t);
      if (p.detune) osc.detune.value = p.detune;
      const g = ctx.createGain(); shape(g.gain, t, gainOf(p, 0.3), dur, p.a, p.hold);
      let node = osc;
      if (p.filter) { const f = ctx.createBiquadFilter(); f.type = p.filter; f.Q.value = p.q == null ? 0.8 : p.q; sweep(f.frequency, p.f2 || 2000, t); osc.connect(f); node = f; }
      node.connect(g); out(g, p);
      osc.start(t); osc.stop(t + dur + 0.02);
    }
    // noise(t, { dur, color, filter, f, q, gain, a, hold, pan, verb, bus, rate })
    function noise(time, p) {
      let t = at(time), dur = p.dur || 0.2;
      if (t + dur < ctx.currentTime || (time < T0 - 0.001 && dur < 1.5)) return;
      const lt = late(t, dur, p); if (lt) { if (lt.skip) return; t = lt.t; dur = lt.dur; p = lt.p; }
      const src = ctx.createBufferSource(); src.buffer = noiseBuf[p.color || 'white']; src.loop = true;
      if (p.rate) src.playbackRate.value = p.rate;
      const g = ctx.createGain(); shape(g.gain, t, gainOf(p, 0.3), dur, p.a, p.hold);
      const f = filterNode(p, t);
      if (f) { src.connect(f); f.connect(g); } else src.connect(g);
      out(g, p);
      const off = rand('off' + time + (p.f || ''))() * 2;
      src.start(t, off); src.stop(t + dur + 0.02);
    }

    // ---- named sounds. play(name, t, opts): opts.gain scales the whole sound, opts.pan places it.
    const S = {
      // UI / motion graphics
      pop: (t, o) => { tone(t, { f: [[0, o.f || 620], [0.07, (o.f || 620) * 0.45]], dur: 0.1, gain: 0.32 * o.g, pan: o.pan }); noise(t, { dur: 0.012, filter: 'highpass', f: 3000, gain: 0.12 * o.g, pan: o.pan }); },
      tick: (t, o) => noise(t, { dur: 0.018, filter: 'bandpass', f: o.f || 4200, q: 2.5, gain: 0.3 * o.g, pan: o.pan }),
      click: (t, o) => { tone(t, { f: o.f || 1900, type: 'square', dur: 0.02, gain: 0.08 * o.g, filter: 'lowpass', f2: 3000, pan: o.pan }); noise(t, { dur: 0.01, filter: 'highpass', f: 2500, gain: 0.15 * o.g, pan: o.pan }); },
      tock: (t, o) => { tone(t, { f: o.f || 820, dur: 0.07, gain: 0.25 * o.g, pan: o.pan }); noise(t, { dur: 0.05, filter: 'bandpass', f: o.f || 820, q: 9, gain: 0.35 * o.g, pan: o.pan }); },
      blip: (t, o) => tone(t, { f: o.f || 'E6', type: o.type || 'square', dur: o.dur || 0.07, gain: 0.07 * o.g, a: 0.002, hold: (o.dur || 0.07) * 0.6, pan: o.pan }),
      whoosh: (t, o) => { const d = o.dur || 0.45; noise(t, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 350], [d * 0.55, o.top || 2600], [d, 700]], q: 0.9, gain: 0.32 * o.g, a: d * 0.5, pan: o.pan, verb: 0.15 }); },
      swish: (t, o) => { const d = o.dur || 0.18; noise(t, { dur: d, filter: 'highpass', f: [[0, 1800], [d, 5200]], q: 0.7, gain: 0.22 * o.g, a: d * 0.35, pan: o.pan }); },
      riser: (t, o) => { const d = o.dur || 0.8; noise(t, { dur: d, color: 'pink', filter: 'bandpass', f: [[0, 300], [d, 4000]], q: 1.2, gain: 0.25 * o.g, a: d * 0.95, pan: o.pan, verb: 0.2 }); tone(t, { f: [[0, 180], [d, 720]], type: 'triangle', dur: d, gain: 0.06 * o.g, a: d * 0.9 }); },
      thud: (t, o) => { tone(t, { f: [[0, o.f || 130], [0.16, 42]], dur: 0.26, gain: 0.55 * o.g, pan: o.pan }); noise(t, { dur: 0.09, color: 'brown', filter: 'lowpass', f: 500, gain: 0.35 * o.g, pan: o.pan }); },
      impact: (t, o) => { S.thud(t, o); noise(t, { dur: 0.7, color: 'pink', filter: 'lowpass', f: [[0, 2400], [0.6, 300]], gain: 0.3 * o.g, verb: 0.35, pan: o.pan }); },
      stamp: (t, o) => { S.thud(t, { ...o, f: 160 }); noise(t, { dur: 0.05, filter: 'bandpass', f: 1300, q: 1.2, gain: 0.4 * o.g, pan: o.pan }); noise(t + 0.004, { dur: 0.012, filter: 'highpass', f: 3500, gain: 0.25 * o.g, pan: o.pan }); },
      ding: (t, o) => { const f = hz(o.f || 'E6'); tone(t, { f, dur: 1.3, gain: 0.2 * o.g, verb: 0.3, pan: o.pan }); tone(t, { f: f * 2.76, dur: 0.5, gain: 0.05 * o.g, verb: 0.3, pan: o.pan }); },
      success: (t, o) => { S.ding(t, { ...o, f: o.f || 'C6' }); S.ding(t + 0.09, { ...o, f: hz(o.f || 'C6') * 1.5, g: o.g * 0.9 }); },
      error: (t, o) => { tone(t, { f: o.f || 'A3', type: 'square', dur: 0.13, gain: 0.09 * o.g, hold: 0.08, filter: 'lowpass', f2: 1400, pan: o.pan }); tone(t + 0.15, { f: hz(o.f || 'A3') * 0.8, type: 'square', dur: 0.22, gain: 0.09 * o.g, hold: 0.14, filter: 'lowpass', f2: 1200, pan: o.pan }); },
      buzz: (t, o) => { const d = o.dur || 0.3; tone(t, { f: o.f || 110, type: 'sawtooth', dur: d, gain: 0.12 * o.g, hold: d * 0.7, filter: 'lowpass', f2: 900, pan: o.pan }); tone(t, { f: (o.f || 110) * 1.01, type: 'sawtooth', dur: d, gain: 0.1 * o.g, hold: d * 0.7, filter: 'lowpass', f2: 900, pan: o.pan }); },
      sparkle: (t, o) => { const r = rand('sparkle' + t), notes = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7']; for (let i = 0; i < (o.n || 6); i++) { const ti = t + i * 0.04 + r() * 0.01, f = hz(notes[Math.floor(r() * notes.length)]), pan = r() * 1.2 - 0.6; tone(ti, { f, dur: 0.6, gain: 0.04 * o.g, a: 0.002, verb: 0.35, pan }); tone(ti, { f: f * 2.76, dur: 0.2, gain: 0.012 * o.g, a: 0.002, pan }); } },
      glitch: (t, o) => { const r = rand('glitch' + t); for (let i = 0; i < 7; i++) tone(t + i * 0.022, { f: 200 + r() * 1800, type: 'square', dur: 0.02, gain: 0.07 * o.g, a: 0.001, hold: 0.015, pan: r() * 1.4 - 0.7 }); noise(t, { dur: 0.16, filter: 'bandpass', f: 2500, q: 0.6, gain: 0.12 * o.g }); },
      shutter: (t, o) => { S.click(t, o); noise(t + 0.06, { dur: 0.04, filter: 'bandpass', f: 2200, q: 1, gain: 0.2 * o.g, pan: o.pan }); },
      count: (t, o) => S.tick(t, { ...o, f: o.f || 5200, g: o.g * 0.7 }),

      // hand-made media
      // stroke: a pen/marker/chalk/pencil stroke over `dur` seconds. material sets the surface sound.
      stroke: (t, o) => {
        const d = o.dur || 0.4, m = o.material || 'marker', r = rand('stroke' + m + t);
        const M = {
          marker: { f: 2900, q: 2.2, g: 0.16, grain: 0.05 },
          chalk: { f: 1700, q: 0.6, g: 0.22, grain: 0.028 },
          pencil: { f: 4600, q: 0.8, g: 0.16, grain: 0.04, filter: 'highpass' },
          pen: { f: 4200, q: 1.6, g: 0.08, grain: 0.06 },
          brush: { f: 900, q: 0.5, g: 0.1, grain: 0.09, color: 'pink' },
          sharpie: { f: 2400, q: 1.4, g: 0.2, grain: 0.045 },
        }[m];
        for (let x = 0; x < d; x += M.grain * (0.7 + r() * 0.6)) {
          const gd = M.grain * (0.8 + r() * 0.9);
          noise(t + x, { dur: gd, color: M.color, filter: M.filter || 'bandpass', f: M.f * (0.8 + r() * 0.4), q: M.q, gain: M.g * o.g * (0.6 + r() * 0.5), a: gd * 0.3, pan: (o.pan || 0) + (r() - 0.5) * 0.2 });
        }
      },
      // paper: picking up / slapping down / turning a sheet
      paper: (t, o) => { const d = o.dur || 0.35, r = rand('paper' + t); for (let x = 0; x < d; x += 0.025 + r() * 0.03) noise(t + x, { dur: 0.05, filter: 'bandpass', f: 1200 + r() * 2600, q: 0.9, gain: 0.12 * o.g * (1 - x / d * 0.5), pan: o.pan }); },
      slap: (t, o) => { noise(t, { dur: 0.07, filter: 'highpass', f: 900, gain: 0.45 * o.g, a: 0.001, pan: o.pan }); tone(t, { f: [[0, 180], [0.06, 70]], dur: 0.1, gain: 0.25 * o.g, pan: o.pan }); },
      tape: (t, o) => { noise(t, { dur: o.dur || 0.5, filter: 'bandpass', f: [[0, 900], [o.dur || 0.5, 2200]], q: 1.8, gain: 0.18 * o.g, a: 0.02, pan: o.pan }); },
      press: (t, o) => { S.thud(t, { ...o, f: 95, g: o.g * 0.9 }); noise(t + 0.01, { dur: 0.25, color: 'brown', filter: 'lowpass', f: 700, gain: 0.25 * o.g, pan: o.pan }); },
      roller: (t, o) => { const d = o.dur || 0.6; noise(t, { dur: d, color: 'brown', filter: 'bandpass', f: 380, q: 1.5, gain: 0.3 * o.g, a: 0.05, hold: d * 0.6, pan: o.pan }); for (let x = 0; x < d; x += 0.07) S.tock(t + x, { f: 300, g: o.g * 0.15, pan: o.pan }); },
      erase: (t, o) => { const d = o.dur || 0.6, r = rand('erase' + t); for (let x = 0; x < d; x += 0.06 + r() * 0.04) noise(t + x, { dur: 0.08, color: 'pink', filter: 'bandpass', f: 700 + r() * 500, q: 0.8, gain: 0.22 * o.g, a: 0.03, pan: (r() - 0.5) * 0.5 }); },

      // machines and screens
      key: (t, o) => { const r = rand('key' + t); noise(t, { dur: 0.025, filter: 'bandpass', f: 2600 + r() * 1200, q: 2, gain: 0.25 * o.g, a: 0.001, pan: o.pan }); tone(t, { f: 160 + r() * 40, dur: 0.04, gain: 0.12 * o.g, pan: o.pan }); },
      typing: (t, o) => { const r = rand('typing' + t), n = o.n || 8, rate = o.rate || 0.09; for (let i = 0; i < n; i++) S.key(t + i * rate * (0.75 + r() * 0.5), { g: o.g * (0.7 + r() * 0.4), pan: o.pan }); },
      typebar: (t, o) => { S.key(t, o); noise(t + 0.008, { dur: 0.03, filter: 'bandpass', f: 1100, q: 4, gain: 0.35 * o.g, pan: o.pan }); },
      bell: (t, o) => S.ding(t, { ...o, f: o.f || 'A6' }),
      boot: (t, o) => { tone(t, { f: [[0, 80], [0.35, 1600]], type: 'sine', dur: 0.5, gain: 0.08 * o.g, a: 0.3 }); S.blip(t + 0.45, { ...o, f: 'C6', dur: 0.12 }); },
      crtOn: (t, o) => { noise(t, { dur: 0.25, filter: 'highpass', f: 2000, gain: 0.2 * o.g, a: 0.001 }); tone(t, { f: 15700, dur: 1.5, gain: 0.02 * o.g, a: 0.1, hold: 1 }); S.thud(t, { ...o, f: 90, g: o.g * 0.5 }); },
      neon: (t, o) => { const d = o.dur || 0.25, r = rand('neon' + t); for (let x = 0; x < d; x += 0.035 + r() * 0.04) tone(t + x, { f: 120, type: 'sawtooth', dur: 0.03, gain: 0.3 * o.g * (0.5 + r() * 0.5), filter: 'bandpass', f2: 1200, q: 1.2, pan: o.pan }); },
      // chip (8-bit console) sounds: raw square/triangle, no filtering
      coin: (t, o) => { tone(t, { f: 'B5', type: 'square', dur: 0.07, gain: 0.07 * o.g, a: 0.001, hold: 0.06 }); tone(t + 0.07, { f: 'E6', type: 'square', dur: 0.3, gain: 0.07 * o.g, a: 0.001, hold: 0.1 }); },
      jump: (t, o) => tone(t, { f: [[0, 260], [0.16, 820]], type: 'square', dur: 0.18, gain: 0.07 * o.g, a: 0.001, hold: 0.12 }),
      hurt: (t, o) => { tone(t, { f: [[0, 600], [0.25, 90]], type: 'square', dur: 0.28, gain: 0.08 * o.g, a: 0.001, hold: 0.2 }); noise(t, { dur: 0.2, filter: 'lowpass', f: 1800, gain: 0.15 * o.g, rate: 0.25 }); },
      powerup: (t, o) => ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'].forEach((n, i) => tone(t + i * 0.045, { f: n, type: 'square', dur: 0.06, gain: 0.06 * o.g, a: 0.001, hold: 0.05 })),
      select: (t, o) => { S.blip(t, { ...o, f: 'A5', dur: 0.04 }); S.blip(t + 0.05, { ...o, f: 'E6', dur: 0.05 }); },
      text: (t, o) => { const n = o.n || 10, rate = o.rate || 0.05; for (let i = 0; i < n; i++) tone(t + i * rate, { f: i % 2 ? 'C6' : 'G5', type: 'square', dur: 0.025, gain: 0.04 * o.g, a: 0.001, hold: 0.015 }); },
    };

    function play(name, t, opts) {
      const fn = S[name];
      if (!fn) throw new Error('unknown sound: ' + name);
      const o2 = Object.assign({}, opts); o2.g = o2.gain == null ? 1 : o2.gain;
      if (opts && opts.minor) withMinor(() => fn(t, o2)); else fn(t, o2);
    }

    // everything scheduled inside fn counts as minor (quieter in voiceover mode)
    function withMinor(fn) { const was = inMinor; inMinor = true; try { fn(); } finally { inMinor = was; } }

    // ---- beds: continuous sound under a stretch of time. bed(name, t0, t1, opts)
    function bed(name, t0, t1, p) {
      if (VO) return;
      p = p || {}; const g = p.gain == null ? 1 : p.gain, d = t1 - t0, fade = Math.min(0.4, d / 4);
      const long = (q) => Object.assign({ dur: d, a: fade, hold: d - fade * 2, bus: 'amb' }, q);
      if (name === 'room') noise(t0, long({ color: 'brown', filter: 'lowpass', f: 320, gain: 0.12 * g }));
      else if (name === 'hiss') noise(t0, long({ color: 'pink', filter: 'highpass', f: 5000, gain: 0.02 * g }));
      else if (name === 'hum') { tone(t0, long({ f: 60, gain: 0.05 * g })); tone(t0, long({ f: 120, gain: 0.025 * g })); tone(t0, long({ f: 180, type: 'triangle', gain: 0.012 * g })); }
      else if (name === 'rain') { noise(t0, long({ color: 'pink', filter: 'bandpass', f: 2500, q: 0.4, gain: 0.08 * g })); const r = rand('rain'); for (let x = 0; x < d; x += 0.04 + r() * 0.08) noise(t0 + x, { dur: 0.01, filter: 'highpass', f: 4000, gain: 0.04 * g * r(), bus: 'amb', pan: r() * 1.6 - 0.8 }); }
      else if (name === 'projector') { noise(t0, long({ color: 'pink', filter: 'highpass', f: 3000, gain: 0.03 * g })); for (let x = 0; x < d; x += 1 / 24) S.tock(t0 + x, { f: 700, g: 0.04 * g, pan: 0.3 }); }
      else if (name === 'vinyl') { noise(t0, long({ color: 'pink', filter: 'bandpass', f: 1500, q: 0.5, gain: 0.025 * g })); const r = rand('vinyl'); for (let x = 0; x < d; x += 0.08 + r() * 0.4) noise(t0 + x, { dur: 0.006, filter: 'highpass', f: 2500, gain: 0.08 * g * r(), bus: 'amb' }); }
      else throw new Error('unknown bed: ' + name);
    }

    // ---- music: optional light beds that sit under the effects. music(name, t0, t1, { bpm, chords, gain })
    // chords: list of note arrays, one per bar, cycled. e.g. [['C4','E4','G4','B4'], ['A3','C4','E4','G4']]
    function music(name, t0, t1, p) {
      if (VO) return;
      p = p || {}; const g = p.gain == null ? 1 : p.gain, bpm = p.bpm || 100, beat = 60 / bpm, bar = beat * 4;
      const chords = p.chords || [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'F4']];
      let i = 0;
      for (let t = t0; t < t1 - 0.05; t += bar, i++) {
        const ch = chords[i % chords.length], len = Math.min(bar, t1 - t);
        if (name === 'pad' || name === 'pulse') ch.forEach((n, k) => { tone(t, { f: n, type: 'triangle', dur: len + 0.3, gain: 0.035 * g, a: 0.25, hold: len - 0.3, bus: 'music', filter: 'lowpass', f2: 1400, pan: (k - 1.5) * 0.25, verb: 0.25 }); tone(t, { f: hz(n) * 1.004, type: 'sine', dur: len + 0.3, gain: 0.03 * g, a: 0.3, hold: len - 0.3, bus: 'music' }); });
        if (name === 'pulse') for (let b = 0; b < 4 && t + b * beat < t1 - 0.05; b++) {
          const tb = t + b * beat;
          tone(tb, { f: [[0, 110], [0.1, 50]], dur: 0.18, gain: (b % 2 ? 0.16 : 0.26) * g, bus: 'music' });
          noise(tb + beat / 2, { dur: 0.04, filter: 'highpass', f: 7000, gain: 0.05 * g, bus: 'music' });
          tone(tb + beat / 2, { f: hz(ch[0]) / 2, type: 'triangle', dur: beat * 0.45, gain: 0.08 * g, bus: 'music' });
        }
        if (name === 'chip') for (let s = 0; s < 8 && t + s * beat / 2 < t1 - 0.05; s++) {
          const ts = t + s * beat / 2;
          tone(ts, { f: hz(ch[0]) / 2, type: 'triangle', dur: beat * 0.45, gain: 0.12 * g, a: 0.001, hold: beat * 0.35, bus: 'music' });
          tone(ts, { f: ch[[0, 1, 2, 3, 2, 1, 2, 3][s]], type: 'square', dur: beat * 0.4, gain: 0.03 * g, a: 0.001, hold: beat * 0.25, bus: 'music' });
        }
      }
    }

    return { play, bed, music, tone, noise, withMinor, hz, vo: VO, sounds: Object.keys(S) };
  };

  // Live playback for a player: SOUND.live(scoreFn, fromT, { voiceover, master }) starts the score from explainer time
  // fromT right now and returns stop(). Call stop() on pause or seek, and SOUND.live again on play.
  SOUND.live = function (fn, fromT, opts) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    fn(SOUND.kit(ctx, Object.assign({}, opts, { start: fromT || 0, delay: 0.03 })));
    return () => { try { ctx.close(); } catch (e) {} };
  };

  // Render a style's explainerSound into an OfflineAudioContext; returns interleaved float stereo.
  SOUND.renderOffline = async function (fn, duration, sampleRate, kitOpts) {
    const sr = sampleRate || 48000, len = Math.ceil(duration * sr);
    const ctx = new OfflineAudioContext(2, len, sr);
    fn(SOUND.kit(ctx, kitOpts || {}));
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), inter = new Float32Array(len * 2);
    let peak = 0;
    for (let i = 0; i < len; i++) { inter[2 * i] = L[i]; inter[2 * i + 1] = R[i]; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
    return { inter, peak, frames: len, sr };
  };
})();
```

REFERENCE STYLE SOURCE (styles/tiny-diorama.js; its sample topic was "How your parcel gets to you")
```js
{
  // ---------------------------------------------------------------- content (change this block for a new topic)
  // Three stops on one tile. Each stop has a sign that starts grey and flips to the accent colour when its part of
  // the story is done. Positions are tile coordinates: x runs left to right, z runs back (-) to front (+), y is up
  // and 0 is the grass.
  const SIGNS = [
    { word: 'PACKED', at: [-3.2, -2.9], h: 2.85 },       // stands on the depot roof
    { word: 'ON THE WAY', at: [0.05, -2.5], h: 1.62 },   // beside the first stretch of road
    { word: 'DELIVERED', at: [3.65, -0.9], h: 3.0 },     // behind the house
  ];
  const TILE = { w: 12.6, d: 8.2, r: 1.0 }, FLOOR = -3.5;   // FLOOR: how far below the grass the backdrop paper lies
  // centre line of the road: it leaves the depot at the back left, snakes forward and runs off the front right edge
  const ROAD = [[-2.4, -1.7], [-1.2, -1.7], [0.0, -1.7], [1.0, -1.55], [1.75, -0.85], [1.8, 0.1], [1.15, 0.9], [0.75, 1.75], [1.25, 2.5], [2.3, 2.7], [3.6, 2.7], [5.0, 2.7], [6.38, 2.7]];
  const VAN_START_X = -0.55, VAN_STOP_X = 2.4;      // where on the first and last straight the van waits
  const DEPOT = { x: -3.9, z: -1.8, w: 3.0, d: 3.2, h: 1.5 }, DOOR_Z = -1.7;
  const HOME = { x: 4.6, z: 0.5, w: 2.0, d: 1.9, h: 1.35 };
  const MAT = [4.6, 1.86];                           // the doormat, where the parcel ends up

  // a restrained box of paints: neutrals, two greens, earth, and ONE accent that only the parcel's journey may use
  const PAL = {
    backdrop: '#b4d2de', evening: '#93b0cf', grass: '#9fc47c', leaf: ['#5fa574', '#3f866c', '#84ba6b'], trunk: '#8b5b3e',
    earth: ['#5c4135', '#8f6248', '#c9955f', '#7c7f8e'], stone: ['#a9a9b0', '#d9cdb8', '#8d8f9c'],
    cream: '#f6ebd8', slate: '#44718a', mustard: '#f0b040', accent: '#e9573f', glass: '#2c4658', dark: '#272b36',
    road: '#6e7080', kraft: '#cb9c68', skin: '#f2c8a2', smoke: '#ffffff', water: '#8fd0e0', lampGlow: '#ffc56e',
  };
  const FONT = '600 160px "Fredoka"';

  // ---------------------------------------------------------------- one schedule for picture and sound
  const T = {
    push: 0.25, inVan: 0.95,         // the parcel rolls off the conveyor into the van
    shut: 1.15,                      // the hatch slams
    go: 1.45, arrive: 4.55,          // the drive
    rollDown: [1.7, 2.4],            // the depot door closes behind it
    out: 4.72,                       // the courier jumps out with the parcel on his head
    hops: [4.96, 5.24], hopLen: 0.22,
    drop: 5.66,                      // the parcel lands on the doormat
    back: 5.78,                      // the courier steps back
    lamp: 5.1, open: 5.95, lights: 6.03, greet: 6.12,
    cheer: [6.5, 6.8],
  };
  const FLIPS = [T.shut + 0.1, 2.15, T.greet + 0.1];   // when sign 1, 2, 3 flip to "done"

  // ---------------------------------------------------------------- the diorama kit (nothing below knows about parcels until `build`)
  const D2R = Math.PI / 180;
  const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

  // SHAPES ----------------------------------------------------------
  // A rounded rectangle lying on the ground, as a loop of points with outward normals and the distance walked so far.
  function ring(w, d, r, n = 10) {
    const pts = [], hx = w / 2 - r, hz = d / 2 - r; let u = 0, px = 0, pz = 0;
    for (let k = 0; k < 4; k++) for (let i = 0; i <= n; i++) {
      const a = (k + i / n) * Math.PI / 2, x = (k === 0 || k === 3 ? hx : -hx) + r * Math.cos(a), z = (k < 2 ? hz : -hz) + r * Math.sin(a);
      if (pts.length) u += Math.hypot(x - px, z - pz);
      px = x; pz = z; pts.push({ x, z, nx: Math.cos(a), nz: Math.sin(a), u });
    }
    pts.push({ ...pts[0], u: u + Math.hypot(pts[0].x - px, pts[0].z - pz) });
    pts.around = pts[pts.length - 1].u;
    return pts;
  }
  // Sweep a side profile around that loop: this is how the tile, its grass cap, plinths and ponds are made.
  // profile = [[inset, y, slope?], ...] from the top edge down; slope is the normal's angle from straight up
  // (0 = up, PI/2 = out, PI = down) and is worked out from the neighbours when left out. Group 0 = sides, 1 = top.
  function loft(loop, profile, cap = true) {
    const P = profile.map(([inset, y, a], j) => { const p0 = profile[Math.max(0, j - 1)], p1 = profile[Math.min(profile.length - 1, j + 1)]; return [inset, y, a == null ? Math.atan2(p0[1] - p1[1], p0[0] - p1[0]) : a]; });
    const M = loop.length, pos = [], nor = [], uv = [], idx = [], y0 = P[0][1], y1 = P[P.length - 1][1];
    for (const [inset, y, a] of P) for (const p of loop) { pos.push(p.x - p.nx * inset, y, p.z - p.nz * inset); nor.push(p.nx * Math.sin(a), Math.cos(a), p.nz * Math.sin(a)); uv.push(p.u / loop.around, (y - y1) / (y0 - y1 || 1)); }
    for (let j = 0; j < P.length - 1; j++) for (let i = 0; i < M - 1; i++) { const a = j * M + i, b = a + 1, c = a + M, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(), sideCount = idx.length;
    if (cap) {
      const base = pos.length / 3; pos.push(0, y0, 0); nor.push(0, 1, 0); uv.push(0, 0);
      for (const p of loop) { const x = p.x - p.nx * P[0][0], z = p.z - p.nz * P[0][0]; pos.push(x, y0, z); nor.push(0, 1, 0); uv.push(x, z); }
      for (let i = 0; i < M - 1; i++) idx.push(base, base + 2 + i, base + 1 + i);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.addGroup(0, sideCount, 0); if (cap) g.addGroup(sideCount, idx.length - sideCount, 1);
    return g;
  }
  const lip = (r, y, n = 5) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI / 2; return [r * (1 - Math.sin(a)), y - r * (1 - Math.cos(a)), a]; });   // a quarter-round top edge
  // A flat outline with rounded corners, pushed out into a solid with soft edges: roofs, the van body, anything with a silhouette.
  function prism(pts, r, depth, bevel = 0.04) {
    const s = new THREE.Shape(), n = pts.length;
    pts.forEach((p, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], da = Math.hypot(a[0] - p[0], a[1] - p[1]), db = Math.hypot(b[0] - p[0], b[1] - p[1]), k = Math.min(Array.isArray(r) ? r[i] : r, da / 2, db / 2);
      const p0 = [p[0] + (a[0] - p[0]) * k / da, p[1] + (a[1] - p[1]) * k / da], p1 = [p[0] + (b[0] - p[0]) * k / db, p[1] + (b[1] - p[1]) * k / db];
      if (i === 0) s.moveTo(p0[0], p0[1]); else s.lineTo(p0[0], p0[1]);
      s.quadraticCurveTo(p[0], p[1], p1[0], p1[1]);
    });
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bevel, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 3, curveSegments: 6 });
    g.translate(0, 0, -(depth - 2 * bevel) / 2);
    return g;
  }

  // PAINT -----------------------------------------------------------
  // Everything is matte model paint. One material per colour, shared.
  const paints = new Map();
  const paint = (hex, rough = 0.86) => { const key = hex + rough; if (!paints.has(key)) paints.set(key, new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0 })); return paints.get(key); };
  // something that can light up: dark glass by day, a warm lamp when `.emissiveIntensity` is raised
  const lampPaint = (hex = PAL.glass, glow = PAL.lampGlow) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45, emissive: glow, emissiveIntensity: 0 });
  function put(parent, geo, mat, p = [0, 0, 0], r, cast = true) {
    const m = new THREE.Mesh(geo, typeof mat === 'string' ? paint(mat) : mat); m.position.set(p[0], p[1], p[2]); if (r) m.rotation.set(r[0], r[1], r[2]);
    m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
  }
  const box = (parent, w, h, d, color, p, r = 0.06, rot) => put(parent, K.roundedBox(w, h, d, r, 4), color, p, rot);
  const decal = (parent, w, h, r, mat, p, rot) => put(parent, K.roundedRect(w, h, r), mat, p, rot, false);   // a flat painted panel just off a surface

  // THE TILE --------------------------------------------------------
  // A thick slab cut out of the ground: a grass cap with a soft lip, then the cut side showing topsoil, clay and
  // rock, tapering away underneath so it reads as floating. Returns the group everything else is planted on.
  function tile(parent, { w, d, r }) {
    const g = new THREE.Group(); parent.add(g);
    const rr = K.rng(7);
    const grass = K.canvasTex(1024, 1024, (ctx, W) => {            // flock: soft blotches of two greens and a fine speckle
      ctx.fillStyle = PAL.grass; ctx.fillRect(0, 0, W, W);
      for (let i = 0; i < 90; i++) { const x = rr.range(0, W), y = rr.range(0, W), s = rr.range(60, 190), c = rr.chance(0.5) ? '255,246,190' : '60,120,70'; for (const ox of [-W, 0, W]) for (const oy of [-W, 0, W]) { const gr = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, s); gr.addColorStop(0, `rgba(${c},0.11)`); gr.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = gr; ctx.fillRect(x + ox - s, y + oy - s, 2 * s, 2 * s); } }
      for (let i = 0; i < 26000; i++) { ctx.fillStyle = rr.chance(0.5) ? 'rgba(255,255,210,0.10)' : 'rgba(40,90,50,0.10)'; ctx.fillRect(rr.range(0, W), rr.range(0, W), 2, 2); }
    }, { repeat: [1 / 5, 1 / 5] });
    const grassMat = new THREE.MeshPhysicalMaterial({ map: grass, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });
    const cap = put(g, loft(ring(w + 0.18, d + 0.18, r + 0.09, 12), [...lip(0.11, 0), [0, -0.19, Math.PI / 2], [0.1, -0.27, Math.PI]]), [grassMat, grassMat]);
    cap.material[0] = new THREE.MeshPhysicalMaterial({ color: PAL.grass, roughness: 0.95, sheen: 0.6, sheenRoughness: 0.7, sheenColor: new THREE.Color('#e8f5b0') });   // the lip has no flat UVs, so it gets the plain colour

    // the cut: a painted cross-section that wraps twice around the tile
    const H = 1.8, strata = K.canvasTex(2048, 512, (ctx, W, Hh) => {
      const wave = (base, amp, k, ph) => (x) => base + amp * Math.sin(x / W * Math.PI * 2 * k + ph) + amp * 0.5 * Math.sin(x / W * Math.PI * 2 * (k * 2 + 1) + ph * 2.3);
      const band = (top, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, Hh); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, top(x)); ctx.lineTo(W, Hh); ctx.fill(); };
      ctx.fillStyle = PAL.earth[0]; ctx.fillRect(0, 0, W, Hh);
      band(wave(44, 7, 5, 0.4), PAL.earth[1]); band(wave(170, 14, 3, 1.9), PAL.earth[2]); band(wave(292, 16, 2, 4.0), PAL.earth[3]);
      const blob = (x, y, a, b, rot, color) => { for (const ox of [-W, 0, W]) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x + ox, y, a, b, rot, 0, 7); ctx.fill(); } };
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(255,240,205,0.28)'; ctx.lineWidth = 5; ctx.beginPath(); const f = wave(194 + i * 15, 12, 3, 1.9 + i * 0.25); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, f(x)); ctx.stroke(); }   // seams in the clay
      for (let i = 0; i < 46; i++) blob(rr.range(0, W), rr.range(66, 160), rr.range(7, 20), rr.range(5, 12), rr.range(-0.5, 0.5), rr.pick(['#d7c4a6', '#a88a70', '#6f4c3b']));   // pebbles in the soil
      for (let i = 0; i < 30; i++) blob(rr.range(0, W), rr.range(322, 500), rr.range(24, 70), rr.range(10, 24), rr.range(-0.3, 0.3), rr.pick(['#8b8e9d', '#6e7181', '#73768a']));   // rock faces
      for (let i = 0; i < 40; i++) { const x = rr.range(0, W); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = rr.range(2, 4); ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + rr.range(-18, 18), 30, x + rr.range(-26, 26), rr.range(40, 90)); ctx.stroke(); }   // roots
    }, { repeat: [2, 1] });
    put(g, loft(ring(w, d, r, 12), [[0, -0.19, Math.PI / 2], [0, -1.32, Math.PI / 2], [0.07, -1.52], [0.3, -1.76], [0.62, -1.9], [0.95, -H - 0.19]], false), new THREE.MeshStandardMaterial({ map: strata, roughness: 0.9 }));
    put(g, loft(ring(w - 1.9, d - 1.9, 0.3), [[0, -H - 0.17, 0]]), PAL.earth[3]);   // closes the underside
    // stones pressed half-way into the cut, so the side is not only paint
    const loop = ring(w, d, r, 12), stones = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), paint('#ffffff', 0.9), 30); stones.castShadow = stones.receiveShadow = true; g.add(stones);
    for (let i = 0; i < stones.count; i++) {
      const at = rr.range(0, loop.around), j = loop.findIndex((q) => q.u >= at), a = loop[Math.max(0, j - 1)], b = loop[j], f = (at - a.u) / (b.u - a.u || 1), p = { x: K.lerp(a.x, b.x, f), z: K.lerp(a.z, b.z, f), nx: b.nx, nz: b.nz }, y = rr.range(-0.45, -1.25), s = rr.range(0.05, 0.11);
      K.place(stones, i, [p.x - p.nx * s * 0.25, y, p.z - p.nz * s * 0.25], [rr.range(0, 3), rr.range(0, 3), 0], [s * rr.range(1, 1.7), s * rr.range(0.6, 1), s]);
      stones.setColorAt(i, new THREE.Color(y > -1.0 ? rr.pick(PAL.stone) : PAL.stone[2]));
    }
    g.userData.grass = cap.material[0];
    return g;
  }
  // A raised ribbon along a path (road, river, track). Returns the curve so things can travel on it.
  function ribbon(parent, pts, { width = 1.1, height = 0.05, texture, period = 1 }) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'); curve.arcLengthDivisions = 600;
    const len = curve.getLength(), n = Math.ceil(len * 14), pos = [], uv = [], idx = [], cross = [[-width / 2, 0, 0], [-width / 2 + 0.05, height, 0.06], [width / 2 - 0.05, height, 0.94], [width / 2, 0, 1]];
    for (let i = 0; i <= n; i++) {
      const p = curve.getPointAt(i / n), tg = curve.getTangentAt(i / n);
      for (const [o, y, v] of cross) { pos.push(p.x - tg.z * o, y, p.z + tg.x * o); uv.push(i / n * len / period, v); }
      if (i < n) for (let k = 0; k < 3; k++) { const a = i * 4 + k; idx.push(a, a + 1, a + 4, a + 1, a + 5, a + 4); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    put(parent, g, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }), [0, 0, 0], null, false);
    return Object.assign(curve, { len });
  }

  // BUILDING BLOCKS -------------------------------------------------
  const gable = (w, h, len, r = 0.1) => prism([[-w / 2, 0], [w / 2, 0], [0, h]], [r, r, r * 1.6], len, 0.05);   // ridge along z
  // a window: a frame with a pane that can light up. Returns the pane's material.
  function windowPane(parent, w, h, p, rotY = 0, frame = PAL.cream) {
    const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = rotY; parent.add(g);
    box(g, w + 0.12, h + 0.12, 0.07, frame, [0, 0, 0], 0.03);
    const m = lampPaint(); decal(g, w, h, 0.04, m, [0, 0, 0.04]); box(g, 0.035, h, 0.02, frame, [0, 0, 0.045], 0.008);
    return m;
  }
  // tiny people are turned wooden pegs: a body, a ball for a head and one prop that says who they are
  function peg(parent, color, hat) {
    const g = new THREE.Group(); parent.add(g);
    const body = new THREE.LatheGeometry([[0, 0], [0.15, 0], [0.185, 0.04], [0.17, 0.3], [0.12, 0.43], [0, 0.46]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
    put(g, body, color); put(g, new THREE.SphereGeometry(0.15, 20, 14), PAL.skin, [0, 0.58, 0]);
    if (hat === 'cap') { put(g, new THREE.SphereGeometry(0.158, 20, 10, 0, 7, 0, 1.25), color, [0, 0.6, 0]); box(g, 0.2, 0.03, 0.14, color, [0, 0.64, 0.15], 0.012); }
    if (hat === 'helmet') put(g, new THREE.SphereGeometry(0.17, 20, 10, 0, 7, 0, 1.5), PAL.mustard, [0, 0.6, 0]);
    if (hat === 'hair') put(g, new THREE.SphereGeometry(0.162, 20, 10, 0, 7, 0, 1.75), PAL.trunk, [0, 0.59, -0.012], [-0.35, 0, 0]);
    return g;
  }
  function tree(parent, x, z, s, kind, y = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
    put(g, new THREE.CylinderGeometry(0.06, 0.09, 0.6, 10), PAL.trunk, [0, 0.3, 0]);
    if (kind === 'fir') {      // a gumdrop
      // profile runs bottom to top: the other way round the faces point inwards and the trunk shows through
      put(g, new THREE.LatheGeometry([[0, 0.38], [0.4, 0.4], [0.5, 0.52], [0.47, 0.72], [0.3, 1.2], [0.1, 1.68], [0, 1.75]].map(([a, b]) => new THREE.Vector2(a, b)), 22), PAL.leaf[1]);
    } else {                   // a lollipop with a smaller ball on its shoulder
      put(g, new THREE.SphereGeometry(0.52, 24, 16), PAL.leaf[kind === 'pale' ? 2 : 0], [0, 0.98, 0]).scale.set(1, 0.92, 1);
      put(g, new THREE.SphereGeometry(0.3, 20, 14), PAL.leaf[kind === 'pale' ? 2 : 0], [0.3, 0.74, 0.22]);
    }
    return g;
  }
  // The label of a stop: a card on a pin that always turns to face the lens. One side is grey ("not yet"), the other
  // is the accent colour ("done"); `flip` is the part to rotate about x by PI to change state.
  function sign(parent, word, number) {
    const g = new THREE.Group(), flip = new THREE.Group(); parent.add(g); g.add(flip);
    const PX = 380, SPACING = 0.05, m = document.createElement('canvas').getContext('2d'); m.font = FONT; m.letterSpacing = SPACING * 160 + 'px';
    const capPx = m.measureText('H').actualBoundingBoxAscent, k = 0.3 * PX / capPx, textW = m.measureText(word).width * k / PX;     // letters 0.3 units tall
    const bh = 0.62, coin = 0.4, bw = textW + coin * 2 + 0.34, tx = -bw / 2 + coin * 2 + 0.08;
    const face = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: K.canvasTex(Math.round(bw * PX), Math.round(bh * PX), (ctx, W, Hh) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', 160 * k + 'px'); ctx.letterSpacing = SPACING * 160 * k + 'px'; ctx.textBaseline = 'alphabetic';
      ctx.fillText(word, (tx + bw / 2) * PX, Hh / 2 + 0.15 * PX);
    }) });
    const disc = (bg, fg) => new THREE.MeshStandardMaterial({ roughness: 0.8, map: K.canvasTex(256, 256, (ctx) => {
      ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = fg; ctx.font = FONT.replace('160px', '190px'); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      const mm = ctx.measureText(String(number)); ctx.fillText(String(number), 128, 128 + mm.actualBoundingBoxAscent / 2);
    }) });
    box(flip, bw, bh, 0.1, PAL.cream, [0, 0, 0], 0.05);
    put(flip, new THREE.CylinderGeometry(coin + 0.07, coin + 0.07, 0.16, 40), PAL.cream, [-bw / 2 + coin, 0, 0], [Math.PI / 2, 0, 0]);
    for (const [side, bg, fg, cbg, cfg] of [[1, '#ece8df', '#7d8996', '#aab3bd', '#f4f1ea'], [-1, PAL.accent, '#fff6e6', '#fff6e6', PAL.accent]]) {
      const s = new THREE.Group(); s.rotation.x = side > 0 ? 0 : Math.PI; flip.add(s);
      decal(s, bw - 0.09, bh - 0.09, 0.03, face(bg, fg), [0, 0, 0.052]);
      put(s, new THREE.CircleGeometry(coin, 40), disc(cbg, cfg), [-bw / 2 + coin, 0, 0.082], null, false);
    }
    const pole = put(g, new THREE.CylinderGeometry(0.05, 0.06, 1, 12), PAL.cream, [0, 0, -0.1]);
    put(g, new THREE.CylinderGeometry(0.13, 0.15, 0.08, 16), PAL.slate, [0, 0.04, -0.1]);
    return { g, flip, pole, setHeight(h) { flip.position.y = h; pole.scale.y = h; pole.position.y = h / 2; } };
  }
  // The vehicle: a silhouette pushed out sideways, four wheels, glass, lamps and a hatch. x is forward.
  function van(parent, color) {
    const g = new THREE.Group(), body = new THREE.Group(); parent.add(g); g.add(body);
    put(body, prism([[-0.92, 0.2], [0.92, 0.2], [0.94, 0.52], [0.68, 0.61], [0.4, 1.05], [-0.92, 1.05]], [0.08, 0.1, 0.1, 0.05, 0.14, 0.12], 0.86, 0.06), color);
    const glass = paint(PAL.glass, 0.6), n = new THREE.Vector3(0.44, 0.28, 0).normalize();
    const ws = decal(body, 0.66, 0.38, 0.07, glass, [0.54 + n.x * 0.012, 0.835 + n.y * 0.012, 0]); ws.lookAt(ws.position.clone().add(n));
    for (const s of [1, -1]) {
      const rot = [0, s > 0 ? 0 : Math.PI, 0];
      decal(body, 0.3, 0.26, 0.05, glass, [0.2, 0.83, s * 0.432], rot);
      decal(body, 1.5, 0.09, 0.03, PAL.cream, [-0.1, 0.44, s * 0.432], rot);
      decal(body, 0.46, 0.34, 0.05, PAL.cream, [-0.42, 0.78, s * 0.432], rot);
      box(body, 0.2, 0.15, 0.012, PAL.kraft, [-0.42, 0.765, s * 0.436], 0.005); box(body, 0.045, 0.152, 0.014, color, [-0.42, 0.765, s * 0.437], 0.004);   // a parcel painted on the side
    }
    box(body, 0.09, 0.1, 0.82, PAL.slate, [0.93, 0.27, 0], 0.03); box(body, 0.09, 0.1, 0.82, PAL.slate, [-0.92, 0.25, 0], 0.03);
    const lamps = lampPaint('#fff3d6', '#fff0c8'); for (const s of [1, -1]) put(body, new THREE.CylinderGeometry(0.065, 0.065, 0.04, 16), lamps, [0.945, 0.42, s * 0.28], [0, 0, Math.PI / 2]);
    decal(body, 0.72, 0.62, 0.05, PAL.dark, [-0.923, 0.64, 0], [0, -Math.PI / 2, 0]);              // the dark inside, seen when the hatch is up
    const hatch = new THREE.Group(); hatch.position.set(-0.94, 1.0, 0); body.add(hatch);
    box(hatch, 0.05, 0.74, 0.76, color, [0, -0.37, 0], 0.025); box(hatch, 0.02, 0.2, 0.44, PAL.glass, [-0.02, -0.2, 0], 0.01);
    const wheels = [];
    for (const [x, z] of [[0.56, 0.37], [0.56, -0.37], [-0.56, 0.37], [-0.56, -0.37]]) {
      const w = new THREE.Group(); w.position.set(x, 0.2, z); g.add(w); wheels.push(w);
      put(w, new THREE.CylinderGeometry(0.2, 0.2, 0.17, 24), PAL.dark, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(w, new THREE.CylinderGeometry(0.1, 0.1, 0.19, 16), PAL.cream, [0, 0, 0], [Math.PI / 2, 0, 0]);
      put(w, new THREE.CylinderGeometry(0.028, 0.028, 0.2, 8), PAL.dark, [0.055, 0, 0], [Math.PI / 2, 0, 0]);   // one off-centre dot so the spin shows
    }
    return { g, body, hatch, wheels, lamps };
  }
  // Puffs: matte white balls that swell, drift and shrink away. `list` = [{ at:[x,y,z], t0, life, size, rise, drift }]
  function puffs(parent, count) {
    const m = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 16, 12), paint(PAL.smoke, 0.95), count); m.castShadow = true; m.frustumCulled = false; parent.add(m);
    return { mesh: m, set(i, at, age, o) {      // age 0..1
      const s = age <= 0 || age >= 1 ? 0 : o.size * K.smooth(0, 0.3, age) * (1 - K.smooth(0.55, 1, age)) * (0.7 + 0.5 * age);
      K.place(m, i, [at[0] + (o.drift || 0) * age * age, at[1] + o.rise * age, at[2] + (o.driftZ || 0) * age], null, Math.max(s, 1e-4));
    } };
  }

  // MOTION ----------------------------------------------------------
  // distance travelled for a move that speeds up for `a` of the time, cruises, and brakes for `b` of it (0..1 in, 0..1 out)
  const trap = (u, a, b) => { u = K.clamp(u); const v = 1 / (1 - a / 2 - b / 2); return u < a ? v * u * u / (2 * a) : u < 1 - b ? v * (u - a / 2) : 1 - v * (1 - u) * (1 - u) / (2 * b); };
  // a hop from one spot to another: returns [x, y, z, squash] (squash > 0 just after landing)
  const hop = (t, t0, len, from, to, height) => { const u = K.clamp((t - t0) / len), e = K.ease.inOut(u), land = t - t0 - len; return [from[0] + (to[0] - from[0]) * e, height * Math.sin(Math.PI * u), from[1] + (to[1] - from[1]) * e, land > 0 ? Math.exp(-land * 14) * Math.sin(land * 30) * 0.12 : 0]; };

  registerStyle({
    id: 'tiny-diorama',
    name: 'Tiny Diorama',
    family: 'Spaces and journeys',
    look: 'A whole little world on one floating tile, like a designer\'s model on a desk: chunky rounded buildings, a toy van, peg people and lollipop trees in a few matte paint colours, on a thick slab of ground whose cut sides show soil, clay and rock.',
    motion: 'Small life at small scale: one vehicle drives the route with weight (it squats, leans and nods when it brakes), doors roll and swing, smoke puffs, peg people hop, lights come on, and each stop\'s sign flips to the accent colour when its part is done. The tile turns slowly the whole time.',
    light: 'One soft warm sun from the front left that sinks and warms through the clip, a cool sky that darkens every crease and contact, and a few tiny lamps that take over at the end.',
    materials: 'Matte painted-model surfaces, flocked grass with a soft sheen, a hand-painted cross-section of earth with real stones pressed into it, card signs. One accent colour is kept for the thing the story follows.',
    camera: 'Long lens, three-quarter view from above, close enough that the tile fills the frame. The tile turns on its turntable to show each stop in order while the camera makes one slow rise and push-in; neither ever stops.',
    post: 'Strong tilt-shift: a wide-open lens keeps a thin band sharp around the action and melts the near and far edges of the tile, which is what makes it read as a miniature. The band travels with the story and the lens stops down a little for the final picture. True colours, slightly rich, light vignette, almost no grain.',
    explains: 'Places, systems and journeys: anything with a few stops and something that travels between them (a supply chain, a commute, how a request moves through a company). Each stop is a little building with a sign; the traveller links them in order.',
    topic: 'How your parcel gets to you',
    duration: 8,
    fonts: [FONT],
    render: { samples: 72, shutter: 0.5, tone: 'neutral', exposure: 1.0, bloom: 0.3, bloomThreshold: 1.05, vignette: 0.2, grain: 0.01, saturation: 1.08, contrast: 1.03, fov: 20, near: 1, far: 300, background: PAL.backdrop },

    build(S) {
      const { THREE, K, scene, camera } = S;

      // ---- light and backdrop: a model on a plain sweep of paper, under one soft sun
      K.env(S, { top: '#c4dcf2', horizon: '#f2e8da', bottom: '#9db39a', intensity: 0.4 });
      const sun = K.sun(S, { pos: [-9, 13, 9], color: '#ffe3c0', power: 3.3, size: 12, soft: 1.3, mapSize: 4096, far: 70 });
      const sky = K.skyLight(S, { color: '#bcd3ff', power: 0.95, size: 11, center: [0, 0, 0], mapSize: 2048 });
      const paper = new THREE.MeshBasicMaterial({ color: PAL.backdrop }); put(scene, new THREE.PlaneGeometry(300, 300), paper, [0, FLOOR, 0], [-Math.PI / 2, 0, 0], false);
      // the tile's shadow on the paper is painted, not cast: it stays one clean soft shape however the lights move
      const shade = put(scene, new THREE.PlaneGeometry(TILE.w + 8, TILE.d + 8), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: K.canvasTex(512, 512, (ctx, W) => {
        const sx = W / (TILE.w + 8), sz = W / (TILE.d + 8); ctx.filter = 'blur(26px)'; ctx.fillStyle = 'rgba(38,62,92,0.55)';
        ctx.beginPath(); ctx.roundRect(4 * sx, 4 * sz, TILE.w * sx, TILE.d * sz, 50); ctx.fill();
      }) }), [1.6, FLOOR + 0.02, -1.0], [-Math.PI / 2, 0, 0], false);

      // ---- the tile and its road
      const world = new THREE.Group(); scene.add(world);        // everything on the tile turns with it
      const land = tile(world, TILE);
      const roadTex = K.canvasTex(256, 128, (ctx, W, H) => { ctx.fillStyle = PAL.road; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f3ead8'; ctx.fillRect(40, H / 2 - 5, 120, 10); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, 12, W, 5); ctx.fillRect(0, H - 17, W, 5); }, { repeat: [1, 1] });
      roadTex.wrapS = THREE.RepeatWrapping;
      const road = ribbon(land, ROAD, { width: 1.14, texture: roadTex, period: 0.8 });
      const distAtX = (x, from, to) => { let a = from, b = to; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (road.getPointAt(m / road.len).x < x) a = m; else b = m; } return a; };
      const S0 = distAtX(VAN_START_X, 0, 3), S1 = distAtX(VAN_STOP_X, road.len - 4.5, road.len);

      // ---- stop 1: the depot. A big plain shed with a saw-tooth roof, a roller door and a conveyor.
      const depot = new THREE.Group(); depot.position.set(DEPOT.x, 0, DEPOT.z); land.add(depot);
      put(depot, loft(ring(DEPOT.w + 0.24, DEPOT.d + 0.24, 0.16), [...lip(0.05, 0.12), [0, 0, Math.PI / 2]]), PAL.slate);
      box(depot, DEPOT.w, DEPOT.h, DEPOT.d, PAL.cream, [0, DEPOT.h / 2 + 0.08, 0], 0.09);
      const depotGlass = lampPaint(PAL.glass, '#ffe2a8');
      for (let i = -1; i <= 1; i++) {
        put(depot, prism([[-0.52, 0], [0.52, 0], [0.52, 0.56]], [0.05, 0.07, 0.08], DEPOT.d + 0.12, 0.05), PAL.slate, [i * 1.0, DEPOT.h + 0.06, 0]);
        decal(depot, DEPOT.d - 0.5, 0.26, 0.05, depotGlass, [i * 1.0 + 0.525, DEPOT.h + 0.34, 0], [0, Math.PI / 2, 0]);
      }
      const fx = DEPOT.w / 2, dz = DOOR_Z - DEPOT.z;       // the door is on the side that faces the road (+x)
      box(depot, 0.12, 1.34, 1.72, PAL.mustard, [fx, 0.75, dz], 0.05);
      decal(depot, 1.44, 1.14, 0.04, PAL.dark, [fx + 0.062, 0.69, dz], [0, Math.PI / 2, 0]);
      const slats = K.canvasTex(64, 64, (ctx) => { ctx.fillStyle = '#e9dcc4'; ctx.fillRect(0, 0, 64, 64); ctx.fillStyle = 'rgba(90,70,50,0.35)'; ctx.fillRect(0, 0, 64, 9); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(0, 9, 64, 6); }, { repeat: [1, 7] });
      const rollGeo = new THREE.PlaneGeometry(1.44, 1.14); rollGeo.translate(0, -0.57, 0);
      const roll = put(depot, rollGeo, new THREE.MeshStandardMaterial({ map: slats, roughness: 0.7 }), [fx + 0.068, 1.26, dz], [0, Math.PI / 2, 0], false);
      box(depot, 0.2, 0.2, 1.76, PAL.mustard, [fx + 0.03, 1.36, dz], 0.06);
      const zf = DEPOT.d / 2;                               // the long wall that faces front: two windows and a parcel mark
      const depotWin = [windowPane(depot, 0.5, 0.42, [-0.95, 0.98, zf + 0.01]), windowPane(depot, 0.5, 0.42, [-0.2, 0.98, zf + 0.01])];
      decal(depot, 0.78, 0.78, 0.12, PAL.slate, [0.85, 0.85, zf + 0.004]); box(depot, 0.44, 0.36, 0.03, PAL.kraft, [0.85, 0.83, zf + 0.012], 0.02); box(depot, 0.09, 0.365, 0.034, PAL.cream, [0.85, 0.83, zf + 0.012], 0.01);
      put(depot, new THREE.CylinderGeometry(0.13, 0.15, 0.8, 16), PAL.slate, [-1.25, DEPOT.h + 0.6, 1.05]); put(depot, new THREE.CylinderGeometry(0.17, 0.17, 0.07, 16), PAL.cream, [-1.25, DEPOT.h + 1.0, 1.05]);
      const STACK = [DEPOT.x - 1.25, DEPOT.h + 1.08, DEPOT.z + 1.05];
      // conveyor from the door to where the van backs up
      const CONV = { x0: DEPOT.x + fx + 0.1, x1: -1.56, y: 0.5 }, conv = new THREE.Group(); land.add(conv);
      box(conv, CONV.x1 - CONV.x0, 0.1, 0.62, PAL.slate, [(CONV.x0 + CONV.x1) / 2, CONV.y - 0.07, DOOR_Z], 0.04);
      for (const x of [CONV.x0 + 0.12, CONV.x1 - 0.1]) for (const s of [1, -1]) box(conv, 0.07, CONV.y - 0.1, 0.07, PAL.slate, [x, (CONV.y - 0.1) / 2, DOOR_Z + s * 0.24], 0.02);
      const rollers = []; for (let i = 0; i < 6; i++) rollers.push(put(conv, new THREE.CylinderGeometry(0.045, 0.045, 0.56, 12), PAL.cream, [CONV.x0 + 0.1 + i * (CONV.x1 - CONV.x0 - 0.2) / 5, CONV.y - 0.01, DOOR_Z], [Math.PI / 2, 0, 0]));
      // spare parcels waiting by the wall, and the worker
      const parcelGeo = K.roundedBox(0.42, 0.32, 0.36, 0.035, 3), tapeGeo = K.roundedBox(0.1, 0.326, 0.366, 0.01, 2);
      const parcelAt = (parent, p, ry = 0, s = 1) => { const g = new THREE.Group(); g.position.set(p[0], p[1], p[2]); g.rotation.y = ry; g.scale.setScalar(s); parent.add(g); put(g, parcelGeo, PAL.kraft); put(g, tapeGeo, PAL.cream); return g; };
      parcelAt(land, [-4.55, 0.16, 0.12], 0.3); parcelAt(land, [-5.05, 0.16, 0.2], -0.15, 1.1); parcelAt(land, [-4.8, 0.5, 0.15], 0.1, 0.9); parcelAt(land, [-3.75, 0.16, 0.25], 0.5, 1.15);
      const worker = peg(land, PAL.slate, 'helmet');

      // ---- stop 3: the house
      const home = new THREE.Group(); home.position.set(HOME.x, 0, HOME.z); land.add(home);
      put(home, loft(ring(HOME.w + 0.22, HOME.d + 0.22, 0.16), [...lip(0.05, 0.1), [0, 0, Math.PI / 2]]), PAL.stone[1]);
      box(home, HOME.w, HOME.h, HOME.d, PAL.cream, [0, HOME.h / 2 + 0.06, 0], 0.09);
      put(home, gable(HOME.d + 0.5, 1.0, HOME.w + 0.34), PAL.slate, [0, HOME.h - 0.02, 0], [0, Math.PI / 2, 0]);
      box(home, 0.3, 0.75, 0.3, PAL.cream, [0.82, HOME.h + 0.45, -0.25], 0.05); box(home, 0.38, 0.09, 0.38, PAL.slate, [0.82, HOME.h + 0.85, -0.25], 0.03);
      const CHIM = [HOME.x + 0.82, HOME.h + 0.93, HOME.z - 0.25];
      const hz = HOME.d / 2, homeWin = [windowPane(home, 0.4, 0.42, [-0.62, 0.8, hz + 0.01], 0, PAL.slate), windowPane(home, 0.4, 0.42, [0.62, 0.8, hz + 0.01], 0, PAL.slate)];
      box(home, 0.7, 1.0, 0.08, PAL.slate, [0, 0.55, hz + 0.01], 0.04);
      const doorway = lampPaint(PAL.dark, '#ffca7a'); decal(home, 0.54, 0.88, 0.04, doorway, [0, 0.52, hz + 0.052]);
      const door = new THREE.Group(); door.position.set(-0.27, 0.52, hz + 0.06); home.add(door);
      box(door, 0.54, 0.88, 0.05, PAL.mustard, [0.27, 0, 0], 0.025); put(door, new THREE.SphereGeometry(0.035, 10, 8), PAL.cream, [0.45, -0.02, 0.035]);
      box(land, 1.05, 0.07, 0.55, PAL.stone[1], [MAT[0] - 0.07, 0.035, MAT[1] - 0.05], 0.03); box(land, 0.84, 0.03, 0.36, PAL.slate, [MAT[0] - 0.08, 0.08, MAT[1]], 0.012);   // step and doormat
      const lamp = new THREE.Group(); lamp.position.set(3.55, 0, 1.95); land.add(lamp);
      put(lamp, new THREE.CylinderGeometry(0.04, 0.055, 1.25, 10), PAL.slate, [0, 0.625, 0]); put(lamp, new THREE.CylinderGeometry(0.1, 0.07, 0.07, 12), PAL.slate, [0, 1.27, 0]);
      const bulb = lampPaint('#fff4dd', PAL.lampGlow); put(lamp, new THREE.SphereGeometry(0.13, 16, 12), bulb, [0, 1.42, 0]);
      const lampLight = new THREE.PointLight(PAL.lampGlow, 0, 5, 2); lampLight.position.set(3.55, 1.42, 1.95); land.add(lampLight);
      const doorLight = new THREE.PointLight('#ffb866', 0, 4, 2); doorLight.position.set(MAT[0], 1.3, MAT[1] + 0.5); land.add(doorLight);
      const resident = peg(land, PAL.mustard, 'hair');

      // ---- the land in between: a hill, trees, bushes, a pond
      const hill = put(land, new THREE.SphereGeometry(1, 40, 20), land.userData.grass, [2.2, -0.75, -3.05]); hill.scale.set(2.3, 1.45, 1.25);
      const hillY = (x, z) => -0.75 + 1.45 * Math.sqrt(Math.max(0, 1 - ((x - 2.2) / 2.3) ** 2 - ((z + 3.05) / 1.25) ** 2));
      for (const [x, z, s, kind] of [[1.9, -3.3, 1.0, 'fir'], [2.8, -3.25, 1.25, 'fir'], [3.7, -2.9, 0.9, 'round'], [5.4, -2.5, 1.0, 'fir'], [5.75, -1.2, 0.7, 'pale'],
        [-5.5, 1.0, 1.1, 'round'], [-4.7, 2.3, 0.95, 'fir'], [-5.3, 3.0, 0.8, 'pale'], [-0.4, 3.2, 0.9, 'round'], [3.0, 0.6, 1.0, 'round'], [0.2, 0.0, 0.8, 'fir'], [5.75, 3.35, 0.7, 'pale'], [-0.6, -0.35, 0.6, 'pale']]) tree(land, x, z, s, kind, Math.max(0, hillY(x, z) - 0.05));
      for (const [x, z, s] of [[3.75, 1.75, 0.3], [5.45, 1.75, 0.34], [5.75, 1.2, 0.26], [-2.9, -0.05, 0.26], [2.6, -0.1, 0.28], [-3.6, 3.3, 0.32], [0.6, 3.55, 0.26], [4.2, 3.6, 0.3]]) put(land, new THREE.SphereGeometry(1, 18, 12), PAL.leaf[x > 3 ? 0 : 2], [x, s * 0.55, z]).scale.set(s * 1.25, s, s * 1.1);
      const pond = new THREE.Group(); pond.position.set(-3.05, 0, 1.95); pond.rotation.y = 0.2; land.add(pond);
      put(pond, loft(ring(2.5, 1.5, 0.74), [...lip(0.04, 0.05), [0, 0, Math.PI / 2]]), PAL.stone[1]);
      put(pond, loft(ring(2.24, 1.24, 0.61), [[0, 0.062, 0]]), new THREE.MeshStandardMaterial({ color: PAL.water, roughness: 0.3 }), [0, 0, 0], null, false);
      for (const [x, z, s] of [[-0.5, 0.2, 0.15], [-0.28, 0.32, 0.1], [0.55, -0.2, 0.13]]) put(pond, new THREE.CylinderGeometry(s, s, 0.02, 14), PAL.leaf[2], [x, 0.07, z]);
      for (const [x, z, s] of [[-1.45, 2.85, 0.16], [-4.45, 1.3, 0.2], [1.7, 3.5, 0.14], [-1.0, -2.75, 0.15]]) put(land, new THREE.SphereGeometry(1, 12, 8), PAL.stone[0], [x, s * 0.4, z]).scale.set(s * 1.3, s * 0.8, s);
      const duck = new THREE.Group(); pond.add(duck); put(duck, new THREE.SphereGeometry(0.1, 14, 10), '#ffffff', [0, 0.12, 0]).scale.set(1.3, 0.8, 1); put(duck, new THREE.SphereGeometry(0.065, 12, 8), '#ffffff', [0.1, 0.23, 0]); box(duck, 0.07, 0.03, 0.05, PAL.mustard, [0.17, 0.22, 0], 0.012);
      const bench = new THREE.Group(); bench.position.set(-3.1, 0, 3.2); bench.rotation.y = 0.15; land.add(bench);
      box(bench, 0.85, 0.06, 0.28, PAL.kraft, [0, 0.24, 0], 0.025); box(bench, 0.85, 0.2, 0.06, PAL.kraft, [0, 0.42, 0.13], 0.025); for (const x of [-0.32, 0.32]) box(bench, 0.07, 0.24, 0.26, PAL.slate, [x, 0.12, 0], 0.02);
      box(land, 0.08, 0.5, 0.08, PAL.slate, [5.15, 0.25, 2.0], 0.02); box(land, 0.3, 0.22, 0.2, PAL.mustard, [5.15, 0.58, 2.0], 0.06);                // letterbox, then a fence to the edge
      for (let i = 0; i < 3; i++) box(land, 0.08, 0.32, 0.08, PAL.cream, [5.5 + i * 0.3, 0.16, 2.0], 0.025); box(land, 0.8, 0.06, 0.05, PAL.cream, [5.8, 0.24, 2.0], 0.02);
      const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), paint('#ffffff', 0.8), 78), fr = K.rng(21); flowers.castShadow = flowers.receiveShadow = true; land.add(flowers);
      [[-4.2, 3.35], [-1.9, 3.5], [-0.25, 2.1], [2.75, 1.55], [2.6, 3.65], [5.0, 3.55], [-1.7, 0.2], [0.9, -2.9], [4.4, -2.3], [5.95, 0.3], [-5.75, -0.1], [-4.0, 0.95], [0.1, 1.1]].forEach(([x, z], c) => {
        for (let i = 0; i < 6; i++) { const a = fr.range(0, 6.3), d = fr.range(0.05, 0.38), s = fr.range(0.035, 0.055); K.place(flowers, c * 6 + i, [x + Math.cos(a) * d, Math.max(0, hillY(x, z)) + s * 0.7, z + Math.sin(a) * d], null, [s, s * 0.7, s]); flowers.setColorAt(c * 6 + i, new THREE.Color(fr.pick(['#fff7ea', '#fff7ea', PAL.mustard, '#f7c9c0']))); }
      });
      const walker = peg(land, PAL.leaf[1], 'hair'); walker.position.set(-1.6, 0, 2.55); walker.rotation.y = 0.9;

      // ---- the traveller and what it carries
      const car = van(land, PAL.accent), courier = peg(land, PAL.accent, 'cap'), parcel = parcelAt(land, [0, 0, 0], 0, 1.2);
      const smoke = puffs(land, 20), EXH = 8;
      const exhaust = Array.from({ length: EXH }, (_, i) => T.go + 0.04 + i * 0.13);

      // ---- the signs
      const signs = SIGNS.map((s, i) => { const o = sign(land, s.word, i + 1); o.g.position.set(s.at[0], Math.max(0, hillY(s.at[0], s.at[1])), s.at[1]); o.setHeight(s.h); return o; });

      // ---- where things are at time t (pure functions of t, shared by the picture, the lens and the camera)
      const vanDist = (t) => S0 + (S1 - S0) * trap((t - T.go) / (T.arrive - T.go), 0.26, 0.3);
      const vanAt = (t) => { const u = vanDist(t) / road.len, p = road.getPointAt(u), tg = road.getTangentAt(u); return { p, tg, yaw: Math.atan2(-tg.z, tg.x) }; };
      const COURIER = [[3.05, 2.4], [3.65, 2.15], [3.88, 2.2], [4.08, 2.24], [3.72, 2.46]];     // out of the cab, two hops to the door, one step back
      const turn = (t) => { const u = t / 8; return (-14 + 24 * u * (1.3 - 0.3 * u)) * D2R; };   // the turntable: slows but never stops
      const toWorld = (p, th) => [p[0] * Math.cos(th) + p[2] * Math.sin(th), p[1], -p[0] * Math.sin(th) + p[2] * Math.cos(th)];
      const cam = {
        orbit: K.path([[0, [-5, 24, 27]], [8, [3, 27.5, 25.4]]]),      // degrees round, degrees up, distance
        aim: K.path([[0, [-0.3, 0.4, 0]], [8, [0.0, -0.05, 0.1]]]),
      };
      const sunCol = new THREE.Color(), cA = new THREE.Color('#ffe6c6'), cB = new THREE.Color('#ffcb9a'), skyA = new THREE.Color('#bcd3ff'), skyB = new THREE.Color('#a9b8f5'), paperA = new THREE.Color(PAL.backdrop), paperB = new THREE.Color(PAL.evening);

      return {
        update(t) {
          const th = turn(t); world.rotation.y = th;
          const dusk = K.seg(t, 2.6, 6.4, K.ease.inOut);

          // light: the sun sinks and warms, the sky cools
          sun.position.set(-9 - 2 * dusk, 13 - 3.5 * dusk, 9); sun.intensity = 3.3 - 0.3 * dusk; paper.color.copy(paperA).lerp(paperB, dusk); sun.color.copy(sunCol.copy(cA).lerp(cB, dusk));
          sky.intensity = 0.95; sky.color.copy(sunCol.copy(skyA).lerp(skyB, dusk));

          // stop 1: parcel down the rollers, hatch shut, door rolls down
          const slide = K.seg(t, T.push, T.inVan, K.ease.inOut), open = 1 - K.seg(t, T.rollDown[0], T.rollDown[1], K.ease.inOut);
          roll.scale.y = Math.max(0.02, 1 - open * 0.96); slats.repeat.y = 7 * roll.scale.y; slats.offset.y = -slats.repeat.y;
          rollers.forEach((r) => { r.rotation.y = -slide * 7; });
          const lean = Math.sin(Math.PI * K.seg(t, T.push - 0.18, T.push + 0.3)) * 0.22;
          worker.position.set(-2.12 + lean * 0.35, 0, DOOR_Z + 0.62); worker.rotation.set(-lean * 1.2, Math.PI, 0);
          const shut = K.seg(t, T.shut - 0.17, T.shut, K.ease.in), settle = t > T.shut ? Math.exp(-(t - T.shut) * 9) * Math.cos((t - T.shut) * 26) : 0;
          car.hatch.rotation.z = -1.78 * (1 - shut) - 0.05 * settle * (t < T.go ? 1 : 0);

          // the drive: position on the road, then weight on top of it (nose up when pulling away, down when braking, a lean in bends)
          const v = vanAt(t), w = 0.14, acc = (vanDist(t + w) - 2 * vanDist(t) + vanDist(t - w)) / (w * w), speed = (vanDist(t + 0.02) - vanDist(t - 0.02)) / 0.04;
          const bend = (vanAt(t + 0.08).yaw - vanAt(t - 0.08).yaw) / 0.16;
          const loadDip = (slide >= 1 ? Math.exp(-(t - T.inVan) * 10) * Math.sin((t - T.inVan) * 24) * 0.02 : 0) + settle * 0.02, stopRock = t > T.arrive ? Math.exp(-(t - T.arrive) * 7) * Math.sin((t - T.arrive) * 19) * 0.03 : 0;
          car.g.position.set(v.p.x, 0.045, v.p.z); car.g.rotation.y = v.yaw;
          car.body.position.y = -loadDip + Math.abs(Math.sin(vanDist(t) * 5.3)) * 0.008 * K.clamp(speed);
          car.body.rotation.set(K.clamp(bend * speed * 0.012, -0.1, 0.1), 0, K.clamp(acc * 0.011, -0.085, 0.085) - stopRock);
          car.wheels.forEach((wh) => { wh.rotation.z = -vanDist(t) / 0.2; });
          car.lamps.emissiveIntensity = 2.6 * K.seg(t, T.go - 0.12, T.go - 0.04);

          // stop 3: the courier hops to the door, the parcel lands on the mat, the door opens, the lights come on
          const cpos = (tt) => {
            if (tt < T.hops[0]) return hop(tt, T.out, 0.22, COURIER[0], COURIER[1], 0.3);
            if (tt >= T.back) return hop(tt, T.back, 0.24, COURIER[3], COURIER[4], 0.14);
            const i = tt >= T.hops[1] ? 1 : 0; return hop(tt, T.hops[i], T.hopLen, COURIER[i + 1], COURIER[i + 2], 0.2);
          };
          const c = cpos(t), cs = K.seg(t, T.out, T.out + 0.16, K.ease.outBack), bow = Math.sin(Math.PI * K.seg(t, T.drop - 0.24, T.drop + 0.14)) * 0.5;
          courier.visible = t >= T.out; courier.position.set(c[0], c[1], c[2]); courier.scale.set(cs * (1 + c[3]), cs * (1 - c[3]), cs * (1 + c[3]));
          courier.rotation.set(0, 0, 0); courier.rotation.y = t < T.back ? 1.3 : K.lerp(1.3, 2.4, K.seg(t, T.back, T.back + 0.24)); courier.rotateX(bow);
          const onHead = [c[0], c[1] + 0.9 * cs, c[2]], onMat = [MAT[0] - 0.27, 0.29, MAT[1]];
          if (t < T.inVan + 0.02) { parcel.visible = true; parcel.position.set(K.lerp(CONV.x0 + 0.3, v.p.x - 0.45, slide), CONV.y + 0.2 - 0.06 * K.seg(slide, 0.75, 1), DOOR_Z); parcel.rotation.set(0, 0, -0.25 * K.seg(slide, 0.7, 0.9) * (1 - K.seg(slide, 0.9, 1))); parcel.scale.setScalar(1.2); }
          else if (t < T.out) parcel.visible = false;      // riding inside the van
          else {
            const d = K.seg(t, T.drop - 0.2, T.drop, K.ease.in), b = t > T.drop ? Math.exp(-(t - T.drop) * 10) * Math.abs(Math.sin((t - T.drop) * 17)) * 0.1 : 0, p = mix(onHead, onMat, d);
            parcel.visible = true; parcel.position.set(p[0], p[1] + Math.sin(Math.PI * d) * 0.12 + b, p[2]); parcel.rotation.set(0, K.lerp(1.3, 0, d), (1 - d) * Math.sin(t * 21) * 0.06); parcel.scale.setScalar(Math.max(0.01, 1.2 * cs));
          }
          const sw = K.spring(t - T.open, 2.2, 0.6); door.rotation.y = 1.85 * sw;
          const blink = (t0) => (t < t0 ? 0 : t < t0 + 0.05 ? 0.7 : t < t0 + 0.1 ? 0.25 : 1);      // a lamp that catches, dips and holds
          homeWin[0].emissiveIntensity = 3.2 * blink(T.lights); homeWin[1].emissiveIntensity = 3.2 * blink(T.lights + 0.12); doorway.emissiveIntensity = 1.5 * K.seg(t, T.open, T.open + 0.25);
          doorLight.intensity = 1.3 * K.seg(t, T.open, T.open + 0.3); bulb.emissiveIntensity = 5 * blink(T.lamp); lampLight.intensity = 4 * blink(T.lamp);
          depotWin.forEach((m) => { m.emissiveIntensity = 0.6 + 1.6 * dusk; }); depotGlass.emissiveIntensity = 0.5 + 1.2 * dusk;
          const out = K.seg(t, T.greet, T.greet + 0.3, K.ease.out), joy = T.cheer.reduce((a, t0) => a + hop(t, t0, 0.24, [0, 0], [0, 0], 0.2)[1], 0);
          resident.position.set(HOME.x + 0.13, 0.06 + joy, K.lerp(HOME.z + 0.3, HOME.z + hz + 0.2, out));
          duck.position.set(0.25 + 0.55 * Math.cos(0.5 + t * 0.22), 0, 0.12 * Math.sin(0.5 + t * 0.22)); duck.rotation.y = -(0.5 + t * 0.22) - Math.PI / 2;
          walker.rotation.y = K.lerp(0.9, 2.2, K.seg(t, 2.6, 3.6, K.ease.inOut));      // someone watches the van go by

          // smoke: two chimneys that never stop, and the van's exhaust left behind on the road
          for (let i = 0; i < 6; i++) { const age = ((t + 10) / 2.2 + i / 6) % 1; smoke.set(i, CHIM, age, { size: 0.26, rise: 1.5, drift: 0.7, driftZ: -0.15 + 0.1 * K.hash(i, Math.floor((t + 10) / 2.2 + i / 6)) }); }
          for (let i = 0; i < 6; i++) { const age = ((t + 10) / 2.6 + i / 6 + 0.4) % 1; smoke.set(6 + i, STACK, age, { size: 0.22, rise: 1.05, drift: 0.15, driftZ: 0.1 }); }
          exhaust.forEach((t0, i) => { const e = vanAt(t0); smoke.set(12 + i, [e.p.x - e.tg.x * 0.98, 0.25, e.p.z - e.tg.z * 0.98], (t - t0) / 0.75, { size: 0.14 - i * 0.008, rise: 0.4, drift: 0 }); });
          smoke.mesh.instanceMatrix.needsUpdate = true;

          // camera and lens: one drift across the tile; the thin sharp band stays on whatever the story is about
          const [az, el, dist] = cam.orbit(t), ca = cam.aim(t), cp = [ca[0] + dist * Math.sin(az * D2R) * Math.cos(el * D2R), ca[1] + dist * Math.sin(el * D2R), ca[2] + dist * Math.cos(az * D2R) * Math.cos(el * D2R)];
          shade.rotation.z = th;
          const subject = mix([v.p.x, 0.5, v.p.z], [MAT[0] - 0.3, 0.6, MAT[1] - 0.3], K.seg(t, T.arrive, T.arrive + 1.2, K.ease.inOut));
          K.look(camera, cp, ca); K.focus(camera, toWorld(subject, th), K.lerp(0.36, 0.24, K.seg(t, 5.6, 7.2, K.ease.inOut)));

          // signs face the lens, and flip when their stop is done
          signs.forEach((s, i) => {
            const wp = toWorld([s.g.position.x, 0, s.g.position.z], th), f = t - FLIPS[i];
            s.g.rotation.y = Math.atan2(cp[0] - wp[0], cp[2] - wp[2]) - th;
            s.flip.rotation.x = -0.3 + Math.PI * (f > 0 ? K.spring(f, 2.0, 0.5) : 0);
            s.flip.position.y = SIGNS[i].h + (f > 0 ? Math.exp(-f * 7) * Math.sin(f * 14) * 0.16 : 0);
          });
        },
      };
    },

    sound(k) {
      // a quiet room, a soft pad, and one small sound for every contact on the tile; the three sign flips ring C, E, G
      k.bed('room', 0, 8, { gain: 0.7 });
      k.music('pad', 0, 8, { bpm: 120, gain: 0.7, chords: [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'G4']] });
      k.play('roller', T.push, { gain: 0.45, dur: T.inVan - T.push, pan: -0.35 });
      k.play('tock', T.inVan, { gain: 0.4, f: 420, pan: -0.3 });
      k.play('thud', T.shut, { gain: 0.45, pan: -0.3 }); k.play('click', T.shut, { gain: 0.5, pan: -0.3 });
      FLIPS.forEach((t, i) => { k.play('swish', t, { gain: 0.45, pan: [-0.4, 0, 0.3][i] }); k.play('tock', t + 0.2, { gain: 0.5, f: 760, pan: [-0.4, 0, 0.3][i] }); k.play('ding', t + 0.2, { gain: i === 2 ? 0.75 : 0.5, f: ['C6', 'E6', 'G6'][i], pan: [-0.4, 0, 0.3][i] }); });
      // the van: a small engine that climbs, cruises and comes down, with puffs of exhaust on the way out
      const d = T.arrive - T.go;
      for (const [f, g] of [[1, 0.04], [2.02, 0.018]]) k.tone(T.go - 0.1, { f: [[0, 58 * f], [d * 0.3, 118 * f], [d * 0.7, 108 * f], [d + 0.15, 52 * f]], type: 'sawtooth', dur: d + 0.3, a: 0.12, hold: d - 0.2, gain: g, filter: 'lowpass', f2: 520, q: 2, pan: 0 });
      k.noise(T.go, { dur: d, color: 'brown', filter: 'bandpass', f: 300, q: 0.8, gain: 0.06, a: 0.5, hold: d - 1.2 });
      k.withMinor(() => { for (let i = 0; i < 5; i++) k.play('pop', T.go + 0.04 + i * 0.13, { gain: 0.16, f: 240 - i * 12, pan: -0.25 }); });
      k.play('roller', T.rollDown[0], { gain: 0.22, dur: T.rollDown[1] - T.rollDown[0], pan: -0.5 }); k.play('tock', T.rollDown[1], { gain: 0.3, f: 300, pan: -0.5 });
      k.play('swish', T.arrive - 0.35, { gain: 0.25, dur: 0.3, pan: 0.3 });
      // the doorstep
      k.play('pop', T.out, { gain: 0.5, pan: 0.4 });
      [T.out + 0.22, T.hops[0] + T.hopLen, T.hops[1] + T.hopLen, T.back + 0.24].forEach((t, i) => k.play('tock', t, { gain: 0.3, f: 520 + i * 50, pan: 0.4 }));
      k.play('click', T.lamp, { gain: 0.35, pan: 0.35 });
      k.play('thud', T.drop, { gain: 0.45, f: 170, pan: 0.4 }); k.play('paper', T.drop, { gain: 0.3, dur: 0.12, pan: 0.4 });
      k.play('click', T.open, { gain: 0.6, pan: 0.45 }); k.play('blip', T.lights, { gain: 0.3, f: 'E6', type: 'sine', pan: 0.45 }); k.play('blip', T.lights + 0.12, { gain: 0.3, f: 'G6', type: 'sine', pan: 0.5 });
      T.cheer.forEach((t) => k.play('tock', t + 0.24, { gain: 0.25, f: 640, pan: 0.45 }));
      k.play('success', FLIPS[2] + 0.42, { gain: 0.5, f: 'C6' });
    },
  });
}
```
