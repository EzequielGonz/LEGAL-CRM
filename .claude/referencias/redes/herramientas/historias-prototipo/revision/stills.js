const {chromium}=require('playwright');(async()=>{const [dir,...pairs]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:2});
await require('../servir.js')(p);await p.goto('http://127.0.0.1:8799/historia.html?r='+(process.env.R||'vita'));await p.waitForFunction('window.ready',null,{timeout:60000});
for(const pr of pairs){const [n,t]=pr.split('=');await p.evaluate(t=>{window.render(t);document.getElementById('ui').style.display='none';},+t);
await p.screenshot({path:`${dir}/${n}.jpg`,type:'jpeg',quality:90});}await b.close();})();
