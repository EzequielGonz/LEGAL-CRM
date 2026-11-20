// node cuadros.js <id> <dir> <t1,t2,...> [dsf]  → cuadros sueltos t_XX.jpg
const {chromium}=require('playwright');const fs=require('fs');(async()=>{const [id,dir,ts,dsf]=process.argv.slice(2);fs.mkdirSync(dir,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:+(dsf||1)});p.on('pageerror',e=>console.log('PE',e.message));
await require('../servir.js')(p);await p.goto(`http://127.0.0.1:8799/historia.html?r=${id}`);await p.waitForFunction('window.ready',null,{timeout:60000});
for(const t of ts.split(',').map(Number)){await p.evaluate(t=>window.render(t),t);await p.screenshot({path:`${dir}/t_${t.toFixed(2).padStart(6,'0')}.jpg`,type:'jpeg',quality:85});}
await b.close();})();
