// Motor de mini historias 2.5D (SVG + DOM): escenario 1080×1920, cámara con parallax por capas, profundidad de campo por capa,
// luz de ambiente, grano, viñeta, subtítulos de narración, globos de diálogo y cierre. Todo es función del tiempo t.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const win = (t, a, b) => clamp((t - a) / (b - a));
export const ease = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3);
export const easeIn = k => Math.pow(clamp(k), 3);
export const backOut = (k, s = 1.7) => { k = clamp(k) - 1; return k * k * ((s + 1) * k + s) + 1; };
export const expoOut = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k));
export const wob = (t, s = 0) => Math.sin(t * 1.3 + s) * .5 + Math.sin(t * 2.1 + s * 1.7) * .3 + Math.sin(t * 3.7 + s * 2.3) * .2;
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export const NS = 'http://www.w3.org/2000/svg';
let uid = 0; export const id = p => `${p}${++uid}`;

// Una escena es un conjunto de capas SVG (lejos → cerca). Cada capa tiene un factor de parallax y una profundidad para el foco.
export function escena(stage, {nombre, capas, fondo = '#000'}) {
  const el = document.createElement('div'); el.className = 'esc'; el.dataset.n = nombre; el.style.background = fondo; stage.appendChild(el);
  const L = capas.map(c => { const d = document.createElement('div'); d.className = 'capa'; d.innerHTML = `<svg xmlns="${NS}" width="${c.w || 1080}" height="${c.h || 1920}" viewBox="0 0 ${c.w || 1080} ${c.h || 1920}" overflow="visible">${c.svg}</svg>`;
    d.style.width = `${c.w || 1080}px`; d.style.height = `${c.h || 1920}px`; el.appendChild(d); return Object.assign(c, {d, svg: d.firstChild}); });
  const luz = document.createElement('div'); luz.className = 'luz'; el.appendChild(luz);
  return {el, capas: L, luz,
    // cámara: x,y = centro mirado en coordenadas de la capa de acción (f=1); z = zoom; r = giro (grados); foco = profundidad enfocada
    cam({x = 540, y = 960, z = 1, r = 0, foco = 1, ap = 6, X, Y}) {
      const A = L.find(c => (c.f ?? 1) === 1) || L[L.length - 1]; if (X !== undefined) x = X - ((A.w || 1080) / 2 - 540); if (Y !== undefined) y = Y - ((A.h || 1920) / 2 - 960);
      for (const c of L) { const f = c.f ?? 1; const s = 1 + (z - 1) * f; const cx = (c.w || 1080) / 2 + (x - 540) * f, cy = (c.h || 1920) / 2 + (y - 960) * f;
        c.d.style.transform = `translate(540px,960px) rotate(${r * f}deg) scale(${s}) translate(${-cx}px,${-cy}px)`;
        const b = Math.abs((c.prof ?? f) - foco) * ap; c.d.style.filter = b > .25 ? `blur(${b.toFixed(2)}px)` : 'none'; }
    },
    // posición en pantalla de un punto de una capa (para globos de diálogo)
    aPantalla(capa, px, py) { const r = capa.d.getBoundingClientRect(); const s = r.width / (capa.w || 1080); return [r.left + px * s, r.top + py * s]; },
  };
}

export function grano(stage) { // grano fílmico: textura de ruido que cambia por cuadro, más viñeta
  const c = document.createElement('canvas'); c.width = 540; c.height = 960; c.id = 'grano'; stage.appendChild(c);
  const x = c.getContext('2d'); const im = x.createImageData(540, 960);
  const v = document.createElement('div'); v.id = 'vin'; stage.appendChild(v);
  return t => { let s = Math.floor(t * 30) * 7919; for (let i = 0; i < im.data.length; i += 4) { s = (s * 1103515245 + 12345) & 0x7fffffff; const n = (s >> 8) & 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = n; im.data[i + 3] = 255; } x.putImageData(im, 0, 0); };
}

// Subtítulos de narración palabra por palabra (bloques de hasta 3 palabras)
export function subs(el, frases, t, {max = 3, maxChars = 17} = {}) {
  let html = '';
  for (const f of frases) {
    if (f.cta || f.q !== 'nar') continue; const groups = []; let cur = [];
    for (const w of f.words) { const len = cur.map(x => x.w).join(' ').length + w.w.length; if (cur.length >= max || (cur.length && len > maxChars)) { groups.push(cur); cur = []; } cur.push(w); }
    if (cur.length) groups.push(cur);
    groups.forEach((g, gi) => { const a = g[0].t - .05, b = gi + 1 < groups.length ? groups[gi + 1][0].t - .05 : f.fin + .3;
      if (t >= a && t < b) html = g.map(w => { const k = clamp((t - w.t + .02) / .14); return `<span class="w${w.h ? ' h' : ''}" style="opacity:${k > 0 ? 1 : 0};transform:translateY(${(1 - easeOut(k)) * 16}px) scale(${.84 + .16 * backOut(k)})">${w.w}</span>`; }).join(' '); });
  }
  el.innerHTML = html;
}
// Globo de diálogo del personaje: aparece con la frase, revela palabras y se va
export function globo(el, f, t, [x, y], {lado = 1} = {}) {
  if (!f || t < f.t - .15 || t > f.fin + .5) { el.style.opacity = 0; return; }
  const k = win(t, f.t - .15, f.t + .15), o = 1 - win(t, f.fin + .25, f.fin + .5);
  el.innerHTML = f.words.map(w => `<span style="opacity:${t >= w.t - .04 ? 1 : .0}">${w.w}</span>`).join(' ') + '<i></i>';
  el.style.opacity = o; const W = el.offsetWidth, H = el.offsetHeight;
  const bx = clamp(x - (lado > 0 ? 120 : W - 120), 70, 1080 - 150 - W), by = clamp(y - H - 70, 345, 1500);
  el.style.left = `${bx}px`; el.style.top = `${by}px`; el.style.transform = `scale(${.6 + .4 * backOut(k, 2)})`; el.style.transformOrigin = `${clamp(x - bx, 40, W - 40)}px ${H + 30}px`;
  const tail = el.querySelector('i'); tail.style.left = `${clamp(x - bx - 18, 30, W - 70)}px`;
}
export const boca = (f, t) => { if (!f || !f.boca || !f.boca.length || t < f.t || t > f.fin) return 0; const i = Math.floor((t - f.t) * 60); return f.boca[Math.min(f.boca.length - 1, i)] || 0; };
