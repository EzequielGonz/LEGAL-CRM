// Exporta y revisa piezas de redes diseñadas en HTML.
// Uso: node revisar-piezas.mjs <pagina.html|http://...> <carpeta-salida> [escala=2]
//
// Cada pieza es un elemento `.ab` con id, ancho y alto fijos en px y `data-formato`
// = reel | historia | carrusel | post. Exporta cada pieza a PNG (escala 2 = 4K).
// Las piezas con `.slot` (recuadros de preparación) salen dos veces: `<id>-guia.png`
// con los recuadros y `<id>.png` limpia (se agrega la clase `clean`, que debe ocultar `.slot`).
// Revisa: texto desbordado o cortado, textos que se pisan entre sí o con imágenes,
// elementos fuera de la pieza y textos fuera de la zona segura del formato.
// Además arma `telefono.png`: todas las piezas a ~390 px de ancho, para mirarlas a tamaño de celular.
// Elementos decorativos que pueden salir del borde: atributo `data-sangrado`.
// Elementos que pueden superponerse a propósito: atributo `data-encima`.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Playwright se resuelve como en CommonJS (respeta NODE_PATH y la instalación global del entorno).
const { chromium } = createRequire(import.meta.url)('playwright');

const [entrada, salida, escalaTxt = '2'] = process.argv.slice(2);
if (!entrada || !salida) { console.error('Uso: node revisar-piezas.mjs <pagina.html|url> <carpeta-salida> [escala]'); process.exit(1); }
const url = /^https?:/.test(entrada) ? entrada : pathToFileURL(resolve(entrada)).href;
const escala = Number(escalaTxt);
mkdirSync(salida, { recursive: true });

// Márgenes libres por formato (px a 1080 de ancho): arriba, derecha, abajo, izquierda.
const ZONAS = { reel: [220, 140, 420, 60], historia: [250, 60, 300, 60], carrusel: [60, 34, 60, 34], post: [60, 34, 60, 34] };

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1300, height: 2100 }, deviceScaleFactor: escala });
await pagina.goto(url, { waitUntil: 'networkidle' });
await pagina.evaluate(() => document.fonts.ready);
await pagina.waitForTimeout(400);

const ids = await pagina.$$eval('.ab', (els) => els.map((e) => e.id).filter(Boolean));
const informe = [];
for (const id of ids) {
  const el = await pagina.$('#' + id);
  const tieneGuia = await el.evaluate((e) => !!e.querySelector('.slot'));
  await el.screenshot({ path: `${salida}/${tieneGuia ? id + '-guia' : id}.png` });
  if (tieneGuia) {
    await el.evaluate((e) => e.classList.add('clean'));
    await el.screenshot({ path: `${salida}/${id}.png` });
  }
  const avisos = await el.evaluate((ab, ZONAS) => {
    const r0 = ab.getBoundingClientRect();
    const fmt = ab.dataset.formato;
    const z = ZONAS[fmt];
    const out = [];
    const nombre = (e) => (e.id ? '#' + e.id : e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase()) + ` «${(e.textContent || '').trim().slice(0, 28)}»`;
    const visible = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05 && !e.closest('.slot'); };
    const textos = [...ab.querySelectorAll('*')].filter((e) => visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
    const cajas = textos.map((e) => { const rg = document.createRange(); rg.selectNodeContents(e); const r = rg.getBoundingClientRect(); return { e, r }; });
    for (const { e, r } of cajas) {
      if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') out.push(`Texto cortado: ${nombre(e)}`);
      if (r.left < r0.left - 1 || r.right > r0.right + 1 || r.top < r0.top - 1 || r.bottom > r0.bottom + 1) out.push(`Texto fuera de la pieza: ${nombre(e)}`);
      else if (z && !e.closest('[data-sangrado]')) {
        const [zt, zr, zb, zl] = z;
        if (r.top < r0.top + zt || r.bottom > r0.bottom - zb || r.left < r0.left + zl || r.right > r0.right - zr) out.push(`Texto fuera de la zona segura (${fmt}): ${nombre(e)}`);
      }
    }
    const imgs = [...ab.querySelectorAll('img,svg')].filter((e) => visible(e) && !e.closest('[data-encima]') && !e.parentElement.closest('svg')).map((e) => ({ e, r: e.getBoundingClientRect() }));
    const pisa = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
    for (let i = 0; i < cajas.length; i++) {
      for (let j = i + 1; j < cajas.length; j++) {
        const a = cajas[i], b = cajas[j];
        if (a.e.contains(b.e) || b.e.contains(a.e) || a.e.closest('[data-encima]') || b.e.closest('[data-encima]')) continue;
        // Títulos con interlineado ajustado: las cajas de línea se tocan sin que se toquen las letras.
        // Cuenta como choque si se superponen más del 30 % de la altura menor o están en la misma línea.
        const dy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        if (pisa(a.r, b.r) && dy > 0.3 * Math.min(a.r.height, b.r.height)) out.push(`Textos que se pisan: ${nombre(a.e)} y ${nombre(b.e)}`);
      }
      for (const im of imgs) if (!im.e.contains(cajas[i].e) && !cajas[i].e.contains(im.e) && pisa(cajas[i].r, im.r)) out.push(`Texto sobre imagen: ${nombre(cajas[i].e)} y ${nombre(im.e)}`);
    }
    for (const e of ab.querySelectorAll('*')) {
      if (!visible(e) || e.closest('[data-sangrado]') || e.closest('svg') && e.tagName !== 'svg') continue;
      const r = e.getBoundingClientRect();
      if (r.width && (r.left < r0.left - 1 || r.right > r0.right + 1 || r.top < r0.top - 1 || r.bottom > r0.bottom + 1) && !textos.includes(e)) out.push(`Elemento fuera de la pieza: ${nombre(e)}`);
    }
    for (const img of ab.querySelectorAll('img')) {
      if (!img.naturalWidth) { out.push(`Imagen sin cargar: ${img.getAttribute('src')}`); continue; }
      const r = img.getBoundingClientRect();
      const fit = getComputedStyle(img).objectFit;
      const d = Math.abs(r.width / r.height - img.naturalWidth / img.naturalHeight);
      if (d > 0.02 && fit !== 'contain' && fit !== 'cover') out.push(`Logo o imagen deformada: ${img.getAttribute('src')}`);
    }
    return [...new Set(out)];
  }, ZONAS);
  informe.push({ id, avisos });
  console.log(`${id}: ${avisos.length ? avisos.length + ' aviso(s)' : 'sin avisos'}`);
  for (const a of avisos) console.log('   - ' + a);
}

// Hoja a tamaño de teléfono (≈390 px de ancho por pieza).
// Se escribe como archivo para que el navegador pueda leer las imágenes locales.
const columnas = Math.min(ids.length, 3);
writeFileSync(`${salida}/telefono.html`, `<!doctype html><body style="margin:0;background:#888;display:flex;flex-wrap:wrap;gap:16px;padding:16px;width:${columnas * 406 - 16}px">${ids.map((id) => `<img src="${id}.png" style="width:390px">`).join('')}</body>`);
const hoja = await navegador.newPage({ viewport: { width: columnas * 406 + 16, height: 900 }, deviceScaleFactor: 1 });
await hoja.goto(pathToFileURL(resolve(salida, 'telefono.html')).href, { waitUntil: 'load' });
await hoja.screenshot({ path: `${salida}/telefono.png`, fullPage: true });
writeFileSync(`${salida}/informe.json`, JSON.stringify(informe, null, 2));
await navegador.close();
