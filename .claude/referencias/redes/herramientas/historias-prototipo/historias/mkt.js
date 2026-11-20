// Kocos Marketing · «El celular que no para» · mini historia: Laura, dueña de un local, con el celular explotado de chats.
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, win, wob, clamp, backOut, hash} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {poser, sobre, luz} from './comun.js';
const NAR = '#FC6E20', TINTA = '#1B1B1B', CREMA = '#FFE7D0';
const LAURA = {peinado: 'rulos', piel: '#c88e6a', pelo: '#3a1f14', remera: '#1b1b1b', campera: '#FC6E20', manga: 'larga', pantalon: '#2b2b2f', zapato: '#111'};
const nombres = ['Sofi', 'Martín', 'Cliente', 'Lu', 'Rocío', 'Diego', 'Vale', 'Nahuel', 'Cami', 'Pau', 'Gonza', 'Flor'];
const msgs = ['¿Tenés talle M?', '¿Precio?', '¿Hacen envíos?', '¡Hola! ¿Sigue disponible?', '¿Aceptan transferencia?', '¿Cuánto sale el negro?', '¿Hasta qué hora abren?', 'Hola', '¿Hay en azul?', '¿Me lo reservás?'];
function chats(n, {frio = 0, orden = 0, t = 0}) { let s = `<rect x="190" y="250" width="700" height="1460" fill="#111215"/><rect x="190" y="250" width="700" height="170" fill="#1d1e22"/>
  <text x="230" y="380" font-family="Outfit" font-weight="800" font-size="52" fill="#fff">Chats</text>`;
  if (!orden) s += `<rect x="640" y="335" width="${n >= 10 ? 210 : 190}" height="60" rx="30" fill="#e5484d"/><text x="${n >= 10 ? 745 : 735}" y="377" font-family="Outfit" font-weight="800" font-size="34" fill="#fff" text-anchor="middle">${n} sin leer</text>`;
  const etapas = [['Nuevo', '#4E9BE4'], ['Presupuesto', '#FC6E20'], ['Seguimiento', '#2ecc71']];
  for (let i = 0; i < 8; i++) { const y = 440 + i * 150; const c = frio > 0 ? `rgb(${Math.round(lerp(40, 70, frio))},${Math.round(lerp(42, 110, frio))},${Math.round(lerp(48, 160, frio))})` : '#26282d';
    s += `<rect x="205" y="${y}" width="670" height="135" rx="20" fill="${c}"/><circle cx="270" cy="${y + 67}" r="40" fill="${['#c97b5a', '#7a8fc9', '#c9b25a', '#6cb3a0', '#b56cc9'][i % 5]}"/>
      <text x="330" y="${y + 58}" font-family="Outfit" font-weight="700" font-size="34" fill="#fff">${nombres[(i + n) % nombres.length]}</text>
      <text x="330" y="${y + 104}" font-family="Outfit" font-weight="500" font-size="28" fill="#aab">${msgs[(i * 3 + n) % msgs.length]}</text>`;
    if (orden >= 1) { const [et, col] = etapas[i % 3]; s += `<rect x="${640}" y="${y + 24}" width="${et.length * 17 + 30}" height="40" rx="20" fill="${col}"/><text x="${655}" y="${y + 52}" font-family="Outfit" font-weight="700" font-size="24" fill="#fff">${et}</text>`; }
    else s += `<circle cx="835" cy="${y + 90}" r="20" fill="${NAR}"/><text x="835" y="${y + 99}" font-family="Outfit" font-weight="800" font-size="24" fill="#fff" text-anchor="middle">${1 + (i * 7 + n) % 4}</text>`; }
  if (orden >= 2) s += `<rect x="215" y="1540" width="650" height="140" rx="26" fill="#1d1e22"/>${['¡Hola, gracias por escribir!', 'Talles y precios', 'Envíos'].map((q, i) => `<rect x="${230 + i * 0}" y="${1556}" width="0" height="0"/>`).join('')}
    <text x="240" y="1600" font-family="Outfit" font-weight="700" font-size="26" fill="#aab">Respuestas rápidas</text>${['Talles', 'Precios', 'Envíos'].map((q, i) => `<rect x="${240 + i * 205}" y="1615" width="190" height="50" rx="25" fill="${NAR}"/><text x="${335 + i * 205}" y="1649" font-family="Outfit" font-weight="700" font-size="26" fill="#fff" text-anchor="middle">${q}</text>`).join('')}`;
  if (orden >= 3) s += `<rect x="240" y="${1250}" width="600" height="110" rx="24" fill="#fff"/><text x="275" y="1300" font-family="Outfit" font-weight="800" font-size="30" fill="${TINTA}">Seguimiento agendado</text><text x="275" y="1340" font-family="Outfit" font-weight="500" font-size="26" fill="#555">Mañana 10:00 · Sofi · Presupuesto</text>`;
  return s; }
