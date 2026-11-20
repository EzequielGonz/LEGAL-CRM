// Autos · kit de mini historias del cronograma x2 (21 al 29/11). Cada reel (historias/autos-<id>.js) elige con su cfg:
//   lugar  · dónde pasa (conce, cocina, taller, calle) y quiénes están (juli, mati, leo, tano)
//   abre   · cómo arranca (lugar, pov con el celular, objeto en primer plano, final que rebobina)
//   obj    · el objeto de la marca en primer plano para los 3 puntos (ticket, libreta, chasis, carpeta, fichas, calculadora, llave, celular, calendario, poliza, balanza)
//   irreal · el plano irreal del giro (vidrio, llaveTunel, invertido, elevador, haz, moneda, hojas, ascensor, gigante, caida)
//   grade, cam · grado de color y estilo de cámara (comun.js)
// Convenciones del guion: frases[0] es el conflicto del segundo 1 (personaje), frases[2] lleva marca='giro' (el golpe del plano irreal
// coincide con el de sonido.py), marca='obj' abre el primer plano del objeto, item=1..3 los puntos, marca='alivio' y cta=1 el cierre.
// Sin precios ni números: los objetos muestran palabras. Palabras destacadas en azul con más contraste (pedido de la responsable, 20/11).
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, wob, clamp, backOut, hash, id} from '../historia/base.js';
import {personaje, caminar} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {realce} from '../historia/realce.js';
import {gigante, caida} from '../historia/irreal.js';
import {poser, luz, PJS, ganchoCss, variar} from './comun.js';
const AZUL = '#207CCF', TINTA = '#000521', NAVY = '#011F65', CIELO = '#8CC8FF', ACC = '#4EC3FF';
const PERS = Object.assign({}, PJS, {tano: {peinado: 'corto', piel: '#d6a07a', pelo: '#4a3626', barba: true, remera: '#7a8c3a', pantalon: '#3b3f47', zapato: '#26262a'}});
const T_ = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Archivo'}" font-weight="${o.w || 900}" font-size="${s}" fill="${o.c || '#fff'}" text-anchor="${o.a || 'middle'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.extra || ''}>${txt}</text>`;
const fondoMarca = (g = id('fm'), c0 = '#0E4EB2') => `<defs><radialGradient id="${g}" cx=".5" cy=".6" r=".8"><stop offset="0" stop-color="${c0}"/><stop offset=".6" stop-color="${NAVY}"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect x="-400" y="-400" width="1880" height="2720" fill="url(#${g})"/>${[...Array(9)].map((_, i) => `<rect x="${i * 140 - 40}" y="-400" width="3" height="2720" fill="${AZUL}" opacity=".14"/>`).join('')}`;
// etiquetas de los 3 puntos (pastillas con tilde) que aparecen de a una
const etiqueta = (x, y, txt, w = 560, s = 1) => `<g class="tag" transform="translate(${x},${y}) scale(${s})"><rect x="${-w / 2}" y="-52" width="${w}" height="104" rx="52" fill="#f7f6f1"/><rect x="${-w / 2}" y="-52" width="${w}" height="104" rx="52" fill="none" stroke="${AZUL}" stroke-width="6"/>
  <circle cx="${-w / 2 + 52}" cy="0" r="34" fill="${AZUL}"/><path d="M${-w / 2 + 36},0 l11,11 l20,-22" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>${T_(-w / 2 + 104, 14, 38, txt, {f: 'Plus Jakarta Sans', w: 800, c: TINTA, a: 'start'})}</g>`;
const tagsVer = (tags, n, t, ts) => tags.forEach((g, i) => { const k = i < n ? backOut(win(t, ts[i], ts[i] + .35), 2.2) : 0; g.style.opacity = i < n ? 1 : 0; const b = g.getAttribute('data-b') || g.getAttribute('transform'); g.setAttribute('data-b', b); g.setAttribute('transform', `${b} scale(${.4 + .6 * k})`); });

// ---------------- LUGARES ----------------
function conceSVG(K) { return `<defs><linearGradient id="cvk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect x="-100" y="0" width="1800" height="1440" fill="#eef2f7"/>${[...Array(7)].map((_, i) => `<rect x="${i * 250}" y="200" width="230" height="1000" fill="#cfe0ef"/><rect x="${i * 250}" y="200" width="230" height="1000" fill="url(#cvk)" opacity=".5"/>`).join('')}
  ${D.skyline({w: 1700, base: 1200, color: '#b8c7d8', obelisco: [1250, 1200, 520, '#f2efe8'], seed: 5}).replace(/<rect/g, '<rect opacity=".55"')}
  <rect x="-100" y="140" width="1800" height="70" fill="${NAVY}"/>${T_(800, 190, 46, 'AUTOMOTORES KOCOS · 0 KM', {ls: 4})}
  <rect x="-100" y="1420" width="1800" height="600" fill="#cfd6df"/><rect x="-100" y="1420" width="1800" height="600" fill="url(#cvk)" opacity=".4"/>`; }
function cocinaSVG(K) { return D.interior({w: 1500, pared: '#f2e6d3', piso: '#a77f5c', ventana: [930, 330, 420, 560], vista: K.noche ? 'noche' : 'dia', zocalo: '#f7efe2', luz: '#fff1d0'}) +
  `<rect x="40" y="250" width="620" height="230" rx="10" fill="#e9d9c1"/>${[0, 1, 2].map(i => `<rect x="${58 + i * 200}" y="268" width="186" height="194" rx="8" fill="#f6ecdc"/><rect x="${140 + i * 200}" y="440" width="24" height="8" rx="4" fill="#b59a7a"/>`).join('')}
  <rect x="40" y="760" width="640" height="300" fill="#e7eef0"/>${[...Array(6)].map((_, i) => [...Array(3)].map((_, j) => `<rect x="${44 + i * 106}" y="${764 + j * 98}" width="102" height="94" fill="#f4f8f9" opacity=".9"/>`).join('')).join('')}
  <rect x="30" y="1050" width="660" height="40" rx="8" fill="#5b4636"/><rect x="40" y="1090" width="640" height="330" fill="#d9c7ae"/>
  <rect x="1360" y="560" width="220" height="860" rx="22" fill="#e8ecef"/><rect x="1360" y="860" width="220" height="8" fill="#c9d0d6"/><rect x="1380" y="640" width="12" height="160" rx="6" fill="#aab3bb"/>
  <rect x="300" y="610" width="160" height="110" rx="10" fill="${NAVY}"/>${T_(380, 680, 34, '0 KM')}`; }
function tallerSVG(K) { return D.interior({w: 1500, pared: '#c9d3da', piso: '#5d6670', ventana: [980, 300, 380, 420], vista: 'dia', zocalo: '#9aa4ad', luz: '#eaf4ff'}) +
  `<rect x="60" y="150" width="760" height="90" rx="10" fill="${NAVY}"/>${T_(440, 212, 46, 'TALLER DE AIRE · MATI', {ls: 3})}
  ${[0, 1, 2].map(i => `<g transform="translate(${130 + i * 250},${330 + (i % 2) * 150})"><rect x="0" y="0" width="210" height="80" rx="16" fill="#f4f6f8"/><rect x="14" y="56" width="182" height="8" rx="4" fill="#c5ccd3"/><circle cx="186" cy="20" r="5" fill="#4EC3FF"/></g>`).join('')}
  <rect x="60" y="880" width="880" height="34" rx="6" fill="#6b4c34"/><rect x="80" y="914" width="24" height="500" fill="#4a3a2a"/><rect x="896" y="914" width="24" height="500" fill="#4a3a2a"/>
  <rect x="120" y="780" width="140" height="100" rx="12" fill="#c0392b"/><rect x="300" y="820" width="240" height="60" rx="8" fill="#d9dee3"/><path d="M600,870 l80,-120 l20,10 l-70,120 z" fill="#9aa1aa"/>
  ${[...Array(8)].map((_, i) => `<rect x="${640 + i * 34}" y="560" width="10" height="${120 + hash(i) * 80}" rx="5" fill="#8a929b"/>`).join('')}<rect x="620" y="540" width="300" height="20" rx="6" fill="#4a5058"/>`; }
