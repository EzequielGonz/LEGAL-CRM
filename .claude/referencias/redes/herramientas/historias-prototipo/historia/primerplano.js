// Primeros planos de los objetos de marca (SVG grande, para planos cerrados en primera persona).
import {id, hash} from './base.js';
import {sh} from './decor.js';
const lineas = (x, y, w, n, h, c = '#9b9da1', seed = 1) => { let s = ''; for (let i = 0; i < n; i++) { let cx = x; const L = w * (.6 + .4 * hash(i + seed));
  while (cx < x + L) { const ww = h * (1.4 + hash(cx * .13 + i * 7 + seed) * 3.4); s += `<rect x="${cx}" y="${y + i * h * 2.1}" width="${Math.min(ww, x + L - cx)}" height="${h * .62}" rx="${h * .3}" fill="${c}" opacity=".6"/>`; cx += ww + h * .5; } } return s; };
export {lineas};

// Celular en mano (primera persona). contenido: SVG de la pantalla (720×1500)
export function celularMano({piel = '#c98e6b', funda = '#16181d', manga = '#2f5d8a'}) {
  const g = id('cm');
  return {svg: `<defs><linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(funda, .2)}"/><stop offset="1" stop-color="${funda}"/></linearGradient>
      <clipPath id="${g}c"><rect x="190" y="250" width="700" height="1460" rx="70"/></clipPath><filter id="${g}s" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="30"/></filter></defs>
    <rect x="200" y="300" width="720" height="1500" rx="96" fill="#000" opacity=".45" filter="url(#${g}s)" transform="translate(30,40)"/>
    <rect x="160" y="220" width="760" height="1520" rx="100" fill="url(#${g}b)"/><rect x="172" y="232" width="736" height="1496" rx="90" fill="#050506"/>
    <g clip-path="url(#${g}c)"><g class="pantalla"></g><rect x="190" y="250" width="700" height="1460" fill="url(#${g}r)" opacity=".0"/></g>
    <path d="M190,250 L520,250 L190,900 Z" fill="#fff" opacity=".05"/><rect x="470" y="272" width="140" height="36" rx="18" fill="#000"/>
    <path d="M60,1920 L60,1500 C60,1420 110,1390 160,1400 L170,1700 C200,1760 260,1800 330,1820 L400,1920 Z" fill="${piel}"/><path d="M100,1920 L120,1600" stroke="${sh(piel, -.2)}" stroke-width="6" opacity=".4"/>
    <path d="M920,980 C980,960 1010,1010 990,1060 L930,1150 Z" fill="${sh(piel, -.05)}"/><path d="M920,1180 C990,1160 1020,1210 1000,1260 L930,1330 Z" fill="${sh(piel, -.05)}"/><path d="M920,1370 C990,1350 1015,1400 995,1450 L930,1510 Z" fill="${sh(piel, -.08)}"/>
    <path d="M330,1920 C420,1840 560,1800 700,1820 L760,1920 Z" fill="${manga}"/>`, pantallaSel: '.pantalla'};
}
// Pantalla de bloqueo con notificación (ilustrativa, remitente genérico)
export function notificacion({hora = '20:41', app = 'Aseguradora · Siniestros', titulo = '', texto = '', color = '#3a4a6b', fondo = ['#1d2b4a', '#3b2a4a'], extra = ''}) {
  const g = id('nt');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fondo[0]}"/><stop offset="1" stop-color="${fondo[1]}"/></linearGradient></defs>
    <rect x="190" y="250" width="700" height="1460" fill="url(#${g})"/>
    <text x="540" y="560" font-family="Manrope" font-weight="300" font-size="170" fill="#fff" text-anchor="middle">${hora}</text>
    <text x="540" y="620" font-family="Manrope" font-weight="600" font-size="34" fill="#fff" opacity=".8" text-anchor="middle">jueves 20 de noviembre</text>
    <g class="notif"><rect x="225" y="700" width="630" height="${texto.length > 60 ? 260 : 220}" rx="40" fill="#fff" opacity=".93"/>
    <rect x="255" y="732" width="52" height="52" rx="14" fill="${color}"/><text x="325" y="768" font-family="Manrope" font-weight="700" font-size="28" fill="#333">${app}</text><text x="820" y="768" font-family="Manrope" font-weight="500" font-size="26" fill="#777" text-anchor="end">ahora</text>
    <text x="255" y="828" font-family="Manrope" font-weight="800" font-size="34" fill="#111">${titulo}</text>
    <foreignObject x="255" y="842" width="570" height="120"><div xmlns="http://www.w3.org/1999/xhtml" style="font:500 30px Manrope;color:#333;line-height:1.3">${texto}</div></foreignObject></g>${extra}`;
}
// Escritorio con papel y lapicera (vista cenital levemente inclinada); el sello se dibuja aparte
export function papelEscritorio({mesa = '#0f1a3a', titulo = 'Propuesta de acuerdo', remite = 'Aseguradora · Siniestros', firma = 'Firma del reclamante', acento = '#C1AE7A', luz = '#ffcf8a'}) {
  const g = id('pe');
  return `<defs><radialGradient id="${g}l" cx=".25" cy=".3" r=".9"><stop offset="0" stop-color="${luz}" stop-opacity=".55"/><stop offset=".6" stop-color="${luz}" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></radialGradient>
      <filter id="${g}s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter><linearGradient id="${g}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sh(mesa, .15)}"/><stop offset="1" stop-color="${sh(mesa, -.3)}"/></linearGradient></defs>
    <rect x="-200" y="-200" width="1480" height="2320" fill="url(#${g}m)"/>${[...Array(40)].map((_, i) => `<path d="M-200,${i * 60 + hash(i) * 30} q700,${hash(i * 3) * 40 - 20} 1500,0" stroke="#fff" stroke-width="2" opacity=".025" fill="none"/>`).join('')}
    <g transform="rotate(-4 540 1000)"><rect x="160" y="300" width="780" height="1110" fill="#000" opacity=".5" filter="url(#${g}s)" transform="translate(20,30)"/>
      <rect x="150" y="280" width="780" height="1110" fill="#f6f3ea"/>
      <text x="230" y="390" font-family="Manrope" font-weight="600" font-size="26" fill="#7d7f84">${remite}</text>
      <text x="230" y="470" font-family="Playfair Display" font-weight="700" font-size="58" fill="#25282B">${titulo}</text><rect x="230" y="496" width="200" height="4" fill="${acento}"/>
      ${lineas(230, 560, 620, 12, 16, '#9b9da1', 3)}
      <text x="230" y="1010" font-family="Manrope" font-weight="700" font-size="28" fill="#25282B">Monto ofrecido por única vez</text>${lineas(230, 1050, 620, 5, 16, '#9b9da1', 9)}
      <path d="M230,1300 L700,1300" stroke="#25282B" stroke-width="3"/><text x="230" y="1340" font-family="Manrope" font-weight="500" font-size="26" fill="#6b6d72">${firma}</text>
      <text x="236" y="1290" font-family="Playfair Display" font-size="50" fill="#b9bbbf">×</text><g class="marca"></g></g>
    <rect x="-200" y="-200" width="1480" height="2320" fill="url(#${g}l)"/>`;
}
export function selloSVG({oro = '#D4AF37'}) { const g = id('so');
  return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(oro, -.35)}"/><stop offset=".45" stop-color="${sh(oro, .35)}"/><stop offset=".6" stop-color="${oro}"/><stop offset="1" stop-color="${sh(oro, -.45)}"/></linearGradient></defs>
    <path d="M-38,-330 C-70,-330 -80,-290 -60,-260 C-40,-235 -30,-215 -34,-180 L-44,-60 L44,-60 L34,-180 C30,-215 40,-235 60,-260 C80,-290 70,-330 38,-330 Z" fill="url(#${g})"/>
    <ellipse cx="0" cy="-330" rx="40" ry="12" fill="${sh(oro, .4)}"/><rect x="-150" y="-62" width="300" height="56" rx="12" fill="url(#${g})"/><rect x="-156" y="-8" width="312" height="22" rx="6" fill="#3a2a10"/>`; }
