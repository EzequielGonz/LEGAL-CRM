// VITA · teatrito de cartulina de noche (Spotlight Stage), manejado por el plan de cada reel (atlas/planes/<id>.json).
// Telón de terciopelo, escenario de madera, decorado de cartulina en capas, haz de luz con neblina y Nico de narrador.
import {motor, karaoke, logo, css, lienzo, texturaRuido, THREE, E, seg, lerp, clamp, ruido, resorte, pulso, hash} from '../base.js';

const NAVY = '#112250', ORO = '#D4AF37', CREMA = '#F5F4F0', ARENA = '#E7E2CE';

export default async function (datos, plan) {
  const M = await motor({fondo: 0x050407, fov: 30, exposicion: 1.05, entorno: .25, bloom: {fuerza: .32, radio: .5, umbral: .92},
    dof: {foco: 10, apertura: .0011, max: .006}, cine: {grano: .05, vineta: .42, ca: .0018, lift: [.012, .008, .02]}});
  const {scene, cam} = M; scene.fog = new THREE.FogExp2(0x0b0812, .016);
  const P = datos.palabras; const nrm = s => s.toLowerCase().replace(/[^a-záéíóúñ0-9]/g, ''); const tw = (txt, n = 0) => { const lst = P.filter(p => nrm(p.w).startsWith(nrm(txt))); if (!lst.length) throw Error('palabra ' + txt); return (lst[n] || lst[lst.length - 1]).t; };
  const T = datos.total;
  const ev = []; const sfx = (t, n, v = 1) => ev.push([+t.toFixed(3), n, v]);

  // ── materiales de cartón ────────────────────────────────────────────────
  const granoPapel = texturaRuido(256, {escala: 40, fuerza: .6, sem: 3});
  const canto = new THREE.MeshStandardMaterial({color: 0xd8c8a6, roughness: 1});
  // pieza de cartulina: contorno (puntos en unidades, origen abajo-izquierda) impreso con dibujar(ctx, k) y canto pálido
  function carton(w, h, contorno, dibujar, {prof = .018, px = 300, brillo = 0, tinta = .014, luz = null} = {}) {
    const sh = new THREE.Shape(); contorno(sh, w, h);
    const g = new THREE.ExtrudeGeometry(sh, {depth: prof, bevelEnabled: false, curveSegments: 28});
    const tx = lienzo(Math.round(w * px), Math.round(h * px), (x, cw, ch) => { x.save(); x.scale(px, px); x.translate(0, h); x.scale(1, -1); dibujar(x, w, h);
      for (let i = 0; i < w * h * 900; i++) { x.fillStyle = `rgba(${hash(i) > .5 ? '255,250,235' : '40,25,10'},${.035 + hash(i + 3) * .05})`; x.fillRect(hash(i + 7) * w, hash(i + 11) * h, .004, .004); }
      if (tinta) { const pts = sh.getPoints(32); x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p.x, p.y) : x.moveTo(p.x, p.y)); x.closePath(); x.lineWidth = tinta; x.strokeStyle = 'rgba(28,20,14,.9)'; x.lineJoin = 'round'; x.stroke(); }
      x.restore(); });
    tx.repeat.set(1 / w, 1 / h); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping;
    let em = brillo ? tx : null; if (luz) { em = lienzo(Math.round(w * px / 2), Math.round(h * px / 2), (x, cw, ch) => { x.fillStyle = '#000'; x.fillRect(0, 0, cw, ch); x.save(); x.scale(px / 2, px / 2); x.translate(0, h); x.scale(1, -1); luz(x, w, h); x.restore(); }); em.repeat.set(1 / w, 1 / h); }
    const cara = new THREE.MeshStandardMaterial({map: tx, roughness: .86, bumpMap: granoPapel, bumpScale: .4, emissive: 0xffffff, emissiveMap: em, emissiveIntensity: em ? (brillo || 1) : 0});
    const m = new THREE.Mesh(g, [cara, canto]); g.translate(-w / 2, 0, -prof / 2); m.castShadow = true; m.receiveShadow = true; m.userData.tx = tx; return m;
  }
  const rect = (s, w, h) => { s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h); s.lineTo(0, h); s.closePath(); };
  const poli = pts => (s) => { s.moveTo(...pts[0]); pts.slice(1).forEach(p => s.lineTo(...p)); s.closePath(); };
  // texto en canvas con coordenadas en unidades (y hacia arriba ya invertida por carton)
  const fuente = (x, peso, tam, fam = 'Manrope', it = '') => { x.font = `${it} ${peso} ${tam}px ${fam}`; };
  const txt = (x, s, cx, cy, tam, color, {peso = 800, fam = 'Manrope', it = '', alin = 'center'} = {}) => { x.save(); x.translate(cx, cy); x.scale(1 / 100, -1 / 100); fuente(x, peso, tam * 100, fam, it); x.fillStyle = color; x.textAlign = alin; x.textBaseline = 'middle'; x.fillText(s, 0, 0); x.restore(); };

  // ── sala: telón, arco dorado, piso de madera, candilejas, butacas ─────────
  const sala = new THREE.Group(); scene.add(sala);
  // piso de madera gastada
  const madera = lienzo(1024, 1024, (x, w, h) => {
    for (let i = 0; i < 9; i++) { const y0 = i * h / 9; const base = [107, 74, 47].map(c => c + (hash(i) - .5) * 26);
      x.fillStyle = `rgb(${base})`; x.fillRect(0, y0, w, h / 9);
      for (let k = 0; k < 26; k++) { x.strokeStyle = `rgba(40,24,12,${.06 + hash(i * 9 + k) * .1})`; x.lineWidth = 1 + hash(k) * 2; x.beginPath(); const yy = y0 + hash(i * 31 + k) * h / 9; x.moveTo(0, yy); x.bezierCurveTo(w * .3, yy + 4, w * .6, yy - 5, w, yy + 2); x.stroke(); }
      x.fillStyle = 'rgba(20,12,6,.8)'; x.fillRect(0, y0, w, 3); for (let k = 0; k < 3; k++) { const xx = hash(i * 5 + k) * w; x.fillRect(xx, y0, 3, h / 9); }
      x.fillStyle = 'rgba(255,230,190,.05)'; x.fillRect(0, y0 + 4, w, 6); }
  });
  madera.wrapS = madera.wrapT = THREE.RepeatWrapping; madera.repeat.set(1.4, 1.6);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), new THREE.MeshStandardMaterial({map: madera, roughness: .55, metalness: 0, bumpMap: granoPapel, bumpScale: .3}));
  piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, -1.0); piso.receiveShadow = true; sala.add(piso);
  const frente = new THREE.Mesh(new THREE.BoxGeometry(3.6, .42, .08), new THREE.MeshStandardMaterial({color: 0x24130b, roughness: .5})); frente.position.set(0, -.21, .7); sala.add(frente);
  const borde = new THREE.Mesh(new THREE.BoxGeometry(3.6, .05, .14), new THREE.MeshStandardMaterial({color: 0xb08a3a, metalness: .8, roughness: .35})); borde.position.set(0, -.01, .72); sala.add(borde);
  // candilejas: lamparitas con capuchón y luz cálida baja
  const bulbos = []; const matBulbo = new THREE.MeshStandardMaterial({color: 0xffe2a8, emissive: 0xffc070, emissiveIntensity: 3});
  for (let i = 0; i < 11; i++) { const x0 = -1.5 + i * .3; const b = new THREE.Mesh(new THREE.SphereGeometry(.035, 16, 12), matBulbo); b.position.set(x0, .04, .62); sala.add(b); bulbos.push(b);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .07, 18, 1, true, Math.PI, Math.PI), new THREE.MeshStandardMaterial({color: 0x3a2a16, metalness: .6, roughness: .4, side: THREE.DoubleSide})); cap.position.set(x0, .05, .66); cap.rotation.x = -.3; sala.add(cap); }
  const candil = []; for (const x0 of [-1.1, 0, 1.1]) { const l = new THREE.PointLight(0xffb060, 1.6, 3.2, 2); l.position.set(x0, .12, .5); sala.add(l); candil.push(l); }
  // telón de terciopelo con pliegues
  const velvet = new THREE.MeshPhysicalMaterial({color: 0x5e0b16, roughness: .78, sheen: 1, sheenColor: new THREE.Color(0xff4a5e), sheenRoughness: .45, side: THREE.DoubleSide});
  function cortina(w, h, pliegues, recogido) {
    const g = new THREE.PlaneGeometry(w, h, 90, 40); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const v = (y + h / 2) / h; const u = (x + w / 2) / w;
      const amp = .05 + .03 * (1 - v); p.setZ(i, Math.sin(u * pliegues * Math.PI * 2) * amp + Math.sin(u * pliegues * 5.3) * .012);
      if (recogido) { const k = Math.exp(-Math.pow((v - .32) / .12, 2)); p.setX(i, x - (recogido * (x + w / 2)) * k * .55); } }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, velvet); m.castShadow = true; m.receiveShadow = true; return m; }
  const cIzq = cortina(.9, 2.9, 6, 1); cIzq.position.set(-1.62, 1.4, .45); sala.add(cIzq);
  const cDer = cortina(.9, 2.9, 6, 1); cDer.scale.x = -1; cDer.position.set(1.62, 1.4, .45); sala.add(cDer);
  const bambalina = cortina(3.8, .7, 11, 0); bambalina.position.set(0, 2.6, .5); sala.add(bambalina);
  const fleco = new THREE.Mesh(new THREE.BoxGeometry(3.8, .05, .04), new THREE.MeshStandardMaterial({color: ORO, metalness: .9, roughness: .3})); fleco.position.set(0, 2.25, .55); sala.add(fleco);
  // arco dorado de cartón (marco con agujero)
  const arco = (() => { const w = 3.7, h = 3.15, ow = 2.98, oh = 2.45; const s = new THREE.Shape(); rect(s, w, h);
    const hole = new THREE.Path(); const x0 = (w - ow) / 2, y0 = .0; hole.moveTo(x0, y0); hole.lineTo(x0 + ow, y0); hole.lineTo(x0 + ow, y0 + oh - .35); hole.quadraticCurveTo(x0 + ow, y0 + oh, x0 + ow - .45, y0 + oh); hole.lineTo(x0 + .45, y0 + oh); hole.quadraticCurveTo(x0, y0 + oh, x0, y0 + oh - .35); hole.closePath(); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, {depth: .06, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2, curveSegments: 30}); g.translate(-w / 2, 0, 0);
    const tx = lienzo(1110, 945, (x, cw, ch) => { const gr = x.createLinearGradient(0, 0, cw, ch); gr.addColorStop(0, '#7d5d1c'); gr.addColorStop(.35, '#d9b95a'); gr.addColorStop(.55, '#f0d684'); gr.addColorStop(1, '#6f5117'); x.fillStyle = gr; x.fillRect(0, 0, cw, ch);
      const k = cw / w; x.strokeStyle = 'rgba(70,46,8,.7)'; x.lineWidth = 5; x.strokeRect(18, 18, cw - 36, ch - 36); x.lineWidth = 2; x.strokeRect(34, 34, cw - 68, ch - 68);
      const ox = (w - ow) / 2 * k, oh2 = (h - oh) * k; x.lineWidth = 4; x.strokeRect(ox - 22, 40, ow * k + 44, ch); x.lineWidth = 2; x.strokeRect(ox - 34, 30, ow * k + 68, ch);
      for (let i = 0; i < 26; i++) { const yy = 70 + i * 34; if (yy > ch - 40) break; [ox / 2, cw - ox / 2].forEach(cx => { x.beginPath(); x.ellipse(cx, yy, 9, 13, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(cx - 14, yy + 17); x.lineTo(cx + 14, yy + 17); x.stroke(); }); }
      for (let i = 0; i < 18; i++) { const xx = ox + (i + .5) * ow * k / 18; x.beginPath(); x.arc(xx, oh2 / 2 + 10, 12, 0, Math.PI * 2); x.stroke(); x.beginPath(); x.arc(xx, oh2 / 2 + 10, 4, 0, Math.PI * 2); x.stroke(); }
      [[ox / 2, oh2 / 2], [cw - ox / 2, oh2 / 2]].forEach(([cx, cy]) => { for (let r = 0; r < 8; r++) { x.beginPath(); x.ellipse(cx, cy, 30, 10, r * Math.PI / 8, 0, 7); x.stroke(); } });
      x.fillStyle = 'rgba(255,240,190,.08)'; for (let i = 0; i < 4000; i++) x.fillRect(hash(i) * cw, hash(i + 5) * ch, 2, 2); });
    tx.repeat.set(1 / w, 1 / h);
    const m = new THREE.Mesh(g, [new THREE.MeshStandardMaterial({map: tx, metalness: .55, roughness: .5, bumpMap: granoPapel, bumpScale: .5}), new THREE.MeshStandardMaterial({color: 0x6a4c14, metalness: .7, roughness: .4})]);
    m.position.set(0, -.0, .78); m.receiveShadow = true; return m; })(); sala.add(arco);
  // butacas en primer plano (siluetas fuera de foco)
  const matButaca = new THREE.MeshStandardMaterial({color: 0x3a0710, roughness: .7});
  for (let fila = 0; fila < 2; fila++) for (let i = -3; i <= 3; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(.2, .3, 6, 14), matButaca); b.rotation.z = Math.PI / 2; b.scale.set(1, 1.5, .5); b.position.set(i * .62 + fila * .31, -1.05 - fila * .35, 2.2 + fila * .9); sala.add(b); }

  // ── luces: seguidor con haz visible, laterales cálidos, luna de contraluz ──
  const hemi = new THREE.HemisphereLight(0x2a2a4a, 0x140a06, .18); scene.add(hemi);
  const luna = new THREE.DirectionalLight(0x7f9cff, .9); luna.position.set(-1, 4, -6); scene.add(luna);
  const lat1 = new THREE.SpotLight(0xffc98a, 18, 14, .42, .6, 1.6); lat1.position.set(-3.2, 4.6, 2.8); lat1.target.position.set(-.2, .6, -.8); lat1.castShadow = true; lat1.shadow.mapSize.set(1024, 1024); lat1.shadow.bias = -.0006; scene.add(lat1, lat1.target);
  const lat2 = new THREE.SpotLight(0xffd8a8, 10, 14, .42, .65, 1.6); lat2.position.set(3.4, 4.4, 2.4); lat2.target.position.set(.3, .6, -.8); scene.add(lat2, lat2.target);
  const seg1 = new THREE.SpotLight(0xfff1d6, 60, 20, .16, .35, 1.4); seg1.position.set(0, 6.2, 8.5); seg1.castShadow = true; seg1.shadow.mapSize.set(1024, 1024); seg1.shadow.bias = -.0006; scene.add(seg1, seg1.target);
  const flash = new THREE.PointLight(0xffffff, 0, 12, 1.2); flash.position.set(.4, 2.2, 3.2); scene.add(flash);
  // haz volumétrico: cono aditivo que se desvanece a lo largo y hacia los bordes
  const haz = (() => { const g = new THREE.CylinderGeometry(.01, 1, 1, 48, 24, true); g.translate(0, -.5, 0); g.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
      uniforms: {col: {value: new THREE.Color(0xfff0d0)}, op: {value: .35}},
      vertexShader: `varying float l;varying vec3 n,vv;void main(){l=-position.z;vec4 mv=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);vv=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform vec3 col;uniform float op;varying float l;varying vec3 n,vv;void main(){float e=pow(abs(dot(n,vv)),2.2);float a=op*e*smoothstep(1.,.05,l)*smoothstep(0.,.08,l);gl_FragColor=vec4(col*a,a);}`});
    const m = new THREE.Mesh(g, mat); m.renderOrder = 10; scene.add(m); return m; })();
  function apuntar(desde, hacia, radio) { haz.position.copy(desde); haz.lookAt(hacia); const L = desde.distanceTo(hacia) * 1.08; haz.scale.set(radio, radio, L); }
  // polvo en suspensión dentro del haz
  const polvo = (() => { const n = 500, pos = new Float32Array(n * 3), sem = []; for (let i = 0; i < n; i++) sem.push([hash(i), hash(i + 500), hash(i + 1000)]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const sp = lienzo(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(1, 'rgba(255,240,210,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
    const p = new THREE.Points(g, new THREE.PointsMaterial({size: .022, map: sp, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: .8, fog: false})); scene.add(p); return {p, sem, pos}; })();

  // ── decorado de cartulina en capas ────────────────────────────────────────
  // fondo: cielo nocturno pintado con estrellas y luna
  const cielo = carton(3.2, 3.1, rect, (x, w, h) => { const g = x.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#0a1230'); g.addColorStop(1, '#1b2a55'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { x.fillStyle = `rgba(255,248,220,${.4 + hash(i) * .6})`; x.beginPath(); x.arc(hash(i + 2) * w, h * .35 + hash(i + 7) * h * .65, .004 + hash(i + 9) * .009, 0, 7); x.fill(); } });
  cielo.position.set(0, 0, -2.3); scene.add(cielo);
  const luna3 = carton(.42, .42, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x, w, h) => { x.fillStyle = '#f4ecd2'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(180,170,140,.35)'; [[.13, .25, .05], [.27, .14, .03], [.3, .3, .04]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); }); }, {brillo: .45});
  luna3.scale.setScalar(.72); luna3.position.set(.85, 1.9, -2.2); scene.add(luna3);
  const lunaLuz = new THREE.PointLight(0xbfd0ff, .6, 3, 2); lunaLuz.position.set(.85, 2.0, -1.9); scene.add(lunaLuz);
  // perfil lejano de la ciudad
  const skyline = carton(3.2, 1.05, poli([[0, 0], [3.2, 0], [3.2, .55], [2.95, .55], [2.95, .8], [2.7, .8], [2.7, .62], [2.35, .62], [2.35, 1.0], [2.2, 1.05], [2.05, 1.0], [2.05, .7], [1.7, .7], [1.7, .5], [1.35, .5], [1.35, .86], [1.05, .86], [1.05, .6], [.7, .6], [.7, .92], [.42, .92], [.42, .58], [0, .58]]),
    (x, w, h) => { x.fillStyle = '#1a2240'; x.fillRect(0, 0, w, h); for (let i = 0; i < 60; i++) { if (hash(i * 3) < .5) continue; x.fillStyle = 'rgba(255,214,140,.85)'; x.fillRect(hash(i) * w, hash(i + 4) * .8, .03, .04); } }, {brillo: 1, luz: (x, w, h) => { for (let i = 0; i < 60; i++) { if (hash(i * 3) < .5) continue; x.fillStyle = '#ffc27a'; x.fillRect(hash(i) * w, hash(i + 4) * .8, .03, .04); } }});
  skyline.position.set(0, 0, -2.05); scene.add(skyline);
  // esquina: dos fachadas de Barracas con balcones y ventanas encendidas
  function fachada(w, h, base, sem) { return carton(w, h, poli([[0, 0], [w, 0], [w, h - .08], [w - .05, h], [.05, h], [0, h - .08]]), (x, cw, ch) => {
    x.fillStyle = base; x.fillRect(0, 0, cw, ch); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(0, ch - .14, cw, .05); x.fillRect(0, .55, cw, .03);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const wx = .12 + c * (cw - .44) , wy = .25 + r * .62; const on = hash(sem + r * 3 + c) > .3;
      x.fillStyle = on ? '#ffcf7a' : '#2a2f45'; x.fillRect(wx, wy, .2, .34); x.strokeStyle = '#3b3326'; x.lineWidth = .02; x.strokeRect(wx, wy, .2, .34); x.fillRect(wx + .095, wy, .01, .34);
      x.fillStyle = '#2b2a2e'; x.fillRect(wx - .03, wy - .03, .26, .025); for (let k = 0; k < 6; k++) x.fillRect(wx - .02 + k * .05, wy - .03, .008, .1); } },
    {brillo: 1.1, luz: (x, cw, ch) => { for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) { const wx = .12 + c * (cw - .44), wy = .25 + r * .62; if (hash(sem + r * 3 + c) > .3) { x.fillStyle = '#ffb85a'; x.fillRect(wx, wy, .2, .34); } } }}); }
  const casaIzq = fachada(1.0, 1.55, '#c9b48a', 4); casaIzq.position.set(-1.0, 0, -1.45); casaIzq.rotation.y = .32; scene.add(casaIzq);
  const casaDer = fachada(.95, 1.4, '#b98f73', 9); casaDer.position.set(1.05, 0, -1.5); casaDer.rotation.y = -.32; scene.add(casaDer);
  // farol de calle
  const farol = new THREE.Group(); farol.position.set(-.55, 0, -.95); scene.add(farol);
  const poste = carton(.06, 1.15, rect, (x, w, h) => { x.fillStyle = '#20232b'; x.fillRect(0, 0, w, h); }); farol.add(poste);
  const lampara = new THREE.Mesh(new THREE.SphereGeometry(.07, 20, 14), new THREE.MeshStandardMaterial({color: 0xffe0a0, emissive: 0xffb84d, emissiveIntensity: 0})); lampara.position.set(0, 1.2, 0); farol.add(lampara);
  const luzFarol = new THREE.PointLight(0xffb45a, 0, 2.6, 2); luzFarol.position.set(0, 1.15, .15); farol.add(luzFarol);
  // reloj de la esquina: 19:10
  const reloj = new THREE.Group(); reloj.position.set(.62, 0, -.85); scene.add(reloj);
  reloj.add(carton(.05, .9, rect, (x, w, h) => { x.fillStyle = '#1f2533'; x.fillRect(0, 0, w, h); }));
  const esfera = carton(.42, .42, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x, w, h) => { x.fillStyle = CREMA; x.fillRect(0, 0, w, h); x.strokeStyle = NAVY; x.lineWidth = .025; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - .02, 0, 7); x.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = NAVY; x.fillRect(w / 2 + Math.sin(a) * .16 - .006, h / 2 + Math.cos(a) * .16 - .006, .012, .012); } }, {brillo: .55});
  esfera.position.set(0, .82, .02); reloj.add(esfera);
  const aguja = (largo, ancho) => { const m = new THREE.Mesh(new THREE.BoxGeometry(ancho, largo, .008), new THREE.MeshStandardMaterial({color: NAVY})); m.geometry.translate(0, largo / 2, 0); m.position.set(0, 1.03, .04); reloj.add(m); return m; };
  const hora = aguja(.1, .022), minu = aguja(.15, .014);
  // calle de cartulina con senda peatonal
  const calle = carton(2.7, 1.15, rect, (x, w, h) => { x.fillStyle = '#4a4b52'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(240,236,220,.85)'; for (let i = 0; i < 7; i++) x.fillRect(.25 + i * .13, .12, .07, .42); x.fillStyle = 'rgba(0,0,0,.2)'; for (let i = 0; i < 40; i++) x.fillRect(hash(i) * w, hash(i + 1) * h, .04, .01); }, {prof: .01});
  calle.rotation.x = -Math.PI / 2; calle.position.set(0, .006, -.55); calle.castShadow = false; scene.add(calle);

  // ── autos chocados (cartón articulado con ruedas de broche) ───────────────
  function auto(color, techo, sem) { const gr = new THREE.Group(); const w = .95, h = .42;
    const c = carton(w, h, poli([[0, .1], [.03, .05], [.92, .05], [.95, .12], [.94, .2], [.78, .23], [.62, .4], [.3, .42], [.18, .26], [.04, .23]]), (x) => {
      x.fillStyle = color; x.fillRect(0, 0, w, h); x.fillStyle = '#9fc4e8'; x.beginPath(); x.moveTo(.33, .38); x.lineTo(.48, .38); x.lineTo(.48, .26); x.lineTo(.24, .26); x.closePath(); x.fill();
      x.beginPath(); x.moveTo(.52, .38); x.lineTo(.6, .38); x.lineTo(.73, .26); x.lineTo(.52, .26); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(.06, .19, .86, .012); x.fillStyle = '#ffe9a6'; x.fillRect(.89, .14, .05, .04); x.fillStyle = '#c0392b'; x.fillRect(.01, .14, .03, .04);
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(.47, .08, .01, .17); x.fillStyle = techo; x.fillRect(.3, .38, .3, .03); });
    gr.add(c); const ruedas = [];
    for (const xr of [-.28, .27]) { const r = carton(.17, .17, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x, w, h) => { x.fillStyle = '#18181c'; x.fillRect(0, 0, w, h); x.fillStyle = '#9aa0a8'; x.beginPath(); x.arc(w / 2, h / 2, .045, 0, 7); x.fill(); x.fillStyle = ORO; x.beginPath(); x.arc(w / 2, h / 2, .012, 0, 7); x.fill(); });
      r.geometry.translate(0, -.085, 0); r.position.set(xr, .085, .02); gr.add(r); ruedas.push(r); }
    gr.userData.ruedas = ruedas; return gr; }
  // ── Nico (cartulina articulada con broches dorados) ───────────────────────
  const nico = new THREE.Group(); nico.position.set(.84, 0, .2); scene.add(nico);
  const cuerpo = carton(.42, .78, poli([[.1, 0], [.19, 0], [.21, .36], [.23, .36], [.25, 0], [.34, 0], [.33, .4], [.37, .62], [.34, .74], [.08, .74], [.05, .62], [.09, .4]]), (x) => {
    x.fillStyle = '#2a2f3a'; x.fillRect(0, 0, .42, .42); x.fillStyle = '#3a5a8c'; x.fillRect(0, .38, .42, .4); x.fillStyle = '#1d1d22'; x.fillRect(0, 0, .42, .05);
    x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(.08, .6, .29, .02); });
  nico.add(cuerpo);
  const cabeza = new THREE.Group(); cabeza.position.set(0, .74, .012); nico.add(cabeza);
  const cara = carton(.3, .34, (s2, w, h) => s2.absellipse(w / 2, h / 2, w / 2, h / 2, 0, Math.PI * 2), (x, w, h) => {
    const g = x.createRadialGradient(w * .6, h * .55, .02, w / 2, h / 2, w * .6); g.addColorStop(0, '#d8a07c'); g.addColorStop(1, '#b57a58'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#2b1d14'; x.beginPath(); x.moveTo(0, h * .62); x.bezierCurveTo(w * .05, h * 1.05, w * .95, h * 1.08, w, h * .66); x.bezierCurveTo(w * .8, h * .78, w * .55, h * .74, w * .42, h * .8); x.bezierCurveTo(w * .3, h * .72, w * .12, h * .72, 0, h * .62); x.fill();
    x.fillStyle = '#fbf6ee'; x.beginPath(); x.ellipse(w * .36, h * .5, .024, .03, 0, 0, 7); x.ellipse(w * .64, h * .5, .024, .03, 0, 0, 7); x.fill();
    x.fillStyle = '#1c1410'; x.beginPath(); x.arc(w * .37, h * .49, .014, 0, 7); x.arc(w * .63, h * .49, .014, 0, 7); x.fill();
    x.strokeStyle = '#2b1d14'; x.lineWidth = .012; x.lineCap = 'round'; x.beginPath(); x.moveTo(w * .26, h * .6); x.lineTo(w * .43, h * .65); x.moveTo(w * .74, h * .6); x.lineTo(w * .57, h * .65); x.stroke();
    x.fillStyle = '#5a2320'; x.beginPath(); x.ellipse(w / 2, h * .27, .03, .022, 0, 0, 7); x.fill();
    x.fillStyle = 'rgba(232,120,120,.22)'; x.beginPath(); x.arc(w * .25, h * .36, .028, 0, 7); x.arc(w * .75, h * .36, .028, 0, 7); x.fill(); });
  cara.position.set(0, 0, 0); cabeza.add(cara);
  const brazo = new THREE.Group(); brazo.position.set(-.12, .66, .02); nico.add(brazo);
  const brazoP = carton(.09, .36, poli([[0, 0], [.09, 0], [.08, .36], [.01, .36]]), (x) => { x.fillStyle = '#3a5a8c'; x.fillRect(0, .2, .09, .16); x.fillStyle = '#c98e6b'; x.fillRect(0, 0, .09, .2); });
  brazoP.geometry.translate(0, -.33, 0); brazo.add(brazoP);
  const broche = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, .02, 16), new THREE.MeshStandardMaterial({color: ORO, metalness: .9, roughness: .25})); broche.rotation.x = Math.PI / 2; broche.position.set(0, 0, .02); brazo.add(broche);
  const vara = new THREE.Mesh(new THREE.BoxGeometry(.025, .5, .025), new THREE.MeshStandardMaterial({color: 0x6b4a2f, roughness: .8})); vara.position.set(0, .1, -.04); nico.add(vara);

  const testigo = (col, sem) => { const g = new THREE.Group(); const c = carton(.26, .62, poli([[.06, 0], [.2, 0], [.22, .44], [.13, .5], [.04, .44]]), (x) => { x.fillStyle = col; x.fillRect(0, 0, .26, .62); });
    const cab = carton(.15, .15, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x) => { x.fillStyle = '#d8b18f'; x.fillRect(0, 0, .2, .2); x.fillStyle = sem ? '#3b2a1c' : '#8a8f99'; x.fillRect(0, .09, .2, .1); });
    cab.position.set(0, .47, .01); g.add(c, cab); return g; };

  // ════ MOTOR DE GOLPES: la escena la arma el plan (atlas/planes/<id>.json) ════
  const PL = plan || {id: datos.id, gancho: datos.gancho || '', beats: [], contador: 0, cierre: 'Comentá «' + (datos.palabra || '') + '»'};
  const SEM = [...String(PL.id)].reduce((a, c) => a + c.charCodeAt(0), 0); const rnd = k => hash(SEM * 1.37 + k * 7.71);
  const twS = (w, n = 0) => { const lst = P.filter(p => nrm(p.w).startsWith(nrm(w || '~'))); return lst.length ? (lst[n] || lst[lst.length - 1]).t : null; };
  const fin = P[P.length - 1].t + P[P.length - 1].d;
  // texto que entra en un ancho dado (mide y achica)
  const txtFit = (x, s, cx, cy, maxW, tam, color, o = {}) => { x.save(); x.font = `${o.it || ''} ${o.peso || 800} 100px ${o.fam || 'Manrope'}`; const w = x.measureText(s).width / 100; x.restore(); txt(x, s, cx, cy, Math.min(tam, tam * maxW / Math.max(w * tam, .001)), color, o); };
  function partir(g) { const m = g.match(/^(.*?[.:?!»])\s+(.+)$/); if (m) return [m[1], m[2]]; const w = g.split(' '); const k = Math.ceil(w.length / 2); return [w.slice(0, k).join(' '), w.slice(k).join(' ')]; }

  // frontón dorado con el gancho del plan
  const [g1, g2] = partir(PL.gancho || '');
  const fronton = carton(3.3, .95, (s2, w, h) => { s2.moveTo(0, 0); s2.lineTo(w, 0); s2.lineTo(w, .42); s2.bezierCurveTo(w - .2, .5, w - .45, .62, w - .8, .7); s2.bezierCurveTo(w - 1.1, .78, w / 2 + .25, .8, w / 2, h); s2.bezierCurveTo(w / 2 - .25, .8, 1.1, .78, .8, .7); s2.bezierCurveTo(.45, .62, .2, .5, 0, .42); s2.closePath(); },
    (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#7a5a1a'); g.addColorStop(.45, '#e9cc6e'); g.addColorStop(.6, '#c9a24a'); g.addColorStop(1, '#6e5016'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = NAVY; x.beginPath(); x.roundRect(.22, .08, w - .44, .62, .08); x.fill(); x.strokeStyle = '#f3dc8e'; x.lineWidth = .014; x.beginPath(); x.roundRect(.26, .115, w - .52, .55, .06); x.stroke();
      txtFit(x, g1, w / 2, .5, w - .7, .19, CREMA, {peso: 800}); txtFit(x, g2, w / 2, .26, w - .7, .2, ORO, {peso: 700, fam: 'Playfair Display', it: 'italic'}); }, {brillo: .18, prof: .04, px: 360});
  fronton.position.set(0, 3.08, .82); scene.add(fronton);

  // ── biblioteca de objetos de cartulina (todos de ~0,8 de alto, apoyados en el piso) ──
  const C = carton, R = rect;
  const circulo = (s2, w, h) => s2.absarc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
  const redondo = r => (s2, w, h) => { s2.moveTo(r, 0); s2.lineTo(w - r, 0); s2.quadraticCurveTo(w, 0, w, r); s2.lineTo(w, h - r); s2.quadraticCurveTo(w, h, w - r, h); s2.lineTo(r, h); s2.quadraticCurveTo(0, h, 0, h - r); s2.lineTo(0, r); s2.quadraticCurveTo(0, 0, r, 0); };
  const conPata = (m, alto) => { const g = new THREE.Group(); m.position.y = alto; g.add(m); const p = C(.05, alto, R, (x) => { x.fillStyle = '#6b4a2f'; x.fillRect(0, 0, .05, alto); }, {tinta: .006}); p.position.z = -.03; g.add(p); return g; };
  const OBJ = {
    auto: () => { const g = auto(rnd(1) > .5 ? NAVY : '#b8433a', '#0c1838', 1); g.scale.setScalar(.9); return g; },
    choque: () => C(.6, .6, (s2, w, h) => { for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? .14 : .3; const px = w / 2 + Math.cos(a) * r, py = h / 2 + Math.sin(a) * r; i ? s2.lineTo(px, py) : s2.moveTo(px, py); } s2.closePath(); },
      (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#fffbe8'); g.addColorStop(.5, '#ffd34d'); g.addColorStop(1, '#f08a24'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {brillo: 1.2}),
    documento: () => conPata(C(.5, .66, R, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h); x.fillStyle = NAVY; x.fillRect(.06, h - .1, w - .12, .04); x.fillStyle = 'rgba(17,34,80,.35)'; for (let i = 0; i < 7; i++) x.fillRect(.06, .1 + i * .065, (w - .12) * (i % 3 ? 1 : .7), .012); x.fillStyle = ORO; x.beginPath(); x.arc(w - .1, .08, .04, 0, 7); x.fill(); }), .22),
    firma: () => conPata(C(.56, .62, R, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(17,34,80,.3)'; for (let i = 0; i < 5; i++) x.fillRect(.06, .3 + i * .055, w - .12, .01); x.strokeStyle = NAVY; x.lineWidth = .012; x.beginPath(); x.moveTo(.08, .15); x.bezierCurveTo(.15, .26, .2, .05, .27, .17); x.bezierCurveTo(.33, .26, .37, .08, .46, .16); x.stroke(); x.fillStyle = '#9a9aa8'; x.fillRect(.06, .09, w - .12, .008); }), .22),
    celular: () => conPata(C(.36, .66, redondo(.05), (x, w, h) => { x.fillStyle = '#16181f'; x.fillRect(0, 0, w, h); x.fillStyle = '#e9eef7'; x.fillRect(.03, .05, w - .06, h - .1); x.fillStyle = '#25d366'; x.beginPath(); x.roundRect(.06, .42, w - .12, .12, .03); x.fill(); x.fillStyle = '#fff'; x.fillRect(.09, .47, w - .2, .02); x.fillStyle = NAVY; x.fillRect(.06, .3, w - .16, .05); x.fillRect(.06, .22, w - .22, .05); }), .2),
    almanaque: () => conPata(C(.56, .6, R, (x, w, h) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8433a'; x.fillRect(0, h - .13, w, .13); x.fillStyle = 'rgba(17,34,80,.55)'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) x.fillRect(.05 + c * .08, .06 + r * .09, .05, .05); x.strokeStyle = ORO; x.lineWidth = .016; x.beginPath(); x.arc(.05 + 3 * .08 + .025, .06 + 2 * .09 + .025, .05, 0, 7); x.stroke(); }), .22),
    reloj: () => conPata(C(.5, .5, circulo, (x, w, h) => { x.fillStyle = CREMA; x.fillRect(0, 0, w, h); x.strokeStyle = NAVY; x.lineWidth = .025; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - .02, 0, 7); x.stroke(); x.lineWidth = .02; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2, h / 2 + .17); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + .12, h / 2 - .04); x.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.fillStyle = NAVY; x.fillRect(w / 2 + Math.sin(a) * .19 - .006, h / 2 + Math.cos(a) * .19 - .006, .012, .012); } }, {brillo: .2}), .3),
    balanza: () => C(.8, .78, (s2, w, h) => { s2.moveTo(.33, 0); s2.lineTo(.47, 0); s2.lineTo(.43, .08); s2.lineTo(.42, .62); s2.lineTo(.74, .62); s2.lineTo(.8, .38); s2.lineTo(.56, .38); s2.lineTo(.6, .62); s2.lineTo(.42, .64); s2.lineTo(.42, .78); s2.lineTo(.38, .78); s2.lineTo(.38, .64); s2.lineTo(.2, .62); s2.lineTo(.24, .38); s2.lineTo(0, .38); s2.lineTo(.06, .62); s2.lineTo(.38, .62); s2.lineTo(.37, .08); s2.closePath(); },
      (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#8a6a22'); g.addColorStop(.5, '#f0d684'); g.addColorStop(1, '#7a5a1a'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {brillo: .25}),
    casco: () => C(.7, .45, (s2, w, h) => { s2.moveTo(0, 0); s2.lineTo(w, 0); s2.lineTo(w, .07); s2.lineTo(w - .08, .07); s2.bezierCurveTo(w - .08, .38, w - .2, h, w / 2, h); s2.bezierCurveTo(.2, h, .08, .38, .08, .07); s2.lineTo(0, .07); s2.closePath(); },
      (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#c98d00'); g.addColorStop(.5, '#ffd23a'); g.addColorStop(1, '#b07a00'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(w / 2 - .02, .07, .04, h); }),
    ambulancia: () => { const g = new THREE.Group(); const c = C(1.0, .56, poli([[0, .08], [1.0, .08], [1.0, .45], [.78, .45], [.72, .56], [0, .56]]), (x, w, h) => { x.fillStyle = '#f4f4f0'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8433a'; x.fillRect(0, .2, w, .06); x.fillStyle = '#2f6fd6'; x.fillRect(.3, .5, .12, .06); x.fillStyle = '#9fc4e8'; x.fillRect(.8, .3, .14, .12); });
      g.add(c); for (const xr of [-.3, .3]) { const r = C(.18, .18, circulo, (x, w, h) => { x.fillStyle = '#18181c'; x.fillRect(0, 0, w, h); x.fillStyle = '#9aa0a8'; x.beginPath(); x.arc(w / 2, h / 2, .045, 0, 7); x.fill(); }); r.position.set(xr, 0, .02); g.add(r); } g.scale.setScalar(.85); return g; },
    testigo: () => { const g = new THREE.Group(); const a = testigo('#5d7b6f', 1), b2 = testigo('#8b6a9b', 0); a.position.x = -.16; b2.position.set(.16, 0, -.05); g.add(a, b2); g.scale.setScalar(1.25); return g; },
    camara: () => conPata(C(.56, .4, redondo(.05), (x, w, h) => { x.fillStyle = '#20232b'; x.fillRect(0, 0, w, h); x.fillStyle = '#3a3f4c'; x.fillRect(0, h - .08, w, .08); x.fillStyle = '#0d0f14'; x.beginPath(); x.arc(w / 2, h / 2 - .02, .13, 0, 7); x.fill(); x.fillStyle = '#5b7bd6'; x.beginPath(); x.arc(w / 2, h / 2 - .02, .07, 0, 7); x.fill(); x.fillStyle = '#fff'; x.fillRect(w - .13, h - .07, .08, .04); }), .28),
    billete: () => conPata(C(.72, .36, R, (x, w, h) => { x.fillStyle = '#6f9b6b'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2e4f2c'; x.lineWidth = .012; x.strokeRect(.03, .03, w - .06, h - .06); x.fillStyle = '#e9f0dc'; x.beginPath(); x.arc(w / 2, h / 2, .1, 0, 7); x.fill(); x.fillStyle = '#2e4f2c'; x.fillRect(.07, .07, .08, .05); x.fillRect(w - .15, h - .12, .08, .05); }), .3),
    sobre: () => conPata(C(.66, .44, R, (x, w, h) => { x.fillStyle = '#efe3c6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#b39a6a'; x.lineWidth = .01; x.beginPath(); x.moveTo(0, h); x.lineTo(w / 2, h * .42); x.lineTo(w, h); x.stroke(); x.fillStyle = '#b8433a'; x.beginPath(); x.arc(w / 2, h * .42, .045, 0, 7); x.fill(); }), .26),
    martillo: () => C(.7, .55, poli([[.05, .3], [.35, .3], [.35, .22], [.62, .22], [.62, .5], [.35, .5], [.35, .38], [.05, .38]]), (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5a3418'); g.addColorStop(1, '#8a5a30'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = ORO; x.fillRect(.4, .22, .03, .28); x.fillRect(.54, .22, .03, .28); }),
    edificio: () => C(.66, .95, poli([[0, 0], [.66, 0], [.66, .85], [.33, .95], [0, .85]]), (x, w, h) => { x.fillStyle = '#7a8296'; x.fillRect(0, 0, w, h); for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) { x.fillStyle = hash(r * 3 + c + SEM) > .4 ? '#ffcf7a' : '#2a2f45'; x.fillRect(.08 + c * .2, .1 + r * .14, .1, .08); } }, {luz: (x, w, h) => { for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (hash(r * 3 + c + SEM) > .4) { x.fillStyle = '#ffb85a'; x.fillRect(.08 + c * .2, .1 + r * .14, .1, .08); } }, brillo: 1}),
    sello: () => conPata(C(.42, .42, circulo, (x, w, h) => { x.fillStyle = ORO; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff6d8'; x.lineWidth = .02; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - .03, 0, 7); x.stroke(); x.lineWidth = .045; x.beginPath(); x.moveTo(.11, .22); x.lineTo(.19, .13); x.lineTo(.32, .3); x.stroke(); }, {brillo: .5}), .3),
    nico: () => new THREE.Group(),
    globo: (texto) => { const w = 1.15, h = .5; const m = C(w, h + .12, poli([[0, .12], [w * .62, .12], [w * .7, 0], [w * .76, .12], [w, .12], [w, h + .12], [0, h + .12]]), (x) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h + .2); const [a, b] = partir(texto || '…'); txtFit(x, a, w / 2, .5, w - .12, .12, NAVY); txtFit(x, b, w / 2, .3, w - .12, .12, NAVY); }, {tinta: .01});
      const g = new THREE.Group(); m.position.y = .55; g.add(m); return g; },
  };
  const generico = () => conPata(C(.5, .5, redondo(.08), (x, w, h) => { x.fillStyle = '#efe6cf'; x.fillRect(0, 0, w, h); x.fillStyle = ORO; x.beginPath(); x.arc(w / 2, h / 2, .12, 0, 7); x.fill(); }), .25);
  const hacer = (b) => { const f = OBJ[b.objeto] || generico; const o = f(b.texto); o.traverse(m => { if (m.isMesh) { m.castShadow = true; } }); return o; };

  // cartel colgante para el texto de cada golpe (crema; navy si es giro)
  function cartel(texto, giro) { const w = 1.36, h = .36; const g = new THREE.Group();
    const c = C(w, h, redondo(.04), (x) => { x.fillStyle = giro ? NAVY : '#efe6cf'; x.fillRect(0, 0, w, h); x.strokeStyle = ORO; x.lineWidth = .014; x.strokeRect(.035, .035, w - .07, h - .07); txtFit(x, texto, w / 2, h / 2, w - .18, .16, giro ? ORO : NAVY, giro ? {peso: 700, fam: 'Playfair Display', it: 'italic'} : {peso: 800}); }, {brillo: .15});
    g.add(c); for (const sx of [-.56, .56]) { const cu = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, 1.6, 5), new THREE.MeshStandardMaterial({color: 0xcbb98f})); cu.position.set(sx, h + .8, 0); g.add(cu); } return g; }
  const tachonG = new THREE.Mesh(new THREE.PlaneGeometry(1, .06), new THREE.MeshStandardMaterial({color: ORO, emissive: ORO, emissiveIntensity: 2, metalness: .6, roughness: .3})); tachonG.geometry.translate(.5, 0, 0); scene.add(tachonG); tachonG.visible = false;
  const selloG = carton(.5, .5, circulo, (x, w, h) => { x.fillStyle = ORO; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff3c9'; x.lineWidth = .016; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - .03, 0, 7); x.stroke(); txtFit(x, PL.palabra || '✓', w / 2, h / 2, w - .1, .12, NAVY, {peso: 800}); }, {brillo: .7, tinta: 0}); selloG.visible = false; scene.add(selloG);
  const lupa = new THREE.Group(); { const aro = new THREE.Mesh(new THREE.TorusGeometry(.2, .025, 12, 40), new THREE.MeshStandardMaterial({color: ORO, metalness: .9, roughness: .25})); const vidrio = new THREE.Mesh(new THREE.CircleGeometry(.2, 40), new THREE.MeshPhysicalMaterial({color: 0xddeeff, transmission: .6, roughness: .05, transparent: true, opacity: .35}));
    const mango = new THREE.Mesh(new THREE.CylinderGeometry(.025, .03, .3, 12), new THREE.MeshStandardMaterial({color: 0x3a2412})); mango.position.set(.2, -.28, 0); mango.rotation.z = .6; lupa.add(aro, vidrio, mango); } lupa.visible = false; scene.add(lupa);
  const confeti = []; for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(.07, .05), new THREE.MeshStandardMaterial({color: [0xD4AF37, 0xefe6cf, 0x112250][i % 3], side: THREE.DoubleSide, emissive: 0x221a08})); m.visible = false; scene.add(m); confeti.push(m); }

  // atril: contador k/N y cierre
  const atril = new THREE.Group(); atril.position.set(-.66, 0, .52); atril.rotation.y = .16; atril.scale.setScalar(.72); scene.add(atril);
  atril.add(carton(.06, .55, R, (x) => { x.fillStyle = '#6b4a2f'; x.fillRect(0, 0, .06, .55); }));
  const N = Math.max(0, PL.contador | 0); const placas = {};
  const placa = (k, dib) => { const p = carton(.62, .42, R, (x, w, h) => { x.fillStyle = '#efe6cf'; x.fillRect(0, 0, w, h); x.strokeStyle = NAVY; x.lineWidth = .014; x.strokeRect(.025, .025, w - .05, h - .05); dib(x, w, h); }); p.geometry.translate(0, -.21, 0); p.position.set(0, .76, .02); p.visible = false; atril.add(p); placas[k] = p; };
  for (let k = 1; k <= N; k++) placa('p' + k, (x, w) => { txt(x, `${k}/${N}`, w / 2, .24, .17, NAVY, {peso: 800}); x.fillStyle = ORO; x.fillRect(.12, .08, (w - .24) * k / N, .03); x.strokeStyle = NAVY; x.lineWidth = .006; x.strokeRect(.12, .08, w - .24, .03); });
  const cierreTxt = (PL.cierre || '').replace(/^Coment[aá]\s*/i, ''); placa('cierre', (x, w) => { txt(x, 'comentá', w / 2, .3, .07, NAVY, {peso: 700}); txtFit(x, cierreTxt.replace(/[«»"]/g, ''), w / 2, .16, w - .12, .13, ORO, {peso: 800}); });

  // ── golpes en el tiempo ──
  const B = (PL.beats || []).map((b, i) => ({...b, i}));
  const tVoz0 = P[0].t; B.forEach((b, i) => { const t = twS(b.palabra, b.n || 0); b.t0 = t != null ? t : tVoz0 + (fin - tVoz0) * i / Math.max(1, B.length); });
  for (let i = 1; i < B.length; i++) if (B[i].t0 <= B[i - 1].t0 + .4) B[i].t0 = B[i - 1].t0 + .9;
  B.forEach((b, i) => { b.t1 = i < B.length - 1 ? B[i + 1].t0 : fin + .2; });
  const tCierre = Math.max(fin - 3.2, B.length ? B[B.length - 1].t0 : fin - 3);
  const SLOTS = [[0, 0, .05], [-.58, 0, -.3], [.12, 0, -.55], [-.25, 0, .15], [.35, 0, -.15]];
  let pasoK = 0;
  B.forEach((b, i) => { b.obj = hacer(b); b.slot = SLOTS[(i + (SEM % 3)) % SLOTS.length]; if (b.objeto === 'globo') b.slot = [.25, .22, .2]; b.obj.visible = false; scene.add(b.obj);
    b.card = b.texto && b.objeto !== 'globo' ? cartel(b.texto, b.tipo === 'giro') : null; if (b.card) { b.card.visible = false; scene.add(b.card); }
    if (b.tipo === 'paso' && N) b.paso = Math.min(N, ++pasoK);
    const e = b.efecto; const t = b.t0;
    sfx(t - .05, {golpe: 'boom', caida: 'whoosh', rebote: 'pop', giro: 'whoosh', tachar: 'rasgu', sello: 'sello', flash: 'foto', apagon: 'foco', lupa: 'whoosh_largo', despiece: 'papel', barrido: 'whoosh_largo', cuenta: 'flap'}[e] || 'pop', .85);
    if (b.card) sfx(t + .05, 'papel', .45); if (e === 'tachar') sfx(t + .5, 'thud', .5); if (e === 'despiece') sfx(t + .35, 'pop', .6); });
  sfx(0, 'ciudad', .3); sfx(.05, 'foco', .7); sfx(tCierre, 'chime', .6); sfx(T - .3, 'foco', .6);

  // ── cámara: plano general (gancho legible) → planos por golpe → plano general (loop) ──
  const ANCHO = [[0, 1.75, 15.2], [0, 1.17, 0]];
  const tg = Math.tan(cam.fov / 2 * Math.PI / 180);
  const plano = (d, x = 0, piso = 1250, z = -.2, alza = .32) => { const ly = (piso - 960) / (960 / (d * tg)); return [[x, ly + alza, z + d], [x, ly, z]]; };
  const tipos = [d => plano(5.4, d * .55, 1300, 0), d => plano(4.6, d * .8, 1320, -.1, .12), d => plano(7.6, 0, 1240), d => plano(6.0, d * .4, 1280, 0, .55), d => plano(5.0, d * .7 + .15, 1290, -.2, .2)];
  const K = [[0, ...ANCHO], [1.5, ...ANCHO]];
  B.forEach((b, i) => { const sx = b.objeto === 'nico' ? .8 : b.slot[0]; let sh = tipos[(i + SEM) % tipos.length](sx); if (b.efecto === 'lupa' || b.efecto === 'golpe') sh = plano(4.2, sx, 1320, b.slot[2], .15); K.push([Math.max(K[K.length - 1][0] + .5, b.t0 + .25), ...sh]); });
  K.push([Math.max(K[K.length - 1][0] + .3, T - 1.4), ...plano(7.0, 0, 1250)]); K.push([T, ...ANCHO]);
  const mira = new THREE.Vector3();
  function camara(t) { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const [a, p0, l0] = K[i], [b, p1, l1] = K[i + 1]; const k = E.io3(seg(t, a, b));
    cam.position.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k)); mira.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k));
    let golpe = 0; B.forEach(b => { if (b.efecto === 'golpe') golpe += pulso(t, b.t0, .3); }); cam.position.x += ruido(t * .7, 1) * .006 + golpe * .03; cam.position.y += ruido(t * .6, 2) * .006 + golpe * .02;
    cam.fov = 30 - 4 * B.reduce((a, b) => a + (b.efecto === 'golpe' ? Math.exp(-Math.max(0, t - b.t0) / .25) * (t > b.t0 ? 1 : 0) : 0), 0); cam.updateProjectionMatrix(); cam.lookAt(mira); M.foco(cam.position.distanceTo(mira)); }

  // ── interfaz ──
  css(`.vita{font-family:Manrope;font-weight:700;font-size:72px;color:#fff;-webkit-text-stroke:14px ${NAVY};paint-order:stroke fill;letter-spacing:-.5px}
    .vita span.on{font-family:'Playfair Display';font-style:italic;color:${ORO};font-size:82px}
    .logo.lv{background:${NAVY};height:62px;border-radius:31px;padding:0 26px 0 16px;box-shadow:0 6px 24px rgba(0,0,0,.35)} .logo.lv img{height:42px} .logo.lv span{font:600 30px Manrope;color:${CREMA}}`);
  logo('../vita.png', 'VITA Abogados', 'lv');
  const kar = karaoke(P, {max: 4, clase: 'vita'});
  const vInter = new THREE.Vector3();

  function update(t) {
    camara(t);
    // estado por golpe
    let foco = new THREE.Vector3(0, .4, -.1), radio = .7, apg = 1, flashI = 0, enEscena = 0;
    B.forEach((b, i) => {
      const loopIn = i === 0 ? 1 - E.io3(seg(t, T - 1.1, T - .4)) : 1; // el primer objeto vuelve al final (loop)
      const entra = i === 0 ? (t < b.t1 + .2 ? 1 : seg(t, T - 1.1, T - .4)) : seg(t, b.t0 - .15, b.t0 + .45);
      const sale = i === 0 ? (t < b.t1 + .2 ? 0 : 1 - seg(t, T - 1.1, T - .4)) * seg(t, b.t1 + .2, b.t1 + .6) : seg(t, b.t1 + .15, b.t1 + .6);
      const vis = (entra > 0 && sale < 1) || (i === 0 && (t < b.t1 + .6 || t > T - 1.1)); b.obj.visible = vis && b.objeto !== 'nico';
      const [sx, sy, sz] = b.slot; const o = b.obj; o.position.set(sx, sy, sz); o.rotation.set(0, 0, 0); o.scale.setScalar(1);
      const k = i === 0 && t < b.t0 ? 1 : entra; const ks = resorte(k, 2.4, 5.5);
      switch (b.efecto) {
        case 'caida': o.position.y = sy + (1 - E.outBack(k, 1.2)) * 3; break;
        case 'giro': o.rotation.y = (1 - ks) * Math.PI / 2; break;
        case 'golpe': o.scale.setScalar(lerp(1.7, 1, E.outExpo(k))); break;
        case 'barrido': o.position.x = sx + (1 - E.out3(k)) * (rnd(i) > .5 ? 2.2 : -2.2); break;
        case 'despiece': { const dk = seg(t, b.t0 + .3, b.t0 + .5), rk = seg(t, b.t1 - .5, b.t1 - .2); const sc = 1 - E.in3(dk) * (1 - E.outBack(rk)); o.scale.setScalar(Math.max(.001, sc * ks));
          confeti.forEach((c, j) => { if (dk <= 0 || rk >= 1) return; c.visible = true; const a = j / confeti.length * Math.PI * 2 + i; const r = E.out3(dk) * (.6 + hash(j) * .4) * (1 - E.in3(rk)); c.position.set(sx + Math.cos(a) * r, sy + .4 + Math.sin(a) * r * .8, sz + .1); c.rotation.set(t * 4 + j, t * 3, j); }); break; }
        default: o.position.y = sy - (1 - ks) * .9; o.scale.y = Math.max(.001, .4 + .6 * ks);
      }
      if (sale > 0) { o.position.y -= E.in3(sale) * 1.2; o.rotation.z += sale * (i % 2 ? .4 : -.4); }
      o.rotation.z += Math.sin(t * 2.1 + i) * .015;
      if (b.objeto === 'globo') o.scale.multiplyScalar(1 + Math.exp(-Math.max(0, t - b.t0) / .3) * (t > b.t0 ? .06 : 0) * Math.sin((t - b.t0) * 15));
      // cartel colgante con el texto
      if (b.card) { const ci = E.outBack(seg(t, b.t0 - .05, b.t0 + .5), 1.1), co = E.in3(seg(t, b.t1 - .05, b.t1 + .4)); b.card.visible = ci > 0 && co < 1; b.card.position.set(lerp(-.12, .02, rnd(i + 9)), lerp(3.3, 1.02, ci) + co * 2.2, -.05); b.card.rotation.z = Math.sin((t - b.t0) * 3) * .05 * Math.exp(-Math.max(0, t - b.t0) * 1.2) + (rnd(i) - .5) * .04; }
      const activo = t >= b.t0 - .1 && t < b.t1; if (activo) { enEscena = i; foco.set(b.objeto === 'nico' ? .84 : sx, (b.objeto === 'globo' ? 1.1 : .45) + (b.efecto === 'caida' ? .1 : 0), sz); radio = b.efecto === 'apagon' || b.efecto === 'tachar' ? .42 : .6; }
      if ((b.efecto === 'apagon' || b.efecto === 'tachar') && t > b.t0 && t < b.t1) apg = Math.min(apg, 1 - .85 * seg(t, b.t0, b.t0 + .15) * (1 - seg(t, b.t1 - .3, b.t1)));
      if (b.efecto === 'flash') flashI += t >= b.t0 + .15 ? Math.exp(-(t - b.t0 - .15) / .08) : 0;
    });
    // tachón dorado y sello sobre el golpe activo que los pide
    const bt = B.find(b => b.efecto === 'tachar' && t > b.t0 && t < b.t1); tachonG.visible = !!bt;
    if (bt) { const tgt = bt.card || bt.obj; tgt.getWorldPosition(vInter); const w = bt.card ? 1.3 : .9; tachonG.position.set(vInter.x - w / 2, vInter.y + (bt.card ? .18 : .45), vInter.z + .04); tachonG.rotation.z = .1; tachonG.scale.x = w * E.out5(seg(t, bt.t0 + .25, bt.t0 + .6)) + .001; }
    const bs = B.find(b => b.efecto === 'sello' && t > b.t0 + .35 && t < b.t1); selloG.visible = !!bs;
    if (bs) { const kk = seg(t, bs.t0 + .35, bs.t0 + .6); bs.obj.getWorldPosition(vInter); selloG.position.set(vInter.x + .18, vInter.y + .5, vInter.z + .12); selloG.scale.setScalar(Math.max(.001, lerp(2.2, .9, E.outExpo(kk)))); selloG.rotation.z = -.2 - .3 * (1 - kk); }
    const bl = B.find(b => b.efecto === 'lupa' && t > b.t0 && t < b.t1); lupa.visible = !!bl;
    if (bl) { const kk = seg(t, bl.t0, bl.t1); bl.obj.getWorldPosition(vInter); lupa.position.set(vInter.x - .35 + .7 * E.io3(kk), vInter.y + .5 + Math.sin(kk * Math.PI) * .1, vInter.z + .3); }
    if (!B.some(b => b.efecto === 'despiece' && t > b.t0 + .3 && t < b.t1 - .2)) confeti.forEach(c => c.visible = false);
    // atril: paso actual o cierre
    let cual = null; B.forEach(b => { if (b.paso && t >= b.t0) cual = 'p' + b.paso; }); if (t >= tCierre && t < T - .7) cual = 'cierre';
    const cambio = [...B.filter(b => b.paso).map(b => b.t0), tCierre].reduce((a, c) => t >= c ? c : a, -9);
    for (const [k, p] of Object.entries(placas)) { p.visible = k === cual; if (k === cual) p.rotation.x = -Math.PI / 2 * (1 - E.outBack(seg(t, cambio, cambio + .35), 2)); }
    atril.visible = !!cual || (t > tCierre - .4 && t < T - .3); atril.position.y = -(1 - E.outBack(seg(t, (B.find(b => b.paso)?.t0 ?? tCierre) - .3, (B.find(b => b.paso)?.t0 ?? tCierre) + .2), 1.4)) * .9 * (cual ? 1 : 0) - E.in3(seg(t, T - .9, T - .4)) * .9;
    // Nico: narrador con gestos en cada golpe
    let gesto = 0; B.forEach(b => { gesto = Math.max(gesto, Math.exp(-Math.max(0, t - b.t0) / .5) * (t >= b.t0 ? 1 : 0)); });
    const enNico = B.find(b => b.objeto === 'nico' && t >= b.t0 && t < b.t1);
    nico.rotation.z = ruido(t * 1.2, 7) * .03 + gesto * .04 * Math.sin(t * 9); nico.position.y = (enNico ? .12 * Math.abs(Math.sin((t - enNico.t0) * 6)) * Math.exp(-(t - enNico.t0)) : 0);
    brazo.rotation.z = -.25 - gesto * 1.6 + .06 * Math.sin(t * 3); cabeza.rotation.z = gesto * .08 + ruido(t, 8) * .02;
    if (enNico) foco.set(.84, .9, .2);
    // luces: seguidor sobre el golpe activo, apagón cuando el golpe lo pide
    seg1.target.position.lerp(foco, .2); if (t < .05) seg1.target.position.copy(foco); seg1.target.updateMatrixWorld();
    seg1.intensity = 42 * (.55 + .45 * apg); seg1.angle = Math.atan(radio / seg1.position.distanceTo(seg1.target.position)) * 1.25;
    apuntar(seg1.position, seg1.target.position, radio * 1.1); haz.material.uniforms.op.value = .12 + .03 * Math.sin(t * 1.3);
    const dir = new THREE.Vector3().subVectors(seg1.target.position, seg1.position); for (let i = 0; i < polvo.sem.length; i++) { const [a, b2, c] = polvo.sem[i]; const s = (a + t * .015) % 1; const pp = new THREE.Vector3().copy(seg1.position).addScaledVector(dir, .55 + s * .45);
      pp.x += (b2 - .5) * radio * 1.8 * (.4 + s) + ruido(t * .3 + i, 3) * .05; pp.y += (c - .5) * radio * 1.8 * (.4 + s) + ruido(t * .25 + i, 4) * .05; polvo.pos.set([pp.x, pp.y, pp.z], i * 3); } polvo.p.geometry.attributes.position.needsUpdate = true;
    lat1.intensity = 18 * apg; lat2.intensity = 10 * apg; candil.forEach((l, i) => l.intensity = 1.6 * apg * (.85 + .15 * Math.sin(t * 7 + i))); matBulbo.emissiveIntensity = 3 * (.3 + .7 * apg);
    const parpadeo = t > .3 && t < .9 ? (Math.sin(t * 80) > 0 ? 1 : .2) : 1; lampara.material.emissiveIntensity = 3.2 * parpadeo * (.2 + .8 * apg); luzFarol.intensity = 1.4 * parpadeo * apg; lunaLuz.intensity = .6 * apg; hemi.intensity = .18 * apg; luna.intensity = .9 * apg;
    M.cine.uniforms.vineta.value = .42 + .5 * (1 - apg); M.cine.uniforms.tinte.value.set(.55 + .45 * apg, .55 + .45 * apg, .6 + .4 * apg);
    flash.intensity = 160 * flashI; M.cine.uniforms.flash.value = Math.min(.55, flashI * .5);
    esfera.material[0].emissiveIntensity = .15;
    kar(t); M.cine.uniforms.t.value = t * 11.7; M.comp.render();
  }
  return {update, total: T, eventos: ev};
}
