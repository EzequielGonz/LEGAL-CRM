// Realce de cine para las mini historias de las 4 marcas: bokeh fuera de foco, haces de luz y polvo en suspensión.
// Uso: const R = realce(); R.sumarCapa(escena, {f, prof, w, blend, svg}); R.conPolvo(escena, cx, cy, rx, ry, color); O.motas = R.motasRender;
import {hash} from './base.js';
export function realce() {
  const bokeh = (n, sd, cols, w = 1500) => [...Array(n)].map((_, i) => `<circle cx="${hash(i + sd) * w}" cy="${200 + hash(i * 3 + sd) * 1500}" r="${30 + hash(i + sd * 2) * 70}" fill="${cols[i % cols.length]}" opacity="${.18 + hash(i + 5 + sd) * .3}"/>`).join('');
  const sumarCapa = (e, def) => { const d = document.createElement('div'); d.className = 'capa'; d.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${def.w || 1080}" height="1920" viewBox="0 0 ${def.w || 1080} 1920" overflow="visible">${def.svg}</svg>`;
    d.style.width = `${def.w || 1080}px`; d.style.height = '1920px'; if (def.blend) d.style.mixBlendMode = def.blend; e.el.insertBefore(d, e.luz); e.capas.push(Object.assign(def, {d, svg: d.firstChild})); return e.capas[e.capas.length - 1]; };
  const haz = (x, y, ang, len, w, col) => `<polygon points="${x},${y} ${x + Math.sin(ang - .18) * len},${y + Math.cos(ang - .18) * len} ${x + Math.sin(ang + .18) * len},${y + Math.cos(ang + .18) * len}" fill="url(#hz)" opacity=".55"/>`;
  const hzDef = col => `<defs><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${col}" stop-opacity=".55"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>`;
  const motas = [];
  const conPolvo = (e, cx, cy, rx, ry, col) => { const c = sumarCapa(e, {f: 1.15, prof: 1.15, w: 1500, blend: 'screen', svg: [...Array(26)].map((_, i) => `<circle class="m" r="${1.5 + hash(i + 70) * 3}" fill="${col}"/>`).join('')}); motas.push({c, cx, cy, rx, ry}); };
  const motasRender = t => motas.forEach(({c, cx, cy, rx, ry}) => c.svg.querySelectorAll('.m').forEach((m, i) => { const a = t * (.15 + hash(i) * .25) + hash(i + 3) * 6.28;
    m.setAttribute('cx', cx + Math.sin(a * 1.3) * rx * hash(i + 9)); m.setAttribute('cy', cy + Math.cos(a) * ry * hash(i + 12) - ((t * 18 * hash(i + 4)) % ry)); m.setAttribute('opacity', .25 + .55 * Math.abs(Math.sin(a * 2.1))); }));
  return {bokeh, sumarCapa, haz, hzDef, conPolvo, motasRender};
}