export async function armar(V) {
  const O = obra(V, {nombre: 'Kocos Marketing', logo: 'marketing.png', ctaSub: 'y te mostramos cómo', hookHTML: '<em>47</em> chats<br>sin responder', hookHasta: 1.6, notas: []});
  document.documentElement.style.cssText += `--f1:Outfit;--f2:Manrope;--acc:${NAR};--hs:130px;--hw:800;--em:normal;--kwCol:#fff;--logoH:90px;--velo:rgba(27,27,27,.92);--ctaTop:640px;--hookTop:1150px`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta); const pL = poser(V, 'laura');
  // 1 · el local de ropa, al atardecer
  const e1 = O.esc({nombre: 'local', fondo: '#3a2a22', capas: [
    {f: .6, prof: .6, w: 1500, svg: D.interior({w: 1500, pared: '#efe2d2', piso: '#7a5a44', ventana: [980, 300, 420, 700], vista: 'noche', zocalo: '#f6ece0', luz: '#ffb36b'}) + D.percha({x: 400, y: 1250, colores: ['#c45a3b', '#e9e3d4', '#2b3854', '#7aa38a', '#1b1b1b', '#e5c76b', '#b56cc9']}) +
      `<rect x="160" y="420" width="420" height="120" rx="10" fill="${TINTA}"/><text x="370" y="500" font-family="Outfit" font-weight="800" font-size="62" fill="${NAR}" text-anchor="middle">BLACK FRIDAY</text>`},
    {f: 1, prof: 1, w: 1500, svg: '<g class="act"></g>' + `<rect x="540" y="1130" width="700" height="300" rx="14" fill="#4a3a30"/><rect x="540" y="1130" width="700" height="26" rx="8" fill="#6a5444"/><g class="tel"><rect x="760" y="1110" width="90" height="22" rx="8" fill="${NAR}"/></g>`}]});
  const laura = personaje(e1.capas[1].svg.querySelector('.act'), LAURA); const tel = e1.capas[1].svg.querySelector('.tel');
  // 2 · el celular naranja en primer plano
  const cm = PP.celularMano({piel: LAURA.piel, funda: NAR, manga: LAURA.campera});
  const e2 = O.esc({nombre: 'celu', fondo: TINTA, capas: [{f: .3, prof: .3, svg: `<rect width="1080" height="1920" fill="${TINTA}"/><circle cx="540" cy="900" r="600" fill="${NAR}" opacity=".12"/>`}, {f: 1, prof: 1, svg: cm.svg + `<g class="contador"></g>`}]});
  const pant = e2.capas[1].svg.querySelector('.pantalla'), cont = e2.capas[1].svg.querySelector('.contador');
  luz(e1, 'background:radial-gradient(circle at 70% 35%,rgba(255,170,100,.45),transparent 50%),linear-gradient(180deg,transparent 55%,rgba(20,10,0,.35));mix-blend-mode:soft-light');
  const pings = t => (t > .1 && t < 2.6) ? Math.sin(t * 95) * 5 * (Math.sin(t * 9) > 0 ? 1 : 0) : 0;
  const contador = (t, n) => { cont.innerHTML = `<g transform="translate(540,190) scale(${1 + .08 * Math.max(0, Math.sin(t * 9))})"><rect x="-250" y="-50" width="500" height="100" rx="50" fill="#e5484d"/><text x="0" y="16" font-family="Outfit" font-weight="800" font-size="44" fill="#fff" text-anchor="middle">Ventas perdidas: ${n}</text></g>`; };
  O.tomas = [
    {t0: 0, esc: e1, cam: k => ({X: lerp(700, 730, k), Y: lerp(1060, 1040, k), z: lerp(1.8, 1.92, ease(k)), foco: 1, ap: 5}), act: t => { tel.setAttribute('transform', `translate(${pings(t)},0)`);
      pL(laura, t, {x: 640, y: 1430, s: 1.0, flip: 1, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8 + wob(t) * 3, mira: .2}); }},
    {t0: V.frases[1].t - .05, esc: e2, cam: k => ({x: 540, y: lerp(1000, 960, k), z: lerp(1.0, 1.08, ease(k)), foco: 1}), act: t => { const n = Math.round(lerp(31, 47, easeOut(win(t, V.frases[1].t, V.frases[1].t + 1.6)))); pant.innerHTML = chats(n, {}); contador(t, Math.round(lerp(1, 6, win(t, V.frases[1].t, F('frio').fin)))); }},
    {t0: F('frio').t + .9, esc: e2, cam: k => ({x: 540, y: 980, z: lerp(1.08, 1.15, ease(k)), r: lerp(0, -2, k), foco: 1}), act: t => { pant.innerHTML = chats(47, {frio: easeOut(win(t, F('frio').t + .9, F('frio').fin))}); contador(t, Math.round(lerp(4, 9, win(t, F('frio').t, F('frio').fin + .4)))); }},
    {t0: V.frases[3].t - .05, esc: e1, cam: k => ({X: 680, Y: lerp(990, 980, k), z: lerp(2.3, 2.42, ease(k)), foco: 1, ap: 6}), act: t => { tel.setAttribute('transform', 'translate(0,0)');
      pL(laura, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, hL: 10, cL: 20, ceja: -.5, sonrisa: -.4, mira: .6}); laura.E.propMano.innerHTML = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="${NAR}"/>`; }},
    {t0: F('giro').t - .05, esc: e2, cam: k => ({x: 540, y: 960, z: lerp(1.12, 1.0, ease(k)), foco: 1}), act: t => { pant.innerHTML = chats(47, {orden: win(t, F('giro').t + .3, F('giro').t + .6) > 0 ? 1 : 0}); cont.innerHTML = ''; }},
    {t0: FI(1).t - .1, esc: e2, cam: k => ({x: lerp(680, 700, k), y: 700, z: 1.55, foco: 1}), act: t => { pant.innerHTML = chats(47, {orden: 1}); }},
    {t0: FI(2).t - .1, esc: e2, cam: k => ({x: 540, y: lerp(1500, 1480, k), z: 1.6, foco: 1}), act: t => { pant.innerHTML = chats(47, {orden: 2}); }},
    {t0: FI(3).t - .1, esc: e2, cam: k => ({x: 540, y: 1300, z: lerp(1.5, 1.6, ease(k)), foco: 1}), act: t => { pant.innerHTML = chats(47, {orden: 3}); }},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(680, 700, k), Y: 1000, z: lerp(2.2, 2.3, ease(k)), foco: 1, ap: 5}), act: t => { pL(laura, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, hL: 20, cL: 30, ceja: .5, sonrisa: 1, mira: .3, cab: 4}); laura.E.propMano.innerHTML = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="${NAR}"/>`; }},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: 700, Y: 1000, z: lerp(2.3, 2.4, k), foco: 1, ap: 10}), act: t => pL(laura, t, {x: 640, y: 1430, s: 1.0, hR: 80, cR: 90, sonrisa: 1})},
    {t0: V.total - .4, esc: e1, cam: k => ({X: 700, Y: 1060, z: 1.8, foco: 1, ap: 5}), act: t => { laura.E.propMano.innerHTML = ''; pL(laura, t, {x: 640, y: 1430, s: 1.0, hR: 150, cR: 30, hL: 160, cL: 40, ceja: -1, sonrisa: -.6, cab: -8}); }},
  ];
  O.tomas[0].boca = sobre(e1, 1, laura); O.tomas[8].boca = sobre(e1, 1, laura);
  return O;
}
