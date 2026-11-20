// Objetos 3D reutilizables, hechos con código (sin modelos pagos): papel con curvatura y fibra, celular, lupa con refracción,
// sello, lapicera, llave con logo, impresora de tickets y ticket térmico, escritorio con veta y rugosidad.
import {THREE, hash, clamp} from './motor3d.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

export function escritorio(M, {color = '#112250', size = [6, 6], rough = .42, clear = .35, seed = 3, veta = .5} = {}) {
  const r = M.noiseTex(512, 1.2, 5, seed); r.repeat.set(3, 3);
  const n = M.tex(1024, 1024, (x, w, h) => { // veta de madera lacada muy sutil (mapa de relieve)
    const im = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const v = .5 + .5 * Math.sin((j * .06 + Math.sin(i * .004 + j * .002) * 9 + hash(Math.floor(j / 3)) * 2) * veta * 3);
      const k = (i + j * w) * 4; const c = 110 + v * 40 + (hash(i * 3.1 + j * 7.7) - .5) * 14; im.data[k] = im.data[k + 1] = im.data[k + 2] = c; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); }, {repeat: [2, 2], srgb: false});
  const m = new THREE.MeshPhysicalMaterial({color, roughness: rough, roughnessMap: r, bumpMap: n, bumpScale: .6, clearcoat: clear, clearcoatRoughness: .25, metalness: 0});
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), m); mesh.rotation.x = -Math.PI / 2; mesh.receiveShadow = true; M.scene.add(mesh); return mesh;
}

// Papel con curvatura leve, fibra y texto dibujado en canvas. draw(ctx,w,h) dibuja el contenido; redibujable.
export function papel(M, {w = .21, h = .297, px = 1400, draw, curl = .006, color = '#f6f3ea', seg = 40} = {}) {
  const ph = Math.round(px * h / w);
  const tex = M.tex(px, ph, (x, W, H) => { x.fillStyle = color; x.fillRect(0, 0, W, H); draw && draw(x, W, H); });
  const fib = M.noiseTex(512, 3, 4, 11); fib.repeat.set(2, 3);
  const g = new THREE.PlaneGeometry(w, h, seg, seg); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const X = p.getX(i) / w, Y = p.getY(i) / h; p.setZ(i, curl * (Math.pow(X * 2, 2) * .6 + Math.sin(Y * 3.1 + 1) * .4) + .0006 * hash(i)); }
  g.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({map: tex, roughness: .86, bumpMap: fib, bumpScale: .25, sheen: .3, sheenRoughness: .8, side: THREE.DoubleSide});
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; mesh.rotation.x = -Math.PI / 2; mesh.userData.tex = tex; M.scene.add(mesh); return mesh;
}

export function lineasFalsas(x, X, Y, W, n, alto, color = '#9a9a96', seed = 1) { // renglones de "letra chica" ilegibles
  x.fillStyle = color; for (let i = 0; i < n; i++) { const L = W * (.62 + .38 * hash(i + seed)); let cx = X;
    while (cx < X + L) { const ww = alto * (1.2 + hash(cx * .13 + i * 7 + seed) * 3.2); x.globalAlpha = .55; x.fillRect(cx, Y + i * alto * 2.05, Math.min(ww, X + L - cx), alto * .62); cx += ww + alto * .45; }
  } x.globalAlpha = 1;
}

export function celular(M, {color = '#111214', w = .072, h = .152, d = .0082, frame = '#2a2b2e', screenPx = 1080} = {}) {
  const grp = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 8, .009), new THREE.MeshPhysicalMaterial({color, roughness: .32, metalness: .1, clearcoat: 1, clearcoatRoughness: .08}));
  body.castShadow = body.receiveShadow = true; grp.add(body);
  const bezel = new THREE.Mesh(new RoundedBoxGeometry(w * .985, h * .99, d * 1.02, 8, .0085), new THREE.MeshPhysicalMaterial({color: '#050506', roughness: .05, metalness: 0, clearcoat: 1}));
  bezel.position.z = .0002; grp.add(bezel);
  const sp = Math.round(screenPx * (h * .955) / (w * .93));
  const tex = M.tex(screenPx, sp, () => {});
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w * .93, h * .955), new THREE.MeshPhysicalMaterial({color: '#000', emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 1.1, roughness: .06, clearcoat: 1, clearcoatRoughness: .03}));
  // esquinas redondeadas de la pantalla con un alphaMap
  scr.material.alphaMap = M.tex(256, Math.round(256 * h / w), (x, W, H) => { x.fillStyle = '#000'; x.fillRect(0, 0, W, H); x.fillStyle = '#fff'; const r = W * .11; x.beginPath(); x.roundRect(0, 0, W, H, r); x.fill(); }, {srgb: false});
  scr.material.transparent = true; scr.position.z = d / 2 + .0003; grp.add(scr);
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(.0028, .0028, .001, 24), new THREE.MeshPhysicalMaterial({color: '#000', roughness: .1}));
  cam.rotation.x = Math.PI / 2; cam.position.set(0, h * .455, d / 2 + .0005); grp.add(cam);
  M.scene.add(grp); grp.userData = {tex, scr, screenPx, sp, body}; return grp;
}

