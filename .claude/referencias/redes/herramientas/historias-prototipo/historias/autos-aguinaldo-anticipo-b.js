// Autos · «El ticket del 0 km» · variante B (20/11 10:30): la cocina de Villa Crespo, el aguinaldo y la cuota.
// Abre en primera persona (el celular de Juli y Mati que propone poner todo de anticipo), giro irreal: el 0 km sale del
// showroom en cámara lenta y frena a un centímetro de la cámara entre los meses que pasan; primer plano: la impresora de ticket.
import {obra} from '../historia/obra.js';
import {lerp, ease, easeOut, easeIn, win, wob, clamp, backOut, hash} from '../historia/base.js';
import {personaje} from '../historia/personaje.js';
import * as D from '../historia/decor.js';
import * as PP from '../historia/primerplano.js';
import {realce} from '../historia/realce.js';
import {poser, luz, PJS, ganchoCss} from './comun.js';
const AZUL = '#207CCF', TINTA = '#000521', NAVY = '#011F65', CIELO = '#8CC8FF';
const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
// cocina de departamento: alacenas, heladera, azulejos y la ventana a la calle
const cocina = (w = 1500) => D.interior({w, pared: '#f2e6d3', piso: '#a77f5c', ventana: [930, 330, 420, 560], vista: 'dia', zocalo: '#f7efe2', luz: '#fff1d0'}) +
  `<rect x="40" y="250" width="620" height="230" rx="10" fill="#e9d9c1"/>${[0, 1, 2].map(i => `<rect x="${58 + i * 200}" y="268" width="186" height="194" rx="8" fill="#f6ecdc"/><rect x="${140 + i * 200}" y="440" width="24" height="8" rx="4" fill="#b59a7a"/>`).join('')}
  <rect x="40" y="760" width="640" height="300" fill="#e7eef0"/>${[...Array(6)].map((_, i) => [...Array(3)].map((_, j) => `<rect x="${44 + i * 106}" y="${764 + j * 98}" width="102" height="94" fill="#f4f8f9" opacity=".9"/>`).join('')).join('')}
  <rect x="30" y="1050" width="660" height="40" rx="8" fill="#5b4636"/><rect x="40" y="1090" width="640" height="330" fill="#d9c7ae"/>${[0, 1, 2].map(i => `<rect x="${52 + i * 212}" y="1104" width="200" height="300" rx="8" fill="#e8d9c4"/>`).join('')}
  <rect x="1360" y="560" width="220" height="860" rx="22" fill="#e8ecef"/><rect x="1360" y="860" width="220" height="8" fill="#c9d0d6"/><rect x="1380" y="640" width="12" height="160" rx="6" fill="#aab3bb"/><rect x="1380" y="900" width="12" height="200" rx="6" fill="#aab3bb"/>
  <rect x="300" y="610" width="160" height="110" rx="10" fill="${NAVY}"/><text x="380" y="680" font-family="Archivo" font-weight="900" font-size="34" fill="#fff" text-anchor="middle">0 KM</text>`;
// el 0 km de frente (sin marca de terceros: solo el logo de la agencia)
const autoFrente = `<g class="car"><ellipse cx="0" cy="10" rx="360" ry="40" fill="#000" opacity=".45"/>
  <rect x="-300" y="-110" width="96" height="130" rx="24" fill="#0b0d12"/><rect x="204" y="-110" width="96" height="130" rx="24" fill="#0b0d12"/>
  <path d="M-235,-240 L-175,-400 Q-160,-425 -125,-425 L125,-425 Q160,-425 175,-400 L235,-240 Z" fill="#14549a"/>
  <path d="M-205,-250 L-155,-390 L155,-390 L205,-250 Z" fill="#1b2433"/><path d="M-170,-262 L-135,-372 L-40,-372 L-110,-262 Z" fill="#fff" opacity=".16"/>
  <rect x="-330" y="-260" width="660" height="210" rx="70" fill="${AZUL}"/><rect x="-330" y="-260" width="660" height="70" rx="40" fill="#fff" opacity=".12"/>
  <rect x="-360" y="-270" width="52" height="36" rx="12" fill="#14549a"/><rect x="308" y="-270" width="52" height="36" rx="12" fill="#14549a"/>
  <g class="faros"><ellipse cx="-225" cy="-175" rx="66" ry="30" fill="#fff6d0"/><ellipse cx="225" cy="-175" rx="66" ry="30" fill="#fff6d0"/></g>
  <rect x="-130" y="-170" width="260" height="66" rx="24" fill="#0b0d12"/><image href="autos.png" x="-20" y="-168" width="40" height="54"/>
  <rect x="-90" y="-96" width="180" height="44" rx="8" fill="#f7f6f1" stroke="#0b0d12" stroke-width="4"/><text x="0" y="-63" font-family="Archivo" font-weight="900" font-size="30" fill="${NAVY}" text-anchor="middle">NUEVO</text></g>`;
