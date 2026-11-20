// node cuadros.js <id> <salida> <t1,t2,...> [dsf] [extra-query]  → capturas sueltas para revisar
const {chromium} = require('playwright'); const fs = require('fs');
(async () => { const [id, out, list, dsf = '1', extra = ''] = process.argv.slice(2); fs.mkdirSync(out, {recursive: true});
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: +dsf});
  p.on('console', m => { if (!/GPU stall|GL Driver/.test(m.text())) console.log('PAGE', m.text()); }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:8799/reel.html?r=${id}${extra}`); await p.waitForFunction('window.ready', null, {timeout: 120000});
  for (const t of list.split(',').map(Number)) { const t0 = Date.now(); const S = await p.evaluate(t => window.render(t), t);
    await p.screenshot({path: `${out}/${id}-${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 90}); console.log(t, 'sub', S, Date.now() - t0, 'ms'); }
  await b.close(); })();
