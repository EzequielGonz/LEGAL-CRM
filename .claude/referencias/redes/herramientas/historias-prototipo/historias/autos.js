// Autos · «El ticket del 0 km» · mini historia: Juli y Mati compran su primer 0 km; el ticket suma hasta el precio llave en mano.
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, wob, clamp, backOut} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, PJS, ganchoCss, variar} from './comun.js';
import {gigante, caida} from '../historia/irreal.js';
const AZUL = '#207CCF', TINTA = '#000521', NAVY = '#011F65';
const JULI = {peinado: 'largo', piel: '#d9a37e', pelo: '#2a1a12', remera: '#e9e3d4', campera: '#c45a3b', manga: 'larga', pantalon: '#2b3854', zapato: '#f0ece4'};
const MATI = {peinado: 'rulos', piel: '#b98058', pelo: '#1d140e', remera: '#1f2a3a', pantalon: '#4a4f58', zapato: '#222'};
const VEND = {peinado: 'rapado', piel: '#e0b394', pelo: '#3a2a1e', remera: '#ffffff', campera: NAVY, manga: 'larga', pantalon: '#1c2233'};
export async function armar(V) {
  const C = V.cfg || {};
  const O = obra(V, {nombre: 'Automotores Kocos', logo: 'autos.png', ctaSub: 'y te respondemos', hookHTML: C.hook || '¿Precio de lista<br><em>= precio final?</em>', hookHasta: 1.6, notas: []});
  document.documentElement.style.cssText += `--f1:Archivo;--f2:'Plus Jakarta Sans';--fs:Archivo;--tt:uppercase;--acc:#8CC8FF;--hs:112px;--hw:900;--em:normal;--kwCol:#fff;--logoH:150px;--velo:rgba(0,5,33,.9);--ctaTop:600px;--hookTop:1150px;--ss:78px;${C.hook ? ganchoCss(C.hook) : ''}`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pJ = poser(V, 'juli'); const pM = poser(V, 'mati'); const pV = poser(V, 'vend');
  // 1 · concesionario: vidriera, auto en exhibición y el cartel del precio de lista
  const e1 = O.esc({nombre: 'conce', fondo: '#dfe7f1', capas: [
    {f: .5, prof: .5, w: 1600, svg: `<rect x="-100" y="0" width="1800" height="1440" fill="#eef2f7"/>${[...Array(7)].map((_, i) => `<rect x="${i * 250}" y="200" width="230" height="1000" fill="#cfe0ef"/><rect x="${i * 250}" y="200" width="230" height="1000" fill="url(#cv)" opacity=".5"/>`).join('')}
      <defs><linearGradient id="cv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      ${D.skyline({w: 1700, base: 1200, color: '#b8c7d8', obelisco: [1250, 1200, 520, '#f2efe8'], seed: 5}).replace(/<rect/g, '<rect opacity=".55"')}
      <rect x="-100" y="140" width="1800" height="70" fill="${NAVY}"/><text x="800" y="190" font-family="Archivo" font-weight="900" font-size="46" fill="#fff" text-anchor="middle" letter-spacing="4">AUTOMOTORES · 0 KM</text>
      <rect x="-100" y="1420" width="1800" height="600" fill="#cfd6df"/><rect x="-100" y="1420" width="1800" height="600" fill="url(#cv)" opacity=".4"/>`},
    {f: 1, prof: 1, w: 1600, svg: D.auto({x: 980, y: 1540, s: 1.5, color: '#1f6fc2', brillo: .8}) + `<g class="precio"><rect x="560" y="1150" width="8" height="300" fill="#555"/><rect x="420" y="1040" width="290" height="140" rx="14" fill="#fff" stroke="${NAVY}" stroke-width="6"/>
      <text x="565" y="1092" font-family="Archivo" font-weight="800" font-size="30" fill="${NAVY}" text-anchor="middle">${C.cartel || 'PRECIO DE LISTA'}</text><rect x="470" y="1110" width="190" height="44" rx="8" fill="${NAVY}"/><text x="460" y="1148" font-family="Archivo" font-weight="800" font-size="40" fill="${NAVY}" text-anchor="end">$</text></g>` + '<g class="act"></g>'}]});
  const act1 = e1.capas[1].svg.querySelector('.act'); const mati = personaje(act1, MATI), juli = personaje(act1, JULI), vend = personaje(act1, VEND);
  // 2 · la ticketera que suma (objeto de la marca)
  const tk = PP.ticketera({items: C.ticket || ['Flete', 'Formularios y patentamiento', 'Sellos', 'Seguro'], total: C.total || 'PRECIO LLAVE EN MANO'});
  const e2 = O.esc({nombre: 'ticket', fondo: TINTA, capas: [{f: .4, prof: .3, svg: `<defs><radialGradient id="tg" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect width="1080" height="1920" fill="url(#tg)"/>${[...Array(9)].map((_, i) => `<rect x="${i * 140 - 40}" y="0" width="3" height="1920" fill="${AZUL}" opacity=".12"/>`).join('')}`}, {f: 1, prof: 1, svg: tk.svg}]});
  const papel = e2.capas[1].svg.querySelector('.papel'); const filas = [...e2.capas[1].svg.querySelectorAll('.fila')];
  // 3 · la llave con el logo
  const e3 = O.esc({nombre: 'llave', fondo: TINTA, capas: [{f: .4, prof: .3, svg: `<rect width="1080" height="1920" fill="${TINTA}"/><circle cx="540" cy="900" r="520" fill="${AZUL}" opacity=".18"/>`},
    {f: 1, prof: 1, svg: `<g class="key" transform="translate(540,900)"><circle cy="-330" r="70" fill="none" stroke="#dfe5ee" stroke-width="16"/><rect x="-150" y="-300" width="300" height="440" rx="120" fill="#0b0d12"/><rect x="-140" y="-290" width="280" height="200" rx="110" fill="#fff" opacity=".06"/>
      <image href="autos.png" x="-70" y="-250" width="140" height="188"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-20 + i * 70}" r="26" fill="#1e2128"/>`).join('')}<rect x="-30" y="140" width="60" height="420" rx="8" fill="#cfd6e0"/>${[0, 1, 2, 3].map(i => `<rect x="${i % 2 ? 10 : -50}" y="${200 + i * 80}" width="40" height="40" fill="#cfd6e0"/>`).join('')}<circle cx="110" cy="-160" r="10" fill="${AZUL}"/></g>`}]});
  const key = e3.capas[1].svg.querySelector('.key');
  luz(e1, 'background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 70% 70%,rgba(32,124,207,.18),transparent 50%)');
  const ver = (n) => filas.forEach((f, i) => f.style.opacity = i < n ? 1 : 0);
  const filaT = [F('impresora').t, ...V.frases.filter(f => f.item).map(f => f.t), F('total').t]; // 0: encabezado+lista
  const salida = t => { let n = 1; filaT.forEach((x, i) => { if (t >= x) n = i + 2; }); return n; };
  const pareja = (t, ex = {}) => { pM(mati, t, Object.assign({x: 340, y: 1560, s: 1.02, flip: 1, hR: 10, cR: 20, hL: 6, cL: 14, mira: .3}, ex.m || {})); pJ(juli, t, Object.assign({x: 480, y: 1580, s: .98, flip: 1, hR: 20, cR: 30, mira: .4}, ex.j || {})); vend.pose(Object.assign({x: 1420, y: 1570, s: 1.0, flip: -1, parpado: 0}, ex.v || {x: -999})); };
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(560, 600, k), Y: lerp(1250, 1230, k), z: lerp(1.55, 1.65, ease(k)), foco: 1, ap: 4}), act: t => pareja(t, {j: {hR: 60, cR: 50, ceja: .9, sonrisa: -.3, mira: .6}})},
    {t0: V.frases[1].t - .05, esc: e1, cam: k => ({X: 565, Y: lerp(1120, 1100, k), z: lerp(2.6, 2.75, ease(k)), foco: 1, ap: 6}), act: t => pareja(t)},
    {t0: F('impresora').t - .1, esc: e2, cam: k => ({x: 540, y: lerp(1050, 760, ease(k)), z: lerp(1.0, 1.06, k), foco: 1}), act: t => { const n = salida(t); ver(n);
      const L = Math.min(tk.altoTicket, 120 + (n - 1) * 100 + (n >= filaT.length + 1 ? 160 : 0)); const prev = papel.dataset.L ? +papel.dataset.L : L; papel.setAttribute('transform', `translate(0,${1150 - L})`); }},
    {t0: F('total').t - .05, esc: e2, cam: k => ({x: 540, y: lerp(560, 600, k), z: lerp(1.25, 1.35, ease(k)), foco: 1}), act: t => { ver(9); papel.setAttribute('transform', `translate(0,${1150 - tk.altoTicket})`); }},
    {t0: F('llave').t - .05, esc: e3, cam: k => ({x: 540, y: 960, z: lerp(1.0, 1.08, k), foco: 1}), act: t => { const k = win(t, F('llave').t - .05, F('alivio').t); key.setAttribute('transform', `translate(540,${lerp(980, 900, easeOut(k))}) rotate(${lerp(-25, 6, easeOut(k))}) scale(${lerp(.9, 1, easeOut(k))},1)`); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(620, 660, k), Y: 1220, z: lerp(1.75, 1.85, ease(k)), foco: 1, ap: 4}), act: t => { pareja(t, {j: {hR: 150, cR: 30, hL: 140, cL: 20, sonrisa: 1, ceja: .5}, m: {sonrisa: 1, hR: 60, cR: 40}});
      juli.E.propMano.innerHTML = `<rect x="-12" y="-20" width="24" height="36" rx="10" fill="#0b0d12"/><circle cy="-26" r="8" fill="none" stroke="#ccd" stroke-width="3"/>`; }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 660, Y: 1220, z: lerp(1.85, 1.95, k), foco: 1, ap: 10}), act: t => pareja(t, {j: {hR: 150, cR: 30, sonrisa: 1}, m: {sonrisa: 1}})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 560, Y: 1250, z: 1.55, foco: 1, ap: 4}), act: t => { juli.E.propMano.innerHTML = ''; pareja(t, {j: {hR: 60, cR: 50, ceja: .9, sonrisa: -.3, mira: .6}}); }},
  ];
  O.tomas[0].boca = sobre(e1, 1, juli); O.tomas[5].boca = sobre(e1, 1, juli);
  // planos irreales: la pareja diminuta sobre el papel gigante con la llave que cae, y caída entre tickets
  const PJ1 = PJS[C.q === 'mati' ? 'mati' : 'juli'];
  const G = gigante(O, {pj: PJ1, doc: C.doc || 'Precio de lista', papel: ['#9fb6d6', '#e8f0fb', '#ffffff'], renglon: '#b9c9e0', tinta: NAVY, cielo: ['#0E4EB2', '#020C47', '#000521'], acento: AZUL, objeto: 'llave', fuente: 'Archivo'});
  const K = caida(O, {pj: PJ1, fondo: ['#0E4EB2', '#000521'], hoja: '#ffffff', renglon: '#b9c9e0', raya: '#8CC8FF', acento: AZUL});
  const f1 = V.frases[1], f2 = V.frases[2]; const tg = f1.t + Math.min(1.1, (f1.fin - f1.t) * .5);
  O.tomas.push(G.toma(tg, f2.t - .05)); O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f2.t - .05]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f2.t - .05 ? .45 * Math.exp(-(t - f2.t + .05) * 10) : 0);
  if (C.ap || C.grade || C.cam) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : C.ap === 'ticket' ? O.tomas.find(x => x.esc === e2) : C.ap === 'llave' ? O.tomas.find(x => x.esc === e3) : null);
  return O;
}
