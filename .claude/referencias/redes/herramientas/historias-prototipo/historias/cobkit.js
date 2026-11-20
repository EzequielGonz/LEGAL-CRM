// Kit de Coberturas para el cronograma x2: cada reel (historias/cob-*.js) elige lugar de Buenos Aires, documento en primer plano
// con la lupa menta, objeto gigante del plano irreal, orden de apertura, grado y cámara. Estructura del guion (para sonido.py):
// 0 personaje (conflicto) · 1 narración del documento · 2 preparación · 3 golpe (giro irreal) · 4 entrada a los 3 puntos (caída) ·
// items 1-3 · 'alivio' (personaje) · cta.
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, win, wob, clamp, hash} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, laptop, PJS, ganchoCss, variar} from './comun.js';
import {gigante, caida, OBJETOS} from '../historia/irreal.js';
export const VERDE = '#003D3B', MENTA = '#DAF1DE', SALVIA = '#8EB69B', BOSQUE = '#235347';
const L = PP.lineas;

// ---------- objetos gigantes propios de Coberturas (se suman a los del motor) ----------
Object.assign(OBJETOS, {
  carnet: a => `<g transform="translate(0,-640) scale(2.4) rotate(-8)"><rect x="-210" y="-135" width="420" height="270" rx="26" fill="${a}"/><rect x="-210" y="-135" width="420" height="70" rx="26" fill="#0b3b33"/><circle cx="-130" cy="20" r="46" fill="#f4fbf5" opacity=".9"/><rect x="-60" y="0" width="220" height="18" rx="9" fill="#f4fbf5"/><rect x="-60" y="40" width="160" height="14" rx="7" fill="#f4fbf5" opacity=".7"/><rect x="120" y="-110" width="60" height="40" rx="8" fill="#e5c76b"/></g>`,
  valija: a => `<g transform="translate(0,-620) scale(2.3)"><rect x="-60" y="-300" width="120" height="70" rx="22" fill="none" stroke="#0b3b33" stroke-width="22"/><rect x="-200" y="-240" width="400" height="430" rx="40" fill="${a}"/><rect x="-200" y="-240" width="400" height="430" rx="40" fill="none" stroke="#0b3b33" stroke-width="10"/>${[-110, 0, 110].map(x => `<rect x="${x - 8}" y="-240" width="16" height="430" fill="#0b3b33" opacity=".35"/>`).join('')}<circle cx="-150" cy="200" r="26" fill="#111"/><circle cx="150" cy="200" r="26" fill="#111"/></g>`,
  ticket: a => `<g transform="translate(0,-700) scale(2.3) rotate(6)"><path d="M-150,-330 L150,-330 L150,300 ${[...Array(10)].map(() => 'l-15,14 l-15,-14').join(' ')} Z" fill="#f7f6f1"/>${[...Array(9)].map((_, i) => `<rect x="-110" y="${-280 + i * 52}" width="${120 + (i * 37) % 100}" height="16" rx="8" fill="#9aa79f"/>`).join('')}<rect x="-120" y="180" width="240" height="60" rx="10" fill="${a}"/></g>`,
  recibo: a => `<g transform="translate(0,-700) scale(2.2) rotate(-5)"><rect x="-230" y="-320" width="460" height="620" rx="10" fill="#fbfbf7"/><rect x="-230" y="-320" width="460" height="60" fill="${a}"/>${[...Array(8)].map((_, i) => `<rect x="-190" y="${-220 + i * 56}" width="200" height="16" rx="8" fill="#9aa79f"/><rect x="90" y="${-220 + i * 56}" width="100" height="16" rx="8" fill="#9aa79f"/>`).join('')}<rect x="-200" y="-4" width="400" height="44" rx="10" fill="none" stroke="#0b3b33" stroke-width="8"/></g>`,
  cartilla: a => `<g transform="translate(0,-660) scale(2.3) rotate(-6)"><rect x="-200" y="-290" width="400" height="560" rx="18" fill="${a}"/><rect x="-170" y="-250" width="340" height="120" rx="12" fill="#f4fbf5"/>${[...Array(6)].map((_, i) => `<circle cx="-140" cy="${-70 + i * 56}" r="12" fill="#f4fbf5"/><rect x="-110" y="${-80 + i * 56}" width="${180 + (i * 41) % 90}" height="18" rx="9" fill="#f4fbf5" opacity=".8"/>`).join('')}</g>`,
  reloj: a => `<g transform="translate(0,-660) scale(2.4)"><circle r="230" fill="#f4fbf5" stroke="${a}" stroke-width="34"/>${[...Array(12)].map((_, i) => `<rect x="-6" y="-210" width="12" height="34" rx="6" fill="#0b3b33" transform="rotate(${i * 30})"/>`).join('')}<rect x="-9" y="-150" width="18" height="160" rx="9" fill="#0b3b33" transform="rotate(40)"/><rect x="-7" y="-190" width="14" height="200" rx="7" fill="#0b3b33" transform="rotate(170)"/><circle r="20" fill="${a}"/></g>`,
  casa: a => `<g transform="translate(0,-640) scale(2.3)"><path d="M-240,-60 L0,-300 L240,-60 Z" fill="#0b3b33"/><rect x="-200" y="-70" width="400" height="300" fill="${a}"/><rect x="-50" y="80" width="100" height="150" fill="#0b3b33"/><rect x="-160" y="-20" width="80" height="80" fill="#f4fbf5"/><rect x="80" y="-20" width="80" height="80" fill="#f4fbf5"/></g>`,
  martillo: a => `<g transform="translate(0,-640) scale(2.4) rotate(-20)"><rect x="-30" y="-120" width="60" height="420" rx="20" fill="#7a4a2a"/><rect x="-170" y="-240" width="340" height="140" rx="26" fill="${a}"/><rect x="-170" y="-240" width="340" height="40" rx="20" fill="#0b3b33" opacity=".4"/></g>`,
});

