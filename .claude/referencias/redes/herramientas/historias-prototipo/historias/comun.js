// Utilidades compartidas por las historias: lip-sync, poses con parpadeo y respiración, globo sobre la cabeza, luces.
import {parpadeo, respirar} from '../historia/personaje.js';
export const bocaDe = (f, t) => (!f || !f.boca || t < f.t || t > f.fin) ? 0 : (f.boca[Math.floor((t - f.t) * 60)] || 0);
export function poser(V, quien) { const fs = V.frases.filter(f => f.q === quien);
  return (pj, t, extra) => { const fh = fs.find(f => t >= f.t && t <= f.fin); pj.pose(Object.assign({parpado: parpadeo(t, quien.length), respira: respirar(t), boca: bocaDe(fh, t)}, extra)); }; }
export const sobre = (esc, capa, pj, dy = 70) => () => esc.aPantalla(esc.capas[capa], pj.cabeza[0], pj.cabeza[1] - dy);
export const luz = (e, css) => { e.luz.style.cssText = css; };
export const celuMano = `<rect x="-16" y="-36" width="32" height="58" rx="6" fill="#111"/><rect x="-13" y="-33" width="26" height="50" rx="4" fill="#bcd6ff" opacity=".9"/>`;
export function laptop({x, y, s = 1, pantalla = ''}) { return `<g transform="translate(${x},${y}) scale(${s})"><rect x="-150" y="-200" width="300" height="190" rx="12" fill="#2b2e35"/><rect x="-138" y="-188" width="276" height="166" rx="6" fill="#e9f3ef"/><g class="lpant">${pantalla}</g><path d="M-180,-8 L180,-8 L196,6 L-196,6 Z" fill="#9aa1aa"/></g>`; }
