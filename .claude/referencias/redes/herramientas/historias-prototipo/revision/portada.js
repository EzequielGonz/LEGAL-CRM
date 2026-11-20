// node revision/portada.js <id> <t> <salida.jpg> → portada 1080×1920 con la interfaz (gancho, marca) visible
const {chromium} = require('playwright');
(async () => { const [id, t, out] = process.argv.slice(2); const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1080, height: 1920}, deviceScaleFactor: 1});
  await p.goto(`http://127.0.0.1:8799/historia.html?r=${id}`); await p.waitForFunction('window.ready', null, {timeout: 60000});
  await p.evaluate(t => window.render(t), +t); await p.screenshot({path: out, type: 'jpeg', quality: 92}); await b.close(); })();
