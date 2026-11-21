// node render_h.js <id> <dir> <fps> <dsf> <N> <K>  → cuadros de la mini historia (shard K de N)
const {chromium} = require('playwright'); const fs = require('fs');
(async () => { const [id, out, fps, dsf, N, K] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: +dsf});
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${process.env.PORT || 8799}/historia.html?r=${id}`); await p.waitForFunction('window.ready', null, {timeout: 120000});
  const T = await p.evaluate('window.TOTAL'); const n = Math.round(T * fps); const t0 = Date.now(); let c = 0;
  for (let i = +K; i < n; i += +N) { const f = `${out}/${String(i).padStart(5, '0')}.jpg`; if (fs.existsSync(f)) continue;
    await p.evaluate(t => window.render(t), i / fps); await p.screenshot({path: f, type: 'jpeg', quality: 95}); c++;
    if (c % 100 === 0) console.log(K, c, Math.round((Date.now() - t0) / c), 'ms/cuadro'); }
  await b.close(); })();
