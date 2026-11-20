// Kocos Marketing · kit del cronograma x2 (tramo mkt-1): cada idea arma su propia escena (lugar de Buenos Aires),
// su pantalla de celular (problema → los 3 arreglos) y su objeto de marca para el plano irreal. Mismo esqueleto de frases
// que mkt.js (0 gancho, 2 «frio», 4 «giro», items 1-3, «alivio», cierre) para que sonido.py marque los golpes en su lugar.
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, win, wob, hash} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, PJS, ganchoCss, variar} from './comun.js';
import {gigante, caida, OBJETOS} from '../historia/irreal.js';
const NAR = '#FC6E20', TINTA = '#1B1B1B';
const T = (x, y, s, txt, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Outfit'}" font-weight="${o.w || 700}" font-size="${s}" fill="${o.c || '#fff'}"${o.a ? ` text-anchor="${o.a}"` : ''}>${txt}</text>`;

// ---------- objetos de marca para el plano gigante (se suman a los de irreal.js sin editarlo) ----------
Object.assign(OBJETOS, {
  pin: a => `<g transform="translate(0,-760) scale(2.6)"><path d="M0,260 C-40,160 -170,40 -170,-90 A170,170 0 1 1 170,-90 C170,40 40,160 0,260 Z" fill="${a}"/><circle cy="-90" r="70" fill="#fff"/></g>`,
  torta: a => `<g transform="translate(0,-560) scale(2.4)"><rect x="-170" y="-60" width="340" height="140" rx="20" fill="#f3d9c0"/><rect x="-170" y="-60" width="340" height="40" rx="18" fill="${a}"/><rect x="-140" y="-190" width="280" height="130" rx="20" fill="#fbe9d8"/><rect x="-140" y="-190" width="280" height="36" rx="16" fill="${a}"/><rect x="-6" y="-270" width="12" height="80" fill="#fff"/><path d="M0,-300 C14,-284 10,-270 0,-268 C-10,-270 -14,-284 0,-300 Z" fill="#ffcf5a"/><rect x="-200" y="80" width="400" height="24" rx="12" fill="#ddd"/></g>`,
  estrella: a => `<g transform="translate(0,-620) scale(2.6)"><path d="M0,-200 L58,-62 L206,-62 L88,28 L132,170 L0,86 L-132,170 L-88,28 L-206,-62 L-58,-62 Z" fill="${a}" stroke="#fff" stroke-width="10"/></g>`,
  reloj: a => `<g transform="translate(0,-640) scale(2.5)"><circle r="200" fill="#fff" stroke="${a}" stroke-width="36"/><rect x="-8" y="-150" width="16" height="160" rx="8" fill="${TINTA}"/><rect x="-8" y="-8" width="120" height="16" rx="8" fill="${TINTA}"/><circle r="18" fill="${a}"/></g>`,
  cohete: a => `<g transform="translate(0,-700) scale(2.4)"><path d="M0,-260 C90,-170 100,-40 80,120 L-80,120 C-100,-40 -90,-170 0,-260 Z" fill="#fff"/><circle cy="-60" r="46" fill="${a}"/><path d="M-80,40 L-150,160 L-80,130 Z M80,40 L150,160 L80,130 Z" fill="${a}"/><path d="M-50,130 L0,280 L50,130 Z" fill="#ffcf5a"/></g>`,
  etiqueta: a => `<g transform="translate(0,-620) scale(2.5) rotate(-12)"><path d="M-220,-90 L130,-90 L230,0 L130,90 L-220,90 Z" fill="${a}"/><circle cx="140" r="22" fill="#fff"/><rect x="-180" y="-20" width="230" height="40" rx="20" fill="#fff" opacity=".85"/></g>`,
  cadena: a => `<g transform="translate(0,-640) scale(2.5) rotate(-35)"><rect x="-250" y="-70" width="280" height="140" rx="70" fill="none" stroke="${a}" stroke-width="44"/><rect x="-30" y="-70" width="280" height="140" rx="70" fill="none" stroke="#fff" stroke-width="44"/></g>`,
  libreta: a => `<g transform="translate(0,-620) scale(2.4) rotate(8)"><rect x="-170" y="-230" width="340" height="460" rx="20" fill="${a}"/><rect x="-140" y="-210" width="290" height="420" rx="10" fill="#fff8ee"/>${[0, 1, 2, 3, 4, 5].map(i => `<rect x="-110" y="${-160 + i * 60}" width="${150 + (i % 3) * 30}" height="14" rx="7" fill="#d9c4ad"/>`).join('')}</g>`,
  burbuja: a => `<g transform="translate(0,-640) scale(2.5)"><path d="M-210,-150 h420 a40,40 0 0 1 40,40 v200 a40,40 0 0 1 -40,40 h-300 l-90,80 v-80 h-30 a40,40 0 0 1 -40,-40 v-200 a40,40 0 0 1 40,-40 Z" fill="#25D366"/>${[0, 1, 2].map(i => `<circle cx="${-90 + i * 90}" cy="-10" r="28" fill="#fff"/>`).join('')}</g>`,
});

// ---------- lugares (fondo de la escena 1). La mesada / mostrador va en la capa de acción ----------
function lugarSVG(L, C) {
  const cartel = `<rect x="160" y="420" width="420" height="120" rx="10" fill="${TINTA}"/>${T(370, 500, C.cartelFs || 58, C.cartel || 'DULCE ALMAGRO', {w: 800, c: NAR, a: 'middle'})}`;
  if (L === 'cocina') return D.interior({w: 1500, pared: '#f3e6d6', piso: '#5e4636', ventana: [1000, 330, 380, 560], vista: 'noche', zocalo: '#e9dccb', luz: '#ffc58a'}) + cartel +
    `<rect x="120" y="640" width="560" height="22" rx="6" fill="#7a5a44"/>${[0, 1, 2, 3].map(i => `<rect x="${150 + i * 130}" y="${560}" width="90" height="80" rx="12" fill="${['#f7d6c2', '#e9b8a0', '#fff1e2', '#d99a7c'][i]}"/>`).join('')}
     <rect x="140" y="760" width="520" height="22" rx="6" fill="#7a5a44"/>${[0, 1, 2].map(i => `<circle cx="${220 + i * 170}" cy="${725}" r="${34 + i * 4}" fill="${['#f2c6a8', '#c97b5a', '#fbe3cf'][i]}"/>`).join('')}`;
  if (L === 'vereda') return D.barrio({w: 1500, piso: 1460, hora: C.hora || 'tarde', kiosco: false}) +
    `<rect x="300" y="900" width="560" height="110" rx="10" fill="${TINTA}"/>${T(580, 978, 60, C.cartel || 'DULCE ALMAGRO', {w: 800, c: NAR, a: 'middle'})}` + D.arbol({x: 1250, y: 1460, s: 1.1});
  if (L === 'mostrador') return D.interior({w: 1500, pared: '#f6ece0', piso: '#6d4f3c', ventana: [980, 300, 420, 640], vista: C.vista || 'dia', zocalo: '#efe2d2', luz: '#ffe0b0'}) + cartel +
    `<rect x="140" y="700" width="640" height="300" rx="16" fill="#fff" opacity=".55" stroke="#c9b6a3" stroke-width="8"/>${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${210 + (i % 3) * 200}" cy="${780 + Math.floor(i / 3) * 130}" r="46" fill="${['#f2c6a8', '#c97b5a', '#fbe3cf', '#e5a3a3', '#f7d38a', '#d8b38f'][i]}"/>`).join('')}`;
  if (L === 'oficina') return D.interior({w: 1500, pared: '#e6e9ee', piso: '#4a4f5c', ventana: [960, 300, 460, 640], vista: C.vista || 'noche', zocalo: '#d9dde4', luz: '#bcd6ff'}) + cartel + D.planta({x: 900, y: 1400, s: 1.3});
  // local de ropa (el de mkt.js)
  return D.interior({w: 1500, pared: '#efe2d2', piso: '#7a5a44', ventana: [980, 300, 420, 700], vista: C.vista || 'noche', zocalo: '#f6ece0', luz: '#ffb36b'}) +
    D.percha({x: 400, y: 1250, colores: ['#c45a3b', '#e9e3d4', '#2b3854', '#7aa38a', '#1b1b1b', '#e5c76b', '#b56cc9']}) + cartel;
}

// ---------- pantallas del celular: paso 0 = el problema (frio 0..1 = se enfría), paso 1..3 = cada arreglo ----------
const nombres = ['Sofi', 'Martín', 'Lu', 'Rocío', 'Diego', 'Vale', 'Nahuel', 'Cami', 'Pau', 'Gonza', 'Flor', 'Agus'];
const avatar = i => ['#c97b5a', '#7a8fc9', '#c9b25a', '#6cb3a0', '#b56cc9'][i % 5];
function marco(titulo, sub = '', fondo = '#111215', barra = '#1d1e22', tc = '#fff') {
  return `<rect x="190" y="250" width="700" height="1460" fill="${fondo}"/><rect x="190" y="250" width="700" height="170" fill="${barra}"/>${T(230, 370, 50, titulo, {w: 800, c: tc})}${sub ? T(230, 405, 26, sub, {w: 500, c: '#99a'}) : ''}`;
}
function contadorRojo(txt) { return `<rect x="560" y="330" width="300" height="60" rx="30" fill="#e5484d"/>${T(710, 372, 32, txt, {w: 800, a: 'middle'})}`; }
function tarjetasPasos(items, paso, y0 = 1060, fondo = '#fff', tinta = TINTA) {
  return items.map((it, i) => paso > i ? `<g transform="translate(0,${y0 + i * 150})"><rect x="230" y="0" width="620" height="128" rx="24" fill="${fondo}" stroke="${NAR}" stroke-width="5"/><circle cx="292" cy="64" r="34" fill="${NAR}"/>${T(292, 77, 36, i + 1, {w: 800, a: 'middle'})}${T(350, 76, it.length > 18 ? 30 : 36, it, {c: tinta})}</g>` : '').join('');
}
function chatsLista(n, frio, msgs, y0 = 440, filas = 8) {
  let s = '';
  for (let i = 0; i < filas; i++) { const y = y0 + i * 150; const c = frio > 0 ? `rgb(${Math.round(lerp(38, 70, frio))},${Math.round(lerp(40, 110, frio))},${Math.round(lerp(46, 160, frio))})` : '#26282d';
    s += `<rect x="205" y="${y}" width="670" height="135" rx="20" fill="${c}"/><circle cx="270" cy="${y + 67}" r="40" fill="${avatar(i)}"/>${T(330, y + 58, 34, nombres[(i + n) % nombres.length])}${T(330, y + 104, 28, msgs[(i * 3 + n) % msgs.length], {w: 500, c: '#aab'})}
      <circle cx="835" cy="${y + 90}" r="20" fill="${NAR}"/>${T(835, y + 99, 24, 1 + (i * 7 + n) % 4, {w: 800, a: 'middle'})}`; }
  return s;
}
const PANT = {
  // catálogo de WhatsApp Business: fotos sueltas → catálogo ordenado
  catalogo(n, {frio = 0, orden = 0}, C) {
    if (!orden) { let s = marco('Dulce Almagro', 'fotos enviadas', '#0f1714', '#1a2420') + contadorRojo(`${n} sin responder`);
      for (let i = 0; i < 10; i++) { const x = 230 + (i % 2) * 330 + (hash(i) - .5) * 40, y = 460 + Math.floor(i / 2) * 230 + (hash(i + 5) - .5) * 30;
        s += `<g transform="rotate(${(hash(i + 2) - .5) * 14},${x + 140},${y + 100})"><rect x="${x}" y="${y}" width="290" height="200" rx="16" fill="#fff"/><rect x="${x + 12}" y="${y + 12}" width="266" height="176" rx="10" fill="${['#f2c6a8', '#c97b5a', '#fbe3cf', '#e5a3a3', '#f7d38a'][i % 5]}" opacity="${1 - frio * .5}"/><circle cx="${x + 145}" cy="${y + 100}" r="50" fill="#fff" opacity=".6"/></g>`; }
      return s + `<rect x="230" y="1600" width="420" height="80" rx="40" fill="#26282d"/>${T(260, 1652, 30, '¿Precio? ¿Precio?', {w: 600, c: '#ccd'})}`; }
    let s = marco('Catálogo', 'Dulce Almagro · WhatsApp Business', '#f6f1ea', '#e9e1d6', TINTA);
    const prods = C.prods || ['Torta de ricota', 'Lemon pie', 'Chocotorta', 'Alfajores'];
    prods.forEach((p, i) => { const x = 220 + (i % 2) * 330, y = 450 + Math.floor(i / 2) * 300;
      s += `<rect x="${x}" y="${y}" width="310" height="280" rx="22" fill="#fff"/><rect x="${x + 14}" y="${y + 14}" width="282" height="160" rx="14" fill="${['#f2c6a8', '#c97b5a', '#fbe3cf', '#e5a3a3'][i]}"/>${T(x + 22, y + 220, 28, p, {c: TINTA})}${orden >= 2 ? T(x + 22, y + 260, 24, 'Consultar', {w: 800, c: NAR}) : ''}`; });
    return s + tarjetasPasos(C.cards || [], orden, 1060);
  },
  // web en el celular: no se encuentra el botón → botón claro
  web(n, {frio = 0, orden = 0}, C) {
    let s = `<rect x="190" y="250" width="700" height="1460" fill="#f6f1ea"/><rect x="190" y="250" width="700" height="120" fill="#e9e1d6"/><rect x="220" y="285" width="640" height="56" rx="28" fill="#fff"/>${T(250, 323, 28, C.url || 'dulcealmagro.com', {f: 'Manrope', c: '#5D493D'})}`;
    const carga = C.lenta && !orden ? 1 - frio * .8 : 1; s += `<rect x="190" y="370" width="${700 * carga}" height="10" fill="${NAR}"/>`;
    if (carga < .99) return s + `<circle cx="540" cy="900" r="70" fill="none" stroke="#d8cbbd" stroke-width="14"/><path d="M540,830 A70,70 0 0,1 610,900" stroke="${NAR}" stroke-width="14" fill="none" transform="rotate(${n * 40},540,900)"/>${T(540, 1060, 36, 'Cargando…', {c: '#8a7a6c', a: 'middle'})}`;
    if (!orden) { // web pensada para compu: texto diminuto y cortado, sin botón
      s += `<rect x="230" y="420" width="1100" height="300" rx="10" fill="#d9c7b4"/>`; for (let i = 0; i < 16; i++) s += `<rect x="230" y="${760 + i * 44}" width="${900 + hash(i) * 300}" height="16" rx="6" fill="#a8968a" opacity="${.9 - frio * .4}"/>`;
      return s + `<rect x="230" y="1500" width="620" height="90" rx="14" fill="#e9e1d6"/>${T(540, 1558, 30, '¿Dónde pido?', {c: '#8a7a6c', a: 'middle'})}`; }
    s += `<rect x="230" y="420" width="620" height="360" rx="24" fill="#d9c7b4"/><circle cx="540" cy="600" r="110" fill="#fbe3cf"/><rect x="230" y="810" width="420" height="44" rx="10" fill="${TINTA}" opacity=".85"/><rect x="230" y="880" width="560" height="26" rx="8" fill="#a8968a"/>`;
    return s + tarjetasPasos(C.cards || [], orden, 960, '#fff') + (orden >= 1 ? `<rect x="230" y="1500" width="620" height="110" rx="55" fill="#25D366"/>${T(540, 1568, 40, C.boton || 'Pedir por WhatsApp', {w: 800, a: 'middle'})}` : '');
  },
  // chats (precio, respuestas rápidas, etiquetas, seguimientos)
  chats(n, {frio = 0, orden = 0}, C) {
    const msgs = C.msgs || ['¿Precio?', '¿Hacen envíos?', '¿Sigue disponible?', '¿Aceptan transferencia?', '¿Hasta qué hora abren?', 'Hola', '¿Hay de chocolate?', '¿Me lo reservás?'];
    if (!orden) return marco(C.titulo || 'Chats') + contadorRojo(`${n} sin leer`) + chatsLista(n, frio, msgs);
    let s = marco(C.titulo || 'Chats'); const et = C.etapas || [['Nuevo', '#4E9BE4'], ['Presupuesto', NAR], ['Seguimiento', '#2ecc71']];
    for (let i = 0; i < 4; i++) { const y = 440 + i * 150; s += `<rect x="205" y="${y}" width="670" height="135" rx="20" fill="#26282d"/><circle cx="270" cy="${y + 67}" r="40" fill="${avatar(i)}"/>${T(330, y + 58, 34, nombres[(i + n) % nombres.length])}${T(330, y + 104, 28, msgs[(i * 3 + n) % msgs.length], {w: 500, c: '#aab'})}`;
      const [e, col] = et[i % et.length]; s += `<rect x="640" y="${y + 24}" width="${e.length * 17 + 30}" height="40" rx="20" fill="${col}"/>${T(655, y + 52, 24, e)}`; }
    return s + tarjetasPasos(C.cards || [], orden, 1060, '#1d1e22', '#fff');
  },
  // perfil de Google / reseñas / fotos
  google(n, {frio = 0, orden = 0}, C) {
    let s = `<rect x="190" y="250" width="700" height="1460" fill="#f4f6f8"/><rect x="220" y="290" width="640" height="70" rx="35" fill="#fff" stroke="#d6dbe1" stroke-width="3"/>${T(260, 336, 28, C.busca || 'pastelería en Almagro', {f: 'Manrope', c: '#5a6270'})}`;
    // mapa
    s += `<rect x="190" y="390" width="700" height="440" fill="#e3eadf"/>${[0, 1, 2, 3, 4].map(i => `<rect x="${190 + i * 160}" y="390" width="22" height="440" fill="#fff"/><rect x="190" y="${430 + i * 90}" width="700" height="18" fill="#fff"/>`).join('')}`;
    const pins = [[300, 560], [700, 500], [520, 720], [800, 690]]; pins.forEach(([x, y], i) => s += `<path d="M${x},${y} c-14,-24 -34,-40 -34,-62 a34,34 0 1 1 68,0 c0,22 -20,38 -34,62 Z" fill="${i === 2 && orden ? NAR : '#9aa3ad'}"/>`);
    if (!orden) { s += `<rect x="220" y="860" width="640" height="200" rx="20" fill="#fff"/>${T(250, 920, 34, C.vacio || 'Sin perfil de empresa', {c: '#9aa3ad'})}${T(250, 970, 26, C.vacioSub || 'Sin horarios · Sin fotos · Sin reseñas', {w: 500, c: '#b0b7bf'})}`;
      return s + `<rect x="220" y="1100" width="640" height="${180 - frio * 60}" rx="20" fill="#fff" opacity="${1 - frio * .6}"/>${T(250, 1170, 30, 'Otra pastelería · ★★★★★', {c: '#5a6270'})}`; }
    s += `<rect x="220" y="860" width="640" height="190" rx="20" fill="#fff" stroke="${NAR}" stroke-width="5"/>${T(250, 915, 36, 'Dulce Almagro', {w: 800, c: TINTA})}${T(250, 960, 28, orden >= 2 ? (C.estrellas || '★★★★★ reseñas') : 'Pastelería · Almagro', {w: 600, c: orden >= 2 ? '#e8a500' : '#5a6270'})}${T(250, 1005, 26, 'Abierto · Cierra 20:00', {w: 600, c: '#1e8e3e'})}`;
    return s + tarjetasPasos(C.cards || [], orden, 1080, '#fff');
  },
  // agenda / seguimiento / horarios: calendario
  agenda(n, {frio = 0, orden = 0}, C) {
    let s = marco(C.titulo || 'Seguimientos', '', '#f6f1ea', '#e9e1d6', TINTA);
    const dias = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    dias.forEach((d, i) => s += T(250 + i * 90, 470, 30, d, {c: '#8a7a6c', a: 'middle', w: 800}));
    for (let i = 0; i < 28; i++) { const x = 210 + (i % 7) * 90, y = 500 + Math.floor(i / 7) * 100; const marcado = orden && [2, 5, 9, 16].includes(i);
      s += `<rect x="${x}" y="${y}" width="80" height="86" rx="12" fill="${marcado ? NAR : '#fff'}" opacity="${!orden ? 1 - frio * .4 : 1}"/>${T(x + 40, y + 55, 28, i + 1, {c: marcado ? '#fff' : '#5D493D', a: 'middle'})}`; }
    if (!orden) return s + `<rect x="230" y="960" width="620" height="120" rx="24" fill="#fff"/>${T(260, 1035, 34, C.vacio || 'Nada agendado', {c: '#b0a090'})}` + `<rect x="230" y="1110" width="620" height="120" rx="24" fill="#fff" opacity=".7"/>${T(260, 1185, 30, C.vacioSub || '«Lo pienso» · hace 9 días', {w: 600, c: '#c0a898'})}`;
    return s + tarjetasPasos(C.cards || [], orden, 960, '#fff');
  },
  // perfil de Instagram con el link de la bio
  bio(n, {frio = 0, orden = 0}, C) {
    let s = `<rect x="190" y="250" width="700" height="1460" fill="#fff"/>${T(230, 340, 34, 'dulce.almagro', {w: 800, c: TINTA})}<circle cx="300" cy="470" r="80" fill="${NAR}"/><circle cx="300" cy="470" r="70" fill="#fbe3cf"/>
      ${['Publicaciones', 'Seguidores', 'Seguidos'].map((x, i) => T(480 + i * 140, 480, 22, x, {w: 500, c: '#666', a: 'middle'})).join('')}${T(230, 600, 30, 'Dulce Almagro · Pastelería', {c: TINTA})}`;
    s += !orden ? `${T(230, 650, 26, C.linkMal || 'linktr.ee/… (link roto)', {w: 600, c: frio > .3 ? '#e5484d' : '#3b5998'})}<rect x="230" y="680" width="620" height="2" fill="#eee"/>`
      : `${T(230, 650, 26, C.linkBien || 'dulcealmagro.com/pedidos', {w: 700, c: '#3b5998'})}`;
    for (let i = 0; i < 9; i++) s += `<rect x="${195 + (i % 3) * 232}" y="${720 + Math.floor(i / 3) * 232}" width="228" height="228" fill="${['#f2c6a8', '#c97b5a', '#fbe3cf', '#e5a3a3', '#f7d38a', '#d8b38f'][i % 6]}" opacity="${orden ? .35 : 1}"/>`;
    return s + tarjetasPasos(C.cards || [], orden, 1060, '#fff');
  },
};

export async function armar(V) {
  const C = V.cfg || {}; const PJ = PJS[C.pj || 'romina']; const QUIEN = C.q || 'laura';
  const pant = PANT[C.pantalla || 'chats']; const scr = (n, o) => pant(n, o, C);
  const O = obra(V, {nombre: 'Kocos Marketing', logo: 'marketing.png', ctaSub: C.ctaSub || 'y te respondemos', hookHTML: C.hook, hookHasta: C.hookHasta || 1.6, notas: []});
  document.documentElement.style.cssText += `--f1:Outfit;--f2:Manrope;--acc:${NAR};--hs:130px;--hw:800;--em:normal;--kwCol:#fff;--logoH:90px;--velo:rgba(27,27,27,.92);--ctaTop:640px;--hookTop:1150px;${ganchoCss(C.hook)}`;
  const st = document.createElement('style'); st.textContent = '#hook{text-shadow:0 0 6px rgba(0,0,0,.9),0 6px 30px rgba(0,0,0,.95),0 0 60px rgba(0,0,0,.7)}'; document.head.appendChild(st);
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pL = poser(V, QUIEN);
  const mueble = C.lugar === 'vereda' ? `<rect x="560" y="1300" width="0" height="0"/>` : `<rect x="540" y="1130" width="700" height="300" rx="14" fill="${C.lugar === 'cocina' ? '#e9dccb' : '#4a3a30'}"/><rect x="540" y="1130" width="700" height="26" rx="8" fill="${C.lugar === 'cocina' ? '#cbb8a4' : '#6a5444'}"/>` +
    (C.lugar === 'cocina' || C.lugar === 'mostrador' ? `<g transform="translate(1080,1100)"><rect x="-90" y="-20" width="180" height="20" rx="8" fill="#ddd"/><rect x="-80" y="-110" width="160" height="90" rx="16" fill="#fbe3cf"/><rect x="-80" y="-110" width="160" height="26" rx="12" fill="${NAR}"/></g>` : '');
  const e1 = O.esc({nombre: 'lugar', fondo: '#3a2a22', capas: [
    {f: .6, prof: .6, w: 1500, svg: lugarSVG(C.lugar || 'local', C)},
    {f: 1, prof: 1, w: 1500, svg: '<g class="act"></g>' + mueble + `<g class="tel"><rect x="760" y="1110" width="90" height="22" rx="8" fill="${NAR}"/></g>`}]});
  const pj = personaje(e1.capas[1].svg.querySelector('.act'), PJ); const tel = e1.capas[1].svg.querySelector('.tel');
  const cm = PP.celularMano({piel: PJ.piel, funda: NAR, manga: PJ.campera});
  const e2 = O.esc({nombre: 'celu', fondo: TINTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${C.fondoCelu || TINTA}"/><circle cx="540" cy="900" r="600" fill="${NAR}" opacity=".12"/>`}, {f: 1, prof: 1, svg: cm.svg + `<g class="contador"></g>`}]});
  const P = e2.capas[1].svg.querySelector('.pantalla'), cont = e2.capas[1].svg.querySelector('.contador');
  luz(e1, C.luz || 'background:radial-gradient(circle at 70% 35%,rgba(255,170,100,.45),transparent 50%),linear-gradient(180deg,transparent 55%,rgba(20,10,0,.35));mix-blend-mode:soft-light');
  const pings = t => (t > .1 && t < 2.6) ? Math.sin(t * 95) * 5 * (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
  const contador = (t, n) => { cont.innerHTML = `<g transform="translate(540,190) scale(${1 + .08 * Math.max(0, Math.sin(t * 9))})"><rect x="-260" y="-50" width="520" height="100" rx="50" fill="#e5484d"/>${T(0, 16, 42, `${C.contador || 'Ventas perdidas'}: ${n}`, {w: 800, a: 'middle'})}</g>`; };
  const N0 = C.n0 || 31, N1 = C.n1 || 47; const prop = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="${NAR}"/>`;
  const f1 = V.frases[1], fFrio = F('frio'), fGiro = F('giro');
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(700, 730, k), Y: lerp(1060, 1040, k), z: lerp(1.8, 1.92, ease(k)), foco: 1, ap: 5}), act: t => { tel.setAttribute('transform', `translate(${pings(t)},0)`);
      pL(pj, t, {x: 640, y: 1430, s: 1.0, flip: 1, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8 + wob(t) * 3, mira: .2}); }},
    {t0: f1.t - .05, esc: e2, cam: k => ({x: 540, y: lerp(1000, 960, k), z: lerp(1.0, 1.08, ease(k)), foco: 1}), act: t => { const n = Math.round(lerp(N0, N1, easeOut(win(t, f1.t, f1.t + 1.6)))); P.innerHTML = scr(n, {}); contador(t, Math.round(lerp(1, 6, win(t, f1.t, fFrio.fin)))); }},
    {t0: fFrio.t + .6, esc: e2, cam: k => ({x: 540, y: 980, z: lerp(1.08, 1.18, ease(k)), r: lerp(0, -2, k), foco: 1}), act: t => { P.innerHTML = scr(N1, {frio: easeOut(win(t, fFrio.t + .6, fFrio.fin))}); contador(t, Math.round(lerp(4, 9, win(t, fFrio.t, fFrio.fin + .4)))); }},
    {t0: fGiro.t - .05, esc: e2, cam: k => ({x: 540, y: 960, z: lerp(1.12, 1.0, ease(k)), foco: 1}), act: t => { P.innerHTML = scr(N1, {orden: win(t, fGiro.t + .3, fGiro.t + .6) > 0 ? 1 : 0}); cont.innerHTML = ''; }},
    {t0: FI(1).t - .1, esc: e2, cam: k => ({x: lerp(560, 540, k), y: lerp(1150, 1120, k), z: 1.4, foco: 1}), act: t => { P.innerHTML = scr(N1, {orden: 1}); }},
    {t0: FI(2).t - .1, esc: e2, cam: k => ({x: 540, y: lerp(1300, 1270, k), z: 1.45, foco: 1}), act: t => { P.innerHTML = scr(N1, {orden: 2}); }},
    {t0: FI(3).t - .1, esc: e2, cam: k => ({x: 540, y: 1380, z: lerp(1.35, 1.5, ease(k)), foco: 1}), act: t => { P.innerHTML = scr(N1, {orden: 3}); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(680, 700, k), Y: 1000, z: lerp(2.2, 2.3, ease(k)), foco: 1, ap: 5}), act: t => { pL(pj, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, hL: 20, cL: 30, ceja: .5, sonrisa: 1, mira: .3, cab: 4}); pj.E.propMano.innerHTML = prop; }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 700, Y: 1000, z: lerp(2.3, 2.4, k), foco: 1, ap: 10}), act: t => pL(pj, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 700, Y: 1060, z: 1.8, foco: 1, ap: 5}), act: t => { pj.E.propMano.innerHTML = ''; pL(pj, t, {x: 640, y: 1430, s: 1.0, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8}); }},
  ];
  O.tomas[0].boca = sobre(e1, 1, pj); O.tomas[7].boca = sobre(e1, 1, pj);
  // planos irreales: la protagonista diminuta frente al objeto de marca gigante que cae, y la caída libre
  const ir = C.irreal || {};
  const G = gigante(O, {pj: PJ, doc: ir.doc || 'Sin responder', papel: ir.papel || ['#c9ac93', '#FFE7D0', '#fff6ec'], renglon: ir.renglon || '#e8c9ad', tinta: '#5D493D', cielo: ir.cielo || ['#6a3a1c', '#2a1a12', '#120c08'], acento: ir.acento || NAR, objeto: ir.objeto || 'celu', fuente: 'Outfit'});
  const K = caida(O, {pj: PJ, fondo: ir.fondo || ['#5a2c12', '#120c08'], hoja: ir.hoja || '#FFE7D0', renglon: '#e8c9ad', raya: ir.raya || '#FFE7D0', acento: NAR});
  const f3 = V.frases[3], f4 = V.frases[4], f5 = V.frases[5];
  O.tomas.push(G.toma(f3.t - .05, f4.t + .02), K.toma(f5.t - .1)); O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f4.t + .02]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f4.t + .02 ? .45 * Math.exp(-(t - f4.t - .02) * 10) : 0);
  // apertura en el celular: toma propia (no copia de una toma ya envuelta por variar, que con cámara en mano se desborda)
  const abreCelu = {esc: e2, cam: (k, t) => { const g = Math.exp(-t * 5); return {x: 540 + Math.sin(t * 61) * 22 * g, y: lerp(560, 760, ease(k)), z: lerp(1.9, 1.35, ease(k)), r: Math.sin(t * 47) * 3 * g, foco: 1}; },
    act: t => { P.innerHTML = scr(N0, {}); contador(t, 1); }};
  if (C.ap || C.grade || C.cam) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : C.ap === 'celu' ? abreCelu : null);
  return O;
}
