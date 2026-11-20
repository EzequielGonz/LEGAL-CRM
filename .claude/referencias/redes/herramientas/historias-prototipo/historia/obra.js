// Arma una mini historia: tomas (escena + cámara + acción), capa de texto (gancho, narración, globos, número, cierre), grano y viñeta.
import {escena, grano, subs, globo, win, easeOut, backOut, expoOut, clamp} from './base.js';
export function obra(V, B) {
  const stage = document.getElementById('stage'); const ui = document.getElementById('ui');
  ui.innerHTML = `<div id="lineas"></div><div id="onda"></div><div id="hook">${B.hookHTML}</div><div id="num"></div><div id="sub"></div><div id="globo" class="globo"></div>
    <div id="velo"></div><div id="marca">${B.nombre ? `<img src="${B.logo}"><span>${B.nombre}</span>` : ''}</div><div id="cta"><img src="${B.logo}">${B.nombre ? `<div class="nm">${B.nombre}</div>` : ''}<div class="c1">Comentá</div><div class="kw">${V.palabra}</div><div class="c2">${B.ctaSub}</div></div><div id="nota"></div><div id="flash"></div>`;
  const $ = s => ui.querySelector(s); const grain = grano(document.getElementById('fx'));
  const O = {stage, escenas: {}, tomas: [], V, B, palabrasH: V.frases.filter(f => !f.cta).flatMap(f => f.words.filter(w => w.h).map(w => w.t)),
    esc(def) { const e = escena(stage, def); O.escenas[def.nombre] = e; e.el.style.display = 'none'; return e; },
    frase: q => V.frases.find(f => f.marca === q),
    render(t) {
      const S = O.tomas; let i = S.length - 1; while (i > 0 && S[i].t0 > t) i--; const s = S[i]; const t1 = S[i + 1] ? S[i + 1].t0 : V.total;
      const k = clamp((t - s.t0) / (t1 - s.t0));
      for (const e of Object.values(O.escenas)) e.el.style.display = e === s.esc ? 'block' : 'none';
      const c = s.cam(k, t); s.esc.cam(c); s.act && s.act(t, k);
      // transiciones rápidas: barrido con desenfoque (alterna horizontal y vertical) o golpe de zoom
      const W = .15, dIn = t - s.t0, dOut = t1 - t; const kO = S[i + 1] && dOut < W ? 1 - dOut / W : 0, kI = i > 0 && dIn < W ? 1 - dIn / W : 0;
      const tr = s.tr || (i % 3 === 2 ? 'zoom' : i % 2 ? 'v' : 'h');
      let tf = ''; const bl = (kO * kO + kI * kI) * 26;
      if (tr === 'zoom') tf = `scale(${1 + kO * kO * .5 + kI * kI * .35})`; else { const px = (-kO * kO + kI * kI) * 380; tf = tr === 'v' ? `translateY(${px}px)` : `translateX(${px}px)`; }
      // dopamina: golpe de zoom sutil en cada palabra destacada; grado de color de cine
      const pun = O.palabrasH.reduce((m, w) => Math.max(m, t >= w && t < w + .35 ? Math.exp(-(t - w) * 11) : 0), 0);
      stage.style.transform = `${tf} scale(${1 + pun * .045})`; stage.style.filter = `contrast(1.07) saturate(1.13) brightness(1.02)${bl > .3 ? ` blur(${bl.toFixed(1)}px)` : ''}`;
      O.motas && O.motas(t);
      const imp = (O.impactos || []).reduce((m, g) => Math.max(m, t >= g ? Math.exp(-(t - g) * 6) : 0), 0);
      const ln = $('#lineas'); ln.style.opacity = Math.max(imp * .85, kO * .6, kI * .6, s.lineas || 0); ln.style.transform = `rotate(${(t * 211) % 7}deg) scale(${1.1 + imp * .2})`;
      const on = $('#onda'); const og = (O.impactos || []).filter(g => t >= g && t < g + .7).pop(); if (og !== undefined) { const q = (t - og) / .7; on.style.opacity = (1 - q) * .9; on.style.transform = `translate(-50%,-50%) scale(${.2 + easeOut(q) * 3.2})`; } else on.style.opacity = 0;
      // texto
      const hook = V.frases[0], cta = V.frases.find(f => f.cta), hEnd = B.hookHasta ?? (hook.fin + .3);
      const hk = $('#hook'); const ko = win(t, hEnd, hEnd + .3); hk.style.opacity = 1 - ko; hk.style.transform = `translateY(${-50 * easeOut(ko)}px)`;
      subs($('#sub'), V.frases, t, {maxChars: B.maxChars || 17}); if (cta && t > cta.t - .1) $('#sub').innerHTML = '';
      const hab = V.frases.filter(f => f.q !== 'nar'); const fh = hab.find(f => t >= f.t - .15 && t <= f.fin + .5);
      globo($('#globo'), s.boca ? fh : null, t, fh && s.boca ? s.boca(fh) : [540, 700], {});
      const it = V.frases.filter(f => f.item).find(f => t >= f.t - .08 && t < f.fin + .12); const nm = $('#num');
      if (it) { const kk = win(t, it.t - .08, it.t + .25); nm.textContent = it.item; nm.style.opacity = 1; nm.style.transform = `scale(${.6 + .4 * backOut(kk, 2.2)})`; } else nm.style.opacity = 0;
      const cc = $('#cta'), velo = $('#velo');
      if (cta && t >= cta.t - .3) { const kk = win(t, cta.t - .3, cta.t + .35); const lk = win(t, V.total - .45, V.total - .1); cc.style.opacity = easeOut(kk) * (1 - lk); velo.style.opacity = .93 * easeOut(kk) * (1 - lk);
        cc.style.transform = `translateY(${(1 - expoOut(kk)) * 40}px)`; const kw = cc.querySelector('.kw'); const w1 = cta.words[1] ? cta.words[1].t : cta.t + .6; const k2 = win(t, w1 - .05, w1 + .3); kw.style.transform = `scale(${.7 + .3 * backOut(k2, 2.5)})`; kw.style.opacity = k2 > 0 ? 1 : 0; const gl = ((t - w1) % 1.6) / 1.6; kw.style.backgroundImage = `linear-gradient(110deg, transparent ${gl * 160 - 40}%, rgba(255,255,255,.75) ${gl * 160 - 25}%, transparent ${gl * 160 - 10}%)`; const ps = 1 + .035 * Math.max(0, Math.sin((t - w1) * 5.2)); kw.style.transform = `scale(${(.7 + .3 * backOut(k2, 2.5)) * ps})`; }
      else { cc.style.opacity = 0; velo.style.opacity = 0; }
      const mk = $('#marca'); mk.style.opacity = cta && t >= cta.t - .3 ? 0 : .95;
      $('#nota').innerHTML = (B.notas || []).filter(x => t >= (x.desde ?? 0) && t < (x.hasta ?? 1e9)).map(x => x.txt).join('<br>'); $('#nota').style.display = $('#nota').innerHTML ? '' : 'none';
      $('#flash').style.opacity = O.flash ? O.flash(t) : 0;
      grain(t);
    }};
  return O;
}
