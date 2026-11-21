// Exporta cada `.ab` de una página a JPG (1080 de ancho) y revisa desbordes.
// Uso: node exportar.mjs <pagina.html> <carpeta-salida> [calidad=90]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const [entrada, salida, calidadTxt = '90'] = process.argv.slice(2);
mkdirSync(salida, { recursive: true });
const nav = await chromium.launch();
const pag = await nav.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
await pag.goto(pathToFileURL(resolve(entrada)).href, { waitUntil: 'networkidle' });
await pag.evaluate(() => document.fonts.ready);
const ids = await pag.$$eval('.ab', (els) => els.map((e) => e.id));
const avisos = await pag.$$eval('.ab', (els) => {
  const out = [];
  for (const ab of els) {
    const caja = ab.getBoundingClientRect();
    const main = ab.querySelector('.main');
    if (main && main.scrollHeight > main.clientHeight + 2) out.push(`${ab.id}: el contenido desborda (${main.scrollHeight} > ${main.clientHeight})`);
    for (const el of ab.querySelectorAll('.main *')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0) continue;
      if (r.right > caja.right - 40 || r.left < caja.left + 40) { out.push(`${ab.id}: ${el.className || el.tagName} fuera del margen lateral`); break; }
    }
    const marca = ab.querySelector('.marca').getBoundingClientRect();
    if (main) {
      const first = main.firstElementChild?.getBoundingClientRect();
      if (first && first.top < marca.bottom + 10) out.push(`${ab.id}: el contenido toca el logo`);
      const fmt = ab.dataset.formato;
      const lim = fmt === 'historia' ? 1920 - 300 : 1350 - 40;
      const last = main.lastElementChild?.getBoundingClientRect();
      if (last && last.bottom - caja.top > lim) out.push(`${ab.id}: contenido dentro de la zona de abajo (${Math.round(last.bottom - caja.top)})`);
    }
  }
  return out;
});
for (const id of ids) {
  await pag.locator(`#${id}`).screenshot({ path: `${salida}/${id}.jpg`, type: 'jpeg', quality: Number(calidadTxt) });
}
await nav.close();
console.log(`${ids.length} piezas exportadas a ${salida}`);
if (avisos.length) console.log('AVISOS:\n' + avisos.join('\n'));
