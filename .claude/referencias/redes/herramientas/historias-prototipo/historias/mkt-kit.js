// Kocos Marketing · kit de mini historias del cronograma x2 (21/11 en adelante). Cada reel (historias/mkt-<id>.js) elige:
//   lugar  · dónde pasa la escena con Romina (mostrador, cocina, vidriera, esquina, colectivo, plaza, dormitorio, mesa)
//   pant   · qué muestra la pantalla del celular naranja (chats, web, check, seguir, estados, form, mapa, solicitudes, resenas, bio, ausencia, respuestas, catalogo, api, etiquetas, precio, agenda)
//   pp     · el primer plano del punto 2 (vitrina, libreta, notebook, celu, reloj, contador)
//   objeto · lo que cae gigante en el plano irreal (camara, burbuja, estrella, torta, pin, libreta, reloj, etiqueta, celu, lupa)
// Interfaces genéricas dibujadas a mano: sin logos ni pantallas copiadas de terceros. Sin carteles de «situación ilustrativa».
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, wob, clamp, backOut, hash} from '../historia/base.js';
import {personaje, parpadeo, respirar} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz, PJS, ganchoCss, variar, laptop} from './comun.js';
import {gigante, caida, OBJETOS} from '../historia/irreal.js';
export const NAR = '#FC6E20', TINTA = '#1B1B1B', CREMA = '#FFE7D0', CAFE = '#5D493D';
const TOMI = {peinado: 'corto', piel: '#e0b394', pelo: '#2a1c12', remera: '#FC6E20', campera: '#1B1B1B', manga: 'larga', pantalon: '#2b3140', zapato: '#111'};
const T = (x, y, s, fs, w = 700, c = '#fff', a = 'start', f = 'Outfit') => `<text x="${x}" y="${y}" font-family="${f}" font-weight="${w}" font-size="${fs}" fill="${c}" text-anchor="${a}">${s}</text>`;

// ---------- objetos que caen gigantes (se suman a los de irreal.js) ----------
const ob = s => `<g transform="translate(0,-700) scale(2.3)">${s}</g>`;
Object.assign(OBJETOS, {
  camara: a => ob(`<rect x="-230" y="-150" width="460" height="300" rx="40" fill="#1b1b1b"/><rect x="-120" y="-200" width="140" height="70" rx="16" fill="#1b1b1b"/><circle r="110" fill="#2b2e35" stroke="${a}" stroke-width="22"/><circle r="60" fill="#0a0a0c"/><circle cx="-24" cy="-24" r="18" fill="#fff" opacity=".5"/><rect x="140" y="-120" width="60" height="34" rx="8" fill="${a}"/>`),
  burbuja: a => ob(`<path d="M-250,-200 Q-250,-260 -190,-260 L190,-260 Q250,-260 250,-200 L250,60 Q250,120 190,120 L-40,120 L-150,230 L-120,120 L-190,120 Q-250,120 -250,60 Z" fill="#fff"/><text y="-50" font-family="Outfit" font-weight="800" font-size="86" fill="${TINTA}" text-anchor="middle">«Lo</text><text y="60" font-family="Outfit" font-weight="800" font-size="86" fill="${a}" text-anchor="middle">pienso»</text>`),
  estrella: a => ob(`<path d="M0,-280 L70,-90 L270,-86 L112,36 L170,230 L0,116 L-170,230 L-112,36 L-270,-86 L-70,-90 Z" fill="${a}" stroke="#fff3d0" stroke-width="14"/><circle cx="-40" cy="-60" r="22" fill="#fff" opacity=".5"/>`),
  torta: a => ob(`<ellipse cx="0" cy="200" rx="270" ry="50" fill="#e9e2d6"/><rect x="-220" y="-20" width="440" height="210" rx="20" fill="#7a4a2e"/><rect x="-220" y="-20" width="440" height="60" rx="20" fill="${CREMA}"/>${[...Array(7)].map((_, i) => `<circle cx="${-180 + i * 60}" cy="40" r="22" fill="${CREMA}"/>`).join('')}<rect x="-170" y="-200" width="340" height="190" rx="18" fill="#8a5a3a"/><rect x="-170" y="-200" width="340" height="50" rx="18" fill="${CREMA}"/>${[...Array(5)].map((_, i) => `<circle cx="${-120 + i * 60}" cy="-206" r="20" fill="#d43b3b"/>`).join('')}<rect x="-8" y="-300" width="16" height="90" rx="6" fill="${a}"/><ellipse cx="0" cy="-312" rx="14" ry="24" fill="#ffd36b"/>`),
  pin: a => ob(`<path d="M0,260 C-60,140 -220,20 -220,-110 C-220,-232 -122,-320 0,-320 C122,-320 220,-232 220,-110 C220,20 60,140 0,260 Z" fill="${a}"/><circle cy="-110" r="96" fill="#fff"/><path d="M-50,-90 L-50,-130 Q-50,-160 -20,-160 L20,-160 Q50,-160 50,-130 L50,-90 Z" fill="${TINTA}"/><rect x="-60" y="-96" width="120" height="30" rx="8" fill="${a}"/>`),
  libreta: a => ob(`<rect x="-230" y="-300" width="460" height="600" rx="26" fill="${a}"/><rect x="-200" y="-280" width="420" height="560" rx="16" fill="#fff6ec"/>${[...Array(9)].map((_, i) => `<rect x="-160" y="${-210 + i * 56}" width="${260 + (i * 37) % 90}" height="10" rx="5" fill="#e8c9ad"/>`).join('')}${[...Array(8)].map((_, i) => `<circle cx="-230" cy="${-250 + i * 70}" r="16" fill="#c9c4bc"/>`).join('')}`),
  reloj: a => ob(`<circle r="270" fill="#fff6ec" stroke="${a}" stroke-width="36"/>${[...Array(12)].map((_, i) => `<rect x="-8" y="-240" width="16" height="${i % 3 ? 26 : 50}" rx="6" fill="${TINTA}" transform="rotate(${i * 30})"/>`).join('')}<rect x="-10" y="-170" width="20" height="180" rx="10" fill="${TINTA}" transform="rotate(-40)"/><rect x="-8" y="-210" width="16" height="220" rx="8" fill="${a}" transform="rotate(95)"/><circle r="22" fill="${TINTA}"/>`),
  etiqueta: a => ob(`<path d="M-260,-140 L120,-140 L260,0 L120,140 L-260,140 Q-290,140 -290,110 L-290,-110 Q-290,-140 -260,-140 Z" fill="${a}"/><circle cx="140" cy="0" r="32" fill="#fff"/><text x="-120" y="30" font-family="Outfit" font-weight="800" font-size="90" fill="#fff" text-anchor="middle">PEDIDO</text>`),
  rayo: a => ob(`<path d="M60,-320 L-180,40 L-20,40 L-80,320 L180,-60 L20,-60 Z" fill="${a}" stroke="#fff3d0" stroke-width="14"/>`),
  luna: a => ob(`<path d="M80,-260 A260,260 0 1,0 80,260 A200,200 0 1,1 80,-260 Z" fill="#f4e7c8"/><circle cx="-90" cy="-40" r="26" fill="#e4d4ae"/><circle cx="-40" cy="90" r="18" fill="#e4d4ae"/><text x="150" y="-150" font-family="Outfit" font-weight="800" font-size="110" fill="${a}">z</text>`),
  candado: a => ob(`<path d="M-130,-60 L-130,-150 A130,130 0 0,1 130,-150 L130,-60" fill="none" stroke="#cfd6e0" stroke-width="50"/><rect x="-200" y="-70" width="400" height="330" rx="40" fill="${a}"/><circle cy="70" r="40" fill="${TINTA}"/><rect x="-14" y="80" width="28" height="90" rx="10" fill="${TINTA}"/>`),
  link: a => ob(`<g transform="rotate(-35)"><rect x="-300" y="-90" width="330" height="180" rx="90" fill="none" stroke="${a}" stroke-width="54"/><rect x="-30" y="-90" width="330" height="180" rx="90" fill="none" stroke="#fff6ec" stroke-width="54"/></g>`),
});

