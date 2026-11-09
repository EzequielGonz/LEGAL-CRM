// node frames.js url outdir dsf fps [t1,t2,...]
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const [url,out,dsf,fps,list]=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:+dsf});
p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto(url);await p.waitForFunction('window.ready',null,{timeout:60000});
const T=await p.evaluate('window.TOTAL');console.log('TOTAL',T,'END',await p.evaluate('window.T_END'));
const times=list?list.split(',').map(Number):[...Array(Math.round(T*fps)).keys()].map(i=>i/fps);
const N=+(process.env.N||1),K=+(process.env.K||0);let i=0,n=0;const t0=Date.now();for(const t of times){if(i%N!==K){i++;continue}n++;await p.evaluate(t=>window.render(t),t);await p.screenshot({path:`${out}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:94});i++;if(n%60==0)console.log(K,n,'/',times.length/N|0,((Date.now()-t0)/n|0)+'ms/f')}
await b.close()})();