// ---------- documentos en primer plano, con la lupa menta (contenido duplicado dentro de la lupa) ----------
const T = (x, y, s, w8, c, txt, a = 'start') => `<text x="${x}" y="${y}" font-family="Manrope" font-weight="${w8}" font-size="${s}" fill="${c}" text-anchor="${a}">${txt}</text>`;
export function docContenido(d) {
  const ac = d.acento || BOSQUE; const tipo = d.tipo || 'carta';
  if (tipo === 'ticket') return `<path d="M300,180 L780,180 L780,1460 ${[...Array(16)].map(() => 'l-15,16 l-15,-16').join(' ')} Z" fill="#f7f6f1"/>
    ${T(540, 290, 40, 800, '#1b1d22', d.remite || 'CONSULTORIO', 'middle')}<path d="M340,330 L740,330" stroke="#1b1d22" stroke-width="3" stroke-dasharray="10 8"/>
    ${T(350, 420, 34, 700, '#1b1d22', d.titulo || 'Consulta médica')}${L(350, 470, 380, 6, 14, '#8d918f', 3)}
    ${T(350, 780, 30, 600, '#1b1d22', 'Pagado')}<rect x="600" y="752" width="130" height="34" rx="6" fill="#1b1d22" opacity=".8"/>
    ${T(350, 900, 23, 600, '#3a4a44', (d.chico || [])[0] || '')}${T(350, 934, 23, 600, '#3a4a44', (d.chico || [])[1] || '')}
    ${L(350, 990, 380, 5, 12, '#a7aca9', 9)}<rect x="350" y="1200" width="380" height="110" fill="#1b1d22" opacity=".85"/>${[...Array(30)].map((_, i) => `<rect x="${352 + i * 12.6}" y="1200" width="${3 + (i * 7) % 5}" height="110" fill="#f7f6f1"/>`).join('')}`;
  if (tipo === 'recibo') { const filas = d.filas || ['Sueldo básico', 'Jubilación', 'Obra social', 'Ley 19.032', 'Sindicato'];
    return `<rect x="110" y="300" width="860" height="1060" fill="#fbfbf7"/><rect x="110" y="300" width="860" height="90" fill="${ac}"/>${T(150, 360, 38, 800, '#fff', d.titulo || 'Recibo de sueldo')}
    ${T(150, 450, 24, 700, '#587268', 'Concepto')}${T(930, 450, 24, 700, '#587268', 'Descuento', 'end')}<path d="M150,470 L930,470" stroke="#b3beb8" stroke-width="3"/>
    ${filas.map((f, i) => { const y = 540 + i * 86, des = d.destaca === i; return `${des ? `<rect x="136" y="${y - 50}" width="808" height="72" rx="12" fill="#bfffe0" stroke="${ac}" stroke-width="4"/>` : ''}${T(160, y, 32, des ? 800 : 600, '#0B2B26', f)}<rect x="${des ? 740 : 780}" y="${y - 28}" width="${des ? 160 : 120}" height="30" rx="6" fill="#0B2B26" opacity="${des ? .9 : .35}"/>${des && d.marca ? T(820, y, 34, 800, '#fff', d.marca, 'middle') : ''}`; }).join('')}
    ${L(160, 540 + filas.length * 86 + 20, 700, 4, 12, '#b3beb8', 4)}${T(160, 1250, 22, 600, '#4a5b54', (d.chico || [])[0] || '')}${T(160, 1282, 22, 600, '#4a5b54', (d.chico || [])[1] || '')}`; }
  if (tipo === 'carnets') { const cs = d.colores || ['#7aa38a', '#e5c76b', '#6c7fa0', '#c96a5a'];
    return `<rect x="-200" y="-200" width="1480" height="2320" fill="${d.mesa || '#b98c63'}"/>${[...Array(16)].map((_, i) => `<rect x="-200" y="${i * 130}" width="1480" height="3" fill="#000" opacity=".06"/>`).join('')}
    ${cs.map((c, i) => `<g class="cn${i}" transform="translate(${[330, 750, 320, 760][i]},${[640, 700, 1180, 1230][i]}) rotate(${[-9, 7, 5, -6][i]})"><rect x="-190" y="-120" width="380" height="240" rx="24" fill="#000" opacity=".25" transform="translate(10,16)"/><rect x="-190" y="-120" width="380" height="240" rx="24" fill="${c}"/><rect x="-190" y="-120" width="380" height="62" rx="24" fill="#000" opacity=".18"/><circle cx="-110" cy="20" r="40" fill="#fff" opacity=".85"/><rect x="-50" y="0" width="200" height="16" rx="8" fill="#fff"/><rect x="-50" y="34" width="140" height="12" rx="6" fill="#fff" opacity=".7"/>${T(-160, -80, 26, 800, '#fff', ['Plan A', 'Plan B', 'Plan C', 'Plan D'][i])}</g>`).join('')}
    ${T(540, 1560, 30, 700, '#3a2a1a', (d.chico || [])[0] || '', 'middle')}`; }
  if (tipo === 'cartilla') return `<rect x="140" y="220" width="800" height="1240" rx="20" fill="${MENTA}"/><rect x="140" y="220" width="800" height="200" rx="20" fill="${ac}"/>${T(200, 310, 30, 700, '#cfeedd', d.remite || 'Tu cobertura')}${T(200, 380, 56, 800, '#fff', d.titulo || 'Cartilla')}
    <rect x="190" y="460" width="700" height="300" rx="16" fill="#e6efe9"/>${[...Array(7)].map((_, i) => `<path d="M${190 + i * 100},460 l40,300" stroke="#fff" stroke-width="8"/>`).join('')}<path d="M190,560 L890,620 M190,680 L890,700" stroke="#fff" stroke-width="10"/>
    ${[[330, 600], [520, 680], [760, 560]].map(([a, b]) => `<path d="M${a},${b} c-14,-22 -14,-40 0,-40 c14,0 14,18 0,40 z" fill="${ac}"/>`).join('')}<circle cx="600" cy="610" r="14" fill="#e8574a" stroke="#fff" stroke-width="4"/>
    ${[...Array(6)].map((_, i) => `<circle cx="215" cy="${830 + i * 70}" r="12" fill="${ac}"/>${L(245, 818 + i * 70, 560, 1, 16, '#587268', i + 2)}`).join('')}
    ${T(200, 1300, 22, 600, '#4a5b54', (d.chico || [])[0] || '')}${T(200, 1332, 22, 600, '#4a5b54', (d.chico || [])[1] || '')}`;
  if (tipo === 'formulario') return `<rect x="140" y="240" width="800" height="1180" fill="#fbfbf7"/><rect x="140" y="240" width="800" height="16" fill="${ac}"/>
    ${T(200, 340, 30, 700, '#587268', d.remite || 'Formulario')}${T(200, 420, 52, 800, '#0B2B26', d.titulo || 'Solicitud')}
    ${[...Array(6)].map((_, i) => `${T(200, 520 + i * 92, 24, 700, '#587268', (d.campos || [])[i] || 'Dato')}<rect x="200" y="${534 + i * 92}" width="680" height="36" rx="8" fill="none" stroke="#b3beb8" stroke-width="3"/>`).join('')}
    ${[0, 1, 2].map(i => `<rect x="200" y="${1110 + i * 50}" width="32" height="32" rx="6" fill="none" stroke="${ac}" stroke-width="4"/>${L(250, 1112 + i * 50, 560, 1, 18, '#9aa79f', i + 5)}`).join('')}
    ${T(200, 1300, 22, 600, '#4a5b54', (d.chico || [])[0] || '')}${T(200, 1332, 22, 600, '#4a5b54', (d.chico || [])[1] || '')}`;
  // carta (por defecto)
  return `<rect x="140" y="240" width="800" height="1180" fill="#fbfbf7"/><rect x="140" y="240" width="800" height="16" fill="${ac}"/>
    ${T(210, 350, 30, 700, '#587268', d.remite || 'Tu prepaga')}${T(210, 430, d.titulo && d.titulo.length > 24 ? 44 : 54, 800, '#0B2B26', d.titulo || 'Aviso')}
    ${L(210, 500, 660, 10, 16, '#9aa79f', 5)}${T(210, 980, 21, 500, '#4a5b54', (d.chico || [])[0] || '')}${T(210, 1012, 21, 500, '#4a5b54', (d.chico || [])[1] || '')}${L(210, 1050, 660, 6, 12, '#b3beb8', 8)}`;
}
export function documento(d) {
  const c = docContenido(d); const fondo = d.fondo || MENTA; const id = 'dk' + Math.floor(hash(c.length) * 1e6);
  return `<defs><clipPath id="${id}c"><circle cx="0" cy="0" r="150"/></clipPath><filter id="${id}s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20"/></filter></defs>
    <rect x="-200" y="-200" width="1480" height="2320" fill="${fondo}"/>${d.tipo === 'carnets' ? '' : `<rect x="150" y="270" width="800" height="1180" fill="#000" opacity=".22" filter="url(#${id}s)" transform="translate(16,26)"/>`}
    <g class="carta">${c}</g>
    <g class="lupa"><circle r="160" fill="#000" opacity=".22" filter="url(#${id}s)" transform="translate(30,40)"/><g clip-path="url(#${id}c)"><rect x="-200" y="-200" width="400" height="400" fill="#fbfbf7"/><g class="zoom">${c}</g><circle r="150" fill="#bfffe0" opacity=".08"/></g>
      <circle r="150" fill="none" stroke="${SALVIA}" stroke-width="26"/><circle r="150" fill="none" stroke="#fff" stroke-width="4" opacity=".5"/><path d="M-90,-90 A130,130 0 0,1 40,-128" stroke="#fff" stroke-width="10" opacity=".55" fill="none" stroke-linecap="round"/>
      <rect x="-26" y="160" width="52" height="250" rx="22" fill="${BOSQUE}" transform="rotate(-35)"/></g>`;
}