function calleSVG(K) { return D.barrio({w: 1700, piso: 1460, hora: K.noche ? 'noche' : 'tarde'}) + `<rect x="1180" y="980" width="420" height="80" rx="10" fill="${NAVY}"/>${T_(1390, 1035, 34, 'AV. CORRIENTES', {ls: 3})}`; }
const LUG = {conce: {svg: conceSVG, fondo: '#dfe7f1', pos: {juli: [320, 1580], mati: [170, 1560], leo: [1420, 1570], tano: [1420, 1560]}, auto: [980, 1540, 1.5, '#1f6fc2'], luz: 'background:linear-gradient(180deg,rgba(255,255,255,.18),transparent 40%),radial-gradient(circle at 70% 70%,rgba(32,124,207,.18),transparent 50%)'},
  cocina: {svg: cocinaSVG, fondo: '#f2e6d3', pos: {juli: [560, 1490], mati: [1000, 1480], leo: [1000, 1480], tano: [1000, 1480]}, mesa: true, luz: 'background:linear-gradient(110deg,transparent 40%,rgba(255,240,210,.45)),linear-gradient(180deg,transparent 60%,rgba(0,10,40,.2))'},
  taller: {svg: tallerSVG, fondo: '#c9d3da', pos: {mati: [560, 1480], tano: [900, 1480], juli: [1040, 1480], leo: [1040, 1480]}, luz: 'background:linear-gradient(100deg,rgba(234,244,255,.35),transparent 50%),linear-gradient(180deg,transparent 60%,rgba(0,10,40,.25))'},
  calle: {svg: calleSVG, fondo: '#bfd2e4', pos: {mati: [520, 1530], juli: [380, 1540], leo: [1300, 1530], tano: [1300, 1530]}, auto: [1060, 1600, 1.45, '#1f6fc2'], luz: 'background:linear-gradient(120deg,rgba(255,220,170,.35),transparent 55%)'}};

