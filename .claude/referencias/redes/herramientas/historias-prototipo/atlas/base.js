// Motor Atlas: base común de los reels 3D (three.js). Cada escena (escenas/<marca>.js) arma su mundo y su línea de tiempo;
// esta base pone el render (ACES, sombras, entorno de estudio), la posproducción (bloom, profundidad de campo, grano,
// viñeta y aberración), el karaoke de la voz, el logo y la exportación cuadro a cuadro con window.frame(t).
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {BokehPass} from 'three/addons/postprocessing/BokehPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export {THREE};
export const W = 1080, H = 1920;

// ── tiempo y curvas ──────────────────────────────────────────────────────────
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  out3: x => 1 - Math.pow(1 - x, 3), in3: x => x * x * x, io3: x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  out5: x => 1 - Math.pow(1 - x, 5), outExpo: x => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  outElastic: x => x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - .75) * (2 * Math.PI) / 3) + 1,
  io2: x => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
};
// resorte amortiguado: 0 → 1 con rebote (para golpes, sellos, piezas que llegan)
export const resorte = (x, f = 3.2, d = 5) => x <= 0 ? 0 : 1 - Math.exp(-d * x) * Math.cos(f * Math.PI * x);
export function hash(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
export function ruido(x, sem = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i + sem * 57), hash(i + 1 + sem * 57), u) * 2 - 1; }
// temblor de cámara en mano, suave y determinista
export const pulso = (t, a, d = .35) => t < a ? 0 : Math.exp(-(t - a) / d) * Math.sin((t - a) * 38);
// tiempo «stop-motion»: cuantiza a fps fijos (plastilina)
export const stop = (t, fps = 12) => Math.floor(t * fps) / fps;

// ── texturas dibujadas en canvas (texto dentro de la escena, impresos, etiquetas) ──
export function lienzo(w, h, dibujar, {srgb = true, aniso = 8} = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); dibujar(x, w, h);
  const tx = new THREE.CanvasTexture(c); if (srgb) tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = aniso; tx.needsUpdate = true; tx.userData.ctx = x; tx.userData.canvas = c; return tx;
}
// ruido de normales para superficies hechas a mano (plastilina con huellas, cartón, papel)
export function texturaRuido(n = 512, {escala = 6, fuerza = 1, huellas = 0, sem = 1} = {}) {
  const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); const img = x.createImageData(n, n);
  const alt = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    let v = 0, a = 1, f = escala / n; for (let o = 0; o < 4; o++) { v += a * ruido2(i * f, j * f, sem + o); a *= .5; f *= 2.1; } alt[j * n + i] = v;
  }
  for (let k = 0; k < huellas; k++) { // huellas digitales: anillos concéntricos suaves
    const cx = hash(k * 3 + sem) * n, cy = hash(k * 7 + sem) * n, R = n * (.04 + hash(k * 11) * .05), an = hash(k * 13) * 3;
    for (let j = -R; j < R; j++) for (let i = -R; i < R; i++) { const d = Math.hypot(i, j * 1.3); if (d > R) continue; const px = ((cx + i) | 0 + n) % n, py = ((cy + j) | 0 + n) % n;
      alt[py * n + px] += Math.sin(d * .9 + an) * .25 * (1 - d / R); }
  }
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const h = (a, b) => alt[((b + n) % n) * n + ((a + n) % n)]; const dx = (h(i + 1, j) - h(i - 1, j)) * fuerza, dy = (h(i, j + 1) - h(i, j - 1)) * fuerza;
    const L = Math.hypot(dx, dy, 1), p = (j * n + i) * 4; img.data[p] = (-dx / L * .5 + .5) * 255; img.data[p + 1] = (-dy / L * .5 + .5) * 255; img.data[p + 2] = (1 / L * .5 + .5) * 255; img.data[p + 3] = 255;
  }
  x.putImageData(img, 0, 0); const tx = new THREE.CanvasTexture(c); tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.anisotropy = 8; return tx;
}
function ruido2(x, y, s) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const g = (a, b) => hash(a * 15.7 + b * 47.3 + s * 91.1); return lerp(lerp(g(i, j), g(i + 1, j), u), lerp(g(i, j + 1), g(i + 1, j + 1), u), v) * 2 - 1; }

// ── posproducción de cine: grano, viñeta, aberración cromática, levantado de negros ──
const Cine = {
  uniforms: {tDiffuse: {value: null}, t: {value: 0}, grano: {value: .05}, vineta: {value: .35}, ca: {value: .0015}, lift: {value: new THREE.Vector3(0, 0, 0)}, tinte: {value: new THREE.Vector3(1, 1, 1)}, flash: {value: 0}},
  vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader: `uniform sampler2D tDiffuse;uniform float t,grano,vineta,ca,flash;uniform vec3 lift,tinte;varying vec2 v;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+t)*43758.5453);}
  void main(){vec2 d=v-.5;float r=dot(d,d);
   vec3 c=vec3(texture2D(tDiffuse,v-d*ca*r*4.).r,texture2D(tDiffuse,v).g,texture2D(tDiffuse,v+d*ca*r*4.).b);
   c=c*tinte+lift*(1.-c);c*=1.-vineta*smoothstep(.05,.55,r*1.6);
   float g=h(v*vec2(1080.,1920.))-.5;c+=g*grano*(1.-c*.6);c=mix(c,vec3(1.),flash);gl_FragColor=vec4(c,1.);}`
};