export function lupa(M, {color = '#8EB69B', r = .045} = {}) {
  const grp = new THREE.Group();
  const aro = new THREE.Mesh(new THREE.TorusGeometry(r, r * .085, 24, 96), new THREE.MeshPhysicalMaterial({color, metalness: .55, roughness: .28, clearcoat: .6}));
  grp.add(aro);
  const vidrio = new THREE.Mesh(new THREE.SphereGeometry(r * 2.2, 64, 32, 0, Math.PI * 2, 0, .47), new THREE.MeshPhysicalMaterial({transmission: 1, ior: 1.52, thickness: .012, roughness: 0, color: '#ffffff', attenuationColor: '#e8fff0', attenuationDistance: .5, specularIntensity: 1, clearcoat: 1}));
  vidrio.scale.set(1, .16, 1); vidrio.rotation.x = Math.PI / 2; grp.add(vidrio);
  const vidrio2 = vidrio.clone(); vidrio2.rotation.x = -Math.PI / 2; grp.add(vidrio2);
  const mango = new THREE.Mesh(new THREE.CylinderGeometry(r * .13, r * .16, r * 2.1, 32), new THREE.MeshPhysicalMaterial({color, roughness: .45, metalness: .2, clearcoat: .4}));
  mango.position.set(0, -r * 2.05, 0); grp.add(mango);
  const anillo = new THREE.Mesh(new THREE.CylinderGeometry(r * .17, r * .17, r * .25, 32), new THREE.MeshPhysicalMaterial({color: '#e9eee9', metalness: 1, roughness: .2}));
  anillo.position.set(0, -r * 1.05, 0); grp.add(anillo);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); vidrio.castShadow = vidrio2.castShadow = false;
  M.scene.add(grp); return grp;
}

export function sello(M, {oro = '#D4AF37', r = .032} = {}) {
  const grp = new THREE.Group(); const goldM = new THREE.MeshPhysicalMaterial({color: oro, metalness: 1, roughness: .22, clearcoat: .5});
  const pts = []; for (let i = 0; i <= 40; i++) { const k = i / 40; const y = k * r * 3.4; const rr = r * (.42 + .25 * Math.sin(k * Math.PI * 1.1) + (k > .78 ? .55 * Math.sin((k - .78) / .22 * Math.PI) : 0)); pts.push(new THREE.Vector2(Math.max(.001, rr), y)); }
  const mango = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), goldM); mango.position.y = r * .55; grp.add(mango);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.12, r * .45, 64), goldM); base.position.y = r * .32; grp.add(base);
  const goma = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.08, r * .14, 64), new THREE.MeshPhysicalMaterial({color: '#3a2a10', roughness: .8})); goma.position.y = r * .07; grp.add(goma);
  grp.traverse(o => { if (o.isMesh) { o.castShadow = true; } }); M.scene.add(grp); return grp;
}

export function lapicera(M, {cuerpo = '#0b0d12', metal = '#D4AF37', L = .14} = {}) {
  const grp = new THREE.Group(); const body = new THREE.MeshPhysicalMaterial({color: cuerpo, roughness: .18, clearcoat: 1, clearcoatRoughness: .05});
  const met = new THREE.MeshPhysicalMaterial({color: metal, metalness: 1, roughness: .2});
  const c1 = new THREE.Mesh(new THREE.CylinderGeometry(.0055, .0058, L * .55, 48), body); c1.position.y = L * .2; grp.add(c1);
  const c2 = new THREE.Mesh(new THREE.CylinderGeometry(.0058, .005, L * .32, 48), body); c2.position.y = -L * .23; grp.add(c2);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(.006, .006, .004, 48), met); b.position.y = -L * .07; grp.add(b);
  const pun = new THREE.Mesh(new THREE.ConeGeometry(.0042, .02, 48), met); pun.position.y = -L * .39 - .01; pun.rotation.x = Math.PI; grp.add(pun);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(.0016, L * .3, .0012), met); clip.position.set(0, L * .3, .0062); grp.add(clip);
  const tapa = new THREE.Mesh(new THREE.SphereGeometry(.0056, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), body); tapa.position.y = L * .475; grp.add(tapa);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); M.scene.add(grp); return grp;
}

