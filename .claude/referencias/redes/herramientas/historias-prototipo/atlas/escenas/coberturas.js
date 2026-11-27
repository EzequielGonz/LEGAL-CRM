// Compara Tu Obra Social · «la mesa de arcilla»: plastilina stop-motion sobre una mesa menta, luz de ventana suave y cámara
// de 55 a 80 mm a la altura de la mesa (nada de maqueta vista desde arriba). La escena la maneja el plan (planes/<id>.json):
// cada golpe trae su objeto de plastilina, su texto (letras de plastilina pegadas en la pared del fondo) y su efecto; el gancho
// está escrito en la pared desde el cuadro 1, el contador son discos en escalones, el cierre aparece al final y el último cuadro
// es igual al primero. Objetos, letras y personaje se animan a 12 cuadros por segundo (stop(t, 12)); la cámara es fluida.
import {motor, karaoke, logo, css, lienzo, texturaRuido, THREE, E, seg, lerp, clamp, ruido, resorte, pulso, hash, stop} from '../base.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';

const MENTA = '#DAF1DE', SALVIA = '#8EB69B', BOSQUE = '#235347', ACENTO = '#003D3B', MENTA2 = '#D5E6DA', GRIS = '#587268', HUESO = '#F7F5EF';
const PIEL = '#E8BF9F', PIEL2 = '#DCAA88', PELO = '#3B2C23', ZAPATO = '#2B3B35', BOCA = '#5B2A25', D2R = Math.PI / 180;
const EFECTOS = ['golpe', 'caida', 'rebote', 'giro', 'tachar', 'sello', 'flash', 'apagon', 'lupa', 'despiece', 'barrido', 'cuenta'];
const ALIAS = {calendario: 'almanaque', telefono: 'celular', cel: 'celular', carnet: 'credencial', tarjeta: 'credencial', escalon: 'escalera', escalones: 'escalera',
  estetoscopio: 'credencial', tilde: 'check', ok: 'check', signo: 'pregunta', duda: 'pregunta', persona: 'personaje', documento: 'orden', papel: 'orden', mostrador_: 'mostrador'};
const PRE = {caida: .45, golpe: .2, rebote: .6, barrido: .3, despiece: .2};   // cuánto antes de la palabra arranca la entrada

