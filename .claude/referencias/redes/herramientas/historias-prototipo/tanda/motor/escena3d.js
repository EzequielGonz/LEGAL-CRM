// «Tiny diorama» en three.js r170 (sin modelos externos): esquina porteña en miniatura a las 19:10, estilo low-poly con volumen.
// Calle, vereda, semáforo, edificios bajos, dos autos con el golpe visible, luz cálida de atardecer con sombras suaves, desenfoque de maqueta (tilt-shift),
// bloom y grano. La cámara orbita/vuela siempre y da un golpe de zoom en cada paso. Todo es función del tiempo: render(t).
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
  const R = P.receta, B = P.beats, T = P.T, words = P.words; const ACC = '#D4AF37';
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = R.expo ?? 1.12;
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const scene = new THREE.Scene(); const IV = ['#F5F4F0', '#E7E2CE'];
  // fondo marfil liso (degradé muy suave); de noche pasa a tinta
  const fondoTex = n => cv(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); const m = (a, b) => { const A = C(a), Bc = C(b); return '#' + A.lerp(Bc, n).getHexString(); }; g.addColorStop(0, m(IV[0], '#2a3358')); g.addColorStop(1, m(IV[1], '#8a7a66')); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  scene.background = fondoTex(0);
  const cam = new THREE.PerspectiveCamera(R.fov || 28, W / H, .5, 400);
  // ---------- texturas ----------
  const ventanas = (wall, seed, lit) => cv(128, 256, (x, w, h) => { x.fillStyle = lit ? '#000' : wall; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) { const on = hash(seed * 13 + r * 5 + k) > .55; x.fillStyle = lit ? (on ? '#ffd58a' : '#000') : (on ? '#f7efd8' : '#8d97aa'); x.fillRect(12 + k * 28, 18 + r * 28, 18, 16); } if (!lit) { x.fillStyle = '#C1AE7A'; x.fillRect(0, 4, w, 4); } });
  const MUROS = ['#F3EEDD', '#F8F4E8', '#EDE6D2', '#F1EAD8'];
  const BM = MUROS.map((c, i) => new THREE.MeshStandardMaterial({map: ventanas(c, i + 1, false), emissiveMap: ventanas(c, i + 1, true), emissive: C('#ffffff'), emissiveIntensity: 0, roughness: .9}));
  const roof = new THREE.MeshStandardMaterial({color: '#CFC8B6', roughness: .9});
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .75, ...o});
  const mesh = (g, m, x = 0, y = 0, z = 0, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; };
  const grp = () => new THREE.Group(); const mundo = grp(); scene.add(mundo);
  // ---------- luz: sol de tarde desde atrás a la izquierda ----------
  const hemi = new THREE.HemisphereLight(C('#F4F6FA'), C('#E2D6BC'), 1.25); scene.add(hemi);
  const sol = new THREE.DirectionalLight(C('#FFE8C4'), 3.0); sol.position.set(-13, 13, -12); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const sc = sol.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.near = 1; sc.far = 70; sol.shadow.radius = 4; sol.shadow.bias = -.0004; sol.shadow.normalBias = .03; scene.add(sol);
  // ---------- baldosa flotante con canto, vereda, calles, manzanas bajas ----------
  const HX = 7.6, HZ = 11.4;
  mundo.add(mesh(new RoundedBoxGeometry(HX * 2, 1.3, HZ * 2, 4, .3), std('#25282B', {roughness: .5}), 0, -.66, 0));
  const vereda = std('#E6E0D0', {roughness: .95}), cordon = std('#B9B2A2'), asf = std('#6D6D69', {roughness: .95}), amar = std('#D4AF37', {roughness: .6}), blanco = std('#F5F4F0', {roughness: .6});
  mundo.add(mesh(new THREE.BoxGeometry(HX * 2 - .1, .06, HZ * 2 - .1), vereda, 0, .005, 0, false));
  mundo.add(mesh(new THREE.BoxGeometry(3.4, .08, HZ * 2 - .1), asf, 0, .02, 0, false)); mundo.add(mesh(new THREE.BoxGeometry(HX * 2 - .1, .08, 3.4), asf, 0, .021, 0, false));
  for (const s of [-1, 1]) { mundo.add(mesh(new THREE.BoxGeometry(.12, .14, HZ * 2 - .1), cordon, s * 1.75, .06, 0, false)); mundo.add(mesh(new THREE.BoxGeometry(HX * 2 - .1, .14, .12), cordon, 0, .06, s * 1.75, false)); }
  for (let i = -10; i <= 10; i++) { if (Math.abs(i) < 2) continue; mundo.add(mesh(new THREE.BoxGeometry(.1, .02, .7), blanco, 0, .07, i * 1.05, false)); }
  for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 2) continue; mundo.add(mesh(new THREE.BoxGeometry(.7, .02, .1), blanco, i * 1.05, .071, 0, false)); }
  for (const s of [-1, 1]) for (let k = -3; k <= 3; k++) { mundo.add(mesh(new THREE.BoxGeometry(.3, .02, 1.0), blanco, s * 1.3, .072, k * .45 + (s > 0 ? 3.3 : 0) * 0, false)); }
  const arbol = (x, z, s = 1) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.1, .14, .8, 8), std('#6a5a48'), 0, .4, 0)); g.add(mesh(new THREE.IcosahedronGeometry(.62 * s, 1), std('#5E6B4E', {flatShading: true}), 0, 1.2, 0)); g.position.set(x, .06, z); mundo.add(g); };
  const lote = (sx, sz, i) => { const cx = sx * (1.75 + (HX - 1.75) / 2), cz = sz * (1.75 + (HZ - 1.75) / 2); const nb = sz < 0 ? 2 : 1;
    for (let k = 0; k < (sz > 0 ? 1 : 2); k++) { const w = (HX - 1.75 - .8) , d = sz > 0 ? 2.6 : 3.4, h = sz > 0 ? 1.1 + hash(i) * .6 : 1.6 + hash(i + k * 5) * 1.5; const pz = sz > 0 ? cz + 3.2 : cz - 3.6 + k * 4.6;
      const m1 = BM[(i + k) % 4], m2 = BM[(i + k + 1) % 4]; const bb = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .06), [m1, m1, roof, roof, m2, m2]); bb.position.set(cx, .06 + h / 2, pz); bb.castShadow = bb.receiveShadow = true; mundo.add(bb); bb.userData.mat = [m1, m2]; }
    arbol(sx * 2.5, sz * (2.6 + 5.2 * hash(i)), .9); };
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b], i) => lote(a, b, i + 1));
  // tres faroles = progreso (se encienden de a uno)
  const FAR = [[2.35, 5.2], [-2.35, -4.2], [2.35, -8.2]]; const faroles = FAR.map(([x, z]) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.07, .1, 3.0, 8), std('#25282B'), 0, 1.5, 0)); const lamp = mesh(new THREE.SphereGeometry(.24, 14, 10), new THREE.MeshStandardMaterial({color: '#cfc8b4', emissive: C('#D4AF37'), emissiveIntensity: 0}), 0, 3.15, 0, false); g.add(lamp); g.add(mesh(new THREE.CylinderGeometry(.34, .34, .06, 14), std('#25282B'), 0, 3.42, 0)); g.position.set(x, .06, z); mundo.add(g); g.userData.lamp = lamp; return g; });
  const semaforo = (x, z, ry) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.07, .09, 3.0, 8), std('#3a3d44'), 0, 1.5, 0)); g.add(mesh(new THREE.BoxGeometry(1.6, .09, .09), std('#3a3d44'), -.8, 2.95, 0)); g.add(mesh(new RoundedBoxGeometry(.38, .95, .3, 2, .07), std('#25282B'), -1.5, 2.7, 0));
    ['#8a7a4a', '#8a7a4a', '#6d7a6a'].forEach((c, k) => g.add(mesh(new THREE.SphereGeometry(.1, 10, 8), std(c), -1.5, 2.95 - k * .26, .16, false))); g.position.set(x, .06, z); g.rotation.y = ry; mundo.add(g); };
  semaforo(2.45, -2.45, Math.PI * .5);
  const hora = P.hora || '19:10';
  const relTex = cv(512, 256, (x, w, h) => { x.fillStyle = '#25282B'; x.fillRect(0, 0, w, h); x.strokeStyle = '#D4AF37'; x.lineWidth = 10; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = '#D4AF37'; x.font = '800 150px Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(hora, w / 2, h / 2 + 6); });
  const reloj = grp(); reloj.add(mesh(new THREE.CylinderGeometry(.09, .11, 3.2, 8), std('#3a3d44'), 0, 1.6, 0)); const mt = std('#25282B'); reloj.add(mesh(new RoundedBoxGeometry(2.0, 1.0, .22, 2, .08), [mt, mt, mt, mt, new THREE.MeshStandardMaterial({map: relTex, emissiveMap: relTex, emissive: C('#fff'), emissiveIntensity: .5}), mt], 0, 3.45, 0)); reloj.position.set(-2.55, .06, 2.6); reloj.rotation.y = .5; mundo.add(reloj);
  // el seguro: destino del paso 3 (fachada con cartel, atrás a la izquierda)
  const segTex = cv(512, 192, (x, w, h) => { x.fillStyle = '#112250'; x.fillRect(0, 0, w, h); x.fillStyle = '#D4AF37'; x.font = 'italic 700 120px "Playfair Display"'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('seguro', w / 2, h / 2 + 6); });
  const segCartel = mesh(new THREE.PlaneGeometry(3.6, 1.35), new THREE.MeshStandardMaterial({map: segTex, emissiveMap: segTex, emissive: C('#fff'), emissiveIntensity: .35}), -4.55, 3.2, -6.4 + 1.72 + .02, false); mundo.add(segCartel);
  const mundoFarolInit = null;
  // ---------- autos low-poly ----------
  function auto(color, o = {}) { const g = grp(); const car = std(color, {roughness: .3, metalness: .3}), vid = std('#1d2a4a', {roughness: .1, metalness: .6});
    g.add(mesh(new RoundedBoxGeometry(4.3, .95, 1.95, 4, .28), car, 0, .78, 0)); g.add(mesh(new RoundedBoxGeometry(2.4, .85, 1.72, 4, .32), car, -.25, 1.55, 0)); g.add(mesh(new RoundedBoxGeometry(2.25, .6, 1.76, 3, .22), vid, -.25, 1.58, 0));
    for (const [x, z] of [[1.35, .98], [1.35, -.98], [-1.35, .98], [-1.35, -.98]]) { const r = mesh(new THREE.CylinderGeometry(.5, .5, .36, 18), std('#17191f', {roughness: .9}), x, .5, z); r.rotation.x = Math.PI / 2; g.add(r); const hb = mesh(new THREE.CylinderGeometry(.24, .24, .38, 12), std('#d2d6de', {metalness: .8, roughness: .3}), x, .5, z); hb.rotation.x = Math.PI / 2; g.add(hb); }
    for (const z of [-.62, .62]) { g.add(mesh(new THREE.BoxGeometry(.1, .22, .4), new THREE.MeshStandardMaterial({color: '#fff6d0', emissive: C('#ffe9a0'), emissiveIntensity: 2}), 2.16, .95, z, false)); g.add(mesh(new THREE.BoxGeometry(.1, .2, .4), new THREE.MeshStandardMaterial({color: '#aa1a1a', emissive: C('#ff2a2a'), emissiveIntensity: 1}), -2.16, .95, z, false)); }
    if (o.taxi) g.add(mesh(new RoundedBoxGeometry(.9, .3, .4, 2, .08), new THREE.MeshStandardMaterial({color: '#D4AF37', emissive: C('#D4AF37'), emissiveIntensity: .6}), -.25, 2.2, 0));
    if (o.capot) { const c = mesh(new THREE.BoxGeometry(.7, .5, 1.6), std('#2a2c34', {roughness: .9}), 1.95, 1.0, 0); c.rotation.z = -.35; c.rotation.y = .1; g.add(c); }
    return g; }
  const autoA = auto('#1d3a82', {capot: true}); autoA.scale.setScalar(1.3); autoA.position.set(-1.6, .1, -.6); autoA.rotation.y = .1; mundo.add(autoA);
  const autoB = auto('#5873b5', {capot: true}); autoB.scale.setScalar(1.3); autoB.position.set(1.0, .1, 1.9); autoB.rotation.y = Math.PI / 2 + .2; mundo.add(autoB);
  const taxi = auto('#F5F4F0', {taxi: true}); mundo.add(taxi);
  const patTex = cv(256, 96, (x, w, h) => { x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#223'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#223'; x.font = '800 62px Inter, Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AB 123 CD', w / 2, h / 2 + 4); });
  const patente = mesh(new THREE.PlaneGeometry(.95, .36), new THREE.MeshStandardMaterial({map: patTex}), 0, .75, .98, false); autoB.add(patente); patente.rotation.y = 0; patente.position.set(-2.2, .8, 0); patente.rotation.y = -Math.PI / 2; 
  const estrella = mesh(new THREE.IcosahedronGeometry(.7, 0), new THREE.MeshStandardMaterial({color: '#ffd54a', emissive: C('#ffb300'), emissiveIntensity: 2.4, flatShading: true}), .55, 1.2, .5, false); mundo.add(estrella);
  const puas = [...Array(10)].map((_, i) => { const m = mesh(new THREE.ConeGeometry(.15, .85, 5), estrella.material, 0, 0, 0, false); m.userData.a = i / 10 * Math.PI * 2; mundo.add(m); return m; });
  const humo = [...Array(7)].map((_, i) => { const m = mesh(new THREE.IcosahedronGeometry(.45, 1), std('#d7d9e0', {transparent: true, opacity: .5, roughness: 1}), .4, 1.4, .3, false); m.userData.i = i; mundo.add(m); return m; });
  // ---------- siluetas ----------
  const persona = (color, esc = 1, rim = ACC) => { const g = grp(); const m = new THREE.MeshStandardMaterial({color, roughness: .55, emissive: C(rim), emissiveIntensity: .45});
    g.add(mesh(new THREE.CapsuleGeometry(.36, .95, 6, 14), m, 0, 1.0, 0)); g.add(mesh(new THREE.SphereGeometry(.33, 18, 14), m, 0, 2.0, 0)); for (const s of [-1, 1]) { const b = mesh(new THREE.CapsuleGeometry(.1, .65, 4, 8), m, s * .5, 1.15, 0); b.rotation.z = s * .22; g.add(b); }
    for (const sx of [-1, 1]) g.add(mesh(new THREE.CapsuleGeometry(.14, .55, 4, 8), m, sx * .17, .32, 0));
    g.scale.setScalar(esc); g.userData.cabeza = new THREE.Vector3(0, 2.4 * esc, 0); return g; };
  const nico = persona('#14295f', 1.75, '#2a3f9a'); nico.position.set(3.2, .06, 3.3); nico.rotation.y = -.7; mundo.add(nico);
  const otro = persona('#3B507D', 1.2, '#D4AF37'); otro.position.set(-.4, .06, 3.2); otro.rotation.y = .5; otro.visible = false; mundo.add(otro);
  const tes = [persona('#8a94a6', 1.0, '#D4AF37'), persona('#B9B2A2', 1.05, '#D4AF37')]; tes[0].position.set(-3.4, .06, 3.6); tes[1].position.set(3.4, .06, -3.6); tes.forEach(t => { t.visible = false; mundo.add(t); });
  // ---------- props de los 3 pasos (dentro de la escena) ----------
  const tarjeta = (w, h, fn) => { const t = cv(Math.round(w * 200), Math.round(h * 200), fn); const mt = std('#f6f1e2'); return mesh(new RoundedBoxGeometry(w, h, .1, 2, .05), [mt, mt, mt, mt, new THREE.MeshStandardMaterial({map: t, roughness: .6}), mt]); };
  const celu = grp(); const visor = cv(300, 560, (x, w, h) => { x.fillStyle = '#243448'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a8fb8'; x.fillRect(0, 380, w, 180); x.fillStyle = '#2f7fe0'; x.fillRect(40, 300, 110, 50); x.fillStyle = '#e0473d'; x.fillRect(150, 290, 110, 60); x.strokeStyle = ACC; x.lineWidth = 8; [[20, 120, 60, 0], [280, 120, -60, 0]].forEach(([a, b]) => { x.beginPath(); x.moveTo(a, b + 50); x.lineTo(a, b); x.lineTo(a + (a < 150 ? 50 : -50), b); x.stroke(); x.beginPath(); x.moveTo(a, 470); x.lineTo(a, 520); x.lineTo(a + (a < 150 ? 50 : -50), 520); x.stroke(); }); x.fillStyle = '#fff'; x.beginPath(); x.arc(150, 520, 26, 0, 7); x.fill(); });
  celu.add(mesh(new RoundedBoxGeometry(1.7, 3.2, .22, 3, .22), std('#eceff4', {roughness: .3, metalness: .4}), 0, 0, 0)); celu.add(mesh(new THREE.PlaneGeometry(1.5, 2.9), new THREE.MeshStandardMaterial({map: visor, emissiveMap: visor, emissive: C('#fff'), emissiveIntensity: .7}), 0, 0, .115, false));
  const aros = [...Array(3)].map(() => { const m = mesh(new THREE.RingGeometry(.95, 1.1, 36), new THREE.MeshBasicMaterial({color: ACC, side: THREE.DoubleSide, transparent: true, opacity: 0}), 0, 0, 0, false); m.rotation.x = -Math.PI / 2; mundo.add(m); return m; });
  const flash = mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({color: '#fff', transparent: true, opacity: 0}), 0, 0, 0, false); scene.add(flash);
  const libreta = tarjeta(1.5, 2.0, (x, w, h) => { x.fillStyle = '#fffdf4'; x.fillRect(0, 0, w, h); x.fillStyle = ACC; x.fillRect(0, 0, w, 36); x.fillStyle = '#1b1d22'; x.font = '800 30px Inter, Manrope'; x.fillText('DATOS', 14, 28); ['Otro conductor', 'Patente', 'Seguro', 'Testigos'].forEach((s, i) => { x.fillStyle = '#1b1d22'; x.font = '700 26px Inter, Manrope'; x.fillText(s, 40, 90 + i * 70); x.strokeStyle = ACC; x.lineWidth = 5; x.beginPath(); x.moveTo(12, 78 + i * 70); x.lineTo(26, 92 + i * 70); x.lineTo(34, 66 + i * 70); x.stroke(); x.fillRect(40, 100 + i * 70, 230, 3); }); });
  const calendario = tarjeta(2.4, 2.6, (x, w, h) => { x.fillStyle = '#fbf8ee'; x.fillRect(0, 0, w, h); x.fillStyle = ACC; x.fillRect(0, 0, w, 100); x.fillStyle = '#1b1d22'; x.font = '800 62px Inter, Manrope'; x.textAlign = 'center'; x.fillText('3 días', w / 2, 74); x.font = '800 250px Inter, Manrope'; x.fillText('3', w / 2, 360); x.font = '700 44px Inter, Manrope'; x.fillText('para avisar', w / 2, 460); });
  const avion = (() => { const g = new THREE.BufferGeometry(); const v = new Float32Array([0, 0, 1.6, -.9, .2, -.9, 0, -.15, -.5, 0, 0, 1.6, 0, -.15, -.5, .9, .2, -.9, 0, -.15, -.5, 0, .35, -.9, -.9, .2, -.9, 0, -.15, -.5, .9, .2, -.9, 0, .35, -.9]); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.computeVertexNormals(); return mesh(g, new THREE.MeshStandardMaterial({color: '#fff', emissive: C(ACC), emissiveIntensity: .45, side: THREE.DoubleSide, flatShading: true}), 0, 0, 0); })();
  const estela = [...Array(18)].map(() => mesh(new THREE.SphereGeometry(.14, 8, 6), new THREE.MeshBasicMaterial({color: ACC, transparent: true, opacity: 0}), 0, 0, 0, false));
  [celu, libreta, calendario, avion, ...estela].forEach(p => { p.visible = false; scene.add(p); });
  // ---------- post: bloom, maqueta (tilt-shift), grano y viñeta ----------
  const rt = new THREE.WebGLRenderTarget(W, H, {type: THREE.HalfFloatType, samples: 4}); const comp = new EffectComposer(renderer, rt); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, cam)); const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .1, .5, .9); comp.addPass(bloom);
  const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const tilt = dir => new ShaderPass({uniforms: {tDiffuse: {value: null}, dir: {value: new THREE.Vector2(dir[0], dir[1])}, foco: {value: .5}, r: {value: 6}, res: {value: new THREE.Vector2(W, H)}}, vertexShader: vs,
    fragmentShader: 'uniform sampler2D tDiffuse;uniform vec2 dir;uniform vec2 res;uniform float foco;uniform float r;varying vec2 vUv;void main(){float d=smoothstep(.14,.5,abs(vUv.y-foco));float rad=r*d;vec4 s=vec4(0.);float ws=0.;for(int i=-6;i<=6;i++){float f=float(i)/6.;float w=exp(-f*f*2.2);s+=texture2D(tDiffuse,vUv+dir*rad*f*2./res)*w;ws+=w;}gl_FragColor=s/ws;}'});
  const tH = tilt([1, 0]), tV = tilt([0, 1]); comp.addPass(tH); comp.addPass(tV); comp.addPass(new OutputPass());
  const fin = new ShaderPass({uniforms: {tDiffuse: {value: null}, tm: {value: 0}, grano: {value: R.grano ?? .035}}, vertexShader: vs,
    fragmentShader: 'uniform sampler2D tDiffuse;uniform float tm;uniform float grano;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+tm)*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 q=vUv-.5;float v=smoothstep(.98,.25,length(q*vec2(.9,.6)));c.rgb*=mix(.9,1.,v);c.rgb+=(h(vUv*vec2(1080.,1920.))-.5)*grano;gl_FragColor=c;}'}); comp.addPass(fin);
  // ---------- cámara: siempre en movimiento ----------
  const CFG = [{az: [10, 22], el: 35, d: [56, 52], f: [0, 3.2, .6]}, {az: [26, 38], el: 31, d: [44, 38], f: [0, 3.8, 1.0]}, {az: [20, 6], el: 29, d: [40, 33], f: [2.2, 3.4, 3.0]}, {az: [-8, -24], el: 32, d: [50, 42], f: [-2.0, 3.6, -1.8]}, {az: [22, 10], el: 34, d: [54, 58], f: [0, 3.2, .6]}];
  const cfgDe = i => B[i].loop ? {az: [10, 10], el: 35, d: [56, 56], f: [0, 3.2, .6]} : CFG[Math.min(i, CFG.length - 1)];
  const posa = (i, u) => { const c = cfgDe(i); const e = ease(u); return {az: lerp(c.az[0], c.az[1], e) * Math.PI / 180, el: c.el * Math.PI / 180, d: lerp(c.d[0], c.d[1], e), f: new THREE.Vector3(...c.f)}; };
  const idx = t => { let i = B.length - 1; while (i > 0 && B[i].t0 > t) i--; return i; };
  const pose0 = posa(0, 0);
  // planos dentro de cada beat: la cámara viaja a un nuevo encuadre en cada cláusula (cada 1,5–3 s), siempre en movimiento suave
  const PL = [null, {az: 44, el: 23, d: 21, f: [3.2, 2.6, 3.3]}, {az: -12, el: 30, d: 23, f: [0, 1.5, .5]}, {az: 34, el: 19, d: 19, f: [-2.55, 3.3, 2.6]}, {az: 4, el: 50, d: 52, f: [0, 1.0, .4]}, {az: -30, el: 26, d: 26, f: [-1.2, 1.6, .8]}];
  const planoDe = (i, k) => { if (k <= 0) return null; const o = PL[1 + (k - 1 + i * 2) % 5]; return {az: o.az * Math.PI / 180, el: o.el * Math.PI / 180, d: o.d, f: new THREE.Vector3(...o.f)}; };
  const mezcla = (p, q, k) => ({az: lerp(p.az, q.az, k), el: lerp(p.el, q.el, k), d: lerp(p.d, q.d, k), f: p.f.clone().lerp(q.f, k)});
  function poseEn(i, t) {
    const b = B[i], u = clamp((t - b.t0) / (b.t1 - b.t0)); let p = posa(i, u); if (b.loop || !b.frases || b.frases.length < 2) return p;
    let k = 0; b.frases.forEach((f, j) => { if (t >= f.t0) k = j; }); const f = b.frases[k];
    const prev = k > 0 ? (planoDe(i, k - 1) || p) : p; const cur = planoDe(i, k) || p; const e = ease(win(t - f.t0, 0, .75)); return mezcla(prev, cur, e); }
  function camara(t) {
    const i = idx(t), b = B[i]; let p = poseEn(i, t);
    if (i > 0) { const q = poseEn(i - 1, b.t0 - .001), k = ease(win(t - b.t0, 0, b.loop ? 1.8 : .7)); p = mezcla(q, p, k); }
    const gp = Math.exp(-(t - b.t0) * 5) * (i > 0 && !b.loop ? 1 : 0);
    const asent = win(t, 0, .5) * (1 - win(t, T - 1.4, T - .5)); const hx = (Math.sin(t * 1.7) * .22 + Math.sin(t * 4.3) * .07) * asent, hy = Math.sin(t * 1.3 + 1) * .14 * asent;
    const d = p.d - gp * 5.5, az = p.az + Math.sin(t * .45) * .03 * asent;
    cam.position.set(p.f.x + d * Math.cos(p.el) * Math.sin(az) + hx, p.f.y + d * Math.sin(p.el) + hy, p.f.z + d * Math.cos(p.el) * Math.cos(az)); cam.lookAt(p.f.x, p.f.y, p.f.z);
    cam.fov = (R.fov || 28) - gp * 3.5; cam.updateProjectionMatrix(); return gp; }
  // ---------- tiempos de palabras ----------
  const sa = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tw = (re, desde = 0, def = null) => { const w = words.find(w => w.t >= desde - .01 && re.test(sa(w.w))); return w ? w.t : def; };
  const bs = [0, 1, 2, 3, 4].map(i => B[Math.min(i, B.length - 1)]); const [b0, b1, b2, b3, b4] = bs;
  const tF = [tw(/^auto/, b1.t0, b1.t0 + .8), tw(/patente/, b1.t0, b1.t0 + 2), tw(/esquina/, b1.t0, b1.t0 + 3.2)];
  const tOtro = tw(/otro/, b2.t0, b2.t0 + .5), tTes = tw(/testigo/, b2.t0, b2.t0 + 2.2), tSeg = tw(/seguro/, b3.t0, b3.t0 + 1), tDias = tw(/dias/, b3.t0, b3.t0 + 2.5);
  const pop = (t, a, bb) => backOut(win(t, a, a + .4), 2) * (1 - easeIn(win(t, bb - .22, bb)));
  const mira = o => o.lookAt(cam.position); const proy = new THREE.Vector3();
  const blancos = [new THREE.Vector3(-.2, 1.3, .5), new THREE.Vector3(-.4, .8, 1.4), new THREE.Vector3(-2.55, 3.5, 2.6)];
  function render(t) {
    const gp = camara(t), bi = idx(t), b = B[bi], loop = !!b.loop; const ti = loop ? 0 : t, fl = .5 + .5 * Math.sin(ti * 9);
    estrella.rotation.set(ti * .8, ti * 1.1, 0); estrella.scale.setScalar(1 + .12 * fl); estrella.material.emissiveIntensity = 2 + fl;
    puas.forEach((m, i) => { const a = m.userData.a + ti * .3, s = .9 + .25 * Math.sin(ti * 8 + i); m.position.set(estrella.position.x + Math.cos(a) * 1.05 * s, estrella.position.y + Math.sin(a) * 1.05 * s * .8, estrella.position.z); m.rotation.z = a - Math.PI / 2; m.scale.setScalar(.8 + .2 * Math.sin(ti * 8 + i)); });
    humo.forEach(m => { const k = (ti * .35 + m.userData.i / 7) % 1; m.position.set(.4 + Math.sin(m.userData.i * 2 + ti) * .35, 1.5 + k * 3.2, .3 + Math.cos(m.userData.i) * .3); m.scale.setScalar(.5 + k * 1.1); m.material.opacity = .5 * (1 - k); });
    // taxi en el último paso
    const kT = bi === 4 ? ease(win(t, b4.t0 + .3, b4.t1)) : 0; taxi.position.set(lerp(-11, 11, kT), .1, 0); taxi.rotation.y = 0; taxi.visible = bi === 4 && Math.abs(taxi.position.x) < 6.6;
    // paso 1: el celular flota, saca la foto con flash sobre autos, patente y esquina
    const v1 = bi === 1, p1 = v1 ? pop(t, b1.t0 + .1, b1.t1) : 0; celu.visible = p1 > .01;
    const k1 = tF.filter(a => t >= a).length - 1, tgt = blancos[Math.max(0, k1)]; celu.position.set(tgt.x + 4.4, tgt.y + 2.6 + Math.sin(t * 2) * .15, tgt.z + 1.2); mira(celu); celu.rotateZ(-.18); celu.scale.setScalar(Math.max(.01, p1) * 1.0);
    aros.forEach((a, k) => { const pk = v1 ? pop(t, tF[k], b1.t1) : 0; a.visible = pk > .01; a.position.set(blancos[k].x, k === 2 ? 3.6 : .3, blancos[k].z); a.rotation.set(k === 2 ? 0 : -Math.PI / 2, 0, 0); if (k === 2) mira(a); a.scale.setScalar(Math.max(.01, pk) * (k === 0 ? 2.6 : 1.4) * (1 + .1 * Math.sin(t * 7))); a.material.opacity = pk * .9; });
    const tf = v1 ? Math.max(0, ...tF.map(a => t >= a ? Math.exp(-(t - a) * 8) : 0)) : 0; flash.visible = tf > .02; flash.position.copy(celu.position); flash.scale.setScalar(.8 + tf * 2.2); flash.material.opacity = tf * .9; window.__flash = tf;
    // paso 2: la silueta saca la libreta con los datos; aparecen el otro conductor y los testigos
    const v2 = bi === 2, p2 = v2 ? pop(t, tOtro - .1, b2.t1) : 0, p2b = v2 ? pop(t, tTes - .1, b2.t1) : 0; otro.visible = p2 > .01; otro.scale.setScalar(Math.max(.01, p2) * 1.2); tes.forEach((s, k) => { s.visible = p2b > .01; s.scale.setScalar(Math.max(.01, p2b) * (k ? 1.05 : 1)); });
    const pl = v2 ? pop(t, b2.t0 + .1, b2.t1) : 0; libreta.visible = pl > .01; libreta.position.set(nico.position.x - 1.3, 3.5 + Math.sin(t * 1.8) * .1, nico.position.z + .9); mira(libreta); libreta.rotateZ(-.12); libreta.scale.setScalar(Math.max(.01, pl) * 1.45);
    // paso 3: calendario de «3 días» que gira y vuela hacia el seguro
    const v3 = bi === 3, p3 = v3 ? pop(t, b3.t0 + .1, b3.t1) : 0, k3 = ease(win(t, tDias - .2, b3.t1)); calendario.visible = p3 > .01;
    calendario.position.set(lerp(-1.0, -6.4, k3), lerp(4.2, 5.0, k3) + Math.sin(t * 1.6) * .15, lerp(2.6, -3.0, k3)); calendario.rotation.set(0, (t - b3.t0) * 3.2 * (1 - k3) + k3 * 0, 0); if (k3 > 0) mira(calendario); calendario.scale.setScalar(Math.max(.01, p3) * (1.4 - .5 * k3));
    // paso final: avioncito de papel con estela dorada
    const v4 = bi === 4, k4 = clamp((t - b4.t0) / (b4.t1 - b4.t0)), pa = v4 ? pop(t, b4.t0 + .2, b4.t1 + .1) : 0;
    const ruta = k => new THREE.Vector3(lerp(5, -8, k), 3.4 + Math.sin(k * Math.PI * 1.6) * 1.6 + k * 2.2, lerp(5, -3, k) + Math.sin(k * 6) * .7);
    avion.visible = pa > .01; avion.position.copy(ruta(ease(k4))); avion.lookAt(ruta(Math.min(1, ease(k4) + .03))); avion.rotateZ(Math.sin(t * 5) * .3); avion.scale.setScalar(Math.max(.01, pa) * 1.2);
    estela.forEach((s, i) => { const kk = ease(clamp(k4 - i * .018)); s.visible = v4 && k4 > i * .018; s.position.copy(ruta(kk)); s.material.opacity = (1 - i / estela.length) * .7; s.scale.setScalar(1 - i / estela.length * .7); });
    // faroles = progreso; noche en el último paso y regreso al día en el loop
    const lb = B.find(x => x.loop); const nn = bi === 4 ? ease(win(t, b4.t0, b4.t0 + 1.6)) : (loop ? 1 - ease(win(t, lb.t0, lb.t0 + 1.6)) : 0); const nq = Math.round(nn * 20) / 20;
    faroles.forEach((f, k) => { const on = (B[k + 1] ? ease(win(t, B[k + 1].t0 + .1, B[k + 1].t0 + .6)) : 0) * (loop ? 1 - ease(win(t, lb.t0, lb.t0 + 1.2)) : 1); f.userData.lamp.material.emissiveIntensity = Math.max(on * 2.2, nn * 2.2); f.userData.lamp.material.color.set(on > .05 || nn > .3 ? '#ffe9a8' : '#cfc8b4'); });
    sol.intensity = 3.0 * (1 - .7 * nn); sol.color.set(nn > .02 ? '#' + C('#FFE8C4').lerp(C('#FFB878'), nn).getHexString() : '#FFE8C4'); sol.position.set(-13, 13 - 8 * nn, -12); hemi.intensity = 1.25 * (1 - .55 * nn); bloom.strength = .1 + .55 * nn; BM.forEach(m => m.emissiveIntensity = nn * 1.4);
    if (nq !== window.__nq) { window.__nq = nq; scene.background = fondoTex(nq); }
    tH.uniforms.foco.value = tV.uniforms.foco.value = .52 + (R.focoY || 0); tH.uniforms.r.value = tV.uniforms.r.value = R.dof ?? 6; fin.uniforms.tm.value = (Math.floor(t * 30) % 97) * .37;
    comp.render();
    nico.updateMatrixWorld(); proy.copy(nico.userData.cabeza).applyMatrix4(nico.matrixWorld).project(cam);
    return {nico: [(proy.x * .5 + .5) * W, (-proy.y * .5 + .5) * H], flash: tf, bi}; }
  return {render, renderer};
}