export async function armar(V) {
  const C = V.cfg || {};
  const O = obra(V, {nombre: 'Automotores Kocos', logo: 'autos.png', ctaSub: 'y te respondemos', hookHTML: C.hook, hookHasta: V.frases[1].t - .15, notas: []});
  document.documentElement.style.cssText += `--f1:Archivo;--f2:'Plus Jakarta Sans';--fs:Archivo;--tt:uppercase;--acc:${CIELO};--hw:900;--em:normal;--kwCol:#fff;--logoH:150px;--velo:rgba(0,5,33,.9);--ctaTop:600px;--ss:78px;${ganchoCss(C.hook)};--hookTop:1130px`;
  const F = n => V.frases.find(f => f.marca === n); const FI = i => V.frases.find(f => f.item === i); const cta = V.frases.find(f => f.cta);
  const pJ = poser(V, 'juli'), pM = poser(V, 'mati'); const fr = V.frases;
  // 0 · primera persona: el celular de Juli y, atrás y fuera de foco, Mati entusiasmado
  const cm = PP.celularMano({piel: PJS.juli.piel, funda: '#c45a3b', manga: PJS.juli.campera});
  const e0 = O.esc({nombre: 'pov', fondo: '#f2e6d3', capas: [{f: .5, prof: .35, w: 1500, svg: cocina() + '<g class="act"></g>' + D.mesa({x: 760, y: 1300, w: 700, c: '#c49a6c', patas: 200})},
    {f: 1, prof: 1, svg: `<g transform="translate(330,700) scale(.66) rotate(-6,540,960)">${cm.svg}</g>`}]});
  e0.capas[1].svg.querySelector('.pantalla').innerHTML = PP.notificacion({hora: '09:41', app: 'Tu banco', titulo: 'Aguinaldo acreditado', texto: 'Ya lo tenés disponible en tu cuenta.', color: AZUL, fondo: ['#0E4EB2', '#8CC8FF']});
  const mati0 = personaje(e0.capas[0].svg.querySelector('.act'), PJS.mati); const tel0 = e0.capas[1].svg.firstChild;
  // 1 · la cocina de Villa Crespo
  const e1 = O.esc({nombre: 'cocina', fondo: '#f2e6d3', capas: [{f: .6, prof: .6, w: 1500, svg: cocina()},
    {f: 1, prof: 1, w: 1500, svg: '<g class="act"></g>' + D.mesa({x: 760, y: 1300, w: 700, c: '#c49a6c', patas: 200}) + `<rect x="560" y="1262" width="70" height="40" rx="8" fill="#e9e3d4"/><rect x="900" y="1268" width="120" height="34" rx="6" fill="${NAVY}" transform="rotate(-6,960,1285)"/>`}]});
  const act1 = e1.capas[1].svg.querySelector('.act'); const juli = personaje(act1, PJS.juli), mati = personaje(act1, PJS.mati);
  // 2 · showroom: el 0 km sale en cámara lenta entre los meses que pasan y frena a un centímetro
  const e2 = O.esc({nombre: 'showroom', fondo: TINTA, capas: [
    {f: .3, prof: .3, svg: `<defs><radialGradient id="sr" cx=".5" cy=".55" r=".75"><stop offset="0" stop-color="#0E4EB2"/><stop offset=".6" stop-color="${NAVY}"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect x="-300" y="-300" width="1680" height="2520" fill="url(#sr)"/>
      ${[...Array(9)].map((_, i) => `<rect x="${-60 + i * 150}" y="380" width="130" height="760" fill="#cfe0ef" opacity=".10"/>`).join('')}<rect x="-300" y="1140" width="1680" height="1100" fill="#0a1a3d"/>${[...Array(12)].map((_, i) => `<path d="M540,1140 L${-900 + i * 260},2200" stroke="${CIELO}" stroke-width="3" opacity=".18"/>`).join('')}
      <rect x="-300" y="300" width="1680" height="60" fill="${NAVY}"/><text x="540" y="345" font-family="Archivo" font-weight="900" font-size="40" fill="#fff" text-anchor="middle" letter-spacing="6">AUTOMOTORES KOCOS · 0 KM</text>`},
    {f: .7, prof: .8, svg: '<g class="meses"></g>'}, {f: 1, prof: 1, svg: `<g class="carG">${autoFrente}</g><g class="glare"></g>`}]});
  const meses = e2.capas[1].svg.querySelector('.meses'), carG = e2.capas[2].svg.querySelector('.carG'), glare = e2.capas[2].svg.querySelector('.glare');
  meses.innerHTML = MESES.map(m => `<g class="mes"><rect x="-80" y="-56" width="160" height="112" rx="16" fill="#f7f6f1"/><rect x="-80" y="-56" width="160" height="30" rx="12" fill="${AZUL}"/><text y="30" font-family="Archivo" font-weight="900" font-size="46" fill="${NAVY}" text-anchor="middle">${m}</text></g>`).join('');
  // 3 · la impresora de ticket: el plan del aguinaldo, renglón por renglón
  const filas = ['ANTES DEL ANTICIPO', 'Cuota que podés pagar', 'Gastos e imprevistos', 'Anticipo a medida'];
  const tky = 160 + 3 * 120 + 80;
  const ticket = `<defs><clipPath id="tkc"><rect x="250" y="-2000" width="580" height="3150"/></clipPath><linearGradient id="tkm" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1b1e24"/><stop offset=".5" stop-color="#3a3f48"/><stop offset="1" stop-color="#16181d"/></linearGradient></defs>
    <g clip-path="url(#tkc)"><g class="papel"><rect x="270" y="0" width="540" height="${tky + 200}" fill="#f7f6f1"/>
      <g class="fila"><text x="540" y="78" font-family="Archivo" font-weight="900" font-size="40" fill="#1b1d22" text-anchor="middle" letter-spacing="2">${filas[0]}</text><path d="M300,112 L780,112" stroke="#1b1d22" stroke-width="3" stroke-dasharray="10 8"/></g>
      ${filas.slice(1).map((f, i) => `<g class="fila"><circle cx="330" cy="${200 + i * 120}" r="26" fill="${AZUL}"/><path d="M316,${200 + i * 120} l10,10 l18,-20" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round"/><text x="378" y="${213 + i * 120}" font-family="Plus Jakarta Sans" font-weight="800" font-size="38" fill="#1b1d22">${f}</text></g>`).join('')}
      <g class="fila"><rect x="290" y="${tky - 20}" width="500" height="120" rx="16" fill="${AZUL}"/><text x="540" y="${tky + 56}" font-family="Archivo" font-weight="900" font-size="44" fill="#fff" text-anchor="middle">PRIMERO, LA CUOTA</text></g>
      <path d="M270,${tky + 200} ${[...Array(18)].map(() => 'l15,14 l15,-14').join(' ')}" fill="#f7f6f1"/></g></g>
    <rect x="160" y="1130" width="760" height="430" rx="44" fill="url(#tkm)"/><rect x="230" y="1150" width="620" height="22" rx="11" fill="#08090b"/><circle cx="820" cy="1300" r="14" fill="#4E9BE4"/><rect x="220" y="1250" width="420" height="16" rx="8" fill="#fff" opacity=".06"/>`;
  const e3 = O.esc({nombre: 'ticket', fondo: TINTA, capas: [{f: .4, prof: .3, svg: `<defs><radialGradient id="tg2" cx=".5" cy=".7" r=".8"><stop offset="0" stop-color="#0E4EB2"/><stop offset="1" stop-color="${TINTA}"/></radialGradient></defs><rect x="-200" y="-200" width="1480" height="2320" fill="url(#tg2)"/>${[...Array(9)].map((_, i) => `<rect x="${i * 140 - 40}" y="-200" width="3" height="2320" fill="${AZUL}" opacity=".14"/>`).join('')}`}, {f: 1, prof: 1, svg: ticket}]});
  const papel = e3.capas[1].svg.querySelector('.papel'); const filasEl = [...e3.capas[1].svg.querySelectorAll('.fila')];
  // 4 · plano cenital de la mesa: dos sobres, la plata pasa del anticipo a «gastos e imprevistos»
  const billete = (i) => `<g class="bill"><rect x="-120" y="-56" width="240" height="112" rx="10" fill="#7fb6a0" stroke="#4f8a74" stroke-width="5"/><circle r="30" fill="#a9d4c2"/><rect x="-100" y="-38" width="44" height="76" rx="6" fill="#a9d4c2" opacity=".7"/></g>`;
  const e4 = O.esc({nombre: 'mesa', fondo: '#b98a5e', capas: [{f: 1, prof: 1, svg: `<rect x="-200" y="-200" width="1480" height="2320" fill="#b98a5e"/>${[...Array(16)].map((_, i) => `<rect x="-200" y="${i * 140 - 100}" width="1480" height="4" fill="#8f6744" opacity=".5"/>`).join('')}
    <g transform="translate(300,1180) rotate(-6)"><rect x="-210" y="-140" width="420" height="280" rx="14" fill="#f3ead8"/><path d="M-210,-140 L0,10 L210,-140" fill="none" stroke="#d8cbb0" stroke-width="6"/><text y="100" font-family="Archivo" font-weight="900" font-size="40" fill="${NAVY}" text-anchor="middle">ANTICIPO</text></g>
    <g transform="translate(790,1200) rotate(5)"><rect x="-230" y="-150" width="460" height="300" rx="14" fill="#f3ead8"/><path d="M-230,-150 L0,10 L230,-150" fill="none" stroke="#d8cbb0" stroke-width="6"/><text y="80" font-family="Archivo" font-weight="900" font-size="38" fill="${AZUL}" text-anchor="middle">GASTOS E</text><text y="124" font-family="Archivo" font-weight="900" font-size="38" fill="${AZUL}" text-anchor="middle">IMPREVISTOS</text></g>
    <g transform="translate(830,640)"><circle r="120" fill="#f7f6f1"/><circle r="92" fill="#5a3a22"/><path d="M110,-30 q70,0 70,40 q0,40 -70,40" fill="none" stroke="#f7f6f1" stroke-width="22"/></g>
    <g transform="translate(260,560) rotate(-20)"><circle cy="-60" r="40" fill="none" stroke="#cfd6e0" stroke-width="12"/><rect x="-46" y="-30" width="92" height="140" rx="36" fill="#0b0d12"/><rect x="-12" y="100" width="24" height="120" rx="6" fill="#cfd6e0"/></g>
    <g class="bills">${[0, 1, 2, 3, 4].map(billete).join('')}</g>`}]});
  const bills = [...e4.capas[0].svg.querySelectorAll('.bill')];
  luz(e1, 'background:linear-gradient(110deg,transparent 40%,rgba(255,240,210,.45)),linear-gradient(180deg,transparent 60%,rgba(0,10,40,.2))');
  luz(e0, 'background:linear-gradient(110deg,transparent 40%,rgba(255,240,210,.35))');
  luz(e4, 'background:radial-gradient(circle at 70% 25%,rgba(255,240,210,.35),transparent 55%),linear-gradient(180deg,transparent 60%,rgba(0,0,0,.25))');
  const {bokeh, sumarCapa, haz, hzDef, conPolvo, motasRender} = realce();
  sumarCapa(e1, {f: .6, prof: .6, w: 1500, blend: 'screen', svg: hzDef('#fff1d0') + haz(1140, 330, Math.PI * .2, 1500, 300)}); conPolvo(e1, 900, 900, 420, 320, '#fff3d8');
  sumarCapa(e2, {f: 1.6, prof: 1.7, svg: bokeh(8, 31, ['#8CC8FF', '#ffffff', '#207CCF'])}); O.motas = motasRender;
  const pareja = (t, j = {}, m = {}) => { pM(mati, t, Object.assign({x: 1000, y: 1480, s: 1.0, flip: -1, hR: 150, cR: 30, hL: 140, cL: 30, sonrisa: 1, ceja: .6, mira: .3}, m)); pJ(juli, t, Object.assign({x: 540, y: 1490, s: .98, flip: 1, hR: 40, cR: 80, hL: 20, cL: 30, mira: .5, ceja: -.4, sonrisa: -.2}, j)); };
  const f1 = fr[1], f2 = fr[2], f3 = fr[3], tc = f2.fin + .2;  // tc: el auto frena
  const vibra = t => (t > .05 && t < 1.2) ? Math.sin(t * 90) * 5 : 0;
  O.tomas = [
    {t0: 0, esc: e0, cam: (k, t) => ({x: 540 + vibra(t) * .4, y: lerp(980, 940, k), z: lerp(1.0, 1.06, ease(k)), r: lerp(-1, 1, k), foco: 1, ap: 7}), act: t => {
      tel0.setAttribute('transform', `translate(${330 + vibra(t)},${700 + Math.sin(t * 2) * 6}) scale(.66) rotate(-6,540,960)`);
      pM(mati0, t, {x: 640, y: 1520, s: 1.05, flip: -1, hR: lerp(40, 160, easeOut(win(t, .3, .9))), cR: 30, hL: lerp(30, 150, easeOut(win(t, .4, 1))), cL: 30, sonrisa: 1, ceja: .8, mira: .2, cab: wob(t) * 4}); },
      boca: () => e0.aPantalla(e0.capas[0], mati0.cabeza[0], mati0.cabeza[1] - 60)},
    {t0: f1.t - .05, esc: e1, cam: k => ({X: lerp(640, 820, k), Y: 1170, z: 1.5, foco: 1, ap: 4}), act: t => pareja(t)},
    {t0: f1.t + 1.55, esc: e1, cam: k => ({X: lerp(520, 600, k), Y: 1000, z: 2.5, foco: 1, ap: 6}), act: t => pareja(t, {ceja: -.9, sonrisa: -.5, cab: -6, hR: 70, cR: 100})},
    {t0: f2.t - .08, esc: e2, tr: 'zoom', lineas: .3, cam: (k, t) => { const d = t - tc; const sk = d > 0 && d < .6 ? Math.exp(-d * 7) : 0; return {x: 540 + Math.sin(t * 61) * 22 * sk, y: 980 + Math.cos(t * 47) * 16 * sk, z: 1.0 + .05 * sk, r: Math.sin(t * 33) * 2.2 * sk, foco: 1, ap: 3}; }, act: t => {
      const k = win(t, f2.t - .08, tc); const s = t < tc ? lerp(.22, 2.7, Math.pow(easeOut(k), 1.4)) : 2.7 + Math.max(0, Math.sin((t - tc) * 30) * .04 * Math.exp(-(t - tc) * 8));
      carG.setAttribute('transform', `translate(540,${lerp(1160, 1700, Math.pow(easeOut(k), 1.4))}) scale(${s})`);
      const d = t - f2.t; meses.querySelectorAll('.mes').forEach((m, i) => { const r = ((d * 520 + i * 75) % 900) + 40, a = i * 30 * Math.PI / 180 + d * .3; m.setAttribute('transform', `translate(${540 + Math.cos(a) * r * 1.1},${980 + Math.sin(a) * r * 1.5}) scale(${.3 + r / 520}) rotate(${Math.sin(a) * 18})`); m.setAttribute('opacity', clamp(r / 200) * .95); });
      const g = t >= tc ? Math.exp(-(t - tc) * 3) : clamp(k * .4); glare.innerHTML = `<circle cx="${540 - 225 * s}" cy="${lerp(1160, 1700, Math.pow(easeOut(k), 1.4)) - 175 * s}" r="${120 * s}" fill="#fff6d0" opacity="${.35 * g}"/><circle cx="${540 + 225 * s}" cy="${lerp(1160, 1700, Math.pow(easeOut(k), 1.4)) - 175 * s}" r="${120 * s}" fill="#fff6d0" opacity="${.35 * g}"/>`; }},
    {t0: f3.t - .1, esc: e3, tr: 'v', cam: k => ({x: lerp(500, 580, k), y: lerp(1050, 820, ease(k)), z: lerp(1.0, 1.06, k), foco: 1}), act: t => tk(t)},
    {t0: FI(1).t - .1, esc: e3, cam: k => ({x: lerp(620, 520, k), y: 640, z: 1.45, r: -2, foco: 1}), act: t => tk(t)},
    {t0: FI(2).t - .1, esc: e4, tr: 'zoom', cam: k => ({x: lerp(500, 580, k), y: lerp(1000, 980, k), z: lerp(1.0, 1.08, ease(k)), r: lerp(2, -1, k), foco: 1}), act: t => {
      bills.forEach((b, i) => { const a = FI(2).t + .35 + i * .28, k = easeOut(win(t, a, a + .55)); const mov = i < 3; const x0 = 300 + (i - 2) * 14, y0 = 1180 - i * 10, x1 = 790 + (i - 1) * 18, y1 = 1190 - i * 8;
        const x = mov ? lerp(x0, x1, k) : x0, y = mov ? lerp(y0, y1, k) - Math.sin(k * Math.PI) * 260 : y0; b.setAttribute('transform', `translate(${x},${y}) rotate(${mov ? lerp(-8, 10, k) + Math.sin(k * Math.PI) * 25 : -8 + i * 3}) scale(${1 + Math.sin(k * Math.PI) * .25})`); }); }},
    {t0: FI(3).t - .1, esc: e3, tr: 'h', cam: k => ({x: lerp(460, 620, k), y: lerp(760, 700, ease(k)), z: lerp(1.25, 1.35, ease(k)), foco: 1}), act: t => tk(t)},
    {t0: F('alivio').t - .1, esc: e1, cam: k => ({X: lerp(700, 800, k), Y: 1100, z: lerp(1.75, 1.85, ease(k)), foco: 1, ap: 5}), act: t => { const k = easeOut(win(t, F('alivio').t, F('alivio').t + .6));
      pareja(t, {hR: lerp(40, 160, k), cR: lerp(80, 20, k), hL: lerp(20, 150, k), cL: lerp(30, 20, k), sonrisa: 1, ceja: .5, cab: -4 * k}, {hR: 80, cR: 60, hL: 20, cL: 20, sonrisa: 1, ceja: .3}); juli.E.propMano.innerHTML = ''; },
      boca: () => e1.aPantalla(e1.capas[1], juli.cabeza[0], juli.cabeza[1] - 60)},
    {t0: cta.t - .3, esc: e1, cam: k => ({X: lerp(800, 840, k), Y: 1100, z: lerp(1.85, 1.95, k), foco: 1, ap: 10}), act: t => pareja(t, {hR: 160, cR: 20, hL: 150, cL: 20, sonrisa: 1}, {sonrisa: 1})},
    {t0: V.total - .4, esc: e0, cam: k => ({x: 540, y: 980, z: 1.0, foco: 1, ap: 7}), act: t => { tel0.setAttribute('transform', 'translate(330,700) scale(.66) rotate(-6,540,960)'); pM(mati0, t, {x: 640, y: 1520, s: 1.05, flip: -1, hR: 160, cR: 30, hL: 150, cL: 30, sonrisa: 1, ceja: .8}); }},
  ];
  // ticket: cada renglón aparece con su frase y el papel sube
  const filaT = [f3.t + .2, FI(1).t, FI(2).t, FI(3).t, FI(3).t + 1.2];
  function tk(t) { let n = 0; filaT.forEach(x => { if (t >= x) n++; }); filasEl.forEach((f, i) => f.style.opacity = i < n ? 1 : 0);
    const L = Math.min(tky + 200, 130 + Math.max(0, n - 1) * 120 + (n >= 5 ? 200 : 0)); const prev = 130 + Math.max(0, n - 2) * 120; const ti = filaT[Math.max(0, n - 1)] || 0; const kk = easeOut(win(t, ti, ti + .35));
    papel.setAttribute('transform', `translate(0,${1150 - lerp(n > 1 ? prev : 0, L, kk)})`); }
  O.impactos = [.02, tc]; O.flash = t => Math.max(t >= .02 ? .45 * Math.exp(-(t - .02) * 8) : 0, t >= tc ? .6 * Math.exp(-(t - tc) * 9) : 0);
  return O;
}