// ---------------- OBJETOS (primer plano de los 3 puntos) ----------------
// Cada uno devuelve {svg, upd(t, n)} en coordenadas 1080×1920. n = cantidad de puntos ya dichos (0..3), ts = tiempos de cada punto.
const OBJ = {
  ticket(K) { const it = K.items, ty = 160 + 3 * 120 + 80; const g = id('tk');
    const svg = `<defs><clipPath id="${g}c"><rect x="250" y="-2000" width="580" height="3150"/></clipPath><linearGradient id="${g}m" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b1e24"/><stop offset=".5" stop-color="#3a3f48"/><stop offset="1" stop-color="#16181d"/></linearGradient></defs>
    <g clip-path="url(#${g}c)"><g class="papel"><rect x="270" y="0" width="540" height="${ty + 200}" fill="#f7f6f1"/>
      <g class="fila">${T_(540, 78, 40, K.titulo || 'PRESUPUESTO', {c: '#1b1d22', ls: 2})}<path d="M300,112 L780,112" stroke="#1b1d22" stroke-width="3" stroke-dasharray="10 8"/></g>
      ${it.map((f, i) => `<g class="fila"><circle cx="330" cy="${200 + i * 120}" r="26" fill="${AZUL}"/><path d="M316,${200 + i * 120} l10,10 l18,-20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/>${T_(378, 213 + i * 120, f.length > 22 ? 28 : f.length > 17 ? 32 : 36, f, {f: 'Plus Jakarta Sans', w: 800, c: '#1b1d22', a: 'start'})}</g>`).join('')}
      <g class="fila"><rect x="290" y="${ty - 20}" width="500" height="120" rx="16" fill="${AZUL}"/>${T_(540, ty + 56, 42, K.total || 'LLAVE EN MANO')}</g>
      <path d="M270,${ty + 200} ${[...Array(18)].map(() => 'l15,14 l15,-14').join(' ')}" fill="#f7f6f1"/></g></g>
    <rect x="160" y="1130" width="760" height="430" rx="44" fill="url(#${g}m)"/><rect x="230" y="1150" width="620" height="22" rx="11" fill="#08090b"/><circle cx="820" cy="1300" r="14" fill="#4E9BE4"/><image href="autos.png" x="250" y="1360" width="90" height="120"/>${T_(560, 1440, 44, 'AUTOMOTORES KOCOS', {c: '#cfd6e0'})}`;
    return {svg, init(el) { this.papel = el.querySelector('.papel'); this.filas = [...el.querySelectorAll('.fila')]; },
      upd(t, n, ts) { const m = Math.min(5, n + 1 + (n >= 3 && t > ts[2] + 1.2 ? 1 : 0)); this.filas.forEach((f, i) => f.style.opacity = i < m ? 1 : 0);
        const ti = m <= 1 ? (ts.obj || 0) : ts[Math.min(2, m - 2)] + (m === 5 ? 1.2 : 0); const L = 130 + (m - 1) * 120 + (m >= 5 ? 200 : 0), prev = 130 + Math.max(0, m - 2) * 120; const kk = easeOut(win(t, ti, ti + .35));
        this.papel.setAttribute('transform', `translate(0,${1150 - lerp(m > 1 ? prev : 0, L, kk)})`); }}; },
  libreta(K) { const it = K.items; const svg = `<rect x="-400" y="-400" width="1880" height="2720" fill="#b98a5e"/>${[...Array(18)].map((_, i) => `<rect x="-400" y="${i * 140 - 300}" width="1880" height="4" fill="#8f6744" opacity=".5"/>`).join('')}
    <g transform="translate(590,1080) rotate(-4)"><rect x="-380" y="-560" width="760" height="1080" rx="18" fill="#000" opacity=".25" transform="translate(18,24)"/><rect x="-380" y="-560" width="760" height="1080" rx="18" fill="#fbf7ec"/>
      ${[...Array(14)].map((_, i) => `<rect x="-340" y="${-400 + i * 66}" width="680" height="3" fill="#9cc3e6" opacity=".7"/>`).join('')}<rect x="-300" y="-560" width="4" height="1080" fill="#e58a8a" opacity=".7"/>
      ${[...Array(12)].map((_, i) => `<circle cx="${-330 + i * 60}" cy="-560" r="16" fill="none" stroke="#9aa1aa" stroke-width="8"/>`).join('')}
      ${T_(-270, -440, 58, K.titulo || 'Cuenta del mes', {f: 'Plus Jakarta Sans', w: 800, c: NAVY, a: 'start', extra: ' font-style="italic"'})}
      <g class="ln">${T_(-270, -300, 52, 'Cuota', {f: 'Plus Jakarta Sans', w: 700, c: '#23324d', a: 'start', extra: ' font-style="italic"'})}</g>
      ${it.map((f, i) => `<g class="ln">${T_(-270, -168 + i * 132, 52, '+ ' + f, {f: 'Plus Jakarta Sans', w: 700, c: '#23324d', a: 'start', extra: ' font-style="italic"'})}</g>`).join('')}
      <g class="ln"><path d="M-280,250 L300,250" stroke="${NAVY}" stroke-width="6"/><ellipse cx="10" cy="350" rx="330" ry="80" fill="none" stroke="${AZUL}" stroke-width="8" transform="rotate(-3)"/>${T_(10, 370, 54, K.total || 'CUENTA COMPLETA', {c: AZUL})}</g></g>
    <g class="lapiz"><rect x="-18" y="-360" width="36" height="340" rx="10" fill="#f1c40f"/><rect x="-18" y="-380" width="36" height="40" rx="8" fill="#e58a8a"/><path d="M-18,-20 L18,-20 L0,30 Z" fill="#e8c9a0"/><path d="M-6,14 L6,14 L0,30 Z" fill="#333"/></g>`;
    return {svg, init(el) { this.ln = [...el.querySelectorAll('.ln')]; this.lapiz = el.querySelector('.lapiz'); },
      upd(t, n, ts) { const m = 1 + n + (n >= 3 && t > ts[2] + 1.0 ? 1 : 0); this.ln.forEach((l, i) => { const ti = i === 0 ? -1 : i <= 3 ? ts[i - 1] : ts[2] + 1.0; const k = clamp((t - ti) / .45); l.style.opacity = i < m ? 1 : 0; l.setAttribute('clip-path', ''); l.style.clipPath = i < m ? `inset(0 ${100 - k * 100}% 0 0)` : ''; });
        const li = Math.min(4, m - 1), y = li === 0 ? -300 : li <= 3 ? -168 + (li - 1) * 132 : 370; const ti = li === 0 ? 0 : li <= 3 ? ts[li - 1] : ts[2] + 1.0; const k = clamp((t - ti) / .45);
        this.lapiz.setAttribute('transform', `translate(${590 - 280 + k * 560 + Math.sin(t * 40) * 6},${1080 + y + 10}) rotate(${25 + Math.sin(t * 30) * 4})`); }}; },
  chasis(K) { const g = id('ch'); const svg = `<rect x="-400" y="-400" width="1880" height="2720" fill="#05070f"/><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f80d1"/><stop offset="1" stop-color="#0b2a55"/></linearGradient>
      <radialGradient id="${g}h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe6" stop-opacity=".95"/><stop offset=".6" stop-color="#fff3c4" stop-opacity=".35"/><stop offset="1" stop-color="#fff3c4" stop-opacity="0"/></radialGradient></defs>
    <rect x="-200" y="300" width="1480" height="520" rx="80" fill="url(#${g})"/><rect x="-200" y="300" width="1480" height="60" fill="#fff" opacity=".12"/><rect x="-200" y="700" width="1480" height="120" fill="#0a1a33"/>
    <g transform="translate(540,560)"><rect x="-330" y="-110" width="660" height="220" rx="22" fill="#c9d0d8"/><rect x="-310" y="-90" width="620" height="180" rx="14" fill="#e7ebef"/>${T_(0, -30, 40, 'N.º DE CHASIS', {c: '#3a4352', ls: 4})}
      ${[...Array(11)].map((_, i) => `<rect x="${-260 + i * 48}" y="10" width="34" height="56" rx="4" fill="#3a4352"/>`).join('')}${[[-300, -80], [300, -80], [-300, 80], [300, 80]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#8a929b"/>`).join('')}</g>
    <g class="hz" style="mix-blend-mode:screen"><circle class="spot" r="320" fill="url(#${g}h)"/></g>
    <g transform="translate(960,1500) rotate(-28) scale(.7)"><rect x="-110" y="-230" width="220" height="460" rx="36" fill="#16181d"/><circle cx="-50" cy="-170" r="22" fill="#fffbe6"/></g>
    ${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 820)).join('')}`;
    return {svg, init(el) { this.spot = el.querySelector('.spot'); this.tags = [...el.querySelectorAll('.tag')]; },
      upd(t, n, ts) { const x = 540 + Math.sin(t * 1.6) * 260, y = 560 + Math.cos(t * 2.3) * 60; this.spot.setAttribute('cx', x); this.spot.setAttribute('cy', y); tagsVer(this.tags, n, t, ts); }}; },
  carpeta(K) { const it = K.items; const svg = fondoMarca() + `<g transform="translate(540,1080)"><path d="M-420,-380 L-150,-380 L-110,-430 L420,-430 L420,420 L-420,420 Z" fill="#d9a441"/>
      ${it.map((f, i) => `<g class="hoja"><rect x="-360" y="-500" width="720" height="560" rx="10" fill="#fbfaf6"/><rect x="-360" y="-500" width="720" height="90" rx="10" fill="${[AZUL, NAVY, '#0E4EB2'][i]}"/>${T_(0, -440, 42, ['PAPEL 1', 'PAPEL 2', 'PAPEL 3'][i], {ls: 4})}
        ${T_(0, -300, 50, f, {f: 'Plus Jakarta Sans', w: 800, c: TINTA})}${[...Array(4)].map((_, j) => `<rect x="-280" y="${-220 + j * 56}" width="${380 + hash(i * 5 + j) * 180}" height="14" rx="7" fill="#cdd6e2"/>`).join('')}</g>`).join('')}
      <path d="M-420,-200 L420,-200 L460,420 L-460,420 Z" fill="#e8b552"/><image href="autos.png" x="-60" y="-40" width="120" height="160"/></g>`;
    return {svg, init(el) { this.h = [...el.querySelectorAll('.hoja')]; },
      upd(t, n, ts) { this.h.forEach((h, i) => { const k = i < n ? easeOut(win(t, ts[i], ts[i] + .5)) : 0; h.style.opacity = i < n ? 1 : 0;
        h.setAttribute('transform', `translate(${(i - 1) * 40 * k},${lerp(200, -330 + i * 150, k)}) rotate(${(i - 1) * 4 * k}) scale(${lerp(.8, .74 + i * .02, k)})`); }); }}; },
  fichas(K) { const ficha = (txt, c) => `<circle r="230" fill="#000" opacity=".3" transform="translate(14,20)"/><circle r="230" fill="${c}"/><circle r="200" fill="none" stroke="#fff" stroke-width="10" stroke-dasharray="30 18" opacity=".7"/><circle r="150" fill="#fff" opacity=".12"/>${T_(0, 18, txt.length > 7 ? 54 : 64, txt)}`;
    const svg = `<rect x="-400" y="-400" width="1880" height="2720" fill="#0d5a3c"/>${[...Array(40)].map((_, i) => `<circle cx="${hash(i) * 1080}" cy="${hash(i + 50) * 1920}" r="${2 + hash(i + 9) * 3}" fill="#fff" opacity=".05"/>`).join('')}
      <g class="f1" transform="translate(300,560)">${ficha('SORTEO', AZUL)}</g><g class="f2" transform="translate(780,700)">${ficha('LICITACIÓN', NAVY)}</g>
      <g class="vs">${T_(540, 600, 70, 'o', {f: 'Plus Jakarta Sans', w: 800})}</g>${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 860)).join('')}`;
    return {svg, init(el) { this.f = [el.querySelector('.f1'), el.querySelector('.f2')]; this.tags = [...el.querySelectorAll('.tag')]; },
      upd(t, n, ts) { this.f[0].setAttribute('transform', `translate(300,${540 + Math.sin(t * 2) * 12}) rotate(${Math.sin(t * 1.3) * 8}) scale(.82)`); this.f[1].setAttribute('transform', `translate(780,${600 + Math.cos(t * 2) * 12}) rotate(${Math.cos(t * 1.1) * 8}) scale(.82)`); tagsVer(this.tags, n, t, ts); }}; },
  calculadora(K) { const svg = `<rect x="-400" y="-400" width="1880" height="2720" fill="#b98a5e"/>${[...Array(18)].map((_, i) => `<rect x="-400" y="${i * 140 - 300}" width="1880" height="4" fill="#8f6744" opacity=".5"/>`).join('')}
    <g transform="translate(540,1000) rotate(3)"><rect x="-330" y="-560" width="660" height="1120" rx="60" fill="#000" opacity=".3" transform="translate(20,26)"/><rect x="-330" y="-560" width="660" height="1120" rx="60" fill="#22262e"/>
      <rect x="-280" y="-500" width="560" height="220" rx="20" fill="#bcd9c4"/><g class="disp"></g>
      ${[...Array(16)].map((_, i) => { const c = i % 4, r = Math.floor(i / 4); const lab = ['7', '8', '9', '÷', '4', '5', '6', '×', '1', '2', '3', '−', 'C', '0', '=', '+'][i]; return `<g class="tecla" data-i="${i}"><rect x="${-270 + c * 140}" y="${-220 + r * 170}" width="120" height="140" rx="22" fill="${lab === '=' ? AZUL : '#3a404b'}"/>${T_(-210 + c * 140, -125 + r * 170, 56, lab, {f: 'Plus Jakarta Sans', w: 700, c: '#e9edf2'})}</g>`; }).join('')}
      <image href="autos.png" x="190" y="430" width="70" height="94"/></g>`;
    return {svg, init(el) { this.d = el.querySelector('.disp'); this.eq = el.querySelector('.tecla[data-i="14"] rect'); },
      upd(t, n, ts) { const w = n === 0 ? (K.disp0 || '¿?') : K.disp[Math.min(n, K.disp.length) - 1]; const blink = (t * 2) % 1 < .5;
        this.d.innerHTML = `<text x="250" y="-360" font-family="Archivo" font-weight="900" font-size="${w.length > 12 ? 50 : 68}" fill="#1f3b2a" text-anchor="end">${w}${n < 3 && blink ? '_' : ''}</text>`;
        const pr = ts.some(x => t >= x && t < x + .2); this.eq.setAttribute('fill', pr ? '#8CC8FF' : AZUL); }}; },
  llave(K) { const svg = fondoMarca() + `<g class="key"><circle cy="-330" r="70" fill="none" stroke="#dfe5ee" stroke-width="16"/><rect x="-150" y="-300" width="300" height="440" rx="120" fill="#0b0d12"/><rect x="-140" y="-290" width="280" height="200" rx="110" fill="#fff" opacity=".06"/>
      <image href="autos.png" x="-70" y="-250" width="140" height="188"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-20 + i * 70}" r="26" fill="#1e2128"/>`).join('')}<rect x="-30" y="140" width="60" height="420" rx="8" fill="#cfd6e0"/>${[0, 1, 2, 3].map(i => `<rect x="${i % 2 ? 10 : -50}" y="${200 + i * 80}" width="40" height="40" fill="#cfd6e0"/>`).join('')}</g>
      ${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 820)).join('')}`;
    return {svg, init(el) { this.k = el.querySelector('.key'); this.tags = [...el.querySelectorAll('.tag')]; },
      upd(t, n, ts) { this.k.setAttribute('transform', `translate(540,${600 + Math.sin(t * 2) * 14}) rotate(${Math.sin(t * 1.4) * 12}) scale(${(Math.cos(t * 1.7) * .25 + .75) * .55},.55)`); tagsVer(this.tags, n, t, ts); }}; },
  celular(K) { const cm = PP.celularMano({piel: PERS.juli.piel, funda: '#c45a3b', manga: PERS.juli.campera});
    const scr = `<rect x="190" y="250" width="700" height="1460" fill="#f4f7fb"/><rect x="190" y="250" width="700" height="220" fill="${NAVY}"/><image href="autos.png" x="230" y="320" width="70" height="94"/>${T_(330, 390, 42, K.titulo || 'Mi lista', {a: 'start'})}
      ${K.items.map((f, i) => `<g class="it"><rect x="230" y="${560 + i * 220}" width="620" height="180" rx="26" fill="#fff" stroke="#d7e2ef" stroke-width="4"/><circle cx="310" cy="${650 + i * 220}" r="40" fill="${AZUL}"/><path d="M290,${650 + i * 220} l14,14 l26,-28" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>
      <foreignObject x="370" y="${590 + i * 220}" width="460" height="130"><div xmlns="http://www.w3.org/1999/xhtml" style="font:800 40px 'Plus Jakarta Sans';color:${TINTA};line-height:1.1;display:flex;align-items:center;height:130px">${f}</div></foreignObject></g>`).join('')}`;
    const svg = fondoMarca() + `<g transform="translate(70,40) scale(.88)">${cm.svg.replace('<g class="pantalla"></g>', `<g class="pantalla">${scr}</g>`)}</g>`;
    return {svg, init(el) { this.it = [...el.querySelectorAll('.it')]; }, upd(t, n, ts) { this.it.forEach((g, i) => { const k = i < n ? easeOut(win(t, ts[i], ts[i] + .3)) : 0; g.style.opacity = k; g.setAttribute('transform', `translate(${(1 - k) * 120},0)`); }); }}; },
  calendario(K) { const svg = fondoMarca() + `<g class="c1">${D.calendario({x: 320, y: 560, s: 1.25, dia: K.cal ? K.cal[0] : 'DIC', mes: 'ESTE AÑO', acento: AZUL})}</g><g class="c2">${D.calendario({x: 760, y: 590, s: 1.25, dia: K.cal ? K.cal[1] : 'ENE', mes: 'AÑO QUE VIENE', acento: NAVY})}</g>
      ${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 860)).join('')}`;
    return {svg, init(el) { this.c = [el.querySelector('.c1'), el.querySelector('.c2')]; this.tags = [...el.querySelectorAll('.tag')]; },
      upd(t, n, ts) { this.c[0].setAttribute('transform', `rotate(${Math.sin(t * 1.5) * 4},320,560)`); this.c[1].setAttribute('transform', `rotate(${Math.cos(t * 1.3) * 4},760,590)`); tagsVer(this.tags, n, t, ts); }}; },
  poliza(K) { const svg = fondoMarca() + `<g class="esc" transform="translate(540,720)"><path d="M0,-330 L260,-230 L240,90 Q200,260 0,360 Q-200,260 -240,90 L-260,-230 Z" fill="#f7f6f1"/><path d="M0,-280 L210,-196 L194,80 Q160,220 0,300 Q-160,220 -194,80 L-210,-196 Z" fill="${AZUL}"/>
      <image href="autos.png" x="-70" y="-150" width="140" height="188"/>${T_(0, 170, 46, 'PÓLIZA')}</g>${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 860)).join('')}`;
    return {svg, init(el) { this.e = el.querySelector('.esc'); this.tags = [...el.querySelectorAll('.tag')]; }, upd(t, n, ts) { this.e.setAttribute('transform', `translate(540,${560 + Math.sin(t * 2) * 10}) scale(${.68 + Math.max(0, Math.sin(t * 5)) * .015})`); tagsVer(this.tags, n, t, ts); }}; },
  balanza(K) { const svg = fondoMarca() + `<g transform="translate(540,560) scale(.82)"><rect x="-14" y="-200" width="28" height="560" fill="#cfd6e0"/><path d="M-160,360 L160,360 L120,320 L-120,320 Z" fill="#cfd6e0"/><circle cy="-210" r="30" fill="${AZUL}"/>
      <g class="brazo"><rect x="-400" y="-224" width="800" height="24" rx="12" fill="#e9edf2"/><g class="pl"><path d="M-400,-200 L-470,0 M-400,-200 L-330,0" stroke="#e9edf2" stroke-width="6"/><path d="M-500,0 L-300,0 Q-300,60 -400,60 Q-500,60 -500,0 Z" fill="#f7f6f1"/>${T_(-400, 130, 44, K.izq || 'ANTICIPO')}</g>
      <g class="pr"><path d="M400,-200 L330,0 M400,-200 L470,0" stroke="#e9edf2" stroke-width="6"/><path d="M300,0 L500,0 Q500,60 400,60 Q300,60 300,0 Z" fill="#f7f6f1"/>${T_(400, 130, 44, K.der || 'CUOTA', {c: ACC})}</g></g></g>
      ${K.items.map((f, i) => etiqueta(540, 880 + i * 125, f, 860)).join('')}`;
    return {svg, init(el) { this.b = el.querySelector('.brazo'); this.tags = [...el.querySelectorAll('.tag')]; },
      upd(t, n, ts) { const a = n >= 3 ? lerp(-8, 10, easeOut(win(t, ts[2], ts[2] + .8))) : Math.sin(t * 2.4) * 8; this.b.setAttribute('transform', `rotate(${a})`);
        this.b.querySelectorAll('.pl,.pr').forEach((p, i) => { const x = i ? 400 : -400; p.setAttribute('transform', `rotate(${-a},${x},-212)`); }); tagsVer(this.tags, n, t, ts); }}; },
};

// ---------------- PLANOS IRREALES ----------------
// Cada uno: (O, K) → {toma(t0, tc)} con tc = momento del golpe (coincide con el de sonido.py: frases[2].t − 0,05)
const IRR = {
  vidrio(O, K) { const [a, b] = K.vidrio || ['¿PRECIO DE LISTA?', '¿PRECIO FINAL?']; const resp = K.respuesta || 'LLAVE EN MANO';
    const sh = []; const C = 6, Rr = 9; for (let i = 0; i < C; i++) for (let j = 0; j < Rr; j++) { const x0 = 90 + i * 150, y0 = 380 + j * 140, cx = x0 + 75, cy = y0 + 70;
      sh.push([`${x0},${y0} ${x0 + 150},${y0} ${x0},${y0 + 140}`, cx - 25, cy - 25], [`${x0 + 150},${y0} ${x0 + 150},${y0 + 140} ${x0},${y0 + 140}`, cx + 25, cy + 25]); }
    const e = O.esc({nombre: 'irr-vidrio', fondo: TINTA, capas: [{f: .3, prof: .3, svg: fondoMarca()},
      {f: .8, prof: .8, svg: `<g class="resp" opacity="0"><rect x="120" y="760" width="840" height="300" rx="40" fill="${AZUL}"/>${T_(540, 945, resp.length > 16 ? 58 : resp.length > 13 ? 74 : 96, resp)}<image href="autos.png" x="490" y="560" width="100" height="134"/></g>`},
      {f: 1, prof: 1, svg: `<g class="panel"><rect x="90" y="380" width="900" height="630" fill="#e9f3fb" opacity=".93"/><rect x="90" y="1010" width="900" height="630" fill="#cfe4f7" opacity=".93"/><rect x="90" y="1004" width="900" height="12" fill="${NAVY}"/>
        ${T_(540, 640, a.length > 16 ? 64 : 78, a, {c: NAVY})}${T_(540, 1520, b.length > 16 ? 64 : 78, b, {c: AZUL})}</g><g class="grietas"></g><g class="sh">${sh.map(([p]) => `<polygon points="${p}" fill="#dcecf9" opacity=".9" stroke="#fff" stroke-width="3"/>`).join('')}</g>`}]});
    const panel = e.capas[2].svg.querySelector('.panel'), gr = e.capas[2].svg.querySelector('.grietas'), shG = [...e.capas[2].svg.querySelectorAll('.sh polygon')], respG = e.capas[1].svg.querySelector('.resp');
    gr.innerHTML = [...Array(14)].map((_, i) => { const a0 = i / 14 * 6.283 + hash(i) * .3; let p = 'M540,1010'; let r = 0; for (let k = 0; k < 5; k++) { r += 60 + hash(i * 7 + k) * 90; const aa = a0 + (hash(i + k * 3) - .5) * .4; p += ` L${540 + Math.cos(aa) * r},${1010 + Math.sin(aa) * r}`; } return `<path d="${p}" stroke="#fff" stroke-width="5" fill="none"/>`; }).join('');
    return {toma: (t0, tc) => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = t - tc; const sk = d > 0 && d < .5 ? Math.exp(-d * 8) : 0; return {x: 540 + Math.sin(t * 61) * 20 * sk, y: 990 + Math.cos(t * 47) * 14 * sk, z: lerp(1.08, 1.0, ease(k)), r: Math.sin(t * 33) * 2 * sk, foco: 1, ap: 2}; },
      act: t => { const d = t - tc; gr.style.opacity = d > -.25 ? clamp((d + .25) / .2) : 0; panel.style.opacity = d < .12 ? 1 : 0; gr.style.display = d < .12 ? '' : 'none';
        shG.forEach((s, i) => { const [, cx, cy] = sh[i]; if (d < .12) { s.style.opacity = 0; return; } const q = d - .12; const vx = (cx - 540) * (2.2 + hash(i) * 2), vy = (cy - 1010) * (2 + hash(i + 4) * 2) - 300;
          s.style.opacity = clamp(1 - q / 1.1) * .9; s.setAttribute('transform', `translate(${vx * q},${vy * q + 900 * q * q}) rotate(${(hash(i + 8) - .5) * 900 * q},${cx},${cy})`); });
        const kr = backOut(win(t, tc + .2, tc + .7), 2); respG.setAttribute('opacity', clamp(kr)); respG.setAttribute('transform', `translate(540,910) scale(${.5 + .5 * kr}) translate(-540,-910)`); }})}; },
  llaveTunel(O, K) { const e = O.esc({nombre: 'irr-llave', fondo: TINTA, capas: [{f: .2, prof: .2, svg: fondoMarca(id('lt'), '#1660c9') + [...Array(80)].map((_, i) => `<circle cx="${hash(i) * 1080}" cy="${hash(i + 9) * 1920}" r="${1 + hash(i + 3) * 3}" fill="#fff" opacity="${.2 + hash(i + 1) * .6}"/>`).join('')},
      {f: 1, prof: 1, svg: `<g class="k"><circle cy="-330" r="80" fill="none" stroke="#dfe5ee" stroke-width="22"/><rect x="-150" y="-300" width="300" height="440" rx="120" fill="#0b0d12"/><image href="autos.png" x="-70" y="-250" width="140" height="188"/>${[0, 1, 2].map(i => `<circle cx="0" cy="${-20 + i * 70}" r="26" fill="#1e2128"/>`).join('')}<rect x="-30" y="140" width="60" height="420" rx="8" fill="#cfd6e0"/>${[0, 1, 2, 3].map(i => `<rect x="${i % 2 ? 10 : -50}" y="${200 + i * 80}" width="40" height="40" fill="#cfd6e0"/>`).join('')}
        ${(K.llaveTags || ['SEGURO', 'PATENTE', 'COCHERA']).map((s, i) => `<g transform="translate(${-200 + i * 200},-470) rotate(${(i - 1) * 18})"><path d="M0,0 L0,-70" stroke="#dfe5ee" stroke-width="4"/><rect x="-130" y="-170" width="260" height="100" rx="16" fill="#f7f6f1"/>${T_(0, -106, 40, s, {c: NAVY})}</g>`).join('')}</g>`}]});
    const k = e.capas[1].svg.querySelector('.k');
    return {toma: (t0, tc) => ({t0, esc: e, lineas: .25, cam: () => ({x: 540, y: 960, z: 1, foco: 1, ap: 2}), act: t => {
      const d = t - t0, kz = easeIn(clamp((t - tc - .2) / 1.3)); const S = lerp(1.1, 16, kz); const ang = ((d * 140) % 360) * (1 - Math.min(1, kz * 3)), sx = Math.cos(d * 4.2);
      k.setAttribute('transform', `translate(540,${960 + 330 * S * Math.min(1, kz * 1.4)}) scale(${S * (kz > .3 ? 1 : Math.abs(sx) * .8 + .2)},${S}) rotate(${ang})`); }})}; },
  invertido(O, K) { const e = O.esc({nombre: 'irr-invertido', fondo: '#0a1328', capas: [{f: .3, prof: .3, svg: `<rect x="-300" y="-300" width="1680" height="2520" fill="#0a1328"/>${[...Array(8)].map((_, i) => `<g transform="translate(${-80 + i * 170},${-40 + (i % 3) * 60}) scale(1,-1)">${D.auto({x: 0, y: -300, s: .7, color: ['#3a4a66', '#2b3954', '#46587a'][i % 3]})}</g>`).join('')}<rect x="-300" y="-300" width="1680" height="160" fill="#13203d"/>`},
      {f: 1, prof: 1, svg: `${[...Array(9)].map((_, j) => { const y = 1180 + j * j * 14 + j * 40, w = 260 + j * 90; return [...Array(5)].map((_, i) => `<rect x="${540 + (i - 2) * (w + 30) - w / 2}" y="${y}" width="${w}" height="${18 + j * 5}" rx="8" fill="#fffbe6" opacity="${.5 + j * .05}"/>`).join(''); }).join('')}
        <g opacity=".9">${[...Array(6)].map((_, i) => `<path d="M${200 + i * 140},0 L${200 + i * 140},${300 + (i % 2) * 120}" stroke="#7b8aa6" stroke-width="5"/><g transform="translate(${200 + i * 140},${420 + (i % 2) * 120}) scale(.5,-.5)">${D.auto({x: 0, y: 0, s: 1, color: i % 2 ? '#1f6fc2' : '#9aa6bb'})}</g>`).join('')}</g><g class="act"></g>`}]});
    const ch = personaje(e.capas[1].svg.querySelector('.act'), PERS[K.quien || 'juli']);
    return {toma: (t0, tc) => ({t0, esc: e, tr: 'zoom', cam: (k, t) => ({x: 540, y: lerp(1100, 1000, ease(k)), z: lerp(1.15, 1.0, ease(k)), r: lerp(180, 0, easeOut(win(t, t0, tc + .25))), foco: 1, ap: 3}),
      act: t => ch.pose(Object.assign({x: lerp(380, 700, clamp((t - t0) / 3)), y: 1240, s: .55, flip: 1, mira: -.6, ceja: -.6, sonrisa: -.2}, caminar(t, .8)))})}; },
  elevador(O, K) { const e = O.esc({nombre: 'irr-elevador', fondo: '#0c1a33', capas: [{f: .3, prof: .3, svg: fondoMarca(id('el'), '#174f96') + `<rect x="-300" y="1500" width="1680" height="800" fill="#0a1424"/>${[...Array(10)].map((_, i) => `<rect x="${-100 + i * 140}" y="1500" width="4" height="800" fill="#2a3a55"/>`).join('')}`},
      {f: 1, prof: 1, svg: `<rect x="130" y="500" width="50" height="1100" fill="#c9302c"/><rect x="900" y="500" width="50" height="1100" fill="#c9302c"/><g class="pl"><rect x="150" y="0" width="780" height="40" rx="8" fill="#e5e7ea"/><rect x="150" y="40" width="780" height="20" fill="#9aa1aa"/></g>
        <g class="car"><g class="cg">${D.auto({x: 0, y: 0, s: 1.45, color: K.colorAuto || '#9aa1aa'})}</g><g class="bajo" opacity="0"><rect x="-330" y="-20" width="660" height="70" rx="20" fill="#2a2e35"/>${[-200, 0, 200].map(x => `<rect x="${x - 60}" y="0" width="120" height="30" rx="10" fill="#4a505a"/>`).join('')}<rect x="-300" y="18" width="600" height="10" fill="#4EC3FF" opacity=".8"/></g></g>
        <g class="luces">${[...Array(5)].map((_, i) => `<rect x="${140 + i * 190}" y="420" width="120" height="16" rx="8" fill="#fffbe6"/>`).join('')}</g>`}]});
    const pl = e.capas[1].svg.querySelector('.pl'), car = e.capas[1].svg.querySelector('.car'), cg = e.capas[1].svg.querySelector('.cg'), bajo = e.capas[1].svg.querySelector('.bajo');
    return {toma: (t0, tc) => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = t - tc; const sk = d > 0 && d < .4 ? Math.exp(-d * 8) : 0; return {x: 540, y: lerp(1300, 1050, ease(k)) + Math.sin(t * 50) * 10 * sk, z: lerp(1.0, 1.25, ease(k)), r: Math.sin(t * 1.3) * 3, foco: 1, ap: 2}; },
      act: t => { const y = lerp(1500, 1100, easeOut(win(t, t0, tc + .2))); pl.setAttribute('transform', `translate(0,${y + 10})`); const sp = (t - t0) * 2.4, sx = Math.cos(sp);
        car.setAttribute('transform', `translate(540,${y})`); cg.setAttribute('transform', `scale(${Math.abs(sx) < .15 ? .15 * Math.sign(sx || 1) : sx},1)`); bajo.setAttribute('opacity', clamp((t - tc) / .4) * .95); }})}; },
  haz(O, K) { const cm = PP.celularMano({piel: PERS[K.quien || 'juli'].piel, funda: '#c45a3b', manga: PERS[K.quien || 'juli'].campera || '#2f5d8a'}); const [l1, l2] = K.cartel || ['N.º DE CHASIS', '= PAPELES'];
    const e = O.esc({nombre: 'irr-haz', fondo: '#030712', capas: [{f: .2, prof: .2, svg: `<rect x="-300" y="-300" width="1680" height="2520" fill="#030712"/>${[...Array(90)].map((_, i) => `<circle cx="${hash(i) * 1080}" cy="${hash(i + 4) * 1100}" r="${1 + hash(i + 2) * 2.5}" fill="#fff" opacity="${.2 + hash(i) * .6}"/>`).join('')}${D.skyline({w: 1080, base: 1300, color: '#0b1430', ventanas: .3, obelisco: [700, 1300, 520, '#1a2444'], seed: 9})}`},
      {f: .7, prof: .7, svg: `<defs><linearGradient id="hzb" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffbe6" stop-opacity=".85"/><stop offset="1" stop-color="#fffbe6" stop-opacity=".08"/></linearGradient></defs><polygon class="beam" points="530,1500 -60,120 1140,120" fill="url(#hzb)" style="mix-blend-mode:screen"/>
        <g class="sign"><rect x="-400" y="-170" width="800" height="340" rx="26" fill="#0d5fb3"/><rect x="-380" y="-150" width="760" height="300" rx="18" fill="none" stroke="#fff" stroke-width="8"/>${T_(0, -30, l1.length > 14 ? 64 : 76, l1)}${T_(0, 90, l2.length > 14 ? 64 : 76, l2, {c: '#BFE6FF'})}<rect x="-200" y="170" width="20" height="200" fill="#5d6670"/><rect x="180" y="170" width="20" height="200" fill="#5d6670"/></g>`},
      {f: 1, prof: 1, svg: `<g transform="translate(300,900) scale(.62)">${cm.svg}</g>`}]});
    e.capas[2].svg.querySelector('.pantalla').innerHTML = `<rect x="190" y="250" width="700" height="1460" fill="#101826"/><circle cx="540" cy="900" r="120" fill="#fffbe6" opacity=".9"/>${T_(540, 1150, 46, 'LINTERNA')}`;
    const beam = e.capas[1].svg.querySelector('.beam'), sign = e.capas[1].svg.querySelector('.sign');
    return {toma: (t0, tc) => ({t0, esc: e, lineas: .2, cam: (k, t) => ({x: 540, y: lerp(1150, 820, ease(k)), z: lerp(1.0, 1.12, k), r: Math.sin(t * 1.5) * 1.5, foco: .7, ap: 4}), act: t => {
      const kb = easeOut(win(t, tc - .15, tc + .1)); beam.style.opacity = kb * (.8 + .2 * Math.sin(t * 30)); const ks = backOut(win(t, tc, tc + .5), 1.8); sign.setAttribute('transform', `translate(540,${560 + Math.sin(t * 2) * 8}) scale(${.2 + .8 * ks})`); sign.style.opacity = clamp(ks); }})}; },
  moneda(O, K) { const txt = K.ficha || 'PLAN';
    const e = O.esc({nombre: 'irr-moneda', fondo: '#8fb7dc', capas: [{f: .2, prof: .2, svg: `<defs><linearGradient id="mns" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5d9ad8"/><stop offset="1" stop-color="#f2d9b3"/></linearGradient></defs><rect x="-300" y="-300" width="1680" height="1360" fill="url(#mns)"/><rect x="525" y="420" width="30" height="520" fill="#f2efe8"/><path d="M525,420 L540,380 L555,420 Z" fill="#f2efe8"/>`},
      {f: .6, prof: .6, svg: `${[...Array(8)].map((_, i) => { const L = i < 4, k = i % 4; const x1 = L ? -300 + k * 150 : 880 + k * 150; return `<polygon points="${L ? 480 : 600},${940 - 40 * k} ${x1 + (L ? 0 : 300)},${300 - k * 80} ${x1 + (L ? 0 : 300)},1700 ${L ? 480 : 600},1000" fill="${['#e8d3b5', '#d9a98a', '#c7d1c9', '#e9c9a1'][k]}" opacity=".95"/>`; }).join('')}`},
      {f: 1, prof: 1, svg: `<polygon points="470,960 610,960 1500,1920 -420,1920" fill="#4f535b"/>${[...Array(10)].map((_, i) => { const z = i / 10, y = 980 + 940 * z * z; return `<rect x="${538 - 4 - z * 10}" y="${y}" width="${8 + z * 20}" height="${10 + z * 60}" fill="#f2efe8"/>`; }).join('')}
        <g class="ficha"><ellipse cx="0" cy="250" rx="200" ry="30" fill="#000" opacity=".35"/><g class="rot"><circle r="240" fill="${AZUL}"/><circle r="205" fill="none" stroke="#fff" stroke-width="12" stroke-dasharray="34 20"/><circle r="160" fill="${NAVY}"/><image href="autos.png" x="-50" y="-120" width="100" height="134"/>${T_(0, 80, 64, txt)}</g></g>`}]});
    const f = e.capas[2].svg.querySelector('.ficha'), rot = e.capas[2].svg.querySelector('.rot');
    return {toma: (t0, tc) => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = t - tc; const sk = d > 0 && d < .5 ? Math.exp(-d * 8) : 0; return {x: 540 + Math.sin(t * 60) * 18 * sk, y: 1040 + Math.cos(t * 44) * 14 * sk, z: 1.0, r: Math.sin(t * 30) * 2 * sk, foco: 1, ap: 2}; },
      act: t => { let y, s; if (t < tc) { const k = easeIn(win(t, t0, tc)); y = lerp(-400, 1020, k); s = .32; } else { const d = t - tc, k = clamp(d / 1.6); y = 1020 + Math.abs(Math.sin(d * 9)) * 80 * Math.exp(-d * 4) + k * k * 700; s = .32 + k * k * 1.6; }
        f.setAttribute('transform', `translate(540,${y}) scale(${s})`); rot.setAttribute('transform', `rotate(${(t - t0) * 260}) scale(${.75 + .25 * Math.abs(Math.cos((t - t0) * 3))},1)`); }})}; },
  hojas(O, K) { const P = [[-330, 60], [-320, -20], [-250, -60], [-150, -80], [-90, -150], [0, -170], [100, -160], [170, -100], [260, -80], [330, -40], [330, 40], [200, 60], [80, 60], [-80, 60], [-200, 60], [-150, 60], [150, 60], [-30, -120]];
    const e = O.esc({nombre: 'irr-hojas', fondo: TINTA, capas: [{f: .3, prof: .3, svg: fondoMarca(id('hj'), '#145cb8')},
      {f: 1, prof: 1, svg: `<g class="sil" opacity="0" transform="translate(540,1000) scale(2.1)"><path d="M-330,50 L-320,-20 L-250,-60 L-150,-80 L-90,-150 L0,-170 L100,-160 L170,-100 L260,-80 L330,-40 L330,50 Z" fill="none" stroke="${ACC}" stroke-width="6"/>${[-200, 200].map(x => `<circle cx="${x}" cy="60" r="56" fill="none" stroke="${ACC}" stroke-width="6"/>`).join('')}</g>
        <g class="hs">${P.map((_, i) => `<g class="h"><rect x="-60" y="-78" width="120" height="156" rx="6" fill="#f7f6f1"/>${[0, 1, 2, 3].map(j => `<rect x="-42" y="${-54 + j * 30}" width="${60 + hash(i * 3 + j) * 24}" height="8" rx="4" fill="#b9c9e0"/>`).join('')}</g>`).join('')}</g>
        <g transform="translate(540,1700)"><path d="M-260,-120 L-100,-120 L-80,-150 L260,-150 L260,120 L-260,120 Z" fill="#d9a441"/><path d="M-260,-60 L260,-60 L290,120 L-290,120 Z" fill="#e8b552"/></g>`}]});
    const hs = [...e.capas[1].svg.querySelectorAll('.h')], sil = e.capas[1].svg.querySelector('.sil');
    return {toma: (t0, tc) => ({t0, esc: e, cam: (k, t) => ({x: 540, y: lerp(1250, 1000, ease(k)), z: lerp(1.0, 1.05, k), r: Math.sin(t * 1.2) * 1.5, foco: 1, ap: 2}), act: t => {
      hs.forEach((h, i) => { const a = t0 + i * .04, k = easeOut(win(t, a, tc + .3 + i * .02)); const [px, py] = P[i]; const x = lerp(540 + (hash(i) - .5) * 200, 540 + px * 2.1, k), y = lerp(1620, 1000 + py * 2.1, k) - Math.sin(k * Math.PI) * 300;
        h.setAttribute('transform', `translate(${x},${y}) rotate(${(1 - k) * (hash(i + 5) - .5) * 720 + (k > .98 ? 0 : 0)}) scale(${lerp(.5, .9, k)})`); }); sil.setAttribute('opacity', clamp((t - tc - .2) / .4)); }})}; },
  ascensor(O, K) { const e = O.esc({nombre: 'irr-ascensor', fondo: '#9cc4e6', capas: [{f: .2, prof: .2, svg: D.cielo({w: 1080, h: 1920, top: '#5d9ad8', mid: '#a9cdea', bot: '#f2e2c8'})},
      {f: 1, prof: 1, h: 3200, svg: `<rect x="80" y="0" width="920" height="3300" fill="#e3cdb0"/>${[...Array(18)].map((_, r) => [0, 1, 2].map(c => `<rect x="${140 + c * 300}" y="${100 + r * 170}" width="200" height="110" rx="8" fill="#7f94a8" opacity=".8"/>`).join('')).join('')}
        <rect x="420" y="0" width="240" height="3300" fill="#cfd8e0" opacity=".5"/><g class="cab"><rect x="400" y="-260" width="280" height="300" rx="14" fill="#bfe3ff" opacity=".55" stroke="#fff" stroke-width="8"/><rect x="440" y="-150" width="200" height="150" rx="16" fill="${AZUL}"/>${T_(540, -60, 44, K.cajaTxt || 'CUOTA')}</g>`}]});
    const cab = e.capas[1].svg.querySelector('.cab');
    return {toma: (t0, tc) => ({t0, esc: e, tr: 'v', cam: (k, t) => { const y = lerp(3000, 900, easeIn(win(t, t0, tc + .3))); return {x: 540, y: y - 1280 + 960, z: 1.0, r: Math.sin(t * 2) * 1.2, foco: 1, ap: 2}; },
      act: t => { const y = lerp(3000, 900, easeIn(win(t, t0, tc + .3))); cab.setAttribute('transform', `translate(0,${y})`); }})}; },
};
IRR.gigante = (O, K) => { const G = gigante(O, {pj: PERS[K.quien || 'juli'], doc: K.doc || 'Contrato', papel: ['#9fb6d6', '#e8f0fb', '#ffffff'], renglon: '#b9c9e0', tinta: NAVY, cielo: ['#0E4EB2', '#020C47', '#000521'], acento: AZUL, objeto: K.objGig || 'llave', fuente: 'Archivo'}); return {toma: (t0, tc) => G.toma(t0, tc)}; };
IRR.caida = (O, K) => { const C = caida(O, {pj: PERS[K.quien || 'juli'], fondo: ['#0E4EB2', '#000521'], hoja: '#ffffff', renglon: '#b9c9e0', raya: '#8CC8FF', acento: AZUL}); return {toma: (t0) => C.toma(t0)}; };

