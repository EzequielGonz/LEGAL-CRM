// node piezas.js out.jpg url [w h]  → captura una pieza fija (post, carrusel o historia) y corre la revisión
const {chromium}=require('playwright');
(async()=>{const jobs=JSON.parse(require('fs').readFileSync(process.argv[2]));const b=await chromium.launch();let bad=0;
 for(const j of jobs){const p=await b.newPage({viewport:{width:1080,height:j.h},deviceScaleFactor:1});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.text().startsWith('ERR'))errs.push(m.text())});
  await p.goto(j.url);await p.waitForFunction('window.ready',null,{timeout:30000});const av=await p.evaluate('window.qa(window.T_FIJO)');
  await p.screenshot({path:j.out,type:'jpeg',quality:92});if(av.length||errs.length){bad++;console.log('AVISO',j.out,JSON.stringify([...av,...errs]).slice(0,400))}await p.close()}
 console.log('listo',jobs.length,'piezas,',bad,'con avisos');await b.close()})();
