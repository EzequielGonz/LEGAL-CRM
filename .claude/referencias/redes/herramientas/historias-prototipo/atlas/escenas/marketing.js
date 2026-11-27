// Kocos Marketing · «Salidas»: cartel de aeropuerto con paletas que giran (split-flap) en un hall cálido.
// Travertino y nogal, luz de ventanal con haces y polvo, granito pulido que refleja, globos opalinos colgantes y un
// pedestal de travertino con tapa de nogal donde entran los objetos de cada golpe. Lo maneja el plan (planes/<id>.json):
//  · el gancho está escrito en las paletas grandes desde el cuadro 1;
//  · cada golpe escribe su fila con paletas 3D que caen de verdad (instancias + atlas de letras), entra su objeto y corre su efecto;
//  · contador: paleta naranja numerada al principio de la fila y luz de estado;
//  · cierre: plan.cierre tal cual en las paletas grandes; después el cartel se reinicia y vuelve al cuadro 1 (loop);
//  · plan.id es la semilla: lado del ventanal, encuadres, entradas, salidas, revestimiento y objeto héroe.
import {motor, karaoke, logo, css, lienzo, THREE, E, seg, lerp, clamp, ruido, pulso, hash} from '../base.js';
import {Reflector} from 'three/addons/objects/Reflector.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

const CREMA = '#FFE7D0', TINTA = '#1B1B1B', CARBON = '#323232', ARENA = '#C9AC93', NARANJA = '#FC6E20';
const GL = [' ', ...'ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ0123456789.,:;!?¡¿«»-/()%+&@#$"\'', '→', '✓', '•'];
const GI = new Map(GL.map((c, i) => [c, i])), NG = GL.length, D0 = GI.get('0'), D9 = GI.get('9');
const EQUIV = {'“': '"', '”': '"', '’': "'", '‘': "'", '…': '.', '–': '-', '—': '-', 'À': 'A', 'È': 'E', 'Ì': 'I', 'Ò': 'O', 'Ù': 'U', 'Ç': 'C', 'Ä': 'A', 'Ë': 'E', 'Ï': 'I', 'Ö': 'O'};
const gid = c => { const u = c.toUpperCase(); return GI.get(u) ?? GI.get(EQUIV[u]) ?? 0; };
function partir(txt, ancho, max = 9) {
  const L = []; let cur = '';
  for (let p of String(txt || '').trim().split(/\s+/).filter(Boolean)) {
    while (p.length > ancho) { if (cur) { L.push(cur); cur = ''; } L.push(p.slice(0, ancho)); p = p.slice(ancho); }
    if (!cur) cur = p; else if (cur.length + 1 + p.length <= ancho) cur += ' ' + p; else { L.push(cur); cur = p; }
  }
  if (cur) L.push(cur); return L.slice(0, max);
}

