// node render_t.js <id> <dir> <fps> <N> <K> → cuadros 1080×1920 (fragmento K de N)
const {chromium} = require('playwright'); const fs = require('fs');
(async () => { const [id, out, fps, N, K] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CONSOLA', m.text()));
  await p.goto(`http://127.0.0.1:${process.env.PUERTO || 8801}/tanda/serie.html?id=${id}`); await p.waitForFunction('window.ready', null, {timeout: 120000});
  const T = await p.evaluate('window.TOTAL'); const n = Math.round(T * fps);
  for (let i = +K; i < n; i += +N) { await p.evaluate(t => window.render(t), i / fps); await p.screenshot({path: `${out}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 93}); }
  await b.close(); })();
