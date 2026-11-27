// Renderiza un cuadro de prueba de prueba3d.html sin servidor: Playwright entrega los archivos del disco.
// Uso: node prueba3d.js <personaje> <rotacion> <anim> <aditiva|""> <t> <salida.jpg>
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const MIME = {'.html': 'text/html', '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.hdr': 'application/octet-stream', '.jpg': 'image/jpeg', '.png': 'image/png', '.ttf': 'font/ttf'};
(async () => {
  const [pj, rot, anim, add, t, out] = process.argv.slice(2);
  const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']});
  const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('console', m => console.log('C:', m.text())); p.on('pageerror', e => console.log('E:', e.message));
  await p.route('http://motor.local/**', r => {
    const f = path.join(__dirname, decodeURIComponent(new URL(r.request().url()).pathname));
    if (!fs.existsSync(f)) return r.fulfill({status: 404, body: ''});
    r.fulfill({status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream'});
  });
  await p.addInitScript(([pj, rot, anim, add]) => { window.PJ = pj; window.ROT = +rot; window.ANIM = anim; window.ADD = add || null; }, [pj, rot, anim, add]);
  await p.goto('http://motor.local/prueba3d.html');
  await p.waitForFunction(() => window.listo, null, {timeout: 180000});
  console.log('clips', await p.evaluate(() => window.CLIPS.join(',')));
  await p.evaluate(t => window.frame(t), +t); await p.waitForTimeout(300);
  await p.screenshot({path: out, type: 'jpeg', quality: 90}); await b.close();
})();