// ---------- pantallas del celular (rect 190..890 × 250..1710) ----------
const fondoApp = (titulo, sub = '', claro = false) => `<rect x="190" y="250" width="700" height="1460" fill="${claro ? '#f6f1ea' : '#111215'}"/><rect x="190" y="250" width="700" height="170" fill="${claro ? '#efe5d8' : '#1d1e22'}"/>` +
  T(230, 392, titulo, 46, 800, claro ? TINTA : '#fff') + (sub ? T(230, 414, sub, 20, 600, claro ? CAFE : '#aab') : '');
const pastilla = (x, y, txt, col, fs = 26) => `<rect x="${x}" y="${y}" width="${txt.length * fs * .56 + 36}" height="${fs + 22}" rx="${(fs + 22) / 2}" fill="${col}"/>` + T(x + 18, y + fs + 4, txt, fs, 700);
const badge = (n, txt = 'sin leer') => `<rect x="630" y="356" width="240" height="52" rx="26" fill="#e5484d"/>` + T(750, 392, `${n} ${txt}`, 32, 800, '#fff', 'middle');
const avatar = (cx, cy, i, r = 40) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${['#c97b5a', '#7a8fc9', '#c9b25a', '#6cb3a0', '#b56cc9'][i % 5]}"/><circle cx="${cx}" cy="${cy - r * .2}" r="${r * .36}" fill="#fff" opacity=".55"/><path d="M${cx - r * .6},${cy + r * .7} Q${cx},${cy + r * .05} ${cx + r * .6},${cy + r * .7}" fill="#fff" opacity=".55"/>`;
const NOMBRES = ['Sofi', 'Martín', 'Lu', 'Rocío', 'Diego', 'Vale', 'Nahuel', 'Cami', 'Pau', 'Gonza', 'Flor', 'Marta'];
const MSGS = ['¿Tenés torta para 20?', '¿Precio?', '¿Hacen envíos?', '¿Sigue disponible?', '¿Aceptan transferencia?', '¿Pan dulce hay?', '¿Hasta qué hora abren?', 'Hola', '¿Me la reservás?', '¿Para el 24?'];
const fria = frio => frio > 0 ? `rgb(${Math.round(lerp(40, 70, frio))},${Math.round(lerp(42, 110, frio))},${Math.round(lerp(48, 160, frio))})` : '#26282d';
// lista de chats genérica: caos (sin leer) → orden (etiquetas, respuestas, seguimiento)
function chats(n, {frio = 0, orden = 0}, C) { const et = C.etapas || [['Consulta', '#4E9BE4'], ['Pedido', NAR], ['Entregado', '#2ecc71']];
  let s = fondoApp(C.titulo || 'Mensajes'); if (!orden) s += badge(n, C.badge || 'sin leer');
  for (let i = 0; i < 8; i++) { const y = 440 + i * 150; s += `<rect x="205" y="${y}" width="670" height="135" rx="20" fill="${fria(frio)}"/>${avatar(270, y + 67, i)}` + T(330, y + 58, NOMBRES[(i + n) % NOMBRES.length], 34) + T(330, y + 104, (C.msgs || MSGS)[(i * 3 + n) % (C.msgs || MSGS).length], 28, 500, '#aab');
    if (orden >= 1) { const [e, c] = et[i % 3]; s += pastilla(650, y + 22, e, c, 24); } else s += `<circle cx="835" cy="${y + 90}" r="20" fill="${NAR}"/>` + T(835, y + 99, 1 + (i * 7 + n) % 4, 24, 800, '#fff', 'middle'); }
  if (orden >= 2) s += `<rect x="215" y="1540" width="650" height="140" rx="26" fill="#1d1e22"/>` + T(240, 1600, 'Respuestas rápidas', 26, 700, '#aab') + (C.rapidas || ['Precios', 'Envíos', 'Plazos']).map((q, i) => pastilla(240 + i * 205, 1615, q, NAR, 26)).join('');
  if (orden >= 3) s += `<rect x="240" y="1250" width="600" height="110" rx="24" fill="#fff"/>` + T(275, 1300, C.aviso || 'Seguimiento agendado', 30, 800, TINTA) + T(275, 1340, C.aviso2 || 'Mañana 10:00 · Sofi · Pedido', 26, 500, '#555');
  return s; }
