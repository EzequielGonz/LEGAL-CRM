// node analiza.js url... → captura móvil del primer pantallazo y datos de SEO/conversión
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const out=[];
for(const u of process.argv.slice(2)){const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 const t0=Date.now();try{await p.goto(u,{waitUntil:'load',timeout:45000})}catch(e){out.push({u,err:e.message.slice(0,80)});await p.close();continue}const load=Date.now()-t0;await p.waitForTimeout(1500);
 const d=await p.evaluate(()=>{const q=s=>[...document.querySelectorAll(s)];const ld=q('script[type="application/ld+json"]').map(s=>{try{const j=JSON.parse(s.textContent);const g=[].concat(j['@graph']||j);return g.map(x=>x['@type']).flat()}catch(e){return['?']}}).flat();
  return {title:document.title,desc:(document.querySelector('meta[name=description]')||{}).content||'',h1:q('h1').map(h=>h.innerText.trim()).slice(0,2),h2:q('h2').length,h2s:q('h2').slice(0,8).map(h=>h.innerText.trim().slice(0,70)),schema:[...new Set(ld)],
   wa:q('a[href*="wa.me"],a[href*="whatsapp"]').length,tel:q('a[href^="tel:"]').length,forms:q('form').length,campos:q('form input:not([type=hidden]),form select,form textarea').length,
   imgs:q('img').length,videos:q('video').length,anim:!!(window.gsap||document.querySelector('[data-aos],[class*="animate"],[data-scroll]')),palabras:document.body.innerText.split(/\s+/).length,
   faq:/preguntas frecuentes|faq/i.test(document.body.innerText),reseñas:/reseñas|opiniones|testimonio|google/i.test(document.body.innerText)}});
 const name=new URL(u).hostname.replace(/^www\./,'');await p.screenshot({path:`${name}.jpg`,type:'jpeg',quality:70});out.push({u,load,...d});await p.close()}
fs.writeFileSync('datos.json',JSON.stringify(out,null,1));await b.close()})();
