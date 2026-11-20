// Personajes 2.5D articulados en SVG (sin caras reales): esqueleto con cinemática directa, ropa con luz y sombra,
// ojos que parpadean, cejas con expresión, boca que sigue la voz, caminata y poses. Diseño propio, sin modelos de terceros.
import {NS, id, clamp, lerp, hash} from './base.js';
const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const rad = d => d * Math.PI / 180;

export function personaje(capaSvg, o) {
  const P = Object.assign({piel: '#c98e6b', pelo: '#2b1d14', peinado: 'corto', remera: '#3a5a8c', pantalon: '#2a2f3a', zapato: '#1d1d22', manga: 'corta', campera: null, barba: false, alto: 1, mujer: false, ojos: '#1c1410', extra: ''}, o);
  const g = document.createElementNS(NS, 'g'); capaSvg.appendChild(g);
  const G = id('pj'); const sup = P.campera || P.remera;
  g.innerHTML = `<defs>
    <linearGradient id="${G}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(sup, -.18)}"/><stop offset=".55" stop-color="${sup}"/><stop offset="1" stop-color="${sh(sup, .1)}"/></linearGradient>
    <radialGradient id="${G}c" cx=".62" cy=".38" r=".75"><stop offset="0" stop-color="${sh(P.piel, .1)}"/><stop offset=".7" stop-color="${P.piel}"/><stop offset="1" stop-color="${sh(P.piel, -.2)}"/></radialGradient>
    <linearGradient id="${G}p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(P.pantalon, -.2)}"/><stop offset=".6" stop-color="${P.pantalon}"/><stop offset="1" stop-color="${sh(P.pantalon, .08)}"/></linearGradient>
    <filter id="${G}f" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <ellipse class="sombra" rx="78" ry="13" fill="#000" opacity=".32" filter="url(#${G}f)"/>
    <g class="cuerpo">
      <path class="pieA" fill="${sh(P.zapato, -.1)}"/><path class="pA" stroke="${sh(P.pantalon, -.28)}" stroke-width="35" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="bA" stroke="${sh(sup, -.3)}" stroke-width="27" stroke-linecap="round" fill="none"/><path class="aA" stroke="${P.manga === 'larga' || P.campera ? sh(sup, -.3) : sh(P.piel, -.22)}" stroke-width="22" stroke-linecap="round" fill="none"/><circle class="mA" r="12.5" fill="${sh(P.piel, -.2)}"/>
      <g class="propA"></g>
      <path class="cadera" fill="url(#${G}p)"/>
      <path class="pieB" fill="${P.zapato}"/><path class="pB" stroke="url(#${G}p)" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      <path class="torso" fill="url(#${G}s)"/>${P.campera ? `<path class="interior" fill="${P.remera}"/>` : ''}
      <path class="cuello" fill="${sh(P.piel, -.12)}"/>
      <g class="cabeza">
        ${P.peinado === 'largo' || P.peinado === 'colita' ? `<path class="peloAtras" fill="${sh(P.pelo, -.1)}"/>` : ''}
        <ellipse class="oreja" rx="9" ry="13" fill="${sh(P.piel, -.08)}"/>
        <ellipse class="cara" rx="44" ry="51" fill="url(#${G}c)"/>
        ${P.barba ? `<path class="barba" fill="${P.pelo}" opacity=".85"/>` : ''}
        <path class="nariz" fill="${sh(P.piel, -.1)}"/>
        <path class="pelo" fill="${P.pelo}"/><path class="brillo" fill="${sh(P.pelo, .25)}" opacity=".35"/>
        <ellipse class="ojo" rx="5.2" ry="6.4" fill="${P.ojos}"/><circle class="luzOjo" r="1.6" fill="#fff" opacity=".85"/>
        <path class="ceja" stroke="${sh(P.pelo, -.1)}" stroke-width="5" stroke-linecap="round" fill="none"/>
        <path class="bocaP" fill="#5a2320"/><path class="mejilla" fill="#e88" opacity=".14"/>
      </g>
      <g class="propB"></g>
      <path class="bB" stroke="url(#${G}s)" stroke-width="28" stroke-linecap="round" fill="none"/><path class="aB" stroke="${P.manga === 'larga' || P.campera ? sup : P.piel}" stroke-width="23" stroke-linecap="round" fill="none"/><circle class="mB" r="13" fill="${P.piel}"/>
      <g class="propMano"></g>
    </g>`;
  const q = s => g.querySelector('.' + s);
  const E = {sombra: q('sombra'), cuerpo: q('cuerpo'), pieA: q('pieA'), pA: q('pA'), bA: q('bA'), aA: q('aA'), mA: q('mA'), cadera: q('cadera'), pieB: q('pieB'), pB: q('pB'), torso: q('torso'), interior: q('interior'), cuello: q('cuello'),
    cabeza: q('cabeza'), peloAtras: q('peloAtras'), oreja: q('oreja'), cara: q('cara'), barba: q('barba'), nariz: q('nariz'), pelo: q('pelo'), brillo: q('brillo'), ojo: q('ojo'), luzOjo: q('luzOjo'), ceja: q('ceja'), bocaP: q('bocaP'), mejilla: q('mejilla'),
    bB: q('bB'), aB: q('aB'), mB: q('mB'), propMano: q('propMano'), propB: q('propB')};
  const A = P.alto;
  const api = {g, E, P, mano: [0, 0], cabezaPos: [0, 0],
    pose(p) {
      p = Object.assign({x: 0, y: 0, s: 1, flip: 1, tronco: 0, cab: 0, hL: 8, cL: 12, hR: -6, cR: 14, cdL: -4, rL: 6, cdR: 6, rR: 8, boca: 0, parpado: 0, ceja: 0, sonrisa: .2, sentado: 0, mira: 0, respira: 0}, p);
      g.setAttribute('transform', `translate(${p.x},${p.y}) scale(${p.s * p.flip},${p.s})`);
      const lean = rad(p.tronco); const hipY = -245 * A + (p.sentado ? 105 : 0);
      const H = [0, hipY]; const tl = 172 * A * (1 + p.respira * .012);
      const N = [H[0] + Math.sin(lean) * tl, H[1] - Math.cos(lean) * tl];
      const pt = (o, l, a) => [o[0] + Math.sin(a) * l, o[1] + Math.cos(a) * l];
      const leg = (cad, rod) => { const a = rad(cad), b = rad(rod); const K = pt(H, 120 * A, a); const An = pt(K, 116 * A, a - b); return [K, An]; };
      const legL = p.sentado ? [pt(H, 120, rad(84)), pt(pt(H, 120, rad(84)), 116, rad(84 - 88))] : leg(p.cdL, p.rL);
      const legR = p.sentado ? [pt(H, 120, rad(80)), pt(pt(H, 120, rad(80)), 116, rad(80 - 84))] : leg(p.cdR, p.rR);
      const dl = (K, An) => `M${H[0]},${H[1] + 6}L${K[0]},${K[1]}L${An[0]},${An[1]}`;
      E.pA.setAttribute('d', dl(...legL)); E.pB.setAttribute('d', dl(...legR));
      const foot = An => `M${An[0] - 14},${An[1] - 6} q4,-12 18,-10 l22,6 q16,4 16,14 l0,6 l-58,0 z`.replace(/(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)/, '$1,$3');
      const pie = An => `M${An[0] - 15},${An[1] - 8} Q${An[0] - 6},${An[1] - 16} ${An[0] + 10},${An[1] - 12} L${An[0] + 30},${An[1] - 5} Q${An[0] + 44},${An[1] - 1} ${An[0] + 43},${An[1] + 8} L${An[0] - 16},${An[1] + 8} Z`;
      E.pieA.setAttribute('d', pie(legL[1])); E.pieB.setAttribute('d', pie(legR[1]));
      // cadera y torso (forma de remera/campera, se inclina con el tronco)
      const r = (pnt, a, o = H) => { const c = Math.cos(a), s = Math.sin(a); const dx = pnt[0], dy = pnt[1]; return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c]; };
      const T = (dx, dy) => r([dx, dy], lean);
      const c1 = T(-40, 10), c2 = T(40, 10), c3 = T(36, -24), c4 = T(-38, -24);
      E.cadera.setAttribute('d', `M${c1}L${c2}L${c3}L${c4}Z`.replace(/,/g, ' ').replace(/(\d) (-?\d)/g, '$1,$2'));
      const pts = [T(-40, -10), T(-46, -tl * .55), T(-36, -tl + 8), T(-12, -tl - 4), T(18, -tl - 4), T(38, -tl + 10), T(44, -tl * .5), T(38, -10)];
      const pth = a => 'M' + a.map(v => v.map(n => n.toFixed(1)).join(',')).join(' L') + ' Z';
      E.torso.setAttribute('d', `M${pts[0]} C${T(-48, -60)} ${T(-50, -tl * .45)} ${pts[1]} S${T(-44, -tl + 20)} ${pts[2]} Q${T(-30, -tl - 4)} ${pts[3]} L${pts[4]} Q${T(34, -tl - 2)} ${pts[5]} S${T(50, -tl * .55)} ${pts[6]} S${T(44, -40)} ${pts[7]} Z`.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (m, a, b) => `${(+a).toFixed(1)},${(+b).toFixed(1)}`));
      if (E.interior) E.interior.setAttribute('d', pth([T(4, -tl + 2), T(24, -tl + 4), T(18, -20), T(8, -16)]));
      const Nk = T(4, -tl); E.cuello.setAttribute('d', pth([T(-10, -tl + 6), T(16, -tl + 6), T(15, -tl - 16), T(-8, -tl - 16)]));
      // brazos: hombro → codo → muñeca
      const S = T(0, -tl + 22); const arm = (h, c) => { const a = rad(h) - lean * 0 + 0, E1 = pt(S, 98 * A, -rad(h) * -1 + lean * .3); const W = pt(E1, 90 * A, -rad(h) * -1 - rad(-c) + lean * .3); return [E1, W]; };
      const [eA, wA] = arm(p.hL, p.cL), [eB, wB] = arm(p.hR, p.cR);
      const da = (a, b) => `M${S[0]},${S[1]}L${a[0]},${a[1]}`, df = (a, b) => `M${a[0]},${a[1]}L${b[0]},${b[1]}`;
      E.bA.setAttribute('d', da(eA)); E.aA.setAttribute('d', df(eA, wA)); E.mA.setAttribute('cx', wA[0]); E.mA.setAttribute('cy', wA[1]);
      E.bB.setAttribute('d', da(eB)); E.aB.setAttribute('d', df(eB, wB)); E.mB.setAttribute('cx', wB[0]); E.mB.setAttribute('cy', wB[1]);
      E.propMano.setAttribute('transform', `translate(${wB[0]},${wB[1]}) rotate(${p.hR + p.cR})`); api.manoLocal = wB;
      // cabeza
      const hc = r([6, -tl - 60], lean + rad(p.cab) * .2); E.cabeza.setAttribute('transform', `translate(${hc[0]},${hc[1]}) rotate(${p.cab})`); api.cabezaLocal = hc;
      E.oreja.setAttribute('cx', -8); E.oreja.setAttribute('cy', 4);
      const m = p.mira * 8;
      E.ojo.setAttribute('cx', 22 + m); E.ojo.setAttribute('cy', -6); E.ojo.setAttribute('ry', 6.4 * (1 - clamp(p.parpado)) + .4); E.luzOjo.setAttribute('cx', 23.6 + m); E.luzOjo.setAttribute('cy', -8.2); E.luzOjo.setAttribute('opacity', p.parpado > .5 ? 0 : .85);
      const cj = p.ceja * 7; E.ceja.setAttribute('d', `M${12 + m},${-22 - cj * .4} Q${22 + m},${-28 - cj} ${32 + m},${-22 + cj * .6}`);
      E.nariz.setAttribute('d', `M40,-6 Q52,6 42,14 Q38,15 36,12 Z`);
      const bo = clamp(p.boca), sm = p.sonrisa * 6;
      E.bocaP.setAttribute('d', `M22,${22 - sm * .3} Q30,${24 + sm} 38,${21 - sm * .3} Q31,${24 + sm + bo * 12} 22,${22 - sm * .3} Z`);
      E.mejilla.setAttribute('d', 'M14,10 a9,6 0 1,0 18,0 a9,6 0 1,0 -18,0');
      const pe = P.peinado;
      const pelos = {corto: 'M-44,-6 C-50,-48 -20,-66 10,-62 C36,-60 50,-44 46,-22 C34,-34 14,-36 -8,-34 C-16,-28 -22,-14 -26,-2 C-34,-2 -40,-2 -44,-6 Z',
        rapado: 'M-43,-10 C-46,-44 -18,-58 10,-56 C34,-54 46,-40 44,-24 C30,-32 10,-36 -10,-34 C-20,-28 -28,-18 -32,-8 Z',
        largo: 'M-46,-4 C-54,-52 -18,-70 12,-64 C40,-60 54,-40 46,-14 C40,-30 22,-40 0,-38 C-12,-30 -18,-14 -22,0 C-30,6 -40,4 -46,-4 Z',
        colita: 'M-46,-4 C-54,-52 -18,-70 12,-64 C40,-60 54,-40 46,-16 C38,-32 20,-40 0,-38 C-12,-30 -18,-14 -22,0 C-30,4 -40,2 -46,-4 Z',
        rulos: 'M-50,0 C-64,-30 -42,-74 -4,-70 C30,-78 62,-52 50,-14 C42,-30 26,-40 4,-38 C-10,-30 -16,-16 -22,0 C-32,8 -44,8 -50,0 Z'};
      E.pelo.setAttribute('d', pelos[pe] || pelos.corto);
      E.brillo.setAttribute('d', 'M-20,-50 C-4,-60 18,-60 30,-50 C14,-54 -4,-52 -20,-50 Z');
      if (E.peloAtras) E.peloAtras.setAttribute('d', pe === 'largo' ? 'M-46,-10 C-60,30 -50,70 -30,84 C-20,60 -16,30 -14,6 Z' : 'M-44,-20 C-70,-20 -78,10 -62,30 C-56,10 -48,-2 -40,-6 Z');
      if (E.barba) E.barba.setAttribute('d', 'M-6,24 C6,48 34,50 44,26 C40,34 30,38 22,36 C14,36 4,32 -6,24 Z');
      // sombra en el piso
      const fy = Math.max(legL[1][1], legR[1][1]) + 8; E.sombra.setAttribute('cx', (legL[1][0] + legR[1][0]) / 2 + 10); E.sombra.setAttribute('cy', p.sentado ? 0 : fy);
      api.cabeza = [p.x + hc[0] * p.s * p.flip, p.y + hc[1] * p.s]; api.mano = [p.x + wB[0] * p.s * p.flip, p.y + wB[1] * p.s];
    }};
  return api;
}

// ciclos de movimiento listos para combinar
export const caminar = (t, vel = 1) => { const c = t * 7.2 * vel; const s = Math.sin(c);
  return {cdL: s * 24, rL: 10 + Math.max(0, -Math.sin(c + .9)) * 34, cdR: -s * 24, rR: 10 + Math.max(0, Math.sin(c + .9)) * 34, hL: -s * 22 + 4, cL: 14 + Math.max(0, s) * 18, hR: s * 22 - 2, cR: 16 + Math.max(0, -s) * 18, dy: -Math.abs(Math.cos(c)) * 7, tronco: 4}; };
export const parpadeo = (t, s = 0) => { const k = ((t + s * 1.7) % 3.7); return k < .12 ? Math.sin(k / .12 * Math.PI) : 0; };
export const respirar = t => Math.sin(t * 2.1);