// tarjetas grandes con los 3 puntos (se usan en varias pantallas)
const tarjetas = (items, paso, y0 = 1000, claro = true) => items.map((it, i) => paso > i ? `<rect x="230" y="${y0 + i * 150}" width="620" height="128" rx="24" fill="${claro ? '#fff' : '#26282d'}" stroke="${NAR}" stroke-width="5"/><circle cx="292" cy="${y0 + 64 + i * 150}" r="34" fill="${NAR}"/>` + T(292, y0 + 77 + i * 150, i + 1, 36, 800, '#fff', 'middle') + T(350, y0 + 76 + i * 150, it, 34, 700, claro ? TINTA : '#fff') : '').join('');
const PANT = {
  chats,
  // web lenta → web que carga con botón de pedido (sin colores ni nombres de terceros)
  web(n, {frio = 0, orden = 0}, C) { const carga = orden ? 1 : 1 - frio * .85;
    let s = `<rect x="190" y="250" width="700" height="1460" fill="#f6f1ea"/><rect x="190" y="250" width="700" height="120" fill="#e9e1d6"/><rect x="220" y="285" width="640" height="56" rx="28" fill="#fff"/>` + T(250, 323, C.url || 'dulcealmagro.com', 28, 700, CAFE, 'start', 'Manrope') + `<rect x="190" y="370" width="${700 * carga}" height="10" fill="${NAR}"/>`;
    if (carga < 1) return s + `<circle cx="540" cy="900" r="70" fill="none" stroke="#d8cbbd" stroke-width="14"/><path d="M540,830 A70,70 0 0,1 610,900" stroke="${NAR}" stroke-width="14" fill="none" transform="rotate(${n * 40},540,900)"/>` + T(540, 1060, 'Cargando…', 40, 700, CAFE, 'middle');
    s += `<rect x="230" y="420" width="620" height="380" rx="24" fill="#d9c7b4"/>${OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', 'translate(540,640) scale(.6)')}` + T(230, 860, 'Dulce Almagro', 44, 800, TINTA) + `<rect x="230" y="890" width="560" height="26" rx="8" fill="#a8968a"/><rect x="230" y="930" width="500" height="26" rx="8" fill="#a8968a"/>`;
    return s + tarjetas(C.cards || [], orden) + (orden >= 1 ? `<rect x="230" y="1500" width="620" height="110" rx="55" fill="${NAR}"/>` + T(540, 1568, C.boton || 'Hacé tu pedido', 40, 800, '#fff', 'middle') : ''); },
  // checklist de diciembre: casilleros que se tildan
  check(n, {frio = 0, orden = 0}, C) { let s = fondoApp('Diciembre', 'Lista antes de la temporada', true);
    const its = C.cards || ['Mensaje de ausencia', 'Respuestas rápidas', 'Etiquetas por etapa'];
    if (!orden) { s += badge(n, 'pedidos'); for (let i = 0; i < 6; i++) { const y = 470 + i * 170; s += `<rect x="230" y="${y}" width="620" height="140" rx="22" fill="${frio ? fria(frio) : '#e9dfd2'}" transform="rotate(${(hash(i + n) - .5) * 6 * (1 + frio)},540,${y + 70})"/>` + T(270, y + 84, MSGS[(i + n) % MSGS.length], 34, 700, frio ? '#fff' : TINTA); } return s; }
    its.forEach((it, i) => { const y = 520 + i * 260, ok = orden > i; s += `<rect x="230" y="${y}" width="620" height="210" rx="28" fill="#fff" stroke="${ok ? NAR : '#d8cbbd'}" stroke-width="6"/><rect x="270" y="${y + 55}" width="100" height="100" rx="20" fill="${ok ? NAR : '#efe5d8'}"/>${ok ? `<path d="M290,${y + 105} l26,26 l40,-52" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` : ''}` + T(400, y + 118, it, 38, 800, TINTA); });
    return s + (orden >= 3 ? `<rect x="230" y="1360" width="620" height="120" rx="60" fill="${TINTA}"/>` + T(540, 1435, 'Listos para diciembre', 40, 800, NAR, 'middle') : ''); },
  // conversación con «lo pienso» y el seguimiento agendado
  seguir(n, {frio = 0, orden = 0}, C) { let s = fondoApp(C.contacto || 'Marta', 'clienta', false) + avatar(820, 335, 3, 44);
    const burb = (y, txt, mio, w = 440) => `<rect x="${mio ? 890 - 30 - w : 220}" y="${y}" width="${w}" height="96" rx="30" fill="${mio ? NAR : '#26282d'}"/>` + T(mio ? 890 - 30 - w + 30 : 250, y + 62, txt, 32, 700);
    s += burb(470, '¿Cuánto sale la de frutillas?', 0, 470) + burb(600, 'Te paso precio y fotos', 1, 390) + `<g transform="translate(0,0)" opacity="${1 - frio * .5}">${burb(730, 'Lo pienso', 0, 260)}</g>`;
    if (frio) s += `<rect x="190" y="860" width="700" height="${600 * frio}" fill="${fria(frio)}" opacity=".5"/>` + T(540, 1000, `${Math.round(frio * 9) + 1} días sin respuesta`, 40, 800, '#cfe3ff', 'middle');
    if (orden >= 1) s += `<rect x="230" y="900" width="620" height="120" rx="24" fill="#fff"/>` + T(260, 950, 'Anotado: Marta · «lo pienso»', 30, 800, TINTA) + T(260, 990, 'Viernes · frutillas', 26, 600, CAFE);
    if (orden >= 2) s += `<rect x="230" y="1050" width="620" height="120" rx="24" fill="${NAR}"/>` + T(260, 1100, 'Recordatorio: escribir el lunes', 30, 800) + T(260, 1140, 'Sin apuro, con algo nuevo', 26, 600);
    if (orden >= 3) s += burb(1220, 'Hoy salió esta. ¿Te guardo una?', 1, 600) + `<rect x="560" y="1340" width="300" height="220" rx="24" fill="#d9c7b4"/>${OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', 'translate(710,1480) scale(.32)')}`;
    return s; },
  // estados: aros vacíos → vidriera de fin de año
  estados(n, {frio = 0, orden = 0}, C) { let s = fondoApp('Estados', 'Tu vidriera', true);
    for (let i = 0; i < 4; i++) { const cx = 280 + i * 170; s += `<circle cx="${cx}" cy="530" r="66" fill="none" stroke="${orden ? NAR : '#c9bfb2'}" stroke-width="10" stroke-dasharray="${orden ? '0' : '18 12'}"/>${avatar(cx, 530, i, 52)}`; }
    if (!orden) return s + `<rect x="230" y="680" width="620" height="760" rx="30" fill="${frio ? fria(frio) : '#e9dfd2'}"/>` + T(540, 1080, 'Sin estados nuevos', 46, 800, frio ? '#cfe3ff' : CAFE, 'middle');
    const its = C.cards || ['Lo nuevo, foto real', 'Entregas de fiestas', '¿Te la reservo?'];
    s += `<rect x="230" y="680" width="620" height="760" rx="30" fill="${TINTA}"/>${OBJETOS.estrella('#ffd36b').replace('translate(0,-700) scale(2.3)', 'translate(720,800) scale(.3)')}${OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', 'translate(540,1080) scale(.9)')}`;
    for (let i = 0; i < 18; i++) s += `<circle cx="${250 + hash(i) * 580}" cy="${700 + hash(i + 5) * 120}" r="8" fill="${['#ffd36b', '#e5484d', '#2ecc71'][i % 3]}"/>`;
    return s + its.slice(0, orden).map((x, i) => pastilla(250, 1460 + i * 76, `${i + 1} · ${x}`, i === orden - 1 ? NAR : '#5D493D', 30)).join(''); },
  // formulario de pedidos: papelitos → campos que se completan
  form(n, {frio = 0, orden = 0}, C) { let s = fondoApp('Pedidos de fiestas', 'Formulario', true);
    if (!orden) { for (let i = 0; i < 7; i++) { const x = 260 + hash(i + 3) * 420, y = 480 + hash(i + 8) * 900; s += `<g transform="rotate(${(hash(i) - .5) * 40},${x + 110},${y + 70})"><rect x="${x}" y="${y}" width="230" height="150" fill="${frio ? fria(frio) : '#fff6b8'}"/>${[0, 1, 2].map(j => `<path d="M${x + 20},${y + 40 + j * 36} q50,-14 100,0 t90,0" stroke="#5a6" stroke-width="4" fill="none" opacity=".6"/>`).join('')}</g>`; }
      return s + `<rect x="300" y="1500" width="480" height="90" rx="45" fill="#e5484d"/>` + T(540, 1558, '¿Y el pedido de Marta?', 32, 800, '#fff', 'middle'); }
    const f = C.cards || ['Nombre y contacto', 'Qué y para cuántos', 'Día y hora'], v = C.vals || ['Marta · por mensaje', 'Torta frutillas · 12', '24/12 · 10:00 · retiro'];
    f.forEach((x, i) => { const y = 480 + i * 250; s += T(240, y, x, 32, 800, CAFE) + `<rect x="230" y="${y + 20}" width="620" height="120" rx="20" fill="#fff" stroke="${orden > i ? NAR : '#d8cbbd'}" stroke-width="5"/>` + (orden > i ? T(260, y + 96, v[i], 34, 700, TINTA) : ''); });
    return s + (orden >= 3 ? `<rect x="230" y="1300" width="620" height="120" rx="60" fill="${NAR}"/>` + T(540, 1378, 'Pedido guardado', 42, 800, '#fff', 'middle') : ''); },
  // mapa genérico dibujado: calles, manzanas y pines (sin logos de terceros)
  mapa(n, {frio = 0, orden = 0}, C) { let s = `<rect x="190" y="250" width="700" height="1460" fill="#e8e4da"/>`;
    for (let i = 0; i < 9; i++) s += `<rect x="190" y="${330 + i * 170}" width="700" height="34" fill="#fff"/><rect x="${230 + i * 140}" y="250" width="30" height="1460" fill="#fff"/>`;
    s += `<rect x="190" y="760" width="700" height="56" fill="#f6d68a"/><rect x="560" y="250" width="56" height="1460" fill="#f6d68a"/>` + T(250, 800, 'Av. Corrientes', 30, 800, CAFE, 'start', 'Manrope') + T(600, 1180, 'Medrano', 30, 800, CAFE, 'start', 'Manrope').replace('<text', '<text transform="rotate(90,600,1180)"');
    s += `<rect x="215" y="280" width="650" height="80" rx="40" fill="#fff" stroke="#d8cbbd" stroke-width="3"/>` + T(260, 333, C.busca || 'tortas en Almagro', 32, 700, TINTA, 'start', 'Manrope') + `<circle cx="820" cy="320" r="22" fill="none" stroke="${CAFE}" stroke-width="6"/>`;
    const pin = (x, y, c, s2 = 1) => `<g transform="translate(${x},${y}) scale(${s2})"><path d="M0,0 C-10,-20 -36,-40 -36,-62 C-36,-82 -20,-98 0,-98 C20,-98 36,-82 36,-62 C36,-40 10,-20 0,0 Z" fill="${c}"/><circle cy="-62" r="14" fill="#fff"/></g>`;
    [[330, 640], [760, 980], [300, 1240], [820, 520], [700, 1500]].forEach(([x, y], i) => { s += pin(x, y, frio ? '#8aa0b8' : '#9a8f86', .9); });
    if (!orden) return s + `<rect x="240" y="1560" width="600" height="110" rx="24" fill="#fff"/>` + T(270, 1628, 'Dulce Almagro: sin resultados', 32, 800, '#e5484d');
    const k = 1 + .1 * Math.max(0, Math.sin(n));
    s += pin(588, 800, NAR, 2.2 * k);
    s += `<rect x="230" y="1260" width="620" height="420" rx="30" fill="#fff"/>` + T(260, 1320, 'Dulce Almagro', 40, 800, TINTA) + T(260, 1362, 'Pastelería · Av. Corrientes y Medrano', 26, 600, CAFE);
    if (orden >= 1) s += pastilla(260, 1385, 'Abierto · horarios de fiestas', '#2e9e62', 24);
    if (orden >= 2) s += [0, 1, 2].map(i => `<rect x="${260 + i * 195}" y="${1450}" width="180" height="120" rx="16" fill="#d9c7b4"/>${OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', `translate(${350 + i * 195},1550) scale(.18)`)}`).join('');
    if (orden >= 3) s += pastilla(260, 1590, 'Llamar', NAR, 26) + pastilla(420, 1590, 'Sitio web', NAR, 26) + pastilla(610, 1590, 'Cómo llegar', TINTA, 26);
    return s; },
};
// pantallas armadas con la lista genérica (otras ideas del cronograma)
const listaDe = (titulo, msgs, extra = {}) => (n, o, C) => chats(n, o, Object.assign({titulo, msgs}, extra, C));
Object.assign(PANT, {
  solicitudes: listaDe('Solicitudes', ['Hola, ¿hacen tortas?', '¿Precio de la de 20?', 'Hace 3 semanas…', '¿Siguen abiertos?', '¿Me pasás el menú?'], {badge: 'esperando', etapas: [['Respondido', '#2ecc71'], ['Pedido', NAR], ['Consulta', '#4E9BE4']]}),
  ausencia: listaDe('03:00 · Mensajes', ['¿Mañana abren?', '¿Hacen envíos el 24?', '¿Horario de fiestas?', 'Quiero encargar', '¿Están?'], {badge: 'de madrugada', aviso: 'Respuesta automática enviada', aviso2: 'Horarios de fiestas · pedidos por formulario'}),
  respuestas: listaDe('Mensajes', ['¿Horarios?', '¿Precio de la torta?', '¿Hacen envíos?', '¿Horarios?', '¿Formas de pago?'], {rapidas: ['Horarios', 'Precios', 'Envíos']}),
  etiquetas: listaDe('Mensajes', MSGS, {etapas: [['Consulta', '#4E9BE4'], ['Presupuesto', NAR], ['Pagado', '#2ecc71']]}),
  precio: listaDe('Mensajes', ['¿Precio?', '¿Cuánto sale?', '¿Precio de la de 20?', 'Precio x privado', '¿Valor?'], {rapidas: ['Qué incluye', 'Entrega', 'Reservar']}),
  agenda: listaDe('Seguimientos', ['«Lo pienso»', 'Pidió fotos', 'Preguntó precio', 'Dijo «después veo»', 'Quiere para el 24'], {etapas: [['Hoy', NAR], ['3 días', '#4E9BE4'], ['1 semana', '#2ecc71']], aviso: 'Recordatorio de hoy', aviso2: 'Escribirle a Marta · con foto nueva'}),
  catalogo: listaDe('Catálogo', ['Torta frutillas', 'Pan dulce', 'Lemon pie', 'Alfajores', 'Budín'], {etapas: [['Con foto', NAR], ['Con precio', '#4E9BE4'], ['Disponible', '#2ecc71']]}),
  api: listaDe('Bandeja del equipo', MSGS, {etapas: [['Romina', NAR], ['Tomi', '#4E9BE4'], ['Automático', '#2ecc71']], aviso: 'Asignado a Tomi', aviso2: 'Pedido · respuesta en curso'}),
  bio: (n, o, C) => PANT.web(n, o, Object.assign({url: 'link de tu bio', cards: ['Promo vigente', 'Catálogo al día', 'Botón de pedido'], boton: 'Ver la promo de hoy'}, C)),
  resenas(n, {frio = 0, orden = 0}, C) { let s = fondoApp('Reseñas', 'Dulce Almagro', true);
    const est = (x, y, k, r = 22) => [0, 1, 2, 3, 4].map(i => `<path transform="translate(${x + i * r * 2.3},${y}) scale(${r / 30})" d="M0,-30 L9,-10 L30,-9 L13,5 L19,28 L0,15 L-19,28 L-13,5 L-30,-9 L-9,-10 Z" fill="${i < k ? '#ffb020' : '#d8cbbd'}"/>`).join('');
    if (!orden) return s + `<rect x="230" y="480" width="620" height="300" rx="28" fill="${frio ? fria(frio) : '#e9dfd2'}"/>` + T(540, 650, 'Todavía sin reseñas', 44, 800, frio ? '#cfe3ff' : CAFE, 'middle');
    const R2 = [['Marta', 'La de frutillas, un golazo.'], ['Lu', 'Atienden rapidísimo.'], ['Diego', 'Pedí para el 24 y llegó.']];
    return s + R2.slice(0, orden).map(([nm, tx], i) => { const y = 480 + i * 280; return `<rect x="230" y="${y}" width="620" height="240" rx="28" fill="#fff"/>${avatar(300, y + 70, i, 40)}` + T(360, y + 80, nm, 34, 800, TINTA) + est(380, y + 130, 5) + T(260, y + 205, tx, 32, 600, CAFE); }).join(''); },
});

