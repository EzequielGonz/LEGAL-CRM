// Motor de producción en serie: arma un reel desde trabajo/<id>/plan.json (guion + tiempos de la voz + receta de estilo).
// Todo es función del tiempo: window.render(t). Recursos: karaoke palabra por palabra, contador que avanza, cartas que se abren,
// cortes de cámara cada 1,5–3 s, luz de cine con desenfoque de miniatura (tilt-shift) y empalme del último cuadro con el primero (ffmpeg).
import {clamp, lerp, win, easeOut, easeIn, ease, backOut, expoOut, hash} from '../../historia/base.js';
import {ICONOS, elegirIcono} from './iconos.js';
const q = new URLSearchParams(location.search); const ID = q.get('id');
const P = await (await fetch(`trabajo/${ID}/plan.json`)).json(); const R = P.receta, pal = R.pal, T = P.T;
await document.fonts.ready; for (const f of ['800 40px Manrope', '700 40px "Playfair Display"', '800 40px Inter']) await document.fonts.load(f);
const $ = s => document.querySelector(s); const rs = document.documentElement.style;
Object.entries({'--ink': pal.ink, '--acc': pal.acc, '--onacc': pal.onacc, '--card': pal.card, '--cardInk': pal.cardInk, '--subStroke': pal.subStroke, '--pill': pal.pill, '--pillInk': pal.pillInk, '--ft': `'${R.ft}'`, '--fs': `'${R.fs}'`, '--vin': R.vin ?? .4, '--fw': R.fw ?? 800}).forEach(([k, v]) => rs.setProperty(k, v));
const IC = {a: pal.acc, b: pal.acc2, k: pal.k, d: pal.d}; const NS = 'http://www.w3.org/2000/svg';
const OY = R.layout === 'B' ? 640 : 960;           // centro vertical de la zona del objeto
const TY = R.layout === 'B' ? 905 : 360;           // arriba del título
const TH = R.layout === 'B' ? 300 : 330;           // alto máximo del título
$('#grade').style.background = pal.grade; $('#tilt1').style.display = $('#tilt2').style.display = R.tilt === false ? 'none' : 'block';
// ---------- fondo (8 variantes) ----------
const W = 1320, H = 2160;
function fondoSVG() {
  const g = `<defs><linearGradient id="bgg" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${pal.bg1}"/><stop offset="1" stop-color="${pal.bg2}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`;
  const c = pal.line; let m = '';
  switch (R.fondo) {
    case 'grid': m = [...Array(24)].map((_, i) => `<rect x="${i * 110 - 110}" y="-200" width="3" height="${H + 400}" fill="${c}" opacity=".22"/><rect x="-200" y="${i * 110 - 110}" width="${W + 400}" height="3" fill="${c}" opacity=".22"/>`).join(''); break;
    case 'rayas': m = [...Array(26)].map((_, i) => `<rect x="${i * 150 - 600}" y="-300" width="56" height="${H + 600}" fill="${c}" opacity=".16" transform="rotate(18 660 1080)"/>`).join(''); break;
    case 'ciudad': m = [0, 1].map(L => [...Array(16)].map((_, i) => { const w = 90 + hash(i + L * 40) * 110, h = (L ? 420 : 640) + hash(i * 3 + L) * 520, x = i * 110 - 60; return `<rect x="${x}" y="${1500 - h + L * 160}" width="${w}" height="${h + 600}" fill="${c}" opacity="${L ? .3 : .17}"/>${[...Array(5)].map((_, k) => `<rect x="${x + 14}" y="${1500 - h + L * 160 + 26 + k * 70}" width="${w - 28}" height="20" fill="${pal.acc}" opacity="${hash(i * 9 + k) > .6 ? .35 : .08}"/>`).join('')}`; }).join('')).join(''); break;
    case 'blueprint': m = [...Array(46)].map((_, i) => `<rect x="${i * 56 - 56}" y="-100" width="2" height="${H + 200}" fill="${c}" opacity="${i % 5 ? .1 : .3}"/><rect x="-100" y="${i * 56 - 56}" width="${W + 200}" height="2" fill="${c}" opacity="${i % 5 ? .1 : .3}"/>`).join('') + `<circle cx="660" cy="1000" r="520" fill="none" stroke="${c}" stroke-width="3" stroke-dasharray="18 14" opacity=".4"/>`; break;
    case 'puntos': m = [...Array(18)].flatMap((_, r) => [...Array(14)].map((_, k) => `<circle cx="${k * 100 + (r % 2) * 50}" cy="${r * 124}" r="${6 + hash(r * 14 + k) * 18}" fill="${c}" opacity=".2"/>`)).join(''); break;
    case 'olas': m = [...Array(12)].map((_, i) => `<path d="M-100,${i * 200} q165,-90 330,0 t330,0 t330,0 t330,0 V${i * 200 + 260} H-100Z" fill="${c}" opacity="${.07 + (i % 3) * .04}"/>`).join(''); break;
    default: m = [...Array(60)].map((_, i) => `<rect x="${(i % 8) * 190 - 40}" y="${Math.floor(i / 8) * 330 - 90}" width="150" height="150" rx="34" fill="${c}" opacity="${.08 + hash(i) * .12}" transform="rotate(${hash(i + 3) * 40 - 20} ${(i % 8) * 190 + 35} ${Math.floor(i / 8) * 330 - 15})"/>`).join('');
  }
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}<g id="bgm">${m}</g></svg>`;
}
$('#bg').innerHTML = fondoSVG(); const bgm = $('#bgm');
// luz de cine: halo, haces y bokeh
$('#luz').innerHTML = `<svg width="${W}" height="${H}"><defs><radialGradient id="hl" cx=".3" cy=".12" r=".7"><stop offset="0" stop-color="${pal.luz}" stop-opacity=".5"/><stop offset="1" stop-color="${pal.luz}" stop-opacity="0"/></radialGradient><linearGradient id="hz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${pal.luz}" stop-opacity=".35"/><stop offset="1" stop-color="${pal.luz}" stop-opacity="0"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#hl)"/><g id="haces" style="mix-blend-mode:screen">${[0, 1, 2].map(i => `<polygon points="${220 + i * 360},-60 ${100 + i * 360},1700 ${420 + i * 360},1700" fill="url(#hz)" opacity=".5"/>`).join('')}</g></svg>`;
$('#bok').innerHTML = `<svg width="${W}" height="${H}" style="mix-blend-mode:screen;filter:blur(7px)"><g id="bokm">${[...Array(16)].map((_, i) => `<circle cx="${hash(i) * W}" cy="${200 + hash(i * 3) * 1700}" r="${30 + hash(i + 7) * 70}" fill="${i % 2 ? pal.acc : pal.luz}" opacity="${.1 + hash(i + 5) * .16}"/>`).join('')}</g></svg><svg width="${W}" height="${H}" style="position:absolute;left:0;top:0"><g id="polvo">${[...Array(26)].map((_, i) => `<circle r="${1.6 + hash(i + 70) * 3}" fill="${pal.luz}"/>`).join('')}</g></svg>`;
const haces = $('#haces'), bokm = $('#bokm'), polvo = [...$('#polvo').children];
// ---------- beats: objeto + título ----------
const B = P.beats; const N = B.length; { const us = []; B.forEach((b, i) => { if (!b.icono) { b.icono = elegirIcono(b.texto + ' ' + (b.voz || '') + (i === 0 ? ' ' + (P.escena || '') : ''), us); } us.push(b.icono); if (i === 0 && P.escena) { const o2 = elegirIcono(P.escena, [b.icono]); if (o2 !== b.icono && /papel|auto|choque|celu|carta|llave|ticket|plata|local|camara/.test(o2)) b.icono2 = o2; } }); }
function escenaBeat(b, i) {
  const ic = ICONOS[b.icono] || ICONOS.alerta; let s = '';
  if (i === 0) { // diorama: baldosa, edificios, cartel de calle con el lugar, objeto héroe y silueta
    const bd = [...Array(7)].map((_, k) => { const w = 70 + hash(k + R.seed) * 60, h = 160 + hash(k * 3 + R.seed) * 220; return `<rect x="${-300 + k * 90}" y="${40 - h}" width="${w}" height="${h}" rx="6" fill="${pal.acc2}" opacity="${.28 + (k % 3) * .1}"/>`; }).join('');
    s = `<ellipse cx="0" cy="170" rx="400" ry="96" fill="${pal.d}" opacity=".35"/><ellipse cx="0" cy="150" rx="370" ry="84" fill="${pal.acc2}" opacity=".55"/><g transform="translate(0,60)">${bd}</g>
    <g transform="translate(-250,90)"><rect x="-6" y="-200" width="12" height="210" fill="${pal.k}"/><rect x="-120" y="-250" width="240" height="64" rx="10" fill="${pal.acc}"/><text x="0" y="-205" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="30" fill="${pal.onacc}">${P.lugar || ''}</text></g>
    <g transform="translate(40,10) scale(1.25)">${ic(IC)}</g>${b.icono2 ? `<g transform="translate(250,70) scale(.62)">${ICONOS[b.icono2](IC)}</g>` : ''}
    ${P.personaje ? `<g transform="translate(-300,110) scale(.5)" opacity=".9">${ICONOS.persona({...IC, d: pal.d})}</g>` : ''}`;
  } else s = `<circle r="${250}" fill="${pal.acc}" opacity=".2"/><circle r="190" fill="${pal.acc}" opacity=".16"/><g class="ico" transform="scale(1.4)">${ic(IC)}</g>`;
  return `<svg width="1080" height="1920" viewBox="0 0 1080 1920"><g class="oc" transform="translate(540,${OY})"><g class="ob">${s}</g></g></svg>`;
}
const gO = $('#objs'), gT = $('#txt'); const obj = [], txt = [];
B.forEach((b, i) => {
  const o = document.createElement('div'); o.className = 'bobj'; o.innerHTML = escenaBeat(b, i);
  if (b.paso || b.num) { const n = document.createElement('div'); n.className = 'num'; n.style.fontSize = b.num ? '220px' : '260px'; n.style.top = `${OY - (b.num ? 200 : 460)}px`; n.dataset.chk = 1; o.appendChild(n); }
  if (b.num || (b.paso && !R.cartas)) { const g = o.querySelector('.ob'); g.setAttribute('transform', `translate(${b.num ? 0 : 170},${b.num ? 120 : 30}) scale(${b.num ? .62 : .78})`); }
  gO.appendChild(o); obj.push(o);
  const t = document.createElement('div'); t.className = `btxt st-${R.card}`; t.style.top = `${TY}px`; t.style.height = `${TH}px`; t.style.alignItems = 'center';
  const tt = document.createElement('div'); tt.className = 't'; tt.dataset.chk = 1; tt.textContent = b.texto; t.appendChild(tt); gT.appendChild(t); txt.push(t);
  const big = i === 0 ? (R.hs || 130) : (R.ts || 112); let fs = big; tt.style.fontSize = fs + 'px'; t.style.opacity = 1;
  while ((tt.getBoundingClientRect().height > TH - 4 || tt.scrollWidth > tt.clientWidth + 1) && fs > 54) { fs -= 4; tt.style.fontSize = fs + 'px'; } t.style.opacity = 0; b.fs = fs;
});
$('#marca').innerHTML = `<img src="../${P.logo}"><span>${P.nombre}</span>`; $('#marca').dataset.chk = 1;
$('#cta').innerHTML = `<div class="c1">Comentá</div><div class="kw" data-chk="1">${P.palabra}</div>`; $('#cta').style.setProperty('--ctaTop', `${R.layout === 'B' ? 470 : 700}px`);
// cartas que se abren
let cartas = null; const mid = B.map((b, i) => i).filter(i => i > 0 && i < N - 1);
if (R.cartas && mid.length >= 2) {
  const M = Math.min(4, mid.length), cw = M === 2 ? 330 : M === 3 ? 262 : 200, ch = Math.round(cw * 1.42), gap = 28; const x0 = 540 - (M * cw + (M - 1) * gap) / 2;
  const el = document.createElement('div'); el.id = 'cartas'; gO.parentNode.parentNode.insertBefore(el, $('#tilt1'));
  el.innerHTML = [...Array(M)].map((_, k) => `<div class="cd" style="position:absolute;left:${x0 + k * (cw + gap)}px;top:${OY - ch / 2}px;width:${cw}px;height:${ch}px"><div class="cf" style="position:absolute;inset:0;border-radius:30px;display:flex;align-items:center;justify-content:center;flex-direction:column;overflow:hidden"></div></div>`).join('');
  cartas = {el, M, cw, ch, cds: [...el.querySelectorAll('.cd')], idx: mid.slice(0, M)};
}
// ---------- cámara: planos que cambian cada 1,5–3 s ----------
const cortes = []; { let t = 0; B.forEach((b, i) => { cortes.push(b.t0); let u = b.t0 + 1.5 + hash(i + R.seed) * 1.0; while (u < b.t1 - .9) { cortes.push(u); u += 1.5 + hash(u * 7 + R.seed) * 1.2; } }); cortes.sort((a, b) => a - b); }
const TIPOS = {empuje: ['push', 'pull', 'push', 'lat'], lateral: ['lat', 'latR', 'push', 'lat'], mano: ['push', 'lat', 'pull', 'latR'], orbita: ['orb', 'orbR', 'push', 'orb'], mix: ['push', 'lat', 'orb', 'pull', 'latR']}[R.cam] || ['push'];
function camara(t) {
  let k = 0; while (k + 1 < cortes.length && cortes[k + 1] <= t) k++; const t0 = cortes[k], t1 = cortes[k + 1] ?? T, u = clamp((t - t0) / Math.max(.4, t1 - t0)); const ty = TIPOS[(k + R.seed) % TIPOS.length]; const e = ease(u); const s = hash(k * 5 + R.seed) > .5 ? 1 : -1;
  let z = 1, x = 0, y = 0, r = 0;
  switch (ty) { case 'push': z = 1.04 + .13 * e; y = -20 * e; break; case 'pull': z = 1.2 - .14 * e; y = 20 * e; break; case 'lat': z = 1.1; x = (-60 + 120 * e) * s; break; case 'latR': z = 1.12; x = (60 - 120 * e) * s; y = -14; break; case 'orb': z = 1.1 + .04 * e; r = (-2.2 + 4.4 * e) * s; x = 30 * s; break; case 'orbR': z = 1.12; r = (2.2 - 4.4 * e) * s; }
  if (hash(k * 11 + R.seed) > .8) { z *= 1.22; y -= 30; }   // primer plano ocasional
  if (R.cam === 'mano') { const g = Math.exp(-(t - t0) * 6); x += Math.sin(t * 23) * 5 + Math.sin(t * 61) * 16 * g; r += Math.sin(t * 17) * .5 + Math.sin(t * 47) * 1.6 * g; }
  const pun = Math.max(0, Math.exp(-(t - t0) * 9)) * (k > 0 ? 1 : 0); z *= 1 + pun * .05;
  return {z, x, y, r, k, u};
}
// transiciones de entrada/salida
function entrar(p, tipo, dir) { switch (tipo) { case 'deslizar': return {x: (1 - easeOut(p)) * dir * 640, o: clamp(p * 4)}; case 'zoom': return {s: 1.6 - .6 * easeOut(p), o: clamp(p * 3)}; case 'giro': return {sx: Math.max(.02, backOut(p, 1.4)), o: p > 0 ? 1 : 0}; case 'caer': return {y: -(1 - backOut(p, 2)) * 520, o: clamp(p * 5)}; default: return {clip: (1 - easeOut(p)) * 100, o: 1}; } }
function aplicar(el, e, q) {
  const x = e.x || 0, y = e.y || 0, s = (e.s || 1) * (q ? 1 - .06 * q : 1), sx = e.sx || 1;
  el.style.opacity = (e.o ?? 1) * (q ? 1 - q : 1); el.style.transform = `translate(${x}px,${y}px) scale(${s * sx},${s})`; el.style.clipPath = e.clip ? `inset(0 0 ${e.clip}% 0)` : 'none';
}
// ---------- subtítulos karaoke ----------
const grupos = []; { let cur = []; const W2 = P.words; W2.forEach((w, i) => { const len = cur.map(x => x.w).join(' ').length + w.w.length; const corte = R.sub === 'grande' ? 1 : 4; if (cur.length >= corte || (cur.length && len > 22)) { grupos.push(cur); cur = []; } cur.push(w); if (/[.?!:]$/.test(w.p || w.w)) { grupos.push(cur); cur = []; } }); if (cur.length) grupos.push(cur); }
function subs(t) {
  let html = '';
  for (let gi = 0; gi < grupos.length; gi++) { const g = grupos[gi], a = g[0].t - .04, b = gi + 1 < grupos.length ? grupos[gi + 1][0].t - .04 : g[g.length - 1].e + .35;
    if (t >= a && t < b) { html = g.map(w => { const on = t >= w.t && t < w.e + .06, said = t >= w.t, k = clamp((t - w.t) / .16); const sc = on ? 1 + .14 * backOut(k, 2) : 1;
      let st = `transform:scale(${sc});opacity:${said ? 1 : .42};`;
      if (R.sub === 'caja' && on) st += `background:${pal.acc};color:${pal.onacc};-webkit-text-stroke:0;border-radius:18px;padding:0 14px;`;
      else if (R.sub === 'subrayado' && on) st += `color:${pal.acc};text-decoration:underline;text-decoration-thickness:10px;text-underline-offset:8px;text-decoration-color:${pal.acc};`;
      else if (on) st += `color:${pal.acc};`;
      if (R.sub === 'grande') st = `font-size:150px;color:${pal.acc};transform:scale(${1 + .2 * (1 - easeOut(k))});display:block;`;
      return `<span class="w" style="${st}">${w.w}</span>`; }).join(' '); }
  }
  $('#sub').innerHTML = html; $('#sub').style.color = pal.subFill;
}
// ---------- render ----------
const cfg = {t: 0};
window.TOTAL = T;
window.render = t => {
  const c = camara(t); $('#world').style.transform = `translate(${c.x}px,${c.y}px) rotate(${c.r}deg) scale(${c.z})`;
  bgm.setAttribute('transform', `translate(${Math.sin(t * .35) * 60 + t * (R.fondo === 'rayas' ? 22 : 8)},${Math.cos(t * .27) * 40 + (R.fondo === 'olas' ? Math.sin(t) * 30 : 0)})`);
  haces.setAttribute('transform', `translate(${Math.sin(t * .4) * 120},0)`); bokm.setAttribute('transform', `translate(${Math.sin(t * .2) * 60},${-(t * 14) % 60})`);
  polvo.forEach((m, i) => { const a = t * (.15 + hash(i) * .25) + hash(i + 3) * 6.28; m.setAttribute('cx', 200 + hash(i + 9) * 900 + Math.sin(a * 1.3) * 80); m.setAttribute('cy', 1900 - ((t * 24 * (.5 + hash(i + 4)) + hash(i + 12) * 1700) % 1800)); m.setAttribute('opacity', .2 + .5 * Math.abs(Math.sin(a * 2.1))); });
  const ctaT = T - (R.ctaDur || 2.3), ctaK = win(t, ctaT, ctaT + .4);
  B.forEach((b, i) => {
    const o = obj[i], x = txt[i]; const ini = i === 0 ? 0 : win(t, b.t0, b.t0 + .38), fin = i === N - 1 ? 0 : win(t, b.t1 - .16, b.t1); const vis = t >= b.t0 - .02 && (t < b.t1 + .02 || i === N - 1);
    if (!vis) { o.style.opacity = 0; x.style.opacity = 0; return; }
    const dir = i % 2 ? 1 : -1; const p = i === 0 ? clamp(.35 + t / .3) : ini; const ent = entrar(p, R.trans, dir);
    const oculto = cartas && cartas.idx.includes(i); aplicar(x, ent, fin); aplicar(o, ent, fin); if (oculto) o.style.opacity = 0; if (i === N - 1) o.style.opacity = (+o.style.opacity) * (1 - ctaK);
    const ob = o.querySelector('.ob'), ico = o.querySelector('.ico'); const fl = Math.sin(t * 2.2 + i) * 10; const pop = 1 + .1 * Math.exp(-(t - Math.max(b.t0, cortes.filter(u => u <= t).pop() || 0)) * 8);
    const oc = o.querySelector('.oc'); oc.setAttribute('transform', `translate(540,${OY + fl}) rotate(${Math.sin(t * 1.4 + i) * 2.5}) scale(${pop})`);
    const n = o.querySelector('.num'); if (n) { const kk = win(t, b.t0 + .1, b.t0 + 1.2); n.textContent = b.num ? Math.round(b.num * easeOut(kk)).toLocaleString('es-AR') : b.paso; const pp = b.num ? 1 : 1 + .25 * Math.exp(-(t - b.t0) * 6); n.style.transform = `scale(${pp})`; if (!b.num) n.style.left = '-250px'; }
    if (i === 0 && R.escala) { const e2 = easeOut(win(t, 0, .6)); ob.setAttribute('transform', `scale(${.25 + .75 * backOut(e2, 1.2)})`); }
  });
  if (cartas) { const a = B[cartas.idx[0]].t0, z = B[N - 1].t0; cartas.el.style.opacity = clamp(win(t, a - .05, a + .2)) * (1 - win(t, z - .15, z + .05));
    cartas.cds.forEach((d, k) => { const bi = cartas.idx[k], b = B[bi], p = win(t, b.t0, b.t0 + .55), act = t >= b.t0 && t < b.t1; const f = d.firstChild; const ent = ease(win(t, a + k * .08 - .05, a + k * .08 + .3));
      const sx = p < .5 ? 1 - 2 * p : 2 * p - 1; const open = p >= .5; const sc = (act ? 1.1 : t > b.t1 ? .92 : 1) * (.7 + .3 * ent);
      d.style.transform = `translateY(${(1 - ent) * -300}px) scale(${sc * Math.max(.02, sx)},${sc}) rotate(${(k - (cartas.M - 1) / 2) * 3}deg)`; d.style.opacity = ent * (t > b.t1 ? .8 : 1);
      f.style.background = open ? pal.card : `linear-gradient(135deg,${pal.acc2},${pal.acc})`; f.style.boxShadow = act ? `0 0 70px ${pal.acc}` : '0 14px 40px rgba(0,0,0,.35)';
      const ico = open ? `<svg width="${cartas.cw * .78}" height="${cartas.cw * .78}" viewBox="-190 -190 380 380">${(ICONOS[b.icono] || ICONOS.alerta)({a: pal.accC || pal.acc, b: pal.acc2, k: pal.cardInk === '#fff' ? '#fff' : pal.card === '#ffffff' ? '#eef1f6' : pal.card, d: pal.cardInk})}</svg><div style="font:800 ${cartas.cw * .36}px Manrope;color:${pal.cardInk}">${Math.round((k + 1) * easeOut(win(t, b.t0 + .3, b.t0 + .9)) + (k + 1 > 1 ? 0 : 0)) || ''}</div>` : `<div style="font:800 ${cartas.cw * .55}px Manrope;color:${pal.onacc};opacity:.9">?</div>`;
      if (f.dataset.s !== (open ? 'o' + Math.round((k + 1) * easeOut(win(t, b.t0 + .3, b.t0 + .9))) : 'c')) { f.innerHTML = ico; f.dataset.s = open ? 'o' + Math.round((k + 1) * easeOut(win(t, b.t0 + .3, b.t0 + .9))) : 'c'; } }); }
  subs(t); $('#sub').parentNode.style.opacity = 1 - ctaK * 0 ;
  const cta = $('#cta'); cta.style.opacity = easeOut(ctaK); cta.style.transform = `translateY(${(1 - expoOut(ctaK)) * 50}px) scale(${.9 + .1 * backOut(ctaK, 2)})`;
  const kw = cta.querySelector('.kw'); kw.style.transform = `scale(${1 + .04 * Math.max(0, Math.sin((t - ctaT) * 5.5))})`;
  return 1;
};
window.render(0); window.ready = true;