export default async function (datos, plan) {
  const t00 = performance.now();
  await document.fonts.load('800 100px Manrope'); await document.fonts.load('600 72px Manrope');
  const P = datos.palabras, T = datos.total, pl = plan || {};
  const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const nrm = s => norm(s).replace(/[^a-z0-9]/g, '');
  const tw = (w, n = 0) => { const q = nrm(w); let l = P.filter(p => nrm(p.w) === q); if (!l.length) l = P.filter(p => nrm(p.w).startsWith(q));
    if (!l.length) throw Error('la palabra del plan no está en la voz: ' + w); return (l[n] || l[l.length - 1]).t; };
  // semilla del reel: cambia ángulos, entradas, lados y colores secundarios entre los 10 reels
  const ident = pl.id || datos.id || 'coberturas'; let sem = 7; for (const ch of ident) sem = (sem * 31 + ch.charCodeAt(0)) % 99991;
  const R = k => hash(sem * .0137 + k * 3.71);
  const S = R(1) < .5 ? 1 : -1;       // lado del objeto protagonista; el personaje se corre al lado contrario
  const VEN = R(2) < .5 ? -1 : 1;     // lado de la ventana
  const ev = []; const sfx = (t, n, v = 1) => { if (t >= 0 && t < T - .05) ev.push([+t.toFixed(3), n, v]); };

  // ── motor: tono neutro (respeta la paleta), sin bloom (dirección de arte), FXAA antes del grano ──────────────────
  const M = await motor({fondo: 0xcfe7d6, fov: 30, exposicion: 1, entorno: .5, bloom: {fuerza: 0},
    dof: {foco: 7, apertura: .0007, max: .004}, cine: {grano: .03, vineta: .2, ca: .0008, lift: [.01, .014, .012]}});
  const {scene, cam} = M; M.bloom.enabled = false; M.r.toneMapping = THREE.NeutralToneMapping; M.r.toneMappingExposure = 1.06;
  const fxaa = new ShaderPass(FXAAShader); fxaa.uniforms.resolution.value.set(1 / 1080, 1 / 1920); M.comp.insertPass(fxaa, M.comp.passes.indexOf(M.cine));

  // ── plastilina: sheen, rugosidad alta y huellas digitales en el normal map ─────────────────────────────────────
  const huella = texturaRuido(512, {escala: 7, fuerza: 1.3, huellas: 44, sem: 3 + sem % 5});
  const huellaMesa = texturaRuido(512, {escala: 9, fuerza: .8, huellas: 14, sem: 11}); huellaMesa.repeat.set(7, 12);
  const nmaps = [huella];
  const mats = new Map();
  function arcilla(col, {rug = .62, sheen = .8, ns = .45} = {}) {
    const k = col + rug + sheen + ns; if (mats.has(k)) return mats.get(k);
    const c = new THREE.Color(col), sc = c.clone().lerp(new THREE.Color('#ffffff'), .5);
    const m = new THREE.MeshPhysicalMaterial({color: c, roughness: rug, sheen, sheenRoughness: .55, sheenColor: sc, normalMap: huella, normalScale: new THREE.Vector2(ns, ns), envMapIntensity: .55});
    mats.set(k, m); return m;
  }
  // deformación a mano: nada sale perfecto (la silueta se ondula apenas)
  function amasar(g, amp, fr, s = 1) {
    const p = g.attributes.position, a = hash(s) * 6, b = hash(s + 1) * 6, c = hash(s + 2) * 6;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      p.setXYZ(i, x + amp * Math.sin(y * fr + a) * Math.cos(z * fr * .8 + b), y + amp * Math.sin(z * fr * 1.1 + c) * Math.cos(x * fr * .9 + a), z + amp * Math.sin(x * fr * 1.2 + b) * Math.cos(y * fr + c)); }
    p.needsUpdate = true; g.computeBoundingSphere(); return g;
  }
  const pz = (geo, col, o) => new THREE.Mesh(geo, arcilla(col, o));
  const caja = (w, h, d, r = .03) => amasar(new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2 - .002, h / 2 - .002, d / 2 - .002)), Math.min(w, h, d) * .035, 9, w * 31 + h * 7 + d);
  const bola = (r, a = 30, b = 22) => amasar(new THREE.SphereGeometry(r, a, b), r * .05, 2.4 / r, r * 97);
  const capsula = (r, l) => amasar(new THREE.CapsuleGeometry(r, l, 6, 18), r * .06, 2 / r, r * 53 + l);
  const cil = (r, h, rt = r, seg_ = 32) => amasar(new THREE.CylinderGeometry(rt, r, h, seg_, 1), r * .03, 2 / r, r * 41 + h);
  const toro = (r, tb, arco = Math.PI * 2) => amasar(new THREE.TorusGeometry(r, tb, 12, 40, arco), tb * .1, 3 / r, r * 17);
  function rrect(w, h, r) { const s = new THREE.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; }
  const losa = (shape, prof, bev) => { const g = new THREE.ExtrudeGeometry(shape, {depth: prof, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * .85, bevelSegments: 4, curveSegments: 10}); g.translate(0, 0, -prof / 2); return amasar(g, bev * .3, 7, prof * 99); };
  function geoCheck(s, d) { const sh = new THREE.Shape(); [[-.5, .02], [-.3, .22], [-.1, .02], [.33, .45], [.53, .25], [-.1, -.38]].forEach(([x, y], i) => i ? sh.lineTo(x * s, y * s) : sh.moveTo(x * s, y * s)); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, {depth: d, bevelEnabled: true, bevelThickness: d * .45, bevelSize: s * .05, bevelSegments: 4}); g.translate(0, 0, -d / 2); return amasar(g, s * .01, 6 / s, s * 7); }

  // ── letras de plastilina: el contorno sale del Manrope 800 dibujado en un canvas (marching squares) y se extruye con bisel ──
  const PX = 160, PAD = 6, BL = 22;
  const medidor = document.createElement('canvas').getContext('2d'); medidor.font = '800 100px Manrope';
  const ancho = s => medidor.measureText(s).width / 100;
  function contornos(f, w, h, th = .5) {
    const pts = new Map(), adj = new Map(), v = (i, j) => f[j * w + i];
    const pto = (k, x, y) => { if (!pts.has(k)) pts.set(k, [x, y]); return k; };
    const eH = (i, j) => { const a = v(i, j), b = v(i + 1, j); return pto('h' + i + ',' + j, i + (th - a) / (b - a) + .5, j + .5); };
    const eV = (i, j) => { const a = v(i, j), b = v(i, j + 1); return pto('v' + i + ',' + j, i + .5, j + (th - a) / (b - a) + .5); };
    const une = (p, q) => { if (!adj.has(p)) adj.set(p, []); if (!adj.has(q)) adj.set(q, []); adj.get(p).push(q); adj.get(q).push(p); };
    for (let j = 0; j < h - 1; j++) for (let i = 0; i < w - 1; i++) {
      const c = (v(i, j) >= th ? 8 : 0) | (v(i + 1, j) >= th ? 4 : 0) | (v(i + 1, j + 1) >= th ? 2 : 0) | (v(i, j + 1) >= th ? 1 : 0); if (c === 0 || c === 15) continue;
      const A = () => eH(i, j), B = () => eH(i, j + 1), L = () => eV(i, j), D = () => eV(i + 1, j);
      if (c === 1 || c === 14) une(L(), B()); else if (c === 2 || c === 13) une(B(), D()); else if (c === 3 || c === 12) une(L(), D());
      else if (c === 4 || c === 11) une(A(), D()); else if (c === 6 || c === 9) une(A(), B()); else if (c === 7 || c === 8) une(L(), A());
      else { const cen = (v(i, j) + v(i + 1, j) + v(i + 1, j + 1) + v(i, j + 1)) / 4 >= th;
        if ((c === 5) === cen) { une(L(), A()); une(B(), D()); } else { une(A(), D()); une(L(), B()); } }
    }
    const vis = new Set(), loops = [];
    for (const s0 of adj.keys()) { if (vis.has(s0)) continue; const L = []; let prev = null, cur = s0;
      while (cur && !vis.has(cur)) { vis.add(cur); L.push(pts.get(cur)); const n = adj.get(cur); const nx = n[0] !== prev ? n[0] : n[1]; prev = cur; cur = nx; }
      if (L.length > 4) loops.push(L); }
    return loops;
  }
  function rdp(p, eps) { if (p.length < 3) return p; const keep = new Uint8Array(p.length); keep[0] = keep[p.length - 1] = 1; const st = [[0, p.length - 1]];
    while (st.length) { const [a, b] = st.pop(); const [ax, ay] = p[a], [bx, by] = p[b]; const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9; let md = 0, mi = -1;
      for (let i = a + 1; i < b; i++) { const d = Math.abs((p[i][0] - ax) * dy - (p[i][1] - ay) * dx) / L; if (d > md) { md = d; mi = i; } }
      if (md > eps) { keep[mi] = 1; st.push([a, mi], [mi, b]); } }
    return p.filter((_, i) => keep[i]); }
  const simplificar = (L, eps) => { const n = L.length; if (n < 8) return L; const h = n >> 1; return rdp(L.slice(0, h + 1), eps).slice(0, -1).concat(rdp(L.slice(h).concat([L[0]]), eps).slice(0, -1)); };
  const redondear = (L, c) => { const o = []; for (let i = 0; i < L.length; i++) { const p = L[i], q = L[(i + 1) % L.length], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, k = Math.min(.25, c / l);
    o.push([p[0] + dx * k, p[1] + dy * k], [q[0] - dx * k, q[1] - dy * k]); } return o; };
  function formasDe(loops) {
    const area = L => { let a = 0; for (let i = 0; i < L.length; i++) { const p = L[i], q = L[(i + 1) % L.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a / 2); };
    const dentro = (pt, L) => { let c = false; for (let i = 0, j = L.length - 1; i < L.length; j = i++) { const [xi, yi] = L[i], [xj, yj] = L[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; };
    const inf = loops.map(L => ({L, a: area(L)})).filter(o => o.a > 1e-5);
    inf.forEach(o => { o.pad = inf.filter(p => p !== o && p.a > o.a && dentro(o.L[0], p.L)); o.prof = o.pad.length; });
    const v2 = L => L.map(([x, y]) => new THREE.Vector2(x, y)); const shapes = [];
    inf.filter(o => o.prof % 2 === 0).forEach(o => { o.sh = new THREE.Shape(v2(o.L)); shapes.push(o.sh); });
    inf.filter(o => o.prof % 2 === 1).forEach(o => { const p = o.pad.filter(q => q.prof === o.prof - 1).sort((a, b) => a.a - b.a)[0]; if (p && p.sh) p.sh.holes.push(new THREE.Path(v2(o.L))); });
    return shapes;
  }
  const glifos = new Map();
  function glifo(ch) {
    if (glifos.has(ch)) return glifos.get(ch);
    const c = document.createElement('canvas'), x = c.getContext('2d'); x.font = `800 ${PX}px Manrope`; const m = x.measureText(ch);
    const izq = Math.ceil(m.actualBoundingBoxLeft) + PAD, arr = Math.ceil(m.actualBoundingBoxAscent) + PAD;
    const w = izq + Math.ceil(m.actualBoundingBoxRight) + PAD, h = arr + Math.ceil(m.actualBoundingBoxDescent) + PAD;
    const G = {adv: m.width / PX, geo: null};
    if (ch.trim() && w > 2 * PAD + 1 && h > 2 * PAD + 1) {
      c.width = w; c.height = h; x.font = `800 ${PX}px Manrope`; x.fillStyle = '#fff'; x.fillText(ch, izq, arr);
      const d = x.getImageData(0, 0, w, h).data, f = new Float32Array(w * h); for (let i = 0; i < w * h; i++) f[i] = d[i * 4 + 3] / 255;
      const loops = contornos(f, w, h).map(L => redondear(redondear(simplificar(L, .5), 2.4), 1.1).map(([a, b]) => [(a - izq) / PX, (arr - b) / PX]));
      G.geo = new THREE.ExtrudeGeometry(formasDe(loops), {depth: .12, bevelEnabled: true, bevelThickness: .045, bevelSize: .028, bevelSegments: 3, curveSegments: 1});
      amasar(G.geo, .006, 11, ch.charCodeAt(0));
      const sc = document.createElement('canvas'); sc.width = w + 2 * BL; sc.height = h + 2 * BL; const sx = sc.getContext('2d'); sx.fillStyle = '#000'; sx.fillRect(0, 0, sc.width, sc.height);
      sx.filter = 'blur(7px)'; sx.font = `800 ${PX}px Manrope`; sx.fillStyle = '#fff'; sx.fillText(ch, izq + BL, arr + BL);
      G.sombra = {tx: new THREE.CanvasTexture(sc), w: sc.width / PX, h: sc.height / PX, cx: (sc.width / 2 - izq - BL) / PX, cy: (arr + BL - sc.height / 2) / PX};
    }
    glifos.set(ch, G); return G;
  }
  // texto en relieve para etiquetas de objetos (centrado en x, base en y = 0)
  function relieve(txt, s, col) { const g = new THREE.Group(), w = ancho(txt);
    for (let i = 0; i < txt.length; i++) { const G = glifo(txt[i]); if (!G.geo) continue; const m = new THREE.Mesh(G.geo, arcilla(col)); m.scale.setScalar(s); m.position.x = (ancho(txt.slice(0, i)) - w / 2) * s; g.add(m); }
    return g; }

  // ── el set: mesa menta que sube en curva hasta la pared (ciclorama), con la luz de ventana pintada ───────────────
  const PZ = -1.75, RC = .5, ANCHO_SET = 9;
  const perfil = []; { let s = 0, prev = null; const add = (z, y, nz, ny) => { if (prev) s += Math.hypot(z - prev[0], y - prev[1]); perfil.push([z, y, nz, ny, s]); prev = [z, y]; };
    add(9, 0, 0, 1); add(PZ + RC, 0, 0, 1); for (let i = 1; i <= 14; i++) { const a = i / 14 * Math.PI / 2; add(PZ + RC - Math.sin(a) * RC, RC - Math.cos(a) * RC, Math.sin(a), Math.cos(a)); } add(PZ, 7.5, 1, 0); }
  const LT = perfil[perfil.length - 1][4], sPared = perfil[perfil.length - 2][4];
  const pintura = lienzo(1024, 1024, (x, w, h) => {
    const Y = s => (1 - s / LT) * h, X = u => (u / ANCHO_SET + .5) * w;
    let g = x.createLinearGradient(0, Y(0), 0, Y(LT)); g.addColorStop(0, '#cde7d4'); g.addColorStop(8 / LT, '#d9f0de'); g.addColorStop(10.2 / LT, '#d3ebd9');
    g.addColorStop(sPared / LT, '#cfe7d6'); g.addColorStop(Math.min(1, (sPared + 3) / LT), '#c3dfcc'); g.addColorStop(1, '#b4d6bf'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    // luz de ventana sobre la pared (dos paños con el parante) y su reflejo sobre la mesa
    x.save(); x.filter = 'blur(14px)'; x.fillStyle = 'rgba(244,255,246,.55)'; const wx = X(VEN * .55);
    x.beginPath(); x.moveTo(wx - 90, Y(sPared + .9)); x.lineTo(wx + 40, Y(sPared + .7)); x.lineTo(wx + 70, Y(sPared + 3.0)); x.lineTo(wx - 60, Y(sPared + 3.3)); x.closePath(); x.fill();
    x.fillStyle = 'rgba(190,220,200,.6)'; x.fillRect(wx - 22, Y(sPared + 3.2), 9, Y(sPared + .75) - Y(sPared + 3.2)); x.fillRect(wx - 95, Y(sPared + 2.05), 170, 8);
    x.fillStyle = 'rgba(246,255,248,.35)'; x.beginPath(); x.ellipse(X(VEN * .35), Y(8.6), 200, 36, 0, 0, 7); x.fill(); x.restore();
    // los costados del set caen suave a la sombra
    const gl = x.createLinearGradient(0, 0, w, 0); gl.addColorStop(0, 'rgba(40,80,60,.35)'); gl.addColorStop(.33, 'rgba(40,80,60,0)'); gl.addColorStop(.67, 'rgba(40,80,60,0)'); gl.addColorStop(1, 'rgba(40,80,60,.35)'); x.fillStyle = gl; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(${hash(i) > .5 ? '255,255,255' : '40,80,60'},${.02 + hash(i + 3) * .03})`; x.fillRect(hash(i + 7) * w, hash(i + 11) * h, 2, 2); }
  });
  { const pos = [], nor = [], uv = [], idx = [];
    perfil.forEach(([z, y, nz, ny, s]) => { for (const xx of [-ANCHO_SET / 2, ANCHO_SET / 2]) { pos.push(xx, y, z); nor.push(0, ny, nz); uv.push(xx / ANCHO_SET + .5, s / LT); } });
    for (let j = 0; j < perfil.length - 1; j++) { const a = j * 2, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    scene.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({map: pintura, normalMap: huellaMesa, normalScale: new THREE.Vector2(.22, .22)}))); }

  // ── luz: ventana 5600 K de costado, cielo/menta de relleno y un contraluz suave que despega los bordes ────────────
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd6efdc, 1.3); scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xfff4e6, 2.2); sol.position.set(VEN * 4, 4.6, 2.6); scene.add(sol);
  const rim = new THREE.DirectionalLight(0xf1fff6, 1.0); rim.position.set(-VEN * 1.5, 3.2, -4); scene.add(rim);
  const BASE_LUZ = {hemi: 1.3, sol: 2.35, rim: 1.0, env: .5};

  // ── sombras de contacto falsas (en modo rápido no hay sombras): núcleo oscuro + sombra proyectada alargada ────────
  const texSombra = lienzo(128, 128, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 128, 128); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.4, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); }, {srgb: false});
  const planoPiso = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), planoV = new THREE.PlaneGeometry(1, 1);
  const dirS = new THREE.Vector2(-VEN * 4, -2.6).normalize(); const angS = Math.atan2(-dirS.y, dirS.x);
  const sombras = [];
  function sombra(o, r, {op = .55, alto = 0} = {}) {
    const mk = (opa, ord) => { const m = new THREE.Mesh(planoPiso, new THREE.MeshBasicMaterial({color: 0x0d3127, alphaMap: texSombra, transparent: true, depthWrite: false, opacity: opa, polygonOffset: true, polygonOffsetFactor: -2})); m.renderOrder = ord; scene.add(m); return m; };
    const s = {o, r, op, alto, a: mk(op, 2), b: mk(op * .4, 1)}; sombras.push(s); return s;
  }
  const vw = new THREE.Vector3(), vs = new THREE.Vector3();
  const visible = o => { while (o) { if (!o.visible) return false; o = o.parent; } return true; };
  function sombrasUpd() {
    scene.updateMatrixWorld();
    for (const s of sombras) { const v = visible(s.o); s.a.visible = s.b.visible = v; if (!v) continue; s.o.getWorldPosition(vw); s.o.getWorldScale(vs);
      const h = Math.max(0, vw.y - s.alto), k = 1 / (1 + h * 2.5), r = s.r * Math.max(.01, Math.min(vs.x, 1.6)) * (1 + h * .8);
      s.a.position.set(vw.x, .002, vw.z); s.a.scale.set(r * 2.2, 1, r * 1.5); s.a.material.opacity = s.op * k * Math.min(1, vs.y * 1.5);
      s.b.position.set(vw.x + dirS.x * r * .9, .0015, vw.z + dirS.y * r * .9); s.b.rotation.y = angS; s.b.scale.set(r * 3.4, 1, r * 1.9); s.b.material.opacity = s.op * .42 * k * Math.min(1, vs.y * 1.5); }
  }

  // ── plan ─────────────────────────────────────────────────────────────────────────────────────────────────────
  // El cierre se muestra tal cual lo trae el plan (desde el 27/11 es «Escribinos por WhatsApp», sin «comentá» ni palabra clave).
  const gancho = String(pl.gancho || datos.gancho || '').trim();
  const cierre = String(pl.cierre || 'Escribinos por WhatsApp').trim();
  const nCont = clamp(Math.round(+pl.contador || 0), 0, 4);
  const TF = T - .62;                             // arranca la vuelta al cuadro 1 (loop)
  const golpes = (pl.beats || []).map((b, i) => { let ob = norm(b.objeto).replace(/\s+/g, '_'); ob = ALIAS[ob] || ob; let ef = norm(b.efecto); if (!EFECTOS.includes(ef)) ef = 'rebote';
    return {i, t: tw(b.palabra, b.n || 0), objeto: ob, texto: String(b.texto || '').trim(), efecto: ef, tipo: norm(b.tipo)}; }).sort((a, b) => a.t - b.t).filter(g => g.t < TF - .3);
  const ultP = P[P.length - 1], finVoz = ultP.t + ultP.d;
  let prevC = -9; golpes.forEach((g, i) => { g.cambio = Math.max(g.t - .05, i ? prevC + 1.15 : 1.35); prevC = g.cambio;
    g.ini = Math.max(.09, g.t - (PRE[g.efecto] || 0)); g.pre = g.t - g.ini; g.esCierre = nrm(g.texto) === nrm(cierre); });
  const golpeCierre = golpes.find(g => g.esCierre);
  // si ningún golpe dice el cierre, aparece solo después de la voz (o lo más tarde que deje la vuelta al cuadro 1)
  const tCierre = golpeCierre ? golpeCierre.cambio : Math.min(T - 1.9, Math.max(finVoz, prevC + 1.0));
  golpes.forEach((g, i) => { const sig = golpes[i + 1]; g.sal = Math.min(TF, Math.max(g.t + .55, sig ? sig.ini - .32 : (golpeCierre ? TF : tCierre - .15))); g.fin = sig ? sig.t : TF;
    g.salida = sig && sig.efecto === 'barrido' ? 'barrer' : ['aplastar', 'saltar', 'barrer'][Math.floor(R(70 + i) * 3)]; });

  // ── posiciones del set ───────────────────────────────────────────────────────────────────────────────────────
  const HX = .2 * S, HZ = -.34;                 // lugar del objeto protagonista
  const LADO = {x: -.55 * S, z: -.02}, CENTRO = {x: 0, z: -.14};
  golpes.forEach(g => { const c = g.objeto === 'personaje'; g.px = c ? CENTRO.x : HX; g.pz = c ? CENTRO.z + .12 : HZ; });

  // ── personaje de plastilina (Gabriel): suéter, pelo, ojos que miran y boca que acompaña la voz ────────────────
  const cSue = [SALVIA, GRIS, BOSQUE][Math.floor(R(12) * 3)], cPan = cSue === BOSQUE ? GRIS : BOSQUE;
  const per = (() => {
    const raiz = new THREE.Group(); scene.add(raiz);
    const cad = new THREE.Group(); cad.position.y = .2; raiz.add(cad);
    const piernas = [-1, 1].map(sx => { const p = new THREE.Group(); p.position.set(sx * .072, .2, 0); raiz.add(p);
      const l = pz(capsula(.056, .1), cPan); l.position.y = -.085; p.add(l); const z = pz(bola(.07), ZAPATO); z.scale.set(.95, .6, 1.4); z.position.set(0, -.168, .035); p.add(z); return p; });
    const torso = pz(bola(.2, 40, 30), cSue); torso.scale.set(1, 1.13, .86); torso.position.y = .18; cad.add(torso);
    const cuello = pz(toro(.075, .032), cSue); cuello.rotation.x = Math.PI / 2; cuello.position.y = .4; cad.add(cuello);
    const cabeza = new THREE.Group(); cabeza.position.y = .42; cad.add(cabeza);
    const craneo = pz(bola(.155, 40, 30), PIEL, {rug: .55}); craneo.scale.set(1, 1.02, .95); craneo.position.y = .14; cabeza.add(craneo);
    const pelo = new THREE.Mesh(amasar(new THREE.SphereGeometry(.163, 40, 20, 0, Math.PI * 2, 0, Math.PI * .4), .006, 14, 8), arcilla(PELO, {rug: .75})); pelo.position.y = .145; pelo.rotation.x = -.42; cabeza.add(pelo);
    const jopo = pz(bola(.062), PELO, {rug: .75}); jopo.scale.set(1.35, .7, 1); jopo.position.set(.045 * S, .285, .06); jopo.rotation.z = -.4 * S; cabeza.add(jopo);
    [-1, 1].forEach(sx => { const o = pz(bola(.036), PIEL2, {rug: .55}); o.scale.set(.6, 1, .8); o.position.set(sx * .152, .135, 0); cabeza.add(o); });
    const ojos = [-1, 1].map(sx => { const o = new THREE.Group(); o.position.set(sx * .055, .168, .121); cabeza.add(o);
      const b = pz(bola(.038), HUESO, {rug: .3}); b.scale.set(1, 1.18, .7); o.add(b); const p = pz(bola(.017), '#13201C', {rug: .25}); p.position.z = .022; o.add(p);
      const br = pz(bola(.006, 10, 8), '#ffffff', {rug: .15}); br.position.set(.006, .008, .037); o.add(br); return {o, p}; });
    const cejas = [-1, 1].map(sx => { const c = pz(capsula(.011, .04), PELO); c.rotation.z = Math.PI / 2 + sx * .15; c.position.set(sx * .058, .226, .131); cabeza.add(c); return c; });
    const nariz = pz(bola(.046), PIEL2, {rug: .55}); nariz.scale.set(1.05, .92, 1); nariz.position.set(0, .112, .15); cabeza.add(nariz);
    const boca = pz(bola(.045), BOCA, {rug: .4}); boca.scale.set(1.2, .22, .45); boca.position.set(0, .058, .126); cabeza.add(boca);
    const sonrisa = pz(toro(.042, .009, Math.PI), BOCA, {rug: .4}); sonrisa.rotation.set(.35, 0, Math.PI); sonrisa.position.set(0, .07, .128); cabeza.add(sonrisa);
    const brazos = [-1, 1].map(sx => { const b = new THREE.Group(); b.position.set(sx * .178, .31, 0); cad.add(b); const a = pz(capsula(.046, .15), cSue); a.position.y = -.1; b.add(a);
      const m = pz(bola(.05), PIEL, {rug: .55}); m.position.y = -.215; b.add(m); return b; });
    return {raiz, cad, cabeza, ojos, cejas, boca, sonrisa, brazos, piernas};
  })();
  sombra(per.raiz, .2, {op: .6});

  // ── objetos de plastilina (cada uno ~0,6 de alto, base en y = 0, frente hacia la cámara) ─────────────────────
  const inclinado = (g, a) => { const c = new THREE.Group(); c.rotation.x = -a; g.add(c); return c; };
  const OBJ = {
    orden() { const g = new THREE.Group(), c = inclinado(g, .14), w = .54, h = .72;
      const hoja = pz(losa(rrect(w, h, .06), .028, .02), HUESO); hoja.position.y = h / 2 + .03; c.add(hoja);
      const cab = pz(caja(w * .84, .11, .03, .03), BOSQUE); cab.position.set(0, h - .05, .035); c.add(cab);
      const tit = relieve('ORDEN', .085, HUESO); tit.position.set(0, h - .081, .045); c.add(tit);
      const lin = [.78, .62, .7, .45].map((l, i) => { const k = pz(capsula(.013, w * l * .72), i === 1 ? SALVIA : GRIS); k.rotation.z = Math.PI / 2; k.position.set(-w * .4 + w * l * .36 + .013, h - .2 - i * .085, .04); c.add(k); return k; });
      const firma = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([[-.08, 0], [-.04, .05], [0, -.02], [.03, .04], [.07, -.01], [.12, .03]].map(([a, b]) => new THREE.Vector3(a + .1, b + .13, .042))), 40, .01, 6), arcilla(BOSQUE)); c.add(firma);
      const se = pz(cil(.05, .02), SALVIA); se.rotation.x = Math.PI / 2; se.position.set(-.15, .14, .045); c.add(se);
      const pie = pz(caja(.46, .08, .2, .03), SALVIA); pie.position.set(0, .04, .07); g.add(pie);
      return {g, h: h + .03, w, fz: .08, partes: [hoja, cab, tit, ...lin, firma, se, pie]}; },
    receta() { const g = new THREE.Group(), c = inclinado(g, .12), w = .46, h = .6;
      const hoja = pz(losa(rrect(w, h, .05), .03, .02), SALVIA); hoja.position.y = h / 2 + .03; c.add(hoja);
      const an = pz(caja(w * .9, .075, .075, .03), BOSQUE); an.position.set(0, h + .03, .01); c.add(an);
      const rx = relieve('Rx', .24, BOSQUE); rx.position.set(-.06, h - .3, .04); c.add(rx);
      const ls = [.5, .7, .4].map((l, i) => { const k = pz(capsula(.012, w * l * .7), HUESO); k.rotation.z = Math.PI / 2; k.position.set(-w * .38 + w * l * .35, .2 - i * .06, .04); c.add(k); return k; });
      const pie = pz(caja(.38, .07, .2, .03), BOSQUE); pie.position.set(0, .035, .06); g.add(pie);
      return {g, h: h + .07, w, fz: .07, partes: [hoja, an, rx, ...ls, pie]}; },
    celular() { const g = new THREE.Group(), c = inclinado(g, .16), w = .36, h = .68;
      const cu = pz(caja(w, h, .07, .06), ACENTO); cu.position.y = h / 2 + .03; c.add(cu);
      const pa = pz(caja(w * .84, h * .8, .02, .035), MENTA2, {rug: .35}); pa.position.set(0, h / 2 + .04, .035); c.add(pa);
      const g1 = pz(caja(.2, .085, .02, .035), SALVIA); g1.position.set(-.03, h * .64, .05); c.add(g1);
      const g2 = pz(caja(.16, .07, .02, .03), HUESO); g2.position.set(.04, h * .49, .05); c.add(g2);
      const ok = pz(geoCheck(.15, .03), ACENTO); ok.position.set(0, h * .27, .05); c.add(ok);
      const cm = pz(bola(.014, 12, 10), '#16201d'); cm.position.set(0, h - .012, .04); c.add(cm);
      const pie = pz(caja(.3, .06, .22, .03), SALVIA); pie.position.set(0, .03, .08); g.add(pie);
      return {g, h: h + .04, w, fz: .08, partes: [cu, pa, g1, g2, ok, cm, pie]}; },
    credencial() { const g = new THREE.Group(), c = inclinado(g, .12), w = .66, h = .42;
      const ta = pz(losa(rrect(w, h, .05), .03, .02), HUESO); ta.position.y = h / 2 + .05; c.add(ta);
      const ba = pz(caja(w * .92, .08, .025, .03), SALVIA); ba.position.set(0, h, .03); c.add(ba);
      const fo = pz(cil(.085, .02), MENTA2); fo.rotation.x = Math.PI / 2; fo.position.set(-.18, h * .48, .04); c.add(fo);
      const ca = pz(bola(.035), BOSQUE); ca.position.set(-.18, h * .53, .05); c.add(ca);
      const ho = pz(bola(.05), BOSQUE); ho.scale.set(1, .55, .5); ho.position.set(-.18, h * .36, .05); c.add(ho);
      const ls = [.5, .38, .44].map((l, i) => { const k = pz(capsula(.012, l * .34), i ? GRIS : BOSQUE); k.rotation.z = Math.PI / 2; k.position.set(.02 + l * .17, h * .62 - i * .075, .04); c.add(k); return k; });
      const cl = pz(caja(.5, .07, .18, .03), BOSQUE); cl.position.set(0, .035, .05); g.add(cl);
      return {g, h: h + .07, w, fz: .07, partes: [ta, ba, fo, ca, ho, ...ls, cl]}; },
    sello() { const g = new THREE.Group();
      const go = pz(caja(.37, .04, .27, .02), GRIS); go.position.y = .02; g.add(go);
      const ba = pz(caja(.4, .13, .3, .04), BOSQUE); ba.position.y = .1; g.add(ba);
      const cu = pz(cil(.065, .2, .05), SALVIA); cu.position.y = .26; g.add(cu);
      const po = pz(bola(.11), ACENTO); po.scale.set(1, .85, 1); po.position.y = .42; g.add(po);
      return {g, h: .52, w: .4, fz: .16, partes: [go, ba, cu, po]}; },
    escalera() { const g = new THREE.Group(), cols = [SALVIA, HUESO, BOSQUE], o = Math.floor(R(11) * 3);
      const ps = [0, 1, 2].map(i => { const hh = .17 + i * .17; const m = pz(caja(.2, hh, .34, .04), cols[(i + o) % 3]); m.position.set((-.21 + i * .21) * S, hh / 2, 0); g.add(m); return m; });
      const bo = pz(bola(.06), ACENTO); bo.position.set(.21 * S, .51 + .055, 0); g.add(bo);
      return {g, h: .62, w: .64, fz: .17, partes: [...ps, bo]}; },
    frasco() { const g = new THREE.Group(); const pts = [[0, 0], [.15, 0], [.18, .03], [.19, .2], [.185, .36], [.15, .42], [.13, .45], [.13, .47], [0, .47]].map(([r, y]) => new THREE.Vector2(r, y));
      const cu = new THREE.Mesh(amasar(new THREE.LatheGeometry(new THREE.SplineCurve(pts).getPoints(40), 40), .004, 12, 5), arcilla(HUESO, {rug: .4})); g.add(cu);
      const ta = pz(cil(.15, .08), BOSQUE); ta.position.y = .5; g.add(ta);
      const et = new THREE.Mesh(amasar(new THREE.CylinderGeometry(.194, .194, .15, 40, 1, true), .003, 9, 3), arcilla(SALVIA)); et.position.y = .21; g.add(et);
      const ok = pz(geoCheck(.1, .03), ACENTO); ok.position.set(0, .21, .2); g.add(ok);
      return {g, h: .54, w: .4, fz: .2, partes: [cu, et, ok, ta]}; },
    almanaque() { const g = new THREE.Group(), c = inclinado(g, .2), w = .56, h = .62;
      const ta = pz(losa(rrect(w, h, .05), .03, .02), HUESO); ta.position.y = h / 2 + .02; c.add(ta);
      const ca = pz(caja(w, .14, .07, .04), SALVIA); ca.position.set(0, h - .04, .01); c.add(ca);
      const ar = [-1, 1].map(s => { const a = pz(toro(.036, .012), BOSQUE); a.position.set(s * .14, h + .045, .02); c.add(a); return a; });
      const ce = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const e = pz(caja(.085, .07, .022, .016), (r * 4 + k) === 6 ? ACENTO : SALVIA); e.position.set(-.18 + k * .12, h - .2 - r * .12, .035); c.add(e); ce.push(e); }
      const ro = pz(toro(.066, .014), ACENTO); ro.position.set(.06, h - .32, .052); c.add(ro);
      const at = pz(caja(.4, .3, .08, .03), BOSQUE); at.position.set(0, .15, -.2); at.rotation.x = .5; g.add(at);
      return {g, h: h + .09, w, fz: .08, partes: [ta, ca, ...ar, ...ce, ro, at]}; },
    carpeta() { const g = new THREE.Group(), c = inclinado(g, .12), w = .6, h = .48;
      const tr = pz(losa(rrect(w, h, .04), .025, .018), SALVIA); tr.position.set(0, h / 2 + .02, -.04); c.add(tr);
      const pe = pz(losa(rrect(.2, .1, .03), .025, .018), SALVIA); pe.position.set(-.15 * S, h + .05, -.04); c.add(pe);
      const pa = [0, 1].map(i => { const p = pz(losa(rrect(w * .86, h * .9, .03), .012, .01), HUESO); p.position.set(.02 - i * .03, h / 2 + .09 + i * .03, -.005 - i * .012); p.rotation.z = i ? -.05 : .04; c.add(p); return p; });
      const li = pz(capsula(.01, .22), GRIS); li.rotation.z = Math.PI / 2; li.position.set(0, h * .92 + .04, .012); c.add(li);
      const tp = new THREE.Group(); tp.position.set(0, .02, .03); tp.rotation.x = .2; c.add(tp);
      const tf = pz(losa(rrect(w, h * .8, .04), .025, .018), BOSQUE); tf.position.y = h * .4; tp.add(tf);
      const et = pz(caja(.24, .08, .02, .02), HUESO); et.position.set(0, h * .5, .035); tp.add(et);
      return {g, h: h + .14, w, fz: .1, partes: [tr, pe, ...pa, li, tp]}; },
    check() { const g = new THREE.Group();
      const di = pz(cil(.3, .07, .3, 48), HUESO); di.rotation.x = Math.PI / 2; di.position.y = .37; g.add(di);
      const ar = pz(toro(.3, .032), SALVIA); ar.position.y = .37; g.add(ar);
      const ok = pz(geoCheck(.38, .06), ACENTO); ok.position.set(0, .37, .05); g.add(ok);
      const pi = pz(caja(.3, .07, .2, .03), BOSQUE); pi.position.y = .035; g.add(pi);
      return {g, h: .68, w: .64, fz: .1, partes: [pi, di, ar, ok]}; },
    pregunta() { const g = new THREE.Group(), G = glifo('?'), s = .92; const m = new THREE.Mesh(G.geo, arcilla(ACENTO)); m.scale.set(s, s, s * 2.2); m.position.set(-G.adv * s / 2, 0, -.13); g.add(m);
      const bo = pz(bola(.05), SALVIA); bo.position.set(.26 * S, .05, .05); g.add(bo);
      return {g, h: .7, w: .5, fz: .14, partes: [m, bo]}; },
    mostrador() { const g = new THREE.Group();
      const fr = pz(caja(.74, .36, .3, .05), SALVIA); fr.position.y = .18; g.add(fr);
      const ta = pz(caja(.82, .06, .38, .03), BOSQUE); ta.position.y = .39; g.add(ta);
      const fj = pz(caja(.6, .05, .02, .02), HUESO); fj.position.set(0, .22, .155); g.add(fj);
      const cb = pz(cil(.09, .02), BOSQUE); cb.position.set(.16 * S, .43, 0); g.add(cb);
      const cm = new THREE.Mesh(amasar(new THREE.SphereGeometry(.075, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), .003, 20, 2), arcilla(HUESO, {rug: .35})); cm.position.set(.16 * S, .44, 0); g.add(cm);
      const bt = pz(bola(.022), ACENTO); bt.position.set(.16 * S, .525, 0); g.add(bt);
      const li = pz(caja(.2, .04, .15, .015), GRIS); li.position.set(-.18 * S, .44, .02); li.rotation.y = .2; g.add(li);
      return {g, h: .55, w: .82, fz: .2, partes: [fr, ta, fj, cb, cm, bt, li]}; },
    reloj() { const g = new THREE.Group(), cen = .34;
      const cu = pz(cil(.25, .13, .25, 48), HUESO); cu.rotation.x = Math.PI / 2; cu.position.y = cen; g.add(cu);
      const ar = pz(toro(.25, .035), BOSQUE); ar.position.set(0, cen, .045); g.add(ar);
      const mk = []; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const b = pz(bola(i % 3 ? .012 : .02, 12, 10), i % 3 ? GRIS : BOSQUE); b.position.set(Math.sin(a) * .18, cen + Math.cos(a) * .18, .07); g.add(b); mk.push(b); }
      const ag = (l, r) => { const p = new THREE.Group(); p.position.set(0, cen, .078); const m = pz(capsula(r, l), ACENTO); m.position.y = l / 2; p.add(m); g.add(p); return p; };
      const ho = ag(.09, .016), mi = ag(.14, .012); const ej = pz(bola(.022), ACENTO); ej.position.set(0, cen, .088); g.add(ej);
      const ca = [-1, 1].map(s => { const c = new THREE.Mesh(amasar(new THREE.SphereGeometry(.07, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), .003, 20, 4), arcilla(BOSQUE)); c.position.set(s * .17, cen + .2, 0); c.rotation.z = -s * .6; g.add(c); return c; });
      const pa = [-1, 1].map(s => { const p = pz(bola(.04), BOSQUE); p.position.set(s * .14, .04, 0); g.add(p); return p; });
      g.userData.agujas = [ho, mi]; return {g, h: .64, w: .52, fz: .13, partes: [cu, ar, ...mk, ho, mi, ej, ...ca, ...pa]}; },
    generico() { const g = new THREE.Group(), cols = [SALVIA, HUESO, BOSQUE]; let y = 0;   // tres piedras de plastilina apiladas
      const ps = [[.25, .11], [.19, .095], [.13, .08]].map(([r, v], i) => { const m = pz(bola(r), cols[(i + Math.floor(R(13) * 3)) % 3]); m.scale.set(1, v / r, 1); m.position.y = y + v; m.rotation.y = i; y += 2 * v - .015; g.add(m); return m; });
      return {g, h: y, w: .5, fz: .2, partes: ps}; },
  };

  // ── utilería de los efectos ─────────────────────────────────────────────────────────────────────────────────
  const usa = ef => golpes.some(g => g.efecto === ef);
  const migas = Array.from({length: 12}, (_, j) => { const m = pz(bola(.022 + hash(j) * .018, 12, 10), [SALVIA, HUESO, BOSQUE, GRIS][j % 4]); m.visible = false; scene.add(m); return m; });
  const selloFx = usa('sello') ? (() => { const o = OBJ.sello(); scene.add(o.g); o.g.visible = false; return o.g; })() : null;
  const lupa = usa('lupa') ? (() => { const g = new THREE.Group(); scene.add(g); g.visible = false;
    const aro = pz(toro(.2, .035), BOSQUE); g.add(aro); const vid = new THREE.Mesh(new THREE.CircleGeometry(.19, 40), new THREE.MeshPhysicalMaterial({color: 0xeafff2, transparent: true, opacity: .16, roughness: .05, depthWrite: false})); g.add(vid);
    const bri = new THREE.Mesh(new THREE.TorusGeometry(.14, .008, 6, 24, 1.1), new THREE.MeshBasicMaterial({color: 0xffffff, transparent: true, opacity: .7})); bri.rotation.z = 1.9; bri.position.z = .01; g.add(bri);
    const ma = pz(capsula(.035, .26), SALVIA); ma.rotation.z = .75 * S; ma.position.set(.27 * S, -.27, 0); g.add(ma); return g; })() : null;
  const fichas = usa('cuenta') ? Array.from({length: nCont || 3}, (_, k) => { const g = new THREE.Group(); scene.add(g); g.visible = false;
    const d = pz(cil(.075, .035, .075, 32), HUESO); d.rotation.x = Math.PI / 2; g.add(d); const n = relieve(String(k + 1), .12, ACENTO); n.position.set(0, -.043, .02); g.add(n); return g; }) : [];
  const estela = usa('barrido') ? (() => { const m = pz(capsula(.06, .9), SALVIA); m.rotation.z = Math.PI / 2; m.scale.set(1, 1, .3); m.visible = false; scene.add(m); return m; })() : null;
  const foco = usa('apagon') ? (() => { const l = new THREE.SpotLight(0xfff6e8, 0, 9, .32, .55, 1.2); l.position.set(HX + .4 * VEN, 3.6, 1.8); l.target.position.set(HX, .2, HZ); scene.add(l, l.target); return l; })() : null;

  // ── cada golpe: su objeto (o el personaje), su sello, su tachón ────────────────────────────────────────────────
  const conObjeto = golpes.filter(g => g.objeto !== 'personaje');
  conObjeto.forEach((g, i) => {
    const o = (OBJ[g.objeto] || OBJ.generico)(); g.o = o; g.h_ = new THREE.Group(); g.h_.add(o.g); g.h_.visible = false; scene.add(g.h_);
    g.lado = ['rebote', 'barrido'].includes(g.efecto) ? S : (R(80 + g.i) < .5 ? 1 : -1); g.ry0 = -S * (.12 + R(90 + g.i) * .14);
    const cen = new THREE.Vector3(0, o.h * .45, 0);
    o.partes.forEach((p, j) => { p.userData.p0 = p.position.clone(); p.userData.r0 = p.rotation.clone(); const d = p.position.clone().sub(cen); d.y += .25; d.x += (hash(j + g.i * 7) - .5) * .4; d.z += .3; p.userData.dir = d.normalize(); });
    if (g.efecto === 'sello') { const m = new THREE.Group(); const d = pz(cil(.1, .025, .1, 36), ACENTO); d.rotation.x = Math.PI / 2; m.add(d); const ok = pz(geoCheck(.12, .02), HUESO); ok.position.z = .02; m.add(ok);
      m.position.set(0, o.h * .5, o.fz + .03); m.rotation.z = -.2; m.visible = false; g.h_.add(m); g.marca = m; }
    if (g.efecto === 'tachar') { const w = o.w * .6 + .06; const cur = new THREE.CatmullRomCurve3([[-w, .82], [-w * .4, .66], [w * .2, .5], [w, .3]].map(([x, y], k) => new THREE.Vector3(x, y * o.h + Math.sin(k * 2.1) * .02, o.fz + .05)));
      const tg = new THREE.TubeGeometry(cur, 48, .028, 10); const m = new THREE.Mesh(tg, arcilla(ACENTO)); g.tachon = m; g.h_.add(m); m.visible = false; }
    if (o.g.userData.agujas) g.agujas = o.g.userData.agujas;
    sombra(g.h_, o.w * .5, {op: .55});
  });
  golpes.filter(g => g.objeto === 'personaje' && g.efecto === 'sello').forEach(g => { const m = new THREE.Group(); const d = pz(cil(.075, .02, .075, 32), ACENTO); d.rotation.x = Math.PI / 2; m.add(d);
    const ok = pz(geoCheck(.09, .016), HUESO); ok.position.z = .016; m.add(ok); m.position.set(.03, .2, .175); m.rotation.z = -.2; m.visible = false; per.cad.add(m); g.marca = m; });

  // ── contador: discos en escalones (se dan vuelta de hueso a verde oficial a medida que avanzan los pasos) ───────
  const cont = nCont ? (() => { const g = new THREE.Group(); g.position.set(.5 * S, 0, -1.22); g.scale.setScalar(.88); scene.add(g);
    const pasos = []; for (let k = 0; k < nCont; k++) { const hh = .085 + k * .085, x = S * k * .205;
      const es = pz(caja(.2, hh, .3, .035), k % 2 ? HUESO : SALVIA); es.position.set(x, hh / 2, 0); g.add(es);
      const d = new THREE.Group(); d.position.set(x, hh + .1, 0); g.add(d);
      const di = new THREE.Mesh(amasar(new THREE.CylinderGeometry(.09, .09, .04, 36), .002, 30, k + 1), [arcilla(SALVIA), arcilla(HUESO), arcilla(ACENTO)]); di.rotation.x = Math.PI / 2; d.add(di);
      const n1 = relieve(String(k + 1), .13, BOSQUE); n1.position.set(0, -.047, .022); d.add(n1); const n2 = relieve(String(k + 1), .13, HUESO); n2.rotation.y = Math.PI; n2.position.set(0, -.047, -.022); d.add(n2);
      pasos.push({d, hh, x}); }
    const bo = pz(bola(.045), ACENTO); g.add(bo); const sm = new THREE.Group(); sm.position.set(S * (nCont - 1) * .1, 0, 0); g.add(sm); sombra(sm, .1 + nCont * .11, {op: .45}); sombra(bo, .05, {op: .5});
    return {g, pasos, bo}; })() : null;
  const act = []; if (nCont) { const pas = golpes.filter(g => g.tipo === 'paso'), resto = golpes.filter((g, i) => g.tipo !== 'paso' && i > 0);
    [...pas, ...resto].slice(0, nCont).sort((a, b) => a.t - b.t).forEach(g => act.push(g.t + .15)); while (act.length < nCont) act.push((act[act.length - 1] ?? 1.5) + .8); act.sort((a, b) => a - b); }

  // ── utilería fija: planta en el fondo, miguitas y la espátula de modelar en primer plano ─────────────────────
  const planta = new THREE.Group(); planta.position.set(-1.0 * S, 0, -1.22); scene.add(planta);
  { const ma = new THREE.Mesh(amasar(new THREE.CylinderGeometry(.13, .1, .2, 28), .004, 12, 3), arcilla(HUESO)); ma.position.y = .1; planta.add(ma);
    const ti = pz(cil(.115, .02), '#5a4a3c'); ti.position.y = .2; planta.add(ti);
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + R(60) * 3, tl = .45 + hash(i) * .35; const h = pz(bola(.075), i % 2 ? SALVIA : BOSQUE); h.scale.set(.45, 1.55, .26);
      h.position.set(Math.sin(a) * .06, .3 + hash(i + 3) * .05, Math.cos(a) * .06); h.rotation.set(Math.cos(a) * tl, 0, -Math.sin(a) * tl); planta.add(h); }
    sombra(planta, .15, {op: .5}); }
  [[.62, 1.55, .03, SALVIA], [.7, 1.7, .02, HUESO], [-.66, 1.75, .028, BOSQUE], [-.55, 1.6, .02, SALVIA], [.48, 2.0, .018, GRIS]].forEach(([x, z, r, c], i) => { const m = pz(bola(r, 14, 10), c); m.scale.y = .7; m.position.set(x * S, r * .7, z); scene.add(m); });
  { const es = new THREE.Group(); es.position.set(.6 * S, .02, 2.05); es.rotation.y = .5 * S; scene.add(es); const ma = pz(capsula(.02, .5), '#C9A77E', {sheen: .2}); ma.rotation.z = Math.PI / 2; es.add(ma);
    const pu = pz(caja(.12, .012, .05, .006), GRIS, {rug: .35}); pu.position.x = -.32; es.add(pu); }

  // ── textos en la pared: letras de plastilina que se pegan y se despegan (el cambio entero dura 0,25 s) ─────────
  // El tamaño se mide en píxeles de pantalla: mayúsculas de 110 a 125 px en el gancho y de 96 a 112 px en los golpes,
  // dentro del 8–92 % del ancho. Si hacen falta más renglones, se achica el interlineado, no la letra.
  const C0 = {x: 0, y: .42, z: -.5, d: 7.5 + R(6) * .3, el: 12.5 + R(7) * 3, az: (R(8) - .5) * 12, fov: 30 + R(9) * 2};
  const camT = new THREE.PerspectiveCamera(30, 1080 / 1920, .05, 400), vP = new THREE.Vector3();
  function ponerCam(cm, c) { const el = c.el * D2R, az = c.az * D2R; cm.fov = c.fov; cm.updateProjectionMatrix();
    cm.position.set(c.x + Math.sin(az) * Math.cos(el) * c.d, c.y + Math.sin(el) * c.d, c.z + Math.cos(az) * Math.cos(el) * c.d); cm.lookAt(c.x, c.y, c.z); cm.updateMatrixWorld(); }
  const pant = (cm, x, y, z) => { vP.set(x, y, z).project(cm); return [(vP.x + 1) * 540, (1 - vP.y) * 960]; };
  const paredY = (cm, py) => { let lo = RC, hi = 8; for (let k = 0; k < 32; k++) { const m = (lo + hi) / 2; if (pant(cm, 0, m, PZ)[1] > py) lo = m; else hi = m; } return (lo + hi) / 2; };
  const paredX = (cm, px, y) => { let lo = -5, hi = 5; for (let k = 0; k < 32; k++) { const m = (lo + hi) / 2; if (pant(cm, m, y, PZ)[0] < px) lo = m; else hi = m; } return (lo + hi) / 2; };
  ponerCam(camT, C0); const pxu = (pant(camT, 0, 1, PZ)[1] - pant(camT, 0, 1.5, PZ)[1]) / .5;   // píxeles por unidad sobre la pared
  const capR = medidor.measureText('H').actualBoundingBoxAscent / 100;
  const tonos = [BOSQUE, '#1F4B40', '#285B4D'];
  function bloque(txt, {capMin = 96, capMax = 112, clave = false, top = 325, anchoPx = 800, altoPx = 390, gancho = false} = {}) {
    if (!txt) return null; const pal = txt.split(/\s+/).filter(Boolean), N = pal.length;
    const mejor = n => { let m = 1e9, f = null; const rec = (i, k, acc) => { if (k === 1) { const fs = [...acc, pal.slice(i).join(' ')], mx = Math.max(...fs.map(ancho)); if (mx < m) { m = mx; f = fs; } return; }
      for (let j = i + 1; j <= N - k + 1; j++) rec(j, k - 1, [...acc, pal.slice(i, j).join(' ')]); }; rec(0, n, []); return [f, m]; };
    const sDe = cap => cap / (capR * pxu), anchoU = anchoPx / pxu, altoU = altoPx / pxu, lhDe = n => n >= 4 ? .86 : n === 3 ? .9 : .96, altoEm = n => .92 + (n - 1) * lhDe(n) + .26; let f = null, s = 0;
    if (clave && N >= 2 && !txt.includes('«')) { f = [pal.slice(0, -1).join(' '), pal[N - 1]]; s = Math.min(sDe(capMax), anchoU / Math.max(...f.map(ancho)), altoU / altoEm(2)); }   // placa del cierre: «Escribinos por / WhatsApp»
    else if (gancho) { for (let n = 1; n <= Math.min(N, 5); n++) { const [fs, m] = mejor(n); const sn = Math.min(sDe(capMax), anchoU / m); if (!f || sn > s) { f = fs; s = sn; } if (sn >= sDe(capMin)) { f = fs; s = sn; break; } } }   // gancho: los renglones que hagan falta para mayúsculas de 110 px
    else for (let n = 1; n <= Math.min(N, 4); n++) { const [fs, m] = mejor(n); const sn = Math.min(sDe(capMax), anchoU / m, altoU / altoEm(n)); if (!f || sn > s * 1.02) { f = fs; s = sn; } }   // golpes: la letra más grande que entre en ancho y alto
    const lh = lhDe(f.length), letras = [], g = new THREE.Group(); scene.add(g);
    const enClave = [], conComillas = txt.includes('«'); let dentro = false, chapaRel = null;
    f.forEach((fila, r) => { const w = ancho(fila), by = -(.92 + r * lh) * s; let ini = -1;
      for (let i = 0; i < fila.length; i++) { const ch = fila[i]; if (ch === '«') dentro = true; const esC = clave && (conComillas ? dentro : r === f.length - 1 && i > fila.lastIndexOf(' ')); if (ch === '»') dentro = false;
        const G = glifo(ch); const x0 = (ancho(fila.slice(0, i)) - w / 2) * s; if (esC && ini < 0) ini = x0; if (esC) enClave.push(x0 + G.adv * s); if (!G.geo) continue;
        const m = new THREE.Mesh(G.geo, arcilla(esC ? ACENTO : tonos[Math.floor(hash(letras.length + sem) * 3)])); m.visible = false;
        const sh = new THREE.Mesh(planoV, new THREE.MeshBasicMaterial({color: 0x0f362c, alphaMap: G.sombra.tx, transparent: true, depthWrite: false, opacity: 0})); sh.visible = false; sh.renderOrder = 1;
        g.add(m, sh); letras.push({m, sh, x: x0, y: by, dz: esC ? .075 : 0, rz: (hash(sem + letras.length * 1.7) - .5) * .08, ry: (hash(sem + letras.length * 2.3) - .5) * .14, G, s}); }
      if (ini >= 0 && enClave.length) chapaRel = {x0: ini - s * .18, x1: enClave[enClave.length - 1] + s * .18, y: by + s * .33}; });
    let chapa = null; if (chapaRel) { const w = chapaRel.x1 - chapaRel.x0, hh = s * 1.05; chapa = pz(losa(rrect(w, hh, hh * .3), .03, .025), HUESO); chapa.visible = false; g.add(chapa); }
    return {g, letras, s, chapa, chapaRel, vent: [], hB: (.92 + (f.length - 1) * lh + .26) * s, top, ox: 0, oy: 0, filas: f};
  }
  function animBloque(B, ts) {
    if (!B) return; let kc = 0, koc = 1; const st = Math.min(.005, .05 / Math.max(1, B.letras.length));
    B.letras.forEach((L, i) => {
      let k = 0, ko = 0, vis = false;   // entrada 0,12 s escalonada en 0,05 s; salida 0,08 s
      for (const [a, b] of B.vent) { const ka = seg(ts, a + i * st, a + i * st + .12), kb = seg(ts, b, b + .08); if (ka > 0 && kb < 1) { vis = true; k = ka; ko = kb; break; } }
      L.m.visible = L.sh.visible = vis; if (!vis) return; kc = Math.max(kc, k); koc = Math.min(koc, ko);
      const ent = resorte(k, 2.1, 5.2), sal = E.in3(ko), esc = Math.max(.001, L.s * ent * (1 - sal)), lejos = (1 - E.out3(k)) * .3 + E.out3(ko) * .3, X = L.x + B.ox, Y = L.y + B.oy;
      L.m.scale.set(esc, esc, esc * (1 + .6 * (1 - k)));
      L.m.position.set(X, Y + ko * .06, PZ + .046 * L.s + .003 + L.dz + lejos);
      L.m.rotation.set(-ko * .6, L.ry + (1 - k) * .4 * (i % 2 ? 1 : -1), L.rz + (1 - k) * .5 * (i % 2 ? -1 : 1));
      L.sh.material.opacity = .34 * Math.min(1, k * 1.6) * (1 - sal) / (1 + lejos * 5);
      const ds = 1 + lejos * 2; L.sh.scale.set(L.G.sombra.w * L.s * ds, L.G.sombra.h * L.s * ds, 1);
      L.sh.position.set(X + L.G.sombra.cx * L.s - VEN * (.028 + lejos * .5), Y + L.G.sombra.cy * L.s - .034 - lejos * .35, PZ + .004);
    });
    if (B.chapa) { const v = kc > 0 && koc < 1; B.chapa.visible = v; if (v) { const e = Math.max(.001, resorte(kc, 2, 5) * (1 - E.in3(koc))); B.chapa.scale.set(e, e, e);
      B.chapa.position.set((B.chapaRel.x0 + B.chapaRel.x1) / 2 + B.ox, B.chapaRel.y + B.oy, PZ + .03); } }
  }
  const bGancho = bloque(gancho, {capMin: 110, capMax: 125, top: 318, anchoPx: 864, gancho: true});
  golpes.forEach(g => { g.bl = g.cambio < TF - .5 ? bloque(g.texto, {clave: g.esCierre}) : null; });
  const bCierre = golpeCierre ? null : bloque(cierre, {clave: true});
  const primer = golpes.length ? golpes[0].cambio : tCierre;
  if (bGancho) bGancho.vent.push([-6, primer], [T - .56, T + 9]);
  golpes.forEach((g, i) => { if (g.bl) g.bl.vent.push([g.cambio + .08, Math.min(T - .64, golpes[i + 1] && golpes[i + 1].bl ? golpes[i + 1].cambio : bCierre ? tCierre : T - .64)]); });
  if (bCierre) bCierre.vent.push([tCierre + .08, T - .64]);
  const bloques = [bGancho, ...golpes.map(g => g.bl), bCierre].filter(Boolean);

  // ── movimientos del personaje: en el centro al principio, a un costado mientras hablan los objetos, al centro en el cierre ──
  let spot = 'centro', ultMov = -9; const movs = [];
  const mover = (t, s, est = 'saltos', dur = .5) => { if (s === spot) return; t = Math.max(t, .12, ultMov + .55); movs.push({t, de: spot, a: s, est, dur}); spot = s; ultMov = t; };
  golpes.forEach(g => { if (g.objeto !== 'personaje') mover(g.ini - .55, 'lado'); else if (g.efecto === 'barrido') mover(g.t - .42, 'centro', 'desliza', .4); else mover(g.ini - .55, 'centro'); });
  const ultSal = conObjeto.length ? Math.max(...conObjeto.map(g => g.sal)) : 0;
  mover(Math.min(TF - .1, Math.max(ultSal - .05, golpeCierre ? 0 : tCierre - .15)), 'centro');
  const lugar = s => s === 'centro' ? CENTRO : LADO;
  const parpadeos = []; for (let tb = 1.3 + R(5); tb < T - .8; tb += 2.1 + R(tb) * 1.6) parpadeos.push(tb);
  const gesto = g => g.objeto === 'personaje' ? 'saluda' : ['golpe', 'caida', 'apagon', 'flash'].includes(g.efecto) ? 'susto' : g.objeto === 'pregunta' ? 'duda' : (g.efecto === 'sello' || g.objeto === 'check' || g.tipo === 'cierre') ? 'aprueba' : 'apunta';

  // ── eventos de sonido ──────────────────────────────────────────────────────────────────────────────────────
  golpes.forEach(g => { const a = g.t;
    if (g.objeto === 'personaje') { sfx(a - .4, 'pop', .4); sfx(a, 'arcilla', .6); }
    else switch (g.efecto) {
      case 'caida': sfx(a - .45, 'whoosh', .5); sfx(a, 'arcilla', .9); sfx(a, 'thud', .55); break;
      case 'golpe': sfx(a - .2, 'whoosh', .5); sfx(a, 'thud', 1); sfx(a + .02, 'arcilla', .9); break;
      case 'rebote': [.6, .35, .13, 0].forEach((d, k) => sfx(a - d, 'pop', .55 - k * .08)); sfx(a, 'arcilla', .5); break;
      case 'giro': sfx(a - .05, 'whoosh', .6); sfx(a + .4, 'pop', .6); break;
      case 'tachar': sfx(a, 'pop', .6); sfx(a + .4, 'rasgu', .8); break;
      case 'sello': sfx(a, 'pop', .6); sfx(a + .2, 'whoosh', .4); sfx(a + .45, 'sello', 1); break;
      case 'flash': sfx(a, 'pop', .6); sfx(a + .18, 'foto', 1); break;
      case 'apagon': sfx(a - .05, 'foco', .9); sfx(a + .12, 'pop', .5); sfx(a + 1.1, 'foco', .5); break;
      case 'lupa': sfx(a, 'pop', .6); sfx(a + .2, 'whoosh', .5); sfx(a + .5, 'click', .7); break;
      case 'despiece': (g.o?.partes || []).slice(0, 6).forEach((p, j) => sfx(a - .2 + .25 + j * .05, 'pop', .35)); sfx(a + .45, 'arcilla', .7); break;
      case 'barrido': sfx(a - .3, 'whoosh_largo', .6); sfx(a, 'arcilla', .7); break;
      case 'cuenta': sfx(a, 'pop', .6); for (let k = 0; k < (nCont || 3); k++) sfx(a + .3 + k * .25, 'tick', .8); break;
    }
    if (g.bl) sfx(g.cambio + .08, 'flap', .35); });
  act.forEach(ta => { sfx(ta, 'ding', .45); sfx(ta + .05, 'pop', .35); });
  sfx(tCierre - .5, 'riser', .45); sfx(tCierre + .1, 'chime', .7); if (bCierre) sfx(tCierre + .08, 'flap', .4);
  sfx(T - .62, 'whoosh', .4); sfx(T - .56, 'flap', .3); movs.forEach(m => { sfx(m.t + .22, 'arcilla', .25); sfx(m.t + .47, 'arcilla', .25); });

  // ── cámara por claves (fluida, sin stop-motion); la última clave es igual a la primera ───────────────────────
  // Plano de apertura: se inclina lo justo para que la cabeza del personaje quede debajo del último renglón del gancho.
  if (bGancho) for (let y = .42; y <= 1.1; y += .02) { ponerCam(camT, {...C0, y}); const top = paredY(camT, bGancho.top);
    const yb = pant(camT, 0, top - bGancho.hB, PZ)[1], yh = pant(camT, CENTRO.x, .97, CENTRO.z)[1]; C0.y = y; if (yh >= yb + 22) break; }
  const claves = []; const clave = (t, s) => { if (claves.length && t <= claves[claves.length - 1][0] + .05) return; claves.push([t, {...C0, ...s}]); };
  clave(0, C0); if (golpes.length) clave(Math.max(.3, primer - .05), {d: C0.d - .1});
  golpes.forEach((g, i) => { const sg = (i + (R(14) < .5 ? 0 : 1)) % 2 ? 1 : -1; const st = {x: HX * .45, y: .43, d: C0.d - .15 - R(20 + i) * .25, el: C0.el + (R(30 + i) - .5) * 4, az: C0.az + sg * (3 + R(40 + i) * 4), fov: C0.fov - R(50 + i) * 1.5};
    if (g.objeto === 'personaje') st.x = 0; clave(i ? g.t + .12 : Math.max(g.t + .12, primer + .4), st); if (g.fin - .55 > g.t + .6) clave(g.fin - .55, {...st, d: st.d - .14, az: st.az + sg * 1.5}); });
  clave(tCierre + .2, {d: C0.d - .2, y: .45}); clave(T - .62, {d: C0.d - .3, y: .45}); claves.push([T - .1, {...C0}], [T + 9, {...C0}]);
  const CAMPOS = ['x', 'y', 'z', 'd', 'el', 'az', 'fov'], tgt = new THREE.Vector3();
  const xPer = t => { let p = CENTRO; for (const m of movs) { if (t < m.t) break; const k = seg(t, m.t, m.t + m.dur), a0 = lugar(m.de), a1 = lugar(m.a); p = {x: lerp(a0.x, a1.x, k), z: lerp(a0.z, a1.z, k)}; } return p; };
  claves.forEach(([t, st]) => { for (let it = 0; it < 3; it++) { ponerCam(camT, st); const p = xPer(t); let mn = 1e9, mx = -1e9;
    for (const dx of [-.42, .42]) for (const y of [.08, .55, 1]) { const [sx] = pant(camT, p.x + dx, y, p.z); mn = Math.min(mn, sx); mx = Math.max(mx, sx); }
    const d = mn < 100 ? 100 - mn : mx > 980 ? 980 - mx : 0; if (!d) break; st.x -= d / (pant(camT, p.x + 1, .5, p.z)[0] - pant(camT, p.x, .5, p.z)[0]); } });
  const estado = t => { let i = 0; while (i < claves.length - 2 && t > claves[i + 1][0]) i++; const [a, A] = claves[i], [b, B] = claves[i + 1], k = E.io2(seg(t, a, b)); const c = {}; CAMPOS.forEach(f => c[f] = lerp(A[f], B[f], k)); return c; };
  // cada texto se centra en el cuadro con la cámara que va a tener cuando se lea
  const ubicar = (B, t) => { if (!B) return; ponerCam(camT, estado(t)); B.oy = paredY(camT, B.top); B.ox = paredX(camT, 540, B.oy - B.hB / 2); };
  ubicar(bGancho, 0); golpes.forEach(g => ubicar(g.bl, g.cambio + .45)); ubicar(bCierre, tCierre + .45);
  const impactos = golpes.filter(g => g.efecto === 'golpe' || g.efecto === 'caida').map(g => [g.t, g.efecto === 'golpe' ? 1 : .45, g.px, g.pz]);
  const lupas = golpes.filter(g => g.efecto === 'lupa' && g.o);
  const envBorde = t => seg(t, 0, .5) * (1 - seg(t, T - .6, T - .12));
  // guardia: el cuerpo entero del personaje (con los brazos) queda entre el 8 % y el 92 % del ancho; si no, la cámara se corre de costado
  const vDer = new THREE.Vector3();
  function guardaPersonaje() {
    const p = per.raiz.position; let mn = 1e9, mx = -1e9;
    for (const dx of [-.42, .42]) for (const y of [.08, .55, 1.0]) { const [sx] = pant(cam, p.x + dx, p.y + y, p.z); mn = Math.min(mn, sx); mx = Math.max(mx, sx); }
    const d = mn < 96 ? 96 - mn : mx > 984 ? 984 - mx : 0; if (!d) return;
    const u = d / (pant(cam, p.x + 1, .5, p.z)[0] - pant(cam, p.x, .5, p.z)[0]);
    vDer.setFromMatrixColumn(cam.matrixWorld, 0).setY(0).normalize(); cam.position.addScaledVector(vDer, -u); tgt.addScaledVector(vDer, -u); cam.lookAt(tgt); cam.updateMatrixWorld();
  }
  function camara(t) {
    const c = estado(t);
    for (const g of lupas) { const k = E.io2(seg(t, g.t + .25, g.t + .6)) * (1 - E.io2(seg(t, g.t + 1.25, g.t + 1.6))); c.d -= .55 * k; c.y += .1 * k; }
    let punch = 0, sac = 0; const ef = 1 - seg(t, T - .5, T - .12); for (const [ti, f] of impactos) { if (t >= ti) { punch += f * 3.2 * Math.exp(-(t - ti) / .16) * ef; sac += f * pulso(t, ti, .22) * ef; } }
    const e = envBorde(t); tgt.set(c.x, c.y + sac * .02, c.z);
    const el = c.el * D2R, az = c.az * D2R;
    cam.position.set(tgt.x + Math.sin(az) * Math.cos(el) * c.d + ruido(t * .5, 1) * .012 * e, tgt.y + Math.sin(el) * c.d + ruido(t * .45, 2) * .01 * e + sac * .03, tgt.z + Math.cos(az) * Math.cos(el) * c.d);
    cam.fov = c.fov - punch; cam.updateProjectionMatrix(); cam.lookAt(tgt); cam.updateMatrixWorld(); guardaPersonaje(); M.foco(cam.position.distanceTo(tgt) - .2);
  }

  // ── interfaz: logo de la marca y karaoke ───────────────────────────────────────────────────────────────────
  css(`.cob{font-family:Manrope;font-weight:600;font-size:72px;color:#fff;-webkit-text-stroke:12px ${ACENTO};paint-order:stroke fill;letter-spacing:-.3px;word-spacing:.2em}
    .cob span{display:inline-block} .cob span.on{margin:0 .05em;font-weight:800;font-size:76px;color:${ACENTO};-webkit-text-stroke:12px #fff;transform:scale(1.06)}
    .logo.lc{background:#fff;height:64px;border-radius:32px;padding:0 26px 0 10px;box-shadow:0 6px 22px rgba(11,43,38,.16)} .logo.lc img{height:48px} .logo.lc span{font:700 28px Manrope;color:#0B2B26}`);
  logo('../coberturas.png', 'Compara Tu Obra Social', 'lc');
  const kar = karaoke(P, {max: 4, clase: 'cob'});

  // ── animación del personaje (12 cps) ─────────────────────────────────────────────────────────────────────────
  const vObj = new THREE.Vector3(HX, .3, HZ);
  function animPersonaje(ts, borde) {
    const w = borde ? 0 : 1, fe = 1 - seg(ts, T - .45, T - .14); let x = CENTRO.x, z = CENTRO.z, y = 0, sq = 0, lean = 0, spin = 0, viaje = null;
    let cur = 'centro'; for (const m of movs) { if (ts < m.t) break; const k = seg(ts, m.t, m.t + m.dur), p0 = lugar(m.de), p1 = lugar(m.a);
      if (k < 1) { viaje = m; cur = 'viaje'; if (m.est === 'desliza') { const e = E.out3(k); x = lerp(p0.x, p1.x, e); z = lerp(p0.z, p1.z, e); lean = (1 - k) * .3; sq = -(1 - k) * .12; }
        else { const e = E.io2(k), salto = Math.abs(Math.sin(k * Math.PI * 2)); x = lerp(p0.x, p1.x, e); z = lerp(p0.z, p1.z, e); y = salto * .085; sq = Math.max(0, 1 - salto * 6) * .1 * (1 - k * .3); } }
      else { x = p1.x; z = p1.z; cur = m.a; } }
    if (cur !== 'viaje') { const p = lugar(cur); x = p.x; z = p.z; }
    x = lerp(x, CENTRO.x, 1 - fe); z = lerp(z, CENTRO.z, 1 - fe);
    const enLado = Math.abs(x - LADO.x) < .05, enCentro = Math.abs(x - CENTRO.x) < .05;
    // golpe activo y su gesto
    const ga = [...golpes].reverse().find(g => ts >= g.t - .05 && ts < g.t + 1.25); const tipoG = ga ? gesto(ga) : null; const kg = fe * (ga ? E.outBack(seg(ts, ga.t, ga.t + .22), 1.6) * (1 - E.in3(seg(ts, ga.t + .85, ga.t + 1.2))) : 0);
    let bump = tipoG === 'susto' ? Math.sin(Math.PI * seg(ts, ga.t, ga.t + .35)) * .07 : 0;
    if (tipoG === 'saluda') bump = Math.sin(Math.PI * seg(ts, ga.t, ga.t + .3)) * .06;
    // cuando el protagonista del golpe es el personaje, el efecto le pasa a él
    const gp = golpes.find(g => g.objeto === 'personaje' && ts >= g.ini - .6 && ts < g.t + 1.6);
    if (gp) { const a = gp.t;
      if (gp.efecto === 'golpe' || gp.efecto === 'caida') { const d = gp.efecto === 'golpe' ? .35 : .5, alto = gp.efecto === 'golpe' ? .3 : .62, t0 = Math.max(a - d, .1);
        if (a - t0 > .12 && ts < a) y += Math.sin(Math.PI * seg(ts, t0, a)) * alto; if (ts >= a) sq += .3 * (1 - resorte(seg(ts, a, a + .6), 3, 4)); }
      else if (gp.efecto === 'giro') { if (ts >= a) { spin = (1 - E.out3(seg(ts, a, a + .75))) * Math.PI * 2 * S; y += Math.sin(Math.PI * seg(ts, a, a + .4)) * .14; } }
      else if (gp.efecto === 'rebote') { const t0 = Math.max(a - .5, .1), k = seg(ts, t0, a); if (a - t0 > .12 && k < 1 && ts >= t0) y += Math.abs(Math.sin(k * Math.PI * 3)) * .16 * (1 - k * .6); if (ts >= a) sq += .2 * (1 - resorte(seg(ts, a, a + .5), 2.5, 5)); }
      const pm = animProps(gp, ts, {h: 1, fz: .05, ys: .4, yl: .78}); y += pm.y; }
    const fin = enCentro ? seg(ts, tCierre, tCierre + .3) * (1 - seg(ts, TF, TF + .3)) : 0;
    const jit = (k) => (hash(Math.round(ts * 12) * 13.1 + k) - .5) * .004 * w;
    per.raiz.position.set(x + jit(1), (y + bump) * fe, z + jit(2));
    const rotLado = S * .42, viajeDir = viaje ? (viaje.a === 'lado' ? -S : S) * .55 : 0;
    per.raiz.rotation.set(0, (viaje ? viajeDir : enLado ? rotLado : 0) + spin * fe, lean * (viaje && viaje.a === 'lado' ? S : -S));
    // respiración y aplaste al aterrizar
    sq *= fe; const resp = Math.sin(ts * 2 * Math.PI / 2.4) * .016 * w; per.cad.scale.set(1 + sq * .6 - resp * .3, 1 - sq + resp, 1 + sq * .6 - resp * .3);
    // mirada: al objeto activo si está al costado, a cámara si no
    const hayObj = conObjeto.some(g => ts >= g.ini && ts < g.sal + .2);
    let yaw = 0, pitch = 0; if (enLado && hayObj) { const ang = Math.atan2(vObj.x - x, vObj.z - z); yaw = clamp(ang - per.raiz.rotation.y, -.75, .75); pitch = .12; } else if (enLado) yaw = -per.raiz.rotation.y * .7;
    if (fin > 0) pitch = -.16 * fin;
    // brazos: reposo levemente abiertos + gesto
    const [bI, bD] = per.brazos; const hacia = enLado ? (S > 0 ? bD : bI) : bD, otro = hacia === bD ? bI : bD, sgH = hacia === bD ? 1 : -1;
    bI.rotation.set(0, 0, -.16 + Math.sin(ts * 2.6) * .02 * w); bD.rotation.set(0, 0, .16 - Math.sin(ts * 2.6 + 1) * .02 * w);
    let cejaUp = 0, bocaO = 0, cabX = 0, cabZ = 0;
    if (tipoG === 'apunta') { hacia.rotation.z = sgH * (.16 + 1.15 * kg); hacia.rotation.x = -.55 * kg; }
    if (tipoG === 'susto') { bI.rotation.z = -.16 - 2.2 * kg; bD.rotation.z = .16 + 2.2 * kg; cejaUp = kg; bocaO = kg; }
    if (tipoG === 'aprueba') { hacia.rotation.x = -1.35 * kg; hacia.rotation.z = sgH * (.16 + .25 * kg); cabX = .22 * Math.sin(seg(ts, ga.t, ga.t + .9) * Math.PI * 3) * kg; }
    if (tipoG === 'duda') { otro.rotation.z = -sgH * (.16 + 2.5 * kg); otro.rotation.x = -.5 * kg; cabZ = -sgH * .18 * kg; cejaUp = .6 * kg; }
    if (tipoG === 'saluda') { hacia.rotation.z = sgH * (.16 + 2.45 * kg + .28 * Math.sin(ts * 16) * kg); }
    if (fin > 0 && !ga) { bD.rotation.z = .16 + 2.3 * fin; bD.rotation.x = -.35 * fin; bI.rotation.z = -.16 - .25 * fin; cejaUp = .5 * fin; }
    per.cabeza.rotation.set(pitch + cabX, yaw, cabZ + ruido(ts * .9, 9) * .03 * w);
    per.ojos.forEach(o => { o.p.position.x = clamp(yaw * .02, -.012, .012); o.p.position.y = -pitch * .03; });
    const parp = parpadeos.some(tb => ts >= tb && ts < tb + .15) && !borde; per.ojos.forEach(o => o.o.scale.y = parp ? .12 : 1);
    per.cejas.forEach((c, k) => { c.position.y = .226 + cejaUp * .022; c.rotation.z = Math.PI / 2 + (k ? 1 : -1) * (.15 - cejaUp * .12); });
    // boca: acompaña la voz palabra por palabra
    let habla = 0; if (!borde) for (const p of P) { if (ts >= p.t && ts < p.t + p.d) { habla = Math.sin(Math.PI * (ts - p.t) / p.d); break; } }
    const ab = Math.max(habla * .7, bocaO); per.boca.scale.set(1.2 - ab * .35, .22 + ab * .9, .45); per.sonrisa.visible = ab < .35;
    per.piernas.forEach((p, k) => { p.rotation.x = cur === 'viaje' ? Math.sin(ts * 26 + k * Math.PI) * .35 : 0; });
  }

  // ── animación de los objetos (12 cps) ────────────────────────────────────────────────────────────────────────
  function animObjeto(g, ts, t) {
    const a = g.t, o = g.o, h = g.h_, vis = ts >= g.ini && ts < g.sal + .3, pr = Math.max(.04, g.pre); h.visible = vis;
    let x = HX, y = 0, z = HZ, sx = 1, sy = 1, sz = 1, ry = g.ry0, rz = 0, rx = 0;
    if (vis) {
      const L = g.lado;
      switch (g.efecto) {
        case 'caida': { const k = seg(ts, a - pr, a); if (ts < a) { y = 2.7 * (1 - E.in3(k)); sy = 1.2; sx = sz = .88; rz = (1 - k) * .35 * L; } else { const q = 1 - resorte(seg(ts, a, a + .65), 2.6, 4.2); sy = 1 - .4 * q; sx = sz = 1 + .24 * q; } break; }
        case 'golpe': { const k = seg(ts, a - pr, a); if (ts < a) { y = 1.6 * (1 - E.in3(k)); sy = 1.3; sx = sz = .84; } else { const q = 1 - resorte(seg(ts, a, a + .75), 3, 3.8); sy = 1 - .55 * q; sx = sz = 1 + .32 * q; } break; }
        case 'rebote': { const k = seg(ts, a - pr, a); x = lerp(HX + L * 1.7, HX, E.out3(k)); const hop = Math.abs(Math.sin(k * Math.PI * 3)); y = hop * .42 * (1 - k * .75);
          const q = ts < a ? Math.max(0, 1 - hop * 5) * .3 * (1 - k * .5) : (1 - resorte(seg(ts, a, a + .5), 2.5, 5)) * .25; sy = 1 - q; sx = sz = 1 + q * .6; rz = -(1 - k) * .4 * L; break; }
        case 'giro': { const k = seg(ts, a, a + .5); const e = Math.max(.001, E.outBack(k, 2.2)); sx = sy = sz = e; ry += (1 - E.out3(seg(ts, a, a + .9))) * Math.PI * 3 * L; y = .22 * Math.sin(Math.PI * k); break; }
        case 'barrido': { const k = seg(ts, a - pr, a); x = lerp(HX + L * 2, HX, E.out3(k)); if (ts < a) { sx = 1 + .55 * (1 - k); sy = 1 - .2 * (1 - k); } else { const q = Math.exp(-(ts - a) / .18) * Math.sin((ts - a) * 26); sx = 1 + .12 * q; sy = 1 - .08 * q; } rz = (ts < a ? (1 - k) * .25 : 0) * L; break; }
        case 'despiece': break;
        default: { const a2 = g.efecto === 'apagon' ? a + .1 : a; const k = seg(ts, a2, a2 + .38); const e = Math.max(.001, resorte(k, 2.2, 5)); sx = sz = e; sy = Math.max(.001, e * (1 + .18 * (1 - k))); if (ts < a2) sx = sy = sz = .001; }
      }
      // utilería del efecto (sello, flash, lupa, cuenta) y tachón
      const pm = animProps(g, ts, {h: o.h, fz: o.fz, ys: o.h * .5, yl: o.h * .55}); y += pm.y; sx *= pm.s; sy *= pm.s * pm.sy; sz *= pm.s * pm.sz;
      if (g.tachon) { const k = E.io2(seg(ts, a + .4, a + .85)); g.tachon.visible = k > 0; const n = g.tachon.geometry.index.count, por = 10 * 6; g.tachon.geometry.setDrawRange(0, Math.ceil(n * k / por) * por); }
      if (g.efecto === 'barrido' && estela) { const k = seg(ts, a - .3, a + .3); estela.visible = k > 0 && k < 1; estela.position.set(HX + g.lado * (.45 + 1.4 * (1 - E.out3(seg(ts, a - .3, a)))) * .8, .015, HZ + .1); estela.scale.set(1, Math.max(.001, 1 - E.in3(seg(ts, a, a + .3))), .25); }
      // despiece: las partes llegan de afuera y encajan; a mitad del golpe se separan apenas y vuelven
      if (g.efecto === 'despiece') o.partes.forEach((p, j) => { const kp = E.out3(seg(ts, a - .2 + j * .05, a + .25 + j * .05)); const bump = Math.sin(Math.PI * seg(ts, a + 1.05, a + 1.45)) * .1;
        const d = (1 - kp) * .9 + bump; p.position.copy(p.userData.p0).addScaledVector(p.userData.dir, d); p.rotation.set(p.userData.r0.x + (1 - kp) * 1.2, p.userData.r0.y + (1 - kp) * 1.6 * (j % 2 ? 1 : -1), p.userData.r0.z + (1 - kp) * .8);
        p.visible = ts >= a - .2 + j * .05; });
      // salida
      const ko = seg(ts, g.sal, g.sal + .3);
      if (ko > 0) { const e = E.in3(ko), Ls = S;
        if (g.salida === 'barrer') { x += Ls * 2.3 * e; sx *= 1 + .6 * ko; sy *= 1 - .25 * ko; rz -= .3 * Ls * ko; }
        else if (g.salida === 'aplastar') { sy *= Math.max(.02, 1 - .97 * e); sx *= 1 + .55 * e; sz *= 1 + .55 * e; }
        else { x += Ls * 1.5 * ko; y += Math.sin(ko * Math.PI) * .55; z -= .9 * ko; rz -= 1.1 * Ls * ko; sx *= 1 - .4 * ko; sy *= 1 - .4 * ko; sz *= 1 - .4 * ko; } }
      const jit = k => (hash(Math.round(ts * 12) * 7.7 + k + g.i * 31) - .5) * .004;
      h.position.set(x + jit(1), y, z + jit(2)); h.scale.set(sx, sy, sz); h.rotation.set(rx, ry + jit(3) * 2, rz + jit(4) * 2);
      if (g.agujas) { g.agujas[1].rotation.z = -Math.floor(ts * 12) * .35; g.agujas[0].rotation.z = -Math.floor(ts * 12) * .03 - 1; }
    } else { if (g.marca) g.marca.visible = false; }
  }
  // utilería compartida por objetos y personaje: devuelve el «empuje» que el efecto le da al protagonista
  function animProps(g, ts, b) {
    const a = g.t, px = g.px, pzz = g.pz, r = {y: 0, s: 1, sy: 1, sz: 1};
    if (g.efecto === 'sello' && selloFx) { const k1 = seg(ts, a + .22, a + .45), k2 = seg(ts, a + .62, a + .95); selloFx.visible = ts > a + .15 && k2 < 1;
      selloFx.position.set(px + .5 * S * (1 - E.in3(k1)) + .6 * S * E.in3(k2), b.ys + 1.2 * (1 - E.in3(k1)) + 1.4 * E.in3(k2), pzz + b.fz + .02 + .9 * (1 - E.in3(k1)) + .5 * E.out3(k2));
      selloFx.rotation.set(Math.PI / 2 - .35 * (1 - k1) - .5 * k2, 0, -.4 * S * (1 - k1)); selloFx.scale.set(1, ts > a + .45 && ts < a + .62 ? .82 : 1, 1);
      if (ts >= a + .45 && ts < a + .7) { r.sz = .86; r.sy = .97; }
      if (g.marca) { g.marca.visible = ts >= a + .45 && ts < g.sal + .3; const km = seg(ts, a + .45, a + .7); g.marca.scale.set(1 + .4 * (1 - km), 1 + .4 * (1 - km), Math.max(.001, km)); } }
    if (g.efecto === 'flash') r.y += Math.sin(Math.PI * seg(ts, a + .16, a + .3)) * .05;
    if (g.efecto === 'lupa' && lupa) { const ki = E.out3(seg(ts, a + .2, a + .55)), ko = E.in3(seg(ts, a + 1.3, a + 1.6)); lupa.visible = ki > 0 && ko < 1;
      lupa.position.set(px + S * (1.5 * (1 - ki) + .05) - S * 1.6 * ko, b.yl + .05 * Math.sin(ts * 3), pzz + b.fz + .38); lupa.rotation.set(0, -S * .15, Math.sin(ts * 2) * .05);
      r.s = 1 + .22 * ki * (1 - ko); }
    if (g.efecto === 'cuenta') fichas.forEach((f, k) => { const tk = a + .3 + k * .25, kk = seg(ts, tk, tk + .3); f.visible = ts >= tk && ts < g.sal; const e = Math.max(.001, resorte(kk, 2.4, 5));
      f.scale.setScalar(e); f.position.set(px + (k - (fichas.length - 1) / 2) * .2, .075 + .1 * Math.sin(Math.PI * kk), pzz + .6); f.rotation.y = (1 - kk) * 3; });
    return r;
  }
  function animEfectosGlobales(ts, t) {
    if (selloFx && !golpes.some(g => g.efecto === 'sello' && ts > g.t + .15 && ts < g.t + .95)) selloFx.visible = false;
    if (lupa && !golpes.some(g => g.efecto === 'lupa' && ts > g.t + .2 && ts < g.t + 1.6)) lupa.visible = false;
    if (estela && !golpes.some(g => g.efecto === 'barrido' && ts > g.t - .3 && ts < g.t + .3)) estela.visible = false;
    if (fichas.length && !golpes.some(g => g.efecto === 'cuenta' && ts >= g.t + .3 && ts < g.sal)) fichas.forEach(f => f.visible = false);
    // migas que saltan en cada impacto (golpe fuerte, caída suave)
    let ti = null, f = 0, ix = HX, iz = HZ; for (const [tt, ff, xx, zz] of impactos) if (ts >= tt && ts < tt + 1.3) { ti = tt; f = ff; ix = xx; iz = zz; }
    migas.forEach((m, j) => { if (ti === null || j >= (f > .5 ? 12 : 7)) { m.visible = false; return; } const tau = ts - ti, an = j / 12 * Math.PI * 2 + hash(j + 5), v = (.55 + hash(j) * .5) * (.6 + f * .5), vy = (1.1 + hash(j + 9) * .9) * (.6 + f * .4);
      const tl = 2 * vy / 9.8, tt = Math.min(tau, tl); m.visible = true; m.position.set(ix + Math.cos(an) * (.22 + v * tt), Math.max(m.geometry.boundingSphere.radius * .7, vy * tt - 4.9 * tt * tt), iz + Math.sin(an) * (.18 + v * tt * .7));
      m.scale.setScalar(Math.max(.001, 1 - seg(tau, .9, 1.3))); });
  }
  // contador: discos que se dan vuelta y la bolita que sube escalón por escalón
  function animContador(ts) {
    if (!cont) return; const fin = T - .62;
    cont.pasos.forEach((p, k) => { const ta = act[k], f = resorte(seg(ts, ta, ta + .55), 2, 5) * (1 - E.io2(seg(ts, fin + k * .05, fin + .3 + k * .05)));
      p.d.rotation.y = Math.PI * f * S; p.d.position.y = p.hh + .1 + Math.sin(Math.PI * seg(ts, ta, ta + .3)) * .07; });
    const P0 = new THREE.Vector3(-S * .2, .045, .14), pos = k => k < 0 ? P0 : new THREE.Vector3(cont.pasos[k].x, cont.pasos[k].hh + .045, .14);
    const evs = act.map((ta, k) => [ta - .1, k]).concat([[fin, -1]]); let de = P0.clone(), q = P0.clone();
    for (const [te, k] of evs) { if (ts < te) break; const kk = seg(ts, te, te + .35), dst = pos(k); q = de.clone().lerp(dst, E.io2(kk)); q.y += Math.sin(Math.PI * kk) * .2; if (kk >= 1) de = dst.clone(); }
    cont.bo.position.copy(q);
  }
  // luces: flash y apagón
  function luces(t) {
    let A = 1, fl = 0; for (const g of golpes) { if (g.efecto === 'apagon') A = Math.min(A, 1 - .86 * seg(t, g.t - .06, g.t + .04) * (1 - seg(t, g.t + 1.1, g.t + 1.45)));
      if (g.efecto === 'flash') { const tf = g.t + .18; if (t >= tf && t < tf + .15) fl = Math.max(fl, 1 - (t - tf) / .15); } }
    hemi.intensity = BASE_LUZ.hemi * A; sol.intensity = BASE_LUZ.sol * A * (1 + fl * .6); rim.intensity = BASE_LUZ.rim * (.35 + .65 * A); scene.environmentIntensity = BASE_LUZ.env * (.25 + .75 * A);
    if (foco) foco.intensity = 55 * (1 - A);
    M.cine.uniforms.flash.value = .35 * fl; M.cine.uniforms.vineta.value = .2 + .5 * (1 - A); const ti = .78 + .22 * A; M.cine.uniforms.tinte.value.set(ti, ti, ti * 1.02);
  }

  function update(t) {
    const ts = stop(t, 12), borde = t < 1 / 12 || t > T - .12, fr = borde ? 0 : Math.round(ts * 12);
    for (const tx of nmaps) tx.offset.set((hash(fr * 1.7) - .5) * .05, (hash(fr * 2.3 + 5) - .5) * .05);   // «boil» de plastilina cuadro a cuadro
    luces(t); bloques.forEach(B => animBloque(B, ts));
    conObjeto.forEach(g => animObjeto(g, ts, t)); animEfectosGlobales(ts, t);
    animPersonaje(ts, borde); animContador(ts); camara(t); sombrasUpd();
    kar(t > T - .12 ? 0 : t); M.cine.uniforms.t.value = (t > T - .12 ? 0 : t) * 11.7; M.comp.render();   // en los últimos 0,12 s todo vuelve al cuadro 1 (loop exacto)
  }
  console.log('LOG coberturas armada en', Math.round(performance.now() - t00), 'ms ·', glifos.size, 'glifos ·', golpes.length, 'golpes');
  return {update, total: T, eventos: ev};
}
