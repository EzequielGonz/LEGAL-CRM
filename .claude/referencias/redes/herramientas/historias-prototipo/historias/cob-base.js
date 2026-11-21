// Coberturas · constructor compartido de los reels del cronograma x2 (sesión de Coberturas, 20/11).
// Misma estructura de 10 frases que «La carta» (cob.js), así las tomas, los planos irreales y el sonido caen en su lugar,
// pero cada idea trae su propia escena (lugar de Buenos Aires, utilería, pantalla, primer plano y objeto irreal).
// Uso: historias/cob-<idea>-<v>.js → export const armar = V => armarCob(V, {escena, ...}).
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, win, wob, hash} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, celuMano, laptop, PJS, ganchoCss, variar} from './comun.js';
import {gigante, caida, OBJETOS} from '../historia/irreal.js';
export const VERDE = '#003D3B', MENTA = '#DAF1DE', SALVIA = '#8EB69B', BOSQUE = '#235347';

// ---------- objetos irreales propios de Coberturas (sin números ni marcas) ----------
const hoja = (w, h, c, r, n = 6) => `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="18" fill="${c}"/>${[...Array(n)].map((_, j) => `<rect x="${-w / 2 + 50}" y="${-h / 2 + 90 + j * (h - 140) / n}" width="${(w - 100) * (.55 + hash(j + 3) * .4)}" height="18" rx="9" fill="${r}"/>`).join('')}`;
Object.assign(OBJETOS, {
  folleto: a => `<g transform="translate(0,-700) scale(2.2) rotate(-8)">${hoja(300, 420, '#f4fbf5', '#a9c9b6')}<rect x="-150" y="-210" width="300" height="70" rx="18" fill="${a}"/><circle cx="0" cy="40" r="56" fill="${a}" opacity=".35"/></g>`,
  naipes: a => `<g transform="translate(0,-720) scale(2.1)"><g transform="rotate(-18) translate(-90,0)">${hoja(280, 400, '#f4fbf5', '#a9c9b6', 5)}<rect x="-140" y="-200" width="280" height="64" rx="18" fill="${a}"/></g><g transform="rotate(16) translate(90,10)">${hoja(280, 400, '#ffffff', '#c9dccf', 5)}<rect x="-140" y="-200" width="280" height="64" rx="18" fill="#235347"/></g></g>`,
  mazo: a => `<g transform="translate(0,-760) scale(2.3) rotate(-24)"><rect x="-26" y="-60" width="52" height="420" rx="22" fill="#6b4a2f"/><rect x="-170" y="-170" width="340" height="130" rx="30" fill="#7a5436"/><rect x="-184" y="-160" width="34" height="110" rx="12" fill="${a}"/><rect x="150" y="-160" width="34" height="110" rx="12" fill="${a}"/></g>`,
  moneda: a => `<g transform="translate(0,-700) scale(2.3)"><ellipse rx="190" ry="190" fill="#e5c76b"/><ellipse rx="150" ry="150" fill="none" stroke="#b8963d" stroke-width="16"/><path d="M-40,-60 C-40,-110 50,-110 50,-60 C50,-10 -50,0 -50,50 C-50,100 40,100 40,60" stroke="${a}" stroke-width="22" fill="none" stroke-linecap="round"/><rect x="-10" y="-130" width="20" height="260" rx="10" fill="${a}"/></g>`,
  valija: a => `<g transform="translate(0,-640) scale(2.2)"><rect x="-70" y="-300" width="140" height="80" rx="30" fill="none" stroke="#1f2a2a" stroke-width="26"/><rect x="-220" y="-230" width="440" height="420" rx="44" fill="${a}"/><rect x="-220" y="-60" width="440" height="22" fill="#000" opacity=".2"/><circle cx="-150" cy="200" r="30" fill="#1f2a2a"/><circle cx="150" cy="200" r="30" fill="#1f2a2a"/></g>`,
  reloj: a => `<g transform="translate(0,-680) scale(2.3)"><circle r="200" fill="#f4fbf5" stroke="${a}" stroke-width="34"/><rect x="-10" y="-150" width="20" height="160" rx="10" fill="#1f2a2a"/><rect x="-10" y="-10" width="120" height="20" rx="10" fill="#1f2a2a" transform="rotate(-30)"/><circle r="20" fill="${a}"/></g>`,
  pizza: a => `<g transform="translate(0,-680) scale(2.3)"><path d="M0,0 L-190,-330 A380,380 0 0,1 190,-330 Z" fill="#e8b45a"/><path d="M-190,-330 A380,380 0 0,1 190,-330 L170,-300 A350,350 0 0,0 -170,-300 Z" fill="#b5762f"/>${[[-40, -200], [50, -240], [0, -110], [-80, -280], [90, -300]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="26" fill="${a}"/>`).join('')}</g>`,
  credencial: a => `<g transform="translate(0,-700) scale(2.3) rotate(10)"><rect x="-260" y="-160" width="520" height="320" rx="34" fill="${a}"/><rect x="-220" y="-110" width="140" height="110" rx="16" fill="#f4fbf5" opacity=".9"/><rect x="-50" y="-100" width="250" height="24" rx="12" fill="#fff" opacity=".85"/><rect x="-50" y="-50" width="190" height="20" rx="10" fill="#fff" opacity=".6"/><rect x="-220" y="60" width="440" height="30" rx="10" fill="#e5c76b"/></g>`,
});

// ---------- escenas por lugar (el personaje siempre en x 560, y 1430, sentado: las cámaras de las tomas se comparten) ----------
const ventanaParque = `<g>${[...Array(9)].map((_, i) => `<circle cx="${900 + i * 52}" cy="${880 + (i % 3) * 22}" r="${70 + (i % 4) * 14}" fill="${['#3f7a52', '#4f8f5e', '#2f6a46'][i % 3]}"/>`).join('')}<rect x="880" y="930" width="460" height="40" fill="#6f9a6a"/></g><rect x="862" y="312" width="496" height="676" fill="none" stroke="#c9b79c" stroke-width="36"/><rect x="1102" y="330" width="12" height="640" fill="#c9b79c"/><rect x="880" y="618" width="460" height="10" fill="#c9b79c"/>`;
const biblio = `<g>${[0, 1, 2].map(j => `<rect x="110" y="${880 + j * 150}" width="300" height="14" fill="#8a6a4c"/>` + [...Array(7)].map((_, i) => `<rect x="${122 + i * 40}" y="${880 + j * 150 - 96 - (i % 3) * 12}" width="32" height="${96 + (i % 3) * 12}" rx="3" fill="${['#235347', '#c45a3b', '#e5c76b', '#8EB69B', '#2f3b55'][(i + j) % 5]}"/>`).join('')).join('')}</g>`;
export function heladera({x = 390, y = 1420, c = '#e9eef0', imanes = 7}) {
  return `<g transform="translate(${x},${y})"><rect x="-150" y="-1040" width="300" height="1040" rx="26" fill="${c}"/><rect x="-150" y="-700" width="300" height="10" fill="#b9c2c6"/>
    <rect x="110" y="-960" width="14" height="200" rx="7" fill="#9aa6ab"/><rect x="110" y="-640" width="14" height="260" rx="7" fill="#9aa6ab"/>
    <g class="imanes">${[...Array(imanes)].map((_, i) => `<g class="im" data-i="${i}"><rect x="${-120 + (i % 3) * 82}" y="${-1000 + Math.floor(i / 3) * 110}" width="${66 + hash(i) * 20}" height="${80 + hash(i + 4) * 20}" rx="6" fill="${['#fff8e6', '#f4fbf5', '#ffe3e3', '#e3eeff'][i % 4]}" transform="rotate(${(hash(i + 8) - .5) * 14})"/><circle cx="${-90 + (i % 3) * 82}" cy="${-996 + Math.floor(i / 3) * 110}" r="11" fill="${['#c45a3b', '#235347', '#e5c76b', '#2f5d8a'][i % 4]}"/></g>`).join('')}</g></g>`;
}
const azulejos = (x0, y0, w, h, c1, c2) => `<g>${[...Array(Math.ceil(w / 60) * Math.ceil(h / 60))].map((_, i) => { const cols = Math.ceil(w / 60); const cx = x0 + (i % cols) * 60, cy = y0 + Math.floor(i / cols) * 60; return `<rect x="${cx}" y="${cy}" width="58" height="58" fill="${(i + Math.floor(i / cols)) % 2 ? c1 : c2}"/>`; }).join('')}</g>`;
function alacena({x = 1000, y = 380, w = 420, c = '#d8c3a5'}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="220" rx="10" fill="${c}"/><rect x="${x + w / 2 - 3}" y="${y}" width="6" height="220" fill="#000" opacity=".12"/><rect x="${x + w / 2 - 40}" y="${y + 180}" width="24" height="10" rx="5" fill="#8a7a64"/><rect x="${x + w / 2 + 16}" y="${y + 180}" width="24" height="10" rx="5" fill="#8a7a64"/>`;
}
const mate = (x, y) => `<g transform="translate(${x},${y})"><path d="M-30,0 C-40,-50 -30,-80 0,-84 C30,-80 40,-50 30,0 Z" fill="#7a5436"/><rect x="-6" y="-130" width="10" height="70" rx="4" fill="#c9c9c9" transform="rotate(14)"/></g>`;
const frutera = (x, y) => `<g transform="translate(${x},${y})"><path d="M-90,-10 C-80,30 80,30 90,-10 Z" fill="#c45a3b"/>${[[-50, -30, '#e5c76b'], [0, -40, '#8EB69B'], [46, -28, '#e8574a'], [-20, -66, '#e8574a']].map(([a, b, c]) => `<circle cx="${a}" cy="${b}" r="30" fill="${c}"/>`).join('')}</g>`;
const telMesa = x => `<g class="tel"><rect x="${x}" y="1132" width="80" height="18" rx="6" fill="#111"/></g>`;
const folletos = (x, y, a) => `<g transform="translate(${x},${y})"><g transform="rotate(-12)"><rect x="-70" y="-20" width="130" height="18" rx="3" fill="#f4fbf5"/><rect x="-70" y="-20" width="130" height="6" fill="${a}"/></g><g transform="rotate(9) translate(40,-4)"><rect x="-70" y="-20" width="130" height="18" rx="3" fill="#fff"/><rect x="-70" y="-20" width="130" height="6" fill="#c45a3b"/></g></g>`;

