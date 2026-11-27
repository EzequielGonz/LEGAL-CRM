const {chromium}=require('playwright');const B='https://legal-crm-nine.vercel.app';
(async()=>{const b=await chromium.launch();const c=await b.newContext();const p=await c.newPage();
await p.goto(B+'/login',{waitUntil:'networkidle'});await p.locator('input').first().fill(process.env.PANEL_CODE);await p.locator('input').first().press('Enter');await p.waitForTimeout(6000);
console.log('url',p.url().replace(B,''));await c.storageState({path:__dirname+'/sesion.json'});
const ck=(await c.cookies()).map(x=>x.name+' vence '+(x.expires>0?new Date(x.expires*1000).toISOString():'sesión'));console.log(ck.join(' | '));await b.close()})();
