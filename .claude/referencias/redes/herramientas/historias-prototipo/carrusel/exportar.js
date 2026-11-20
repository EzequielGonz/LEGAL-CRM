// node exportar.js <url> <salida> <dsf> → un PNG por cada .ab (lámina) con su id
const {chromium} = require('playwright'); const fs = require('fs');
(async () => {
  const [u, out, dsf] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1200, height: 2000}, deviceScaleFactor: +dsf});
  await p.goto(u); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const el of await p.$$('.ab')) { const id = await el.getAttribute('id'); await el.screenshot({path: `${out}/${id}.png`}); console.log(id); }
  await b.close();
})();
