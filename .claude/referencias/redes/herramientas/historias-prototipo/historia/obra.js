// Arma una mini historia: tomas (escena + cámara + acción), capa de texto (gancho, narración, globos, número, cierre), grano y viñeta.
import {escena, grano, subs, globo, win, easeOut, backOut, expoOut, clamp} from './base.js';
export function obra(V, B) {
  const stage = document.getElementById('stage'); const ui = document.getElementById('ui');
  ui.innerHTML = `<div id="hook">${B.hookHTML}</div><div id="num"></div><div id="sub"></div><div id="globo" class="globo"></div>
    <div id="velo"></div><div id="cta"><img src="${B.logo}"><div class="c1">Comentá</div><div class="kw">${V.palabra}</div><div class="c2">${B.ctaSub}</div></div><div id="nota"></div><div id="flash"></div>`;
  const $ = s => ui.querySelector(s); const grain = grano(document.getElementById('fx'));
  const O = {stage, escenas: {}, tomas: [], V, B,
    esc(def) { const e = escena(stage, def); O.escenas[def.nombre] = e; e.el.style.display = 'none'; return e; },
    frase: q => V.frases.find(f => f.marca === q),
    render(t) {
      const S = O.tomas; let i = S.length - 1; while (i > 0 && S[i].t0 > t) i--; const s = S[i]; const t1 = S[i + 1] ? S[i + 1].t0 : V.total;
      const k = clamp((t - s.t0) / (t1 - s.t0));
      for (const e of Object.values(O.escenas)) e.el.style.display = e === s.esc ? 'block' : 'none';
      const c = s.cam(k, t); s.esc.cam(c); s.act && s.act(t, k);
      // texto
      const hook = V.frases[0], cta = V.frases.find(f => f.cta), hEnd = B.hookHasta ?? (hook.fin + .3);
      const hk = $('#hook'); const ko = win(t, hEnd, hEnd + .3); hk.style.opacity = 1 - ko; hk.style.transform = `translateY(${-50 * easeOut(ko)}px)`;
      subs($('#sub'), V.frases, t, {maxChars: B.maxChars || 17}); if (cta && t > cta.t - .1) $('#sub').innerHTML = '';
      const hab = V.frases.filter(f => f.q !== 'nar'); const fh = hab.find(f => t >= f.t - .15 && t <= f.fin + .5);
      globo($('#globo'), s.boca ? fh : null, t, fh && s.boca ? s.boca(fh) : [540, 700], {});
      const it = V.frases.filter(f => f.item).find(f => t >= f.t - .08 && t < f.fin + .4); const nm = $('#num');
      if (it) { const kk = win(t, it.t - .08, it.t + .25); nm.textContent = it.item; nm.style.opacity = 1; nm.style.transform = `scale(${.6 + .4 * backOut(kk, 2.2)})`; } else nm.style.opacity = 0;
      const cc = $('#cta'), velo = $('#velo');
      if (cta && t >= cta.t - .3) { const kk = win(t, cta.t - .3, cta.t + .35); const lk = win(t, V.total - .45, V.total - .1); cc.style.opacity = easeOut(kk) * (1 - lk); velo.style.opacity = .93 * easeOut(kk) * (1 - lk);
        cc.style.transform = `translateY(${(1 - expoOut(kk)) * 40}px)`; const kw = cc.querySelector('.kw'); const w1 = cta.words[1] ? cta.words[1].t : cta.t + .6; const k2 = win(t, w1 - .05, w1 + .3); kw.style.transform = `scale(${.7 + .3 * backOut(k2, 2.5)})`; kw.style.opacity = k2 > 0 ? 1 : 0; }
      else { cc.style.opacity = 0; velo.style.opacity = 0; }
      $('#nota').innerHTML = (B.notas || []).filter(x => t >= (x.desde ?? 0) && t < (x.hasta ?? 1e9)).map(x => x.txt).join('<br>');
      $('#flash').style.opacity = O.flash ? O.flash(t) : 0;
      grain(t);
    }};
  return O;
}