export function marcaSello({txt = 'ESPERÁ', oro = '#D4AF37', x = 540, y = 1180, r = -8, s = 1}) { const g = id('ms');
  return `<defs><filter id="${g}"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -2.2 1.6"/><feComposite in="SourceGraphic" operator="in"/></filter></defs>
    <g transform="translate(${x},${y}) rotate(${r}) scale(${s})" filter="url(#${g})" fill="none" stroke="${oro}"><rect x="-300" y="-110" width="600" height="220" rx="22" stroke-width="12"/><rect x="-278" y="-88" width="556" height="176" rx="14" stroke-width="4"/>
    <text x="0" y="44" font-family="Manrope" font-weight="800" font-size="128" fill="${oro}" stroke="none" text-anchor="middle" letter-spacing="6">${txt}</text></g>`; }
// Carta de la prepaga (ilustrativa) con letra chica; la lupa amplía una zona
export function carta({fondo = '#DAF1DE', acento = '#235347', remite = 'Tu prepaga', titulo = 'Actualización de tu cuota'}) {
  const g = id('ca');
  const contenido = `<rect x="140" y="240" width="800" height="1180" fill="#fbfbf7"/><rect x="140" y="240" width="800" height="16" fill="${acento}"/>
    <text x="210" y="350" font-family="Manrope" font-weight="700" font-size="30" fill="#587268">${remite}</text>
    <text x="210" y="430" font-family="Manrope" font-weight="800" font-size="54" fill="#0B2B26">${titulo}</text>
    ${lineas(210, 500, 660, 10, 16, '#9aa79f', 5)}
    <text x="210" y="980" font-family="Manrope" font-weight="500" font-size="21" fill="#4a5b54">A partir de este mes, tu cuota se actualiza según</text>
    <text x="210" y="1012" font-family="Manrope" font-weight="500" font-size="21" fill="#4a5b54">lo informado en tu plan vigente. Ver condiciones.</text>
    ${lineas(210, 1050, 660, 6, 12, '#b3beb8', 8)}`;
  return {svg: `<defs><clipPath id="${g}c"><circle cx="0" cy="0" r="150"/></clipPath><filter id="${g}s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="20"/></filter></defs>
    <rect x="-200" y="-200" width="1480" height="2320" fill="${fondo}"/><rect x="150" y="270" width="800" height="1180" fill="#000" opacity=".25" filter="url(#${g}s)" transform="translate(16,26)"/>
    <g class="carta">${contenido}</g>
    <g class="lupa"><circle r="160" fill="#000" opacity=".22" filter="url(#${g}s)" transform="translate(30,40)"/><g clip-path="url(#${g}c)"><rect x="-200" y="-200" width="400" height="400" fill="#fbfbf7"/><g class="zoom">${contenido}</g><circle r="150" fill="#bfffe0" opacity=".08"/></g>
      <circle r="150" fill="none" stroke="#8EB69B" stroke-width="26"/><circle r="150" fill="none" stroke="#fff" stroke-width="4" opacity=".5"/><path d="M-90,-90 A130,130 0 0,1 40,-128" stroke="#fff" stroke-width="10" opacity=".55" fill="none" stroke-linecap="round"/>
      <rect x="-26" y="160" width="52" height="250" rx="22" fill="#235347" transform="rotate(-35)"/></g>`};
}
// Impresora de tickets y ticket térmico (montos tapados: el motor no inventa precios)
export function ticketera({items = [], total = 'PRECIO LLAVE EN MANO', azul = '#207CCF'}) {
  const g = id('tk');
  const fila = (txt, y, b = false) => `<text x="300" y="${y}" font-family="Plus Jakarta Sans" font-weight="${b ? 800 : 600}" font-size="${b ? 40 : 36}" fill="#1b1d22">${txt}</text><rect x="${b ? 610 : 620}" y="${y - 30}" width="${b ? 170 : 150}" height="34" rx="6" fill="#1b1d22" opacity="${b ? .9 : .75}"/><text x="${b ? 600 : 610}" y="${y}" font-family="Plus Jakarta Sans" font-weight="700" font-size="36" fill="#1b1d22" text-anchor="end">$</text>`;
  let y = 0; const filas = [`<text x="540" y="70" font-family="Archivo" font-weight="900" font-size="44" fill="#1b1d22" text-anchor="middle" letter-spacing="3">PRESUPUESTO</text><path d="M290,110 L790,110" stroke="#1b1d22" stroke-width="3" stroke-dasharray="10 8"/>`,
    fila('Precio de lista', 190)];
  items.forEach((it, i) => filas.push(fila('+ ' + it, 290 + i * 100)));
  const ty = 290 + items.length * 100 + 60;
  filas.push(`<path d="M290,${ty - 30} L790,${ty - 30}" stroke="#1b1d22" stroke-width="4"/><rect x="280" y="${ty - 8}" width="520" height="120" rx="14" fill="${azul}"/><text x="540" y="${ty + 68}" font-family="Archivo" font-weight="900" font-size="42" fill="#fff" text-anchor="middle">${total}</text>`);
  return {altoTicket: ty + 160, svg: `<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b1e24"/><stop offset=".5" stop-color="#3a3f48"/><stop offset="1" stop-color="#16181d"/></linearGradient>
      <clipPath id="${g}c"><rect x="250" y="-2000" width="580" height="3150"/></clipPath><filter id="${g}s" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="18"/></filter></defs>
    <g class="ticket" clip-path="url(#${g}c)"><g class="papel"><rect x="270" y="0" width="540" height="${ty + 160}" fill="#f7f6f1"/>${filas.map((f, i) => `<g class="fila" data-i="${i}">${f}</g>`).join('')}
      <path d="M270,${ty + 160} ${[...Array(18)].map((_, i) => `l15,14 l15,-14`).join(' ')}" fill="#f7f6f1"/></g></g>
    <rect x="160" y="1160" width="760" height="420" rx="40" fill="#000" opacity=".5" filter="url(#${g}s)" transform="translate(0,40)"/>
    <rect x="160" y="1130" width="760" height="430" rx="44" fill="url(#${g})"/><rect x="230" y="1150" width="620" height="22" rx="11" fill="#08090b"/>
    <circle cx="820" cy="1300" r="14" fill="#4E9BE4"/><rect x="220" y="1250" width="420" height="16" rx="8" fill="#fff" opacity=".06"/>`};
}
