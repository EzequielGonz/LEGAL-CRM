// VITA · «Recién chocaste. Esta frase, nunca.» — estilo Spotlight Stage: teatrito de juguete de noche, telón de terciopelo,
// escenario de madera gastada, mundo de cartulina recortada en capas y haces de luz que cortan la neblina.
import {motor, karaoke, logo, css, lienzo, texturaRuido, THREE, E, seg, lerp, clamp, ruido, resorte, pulso, hash} from '../base.js';

const NAVY = '#112250', ORO = '#D4AF37', CREMA = '#F5F4F0', ARENA = '#E7E2CE';

export default async function (datos) {
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
  const autoA = auto(NAVY, '#0c1838', 1); autoA.position.set(-.48, 0, -.32); scene.add(autoA);
  const autoB = auto('#b8433a', '#7a2620', 2); autoB.scale.x = -1; autoB.position.set(.5, 0, -.28); scene.add(autoB);
  const estrella = carton(.5, .5, (s, w, h) => { for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2, r = i % 2 ? .12 : .25; const px = w / 2 + Math.cos(a) * r, py = h / 2 + Math.sin(a) * r; i ? s.lineTo(px, py) : s.moveTo(px, py); } s.closePath(); },
    (x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, '#fffbe8'); g.addColorStop(.5, '#ffd34d'); g.addColorStop(1, '#f08a24'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, {brillo: 1.4});
  estrella.position.set(.02, .2, -.25); scene.add(estrella);

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

  // globo de diálogo «Perdón, fue mi culpa» (se tacha en dorado y se rompe en dos mitades)
  const globo = new THREE.Group(); globo.position.set(.3, 1.2, .2); scene.add(globo);
  const mitad = (lado) => { const w = 1.12, h = .5; const m = carton(w / 2, h + .12, poli(lado < 0 ? [[0, .12], [.38, .12], [.46, 0], [.5, .12], [w / 2, .12], [w / 2 - .02, .3], [w / 2 + .01, .45], [w / 2, h + .12], [0, h + .12]] : [[0, .12], [w / 2, .12], [w / 2, h + .12], [0, h + .12], [-.01, .45], [.02, .3]]), (x) => {
      x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h + .2); x.save(); x.translate(lado < 0 ? 0 : -w / 2, 0); txt(x, '«Perdón,', w / 2, .5, .13, NAVY, {peso: 800}); txt(x, 'fue mi culpa»', w / 2, .3, .13, NAVY, {peso: 800}); x.restore(); }, {tinta: 0});
    m.geometry.translate(lado * w / 4, -.06 - h / 2, 0); return m; };
  const gIzq = mitad(-1), gDer = mitad(1); globo.add(gIzq, gDer);
  const entero = (() => { const w = 1.12, h = .5; const m = carton(w, h + .12, poli([[0, .12], [.38, .12], [.46, 0], [.5, .12], [w, .12], [w, h + .12], [0, h + .12]]), (x) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, h + .2); txt(x, '«Perdón,', w / 2, .5, .13, NAVY, {peso: 800}); txt(x, 'fue mi culpa»', w / 2, .3, .13, NAVY, {peso: 800}); }, {tinta: .01});
    m.geometry.translate(0, -.06 - h / 2, 0); return m; })(); globo.add(entero);
  // trazo dorado que tacha
  const tachon = new THREE.Mesh(new THREE.PlaneGeometry(1, .07), new THREE.MeshStandardMaterial({color: ORO, emissive: ORO, emissiveIntensity: 1.6, metalness: .6, roughness: .3}));
  tachon.geometry.translate(.5, 0, 0); tachon.position.set(-.52, .02, .03); tachon.rotation.z = .12; globo.add(tachon);
  const selloN = carton(.62, .24, rect, (x, w, h) => { x.fillStyle = ORO; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff3c9'; x.lineWidth = .012; x.strokeRect(.025, .025, w - .05, h - .05); txt(x, 'NUNCA', w / 2, h / 2, .15, NAVY, {peso: 800}); }, {brillo: .7, tinta: 0});
  selloN.position.set(.12, -.36, .05); selloN.rotation.z = -.16; globo.add(selloN);

  // frontón dorado del teatrito con el gancho en una cartela navy
  const fronton = carton(3.3, .95, (s2, w, h) => { s2.moveTo(0, 0); s2.lineTo(w, 0); s2.lineTo(w, .42); s2.bezierCurveTo(w - .2, .5, w - .45, .62, w - .8, .7); s2.bezierCurveTo(w - 1.1, .78, w / 2 + .25, .8, w / 2, h); s2.bezierCurveTo(w / 2 - .25, .8, 1.1, .78, .8, .7); s2.bezierCurveTo(.45, .62, .2, .5, 0, .42); s2.closePath(); },
    (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#7a5a1a'); g.addColorStop(.45, '#e9cc6e'); g.addColorStop(.6, '#c9a24a'); g.addColorStop(1, '#6e5016'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.fillStyle = NAVY; x.beginPath(); x.roundRect(.28, .08, w - .56, .62, .08); x.fill(); x.strokeStyle = '#f3dc8e'; x.lineWidth = .014; x.beginPath(); x.roundRect(.32, .115, w - .64, .55, .06); x.stroke();
      txt(x, 'Recién chocaste.', w / 2, .5, .19, CREMA, {peso: 800}); txt(x, 'Esta frase, nunca.', w / 2, .26, .2, ORO, {peso: 700, fam: 'Playfair Display', it: 'italic'}); }, {brillo: .18, prof: .04, px: 360});
  fronton.position.set(0, 3.08, .82); scene.add(fronton);

  // atril de cartón (contador y pedido)
  const atril = new THREE.Group(); atril.position.set(-.66, 0, .52); atril.rotation.y = .16; atril.scale.setScalar(.72); scene.add(atril);
  const pata = carton(.06, .55, rect, (x) => { x.fillStyle = '#6b4a2f'; x.fillRect(0, 0, .06, .55); }); atril.add(pata);
  const placas = {}; const placa = (clave, dib) => { const p = carton(.62, .42, rect, (x, w, h) => { x.fillStyle = '#efe6cf'; x.fillRect(0, 0, w, h); x.strokeStyle = NAVY; x.lineWidth = .014; x.strokeRect(.025, .025, w - .05, h - .05); dib(x, w, h); });
    p.geometry.translate(0, -.21, 0); p.position.set(0, .76, .02); p.visible = false; atril.add(p); placas[clave] = p; return p; };
  placa('nunca', (x, w, h) => { txt(x, 'comentá', w / 2, .3, .07, NAVY, {peso: 700}); txt(x, 'NUNCA', w / 2, .17, .15, ORO, {peso: 800}); });
  placa('3', (x, w, h) => { txt(x, '3 pasos', w / 2, .25, .12, NAVY, {peso: 800}); txt(x, 'antes de hablar', w / 2, .11, .055, NAVY, {peso: 700}); });
  for (let k = 1; k <= 3; k++) placa('p' + k, (x, w, h) => { txt(x, `${k}/3`, w / 2, .24, .17, NAVY, {peso: 800}); x.fillStyle = ORO; x.fillRect(.12, .08, (w - .24) * k / 3, .03); x.strokeStyle = NAVY; x.lineWidth = .006; x.strokeRect(.12, .08, w - .24, .03); });

  // paso 1: tendedero con tres polaroids (autos, patente genérica, esquina)
  const tend = new THREE.Group(); scene.add(tend);
  const curva = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.05, 1.66, -.15), new THREE.Vector3(0, 1.52, -.15), new THREE.Vector3(1.05, 1.66, -.15)]);
  const hilo = new THREE.Mesh(new THREE.TubeGeometry(curva, 40, .006, 6), new THREE.MeshStandardMaterial({color: 0xe8dcc0})); tend.add(hilo);
  const polas = ['autos', 'patente', 'esquina'].map((tipo, i) => { const p = carton(.44, .52, rect, (x, w, h) => { x.fillStyle = '#fbf8f0'; x.fillRect(0, 0, w, h); x.fillStyle = '#1c2236'; x.fillRect(.04, .14, w - .08, h - .18);
      if (tipo === 'autos') { x.fillStyle = NAVY; x.fillRect(.08, .2, .17, .08); x.fillStyle = '#b8433a'; x.fillRect(.25, .2, .17, .08); x.fillStyle = '#ffd34d'; x.beginPath(); x.arc(.25, .26, .04, 0, 7); x.fill(); }
      if (tipo === 'patente') { x.fillStyle = '#f2f2f2'; x.fillRect(.08, .26, .34, .12); x.fillStyle = '#1f3c88'; x.fillRect(.08, .35, .34, .03); x.fillStyle = '#333'; for (let k = 0; k < 7; k++) x.fillRect(.11 + k * .045, .28, .03, .05); }
      if (tipo === 'esquina') { x.fillStyle = '#c9b48a'; x.fillRect(.07, .17, .16, .3); x.fillStyle = '#b98f73'; x.fillRect(.27, .17, .16, .26); x.fillStyle = '#ffcf7a'; x.fillRect(.11, .3, .04, .06); x.fillRect(.31, .28, .04, .06); x.fillStyle = '#4a4b52'; x.fillRect(.04, .14, w - .08, .04); }
      txt(x, ['autos', 'patente', 'esquina'][i], w / 2, .07, .06, NAVY, {peso: 700}); });
    p.geometry.translate(0, -.52, 0); const g = new THREE.Group(); g.add(p); const pin = new THREE.Mesh(new THREE.BoxGeometry(.03, .08, .03), new THREE.MeshStandardMaterial({color: 0xd9b46a})); pin.position.set(0, -.01, .02); g.add(pin); tend.add(g); return g; });
  // paso 2: dos testigos de cartón (siluetas sin cara) y una libreta con datos
  const testigo = (col, sem) => { const g = new THREE.Group(); const c = carton(.26, .62, poli([[.06, 0], [.2, 0], [.22, .44], [.13, .5], [.04, .44]]), (x) => { x.fillStyle = col; x.fillRect(0, 0, .26, .62); });
    const cab = carton(.15, .15, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x) => { x.fillStyle = '#d8b18f'; x.fillRect(0, 0, .2, .2); x.fillStyle = sem ? '#3b2a1c' : '#8a8f99'; x.fillRect(0, .09, .2, .1); });
    cab.position.set(0, .47, .01); g.add(c, cab); return g; };
  const t1 = testigo('#5d7b6f', 1), t2 = testigo('#8b6a9b', 0); t1.position.set(-.22, 0, -.95); t2.position.set(.18, 0, -1.0); scene.add(t1, t2);
  const libreta = carton(.5, .38, rect, (x, w, h) => { x.fillStyle = '#ece4cf'; x.fillRect(0, 0, w, h); x.fillStyle = NAVY; x.fillRect(0, h - .07, w, .07); x.strokeStyle = 'rgba(17,34,80,.35)'; x.lineWidth = .006; for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(.05, .07 + i * .065); x.lineTo(w - .05, .07 + i * .065); x.stroke(); }
    txt(x, 'datos y testigos', w / 2, h - .035, .045, CREMA, {peso: 800}); ['nombre', 'DNI', 'seguro', 'teléfono'].forEach((s, i) => txt(x, s, .07, .26 - i * .065 + .02, .035, NAVY, {peso: 700, alin: 'left'})); });
  libreta.position.set(.05, 1.5, .1); scene.add(libreta);
  // paso 3: almanaque que baja con tres hojas y el sello dorado
  const alm = new THREE.Group(); scene.add(alm);
  const almBase = carton(.8, .9, rect, (x, w, h) => { x.fillStyle = NAVY; x.fillRect(0, 0, w, h); txt(x, 'aviso al seguro', w / 2, h - .08, .06, CREMA, {peso: 800}); }); alm.add(almBase);
  const hojas = [3, 2, 1].map(n => { const h = carton(.7, .68, rect, (x, w, hh) => { x.fillStyle = '#fbf8ef'; x.fillRect(0, 0, w, hh); x.fillStyle = '#b8433a'; x.fillRect(0, hh - .12, w, .12); txt(x, 'día', w / 2, hh - .06, .06, '#fff', {peso: 800}); txt(x, String(n), w / 2, .26, .34, NAVY, {peso: 800}); });
    h.geometry.translate(0, -.68, 0); const g = new THREE.Group(); g.position.set(0, .76, .02 + (3 - n) * .004); g.add(h); alm.add(g); return g; });
  const sello = carton(.36, .36, (s, w, h) => s.absarc(w / 2, h / 2, w / 2, 0, Math.PI * 2), (x, w, h) => { x.fillStyle = ORO; x.fillRect(0, 0, w, h); x.strokeStyle = '#fff6d8'; x.lineWidth = .02; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - .03, 0, 7); x.stroke(); x.lineWidth = .04; x.beginPath(); x.moveTo(.09, .19); x.lineTo(.16, .11); x.lineTo(.28, .27); x.stroke(); }, {brillo: .6});
  sello.scale.setScalar(.7); sello.position.set(.26, .14, .07); alm.add(sello);
  // avión de papel (mandáselo)
  const avion = new THREE.Group(); scene.add(avion);
  { const g = new THREE.BufferGeometry(); const v = new Float32Array([0, 0, .45, -.22, 0, -.18, 0, .02, -.12, 0, 0, .45, .22, 0, -.18, 0, .02, -.12, 0, 0, .45, 0, .02, -.12, 0, -.1, -.14]); g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.computeVertexNormals();
    avion.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: 0xfbf6e6, roughness: .7, side: THREE.DoubleSide, emissive: 0x6a6252}))); }

  // ── interfaz: logo y karaoke de marca ─────────────────────────────────────
  css(`.vita{font-family:Manrope;font-weight:700;font-size:70px;color:#fff;-webkit-text-stroke:14px ${NAVY};paint-order:stroke fill;letter-spacing:-.5px}
    .vita span.on{font-family:'Playfair Display';font-style:italic;color:${ORO};font-size:80px}
    .logo.lv{background:${NAVY};height:62px;border-radius:31px;padding:0 26px 0 16px;box-shadow:0 6px 24px rgba(0,0,0,.35)} .logo.lv img{height:42px} .logo.lv span{font:600 30px Manrope;color:${CREMA}}`);
  logo('../vita.png', 'VITA Abogados', 'lv');
  const kar = karaoke(P, {max: 4, clase: 'vita'});

  // ── línea de tiempo ───────────────────────────────────────────────────────
  const tDom = tw('domingo'), t19 = tw('19'), tRec = tw('recién'), tPer = tw('perdón'), tNun = tw('nunca'), tAnt = tw('antes'), tTres = tw('tres'), tUno = tw('uno'),
    tFot = tw('fotos'), tPat = tw('patente'), tEsq = tw('esquina'), tDos = tw('dos'), tDat = tw('datos'), tTes = tw('testigos'), tAvi = tw('avisá'), tDias = tw('días', 0),
    tMan = tw('mandáselo'), tPor = tw('porque'), tFin = P[P.length - 1].t + P[P.length - 1].d;
  const tTres3 = P.filter(p => nrm(p.w) === 'tres')[1]?.t ?? tAvi - .9;
  // eventos de sonido
  sfx(0, 'ciudad', .35); sfx(.05, 'foco', .8); sfx(t19 + .15, 'tick', .7); sfx(tRec - .1, 'whoosh', .4); sfx(tPer - .08, 'pop', .9); sfx(tNun + .05, 'rasgu', .9); sfx(tNun + .45, 'sello', 1); sfx(tNun + 1.0, 'papel', .8); sfx(tNun + 1.5, 'thud', .6); sfx(tPor + .2, 'pop', .7);
  sfx(tAnt - .1, 'foco', .7); sfx(tUno, 'flap', .5); sfx(tFot + .15, 'foto', 1); sfx(tPat + .05, 'foto', 1); sfx(tEsq + .05, 'foto', 1);
  sfx(tDos, 'flap', .5); sfx(tTes - .25, 'pop', .8); sfx(tTes + .05, 'pop', .7); sfx(tDat - .1, 'papel', .7); sfx(tTres3, 'flap', .5); sfx(tAvi - .3, 'whoosh_largo', .5);
  sfx(tDias - 1.0, 'papel', .6); sfx(tDias - .55, 'papel', .6); sfx(tDias + .15, 'sello', .9); sfx(tMan + .1, 'whoosh_largo', .7); sfx(tPor - .25, 'riser', .5); sfx(T - .25, 'foco', .7);

  // cámara: claves (pos, mira, foco) — la última igual a la primera para el loop
  const ANCHO = [[0, 1.75, 15.2], [0, 1.17, 0]];
  const tg = Math.tan(cam.fov / 2 * Math.PI / 180);
  const plano = (d, x = 0, piso = 1250, z = -.2) => { const ly = (piso - 960) / (960 / (d * tg)); return [[x, ly + .32, z + d], [x, ly, z]]; };
  const K = [
    [0, ...ANCHO],
    [tRec - .3, [0, 1.62, 13.6], [0, 1.1, 0]],
    [tPer - .1, ...plano(5.6, .45, 1310, 0)],
    [tNun + 1.5, ...plano(6.0, .35, 1290, 0)],
    [tAnt + .5, ...plano(8.2, 0, 1250)],
    [tFot, ...plano(6.4, 0, 1240)],
    [tEsq + .8, ...plano(6.6, .05, 1240)],
    [tDat, ...plano(6.0, -.25, 1250, -.4)],
    [tTres3 + .2, ...plano(6.6, 0, 1240)],
    [tMan, ...plano(6.0, .4, 1290, 0)],
    [tPor + .4, ...ANCHO],
    [T, ...ANCHO]];
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), mira = new THREE.Vector3();
  function camara(t) { let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const [a, p0, l0] = K[i], [b, p1, l1] = K[i + 1]; const k = E.io3(seg(t, a, b));
    cam.position.set(lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k), lerp(p0[2], p1[2], k)); mira.set(lerp(l0[0], l1[0], k), lerp(l0[1], l1[1], k), lerp(l0[2], l1[2], k));
    const sh = .006; cam.position.x += ruido(t * .7, 1) * sh; cam.position.y += ruido(t * .6, 2) * sh; cam.lookAt(mira); M.foco(cam.position.distanceTo(mira)); }

  function update(t) {
    const lt = t % T; // seguridad
    camara(t);
    // seguidor: apunta al foco de cada momento
    const blancos = [[0, [.2, .7, -.1], .75], [tPer - .2, [.45, 1.0, .1], .55], [tNun - .05, [.3, 1.12, .2], .42], [tNun + .6, [.3, 1.12, .2], .42], [tNun + 1.2, [0, .4, -.2], .6], [tFot, [0, 1.3, -.15], .6], [tDat, [-.5, .9, -.5], .62], [tTres3, [0, 1.5, -.1], .55], [tMan, [.6, .9, .2], .55], [tPor + .2, [.2, .7, -.1], .75], [T, [.2, .7, -.1], .75]];
    let j = 0; while (j < blancos.length - 2 && t > blancos[j + 1][0]) j++; const kk = E.io3(seg(t, blancos[j + 1][0] - .7, blancos[j + 1][0]));
    const bt = new THREE.Vector3(...blancos[j][1]).lerp(new THREE.Vector3(...blancos[j + 1][1]), kk); seg1.target.position.copy(bt); seg1.target.updateMatrixWorld();
    const abre = 1 - Math.max(0, pulso(t, 0, .5)) * 0; const arranque = E.out3(seg(t, 0, .25));
    const apg = 1 - .85 * seg(t, tNun - .05, tNun + .12) * (1 - seg(t, tNun + 1.7, tNun + 2.3)); seg1.intensity = 42 * (.55 + .45 * apg) * (t < .3 ? lerp(.85, 1, arranque) : 1) * (1 - .35 * seg(t, tAnt - .2, tAnt + .3) * (1 - seg(t, tFot - .5, tFot)));
    const radio = lerp(blancos[j][2], blancos[j + 1][2], kk); seg1.angle = Math.atan(radio / seg1.position.distanceTo(bt)) * 1.25;
    apuntar(seg1.position, bt, radio * 1.1); haz.material.uniforms.op.value = .12 + .03 * Math.sin(t * 1.3);
    // polvo en el haz
    const dir = new THREE.Vector3().subVectors(bt, seg1.position); for (let i = 0; i < polvo.sem.length; i++) { const [a, b, c] = polvo.sem[i]; const s = (a + t * .015) % 1; const pp = new THREE.Vector3().copy(seg1.position).addScaledVector(dir, .55 + s * .45);
      pp.x += (b - .5) * radio * 1.8 * (.4 + s) + ruido(t * .3 + i, 3) * .05; pp.y += (c - .5) * radio * 1.8 * (.4 + s) + ruido(t * .25 + i, 4) * .05; polvo.pos.set([pp.x, pp.y, pp.z], i * 3); }
    polvo.p.geometry.attributes.position.needsUpdate = true;
    // laterales bajan cuando habla de los pasos (un solo seguidor manda)
    const dim = 1 - .55 * seg(t, tAnt - .3, tAnt + .3) * (1 - seg(t, tPor - .4, tPor + .2));
    const apagon = 1 - .85 * seg(t, tNun - .05, tNun + .12) * (1 - seg(t, tNun + 1.7, tNun + 2.3)); lat1.intensity = 18 * dim * apagon; lat2.intensity = 10 * dim * apagon; candil.forEach((l, i) => l.intensity = 1.6 * apagon * (.85 + .15 * Math.sin(t * 7 + i))); matBulbo.emissiveIntensity = 3 * (.3 + .7 * apagon); luna.intensity = .9 * apagon; tachon.material.emissiveIntensity = 1.6 + 2.5 * (1 - apagon);
    // farol y reloj
    const enc = t < tDom ? 1 : 1; const parpadeo = t > .3 && t < .9 ? (Math.sin(t * 80) > 0 ? 1 : .2) : 1; lampara.material.emissiveIntensity = 3.2 * enc * parpadeo * (.2 + .8 * apg); luzFarol.intensity = 1.4 * enc * parpadeo * apg; lunaLuz.intensity = .6 * apg; hemi.intensity = .18 * apg; luna.intensity = .9 * apg; M.cine.uniforms.vineta.value = .42 + .5 * (1 - apg); M.cine.uniforms.tinte.value.set(.55 + .45 * apg, .55 + .45 * apg, .6 + .4 * apg); seg1.angle = Math.min(seg1.angle, apg < .5 ? .05 : 1);
    const m19 = 9 + E.outBack(seg(t, t19 + .1, t19 + .35)) * 1; const mm = (t > T - .5 ? 9 + (1 - seg(t, T - .4, T)) : m19); minu.rotation.z = -mm / 60 * Math.PI * 2; hora.rotation.z = -(19 % 12 + mm / 60) / 12 * Math.PI * 2;
    esfera.material[0].emissiveIntensity = .12 + .5 * Math.exp(-Math.max(0, t - t19) / .8) * (t > t19 ? 1 : 0);
    // choque congelado: leve vibración, estrella que late
    const tiemb = .004 * Math.sin(t * 30) * (t < tPer ? 1 : .3);
    autoA.position.x = -.48 + tiemb; autoB.position.x = .5 - tiemb; autoA.rotation.z = .02 + .01 * Math.sin(t * 2); autoB.rotation.z = -.02;
    estrella.scale.setScalar(.85 + .12 * Math.sin(t * 9)); estrella.rotation.z = t * .4; estrella.material[0].emissiveIntensity = 1.2 + .5 * Math.sin(t * 9);
    // Nico: balanceo de figura en vara, brazo a la cabeza al «recién chocaste»
    nico.rotation.z = ruido(t * 1.2, 7) * .03 + .04 * Math.sin(t * 2.3) * seg(t, tRec, tRec + .3) * (1 - seg(t, tNun, tNun + .5));
    nico.position.y = .015 * Math.abs(Math.sin(t * 5)) * seg(t, tPer - .2, tPer) * (1 - seg(t, tPer + 1.2, tPer + 1.5));
    const br = E.outBack(seg(t, tRec + .2, tRec + .6)) * (1 - E.io3(seg(t, tNun - .1, tNun + .4))); brazo.rotation.z = -.25 - br * 2.3 + .05 * Math.sin(t * 3); cabeza.rotation.z = .08 * br + ruido(t, 8) * .02;
    // globo: está desde el cuadro 1; en «Perdón» las palabras laten, en «Nunca» se tacha, recibe el sello y se rompe; al final se rearma (loop)
    const late = Math.exp(-Math.max(0, t - tPer) / .35) * (t > tPer ? 1 : 0) * Math.sin((t - tPer) * 14) * .04;
    const rompe = seg(t, tNun + .95, tNun + 1.9), rearme = resorte(seg(t, tPor + .2, tPor + .9), 2.2, 6);
    const enEscena = t < tNun + 1.9 || t > tPor + .2; globo.visible = enEscena;
    globo.scale.setScalar(Math.max(.001, (t > tPor + .2 ? rearme : 1) * (1 + late))); globo.rotation.z = .03 * Math.sin(t * 2);
    tachon.visible = t > tNun && t < tNun + 1.9; tachon.scale.x = E.out5(seg(t, tNun, tNun + .35)) * 1.04 + .0001;
    const skN = seg(t, tNun + .45, tNun + .7); selloN.visible = t > tNun + .43 && t < tNun + 1.9; selloN.scale.setScalar(Math.max(.001, lerp(2.4, 1, E.outExpo(skN)))); selloN.rotation.z = -.16 - .3 * (1 - skN);
    const caida = t > tPor ? 0 : E.in3(rompe); gIzq.position.set(-caida * .2, -caida * 1.3, 0); gIzq.rotation.z = caida * .9; gDer.position.set(caida * .25, -caida * 1.45, .02); gDer.rotation.z = -caida * 1.1;
    selloN.position.y = -.36 - caida * 1.4; const partido = t > tNun + .95 && t < tPor; entero.visible = !partido; gIzq.visible = gDer.visible = partido;
    // atril
    const cual = t < tUno ? '3' : t < tDos ? 'p1' : t < tTres3 ? 'p2' : t < tMan ? 'p3' : 'nunca'; atril.visible = t > tAnt - .1 && t < tPor + .7; atril.position.y = -(E.in3(seg(t, tPor + .1, tPor + .7)) + (1 - E.outBack(seg(t, tAnt - .1, tAnt + .4), 1.6))) * .9;
    for (const [k, p] of Object.entries(placas)) { p.visible = k === cual; }
    const cambio = [tAnt + .3, tUno, tDos, tTres3, tMan].reduce((a, c) => t >= c ? c : a, -9); placas[cual].rotation.x = -Math.PI / 2 * (1 - E.outBack(seg(t, cambio, cambio + .35), 2)) * (cambio > 0 ? 1 : 0);
    // paso 1: tendedero y polaroids con flash
    const tin = E.out3(seg(t, tFot - .5, tFot + .1)), tout = E.in3(seg(t, tDos - .1, tDos + .5)); tend.visible = tin > 0 && tout < 1; tend.position.y = (1 - tin) * 1.6 + tout * 1.8;
    [tFot + .15, tPat + .05, tEsq + .05].forEach((tf, i) => { const g = polas[i]; const k = seg(t, tf, tf + .45); g.visible = t > tf; const u = [.2, .5, .8][i]; const p = curva.getPoint(u);
      g.position.set(p.x, p.y + (1 - resorte(k, 2.5, 5)) * .6, p.z + .01); g.rotation.z = Math.sin((t - tf) * 3.2) * .12 * Math.exp(-(t - tf) * .8) + (i - 1) * .04; });
    const fl = [tFot + .15, tPat + .05, tEsq + .05].reduce((a, tf) => a + Math.max(0, Math.exp(-(t - tf) / .08)) * (t >= tf ? 1 : 0), 0); flash.intensity = 160 * fl; M.cine.uniforms.flash.value = Math.min(.55, fl * .5);
    // paso 2: testigos que saltan de la trampa, libreta que cae girando
    [[t1, tTes - .25], [t2, tTes + .05]].forEach(([g, tt]) => { const k = resorte(seg(t, tt, tt + .7), 2.6, 5); const fuera = E.in3(seg(t, tTres3 - .2, tTres3 + .3)); g.visible = t > tt - .05 && fuera < 1; g.scale.y = Math.max(.001, k * (1 - fuera)); g.rotation.z = (1 - k) * .3; });
    const lb = E.out3(seg(t, tDat - .1, tDat + .6)), lbo = E.in3(seg(t, tTres3 - .2, tTres3 + .4)); libreta.visible = lb > 0 && lbo < 1; libreta.scale.setScalar(1.25); libreta.position.set(-.55 + lbo * 1.8, lerp(2.6, 1.05, lb) + Math.sin(t * 2) * .02, .15); libreta.rotation.set(0, (1 - lb) * 3, (1 - lb) * .6 - .05);
    // paso 3: almanaque que baja, hojas que pasan, sello
    const ab = E.outBack(seg(t, tAvi - .5, tAvi + .2), 1.1), aout = E.in3(seg(t, tMan - .1, tMan + .5)); alm.visible = ab > 0 && aout < 1; alm.position.set(-.1, lerp(3.2, .62, ab) + aout * 2.5, -.05);
    hojas.forEach((h, i) => { const n = 3 - i; if (n === 3) { h.rotation.x = 0; return; } const tt = tDias - (n === 1 ? 1.0 : .55); const k = E.io3(seg(t, tt, tt + .35)); h.visible = k < 1; h.rotation.x = -k * Math.PI * .97; });
    const sk = seg(t, tDias + .15, tDias + .45); sello.visible = t > tDias + .13; sello.scale.setScalar(Math.max(.001, lerp(1.6, .7, E.outExpo(sk)))); sello.rotation.z = -.2 * (1 - sk) - .15;
    // avión de papel: sale de Nico y cruza hacia la cámara
    const av = seg(t, tMan + .1, tMan + 2.1); avion.visible = av > 0 && av < 1; const dest = cam.position.clone().add(new THREE.Vector3(-.35, .2, -.9)); const pa = new THREE.Vector3(.76, 1.0, .25).lerp(dest, E.io2(av)); pa.y += Math.sin(av * Math.PI * 2) * .25;
    avion.position.copy(pa); avion.lookAt(dest.clone().add(new THREE.Vector3(0, 0, 1))); avion.rotateZ(Math.sin(av * 9) * .3);
    kar(t); M.cine.uniforms.t.value = t * 11.7; M.comp.render();
  }
  return {update, total: T, eventos: ev};
}