export function llave(M, {logo, azul = '#207CCF'} = {}) {
  const grp = new THREE.Group();
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(.036, .062, .014, 8, .007), new THREE.MeshPhysicalMaterial({color: '#0a0b0f', roughness: .3, clearcoat: 1, clearcoatRoughness: .06}));
  grp.add(cuerpo);
  if (logo) { const lm = new THREE.Mesh(new THREE.PlaneGeometry(.016, .0216), new THREE.MeshPhysicalMaterial({map: logo, transparent: true, metalness: .3, roughness: .3, emissive: '#ffffff', emissiveMap: logo, emissiveIntensity: .15}));
    lm.position.set(0, .012, .00705); grp.add(lm); }
  const bm = new THREE.MeshPhysicalMaterial({color: '#1d2026', roughness: .55});
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.0042, .0042, .0018, 32), bm); b.rotation.x = Math.PI / 2; b.position.set(0, -.006 - i * .01, .0072); grp.add(b); }
  const cromo = new THREE.MeshPhysicalMaterial({color: '#e8ecf2', metalness: 1, roughness: .12});
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(.009, .052, .0022), cromo); hoja.position.set(0, -.057, 0); grp.add(hoja);
  for (let i = 0; i < 5; i++) { const n = new THREE.Mesh(new THREE.BoxGeometry(.004, .004, .0024), cromo); n.position.set(.0045 * (i % 2 ? 1 : -1), -.04 - i * .008, 0); grp.add(n); }
  const aro = new THREE.Mesh(new THREE.TorusGeometry(.011, .0011, 16, 64), cromo); aro.position.set(0, .039, 0); grp.add(aro);
  const luz = new THREE.Mesh(new THREE.CircleGeometry(.0014, 16), new THREE.MeshBasicMaterial({color: azul})); luz.position.set(.012, .026, .0071); grp.add(luz);
  grp.traverse(o => { if (o.isMesh) o.castShadow = true; }); M.scene.add(grp); return grp;
}

export function impresora(M) {
  const grp = new THREE.Group();
  const plast = new THREE.MeshPhysicalMaterial({color: '#23262c', roughness: .5, clearcoat: .3});
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(.11, .07, .14, 6, .012), plast); cuerpo.position.y = .035; grp.add(cuerpo);
  const tapa = new THREE.Mesh(new RoundedBoxGeometry(.104, .012, .08, 6, .005), new THREE.MeshPhysicalMaterial({color: '#15171b', roughness: .35, clearcoat: .6})); tapa.position.set(0, .072, -.025); grp.add(tapa);
  const ranura = new THREE.Mesh(new THREE.BoxGeometry(.084, .003, .006), new THREE.MeshBasicMaterial({color: '#000'})); ranura.position.set(0, .0705, .02); grp.add(ranura);
  const led = new THREE.Mesh(new THREE.CircleGeometry(.0018, 16), new THREE.MeshBasicMaterial({color: '#4E9BE4'})); led.rotation.x = -Math.PI / 2; led.position.set(.04, .0712, .05); grp.add(led);
  grp.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } }); M.scene.add(grp); grp.userData.led = led; return grp;
}

// Ticket térmico que sale de la ranura: largo variable y textura que se revela de arriba hacia abajo
export function ticket(M, {w = .08, Lmax = .36, px = 900, draw} = {}) {
  const ph = Math.round(px * Lmax / w);
  const tex = M.tex(px, ph, (x, W, H) => { x.fillStyle = '#f7f6f1'; x.fillRect(0, 0, W, H); draw && draw(x, W, H); });
  const seg = 120; const g = new THREE.PlaneGeometry(w, Lmax, 8, seg);
  const m = new THREE.MeshPhysicalMaterial({map: tex, roughness: .55, sheen: .2, side: THREE.DoubleSide, clearcoat: .15});
  const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; mesh.userData = {tex, Lmax, w, base: g.attributes.position.array.slice()};
  // set(L): deja salir L metros de papel, que se curva hacia adelante y abajo (enrollado natural)
  mesh.userData.set = (L) => { const p = g.attributes.position; const B = mesh.userData.base; const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const v = (B[i * 3 + 1] + Lmax / 2) / Lmax; // 0 abajo .. 1 arriba (arriba = lo impreso primero)
      const s = (1 - v) * Lmax; // distancia desde el extremo libre
      const out = Math.max(0, L - s); // cuánto de este punto ya salió (si <0, todavía adentro)
      const d = Math.min(out, L); const ang = Math.min(1.25, d * 4.2); // se curva al salir
      const y = Math.sin(ang) / 4.2 * 1 + (d > 0 ? 0 : 0); const z = (1 - Math.cos(ang)) / 4.2;
      const yy = out > 0 ? (d <= .3 ? Math.sin(Math.min(ang, 1.25)) / 4.2 : 0) : 0;
      // forma: sube vertical y se curva hacia +z
      const rr = .22; const a = Math.max(0, out) / rr; const lim = Math.PI / 2.4;
      let Y, Z; if (a < lim) { Y = Math.sin(a) * rr; Z = (1 - Math.cos(a)) * rr; } else { Y = Math.sin(lim) * rr - Math.sin(lim) * 0 + (a - lim) * rr * Math.cos(lim) * 0.0 + Math.sin(lim) * 0; Z = (1 - Math.cos(lim)) * rr + (a - lim) * rr; Y = Math.sin(lim) * rr - (a - lim) * rr * .55; }
      p.setXYZ(i, B[i * 3], out > 0 ? Y : -.01, out > 0 ? Z : 0);
    } p.needsUpdate = true; g.computeVertexNormals(); };
  M.scene.add(mesh); return mesh;
}
