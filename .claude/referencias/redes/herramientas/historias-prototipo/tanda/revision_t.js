// node revision_t.js <id> <dir> → cuadros cada 0,5 s (t_XX.XX.jpg) + rev.json con desbordes y zonas seguras (reel: 220 arriba, 420 abajo, 140 derecha)
const {chromium} = require('playwright'); const fs = require('fs');
(async () => { const [id, dir] = process.argv.slice(2); const b = await chromium.launch({args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']}); const p = await b.newPage({viewport: {width: 1080, height: 1920}});
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(`http://127.0.0.1:${process.env.PUERTO || 8801}/tanda/${process.env.PAGINA || 'serie'}.html?id=${id}`); await p.waitForFunction('window.ready', null, {timeout: 120000});
  const T = await p.evaluate('window.TOTAL'); const problemas = [];
  for (let t = 0; t <= T - .05; t += .5) {
    await p.evaluate(t => window.render(t), t);
    const pr = await p.evaluate(() => { const out = []; for (const el of document.querySelectorAll('[data-chk]')) {
      let o = 1, n = el; while (n && n !== document.body) { o *= +getComputedStyle(n).opacity; n = n.parentElement; } if (o < .5) continue;
      const r = document.createRange(); r.selectNodeContents(el); const a = r.getBoundingClientRect(); const e = el.getBoundingClientRect(); const bx = el.classList.contains('t') ? e : a; if (!bx.width) continue;
      const nom = el.id || el.className || el.tagName; const txt = (el.textContent || '').slice(0, 28);
      if (bx.left < 60 || bx.right > 940 + 12 && !el.id) out.push(`${nom} «${txt}» fuera de margen x ${Math.round(bx.left)}–${Math.round(bx.right)}`);
      if (bx.right > 1080 - 60) out.push(`${nom} «${txt}» invade la derecha ${Math.round(bx.right)}`);
      if (bx.top < 215 && el.id !== 'marca') out.push(`${nom} «${txt}» sobre la zona superior y=${Math.round(bx.top)}`);
      if (bx.bottom > 1500) out.push(`${nom} «${txt}» en la zona inferior y=${Math.round(bx.bottom)}`);
      if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).display !== 'inline') out.push(`${nom} «${txt}» desborda su caja`); } return out; });
    pr.forEach(x => problemas.push(`t=${t.toFixed(1)} ${x}`));
    await p.screenshot({path: `${dir}/t_${t.toFixed(2).padStart(6, '0')}.jpg`, type: 'jpeg', quality: 85}); }
  fs.writeFileSync(`${dir}/rev.json`, JSON.stringify({T, problemas}, null, 1)); await b.close(); })();
