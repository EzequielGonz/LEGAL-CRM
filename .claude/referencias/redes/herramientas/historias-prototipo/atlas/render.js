// Render de los reels Atlas sin servidor: Playwright entrega los archivos del disco.
// node render.js <id> [fps=30] [workers=3] [desde=0] [hasta=fin] [cada=1]   → fr/<id>/%05d.jpg
// node render.js <id> prueba 2.5 8.0 14.0 ...  → cuadros sueltos en prueba/<id>-<t>.jpg
const {chromium} = require('playwright'); const fs = require('fs'), path = require('path');
const RAIZ = path.resolve(__dirname, '..');
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.hdr': 'application/octet-stream', '.glb': 'model/gltf-binary', '.wav': 'audio/wav', '.mp3': 'audio/mpeg'};
async function pagina(id) {
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('console', m => { if (m.type() === 'error' || m.text().startsWith('LOG')) console.log('C:', m.text()); }); p.on('pageerror', e => console.log('E:', e.message));
  await p.route('http://motor.local/**', r => { const f = path.join(RAIZ, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({status: 404, body: ''});
    r.fulfill({status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream'}); });
  await p.goto(`http://motor.local/atlas/reel.html?m=${id}${process.env.RAPIDO ? '&rapido=1' : ''}${process.env.ESCALA ? '&escala=' + process.env.ESCALA : ''}`);
  await p.waitForFunction(() => window.listo || window.falla, null, {timeout: 300000});
  const falla = await p.evaluate(() => window.falla); if (falla) { console.log('FALLA', falla); process.exit(1); }
  return {b, p};
}
(async () => {
  const [id, a1, ...resto] = process.argv.slice(2);
  if (a1 === 'prueba') {
    const {b, p} = await pagina(id); fs.mkdirSync(path.join(__dirname, 'prueba'), {recursive: true});
    for (const t of resto) { const t0 = Date.now(); await p.evaluate(t => window.frame(t), +t);
      const f = path.join(__dirname, 'prueba', `${id}-${(+t).toFixed(2)}.jpg`); await p.screenshot({path: f, type: 'jpeg', quality: 88}); console.log(f, Date.now() - t0, 'ms'); }
    const ev = await p.evaluate(() => [window.TOTAL, window.EVENTOS]); fs.writeFileSync(path.join(__dirname, 'audio', `${id}-eventos.json`), JSON.stringify({total: ev[0], eventos: ev[1]}));
    await b.close(); return;
  }
  const fps = +(a1 || 30), N = +(resto[0] || 3);
  const out = path.join(__dirname, 'fr', id); fs.mkdirSync(out, {recursive: true});
  await Promise.all([...Array(N).keys()].map(async K => {
    const {b, p} = await pagina(id);
    if (K === 0) { const ev = await p.evaluate(() => [window.TOTAL, window.EVENTOS]); fs.writeFileSync(path.join(__dirname, 'audio', `${id}-eventos.json`), JSON.stringify({total: ev[0], eventos: ev[1]})); }
    const T = await p.evaluate(() => window.TOTAL); const n = Math.round(T * fps); const t0 = Date.now(); let c = 0;
    for (let i = K; i < n; i += N) { const f = path.join(out, String(i).padStart(5, '0') + '.jpg'); if (fs.existsSync(f)) continue;
      await p.evaluate(t => window.frame(t), i / fps); await p.screenshot({path: f, type: 'jpeg', quality: 92}); c++;
      if (c % 60 === 0) console.log(id, 'w' + K, i, '/', n, Math.round((Date.now() - t0) / c), 'ms/cuadro'); }
    await b.close();
  }));
  console.log(id, 'listo');
})();
