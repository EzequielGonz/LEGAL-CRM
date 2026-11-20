// node cuadro.js <id> <out.jpg> <t>  (una captura rápida para revisar)
const {chromium}=require('playwright');(async()=>{const [id,out,...ts]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
await p.goto(`http://127.0.0.1:8799/historia.html?r=${id}`);await p.waitForFunction('window.ready',null,{timeout:60000});
for(const [i,t] of ts.entries()){await p.evaluate(t=>window.render(t),+t);await p.screenshot({path:out.replace('.jpg',`-${i}.jpg`),type:'jpeg',quality:80});}await b.close();})();
