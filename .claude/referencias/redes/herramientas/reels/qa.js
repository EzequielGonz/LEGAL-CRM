// node qa.js id [id...] → hoja de contactos por reel + avisos de QA en instantes clave
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const ids=process.argv.slice(2);const b=await chromium.launch();fs.mkdirSync('qa',{recursive:true});
for(const id of ids){const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:.25});
 p.on('pageerror',e=>console.log('ERR',id,e.message));
 await p.goto(`http://127.0.0.1:8765/v6/motor.html?r=${id}`);await p.waitForFunction('window.ready',null,{timeout:30000});
 const g=JSON.parse(fs.readFileSync(`reels/${id}.tl.json`));const ts=[];
 g.escenas.forEach(e=>{const s=e.seg[e.seg.length-1];ts.push(+(e.t0+.25).toFixed(2),+((e.seg[0].t+.6)).toFixed(2),+((s.fin+.5)).toFixed(2),+(e.t1-.05).toFixed(2))});
 const av=[];for(let i=0;i<ts.length;i++){const r=await p.evaluate(t=>window.qa(t),ts[i]);r.forEach(x=>av.push(`t=${ts[i]} ${x}`));await p.screenshot({path:`qa/${id}-${String(i).padStart(2,'0')}.png`})}
 console.log(`## ${id} (${g.total}s) ${av.length?av.length+' avisos':'sin avisos'}`);[...new Set(av)].slice(0,14).forEach(x=>console.log('  '+x));await p.close()}
await b.close()})();