// ── motor ────────────────────────────────────────────────────────────────────
export const RAPIDO = new URLSearchParams(location.search).get('rapido') === '1';
export async function motor(cfg = {}) {
  await document.fonts.ready; if (RAPIDO) { cfg = {...cfg, dof: null}; }
  const r = new THREE.WebGLRenderer({antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance'});
  r.setPixelRatio(1); r.setSize(W, H); r.toneMapping = cfg.tono === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping; r.toneMappingExposure = cfg.exposicion ?? 1;
  r.outputColorSpace = THREE.SRGBColorSpace; r.shadowMap.enabled = !RAPIDO; r.shadowMap.type = cfg.sombraDura ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  document.getElementById('lienzo').appendChild(r.domElement);
  const scene = new THREE.Scene(); if (cfg.fondo) scene.background = new THREE.Color(cfg.fondo);
  const cam = new THREE.PerspectiveCamera(cfg.fov ?? 30, W / H, .05, 400);
  if (cfg.entorno) { const pm = new THREE.PMREMGenerator(r); scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture; scene.environmentIntensity = cfg.entorno; }
  const comp = new EffectComposer(r); comp.setPixelRatio(1); comp.setSize(W, H);
  comp.addPass(new RenderPass(scene, cam));
  const b = cfg.bloom ?? {}; const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), b.fuerza ?? .4, b.radio ?? .55, b.umbral ?? .85); comp.addPass(bloom);
  let dof = null; if (cfg.dof) { dof = new BokehPass(scene, cam, {focus: cfg.dof.foco ?? 5, aperture: cfg.dof.apertura ?? .002, maxblur: cfg.dof.max ?? .008}); comp.addPass(dof); }
  comp.addPass(new OutputPass());
  const cine = new ShaderPass(Cine); const c = cfg.cine ?? {}; cine.uniforms.grano.value = c.grano ?? .045; cine.uniforms.vineta.value = c.vineta ?? .35; cine.uniforms.ca.value = c.ca ?? .0015;
  if (c.lift) cine.uniforms.lift.value.set(...c.lift); if (c.tinte) cine.uniforms.tinte.value.set(...c.tinte); comp.addPass(cine);
  return {THREE, r, scene, cam, comp, bloom, dof, cine,
    foco(dist, apertura) { if (!dof) return; dof.uniforms.focus.value = dist; if (apertura != null) dof.uniforms.aperture.value = apertura; }};
}

// ── karaoke de la voz (DOM sobre el canvas; se calcula con t, sin transiciones del navegador) ──
export function karaoke(palabras, {max = 4, clase = 'k', fin = 99} = {}) {
  const caja = document.createElement('div'); caja.className = 'karaoke ' + clase; document.getElementById('capa').appendChild(caja);
  const pag = []; let cur = [];
  palabras.forEach((p, i) => { cur.push(p); const corte = /[.,:;!?…»]$/.test(p.w); if (cur.length >= max || (corte && cur.length >= 2) || /[.!?…]$/.test(p.w) || i === palabras.length - 1) { pag.push(cur); cur = []; } });
  let actual = -1, spans = [];
  return t => {
    let k = -1; for (let i = 0; i < pag.length; i++) if (t >= pag[i][0].t - .06) k = i;
    const ult = k >= 0 ? pag[k][pag[k].length - 1] : null; if (k >= 0 && (t > ult.t + ult.d + .9 || t > fin)) k = -1;
    if (k !== actual) { actual = k; caja.innerHTML = ''; spans = (k >= 0 ? pag[k] : []).map(p => { const s = document.createElement('span'); s.textContent = p.w.replace(/^«|»$/g, ''); caja.appendChild(s); caja.appendChild(document.createTextNode(' ')); return s; }); }
    if (k < 0) { caja.style.opacity = 0; return; }
    caja.style.opacity = E.out3(seg(t, pag[k][0].t - .06, pag[k][0].t + .08));
    let act = -1; pag[k].forEach((p, i) => { if (t >= p.t - .03) act = i; });
    spans.forEach((s, i) => { s.classList.toggle('on', i === act); s.classList.toggle('dicha', i < act); });
  };
}
export function logo(src, nombre, clase) {
  const d = document.createElement('div'); d.className = 'logo ' + clase; d.innerHTML = `<img src="${src}"><span>${nombre}</span>`; document.getElementById('capa').appendChild(d); return d;
}
export function css(txt) { const s = document.createElement('style'); s.textContent = txt; document.head.appendChild(s); }

// ── arranque: carga la escena de la marca y expone window.frame(t) para el render ──
export async function arrancar() {
  const q = new URLSearchParams(location.search); const id = q.get('m'); const marca = id.split('-')[0];
  const datos = await (await fetch(`audio/${id}-palabras.json`)).json();
  let plan = null; try { const r = await fetch(`planes/${id}.json`); if (r.ok) plan = await r.json(); } catch (e) {}
  const escena = (await import(`./escenas/${marca}.js?v=${Date.now()}`)).default;
  const {update, total, eventos = []} = await escena(datos, plan);
  window.TOTAL = total ?? datos.total; window.EVENTOS = eventos;
  window.frame = t => update(t);
  window.listo = true;
}