// cartel de pared genérico (reemplaza al calendario en el primer plano del punto 2)
export const cartelPared = ({titulo = 'CARTILLA', items = 4, acento = BOSQUE, x = 400, y = 640}) => `<g transform="translate(${x},${y})"><rect x="-160" y="-180" width="320" height="360" rx="16" fill="#fbfaf6"/><rect x="-160" y="-180" width="320" height="76" rx="16" fill="${acento}"/><rect x="-160" y="-124" width="320" height="20" fill="${acento}"/><text x="0" y="-128" font-family="Manrope" font-weight="800" font-size="${titulo.length > 12 ? 26 : 36}" fill="#fff" text-anchor="middle" letter-spacing="1">${titulo}</text>${[...Array(items)].map((_, j) => `<circle cx="-118" cy="${-60 + j * 60}" r="14" fill="${acento}" opacity=".85"/><rect x="-90" y="${-68 + j * 60}" width="${200 - (j % 2) * 50}" height="16" rx="8" fill="#b3beb8"/>`).join('')}</g>`;
export const ESCENAS = {
  // Departamento de Lucía en Caballito, frente a Parque Rivadavia
  depto: (C, X) => ({fondo: '#e7efe6', back: D.interior({w: 1500, pared: X.pared || '#efe4d3', piso: '#a77a55', ventana: [880, 330, 460, 640], vista: X.vista || 'dia', zocalo: '#f7f1e6', luz: '#fff2cf'}) + ventanaParque + biblio + D.planta({x: 1300, y: 1410, s: 1.6}) + (X.slot2 || D.calendario({x: 400, y: 640, s: 1.0, dia: C.cal || 'HOY', mes: 'NOVIEMBRE', acento: BOSQUE})),
    front: '<g class="act"></g>' + D.mesa({x: 800, y: 1150, w: 640, c: '#d8c3a5', patas: 270}) + laptop({x: 860, y: 1150, s: 1.1}) + telMesa(610) + (X.mesaExtra || '')}),
  // Cocina de los Ferreyra en Villa Urquiza: azulejos, heladera con imanes, alacena, ventana al barrio
  cocina: (C, X) => ({fondo: '#f0eadf', back: D.interior({w: 1500, pared: X.pared || '#f1e7d6', piso: X.piso || '#8f6b52', ventana: [960, 640, 380, 420], vista: X.vista || 'dia', zocalo: '#e7dccb', luz: X.vista === 'noche' ? '#ffd59a' : '#fff2cf'})
      + azulejos(560, 1080, 1000, 300, X.az1 || '#e6efe9', X.az2 || '#d2e3d8') + alacena({x: 960, y: 380, c: X.alacena || '#d8c3a5'}) + (X.slot2 || heladera({x: 390, c: X.heladera || '#e9eef0'})) + (X.vista === 'noche' ? D.lampara({x: 760, y: 1410}) : ''),
    front: '<g class="act"></g>' + D.mesa({x: 800, y: 1150, w: 660, c: X.mesa || '#c9a77f', patas: 270}) + laptop({x: 870, y: 1150, s: 1.08}) + telMesa(612) + mate(1130, 1150) + (X.mesaExtra || '')}),
  // Comedor de los Ferreyra: sofá atrás, cuadro, mesa grande (para la familia)
  comedor: (C, X) => ({fondo: '#ece4d6', back: D.interior({w: 1500, pared: X.pared || '#e9dcc6', piso: '#7d5a42', ventana: [940, 360, 420, 560], vista: X.vista || 'dia', zocalo: '#f3ead9', luz: '#ffe9c2', cuadro: `<rect x="560" y="420" width="260" height="190" rx="8" fill="#c9b79c"/><rect x="576" y="436" width="228" height="158" fill="#8EB69B"/><circle cx="660" cy="500" r="30" fill="#e5c76b"/>`})
      + D.sofa({x: 1150, y: 1420, c: X.sofa || '#5c8f7a'}) + (X.slot2 || D.calendario({x: 400, y: 640, s: 1.0, dia: C.cal || 'HOY', mes: 'NOVIEMBRE', acento: BOSQUE})) + D.planta({x: 180, y: 1410, s: 1.3}),
    front: '<g class="act"></g>' + D.mesa({x: 800, y: 1150, w: 700, c: X.mesa || '#b08a63', patas: 270}) + laptop({x: 880, y: 1150, s: 1.06}) + telMesa(612) + frutera(1110, 1150) + (X.mesaExtra || '')}),
  // Sala de espera de una guardia genérica, de noche: luz fría, fila de sillas, reloj, pantalla de turnos (sin nombres reales)
  guardia: (C, X) => ({fondo: '#dfe8ea', back: `<rect x="-100" y="0" width="1700" height="1420" fill="${X.pared || '#dfe8e6'}"/><rect x="-100" y="0" width="1700" height="120" fill="#f4fbf5"/>${[...Array(5)].map((_, i) => `<rect x="${-40 + i * 340}" y="40" width="220" height="30" rx="10" fill="#fff" opacity=".95"/>`).join('')}
      <rect x="-100" y="760" width="1700" height="20" fill="#8EB69B"/><rect x="-100" y="1394" width="1700" height="26" fill="#cfdcd7"/><rect x="-100" y="1420" width="1700" height="600" fill="#b7c4c4"/>${[...Array(12)].map((_, j) => `<rect x="${-100 + j * 150}" y="1420" width="3" height="600" fill="#000" opacity=".08"/>`).join('')}
      <rect x="1000" y="260" width="420" height="300" rx="16" fill="#1f2a2a"/><rect x="1014" y="274" width="392" height="272" rx="10" fill="${VERDE}"/><text x="1210" y="350" font-family="Manrope" font-weight="800" font-size="40" fill="#DAF1DE" text-anchor="middle">GUARDIA</text>${[0, 1, 2].map(i => `<rect x="1050" y="${390 + i * 46}" width="${300 - i * 50}" height="22" rx="11" fill="#DAF1DE" opacity=".6"/>`).join('')}
      ${[...Array(6)].map((_, i) => D.silla({x: 1080 + i * 120 - (i > 2 ? 0 : 0), y: 1420, c: '#5c8f7a', flip: -1})).join('')}<rect x="1300" y="640" width="160" height="420" rx="14" fill="#f4fbf5"/><path d="M1380,700 l0,60 M1350,730 l60,0" stroke="#e8574a" stroke-width="22"/>`
      + (X.slot2 || `<g transform="translate(400,640)"><circle r="150" fill="#fff" stroke="${BOSQUE}" stroke-width="24"/>${[...Array(12)].map((_, i) => `<rect x="-4" y="-130" width="8" height="24" fill="#1f2a2a" transform="rotate(${i * 30})"/>`).join('')}<rect x="-7" y="-100" width="14" height="104" rx="7" fill="#1f2a2a"/><rect x="-6" y="-6" width="80" height="12" rx="6" fill="#1f2a2a" transform="rotate(-90)"/><circle r="14" fill="#e8574a"/></g>`),
    front: '<g class="act"></g>' + D.mesa({x: 800, y: 1150, w: 520, c: '#cfdcd7', patas: 270}) + `<g transform="translate(860,1150)"><rect x="-150" y="-200" width="300" height="190" rx="12" fill="#2b2e35"/><rect x="-138" y="-188" width="276" height="166" rx="6" fill="#e9f3ef"/><g class="lpant"></g></g>` + telMesa(612) + `<g transform="translate(1080,1150)"><rect x="-26" y="-70" width="52" height="70" rx="8" fill="#dfe8ea" opacity=".9"/><rect x="-18" y="-84" width="36" height="16" rx="4" fill="#8EB69B"/></g>`}),
  // Vereda de Villa Urquiza entre dos casas: banco, árbol, casas bajas (el personaje sentado en el banco)
  vereda: (C, X) => ({fondo: '#cfe6f3', back: D.cielo({w: 1600, h: 1920, top: X.cielo || '#8cc4ea', mid: '#cfe6f3', bot: '#f2efe4'}) + D.barrio({w: 1600, piso: 1420, hora: X.hora || 'tarde', kiosco: false}) + D.arbol({x: 180, y: 1430, s: 1.5}) + D.arbol({x: 1380, y: 1430, s: 1.3, c: '#4f8f5e'}) + (X.slot2 || D.calendario({x: 400, y: 640, s: 1.0, dia: C.cal || 'HOY', mes: 'NOVIEMBRE', acento: BOSQUE})),
    front: `<rect x="380" y="1290" width="420" height="30" rx="8" fill="#6b4a2f"/><rect x="380" y="1200" width="420" height="22" rx="8" fill="#7a5436"/><rect x="400" y="1320" width="18" height="110" fill="#2a2c33"/><rect x="762" y="1320" width="18" height="110" fill="#2a2c33"/>` + '<g class="act"></g>'
      + `<g transform="translate(860,1150) scale(1.1)"><path d="M-160,-215 L160,-215 L190,280 L150,280 L130,0 L-130,0 L-150,280 L-190,280 Z" fill="#3a2a1e"/><rect x="-150" y="-205" width="300" height="200" rx="10" fill="#1f2a2a"/><rect x="-138" y="-188" width="276" height="166" rx="6" fill="#2f3b38"/><g class="lpant"></g></g>` + telMesa(612).replace('y="1132"', 'y="1272"') + (X.mesaExtra || '')}),
};