export default async function (datos, plan) {
  const PL = plan || {};
  const P = datos.palabras, T = datos.total;
  const M = await motor({fondo: 0xE4D3BE, fov: 36, exposicion: 1.0, entorno: .42, bloom: {fuerza: .3, radio: .42, umbral: 1.05},
    cine: {grano: .03, vineta: .3, ca: .0011, lift: [.014, .01, .006], tinte: [1, .985, .96]}});
  const {scene, cam} = M;
  const ev = []; const sfx = (t, n, v = 1) => { if (t >= 0 && t < T - .05) ev.push([+t.toFixed(3), n, +v.toFixed(2)]); };
  const golpes = []; // [t, fuerza] para el temblor de cámara

  // ── semilla del plan ──────────────────────────────────────────────────────
  const sid = String(PL.id || datos.id || 'marketing'); let s0 = 11; for (const ch of sid) s0 = (s0 * 131 + ch.charCodeAt(0)) % 1000003;
  const rnd = k => hash(s0 * .01371 + k * 7.317);
  const lado = rnd(1) < .5 ? -1 : 1, yaw0 = (rnd(2) - .5) * .2, alto0 = (rnd(3) - .5) * .5, xP = .68 + (rnd(4) - .5) * .14;
  const variante = Math.floor(rnd(5) * 3), estiloEnt = Math.floor(rnd(6) * 3);
  const ciclo = Math.max(1, Math.round(T / 7)), fase = t => t / T * Math.PI * 2 * ciclo; // todo lo «vivo» es periódico en T (loop)

  // ── plan: golpes, tiempos y textos ─────────────────────────────────────────
  const gancho = PL.gancho || datos.gancho || '';
  const cierre = PL.cierre || 'Escribinos por WhatsApp';
  const contador = +PL.contador || 0;
  const nrm = s => String(s).toLowerCase().normalize('NFC').replace(/[^a-záéíóúüñ0-9]/g, '');
  function tw(w, n = 0) { const k = nrm(w); if (!k) return null; let l = P.filter(p => nrm(p.w) === k);
    if (!l.length) l = P.filter(p => nrm(p.w).startsWith(k) || (k.startsWith(nrm(p.w)) && nrm(p.w).length > 3)); return l.length ? (l[n] || l[l.length - 1]).t : null; }
  const vozFin = datos.voz_fin || (P[P.length - 1].t + P[P.length - 1].d);
  const tR = T - 1.2; // el cartel se reinicia: vuelve al cuadro 1
  let beats = (Array.isArray(PL.beats) ? PL.beats : []).map(b => ({...b}));
  if (!beats.length) beats = [{palabra: P[0].w, n: 0, tipo: 'gancho', objeto: 'reloj_arena', texto: gancho, efecto: 'golpe'}];
  beats.forEach((b, i) => { b.t = tw(b.palabra, b.n || 0); if (b.t == null) b.t = i ? beats[i - 1].t + 1.8 : P[0].t;
    if (i && b.t < beats[i - 1].t + .75) b.t = beats[i - 1].t + .75; b.efecto = String(b.efecto || '').toLowerCase(); b.objeto = String(b.objeto || '').toLowerCase(); b.tipo = b.tipo || 'dato'; });
  beats = beats.filter(b => b.t < tR - .6);
  const NB = beats.length;
  const iC = beats.findIndex(b => b.tipo === 'cierre');
  let tC = iC >= 0 ? beats[iC].t + .6 : Math.max(beats[NB - 1].t + 1.4, vozFin - 1.8);
  tC = Math.min(tC, tR - 1.25);

  // ── cartel: medidas ───────────────────────────────────────────────────────
  const IW = 3.51, HEAD = .3, DIV = .14, MARG = .1, LT = 20, LP = IW / 22, LH = .27, zB = .34, x0 = -IW / 2;
  let FC = 12, gL, cL; for (const fc of [12, 13, 14, 15, 16, 17, 18]) { FC = fc; gL = partir(gancho, fc, 6); cL = partir(cierre, fc, 6); if (gL.length <= 3 && cL.length <= 3) break; }
  if (gL.length > 3) for (const fc of [13, 14, 15, 16, 17, 18]) { FC = fc; gL = partir(gancho, fc, 6); cL = partir(cierre, fc, 6); if (gL.length <= 4 && cL.length <= 4) break; }
  const FP = IW / FC, FH = FP * 1.45, RF = clamp(Math.max(gL.length, cL.length, 2), 2, 4);
  const lineas = []; let np = 0;
  beats.forEach((b, i) => { const ls = partir(b.texto || '', LT, 2); if (!ls.length) ls.push(''); if (b.tipo === 'paso') np++;
    b.num = contador > 0 && b.tipo === 'paso' ? np : 0; b.l0 = lineas.length; b.nl = ls.length; b.len = Math.max(...ls.map(s => s.length));
    ls.forEach((s, k) => lineas.push({s, num: k ? 0 : b.num, beat: i})); });
  const NV = clamp(lineas.length, 4, 6);
  beats.forEach(b => { b.ws = Math.max(0, b.l0 + b.nl - NV); b.fila = b.l0 - b.ws; });
  const yTop = 4.8, yF0 = yTop - HEAD, yL0 = yF0 - RF * FH - DIV, yBot = yL0 - NV * LH - MARG;
  const filaY = r => yL0 - LH * (r + .5);
  const zP = 3.7, hP = clamp(yBot - .3, 1.0, 1.45), hTop = hP + .06, OS = 1.24; // OS: escala de los objetos // pedestal: el objeto apoya en hTop

  // ── texturas dibujadas ────────────────────────────────────────────────────
  const travertino = lienzo(1024, 1024, (x, w, h) => {
    x.fillStyle = variante === 1 ? '#D4B593' : '#DCC4A6'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 150; i++) { const y0 = hash(i * 3.1 + 1) * h, a = .03 + hash(i * 5.7) * .08, claro = hash(i * 9.3) > .5;
      x.strokeStyle = claro ? `rgba(255,248,236,${a})` : `rgba(150,118,86,${a})`; x.lineWidth = 1 + hash(i * 2.2) * 5; x.beginPath();
      for (let k = 0; k <= 32; k++) { const xx = k / 32 * w, yy = y0 + Math.sin(k * .5 + i) * 5 + ruido(k * .3, i) * 7; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
    for (let i = 0; i < 1100; i++) { x.fillStyle = `rgba(118,92,66,${.07 + hash(i * 1.7) * .16})`; x.beginPath(); x.ellipse(hash(i * 3.3) * w, hash(i * 4.4) * h, 1 + hash(i * 5.5) * 4, .6 + hash(i * 6.6) * 1.3, 0, 0, 7); x.fill(); }
    x.fillStyle = 'rgba(105,82,60,.5)'; x.fillRect(0, h / 2 - 1, w, 3); x.fillRect(0, 0, w, 2); x.fillRect(w / 2 - 1, 0, 3, h); x.fillRect(0, 0, 2, h);
    x.fillStyle = 'rgba(255,250,240,.4)'; x.fillRect(0, h / 2 + 2, w, 1); x.fillRect(w / 2 + 2, 0, 1, h);
  });
  travertino.wrapS = travertino.wrapT = THREE.RepeatWrapping; travertino.repeat.set(18 / 3.4, 10 / 3.4);
  const terrazo = lienzo(1024, 1024, (x, w, h) => {
    x.fillStyle = '#E7D8C5'; x.fillRect(0, 0, w, h); const cols = ['#C9AC93', '#B59479', '#F7EFE4', '#8C7B6E', '#5D493D', '#D8C1A6', '#FC6E20'];
    for (let i = 0; i < 2800; i++) { const c = cols[Math.floor(hash(i * 1.3) * cols.length)]; if (c === '#FC6E20' && hash(i * 7.7) > .3) continue;
      x.fillStyle = c; x.globalAlpha = .5 + hash(i * 2.9) * .5; const cx = hash(i * 3.7) * w, cy = hash(i * 4.1) * h, r = 1.4 + Math.pow(hash(i * 5.3), 3) * 9, n = 5 + (i % 3);
      x.beginPath(); for (let k = 0; k < n; k++) { const an = k / n * 6.283 + hash(i + k), q = r * (.6 + hash(i * 9 + k) * .5); k ? x.lineTo(cx + Math.cos(an) * q, cy + Math.sin(an) * q) : x.moveTo(cx + Math.cos(an) * q, cy + Math.sin(an) * q); } x.fill(); }
    x.globalAlpha = 1; x.fillStyle = 'rgba(118,96,76,.35)'; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h);
  });
  terrazo.wrapS = terrazo.wrapT = THREE.RepeatWrapping; terrazo.repeat.set(16, 16);
  const nogalTx = lienzo(512, 512, (x, w, h) => { x.fillStyle = '#6A4935'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 170; i++) { const x0_ = hash(i * 2.3) * w; x.strokeStyle = `rgba(${hash(i) > .5 ? '38,22,12' : '160,118,84'},${.12 + hash(i * 4.4) * .2})`; x.lineWidth = .8 + hash(i * 6.1) * 2.5;
      x.beginPath(); for (let k = 0; k <= 24; k++) { const yy = k / 24 * h, xx = x0_ + Math.sin(k * .35 + i) * 5 + ruido(k * .2, i + 3) * 6; k ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); } });
  nogalTx.wrapS = nogalTx.wrapT = THREE.RepeatWrapping;
  const kraftTx = (marca) => lienzo(512, 512, (x, w, h) => { x.fillStyle = '#C49A6A'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { x.strokeStyle = `rgba(${hash(i) > .5 ? '90,62,34' : '235,205,160'},${.06 + hash(i * 3.1) * .12})`; x.lineWidth = 1; const a = hash(i * 1.1) * 6.28, cx = hash(i * 2.7) * w, cy = hash(i * 3.9) * h; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9); x.stroke(); }
    if (marca === 'tapa') { x.fillStyle = NARANJA; x.fillRect(0, h * .42, w, h * .16); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, h * .44, w, 4); }
    if (marca === 'frente') { x.fillStyle = NARANJA; x.fillRect(w * .42, 0, w * .16, h * .1); x.fillStyle = '#FFF6EA'; x.beginPath(); x.roundRect(w * .14, h * .36, w * .46, h * .34, 14); x.fill();
      x.fillStyle = TINTA; for (let k = 0; k < 4; k++) x.fillRect(w * .19, h * (.42 + k * .065), w * (.3 - k * .04), 7); x.fillStyle = NARANJA; x.beginPath(); x.arc(w * .53, h * .44, 13, 0, 7); x.fill();
      x.fillStyle = TINTA; for (let k = 0; k < 16; k++) x.fillRect(w * .66 + k * 7, h * .58, k % 3 ? 3 : 5, h * .1); } });
  const sombraTx = lienzo(128, 128, (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(40,24,10,.9)'); g.addColorStop(.45, 'rgba(40,24,10,.38)'); g.addColorStop(1, 'rgba(40,24,10,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); });
  const rectSuave = lienzo(256, 256, (x) => { x.filter = 'blur(18px)'; x.fillStyle = 'rgba(30,18,8,1)'; x.fillRect(40, 40, 176, 176); });
  const degradeV = lienzo(16, 256, (x) => { const g = x.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 16, 256); });
  const ventanaTx = lienzo(512, 512, (x) => { x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512); x.filter = 'blur(9px)'; x.fillStyle = '#fff';
    for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) x.fillRect(34 + c * 150, 40 + r * 222, 128, 196); });
  const hazTx = lienzo(64, 256, (x) => { const g = x.createLinearGradient(0, 0, 64, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    x.globalCompositeOperation = 'destination-in'; const v = x.createLinearGradient(0, 0, 0, 256); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(.25, 'rgba(0,0,0,1)'); v.addColorStop(.8, 'rgba(0,0,0,.7)'); v.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = v; x.fillRect(0, 0, 64, 256); });
  const puntoTx = lienzo(64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,244,224,1)'); g.addColorStop(1, 'rgba(255,244,224,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });

  // ── materiales ────────────────────────────────────────────────────────────
  const mk = {
    crema: () => new THREE.MeshPhysicalMaterial({color: '#F2D8BE', roughness: .34, clearcoat: .6, clearcoatRoughness: .25}),
    naranja: () => new THREE.MeshPhysicalMaterial({color: NARANJA, roughness: .3, clearcoat: .9, clearcoatRoughness: .12}),
    tinta: () => new THREE.MeshPhysicalMaterial({color: TINTA, roughness: .38, clearcoat: .6, clearcoatRoughness: .18}),
    carbon: () => new THREE.MeshStandardMaterial({color: CARBON, roughness: .5, metalness: .25}),
    laton: () => new THREE.MeshStandardMaterial({color: 0xC9A15A, metalness: 1, roughness: .26}),
    nogal: () => new THREE.MeshStandardMaterial({map: nogalTx, roughness: .46}),
    vidrio: () => new THREE.MeshPhysicalMaterial({color: 0xfff8f0, roughness: .04, transparent: true, opacity: .2, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 1.8}),
    arena: () => new THREE.MeshStandardMaterial({color: 0xE8954F, roughness: .92, side: THREE.DoubleSide}),
  };
  const RB = (w, h, d, r = .03, s = 3) => new RoundedBoxGeometry(w, h, d, s, r);
  const malla = (g, m, x = 0, y = 0, z = 0, padre = scene) => { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); padre.add(o); return o; };
  function rr(w, h, r) { const s = new THREE.Shape(); s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return s; }
  const extr = (sh, d, bv = .02, sg = 3) => { const g = new THREE.ExtrudeGeometry(sh, {depth: d, bevelEnabled: bv > 0, bevelSize: bv, bevelThickness: bv, bevelSegments: sg, curveSegments: 20}); g.translate(0, 0, -d / 2); return g; };
  const plano = (tex, op, col = 0xffffff, aditivo = true) => new THREE.MeshBasicMaterial({map: tex, color: col, transparent: true, opacity: op, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending, side: THREE.DoubleSide, toneMapped: true});

  // ── hall: pared, piso pulido con reflejo, listones de nogal, zócalo ───────
  const mPared = new THREE.MeshStandardMaterial({map: travertino, roughness: .82});
  malla(new THREE.PlaneGeometry(18, 10), mPared, 0, 5, 0);
  malla(new THREE.BoxGeometry(18, .14, .05), new THREE.MeshStandardMaterial({color: 0x3b3029, roughness: .45}), 0, .07, .025);
  const mPiso = new THREE.MeshStandardMaterial({map: terrazo, roughness: .3, color: 0xE8DCCD});
  const piso = malla(new THREE.PlaneGeometry(40, 40), mPiso, 0, 0, 10); piso.rotation.x = -Math.PI / 2;
  const reflejo = new Reflector(new THREE.PlaneGeometry(40, 40), {textureWidth: 384, textureHeight: 683, clipBias: .003, multisample: 0, color: 0xfff4e6, shader: {
    name: 'GranitoPulido', uniforms: {color: {value: null}, tDiffuse: {value: null}, textureMatrix: {value: null}, fuerza: {value: .62}},
    vertexShader: `uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform vec3 color;uniform sampler2D tDiffuse;uniform float fuerza;varying vec4 vUv;varying vec3 vW;
      void main(){vec2 uv=vUv.xy/vUv.w;vec3 c=vec3(0.);float s=0.;for(int i=-3;i<=3;i++){float w=1.-abs(float(i))/4.;c+=texture2D(tDiffuse,uv+vec2(0.,float(i)*.004)).rgb*w;s+=w;}
      c/=s;vec3 V=normalize(cameraPosition-vW);float f=pow(1.-clamp(V.y,0.,1.),3.);gl_FragColor=vec4(c*color,fuerza*(.28+.72*f));}`}});
  reflejo.material.transparent = true; reflejo.material.depthWrite = false; reflejo.rotation.x = -Math.PI / 2; reflejo.position.set(0, .002, 10); scene.add(reflejo);
  // listones verticales de nogal: a los costados del cartel (o toda la pared en la variante 2)
  { const xs = []; if (variante === 2) for (let x = -6; x <= 6; x += .13) xs.push(x); else for (let k = 0; k < 18; k++) { xs.push(2.28 + k * .13); xs.push(-2.28 - k * .13); }
    const li = new THREE.InstancedMesh(new THREE.BoxGeometry(.06, 7.4, .09), new THREE.MeshStandardMaterial({map: nogalTx, roughness: .5}), xs.length); const m4 = new THREE.Matrix4();
    xs.forEach((x, i) => { li.setMatrixAt(i, m4.makeTranslation(x, 3.7, .05)); }); scene.add(li); }
  // penumbra arriba de la pared (el sol de ventanal resalta) y sombra suave del piso contra la pared
  malla(new THREE.PlaneGeometry(18, 4.5), plano(degradeV, .42, 0x3a2414, false), 0, 8.4, .008);
  { const s = malla(new THREE.PlaneGeometry(18, .9), plano(degradeV, .18, 0x2a1a0c, false), 0, .003, .45); s.rotation.x = -Math.PI / 2; }

  // ── luz: sol de ventanal, relleno, cenital sobre el pedestal, entorno ─────
  const hemi = new THREE.HemisphereLight(0xFFE3C4, 0xB89574, .55); scene.add(hemi);
  const sol = new THREE.DirectionalLight(0xFFC98E, 1.9); sol.position.set(lado * 7, 9, 6.5); scene.add(sol);
  const relleno = new THREE.DirectionalLight(0xFFEEDD, .35); relleno.position.set(-lado * 5, 3, 9); scene.add(relleno);
  const cenital = new THREE.SpotLight(0xFFE2C0, 8, 13, .42, .8, 1.3); cenital.position.set(xP - .25 * lado, 6.4, zP + 1.4); cenital.target.position.set(xP, hTop + .4, zP); scene.add(cenital, cenital.target);
  const luzFlash = new THREE.PointLight(0xFFFFFF, 0, 9, 1.4); luzFlash.position.set(xP - .6, hTop + 1.4, zP + 2.2); scene.add(luzFlash);
  // manchas de ventanal en la pared y el piso, haces de luz y polvo
  const manchas = [];
  { const g = new THREE.PlaneGeometry(3.6, 2.4); g.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, -lado * .55, 0, 0, 0));
    manchas.push([malla(g, plano(ventanaTx, .55, 0xFFB872), -lado * 1.5, 5.75, .012), .55]);
    const g3 = new THREE.PlaneGeometry(1.6, 3.4); g3.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, -lado * .5, 0, 0, 0));
    manchas.push([malla(g3, plano(ventanaTx, .4, 0xFFB872), lado * 2.9, 3.4, .1), .4]);
    const g2 = new THREE.PlaneGeometry(3.2, 4.2); g2.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, -lado * .6, 0, 0, 0));
    const m2 = malla(g2, plano(ventanaTx, .5, 0xFFBE80), lado * .7, .004, 6.3); m2.rotation.x = -Math.PI / 2; manchas.push([m2, .5]); }
  const camW = new THREE.Vector3(Math.sin(yaw0) * 12.8, 2, Math.cos(yaw0) * 12.8);
  const haces = [];
  [[0, 1.2, .16], [.6, .8, .12], [-.55, .6, .1]].forEach(([d, ancho, op]) => {
    const A = new THREE.Vector3(lado * 5.8, 8.6, 7.2 + d), B = new THREE.Vector3(lado * .6 + d * .6, 0, 6.0 + d * .5);
    const dir = B.clone().sub(A), L = dir.length(); dir.normalize(); const mid = A.clone().add(B).multiplyScalar(.5);
    const c = camW.clone().sub(mid).normalize(); const n = c.clone().sub(dir.clone().multiplyScalar(c.dot(dir))).normalize(); const r = new THREE.Vector3().crossVectors(dir, n);
    const m = malla(new THREE.PlaneGeometry(ancho, L), plano(hazTx, op, 0xFFD7A6), 0, 0, 0); m.matrixAutoUpdate = false; m.matrix.makeBasis(r, dir.clone().negate(), n).setPosition(mid); m.renderOrder = 5; haces.push([m, op]); });
  const polvo = (() => { const n = 240, pos = new Float32Array(n * 3), sem = []; for (let i = 0; i < n; i++) sem.push([hash(i * 1.3), hash(i * 2.9 + 4), hash(i * 4.7 + 9), hash(i * 6.1 + 2)]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(g, new THREE.PointsMaterial({size: .028, map: puntoTx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .75, color: 0xFFE2BC})); p.frustumCulled = false; scene.add(p); return {p, pos, sem}; })();
  // globos opalinos colgantes (cálidos)
  const globos = [];
  [[.62, 4.2, 5.2, .19], [1.55, 4.75, 3.4, .23], [-.5 + rnd(11) * .3, 5.25, 1.7, .21]].forEach(([x, y, z, r], i) => {
    const m = new THREE.MeshStandardMaterial({color: 0xFFF1DE, emissive: 0xFFD9A8, emissiveIntensity: 1.6, roughness: .4}); const g = malla(new THREE.SphereGeometry(r, 32, 20), m, x, y, z);
    malla(new THREE.CylinderGeometry(.005, .005, 4, 6), new THREE.MeshBasicMaterial({color: 0x2a2420}), x, y + r + 2, z); malla(new THREE.CylinderGeometry(.045, .06, .07, 20), mk.laton(), x, y + r + .02, z); globos.push(m); });

  // ── cartel de paletas: caja, panel, encabezado, divisor ───────────────────
  const IH = yTop - yBot, yC = (yTop + yBot) / 2;
  const mMarco = new THREE.MeshStandardMaterial({color: 0x1d1c1b, roughness: .38, metalness: .55});
  const mLatonC = mk.laton();
  malla(new THREE.BoxGeometry(IW + .12, IH + .12, .12), new THREE.MeshStandardMaterial({color: 0x0e0e0e, roughness: .75}), 0, yC, zB - .06);
  const barra = (w, h, x, y) => malla(RB(w, h, .3, .035, 3), mMarco, x, y, zB - .07);
  barra(IW + .36, .18, 0, yTop + .09); barra(IW + .36, .18, 0, yBot - .09); barra(.18, IH + .36, -IW / 2 - .09, yC); barra(.18, IH + .36, IW / 2 + .09, yC);
  [[IW + .02, .012, 0, yTop + .004], [IW + .02, .012, 0, yBot - .004], [.012, IH + .02, -IW / 2 - .004, yC], [.012, IH + .02, IW / 2 + .004, yC]].forEach(([w, h, x, y]) => malla(new THREE.BoxGeometry(w, h, .02), mLatonC, x, y, zB + .02));
  malla(new THREE.BoxGeometry(IW, .02, .03), mLatonC, 0, yF0 - RF * FH - DIV / 2, zB + .01);
  const encab = lienzo(1404, 120, (x, w, h) => { x.fillStyle = '#191817'; x.fillRect(0, 0, w, h);
    x.strokeStyle = CREMA; x.fillStyle = CREMA; x.lineWidth = 6; x.lineJoin = 'round'; x.save(); x.translate(48, 60); x.rotate(-.5); x.beginPath(); x.moveTo(-26, 0); x.lineTo(28, 0); x.moveTo(4, 0); x.lineTo(-10, -24); x.moveTo(4, 0); x.lineTo(-10, 24); x.moveTo(-22, 0); x.lineTo(-28, -10); x.moveTo(-22, 0); x.lineTo(-28, 10); x.stroke(); x.restore();
    x.font = '700 54px Outfit'; x.textBaseline = 'middle'; x.letterSpacing = '10px'; x.fillText('SALIDAS', 98, 63);
    x.fillStyle = NARANJA; x.beginPath(); x.arc(470, 60, 9, 0, 7); x.fill(); });
  malla(new THREE.PlaneGeometry(IW, HEAD * .84), new THREE.MeshStandardMaterial({map: encab, roughness: .5, emissive: 0xffffff, emissiveMap: encab, emissiveIntensity: .25}), 0, yTop - HEAD / 2, zB + .004);
  // sombra del cartel sobre la pared y luz cálida que lava la pared debajo
  malla(new THREE.PlaneGeometry(IW + 1.3, IH + 1.2), plano(rectSuave, .5, 0xffffff, false), -lado * .16, yC - .16, .015);
  malla(new THREE.BoxGeometry(IW + .2, .022, .03), new THREE.MeshStandardMaterial({color: 0xFFE0B8, emissive: 0xFFC78A, emissiveIntensity: 2.6}), 0, yBot - .19, zB - .1);
  { const m = malla(new THREE.PlaneGeometry(IW + .6, 1.1), plano(degradeV, .16, 0xFFC890), 0, yBot - .19 - .55, .014); m.rotation.z = 0; }

  // ── paletas: atlas de letras (Outfit 800) e instancias con giro real ─────
  const AC = 12, AR = Math.ceil(NG / AC), CW = 104, CHh = 160;
  const atlas = lienzo(AC * CW, AR * CHh, (x, w, h) => { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#fff'; x.strokeStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineCap = 'round'; x.lineJoin = 'round';
    GL.forEach((g, i) => { x.save(); x.translate((i % AC) * CW + CW / 2, Math.floor(i / AC) * CHh + CHh * .735); x.scale(.86, 1);
      if (g === '✓') { x.lineWidth = 17; x.beginPath(); x.moveTo(-30, -38); x.lineTo(-8, -14); x.lineTo(32, -70); x.stroke(); }
      else if (g === '→') { x.lineWidth = 14; x.beginPath(); x.moveTo(-36, -40); x.lineTo(34, -40); x.moveTo(12, -64); x.lineTo(36, -40); x.lineTo(12, -16); x.stroke(); }
      else if (g === '•') { x.beginPath(); x.arc(0, -40, 13, 0, 7); x.fill(); }
      else { x.font = '800 112px Outfit'; x.fillText(g, 0, 0); }
      x.restore(); }); }, {srgb: false});
  const celdas = [];
  for (let r = 0; r < RF; r++) for (let c = 0; c < FC; c++) celdas.push({zona: 'F', r, c, x: x0 + FP * (c + .5), y: yF0 - FH * (r + .5), w: FP * .93, h: FH * .92});
  for (let r = 0; r < NV; r++) { celdas.push({zona: 'N', r, c: -1, x: x0 + LP * .5, y: filaY(r), w: LP * .9, h: LH * .9});
    for (let c = 0; c < LT; c++) celdas.push({zona: 'L', r, c, x: x0 + LP * (c + 2.5), y: filaY(r), w: LP * .9, h: LH * .9}); }
  const hora = (String(PL.hora || '10:10') + '     ').slice(0, 5);
  for (let c = 0; c < 5; c++) celdas.push({zona: 'H', r: 0, c, x: x0 + IW - .6 + c * .112, y: yTop - HEAD / 2, w: .102, h: .19, fija: gid(hora[c])});
  // estados del contenido: gancho → cada golpe → cierre → reinicio (= cuadro 1)
  const filasF = ls => Array.from({length: RF}, (_, r) => { const a = Array(FC).fill(0), s = ls[r] || ''; for (let i = 0; i < Math.min(FC, s.length); i++) a[i] = gid(s[i]); return a; });
  const listaVacia = () => ({L: Array.from({length: NV}, () => Array(LT).fill(0)), N: Array(NV).fill(0), ws: 0});
  function lista(hasta) { const o = listaVacia(); o.ws = Math.max(0, hasta - NV);
    for (let l = o.ws; l < hasta; l++) { const r = l - o.ws, ln = lineas[l]; for (let k = 0; k < Math.min(LT, ln.s.length); k++) o.L[r][k] = gid(ln.s[k]); if (ln.num) o.N[r] = 100 + gid(String(ln.num % 10)); }
    return o; }
  const est = [{t: -9, F: filasF(gL), ...listaVacia(), tipo: 'inicio'}];
  { const cr = []; beats.forEach((b, i) => cr.push({t: b.t - .12, tipo: 'golpe', i})); cr.push({t: tC, tipo: 'cierre'}); cr.push({t: tR, tipo: 'reinicio'}); cr.sort((a, b) => a.t - b.t);
    let F = est[0].F, Ls = listaVacia();
    for (const c of cr) { if (c.tipo === 'golpe') Ls = lista(beats[c.i].l0 + beats[c.i].nl); if (c.tipo === 'cierre') F = filasF(cL); if (c.tipo === 'reinicio') { F = filasF(gL); Ls = listaVacia(); }
      est.push({t: c.t, F, ...Ls, tipo: c.tipo, i: c.i}); } }
  const wsEn = t => { let w = 0; for (const s of est) if (s.t <= t) w = s.ws; return w; };
  const valor = (s, ce) => ce.zona === 'F' ? s.F[ce.r][ce.c] : ce.zona === 'L' ? s.L[ce.r][ce.c] : ce.zona === 'N' ? s.N[ce.r] : ce.fija;
  function secuencia(a, b, n, ci, cuenta) {
    const col = b >= 100 ? 100 : 0, bb = b % 100, s = [a];
    if (cuenta && bb >= D0 && bb <= D9) { for (let k = D0; k <= bb; k++) if (col + k !== a) s.push(col + k); if (s.length === 1) s.push(b); return s; }
    if (bb === 0) { const ca = a >= 100 ? 100 : 0; for (let k = 0; k < n - 1; k++) s.push(ca + 1 + Math.floor(hash(ci * 7 + k * 3.3) * 26)); s.push(0); return s; }
    for (let k = n - 1; k >= 1; k--) s.push(col + ((bb - k + NG) % NG)); s.push(b); return s;
  }
  celdas.forEach((ce, ci) => { let prev = valor(est[0], ce); ce.g0 = prev; ce.evs = [];
    for (let k = 1; k < est.length; k++) { const s = est[k], v = valor(s, ce); if (v === prev) continue;
      const b = s.tipo === 'golpe' ? beats[s.i] : null, cuenta = b && b.efecto === 'cuenta';
      let ret, dt, n;
      if (s.tipo === 'reinicio') { ret = hash(ci * 1.7) * .3 + (ce.zona === 'F' ? ce.c * .02 + ce.r * .05 : ce.c * .008 + ce.r * .03); dt = .06; n = 2 + Math.floor(hash(ci * 3.1) * 2); }
      else if (ce.zona === 'F') { ret = ce.c * .032 + ce.r * .07 + hash(ci) * .02; dt = .07; n = 3 + Math.floor(hash(ci * 2.3) * 4); }
      else { const nueva = b && ce.r >= b.fila && ce.r < b.fila + b.nl; ret = (ce.zona === 'N' ? -.02 : ce.c * .026) + (nueva ? 0 : ce.r * .05) + hash(ci * 5.9) * .015; dt = cuenta ? .1 : .058; n = 3 + Math.floor(hash(ci * 4.3) * 4); }
      ce.evs.push({t0: s.t + ret, seq: secuencia(prev, v, n, ci, cuenta), dt}); prev = v; } });
  function estadoCelda(ce, t) { let e = null; for (const x of ce.evs) { if (t >= x.t0) e = x; else break; }
    if (!e) return [ce.g0, ce.g0, 0];
    const k = (t - e.t0) / e.dt, n = e.seq.length - 1;
    if (k >= n) { const g = e.seq[n], q = k - n; return q < 1.6 ? [g, g, Math.PI - .32 * Math.exp(-q * 3) * Math.abs(Math.sin(q * 5))] : [g, g, 0]; }
    const i = Math.floor(k), f = k - i; return [e.seq[i], e.seq[i + 1], Math.PI * f * f]; }
  // sonido de las paletas
  for (let k = 1; k < est.length; k++) { const s = est[k]; let n = 0; celdas.forEach(ce => { if (valor(s, ce) !== valor(est[k - 1], ce)) n++; });
    if (!n) continue; sfx(s.t + .02, n > 9 ? 'flap_largo' : 'flap', s.tipo === 'reinicio' ? .85 : .7); if (n > 26) sfx(s.t + .42, 'flap', .5); }
  // instancias: 3 piezas por celda (mitad de arriba, mitad de abajo, paleta que cae)
  const NC = celdas.length, NI = NC * 3;
  const gF = new THREE.InstancedBufferGeometry(); { const b = new THREE.PlaneGeometry(1, 1); gF.index = b.index; gF.setAttribute('position', b.attributes.position); }
  const aOff = new Float32Array(NI * 3), aSz = new Float32Array(NI * 2), aKind = new Float32Array(NI), aG = new Float32Array(NI * 2), aAng = new Float32Array(NI), aLit = new Float32Array(NI).fill(1);
  celdas.forEach((ce, ci) => { for (let q = 0; q < 3; q++) { const j = ci * 3 + q; aOff.set([ce.x, ce.y, zB + .006], j * 3); aSz.set([ce.w, ce.h], j * 2); aKind[j] = q; aG[j * 2] = aG[j * 2 + 1] = ce.g0; } });
  const IA = (a, n) => new THREE.InstancedBufferAttribute(a, n);
  gF.setAttribute('aOff', IA(aOff, 3)); gF.setAttribute('aSz', IA(aSz, 2)); gF.setAttribute('aKind', IA(aKind, 1)); gF.setAttribute('aG', IA(aG, 2)); gF.setAttribute('aAng', IA(aAng, 1)); gF.setAttribute('aLit', IA(aLit, 1));
  gF.instanceCount = NI;
  const Ld = new THREE.Vector3(lado * .35, .78, .62).normalize();
  const mFlap = new THREE.ShaderMaterial({side: THREE.DoubleSide,
    uniforms: {tA: {value: atlas}, uGrid: {value: new THREE.Vector2(AC, AR)}, uFlap: {value: new THREE.Color('#2A2826')}, uFlapN: {value: new THREE.Color(NARANJA)}, uInk: {value: new THREE.Color('#FFE9D4')}, uInkN: {value: new THREE.Color(TINTA)},
      uL: {value: Ld}, uLc: {value: new THREE.Color(1.05, .93, .8)}, uAmb: {value: new THREE.Color(.42, .4, .37)}, uLuz: {value: 1}},
    vertexShader: `attribute vec3 aOff;attribute vec2 aSz;attribute float aKind;attribute vec2 aG;attribute float aAng;attribute float aLit;
      varying vec2 vUv;varying vec2 vG;varying float vKind;varying vec3 vN;varying vec3 vW;varying float vLit;varying float vAsp;varying float vSom;
      void main(){float hh=aSz.y*.5;float yl=(aKind>.5&&aKind<1.5)?(position.y-.5)*hh:(position.y+.5)*hh;
        vec3 p=vec3(position.x*aSz.x,yl,0.);vec3 n=vec3(0.,0.,1.);
        if(aKind>1.5){float c=cos(aAng),s=sin(aAng);p=vec3(p.x,yl*c,yl*s+.003);n=vec3(0.,-s,c);}
        vUv=vec2(position.x+.5,yl/aSz.y+.5);vG=aG;vKind=aKind;vN=n;vLit=aLit;vAsp=aSz.x/aSz.y;vSom=(aKind>.5&&aKind<1.5)?1.-.5*sin(aAng):1.;
        vec4 w=modelMatrix*vec4(p+aOff,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform sampler2D tA;uniform vec2 uGrid;uniform vec3 uFlap,uFlapN,uInk,uInkN,uL,uLc,uAmb;uniform float uLuz;
      varying vec2 vUv;varying vec2 vG;varying float vKind;varying vec3 vN;varying vec3 vW;varying float vLit;varying float vAsp;varying float vSom;
      void main(){bool dorso=!gl_FrontFacing;float v=vUv.y,u=vUv.x,g;
        if(vKind<.5)g=vG.y;else if(vKind<1.5)g=vG.x;else if(dorso){g=vG.y;v=1.-v;}else g=vG.x;
        float hg=abs(v-.5);if(hg<.012)discard;
        vec2 d=abs(vec2(u,v)-.5)*vec2(vAsp,1.);float r=.05;if(length(max(d-(vec2(.5*vAsp,.5)-r),0.))>r)discard;
        float nar=step(99.5,g);float gi=g-100.*nar;float fy=floor((gi+.5)/uGrid.x);vec2 cel=vec2(gi-fy*uGrid.x,fy);
        vec2 auv=vec2((cel.x+.03+u*.94)/uGrid.x,(uGrid.y-cel.y-1.+.02+v*.96)/uGrid.y);float m=texture2D(tA,auv).r;
        vec3 base=mix(mix(uFlap,uFlapN,nar),mix(uInk,uInkN,nar),m)*(.86+.18*v);
        vec3 N=normalize(dorso?-vN:vN);vec3 V=normalize(cameraPosition-vW);vec3 L=normalize(uL);
        float dif=max(dot(N,L),0.);float sp=pow(max(dot(N,normalize(L+V)),0.),36.);float bis=smoothstep(.012,.07,hg);
        vec3 col=base*(uAmb+uLc*dif)*(.5+.5*bis)*(v<.5?.84:1.)*vSom+uLc*sp*.2*(1.-.6*m);
        col+=uLc*.05*smoothstep(.972,1.,v);gl_FragColor=vec4(col*vLit*uLuz,1.);}`});
  const flaps = new THREE.Mesh(gF, mFlap); flaps.frustumCulled = false; scene.add(flaps);
  // luz de estado de cada fila (LED naranja entre el número y el texto)
  const leds = []; for (let r = 0; r < NV; r++) { const m = new THREE.MeshStandardMaterial({color: 0x3a2214, emissive: NARANJA, emissiveIntensity: 0, roughness: .35}); leds.push(malla(RB(.03, LH * .62, .03, .012, 2), m, x0 + LP * 1.5, filaY(r), zB + .02)); }

  // ── pedestal de travertino con tapa de nogal y filete naranja ─────────────
  { const tx = travertino.clone(); tx.repeat.set(.55, .6); tx.needsUpdate = true;
    malla(RB(1.12, hP, .98, .035, 3), new THREE.MeshStandardMaterial({map: tx, roughness: .7}), xP, hP / 2, zP);
    const tapa = nogalTx.clone(); tapa.repeat.set(2, 1); tapa.rotation = Math.PI / 2; tapa.needsUpdate = true;
    malla(RB(1.18, .06, 1.04, .02, 2), new THREE.MeshStandardMaterial({map: tapa, roughness: .38}), xP, hP + .03, zP);
    malla(new THREE.BoxGeometry(1.1, .016, .02), new THREE.MeshStandardMaterial({color: 0x552010, emissive: NARANJA, emissiveIntensity: 2.2}), xP, hP - .12, zP + .495);
    const s = malla(new THREE.PlaneGeometry(2.2, 2.0), plano(rectSuave, .42, 0xffffff, false), xP - lado * .32, .006, zP - .05); s.rotation.x = -Math.PI / 2; }

  // ── objetos de Marketing (dibujados con geometría; sin modelos externos) ──
  function lamina(w, h, dib, px = 900) { return lienzo(Math.round(w * px), Math.round(h * px), (x, cw, ch) => dib(x, cw, ch)); }
  const SIMB = b => b.num ? String(b.num) : (b.tipo === 'gancho' || b.tipo === 'problema') ? '?' : b.tipo === 'cierre' ? '✓' : '!';
  function textoCaja(x, txt, cw, ch, y0, y1, color, maxF = 170) { const ls = partir(txt, 11, 3); let f = maxF; x.font = `800 ${f}px Outfit`;
    while (f > 40 && (ls.some(s => x.measureText(s.toUpperCase()).width > cw * .82) || ls.length * f * 1.02 > (y1 - y0))) { f -= 6; x.font = `800 ${f}px Outfit`; }
    x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; const yc = (y0 + y1) / 2; ls.forEach((s, i) => x.fillText(s.toUpperCase(), cw / 2, yc + (i - (ls.length - 1) / 2) * f * 1.0)); }
  function fabricar(tipo, info, k) {
    const g = new THREE.Group(), mats = []; const M_ = f => { const m = f(); mats.push(m); return m; };
    const add = (geo, mat, x = 0, y = 0, z = 0, padre = g) => malla(geo, mat, x, y, z, padre);
    let anim = null, ancho = .8;
    switch (tipo) {
      case 'reloj_arena': {
        const n = M_(mk.nogal), l = M_(mk.laton), v = M_(mk.vidrio), a = M_(mk.arena);
        for (const y of [.04, 1.03]) { add(new THREE.CylinderGeometry(.34, .35, .08, 48), n, 0, y, 0); const ar = add(new THREE.TorusGeometry(.345, .011, 8, 56), l, 0, y + (y < .5 ? .04 : -.04), 0); ar.rotation.x = Math.PI / 2; }
        for (let q = 0; q < 3; q++) { const an = q / 3 * Math.PI * 2 + .6; add(new THREE.CylinderGeometry(.017, .017, .91, 12), l, Math.cos(an) * .285, .535, Math.sin(an) * .285); }
        const R = d => .028 + .2 * Math.pow(Math.sin(Math.min(1, d) * Math.PI * .82), .9), yN = .535, Hb = .455;
        const perf = []; for (let q = 0; q <= 48; q++) { const s = q / 48 * 2 - 1; perf.push(new THREE.Vector2(R(Math.abs(s)), yN + s * Hb)); }
        add(new THREE.LatheGeometry(perf, 48), v).renderOrder = 3;
        const pa = [new THREE.Vector2(.012, 0)]; for (let q = 1; q <= 14; q++) { const d = q / 14 * .72; pa.push(new THREE.Vector2(R(d) - .014, d * Hb)); } pa.push(new THREE.Vector2(0, .72 * Hb + .02));
        const arriba = add(new THREE.LatheGeometry(pa, 40), a, 0, yN + .004, 0);
        const pb = [new THREE.Vector2(0, 0)]; for (let q = 0; q <= 12; q++) { const d = 1 - q / 12 * .5; pb.push(new THREE.Vector2(R(d) - .016, (1 - d) * Hb)); } pb.push(new THREE.Vector2(0, .5 * Hb + .06));
        const abajo = add(new THREE.LatheGeometry(pb, 40), a, 0, yN - Hb + .006, 0), chorro = add(new THREE.CylinderGeometry(.006, .006, 1, 8), a);
        anim = (t, edad, heroe) => { const f = heroe ? .32 : clamp(.08 + edad / 8); arriba.scale.set(1 - .25 * f, Math.max(.04, 1 - .9 * f), 1 - .25 * f); abajo.scale.set(1, .2 + .8 * f, 1);
          const top = yN - Hb + .006 + (.5 * Hb + .06) * (.2 + .8 * f); chorro.position.y = (yN + top) / 2; chorro.scale.y = Math.max(.01, yN - top); };
        ancho = .75; break; }
      case 'carta': {
        const w = .6, h = .88, sh = rr(w, h, .05);
        const fr = lamina(w, h, (x, cw, ch) => { x.fillStyle = '#F4E4CF'; x.fillRect(0, 0, cw, ch); x.strokeStyle = TINTA; x.lineWidth = 5; x.beginPath(); x.roundRect(26, 26, cw - 52, ch - 52, 22); x.stroke();
          const s = SIMB(info); x.fillStyle = TINTA; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 300px Outfit'; x.fillText(s, cw / 2, ch * .47); x.font = '800 64px Outfit'; x.fillText(s, 74, 86);
          x.save(); x.translate(cw - 74, ch - 86); x.rotate(Math.PI); x.fillText(s, 0, 0); x.restore(); x.fillStyle = NARANJA; x.beginPath(); x.roundRect(cw * .3, ch * .68, cw * .4, 18, 9); x.fill();
          x.beginPath(); x.moveTo(cw / 2, ch * .76); x.lineTo(cw / 2 + 16, ch * .79); x.lineTo(cw / 2, ch * .82); x.lineTo(cw / 2 - 16, ch * .79); x.fill(); });
        const ds = lamina(w, h, (x, cw, ch) => { x.fillStyle = NARANJA; x.fillRect(0, 0, cw, ch); x.strokeStyle = 'rgba(255,231,208,.85)'; x.lineWidth = 6; x.beginPath(); x.roundRect(28, 28, cw - 56, ch - 56, 20); x.stroke();
          x.save(); x.beginPath(); x.roundRect(46, 46, cw - 92, ch - 92, 14); x.clip(); x.strokeStyle = 'rgba(255,231,208,.28)'; x.lineWidth = 3; for (let q = -ch; q < cw + ch; q += 34) { x.beginPath(); x.moveTo(q, 0); x.lineTo(q - ch, ch); x.stroke(); x.beginPath(); x.moveTo(q - ch, 0); x.lineTo(q, ch); x.stroke(); } x.restore();
          x.fillStyle = NARANJA; x.beginPath(); x.arc(cw / 2, ch / 2, 92, 0, 7); x.fill(); x.strokeStyle = CREMA; x.lineWidth = 8; for (const r of [84, 60, 36]) { x.beginPath(); x.arc(cw / 2, ch / 2, r, 0, 7); x.stroke(); } });
        [fr, ds].forEach(tx => { tx.repeat.set(1 / w, 1 / h); tx.offset.set(.5, .5); });
        const carta = new THREE.Group(); carta.position.y = .07 + h / 2; carta.rotation.x = -.09; g.add(carta);
        add(extr(sh, .008, .003, 2), M_(mk.crema), 0, 0, 0, carta);
        add(new THREE.ShapeGeometry(sh, 10), M_(() => new THREE.MeshPhysicalMaterial({map: fr, roughness: .45, clearcoat: .5})), 0, 0, .0075, carta);
        add(new THREE.ShapeGeometry(sh, 10), M_(() => new THREE.MeshPhysicalMaterial({map: ds, roughness: .35, clearcoat: .8})), 0, 0, -.0075, carta).rotation.y = Math.PI;
        add(RB(.52, .07, .22, .02), M_(mk.nogal), 0, .035, 0); add(new THREE.BoxGeometry(.5, .012, .03), M_(mk.laton), 0, .074, .075);
        anim = t => { carta.rotation.y = .12 * Math.sin(fase(t) + k); }; ancho = .7; break; }
      case 'caja': {
        const kr = M_(() => new THREE.MeshStandardMaterial({map: kraftTx(''), roughness: .88})), tp = M_(() => new THREE.MeshStandardMaterial({map: kraftTx('tapa'), roughness: .8})), fr = M_(() => new THREE.MeshStandardMaterial({map: kraftTx('frente'), roughness: .84}));
        add(RB(.9, .6, .66, .02, 2), [kr, kr, tp, kr, fr, kr], 0, .3, 0);
        const sol1 = add(RB(.9, .012, .33, .006, 2), tp, 0, .605, -.165); const sol2 = add(RB(.9, .012, .33, .006, 2), tp, 0, .605, .165); sol1.rotation.x = -.04; sol2.rotation.x = .04;
        add(new THREE.BoxGeometry(.04, .601, .67), M_(() => new THREE.MeshStandardMaterial({color: NARANJA, roughness: .45})), 0, .3, 0);
        anim = t => { g.children[0].rotation.y = 0; }; ancho = .95; break; }
      case 'celular': {
        const pant = lamina(.5, 1.02, (x, cw, ch) => { x.fillStyle = '#FFF6EC'; x.fillRect(0, 0, cw, ch); x.fillStyle = TINTA; x.font = '700 26px Manrope'; x.fillText(String(PL.hora || '10:10'), 34, 44);
          x.fillStyle = '#F1E2D0'; x.fillRect(0, 64, cw, 96); x.fillStyle = NARANJA; x.beginPath(); x.arc(70, 112, 30, 0, 7); x.fill(); x.fillStyle = '#C9AC93'; x.beginPath(); x.roundRect(116, 96, 170, 16, 8); x.fill(); x.beginPath(); x.roundRect(116, 120, 110, 12, 6); x.fill();
          const burbuja = (y, der, n) => { const w = cw * .62, xx = der ? cw - w - 26 : 26; x.fillStyle = der ? NARANJA : '#FFFFFF'; x.beginPath(); x.roundRect(xx, y, w, 34 + n * 30, 22); x.fill(); x.fillStyle = der ? 'rgba(255,231,208,.9)' : 'rgba(50,50,50,.35)'; for (let q = 0; q < n; q++) { x.beginPath(); x.roundRect(xx + 22, y + 22 + q * 30, w * (q === n - 1 ? .5 : .8) - 22, 12, 6); x.fill(); } };
          burbuja(196, false, 2); burbuja(318, true, 2); burbuja(440, false, 1); burbuja(530, true, 3);
          x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(26, 690, 150, 54, 27); x.fill(); x.fillStyle = '#C9AC93'; for (let q = 0; q < 3; q++) { x.beginPath(); x.arc(64 + q * 34, 717, 9, 0, 7); x.fill(); }
          x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(22, ch - 104, cw - 120, 64, 32); x.fill(); x.fillStyle = NARANJA; x.beginPath(); x.arc(cw - 62, ch - 72, 32, 0, 7); x.fill(); }, 800);
        const tel = new THREE.Group(); tel.position.set(0, .09, -.04); tel.rotation.x = -.16; g.add(tel);
        add(RB(.54, 1.08, .07, .07, 4), M_(mk.tinta), 0, .54, 0, tel);
        const sh = rr(.49, 1.02, .055); pant.repeat.set(1 / .49, 1 / 1.02); pant.offset.set(.5, .5);
        add(new THREE.ShapeGeometry(sh, 8), M_(() => new THREE.MeshStandardMaterial({map: pant, emissive: 0xffffff, emissiveMap: pant, emissiveIntensity: .55, roughness: .15})), 0, .54, .0365, tel);
        add(RB(.12, .028, .01, .012, 2), M_(() => new THREE.MeshBasicMaterial({color: 0x0a0a0a})), 0, 1.03, .038, tel);
        const insig = lienzo(128, 128, (x) => { x.fillStyle = NARANJA; x.beginPath(); x.arc(64, 64, 62, 0, 7); x.fill(); x.fillStyle = CREMA; x.font = '800 78px Outfit'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(contador || 3), 64, 68); });
        const badge = add(new THREE.CircleGeometry(.075, 32), M_(() => new THREE.MeshBasicMaterial({map: insig, transparent: true})), .25, 1.06, .05, tel);
        add(RB(.52, .1, .3, .03), M_(mk.nogal), 0, .05, .02);
        anim = t => { badge.scale.setScalar(1 + .14 * Math.max(0, Math.sin(fase(t) * 2 + k))); }; ancho = .62; break; }
      case 'chat': {
        const w = .95, h = .62, r = .2, s = new THREE.Shape();
        s.moveTo(-w / 2 + .34, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
        s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r * .7); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + .13, -h / 2 - .02); s.lineTo(-w / 2 + .02, -h / 2 - .18); s.lineTo(-w / 2 + .34, -h / 2);
        const b = new THREE.Group(); b.position.y = .72; g.add(b); add(extr(s, .1, .04, 4), M_(mk.crema), 0, 0, 0, b);
        const pts = [0, 1, 2].map(q => add(new THREE.SphereGeometry(.058, 24, 16), M_(mk.naranja), (q - 1) * .2, 0, .1, b));
        add(new THREE.CylinderGeometry(.018, .018, .36, 12), M_(mk.laton), -.25, .24, 0); add(new THREE.CylinderGeometry(.24, .27, .06, 40), M_(mk.nogal), -.1, .03, 0);
        anim = t => { pts.forEach((p, q) => { p.position.y = .05 * Math.max(0, Math.sin(fase(t) * 3 - q * .9)); }); b.rotation.z = .03 * Math.sin(fase(t) + k); }; ancho = 1.0; break; }
      case 'check': case 'cruz': {
        const d = new THREE.Group(); d.position.y = .62; g.add(d);
        const disco = add(new THREE.CylinderGeometry(.38, .38, .07, 64), M_(mk.crema), 0, 0, 0, d); disco.rotation.x = Math.PI / 2;
        add(new THREE.TorusGeometry(.38, .022, 12, 64), M_(mk.laton), 0, 0, 0, d);
        if (tipo === 'check') { const c = new THREE.Shape(); [[-.215, .035], [-.075, -.135], [.225, .165], [.175, .215], [-.075, -.035], [-.165, .085]].forEach(([a, b2], q) => q ? c.lineTo(a, b2) : c.moveTo(a, b2));
          add(extr(c, .05, .016, 2), M_(mk.naranja), 0, 0, .06, d); }
        else { const mt = M_(mk.tinta); [1, -1].forEach(sg => { add(RB(.5, .1, .06, .03, 3), mt, 0, 0, .07, d).rotation.z = sg * Math.PI / 4; }); }
        add(new THREE.CylinderGeometry(.022, .022, .2, 12), M_(mk.laton), 0, .16, 0); add(RB(.5, .08, .26, .02), M_(mk.nogal), 0, .04, 0);
        anim = t => { d.rotation.y = .14 * Math.sin(fase(t) + k); }; ancho = .8; break; }
      case 'estrella': {
        const s = new THREE.Shape(); for (let q = 0; q < 10; q++) { const an = Math.PI / 2 + q * Math.PI / 5, rr_ = q % 2 ? .19 : .42; q ? s.lineTo(Math.cos(an) * rr_, Math.sin(an) * rr_) : s.moveTo(Math.cos(an) * rr_, Math.sin(an) * rr_); }
        const st = add(extr(s, .09, .035, 3), M_(mk.naranja), 0, .68, 0);
        add(new THREE.CylinderGeometry(.022, .022, .3, 12), M_(mk.laton), 0, .2, 0); add(new THREE.CylinderGeometry(.22, .25, .06, 40), M_(mk.nogal), 0, .03, 0);
        anim = t => { st.rotation.y = .4 * Math.sin(fase(t) + k); }; ancho = .9; break; }
      case 'etiqueta': {
        const w = .44, h = .7, s = new THREE.Shape(); s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, h / 2 - .12); s.lineTo(.1, h / 2); s.lineTo(-.1, h / 2); s.lineTo(-w / 2, h / 2 - .12); s.lineTo(-w / 2, -h / 2);
        const hole = new THREE.Path(); hole.absarc(0, h / 2 - .1, .034, 0, Math.PI * 2, true); s.holes.push(hole);
        const tx = lamina(w, h, (x, cw, ch) => { x.fillStyle = '#F6E6CF'; x.fillRect(0, 0, cw, ch); x.fillStyle = NARANJA; x.fillRect(0, ch * .8, cw, ch * .2); x.fillStyle = TINTA; x.beginPath(); x.roundRect(cw * .18, ch * .34, cw * .64, 22, 11); x.fill();
          x.fillStyle = 'rgba(27,27,27,.45)'; x.beginPath(); x.roundRect(cw * .18, ch * .46, cw * .44, 14, 7); x.fill(); x.beginPath(); x.roundRect(cw * .18, ch * .54, cw * .54, 14, 7); x.fill(); x.strokeStyle = 'rgba(27,27,27,.25)'; x.lineWidth = 3; x.setLineDash([10, 8]); x.strokeRect(20, 20, cw - 40, ch - 40); });
        tx.repeat.set(1 / w, 1 / h); tx.offset.set(.5, .5);
        const piv = new THREE.Group(); piv.position.set(.06, 1.06, 0); g.add(piv);
        add(extr(s, .012, .004, 2), M_(() => new THREE.MeshStandardMaterial({map: tx, roughness: .7})), 0, -.16 - h / 2 + .1, 0, piv);
        const oj = add(new THREE.TorusGeometry(.04, .011, 8, 24), M_(mk.laton), 0, -.16, .0, piv);
        add(new THREE.CylinderGeometry(.004, .004, .16, 6), M_(() => new THREE.MeshStandardMaterial({color: 0x9a7a55, roughness: .9})), 0, -.08, 0, piv); oj.rotation.x = 0;
        const lt = M_(mk.laton); add(new THREE.CylinderGeometry(.016, .016, 1.04, 12), lt, -.24, .58, 0); const brazo = add(new THREE.CylinderGeometry(.014, .014, .36, 12), lt, -.07, 1.08, 0); brazo.rotation.z = Math.PI / 2;
        add(RB(.5, .06, .3, .02), M_(mk.nogal), -.1, .03, 0);
        anim = t => { piv.rotation.z = .1 * Math.sin(fase(t) * 1.5 + k); piv.rotation.y = .25 * Math.sin(fase(t) + k); }; ancho = .7; break; }
      case 'cartel': {
        const w = .62, h = .9, tx = lamina(w, h, (x, cw, ch) => { x.fillStyle = '#FFF2E2'; x.fillRect(0, 0, cw, ch); x.strokeStyle = TINTA; x.lineWidth = 10; x.strokeRect(22, 22, cw - 44, ch - 44);
          textoCaja(x, info.texto || '', cw, ch, ch * .12, ch * .7, TINTA, 120); x.fillStyle = NARANJA; x.beginPath(); x.roundRect(cw * .2, ch * .78, cw * .6, 26, 13); x.fill(); });
        const mt = M_(mk.tinta), mf = M_(() => new THREE.MeshStandardMaterial({map: tx, roughness: .55}));
        [-1, 1].forEach(sg => { const pv = new THREE.Group(); pv.position.y = .96; pv.rotation.x = -sg * .21; g.add(pv); add(RB(w + .05, h + .05, .03, .012, 2), mt, 0, -h / 2 - .02, 0, pv);
          const f = add(new THREE.PlaneGeometry(w - .02, h - .02), mf, 0, -h / 2 - .02, sg * .017, pv); if (sg < 0) f.rotation.y = Math.PI; });
        const eje = add(new THREE.CylinderGeometry(.014, .014, w + .1, 10), M_(mk.laton), 0, .965, 0); eje.rotation.z = Math.PI / 2;
        anim = null; ancho = .8; break; }
      case 'mostrador': {
        const fl = lamina(1, .5, (x, cw, ch) => { for (let q = 0; q < 26; q++) { const g2 = x.createLinearGradient(q * cw / 26, 0, (q + 1) * cw / 26, 0); g2.addColorStop(0, '#E9D3BA'); g2.addColorStop(.5, '#FFF0DE'); g2.addColorStop(1, '#C9AC93'); x.fillStyle = g2; x.fillRect(q * cw / 26, 0, cw / 26 + 1, ch); } }, 512);
        const mc = M_(mk.crema), mf = M_(() => new THREE.MeshStandardMaterial({map: fl, roughness: .55}));
        add(RB(1.0, .56, .46, .02, 2), [mc, mc, mc, mc, mf, mc], 0, .3, 0); add(RB(1.08, .06, .54, .02, 2), M_(mk.nogal), 0, .61, 0); add(new THREE.BoxGeometry(1.0, .03, .012), M_(mk.laton), 0, .05, .235);
        const lt = M_(mk.laton); add(new THREE.CylinderGeometry(.11, .12, .02, 32), lt, .22, .65, .05); add(new THREE.SphereGeometry(.09, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), lt, .22, .655, .05); add(new THREE.SphereGeometry(.02, 12, 8), lt, .22, .755, .05);
        add(RB(.26, .14, .2, .02), M_(mk.tinta), -.24, .71, -.02); anim = null; ancho = 1.05; break; }
      case 'megafono': {
        const perf = [[.05, 0], [.06, .05], [.075, .2], [.12, .42], [.21, .6], [.255, .67]].map(([a, b2]) => new THREE.Vector2(a, b2));
        const mg = new THREE.Group(); mg.position.set(-.05, .4, 0); mg.rotation.set(Math.PI / 2 - .4, 0, -.35); g.add(mg);
        add(new THREE.LatheGeometry(perf, 48), M_(() => new THREE.MeshPhysicalMaterial({color: CREMA, roughness: .35, clearcoat: .6, side: THREE.DoubleSide})), 0, -.3, 0, mg);
        add(new THREE.TorusGeometry(.255, .03, 12, 48), M_(mk.naranja), 0, .37, 0, mg).rotation.x = Math.PI / 2;
        add(new THREE.CylinderGeometry(.065, .06, .14, 24), M_(mk.tinta), 0, -.34, 0, mg); add(RB(.07, .22, .09, .02), M_(mk.tinta), 0, -.18, -.12, mg);
        add(RB(.5, .1, .34, .03), M_(mk.nogal), 0, .05, 0); anim = null; ancho = .8; break; }
      case 'vidriera': {
        const intTx = lamina(.84, .6, (x, cw, ch) => { const g2 = x.createLinearGradient(0, 0, 0, ch); g2.addColorStop(0, '#FFD7A6'); g2.addColorStop(1, '#E9A56A'); x.fillStyle = g2; x.fillRect(0, 0, cw, ch);
          x.fillStyle = 'rgba(93,73,61,.85)'; for (const y of [.32, .64]) x.fillRect(0, ch * y, cw, 10); x.fillStyle = CREMA; for (let q = 0; q < 6; q++) { x.fillRect(40 + q * 120, ch * .32 - 70, 70, 70); x.fillRect(60 + q * 118, ch * .64 - 54, 50, 54); }
          x.fillStyle = NARANJA; for (let q = 0; q < 3; q++) { x.beginPath(); x.arc(110 + q * 230, ch * .86, 34, 0, 7); x.fill(); } }, 600);
        const toldo = lienzo(512, 64, (x, cw, ch) => { for (let q = 0; q < 10; q++) { x.fillStyle = q % 2 ? NARANJA : CREMA; x.fillRect(q * cw / 10, 0, cw / 10 + 1, ch); } });
        const mt = M_(mk.tinta); add(RB(.98, .1, .44, .02), M_(mk.carbon), 0, .05, 0); [-.46, .46].forEach(x => add(RB(.06, .82, .08, .015), mt, x, .5, .12));
        add(RB(.98, .12, .12, .02), mt, 0, .96, .12); add(RB(.8, .14, .04, .02), M_(mk.crema), 0, 1.1, .15);
        add(new THREE.PlaneGeometry(.86, .62), M_(() => new THREE.MeshBasicMaterial({map: intTx})), 0, .45, -.12); add(new THREE.PlaneGeometry(.86, .64), M_(mk.vidrio), 0, .45, .11).renderOrder = 3;
        const aw = add(new THREE.CylinderGeometry(.14, .14, .96, 24, 1, true, 0, Math.PI), M_(() => new THREE.MeshStandardMaterial({map: toldo, roughness: .7, side: THREE.DoubleSide})), 0, .86, .2); aw.rotation.set(0, 0, Math.PI / 2); aw.rotation.x = -Math.PI / 2;
        const lado2 = add(new THREE.BoxGeometry(.02, .78, .3), M_(mk.carbon), -.44, .5, -.03); lado2.visible = true; add(new THREE.BoxGeometry(.02, .78, .3), M_(mk.carbon), .44, .5, -.03);
        anim = null; ancho = 1.05; break; }
      default: {
        add(RB(.64, .64, .64, .1, 4), M_(mk.crema), 0, .32, 0); add(RB(.67, .1, .67, .04, 3), M_(mk.naranja), 0, .36, 0);
        anim = t => { g.children[0].rotation.y = 0; }; ancho = .8; }
    }
    // piezas para el despiece: posición, giro y dirección de vuelo
    const piezas = g.children.slice(); piezas.forEach((p, q) => { const dir = p.position.clone().setY(p.position.y - .4); if (dir.lengthSq() < .01) dir.set(hash(q + k) - .5, .5, .3); dir.normalize().multiplyScalar(1.3 + hash(q * 3 + k) * .6); dir.y += .5;
      p.userData.b = {p: p.position.clone(), r: p.rotation.clone(), d: dir, w: new THREE.Vector3(hash(q + 1) - .5, hash(q + 2) - .5, hash(q + 3) - .5).multiplyScalar(5)}; });
    const brillan = mats.filter(m => m.emissive && !m.emissiveMap); brillan.forEach(m => { m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; });
    g.userData = {anim, ancho, piezas, brillan};
    return g;
  }

  // ── instancias en el tiempo: héroe (cuadro 1 y final) + un objeto por golpe ──
  const PRE = {caida: .32, rebote: .05, giro: .14, golpe: 0, flash: .02, despiece: .3, baja: .3, lado: .3, crece: .2, ninguna: 0};
  const ENT = {caida: 'caida', rebote: 'rebote', giro: 'giro', golpe: 'golpe', flash: 'flash', despiece: 'despiece'};
  const entDe = (b, i) => ENT[b.efecto] || ['baja', 'lado', 'crece'][(estiloEnt + i) % 3];
  const tIn = beats.map((b, i) => b.t - PRE[entDe(b, i)]);
  const unicos = [...new Set(beats.map(b => b.objeto))]; let cand = unicos.filter(o => o !== beats[0].objeto); if (!cand.length) cand = unicos;
  const heroTipo = cand[Math.floor(rnd(8) * cand.length)] || 'reloj_arena';
  const heroInfo = beats.find(b => b.objeto === heroTipo) || {texto: gancho, tipo: 'gancho', num: 0};
  const SAL = ['sube', 'lado', 'hunde'];
  const inst = [];
  const raiz = new THREE.Group(); scene.add(raiz);
  function crear(tipo, info, k, ventanas) { const g = fabricar(tipo, info, k); raiz.add(g); g.visible = false;
    const sm = malla(new THREE.PlaneGeometry(1, 1), plano(sombraTx, .5, 0xffffff, false), xP, hTop + .003, zP, raiz); sm.rotation.x = -Math.PI / 2; sm.visible = false;
    inst.push({g, sm, k, ventanas, yaw: -.16 + (hash(k * 5.1 + s0) - .5) * .3}); }
  crear(heroTipo, heroInfo, 99, [{a: -20, b: tIn[0] - .3, ent: 'ninguna', sal: SAL[Math.floor(rnd(12) * 3)], heroe: true}, {a: tR + .2, b: 1e9, ent: 'baja', heroe: true}]);
  beats.forEach((b, i) => crear(b.objeto, b, i, [{a: tIn[i], b: i < NB - 1 ? tIn[i + 1] - .3 : tR - .12, ent: entDe(b, i), sal: SAL[Math.floor(rnd(40 + i) * 3)], ef: b.efecto}]));
  function entrada(st, a, o) {
    switch (st) {
      case 'caida': { const k = seg(a, 0, .32); o.dy = (1 - k * k) * 3.4; o.rz = (1 - k) * .3; o.pres = k; if (a > .32) { const b = a - .32, q = Math.exp(-b * 8) * Math.sin(b * 26) * .2; o.sy = 1 - q; o.sxz = 1 + q * .55; } break; }
      case 'rebote': { o.s = E.outBack(seg(a, 0, .2), 2); const k = seg(a, 0, 1.05), z = Math.abs(Math.sin(k * Math.PI * 3)); o.dy = z * Math.pow(1 - k, 2) * .62; const q = Math.pow(1 - k, 1.5) * .2 * Math.exp(-z * 12) * (a > .05 ? 1 : 0); o.sy = 1 - q; o.sxz = 1 + q * .6; break; }
      case 'giro': { const k = E.out3(seg(a, 0, .95)); o.ry = (1 - k) * Math.PI * 4; o.s = lerp(.55, 1, E.outBack(seg(a, 0, .45), 1.6)); o.dy = (1 - E.out3(seg(a, 0, .5))) * .5; break; }
      case 'golpe': { o.s = 1 + .5 * Math.exp(-a * 9) * Math.cos(a * 20); break; }
      case 'flash': { o.s = 1 + .1 * Math.exp(-a * 7); break; }
      case 'despiece': { o.desp = a; break; }
      case 'baja': { const k = seg(a, 0, .5); o.dy = (1 - E.outBack(k, 1.4)) * 1.5; o.pres = k; break; }
      case 'lado': { const k = E.out5(seg(a, 0, .5)); o.dx = (1 - k) * 2.6; o.rz = -(1 - k) * .25; o.ry = -(1 - k) * .8; break; }
      case 'crece': { o.s = E.outBack(seg(a, 0, .42), 1.8); break; }
    }
  }
  function salida(st, b, o) { const k = E.in3(seg(b, 0, .28)); if (st === 'sube') { o.dy += k * 2.8; o.s *= 1 - .3 * k; o.pres *= 1 - k; } else if (st === 'lado') { o.dx += k * 3; o.rz -= k * .3; } else o.s *= 1 - k; }
  // sonidos de entradas y salidas
  inst.forEach(it => it.ventanas.forEach(w => { if (w.a > 0) { const s = {caida: ['whoosh', .45], rebote: ['pop', .8], giro: ['whoosh_largo', .55], golpe: ['boom', .7], flash: ['foto', .9], despiece: ['click', .6], baja: ['whoosh', .35], lado: ['whoosh', .4], crece: ['pop', .6]}[w.ent];
    if (s) sfx(w.a, ...s); if (w.ent === 'caida') { sfx(w.a + .32, 'thud', .9); golpes.push([w.a + .32, .7]); } if (w.ent === 'rebote') { sfx(w.a + .35, 'pop', .5); sfx(w.a + .7, 'pop', .35); }
    if (w.ent === 'despiece') [.1, .2, .3, .42].forEach(d => sfx(w.a + .3 + d, 'click', .45)); if (w.ent === 'golpe') golpes.push([w.a, 1]); }
    if (w.b < 1e8) sfx(w.b, w.sal === 'lado' ? 'whoosh' : 'popout', .32); }));

  // ── efectos sobre el cartel y el hall ─────────────────────────────────────
  const marcas = [];
  const selloTx = lienzo(256, 256, (x) => { x.fillStyle = NARANJA; x.beginPath(); x.arc(128, 128, 126, 0, 7); x.fill(); x.strokeStyle = CREMA; x.lineWidth = 9; x.beginPath(); x.arc(128, 128, 104, 0, 7); x.stroke();
    x.lineWidth = 20; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath(); x.moveTo(82, 132); x.lineTo(114, 164); x.lineTo(176, 96); x.stroke(); });
  beats.forEach((b, i) => {
    if (b.efecto === 'tachar') { const m = malla(new THREE.BoxGeometry(1, .034, .014), new THREE.MeshStandardMaterial({color: NARANJA, emissive: NARANJA, emissiveIntensity: 1.4}), 0, 0, zB + .2); m.visible = false; marcas.push({i, tipo: 'tachar', m, t0: b.t + .75}); sfx(b.t + .75, 'rasgu', .9); }
    if (b.efecto === 'sello') { const m = new THREE.Group(); scene.add(m); const cs = malla(new THREE.CylinderGeometry(.16, .16, .03, 48), new THREE.MeshStandardMaterial({color: 0xc4521a, roughness: .5}), 0, 0, -.016, m); cs.rotation.x = Math.PI / 2;
      malla(new THREE.CircleGeometry(.16, 48), new THREE.MeshStandardMaterial({map: selloTx, roughness: .45, emissive: 0xffffff, emissiveMap: selloTx, emissiveIntensity: .15}), 0, 0, .0, m); m.visible = false; marcas.push({i, tipo: 'sello', m, t0: b.t + .82, rz: (rnd(60 + i) - .5) * .5}); sfx(b.t + .82, 'sello', 1); golpes.push([b.t + .82, .8]); }
    if (b.efecto === 'cuenta') { const n = Math.min(10, b.num + 1 || 6); for (let q = 0; q < n; q++) sfx(b.t - .1 + q * .1, 'tick', .45); }
    if (b.efecto === 'barrido') { sfx(b.t + .6, 'whoosh_largo', .5); sfx(b.t + 1.05, 'ding', .35); }
    if (b.efecto === 'lupa') { sfx(b.t + .4, 'whoosh', .45); sfx(b.t + 1.0, 'chime', .3); }
    if (b.efecto === 'apagon') { sfx(b.t - .05, 'foco', .85); sfx(b.t + 1.4, 'foco', .45); }
    if (b.efecto === 'tachar') golpes.push([b.t + .75, .35]);
  });
  sfx(tC + .05, 'chime', .45); sfx(tR + .55, 'pop', .45);
  // barrido de luz (banda aditiva que cruza la fila) y lupa de latón
  const banda = malla(new THREE.PlaneGeometry(.55, LH * 1.6), plano(hazTx, .0, 0xFFF0DA), 0, 0, zB + .25); banda.rotation.z = Math.PI / 2; banda.visible = false;
  const lupa = new THREE.Group(); scene.add(lupa); lupa.visible = false;
  { const lt = mk.laton(); const aro = malla(new THREE.TorusGeometry(.3, .032, 16, 64), lt, 0, 0, 0, lupa); malla(new THREE.CircleGeometry(.29, 48), new THREE.MeshPhysicalMaterial({color: 0xffffff, transparent: true, opacity: .12, roughness: .02, clearcoat: 1, depthWrite: false}), 0, 0, 0, lupa);
    const mango = malla(new THREE.CylinderGeometry(.04, .05, .5, 16), mk.nogal(), .38, -.38, 0, lupa); mango.rotation.z = Math.PI / 4; malla(new THREE.CylinderGeometry(.052, .052, .05, 16), lt, .23, -.23, 0, lupa).rotation.z = Math.PI / 4; aro.castShadow = false; }
  // haz del apagón (cono aditivo sobre el pedestal)
  const conoA = (() => { const g = new THREE.CylinderGeometry(.05, 1.0, 1, 40, 1, true); g.translate(0, -.5, 0);
    const m = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: {op: {value: 0}, col: {value: new THREE.Color(0xFFE6C4)}},
      vertexShader: `varying float l;varying vec3 n,vv;void main(){l=-position.y;vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);vv=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 col;uniform float op;varying float l;varying vec3 n,vv;void main(){float e=pow(abs(dot(n,vv)),1.6);float a=op*e*smoothstep(1.,.2,l)*smoothstep(0.,.1,l);gl_FragColor=vec4(col*a,a);}`});
    const c = new THREE.Mesh(g, m); c.position.set(xP, 6.2, zP + .3); c.scale.set(.8, 6.2 - hTop + .2, .8); c.renderOrder = 6; scene.add(c); return c; })();
  const apagones = beats.filter(b => b.efecto === 'apagon'), flashes = beats.filter(b => b.efecto === 'flash'), golpesF = beats.filter(b => b.efecto === 'golpe');
  const apgEn = t => apagones.reduce((a, b) => a * (1 - .86 * E.out3(seg(t, b.t - .06, b.t + .08)) * (1 - E.io3(seg(t, b.t + 1.35, b.t + 1.8)))), 1);

  // ── cámara: plano general y encuadres que se resuelven solos ──────────────
  const tmp = new THREE.PerspectiveCamera(36, 1080 / 1920, .05, 400), vv = new THREE.Vector3();
  function proyY(cp, lk, pt, fov) { tmp.fov = fov; tmp.updateProjectionMatrix(); tmp.position.set(...cp); tmp.lookAt(...lk); tmp.updateMatrixWorld(); vv.set(...pt).project(tmp); return [(vv.x + 1) * 540, (1 - vv.y) * 960]; }
  function encuadre({dist, xc, zc = 0, yaw = 0, pA, yA, pB = null, yB = 0, fov = 36, hmin = .8, hmax = 4.4}) {
    let mejor = null;
    for (let h = hmin; h <= hmax + 1e-6; h += .05) {
      const cp = [xc + Math.sin(yaw) * dist, h, zc + Math.cos(yaw) * dist]; let lo = -8, hi = 12, lk = null;
      for (let it = 0; it < 26; it++) { const mid = (lo + hi) / 2; lk = [xc, mid, zc]; if (proyY(cp, lk, pA, fov)[1] > yA) hi = mid; else lo = mid; }
      const e = pB ? Math.abs(proyY(cp, lk, pB, fov)[1] - yB) : 0; if (!mejor || e < mejor.e - 1e-9) mejor = {e, p: cp, m: lk, fov};
    }
    return mejor;
  }
  const objC = [xP, hTop + .5 * OS, zP];
  const ANCHO = encuadre({dist: 12.8, xc: 0, yaw: yaw0, pA: [0, yTop + .16, zB], yA: 336 + alto0 * 30, pB: objC, yB: 1005, hmin: 1.2, hmax: 3.4});
  const txc = b => x0 + LP * (2 + Math.min(LT, b.len) / 2);
  const tomaFila = (b, i, sg) => encuadre({dist: 10.8 + (rnd(20 + i) - .5) * .6, xc: .2 + (rnd(25 + i) - .5) * .12, yaw: sg * (.03 + rnd(30 + i) * .05), pA: [txc(b), filaY(b.fila + (b.nl - 1) / 2), zB], yA: 590, pB: objC, yB: 965});
  const tomaObjeto = (b, i, sg) => encuadre({dist: 4.2, xc: xP - sg * .1, zc: zP, yaw: sg * (.28 + rnd(50 + i) * .14), pA: objC, yA: 900, hmin: hTop + .7, hmax: hTop + .7});
  const tomaDetalle = (b) => encuadre({dist: 5.6, xc: txc(b) + .2, yaw: 0, pA: [txc(b), filaY(b.fila), zB], yA: 760, hmin: filaY(b.fila) - .2, hmax: filaY(b.fila) - .2});
  const tomaCierre = encuadre({dist: 11.4, xc: .1, yaw: -lado * .07, pA: [0, yF0 - FH * RF / 2, zB], yA: 600, pB: objC, yB: 1000});
  const tomas = [{t: -20, dur: .01, ease: E.io3, der: 0, ...ANCHO}];
  beats.forEach((b, i) => {
    const D = (i < NB - 1 ? beats[i + 1].t : tC) - b.t, sg = ((i + (rnd(9) > .5 ? 1 : 0)) % 2) ? 1 : -1;
    if (b.efecto === 'lupa') { tomas.push({t: b.t - .15, dur: .5, ease: E.out5, der: .04, ...tomaDetalle(b)}); if (D > 2.6) tomas.push({t: b.t + 1.75, dur: .5, ease: E.out5, der: .03, ...tomaFila(b, i, sg)}); return; }
    tomas.push({t: b.t - .2, dur: .45, ease: E.out5, der: .035, ...tomaFila(b, i, sg)});
    const tAcc = ['tachar', 'sello', 'barrido', 'cuenta'].includes(b.efecto) ? 1.4 : 1.05;
    if (D > tAcc + 1.0) tomas.push({t: b.t + tAcc, dur: .5, ease: E.out5, der: .05, ...tomaObjeto(b, i, -sg)});
  });
  tomas.push({t: tC - .1, dur: .55, ease: E.out5, der: .03, ...tomaCierre});
  tomas.push({t: tR - .05, dur: 1.0, ease: E.io3, der: 0, ...ANCHO});
  tomas.sort((a, b) => a.t - b.t);
  tomas.forEach((s, i) => { s.P = new THREE.Vector3(...s.p); s.Mv = new THREE.Vector3(...s.m); s.fin = i < tomas.length - 1 ? tomas[i + 1].t : 1e9; });
  console.log('LOG tomas', tomas.length, 'ancho e', ANCHO.e.toFixed(0), 'h', ANCHO.p[1].toFixed(2), 'FC', FC, 'RF', RF, 'NV', NV, 'lineas', lineas.length, 'heroe', heroTipo);
  const pA_ = new THREE.Vector3(), mA_ = new THREE.Vector3(), pB_ = new THREE.Vector3(), mB_ = new THREE.Vector3();
  const pose = (s, t, oP, oM) => { const k = s.der * clamp((t - s.t) / Math.max(.6, s.fin - s.t)); oP.copy(s.P).lerp(s.Mv, k); oM.copy(s.Mv); };
  function camara(t) {
    let i = 0; while (i < tomas.length - 1 && t >= tomas[i + 1].t) i++;
    const B = tomas[i]; pose(B, t, pB_, mB_); let fov = B.fov;
    if (i > 0) { const A = tomas[i - 1]; pose(A, B.t, pA_, mA_); const k = B.ease(seg(t, B.t, B.t + B.dur)); pB_.lerpVectors(pA_, pB_, k); mB_.lerpVectors(mA_, mB_, k); fov = lerp(A.fov, B.fov, k); }
    const env = Math.sin(Math.PI * clamp(t / T)); let sh = 0; for (const [a, f] of golpes) sh += pulso(t, a, .22) * f;
    pB_.x += ruido(t * .9, 3) * .012 * env + sh * .018; pB_.y += ruido(t * .8, 5) * .01 * env + sh * .012;
    for (const b of golpesF) fov -= 5 * E.out3(seg(t, b.t - .03, b.t + .05)) * (1 - E.io2(seg(t, b.t + .05, b.t + .55)));
    cam.position.copy(pB_); cam.lookAt(mB_); if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
  }

  // ── interfaz: logo y karaoke de marca (izquierda, subrayado naranja) ──────
  css(`.karaoke.mkt{left:80px;right:80px;text-align:left;font:700 70px/1.16 Manrope;color:${TINTA};-webkit-text-stroke:10px ${CREMA};paint-order:stroke fill;letter-spacing:-.3px;z-index:1}
    .karaoke.mkt span{position:relative;display:inline-block}
    .karaoke.mkt span.on{font:800 76px/1.1 Outfit;letter-spacing:-2px}
    .karaoke.mkt span.on::after{content:'';position:absolute;left:3px;right:3px;bottom:-4px;height:14px;border-radius:7px;background:${NARANJA};transform-origin:0 50%;transform:scaleX(var(--u,1));z-index:-1}
    .logo.lm img{height:44px;filter:drop-shadow(0 2px 6px rgba(80,40,10,.25))} .logo.lm span{font:700 30px Outfit;color:${TINTA};-webkit-text-stroke:6px ${CREMA};paint-order:stroke fill}`);
  logo('../marketing.png', 'Kocos Marketing', 'lm');
  const kar = karaoke(P, {max: 4, clase: 'mkt'});
  const raizCss = document.documentElement.style;
  function subrayado(t) { let j = -1; for (let i = 0; i < P.length; i++) if (t >= P[i].t - .03) j = i; raizCss.setProperty('--u', (j < 0 ? 1 : E.out3(clamp((t - P[j].t + .03) / .18))).toFixed(3)); }

  // ── cuadro a cuadro ───────────────────────────────────────────────────────
  const atG = gF.attributes.aG, atA = gF.attributes.aAng, atL = gF.attributes.aLit, gArr = atG.array, angArr = atA.array, litArr = atL.array;
  const cBr = new THREE.Color(0xFFE6C8);
  function update(t) {
    const apg = apgEn(t);
    camara(t);
    // cartel: paletas, fila activa y luces de estado
    let jb = -1; for (let i = 0; i < NB; i++) if (t >= beats[i].t - .12) jb = i; if (t >= tR) jb = -1;
    const ws = wsEn(t), a0 = jb >= 0 ? beats[jb].l0 - ws : -9, a1 = jb >= 0 ? a0 + beats[jb].nl : -9;
    const llenas = jb >= 0 ? Math.min(NV, beats[jb].l0 + beats[jb].nl - ws) : 0;
    for (let ci = 0; ci < NC; ci++) { const ce = celdas[ci], [A, B, an] = estadoCelda(ce, t);
      const lit = (ce.zona === 'L' || ce.zona === 'N') ? (ce.r >= a0 && ce.r < a1 ? 1.07 : .8 * lerp(.25, 1, apg)) : ce.zona === 'F' ? lerp(.4, 1, apg) : lerp(.3, 1, apg);
      for (let q = 0; q < 3; q++) { const j = ci * 3 + q; gArr[j * 2] = A; gArr[j * 2 + 1] = B; angArr[j] = an; litArr[j] = lit; } }
    atG.needsUpdate = atA.needsUpdate = atL.needsUpdate = true;
    leds.forEach((l, r) => { const act = r >= a0 && r < a1; l.material.emissiveIntensity = act ? 3.2 + 1.3 * Math.sin(t * 9) : r < llenas ? .45 * lerp(.4, 1, apg) : 0; });
    // objetos
    for (const it of inst) {
      let o = null, w = null; for (const v of it.ventanas) { if (t >= v.a && t <= v.b + .3) { w = v; break; } }
      if (w) { o = {dx: 0, dy: 0, dz: 0, s: 1, sy: 1, sxz: 1, rx: 0, ry: 0, rz: 0, pres: 1, desp: -1}; entrada(w.ent, t - w.a, o); if (t > w.b) salida(w.sal, t - w.b, o); }
      it.g.visible = it.sm.visible = !!o; if (!o) continue;
      const g = it.g, s = Math.max(.001, o.s) * OS; g.position.set(xP + o.dx, hTop + o.dy, zP + o.dz); g.scale.set(s * o.sxz, Math.max(.001, s * o.sy), s * o.sxz);
      g.rotation.set(o.rx, it.yaw + o.ry + .05 * Math.sin(fase(t) + it.k), o.rz);
      const ud = g.userData; if (ud.anim) ud.anim(t, t - w.a, !!w.heroe);
      ud.piezas.forEach((p, q) => { const b = p.userData.b; if (o.desp < 0) { p.position.copy(b.p); p.rotation.copy(b.r); return; }
        const k = E.out3(seg(o.desp, .07 * q, .07 * q + .55)); p.position.copy(b.p).addScaledVector(b.d, 1 - k); p.rotation.set(b.r.x + b.w.x * (1 - k), b.r.y + b.w.y * (1 - k), b.r.z + b.w.z * (1 - k)); });
      const br = w.ef === 'barrido' ? Math.exp(-Math.pow((t - (w.a + PRE[w.ent] + .95)) / .16, 2)) : 0;
      ud.brillan.forEach(m => { if (br > .01) { m.emissive.copy(cBr); m.emissiveIntensity = m.userData.i0 + br * .7; } else { m.emissive.copy(m.userData.e0); m.emissiveIntensity = m.userData.i0; } });
      const alt = Math.min(1, o.dy / 1.6); it.sm.scale.setScalar(ud.ancho * 1.35 * s * (1 - .4 * alt)); it.sm.material.opacity = .5 * o.pres * (1 - .7 * alt) * Math.min(1, s / OS);
    }
    // marcas sobre la fila (tachado, sello)
    for (const mc of marcas) { const b = beats[mc.i], r = b.l0 - ws, vis = t >= mc.t0 && t < tR + .08 && r >= 0 && r < NV; mc.m.visible = vis; if (!vis) continue;
      const y = filaY(r + (b.nl - 1) / 2);
      if (mc.tipo === 'tachar') { const L = LP * Math.min(LT, b.len) + .08, k = E.out3(seg(t, mc.t0, mc.t0 + .28)); mc.m.scale.x = Math.max(.001, L * k); mc.m.position.set(x0 + LP * 2 - .04 + L * k / 2, y, zB + .2); }
      else { const k = seg(t, mc.t0, mc.t0 + .18), x = Math.min(x0 + LP * (2 + Math.min(LT, b.len)) + .24, IW / 2 - .2); mc.m.position.set(x, y, zB + .22); mc.m.scale.setScalar(Math.max(.001, lerp(2.6, 1, E.outExpo(k)))); mc.m.rotation.set(0, 0, mc.rz * (1 - k) * 2 + mc.rz); } }
    // barrido y lupa
    let bv = false; for (const b of beats) { if (b.efecto !== 'barrido') continue; const k = seg(t, b.t + .6, b.t + 1.15); if (k > 0 && k < 1) { const r = b.l0 - ws; bv = true; banda.position.set(x0 - .3 + (IW + .6) * E.io2(k), filaY(r + (b.nl - 1) / 2), zB + .25); banda.material.opacity = .55 * Math.sin(k * Math.PI); } } banda.visible = bv;
    let lv = false; for (const b of beats) { if (b.efecto !== 'lupa') continue; const k = seg(t, b.t + .35, b.t + 1.7); if (k > 0 && k < 1) { const r = b.l0 - ws; lv = true; const xa = x0 + LP * (2 + Math.min(LT, b.len)) + .3, xb = x0 + LP * 2 + .2;
      lupa.position.set(lerp(xa, xb, E.io2(k)), filaY(r) + .02 * Math.sin(k * 9), zB + .45 + .25 * Math.sin(k * Math.PI)); lupa.rotation.z = -.15 + .1 * Math.sin(k * 6); lupa.scale.setScalar(E.outBack(seg(k, 0, .15)) * (1 - E.in3(seg(k, .85, 1))) + .001); } } lupa.visible = lv;
    // luces del hall (apagón, flash) y atmósfera
    hemi.intensity = .55 * lerp(.12, 1, apg); sol.intensity = 1.9 * lerp(.04, 1, apg); relleno.intensity = .35 * lerp(.08, 1, apg); scene.environmentIntensity = .42 * lerp(.12, 1, apg);
    cenital.intensity = 8 * (1 + 5 * (1 - apg)); conoA.material.uniforms.op.value = .5 * (1 - apg);
    manchas.forEach(([m, op]) => m.material.opacity = op * apg); haces.forEach(([m, op]) => m.material.opacity = op * apg * (.85 + .15 * Math.sin(fase(t) * .5))); globos.forEach(m => m.emissiveIntensity = 1.6 * lerp(.35, 1, apg));
    let fl = 0; for (const b of flashes) if (t >= b.t + .02) fl += Math.exp(-(t - b.t - .02) / .09); for (const b of golpesF) if (t >= b.t) fl += .25 * Math.exp(-(t - b.t) / .07);
    luzFlash.intensity = 90 * fl; M.cine.uniforms.flash.value = Math.min(.6, fl * .5); M.cine.uniforms.vineta.value = .3 + .3 * (1 - apg);
    const fp = fase(t); for (let i = 0; i < polvo.sem.length; i++) { const [a, b, c, d] = polvo.sem[i]; const u = a, A = [lado * 5.8, 8.6, 7.2], Bp = [lado * .6, 0, 6.0];
      polvo.pos[i * 3] = lerp(A[0], Bp[0], u) + (b - .5) * 1.6 + Math.sin(fp + d * 6.28) * .08; polvo.pos[i * 3 + 1] = lerp(A[1], Bp[1], u) + Math.sin(fp * .5 + c * 6.28) * .1; polvo.pos[i * 3 + 2] = lerp(A[2], Bp[2], u) + (c - .5) * 1.4 + Math.cos(fp + b * 6.28) * .08; }
    polvo.p.geometry.attributes.position.needsUpdate = true; polvo.p.material.opacity = .75 * apg;
    kar(t); subrayado(t);
    M.cine.uniforms.t.value = t * 11.7; M.comp.render();
  }
  return {update, total: T, eventos: ev.sort((a, b) => a[0] - b[0])};
}
