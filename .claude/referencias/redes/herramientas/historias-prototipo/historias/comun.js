// Utilidades compartidas por las historias: lip-sync, poses con parpadeo y respiración, globo sobre la cabeza, luces.
import {parpadeo, respirar} from '../historia/personaje.js';
export const bocaDe = (f, t) => (!f || !f.boca || t < f.t || t > f.fin) ? 0 : (f.boca[Math.floor((t - f.t) * 60)] || 0);
export function poser(V, quien) { const fs = V.frases.filter(f => f.q === quien);
  return (pj, t, extra) => { const fh = fs.find(f => t >= f.t && t <= f.fin); pj.pose(Object.assign({parpado: parpadeo(t, quien.length), respira: respirar(t), boca: bocaDe(fh, t)}, extra)); }; }
export const sobre = (esc, capa, pj, dy = 70) => () => esc.aPantalla(esc.capas[capa], pj.cabeza[0], pj.cabeza[1] - dy);
export const luz = (e, css) => { e.luz.style.cssText = css; };
export const celuMano = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="#111"/><rect x="-13" y="-33" width="26" height="50" rx="4" fill="#bcd6ff" opacity=".9"/>`;
export function laptop({x, y, s = 1, pantalla = ''}) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-200" width="300" height="190" rx="12" fill="#2b2e35"/><rect x="-138" y="-188" width="276" height="166" rx="6" fill="#e9f3ef"/><g class="lpant">${pantalla}</g><path d="M-180,-8 L180,-8 L196,6 L-196,6 Z" fill="#9aa1aa"/></g>`; }

// ---------- Escala del cronograma x2: personajes, gancho automático y variantes (cámara, grado, apertura) ----------
export const PJS = {
  nico: {peinado: 'corto', piel: '#c58c66', pelo: '#2a1c12', barba: true, remera: '#2f5d8a', campera: '#3d4a3a', manga: 'larga', pantalon: '#2b3140', zapato: '#1a1a1f'},
  sole: {peinado: 'colita', piel: '#d9a37e', pelo: '#3b2216', remera: '#f0ebe0', campera: '#8a3b4a', manga: 'larga', pantalon: '#2b3140', zapato: '#1a1a1f', mujer: true},
  caro: {peinado: 'colita', piel: '#e0ad8a', pelo: '#4a2a1a', remera: '#f2efe8', campera: '#7aa38a', manga: 'larga', pantalon: '#33405a', zapato: '#e8e2d8', mujer: true},
  lucia: {peinado: 'largo', piel: '#e6b896', pelo: '#2b1a10', remera: '#f4efe6', campera: '#5c8f7a', manga: 'larga', pantalon: '#2f3b55', zapato: '#e8e2d8', mujer: true},
  vero: {peinado: 'largo', piel: '#c9946f', pelo: '#5a3320', remera: '#efe7da', campera: '#b4654a', manga: 'larga', pantalon: '#33405a', zapato: '#e8e2d8', mujer: true},
  gabriel: {peinado: 'corto', piel: '#d2a07c', pelo: '#3a2a1e', barba: true, remera: '#e8e4dc', campera: '#2f5a4e', manga: 'larga', pantalon: '#2a2f3a', zapato: '#1d1d22'},
  elsa: {peinado: 'colita', piel: '#e3b79a', pelo: '#c9c4bc', remera: '#efe9df', campera: '#6c7fa0', manga: 'larga', pantalon: '#4a4f5c', zapato: '#3a3a40', mujer: true},
  juli: {peinado: 'largo', piel: '#d9a37e', pelo: '#2a1a12', remera: '#e9e3d4', campera: '#c45a3b', manga: 'larga', pantalon: '#2b3854', zapato: '#f0ece4', mujer: true},
  mati: {peinado: 'rulos', piel: '#b98058', pelo: '#1d140e', remera: '#1f2a3a', pantalon: '#4a4f58', zapato: '#222'},
  leo: {peinado: 'rapado', piel: '#e0b394', pelo: '#3a2a1e', remera: '#ffffff', campera: '#011F65', manga: 'larga', pantalon: '#1c2233'},
  romina: {peinado: 'rulos', piel: '#c88e6a', pelo: '#3a1f14', remera: '#1b1b1b', campera: '#FC6E20', manga: 'larga', pantalon: '#2b2b2f', zapato: '#111', mujer: true},
  laura: {peinado: 'rulos', piel: '#c88e6a', pelo: '#3a1f14', remera: '#1b1b1b', campera: '#FC6E20', manga: 'larga', pantalon: '#2b2b2f', zapato: '#111', mujer: true},
};
// Gancho en pantalla: tamaño según el largo para que entre en 860 px sin cortarse (máx. 4 renglones)
export function ganchoCss(html) {
  const n = html.replace(/<[^>]+>/g, '').length;
  const hs = n <= 16 ? 140 : n <= 26 ? 118 : n <= 38 ? 100 : n <= 50 ? 88 : 78;
  return `--hs:${hs}px;--hookTop:350px`;
}
// Variantes reales: grado de color, estilo de cámara y apertura (qué toma abre el reel)
export const GRADOS = {
  frio: 'linear-gradient(180deg,rgba(0,70,110,.16),rgba(0,0,0,0) 45%,rgba(255,150,70,.10))',
  calido: 'linear-gradient(180deg,rgba(255,120,40,.16),rgba(0,0,0,0) 50%,rgba(120,40,160,.12))',
  noche: 'linear-gradient(180deg,rgba(40,20,120,.22),rgba(0,0,0,0) 50%,rgba(0,120,160,.14))',
  oro: 'linear-gradient(180deg,rgba(255,200,90,.18),rgba(0,0,0,0) 55%,rgba(30,40,110,.16))',
  menta: 'linear-gradient(180deg,rgba(60,200,150,.14),rgba(0,0,0,0) 50%,rgba(255,190,120,.10))',
};
export function variar(O, C, abre) {
  if (C.grade && GRADOS[C.grade]) document.getElementById('grade').style.background = GRADOS[C.grade];
  const cs = C.cam || '';
  if (cs) O.tomas.forEach((s, i) => { const base = s.cam; s.cam = (k, t) => { const c = Object.assign({}, base(k, t)); const key = c.X !== undefined ? 'X' : 'x';
    if (cs === 'lateral') c[key] = c[key] + (k - .5) * 70 * (i % 2 ? -1 : 1);
    else if (cs === 'mano') { const d = t - s.t0; const g = Math.exp(-d * 6); c[key] += Math.sin(t * 23) * 6 + Math.sin(t * 61) * 18 * g; c.r = (c.r || 0) + Math.sin(t * 17) * .6 + Math.sin(t * 47) * 2 * g; }
    else if (cs === 'empuje') c.z = (c.z || 1) * (1 + .09 * Math.pow(k, 1.6));
    return c; }; });
  if (abre) { const ini = O.tomas[0]; const t1 = Math.min(1.0, (O.V.frases[1] ? O.V.frases[1].t : 1.2) - .1); O.tomas.unshift(Object.assign({}, abre, {t0: 0, tr: 'zoom', lineas: .5})); ini.t0 = Math.max(.6, t1 * .75); }
}