export async function armarCob(V, X) {
  const C = V.cfg || {}; const PJ = PJS[C.pj || 'caro']; const QUIEN = C.q || 'caro';
  const O = obra(V, {nombre: 'Compara Tu Obra Social', logo: 'coberturas.png', ctaSub: 'y te respondemos', hookHTML: C.hook || '¿Otra vez<br><em>aumentó?</em>', hookHasta: 1.4, notas: []});
  document.documentElement.style.cssText += `--f1:Manrope;--f2:Manrope;--acc:#7fe0a8;--hs:140px;--hw:800;--em:normal;--kwCol:${VERDE};--logoH:130px;--velo:rgba(0,61,59,.92);--ctaTop:600px;--hookTop:1150px;--kws:116px;${C.hook ? ganchoCss(C.hook) : ''};--hookTop:1120px`;
  document.head.insertAdjacentHTML('beforeend', '<style>#hook{-webkit-text-stroke:14px rgba(0,45,40,.88);paint-order:stroke fill}</style>');
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pC = poser(V, QUIEN);
  const pant = X.pantalla || (k => `<rect x="-138" y="-188" width="276" height="166" fill="#e6efe9"/>${[...Array(8)].map((_, i) => `<path d="M${-138 + i * 40},-188 l20,166" stroke="#fff" stroke-width="6"/>`).join('')}<path d="M-138,-120 L138,-90 M-138,-60 L138,-40" stroke="#fff" stroke-width="8"/>
    ${[[-70, -120], [10, -80], [70, -140]].map(([a, b]) => `<path d="M${a},${b} c-10,-16 -10,-30 0,-30 c10,0 10,14 0,30 z" fill="${BOSQUE}"/><circle cx="${a}" cy="${b - 20}" r="5" fill="#fff"/>`).join('')}<circle cx="0" cy="-100" r="10" fill="#e8574a" stroke="#fff" stroke-width="3"/>`);
  // 1 · el lugar del personaje
  const S = ESCENAS[X.escena || 'depto'](C, X);
  const e1 = O.esc({nombre: 'lugar', fondo: S.fondo, capas: [{f: .6, prof: .6, w: 1500, svg: S.back}, {f: 1, prof: 1, w: 1500, svg: S.front}]});
  const pj = personaje(e1.capas[1].svg.querySelector('.act'), PJ); const lpant = e1.capas[1].svg.querySelector('.lpant'); const tel = e1.capas[1].svg.querySelector('.tel');
  const imanes = [...e1.capas[0].svg.querySelectorAll('.im')];
  // 2 · celular con la notificación
  const cm = PP.celularMano({piel: PJ.piel, manga: PJ.campera || PJ.remera, funda: X.funda || '#16181d'});
  const e2 = O.esc({nombre: 'celu', fondo: X.celuFondo || MENTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${X.celuFondo || MENTA}"/>`}, {f: 1, prof: 1, svg: cm.svg}]});
  e2.capas[1].svg.querySelector('.pantalla').innerHTML = PP.notificacion(Object.assign({hora: 'Hoy', app: 'Tu cobertura', titulo: '', texto: '', color: BOSQUE, fondo: ['#2a5a50', '#9cc7b0']}, X.notif || {})).replace('jueves 20 de noviembre', X.diaSemana || 'hoy');
  // 3 · primer plano del papel con la lupa menta (objeto de la marca)
  const K3 = X.carta || {}; const ca = PP.carta({fondo: K3.fondo || MENTA, acento: BOSQUE, remite: K3.remite || 'Tu cobertura', titulo: K3.titulo || 'Tu plan'});
  ca.svg = ca.svg.split('A partir de este mes, tu cuota se actualiza según').join(K3.l1 || 'Leé las condiciones de tu plan con calma:').split('lo informado en tu plan vigente. Ver condiciones.').join(K3.l2 || 'qué incluye, qué no y desde cuándo.');
  const e3 = O.esc({nombre: 'papel', fondo: K3.fondo || MENTA, capas: [{f: 1, prof: 1, svg: ca.svg}]});
  const lupa = e3.capas[0].svg.querySelector('.lupa'), zoom = e3.capas[0].svg.querySelector('.zoom');
  luz(e1, X.luz || 'background:linear-gradient(110deg,transparent 45%,rgba(255,246,214,.45)),linear-gradient(180deg,transparent 60%,rgba(0,40,30,.18))');
  luz(e3, 'background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.35),transparent 50%)');
  const lupaEn = (x, y, z = 1.9) => { lupa.setAttribute('transform', `translate(${x},${y})`); zoom.setAttribute('transform', `translate(${-x * z},${-y * z}) scale(${z})`); };
  const vibra = t => (t > .1 && t < 1.6) ? Math.sin(t * 90) * 4 : 0;
  // imanes de la heladera: caen en cámara lenta cuando vibra el celular (giro irreal de la cocina)
  const caenImanes = t => imanes.forEach((m, i) => { const k = X.imanesCaen ? easeOut(win(t, .25 + hash(i) * .5, 1.6 + hash(i + 2) * .8)) : 0; m.setAttribute('transform', `translate(${k * (hash(i + 5) - .5) * 160},${k * (300 + hash(i + 1) * 520)}) rotate(${k * (hash(i + 9) - .5) * 260},${-90 + (i % 3) * 82},${-996 + Math.floor(i / 3) * 110})`); });
  const enMano = X.enMano || `<g transform="rotate(-60)"><rect x="-10" y="-48" width="96" height="62" rx="10" fill="${BOSQUE}"/><rect x="4" y="-38" width="40" height="8" rx="4" fill="#fff" opacity=".8"/><rect x="4" y="-22" width="64" height="6" rx="3" fill="#fff" opacity=".5"/><rect x="58" y="-2" width="20" height="12" rx="3" fill="#e5c76b"/></g>`;
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(700, 740, k), Y: lerp(1080, 1060, k), z: lerp(1.75, 1.85, ease(k)), foco: 1, ap: 5}), act: t => {
      tel.setAttribute('transform', `translate(${vibra(t)},0)`); lpant.innerHTML = X.pantalla0 || ''; caenImanes(t);
      pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: lerp(40, 75, easeOut(win(t, .3, .8))), cR: lerp(60, 96, easeOut(win(t, .3, .8))), hL: 30, cL: 55, mira: .4, ceja: .9, sonrisa: -.5, cab: 6});
      pj.E.propMano.innerHTML = t > .55 ? celuMano : ''; }},
    {t0: V.frases[1].t - .05, esc: e2, cam: k => ({x: 540, y: lerp(990, 950, k), z: lerp(1.0, 1.07, ease(k)), r: lerp(1.5, 0, k), foco: 1, ap: 4})},
    {t0: V.frases[1].t + 2.1, esc: e3, cam: k => ({x: 540, y: lerp(900, 980, k), z: lerp(1.05, 1.12, ease(k)), foco: 1}), act: t => lupaEn(lerp(380, 640, ease(win(t, V.frases[1].t + 2.1, F('lupa').t + .3))), lerp(1300, 990, ease(win(t, V.frases[1].t + 2.1, F('lupa').t)))) },
    {t0: F('lupa').t + .5, esc: e3, cam: k => ({x: lerp(560, 600, k), y: 990, z: lerp(1.6, 1.7, ease(k)), foco: 1}), act: t => lupaEn(520 + wob(t) * 30, 995 + wob(t, 2) * 8)},
    {t0: FI(1).t - .1, esc: e1, cam: k => ({X: lerp(600, 640, k), Y: 980, z: 2.2, foco: 1, ap: 6}), act: t => { lpant.innerHTML = ''; caenImanes(9);
      pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 70, cR: 70, hL: 30, cL: 55, mira: .7, ceja: .2, sonrisa: .1, cab: 8}); pj.E.propMano.innerHTML = enMano; }},
    {t0: FI(2).t - .1, esc: e1, cam: k => ({X: 400, Y: lerp(660, 640, k), z: lerp(2.6, 2.75, ease(k)), foco: .6, ap: 5}), act: t => { pj.E.propMano.innerHTML = ''; pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 30, cR: 50}); }},
    {t0: FI(3).t - .1, esc: e1, cam: k => ({X: lerp(840, 860, k), Y: lerp(1040, 1030, k), z: lerp(2.5, 2.65, ease(k)), foco: 1, ap: 6}), act: t => { lpant.innerHTML = pant(1);
      pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 60, cR: 70, hL: 40, cL: 60, mira: .8, sonrisa: .2}); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(640, 660, k), Y: 1020, z: lerp(2.0, 2.1, ease(k)), foco: 1, ap: 5}), act: t => { lpant.innerHTML = pant(2); const k = easeOut(win(t, F('alivio').t, F('alivio').t + .8));
      pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: lerp(60, 160, k), cR: lerp(70, 20, k), hL: lerp(40, 150, k), cL: lerp(60, 20, k), sonrisa: 1, ceja: .4, cab: -6 * k}); }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 660, Y: 1020, z: lerp(2.1, 2.2, k), foco: 1, ap: 10}), act: t => pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 160, cR: 20, hL: 150, cL: 20, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 700, Y: 1080, z: 1.75, foco: 1, ap: 5}), act: t => { lpant.innerHTML = ''; pC(pj, t, {x: 560, y: 1430, s: 1.0, sentado: 1, hR: 40, cR: 60, hL: 30, cL: 55, mira: .4}); pj.E.propMano.innerHTML = ''; }},
  ];
  O.tomas[0].boca = sobre(e1, 1, pj); O.tomas[7].boca = sobre(e1, 1, pj);
  // planos irreales: el personaje diminuto sobre el papel gigante (cae el objeto de la idea) y caída entre hojas antes de los 3 puntos
  const G = gigante(O, Object.assign({pj: PJ, doc: X.doc || 'Letra chica', papel: ['#8fb7a2', '#DAF1DE', '#f4fbf5'], renglon: '#a9c9b6', tinta: BOSQUE, cielo: ['#1f6b5c', '#0b3b33', '#04201c'], acento: SALVIA, objeto: X.objeto || 'lupa'}, X.gigante || {}));
  const K = caida(O, Object.assign({pj: PJ, fondo: ['#1f6b5c', '#03201c'], hoja: '#f4fbf5', renglon: '#a9c9b6', raya: MENTA, acento: '#7fe0a8'}, X.caida || {}));
  const f2 = V.frases[2], f3 = V.frases[3], f4 = V.frases[4];
  O.tomas.splice(O.tomas.findIndex(x => x.t0 > f2.t - .1), 0, G.toma(f2.t - .1, f3.t + .02));
  O.tomas.splice(O.tomas.findIndex(x => x.t0 > f4.t - .1), 0, K.toma(f4.t - .1));
  O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f3.t + .02]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f3.t + .02 ? .45 * Math.exp(-(t - f3.t - .02) * 10) : 0);
  if (C.ap || C.grade || C.cam) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : C.ap === 'celu' ? O.tomas.find(x => x.esc === e2) : C.ap === 'papel' ? O.tomas.find(x => x.esc === e3) : null);
  X.despues && X.despues(O, {e1, e2, e3, pj, G, K});
  return O;
}