// ---------- lugares de Buenos Aires (capa de fondo 1500 de ancho y capa de acción) ----------
const heladera = (x, y, extra = '') => `<g transform="translate(${x},${y})"><rect x="-130" y="-760" width="260" height="760" rx="22" fill="#eef1f2"/><rect x="-130" y="-760" width="260" height="760" rx="22" fill="none" stroke="#c9cfd2" stroke-width="6"/><path d="M-130,-470 L130,-470" stroke="#c9cfd2" stroke-width="6"/><rect x="96" y="-700" width="12" height="160" rx="6" fill="#b5bcc0"/><rect x="96" y="-420" width="12" height="200" rx="6" fill="#b5bcc0"/>
  <rect x="-90" y="-690" width="70" height="56" rx="6" fill="#e5c76b" transform="rotate(-6 -55 -662)"/><circle cx="20" cy="-650" r="16" fill="#e8574a"/><rect x="-40" y="-600" width="90" height="110" rx="4" fill="#fff" transform="rotate(5 5 -545)"/>${extra}</g>`;
const alacena = (x, y, w = 520) => `<rect x="${x}" y="${y}" width="${w}" height="220" rx="10" fill="#f3efe6"/>${[...Array(Math.floor(w / 130))].map((_, i) => `<rect x="${x + 12 + i * 130}" y="${y + 12}" width="118" height="196" rx="8" fill="#ece6da" stroke="#d6cfc2" stroke-width="4"/><rect x="${x + 110 + i * 130}" y="${y + 160}" width="8" height="30" rx="4" fill="#b5a88f"/>`).join('')}`;
const azulejos = (x, y, w, h) => { let s = ''; for (let i = 0; i < w / 60; i++) for (let j = 0; j < h / 60; j++) s += `<rect x="${x + i * 60}" y="${y + j * 60}" width="56" height="56" fill="${(i + j) % 2 ? '#e3efe8' : '#f4f8f5'}"/>`; return s; };
const cama = (x, y) => `<g transform="translate(${x},${y})"><rect x="-380" y="-260" width="40" height="260" rx="10" fill="#7a5a40"/><rect x="-360" y="-150" width="740" height="110" rx="20" fill="#f1ede4"/><rect x="-360" y="-160" width="740" height="40" rx="18" fill="#a9c9b6"/><rect x="-330" y="-210" width="180" height="70" rx="30" fill="#fff"/><rect x="-360" y="-40" width="740" height="40" fill="#7a5a40"/></g>`;
const valija = (x, y, s = 1, abierta = 0) => `<g transform="translate(${x},${y}) scale(${s})"><rect x="-40" y="-300" width="80" height="50" rx="16" fill="none" stroke="#1d3b34" stroke-width="16"/><rect x="-150" y="-260" width="300" height="260" rx="30" fill="#2f7a63"/>${[-70, 0, 70].map(a => `<rect x="${a - 6}" y="-260" width="12" height="260" fill="#1d3b34" opacity=".35"/>`).join('')}<circle cx="-110" cy="4" r="16" fill="#111"/><circle cx="110" cy="4" r="16" fill="#111"/></g>`;
const sillasEspera = (x, y, n = 4, c = '#5c8f7a') => [...Array(n)].map((_, i) => `<g transform="translate(${x + i * 150},${y})"><rect x="-60" y="-120" width="120" height="16" rx="6" fill="${c}"/><rect x="-60" y="-260" width="120" height="140" rx="16" fill="${c}"/><rect x="-6" y="-104" width="12" height="104" fill="#4a4f58"/></g>`).join('');
const cuadroPared = (x, y, c = '#7aa38a') => `<rect x="${x - 110}" y="${y - 80}" width="220" height="160" rx="6" fill="#fff" stroke="#c9b79a" stroke-width="10"/><path d="M${x - 90},${y + 60} L${x - 30},${y - 10} L${x + 20},${y + 40} L${x + 50},${y + 10} L${x + 90},${y + 60} Z" fill="${c}"/><circle cx="${x + 50}" cy="${y - 40}" r="18" fill="#e5c76b"/>`;
export function lugar(P) {
  const t = P.tipo || 'escritorio'; const cal = ''; const calA = D.calendario({x: P.calX || 560, y: 380, s: 1.0, dia: P.cal || 'HOY', mes: 'NOVIEMBRE', acento: BOSQUE});
  const fondos = {
    cocina: () => D.interior({w: 1500, pared: P.pared || '#e9efe9', piso: P.piso || '#c9b79a', ventana: [920, 320, 380, 520], vista: P.vista || 'dia', zocalo: '#f3f6f1', luz: '#fff2cf'}) + azulejos(80, 820, 760, 300) + alacena(80, 360, 650) + heladera(1330, 1400) + cal,
    living: () => D.interior({w: 1500, pared: P.pared || '#efe6da', piso: P.piso || '#9a7452', ventana: [860, 300, 520, 680], vista: P.vista || 'dia', zocalo: '#f6efe4', luz: '#ffe3b0', cuadro: cuadroPared(380, 420)}) + D.lampara({x: 1340, y: 1410, on: (P.vista === 'noche')}) + D.planta({x: 160, y: 1410, s: 1.5}) + cal,
    escritorio: () => D.interior({w: 1500, pared: P.pared || '#e3ece2', piso: P.piso || '#b98c63', ventana: [880, 330, 460, 640], vista: P.vista || 'dia', zocalo: '#f3f6f1', luz: '#fff2cf'}) + D.planta({x: 1300, y: 1410, s: 1.6}) + cal,
    dormitorio: () => D.interior({w: 1500, pared: P.pared || '#e6e1ef', piso: P.piso || '#a98764', ventana: [900, 300, 420, 560], vista: P.vista || 'dia', zocalo: '#f3f0f6', luz: '#ffe9c8', cuadro: cuadroPared(420, 460, '#8EB69B')}) + cama(1120, 1410) + valija(250, 1420, 1.2) + cal,
    guardia: () => D.interior({w: 1500, pared: P.pared || '#eef3f2', piso: P.piso || '#c8d2d0', ventana: null, zocalo: '#dfe7e5', luz: '#ffffff'}) + `<rect x="300" y="300" width="900" height="130" rx="16" fill="${BOSQUE}"/>${T(750, 390, 70, 800, '#fff', P.cartel || 'GUARDIA', 'middle')}<rect x="980" y="560" width="300" height="200" rx="10" fill="#dfe7e5"/><rect x="1000" y="580" width="260" height="70" rx="8" fill="#9cc7b0"/>` + sillasEspera(150, 1410, 3) + sillasEspera(1050, 1410, 3, '#6c7fa0'),
    oficina: () => D.interior({w: 1500, pared: P.pared || '#e8ebef', piso: P.piso || '#8e98a3', ventana: [860, 300, 520, 640], vista: P.vista || 'dia', zocalo: '#f1f3f5', luz: '#fff6e0'}) + `<rect x="100" y="420" width="420" height="560" rx="8" fill="#d9dee4"/>${[0, 1, 2, 3].map(i => `<rect x="120" y="${440 + i * 136}" width="380" height="120" rx="6" fill="#cfd5dc"/><rect x="280" y="${490 + i * 136}" width="60" height="12" rx="6" fill="#8a96a3"/>`).join('')}` + cal,
    vereda: () => D.cielo({w: 1600, h: 1920, top: '#7fb6e0', mid: '#cfe6f3', bot: '#f2efe4'}) + D.barrio({w: 1600, piso: 1460, hora: P.hora || 'tarde', kiosco: true}) + D.arbol({x: 1250, y: 1470, s: 1.3, c: '#4f8a5a'}) + D.arbol({x: 120, y: 1470, s: 1.1}),
  };
  const sentado = t !== 'vereda' && t !== 'guardia' ? 1 : (t === 'guardia' ? 1 : 0);
  const mesa = t === 'vereda' ? '' : t === 'guardia' ? '' : D.mesa({x: 800, y: 1150, w: 640, c: P.mesa || (t === 'cocina' ? '#e8e2d6' : '#d8c3a5'), patas: 270}) + (P.sinLaptop ? '' : laptop({x: 860, y: 1150, s: 1.1})) + `<g class="tel"><rect x="610" y="1132" width="80" height="18" rx="6" fill="#111"/></g>` + (P.taza ? `<g transform="translate(1080,1150)"><rect x="-26" y="-60" width="52" height="60" rx="8" fill="#fff"/><path d="M26,-46 c22,0 22,30 0,30" stroke="#fff" stroke-width="8" fill="none"/></g>` : '');
  const silla = t === 'guardia' ? sillasEspera(560, 1430, 1, '#5c8f7a') : '';
  return {fondo: fondos[t](), accion: (t === 'vereda' ? '' : calA) + silla + '<g class="act"></g>' + mesa + (P.objMesa || ''), sentado, t};
}

