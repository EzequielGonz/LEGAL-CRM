// Kit de Autos (Automotores Kocos) para el cronograma x2 · tramo autos-1 (20 al 24/11).
// Cada reel arma su propia combinación: lugar de Buenos Aires, personajes, objeto de marca (primer plano con los 3 puntos),
// plano irreal del documento gigante y un «giro irreal» propio de la idea (bombo de sorteo, póliza avión, elevador de taller, etc.).
// Uso desde historias/<id>.js:  export const armar = V => kit(V, {...});
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, clamp, backOut, hash} from '../historia/base.js';
import {personaje, parpadeo, respirar, caminar} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import {poser, sobre, luz, PJS, ganchoCss, variar} from './comun.js';
import {gigante, OBJETOS} from '../historia/irreal.js';
import {realce} from '../historia/realce.js';
export const AZUL = '#207CCF', TINTA = '#000521', NAVY = '#011F65', CEL = '#8CC8FF', GRIS = '#8d939c';
const F1 = 'Archivo', F2 = 'Plus Jakarta Sans';

// ---------- objetos extra para el plano del documento gigante ----------
Object.assign(OBJETOS, {
  carpeta: a => `<g transform="translate(0,-640) scale(2.3)"><rect x="-200" y="-240" width="400" height="300" rx="18" fill="${a}"/><rect x="-200" y="-270" width="150" height="50" rx="12" fill="${a}"/><rect x="-170" y="-215" width="330" height="250" rx="8" fill="#fff"/>${[0, 1, 2, 3].map(i => `<rect x="-140" y="${-180 + i * 50}" width="${200 + hash(i) * 60}" height="14" rx="7" fill="#b9c9e0"/>`).join('')}</g>`,
  ficha: a => `<g transform="translate(0,-560) scale(2.5)"><circle r="190" fill="${a}"/><circle r="160" fill="none" stroke="#fff" stroke-width="10" opacity=".7"/><image href="autos.png" x="-60" y="-80" width="120" height="161"/></g>`,
  calculadora: a => `<g transform="translate(0,-640) scale(2.3)"><rect x="-150" y="-240" width="300" height="440" rx="34" fill="#0b0d12"/><rect x="-120" y="-210" width="240" height="90" rx="12" fill="#cfe6d6"/>${[...Array(12)].map((_, i) => `<rect x="${-115 + (i % 3) * 80}" y="${-95 + Math.floor(i / 3) * 70}" width="70" height="56" rx="12" fill="${i === 11 ? a : '#2a2e36'}"/>`).join('')}</g>`,
  poliza: a => `<g transform="translate(0,-640) scale(2.3)"><rect x="-170" y="-250" width="340" height="440" rx="10" fill="#fff"/><rect x="-170" y="-250" width="340" height="80" rx="10" fill="${a}"/><text x="0" y="-195" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="44" fill="#fff">PÓLIZA</text>${[0, 1, 2, 3].map(i => `<rect x="-130" y="${-140 + i * 50}" width="${200 + hash(i + 4) * 60}" height="14" rx="7" fill="#b9c9e0"/>`).join('')}<circle cx="90" cy="120" r="44" fill="none" stroke="${a}" stroke-width="10"/></g>`,
  sobre: a => `<g transform="translate(0,-560) scale(2.4)"><rect x="-210" y="-150" width="420" height="270" rx="14" fill="#f3ead7"/><path d="M-210,-150 L0,10 L210,-150" fill="none" stroke="#c9b993" stroke-width="10"/><text x="0" y="90" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="46" fill="${NAVY}">ANTICIPO</text></g>`,
});

// ---------- lugares (capa de fondo f .5 y capa de acción f 1, 1600 de ancho) ----------
const vidriera = (rotulo = 'AUTOMOTORES KOCOS · 0 KM') => `<rect x="-100" y="0" width="1800" height="1440" fill="#eef2f7"/>${[...Array(7)].map((_, i) => `<rect x="${i * 250}" y="220" width="230" height="980" fill="#cfe0ef"/><rect x="${i * 250}" y="220" width="230" height="980" fill="url(#kcv)" opacity=".5"/>`).join('')}
  <defs><linearGradient id="kcv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
  ${D.skyline({w: 1700, base: 1200, color: '#b8c7d8', seed: 9}).replace(/<rect/g, '<rect opacity=".5"')}
  <rect x="-100" y="140" width="1800" height="80" fill="${NAVY}"/><image href="autos.png" x="470" y="146" width="50" height="67"/><text x="830" y="196" font-family="Archivo" font-weight="900" font-size="46" fill="#fff" text-anchor="middle" letter-spacing="4">${rotulo}</text>
  ${[...Array(6)].map((_, i) => `<rect x="${60 + i * 280}" y="40" width="180" height="16" rx="8" fill="#fff" opacity=".9"/>`).join('')}
  <rect x="-100" y="1420" width="1800" height="600" fill="#cfd6df"/><rect x="-100" y="1420" width="1800" height="600" fill="url(#kcv)" opacity=".4"/>`;