// ---------- lugares de la escena con Romina (capa de fondo w 1500, acción en x≈640) ----------
const vitrinaSVG = (x, y, w = 700) => `<rect x="${x}" y="${y}" width="${w}" height="300" rx="14" fill="#4a3a30"/><rect x="${x + 20}" y="${y - 220}" width="${w - 40}" height="230" rx="10" fill="#cfe6ef" opacity=".35" stroke="#fff" stroke-width="4"/>` +
  [...Array(4)].map((_, i) => OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', `translate(${x + 110 + i * 160},${y - 30}) scale(.24)`)).join('') + `<rect x="${x}" y="${y}" width="${w}" height="26" rx="8" fill="#6a5444"/>`;
const LUGARES = {
  mostrador: C => ({fondo: '#3a2a22', bg: D.interior({w: 1500, pared: '#efe2d2', piso: '#7a5a44', ventana: [980, 300, 420, 700], vista: 'dia', zocalo: '#f6ece0', luz: '#ffd59a'}) + `<rect x="160" y="420" width="460" height="120" rx="10" fill="${TINTA}"/>` + T(390, 500, C.cartel || 'DULCE ALMAGRO', 54, 800, NAR, 'middle') + D.planta({x: 1380, y: 1420}),
    frente: vitrinaSVG(540, 1130), luz: 'background:radial-gradient(circle at 70% 30%,rgba(255,200,130,.45),transparent 50%);mix-blend-mode:soft-light'}),
  cocina: C => ({fondo: '#1e1712', bg: D.interior({w: 1500, pared: '#b9a58e', piso: '#4a3a2e', ventana: [940, 320, 420, 560], vista: 'noche', zocalo: '#d8c9b4', luz: '#ffcf86'}) + `<rect x="80" y="760" width="560" height="380" rx="16" fill="#cfd3d6"/><rect x="120" y="820" width="480" height="260" rx="12" fill="#1b1d22"/><circle cx="360" cy="950" r="60" fill="#ff8a3a" opacity=".35"/><rect x="80" y="720" width="560" height="50" rx="10" fill="#9aa1aa"/>` + D.lampara({x: 760, y: 200}),
    frente: `<rect x="520" y="1130" width="760" height="300" fill="#6b4c34"/><rect x="500" y="1110" width="800" height="34" rx="8" fill="#e8e2d8"/>` + OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', 'translate(1120,1100) scale(.32)') + `<rect x="900" y="1080" width="120" height="30" rx="6" fill="#fff6b8" transform="rotate(-8,960,1095)"/>`,
    luz: 'background:radial-gradient(circle at 55% 20%,rgba(255,190,110,.55),transparent 45%),linear-gradient(180deg,rgba(20,20,60,.25),rgba(0,0,0,.35));mix-blend-mode:soft-light'}),
  vidriera: C => ({fondo: '#120c0a', bg: D.barrio({w: 1700, piso: 1460, hora: 'noche', kiosco: false}) + `<rect x="300" y="560" width="900" height="900" rx="10" fill="#2a1a12"/><rect x="330" y="600" width="840" height="560" rx="8" fill="#ffe2a8" opacity=".92"/>` +
      [...Array(24)].map((_, i) => `<circle cx="${330 + i * 36}" cy="${600 + Math.sin(i * .9) * 14}" r="9" fill="${['#e5484d', '#ffd36b', '#2ecc71', NAR][i % 4]}"/>`).join('') + [...Array(3)].map((_, i) => OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', `translate(${480 + i * 270},1130) scale(.34)`)).join('') + `<rect x="420" y="480" width="660" height="110" rx="10" fill="${TINTA}"/>` + T(750, 556, C.cartel || 'DULCE ALMAGRO', 56, 800, NAR, 'middle'),
    frente: `<rect x="520" y="1160" width="760" height="40" rx="8" fill="#3a2a22"/>`, luz: 'background:radial-gradient(circle at 50% 40%,rgba(255,210,140,.5),transparent 55%);mix-blend-mode:soft-light'}),
  esquina: C => ({fondo: '#2a3560', bg: D.cielo({w: 1700, top: '#4a6aa8', mid: '#e7956a', bot: '#f6c58f'}) + D.barrio({w: 1700, piso: 1460, hora: 'tarde', kiosco: true}) + D.farol({x: 1200, y: 1460, noche: false}) + `<rect x="1180" y="760" width="300" height="70" rx="6" fill="#1f5fa8"/>` + T(1330, 808, 'AV. CORRIENTES', 30, 800, '#fff', 'middle', 'Archivo') + `<rect x="1180" y="840" width="300" height="70" rx="6" fill="#1f5fa8"/>` + T(1330, 888, 'MEDRANO', 30, 800, '#fff', 'middle', 'Archivo'),
    frente: `<rect x="500" y="1440" width="900" height="30" fill="#8c867d"/>`, luz: 'background:radial-gradient(circle at 70% 25%,rgba(255,180,110,.5),transparent 55%);mix-blend-mode:soft-light'}),
  colectivo: C => ({fondo: '#1c1c22', bg: `<rect x="-100" y="0" width="1700" height="1920" fill="#2b2f38"/>` + [0, 1, 2].map(i => `<svg x="${40 + i * 480}" y="380" width="440" height="560" viewBox="0 0 440 560">${D.barrio({w: 900, piso: 520, hora: 'tarde', kiosco: i === 1}).replace(/<rect/g, `<rect transform="translate(${-((i * 211) % 300)},0)"`)}</svg><rect x="${40 + i * 480}" y="380" width="440" height="560" rx="30" fill="none" stroke="#14161b" stroke-width="30"/>`).join('') + `<rect x="-100" y="980" width="1700" height="40" fill="#d8352a"/><rect x="740" y="200" width="24" height="1300" fill="#c9ccd2"/><rect x="-100" y="240" width="1700" height="20" fill="#c9ccd2"/>`,
    frente: `<rect x="900" y="1180" width="400" height="260" rx="30" fill="#2f5d8a"/><rect x="900" y="1100" width="400" height="120" rx="30" fill="#3d6d9a"/>`, luz: 'background:linear-gradient(90deg,rgba(255,200,140,.35),transparent 60%);mix-blend-mode:soft-light'}),
  plaza: C => ({fondo: '#7fb0d8', bg: D.cielo({w: 1700, top: '#7fb0d8', mid: '#cfe6f3', bot: '#f2efe4'}) + D.skyline({w: 1700, base: 1100, color: '#b9c3cf'}) + `<rect x="-100" y="1100" width="1800" height="900" fill="#7aa35a"/><path d="M-100,1300 Q750,1200 1700,1320 L1700,1420 Q750,1300 -100,1400 Z" fill="#d9c7a4"/>` + D.arbol({x: 200, y: 1250, s: 1.4}) + D.arbol({x: 1350, y: 1230, s: 1.6}) + D.farol({x: 1000, y: 1300, noche: false}),
    frente: `<rect x="420" y="1250" width="760" height="40" rx="10" fill="#6b4c34"/><rect x="440" y="1290" width="20" height="150" fill="#2a2c33"/><rect x="1140" y="1290" width="20" height="150" fill="#2a2c33"/><rect x="420" y="1120" width="760" height="30" rx="10" fill="#6b4c34"/>`, luz: 'background:radial-gradient(circle at 30% 20%,rgba(255,240,190,.45),transparent 55%);mix-blend-mode:soft-light'}),
  dormitorio: C => ({fondo: '#0b0f1e', bg: D.interior({w: 1500, pared: '#3a3f5a', piso: '#2a2630', ventana: [980, 300, 380, 520], vista: 'noche', zocalo: '#4a4f6a', luz: '#8fa8ff'}) + `<rect x="80" y="1020" width="820" height="320" rx="30" fill="#e6e1f0"/><rect x="60" y="900" width="140" height="440" rx="20" fill="#5a4a6a"/><rect x="100" y="960" width="260" height="110" rx="40" fill="#fff"/><path d="M200,1080 Q500,1000 900,1060 L900,1340 L200,1340 Z" fill="#7a8fc9"/>`,
    frente: `<rect x="980" y="1150" width="300" height="290" rx="16" fill="#4a3a30"/><rect x="960" y="1130" width="340" height="30" rx="8" fill="#6a5444"/>`, luz: 'background:radial-gradient(circle at 75% 60%,rgba(255,150,70,.35),transparent 35%),linear-gradient(180deg,rgba(20,30,90,.45),rgba(0,0,0,.4));mix-blend-mode:soft-light'}),
  mesa: C => ({fondo: '#2a221c', bg: D.interior({w: 1500, pared: '#e8dccb', piso: '#8a6b4f', ventana: [960, 320, 420, 600], vista: 'dia', zocalo: '#f3eadb', luz: '#fff1d0'}) + `<rect x="140" y="420" width="460" height="120" rx="10" fill="${TINTA}"/>` + T(370, 500, C.cartel || 'DULCE ALMAGRO', 54, 800, NAR, 'middle') + `<circle cx="1250" cy="560" r="110" fill="#fff6ec" stroke="${TINTA}" stroke-width="14"/><rect x="1244" y="480" width="12" height="86" fill="${TINTA}"/><rect x="1244" y="555" width="70" height="12" fill="${NAR}"/>`,
    frente: D.mesa({x: 900, y: 1150, w: 760, c: '#c49a6c', patas: 280}) + laptop({x: 1050, y: 1150, s: 1}), luz: 'background:radial-gradient(circle at 70% 30%,rgba(255,220,160,.45),transparent 55%);mix-blend-mode:soft-light'}),
};

// ---------- primeros planos (punto 2) ----------
const PRIMEROS = {
  vitrina: (txt) => `<rect width="1080" height="1920" fill="#2a1a12"/><circle cx="540" cy="760" r="700" fill="${NAR}" opacity=".18"/><rect x="40" y="420" width="1000" height="760" rx="30" fill="#cfe6ef" opacity=".25" stroke="#fff" stroke-width="8"/>` + [0, 1, 2].map(i => OBJETOS.torta(NAR).replace('translate(0,-700) scale(2.3)', `translate(${220 + i * 320},1060) scale(.52)`)).join('') + `<rect x="0" y="1180" width="1080" height="740" fill="#4a3a30"/><rect x="0" y="1180" width="1080" height="40" fill="#6a5444"/>`,
  libreta: () => `<rect width="1080" height="1920" fill="#3a2a22"/>` + OBJETOS.libreta(NAR).replace('translate(0,-700) scale(2.3)', 'translate(540,940) scale(1.5) rotate(-6)'),
  notebook: () => `<rect width="1080" height="1920" fill="#1e2230"/>` + laptop({x: 540, y: 1200, s: 3.2}) + [['#e5484d', 260, 880], ['#ffd36b', 760, 900], ['#2ecc71', 420, 1060], [NAR, 680, 1080]].map(([c, x, y], i) => `<circle cx="${x}" cy="${y}" r="46" fill="${c}" transform="rotate(${i * 20},${x},${y})"/><rect x="${x - 30}" y="${y - 10}" width="60" height="20" rx="8" fill="#fff" opacity=".6"/>`).join(''),
  celu: () => `<rect width="1080" height="1920" fill="${TINTA}"/><circle cx="540" cy="960" r="640" fill="${NAR}" opacity=".16"/>` + OBJETOS.celu(NAR).replace('translate(0,-700) scale(2.3)', 'translate(540,1000) scale(2.3) rotate(-8)'),
  reloj: () => `<rect width="1080" height="1920" fill="#efe2d2"/>` + OBJETOS.reloj(NAR).replace('translate(0,-700) scale(2.3)', 'translate(540,900) scale(1.6)'),
  contador: () => `<rect width="1080" height="1920" fill="${TINTA}"/><rect x="140" y="640" width="800" height="300" rx="150" fill="#e5484d"/>` + T(540, 830, 'sin responder', 90, 800, '#fff', 'middle'),
};

export async function armarKit(V, X = {}) {
  const C = Object.assign({}, X, V.cfg || {}); const PJ = C.pj === 'tomi' ? TOMI : PJS[C.pj || 'romina']; const QUIEN = C.q || 'romina';
  const pantalla = (n, o) => (PANT[C.pant] || PANT.chats)(n, o, C);
  const O = obra(V, {nombre: 'Kocos Marketing', logo: 'marketing.png', ctaSub: 'y te respondemos', hookHTML: C.hook, hookHasta: 1.6, notas: []});
  { const st = document.createElement('style'); st.textContent = '#num{left:50px!important;width:250px!important;top:120px!important;font-size:200px!important}'; document.head.appendChild(st); }
  document.documentElement.style.cssText += `--f1:Outfit;--f2:Manrope;--acc:${NAR};--hs:130px;--hw:800;--em:normal;--kwCol:#fff;--logoH:90px;--velo:rgba(27,27,27,.92);--ctaTop:640px;${ganchoCss(C.hook)};--hookTop:${C.hookTop || 1150}px`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pL = poser(V, QUIEN); const fr = V.frases;
  // 1 · el lugar con Romina (y Tomi si la idea lo pide)
  const L = (LUGARES[C.lugar] || LUGARES.mostrador)(C);
  const e1 = O.esc({nombre: 'lugar', fondo: L.fondo, capas: [{f: .6, prof: .6, w: 1500, svg: L.bg}, {f: 1, prof: 1, w: 1500, svg: '<g class="act2"></g><g class="act"></g>' + L.frente + `<g class="tel"><rect x="760" y="${C.lugar === 'esquina' || C.lugar === 'plaza' ? 2000 : 1110}" width="90" height="22" rx="8" fill="${NAR}"/></g>`}]});
  const rom = personaje(e1.capas[1].svg.querySelector('.act'), PJ); const tel = e1.capas[1].svg.querySelector('.tel');
  const tomi = C.tomi ? personaje(e1.capas[1].svg.querySelector('.act2'), TOMI) : null;
  const poseT = t => tomi && tomi.pose({x: 1010, y: 1430, s: .96, flip: -1, parpado: parpadeo(t, 3), respira: respirar(t), hR: 20, cR: 30, hL: 120 + Math.sin(t * 3) * 10, cL: 60, sonrisa: .3, mira: -.4});
  luz(e1, L.luz);
  // 2 · el celular naranja en primer plano
  const cm = PP.celularMano({piel: PJ.piel, funda: NAR, manga: PJ.campera});
  const e2 = O.esc({nombre: 'celu', fondo: C.claro ? '#f6e6d6' : TINTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${C.claro ? '#f6e6d6' : TINTA}"/><circle cx="540" cy="900" r="600" fill="${NAR}" opacity=".14"/>`}, {f: 1, prof: 1, svg: cm.svg + `<g class="contador"></g>`}]});
  const pant = e2.capas[1].svg.querySelector('.pantalla'), cont = e2.capas[1].svg.querySelector('.contador');
  // 3 · primer plano del punto 2 con la tarjeta del punto
  const e3 = O.esc({nombre: 'pp', fondo: TINTA, capas: [{f: .5, prof: .5, svg: (PRIMEROS[C.pp] || PRIMEROS.vitrina)()}, {f: 1, prof: 1, svg: '<g class="card"></g>'}]});
  const card = e3.capas[1].svg.querySelector('.card');
  const pings = t => (t > .1 && t < 2.6) ? Math.sin(t * 95) * 5 * (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
  const contador = (t, n) => { cont.innerHTML = `<g transform="translate(540,190) scale(${1 + .08 * Math.max(0, Math.sin(t * 9))})"><rect x="-270" y="-50" width="540" height="100" rx="50" fill="#e5484d"/>` + T(0, 16, `${C.contador || 'Sin responder'}: ${n}`, 44, 800, '#fff', 'middle') + '</g>'; };
  const n0 = C.n0 || 47, f2 = F('frio'), gi = F('giro');
  const prop = () => { rom.E.propMano.innerHTML = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="${NAR}"/>`; };
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(700, 730, k), Y: lerp(1060, 1040, k), z: lerp(1.8, 1.92, ease(k)), foco: 1, ap: 5}), act: t => { tel.setAttribute('transform', `translate(${pings(t)},0)`); poseT(t);
      pL(rom, t, {x: 640, y: 1430, s: 1.0, flip: 1, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8 + wob(t) * 3, mira: .2}); }},
    {t0: fr[1].t - .05, esc: e2, cam: k => ({x: 540, y: lerp(1000, 960, k), z: lerp(1.0, 1.08, ease(k)), foco: 1}), act: t => { const n = Math.round(lerp(n0 * .6, n0, easeOut(win(t, fr[1].t, fr[1].t + 1.6)))); pant.innerHTML = pantalla(n, {}); contador(t, Math.round(lerp(1, 6, win(t, fr[1].t, f2.fin)))); }},
    {t0: f2.t + .9, esc: e2, cam: k => ({x: 540, y: 980, z: lerp(1.08, 1.15, ease(k)), r: lerp(0, -2, k), foco: 1}), act: t => { pant.innerHTML = pantalla(n0, {frio: easeOut(win(t, f2.t + .9, f2.fin))}); contador(t, Math.round(lerp(4, 9, win(t, f2.t, f2.fin + .4)))); }},
    {t0: gi.t - .05, esc: e2, cam: k => ({x: 540, y: 960, z: lerp(1.12, 1.0, ease(k)), foco: 1}), act: t => { pant.innerHTML = pantalla(n0, {orden: win(t, gi.t + .3, gi.t + .6) > 0 ? 1 : 0}); cont.innerHTML = ''; }},
    {t0: FI(1).t - .1, esc: e2, cam: k => ({x: lerp(560, 580, k), y: lerp(820, 800, k), z: 1.4, foco: 1}), act: t => { pant.innerHTML = pantalla(n0, {orden: 1}); }},
    {t0: FI(2).t - .1, esc: e3, cam: k => ({x: 540, y: lerp(980, 940, k), z: lerp(1.05, 1.18, ease(k)), r: lerp(-1.5, 1, k), foco: 1, ap: 4}), act: (t, k) => {
      if (t < FI(2).t - .3) { card.innerHTML = ''; return; } const kk = backOut(win(t, FI(2).t, FI(2).t + .35), 2); const txt = (C.items || [])[1] || FI(2).show.replace(/\*/g, '');
      card.innerHTML = `<g transform="translate(540,1460) scale(${.6 + .4 * kk}) rotate(${-2 + k * 2})"><rect x="-470" y="-130" width="940" height="260" rx="40" fill="#fff" stroke="${NAR}" stroke-width="10"/><circle cx="-370" cy="0" r="64" fill="${NAR}"/>` + T(-370, 26, 2, 72, 800, '#fff', 'middle') + T(-270, 22, txt.length > 26 ? txt.slice(0, txt.lastIndexOf(' ', 26)) : txt, 52, 800, TINTA) + (txt.length > 26 ? T(-270, 84, txt.slice(txt.lastIndexOf(' ', 26) + 1), 44, 700, CAFE) : '') + '</g>'; }},
    {t0: FI(3).t - .1, esc: e2, cam: k => ({x: 540, y: lerp(1200, 1160, k), z: 1.35, foco: 1}), act: t => { pant.innerHTML = pantalla(n0, {orden: 3}); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(680, 700, k), Y: 1000, z: lerp(2.2, 2.3, ease(k)), foco: 1, ap: 5}), act: t => { poseT(t); pL(rom, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, hL: 20, cL: 30, ceja: .5, sonrisa: 1, mira: .3, cab: 4}); prop(); }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 700, Y: 1000, z: lerp(2.3, 2.4, k), foco: 1, ap: 10}), act: t => { poseT(t); pL(rom, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, sonrisa: 1}); }},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 700, Y: 1060, z: 1.8, foco: 1, ap: 5}), act: t => { rom.E.propMano.innerHTML = ''; poseT(t); pL(rom, t, {x: 640, y: 1430, s: 1.0, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8}); }},
  ];
  // orden 2 en la pantalla durante el final del punto 1 → mantiene la progresión visual 1 → 2 → 3
  O.tomas[0].boca = sobre(e1, 1, rom); O.tomas[7].boca = sobre(e1, 1, rom); O.tomas[8].boca = sobre(e1, 1, rom);
  // planos irreales: Romina diminuta y el objeto de la idea cayendo gigante; caída libre entre hojas
  const G = gigante(O, {pj: PJ, doc: C.doc || 'Sin responder', papel: ['#c9ac93', '#FFE7D0', '#fff6ec'], renglon: '#e8c9ad', tinta: CAFE, cielo: C.cielo || ['#6a3a1c', '#2a1a12', '#120c08'], acento: NAR, objeto: C.objeto || 'celu', fuente: 'Outfit'});
  const K = caida(O, {pj: PJ, fondo: C.fondoCaida || ['#5a2c12', '#120c08'], hoja: '#FFE7D0', renglon: '#e8c9ad', raya: '#FFE7D0', acento: NAR});
  const f3 = fr[3], f4 = fr[4], f5 = fr[5];
  O.tomas.push(G.toma(f3.t - .05, f4.t + .02), K.toma(f5.t - .1)); O.tomas.sort((a, b) => a.t0 - b.t0);
  O.impactos = [.02, f4.t + .02]; O.flash = t => Math.max(t >= .02 ? .5 * Math.exp(-(t - .02) * 8) : 0, t >= f4.t + .02 ? .45 * Math.exp(-(t - f4.t - .02) * 10) : 0);
  if (C.ap || C.grade || C.cam) variar(O, C, C.ap === 'caida' ? K.toma(0) : C.ap === 'gigante' ? G.toma(0, .55) : C.ap === 'celu' ? O.tomas.find(x => x.esc === e2) : C.ap === 'pp' ? O.tomas.find(x => x.esc === e3) : null);
  return O;
}
