// «Tiny diorama» en three.js (r170, sin modelos externos): esquina porteña en miniatura sobre una baldosa flotante, autos low-poly con volumen,
// luz de hora dorada con sombras suaves, bloom, desenfoque de miniatura (tilt-shift), grano y cámara siempre en movimiento.
// Todo es función del tiempo: S3.render(t). La cámara y los objetos de cada paso se mueven con los beats del plan.
import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {clamp, lerp, win, ease, easeOut, easeIn, backOut, hash} from '../../historia/base.js';
const C = s => new THREE.Color(s);
export function crear({P, pal, canvas, W = 1080, H = 1920}) {
  const R = P.receta, B = P.beats, T = P.T, words = P.words;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = R.expo ?? 1.05;
  const scene = new THREE.Scene(); scene.background = C(pal.bg2); scene.fog = new THREE.Fog(pal.bg2, 70, 150);
  const cam = new THREE.PerspectiveCamera(R.fov || 34, W / H, .5, 400);
  // ---------- texturas por canvas ----------
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const ventanas = (wall, seed, lit) => cv(128, 256, (x, w, h) => { x.fillStyle = lit ? '#000' : wall; x.fillRect(0, 0, w, h); for (let r = 0; r < 10; r++) for (let k = 0; k < 4; k++) { const on = hash(seed * 13 + r * 5 + k) > .55; x.fillStyle = lit ? (on ? '#ffc56e' : '#000') : (on ? '#ffd9a0' : '#1d2740'); x.fillRect(12 + k * 28, 14 + r * 24, 18, 14); } });
  const MUROS = ['#8a6f5a', '#b4a58f', '#6d7b8e', '#9a8078', '#7e8f86', '#a88f6e'];
  const bMat = i => { const m = new THREE.MeshStandardMaterial({map: ventanas(MUROS[i % 6], i + 1, false), emissiveMap: ventanas(MUROS[i % 6], i + 1, true), emissive: C('#ffffff'), emissiveIntensity: .9, roughness: .85}); return m; };
  const BMATS = [...Array(6)].map((_, i) => bMat(i)); const roofMat = new THREE.MeshStandardMaterial({color: '#4a4f5c', roughness: .9});
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .7, ...o});
  const mesh = (g, m, x = 0, y = 0, z = 0, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; };
  const grp = () => new THREE.Group();
  // ---------- luces ----------
  scene.add(new THREE.HemisphereLight(C('#8aa0e0'), C('#2a1c14'), 1.25));
  const sol = new THREE.DirectionalLight(C('#ffb066'), 3.4); sol.position.set(-16, 17, 12); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const sc = sol.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 60; sol.shadow.radius = 5; sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; scene.add(sol);
  const relleno = new THREE.DirectionalLight(C('#7a98ff'), .7); relleno.position.set(14, 8, -10); scene.add(relleno);
  // ---------- baldosa, calles y manzanas ----------
  const HT = 9.4, mundo = grp(); scene.add(mundo);
  mundo.add(mesh(new RoundedBoxGeometry(HT * 2, 1.4, HT * 2, 4, .35), std(pal.acc2 === '#fff' ? '#223' : '#1c2233', {roughness: .5}), 0, -.75, 0));
  mundo.add(mesh(new RoundedBoxGeometry(HT * 2 + .5, .22, HT * 2 + .5, 3, .1), std(pal.acc, {roughness: .35, metalness: .6}), 0, -1.45, 0, false));
  const asf = std('#2c303b', {roughness: .95}), vereda = std('#a8aeb8', {roughness: .9});
  mundo.add(mesh(new THREE.BoxGeometry(HT * 2 - .2, .12, 3.6), asf, 0, -.02, 0, false)); mundo.add(mesh(new THREE.BoxGeometry(3.6, .125, HT * 2 - .2), asf, 0, -.015, 0, false));
  const linea = std('#e8e2c8', {roughness: .6}), amar = std('#e7b93a', {roughness: .6});
  for (let i = -8; i <= 8; i++) { if (Math.abs(i) < 2.2) continue; mundo.add(mesh(new THREE.BoxGeometry(.9, .02, .12), amar, i * 1.05, .045, 0, false)); mundo.add(mesh(new THREE.BoxGeometry(.12, .02, .9), amar, 0, .047, i * 1.05, false)); }
  for (const s of [-1, 1]) for (let k = -3; k <= 3; k++) { mundo.add(mesh(new THREE.BoxGeometry(.38, .02, 1.1), linea, s * 2.35, .05, k * .5, false)); mundo.add(mesh(new THREE.BoxGeometry(1.1, .02, .38), linea, k * .5, .05, s * 2.35, false)); }
  const arbol = (x, z, s = 1) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.12, .16, .8, 8), std('#5a4030'), 0, .4, 0)); g.add(mesh(new THREE.IcosahedronGeometry(.62 * s, 1), std(['#4c7a4a', '#5f8f55', '#3e6a48'][Math.floor(hash(x * 7 + z) * 3)], {flatShading: true}), 0, 1.2, 0)); g.position.set(x, .25, z); mundo.add(g); };
  const manzana = (sx, sz, i) => { const x0 = sx * 1.8, z0 = sz * 1.8; mundo.add(mesh(new THREE.BoxGeometry(HT - 1.8, .26, HT - 1.8), vereda, sx * (1.8 + HT) / 2, .13, sz * (1.8 + HT) / 2, false));
    const alto = sz < 0; const n = 2; for (let k = 0; k < n; k++) { const w = 3 + hash(i * 3 + k) * 1.4, d = 3 + hash(i * 5 + k) * 1.2, h = alto ? 3.5 + hash(i + k * 7) * 5 : 1.4 + hash(i + k * 7) * 1.8;
      const px = sx * (3.6 + k * 3.3) , pz = sz * (HT - 2.4 - (k % 2) * .5);
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [BMATS[(i + k) % 6], BMATS[(i + k) % 6], roofMat, roofMat, BMATS[(i + k + 1) % 6], BMATS[(i + k + 1) % 6]]); b.position.set(px, .26 + h / 2, pz); b.castShadow = b.receiveShadow = true; mundo.add(b);
      mundo.add(mesh(new THREE.BoxGeometry(w + .12, .1, d + .12), std('#3a3e4a'), px, .26 + h + .05, pz)); }
    arbol(sx * 2.4, sz * 2.4, 1); arbol(sx * (HT - 1.2), sz * 2.6, .9); };
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], i) => manzana(a, b, i));
  // farolas y reloj de la esquina (19:10)
  const farola = (x, z) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.07, .09, 2.8, 8), std('#2a2d36'), 0, 1.4, 0)); g.add(mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshStandardMaterial({color: '#fff1c8', emissive: C('#ffcf7a'), emissiveIntensity: 3.2}), 0, 2.85, 0, false)); g.position.set(x, .26, z); mundo.add(g); };
  farola(2.4, 2.4); farola(-2.4, -2.4); farola(2.4, -2.4);
  const hora = P.hora || '19:10';
  const relTex = cv(512, 256, (x, w, h) => { x.fillStyle = '#10131c'; x.fillRect(0, 0, w, h); x.strokeStyle = pal.acc; x.lineWidth = 14; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = pal.acc; x.font = '800 150px Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(hora, w / 2, h / 2 + 6); });
  const reloj = grp(); reloj.add(mesh(new THREE.CylinderGeometry(.09, .11, 3.4, 8), std('#2a2d36'), 0, 1.7, 0)); const relPan = mesh(new RoundedBoxGeometry(2.0, 1.0, .22, 2, .08), [std('#10131c'), std('#10131c'), std('#10131c'), std('#10131c'), new THREE.MeshStandardMaterial({map: relTex, emissiveMap: relTex, emissive: C('#ffffff'), emissiveIntensity: 1.6}), std('#10131c')], 0, 3.5, 0); reloj.add(relPan); reloj.position.set(-2.5, .26, 2.9); reloj.rotation.y = .5; mundo.add(reloj);
  // ---------- autos low-poly con volumen ----------
  function auto(color, o = {}) {
    const g = grp(); const carro = std(color, {roughness: .32, metalness: .35}), vidrio = std('#18213a', {roughness: .12, metalness: .6});
    g.add(mesh(new RoundedBoxGeometry(4.3, .95, 1.95, 4, .28), carro, 0, .78, 0)); const cab = mesh(new RoundedBoxGeometry(2.4, .85, 1.72, 4, .32), carro, -.25, 1.55, 0); g.add(cab);
    g.add(mesh(new RoundedBoxGeometry(2.25, .62, 1.76, 3, .22), vidrio, -.25, 1.58, 0)); g.add(mesh(new RoundedBoxGeometry(2.1, .09, 1.6, 2, .04), carro, -.25, 2.0, 0));
    for (const [x, z] of [[1.35, .98], [1.35, -.98], [-1.35, .98], [-1.35, -.98]]) { const r = mesh(new THREE.CylinderGeometry(.5, .5, .36, 18), std('#14161c', {roughness: .9}), x, .5, z); r.rotation.x = Math.PI / 2; g.add(r); const hb = mesh(new THREE.CylinderGeometry(.24, .24, .38, 12), std('#c9ced8', {metalness: .8, roughness: .3}), x, .5, z * 1.0); hb.rotation.x = Math.PI / 2; g.add(hb); }
    for (const z of [-.62, .62]) { g.add(mesh(new THREE.BoxGeometry(.1, .22, .4), new THREE.MeshStandardMaterial({color: '#fff6d0', emissive: C('#ffe9a0'), emissiveIntensity: 2.2}), 2.16, .95, z, false)); g.add(mesh(new THREE.BoxGeometry(.1, .2, .4), new THREE.MeshStandardMaterial({color: '#aa1a1a', emissive: C('#ff2a2a'), emissiveIntensity: 1.2}), -2.16, .95, z, false)); }
    if (o.taxi) { g.add(mesh(new RoundedBoxGeometry(.9, .3, .4, 2, .08), new THREE.MeshStandardMaterial({color: '#fff', emissive: C('#fff0b0'), emissiveIntensity: 1.4}), -.25, 2.2, 0)); }
    return g; }
  const autoA = auto('#2b6fc9'); autoA.position.set(-1.7, .12, -.7); autoA.rotation.y = .12; mundo.add(autoA);
  const autoB = auto('#cf3b34'); autoB.position.set(.95, .12, 1.7); autoB.rotation.y = Math.PI / 2 + .22; mundo.add(autoB);
  const taxi = auto('#e9bf2c', {taxi: true}); mundo.add(taxi);
  // impacto: estrella dorada + chispas + humo
  const estrella = mesh(new THREE.IcosahedronGeometry(.75, 0), new THREE.MeshStandardMaterial({color: '#ffd54a', emissive: C('#ffb300'), emissiveIntensity: 2.6, flatShading: true}), .45, 1.1, .35, false); mundo.add(estrella);
  const puas = [...Array(10)].map((_, i) => { const m = mesh(new THREE.ConeGeometry(.16, .9, 5), estrella.material, 0, 0, 0, false); m.userData.a = i / 10 * Math.PI * 2; mundo.add(m); return m; });
  const humo = [...Array(7)].map((_, i) => { const m = mesh(new THREE.IcosahedronGeometry(.45, 1), std('#aab0bc', {transparent: true, opacity: .5, roughness: 1}), .4, 1.4, .3, false); m.userData.i = i; mundo.add(m); return m; });
  // ---------- personajes (siluetas) ----------
  const persona = (color, esc = 1, rim = pal.acc) => { const g = grp(); const m = new THREE.MeshStandardMaterial({color, roughness: .55, emissive: C(rim), emissiveIntensity: .12});
    g.add(mesh(new THREE.CapsuleGeometry(.36, .95, 6, 14), m, 0, 1.0, 0)); g.add(mesh(new THREE.SphereGeometry(.33, 18, 14), m, 0, 2.0, 0)); for (const s of [-1, 1]) { const b = mesh(new THREE.CapsuleGeometry(.1, .65, 4, 8), m, s * .5, 1.15, 0); b.rotation.z = s * .22; g.add(b); }
    g.scale.setScalar(esc); g.userData.cabeza = new THREE.Vector3(0, 2.35 * esc, 0); return g; };
  const nico = persona('#10131c', 1.25); nico.position.set(3.6, .26, 3.2); nico.rotation.y = -.5; mundo.add(nico);
  const otro = persona('#8b2a2a', 1.15, '#ff9a8a'); otro.position.set(-.6, .12, 1.6); otro.visible = false; mundo.add(otro);
  const tes = [persona('#2a5c8a', .95, '#9fd0ff'), persona('#3a7a4a', 1.0, '#b6ffc4')]; tes[0].position.set(-3.6, .26, 3.4); tes[1].position.set(3.9, .26, -3.4); tes.forEach(t => { t.visible = false; mundo.add(t); });
  // ---------- props de cada paso (billboards con textura + objetos 3D) ----------
  const tarjeta = (w, h, fn, col = '#ffffff') => { const t = cv(Math.round(w * 160), Math.round(h * 160), fn); const m = mesh(new RoundedBoxGeometry(w, h, .12, 2, .06), [std(col), std(col), std(col), std(col), new THREE.MeshStandardMaterial({map: t, roughness: .6, emissiveMap: t, emissive: C('#ffffff'), emissiveIntensity: .35}), std(col)], 0, 0, 0); return m; };
  const tx = (x, s, w, h, f) => { x.fillStyle = f; };
  const fotos = [
    tarjeta(2.9, 2.2, (x, w, h) => { x.fillStyle = '#243a64'; x.fillRect(0, 0, w, h); x.fillStyle = '#2b6fc9'; x.fillRect(60, 200, 150, 60); x.fillStyle = '#cf3b34'; x.fillRect(250, 190, 150, 70); x.fillStyle = '#ffd54a'; x.beginPath(); x.arc(230, 190, 34, 0, 7); x.fill(); x.fillStyle = '#fff'; x.font = '800 40px Manrope'; x.fillText('AUTOS', 18, 52); }),
    tarjeta(2.9, 2.2, (x, w, h) => { x.fillStyle = '#18213a'; x.fillRect(0, 0, w, h); x.fillStyle = '#f4f4f0'; x.fillRect(50, 150, 360, 130); x.strokeStyle = '#223'; x.lineWidth = 8; x.strokeRect(50, 150, 360, 130); x.fillStyle = '#223'; x.font = '800 84px Manrope'; x.textAlign = 'center'; x.fillText('AB 123 CD', 230, 240); x.fillStyle = '#fff'; x.textAlign = 'left'; x.font = '800 40px Manrope'; x.fillText('PATENTE', 18, 52); }),
    tarjeta(2.9, 2.2, (x, w, h) => { x.fillStyle = '#2a5c46'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.fillRect(60, 130, 340, 90); x.fillStyle = '#143'; x.font = '800 44px Manrope'; x.textAlign = 'center'; x.fillText('Montes de Oca', 230, 190); x.fillRect(226, 220, 8, 80); x.textAlign = 'left'; x.fillStyle = '#fff'; x.font = '800 40px Manrope'; x.fillText('ESQUINA', 18, 52); })];
  const portapapeles = tarjeta(2.4, 3.1, (x, w, h) => { x.fillStyle = '#f6f1e2'; x.fillRect(0, 0, w, h); x.fillStyle = pal.acc; x.fillRect(0, 0, w, 56); x.fillStyle = '#10131c'; x.font = '800 36px Manrope'; x.fillText('DATOS', 18, 40); [['Nombre', 100], ['DNI', 170], ['Seguro', 240], ['Testigos', 310], ['Teléfono', 380]].forEach(([s, y]) => { x.fillStyle = '#10131c'; x.font = '700 30px Manrope'; x.fillText(s, 18, y); x.fillRect(150, y + 2, 200, 3); }); });
  const celu = grp(); const pantTex = cv(300, 560, (x, w, h) => { x.fillStyle = '#0e1630'; x.fillRect(0, 0, w, h); x.fillStyle = pal.acc; x.beginPath(); x.moveTo(150, 90); x.lineTo(240, 125); x.lineTo(240, 215); x.quadraticCurveTo(240, 290, 150, 330); x.quadraticCurveTo(60, 290, 60, 215); x.lineTo(60, 125); x.fill(); x.strokeStyle = '#0e1630'; x.lineWidth = 16; x.beginPath(); x.moveTo(105, 210); x.lineTo(140, 250); x.lineTo(200, 170); x.stroke(); x.fillStyle = '#fff'; x.font = '800 40px Manrope'; x.textAlign = 'center'; x.fillText('Aviso enviado', 150, 400); x.fillStyle = pal.acc; x.font = '700 32px Manrope'; x.fillText('a tu seguro', 150, 450); });
  celu.add(mesh(new RoundedBoxGeometry(1.7, 3.2, .22, 3, .22), std('#10131c', {roughness: .3, metalness: .5}), 0, 0, 0)); const pant = mesh(new THREE.PlaneGeometry(1.5, 2.9), new THREE.MeshStandardMaterial({map: pantTex, emissiveMap: pantTex, emissive: C('#fff'), emissiveIntensity: .8}), 0, 0, .125, false); celu.add(pant);
  const calendario = tarjeta(2.5, 2.5, (x, w, h) => { x.fillStyle = '#f4f1e8'; x.fillRect(0, 0, w, h); x.fillStyle = pal.acc; x.fillRect(0, 0, w, 90); x.fillStyle = '#10131c'; x.font = '800 54px Manrope'; x.textAlign = 'center'; x.fillText('3 DÍAS', w / 2, 66); x.font = '800 220px Manrope'; x.fillText('3', w / 2, 300); x.font = '700 40px Manrope'; x.fillText('para avisar', w / 2, 360); });
  const crono = grp(); crono.add(mesh(new THREE.TorusGeometry(1.1, .16, 12, 40), new THREE.MeshStandardMaterial({color: pal.acc, metalness: .9, roughness: .25, emissive: C(pal.acc), emissiveIntensity: .35}), 0, 0, 0)); const aguja = mesh(new THREE.BoxGeometry(.1, .8, .1), std('#fff'), 0, .4, 0); crono.add(aguja); crono.add(mesh(new THREE.CylinderGeometry(.2, .2, .3, 12), std(pal.acc, {metalness: .9, roughness: .3}), 0, 1.4, 0)); crono.userData.aguja = aguja;
  const camaraP = grp(); camaraP.add(mesh(new RoundedBoxGeometry(2.2, 1.4, 1.0, 3, .18), std('#14161c', {roughness: .4, metalness: .4}), 0, 0, 0)); const lente = mesh(new THREE.CylinderGeometry(.55, .6, .6, 24), std('#c9ced8', {metalness: .9, roughness: .2}), 0, 0, .7); lente.rotation.x = Math.PI / 2; camaraP.add(lente); const cristal = mesh(new THREE.CylinderGeometry(.42, .42, .62, 24), new THREE.MeshStandardMaterial({color: '#1c3a8a', emissive: C('#2a58ff'), emissiveIntensity: .6, metalness: .8, roughness: .1}), 0, 0, .72); cristal.rotation.x = Math.PI / 2; camaraP.add(cristal); camaraP.add(mesh(new THREE.BoxGeometry(.6, .3, .3), std(pal.acc), .6, .85, 0));
  const flash = mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({color: '#fff', transparent: true, opacity: 0}), 0, 0, 0, false);
  const avion = (() => { const g = new THREE.BufferGeometry(); const v = new Float32Array([0, 0, 1.6, -.9, .2, -.9, 0, -.15, -.5, 0, 0, 1.6, 0, -.15, -.5, .9, .2, -.9, 0, -.15, -.5, 0, .35, -.9, -.9, .2, -.9, 0, -.15, -.5, .9, .2, -.9, 0, .35, -.9]); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.computeVertexNormals(); return mesh(g, new THREE.MeshStandardMaterial({color: '#fff', emissive: C(pal.acc), emissiveIntensity: .5, side: THREE.DoubleSide, flatShading: true}), 0, 0, 0); })();
  const estela = [...Array(18)].map(() => mesh(new THREE.SphereGeometry(.14, 8, 6), new THREE.MeshBasicMaterial({color: pal.acc, transparent: true, opacity: 0}), 0, 0, 0, false));
  const props = [...fotos, portapapeles, celu, calendario, crono, camaraP, flash, avion, ...estela]; props.forEach(p => { p.visible = false; scene.add(p); });
  // bokeh lejano
  const bok = [...Array(46)].map((_, i) => { const m = mesh(new THREE.SphereGeometry(.35 + hash(i) * .6, 8, 6), new THREE.MeshBasicMaterial({color: i % 3 ? pal.acc : pal.luz, transparent: true, opacity: .35}), (hash(i + 3) - .5) * 90, -8 + hash(i + 7) * 28, -22 - hash(i + 9) * 30, false); scene.add(m); return m; });
  // sombra suave bajo la baldosa
  const sombraT = cv(256, 256, (x, w, h) => { const g = x.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.65)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({map: sombraT, transparent: true, depthWrite: false})); sombra.rotation.x = -Math.PI / 2; sombra.position.y = -6; scene.add(sombra);
  // ---------- post: bloom, miniatura (tilt-shift), grano y viñeta ----------
  const rt = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4}); const comp = new EffectComposer(renderer, rt); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), R.bloom ?? .5, .55, .82));
  const tilt = (dir) => new ShaderPass({uniforms: {tDiffuse: {value: null}, dir: {value: new THREE.Vector2(dir[0], dir[1])}, foco: {value: .5}, r: {value: 5.5}, res: {value: new THREE.Vector2(W, H)}},
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;uniform vec2 dir;uniform vec2 res;uniform float foco;uniform float r;varying vec2 vUv;void main(){float d=smoothstep(.16,.5,abs(vUv.y-foco));float rad=r*d;vec4 s=vec4(0.);float wsum=0.;for(int i=-6;i<=6;i++){float f=float(i)/6.;float w=exp(-f*f*2.2);s+=texture2D(tDiffuse,vUv+dir*rad*f*2./res)*w;wsum+=w;}gl_FragColor=s/wsum;}'});
  const tH = tilt([1, 0]), tV = tilt([0, 1]); comp.addPass(tH); comp.addPass(tV); comp.addPass(new OutputPass());
  const fin = new ShaderPass({uniforms: {tDiffuse: {value: null}, tm: {value: 0}, grano: {value: R.grano ?? .06}}, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'uniform sampler2D tDiffuse;uniform float tm;uniform float grano;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+tm)*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 q=vUv-.5;float v=smoothstep(.95,.3,length(q*vec2(.85,.62)));c.rgb*=mix(.55,1.,v);c.rgb=mix(c.rgb,c.rgb*vec3(1.04,1.0,.94),.5);c.rgb+=(h(vUv*vec2(1080.,1920.))-.5)*grano;gl_FragColor=c;}'}); comp.addPass(fin);
  // ---------- cámara: siempre en movimiento ----------
  const CFG = [{az: [20, 36], el: 36, d: [50, 44], f: [0, 1.8, 0]}, {az: [44, 58], el: 28, d: [38, 33], f: [0, 1.8, 0]}, {az: [-30, -44], el: 32, d: [38, 33], f: [.5, 1.6, 1.2]}, {az: [8, -6], el: 26, d: [36, 31], f: [-.6, 2.6, 1.6]}, {az: [-52, -66], el: 40, d: [56, 52], f: [0, 1.4, 0]}];
  const cfgDe = i => B[i].loop ? CFG[0] : CFG[Math.min(i, CFG.length - 1)];
  const posa = (i, u) => { const c = cfgDe(i); const e = ease(u); const az = lerp(c.az[0], c.az[1], B[i].loop ? 0 : e) * Math.PI / 180, el = c.el * Math.PI / 180, d = lerp(c.d[0], c.d[1], B[i].loop ? 0 : e); return {az, el, d, f: new THREE.Vector3(...c.f)}; };
  const pun = new Array(B.length).fill(0);
  function camara(t) {
    let i = B.length - 1; while (i > 0 && B[i].t0 > t) i--; const b = B[i], u = clamp((t - b.t0) / (b.t1 - b.t0)); let p = posa(i, u);
    if (i > 0) { const q = posa(i - 1, 1), k = ease(win(t - b.t0, 0, b.loop ? 1.4 : .55)); p = {az: lerp(q.az, p.az, k), el: lerp(q.el, p.el, k), d: lerp(q.d, p.d, k), f: q.f.clone().lerp(p.f, k)}; }
    const gp = Math.exp(-(t - b.t0) * 5.5) * (i > 0 && !b.loop ? 1 : 0); // golpe de zoom al entrar cada paso
    const asent = win(t, 0, .5) * (1 - win(t, T - 1.2, T - .6)); const hx = (Math.sin(t * 1.7) * .25 + Math.sin(t * 4.3) * .08) * asent, hy = Math.sin(t * 1.3 + 1) * .16 * asent;
    const d = p.d - gp * 6.5 + (win(t, 0, 2.5) * (1 - win(t, 0, .0))) * 0; const az = p.az + (Math.sin(t * .5) * .035) * asent;
    cam.position.set(p.f.x + d * Math.cos(p.el) * Math.sin(az) + hx, p.f.y + d * Math.sin(p.el) + hy, p.f.z + d * Math.cos(p.el) * Math.cos(az)); cam.lookAt(p.f.x, p.f.y + (R.ymira ?? 0), p.f.z);
    cam.fov = (R.fov || 34) - gp * 4; cam.updateProjectionMatrix(); return gp; }
  // ---------- tiempos de palabras (sin acentos) ----------
  const sa = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tw = (re, desde = 0, def = null) => { const w = words.find(w => w.t >= desde - .01 && re.test(sa(w.w))); return w ? w.t : def; };
  const b1 = B[1] || B[0], b2 = B[2] || B[0], b3 = B[3] || B[0], b4 = B[4] || B[0];
  const tF = [tw(/^auto/, b1.t0, b1.t0 + .8), tw(/patente/, b1.t0, b1.t0 + 2), tw(/esquina/, b1.t0, b1.t0 + 3.2)];
  const tOtro = tw(/otro/, b2.t0, b2.t0 + .5), tTes = tw(/testigo/, b2.t0, b2.t0 + 2.2), tSeg = tw(/seguro/, b3.t0, b3.t0 + 1), tDias = tw(/dias/, b3.t0, b3.t0 + 2.5);
  const pop = (t, a, bb) => backOut(win(t, a, a + .4), 2) * (1 - easeIn(win(t, bb - .22, bb)));
  const mira = (o) => o.lookAt(cam.position);
  const proy = new THREE.Vector3();
  function render(t) {
    const gp = camara(t); const bi = (() => { let i = B.length - 1; while (i > 0 && B[i].t0 > t) i--; return i; })(); const b = B[bi]; const loop = !!b.loop;
    // impacto congelado con idle suave
    const ti = loop ? 0 : t; const fl = .5 + .5 * Math.sin(ti * 9); estrella.rotation.set(ti * .8, ti * 1.1, 0); estrella.scale.setScalar(1 + .12 * fl + .35 * Math.exp(-t * 4) * (loop ? 0 : 1)); estrella.material.emissiveIntensity = 2.2 + fl;
    puas.forEach((m, i) => { const a = m.userData.a + ti * .3; const s = .9 + .25 * Math.sin(ti * 8 + i); m.position.set(estrella.position.x + Math.cos(a) * 1.1 * s, estrella.position.y + Math.sin(a) * 1.1 * s * .8, estrella.position.z); m.rotation.z = a - Math.PI / 2; m.scale.setScalar(.8 + .2 * Math.sin(ti * 8 + i)); });
    humo.forEach(m => { const k = ((ti * .35 + m.userData.i / 7) % 1); m.position.set(.4 + Math.sin(m.userData.i * 2 + ti) * .35, 1.4 + k * 3.2, .3 + Math.cos(m.userData.i) * .3); m.scale.setScalar(.5 + k * 1.1); m.material.opacity = .5 * (1 - k); });
    // taxi (paso final): entra por la calle y pasa
    const kTaxi = b4 !== B[0] ? win(t, b4.t0 + .2, b4.t1 + .3) : 0; taxi.visible = bi === 4 || (bi === B.length - 1 && !loop && false); taxi.position.set(lerp(-14, 14, ease(kTaxi)), .12, 1.0); taxi.rotation.y = Math.PI * 0;
    autoA.position.y = .12; autoB.position.y = .12;
    // paso 1: cámara, flash y tres fotos
    const v1 = bi === 1, p1 = v1 ? pop(t, b1.t0 + .1, b1.t1) : 0; camaraP.visible = p1 > .01; camaraP.position.set(.3, 4.8 + Math.sin(t * 2) * .12, 2.2); camaraP.rotation.set(.5, Math.PI + .3, 0); camaraP.scale.setScalar(Math.max(.01, p1) * 1.15); mira(camaraP);
    camaraP.rotation.z = 0; fotos.forEach((f, k) => { const a = tF[k]; const pk = v1 ? pop(t, a, b1.t1) : 0; f.visible = pk > .01; const ang = (k - 1) * .62; f.position.set(Math.sin(ang) * 4.2, 3.7 + Math.cos(k) * .3 + Math.sin(t * 1.6 + k) * .15, 1.4 + Math.cos(ang) * 1.6 + (k === 1 ? .8 : 0)); mira(f); f.rotateZ((k - 1) * -.08); f.scale.setScalar(Math.max(.01, pk) * 1.25); });
    const tf = v1 ? Math.max(...tF.map(a => Math.exp(-(t - a) * 9) * (t >= a ? 1 : 0))) : 0; flash.visible = tf > .02; flash.position.set(0, 1.2, 0); flash.scale.setScalar(5 + tf * 3); flash.material.opacity = tf * .55; window.__flash = tf;
    // paso 2: el otro conductor, testigos y planilla de datos
    const v2 = bi === 2; const p2 = v2 ? pop(t, tOtro, b2.t1) : 0, p2b = v2 ? pop(t, tTes, b2.t1) : 0; otro.visible = p2 > .01; otro.scale.setScalar(Math.max(.01, p2) * 1.15); tes.forEach((s, k) => { s.visible = p2b > .01; s.scale.setScalar(Math.max(.01, p2b) * (k ? 1 : .95)); });
    portapapeles.visible = v2 && win(t, b2.t0, b2.t0 + .3) > 0; portapapeles.position.set(2.6, 4.1 + Math.sin(t * 1.5) * .15, 1.6); mira(portapapeles); portapapeles.scale.setScalar(Math.max(.01, v2 ? pop(t, b2.t0 + .15, b2.t1) : 0) * 1.2);
    // paso 3: celular con aviso, calendario de 3 días y cronómetro dorado
    const v3 = bi === 3; celu.visible = v3 && pop(t, b3.t0 + .1, b3.t1) > .01; celu.position.set(-1.2, 4.2 + Math.sin(t * 1.4) * .14, 2.2); celu.rotation.set(0, Math.sin(t * .9) * .35 + .25, .05); celu.scale.setScalar(Math.max(.01, v3 ? pop(t, b3.t0 + .1, b3.t1) : 0) * 1.05);
    calendario.visible = v3 && pop(t, tDias - .6, b3.t1) > .01; calendario.position.set(3.1, 3.9 + Math.sin(t * 1.2 + 1) * .14, 1.4); mira(calendario); calendario.scale.setScalar(Math.max(.01, v3 ? pop(t, tDias - .6, b3.t1) : 0) * 1.1);
    crono.visible = v3 && pop(t, tSeg - .4, b3.t1) > .01; crono.position.set(-4.0, 3.2, 1.0); mira(crono); crono.scale.setScalar(Math.max(.01, v3 ? pop(t, tSeg - .4, b3.t1) : 0) * 1.1); crono.userData.aguja.position.set(Math.sin(-(t - b3.t0) * 4.2) * .38, Math.cos(-(t - b3.t0) * 4.2) * .38, 0); crono.userData.aguja.rotation.z = (t - b3.t0) * 4.2;
    // paso final: avioncito de papel que sale hacia el taxi, con estela dorada
    const v4 = bi === 4; const k4 = clamp((t - b4.t0) / (b4.t1 - b4.t0)); const pa = pop(t, b4.t0 + .2, b4.t1 + .1);
    const ruta = k => new THREE.Vector3(lerp(-6, 7, k), 3.2 + Math.sin(k * Math.PI * 1.5) * 1.8 + k * 1.5, lerp(3.5, -2, k) + Math.sin(k * 6) * .8);
    avion.visible = v4 && pa > .01; const pos = ruta(ease(k4)); avion.position.copy(pos); avion.lookAt(ruta(Math.min(1, ease(k4) + .03))); avion.rotateZ(Math.sin(t * 5) * .3); avion.scale.setScalar(Math.max(.01, pa) * 1.15);
    estela.forEach((s, i) => { const kk = ease(clamp(k4 - i * .018)); s.visible = v4 && k4 > i * .018; s.position.copy(ruta(kk)); s.material.opacity = (1 - i / estela.length) * .7; s.scale.setScalar(1 - i / estela.length * .7); });
    // Nico y burbuja: el HTML se ancla a la cabeza
    nico.position.y = .26 + Math.max(0, Math.sin(t * 2.3)) * .02; mundo.rotation.y = 0;
    bok.forEach((m, i) => { m.position.x += 0; m.material.opacity = .22 + .18 * Math.sin(t * .8 + i); });
    tH.uniforms.foco.value = tV.uniforms.foco.value = .5 + (R.focoY || 0); tH.uniforms.r.value = tV.uniforms.r.value = R.dof ?? 5.5; fin.uniforms.tm.value = (Math.floor(t * 30) % 97) * .37;
    comp.render();
    nico.updateMatrixWorld(); proy.copy(nico.userData.cabeza).applyMatrix4(nico.matrixWorld).project(cam); window.__nico = [(proy.x * .5 + .5) * W, (-proy.y * .5 + .5) * H];
    return {nico: window.__nico, flash: tf, bi};
  }
  return {render, renderer};
}
