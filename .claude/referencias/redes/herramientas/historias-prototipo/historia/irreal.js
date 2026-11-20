// Planos irreales compartidos por las 4 marcas: el personaje diminuto sobre un documento gigante mientras cae un objeto enorme,
// y la caída libre entre hojas con líneas de velocidad. Parametrizados por paleta, texto del documento y objeto que cae.
import {lerp, ease, easeOut, easeIn, win, clamp, hash} from './base.js';
import {personaje, parpadeo, respirar} from './personaje.js';
export const OBJETOS = {
  lapicera: a => `<rect x="-46" y="-1500" width="92" height="1400" rx="46" fill="#0b0d12"/><rect x="-50" y="-760" width="100" height="44" fill="${a}"/><rect x="26" y="-1460" width="16" height="420" rx="8" fill="${a}"/><path d="M-40,-104 L40,-104 L0,40 Z" fill="${a}"/>`,
  llave: a => `<g transform="translate(0,-700) scale(2.2)"><circle cy="-260" r="70" fill="none" stroke="#dfe5ee" stroke-width="18"/><rect x="-140" y="-220" width="280" height="380" rx="110" fill="#0b0d12"/><circle cx="0" cy="-40" r="44" fill="${a}"/><rect x="-28" y="160" width="56" height="300" rx="8" fill="#cfd6e0"/></g>`,
  lupa: a => `<g transform="translate(0,-640) scale(2.4)"><circle r="150" fill="#ffffff" opacity=".25" stroke="${a}" stroke-width="34"/><rect x="-26" y="150" width="52" height="260" rx="22" fill="${a}"/></g>`,
  celu: a => `<g transform="translate(0,-700) scale(2.3)"><rect x="-150" y="-300" width="300" height="600" rx="44" fill="${a}"/><rect x="-128" y="-270" width="256" height="530" rx="26" fill="#111215"/>${[0, 1, 2, 3].map(i => `<rect x="-108" y="${-240 + i * 120}" width="216" height="96" rx="18" fill="#26282d"/>`).join('')}<circle cx="110" cy="-280" r="34" fill="#e5484d"/></g>`,
  sello: a => `<g transform="translate(0,-520) scale(2.4)"><rect x="-60" y="-260" width="120" height="200" rx="40" fill="#0b0d12"/><rect x="-150" y="-60" width="300" height="70" rx="14" fill="${a}"/><rect x="-170" y="10" width="340" height="40" rx="8" fill="#2a2a2a"/></g>`,
};
export function gigante(O, {pj, doc = 'Propuesta de acuerdo', papel = ['#a99f86', '#e9e2cf', '#fbf8ef'], renglon = '#c9c4b4', tinta = '#6e6650', cielo = ['#2a3d7a', '#121c3d', '#070b18'], acento = '#D4AF37', objeto = 'lapicera', fuente = 'Manrope'}) {
  const VY = 760, L = [300, 780];
  let p = `<defs><linearGradient id="irp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${papel[0]}"/><stop offset=".35" stop-color="${papel[1]}"/><stop offset="1" stop-color="${papel[2]}"/></linearGradient>
    <radialGradient id="irc" cx=".5" cy=".38" r=".7"><stop offset="0" stop-color="${cielo[0]}"/><stop offset=".6" stop-color="${cielo[1]}"/><stop offset="1" stop-color="${cielo[2]}"/></radialGradient></defs>`;
  p += `<polygon points="${L[0]},${VY} ${L[1]},${VY} 1900,1920 -820,1920" fill="url(#irp)"/>`;
  for (let i = 1; i < 26; i++) { const z = i / 26, y = VY + (1920 - VY) * Math.pow(z, 1.9); const xl = L[0] + (-820 - L[0]) * (y - VY) / (1920 - VY) + 60 * (y - VY) / 300, xr = L[1] + (1900 - L[1]) * (y - VY) / (1920 - VY) - 60 * (y - VY) / 300;
    const w = (xr - xl) * (.55 + .4 * hash(i)); p += `<rect x="${xl + (xr - xl) * .08}" y="${y}" width="${w * .9}" height="${Math.max(2, 22 * Math.pow(z, 1.9))}" rx="4" fill="${renglon}" opacity=".75"/>`; }
  p += `<text x="540" y="${VY + 70}" text-anchor="middle" font-family="${fuente}" font-weight="800" font-size="44" fill="${tinta}" opacity=".85">${doc}</text>`;
  const e = O.esc({nombre: 'irr-gigante', fondo: cielo[2], capas: [
    {f: .1, prof: .1, svg: `<rect width="1080" height="1920" fill="url(#irc)"/>` + [...Array(70)].map((_, i) => `<circle cx="${hash(i) * 1080}" cy="${hash(i + 99) * 760}" r="${1 + hash(i + 7) * 2.4}" fill="#fff" opacity="${.25 + hash(i + 3) * .6}"/>`).join('')},
    {f: 1, prof: 1, svg: p + `<g class="polvo"></g><g class="act"></g><g class="obj">${OBJETOS[objeto](acento)}</g>`}]});
  const ch = personaje(e.capas[1].svg.querySelector('.act'), pj); const obj = e.capas[1].svg.querySelector('.obj'), polvo = e.capas[1].svg.querySelector('.polvo');
  // toma: t0 inicio, tc = momento del impacto
  return {esc: e, toma: (t0, tc) => ({t0, esc: e, tr: 'zoom', cam: (k, t) => { const d = t - tc; const sk = d > 0 && d < .5 ? Math.exp(-d * 8) : 0;
      return {x: 540 + Math.sin(t * 61) * 16 * sk, y: lerp(1180, 1240, ease(k)) + Math.cos(t * 47) * 12 * sk, z: lerp(1.25, 1.55, ease(k)), r: lerp(-3, 2, k) + Math.sin(t * 33) * 2 * sk, foco: 1, ap: 3}; },
    act: t => { const k = clamp((t - t0) / Math.max(.2, tc - t0));
      ch.pose({x: 470, y: 1450, s: .62, flip: 1, parpado: parpadeo(t, 1), mira: -.4, cab: lerp(0, -22, easeOut(k)), hR: lerp(10, 40, k), cR: 30, hL: lerp(8, 30, k), cL: 30, ceja: -.8, sonrisa: -.5, tronco: lerp(0, -6, k)});
      const y = t < tc ? lerp(-1400, 1500, easeIn(k)) : 1500; obj.setAttribute('transform', `translate(700,${y}) rotate(14)`);
      const d = t - tc; polvo.innerHTML = d > 0 ? [...Array(14)].map((_, i) => { const a = i / 14 * Math.PI * 2, r = 40 + easeOut(clamp(d / .6)) * (120 + hash(i) * 120);
        return `<circle cx="${700 + Math.cos(a) * r * 1.6}" cy="${1500 + Math.sin(a) * r * .35}" r="${(10 + hash(i + 4) * 16) * (1 - clamp(d / .9))}" fill="${papel[1]}" opacity="${.8 * (1 - clamp(d / .9))}"/>`; }).join('') : ''; }})};
}
export function caida(O, {pj, fondo = ['#1c2b5c', '#05070f'], hoja = '#f6f1e2', renglon = '#cfc8b4', raya = '#e9e2cf', acento = '#D4AF37', poser = null}) {
  const e = O.esc({nombre: 'irr-caida', fondo: fondo[1], capas: [
    {f: .2, prof: .2, svg: `<defs><radialGradient id="icf" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="${fondo[0]}"/><stop offset="1" stop-color="${fondo[1]}"/></radialGradient></defs><rect x="-400" y="-400" width="1880" height="2720" fill="url(#icf)"/>`},
    {f: .5, prof: .5, svg: '<g class="rayas"></g>'}, {f: 1, prof: 1, svg: '<g class="hojas"></g><g class="rot"><g class="act"></g></g>'}]});
  const rayas = e.capas[1].svg.querySelector('.rayas'), hojas = e.capas[2].svg.querySelector('.hojas'), rot = e.capas[2].svg.querySelector('.rot');
  rayas.innerHTML = [...Array(46)].map((_, i) => `<rect class="r" x="${hash(i + 11) * 1300 - 110}" y="0" width="${2 + hash(i + 5) * 5}" height="${200 + hash(i + 2) * 700}" rx="3" fill="${i % 5 ? raya : acento}" opacity="${.12 + hash(i + 8) * .35}"/>`).join('');
  hojas.innerHTML = [...Array(9)].map((_, i) => `<g class="h"><rect x="-90" y="-120" width="180" height="240" rx="6" fill="${hoja}"/>${[0, 1, 2, 3, 4, 5].map(j => `<rect x="-64" y="${-90 + j * 32}" width="${100 + hash(i * 7 + j) * 30}" height="8" rx="4" fill="${renglon}"/>`).join('')}</g>`).join('');
  const ch = personaje(rot.querySelector('.act'), pj);
  return {esc: e, toma: t0 => ({t0, esc: e, lineas: .35, tr: 'zoom', cam: (k, t) => ({x: 540 + Math.sin(t * 9) * 10, y: 960 + Math.cos(t * 7) * 8, z: lerp(1.0, 1.18, k), r: Math.sin(t * 2.4) * 3, foco: 1, ap: 4}), act: t => {
    const d = t - t0; rayas.querySelectorAll('.r').forEach((r, i) => r.setAttribute('transform', `translate(0,${((hash(i) * 2600 - d * (1800 + hash(i + 3) * 1600)) % 2600 + 2600) % 2600 - 500})`));
    hojas.querySelectorAll('.h').forEach((h, i) => h.setAttribute('transform', `translate(${hash(i + 21) * 1080},${((hash(i + 40) * 2400 - d * (900 + hash(i) * 700)) % 2400 + 2400) % 2400 - 300}) rotate(${d * (60 + hash(i) * 120) * (i % 2 ? 1 : -1)}) scale(${.5 + hash(i + 9) * .8})`));
    rot.setAttribute('transform', `rotate(${Math.sin(d * 1.7) * 18 + d * 14},540,1000)`);
    ch.pose({x: 540, y: 1180, s: 1.05, flip: 1, parpado: parpadeo(t, 2), respira: respirar(t), hR: 160 + Math.sin(d * 9) * 14, cR: 30, hL: 150 + Math.cos(d * 8) * 16, cL: 40, cdL: 18 + Math.sin(d * 7) * 12, rL: 40, cdR: -14 + Math.cos(d * 6) * 12, rR: 50, cab: -10, ceja: -1, sonrisa: -.8, mira: -.3}); }})};
}
