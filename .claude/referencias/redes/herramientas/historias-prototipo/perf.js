const {chromium}=require('playwright');(async()=>{const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:{width:1080,height:1920}});
p.on('console',m=>console.log('PAGE',m.text()));p.on('pageerror',e=>console.log('ERR',e.message));
await p.goto('http://127.0.0.1:8799/perf.html');await p.waitForFunction('window.ready',null,{timeout:60000});
console.log(await p.evaluate(()=>{const g=document.querySelector('canvas').getContext('webgl2');const e=g.getExtension('WEBGL_debug_renderer_info');return g.getParameter(e.UNMASKED_RENDERER_WEBGL)}));
let t0=Date.now();for(let i=0;i<5;i++){await p.evaluate(t=>window.render(t),i/30);await p.screenshot({path:`/tmp/perf${i}.jpg`,type:'jpeg',quality:94})}console.log('ms/frame',(Date.now()-t0)/5);await b.close()})();
