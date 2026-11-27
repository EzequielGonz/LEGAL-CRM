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
  const R = P.receta, B = P.beats, T = P.T, words = P.words; const ACC = R.acento || pal.acc;
  const renderer = new THREE.WebGLRenderer({canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = R.expo ?? 1.0;
  const cv = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const scene = new THREE.Scene(); const cielo = R.cielo || ['#4f78c4', '#9db8e8', '#ffcf9a', '#ffb078'];
  scene.background = cv(4, 512, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, cielo[0]); g.addColorStop(.45, cielo[1]); g.addColorStop(.8, cielo[2]); g.addColorStop(1, cielo[3]); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog(C('#f3bd94'), 55, 150);
  const cam = new THREE.PerspectiveCamera(R.fov || 34, W / H, .5, 400);
  // ---------- texturas ----------
  const ventanas = (wall, seed, lit) => cv(128, 256, (x, w, h) => { x.fillStyle = lit ? '#000' : wall; x.fillRect(0, 0, w, h); for (let r = 0; r < 10; r++) for (let k = 0; k < 4; k++) { const on = hash(seed * 13 + r * 5 + k) > .6; x.fillStyle = lit ? (on ? '#ffc56e' : '#000') : (on ? '#ffe0a8' : '#5a6f93'); x.fillRect(12 + k * 28, 14 + r * 24, 18, 14); } });
  const MUROS = ['#d9b79a', '#e8d9bf', '#b9c6d6', '#d39a86', '#b7cdb8', '#e2c48a', '#c9a89a', '#a9b9a0'];
  const BM = MUROS.map((c, i) => new THREE.MeshStandardMaterial({map: ventanas(c, i + 1, false), emissiveMap: ventanas(c, i + 1, true), emissive: C('#ffffff'), emissiveIntensity: .75, roughness: .9}));
  const roof = new THREE.MeshStandardMaterial({color: '#8a8f9c', roughness: .9});
  const std = (c, o = {}) => new THREE.MeshStandardMaterial({color: c, roughness: .75, ...o});
  const mesh = (g, m, x = 0, y = 0, z = 0, sh = true) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = sh; o.receiveShadow = true; return o; };
  const grp = () => new THREE.Group(); const mundo = grp(); scene.add(mundo);
  // ---------- luz de atardecer ----------
  scene.add(new THREE.HemisphereLight(C('#9ec0ff'), C('#8a6a4a'), 1.15));
  const sol = new THREE.DirectionalLight(C('#ffb06a'), 3.6); sol.position.set(-22, 15, 14); sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); const sc = sol.shadow.camera; sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90; sol.shadow.radius = 6; sol.shadow.bias = -.0004; sol.shadow.normalBias = .04; scene.add(sol);
  const contra = new THREE.DirectionalLight(C('#8fa8ff'), .55); contra.position.set(18, 10, -12); scene.add(contra);
  // ---------- ciudad: veredas, calles, edificios bajos, árboles ----------
  mundo.add(mesh(new THREE.PlaneGeometry(260, 260), std('#c5bdae', {roughness: .95}), 0, -.01, 0, false)).children.at(-1).rotation.x = -Math.PI / 2;
  const asf = std('#474c58', {roughness: .95}), amar = std('#f1c44c', {roughness: .6}), blanco = std('#f4efe2', {roughness: .6}), verde = ['#5f9a58', '#74ad63', '#4f8a54'];
  const calle = (x, z, w, d) => mundo.add(mesh(new THREE.BoxGeometry(w, .08, d), asf, x, .02, z, false));
  calle(0, 0, 260, 3.8); calle(0, 0, 3.8, 260); calle(0, 21, 260, 3.8); calle(0, -21, 260, 3.8); calle(21, 0, 3.8, 260); calle(-21, 0, 3.8, 260);
  for (let i = -30; i <= 30; i++) { if (Math.abs(i) < 2) continue; mundo.add(mesh(new THREE.BoxGeometry(.9, .02, .12), amar, i * 1.1, .07, 0, false)); mundo.add(mesh(new THREE.BoxGeometry(.12, .02, .9), amar, 0, .07, i * 1.1, false)); }
  for (const s of [-1, 1]) for (let k = -3; k <= 3; k++) { mundo.add(mesh(new THREE.BoxGeometry(.4, .02, 1.2), blanco, s * 2.55, .07, k * .55, false)); mundo.add(mesh(new THREE.BoxGeometry(1.2, .02, .4), blanco, k * .55, .07, s * 2.55, false)); }
  const arbol = (x, z, s = 1) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.13, .17, .9, 8), std('#6a4a34'), 0, .45, 0)); g.add(mesh(new THREE.IcosahedronGeometry(.7 * s, 1), std(verde[Math.floor(hash(x * 7 + z) * 3)], {flatShading: true}), 0, 1.35, 0)); g.position.set(x, .08, z); mundo.add(g); };
  for (let gx = -42; gx <= 42; gx += 5.4) for (let gz = -42; gz <= 42; gz += 5.4) {
    if (Math.abs(gx) < 2.6 || Math.abs(gz) < 2.6 || Math.abs(Math.abs(gx) - 21) < 2.8 || Math.abs(Math.abs(gz) - 21) < 2.8) continue;
    const i = Math.round(gx * 3 + gz * 7); const w = 3.6 + hash(i) * 1.3, d = 3.6 + hash(i + 9) * 1.2; const cerca = Math.hypot(gx, gz) < 12; const frente = gz > 0;
    const h = cerca ? (frente ? 1.3 + hash(i + 3) * 1.4 : 2.6 + hash(i + 3) * 2.6) : 2 + hash(i + 3) * 8; const m1 = BM[Math.floor(hash(i + 5) * 8)], m2 = BM[Math.floor(hash(i + 6) * 8)];
    const px = gx + (hash(i + 1) - .5) * .6, pz = gz + (hash(i + 2) - .5) * .6;
    mundo.add(mesh(new THREE.BoxGeometry(w + .9, .16, d + .9), std('#d4cdbd'), px, .08, pz, false));
    const b = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .08), [m1, m1, roof, roof, m2, m2]); b.position.set(px, .16 + h / 2, pz); b.castShadow = b.receiveShadow = true; mundo.add(b);
    if (hash(i + 4) > .5) mundo.add(mesh(new THREE.BoxGeometry(w * .45, .5, d * .45), roof, px, .16 + h + .25, pz)); }
  for (const [x, z] of [[3.6, 3.6], [-3.4, 3.6], [-3.5, -3.5], [3.8, -3.4], [6.8, 3.4], [-7, 3.4], [-6.8, -3.4], [7.2, -3.4], [3.4, 7], [-3.5, 7.2]]) arbol(x, z, .9 + hash(x + z) * .3);
  // semáforo y reloj de la esquina (19:10)
  const semaforo = (x, z, ry) => { const g = grp(); g.add(mesh(new THREE.CylinderGeometry(.08, .1, 3.4, 8), std('#34373f'), 0, 1.7, 0)); const arm = mesh(new THREE.BoxGeometry(1.8, .1, .1), std('#34373f'), -.9, 3.3, 0); g.add(arm); g.add(mesh(new RoundedBoxGeometry(.42, 1.1, .34, 2, .08), std('#1b1d22'), -1.7, 3.0, 0));
    [['#ff3b30', 3.3, 1.5], ['#ffd23a', 3.0, .2], ['#2ee06a', 2.7, .2]].forEach(([c, y, e]) => g.add(mesh(new THREE.SphereGeometry(.12, 10, 8), new THREE.MeshStandardMaterial({color: c, emissive: C(c), emissiveIntensity: e}), -1.7, y, .18, false))); g.position.set(x, .08, z); g.rotation.y = ry; mundo.add(g); };
  semaforo(2.5, 2.5, Math.PI * .5); semaforo(-2.5, -2.5, -Math.PI * .5);
  const hora = P.hora || '19:10';
  const relTex = cv(512, 256, (x, w, h) => { x.fillStyle = '#1a1c24'; x.fillRect(0, 0, w, h); x.strokeStyle = ACC; x.lineWidth = 12; x.strokeRect(12, 12, w - 24, h - 24); x.fillStyle = ACC; x.font = '800 150px Inter, Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(hora, w / 2, h / 2 + 6); });
  const reloj = grp(); reloj.add(mesh(new THREE.CylinderGeometry(.1, .12, 3.6, 8), std('#34373f'), 0, 1.8, 0)); const mt = std('#1a1c24'); reloj.add(mesh(new RoundedBoxGeometry(2.1, 1.05, .22, 2, .08), [mt, mt, mt, mt, new THREE.MeshStandardMaterial({map: relTex, emissiveMap: relTex, emissive: C('#fff'), emissiveIntensity: 1.5}), mt], 0, 3.7, 0)); reloj.position.set(-2.7, .08, 3.0); reloj.rotation.y = .45; mundo.add(reloj);
  // edificio del seguro (destino del paso 3)
  const segTex = cv(512, 256, (x, w, h) => { x.fillStyle = '#10213f'; x.fillRect(0, 0, w, h); x.fillStyle = ACC; x.beginPath(); x.moveTo(90, 50); x.lineTo(150, 70); x.lineTo(150, 130); x.quadraticCurveTo(150, 180, 90, 205); x.quadraticCurveTo(30, 180, 30, 130); x.lineTo(30, 70); x.fill(); x.fillStyle = '#fff'; x.font = '800 78px Inter, Manrope'; x.textAlign = 'left'; x.fillText('seguro', 190, 150); });
  const seguro = new THREE.Mesh(new RoundedBoxGeometry(5.4, 5.6, 4.2, 2, .1), [BM[1], BM[1], roof, roof, BM[1], BM[1]]); seguro.position.set(-7.2, .16 + 2.8, -6.4); seguro.castShadow = seguro.receiveShadow = true; mundo.add(seguro);
  const seguroCartel = mesh(new THREE.PlaneGeometry(4.6, 2.3), new THREE.MeshStandardMaterial({map: segTex, emissiveMap: segTex, emissive: C('#fff'), emissiveIntensity: .6}), -7.2, 4.6, -4.27, false); mundo.add(seguroCartel);
  // ---------- autos low-poly ----------
  function auto(color, o = {}) { const g = grp(); const car = std(color, {roughness: .3, metalness: .3}), vid = std('#1d2a4a', {roughness: .1, metalness: .6});
    g.add(mesh(new RoundedBoxGeometry(4.3, .95, 1.95, 4, .28), car, 0, .78, 0)); g.add(mesh(new RoundedBoxGeometry(2.4, .85, 1.72, 4, .32), car, -.25, 1.55, 0)); g.add(mesh(new RoundedBoxGeometry(2.25, .6, 1.76, 3, .22), vid, -.25, 1.58, 0));
    for (const [x, z] of [[1.35, .98], [1.35, -.98], [-1.35, .98], [-1.35, -.98]]) { const r = mesh(new THREE.CylinderGeometry(.5, .5, .36, 18), std('#17191f', {roughness: .9}), x, .5, z); r.rotation.x = Math.PI / 2; g.add(r); const hb = mesh(new THREE.CylinderGeometry(.24, .24, .38, 12), std('#d2d6de', {metalness: .8, roughness: .3}), x, .5, z); hb.rotation.x = Math.PI / 2; g.add(hb); }
    for (const z of [-.62, .62]) { g.add(mesh(new THREE.BoxGeometry(.1, .22, .4), new THREE.MeshStandardMaterial({color: '#fff6d0', emissive: C('#ffe9a0'), emissiveIntensity: 2}), 2.16, .95, z, false)); g.add(mesh(new THREE.BoxGeometry(.1, .2, .4), new THREE.MeshStandardMaterial({color: '#aa1a1a', emissive: C('#ff2a2a'), emissiveIntensity: 1}), -2.16, .95, z, false)); }
    if (o.taxi) g.add(mesh(new RoundedBoxGeometry(.9, .3, .4, 2, .08), new THREE.MeshStandardMaterial({color: '#fff', emissive: C('#fff0b0'), emissiveIntensity: 1.4}), -.25, 2.2, 0));
    if (o.capot) { const c = mesh(new THREE.BoxGeometry(.7, .5, 1.6), std('#2a2c34', {roughness: .9}), 1.95, 1.0, 0); c.rotation.z = -.35; c.rotation.y = .1; g.add(c); }
    return g; }
  const autoA = auto('#2f7fe0', {capot: true}); autoA.position.set(-1.3, .1, -.5); autoA.rotation.y = .1; mundo.add(autoA);
  const autoB = auto('#e0473d', {capot: true}); autoB.position.set(.9, .1, 1.6); autoB.rotation.y = Math.PI / 2 + .2; mundo.add(autoB);
  const taxi = auto('#f1c232', {taxi: true}); mundo.add(taxi);
  const patTex = cv(256, 96, (x, w, h) => { x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#223'; x.lineWidth = 6; x.strokeRect(3, 3, w - 6, h - 6); x.fillStyle = '#223'; x.font = '800 62px Inter, Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('AB 123 CD', w / 2, h / 2 + 4); });
  const patente = mesh(new THREE.PlaneGeometry(.95, .36), new THREE.MeshStandardMaterial({map: patTex}), 0, .75, .98, false); autoB.add(patente); patente.rotation.y = 0; patente.position.set(-2.2, .8, 0); patente.rotation.y = -Math.PI / 2; 
  const estrella = mesh(new THREE.IcosahedronGeometry(.7, 0), new THREE.MeshStandardMaterial({color: '#ffd54a', emissive: C('#ffb300'), emissiveIntensity: 2.4, flatShading: true}), .55, 1.2, .5, false); mundo.add(estrella);
  const puas = [...Array(10)].map((_, i) => { const m = mesh(new THREE.ConeGeometry(.15, .85, 5), estrella.material, 0, 0, 0, false); m.userData.a = i / 10 * Math.PI * 2; mundo.add(m); return m; });
  const humo = [...Array(7)].map((_, i) => { const m = mesh(new THREE.IcosahedronGeometry(.45, 1), std('#d7d9e0', {transparent: true, opacity: .5, roughness: 1}), .4, 1.4, .3, false); m.userData.i = i; mundo.add(m); return m; });
  // ---------- siluetas ----------
  const persona = (color, esc = 1, rim = ACC) => { const g = grp(); const m = new THREE.MeshStandardMaterial({color, roughness: .55, emissive: C(rim), emissiveIntensity: .1});
    g.add(mesh(new THREE.CapsuleGeometry(.36, .95, 6, 14), m, 0, 1.0, 0)); g.add(mesh(new THREE.SphereGeometry(.33, 18, 14), m, 0, 2.0, 0)); for (const s of [-1, 1]) { const b = mesh(new THREE.CapsuleGeometry(.1, .65, 4, 8), m, s * .5, 1.15, 0); b.rotation.z = s * .22; g.add(b); }
    g.scale.setScalar(esc); g.userData.cabeza = new THREE.Vector3(0, 2.4 * esc, 0); return g; };
  const nico = persona('#1c2233', 1.3); nico.position.set(3.7, .16, 3.5); nico.rotation.y = -.7; mundo.add(nico);
  const otro = persona('#7a2a2a', 1.2, '#ffb0a0'); otro.position.set(-.2, .1, 3.3); otro.rotation.y = .5; otro.visible = false; mundo.add(otro);
  const tes = [persona('#2a5c8a', 1.0, '#9fd0ff'), persona('#3a7a4a', 1.05, '#b6ffc4')]; tes[0].position.set(-4.2, .16, 3.8); tes[1].position.set(5.2, .16, -3.7); tes.forEach(t => { t.visible = false; mundo.add(t); });
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
  comp.addPass(new RenderPass(scene, cam)); comp.addPass(new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), R.bloom ?? .32, .5, .86));
  const vs = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
  const tilt = dir => new ShaderPass({uniforms: {tDiffuse: {value: null}, dir: {value: new THREE.Vector2(dir[0], dir[1])}, foco: {value: .5}, r: {value: 6}, res: {value: new THREE.Vector2(W, H)}}, vertexShader: vs,
    fragmentShader: 'uniform sampler2D tDiffuse;uniform vec2 dir;uniform vec2 res;uniform float foco;uniform float r;varying vec2 vUv;void main(){float d=smoothstep(.14,.5,abs(vUv.y-foco));float rad=r*d;vec4 s=vec4(0.);float ws=0.;for(int i=-6;i<=6;i++){float f=float(i)/6.;float w=exp(-f*f*2.2);s+=texture2D(tDiffuse,vUv+dir*rad*f*2./res)*w;ws+=w;}gl_FragColor=s/ws;}'});
  const tH = tilt([1, 0]), tV = tilt([0, 1]); comp.addPass(tH); comp.addPass(tV); comp.addPass(new OutputPass());
  const fin = new ShaderPass({uniforms: {tDiffuse: {value: null}, tm: {value: 0}, grano: {value: R.grano ?? .05}}, vertexShader: vs,
    fragmentShader: 'uniform sampler2D tDiffuse;uniform float tm;uniform float grano;varying vec2 vUv;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+tm)*43758.5453);}void main(){vec4 c=texture2D(tDiffuse,vUv);vec2 q=vUv-.5;float v=smoothstep(.98,.25,length(q*vec2(.9,.6)));c.rgb*=mix(.72,1.,v);c.rgb*=vec3(1.03,1.0,.96);c.rgb+=(h(vUv*vec2(1080.,1920.))-.5)*grano;gl_FragColor=c;}'}); comp.addPass(fin);
  // ---------- cámara: siempre en movimiento ----------
  const CFG = [{az: [14, 30], el: 29, d: [44, 40], f: [0, 1.6, .5]}, {az: [34, 52], el: 24, d: [30, 25], f: [0, 1.6, .8]}, {az: [24, 8], el: 20, d: [27, 21], f: [2.6, 2.2, 3.0]}, {az: [-6, -30], el: 24, d: [38, 30], f: [-4.2, 3.2, -1.6]}, {az: [30, 14], el: 29, d: [42, 44], f: [0, 1.6, .5]}];
  const cfgDe = i => B[i].loop ? {az: [14, 14], el: 29, d: [44, 44], f: [0, 1.6, .5]} : CFG[Math.min(i, CFG.length - 1)];
  const posa = (i, u) => { const c = cfgDe(i); const e = ease(u); return {az: lerp(c.az[0], c.az[1], e) * Math.PI / 180, el: c.el * Math.PI / 180, d: lerp(c.d[0], c.d[1], e), f: new THREE.Vector3(...c.f)}; };
  const idx = t => { let i = B.length - 1; while (i > 0 && B[i].t0 > t) i--; return i; };
  const pose0 = posa(0, 0);
  function camara(t) {
    const i = idx(t), b = B[i], u = clamp((t - b.t0) / (b.t1 - b.t0)); let p = posa(i, u);
    if (i > 0) { const q = posa(i - 1, 1), k = ease(win(t - b.t0, 0, b.loop ? 1.6 : .6)); p = {az: lerp(q.az, p.az, k), el: lerp(q.el, p.el, k), d: lerp(q.d, p.d, k), f: q.f.clone().lerp(p.f, k)}; }
    const paso = !!b.paso || (b.ins && 0); const gp = Math.exp(-(t - b.t0) * 5) * (i > 0 && !b.loop ? 1 : 0);
    const asent = win(t, 0, .5) * (1 - win(t, T - 1.4, T - .5)); const hx = (Math.sin(t * 1.7) * .22 + Math.sin(t * 4.3) * .07) * asent, hy = Math.sin(t * 1.3 + 1) * .14 * asent;
    const d = p.d - gp * 6.5, az = p.az + Math.sin(t * .45) * .03 * asent;
    cam.position.set(p.f.x + d * Math.cos(p.el) * Math.sin(az) + hx, p.f.y + d * Math.sin(p.el) + hy, p.f.z + d * Math.cos(p.el) * Math.cos(az)); cam.lookAt(p.f.x, p.f.y, p.f.z);
    cam.fov = (R.fov || 34) - gp * 4.5; cam.updateProjectionMatrix(); return gp; }
  // ---------- tiempos de palabras ----------
  const sa = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tw = (re, desde = 0, def = null) => { const w = words.find(w => w.t >= desde - .01 && re.test(sa(w.w))); return w ? w.t : def; };
  const bs = [0, 1, 2, 3, 4].map(i => B[Math.min(i, B.length - 1)]); const [b0, b1, b2, b3, b4] = bs;
  const tF = [tw(/^auto/, b1.t0, b1.t0 + .8), tw(/patente/, b1.t0, b1.t0 + 2), tw(/esquina/, b1.t0, b1.t0 + 3.2)];
  const tOtro = tw(/otro/, b2.t0, b2.t0 + .5), tTes = tw(/testigo/, b2.t0, b2.t0 + 2.2), tSeg = tw(/seguro/, b3.t0, b3.t0 + 1), tDias = tw(/dias/, b3.t0, b3.t0 + 2.5);
  const pop = (t, a, bb) => backOut(win(t, a, a + .4), 2) * (1 - easeIn(win(t, bb - .22, bb)));
  const mira = o => o.lookAt(cam.position); const proy = new THREE.Vector3();
  const blancos = [new THREE.Vector3(-.2, 1.3, .5), new THREE.Vector3(-.4, .8, 1.4), new THREE.Vector3(-2.7, 3.7, 3.0)];
  function render(t) {
    const gp = camara(t), bi = idx(t), b = B[bi], loop = !!b.loop; const ti = loop ? 0 : t, fl = .5 + .5 * Math.sin(ti * 9);
    estrella.rotation.set(ti * .8, ti * 1.1, 0); estrella.scale.setScalar(1 + .12 * fl); estrella.material.emissiveIntensity = 2 + fl;
    puas.forEach((m, i) => { const a = m.userData.a + ti * .3, s = .9 + .25 * Math.sin(ti * 8 + i); m.position.set(estrella.position.x + Math.cos(a) * 1.05 * s, estrella.position.y + Math.sin(a) * 1.05 * s * .8, estrella.position.z); m.rotation.z = a - Math.PI / 2; m.scale.setScalar(.8 + .2 * Math.sin(ti * 8 + i)); });
    humo.forEach(m => { const k = (ti * .35 + m.userData.i / 7) % 1; m.position.set(.4 + Math.sin(m.userData.i * 2 + ti) * .35, 1.5 + k * 3.2, .3 + Math.cos(m.userData.i) * .3); m.scale.setScalar(.5 + k * 1.1); m.material.opacity = .5 * (1 - k); });
    // taxi en el último paso
    const kT = bi === 4 ? ease(win(t, b4.t0 + .3, b4.t1)) : 0; taxi.visible = bi === 4; taxi.position.set(lerp(-22, 22, kT), .1, 1.0);
    // paso 1: el celular flota, saca la foto con flash sobre autos, patente y esquina
    const v1 = bi === 1, p1 = v1 ? pop(t, b1.t0 + .1, b1.t1) : 0; celu.visible = p1 > .01;
    const k1 = tF.filter(a => t >= a).length - 1, tgt = blancos[Math.max(0, k1)]; celu.position.set(tgt.x + 3.2, tgt.y + 3.3 + Math.sin(t * 2) * .15, tgt.z + 3.2); mira(celu); celu.scale.setScalar(Math.max(.01, p1) * 1.2);
    aros.forEach((a, k) => { const pk = v1 ? pop(t, tF[k], b1.t1) : 0; a.visible = pk > .01; a.position.set(blancos[k].x, k === 2 ? 3.6 : .3, blancos[k].z); a.rotation.set(k === 2 ? 0 : -Math.PI / 2, 0, 0); if (k === 2) mira(a); a.scale.setScalar(Math.max(.01, pk) * (k === 0 ? 2.6 : 1.4) * (1 + .1 * Math.sin(t * 7))); a.material.opacity = pk * .9; });
    const tf = v1 ? Math.max(0, ...tF.map(a => t >= a ? Math.exp(-(t - a) * 8) : 0)) : 0; flash.visible = tf > .02; flash.position.copy(celu.position); flash.scale.setScalar(.8 + tf * 2.2); flash.material.opacity = tf * .9; window.__flash = tf;
    // paso 2: la silueta saca la libreta con los datos; aparecen el otro conductor y los testigos
    const v2 = bi === 2, p2 = v2 ? pop(t, tOtro - .1, b2.t1) : 0, p2b = v2 ? pop(t, tTes - .1, b2.t1) : 0; otro.visible = p2 > .01; otro.scale.setScalar(Math.max(.01, p2) * 1.2); tes.forEach((s, k) => { s.visible = p2b > .01; s.scale.setScalar(Math.max(.01, p2b) * (k ? 1.05 : 1)); });
    const pl = v2 ? pop(t, b2.t0 + .1, b2.t1) : 0; libreta.visible = pl > .01; libreta.position.set(nico.position.x - .9, 2.9 + Math.sin(t * 1.8) * .1, nico.position.z + .6); mira(libreta); libreta.rotateZ(-.12); libreta.scale.setScalar(Math.max(.01, pl) * 1.9);
    // paso 3: calendario de «3 días» que gira y vuela hacia el seguro
    const v3 = bi === 3, p3 = v3 ? pop(t, b3.t0 + .1, b3.t1) : 0, k3 = ease(win(t, tDias - .2, b3.t1)); calendario.visible = p3 > .01;
    calendario.position.set(lerp(-1.0, -6.4, k3), lerp(4.2, 5.0, k3) + Math.sin(t * 1.6) * .15, lerp(2.6, -3.0, k3)); calendario.rotation.set(0, (t - b3.t0) * 3.2 * (1 - k3) + k3 * 0, 0); if (k3 > 0) mira(calendario); calendario.scale.setScalar(Math.max(.01, p3) * (1.4 - .5 * k3));
    // paso final: avioncito de papel con estela dorada
    const v4 = bi === 4, k4 = clamp((t - b4.t0) / (b4.t1 - b4.t0)), pa = v4 ? pop(t, b4.t0 + .2, b4.t1 + .1) : 0;
    const ruta = k => new THREE.Vector3(lerp(5, -8, k), 3.4 + Math.sin(k * Math.PI * 1.6) * 1.6 + k * 2.2, lerp(5, -3, k) + Math.sin(k * 6) * .7);
    avion.visible = pa > .01; avion.position.copy(ruta(ease(k4))); avion.lookAt(ruta(Math.min(1, ease(k4) + .03))); avion.rotateZ(Math.sin(t * 5) * .3); avion.scale.setScalar(Math.max(.01, pa) * 1.2);
    estela.forEach((s, i) => { const kk = ease(clamp(k4 - i * .018)); s.visible = v4 && k4 > i * .018; s.position.copy(ruta(kk)); s.material.opacity = (1 - i / estela.length) * .7; s.scale.setScalar(1 - i / estela.length * .7); });
    tH.uniforms.foco.value = tV.uniforms.foco.value = .52 + (R.focoY || 0); tH.uniforms.r.value = tV.uniforms.r.value = R.dof ?? 6; fin.uniforms.tm.value = (Math.floor(t * 30) % 97) * .37;
    comp.render();
    nico.updateMatrixWorld(); proy.copy(nico.userData.cabeza).applyMatrix4(nico.matrixWorld).project(cam);
    return {nico: [(proy.x * .5 + .5) * W, (-proy.y * .5 + .5) * H], flash: tf, bi}; }
  return {render, renderer};
}
