// Sirve la carpeta del motor a la página de Playwright sin abrir un servidor: intercepta http://127.0.0.1:8799/* y responde desde el disco.
const fs = require('fs'), path = require('path');
const RAIZ = __dirname, TIPOS = {'.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf', '.css': 'text/css', '.wav': 'audio/wav', '.glb': 'model/gltf-binary'};
module.exports = async function servir(p) {
  await p.route('http://127.0.0.1:8799/**', r => { const u = new URL(r.request().url()); const f = path.join(RAIZ, decodeURIComponent(u.pathname));
    if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({status: 404, body: ''});
    r.fulfill({status: 200, body: fs.readFileSync(f), headers: {'content-type': TIPOS[path.extname(f).toLowerCase()] || 'application/octet-stream'}}); });
};