// ---------- armado del reel ----------
export async function armarCob(V, P) {
  const C = Object.assign({}, P, V.cfg || {}); const PJ = PJS[C.pj || 'caro']; const QUIEN = C.q || C.pj || 'caro';
  const O = obra(V, {nombre: 'Compara Tu Obra Social', logo: 'coberturas.png', ctaSub: 'y te respondemos', hookHTML: C.hook, hookHasta: C.hookHasta || 1.5, notas: []});
  document.documentElement.style.cssText += `--f1:Manrope;--f2:Manrope;--acc:#7fe0a8;--hs:140px;--hw:800;--em:normal;--kwCol:${VERDE};--logoH:130px;--velo:rgba(0,61,59,.92);--ctaTop:600px;--hookTop:1150px;--kws:116px;${ganchoCss(C.hook)}`;
  { const h = document.getElementById('hook'); h.style.background = 'rgba(0,45,42,.78)'; h.style.borderRadius = '36px'; h.style.padding = '26px 30px 34px'; h.style.boxSizing = 'border-box'; }
  const fr = V.frases; const F = n => fr.find(f => f.marca === n); const FI = i => fr.find(f => f.item === i); const cta = fr.find(f => f.cta); const pC = poser(V, QUIEN);
  const LG = lugar(C.lugar || {}); const vereda = LG.t === 'vereda'; const PX = vereda ? 640 : 560, PY = vereda ? 1470 : 1430, SE = LG.sentado;
  const e1 = O.esc({nombre: 'lugar', fondo: '#e7efe6', capas: [{f: .6, prof: .6, w: vereda ? 1600 : 1500, svg: LG.fondo}, {f: 1, prof: 1, w: 1500, svg: LG.accion}]});
  const pj = personaje(e1.capas[1].svg.querySelector('.act'), PJ); const lpant = e1.capas[1].svg.querySelector('.lpant') || {set innerHTML(v) {}}; const tel = e1.capas[1].svg.querySelector('.tel');
  luz(e1, C.luz || 'background:linear-gradient(110deg,transparent 45%,rgba(255,246,214,.45)),linear-gradient(180deg,transparent 60%,rgba(0,40,30,.18))');
  // documento con la lupa
  const e3 = O.esc({nombre: 'doc', fondo: MENTA, capas: [{f: 1, prof: 1, svg: documento(C.doc || {})}]});
  const lupa = e3.capas[0].svg.querySelector('.lupa'), zoom = e3.capas[0].svg.querySelector('.zoom');
  luz(e3, 'background:radial-gradient(circle at 20% 15%,rgba(255,255,255,.35),transparent 50%)');
  const lupaEn = (x, y, z = 1.9) => { lupa.setAttribute('transform', `translate(${x},${y})`); zoom.setAttribute('transform', `translate(${-x * z},${-y * z}) scale(${z})`); };
  const LX = (C.doc && C.doc.lupa) || [520, 995];
  // celular con notificación
  const cm = PP.celularMano({piel: PJ.piel, manga: PJ.campera || PJ.remera});
  const e2 = O.esc({nombre: 'celu', fondo: MENTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${C.celuFondo || MENTA}"/>`}, {f: 1, prof: 1, svg: cm.svg}]});
  e2.capas[1].svg.querySelector('.pantalla').innerHTML = PP.notificacion(Object.assign({hora: '10:12', app: 'Tu cobertura', titulo: 'Aviso', texto: '', color: BOSQUE, fondo: ['#2a5a50', '#9cc7b0']}, C.notif || {}));
  const vibra = t => (t > .1 && t < 1.6) ? Math.sin(t * 90) * 4 : 0;
  const base = Object.assign({x: PX, y: PY, s: 1.0, sentado: SE}, C.pose || {});
  const pose = (t, o) => pC(pj, t, Object.assign({}, base, o));
  const prop = C.prop || `<g transform="rotate(-60)"><rect x="-10" y="-48" width="96" height="62" rx="10" fill="${BOSQUE}"/><rect x="4" y="-38" width="40" height="8" rx="4" fill="#fff" opacity=".8"/><rect x="4" y="-22" width="64" height="6" rx="3" fill="#fff" opacity=".5"/><rect x="58" y="-2" width="20" height="12" rx="3" fill="#e5c76b"/></g>`;
  const pant = C.pantallas || [];
  const sc = vereda ? {X: 760, Y: 1180} : {X: 700, Y: 1080};
  const t1 = fr[1].t, f2 = fr[2], f3 = fr[3], f4 = fr[4];
  const tomaLugar0 = {t0: 0, esc: e1, cam: k => ({X: lerp(sc.X, sc.X + 40, k), Y: lerp(sc.Y, sc.Y - 20, k), z: lerp(1.75, 1.88, ease(k)), foco: 1, ap: 5}), act: t => {
    if (tel) tel.setAttribute('transform', `translate(${vibra(t)},0)`); lpant.innerHTML = '';
    pose(t, {hR: lerp(40, 75, easeOut(win(t, .3, .8))), cR: lerp(60, 96, easeOut(win(t, .3, .8))), hL: 30, cL: 55, mira: .4, ceja: .9, sonrisa: -.5, cab: 6});
    pj.E.propMano.innerHTML = t > .4 ? prop : ''; }};
  const tomaDoc = (a, b, dz = 0) => ({t0: a, esc: e3, cam: k => ({x: 540, y: lerp(900, 980, k), z: lerp(1.05 + dz, 1.14 + dz, ease(k)), foco: 1}), act: t => lupaEn(lerp(380, LX[0] + 120, ease(win(t, a, b))), lerp(1300, LX[1], ease(win(t, a, b - .3))))});
  O.tomas = [];
  if (C.orden === 'dato') O.tomas.push({t0: 0, esc: e3, tr: 'zoom', cam: k => ({x: lerp(LX[0], 540, ease(k)), y: lerp(LX[1], 960, ease(k)), z: lerp(2.6, 1.15, ease(k)), foco: 1}), act: t => lupaEn(LX[0] + wob(t) * 20, LX[1] + wob(t, 2) * 8)},
    Object.assign({}, tomaLugar0, {t0: .9}));
  else if (C.orden === 'celu') O.tomas.push({t0: 0, esc: e2, tr: 'zoom', cam: k => ({x: 540, y: lerp(1000, 940, k), z: lerp(1.25, 1.05, ease(k)), r: lerp(-3, 0, k), foco: 1, ap: 4})}, Object.assign({}, tomaLugar0, {t0: .95}));
  else O.tomas.push(tomaLugar0);
  O.tomas.push(C.celuEnFrase1 ? {t0: t1 - .05, esc: e2, cam: k => ({x: 540, y: lerp(990, 950, k), z: lerp(1.0, 1.07, ease(k)), r: lerp(1.5, 0, k), foco: 1, ap: 4})} : tomaDoc(t1 - .05, f2.t));
  if (C.celuEnFrase1) O.tomas.push(tomaDoc(t1 + 1.9, f2.t));
  else O.tomas.push({t0: t1 + 1.9, esc: e3, cam: k => ({x: lerp(LX[0] + 40, LX[0] + 80, k), y: LX[1], z: lerp(1.6, 1.72, ease(k)), foco: 1}), act: t => lupaEn(LX[0] + wob(t) * 30, LX[1] + wob(t, 2) * 8)});
  // los 3 puntos: tres planos distintos del lugar
  const cams = C.camItems || (vereda ? [{X: 700, Y: 1120, z: 2.3}, {X: 520, Y: 900, z: 2.0}, {X: 820, Y: 1160, z: 2.6}] : [{X: 620, Y: 980, z: 2.2}, {X: (C.lugar && C.lugar.calX) || 560, Y: 360, z: 2.6}, {X: 850, Y: 1035, z: 2.55}]);
  [1, 2, 3].forEach(i => { const f = FI(i); const c = cams[i - 1];
    O.tomas.push({t0: f.t - .1, esc: e1, cam: k => ({X: lerp(c.X, c.X + 25 * (i % 2 ? 1 : -1), k), Y: lerp(c.Y, c.Y - 12, k), z: lerp(c.z, c.z * 1.06, ease(k)), foco: c.foco ?? 1, ap: 6}), act: t => {
      lpant.innerHTML = pant[i - 1] || ''; pj.E.propMano.innerHTML = i === 1 ? prop : '';
      pose(t, i === 1 ? {hR: 70, cR: 70, hL: 30, cL: 55, mira: .7, ceja: .2, sonrisa: .1, cab: 8} : i === 2 ? {hR: 30, cR: 50, hL: 30, cL: 50, mira: -.3, ceja: .5} : {hR: 60, cR: 70, hL: 40, cL: 60, mira: .8, sonrisa: .2}); }}); });
  const fa = F('alivio');
  O.tomas.push({t0: fa.t - .1, esc: e1, cam: k => ({X: lerp(sc.X - 60, sc.X - 40, k), Y: sc.Y - 60, z: lerp(2.0, 2.1, ease(k)), foco: 1, ap: 5}), act: t => { lpant.innerHTML = pant[2] || ''; pj.E.propMano.innerHTML = ''; const k = easeOut(win(t, fa.t, fa.t + .8));
      pose(t, {hR: lerp(60, 160, k), cR: lerp(70, 20, k), hL: lerp(40, 150, k), cL: lerp(60, 20, k), sonrisa: 1, ceja: .4, cab: -6 * k}); }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: sc.X - 40, Y: sc.Y - 60, z: lerp(2.1, 2.2, k), foco: 1, ap: 10}), act: t => pose(t, {hR: 160, cR: 20, hL: 150, cL: 20, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: sc.X, Y: sc.Y, z: 1.75, foco: 1, ap: 5}), act: t => { lpant.innerHTML = ''; pose(t, {hR: 40, cR: 60, hL: 30, cL: 55, mira: .4}); pj.E.propMano.innerHTML = ''; }});
  O.tomas[0].boca = O.tomas[0].esc === e1 ? sobre(e1, 1, pj) : null; const ta = O.tomas.find(x => x.t0 === fa.t - .1); ta.boca = sobre(e1, 1, pj);
  const tl = O.tomas.find(x => x.esc === e1 && x.t0 <= fr[0].fin && x.t0 > 0); if (tl) tl.boca = sobre(e1, 1, pj);
  // planos irreales: personaje diminuto sobre el documento gigante (cae el objeto de marca en el golpe) y caída antes de los 3 puntos
  const G = gigante(O, Object.assign({pj: PJ, doc: C.gdoc || 'Letra chica', papel: ['#8fb7a2', '#DAF1DE', '#f4fbf5'], renglon: '#a9c9b6', tinta: BOSQUE, cielo: ['#1f6b5c', '#0b3b33', '#04201c'], acento: SALVIA, objeto: C.obj || 'lupa'}, C.gig || {}));
  const K = caida(O, Object.assign({pj: PJ, fondo: ['#1f6b5c', '#03201c'], hoja: '#f4fbf5', renglon: '#a9c9b6', raya: MENTA, acento: '#7fe0a8'}, C.cai || {}));
  O.tomas.push(G.toma(f2.t - .1, f3.t + .02), K.toma(f4.t - .1));
  O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f3.t + .02]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f3.t + .02 ? .45 * Math.exp(-(t - f3.t - .02) * 10) : 0);
  if (C.grade || C.cam || C.ap) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : null);
  return O;
}
