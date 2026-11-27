// Automotores Kocos · «el 0 km por dentro» (motor Atlas). Estudio de producto oscuro, como un comercial de autos:
// un 0 km genérico de laca brillante sobre un plato giratorio, piso espejado, pared LED curva que lleva el texto,
// una tira de luz que barre la carrocería, despiece con piezas numeradas, lupa con segunda vista y faros que se
// encienden al cierre. La escena la maneja el plan (planes/<id>.json): golpes con objeto, texto y efecto; gancho,
// contador (odómetro de tambor en la pared) y cierre (se muestra tal cual). El último cuadro es igual al primero.
import {motor, karaoke, logo, css, lienzo, THREE, E, seg, lerp, clamp, ruido, resorte, pulso, hash} from '../base.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const TINTA = '#000521', ACENTO = '#207CCF', TEXTO = '#4E9BE4', NAVY = '#011F65', METAL = '#8A94A6';
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const OBJETOS = new Set(['auto', 'llave', 'escudo', 'lupa', 'poliza', 'celular', 'almanaque', 'velocimetro', 'rueda', 'check', 'cruz', 'candado', 'grieta', 'documento']);
const EFECTOS = new Set(['golpe', 'caida', 'rebote', 'giro', 'tachar', 'sello', 'flash', 'apagon', 'lupa', 'despiece', 'barrido', 'cuenta']);
const nrm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const sm = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const smin = (a, b, k) => { const h = clamp(.5 + .5 * (b - a) / k); return lerp(b, a, h) - k * h * (1 - h); };
const expoIO = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
function semilla(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function azar(a) { return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// plan mínimo si falta el archivo (para que el render nunca se caiga)
function prepararPlan(plan, datos) {
  const p = Object.assign({}, plan || {});
  p.id = p.id || datos.id || 'autos'; p.gancho = p.gancho || datos.gancho || (datos.textos || [])[0] || '';
  p.cierre = p.cierre || 'Escribinos por WhatsApp'; p.contador = Math.max(0, Math.min(9, Math.round(+p.contador || 0)));
  if (!Array.isArray(p.beats) || !p.beats.length) {
    const P = datos.palabras, tx = datos.textos || [];
    const base = [['gancho', 'auto', 'barrido'], ['dato', 'escudo', 'rebote'], ['dato', 'documento', 'lupa'], ['cierre', 'check', 'sello']];
    p.beats = base.map(([tipo, objeto, efecto], i) => { const w = P[Math.min(P.length - 1, Math.floor(i / base.length * P.length))];
      return {palabra: w.w, n: P.filter(q => nrm(q.w) === nrm(w.w)).indexOf(w), tipo, objeto, texto: tx[i + 1] || '', efecto}; });
  }
  return p;
}

// ── barrido: reflejo de una tira de luz vertical que se mueve frente al sujeto (se inyecta en cada laca) ──
const BARRIDO = `
if (uBarr > .001) {
  vec3 bV = normalize(vViewPosition); vec3 bN = normalize(normal);
  vec3 bR = inverseTransformDirection(reflect(-bV, bN), viewMatrix);
  float bd = dot(bR, uBN);
  if (bd > .03) { float bs = (uBDL - dot(vWPb - uBC, uBN)) / bd;
    if (bs > 0.) { vec3 bQ = vWPb + bR * bs; float bu = dot(bQ - uBC, uBT), bh = bQ.y - uBC.y;
      float banda = exp(-pow((bu - uBOff) / uBAnch, 2.)) * smoothstep(-3.5, -1.4, bh) * smoothstep(7., 4., bh);
      outgoingLight += uBCol * banda * uBarr * (.4 + .6 * pow(1. - clamp(dot(bN, bV), 0., 1.), 1.5)); } }
}`;

// ── piso espejado (Reflector con desenfoque, charco de luz, plato giratorio y onda de choque) ──
const SUELO = {name: 'SueloEstudio',
  uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}, uAnillo: {value: 1}, uGiro: {value: 0}, uOnda: {value: 0},
    uOndaC: {value: new THREE.Vector2()}, uLuz: {value: 1}, uAcc: {value: new THREE.Color(ACENTO)}, uRA: {value: 3.05}, uPed: {value: new THREE.Vector3(0, 0, 0)}},
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
    void main(){ vUv = textureMatrix * vec4(position, 1.); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uAnillo, uGiro, uOnda, uLuz, uRA; uniform vec2 uOndaC; uniform vec3 uAcc, uPed; varying vec4 vUv; varying vec3 vW;
    void main(){ vec2 p = vW.xz; float d = length(p);
      vec2 uv = vUv.xy / vUv.w; float rb = .002 + .006 * smoothstep(2., 12., d);
      vec3 rf = texture2D(tDiffuse, uv).rgb * .28 + (texture2D(tDiffuse, uv + vec2(rb, 0.)).rgb + texture2D(tDiffuse, uv - vec2(rb, 0.)).rgb
        + texture2D(tDiffuse, uv + vec2(0., rb * 1.7)).rgb + texture2D(tDiffuse, uv - vec2(0., rb * 1.7)).rgb) * .18;
      float pool = exp(-d * d / 46.);
      vec3 col = mix(vec3(.0002, .0011, .007), vec3(.0012, .0045, .034), pool) * uLuz;
      col += rf * (.08 + .42 * (1. - smoothstep(5., 22., d)));
      float ring = exp(-pow((d - uRA) / .016, 2.)) * 1.7 + exp(-pow((d - uRA) / .32, 2.)) * .07;
      float an = atan(p.y, p.x) + uGiro;
      float mk = smoothstep(.8, .97, abs(sin(an * 36.))) * smoothstep(uRA - .24, uRA - .17, d) * smoothstep(uRA - .05, uRA - .11, d);
      col += uAcc * (ring + mk * .4) * uAnillo;
      col += vec3(.0015, .003, .01) * smoothstep(uRA + .02, uRA - .06, d) * uLuz;
      float dp = length(p - uPed.xy);
      col *= 1. - .75 * uPed.z * exp(-pow(max(dp - .55, 0.) / .22, 2.));
      col += uAcc * exp(-pow((dp - .7) / .012, 2.)) * uPed.z * 1.5;
      float od = length(p - uOndaC); col += uAcc * 2.2 * exp(-pow((od - uOnda * 8.) / (.06 + uOnda * .5), 2.)) * (1. - uOnda) * step(.001, uOnda);
      col = mix(col, vec3(0., .0013, .013) * uLuz, smoothstep(14., 30., d));
      gl_FragColor = vec4(col, 1.); }`};

// ── pared LED curva: módulos con puntos, halo detrás del sujeto, texto con barrido de cambio, tachado y odómetro ──
const LED_FRAG = `uniform sampler2D uA, uB, uDig; uniform float uMix, uFase, uLuz, uGlow, uTach, uOdoV, uOdoOn, uBrillo, uR; uniform vec4 uWin; uniform vec3 uAcc;
varying vec3 vW;
#define PI 3.14159265
float envA(float a){ return mod(a + PI, 2. * PI) - PI; }
void main(){
  float th = atan(vW.x, vW.z), y = vW.y; vec2 q = vec2(th * uR, y);
  vec2 cel = fract(q / .085) - .5; float led = smoothstep(.5, .12, length(cel));
  float dA = envA(th - uGlow); float halo = exp(-dA * dA * 3.2) * exp(-pow((y - 3.8) / 4.4, 2.));
  vec3 col = mix(vec3(0., .0011, .011), vec3(.0008, .0065, .095), halo);
  col += uAcc * .018 * halo * smoothstep(.6, 1., sin(q.x * .3 + q.y * .45 - uFase * 6.2832 * 3.));
  float jun = max(step(.988, fract(q.x / 2.4)), step(.985, fract(y / 1.6))); col *= 1. - .55 * jun;
  col *= smoothstep(-.3, 1.8, y) * (1. - smoothstep(11., 17., y));
  vec2 w = vec2(-envA(th - uWin.x) / (2. * uWin.z) + .5, (y - uWin.y) / (2. * uWin.w) + .5);
  if (w.x > 0. && w.x < 1. && w.y > 0. && w.y < 1.) {
    float lin = 1. - w.y, p = uMix * 1.3 - .15;
    vec3 ta = texture2D(uA, w).rgb, tb = texture2D(uB, w).rgb;
    vec3 tx = lin < p ? tb : ta * (1. - .55 * step(.001, uMix));
    tx += uAcc * 1.6 * exp(-pow((lin - p) / .012, 2.)) * step(.001, uMix) * step(uMix, .999);
    if (uTach > 0.) { float ly = mix(.18, .7, w.x); float on = step(w.x, uTach); tx *= 1. - .5 * on;
      tx += vec3(.75, .88, 1.) * 2.6 * smoothstep(.022, .006, abs(w.y - ly)) * on; }
    if (uOdoOn > .001 && w.y > .785 && w.y < .985 && w.x > .625 && w.x < .775) {
      float k = step(.7, w.x); float lx = (w.x - .625 - k * .075) / .075; float ly = (w.y - .785) / .2;
      float dec = floor(uOdoV / 10.) + max(0., fract(uOdoV / 10.) * 10. - 9.);
      float v = mix(dec, uOdoV, k);
      vec3 dg = texture2D(uDig, vec2(lx, (mod(v, 10.) + ly) / 10.)).rgb;
      float sh = pow(max(0., sin(ly * PI)), .7) * smoothstep(0., .1, lx) * smoothstep(1., .9, lx);
      tx = mix(tx, mix(vec3(.004, .014, .05), vec3(1.15), dg.r) * sh, uOdoOn);
    }
    col += tx * uBrillo;
  }
  col *= (.3 + 1.0 * led) * uLuz;
  gl_FragColor = vec4(col, 1.);
}`;

// ── estela de cámara: desenfoque direccional para los barridos de cámara (látigo) ──
const ESTELA = {uniforms: {tDiffuse: {value: null}, dir: {value: new THREE.Vector2()}},
  vertexShader: `varying vec2 v; void main(){ v = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 dir; varying vec2 v;
    void main(){ vec4 c = vec4(0.); for (int i = 0; i < 12; i++) { float k = float(i) / 11. - .5; c += texture2D(tDiffuse, v + dir * k); } gl_FragColor = c / 12.; }`};

export default async function (datos, planIn) {
  const P = datos.palabras, T = datos.total, vozFin = datos.voz_fin ?? (P[P.length - 1].t + P[P.length - 1].d);
  const plan = prepararPlan(planIn, datos);
  // variedad entre reels: el id del plan es la semilla
  const rnd = azar(semilla(plan.id)), pick = l => l[Math.min(l.length - 1, Math.floor(rnd() * l.length))];
  const lado = rnd() < .5 ? 1 : -1;
  const AZ0 = lado > 0 ? 52 + rnd() * 10 : 128 - rnd() * 10;          // tres cuartos de frente, de un lado o del otro
  const FOV0 = 24 + rnd() * 4.5;                                       // lente
  const ORB = (6 + rnd() * 2) * (rnd() < .5 ? 1 : -1);                 // órbita en °/s
  const TIRA = new THREE.Color(pick([0xffffff, 0xdcefff, 0xa8d4ff, 0x6fb3f0]));   // color de la tira de luz
  const PINT = pick(['perla', 'navy']);
  const ENTRADAS = [pick(['sube', 'baja', 'gira']), pick(['gira', 'sube', 'baja'])];
  const distPara = d => d * Math.tan(13 * D2R) / Math.tan(FOV0 / 2 * D2R);

  const M = await motor({fondo: 0x000521, fov: FOV0, exposicion: 1.0, bloom: {fuerza: .55, radio: .42, umbral: .86},
    cine: {grano: .028, vineta: .42, ca: .0012, lift: [0, .003, .01]}});
  const {scene, cam} = M, R = M.r;

  // ── reflejos de estudio: cajas de luz, tiras azules y línea de horizonte, horneadas en un mapa de entorno ──
  { const es = new THREE.Scene(); es.background = new THREE.Color(0x000105);
    const caja = (w, h, col, k, pos, mira) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide})); m.position.set(...pos); m.lookAt(...mira); es.add(m); };
    caja(10, 3.4, 0xffffff, 4.5, [0, 9, 0], [0, 0, 0]);
    caja(3.4, 1.2, 0xffffff, 2.6, [0, 6.5, 7.5], [0, 0, 0]);
    [[40, 0xffffff, 3.4], [140, 0x207CCF, 3.2], [220, 0xffffff, 2.2], [320, 0x207CCF, 3.2]].forEach(([a, c, k]) => { const r = a * D2R; caja(1.1, 6.5, c, k, [Math.sin(r) * 11, 3.4, Math.cos(r) * 11], [0, 3.4, 0]); });
    const hz = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, .9, 64, 1, true), new THREE.MeshBasicMaterial({color: new THREE.Color(0xbcd4ff).multiplyScalar(.5), side: THREE.DoubleSide})); hz.position.y = 1.2; es.add(hz);
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({color: 0x01030c})); ps.rotation.x = -Math.PI / 2; ps.position.y = -.05; es.add(ps);
    const pm = new THREE.PMREMGenerator(R); scene.environment = pm.fromScene(es, .03).texture; pm.dispose(); }

  // ── luces directas ───────────────────────────────────────────────────────
  const key = new THREE.DirectionalLight(0xffffff, 1.3); key.position.set(2, 9, 5); scene.add(key);
  const rimA = new THREE.DirectionalLight(0x207CCF, 2.2); rimA.position.set(-7, 3, -6); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0x8fc4ff, 1.5); rimB.position.set(7, 2.5, -5); scene.add(rimB);
  const foco = new THREE.SpotLight(0xffffff, 0, 16, .32, .55, 1.2); scene.add(foco, foco.target);

  // ── materiales ───────────────────────────────────────────────────────────
  const UB = {uBarr: {value: 0}, uBOff: {value: 0}, uBAnch: {value: .4}, uBDL: {value: 6}, uBC: {value: V3()}, uBN: {value: V3(0, 0, 1)}, uBT: {value: V3(1, 0, 0)}, uBCol: {value: TIRA}};
  function laca(m) { m.onBeforeCompile = sh => { Object.assign(sh.uniforms, UB);
      sh.vertexShader = 'varying vec3 vWPb;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\nvWPb = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'varying vec3 vWPb;\nuniform float uBarr, uBOff, uBAnch, uBDL;\nuniform vec3 uBC, uBN, uBT, uBCol;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', BARRIDO + '\n#include <opaque_fragment>'); };
    m.customProgramCacheKey = () => 'laca-barrido'; return m; }
  const fis = o => laca(new THREE.MeshPhysicalMaterial(o)), std = o => laca(new THREE.MeshStandardMaterial(o));
  const pintura = fis(PINT === 'perla' ? {color: 0xe6ecf4, metalness: .15, roughness: .3, clearcoat: 1, clearcoatRoughness: .035} : {color: NAVY, metalness: .6, roughness: .32, clearcoat: 1, clearcoatRoughness: .03});
  const plastico = new THREE.MeshStandardMaterial({color: 0x07090d, roughness: .5});
  const vidrio = fis({color: 0x02060e, metalness: 0, roughness: .04, clearcoat: 1, clearcoatRoughness: .01});
  const cromo = std({color: 0xdfe6ef, metalness: 1, roughness: .07});
  const llantaCara = std({color: 0xb4bdca, metalness: 1, roughness: .2});
  const llantaLado = new THREE.MeshStandardMaterial({color: 0x2a2f37, metalness: .9, roughness: .35});
  const caucho = new THREE.MeshStandardMaterial({color: 0x0b0c0f, roughness: .82});
  const metal = new THREE.MeshStandardMaterial({color: METAL, metalness: 1, roughness: .38});
  const negroLaca = fis({color: 0x04060b, metalness: .2, roughness: .2, clearcoat: 1, clearcoatRoughness: .04});
  const lacaAzul = fis({color: ACENTO, metalness: .35, roughness: .28, clearcoat: 1, clearcoatRoughness: .04});
  const lacaNavy = fis({color: NAVY, metalness: .55, roughness: .3, clearcoat: 1, clearcoatRoughness: .04});
  const lacaPerla = fis({color: 0xeef2f8, metalness: .1, roughness: .3, clearcoat: 1, clearcoatRoughness: .04});
  const titanio = std({color: 0x3a414d, metalness: .95, roughness: .28});
  const cuero = new THREE.MeshStandardMaterial({color: 0x1b1f27, roughness: .62});
  const FARO = new THREE.Color(0xcfe8ff), ACC = new THREE.Color(ACENTO);
  const faroMat = new THREE.MeshStandardMaterial({color: 0x0a0f18, emissive: FARO.clone(), emissiveIntensity: 2.6});
  const colaMat = new THREE.MeshStandardMaterial({color: 0x12060a, emissive: new THREE.Color(0xff2440), emissiveIntensity: 1.4});
  const ledAzul = new THREE.MeshBasicMaterial({color: ACC.clone().multiplyScalar(3)});
  const botonAzul = new THREE.MeshStandardMaterial({color: 0x0a1a33, emissive: ACC.clone(), emissiveIntensity: 2.2});
  const agujaMat = new THREE.MeshBasicMaterial({color: new THREE.Color(.75, .9, 1).multiplyScalar(3)});

  // ── piso espejado ────────────────────────────────────────────────────────
  const suelo = new Reflector(new THREE.PlaneGeometry(90, 90), {textureWidth: 432, textureHeight: 768, clipBias: .003, multisample: 0, shader: SUELO});
  suelo.rotation.x = -Math.PI / 2; scene.add(suelo); const SU = suelo.material.uniforms;

  // ── pared LED ────────────────────────────────────────────────────────────
  const RW = 26, CW = 2048, CH = 980;
  const ledA = lienzo(CW, CH, () => {}), ledB = lienzo(CW, CH, () => {});
  const digTx = lienzo(160, 1600, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 128px Archivo';
    for (let d = 0; d < 10; d++) x.fillText(String(d), w / 2, h - (d + .5) * 160 + 6); }, {srgb: false});
  digTx.wrapT = THREE.RepeatWrapping;
  const LU = {uA: {value: ledA}, uB: {value: ledB}, uDig: {value: digTx}, uMix: {value: 1}, uFase: {value: 0}, uLuz: {value: 1}, uGlow: {value: Math.PI}, uTach: {value: 0},
    uOdoV: {value: 0}, uOdoOn: {value: 0}, uBrillo: {value: 2.3}, uR: {value: RW}, uWin: {value: new THREE.Vector4(Math.PI, 3, .3, 1)}, uAcc: {value: ACC.clone()}};
  const pared = new THREE.Mesh(new THREE.CylinderGeometry(RW, RW, 18, 160, 1, true), new THREE.ShaderMaterial({uniforms: LU, side: THREE.BackSide, fragmentShader: LED_FRAG,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`}));
  pared.position.y = 9; scene.add(pared);

  // ── el 0 km: carrocería por secciones (loft de superelipses), cabina de vidrio, ruedas con llantas ──
  const NT = 3.2, NB = 3.4, LH = 2.2, XF = 1.36, XR = -1.34, RU = .36, ZR = .8, NS = 64, XG0 = .98, XG1 = -2.02;
  const topLine = x => .86 + .17 * sm(2.15, .8, x) + .035 * sm(.3, -1.9, x);
  function secC(x) { const xn = Math.min(1, Math.abs(x) / LH), p = x > 0 ? 4.0 : 5.2; const e = Math.pow(Math.max(0, 1 - Math.pow(xn, p)), 1 / p);
    const W = .93 - .025 * sm(.6, 2.2, Math.abs(x)); const c = .8 - .23 * sm(1.4, 2.2, x) - .1 * sm(-1.55, -2.2, x);
    let bot = .25 + .11 * sm(1.7, 2.2, x) + .15 * sm(-1.65, -2.2, x);
    for (const xw of [XF, XR]) { const d = Math.abs(x - xw) / .47; if (d < 1) bot = Math.max(bot, .25 + .54 * Math.sqrt(1 - d * d)); }
    return {a: W * e, c, bt: Math.max(.006, topLine(x) - c) * e, bb: Math.max(.012, c - bot) * e}; }
  function secG(x) { const belt = topLine(x) - .012;
    const roof = smin(smin(belt + (XG0 - x) * .56, 1.505 + .03 * x, .22), belt + (x - XG1) * .98, .12); const h = Math.max(0, roof - belt);
    return {a: .72 - .05 * sm(-.3, 1, x) - .05 * sm(-1.3, -2, x), c: belt, bt: h, bb: .09 * sm(0, .1, h)}; }
  function puntos(pr, nT, nB) { const out = []; for (let j = 0; j < NS; j++) { const th = -Math.PI / 2 + TAU * j / NS, s = Math.sin(th), co = Math.cos(th);
      const n = s >= 0 ? nT : nB, b = s >= 0 ? pr.bt : pr.bb; out.push([pr.a * Math.sign(co) * Math.pow(Math.abs(co), 2 / n), pr.c + b * Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]); } return out; }
  function loft(xs, fsec, conZocalo) { const Mx = xs.length, N = NS + 1, pos = new Float32Array(Mx * N * 3); let k = 0;
    for (let i = 0; i < Mx; i++) { const pts = fsec(xs[i]); for (let j = 0; j < N; j++) { const q = pts[j % NS]; pos[k++] = xs[i]; pos[k++] = q[1]; pos[k++] = q[0]; } }
    const A = [], Bz = []; for (let i = 0; i < Mx - 1; i++) for (let j = 0; j < NS; j++) { const a = i * N + j, b = a + N; const th = -Math.PI / 2 + TAU * (j + .5) / NS;
      (conZocalo && Math.sin(th) < -.42 ? Bz : A).push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(A.concat(Bz)); g.addGroup(0, A.length, 0); if (Bz.length) g.addGroup(A.length, Bz.length, 1); g.computeVertexNormals(); return g; }
  function dentro(x, z, y) { const pr = secC(x); if (pr.a < 1e-4) return false; const up = y >= pr.c, n = up ? NT : NB, b = up ? pr.bt : pr.bb; return Math.pow(Math.abs(z / pr.a), n) + Math.pow(Math.abs((y - pr.c) / b), n) <= 1; }
  const frenteX = (z, y) => { let lo = 1.88, hi = LH; for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (dentro(m, z, y)) lo = m; else hi = m; } return lo; };
  const colaX = (z, y) => { let lo = -1.86, hi = -LH; for (let k = 0; k < 28; k++) { const m = (lo + hi) / 2; if (dentro(m, z, y)) lo = m; else hi = m; } return lo; };
  function ladoZ(x, y) { const pr = secC(x), up = y >= pr.c, n = up ? NT : NB, b = up ? pr.bt : pr.bb; const v = 1 - Math.pow(Math.min(1, Math.abs((y - pr.c) / b)), n); return pr.a * Math.pow(Math.max(0, v), 1 / n); }
  const tubo = (pts, r, mat, n = 64) => new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 8, false), mat);

  const auto = new THREE.Group(); scene.add(auto);
  const carro = new THREE.Group(); auto.add(carro);                    // suspensión
  const xsC = []; for (let i = 0; i <= 250; i++) { const v = -1 + 2 * i / 250; xsC.push(LH * Math.sign(v) * (1 - Math.pow(1 - Math.abs(v), 1.5))); }
  const cuerpo = new THREE.Mesh(loft(xsC, x => puntos(secC(x), NT, NB), true), [pintura, plastico]); carro.add(cuerpo);
  const xsG = []; for (let i = 0; i <= 140; i++) xsG.push(lerp(XG1, XG0, i / 140));
  const cabina = new THREE.Group(); carro.add(cabina);
  cabina.add(new THREE.Mesh(loft(xsG, x => puntos(secG(x), 3.0, 2.0), false), vidrio));
  for (const s of [1, -1]) { const pts = []; for (let i = 0; i <= 40; i++) { const x = lerp(XG1 + .04, XG0 - .04, i / 40), g = secG(x); pts.push(V3(x, g.c - .004, s * (g.a + .006))); } cabina.add(tubo(pts, .011, cromo, 80)); }
  // interior (se ve en el despiece)
  const interior = new THREE.Group(); carro.add(interior);
  for (const [x, z] of [[-.05, .36], [-.05, -.36], [-1, .36], [-1, -.36]]) { const a = new THREE.Mesh(new RoundedBoxGeometry(.46, .16, .44, 2, .06), cuero); a.position.set(x, 1.06, z); interior.add(a);
    const r = new THREE.Mesh(new RoundedBoxGeometry(.12, .32, .42, 2, .05), cuero); r.position.set(x - .22, 1.25, z); r.rotation.z = .2; interior.add(r); }
  { const v = new THREE.Mesh(new THREE.TorusGeometry(.15, .022, 10, 32), plastico); v.position.set(.42, 1.24, .36); v.rotation.set(0, Math.PI / 2, 0); v.rotateX(-.45); interior.add(v);
    const tb = new THREE.Mesh(new RoundedBoxGeometry(.3, .14, 1.3, 2, .05), plastico); tb.position.set(.62, 1.1, 0); interior.add(tb);
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(.5, .1), ledAzul); pan.position.set(.47, 1.17, 0); pan.rotation.y = Math.PI / 2; interior.add(pan); }
  // pozos de rueda oscuros
  for (const x of [XF, XR]) { const pz = new THREE.Mesh(new THREE.CylinderGeometry(.44, .44, 1.62, 32, 1, true), new THREE.MeshBasicMaterial({color: 0x010204, side: THREE.BackSide})); pz.rotation.x = Math.PI / 2; pz.position.set(x, RU + .02, 0); carro.add(pz); }
  // frente: barra de luz que sigue la trompa, faros, parrilla y patente genérica
  const frente = new THREE.Group(); carro.add(frente);
  { const barra = []; for (let i = 0; i <= 24; i++) { const z = lerp(-.66, .66, i / 24); barra.push(V3(frenteX(z, .8) + .003, .8, z)); } frente.add(tubo(barra, .016, faroMat, 64));
    for (const s of [1, -1]) { const z = s * .6, x = frenteX(z, .755); const dx = frenteX(z + .05, .755) - frenteX(z - .05, .755);
      const ojo = new THREE.Mesh(new THREE.CapsuleGeometry(.028, .15, 4, 12), faroMat); ojo.position.set(x - .004, .755, z); ojo.rotation.set(Math.PI / 2, 0, 0); ojo.rotation.y = Math.atan2(dx, .1); frente.add(ojo); }
    const par = new THREE.Mesh(new RoundedBoxGeometry(.14, .17, 1.0, 2, .05), negroLaca); par.position.set(frenteX(0, .6) - .058, .6, 0); frente.add(par);
    const patTx = lienzo(512, 132, (x, w, h) => { x.fillStyle = '#f4f6fa'; x.beginPath(); x.roundRect(0, 0, w, h, 14); x.fill(); x.fillStyle = NAVY; x.fillRect(0, 0, w, 30);
      x.strokeStyle = '#1a2235'; x.lineWidth = 6; x.beginPath(); x.roundRect(3, 3, w - 6, h - 6, 12); x.stroke();
      x.fillStyle = '#0b1330'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 78px Archivo'; x.fillText('0 KM', w / 2, 84); });
    const pat = new THREE.Mesh(new THREE.PlaneGeometry(.5, .13), new THREE.MeshStandardMaterial({map: patTx, roughness: .4, metalness: .1})); pat.position.set(frenteX(0, .44) + .008, .44, 0); pat.rotation.y = Math.PI / 2; frente.add(pat); }
  const cola = new THREE.Group(); carro.add(cola);
  { const bt = []; for (let i = 0; i <= 24; i++) { const z = lerp(-.7, .7, i / 24); bt.push(V3(colaX(z, .9) - .003, .9, z)); } cola.add(tubo(bt, .018, colaMat, 64)); }
  const espejos = new THREE.Group(); carro.add(espejos);
  for (const s of [1, -1]) { const c = new THREE.Mesh(new RoundedBoxGeometry(.13, .11, .2, 2, .045), pintura); c.position.set(.72, 1.0, s * .99); espejos.add(c);
    const p = new THREE.Mesh(new THREE.BoxGeometry(.06, .03, .12), plastico); p.position.set(.74, .98, s * .88); espejos.add(p); }
  // juntas de puertas y manijas
  const juntaMat = new THREE.MeshBasicMaterial({color: 0x000000});
  for (const s of [1, -1]) { for (const x of [.64, -.5]) { const pts = []; for (let i = 0; i <= 16; i++) { const y = lerp(.34, .97, i / 16); pts.push(V3(x - .03 * (y - .34), y, s * (ladoZ(x - .03 * (y - .34), y) + .0015))); } carro.add(tubo(pts, .0035, juntaMat, 24)); }
    for (const x of [.28, -.82]) { const h = new THREE.Mesh(new THREE.CapsuleGeometry(.011, .11, 4, 8), cromo); h.rotation.z = Math.PI / 2; h.position.set(x, .87, s * (ladoZ(x, .87) + .004)); carro.add(h); } }
  // ruedas
  function hacerRueda() { const g = new THREE.Group(), gira = new THREE.Group(); g.add(gira); const RO = .36, RI = .245, WT = .25;
    const pts = []; for (let i = 0; i <= 28; i++) { const th = -Math.PI / 2 + Math.PI * i / 28, co = Math.cos(th), s = Math.sin(th); pts.push(new THREE.Vector2(RI + (RO - RI) * Math.pow(Math.abs(co), 2 / 3.2), WT / 2 * Math.sign(s) * Math.pow(Math.abs(s), 2 / 3.2))); }
    const cub = new THREE.Mesh(new THREE.LatheGeometry(pts, 56), caucho); cub.rotation.x = Math.PI / 2; gira.add(cub);
    const sh = new THREE.Shape(); sh.absarc(0, 0, .238, 0, TAU, false);
    for (let k = 0; k < 5; k++) { const a0 = k * TAU / 5 + .2, a1 = a0 + TAU / 5 - .4; const h = new THREE.Path(); h.absarc(0, 0, .205, a0, a1, false); h.absarc(0, 0, .09, a1 - .12, a0 + .12, true); h.closePath(); sh.holes.push(h); }
    const llanta = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, {depth: .03, bevelEnabled: true, bevelThickness: .012, bevelSize: .01, bevelSegments: 2, curveSegments: 24}), [llantaCara, llantaLado]); llanta.position.z = .053; gira.add(llanta);
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .02, 24), cromo); tapa.rotation.x = Math.PI / 2; tapa.position.z = .1; gira.add(tapa);
    const disco = new THREE.Mesh(new THREE.CylinderGeometry(.19, .19, .018, 40), metal); disco.rotation.x = Math.PI / 2; disco.position.z = .0; gira.add(disco);
    const barril = new THREE.Mesh(new THREE.CylinderGeometry(.236, .236, .2, 40, 1, true), new THREE.MeshStandardMaterial({color: 0x111318, roughness: .6, side: THREE.DoubleSide})); barril.rotation.x = Math.PI / 2; barril.position.z = -.02; g.add(barril);
    const pinza = new THREE.Mesh(new RoundedBoxGeometry(.075, .15, .05, 2, .02), lacaAzul); pinza.position.set(-.12, .1, .035); pinza.rotation.z = .85; g.add(pinza);
    return {g, gira, cub, llanta, disco, pinza}; }
  const ruedas = [];
  for (const [x, s] of [[XF, 1], [XF, -1], [XR, 1], [XR, -1]]) { const w = hacerRueda(); w.g.position.set(x, RU, s * ZR); if (s < 0) w.g.scale.z = -1; auto.add(w.g); ruedas.push({...w, s, x}); }
  // sombra de contacto (sin mapas de sombra: el render rápido no los usa)
  const sombraTx = lienzo(512, 256, (x, w, h) => { x.fillStyle = '#000'; x.filter = 'blur(26px)'; x.globalAlpha = .85; x.beginPath(); x.roundRect(64, 66, w - 128, h - 132, 60); x.fill();
    x.filter = 'blur(9px)'; x.globalAlpha = 1; for (const [cx, cy] of [[.245, .19], [.245, .81], [.755, .19], [.755, .81]]) { x.beginPath(); x.ellipse(cx * w, cy * h, 30, 14, 0, 0, TAU); x.fill(); } }, {srgb: false});
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 2.5), new THREE.MeshBasicMaterial({map: sombraTx, transparent: true, depthWrite: false, opacity: .92})); sombra.rotation.x = -Math.PI / 2; sombra.position.y = .005; auto.add(sombra);
  // piezas del despiece del auto
  const DESP = [{o: cabina, d: V3(0, 1.05, 0)}, {o: frente, d: V3(.8, .05, 0)}, {o: interior, d: V3(0, .5, 0)}, {o: espejos, d: V3(0, .25, 0)}, {o: cola, d: V3(-.6, .05, 0)},
    ...ruedas.map(w => ({o: w.g, d: V3(0, 0, w.s * .85)}))].map(p => ({...p, base: p.o.position.clone()}));

  // ── pedestal que sube del piso, con aro de LED y texto grabado ──────────
  const PED = V3(); { const a = AZ0 * D2R; const u = V3(Math.sin(a), 0, Math.cos(a)), rt = V3(Math.cos(a), 0, -Math.sin(a)); PED.copy(u.multiplyScalar(4.5)).addScaledVector(rt, -Math.sign(Math.cos(a) || 1) * 1.3); }
  const ped = new THREE.Group(); ped.position.copy(PED); scene.add(ped);
  const pedCuerpo = new THREE.Group(); ped.add(pedCuerpo);
  pedCuerpo.add(new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [.6, 0], [.6, .03], [.565, .07], [.55, .98], [.545, 1.02], [.52, 1.05], [0, 1.05]].map(([a, b]) => new THREE.Vector2(a, b)), 72), negroLaca));
  { const aro = new THREE.Mesh(new THREE.TorusGeometry(.547, .006, 8, 120), ledAzul); aro.rotation.x = Math.PI / 2; aro.position.y = 1.0; pedCuerpo.add(aro); }
  const grabTx = lienzo(1024, 128, () => {}); grabTx.userData.txt = null;
  function grabar(txt) { if (grabTx.userData.txt === txt) return; grabTx.userData.txt = txt; const x = grabTx.userData.ctx, w = 1024, h = 128; x.clearRect(0, 0, w, h);
    if (txt) { let fs = 84; x.textAlign = 'center'; x.textBaseline = 'middle'; do { x.font = `800 ${fs}px Archivo`; fs -= 4; } while (x.measureText(txt).width > w * .9 && fs > 30);
      x.shadowColor = ACENTO; x.shadowBlur = 16; x.fillStyle = '#cfe6ff'; x.fillText(txt, w / 2, h / 2 + 4); x.shadowBlur = 0; x.fillStyle = '#ffffff'; x.fillText(txt, w / 2, h / 2 + 4); }
    grabTx.needsUpdate = true; }
  const grab = new THREE.Mesh(new THREE.CylinderGeometry(.553, .553, .13, 48, 1, true, -.62, 1.24), new THREE.MeshBasicMaterial({map: grabTx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: new THREE.Color(1.5, 1.5, 1.5)}));
  grab.position.y = .9; pedCuerpo.add(grab);
  const platina = new THREE.Group(); platina.position.y = 1.05; pedCuerpo.add(platina);

  // ── objetos de la lista de Autos ────────────────────────────────────────
  const ext = (s, d, bt, bs, cs = 40) => new THREE.ExtrudeGeometry(s, {depth: d, bevelEnabled: true, bevelThickness: bt, bevelSize: bs, bevelSegments: 5, curveSegments: cs});
  function formaEscudo(w, h) { const s = new THREE.Shape(), hw = w / 2; s.moveTo(0, h * .5); s.bezierCurveTo(hw * .35, h * .5, hw * .7, h * .44, hw, h * .36); s.bezierCurveTo(hw, 0, hw * .85, -h * .28, 0, -h * .5);
    s.bezierCurveTo(-hw * .85, -h * .28, -hw, 0, -hw, h * .36); s.bezierCurveTo(-hw * .7, h * .44, -hw * .35, h * .5, 0, h * .5); return s; }
  function formaCheck(k) { const s = new THREE.Shape(); [[-.5, .02], [-.3, .22], [-.12, .04], [.32, .48], [.52, .28], [-.12, -.36]].forEach(([a, b], i) => i ? s.lineTo(a * k * 2, b * k * 2) : s.moveTo(a * k * 2, b * k * 2)); s.closePath(); return s; }
  function formaCruz(k) { const a = .16, L = .5, c = Math.SQRT1_2, s = new THREE.Shape(); [[-a, L], [a, L], [a, a], [L, a], [L, -a], [a, -a], [a, -L], [-a, -L], [-a, -a], [-L, -a], [-L, a], [-a, a]].forEach(([x, y], i) => { const X = (x * c - y * c) * k * 2, Y = (x * c + y * c) * k * 2; i ? s.lineTo(X, Y) : s.moveTo(X, Y); }); s.closePath(); return s; }
  function grietaMat(sem) {
    const tx = lienzo(512, 512, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.lineCap = 'round'; x.lineJoin = 'round';
      const rama = (px, py, ang, largo, ancho, ord, prof) => { let cx = px, cy = py, o = ord; const n = 7;
        for (let i = 0; i < n; i++) { const a = ang + (hash(sem + prof * 13 + i * 7) - .5) * 1.1, l = largo / n, nx = cx + Math.cos(a) * l, ny = cy + Math.sin(a) * l, o2 = o + l / 520;
          x.strokeStyle = `rgb(255,${Math.round(clamp(o) * 255)},0)`; x.lineWidth = Math.max(1.5, ancho * (1 - i / n * .6)); x.beginPath(); x.moveTo(cx, cy); x.lineTo(nx, ny); x.stroke();
          if (prof < 2 && hash(sem + i * 3 + prof * 17) > .55) rama(nx, ny, a + (hash(sem + i + prof) > .5 ? .7 : -.7), largo * .45, ancho * .6, o2, prof + 1); cx = nx; cy = ny; o = o2; } };
      rama(w * .84, h * .12, 2.35, 380, 7, 0, 0); }, {srgb: false});
    return new THREE.ShaderMaterial({uniforms: {uC: {value: tx}, uProg: {value: .14}, uCol: {value: new THREE.Color(.75, .88, 1)}}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform sampler2D uC; uniform float uProg; uniform vec3 uCol; varying vec2 vUv;
        float on(vec2 p){ vec4 c = texture2D(uC, p); return c.r * step(c.g, uProg) * step(.02, c.r); }
        void main(){ float n = on(vUv), g = 0.; for (int i = 0; i < 8; i++) { float a = float(i) * .785; g += on(vUv + vec2(cos(a), sin(a)) * .013); }
          gl_FragColor = vec4(uCol * (n * 2.8 + g / 8. * 1.2), 1.); }`}); }
  function hojaTx(tipo) { const pol = tipo === 'poliza'; return lienzo(600, 800, (x, w) => { x.fillStyle = '#f4f7fb'; x.fillRect(0, 0, w, 800); x.fillStyle = NAVY; x.fillRect(0, 0, w, 150); x.fillStyle = ACENTO; x.fillRect(0, 150, w, 8);
      x.fillStyle = '#fff'; x.font = '800 72px Archivo'; x.fillText(pol ? 'PÓLIZA' : 'FORMULARIO', 38, 96); x.font = '700 24px "Plus Jakarta Sans"'; x.fillStyle = '#a9c6ea'; x.fillText(pol ? 'SEGURO DEL AUTO' : 'TRÁMITE DEL 0 KM', 40, 132);
      (pol ? ['COBERTURA', 'VIGENCIA', 'FRANQUICIA', 'ASISTENCIA'] : ['TITULAR', 'VEHÍCULO', 'CONDICIONES', 'FIRMA']).forEach((f, i) => { const y = 214 + i * 116, dst = i === 2;
        if (dst) { x.fillStyle = '#dcebfb'; x.fillRect(24, y - 40, w - 48, 98); x.fillStyle = ACENTO; x.fillRect(24, y - 40, 10, 98); }
        x.fillStyle = dst ? NAVY : '#5b6b82'; x.font = dst ? '800 32px Archivo' : '700 28px "Plus Jakarta Sans"'; x.fillText(f, 50, y);
        x.fillStyle = dst ? '#9db9dc' : '#d3dbe6'; x.fillRect(50, y + 20, (w - 120) * (.55 + hash(i * 7 + 3) * .4), 13); x.fillRect(50, y + 42, (w - 120) * (.3 + hash(i * 5 + 1) * .3), 13); });
      x.strokeStyle = NAVY; x.lineWidth = 4; x.beginPath(); x.moveTo(60, 735); x.bezierCurveTo(110, 665, 150, 775, 200, 705); x.bezierCurveTo(240, 655, 260, 765, 320, 710); x.stroke();
      x.strokeStyle = ACENTO; x.lineWidth = 6; x.beginPath(); x.arc(490, 708, 52, 0, TAU); x.stroke(); x.beginPath(); x.moveTo(465, 708); x.lineTo(485, 728); x.lineTo(518, 690); x.stroke(); }); }
  function pantallaTx() { return lienzo(420, 880, (x, w, h) => { x.save(); x.beginPath(); x.roundRect(0, 0, w, h, 52); x.clip();
      const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#071433'); g.addColorStop(1, '#020818'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = '#0d1d44'; x.fillRect(0, 0, w, 120); x.fillStyle = ACENTO; x.beginPath(); x.arc(56, 78, 26, 0, TAU); x.fill(); x.fillStyle = '#cfe0f7'; x.fillRect(96, 64, 150, 16); x.fillStyle = '#6f87ad'; x.fillRect(96, 88, 90, 10);
      x.fillStyle = '#000'; x.beginPath(); x.roundRect(w / 2 - 50, 16, 100, 26, 13); x.fill();
      const burbuja = (y, der, bw, filas) => { const bh = 30 + filas * 26, bx = der ? w - 24 - bw : 24; x.fillStyle = der ? ACENTO : '#1b2a4f'; x.beginPath(); x.roundRect(bx, y, bw, bh, 24); x.fill();
        x.fillStyle = der ? 'rgba(255,255,255,.85)' : 'rgba(190,210,240,.7)'; for (let i = 0; i < filas; i++) x.fillRect(bx + 20, y + 22 + i * 26, (bw - 40) * (i === filas - 1 ? .6 : 1), 12); };
      burbuja(170, false, 250, 2); burbuja(290, true, 230, 1); burbuja(380, false, 290, 3); burbuja(530, true, 260, 2);
      x.fillStyle = '#1b2a4f'; x.beginPath(); x.roundRect(24, 660, 110, 56, 28); x.fill(); x.fillStyle = '#9fb8de'; [0, 1, 2].forEach(i => { x.beginPath(); x.arc(52 + i * 27, 688, 8, 0, TAU); x.fill(); });
      x.fillStyle = '#0d1d44'; x.beginPath(); x.roundRect(20, h - 110, w - 40, 64, 32); x.fill(); x.fillStyle = ACENTO; x.beginPath(); x.arc(w - 56, h - 78, 24, 0, TAU); x.fill(); x.restore(); }); }
  function almTx(num) { return lienzo(560, 620, (x, w, h) => { x.fillStyle = '#f4f7fb'; x.fillRect(0, 0, w, h); x.fillStyle = ACENTO; x.fillRect(0, 0, w, 130); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '800 70px Archivo'; x.fillText('DÍA', w / 2, 70); x.fillStyle = NAVY; x.font = '800 330px Archivo'; x.fillText(String(num), w / 2, 390); x.fillStyle = '#c7d3e4'; x.fillRect(60, 560, w - 120, 10); }); }
  function velTx() { return lienzo(720, 720, (x, w) => { const c = w / 2; const g = x.createRadialGradient(c, c, 40, c, c, c); g.addColorStop(0, '#0c1834'); g.addColorStop(1, '#01040d'); x.fillStyle = g; x.fillRect(0, 0, w, w);
      x.strokeStyle = ACENTO; x.lineWidth = 14; x.shadowColor = ACENTO; x.shadowBlur = 20; x.beginPath(); x.arc(c, c, c * .86, Math.PI * .75, Math.PI * 2.25); x.stroke(); x.shadowBlur = 0;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let i = 0; i <= 44; i++) { const a = Math.PI * .75 + Math.PI * 1.5 * i / 44, mayor = i % 4 === 0, lg = mayor ? 46 : 22; x.strokeStyle = mayor ? '#ffffff' : '#7d93b8'; x.lineWidth = mayor ? 7 : 3;
        x.beginPath(); x.moveTo(c + Math.cos(a) * c * .78, c + Math.sin(a) * c * .78); x.lineTo(c + Math.cos(a) * (c * .78 - lg), c + Math.sin(a) * (c * .78 - lg)); x.stroke();
        if (mayor) { x.fillStyle = '#e8f1ff'; x.font = '700 42px Archivo'; x.fillText(String(i * 5), c + Math.cos(a) * c * .55, c + Math.sin(a) * c * .55); } }
      x.fillStyle = '#7d93b8'; x.font = '700 34px "Plus Jakarta Sans"'; x.fillText('km/h', c, c * 1.42); x.fillStyle = '#ffffff'; x.font = '800 54px Archivo'; x.fillText('0 KM', c, c * 1.64); }); }
  function hacerLupa(vistaMat) { const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.TorusGeometry(.3, .032, 20, 96), lacaNavy));
    const bis = new THREE.Mesh(new THREE.TorusGeometry(.272, .01, 10, 96), cromo); bis.position.z = .012; g.add(bis);
    const mango = new THREE.Group(); mango.position.set(.38, -.45, 0); mango.rotation.z = .7; g.add(mango);
    mango.add(new THREE.Mesh(new THREE.CapsuleGeometry(.045, .4, 6, 16), negroLaca));
    const cu = new THREE.Mesh(new THREE.CylinderGeometry(.03, .042, .12, 16), cromo); cu.position.y = .27; mango.add(cu);
    const an = new THREE.Mesh(new THREE.TorusGeometry(.047, .008, 8, 24), ledAzul); an.rotation.x = Math.PI / 2; an.position.y = .14; mango.add(an);
    const vid = new THREE.Mesh(new THREE.CircleGeometry(.272, 64), vistaMat || new THREE.MeshPhysicalMaterial({color: 0xcfe6ff, metalness: 0, roughness: .02, transparent: true, opacity: .28, clearcoat: 1}));
    vid.position.z = .004; g.add(vid); g.userData.vidrio = vid; return g; }

  function hacerObjeto(tipo, b) {
    const g = new THREE.Group(), partes = []; let alto = .8; const det = V3(0, .45, .1);
    const pieza = (m, dir, nombre, padre = g) => { if (m.parent !== padre) padre.add(m); partes.push({m, base: m.position.clone(), dir: V3(...dir), nombre}); return m; };
    if (tipo === 'escudo' || tipo === 'grieta') {
      const marco = new THREE.Mesh(ext(formaEscudo(.74, .9), .07, .045, .04), lacaNavy); marco.position.set(0, .49, -.035); pieza(marco, [0, 0, -.3], 'MARCO');
      const placa = new THREE.Mesh(ext(formaEscudo(.58, .71), .02, .015, .012), lacaPerla); placa.position.set(0, .5, .07); pieza(placa, [0, 0, .22], 'COBERTURA');
      const emb = new THREE.Mesh(ext(formaCheck(.17), .03, .015, .012, 6), lacaAzul); emb.position.set(-.02, .48, .12); pieza(emb, [0, .05, .5], 'TILDE');
      alto = .95; det.set(.15, .74, .12);
      if (tipo === 'grieta') { const gr = new THREE.Mesh(new THREE.PlaneGeometry(.58, .71), grietaMat(b.i * 31 + 7)); gr.position.z = .037; gr.renderOrder = 3; placa.add(gr); g.userData.grieta = gr.material; }
    } else if (tipo === 'poliza' || tipo === 'documento') {
      const tabla = new THREE.Mesh(new RoundedBoxGeometry(.64, .86, .035, 3, .03), lacaNavy); tabla.position.set(0, .45, 0); pieza(tabla, [0, 0, -.28], 'CARPETA');
      const hg = new THREE.PlaneGeometry(.56, .76, 8, 8); { const p = hg.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, .012 * Math.pow(p.getX(i) / .28, 2)); hg.computeVertexNormals(); }
      const tx = hojaTx(tipo); const hoja = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({map: tx, roughness: .5, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: .22})); hoja.position.set(0, .43, .022);
      pieza(hoja, [0, .08, .25], tipo === 'poliza' ? 'PÓLIZA' : 'HOJA');
      const clip = new THREE.Mesh(new RoundedBoxGeometry(.26, .08, .05, 2, .02), cromo); clip.position.set(0, .86, .03); pieza(clip, [0, .35, .1], 'CLIP');
      alto = .9; det.set(-.12, .375, .04);
    } else if (tipo === 'celular') {
      const cu = new THREE.Mesh(new RoundedBoxGeometry(.44, .88, .055, 4, .065), titanio); cu.position.set(0, .45, 0); pieza(cu, [0, 0, -.25], 'EQUIPO');
      const pa = new THREE.Mesh(new THREE.PlaneGeometry(.405, .845), new THREE.MeshBasicMaterial({map: pantallaTx(), transparent: true, color: new THREE.Color(1.3, 1.3, 1.3)})); pa.position.set(0, .45, .0285); pieza(pa, [0, 0, .28], 'PANTALLA');
      alto = .9; det.set(.07, .33, .03);
    } else if (tipo === 'llave') {
      const fob = new THREE.Mesh(new RoundedBoxGeometry(.26, .46, .09, 4, .085), negroLaca); fob.position.set(0, .3, 0); pieza(fob, [0, 0, -.22], 'CUERPO');
      const tapa = new THREE.Mesh(new RoundedBoxGeometry(.27, .1, .096, 3, .04), cromo); tapa.position.set(0, .56, 0); pieza(tapa, [0, .2, 0], 'TAPA');
      const aro = new THREE.Mesh(new THREE.TorusGeometry(.075, .016, 12, 40), cromo); aro.position.set(0, .68, 0); pieza(aro, [0, .42, 0], 'ARO');
      const bot = new THREE.Group(); [.4, .29, .18].forEach((y, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.042, .042, .014, 24), i === 0 ? botonAzul : titanio); m.rotation.x = Math.PI / 2; m.position.set(0, y, .047); bot.add(m); });
      pieza(bot, [0, 0, .3], 'BOTONES'); alto = .76; det.set(0, .4, .06);
    } else if (tipo === 'candado') {
      const cu = new THREE.Mesh(new RoundedBoxGeometry(.5, .42, .22, 4, .07), lacaNavy); cu.position.set(0, .21, 0); pieza(cu, [0, -.12, 0], 'CUERPO');
      const arco = new THREE.Group(); const t0 = new THREE.Mesh(new THREE.TorusGeometry(.15, .036, 16, 48, Math.PI), cromo); t0.position.y = .52; arco.add(t0);
      for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .14, 16), cromo); p.position.set(s * .15, .45, 0); arco.add(p); } pieza(arco, [0, .32, 0], 'TRABA');
      const ojo = new THREE.Mesh(new THREE.CircleGeometry(.04, 24), ledAzul); ojo.position.set(0, .24, .112); pieza(ojo, [0, 0, .25], 'CERRADURA'); alto = .72; det.set(0, .24, .11);
    } else if (tipo === 'almanaque') {
      const num = (String(b.texto).match(/\d{1,2}/) || [String(1 + Math.floor(hash(b.i + 3) * 28))])[0];
      const atras = new THREE.Mesh(new RoundedBoxGeometry(.62, .72, .05, 3, .03), lacaNavy); atras.position.set(0, .38, -.02); pieza(atras, [0, 0, -.25], 'BASE');
      const tx = almTx(num); const hj = new THREE.Mesh(new THREE.PlaneGeometry(.56, .62), new THREE.MeshStandardMaterial({map: tx, roughness: .5, emissive: 0xffffff, emissiveMap: tx, emissiveIntensity: .2})); hj.position.set(0, .35, .008); pieza(hj, [0, 0, .25], 'DÍA');
      const an = new THREE.Group(); for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(.04, .009, 8, 24), cromo); a.position.set(s * .17, .7, 0); a.rotation.y = Math.PI / 2; an.add(a); } pieza(an, [0, .25, 0], 'ANILLOS');
      alto = .76; det.set(0, .4, .02);
    } else if (tipo === 'velocimetro') {
      const caja = new THREE.Group(); caja.position.y = .42;
      const fo = new THREE.Mesh(new THREE.CylinderGeometry(.37, .34, .1, 64), negroLaca); fo.rotation.x = Math.PI / 2; fo.position.z = -.055; caja.add(fo); caja.add(new THREE.Mesh(new THREE.TorusGeometry(.37, .035, 20, 96), cromo));
      pieza(caja, [0, 0, -.25], 'CAJA');
      const cara = new THREE.Mesh(new THREE.CircleGeometry(.355, 64), new THREE.MeshBasicMaterial({map: velTx(), color: new THREE.Color(1.3, 1.3, 1.3)})); cara.position.set(0, .42, .002); pieza(cara, [0, 0, .12], 'ESFERA');
      const ag = new THREE.Group(); ag.position.set(0, .42, .02); const pal = new THREE.Mesh(new THREE.BoxGeometry(.014, .3, .01), agujaMat); pal.position.y = .12; ag.add(pal);
      const tp = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .03, 24), cromo); tp.rotation.x = Math.PI / 2; ag.add(tp); pieza(ag, [0, 0, .32], 'AGUJA');
      g.userData.aguja = ag; alto = .82; det.set(.12, .5, .03);
    } else if (tipo === 'rueda') {
      const w = hacerRueda(); w.g.scale.setScalar(1.2); w.g.position.y = .36 * 1.2; g.add(w.g); g.userData.gira = w.gira;
      partes.push({m: w.cub, base: w.cub.position.clone(), dir: V3(0, 0, -.25), nombre: 'CUBIERTA'}, {m: w.llanta, base: w.llanta.position.clone(), dir: V3(0, 0, .35), nombre: 'LLANTA'}, {m: w.pinza, base: w.pinza.position.clone(), dir: V3(0, .15, .2), nombre: 'FRENO'});
      alto = .86; det.set(-.12, .5, .1);
    } else if (tipo === 'check' || tipo === 'cruz') {
      const m = new THREE.Mesh(ext(tipo === 'check' ? formaCheck(.36) : formaCruz(.34), .1, .05, .04, 8), tipo === 'check' ? lacaAzul : lacaPerla); m.geometry.center(); m.position.y = .4; pieza(m, [0, .2, 0], tipo === 'check' ? 'TILDE' : 'CRUZ');
      alto = .8; det.set(0, .4, .08);
    } else if (tipo === 'lupa') {
      const l = hacerLupa(); l.scale.setScalar(1.05); l.position.y = .62; l.rotation.z = -.25; g.add(l); partes.push({m: l.userData.vidrio, base: l.userData.vidrio.position.clone(), dir: V3(0, 0, .3), nombre: 'VIDRIO'});
      alto = .95; det.set(0, .62, .05);
    } else {   // objeto desconocido: pieza genérica laqueada
      const m = new THREE.Mesh(new RoundedBoxGeometry(.56, .56, .56, 6, .15), lacaAzul); m.position.y = .36; m.rotation.set(.35, .55, 0); pieza(m, [0, .2, 0], 'PIEZA');
      const a = new THREE.Mesh(new THREE.TorusGeometry(.46, .008, 8, 96), ledAzul); a.rotation.x = Math.PI / 2; a.position.y = .02; g.add(a); alto = .78; det.set(0, .4, .2);
    }
    g.userData = Object.assign(g.userData, {alto, partes, det, tipo}); g.visible = false; platina.add(g); return g;
  }

  // ── lupa con segunda vista (render a textura) ───────────────────────────
  const rtL = new THREE.WebGLRenderTarget(512, 512, {type: THREE.HalfFloatType});
  const camL = new THREE.PerspectiveCamera(10, 1, .05, 400);
  const vistaMat = new THREE.ShaderMaterial({uniforms: {tMap: {value: rtL.texture}},
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `uniform sampler2D tMap; varying vec2 vUv; void main(){ vec2 c = vUv - .5; float r = length(c) * 2.; vec2 uv = .5 + c * (1. - .14 * r * r);
      vec3 col = texture2D(tMap, uv).rgb * 1.08; col *= 1. - .4 * smoothstep(.72, 1., r);
      col += vec3(.7, .85, 1.) * smoothstep(.07, 0., abs(c.x + c.y - .2)) * smoothstep(1., .35, r) * .35 + vec3(.12, .3, .6) * smoothstep(.82, 1., r) * .7;
      gl_FragColor = vec4(col, 1.); }`});
  const lupa = hacerLupa(vistaMat); lupa.visible = false; scene.add(lupa);

  // ── rótulos numerados con línea guía ────────────────────────────────────
  const rotulos = new Map();
  function rotulo(num, nombre) { const k = num + '|' + nombre; if (rotulos.has(k)) return rotulos.get(k);
    const tx = lienzo(720, 168, (x, w, h) => { x.fillStyle = 'rgba(0,5,33,.86)'; x.strokeStyle = TEXTO; x.lineWidth = 6; x.beginPath(); x.roundRect(6, 6, w - 12, h - 12, 30); x.fill(); x.stroke();
      let tx0 = 40; if (num != null) { x.fillStyle = ACENTO; x.beginPath(); x.arc(92, h / 2, 54, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.font = '800 74px Archivo'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(num), 92, h / 2 + 4); tx0 = 168; }
      let fs = 60; x.textAlign = 'left'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; do { x.font = `700 ${fs}px "Plus Jakarta Sans"`; fs -= 2; } while (x.measureText(nombre).width > w - tx0 - 36 && fs > 24); x.fillText(nombre, tx0, h / 2 + 3); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 168 / 720), new THREE.MeshBasicMaterial({map: tx, transparent: true, depthTest: false, depthWrite: false, color: new THREE.Color(1.45, 1.45, 1.45)}));
    m.renderOrder = 21; m.visible = false; scene.add(m); const r = {m, guia: guia()}; rotulos.set(k, r); return r; }
  const lineaMat = new THREE.MeshBasicMaterial({color: new THREE.Color(TEXTO).multiplyScalar(2.4), depthTest: false, depthWrite: false, transparent: true});
  const lineaGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true); lineaGeo.translate(0, .5, 0); const puntoGeo = new THREE.SphereGeometry(1, 12, 8);
  function guia() { const m = new THREE.Mesh(lineaGeo, lineaMat), p = new THREE.Mesh(puntoGeo, lineaMat); m.renderOrder = p.renderOrder = 20; m.visible = p.visible = false; scene.add(m, p); return {m, p}; }
  const YUP = V3(0, 1, 0), tA = V3(), tB = V3(), tC = V3(), camR = V3(), camU = V3(), camF = V3();
  const profundidad = p => tA.copy(p).sub(cam.position).dot(camF);
  const pxu = d => 1920 / (2 * Math.max(.1, d) * Math.tan(cam.fov * D2R / 2));
  function enPantalla(nx, ny, depth, out) { out.set(nx, ny, .5).unproject(cam).sub(cam.position).normalize(); return out.multiplyScalar(depth / Math.max(.05, out.dot(camF))).add(cam.position); }
  function ponerRotulo(r, ancla, nx, ny, k) { const vis = k > .002; r.m.visible = vis; r.guia.m.visible = r.guia.p.visible = vis; if (!vis) return;
    const d = profundidad(ancla) * .9, u = pxu(d), w = 330 / u; enPantalla(nx, ny, d, r.m.position); r.m.quaternion.copy(cam.quaternion); r.m.scale.setScalar(w * Math.max(.001, E.outBack(clamp(k))));
    tB.copy(r.m.position).addScaledVector(camR, -Math.sign(nx) * w * .47); const L = tB.distanceTo(ancla), rad = 1.6 / pxu(profundidad(ancla)), kl = E.out3(clamp(k * 1.4 - .2));
    r.guia.m.position.copy(ancla); r.guia.m.quaternion.setFromUnitVectors(YUP, tC.copy(tB).sub(ancla).normalize()); r.guia.m.scale.set(rad, Math.max(1e-4, L * kl), rad);
    r.guia.p.position.copy(ancla); r.guia.p.scale.setScalar(rad * 3.4); }
  const SLOTS = [[-.52, .12], [.52, .2], [-.52, -.2], [.52, -.1]];

  // ── láser de tachado y sello ─────────────────────────────────────────────
  const laserG = new THREE.PlaneGeometry(1, 1); laserG.translate(.5, 0, 0);
  const laser = new THREE.Mesh(laserG, new THREE.MeshBasicMaterial({color: new THREE.Color(.8, .92, 1).multiplyScalar(4), transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending}));
  const laserHalo = new THREE.Mesh(laserG, new THREE.MeshBasicMaterial({color: ACC.clone().multiplyScalar(1.2), transparent: true, opacity: .5, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending}));
  laser.renderOrder = laserHalo.renderOrder = 18; laser.visible = laserHalo.visible = false; scene.add(laser, laserHalo);
  const sello = new THREE.Group(); sello.visible = false; scene.add(sello);
  { const c = new THREE.Mesh(new THREE.CylinderGeometry(.13, .15, .3, 40), lacaNavy); c.position.y = .25; sello.add(c);
    const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 24, 16), cromo); m.position.y = .48; m.scale.y = .8; sello.add(m);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .06, 48), cromo); b.position.y = .06; sello.add(b);
    const a = new THREE.Mesh(new THREE.TorusGeometry(.2, .012, 8, 64), ledAzul); a.rotation.x = Math.PI / 2; a.position.y = .03; sello.add(a); }
  const marca = new THREE.Mesh(new THREE.RingGeometry(.4, .43, 64), new THREE.MeshBasicMaterial({color: ACC.clone().multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide}));
  marca.rotation.x = -Math.PI / 2; marca.position.y = .006; marca.visible = false; platina.add(marca);

  // ── golpes del plan ──────────────────────────────────────────────────────
  function tiempo(pal, n = 0) { const k = nrm(pal); let l = P.filter(p => nrm(p.w) === k); if (!l.length && k.length > 2) l = P.filter(p => nrm(p.w).startsWith(k)); if (!l.length) return null; return l[Math.min(Math.max(0, n | 0), l.length - 1)].t; }
  const B = plan.beats.map((b, i) => { let objeto = nrm(b.objeto); if (!OBJETOS.has(objeto)) objeto = 'generico'; const efecto = EFECTOS.has(nrm(b.efecto)) ? nrm(b.efecto) : 'rebote';
    return {...b, objeto, efecto, tipo: nrm(b.tipo) || 'dato', texto: String(b.texto || ''), t: tiempo(b.palabra, b.n)}; });
  B.forEach((b, i) => { if (b.t == null) { console.log('LOG autos: no encontré la palabra «' + b.palabra + '»; reparto el golpe'); b.t = .5 + (vozFin - .5) * i / Math.max(1, B.length); } });
  B.sort((a, b) => a.t - b.t); B.forEach((b, i) => { if (i && b.t < B[i - 1].t + .5) b.t = B[i - 1].t + .5; b.i = i; });
  const ultimo = B[B.length - 1];
  const tHero = ultimo.objeto === 'auto' ? ultimo.t : clamp(ultimo.t + Math.max(1.3, (vozFin - ultimo.t) * .6), ultimo.t + .6, T - 1.4);
  B.forEach((b, i) => { b.te = i < B.length - 1 ? B[i + 1].t : (b.objeto === 'auto' ? T : tHero); });
  // pasos del contador
  let pasos = B.filter(b => b.tipo === 'paso'); if (plan.contador && !pasos.length) pasos = B.filter(b => b.tipo !== 'gancho' && b.tipo !== 'cierre');
  pasos.slice(0, plan.contador).forEach((b, k) => b.paso = k + 1);
  const primerPaso = B.findIndex(b => b.paso);
  const tCierre = (B.find(b => b.tipo === 'cierre') || {t: tHero}).t;
  // tomas de cámara
  const tomas = {heroe: {target: [0, .76, 0], az: AZ0, el: 5, dist: distPara(16.2)},
    frente: {target: [.25, .64, 0], az: AZ0 + lado * 30, el: 3.5, dist: distPara(12.8)},
    perfil: {target: [-.1, .72, 0], az: AZ0 - lado * 46, el: 4.5, dist: distPara(17.5)},
    trasera: {target: [-.2, .76, 0], az: AZ0 - lado * 112, el: 7, dist: distPara(16)},
    alta: {target: [0, 1.0, 0], az: AZ0 - lado * 8, el: 21, dist: distPara(17.5)},
    rueda: {target: [XF, .45, Math.sign(Math.cos(AZ0 * D2R)) * ZR], az: AZ0 - lado * 18, el: 3, dist: distPara(6.4)}};
  let ultAuto = 'heroe', iObj = 0;
  B.forEach((b, i) => {
    b.entrada = ['rebote', 'caida', 'golpe', 'giro'].includes(b.efecto) ? b.efecto : ENTRADAS[i % 2];
    if (b.objeto === 'auto') { let k = {despiece: 'alta', lupa: 'rueda', barrido: 'perfil', giro: 'heroe', caida: 'heroe'}[b.efecto];
      if (!k) { const op = ['frente', 'perfil', 'trasera', 'heroe'].filter(x => x !== ultAuto); k = op[Math.floor(rnd() * op.length)]; }
      if (b.tipo === 'gancho') k = b.efecto === 'despiece' ? 'alta' : 'heroe';
      ultAuto = k; b.toma = {...tomas[k], fov: FOV0, drift: ORB * (i % 2 ? -1 : 1)}; b.sujeto = k;
    } else { const az = AZ0 + (iObj++ % 2 ? 1 : -1) * (8 + rnd() * 14) * lado;
      b.toma = {target: [PED.x, 1.36, PED.z], az, el: 6 + rnd() * 4, dist: distPara(8.4), fov: FOV0, drift: ORB * (i % 2 ? -.8 : .8)}; b.obj = hacerObjeto(b.objeto, b); }
  });
  const H0 = {...tomas.heroe, fov: FOV0, drift: ORB, t0: 0};
  const SEGS = [{t0: 0, s: H0}];
  B.forEach((b, i) => { const t0 = i === 0 ? Math.max(b.t, .5) : b.t; SEGS.push({t0, s: {...b.toma, t0}}); });
  if (ultimo.objeto === 'auto') { const sg = SEGS[SEGS.length - 1]; sg.s = {...H0, t0: sg.t0, az: H0.az - H0.drift * (T - sg.t0)}; }    // vuelve al cuadro 1
  else SEGS.push({t0: tHero, s: {...H0, t0: tHero, az: H0.az - H0.drift * (T - tHero)}});
  const WH = .21;
  const par = (s, t) => ({tx: s.target[0], ty: s.target[1], tz: s.target[2], az: s.az + s.drift * (t - s.t0), el: s.el, dist: s.dist, fov: s.fov});
  const mezcla = (a, b, k) => { const d = ((b.az - a.az) % 360 + 540) % 360 - 180; return {tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), tz: lerp(a.tz, b.tz, k), az: a.az + d * k, el: lerp(a.el, b.el, k), dist: lerp(a.dist, b.dist, k), fov: lerp(a.fov, b.fov, k)}; };
  function camParams(t) { let i = 0; while (i < SEGS.length - 1 && t >= SEGS[i + 1].t0) i++; const cur = par(SEGS[i].s, t);
    if (i < SEGS.length - 1 && t > SEGS[i + 1].t0 - WH) return mezcla(cur, par(SEGS[i + 1].s, t), expoIO(seg(t, SEGS[i + 1].t0 - WH, SEGS[i + 1].t0 + WH)));
    if (i > 0 && t < SEGS[i].t0 + WH) return mezcla(par(SEGS[i - 1].s, t), cur, expoIO(seg(t, SEGS[i].t0 - WH, SEGS[i].t0 + WH)));
    return cur; }
  function ponerCam(cm, p) { const a = p.az * D2R, e = p.el * D2R; cm.position.set(p.tx + Math.sin(a) * Math.cos(e) * p.dist, p.ty + Math.sin(e) * p.dist, p.tz + Math.cos(a) * Math.cos(e) * p.dist);
    cm.lookAt(p.tx, p.ty, p.tz); if (Math.abs(cm.fov - p.fov) > 1e-4) { cm.fov = p.fov; cm.updateProjectionMatrix(); } cm.updateMatrixWorld(); }
  const camPrev = new THREE.PerspectiveCamera(FOV0, 1080 / 1920, .05, 400);
  // tramos con objeto (el pedestal sube una vez y baja al volver al auto)
  const TRAMOS = []; B.forEach(b => { if (b.objeto === 'auto') return; const u = TRAMOS[TRAMOS.length - 1]; if (u && Math.abs(u.s1 - b.t) < .01) u.s1 = b.te; else TRAMOS.push({s0: b.t, s1: b.te}); });
  const pedAlto = t => TRAMOS.reduce((m, r) => Math.max(m, E.out3(seg(t, r.s0 - .32, r.s0 + .25)) * (1 - E.in3(seg(t, r.s1 - .12, r.s1 + .3)))), 0);
  const apagonDur = b => Math.max(.5, Math.min(1.6, b.te - b.t - .35));

  // ── contenido de la pared LED: gancho, textos, cierre tal cual y vuelta al gancho ──
  const CONT = [{t: -9, txt: plan.gancho, tipo: 'gancho'}];
  const ledDe = b => b.tipo === 'gancho' ? {txt: plan.gancho, tipo: 'gancho'} : b.tipo === 'cierre' ? {txt: plan.cierre, tipo: 'cierre'} : {txt: b.texto || plan.gancho, tipo: 'texto'};
  B.forEach((b, i) => { const c = ledDe(b); const prev = CONT[CONT.length - 1]; const odo = (primerPaso >= 0 && i >= primerPaso && b.t < tCierre && c.tipo === 'texto') || (b.efecto === 'cuenta' && c.tipo === 'texto');
    if (prev.txt === c.txt && prev.tipo === c.tipo && !!prev.odo === odo) return; CONT.push({t: b.t, ...c, odo}); });
  if (!B.some(b => b.tipo === 'cierre') && ultimo.objeto !== 'auto') CONT.push({t: tHero, txt: plan.cierre, tipo: 'cierre'});
  if (CONT[CONT.length - 1].tipo !== 'gancho') CONT.push({t: T - .44, txt: plan.gancho, tipo: 'gancho'});
  CONT.forEach((c, i) => { c.key = i === CONT.length - 1 && c.tipo === 'gancho' ? 'g0' : (i === 0 ? 'g0' : 'c' + i); });
  const odoTotal = plan.contador || Math.max(1, ...B.filter(b => b.efecto === 'cuenta').map(b => +((b.texto.match(/\d+/) || [b.i + 1])[0])));
  function tokens(c) { const s = (c.tipo === 'cierre' ? String(c.txt) : String(c.txt).toLocaleUpperCase('es')).trim(), out = [];
    const push = (txt, col) => txt.split(/\s+/).filter(Boolean).forEach(w => out.push({t: w, c: col})); let m;
    if ((m = s.match(/^(.*»)\s*(.+)$/))) { push(m[1], '#ffffff'); push(m[2], TEXTO); return out; }
    if ((m = s.match(/^(.+?[.:?!])\s+(.+)$/))) { push(m[1], '#ffffff'); push(m[2], TEXTO); return out; }
    const ws = s.split(/\s+/).filter(Boolean); ws.forEach((w, i) => out.push({t: w, c: i === ws.length - 1 && ws.length > 1 ? TEXTO : '#ffffff'})); return out; }
  function fuenteA(x, fs) { x.font = `800 ${fs}px Archivo`; try { x.fontStretch = 'semi-expanded'; } catch (e) {} x.letterSpacing = `${(-fs * .01).toFixed(1)}px`; }
  function dibujarLED(tx, c) { const x = tx.userData.ctx; x.clearRect(0, 0, CW, CH); x.fillStyle = '#000'; x.fillRect(0, 0, CW, CH);
    const y0 = c.odo ? CH * .23 : CH * .04, y1 = CH * .97;
    if (c.odo) { x.textBaseline = 'middle'; x.font = '700 70px "Plus Jakarta Sans"'; x.letterSpacing = '4px'; x.fillStyle = '#8fb6e0'; x.textAlign = 'right'; x.fillText('PASO', CW * .608, CH * .115);
      fuenteA(x, 128); x.textAlign = 'left'; x.fillStyle = '#ffffff'; x.fillText('/' + String(odoTotal).padStart(2, '0'), CW * .79, CH * .12); }
    const tk = tokens(c), maxW = CW * .92, maxH = y1 - y0; let fs = 280, lines = [];
    const ancho = l => x.measureText(l.map(q => q.t).join(' ')).width;
    for (; fs >= 90; fs -= 6) { fuenteA(x, fs); lines = []; let cur = [];
      for (const q of tk) { const pr = [...cur, q]; if (cur.length && ancho(pr) > maxW) { lines.push(cur); cur = [q]; } else cur = pr; } if (cur.length) lines.push(cur);
      if (lines.every(l => ancho(l) <= maxW) && lines.length <= 3 && lines.length * fs * 1.02 <= maxH) break; }
    const lh = fs * 1.02; let yy = y0 + (maxH - lines.length * lh) / 2 + lh / 2; x.textBaseline = 'middle'; x.textAlign = 'left';
    for (const l of lines) { let xx = (CW - ancho(l)) / 2; for (const q of l) { x.shadowColor = 'rgba(32,124,207,.95)'; x.shadowBlur = fs * .22; x.fillStyle = q.c; x.fillText(q.t, xx, yy); x.shadowBlur = 0; x.fillText(q.t, xx, yy); xx += x.measureText(q.t + ' ').width; } yy += lh; }
    x.letterSpacing = '0px'; tx.needsUpdate = true; tx.userData.key = c.key; }
  const rayo = V3();
  function ventana(py, wPx, hPx) { rayo.set(0, 1 - 2 * py, .5).unproject(cam).sub(cam.position).normalize();
    const ox = cam.position.x, oz = cam.position.z, dx = rayo.x, dz = rayo.z, a = dx * dx + dz * dz, b = 2 * (ox * dx + oz * dz), c = ox * ox + oz * oz - RW * RW;
    const s = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a); const qx = ox + dx * s, qy = cam.position.y + rayo.y * s, qz = oz + dz * s;
    const u = pxu(s * rayo.dot(camF)), cosI = Math.max(.35, Math.abs((dx * qx + dz * qz) / (Math.sqrt(a) * RW)));
    LU.uWin.value.set(Math.atan2(qx, qz), qy, wPx / u / cosI / 2 / RW, hPx / u / 2); }
  const odoVal = t => B.reduce((v, b) => v + (b.paso ? E.outBack(seg(t, b.t + .1, b.t + .55), 1.4) : 0), 0);

  // ── sonido ───────────────────────────────────────────────────────────────
  const ev = []; const sfx = (t, n, v = 1) => { if (t >= 0 && t < T) ev.push([+t.toFixed(3), n, v]); };
  sfx(.02, 'foco', .4);
  B.forEach(b => { const u0 = b.t; sfx(u0 - .2, 'whoosh', .4);
    switch (b.efecto) {
      case 'golpe': sfx(u0, 'boom', .9); break; case 'caida': sfx(u0 + .38, 'thud', 1); break; case 'rebote': sfx(u0, 'pop', .9); break;
      case 'giro': sfx(u0, 'whoosh_largo', .6); break; case 'tachar': sfx(u0 + .32, 'rasgu', .9); break; case 'sello': sfx(u0 + .42, 'sello', 1); sfx(u0 + .44, 'thud', .45); break;
      case 'flash': sfx(u0, 'foto', 1); break; case 'apagon': sfx(u0, 'foco', .9); sfx(u0 + apagonDur(b), 'foco', .6); break;
      case 'lupa': sfx(u0 + .05, 'whoosh', .45); sfx(u0 + .45, 'vidrio', .4); break; case 'despiece': sfx(u0 + .05, 'flap', .7); sfx(Math.max(u0 + .8, b.te - .55), 'whoosh', .4); break;
      case 'barrido': sfx(u0 + .05, 'whoosh_largo', .7); break; case 'cuenta': sfx(u0 + .1, 'flap_largo', .7); break; }
    if (b.paso) sfx(u0 + .12, 'tick', .7); });
  CONT.forEach((c, i) => { if (i > 0) sfx(c.t, 'click', .35); });
  sfx(tCierre - 1.5, 'riser', .4); sfx(tCierre + .05, 'ding', .55);

  // ── interfaz: logo y karaoke de marca ───────────────────────────────────
  css(`.autos{font-family:'Plus Jakarta Sans';font-weight:700;font-size:66px;color:#fff;-webkit-text-stroke:10px ${TINTA};paint-order:stroke fill;letter-spacing:-.3px;line-height:1.16}
    .autos span.on{font-family:Archivo;font-weight:800;font-stretch:112%;text-transform:uppercase;color:${TEXTO};font-size:76px;letter-spacing:-.8px}
    .logo.la{gap:16px} .logo.la img{height:64px;filter:drop-shadow(0 4px 14px rgba(32,124,207,.45))} .logo.la span{font:700 30px Archivo;color:#fff;letter-spacing:.2px}`);
  logo('../autos.png', 'Automotores Kocos', 'la');
  const kar = karaoke(P, {max: 3, clase: 'autos'});
  const estela = new ShaderPass(ESTELA); estela.enabled = false; M.comp.insertPass(estela, 1);

  // ── cuadro a cuadro ─────────────────────────────────────────────────────
  const centroAuto = V3(), sujeto = V3();
  function update(t) {
    // efectos globales del golpe
    let flash = 0, luz = 1, punch = 0, shake = 0, onda = 0, ondaEnPed = false, tach = 0, barr = 0, bOff = 0, bAuto = true, susp = 0, altoAuto = 0, giroAct = 0;
    let yaw = .14 * Math.sin(TAU * t / T), despU = null, despB = null, lupaB = null, lupaK = 0, cuentaB = null;
    for (const b of B) { const u = t - b.t, D = b.te - b.t, esAuto = b.objeto === 'auto'; if (u < -.5 || u > D + 1.6) continue;
      // barrido corto de transición sobre el sujeto que entra
      { const k = seg(u, -.12, .6); if (k > 0 && k < 1 && b.efecto !== 'barrido') { const v = Math.pow(Math.sin(Math.PI * k), .7) * .75; if (v > barr) { barr = v; bOff = lerp(-1, 1, k); bAuto = esAuto; } } }
      switch (b.efecto) {
        case 'flash': if (u >= 0) flash += .8 * Math.exp(-u / .07) + (u > .13 ? .5 * Math.exp(-(u - .13) / .07) : 0); break;
        case 'golpe': if (u >= 0) { punch = Math.max(punch, E.outExpo(seg(u, 0, .1)) * (1 - E.io3(seg(u, .2, .9)))); flash += .28 * Math.exp(-u / .06); shake += pulso(t, b.t, .28) * .9; if (esAuto) susp += -.07 * Math.exp(-u / .3) * Math.sin(u * 16); } break;
        case 'apagon': { const d = apagonDur(b); luz = Math.min(luz, 1 - .94 * seg(u, 0, .07) * (1 - seg(u, d, d + .3))); break; }
        case 'barrido': { const k = seg(u, .06, 1.05); if (k > 0 && k < 1) { const v = Math.pow(Math.sin(Math.PI * k), .6) * 2.4; if (v > barr) { barr = v; bOff = lerp(-1, 1, E.io2(k)); bAuto = esAuto; } } break; }
        case 'sello': { const ti = b.t + .42; if (t >= ti) { onda = Math.max(onda, seg(t, ti, ti + 1.1)); ondaEnPed = !esAuto; flash += .22 * Math.exp(-(t - ti) / .06); shake += pulso(t, ti, .25) * .7;
          if (esAuto) susp += -.06 * Math.exp(-(t - ti) / .25) * Math.sin((t - ti) * 18); } break; }
        case 'tachar': if (u > .3 && u < D) tach = Math.max(tach, E.io2(seg(u, .32, .62))); break;
        case 'giro': if (esAuto && u >= 0) { yaw += TAU * E.outExpo(seg(u, 0, 1.5)); giroAct = Math.max(giroAct, 1 - seg(u, .6, 1.5)); } break;
        case 'caida': if (esAuto) { if (u > -.3 && u < 0) altoAuto = 3.4 * E.io2(seg(u, -.3, -.05)); else if (u >= 0 && u < .42) altoAuto = 3.4 * (1 - E.in3(seg(u, 0, .42)));
          if (u >= .42) susp += -.1 * Math.exp(-(u - .42) / .22) * Math.cos((u - .42) * 20); shake += pulso(t, b.t + .42, .3); } break;
        case 'rebote': if (esAuto && u >= 0) susp += -.09 * Math.exp(-u / .35) * Math.sin(u * 14); break;
        case 'despiece': if (esAuto && u > -.1 && u < D) { despU = u; despB = b; } break;
        case 'lupa': if (u > -.05 && u < D) { const k = E.out3(seg(u, .02, .45)) * (1 - E.in3(seg(u, D - .28, D - .02))); if (k > lupaK) { lupaK = k; lupaB = b; } } break;
        case 'cuenta': if (u >= 0 && u < D) cuentaB = b; break; }
    }
    const fl = seg(t, tCierre - .05, tCierre + .4) * (1 - seg(t, T - .5, T - .12));     // faros del cierre
    luz *= 1 - .35 * fl;

    // cámara
    const cp = camParams(t); cp.fov *= 1 - .14 * punch; ponerCam(cam, cp);
    const hm = .012; cam.position.x += Math.sin(TAU * t / T * 3 + 1.3) * hm + ruido(t * 31, 3) * shake * .05; cam.position.y += Math.sin(TAU * t / T * 2 + .4) * hm + ruido(t * 29, 4) * shake * .05;
    cam.updateMatrixWorld(); camR.setFromMatrixColumn(cam.matrixWorld, 0); camU.setFromMatrixColumn(cam.matrixWorld, 1); cam.getWorldDirection(camF);

    // auto
    auto.rotation.y = yaw; auto.position.y = altoAuto; carro.position.y = susp; carro.rotation.z = susp * .5;
    sombra.material.opacity = .92 * clamp(1 - altoAuto / 2.2);
    DESP.forEach((p, i) => { let k = 0; if (despB) { const D = despB.te - despB.t, sal = Math.max(.8, D - .6); k = E.out3(seg(despU, .05 + i * .06, .6 + i * .06)) * (1 - E.io3(seg(despU, sal + i * .03, sal + .45 + i * .03))); }
      p.o.position.copy(p.base).addScaledVector(p.d, k); });
    faroMat.emissiveIntensity = 2.6 + 5 * fl + 2 * flash; faroMat.emissive.copy(FARO).lerp(ACC, fl * .85); colaMat.emissiveIntensity = 1.4 + .8 * fl;
    auto.updateMatrixWorld(true);

    // luces
    scene.environmentIntensity = .1 + .9 * luz + 1.2 * flash;
    key.intensity = 1.3 * luz + 8 * flash; rimA.intensity = 2.2 * luz; rimB.intensity = 1.5 * luz;
    M.bloom.strength = .55 + .5 * flash; M.cine.uniforms.flash.value = Math.min(.6, flash * .55);

    // pedestal y objetos
    const up = pedAlto(t); pedCuerpo.position.y = -1.14 * (1 - up); pedCuerpo.visible = up > .001; ped.rotation.y = cp.az * D2R;
    let bObj = null; for (const b of B) if (b.obj && t >= b.t - .02 && t < b.te + .25) bObj = (!bObj || b.t <= t) ? b : bObj;
    grabar(bObj ? (bObj.paso ? 'PASO ' + bObj.paso : bObj.tipo === 'gancho' ? bObj.texto.toLocaleUpperCase('es') : '0 KM') : '');
    foco.intensity = 90 * up; foco.position.set(PED.x + Math.sin(cp.az * D2R) * 2.2, 6.2, PED.z + Math.cos(cp.az * D2R) * 2.2); foco.target.position.set(PED.x, 1.3, PED.z); foco.target.updateMatrixWorld();
    sello.visible = false; laser.visible = laserHalo.visible = false; marca.visible = false;
    for (const b of B) { if (!b.obj) continue; const g = b.obj, ud = g.userData, u = t - b.t, D = b.te - b.t;
      const vis = u > -.02 && u < D + .25; g.visible = vis; if (!vis) { ud.partes.forEach(p => p.m.position.copy(p.base)); continue; }
      let s = 1, y = .14 + .025 * Math.sin(t * 2.1 + b.i), ry = .22 * Math.sin(u * .9 + b.i), sx = 1, sy = 1;
      switch (b.entrada) {
        case 'rebote': s = resorte(seg(u, 0, .8), 2.4, 4.2); y -= .3 * (1 - E.outBack(seg(u, 0, .45))); break;
        case 'caida': { y += 2.6 * (1 - E.in3(seg(u, 0, .36))); const q = u - .36; if (q > 0) { const a = Math.exp(-q / .12) * Math.sin(q * 30) * .12; sy = 1 - a; sx = 1 + a * .6; } break; }
        case 'golpe': s = lerp(1.5, 1, E.outExpo(seg(u, 0, .22))); break;
        case 'giro': ry += TAU * 2 * E.outExpo(seg(u, 0, 1.2)); s = E.out3(seg(u, 0, .3)); break;
        case 'sube': y -= .75 * (1 - E.out3(seg(u, 0, .55))); s = lerp(.6, 1, E.out3(seg(u, 0, .55))); break;
        case 'baja': y += 1.3 * (1 - E.out3(seg(u, 0, .6))); break;
        default: s = E.outBack(seg(u, 0, .5)); ry += Math.PI * (1 - E.out3(seg(u, 0, .7))); }
      if (b.efecto === 'sello') { const q = t - (b.t + .42); if (q > 0) { const a = Math.exp(-q / .1) * Math.sin(q * 34) * .1; sy *= 1 - a; sx *= 1 + a * .5; } }
      const sal = E.in3(seg(u, D - .04, D + .22)); s *= 1 - sal; y -= sal * .5;
      g.position.y = y; g.rotation.set(0, ry, 0); g.scale.set(Math.max(.001, s * sx), Math.max(.001, s * sy), Math.max(.001, s * sx));
      // despiece del objeto
      const kd = b.efecto === 'despiece' ? E.out3(seg(u, .1, .65)) * (1 - E.io3(seg(u, Math.max(.8, D - .6), Math.max(.8, D - .6) + .45))) : 0;
      ud.partes.forEach((p, i) => p.m.position.copy(p.base).addScaledVector(p.dir, clamp(kd * 1.3 - i * .08)));
      if (ud.aguja) ud.aguja.rotation.z = -(Math.PI * .75 + Math.PI * 1.5 * (.08 + (b.efecto === 'cuenta' ? .85 : .5) * E.out3(seg(u, .15, 1.2)) + .015 * Math.sin(t * 9))) - Math.PI / 2;
      if (ud.gira) ud.gira.rotation.z = -(t - b.t) * 1.6 - (b.efecto === 'giro' ? TAU * 3 * E.outExpo(seg(u, 0, 1.4)) : 0);
      if (ud.grieta) ud.grieta.uniforms.uProg.value = .14 + .86 * (b.efecto === 'golpe' ? E.outExpo(seg(u, 0, .35)) : b.efecto === 'lupa' ? E.io2(seg(u, .3, 1.6)) : b.efecto === 'flash' ? E.outExpo(seg(u, .05, .5)) : .5 * seg(u, .2, 1.4));
      if (u >= 0 && u < D) {   // efectos que se dibujan sobre el objeto
        g.updateMatrixWorld(true);
        if (b.efecto === 'sello') { const ti = b.t + .42, q = t - ti, top = ud.alto * s + y; const baja = q < 0 ? E.in3(seg(t, ti - .3, ti)) : 1, sube = q > .1 ? E.in3(seg(q, .1, .45)) : 0;
          sello.visible = t > ti - .3 && q < .45; sello.position.set(PED.x, pedCuerpo.position.y + 1.05 + top + 1.4 * (1 - baja) + 1.6 * sube - (q > 0 && q < .1 ? .03 : 0), PED.z); sello.scale.setScalar(1 - .6 * sube);
          if (q > 0) { marca.visible = q < .9; const k = seg(q, 0, .9); marca.scale.setScalar(.8 + .9 * E.out3(k)); marca.material.opacity = 1 - k; } }
        if (b.efecto === 'tachar' && u > .3) { const k = E.io2(seg(u, .32, .62)), fade = 1 - seg(u, .9, 1.3); g.getWorldPosition(sujeto); sujeto.y += ud.alto * .5; tA.copy(sujeto).addScaledVector(camF, -.6);
          const L = 1.5, d = profundidad(tA), th = 7 / pxu(d); laser.visible = laserHalo.visible = fade > .01;
          for (const [m, k2] of [[laser, 1], [laserHalo, 4]]) { m.position.copy(tA).addScaledVector(camR, -L / 2 * Math.cos(.42)).addScaledVector(camU, -L / 2 * Math.sin(.42)); m.quaternion.copy(cam.quaternion); m.rotateZ(.42); m.scale.set(L * k, th * k2, 1); }
          laser.material.opacity = fade; laserHalo.material.opacity = .5 * fade; }
      }
    }
    // barrido: tira de luz frente al sujeto
    if (barr > .001) { if (bAuto) sujeto.set(0, .75, 0); else sujeto.set(PED.x, pedCuerpo.position.y + 1.45, PED.z);
      UB.uBC.value.copy(sujeto); tA.set(cam.position.x - sujeto.x, 0, cam.position.z - sujeto.z).normalize(); UB.uBN.value.copy(tA); UB.uBT.value.set(tA.z, 0, -tA.x);
      UB.uBDL.value = bAuto ? 7 : 2.6; UB.uBAnch.value = bAuto ? .5 : .2; UB.uBOff.value = bOff * (bAuto ? 7.5 : 1.7); }
    UB.uBarr.value = barr;

    // rótulos numerados (despiece del auto o del objeto)
    rotulos.forEach(r => { r.m.visible = r.guia.m.visible = r.guia.p.visible = false; });
    const listas = [];
    if (despB) { const sC = Math.sign(cam.position.clone().sub(auto.position).applyAxisAngle(YUP, -yaw).z) || 1;
      listas.push({b: despB, u: despU, items: [['CARROCERÍA', carro, V3(.1, .62, sC * .9)], ['CRISTALES', cabina, V3(-.5, 1.48, 0)], ['RUEDAS', ruedas.find(w => w.x === XF && w.s === sC).g, V3(0, 0, .14)], ['ÓPTICAS', frente, V3(frenteX(0, .8), .8, 0)]]}); }
    for (const b of B) if (b.obj && b.efecto === 'despiece' && t >= b.t && t < b.te) listas.push({b, u: t - b.t, items: b.obj.userData.partes.slice(0, 4).map(p => [p.nombre, p.m, V3()])});
    for (const L of listas) { const D = L.b.te - L.b.t, fin = 1 - seg(L.u, Math.max(.8, D - .6) - .2, Math.max(.8, D - .6) + .1);
      const anc = L.items.map(([n, o, loc]) => { o.updateMatrixWorld(true); const w = o.localToWorld(loc.clone()); return {n, w, x: tB.copy(w).project(cam).x, y: tB.y}; });
      const ord = anc.map((a, i) => i).sort((i, j) => anc[i].x - anc[j].x); const izq = ord.slice(0, Math.ceil(ord.length / 2)).sort((i, j) => anc[j].y - anc[i].y), der = ord.slice(Math.ceil(ord.length / 2)).sort((i, j) => anc[j].y - anc[i].y);
      const slot = {}; izq.forEach((i, k) => slot[i] = [SLOTS[0], SLOTS[2]][k] || SLOTS[2]); der.forEach((i, k) => slot[i] = [SLOTS[1], SLOTS[3]][k] || SLOTS[3]);
      anc.forEach((a, i) => { const k = seg(L.u, .35 + i * .12, .7 + i * .12) * fin; ponerRotulo(rotulo(i + 1, a.n), a.w, slot[i][0], slot[i][1], k); }); }

    // lupa con segunda vista
    lupa.visible = false;
    if (lupaB && lupaK > .002) { const ob = lupaB.obj; let rL;
      if (ob) { ob.updateMatrixWorld(true); ob.localToWorld(sujeto.copy(ob.userData.det)); rL = .27; } else { const w = ruedas.find(q => q.x === XF && q.s === (Math.sign(cam.position.clone().sub(auto.position).applyAxisAngle(YUP, -yaw).z) || 1)); w.g.updateMatrixWorld(true); w.g.localToWorld(sujeto.set(-.1, .08, .12)); rL = .4; }
      tA.copy(cam.position).sub(sujeto).normalize(); const cen = tB.copy(sujeto).addScaledVector(tA, ob ? .5 : 1.2).addScaledVector(camR, .7 * (1 - lupaK)).addScaledVector(camU, -.5 * (1 - lupaK));
      lupa.position.copy(cen); lupa.quaternion.copy(cam.quaternion); lupa.scale.setScalar(rL / .272 * Math.max(.001, lupaK)); lupa.visible = true;
      const d = cam.position.distanceTo(cen); camL.position.copy(cam.position); camL.lookAt(cen); camL.fov = 2 * Math.atan(rL * lupaK / d) / D2R / 2.4; camL.updateProjectionMatrix(); camL.updateMatrixWorld();
      const rt = rotulo(null, (lupaB.texto || plan.palabra || '').toLocaleUpperCase('es').split(/\s+/).filter(Boolean).slice(-2).join(' ') || 'DETALLE');
      tC.copy(cen).addScaledVector(camR, rL * lupaK * .7).addScaledVector(camU, rL * lupaK * .7); ponerRotulo(rt, tC, .5, -.2, seg(t - lupaB.t, .5, .85) * lupaK);
      // render de la segunda vista sin la lupa, los rótulos ni el piso
      const ocultos = [lupa, suelo, laser, laserHalo]; rotulos.forEach(r => ocultos.push(r.m, r.guia.m, r.guia.p)); const prev = ocultos.map(o => o.visible); ocultos.forEach(o => o.visible = false);
      R.setRenderTarget(rtL); R.clear(); R.render(scene, camL); R.setRenderTarget(null); ocultos.forEach((o, i) => o.visible = prev[i]); }

    // pared LED
    let ci = 0; for (let i = 0; i < CONT.length; i++) if (t >= CONT[i].t) ci = i; const cur = CONT[ci], prv = CONT[Math.max(0, ci - 1)];
    let tc = [ledA, ledB].find(x => x.userData.key === cur.key); let tp = [ledA, ledB].find(x => x.userData.key === prv.key && x !== tc);
    if (!tc) { tc = [ledA, ledB].find(x => x !== tp); dibujarLED(tc, cur); } if (!tp) { tp = tc === ledA ? ledB : ledA; if (tp.userData.key !== prv.key) dibujarLED(tp, prv); }
    LU.uA.value = tp; LU.uB.value = tc; LU.uMix.value = ci === 0 ? 1 : E.io2(seg(t, cur.t, cur.t + .32));
    ventana(.275, 920, 440); LU.uGlow.value = LU.uWin.value.x; LU.uLuz.value = .22 + .78 * luz + flash * .3; LU.uFase.value = t / T; LU.uTach.value = tach;
    let ov = odoVal(t); if (cuentaB) ov = (cuentaB.paso || odoTotal) - 30 * (1 - E.outExpo(seg(t - cuentaB.t, .1, 1.3)));
    LU.uOdoV.value = Math.max(0, ov); LU.uOdoOn.value = cur.odo ? (prv.odo && ci > 0 ? 1 : E.out3(seg(t, cur.t + .15, cur.t + .45))) : 0;

    // piso
    SU.uLuz.value = .25 + .75 * luz + flash; SU.uGiro.value = yaw; SU.uAnillo.value = (.7 + .3 * luz) * (1 + 1.5 * giroAct) + fl * .6; SU.uPed.value.set(PED.x, PED.z, up);
    SU.uOnda.value = onda < 1 ? onda : 0; if (ondaEnPed) SU.uOndaC.value.set(PED.x, PED.z); else SU.uOndaC.value.set(0, 0);

    // estela de cámara en los látigos
    const pp = camParams(t - 1 / 30); ponerCam(camPrev, pp); tA.copy(camF).multiplyScalar(40).add(cam.position).project(camPrev); tB.set(cp.tx, cp.ty, cp.tz).project(camPrev);
    const dx = Math.abs(tA.x) > Math.abs(tB.x) ? tA.x : tB.x, dy = Math.abs(tA.y) > Math.abs(tB.y) ? tA.y : tB.y, mag = Math.hypot(dx, dy);
    estela.enabled = mag > .02; if (estela.enabled) { const k = Math.min(1, .12 / mag) * .5; estela.uniforms.dir.value.set(dx * k, dy * k); }

    kar(t); M.cine.uniforms.t.value = t * 11.7; M.comp.render();
  }
  return {update, total: T, eventos: ev};
}
