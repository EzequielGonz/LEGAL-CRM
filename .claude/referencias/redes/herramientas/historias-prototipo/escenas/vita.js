// VITA · «Antes de firmar»: escritorio azul noche, luz dorada lateral, la propuesta del seguro, la lapicera y el sello dorado.
import {crear, THREE, clamp, lerp, smooth, easeOut, easeInOut, backOut, expoOut, win, wob, hash, particulas} from '../motor/motor3d.js';
import {escritorio, papel, lineasFalsas, sello, lapicera} from '../motor/objetos.js';
import {crearUI} from '../motor/ui.js';

const ORO = '#D4AF37', NAVY = '#112250', TINTA = '#25282B', NOCHE = '#0E1218';

export async function armar(V, {fps}) {
  const M = await crear({hdri: 'assets/studio_small_09_2k.hdr', hdriIntensity: .28, exposure: 1.05, bloom: [.38, .5, .92],
    grade: {lift: [.0, .005, .02], gain: [1.02, 1.0, .97], sat: 1.06, contrast: 1.07, shadowTint: [-.004, .0, .018], highTint: [.02, .012, -.01], vignette: .42, grain: .05, ca: .0018}});
  const {scene, camera} = M;
  scene.background = new THREE.Color('#05080f'); scene.fog = new THREE.Fog('#05080f', .7, 2.6);
  const F = V.frases; const T = i => F[i].t; const sel = F.find(f => f.sello); const items = F.filter(f => f.item); const cta = F.find(f => f.cta);

  escritorio(M, {color: '#0f1a3a', rough: .38, clear: .45, size: [4, 4]});
  // luces: llave dorada lateral (con sombras suaves), recorte frío y un relleno muy bajo
  const key = new THREE.SpotLight('#ffcf8a', 26, 3, .55, .85, 1.6); key.position.set(-.75, .55, .18); key.target.position.set(.1, 0, .02);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.blurSamples = 16; key.shadow.bias = -.0004; key.shadow.camera.near = .2; key.shadow.camera.far = 2.5;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#7f9cff', .9); rim.position.set(.6, .35, -.8); scene.add(rim);
  const fill = new THREE.HemisphereLight('#8aa0d8', '#0a0d18', .25); scene.add(fill);

  // la propuesta del seguro (situación ilustrativa, nombre genérico)
  const doc = papel(M, {w: .21, h: .297, px: 1400, curl: .004, draw: (x, W, H) => {
    x.fillStyle = '#7d7f84'; x.font = '600 34px Manrope'; x.fillText('Aseguradora · Siniestros', 120, 150);
    x.fillStyle = TINTA; x.font = '700 92px "Playfair Display"'; x.fillText('Propuesta de acuerdo', 120, 290);
    x.fillStyle = '#c9b98d'; x.fillRect(120, 330, 300, 5);
    lineasFalsas(x, 120, 420, W - 240, 14, 24, '#8d8f93', 3);
    x.fillStyle = TINTA; x.font = '700 40px Manrope'; x.fillText('Monto ofrecido por única vez', 120, 1180);
    lineasFalsas(x, 120, 1240, W - 240, 8, 24, '#8d8f93', 9);
    x.strokeStyle = TINTA; x.lineWidth = 3; x.beginPath(); x.moveTo(120, 1760); x.lineTo(760, 1760); x.stroke();
    x.fillStyle = '#6b6d72'; x.font = '500 34px Manrope'; x.fillText('Firma del reclamante', 120, 1810);
    x.font = '700 70px "Playfair Display"'; x.fillStyle = '#b9bbbf'; x.fillText('×', 130, 1745);
  }});
  doc.position.set(0, .0012, 0); doc.rotation.z = .06;
  // marca del sello en el papel (capa aparte, se revela al golpe)
  const imp = M.tex(900, 420, (x, W, H) => {
    x.translate(W / 2, H / 2); x.rotate(-.09); x.strokeStyle = ORO; x.fillStyle = ORO; x.lineWidth = 12; x.beginPath(); x.roundRect(-380, -150, 760, 300, 26); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.roundRect(-356, -126, 712, 252, 18); x.stroke();
    x.font = '800 168px Manrope'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ESPERÁ', 0, 10);
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-out'; // tinta irregular
    for (let i = 0; i < 2600; i++) { const r = hash(i * 1.7) * 3.2 + .4; x.globalAlpha = .25 + hash(i * 2.9) * .6; x.beginPath(); x.arc(hash(i * 3.3) * W, hash(i * 5.1) * H, r, 0, 7); x.fill(); }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }, {});
  const impM = new THREE.MeshPhysicalMaterial({map: imp, transparent: true, opacity: 0, roughness: .5, metalness: .65, color: '#ffffff', depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
  const impMesh = new THREE.Mesh(new THREE.PlaneGeometry(.15, .07), impM); impMesh.rotation.x = -Math.PI / 2; impMesh.position.set(.012, .0032, .082); scene.add(impMesh);

  const pen = lapicera(M); pen.rotation.set(Math.PI / 2, 0, -1.05); pen.position.set(.07, .0062, .11);
  const st = sello(M); const STX = .012, STZ = .082;

  // tablilla con la lista «Antes de firmar» (modelo CC0 de Poly Haven + hoja propia)
  const clip = await M.gltf('assets/clipboard/clipboard.gltf'); clip.position.set(.33, 0, -.02); clip.rotation.y = -.12; scene.add(clip);
  const chk = [0, 0, 0];
  const hojaDraw = (x, W, H) => {
    x.fillStyle = TINTA; x.font = '700 104px "Playfair Display"'; x.fillText('Antes de firmar', 110, 300);
    x.fillStyle = '#c9b98d'; x.fillRect(110, 345, 260, 6);
    const L = ['Pedí la propuesta por escrito', 'No firmes el mismo día', 'Consultá con un abogado'];
    L.forEach((s, i) => { const y = 560 + i * 330; x.strokeStyle = '#9a9c9f'; x.lineWidth = 5; x.beginPath(); x.roundRect(110, y - 70, 92, 92, 14); x.stroke();
      x.fillStyle = TINTA; x.font = '700 62px Manrope'; x.fillText(`${i + 1}.`, 240, y); x.font = '600 58px Manrope'; x.fillText(s, 310, y);
      const k = chk[i]; if (k > 0) { x.strokeStyle = '#b8913a'; x.lineWidth = 16; x.lineCap = 'round'; x.lineJoin = 'round'; x.beginPath();
        const p1 = [124, y - 30], p2 = [150, y - 2], p3 = [216, y - 92]; const a = clamp(k * 2), b = clamp(k * 2 - 1);
        x.moveTo(...p1); x.lineTo(lerp(p1[0], p2[0], a), lerp(p1[1], p2[1], a)); if (b > 0) x.lineTo(lerp(p2[0], p3[0], b), lerp(p2[1], p3[1], b)); x.stroke(); } });
    lineasFalsas(x, 110, 1560, W - 220, 5, 20, '#a3a5a8', 21);
  };
  const hoja = papel(M, {w: .19, h: .262, px: 1400, curl: .0015, draw: hojaDraw});
  hoja.position.set(.33, .0052, .0); hoja.rotation.z = .12;
  let lastChk = '';

  const polvo = particulas(M, {n: 420, area: [.9, .45, .7], centro: [-.05, .2, 0], color: '#ffd89a', size: .0022, opacity: .55, seed: 4});

  // tomas: un cambio visual cada 1,5–3 s; todas con empuje lento y cámara en mano leve
  const t0 = 0, I = items.map(f => f.t), C = cta.t;
  M.shots = [
    {t0: 0, from: {p: [-.06, .13, .31], l: [.01, 0, .06], fov: 32}, to: {p: [-.035, .11, .27], l: [.015, 0, .07], fov: 31}, ap: .05, hand: .002},
    {t0: T(1) - .05, from: {p: [.0, .3, .02], l: [0, 0, -.07], fov: 30}, to: {p: [.03, .28, -.01], l: [.0, 0, -.08], fov: 30}, ap: .04, hand: .002},
    {t0: T(1) + 1.6, from: {p: [.075, .045, .2], l: [.02, .004, .105], fov: 26}, to: {p: [.055, .04, .185], l: [.02, .004, .105], fov: 26}, ap: .09, hand: .0015},
    {t0: sel.t - .55, from: {p: [-.2, .33, .36], l: [.01, 0, .07], fov: 33}, to: {p: [-.17, .3, .32], l: [.012, 0, .075], fov: 33}, ap: .03, hand: .002},
    {t0: T(3) - .05, from: {p: [.03, .22, .15], l: [.012, 0, .082], fov: 30, roll: .05}, to: {p: [.02, .2, .13], l: [.012, 0, .082], fov: 30, roll: -.02}, ap: .05, hand: .0015},
    {t0: T(4) - .05, from: {p: [.27, .055, .07], l: [0, .0, .02], fov: 30}, to: {p: [.24, .05, -.02], l: [0, 0, .02], fov: 30}, ap: .06, hand: .002},
    {t0: T(4) + 1.75, from: {p: [-.12, .44, .3], l: [.06, 0, .0], fov: 34}, to: {p: [-.08, .4, .26], l: [.08, 0, .0], fov: 34}, ap: .025, hand: .002},
    {t0: T(5) - .05, from: {p: [.33, .5, .32], l: [.33, 0, .0], fov: 34}, to: {p: [.33, .33, .2], l: [.33, 0, .0], fov: 33}, ap: .03, hand: .002, ease: easeOut},
    {t0: I[0] - .1, from: {p: [.29, .2, .12], l: [.335, 0, -.03], fov: 30}, to: {p: [.3, .18, .1], l: [.335, 0, -.03], fov: 30}, ap: .05, hand: .0015},
    {t0: I[1] - .1, from: {p: [.38, .19, .15], l: [.335, 0, .005], fov: 30}, to: {p: [.37, .17, .13], l: [.335, 0, .005], fov: 30}, ap: .05, hand: .0015},
    {t0: I[2] - .1, from: {p: [.3, .19, .19], l: [.33, 0, .04], fov: 30}, to: {p: [.31, .17, .16], l: [.33, 0, .04], fov: 30}, ap: .05, hand: .0015},
    {t0: C - .45, from: {p: [.02, .4, .05], l: [.02, 0, .02], fov: 34, roll: .0}, to: {p: [.02, .34, .04], l: [.02, 0, .02], fov: 34, roll: .08}, ap: .02, hand: .001},
    {t0: V.total - .4, from: {p: [-.06, .13, .31], l: [.01, 0, .06], fov: 32}, to: {p: [-.055, .126, .3], l: [.011, 0, .062], fov: 32}, ap: .05, hand: .002},
  ];
  const golpe = sel.t + .06; // momento en que el sello toca el papel
  M.focusFn = (t, c) => { const i = c.shot; if (i === 2) return lerp(c.p.distanceTo(new THREE.Vector3(.06, .006, .14)), c.p.distanceTo(c.l), win(t, T(1) + 1.9, T(1) + 2.6)); return c.p.distanceTo(c.l); };
  M.postCam = (t, cam) => { const d = t - golpe; if (d > 0 && d < .5) { const a = Math.exp(-d * 12) * Math.sin(d * 55) * .0025; cam.position.y += a; cam.position.x += a * .4; } };
  M.motion = (t, e) => { const d = Math.abs(t - golpe); return d < .2 ? 40 : 0; };

  M.update = t => {
    // sello: anticipación, golpe seco, rebote leve y salida; vuelve a aparecer en el cierre
    let y = 1, sq = 1;
    const a = sel.t - .55, b = golpe;
    if (t >= a && t < b) { const k = win(t, a, b); const up = Math.sin(clamp(k / .55) * Math.PI) * .05; y = .16 * (1 - Math.pow(k, 3)) + up * (k < .55 ? 1 : 0) + .0; }
    else if (t >= b && t < b + .35) { const k = win(t, b, b + .35); y = 0; sq = 1 - .05 * Math.sin(k * Math.PI) ; }
    else if (t >= b + .35 && t < b + 1.1) { y = .25 * easeInOut(win(t, b + .35, b + 1.1)); }
    st.position.set(STX, y < 1 ? y : 3, STZ); st.scale.set(1, sq, 1); st.rotation.y = .3 + y * 2;
    impM.opacity = t >= b && t < V.total - .4 ? .93 * clamp((t - b) / .05) : 0; impMesh.scale.setScalar(1 + .015 * Math.exp(-(t - b) * 20));
    // lapicera que rueda apenas hacia la línea de la firma en el gancho
    const rk = easeOut(win(t, .1, 1.6)); pen.position.x = .07 - .012 * rk; pen.rotation.y = rk * .25;
    // checks dorados en la lista
    const cs = items.map(f => clamp((t - f.t - .25) / .45)).map(v => t >= V.total - .4 ? 0 : v); const key2 = cs.map(v => v.toFixed(2)).join();
    if (key2 !== lastChk) { cs.forEach((v, i) => chk[i] = v); hoja.userData.tex.userData.redraw((x, W, H) => { x.fillStyle = '#f6f3ea'; x.fillRect(0, 0, W, H); hojaDraw(x, W, H); }); lastChk = key2; }
    polvo.material.uniforms.t.value = t; M.finMat.uniforms.flash.value = Math.max(0, .14 * Math.exp(-(t - b) * 14)) * (t >= b ? 1 : 0); M.finMat.uniforms.flashCol.value.set(1, .86, .55);
    key.intensity = 26 + 4 * wob(t * .5, 9);
  };
  const ui = crearUI(V, {logo: 'vita.png', ctaSub: 'y te respondemos', hookHTML: '¿Firmás<br><em>o no?</em>', hookHasta: T(1) - .1,
    notas: [{desde: C - .3, txt: 'Información general: no reemplaza una consulta.<br>Voz generada con IA · Situación ilustrativa'}]});
  document.documentElement.style.cssText += `--f1:'Playfair Display';--f2:Manrope;--fs:Manrope;--acc:${ORO};--txt:#fff;--hs:150px;--hw:700;--hookTop:260px;--kwCol:${NOCHE};--logoH:175px;--ctaTop:560px;--fn:'Playfair Display'`;
  return {M, ui};
}
