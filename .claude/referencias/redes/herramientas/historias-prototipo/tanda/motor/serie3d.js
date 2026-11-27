// Capa de texto del reel 3D: título grande sin recuadros, karaoke, logo chico, contador fino 1/3·2/3·3/3, globo que se tacha, golpe de flash.
import {clamp, lerp, win, easeOut, easeIn, ease, backOut, expoOut, hash} from '../../historia/base.js';
import {crear} from './escena3d.js';
const ID = new URLSearchParams(location.search).get('id');
const P = await (await fetch(`trabajo/${ID}/plan.json`)).json(); const R = P.receta, pal = R.pal, T = P.T, B = P.beats, N = B.length;
await document.fonts.ready; for (const f of ['800 40px Inter', 'italic 700 40px "Playfair Display"']) await document.fonts.load(f);
const $ = s => document.querySelector(s); document.documentElement.style.setProperty('--acc', R.acento || pal.acc);
const S3 = crear({P, pal, canvas: $('#c3')});
$('#marca').innerHTML = `<img src="../${P.logo}"><span>${P.nombre}</span>`;
const sa = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const clave = (txt, i) => { const ws = txt.split(/\s+/); const pk = sa(P.palabra || ''); let k = ws.findIndex(w => pk && sa(w).replace(/[^a-z0-9]/g, '').startsWith(pk.slice(0, 4).toLowerCase())); if (k < 0) k = B[i].paso ? 0 : ws.reduce((m, w, j) => w.length > ws[m].length ? j : m, 0); return k; };
const titulo = (txt, i) => { const ws = txt.split(/\s+/), k = clave(txt, i); return ws.map((w, j) => j === k ? `<em>${w.replace(/[.,]$/, '')}</em>${/[.,]$/.test(w) ? w.slice(-1) : ''}` : w).join(' '); };
const TY = 360, TH = 300, txt = [];
B.forEach((b, i) => { const d = document.createElement('div'); d.className = 'bt'; d.style.top = `${TY}px`; d.style.height = `${TH}px`; const t = document.createElement('div'); t.className = 't'; t.dataset.chk = 1; t.innerHTML = titulo(b.texto, i); d.appendChild(t); $('#txt').appendChild(d); txt.push(d);
  let fs = i === 0 || b.loop ? 116 : 108; t.style.fontSize = fs + 'px'; d.style.opacity = 1; while ((t.getBoundingClientRect().height > TH - 6 || t.scrollWidth > t.clientWidth + 1) && fs > 56) { fs -= 4; t.style.fontSize = fs + 'px'; } d.style.opacity = 0; });
const pasos = B.filter(b => b.paso); const TOT = pasos.length ? (pasos[0].total || pasos.length) : 0;
$('#prog').innerHTML = `<div class="lab"><b id="pn">1</b>/${TOT}</div><div class="bar">${[...Array(TOT)].map(() => '<div class="seg"><i></i></div>').join('')}</div>`; const segs = [...document.querySelectorAll('#prog .seg i')];
const chico = $('#chico'); const ult = B.findLastIndex(b => b.chico); if (ult >= 0) { chico.innerHTML = B[ult].chico.replace(/«([^»]+)»/, '«<em>$1</em>»'); chico.dataset.chk = 1; chico.style.top = `${TY + TH - 10}px`; }
const bu = P.burbuja; if (bu) { $('#burbuja').innerHTML = `<span>${bu.txt}</span><div class="tr"></div><i></i>`; $('#burbuja').dataset.chk = 1; }
// subtítulos karaoke palabra por palabra (técnica de remotion-captions: páginas cortas y palabra activa resaltada con escala)
const grupos = []; { let cur = []; P.words.forEach(w => { const len = cur.map(x => x.w).join(' ').length + w.w.length; if (cur.length >= 4 || (cur.length && len > 19)) { grupos.push(cur); cur = []; } cur.push(w); if (/[.?!:]$/.test(w.p || w.w)) { grupos.push(cur); cur = []; } }); if (cur.length) grupos.push(cur); }
const ACC = R.acento || pal.acc;
function subs(t) { let h = ''; for (let gi = 0; gi < grupos.length; gi++) { const g = grupos[gi], a = g[0].t - .04, b = gi + 1 < grupos.length ? grupos[gi + 1][0].t - .04 : g[g.length - 1].e + .35;
  if (t >= a && t < b) h = g.map(w => { const on = t >= w.t && t < w.e + .06, said = t >= w.t, k = clamp((t - w.t) / .16); return `<span class="w" style="opacity:${said ? 1 : .5};transform:scale(${on ? 1 + .14 * backOut(k, 2) : 1});${on ? `color:#D4AF37;font-family:'Playfair Display',serif;font-style:italic;font-size:80px;` : ''}">${w.w}</span>`; }).join(' '); }
  $('#sub').innerHTML = h; }
// transición del título: sube y se enfoca (sin recuadros)
function aplicar(el, p, q) { const e = easeOut(p); el.style.opacity = clamp(p * 3) * (1 - q); el.style.transform = `translateY(${(1 - e) * 60 + q * -30}px) scale(${.94 + .06 * e})`; el.style.filter = p < 1 ? `blur(${(1 - e) * 10}px)` : 'none'; }
window.TOTAL = T; window.CORTES = B.map(b => b.t0);
window.render = t => {
  const o = S3.render(t); const bi = o.bi;
  B.forEach((b, i) => { const x = txt[i]; const vis = t >= b.t0 - .02 && (t < b.t1 + .02 || i === N - 1); if (!vis) { x.style.opacity = 0; return; } const p = i === 0 ? 1 : win(t, b.t0, b.t0 + .4), q = i === N - 1 ? 0 : win(t, b.t1 - .15, b.t1); aplicar(x, p, q); });
  const bb = B[bi]; const pp = $('#prog'); const kPaso = bb.paso ? win(t, bb.t0, bb.t0 + .3) * (1 - win(t, bb.t1 - .15, bb.t1)) : 0; pp.style.opacity = kPaso; if (bb.paso) $('#pn').textContent = bb.paso;
  segs.forEach((s, k) => { const b = pasos[k]; s.style.width = b ? `${(t >= b.t1 ? 1 : clamp((t - b.t0) / (b.t1 - b.t0))) * 100}%` : '0%'; });
  if (ult >= 0) { const b = B[ult]; chico.style.opacity = easeOut(win(t, b.t0 + 1.0, b.t0 + 1.4)) * (1 - win(t, b.t1 - .15, b.t1)); }
  const g = $('#burbuja'); if (bu) { const k = win(t, bu.t0, bu.t0 + .35) * (1 - win(t, bu.fin, bu.fin + .3)); g.style.opacity = clamp(k * 3); const [nx, ny] = o.nico; const w = g.offsetWidth, h = g.offsetHeight; const bx = clamp(nx - w * .62, 40, 1080 - 140 - w), by = clamp(ny - h - 40, 740, 1200); g.style.left = `${bx}px`; g.style.top = `${by}px`; g.style.transform = `scale(${.4 + .6 * backOut(win(t, bu.t0, bu.t0 + .4), 2)})`; g.querySelector('i').style.left = `${clamp(nx - bx - 12, 30, w - 70)}px`; g.querySelector('.tr').style.transform = `scaleX(${easeOut(win(t, bu.tachar, bu.tachar + .35))})`; }
  $('#flash').style.opacity = o.flash * .55; subs(t); return 1; };
window.render(0); window.ready = true;