// ---------------- ARMADO ----------------
export async function armarKit(V, K) {
  const C = Object.assign({}, K, V.cfg || {}); const fr = V.frases;
  const O = obra(V, {nombre: 'Automotores Kocos', logo: 'autos.png', ctaSub: 'y te respondemos', hookHTML: C.hook, hookHasta: fr[1].t - .15, notas: []});
  document.documentElement.style.cssText += `--f1:Archivo;--f2:'Plus Jakarta Sans';--fs:Archivo;--tt:uppercase;--acc:${ACC};--hw:900;--em:normal;--kwCol:${TINTA};--logoH:150px;--velo:rgba(0,5,33,.92);--ctaTop:600px;--ss:78px;${ganchoCss(C.hook)}`;
  const st = document.createElement('style'); st.textContent = `#sub .h{color:${ACC};-webkit-text-stroke:16px rgba(0,4,24,.96);text-shadow:0 0 26px rgba(78,195,255,.55),0 6px 30px rgba(0,0,0,.7)}#hook em{color:${ACC};text-shadow:0 0 30px rgba(0,5,33,.8),0 4px 16px rgba(0,0,0,.6)}#cta .kw{color:${TINTA}}#hook{top:1120px!important;background:rgba(0,5,33,.78);border-radius:44px;padding:26px 24px 34px;box-sizing:border-box}#num{left:44px!important;width:240px!important;text-align:left!important;top:300px!important;font-size:230px!important}`; document.head.appendChild(st);
  const F = n => fr.find(f => f.marca === n); const FI = i => fr.find(f => f.item === i); const cta = fr.find(f => f.cta);
  // lugar con sus personajes
  const L = LUG[C.lugar || 'conce']; const quien = C.quien || fr[0].q; const pjs = C.pjs || [quien];
  const mesaSVG = L.mesa ? D.mesa({x: 760, y: 1300, w: 700, c: '#c49a6c', patas: 200}) + (C.mesaProp || `<rect x="560" y="1262" width="70" height="40" rx="8" fill="#e9e3d4"/><rect x="900" y="1268" width="120" height="34" rx="6" fill="${NAVY}" transform="rotate(-6,960,1285)"/>`) : '';
  const autoSVG = L.auto && !C.sinAuto ? D.auto({x: L.auto[0], y: L.auto[1], s: L.auto[2], color: C.colorAuto || L.auto[3], brillo: .8}) + (C.lugar === 'conce' ? `<g><rect x="560" y="1150" width="8" height="300" fill="#555"/><rect x="420" y="1040" width="290" height="140" rx="14" fill="#fff" stroke="${NAVY}" stroke-width="6"/>${T_(565, 1092, 30, C.cartelConce || 'PRECIO DE LISTA', {c: NAVY, w: 800})}<rect x="470" y="1110" width="190" height="44" rx="8" fill="${NAVY}"/></g>` : '') : '';
  const eL = O.esc({nombre: 'lugar', fondo: L.fondo, capas: [{f: .55, prof: .55, w: 1600, svg: L.svg(C)}, {f: 1, prof: 1, w: 1600, svg: autoSVG + '<g class="act"></g>' + mesaSVG}]});
  const act = eL.capas[1].svg.querySelector('.act'); const P = {}; pjs.forEach(q => P[q] = personaje(act, PERS[q])); const pose = {}; pjs.forEach(q => pose[q] = poser(V, q));
  luz(eL, L.luz); const {bokeh, sumarCapa, conPolvo, motasRender} = realce(); conPolvo(eL, 900, 900, 420, 320, '#fff3d8'); O.motas = motasRender;
  const pos = q => (C.pos && C.pos[q]) || L.pos[q];
  const BASE = {juli: {hR: 20, cR: 30, hL: 10, cL: 20, mira: .4}, mati: {hR: 10, cR: 20, hL: 6, cL: 14, mira: .3}, leo: {hR: 10, cR: 20, mira: -.3}, tano: {hR: 20, cR: 30, mira: -.3}};
  const ANIM = {preocupa: {ceja: -.9, sonrisa: -.5, cab: -6, hR: 70, cR: 100}, alivio: {hR: 165, cR: 25, hL: 20, cL: 40, sonrisa: 1, ceja: .5, cab: -4}, habla: {hR: 60, cR: 50, ceja: .9, sonrisa: -.3, mira: .6}, feliz: {sonrisa: 1, ceja: .4}, festeja: {hR: 170, cR: 10, hL: 40, cL: 30, sonrisa: 1, ceja: .8}};
  const escena = (t, est = {}) => pjs.forEach((q, i) => { const [x, y] = pos(q); const flip = C.flip && C.flip[q] !== undefined ? C.flip[q] : (x > 800 ? -1 : 1);
    pose[q](P[q], t, Object.assign({x, y, s: .98, flip}, BASE[q] || {}, ANIM[est[q]] || {}, est['_' + q] || {})); });
  const cab = q => { const [x, y] = pos(q); return [x + 30, y - 470]; };
  const boca = q => () => eL.aPantalla(eL.capas[1], P[q].cabeza[0], P[q].cabeza[1] - 60);
  const habl = t => { const f = fr.find(f => f.q !== 'nar' && t >= f.t - .1 && t <= f.fin + .3); return f ? f.q : quien; };
  const tomaLugar = (t0, {z = 1.6, foco = null, est = {}, dx = 0, dz = .1, tr} = {}) => { const q = foco || quien; const [cx, cy] = cab(q); const sp = pjs.map(p => pos(p)[0]); const xs = z >= 1.7 ? cx : (pjs.length > 1 && Math.max(...sp) - Math.min(...sp) < 650) ? (Math.max(...sp) + Math.min(...sp)) / 2 + 30 : cx + (C.dx0 ?? 110);
    return {t0, esc: eL, tr, cam: k => ({X: lerp(xs + dx - 40, xs + dx + 40, k), Y: z < 1.7 ? cy + 160 : cy + 90, z: lerp(z, z + dz, ease(k)), foco: 1, ap: z > 2 ? 6 : 4}), act: t => escena(t, est), boca: () => boca(habl(t0 + .01))() }; };
  // objeto de la marca
  const ob = OBJ[C.obj || 'ticket'](C); const eO = O.esc({nombre: 'obj', fondo: TINTA, capas: [{f: 1, prof: 1, svg: ob.svg}]}); ob.init(eO.capas[0].svg);
  sumarCapa(eO, {f: 1.5, prof: 1.6, svg: bokeh(7, 17, ['#8CC8FF', '#ffffff', '#207CCF'])});
  const fObj = F('obj') || FI(1); const ts = [FI(1).t, FI(2).t, FI(3).t]; ts.obj = fObj.t;
  const nItems = t => ts.filter(x => t >= x - .05).length;
  const tomaObj = (t0, cam) => ({t0, esc: eO, cam, act: t => ob.upd(t, nItems(t), ts)});
  // plano irreal
  const giro = F('giro') || fr[2]; const tc = giro.t - .05; const ir = IRR[C.irreal || 'vidrio'](O, C);
  const finIrr = Math.min(fObj.t - .1, giro.fin + (C.irrExtra ?? 1.4));
  // tomas
  const T = [];
  const ab = C.abre || 'lugar';
  if (ab === 'pov') { const cm = PP.celularMano({piel: PERS[quien].piel, funda: '#c45a3b', manga: PERS[quien].campera || PERS[quien].remera});
    const ep = O.esc({nombre: 'pov', fondo: L.fondo, capas: [{f: .5, prof: .3, w: 1600, svg: L.svg(C) + autoSVG}, {f: 1, prof: 1, svg: `<g transform="translate(330,700) scale(.66) rotate(-6,540,960)">${cm.svg}</g>`}]});
    ep.capas[1].svg.querySelector('.pantalla').innerHTML = C.pantalla || `<rect x="190" y="250" width="700" height="1460" fill="#0E4EB2"/><rect x="190" y="700" width="700" height="700" fill="#dfe7f1"/>${D.auto({x: 540, y: 1180, s: 1.1, color: C.colorAuto || '#1f6fc2', brillo: .8})}<path d="M540,1330 c-60,-50 -120,-80 -120,-130 c0,-40 60,-60 120,-10 c60,-50 120,-30 120,10 c0,50 -60,80 -120,130z" fill="#e5484d"/>${T_(540, 420, 54, C.notifT || 'Tu 0 km')}${T_(540, 500, 34, C.notifX || 'Mirá esto antes de decidir.', {f: 'Plus Jakarta Sans', w: 700, c: '#cfe4ff'})}<image href="autos.png" x="500" y="560" width="80" height="107"/>`;
    const tel = ep.capas[1].svg.firstChild; luz(ep, 'background:linear-gradient(110deg,transparent 40%,rgba(255,240,210,.35))');
    T.push({t0: 0, esc: ep, cam: (k, t) => ({x: 540 + (t < 1 ? Math.sin(t * 90) * 2 : 0), y: lerp(980, 940, k), z: lerp(1.0, 1.06, ease(k)), r: lerp(-1, 1, k), foco: 1, ap: 7}), act: t => tel.setAttribute('transform', `translate(330,${700 + Math.sin(t * 2) * 6}) scale(.66) rotate(-6,540,960)`)}); }
  else if (ab === 'objeto') T.push(tomaObj(0, k => ({x: 540, y: lerp(900, 980, ease(k)), z: lerp(1.35, 1.15, ease(k)), r: lerp(-3, 0, k), foco: 1})));
  else if (ab === 'final') T.push(Object.assign(tomaLugar(0, {z: 1.75, est: Object.fromEntries(pjs.map(q => [q, 'alivio']))}), {lineas: .55}));
  else if (ab === 'irreal') T.push(ir.toma(0, .5));
  else T.push(tomaLugar(0, {z: C.z0 || 1.55, est: {[quien]: 'habla', ...(C.est0 || {})}, dz: .12}));
  if (ab !== 'lugar') T.push(tomaLugar(Math.max(.6, Math.min(fr[0].fin - .2, 1.3)), {z: 1.6, est: {[quien]: 'habla', ...(C.est0 || {})}}));
  T.push(tomaLugar(fr[1].t - .05, {z: 2.5, foco: fr[1].q !== 'nar' ? fr[1].q : quien, est: {[quien]: 'preocupa', ...(C.est1 || {})}, dz: .15}));
  T.push(ir.toma(giro.t - .5, tc));
  if (finIrr < fObj.t - .4) T.push(tomaLugar(finIrr, {z: 2.2, foco: quien, est: {[quien]: 'preocupa'}, dx: 60}));
  T.push(tomaObj(fObj.t - .1, k => ({x: 540, y: lerp(1050, 900, ease(k)), z: lerp(1.0, 1.06, k), foco: 1})));
  const camI = [k => ({x: lerp(570, 530, k), y: lerp(900, 960, k), z: 1.16, r: -2, foco: 1}), k => ({x: lerp(510, 560, k), y: 940, z: lerp(1.08, 1.16, ease(k)), r: 1.5, foco: 1}), k => ({x: 540, y: lerp(1000, 930, k), z: lerp(1.2, 1.12, ease(k)), foco: 1})];
  ts.forEach((x, i) => T.push(tomaObj(x - .1, camI[i])));
  const al = F('alivio'); const fin3 = FI(3).fin + .5;
  if (al && al.t - fin3 > 1.2) T.push(tomaLugar(fin3, {z: 1.6, est: {[quien]: 'feliz'}}));
  if (al) T.push(tomaLugar(al.t - .1, {z: 1.75, foco: al.q !== 'nar' ? al.q : quien, est: Object.fromEntries(pjs.map(q => [q, q === (al.q || quien) ? (C.festeja ? 'festeja' : 'alivio') : 'feliz']))}));
  T.push(tomaLugar(cta.t - .3, {z: 1.85, est: Object.fromEntries(pjs.map(q => [q, 'feliz']))}));
  T.push(Object.assign({}, T[0], {t0: V.total - .4}));
  O.tomas = T.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, tc]; O.flash = t => Math.max(t >= .02 ? .45 * Math.exp(-(t - .02) * 8) : 0, t >= tc ? .55 * Math.exp(-(t - tc) * 9) : 0, C.irreal === 'llaveTunel' ? clamp((t - (tc + 1.3)) / .2) * clamp((tc + 1.75 - t) / .25) * .9 : 0);
  if (C.grade || C.cam) variar(O, C, null);
  return O;
}