export const LUGARES = {
  showroom: C => ({fondo: '#dfe7f1', back: vidriera(), front: D.auto({x: 1080, y: 1560, s: 1.5, color: C.autoColor || '#1f6fc2', brillo: .8}) + `<rect x="160" y="1330" width="360" height="22" rx="6" fill="${NAVY}"/><rect x="180" y="1352" width="16" height="230" fill="#33384a"/><rect x="484" y="1352" width="16" height="230" fill="#33384a"/><rect x="300" y="1280" width="120" height="50" rx="6" fill="#e7ecf3"/>`,
    luz: 'background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 70% 70%,rgba(32,124,207,.18),transparent 50%)'}),
  cocina: C => ({fondo: '#e8dcc6', back: D.interior({w: 1600, pared: '#eadfca', piso: '#9c7b5c', ventana: [1020, 380, 420, 540], vista: C.noche ? 'noche' : 'dia', luz: '#ffe3b0'}) +
    `<rect x="60" y="300" width="560" height="260" rx="10" fill="#c8a57e"/>${[0, 1, 2].map(i => `<rect x="${75 + i * 182}" y="315" width="168" height="230" rx="6" fill="#d8b892"/><circle cx="${150 + i * 182}" cy="520" r="7" fill="#7a5a3a"/>`).join('')}
     <rect x="40" y="700" width="260" height="720" rx="18" fill="#e9edf0"/><rect x="40" y="980" width="260" height="8" fill="#c3cad0"/><rect x="260" y="760" width="12" height="160" rx="6" fill="#aab2ba"/>`,
    front: `<g class="mesaK">${D.mesa({x: 800, y: 1440, w: 900, c: '#7a5638'})}<rect x="980" y="1395" width="70" height="45" rx="10" fill="#fff"/><path d="M1050,1405 q24,4 0,26" stroke="#fff" stroke-width="8" fill="none"/></g>`, mesa: true,
    luz: 'background:radial-gradient(circle at 75% 25%,rgba(255,226,170,.35),transparent 55%),linear-gradient(180deg,transparent 60%,rgba(0,0,0,.18))'}),
  vereda: C => ({fondo: '#9fc3e6', back: D.cielo({w: 1600, top: '#7fb4e6', mid: '#cfe3f3', bot: '#f4ead8'}) + D.skyline({w: 1700, base: 900, color: '#b7c4d3', seed: 3}),
    front: D.barrio({w: 1600, piso: 1460, hora: C.noche ? 'noche' : 'tarde', kiosco: true}).replace('KIOSCO', 'KIOSCO') + D.arbol({x: 1420, y: 1470, s: 1.1}) + D.auto({x: 1000, y: 1700, s: 1.45, color: C.autoColor || GRIS, brillo: .6}) + `<rect x="1180" y="1100" width="10" height="370" fill="#2a2c33"/><rect x="1110" y="1080" width="220" height="60" rx="6" fill="#1f6a3a"/><text x="1220" y="1121" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="28" fill="#fff">${C.calle || 'VILLA CRESPO'}</text>`,
    luz: 'background:linear-gradient(180deg,rgba(255,220,160,.2),transparent 50%),radial-gradient(circle at 20% 20%,rgba(255,240,200,.3),transparent 50%)'}),
  taller: C => ({fondo: '#2f343b', back: D.interior({w: 1600, pared: '#4a525c', piso: '#2e3238', ventana: null, zocalo: '#3a4048'}) +
    `<rect x="120" y="380" width="620" height="420" rx="8" fill="#5c6570"/>${[...Array(40)].map((_, i) => `<circle cx="${150 + (i % 10) * 60}" cy="${410 + Math.floor(i / 10) * 100}" r="5" fill="#2e333a"/>`).join('')}
     ${[0, 1, 2, 3, 4].map(i => `<rect x="${170 + i * 110}" y="440" width="${14 + i * 3}" height="${120 + hash(i) * 120}" rx="6" fill="${['#c8ccd2', '#d9542b', '#c8ccd2', '#e6b422', '#c8ccd2'][i]}"/>`).join('')}
     <rect x="860" y="200" width="620" height="110" rx="10" fill="${NAVY}"/><text x="1170" y="272" text-anchor="middle" font-family="Archivo" font-weight="900" font-size="44" fill="#fff" letter-spacing="3">TALLER · AIRE ACOND.</text>
     <rect x="900" y="420" width="520" height="200" rx="14" fill="#e9edf0"/><rect x="930" y="450" width="460" height="24" rx="6" fill="#c2c9d0"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="${940 + i * 74}" y="500" width="54" height="90" rx="6" fill="#d3d9df"/>`).join('')}
     ${[0, 1, 2].map(i => `<rect x="${300 + i * 420}" y="0" width="16" height="140" fill="#22262c"/><path d="M${250 + i * 420},140 l116,0 l-30,40 l-56,0 z" fill="#22262c"/><ellipse cx="${308 + i * 420}" cy="182" rx="60" ry="12" fill="#fff3d0" opacity=".8"/>`).join('')}`,
    front: D.auto({x: 1100, y: 1580, s: 1.4, color: C.autoColor || GRIS, brillo: .4}) + `<rect x="200" y="1380" width="260" height="200" rx="10" fill="#c0392b"/><rect x="200" y="1380" width="260" height="30" fill="#a93226"/>${[0, 1, 2].map(i => `<rect x="220" y="${1420 + i * 52}" width="220" height="40" rx="6" fill="#b03a2e"/><rect x="300" y="${1434 + i * 52}" width="60" height="10" rx="5" fill="#ddd"/>`).join('')}`,
    luz: 'background:radial-gradient(circle at 50% 10%,rgba(255,240,200,.35),transparent 55%),linear-gradient(180deg,transparent 50%,rgba(0,0,0,.3))'}),
  noche: C => ({fondo: '#0b1430', back: D.cielo({w: 1600, top: '#050b22', mid: '#14204a', bot: '#2b3266', estrellas: 40}) + D.skyline({w: 1700, base: 1000, color: '#121a36', ventanas: .3, seed: 6}),
    front: D.barrio({w: 1600, piso: 1460, hora: 'noche', kiosco: false}) + D.farol({x: 300, y: 1470, alto: 620}) + D.farol({x: 1350, y: 1470, alto: 620}) + D.auto({x: 900, y: 1710, s: 1.45, color: C.autoColor || '#1f6fc2', brillo: .9}) +
      `<rect x="640" y="980" width="12" height="490" fill="#2a2c33"/><rect x="460" y="930" width="380" height="80" rx="8" fill="#1f6a3a"/><text x="650" y="984" text-anchor="middle" font-family="Archivo" font-weight="800" font-size="34" fill="#fff">${C.calle || 'AV. JUAN B. JUSTO'}</text>`,
    luz: 'background:radial-gradient(circle at 22% 45%,rgba(255,210,130,.28),transparent 35%),radial-gradient(circle at 85% 45%,rgba(255,210,130,.22),transparent 35%)'}),
};

// ---------- objetos de marca en primer plano: marco propio + 3 renglones que se tildan ----------
const ROWS = [790, 950, 1110];
function fila(i, txt, {x0 = 250, x1 = 830, oscuro = false} = {}) {
  const y = ROWS[i]; const c = oscuro ? '#fff' : '#101528';
  return `<g class="sl" data-i="${i}"><rect x="${x0}" y="${y - 58}" width="${x1 - x0}" height="104" rx="22" fill="${oscuro ? '#ffffff' : AZUL}" opacity="${oscuro ? .08 : .1}"/>
    <circle cx="${x0 + 52}" cy="${y - 4}" r="34" fill="${AZUL}"/><text x="${x0 + 52}" y="${y + 13}" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="46" fill="#fff">${i + 1}</text><text class="lb" x="${x0 + 106}" y="${y + 14}" font-family="${F2}" font-weight="800" font-size="${txt.length > 17 ? 38 : 44}" fill="${c}">${txt}</text>
    <g class="chk" transform="translate(${x1 - 56},${y - 6})"><circle r="38" fill="${AZUL}"/><path d="M-17,1 L-5,14 L18,-12" stroke="#fff" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g></g>`;
}
export const OBJ = {
  carpeta: ({titulo, labels}) => `<rect x="150" y="520" width="780" height="760" rx="30" fill="${NAVY}"/><rect x="150" y="470" width="300" height="90" rx="24" fill="${NAVY}"/><rect x="200" y="560" width="690" height="690" rx="14" fill="#e7edf5" transform="rotate(-3 540 900)"/>
    <rect x="190" y="580" width="700" height="690" rx="14" fill="#fff"/><text x="540" y="680" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="50" fill="${NAVY}" letter-spacing="2">${titulo}</text><path d="M240,710 L840,710" stroke="${AZUL}" stroke-width="5"/>${labels.map((l, i) => fila(i, l, {x0: 220, x1: 860})).join('')}`,
  checklist: ({titulo, labels}) => `<rect x="170" y="500" width="740" height="800" rx="34" fill="#8a6440"/><rect x="200" y="560" width="680" height="710" rx="12" fill="#fbfaf6"/><rect x="430" y="470" width="220" height="90" rx="20" fill="#9aa3ad"/><rect x="460" y="455" width="160" height="40" rx="14" fill="#c9d0d7"/>
    <text x="540" y="665" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="48" fill="${NAVY}">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 225, x1: 855})).join('')}`,
  ticket: ({titulo, labels}) => `<rect x="230" y="420" width="620" height="900" fill="#f7f6f1"/><path d="M230,1320 ${[...Array(20)].map(() => 'l15.5,16 l15.5,-16').join(' ')}" fill="#f7f6f1"/>
    <text x="540" y="520" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="46" fill="#1b1d22" letter-spacing="3">${titulo}</text><path d="M260,570 L820,570" stroke="#1b1d22" stroke-width="3" stroke-dasharray="10 8"/>
    <text x="270" y="650" font-family="${F2}" font-weight="700" font-size="38" fill="#1b1d22">Precio de lista</text><path d="M560,650 L810,650" stroke="#1b1d22" stroke-width="3" stroke-dasharray="4 8"/>
    ${labels.map((l, i) => fila(i, '+ ' + l, {x0: 250, x1: 830})).join('')}<rect x="260" y="1200" width="560" height="90" rx="14" fill="${AZUL}"/><text x="540" y="1260" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="40" fill="#fff">PRECIO LLAVE EN MANO</text>`,
  calculadora: ({titulo, labels}) => `<rect x="160" y="420" width="760" height="920" rx="60" fill="#0b0d12"/><rect x="170" y="430" width="740" height="40" rx="20" fill="#fff" opacity=".05"/><rect x="220" y="480" width="640" height="170" rx="22" fill="#cfe6d6"/>
    <text class="disp" x="830" y="600" text-anchor="end" font-family="${F1}" font-weight="900" font-size="78" fill="#18321f">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 220, x1: 860, oscuro: true})).join('')}`,
  celular: ({titulo, labels}) => `<rect x="210" y="380" width="660" height="1000" rx="80" fill="#0b0d12"/><rect x="235" y="405" width="610" height="950" rx="62" fill="#f3f6fb"/><rect x="470" y="420" width="140" height="30" rx="15" fill="#0b0d12"/>
    <rect x="235" y="470" width="610" height="130" fill="${NAVY}"/><image href="autos.png" x="265" y="490" width="66" height="89"/><text x="355" y="550" font-family="${F1}" font-weight="900" font-size="40" fill="#fff">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 260, x1: 820})).join('')}`,
  poliza: ({titulo, labels}) => `<rect x="190" y="430" width="700" height="900" rx="16" fill="#fff"/><rect x="190" y="430" width="700" height="150" rx="16" fill="${AZUL}"/><rect x="190" y="560" width="700" height="20" fill="${AZUL}"/>
    <text x="540" y="530" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="62" fill="#fff" letter-spacing="4">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 220, x1: 860})).join('')}<circle cx="760" cy="1250" r="54" fill="none" stroke="${NAVY}" stroke-width="10" opacity=".5"/>`,
  calendario: ({titulo, labels}) => `${[['DICIEMBRE', 230], ['ENERO', 560]].map(([m, x]) => `<rect x="${x}" y="300" width="290" height="330" rx="18" fill="#fbfaf6"/><rect x="${x}" y="300" width="290" height="80" rx="18" fill="${m === 'ENERO' ? AZUL : NAVY}"/><rect x="${x}" y="350" width="290" height="30" fill="${m === 'ENERO' ? AZUL : NAVY}"/><text x="${x + 145}" y="355" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="38" fill="#fff">${m}</text>${[...Array(15)].map((_, k) => `<rect x="${x + 28 + (k % 5) * 50}" y="${410 + Math.floor(k / 5) * 64}" width="36" height="36" rx="8" fill="#d7dee8"/>`).join('')}`).join('')}
    <rect x="190" y="680" width="700" height="600" rx="24" fill="#fff"/><text x="540" y="740" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="40" fill="${NAVY}">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 220, x1: 860})).join('')}`,
  sobre: ({titulo, labels}) => `<rect x="160" y="560" width="760" height="760" rx="26" fill="#f3ead7"/><path d="M160,560 L540,840 L920,560" fill="#e8dcc0" stroke="#c9b993" stroke-width="8"/><text x="540" y="520" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="58" fill="#fff" letter-spacing="3">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 200, x1: 880})).join('')}`,
  tablero: ({titulo, labels}) => `<path d="M60,1320 Q60,520 540,500 Q1020,520 1020,1320 Z" fill="#0b0d12"/><path d="M110,1300 Q110,580 540,560 Q970,580 970,1300 Z" fill="#14171e"/>
    <circle cx="540" cy="760" r="150" fill="none" stroke="${CEL}" stroke-width="10" opacity=".8"/>${[...Array(13)].map((_, k) => { const a = -2.4 + k * .4; return `<rect x="537" y="618" width="6" height="22" fill="${CEL}" transform="rotate(${a * 57.3} 540 760)"/>`; }).join('')}<rect class="aguja" x="536" y="640" width="8" height="125" rx="4" fill="#ff7a3d"/><circle cx="540" cy="760" r="18" fill="#fff"/>
    <text x="540" y="880" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="34" fill="${CEL}">${titulo}</text>${labels.map((l, i) => fila(i, l, {x0: 180, x1: 900, oscuro: true}).replace(`y="${ROWS[i] - 58}"`, `y="${ROWS[i] - 58 + 60}"`).replace(/y="(\d+)" font-family/, (m, y) => `y="${+y + 60}" font-family`).replace(`translate(${900 - 56},${ROWS[i] - 6})`, `translate(${900 - 56},${ROWS[i] + 54})`)).join('')}`,
};

// ---------- utensilios en la mano ----------
export const MANO = {
  carpeta: `<g transform="rotate(-20)"><rect x="-40" y="-50" width="80" height="100" rx="8" fill="${AZUL}"/><rect x="-32" y="-44" width="64" height="88" rx="4" fill="#fff"/></g>`,
  llave: `<rect x="-12" y="-20" width="24" height="36" rx="10" fill="#0b0d12"/><circle cy="-26" r="8" fill="none" stroke="#ccd" stroke-width="3"/>`,
  celu: `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="#111"/><rect x="-13" y="-33" width="26" height="50" rx="4" fill="#bcd6ff" opacity=".9"/>`,
  linterna: `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="#111"/><circle cx="0" cy="-26" r="6" fill="#fff"/><path d="M0,-26 L-90,-260 L90,-260 Z" fill="#fff6c8" opacity=".35"/>`,
  calculadora: `<rect x="-30" y="-44" width="60" height="84" rx="8" fill="#0b0d12"/><rect x="-22" y="-36" width="44" height="18" rx="3" fill="#cfe6d6"/>`,
  sobre: `<rect x="-44" y="-30" width="88" height="58" rx="5" fill="#f3ead7"/><path d="M-44,-30 L0,2 L44,-30" fill="none" stroke="#c9b993" stroke-width="4"/>`,
  poliza: `<rect x="-34" y="-46" width="68" height="92" rx="4" fill="#fff"/><rect x="-34" y="-46" width="68" height="20" fill="${AZUL}"/>`,
  lapicera: `<rect x="-4" y="-60" width="8" height="80" rx="4" fill="#0b0d12" transform="rotate(30)"/>`,
  bolsa: `<rect x="-40" y="-10" width="80" height="90" rx="8" fill="${NAVY}"/><path d="M-20,-10 q20,-40 40,0" stroke="${NAVY}" stroke-width="6" fill="none"/><image href="autos.png" x="-15" y="12" width="30" height="40"/>`,
  trapo: `<path d="M-30,-20 q30,-20 60,0 q-10,40 -60,30 z" fill="#f2c037"/>`,
};

// ---------- giros irreales (uno por idea) ----------
const cieloK = (id = 'gck') => `<defs><radialGradient id="${id}" cx=".5" cy=".38" r=".8"><stop offset="0" stop-color="#0E4EB2"/><stop offset=".6" stop-color="#020C47"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect x="-600" y="-600" width="2800" height="3200" fill="url(#${id})"/>` + [...Array(60)].map((_, i) => `<circle cx="${hash(i) * 1600}" cy="${hash(i + 99) * 900}" r="${1 + hash(i + 7) * 2.4}" fill="#fff" opacity="${.2 + hash(i + 3) * .6}"/>`).join('');
const autoFrente = (c = '#1f6fc2') => `<g><ellipse cx="0" cy="150" rx="380" ry="40" fill="#000" opacity=".45"/><rect x="-340" y="-40" width="680" height="190" rx="70" fill="${c}"/><path d="M-250,-40 Q-220,-230 0,-240 Q220,-230 250,-40 Z" fill="${D.sh(c, -.15)}"/><path d="M-205,-55 Q-180,-200 0,-208 Q180,-200 205,-55 Z" fill="#1b2433"/><path d="M-170,-70 Q-150,-180 -40,-196 L-80,-70 Z" fill="#fff" opacity=".15"/>
  <rect x="-300" y="10" width="140" height="56" rx="24" fill="#fff6d8"/><rect x="160" y="10" width="140" height="56" rx="24" fill="#fff6d8"/><rect x="-120" y="40" width="240" height="70" rx="18" fill="#0b0d12"/><image href="autos.png" x="-22" y="44" width="44" height="59"/><rect x="-330" y="120" width="70" height="80" rx="16" fill="#111"/><rect x="260" y="120" width="70" height="80" rx="16" fill="#111"/></g>`;
export function giro(O, tipo, C, pjDef) {
  const mk = (capas, fondo = TINTA) => O.esc({nombre: 'giro-' + tipo, fondo, capas});
  const pjEn = (e, k = 1) => personaje(e.capas[k].svg.querySelector('.act'), pjDef);
  if (tipo === 'bombo') {
    const e = mk([{f: .4, prof: .4, w: 1600, svg: D.cielo({w: 1600, top: '#5aa0e0', mid: '#cfe3f3', bot: '#f4ead8'}) + D.skyline({w: 1700, base: 900, color: '#b7c4d3', seed: 4})},
      {f: 1, prof: 1, w: 1600, svg: D.barrio({w: 1600, piso: 1460, hora: 'tarde', kiosco: false}) + `<g class="act"></g><g class="bombo" transform="translate(800,1060)"><rect x="-30" y="300" width="60" height="140" fill="#22262c"/><rect x="-220" y="420" width="440" height="40" rx="10" fill="#22262c"/><circle r="390" fill="${AZUL}" opacity=".12"/><g class="rueda"><circle r="380" fill="none" stroke="#e6ecf4" stroke-width="22"/>${[...Array(12)].map((_, i) => `<rect x="-6" y="-380" width="12" height="760" fill="#e6ecf4" opacity=".75" transform="rotate(${i * 15})"/>`).join('')}<image href="autos.png" x="-60" y="-80" width="120" height="161"/></g></g><g class="bolas"></g>`}]);
    const ch = pjEn(e); const rueda = e.capas[1].svg.querySelector('.rueda'), bolas = e.capas[1].svg.querySelector('.bolas');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({X: 800 + Math.sin(t * 2) * 30, Y: lerp(1050, 1200, ease(k)), z: lerp(1.0, 1.22, k), r: lerp(-4, 3, k), foco: 1}), act: t => { const d = t - t0;
      rueda.setAttribute('transform', `rotate(${d * 260})`); ch.pose({x: 300, y: 1560, s: .9, flip: 1, parpado: parpadeo(t, 2), hR: 120, cR: 30, hL: 110, cL: 30, ceja: 1, sonrisa: .2, mira: .4, cab: -12});
      bolas.innerHTML = [...Array(16)].map((_, i) => { const st = i * .07, q = Math.max(0, d - st); const dir = i % 2 ? 1 : -1; const x = 800 + dir * (q * (420 + hash(i) * 380)); const y = Math.min(1600 - 46, 1060 + 300 * q * q * 4 - 200 * q + hash(i + 3) * 40); const r = 44 + hash(i) * 10;
        return q > 0 ? `<g transform="translate(${x},${y}) rotate(${q * 520 * dir})"><circle r="${r}" fill="${i % 3 ? '#fff' : CEL}"/><circle r="${r * .55}" fill="none" stroke="${AZUL}" stroke-width="7"/><rect x="-4" y="${-r * .4}" width="8" height="${r * .8}" fill="${NAVY}"/></g>` : ''; }).join(''); }})};
  }
  if (tipo === 'avion') {
    const e = mk([{f: .3, prof: .3, w: 1600, svg: D.cielo({w: 1600, top: '#3f7fd0', mid: '#cfe3f3', bot: '#ffe0b8', sol: [1250, 620, 120, '#fff3c4']})},
      {f: 1, prof: 1, w: 1600, svg: D.barrio({w: 1600, piso: 1460, hora: 'tarde'}) + `<g class="act"></g><g class="av"><path d="M0,0 L-220,-70 L-150,0 L-220,70 Z" fill="#fff"/><path d="M0,0 L-150,0 L-220,70 Z" fill="#dbe6f5"/><rect x="-170" y="-14" width="90" height="10" fill="${AZUL}"/><text x="-150" y="-28" font-family="${F1}" font-weight="900" font-size="26" fill="${NAVY}">PÓLIZA</text></g>`}]);
    const ch = pjEn(e); const av = e.capas[1].svg.querySelector('.av');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'h', cam: (k, t) => ({X: lerp(1000, 760, ease(k)), Y: lerp(900, 1250, ease(k)), z: lerp(1.0, 1.45, ease(k)), r: Math.sin(t * 2) * 2, foco: 1}), act: (t, k) => { const q = clamp(k * 1.15);
      const x = lerp(1700, 820, ease(q)), y = lerp(300, 1270, easeIn(q)) + Math.sin(q * 9) * 90 * (1 - q); av.setAttribute('transform', `translate(${x},${y}) rotate(${-20 + Math.cos(q * 9) * 25 * (1 - q) + 160}) scale(${lerp(1.6, .45, q)})`);
      ch.pose({x: 700, y: 1560, s: 1.0, flip: 1, parpado: parpadeo(t, 1), hR: lerp(40, 165, ease(q)), cR: 20, hL: 20, cL: 30, ceja: .8, sonrisa: q > .9 ? 1 : .2, mira: -.6, cab: -18}); }})};
  }
  if (tipo === 'elevador') {
    const e = mk([{f: .5, prof: .5, w: 1600, svg: LUGARES.taller(C).back}, {f: 1, prof: 1, w: 1600, svg: `<rect x="420" y="600" width="50" height="1000" fill="#c0392b"/><rect x="1130" y="600" width="50" height="1000" fill="#c0392b"/><g class="act"></g><g class="lift"><rect x="380" y="0" width="840" height="40" rx="8" fill="#2b2f36"/><g class="car">${D.auto({x: 0, y: 0, s: 1.6, color: GRIS, brillo: .5})}</g><path d="M560,40 L1040,40 L1000,90 L600,90 Z" fill="#14161b"/><rect x="740" y="50" width="120" height="20" rx="6" fill="#555"/></g>`}], '#2f343b');
    const ch = pjEn(e); const lift = e.capas[1].svg.querySelector('.lift'), car = e.capas[1].svg.querySelector('.car');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'v', cam: (k, t) => ({X: 800, Y: lerp(1350, 1120, ease(k)), z: lerp(1.1, 1.35, k), r: lerp(-8, 8, ease(k)), foco: 1}), act: (t, k) => { const y = lerp(1590, 1080, easeOut(clamp(k * 1.4)));
      lift.setAttribute('transform', `translate(0,${y})`); const a = (t - t0) * 3.2; car.setAttribute('transform', `translate(800,0) scale(${Math.cos(a) >= 0 ? Math.max(.18, Math.cos(a)) : Math.min(-.18, Math.cos(a))},1)`);
      ch.pose({x: 300, y: 1590, s: .95, flip: 1, parpado: parpadeo(t, 3), hR: 70, cR: 60, hL: 20, cL: 30, ceja: 1, sonrisa: 0, mira: .5, cab: -26}); }})};
  }
  if (tipo === 'vidrio') {
    const [a, b] = C.vs || ['0 KM', 'USADO']; const resp = C.resp || 'DEPENDE DE TU USO';
    const sh = []; for (let i = 0; i < 6; i++) for (let j = 0; j < 9; j++) { const x0 = i * 180, y0 = j * 214, J = (u, v) => [u + (hash(u * 3 + v) - .5) * 90 * (u > 0 && u < 1080), v + (hash(u + v * 7) - .5) * 90 * (v > 0 && v < 1920)];
      const p = [J(x0, y0), J(x0 + 180, y0), J(x0 + 180, y0 + 214), J(x0, y0 + 214)]; sh.push([p[0], p[1], p[2]], [p[0], p[2], p[3]]); }
    const e = mk([{f: .2, prof: .2, svg: `<rect x="-200" y="-200" width="1480" height="2320" fill="${TINTA}"/><circle cx="540" cy="960" r="520" fill="${AZUL}" opacity=".3"/><text x="540" y="930" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="${resp.length > 14 ? 92 : 120}" fill="#fff">${resp.split('|')[0]}</text><text x="540" y="1060" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="${resp.length > 14 ? 92 : 120}" fill="${CEL}">${resp.split('|')[1] || ''}</text><image href="autos.png" x="480" y="1150" width="120" height="161"/>`},
      {f: 1, prof: 1, svg: `<g class="vid">${sh.map(p => { const cx = (p[0][0] + p[1][0] + p[2][0]) / 3; return `<polygon class="s" data-c="${cx},${(p[0][1] + p[1][1] + p[2][1]) / 3}" points="${p.map(q => q.join(',')).join(' ')}" fill="${cx < 540 ? AZUL : NAVY}" stroke="#fff" stroke-opacity=".0" stroke-width="3"/>`; }).join('')}</g>
        <g class="lbl"><text x="270" y="980" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="104" fill="#fff">${a}</text><text x="810" y="980" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="104" fill="#fff">${b}</text><rect x="532" y="0" width="16" height="1920" fill="#fff"/><circle cx="540" cy="940" r="80" fill="#fff"/><text x="540" y="968" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="64" fill="${NAVY}">VS</text></g><g class="grieta" opacity="0" stroke="#fff" stroke-width="5" fill="none">${[...Array(12)].map((_, i) => { const an = i / 12 * 6.28; let s = 'M540,940'; let x = 540, y = 940; for (let k = 0; k < 5; k++) { x += Math.cos(an + (hash(i * 5 + k) - .5)) * 120; y += Math.sin(an + (hash(i * 7 + k) - .5)) * 120; s += ` L${x.toFixed(0)},${y.toFixed(0)}`; } return `<path d="${s}"/>`; }).join('')}</g>`}]);
    const S = [...e.capas[1].svg.querySelectorAll('.s')], lbl = e.capas[1].svg.querySelector('.lbl'), gr = e.capas[1].svg.querySelector('.grieta');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = t - t0; const sk = d > .45 && d < 1 ? Math.exp(-(d - .45) * 7) : 0; return {x: 540 + Math.sin(t * 61) * 22 * sk, y: 960 + Math.cos(t * 53) * 18 * sk, z: lerp(1.0, 1.08, k), foco: 1}; }, act: t => { const d = t - t0;
      gr.setAttribute('opacity', d > .3 ? 1 : 0); const q = Math.max(0, d - .5); lbl.setAttribute('opacity', d < .5 ? 1 : Math.max(0, 1 - q * 4));
      S.forEach((s, i) => { const [cx, cy] = s.dataset.c.split(',').map(Number); const dx = cx - 540, dy = cy - 940, L = Math.hypot(dx, dy) + 1; const v = 900 + hash(i) * 900;
        s.setAttribute('transform', q > 0 ? `translate(${dx / L * v * q},${dy / L * v * q + 900 * q * q}) rotate(${(hash(i + 3) - .5) * 400 * q} ${cx} ${cy})` : ''); s.setAttribute('stroke-opacity', d > .3 ? .6 : 0); s.setAttribute('opacity', 1 - clamp(q * 1.2)); }); }})};
  }
  if (tipo === 'llavegira') {
    const e = mk([{f: .2, prof: .2, w: 1600, svg: cieloK('gl1')}, {f: 1, prof: 1, svg: `<g class="key"><circle cy="-330" r="72" fill="none" stroke="#dfe5ee" stroke-width="18"/><rect x="-150" y="-300" width="300" height="440" rx="120" fill="#0b0d12"/><rect x="-140" y="-290" width="280" height="200" rx="110" fill="#fff" opacity=".07"/><image href="autos.png" x="-70" y="-250" width="140" height="188"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-20 + i * 70}" r="26" fill="#1e2128"/>`).join('')}<rect x="-30" y="140" width="60" height="420" rx="8" fill="#cfd6e0"/>${[0, 1, 2, 3].map(i => `<rect x="${i % 2 ? 10 : -50}" y="${200 + i * 80}" width="40" height="40" fill="#cfd6e0"/>`).join('')}</g><circle class="hole" cx="540" cy="472" r="0" fill="${AZUL}"/>`}]);
    const key = e.capas[1].svg.querySelector('.key'), hole = e.capas[1].svg.querySelector('.hole');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({x: 540, y: lerp(960, 472, easeIn(clamp(k * 1.1))), z: lerp(1, 7, Math.pow(clamp(k * 1.1), 3)), r: k * 25, foco: 1}), act: (t, k) => { const a = (t - t0) * 4;
      key.setAttribute('transform', `translate(540,1000) scale(${1.6 * Math.max(.12, Math.abs(Math.cos(a)))},1.6) rotate(${Math.sin(a) * 6})`); hole.setAttribute('r', k > .8 ? (k - .8) * 5 * 60 : 0); }})};
  }
  if (tipo === 'haz') {
    const e = mk([{f: .4, prof: .4, w: 1600, svg: `<rect x="-200" y="-200" width="2000" height="2400" fill="#070a14"/>${[...Array(30)].map((_, i) => `<rect x="${i * 60}" y="${1000 + hash(i) * 200}" width="40" height="${400 + hash(i + 1) * 300}" fill="#0c1222"/>`).join('')}`},
      {f: 1, prof: 1, w: 1600, svg: `<defs><linearGradient id="hzK" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#fff9dc" stop-opacity=".85"/><stop offset="1" stop-color="#fff9dc" stop-opacity=".05"/></linearGradient></defs>
        <polygon class="beam" points="520,1420 1500,360 1500,1060" fill="url(#hzK)"/><g class="sign" opacity="0"><rect x="880" y="520" width="640" height="440" rx="24" fill="#16723f" stroke="#fff" stroke-width="10"/><text x="1200" y="640" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="58" fill="#fff">${C.signo1 || 'N.º DE CHASIS'}</text><path d="M930,680 L1470,680" stroke="#fff" stroke-width="4"/><text x="1200" y="790" text-anchor="middle" font-family="${F1}" font-weight="800" font-size="46" fill="#fff">${C.signo2 || '¿COINCIDE CON'}</text><text x="1200" y="870" text-anchor="middle" font-family="${F1}" font-weight="800" font-size="46" fill="#fff">${C.signo3 || 'LOS PAPELES?'}</text></g><g class="act"></g>`}], '#070a14');
    const ch = pjEn(e); const sg = e.capas[1].svg.querySelector('.sign'), beam = e.capas[1].svg.querySelector('.beam');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({X: lerp(700, 1050, ease(k)), Y: lerp(1250, 900, ease(k)), z: lerp(1.2, 1.15, k), r: lerp(4, -2, k), foco: 1}), act: (t, k) => {
      sg.setAttribute('opacity', clamp(k * 3 - .3)); beam.setAttribute('opacity', .6 + .4 * Math.abs(Math.sin(t * 13)) * (k < .2 ? 1 : .2));
      ch.pose({x: 420, y: 1600, s: 1.05, flip: 1, parpado: parpadeo(t, 4), hR: 130, cR: 10, hL: 20, cL: 30, ceja: 1, sonrisa: k > .5 ? .6 : -.2, mira: .7, cab: -16}); ch.E.propMano.innerHTML = MANO.celu; }})};
  }
  if (tipo === 'moneda') {
    const e = mk([{f: .35, prof: .35, w: 2600, svg: D.cielo({w: 2600, top: '#6aa8e2', mid: '#d4e6f3', bot: '#f4ead8'}) + D.skyline({w: 2700, base: 1000, color: '#b7c4d3', seed: 8, obelisco: [2100, 1000, 520, '#f2efe8']})},
      {f: 1, prof: 1, w: 2600, svg: D.barrio({w: 2600, piso: 1460, hora: 'tarde'}) + `<rect x="700" y="1080" width="12" height="390" fill="#2a2c33"/><rect x="540" y="1030" width="340" height="80" rx="8" fill="#1f6a3a"/><text x="710" y="1084" text-anchor="middle" font-family="${F1}" font-weight="800" font-size="34" fill="#fff">AV. CORRIENTES</text><g class="coin"><circle r="230" fill="${AZUL}"/><circle r="200" fill="none" stroke="#fff" stroke-width="12" opacity=".75"/><circle r="230" fill="none" stroke="${NAVY}" stroke-width="16"/><image href="autos.png" x="-75" y="-100" width="150" height="201"/></g>`}]);
    const coin = e.capas[1].svg.querySelector('.coin'); const pos = q => { const fall = clamp(q / .3); const y = q < .3 ? lerp(-300, 1580, easeIn(fall)) : 1580 - Math.abs(Math.sin((q - .3) * 9)) * 180 * Math.exp(-(q - .3) * 5); const x = q < .3 ? 600 : 600 + (q - .3) * 2600; return [x, y]; };
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'v', cam: (k, t) => { const [x] = pos(k); return {X: Math.max(800, Math.min(1900, x + 100)), Y: lerp(1100, 1350, ease(k)), z: 1.15, r: Math.sin(t * 3) * 2, foco: 1}; }, act: (t, k) => { const [x, y] = pos(k);
      coin.setAttribute('transform', `translate(${x},${y - 0}) rotate(${k < .3 ? k * 200 : (k - .3) * 2600 / 230 * 57.3}) scale(${k < .3 ? 1 : 1})`); }})};
  }
  if (tipo === 'hojas') {
    const pts = [[-240, -20], [-236, -60], [-200, -84], [-130, -92], [-60, -140], [0, -152], [60, -152], [150, -100], [210, -90], [244, -40], [150, -12], [-150, -12], [0, -96], [-90, -50], [90, -50], [0, -40]].map(([x, y]) => [540 + x * 1.9, 1080 + y * 1.9]);
    const e = mk([{f: .2, prof: .2, svg: cieloK('gh1')}, {f: 1, prof: 1, svg: `<path class="sil" d="${'M-240,-20 C-242,-60 -230,-78 -200,-84 L-130,-92 C-100,-128 -60,-150 0,-152 C60,-152 110,-140 150,-100 L210,-90 C238,-84 246,-60 244,-30 L240,-12 L-236,-12 Z'}" transform="translate(540,1080) scale(1.9)" fill="none" stroke="${CEL}" stroke-width="5" opacity="0"/>
      <g transform="translate(540,1500)"><rect x="-200" y="-40" width="400" height="200" rx="16" fill="${NAVY}"/><rect class="tapa" x="-200" y="-70" width="400" height="40" rx="10" fill="${AZUL}"/></g><g class="hs">${pts.map((_, i) => `<g class="h"><rect x="-60" y="-80" width="120" height="160" rx="6" fill="#fff"/>${[0, 1, 2, 3].map(j => `<rect x="-42" y="${-56 + j * 30}" width="${60 + hash(i * 3 + j) * 24}" height="8" rx="4" fill="#b9c9e0"/>`).join('')}</g>`).join('')}</g>`}]);
    const H = [...e.capas[1].svg.querySelectorAll('.h')], sil = e.capas[1].svg.querySelector('.sil');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({x: 540, y: lerp(1250, 1000, ease(k)), z: lerp(1.15, .98, ease(k)), r: Math.sin(t * 2) * 2, foco: 1}), act: (t, k) => {
      H.forEach((h, i) => { const q = easeOut(clamp(k * 1.6 - i * .03)); const [x, y] = pts[i]; const mx = 540 + (hash(i) - .5) * 900, my = 600 + hash(i + 5) * 300;
        const X = q < .5 ? lerp(540, mx, q * 2) : lerp(mx, x, (q - .5) * 2), Y = q < .5 ? lerp(1480, my, q * 2) : lerp(my, y, (q - .5) * 2);
        h.setAttribute('transform', `translate(${X},${Y}) rotate(${(1 - q) * (hash(i + 2) - .5) * 720}) scale(${lerp(.3, .75, q)})`); }); sil.setAttribute('opacity', clamp(k * 2.5 - 1.3)); }})};
  }
  if (tipo === 'invertido') {
    const e = mk([{f: .5, prof: .5, w: 1600, svg: `<rect x="-200" y="-200" width="2000" height="2400" fill="#0d1a3a"/>${[0, 1, 2].map(i => `<rect x="${200 + i * 480}" y="0" width="6" height="${360 + i * 40}" fill="#9aa3ad"/><g transform="translate(${200 + i * 480},${560 + i * 40}) scale(1,-1)">${D.auto({x: 0, y: 0, s: .9, color: ['#1f6fc2', '#d9dde3', '#011F65'][i], brillo: .7}).replace('<g', '<g')}</g>`).join('')}`},
      {f: 1, prof: 1, w: 1600, svg: `<rect x="-200" y="1580" width="2000" height="600" fill="#e8eef6"/>${[...Array(9)].map((_, i) => `<rect x="${i * 200 - 60}" y="1600" width="160" height="26" rx="13" fill="#fffbe6"/><ellipse cx="${i * 200 + 20}" cy="1600" rx="120" ry="40" fill="#fff6c8" opacity=".35"/>`).join('')}<text x="800" y="1780" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="54" fill="${NAVY}" opacity=".5" transform="rotate(180 800 1760)">AUTOMOTORES KOCOS</text><g class="act"></g>`}], '#0d1a3a');
    const ch = pjEn(e);
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'v', cam: (k, t) => ({X: lerp(600, 900, k), Y: lerp(1100, 1250, ease(k)), z: lerp(1.0, 1.3, ease(k)), r: lerp(180, 0, easeOut(clamp(k * 1.6))) * 0 + lerp(-10, 0, k), foco: 1}), act: (t, k) => { const w = caminar(t, .8);
      ch.pose(Object.assign({x: lerp(450, 950, k), y: 1595 + w.dy, s: 1.0, flip: 1, parpado: parpadeo(t, 1), ceja: .9, sonrisa: .3, mira: -.8, cab: -25}, w)); }})};
  }
  if (tipo === 'ascensor') {
    const e = mk([{f: .3, prof: .3, w: 1600, h: 1920, svg: D.cielo({w: 1600, top: '#2a5fae', mid: '#a9c9ec', bot: '#ffd9b0'})},
      {f: 1, prof: 1, w: 1080, h: 3800, svg: `<rect x="80" y="0" width="920" height="3800" fill="#d9a98a"/>${[...Array(16)].map((_, j) => [0, 1].map(i => `<rect x="${140 + i * 560}" y="${120 + j * 230}" width="240" height="150" rx="8" fill="#7f94a8" opacity=".8"/><rect x="${126 + i * 560}" y="${270 + j * 230}" width="268" height="12" fill="#a8775b"/>`).join('')).join('')}
        <rect x="430" y="0" width="220" height="3800" fill="#9fb3c8" opacity=".35"/><rect x="438" y="0" width="6" height="3800" fill="#555"/><rect x="636" y="0" width="6" height="3800" fill="#555"/>
        <g class="cab"><rect x="400" y="-200" width="280" height="300" rx="16" fill="#cfe6ff" opacity=".55" stroke="#fff" stroke-width="8"/><rect x="420" y="-100" width="240" height="120" rx="10" fill="${AZUL}"/><text x="540" y="-22" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="64" fill="#fff">CUOTA</text><path d="M540,-180 l40,50 l-80,0 z" fill="${NAVY}"/></g>`}], '#2a5fae');
    const cab = e.capas[1].svg.querySelector('.cab');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'v', cam: (k, t) => { const y = lerp(3500, 700, ease(k)); return {X: 540, Y: y, z: 1.15, r: Math.sin(t * 2) * 1.5, foco: 1}; }, act: (t, k) => { cab.setAttribute('transform', `translate(0,${lerp(3500, 700, ease(k)) + 60})`); }})};
  }
  if (tipo === 'frenada') {
    const e = mk([{f: .5, prof: .5, w: 1600, svg: vidriera()}, {f: 1, prof: 1, svg: `<rect x="-400" y="1420" width="1880" height="900" fill="#cfd6df"/><g class="car">${autoFrente(C.autoColor || '#1f6fc2')}</g>`}], '#dfe7f1');
    const car = e.capas[1].svg.querySelector('.car');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = (t - t0); const stop = .78; const sk = k > stop && k < stop + .2 ? Math.exp(-(k - stop) * 30) : 0; return {x: 540 + Math.sin(t * 70) * 26 * sk, y: 1100 + Math.cos(t * 50) * 20 * sk, z: 1, foco: 1}; }, act: (t, k) => {
      const q = k < .78 ? Math.pow(k / .78, 2.2) : 1; car.setAttribute('transform', `translate(540,${lerp(1450, 1250, q)}) scale(${lerp(.35, 2.6, q)})`); }})};
  }
  if (tipo === 'tablero') {
    const e = mk([{f: .2, prof: .2, w: 1600, svg: `<rect x="-200" y="-200" width="2000" height="2400" fill="#04060d"/>`},
      {f: 1, prof: 1, w: 1600, svg: `<path d="M-100,1900 Q-100,500 800,450 Q1700,500 1700,1900 Z" fill="#0b0d12"/>${[...Array(220)].map((_, i) => { const a = hash(i) * 3.14, r = 300 + hash(i + 9) * 600; return `<circle class="lz" cx="${800 + Math.cos(a) * r * 1.2}" cy="${1500 - Math.sin(a) * r}" r="${2 + hash(i + 4) * 5}" fill="${i % 4 ? CEL : '#ffb36b'}"/>`; }).join('')}
        <circle cx="560" cy="1150" r="230" fill="none" stroke="${CEL}" stroke-width="12"/><circle cx="1040" cy="1150" r="230" fill="none" stroke="${CEL}" stroke-width="12"/>${[...Array(26)].map((_, k) => `<rect x="${k < 13 ? 557 : 1037}" y="930" width="6" height="30" fill="${CEL}" transform="rotate(${-130 + (k % 13) * 21.6} ${k < 13 ? 560 : 1040} 1150)"/>`).join('')}
        <rect class="ag1" x="555" y="960" width="10" height="200" rx="5" fill="#ff7a3d"/><rect class="ag2" x="1035" y="960" width="10" height="200" rx="5" fill="#ff7a3d"/><rect x="0" y="1500" width="1600" height="420" fill="#0f1218"/><g class="act"></g>`}], '#04060d');
    const ch = pjEn(e); const L = [...e.capas[1].svg.querySelectorAll('.lz')], a1 = e.capas[1].svg.querySelector('.ag1'), a2 = e.capas[1].svg.querySelector('.ag2');
    return {esc: e, toma: t0 => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({X: 800, Y: lerp(1500, 1250, ease(k)), z: lerp(3.2, 1.0, easeOut(k)), r: lerp(6, 0, k), foco: 1}), act: (t, k) => {
      L.forEach((l, i) => l.setAttribute('opacity', .3 + .7 * Math.abs(Math.sin(t * (1 + hash(i) * 3) + i)))); a1.setAttribute('transform', `rotate(${lerp(-120, 60, easeOut(k))} 560 1150)`); a2.setAttribute('transform', `rotate(${lerp(-120, 20, easeOut(k))} 1040 1150)`);
      const w = caminar(t, .7); ch.pose(Object.assign({x: lerp(700, 900, k), y: 1560 + w.dy * .3, s: .35, flip: 1, parpado: parpadeo(t, 2), ceja: 1, sonrisa: .6, mira: -.8, cab: -20}, w)); }})};
  }
  throw new Error('giro desconocido ' + tipo);
}

