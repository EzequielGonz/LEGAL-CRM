// Coberturas · «Tu recibo explicado» · cob-mono-aporte-a: Lucía, en su departamento de Caballito frente a Parque Rivadavia, paga el monotributo
// y descubre que una parte ya va a una obra social; la lupa menta recorre el detalle de la cuota (sin números).
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, win, wob, clamp, backOut} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, celuMano, laptop, PJS, ganchoCss, variar} from './comun.js';
import {gigante, caida} from '../historia/irreal.js';
const VERDE = '#003D3B', MENTA = '#DAF1DE', SALVIA = '#8EB69B', BOSQUE = '#235347';
const CARO = {peinado: 'colita', piel: '#e0ad8a', pelo: '#4a2a1a', remera: '#f2efe8', campera: '#7aa38a', manga: 'larga', pantalon: '#33405a', zapato: '#e8e2d8'};
export async function armar(V) {
  const C = V.cfg || {}; const CARO = PJS[C.pj || 'caro']; const QUIEN = C.q || 'caro';
  const O = obra(V, {nombre: 'Compara Tu Obra Social', logo: 'coberturas.png', ctaSub: 'y te respondemos', hookHTML: C.hook || '¿Otra vez<br><em>aumentó?</em>', hookHasta: 1.4, notas: []});
  document.documentElement.style.cssText += `--f1:Manrope;--f2:Manrope;--acc:#7fe0a8;--hs:140px;--hw:800;--em:normal;--kwCol:${VERDE};--logoH:130px;--velo:rgba(0,61,59,.92);--ctaTop:600px;--hookTop:1150px;--kws:116px;${C.hook ? ganchoCss(C.hook) : ''}`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pC = poser(V, QUIEN);
  const mapa = `<rect x="-138" y="-188" width="276" height="166" fill="#e6efe9"/>${[...Array(8)].map((_, i) => `<path d="M${-138 + i * 40},-188 l20,166" stroke="#fff" stroke-width="6"/>`).join('')}<path d="M-138,-120 L138,-90 M-138,-60 L138,-40" stroke="#fff" stroke-width="8"/>
    ${[[-70, -120], [10, -80], [70, -140]].map(([a, b]) => `<path d="M${a},${b} c-10,-16 -10,-30 0,-30 c10,0 10,14 0,30 z" fill="${BOSQUE}"/><circle cx="${a}" cy="${b - 20}" r="5" fill="#fff"/>`).join('')}<circle cx="0" cy="-100" r="10" fill="#e8574a" stroke="#fff" stroke-width="3"/>`;
  // 1 · el PH de Caro, de día: escritorio con la compu y plantas
  const e1 = O.esc({nombre: 'ph', fondo: '#e7efe6', capas: [
    {f: .6, prof: .6, w: 1500, svg: D.interior({w: 1500, pared: '#efe4d3', piso: '#a77a55', ventana: [880, 330, 460, 640], vista: 'dia', zocalo: '#f7f1e6', luz: '#fff2cf'}) + `<g>${[...Array(9)].map((_, i) => `<circle cx="${900 + i * 52}" cy="${880 + (i % 3) * 22}" r="${70 + (i % 4) * 14}" fill="${['#3f7a52', '#4f8f5e', '#2f6a46'][i % 3]}"/>`).join('')}<rect x="880" y="930" width="460" height="40" fill="#6f9a6a"/></g><rect x="862" y="312" width="496" height="676" fill="none" stroke="#c9b79c" stroke-width="36"/><rect x="1102" y="330" width="12" height="640" fill="#c9b79c"/><rect x="880" y="618" width="460" height="10" fill="#c9b79c"/>` + `<g>${[0, 1, 2].map(j => `<rect x="110" y="${880 + j * 150}" width="300" height="14" fill="#8a6a4c"/>` + [...Array(7)].map((_, i) => `<rect x="${122 + i * 40}" y="${880 + j * 150 - 96 - (i % 3) * 12}" width="32" height="${96 + (i % 3) * 12}" rx="3" fill="${['#235347', '#c45a3b', '#e5c76b', '#8EB69B', '#2f3b55'][(i + j) % 5]}"/>`).join('')).join('')}</g>` + D.planta({x: 1300, y: 1410, s: 1.6}) + D.calendario({x: 400, y: 640, s: 1.0, dia: C.cal || 'PAGAR', mes: 'NOVIEMBRE', acento: BOSQUE})},
    {f: 1, prof: 1, w: 1500, svg: '<g class="act"></g>' + D.mesa({x: 800, y: 1150, w: 640, c: '#d8c3a5', patas: 270}) + laptop({x: 860, y: 1150, s: 1.1}) + `<g class="tel"><rect x="610" y="1132" width="80" height="18" rx="6" fill="#111"/></g>` + D.planta({x: 520, y: 1150, s: .6})}]});
  const caro = personaje(e1.capas[1].svg.querySelector('.act'), CARO); const lpant = e1.capas[1].svg.querySelector('.lpant'); const tel = e1.capas[1].svg.querySelector('.tel');
  // 2 · notificación en el celular (prepaga genérica)
  const cm = PP.celularMano({piel: CARO.piel, manga: CARO.campera});
  const e2 = O.esc({nombre: 'celu', fondo: MENTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${MENTA}"/>`}, {f: 1, prof: 1, svg: cm.svg}]});
  e2.capas[1].svg.querySelector('.pantalla').innerHTML = PP.notificacion({hora: 'Hoy', app: 'Tu banco', titulo: 'Pago acreditado', texto: 'Cuota del monotributo. Incluye el aporte a tu obra social.', color: BOSQUE, fondo: ['#2a5a50', '#9cc7b0']}).replace('jueves 20 de noviembre', 'viernes');
  // 3 · la carta y la lupa menta (objeto de la marca)
  const ca = PP.carta({fondo: MENTA, acento: BOSQUE, remite: 'Monotributo · Tu cuota', titulo: 'Qué incluye tu cuota'});
  ca.svg = ca.svg.split('A partir de este mes, tu cuota se actualiza según').join('Tu cuota incluye el impuesto, el aporte').split('lo informado en tu plan vigente. Ver condiciones.').join('jubilatorio y el aporte a tu obra social.');
  const e3 = O.esc({nombre: 'carta', fondo: MENTA, capas: [{f: 1, prof: 1, svg: ca.svg}]});
  const lupa = e3.capas[0].svg.querySelector('.lupa'), zoom = e3.capas[0].svg.querySelector('.zoom');
  luz(e1, 'background:linear-gradient(110deg,transparent 45%,rgba(255,246,214,.45)),linear-gradient(180deg,transparent 60%,rgba(0,40,30,.18))');
  luz(e3, 'background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.35),transparent 50%)');
  const lupaEn = (x, y, z = 1.9) => { lupa.setAttribute('transform', `translate(${x},${y})`); zoom.setAttribute('transform', `translate(${-x * z},${-y * z}) scale(${z})`); };
  const vibra = t => (t > .1 && t < 1.6) ? Math.sin(t * 90) * 4 : 0;
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(700, 740, k), Y: lerp(1080, 1060, k), z: lerp(1.75, 1.85, ease(k)), foco: 1, ap: 5}), act: t => {
      tel.setAttribute('transform', `translate(${vibra(t)},0)`); lpant.innerHTML = '';
      pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: lerp(40, 75, easeOut(win(t, .3, .8))), cR: lerp(60, 96, easeOut(win(t, .3, .8))), hL: 30, cL: 55, mira: .4, ceja: .9, sonrisa: -.5, cab: 6});
      caro.E.propMano.innerHTML = t > .55 ? celuMano : ''; }},
    {t0: V.frases[1].t - .05, esc: e2, cam: k => ({x: 540, y: lerp(990, 950, k), z: lerp(1.0, 1.07, ease(k)), r: lerp(1.5, 0, k), foco: 1, ap: 4})},
    {t0: V.frases[1].t + 2.1, esc: e3, cam: k => ({x: 540, y: lerp(900, 980, k), z: lerp(1.05, 1.12, ease(k)), foco: 1}), act: t => lupaEn(lerp(380, 640, ease(win(t, V.frases[1].t + 2.1, F('lupa').t + .3))), lerp(1300, 990, ease(win(t, V.frases[1].t + 2.1, F('lupa').t)))) },
    {t0: F('lupa').t + .5, esc: e3, cam: k => ({x: lerp(560, 600, k), y: 990, z: lerp(1.6, 1.7, ease(k)), foco: 1}), act: t => lupaEn(520 + wob(t) * 30, 995 + wob(t, 2) * 8)},
    {t0: FI(1).t - .1, esc: e1, cam: k => ({X: lerp(600, 640, k), Y: 980, z: 2.2, foco: 1, ap: 6}), act: t => { lpant.innerHTML = '';
      pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 70, cR: 70, hL: 30, cL: 55, mira: .7, ceja: .2, sonrisa: .1, cab: 8});
      caro.E.propMano.innerHTML = `<g transform="rotate(-60)"><rect x="-10" y="-48" width="96" height="62" rx="10" fill="${BOSQUE}"/><rect x="4" y="-38" width="40" height="8" rx="4" fill="#fff" opacity=".8"/><rect x="4" y="-22" width="64" height="6" rx="3" fill="#fff" opacity=".5"/><rect x="58" y="-2" width="20" height="12" rx="3" fill="#e5c76b"/></g>`; }},
    {t0: FI(2).t - .1, esc: e1, cam: k => ({X: 400, Y: lerp(660, 640, k), z: lerp(2.6, 2.75, ease(k)), foco: .6, ap: 5}), act: t => { caro.E.propMano.innerHTML = ''; pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 30, cR: 50}); }},
    {t0: FI(3).t - .1, esc: e1, cam: k => ({X: lerp(840, 860, k), Y: lerp(1040, 1030, k), z: lerp(2.5, 2.65, ease(k)), foco: 1, ap: 6}), act: t => { lpant.innerHTML = mapa;
      pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 60, cR: 70, hL: 40, cL: 60, mira: .8, sonrisa: .2}); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(640, 660, k), Y: 1020, z: lerp(2.0, 2.1, ease(k)), foco: 1, ap: 5}), act: t => { lpant.innerHTML = mapa; const k = easeOut(win(t, F('alivio').t, F('alivio').t + .8));
      pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: lerp(60, 160, k), cR: lerp(70, 20, k), hL: lerp(40, 150, k), cL: lerp(60, 20, k), sonrisa: 1, ceja: .4, cab: -6 * k}); }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 660, Y: 1020, z: lerp(2.1, 2.2, k), foco: 1, ap: 10}), act: t => pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 160, cR: 20, hL: 150, cL: 20, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 700, Y: 1080, z: 1.75, foco: 1, ap: 5}), act: t => { lpant.innerHTML = ''; pC(caro, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 40, cR: 60, hL: 30, cL: 55, mira: .4}); caro.E.propMano.innerHTML = ''; }},
  ];
  O.tomas[0].boca = sobre(e1, 1, caro); O.tomas[7].boca = sobre(e1, 1, caro);
  // planos irreales: Caro diminuta sobre la carta gigante (cae la lupa en la palabra clave) y caída entre hojas antes de los 3 puntos
  const G = gigante(O, {pj: CARO, doc: C.doc || 'Detalle de tu cuota', papel: ['#8fb7a2', '#DAF1DE', '#f4fbf5'], renglon: '#a9c9b6', tinta: BOSQUE, cielo: ['#1f6b5c', '#0b3b33', '#04201c'], acento: SALVIA, objeto: C.obj || 'lupa'});
  const K = caida(O, {pj: CARO, fondo: ['#1f6b5c', '#03201c'], hoja: '#f4fbf5', renglon: '#a9c9b6', raya: MENTA, acento: '#7fe0a8'});
  const f2 = V.frases[2], f3 = V.frases[3], f4 = V.frases[4];
  O.tomas.splice(O.tomas.findIndex(x => x.t0 > f2.t - .1), 0, G.toma(f2.t - .1, f3.t + .02));
  O.tomas.splice(O.tomas.findIndex(x => x.t0 > f4.t - .1), 0, K.toma(f4.t - .1));
  O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f3.t + .02]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f3.t + .02 ? .45 * Math.exp(-(t - f3.t - .02) * 10) : 0);
  if (C.ap || C.grade || C.cam) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : C.ap === 'celu' ? O.tomas.find(x => x.esc === e2) : null);
  return O;
}
