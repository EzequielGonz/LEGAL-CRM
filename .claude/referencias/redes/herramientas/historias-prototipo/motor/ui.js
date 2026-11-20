// Capa tipográfica en el DOM (nítida a cualquier resolución): gancho, subtítulos palabra por palabra,
// número grande de la lista, cierre con palabra clave y notas. Todo determinista por tiempo.
import {clamp, easeOut, backOut, expoOut, win, subtitulos} from './motor3d.js';

export function crearUI(V, B) {
  const root = document.getElementById('ui');
  root.innerHTML = `<div id="hook"></div><div id="num"></div><div id="sub"></div>
    <div id="cta"><img id="ctalogo" src="${B.logo}"><div class="c1">Comentá</div><div class="kw">${V.palabra}</div><div class="c2">${B.ctaSub}</div></div>
    <div id="nota"></div>`;
  const $ = s => root.querySelector(s);
  const hook = V.frases.find(f => f.hook); const cta = V.frases.find(f => f.cta);
  const items = V.frases.filter(f => f.item);
  $('#hook').innerHTML = B.hookHTML;
  return {
    update(t) {
      // gancho: legible desde el cuadro 0; sale con un empuje hacia arriba cuando termina la pregunta
      const hk = $('#hook'); const hEnd = (B.hookHasta ?? (hook.fin + .25));
      const ko = win(t, hEnd, hEnd + .35); hk.style.opacity = 1 - ko; hk.style.transform = `translateY(${-60 * easeOut(ko)}px) scale(${1 + .04 * Math.min(1, t / hEnd)})`;
      // subtítulos (no durante el gancho ni el cierre)
      const sub = $('#sub'); if (t < hEnd || (cta && t >= cta.t - .05)) sub.innerHTML = ''; else subtitulos(sub, V.frases.filter(f => !f.hook), t, {max: 3, maxChars: B.maxChars || 17});
      // número grande de la lista
      const nm = $('#num'); let it = null; for (const f of items) if (t >= f.t - .08 && t < (f.fin + .45)) it = f;
      if (it) { const k = win(t, it.t - .08, it.t + .25); nm.textContent = it.item; nm.style.opacity = 1; nm.style.transform = `scale(${.6 + .4 * backOut(k, 2.2)})`; nm.style.filter = `blur(${(1 - easeOut(k)) * 8}px)`; }
      else nm.style.opacity = 0;
      // cierre
      const c = $('#cta'); if (cta && t >= cta.t - .25) { const k = win(t, cta.t - .25, cta.t + .35); c.style.opacity = easeOut(k); c.style.transform = `translateY(${(1 - expoOut(k)) * 40}px)`;
        const kw = c.querySelector('.kw'); const kk = win(t, cta.words[1] ? cta.words[1].t - .05 : cta.t + .6, (cta.words[1] ? cta.words[1].t : cta.t + .6) + .3); kw.style.transform = `scale(${.7 + .3 * backOut(kk, 2.5)})`; kw.style.opacity = kk > 0 ? 1 : 0;
        const lk = win(t, V.total - .45, V.total - .05); c.style.opacity = easeOut(k) * (1 - lk);
      } else c.style.opacity = 0;
      // notas (aviso legal, situación ilustrativa, voz con IA)
      const n = $('#nota'); n.innerHTML = (B.notas || []).filter(x => t >= (x.desde ?? 0) && t < (x.hasta ?? 1e9)).map(x => x.txt).join('<br>');
    }
  };
}
