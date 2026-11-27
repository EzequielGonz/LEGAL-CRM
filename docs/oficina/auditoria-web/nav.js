// Ayudante de la auditoría web. SOLO LECTURA: corta todo pedido que no sea GET
// y los GET a rutas con efecto (cron, envíos, webhooks). No tocar este archivo.
const { chromium, devices } = require('playwright');
const path = require('path');
const B = 'https://legal-crm-nine.vercel.app';
const PELIGRO = /\/api\/(cron|auto-|webhook|outreach|latido|disparo|send|enviar|meta\/sync|wasender\/(send|sync))/i;
// Con abrir({escribir:true}) se permiten acciones, MENOS: campañas, mensajes a personas reales, envíos a Meta, extracciones, webhooks y borrados.
const VEDADO = /\/api\/(campaigns|conversations\/[^/]+\/messages|recontacto|marketing\/(auto-outreach|extraer)|plantillas\/(enviar-a-meta|sincronizar)|wasender|webhooks|inbox\/[^/]+\/(send|reply)|agent\/|agents\/run|appointments|agenda|marketing\/presupuestos|seguimiento|landing|lineas\/numero)/i;
async function abrir(opts = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const base = opts.telefono ? { ...devices['iPhone 13'] } : { viewport: { width: opts.ancho || 1440, height: opts.alto || 900 } };
  const ctx = await browser.newContext({ ...base, colorScheme: opts.claro ? 'light' : 'dark', storageState: opts.sinSesion ? undefined : path.join(__dirname, 'sesion.json') });
  const reg = { escritos: [], cortados: [], erroresJs: [], consola: [], fallidos: [], lentos: [], http: [] };
  await ctx.route('**/*', (r) => {
    const q = r.request(); const u = q.url();
    if (!u.startsWith(B)) return r.continue();
    const m = q.method(); const libre = opts.escribir && m !== 'DELETE' && !VEDADO.test(u) && !q.headers()['next-action'];
    if ((m !== 'GET' && !libre) || PELIGRO.test(u)) { reg.cortados.push(q.method() + ' ' + u.replace(B, '')); return r.abort(); }
    if (q.method() !== 'GET') reg.escritos.push(q.method() + ' ' + u.replace(B, ''));
    return r.continue();
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => reg.erroresJs.push(String(e.message).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') reg.consola.push(m.text().slice(0, 300)); });
  page.on('requestfailed', (q) => { const u = q.url(); if (u.startsWith(B) && q.method() === 'GET') reg.fallidos.push(u.replace(B, '') + ' ' + (q.failure()?.errorText || '')); });
  page.on('response', (res) => { const u = res.url(); if (u.startsWith(B) && res.status() >= 400) reg.http.push(res.status() + ' ' + u.replace(B, '')); });
  // ir(): navega y devuelve tiempos; avisa si la sesión venció.
  async function ir(ruta, espera = 2500) {
    const t0 = Date.now();
    const resp = await page.goto(B + ruta, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => ({ err: String(e).slice(0, 200) }));
    const tDom = Date.now() - t0;
    await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(espera);
    const total = Date.now() - t0;
    const fin = page.url().replace(B, '');
    if (total > 4000) reg.lentos.push(ruta + ' ' + total + 'ms');
    return { ruta, fin, estado: resp?.status?.() ?? null, err: resp?.err, tDom, total, sesionVencida: fin.startsWith('/login') && !ruta.startsWith('/login') };
  }
  const texto = () => page.evaluate(() => document.body.innerText);
  const foto = (nombre, completa = true) => page.screenshot({ path: path.join(__dirname, 'shots', nombre + '.png'), fullPage: completa });
  // perfil(): cambia el rubro activo sin tocar el servidor. slugs: juridico, coberturas_medicas, agencia_0km, marketing
  const perfil = (slug) => ctx.addCookies([{ name: 'perfil_activo', value: slug, domain: 'legal-crm-nine.vercel.app', path: '/', httpOnly: true, secure: true, sameSite: 'Lax' }]);
  return { browser, ctx, page, reg, ir, texto, foto, perfil, B };
}
module.exports = { abrir, B };