// ---------- armado del reel ----------
// P: {hook, lugar, pjs: [{id, x, flip, s}], habla, objeto, titulo, labels, doc, gobj, giro, giroCfg, mano, manoAlivio, ap, cam, grade, autoColor, noche, calle}
export async function kit(V, P0) {
  const C = Object.assign({}, P0, V.cfg || {});
  const O = obra(V, {nombre: 'Automotores Kocos', logo: 'autos.png', ctaSub: 'y te respondemos', hookHTML: C.hook.replace(/0 km/g, '0&nbsp;km'), hookHasta: V.frases[1].t - .05, notas: []});
  document.documentElement.style.cssText += `--f1:Archivo;--f2:'Plus Jakarta Sans';--fs:Archivo;--tt:uppercase;--acc:#8CC8FF;--hw:900;--em:normal;--kwCol:#fff;--logoH:150px;--velo:rgba(0,5,33,.9);--ctaTop:600px;--ss:78px;${ganchoCss(C.hook)};--hookTop:${C.hookTop || 1130}px`;
  const st = document.createElement('style'); st.textContent = '#num{display:none}#hook{-webkit-text-stroke:12px rgba(0,5,33,.92);paint-order:stroke fill}'; document.head.appendChild(st);
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta);
  const L = LUGARES[C.lugar](C);
  const e1 = O.esc({nombre: 'lugar', fondo: L.fondo, capas: [{f: .5, prof: .5, w: 1600, svg: L.back}, {f: 1, prof: 1, w: 1600, svg: (L.mesa ? '<g class="act"></g>' + L.front : L.front + '<g class="act"></g>')}]});
  luz(e1, L.luz); const R = realce(); R.conPolvo(e1, 800, 900, 600, 500, '#fff'); O.motas = R.motasRender;
  const act1 = e1.capas[1].svg.querySelector('.act');
  const pjs = C.pjs.map(p => Object.assign({}, p, {pj: personaje(act1, PJS[p.id]), pose: poser(V, p.id)}));
  const habla = pjs.find(p => p.id === C.habla) || pjs[0];
  const Y0 = L.mesa ? 1600 : (C.lugar === 'vereda' || C.lugar === 'noche' ? 1540 : 1585);
  const grupo = (t, modo) => pjs.forEach((p, i) => { const tense = modo === 'conflicto', feliz = modo === 'alivio'; const base = {x: p.x, y: p.y || Y0, s: p.s || 1, flip: p.flip || 1, mira: .4 * (p.flip || 1)};
    const ex = tense ? (p === habla ? {hR: 60, cR: 50, hL: 30, cL: 40, ceja: .9, sonrisa: -.4, mira: .6} : {hR: 15, cR: 20, ceja: .4, sonrisa: -.1}) : feliz ? (p === habla || i === 0 ? {hR: 150, cR: 30, hL: 140, cL: 20, sonrisa: 1, ceja: .5} : {hR: 40, cR: 40, sonrisa: 1}) : {hR: 20, cR: 30, sonrisa: .2};
    p.pose(p.pj, t, Object.assign(base, ex, (p.extra || {})[modo] || {})); });
  const manoPj = (p, s) => { if (p) p.pj.E.propMano.innerHTML = s || ''; };
  const cx = habla.x + 40, camC = C.camC || {};
  // primer plano del objeto de marca
  const ob = OBJ[C.objeto]({titulo: C.titulo, labels: C.labels});
  const e2 = O.esc({nombre: 'objeto', fondo: TINTA, capas: [{f: .4, prof: .3, svg: `<defs><radialGradient id="kog" cx=".5" cy=".55" r=".8"><stop offset="0" stop-color="${NAVY}"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect x="-300" y="-300" width="1680" height="2520" fill="url(#kog)"/>${[...Array(10)].map((_, i) => `<rect x="${i * 130 - 60}" y="-300" width="3" height="2520" fill="${AZUL}" opacity=".12"/>`).join('')}`},
    {f: 1, prof: 1, svg: `<g class="ob" filter="drop-shadow(0 30px 40px rgba(0,0,0,.45))">${ob}</g><g class="duda"><circle cx="880" cy="430" r="80" fill="#ff7a3d"/><text x="880" y="465" text-anchor="middle" font-family="${F1}" font-weight="900" font-size="100" fill="#fff">?</text></g>`}]});
  const SL = [...e2.capas[1].svg.querySelectorAll('.sl')], duda = e2.capas[1].svg.querySelector('.duda'), obG = e2.capas[1].svg.querySelector('.ob');
  const tick = t => { const its = [1, 2, 3].map(FI); SL.forEach((s, i) => { const it = its[i]; const k = it ? win(t, it.t - .05, it.t + .3) : 0; s.style.opacity = .35 + .65 * (k > 0 ? 1 : 0);
      s.querySelector('.chk').setAttribute('transform', s.querySelector('.chk').getAttribute('transform').replace(/ scale\([^)]*\)/, '') + ` scale(${k > 0 ? backOut(k, 2.6) : 0})`); });
    const fi = V.frases.filter(f => f.item).sort((a, b) => a.t - b.t)[0]; const k0 = fi ? win(t, fi.t - .3, fi.t) : 0; duda.setAttribute('opacity', 1 - k0); duda.setAttribute('transform', `rotate(${Math.sin(t * 6) * 8} 880 430)`); };
  // apertura opcional: llave que gira
  const e3 = O.esc({nombre: 'llave', fondo: TINTA, capas: [{f: .4, prof: .3, svg: `<rect x="-300" y="-300" width="1680" height="2520" fill="${TINTA}"/><circle cx="540" cy="900" r="520" fill="${AZUL}" opacity=".18"/>`},
    {f: 1, prof: 1, svg: `<g class="key"><circle cy="-330" r="70" fill="none" stroke="#dfe5ee" stroke-width="16"/><rect x="-150" y="-300" width="300" height="440" rx="120" fill="#0b0d12"/><image href="autos.png" x="-70" y="-250" width="140" height="188"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-20 + i * 70}" r="26" fill="#1e2128"/>`).join('')}<rect x="-30" y="140" width="60" height="420" rx="8" fill="#cfd6e0"/>${[0, 1, 2, 3].map(i => `<rect x="${i % 2 ? 10 : -50}" y="${200 + i * 80}" width="40" height="40" fill="#cfd6e0"/>`).join('')}</g>`}]});
  const key = e3.capas[1].svg.querySelector('.key');
  const tomaLlave = {esc: e3, cam: k => ({x: 540, y: 960, z: lerp(1.25, 1.0, easeOut(k)), foco: 1}), act: (t, k) => key.setAttribute('transform', `translate(540,920) rotate(${lerp(-90, 0, easeOut(k))}) scale(1.05)`)};
  const T = V.frases; const f1 = T[1], f2 = T[2];
  const tomaLugar = (t0, cam, modo, mano) => ({t0, esc: e1, cam, act: t => { grupo(t, modo); manoPj(habla, mano); }, boca: sobre(e1, 1, habla.pj)});
  const tomaObj = (t0, cam, tr) => ({t0, esc: e2, tr, cam, act: t => { tick(t); obG.setAttribute('transform', `translate(540,960) scale(${1 + .015 * Math.sin(t * 2)}) translate(-540,-960)`); }});
  const tomas = [];
  tomas.push(tomaLugar(0, k => ({X: cx + (camC.x0 || 0), Y: lerp(1230, 1210, k), z: lerp(1.9, 2.05, ease(k)), foco: 1, ap: 4}), 'conflicto', C.mano));
  tomas.push(tomaLugar(f1.t - .05, k => ({X: lerp(760, 820, k), Y: lerp(1200, 1180, k), z: lerp(1.15, 1.25, ease(k)), foco: 1, ap: 6}), 'conflicto', C.mano));
  const PJ1 = PJS[habla.id]; const G = gigante(O, {pj: PJ1, doc: C.doc || C.titulo, papel: ['#9fb6d6', '#e8f0fb', '#ffffff'], renglon: '#b9c9e0', tinta: NAVY, cielo: ['#0E4EB2', '#020C47', '#000521'], acento: AZUL, objeto: C.gobj || 'llave', fuente: 'Archivo'});
  const tg = f1.t + Math.min(1.1, (f1.fin - f1.t) * .5); tomas.push(G.toma(tg, f2.t - .05));
  tomas.push(tomaObj(f2.t - .05, k => ({x: 540, y: lerp(1080, 1030, ease(k)), z: lerp(.9, .98, k), r: lerp(-2, 1, k), foco: 1}), 'zoom'));
  // frases intermedias (entre la 3.ª y el primer punto): alternan lugar y objeto, salvo la del giro
  const i1 = V.frases.filter(f => f.item).sort((a, b) => a.t - b.t)[0]; const gF = F('giro') || T[3]; const GI = giro(O, C.giro, Object.assign({}, C, C.giroCfg || {}), PJS[C.giroPj || habla.id]);
  T.forEach((f, i) => { if (i < 3 || f.item || f.cta || f.marca === 'alivio' || (i1 && f.t >= i1.t)) return;
    if (f === gF) tomas.push(GI.toma(f.t - .05));
    else if (!(tomas.length && tomas[tomas.length - 1].esc === GI.esc)) tomas.push(i % 2 ? tomaLugar(f.t - .05, k => ({X: lerp(620, 700, k), Y: 1180, z: lerp(1.5, 1.6, k), foco: 1, ap: 5}), 'neutro', C.mano) : tomaObj(f.t - .05, k => ({x: 540, y: lerp(1020, 1060, k), z: lerp(.96, 1.02, k), foco: 1})));
  });
  if (!tomas.some(s => s.esc === GI.esc)) tomas.push(GI.toma(gF.t - .05));
  [1, 2, 3].forEach(n => { const it = FI(n); if (!it) return; const y = ROWS[n - 1] + (C.objeto === 'tablero' ? 60 : 0);
    tomas.push(tomaObj(it.t - .08, k => ({x: 540 + (n === 2 ? -1 : 1) * lerp(24, 0, k), y: lerp(1070 + (y - 950) * .25, 1045 + (y - 950) * .25, ease(k)), z: lerp(1.0, 1.05, k), r: (n - 2) * lerp(1.5, 0, k), foco: 1}), n === 1 ? 'zoom' : n === 2 ? 'h' : 'v')); });
  const al = F('alivio'); if (al) tomas.push(tomaLugar(al.t - .1, k => ({X: lerp(cx - 40, cx, k), Y: 1210, z: lerp(1.7, 1.8, ease(k)), foco: 1, ap: 4}), 'alivio', C.manoAlivio ?? C.mano));
  tomas.push(Object.assign(tomaLugar(cta.t - .3, k => ({X: 800, Y: 1200, z: lerp(1.3, 1.4, k), foco: 1, ap: 10}), 'alivio', C.manoAlivio ?? C.mano), {boca: null}));
  tomas.push(Object.assign(tomaLugar(V.total - .4, k => ({X: cx, Y: 1230, z: 1.9, foco: 1, ap: 4}), 'conflicto', C.mano), {boca: null}));
  O.tomas = tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f2.t - .05]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f2.t - .05 ? .45 * Math.exp(-(t - f2.t + .05) * 10) : 0);
  const abre = C.ap === 'llave' ? tomaLlave : C.ap === 'objeto' ? tomaObj(0, k => ({x: 540, y: 960, z: lerp(1.6, 1.0, easeOut(k)), foco: 1})) : C.ap === 'giro' ? GI.toma(0) : C.ap === 'final' ? tomaLugar(0, k => ({X: cx, Y: 1210, z: lerp(2.2, 1.8, k), foco: 1, ap: 4}), 'alivio', C.manoAlivio ?? C.mano) : C.ap === 'pov' ? tomaLugar(0, k => ({X: 1060, Y: lerp(1150, 1250, k), z: lerp(2.6, 2.2, k), r: lerp(-6, 0, k), foco: 1, ap: 8}), 'conflicto', C.mano) : null;
  if (abre) { abre.boca = null; abre.tr = 'zoom'; }
  variar(O, C, abre);
  return O;
}
