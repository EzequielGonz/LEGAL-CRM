// Decorados de Buenos Aires y objetos de marca en SVG (ilustración propia): cielo, esquina de barrio con kiosco, avenida con
// el Obelisco y un colectivo, interiores (oficina, living, PH, concesionario, local), auto, celular, papel, sello, lupa, ticket.
import {hash, id} from './base.js';
const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255; const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); return `rgb(${f(r)},${f(g)},${f(b)})`; };
export {sh};
const blur = (i, s) => `<filter id="${i}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`;

export function cielo({w = 1600, h = 1920, top = '#1b2a55', mid = '#e7956a', bot = '#f6c58f', estrellas = 0, sol = null}) {
  const g = id('cg'); let s = `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${bot}"/></linearGradient>${blur(g + 'b', 40)}</defs><rect width="${w}" height="${h}" fill="url(#${g})"/>`;
  for (let i = 0; i < estrellas; i++) s += `<circle cx="${hash(i) * w}" cy="${hash(i * 3.1) * h * .4}" r="${hash(i * 7) * 1.6 + .4}" fill="#fff" opacity="${.3 + hash(i * 5) * .5}"/>`;
  if (sol) s += `<circle cx="${sol[0]}" cy="${sol[1]}" r="${sol[2]}" fill="${sol[3]}" opacity=".9" filter="url(#${g}b)"/>`;
  return s;
}
export function skyline({w = 1600, base = 1100, color = '#2a3560', obelisco = null, ventanas = .0, seed = 1}) {
  let s = '', x = -20;
  while (x < w) { const bw = 60 + hash(x * .7 + seed) * 120, bh = 160 + hash(x * 1.3 + seed) * 420; s += `<rect x="${x}" y="${base - bh}" width="${bw}" height="${bh + 400}" fill="${color}"/>`;
    if (ventanas) for (let yy = base - bh + 20; yy < base - 20; yy += 26) for (let xx = x + 10; xx < x + bw - 12; xx += 20) if (hash(xx * 3.3 + yy * 1.7 + seed) < ventanas) s += `<rect x="${xx}" y="${yy}" width="8" height="12" fill="#ffd38a" opacity="${.5 + hash(xx + yy) * .5}"/>`;
    x += bw + 6; }
  if (obelisco) { const [ox, oy, oh, oc] = obelisco; s += `<path d="M${ox - 22},${oy} L${ox - 13},${oy - oh} L${ox},${oy - oh - 34} L${ox + 13},${oy - oh} L${ox + 22},${oy} Z" fill="${oc}"/><path d="M${ox},${oy - oh - 34} L${ox + 13},${oy - oh} L${ox + 22},${oy} L${ox + 4},${oy} Z" fill="#000" opacity=".12"/>`; }
  return s;
}
export function auto({x = 0, y = 0, s = 1, color = '#c9ccd2', abollado = false, flip = 1, brillo = .5}) {
  const g = id('au'); return `<g transform="translate(${x},${y}) scale(${s * flip},${s})"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(color, .25)}"/><stop offset=".55" stop-color="${color}"/><stop offset="1" stop-color="${sh(color, -.35)}"/></linearGradient>${blur(g + 'f', 8)}</defs>
    <ellipse cx="0" cy="6" rx="250" ry="18" fill="#000" opacity=".35" filter="url(#${g}f)"/>
    <path d="M-240,-20 C-242,-60 -230,-78 -200,-84 L-130,-92 C-100,-128 -60,-150 0,-152 C60,-152 110,-140 150,-100 L210,-90 C238,-84 246,-60 244,-30 L240,-12 L-236,-12 Z" fill="url(#${g})"/>
    <path d="M-112,-96 C-86,-126 -54,-140 -6,-140 L-6,-96 Z" fill="#1b2433" opacity=".88"/><path d="M6,-140 C52,-140 92,-130 128,-98 L6,-96 Z" fill="#1b2433" opacity=".88"/>
    <path d="M-100,-100 C-80,-122 -50,-134 -20,-136 L-30,-104 Z" fill="#fff" opacity=".18"/>
    <path d="M-236,-56 L236,-58" stroke="${sh(color, -.25)}" stroke-width="3" opacity=".6"/>
    <rect x="200" y="-74" width="34" height="14" rx="6" fill="#ffe9b0"/><rect x="-238" y="-72" width="22" height="12" rx="5" fill="#c0392b"/>
    ${abollado ? `<path d="M168,-62 q16,10 30,-2 q8,14 26,6 l4,30 l-62,4 z" fill="${sh(color, -.4)}"/><path d="M176,-58 l50,22 M182,-40 l40,-6" stroke="#2a2a2a" stroke-width="3" opacity=".6"/>` : ''}
    ${[-150, 150].map(c => `<circle cx="${c}" cy="-12" r="46" fill="#15171c"/><circle cx="${c}" cy="-12" r="27" fill="#9aa0a8"/><circle cx="${c}" cy="-12" r="9" fill="#555b64"/>`).join('')}
    <rect x="-246" y="-34" width="${brillo * 480}" height="4" fill="#fff" opacity=".25"/></g>`;
}
export function colectivo({x = 0, y = 0, s = 1, color = '#d8352a', franja = '#f2c037', linea = '152'}) {
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-330" y="-300" width="660" height="280" rx="26" fill="${color}"/><rect x="-330" y="-120" width="660" height="34" fill="${franja}"/>
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${-300 + i * 118}" y="-270" width="100" height="120" rx="10" fill="#1f2a3a" opacity=".9"/><rect x="${-296 + i * 118}" y="-266" width="40" height="112" rx="8" fill="#fff" opacity=".12"/>`).join('')}
    <rect x="252" y="-292" width="64" height="40" rx="6" fill="#111"/><text x="284" y="-262" font-family="Archivo" font-weight="800" font-size="28" fill="#ffb300" text-anchor="middle">${linea}</text>
    ${[-210, 210].map(c => `<circle cx="${c}" cy="-20" r="44" fill="#121318"/><circle cx="${c}" cy="-20" r="20" fill="#8e949c"/>`).join('')}</g>`;
}
export function arbol({x, y, s = 1, c = '#3f6b45'}) {
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-10,0 C-6,-120 -16,-220 -4,-300 L8,-300 C14,-210 10,-110 14,0 Z" fill="#4a3a2c"/>
    ${[[-60, -330, 110], [50, -360, 120], [0, -440, 120], [-90, -420, 90], [90, -440, 90], [10, -300, 90]].map(([a, b, r], i) => `<circle cx="${a}" cy="${b}" r="${r}" fill="${sh(c, (i % 3) * .08 - .08)}"/>`).join('')}</g>`;
}
// esquina de barrio con kiosco, balcones y vereda (w ancho para paneos)
export function barrio({w = 1700, piso = 1460, hora = 'tarde', kiosco = true}) {
  const noche = hora === 'noche'; let s = '';
  const fach = ['#e8d3b5', '#d9a98a', '#c7d1c9', '#e9c9a1', '#bfa8c2', '#d6c3a5'];
  let x = -40, i = 0;
  while (x < w) { const fw = 300 + hash(i + 3) * 140, fh = 560 + hash(i * 2 + 1) * 380, c = fach[i % fach.length]; const top = piso - fh;
    s += `<rect x="${x}" y="${top}" width="${fw}" height="${fh}" fill="${noche ? sh(c, -.55) : c}"/><rect x="${x}" y="${top}" width="${fw}" height="18" fill="${sh(c, -.25)}"/>`;
    for (let k = 0; k < 2; k++) { const wy = top + 90 + k * 230; if (wy > piso - 330) break; const wx = x + 50 + (k % 2) * 10;
      s += `<rect x="${wx}" y="${wy}" width="${fw - 100}" height="150" rx="8" fill="${noche ? (hash(i * 9 + k) > .4 ? '#ffcf86' : '#253048') : '#7f94a8'}" opacity="${noche ? .9 : .75}"/>
        <rect x="${wx - 16}" y="${wy + 150}" width="${fw - 68}" height="12" fill="${sh(c, -.35)}"/>${[...Array(9)].map((_, j) => `<rect x="${wx - 10 + j * (fw - 80) / 8}" y="${wy + 110}" width="5" height="42" fill="#2b2b2b" opacity=".7"/>`).join('')}
        <rect x="${wx - 16}" y="${wy + 104}" width="${fw - 68}" height="6" fill="#2b2b2b" opacity=".8"/>
        ${hash(i * 4 + k) > .5 ? `<circle cx="${wx + 20}" cy="${wy + 96}" r="22" fill="#4f7d4f"/><circle cx="${wx + 44}" cy="${wy + 100}" r="16" fill="#62915a"/>` : ''}`; }
    if (kiosco && i === 1) { s += `<rect x="${x + 30}" y="${piso - 300}" width="${fw - 60}" height="300" fill="#2b2e36"/><rect x="${x + 20}" y="${piso - 360}" width="${fw - 40}" height="70" rx="6" fill="#d7262e"/>
        <text x="${x + fw / 2}" y="${piso - 312}" font-family="Archivo" font-weight="900" font-size="44" fill="#fff" text-anchor="middle" letter-spacing="2">KIOSCO</text>
        <rect x="${x + 50}" y="${piso - 270}" width="${fw - 100}" height="200" fill="${noche ? '#ffe2a8' : '#cfe3ef'}" opacity="${noche ? .95 : .85}"/>
        ${[...Array(18)].map((_, j) => `<rect x="${x + 60 + (j % 6) * (fw - 120) / 6}" y="${piso - 255 + Math.floor(j / 6) * 62}" width="${(fw - 140) / 6}" height="44" rx="4" fill="${['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'][j % 6]}" opacity=".85"/>`).join('')}
        <rect x="${x + 20}" y="${piso - 60}" width="${fw - 40}" height="60" fill="#3a3d46"/>`; }
    else { s += `<rect x="${x + fw / 2 - 55}" y="${piso - 250}" width="110" height="250" rx="6" fill="${sh(c, -.5)}"/><circle cx="${x + fw / 2 + 32}" cy="${piso - 120}" r="6" fill="#d4b06a"/>`; }
    x += fw; i++; }
  s += `<rect x="-200" y="${piso}" width="${w + 400}" height="70" fill="${noche ? '#5d5a57' : '#bdb6ab'}"/><rect x="-200" y="${piso}" width="${w + 400}" height="10" fill="#fff" opacity=".18"/>
    ${[...Array(30)].map((_, j) => `<rect x="${-200 + j * 80}" y="${piso + 4}" width="2" height="62" fill="#000" opacity=".12"/>`).join('')}
    <rect x="-200" y="${piso + 70}" width="${w + 400}" height="24" fill="${noche ? '#3c3a38' : '#8c867d'}"/><rect x="-200" y="${piso + 94}" width="${w + 400}" height="600" fill="${noche ? '#24262b' : '#55585e'}"/>
    ${[...Array(14)].map((_, j) => `<rect x="${-100 + j * 160}" y="${piso + 240}" width="90" height="10" fill="#e9e4d6" opacity=".55"/>`).join('')}`;
  return s;
}
export function farol({x, y, alto = 520, noche = true}) {
  const g = id('fa'); return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#ffd890" stop-opacity=".75"/><stop offset="1" stop-color="#ffd890" stop-opacity="0"/></radialGradient></defs>
    <rect x="${x - 7}" y="${y - alto}" width="14" height="${alto}" fill="#2a2c33"/><path d="M${x},${y - alto} q60,-10 80,20" stroke="#2a2c33" stroke-width="10" fill="none"/>
    <path d="M${x + 62},${y - alto + 10} l36,0 l-6,22 l-24,0 z" fill="#2a2c33"/>${noche ? `<circle cx="${x + 80}" cy="${y - alto + 40}" r="160" fill="url(#${g})"/><ellipse cx="${x + 80}" cy="${y - alto + 36}" rx="14" ry="6" fill="#fff6dc"/>` : ''}`;
}
// interior genérico: pared, piso, zócalo, ventana con vista (día/noche) y luz de ventana
export function interior({w = 1500, pared = '#d9cdb8', piso = '#8a6b4f', pisoY = 1420, ventana = [880, 520, 420, 520], vista = 'dia', zocalo = '#efe6d6', luz = '#ffe3b0', cuadro = null}) {
  const g = id('in'); const [vx, vy, vw, vh] = ventana || [0, 0, 0, 0];
  let s = `<defs><linearGradient id="${g}p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(pared, -.12)}"/><stop offset=".6" stop-color="${pared}"/><stop offset="1" stop-color="${sh(pared, -.18)}"/></linearGradient>
    <linearGradient id="${g}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(piso, .08)}"/><stop offset="1" stop-color="${sh(piso, -.3)}"/></linearGradient>
    <linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${luz}" stop-opacity=".5"/><stop offset="1" stop-color="${luz}" stop-opacity="0"/></linearGradient>${blur(g + 'b', 24)}</defs>
    <rect x="-100" y="0" width="${w + 200}" height="${pisoY}" fill="url(#${g}p)"/>`;
  if (ventana) s += `<rect x="${vx - 18}" y="${vy - 18}" width="${vw + 36}" height="${vh + 36}" rx="6" fill="${sh(pared, -.3)}"/>
    <svg x="${vx}" y="${vy}" width="${vw}" height="${vh}" viewBox="0 0 ${vw} ${vh}">${vista === 'noche' ? cielo({w: vw, h: vh, top: '#0b1430', mid: '#1f2d58', bot: '#3a3f6a', estrellas: 30}) + skyline({w: vw, base: vh + 30, color: '#151c36', ventanas: .25, obelisco: [vw * .62, vh + 30, vh * .7, '#c9c6d8']})
      : cielo({w: vw, h: vh, top: '#8cc4ea', mid: '#cfe6f3', bot: '#f2efe4'}) + skyline({w: vw, base: vh + 30, color: '#b9c3cf', ventanas: 0, obelisco: [vw * .6, vh + 30, vh * .72, '#f4f1ea']})}</svg>
    <rect x="${vx + vw / 2 - 6}" y="${vy}" width="12" height="${vh}" fill="${sh(pared, -.3)}"/><rect x="${vx}" y="${vy + vh * .45}" width="${vw}" height="10" fill="${sh(pared, -.3)}"/>
    <path d="M${vx},${vy + vh} L${vx + vw},${vy + vh} L${vx + vw - 160},${pisoY + 380} L${vx - 360},${pisoY + 380} Z" fill="url(#${g}l)" opacity="${vista === 'noche' ? .25 : .7}" filter="url(#${g}b)"/>`;
  if (cuadro) s += cuadro;
  s += `<rect x="-100" y="${pisoY - 26}" width="${w + 200}" height="26" fill="${zocalo}"/><rect x="-100" y="${pisoY}" width="${w + 200}" height="${1920 - pisoY + 400}" fill="url(#${g}f)"/>
    ${[...Array(12)].map((_, j) => `<rect x="${-100 + j * 150}" y="${pisoY}" width="3" height="900" fill="#000" opacity=".08"/>`).join('')}`;
  return s;
}
export const planta = ({x, y, s = 1}) => `<g transform="translate(${x},${y}) scale(${s})"><path d="M-46,0 L-38,-90 L38,-90 L46,0 Z" fill="#c77b4f"/><rect x="-42" y="-96" width="84" height="12" rx="4" fill="#b56a40"/>
  ${[...Array(9)].map((_, i) => { const a = -1.4 + i * .35; return `<path d="M0,-90 Q${Math.cos(a) * 40},${-150 - i % 3 * 20} ${Math.cos(a) * 110},${-120 - Math.abs(Math.sin(a)) * 160}" stroke="${i % 2 ? '#3f7a4a' : '#5b9a5e'}" stroke-width="16" stroke-linecap="round" fill="none"/>`; }).join('')}</g>`;
export const mesa = ({x, y, w = 520, h = 22, c = '#6b4c34', patas = 300}) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="6" fill="${c}"/><rect x="${x - w / 2}" y="${y}" width="${w}" height="6" fill="#fff" opacity=".15"/>
  <rect x="${x - w / 2 + 24}" y="${y + h}" width="18" height="${patas}" fill="${sh(c, -.25)}"/><rect x="${x + w / 2 - 42}" y="${y + h}" width="18" height="${patas}" fill="${sh(c, -.25)}"/>`;
export const silla = ({x, y, c = '#3a3f4a', flip = 1}) => `<g transform="translate(${x},${y}) scale(${flip},1)"><rect x="-60" y="-140" width="120" height="16" rx="6" fill="${c}"/><rect x="-60" y="-124" width="12" height="124" fill="${sh(c, -.2)}"/><rect x="48" y="-124" width="12" height="124" fill="${sh(c, -.2)}"/><rect x="-62" y="-330" width="16" height="200" rx="6" fill="${c}"/></g>`;
export const sofa = ({x, y, c = '#4b5d7a'}) => `<g transform="translate(${x},${y})"><rect x="-300" y="-260" width="600" height="150" rx="40" fill="${sh(c, -.12)}"/><rect x="-320" y="-130" width="640" height="110" rx="30" fill="${c}"/><rect x="-340" y="-200" width="70" height="190" rx="30" fill="${sh(c, -.08)}"/><rect x="270" y="-200" width="70" height="190" rx="30" fill="${sh(c, -.08)}"/><rect x="-300" y="-20" width="20" height="20" fill="#222"/><rect x="280" y="-20" width="20" height="20" fill="#222"/></g>`;
export const lampara = ({x, y, on = true}) => { const g = id('lp'); return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="#ffd59a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd59a" stop-opacity="0"/></radialGradient></defs>
  <rect x="${x - 4}" y="${y - 420}" width="8" height="420" fill="#2c2c2c"/><path d="M${x - 70},${y - 420} L${x + 70},${y - 420} L${x + 46},${y - 500} L${x - 46},${y - 500} Z" fill="#e8dcc2"/>${on ? `<circle cx="${x}" cy="${y - 420}" r="260" fill="url(#${g})"/>` : ''}<ellipse cx="${x}" cy="${y}" rx="60" ry="10" fill="#2c2c2c"/>`; };
export function calendario({x, y, s = 1, dia = 'HOY', mes = 'NOVIEMBRE', acento = '#D4AF37'}) {
  { const m = /^(\d{1,2})\s*DIC$/.exec(dia); if (m && mes === 'NOVIEMBRE') { dia = m[1]; mes = 'DICIEMBRE'; } }
  return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-120" y="-150" width="240" height="300" rx="14" fill="#fbfaf6"/><rect x="-120" y="-150" width="240" height="70" rx="14" fill="${acento}"/><rect x="-120" y="-100" width="240" height="20" fill="${acento}"/>
    <text x="0" y="-104" font-family="Manrope" font-weight="800" font-size="26" fill="#fff" text-anchor="middle" letter-spacing="2">${mes}</text><text class="dia" x="0" y="60" font-family="Manrope" font-weight="800" font-size="${dia.length > 3 ? 64 : 96}" fill="#25282b" text-anchor="middle">${dia}</text>
    <circle cx="-70" cy="-158" r="8" fill="#555"/><circle cx="70" cy="-158" r="8" fill="#555"/></g>`;
}
export const cartel = ({x, y, w = 420, h = 110, txt, bg = '#112250', fg = '#D4AF37', f = 'Playfair Display', fs = 54, w8 = 700}) =>
  `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${h}" rx="10" fill="${bg}"/><rect x="${x - w / 2 + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="6" fill="none" stroke="${fg}" stroke-width="2" opacity=".7"/>
   <text x="${x}" y="${y + h / 2 + fs * .34}" font-family="${f}" font-weight="${w8}" font-size="${fs}" fill="${fg}" text-anchor="middle">${txt}</text>`;
export const percha = ({x, y, colores}) => `<rect x="${x - 230}" y="${y - 500}" width="460" height="10" rx="5" fill="#9a9a9a"/><rect x="${x - 230}" y="${y - 500}" width="10" height="500" fill="#8a8a8a"/><rect x="${x + 220}" y="${y - 500}" width="10" height="500" fill="#8a8a8a"/>
  ${colores.map((c, i) => `<path d="M${x - 200 + i * 60},${y - 490} l-30,30 l0,190 l60,0 l0,-190 z" fill="${c}"/><path d="M${x - 200 + i * 60},${y - 490} l-30,30 l0,190" stroke="#000" opacity=".15" stroke-width="6" fill="none"/>`).join('')}`;
