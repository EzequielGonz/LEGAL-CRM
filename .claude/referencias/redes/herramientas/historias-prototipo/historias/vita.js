// VITA · «Antes de firmar» · mini historia: Nico, trabajador de barrio, choque → oferta rápida del seguro → el sello «ESPERÁ».
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, wob, clamp, backOut, hash} from '../historia/base.js';
import {personaje, caminar, parpadeo, respirar} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
const ORO = '#D4AF37', NAVY = '#112250';
const NICO = {peinado: 'corto', piel: '#c58c66', pelo: '#2a1c12', barba: true, remera: '#2f5d8a', campera: '#3d4a3a', manga: 'larga', pantalon: '#2b3140', zapato: '#1a1a1f'};

export async function armar(V) {
  const O = obra(V, {logo: 'vita.png', ctaSub: 'y te respondemos', hookHTML: '¿Firmás<br><em>o no?</em>', hookHasta: 1.15,
    notas: [{desde: 0, hasta: 26.6, txt: 'Situación ilustrativa'}, {desde: 26.8, txt: 'Información general: no reemplaza una consulta.<br>Situación ilustrativa · Voz generada con IA'}]});
  document.documentElement.style.cssText += `--f1:'Playfair Display';--f2:Manrope;--acc:${ORO};--hs:150px;--hw:700;--kwCol:#0E1218;--logoH:175px;--hookTop:330px;--numTop:340px;--subTop:1220px;--velo:rgba(10,16,34,.9);--ctaTop:560px`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i);
  const fN = V.frases[0], fAl = F('alivio'), cta = V.frases.find(f => f.cta);

  // 1 · esquina de barrio al anochecer
  const e1 = O.esc({nombre: 'esquina', fondo: '#1b2340', capas: [
    {f: .08, prof: .1, w: 1600, svg: D.cielo({w: 1600, top: '#141d3d', mid: '#4a3a66', bot: '#e08a5c', estrellas: 40})},
    {f: .25, prof: .2, w: 1600, svg: D.skyline({w: 1600, base: 1200, color: '#232b52', ventanas: .18, obelisco: [1040, 1200, 560, '#c8c4d6']})},
    {f: .7, prof: .7, w: 1700, svg: D.barrio({w: 1700, piso: 1440, hora: 'noche'})},
    {f: 1, prof: 1, w: 1600, svg: D.farol({x: 260, y: 1500, alto: 620}) + D.auto({x: 980, y: 1560, s: 1.15, color: '#b8bcc4', abollado: true}) + '<g class="act"></g>'},
    {f: 1.45, prof: 1.7, w: 1700, svg: D.arbol({x: 60, y: 2100, s: 1.6, c: '#1f3a2a'})}]});
  const nico1 = personaje(e1.capas[3].svg.querySelector('.act'), NICO);
  // 2 · celular en primer plano con la notificación (remitente genérico)
  const cm = PP.celularMano({piel: NICO.piel, manga: NICO.campera});
  const e2 = O.esc({nombre: 'celu', fondo: '#0b1020', capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="#0b1020"/>${D.skyline({w: 1080, base: 1900, color: '#141b33', ventanas: .25})}`}, {f: 1, prof: 1, svg: cm.svg}]});
  e2.capas[1].svg.querySelector('.pantalla').innerHTML = PP.notificacion({app: 'Aseguradora · Siniestros', titulo: 'Te ofrecemos un acuerdo', texto: 'Necesitamos tu firma hoy para cerrar el reclamo.', color: '#5b6b8c'});
  // 3 · oficina de la aseguradora
  const e3 = O.esc({nombre: 'oficina', fondo: '#cfd5dc', capas: [
    {f: .6, prof: .6, w: 1500, svg: D.interior({w: 1500, pared: '#c9d0d8', piso: '#6d7280', ventana: [900, 380, 440, 600], vista: 'dia', zocalo: '#e4e7ea', luz: '#fff6e6'}) + D.planta({x: 180, y: 1410, s: 1.3})},
    {f: 1, prof: 1, w: 1500, svg: '<g class="tras"></g>' + D.mesa({x: 640, y: 1235, w: 640, c: '#3b3f48', patas: 215}) + `<g class="papelMesa"><rect x="560" y="1217" width="190" height="20" fill="#f6f3ea" transform="skewX(-40)"/></g><g class="del"></g>`}]});
  const agente = personaje(e3.capas[1].svg.querySelector('.tras'), {peinado: 'rapado', piel: '#d6a988', pelo: '#3a2b20', remera: '#e9e6e0', campera: '#2c3446', manga: 'larga', pantalon: '#22252c'});
  const nico3 = personaje(e3.capas[1].svg.querySelector('.del'), NICO);
  // 4 · el papel, la lapicera y el sello dorado
  const e4 = O.esc({nombre: 'papel', fondo: '#0f1a3a', capas: [{f: 1, prof: 1, svg: PP.papelEscritorio({}) + `<g class="lap"><rect x="-8" y="-260" width="16" height="250" rx="8" fill="#0b0d12"/><rect x="-9" y="-150" width="18" height="10" fill="${ORO}"/><path d="M-7,-12 L7,-12 L0,22 Z" fill="${ORO}"/><rect x="5" y="-250" width="4" height="80" fill="${ORO}"/></g>
      <g class="sello">${PP.selloSVG({oro: ORO})}</g><g class="sombraSello"><ellipse rx="170" ry="40" fill="#000" opacity=".35"/></g>`}]});
  const marca = e4.capas[0].svg.querySelector('.marca'); marca.innerHTML = PP.marcaSello({txt: 'ESPERÁ', oro: ORO, x: 520, y: 1210, r: -9, s: .95});
  // 5 · el living de Nico, de noche
  const e5 = O.esc({nombre: 'living', fondo: '#2b2a35', capas: [
    {f: .6, prof: .6, w: 1500, svg: D.interior({w: 1500, pared: '#55506a', piso: '#5b4636', ventana: [150, 360, 420, 560], vista: 'noche', zocalo: '#6a6580', luz: '#9fb4ff'}) + D.calendario({x: 1010, y: 760, s: 1.1, dia: 'HOY', acento: ORO}) + D.lampara({x: 1150, y: 1420})},
    {f: 1, prof: 1, w: 1500, svg: D.sofa({x: 640, y: 1430, c: '#7a5a48'}) + '<g class="act"></g>' + D.mesa({x: 1060, y: 1230, w: 260, c: '#5a3f2c', patas: 190})}]});
  const nico5 = personaje(e5.capas[1].svg.querySelector('.act'), NICO); const cal = e5.capas[0].svg.querySelector('.dia');
  // 6 · Av. 9 de Julio con el Obelisco y un colectivo
  const e6 = O.esc({nombre: 'avenida', fondo: '#9cc7e8', capas: [
    {f: .08, prof: .1, w: 1600, svg: D.cielo({w: 1600, top: '#6fb0e3', mid: '#b9dcf2', bot: '#f2ecdf'})},
    {f: .3, prof: .3, w: 1700, svg: D.skyline({w: 1700, base: 1180, color: '#9fb0c6', obelisco: [820, 1180, 720, '#f4f0e8'], seed: 3})},
    {f: .55, prof: .5, w: 1900, svg: `<rect x="-200" y="1180" width="2400" height="160" fill="#7c8088"/>${[...Array(16)].map((_, i) => `<rect x="${i * 130}" y="1250" width="70" height="8" fill="#fff" opacity=".6"/>`).join('')}<g class="bus"></g>`},
    {f: 1, prof: 1, w: 1800, svg: D.barrio({w: 1800, piso: 1450, hora: 'dia', kiosco: false}) + D.cartel({x: 1240, y: 1040, w: 360, h: 96, txt: 'VITA Abogados', fs: 46}) + '<g class="act"></g>' + D.arbol({x: 300, y: 1470, s: 1.1, c: '#4f7d4f'})}]});
  const bus = e6.capas[2].svg.querySelector('.bus'); bus.innerHTML = D.colectivo({x: 0, y: 1250, s: .55, linea: '152'});
  const nico6 = personaje(e6.capas[3].svg.querySelector('.act'), NICO);
  // 7 · oficina de VITA, luz cálida
  const e7 = O.esc({nombre: 'vita', fondo: NAVY, capas: [
    {f: .6, prof: .6, w: 1500, svg: D.interior({w: 1500, pared: '#1d2b55', piso: '#3a2c22', ventana: [980, 380, 380, 560], vista: 'dia', zocalo: '#2a3a6a', luz: '#ffd89a'}) +
      `<rect x="250" y="520" width="300" height="380" fill="none" stroke="${ORO}" stroke-width="10"/><image href="vita.png" x="320" y="590" width="160" height="215"/>` + D.planta({x: 120, y: 1410, s: 1.4})},
    {f: 1, prof: 1, w: 1500, svg: '<g class="act"></g>' + D.mesa({x: 900, y: 1150, w: 560, c: '#4a3424', patas: 270})}]});
  const nico7 = personaje(e7.capas[1].svg.querySelector('.act'), NICO);

  const luz = (e, css) => { e.luz.style.cssText = css; };
  luz(e1, 'background:radial-gradient(circle at 30% 40%,rgba(255,196,120,.42),transparent 45%),linear-gradient(180deg,rgba(30,30,80,.1),rgba(0,0,10,.35));mix-blend-mode:soft-light');
  luz(e3, 'background:linear-gradient(100deg,rgba(255,255,255,.0) 40%,rgba(255,244,220,.35)),linear-gradient(180deg,transparent 60%,rgba(0,0,0,.25))');
  luz(e5, 'background:radial-gradient(circle at 78% 42%,rgba(255,200,120,.5),transparent 40%),linear-gradient(180deg,rgba(10,10,40,.2),rgba(0,0,0,.4));mix-blend-mode:soft-light');
  luz(e7, 'background:radial-gradient(circle at 75% 30%,rgba(255,214,150,.45),transparent 50%),linear-gradient(180deg,transparent 55%,rgba(0,0,20,.35));mix-blend-mode:soft-light');
  luz(e4, 'background:linear-gradient(180deg,transparent 52%,rgba(8,12,28,.72) 70%,rgba(8,12,28,.82))');
  luz(e6, 'background:linear-gradient(180deg,rgba(255,240,210,.18),transparent 40%,rgba(0,0,0,.2))');
  const T = V.frases.map(f => f.t); const sello = F('sello').t; const golpe = sello + .12;
  const ojo = t => parpadeo(t, 0); const bo = f => t => 0;
  const boca = (f, t) => (!f || t < f.t || t > f.fin) ? 0 : (f.boca[Math.floor((t - f.t) * 60)] || 0);
  const pN = (pj, t, extra) => { const fh = [fN, fAl].find(f => t >= f.t && t <= f.fin); pj.pose(Object.assign({parpado: ojo(t), respira: respirar(t), boca: boca(fh, t)}, extra)); };
  O.tomas = [
    {t0: 0, esc: e1, cam: (k, t) => { const sk = t < .6 ? Math.exp(-t * 7) : 0; return {X: lerp(870, 860, k) + Math.sin(t * 63) * 14 * sk, Y: lerp(1040, 1010, k) + Math.cos(t * 51) * 10 * sk, z: lerp(1.42, 1.52, ease(k)) + .06 * sk, r: Math.sin(t * 40) * 1.6 * sk, foco: 1, ap: 5}; }, boca: () => nico1.cabeza.map((v, i) => v), act: t => {
      pN(nico1, t, {x: 760, y: 1580, s: 1.05, flip: 1, hR: 70, cR: 95, hL: 6, cL: 10, cab: 8 + wob(t, 2) * 2, mira: .2, ceja: .8, sonrisa: -.4});
      nico1.E.propMano.innerHTML = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="#111"/><rect x="-13" y="-33" width="26" height="50" rx="4" fill="#bcd6ff" opacity=".9"/>`; }},
    {t0: T[1] - .04, esc: e2, cam: k => ({x: 540, y: lerp(990, 950, k), z: lerp(1.0, 1.08, ease(k)), r: lerp(-2, 0, k), foco: 1, ap: 4})},
    {t0: T[1] + 1.95, esc: e3, cam: k => ({X: lerp(600, 690, k), Y: 1150, z: 1.45, foco: 1, ap: 4}), act: t => {
      agente.pose({x: 900, y: 1430, s: 1.0, flip: -1, sentado: 1, hR: 38, cR: 62, hL: 30, cL: 55, parpado: parpadeo(t, 3), boca: (Math.sin(t * 14) * .5 + .5) * .45 * (t > 4 && t < 5.4 ? 1 : 0), sonrisa: .5});
      pN(nico3, t, {x: 380, y: 1430, s: 1.0, sentado: 1, hR: 34, cR: 66, hL: 26, cL: 60, mira: .4, ceja: .3}); }},
    {t0: F('lapicera').t - .1, esc: e4, cam: k => ({x: 540, y: lerp(1080, 1120, k), z: lerp(1.15, 1.25, ease(k)), r: lerp(1.5, 0, k), foco: 1}), act: t => {
      const lap = e4.capas[0].svg.querySelector('.lap'); const k = easeOut(win(t, F('lapicera').t - .1, F('sello').t - .2));
      lap.setAttribute('transform', `translate(${lerp(820, 470, k)},${lerp(1550, 1300, k)}) rotate(${lerp(40, 28, k)})`);
      e4.capas[0].svg.querySelector('.sello').setAttribute('transform', 'translate(-999,-999)'); e4.capas[0].svg.querySelector('.sombraSello').setAttribute('transform', 'translate(-999,-999)'); marca.style.opacity = 0; }},
    {t0: sello - .45, esc: e4, cam: k => ({x: 540, y: 1150, z: lerp(1.02, 1.08, k), foco: 1}), act: t => {
      const lap = e4.capas[0].svg.querySelector('.lap'); lap.setAttribute('transform', `translate(${lerp(470, 640, easeOut(win(t, golpe - .3, golpe)))},${lerp(1300, 1500, easeOut(win(t, golpe - .3, golpe)))}) rotate(28)`);
      const a = sello - .45; let y; if (t < golpe) { const k = win(t, a, golpe); y = lerp(-500, 1235, easeIn(k)) - Math.sin(clamp(k / .5) * Math.PI) * 120 * (k < .5 ? 1 : 0); } else { const k = win(t, golpe + .25, golpe + .9); y = lerp(1235, -600, easeIn(k)); }
      const sq = t >= golpe && t < golpe + .2 ? 1 - .06 * Math.sin(win(t, golpe, golpe + .2) * Math.PI) : 1;
      e4.capas[0].svg.querySelector('.sello').setAttribute('transform', `translate(520,${y}) rotate(-9) scale(1.25,${1.25 * sq})`);
      e4.capas[0].svg.querySelector('.sombraSello').setAttribute('transform', `translate(540,${1260}) scale(${clamp(.3 + y / 1235 * .9, .2, 1.2)})`);
      marca.style.opacity = t >= golpe ? 1 : 0;
      const d = t - golpe; e4.capas[0].d.style.translate = d > 0 && d < .45 ? `0 ${Math.exp(-d * 10) * Math.sin(d * 60) * 14}px` : '0 0'; }},
    {t0: T[4] - .05, esc: e3, cam: k => ({X: lerp(560, 520, k), Y: lerp(1080, 1060, k), z: lerp(1.75, 1.95, ease(k)), foco: 1, ap: 5}), act: t => {
      agente.pose({x: 900, y: 1430, s: 1.0, flip: -1, sentado: 1, hR: 34, cR: 60, hL: 28, cL: 58, parpado: parpadeo(t, 3), sonrisa: .3});
      pN(nico3, t, {x: 380, y: 1430, s: 1.0, sentado: 1, hR: 10, cR: 20, hL: 30, cL: 40, cab: -6, mira: .5, ceja: -.6, sonrisa: -.2}); }},
    {t0: F('dolor').t - .05, esc: e5, cam: k => ({X: lerp(660, 720, k), Y: 1180, z: lerp(1.5, 1.58, k), foco: 1, ap: 4}), act: t => (cal.parentNode.style.visibility = 'visible') && pN(nico5, t, {x: 640, y: 1430, s: 1.0, sentado: 1, hR: 22, cR: 30, hL: 14, cL: 22, cab: -12, ceja: -.9, sonrisa: -.6})},
    {t0: F('dolor').t + 2.1, esc: e5, cam: k => ({X: 640, Y: lerp(1110, 1095, k), z: lerp(3.0, 3.15, ease(k)), foco: 1, ap: 6}), act: t => (cal.parentNode.style.visibility = 'hidden') && pN(nico5, t, {x: 640, y: 1430, s: 1.0, sentado: 1, hR: 18 + wob(t) * 3, cR: 26, hL: 12, cL: 20, cab: -10, ceja: -1, sonrisa: -.7, parpado: .35})},
    {t0: T[6] - .05, esc: e5, cam: k => ({X: lerp(700, 760, k), Y: 1150, z: 1.6, foco: 1, ap: 4}), act: t => { cal.parentNode.style.visibility = 'visible'; pN(nico5, t, {x: 640, y: 1430, s: 1.0, sentado: 1, hR: 60, cR: 70, hL: 50, cL: 60, cab: 10, mira: .6, ceja: .3});
      nico5.E.propMano.innerHTML = `<rect x="-10" y="-60" width="70" height="92" fill="#f6f3ea" transform="rotate(20)"/>`; }},
    {t0: FI(1).t - .1, esc: e4, cam: k => ({x: lerp(500, 580, k), y: lerp(980, 1010, k), z: 1.6, r: -2, foco: 1}), act: t => { marca.style.opacity = .28; e4.capas[0].svg.querySelector('.sello').setAttribute('transform', 'translate(-999,-999)'); e4.capas[0].svg.querySelector('.sombraSello').setAttribute('transform', 'translate(-999,-999)'); e4.capas[0].d.style.translate = '0 0'; }},
    {t0: FI(2).t - .1, esc: e5, cam: k => ({X: 1060, Y: 610, z: lerp(2.4, 2.5, ease(k)), foco: .6, ap: 5}), act: t => { cal.parentNode.style.visibility = 'visible'; const k = win(t, FI(2).t + .5, FI(2).t + .9); cal.textContent = k < .5 ? 'HOY' : 'MAÑANA'; cal.setAttribute('font-size', k < .5 ? 96 : 44); cal.parentNode.setAttribute('transform', `translate(1010,760) scale(1.1,${1.1 * Math.abs(Math.cos(k * Math.PI))})`); nico5.pose({x: -999, y: 0}); }},
    {t0: FI(3).t - .1, esc: e6, cam: k => ({X: lerp(980, 1250, k), Y: 1010, z: 1.35, foco: 1, ap: 4}), act: t => { const k = win(t, FI(3).t - .1, fAl.t); const w = D ? caminar(t, 1) : {};
      nico6.pose(Object.assign({x: lerp(820, 1290, k), y: 1450 + w.dy, s: .95, flip: 1, parpado: ojo(t), mira: .3}, w)); bus.setAttribute('transform', `translate(${lerp(1900, -700, win(t, FI(3).t - .1, FI(3).t + 3))},0)`); }},
    {t0: fAl.t - .1, esc: e7, cam: k => ({X: lerp(600, 640, k), Y: lerp(1080, 1060, k), z: lerp(1.8, 1.92, ease(k)), foco: 1, ap: 5}), act: t => pN(nico7, t, {x: 560, y: 1440, s: 1.05, flip: 1, hR: 20, cR: 30, hL: 10, cL: 20, cab: 4, sonrisa: 1, ceja: .4, mira: .2})},
    {t0: cta.t - .3, esc: e7, cam: k => ({X: lerp(640, 680, k), Y: 1060, z: lerp(1.92, 2.0, k), foco: 1, ap: 10}), act: t => pN(nico7, t, {x: 560, y: 1440, s: 1.05, hR: 20, cR: 30, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 800, Y: 1260, z: 1.6, foco: 1, ap: 5}), act: t => pN(nico1, t, {x: 760, y: 1580, s: 1.05, hR: 70, cR: 95, cab: 8, mira: .2, ceja: .8, sonrisa: -.4})},
  ];
  // posición del globo: arriba de la cabeza del personaje que habla, en coordenadas de pantalla
  const hablaEn = (esc, pj) => () => { const [x, y] = esc.aPantalla(esc.capas[esc.capas.length - (esc === e1 ? 2 : 1)], pj.cabeza[0], pj.cabeza[1] - 70); return [x, y]; };
  O.tomas[0].boca = hablaEn(e1, nico1); O.tomas[O.tomas.length - 3].boca = hablaEn(e7, nico7);
  O.flash = t => Math.max(Math.max(0, .5 * Math.exp(-(t - golpe) * 9)) * (t >= golpe ? 1 : 0), t >= .02 ? .55 * Math.exp(-(t - .02) * 8) : 0);
  return O;
}
