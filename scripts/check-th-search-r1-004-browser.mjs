import {createRequire} from 'node:module';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'C:/Users/makei/AppData/Local/npm-cache/_npx/e41f203b7505f1fb/node_modules/playwright-core');
const [cdp,origin,label,sha,deployment='local-production-build']=process.argv.slice(2);
if(!cdp||!origin||!label||!sha)throw Error('CDP origin label SHA required');
const base='docs/qa/th-search-r1-004/';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const state=read('lib/ask-lender/generated/state.csv.json'),county=read('lib/ask-lender/generated/county.csv.json'),snapshot=read('lib/home-intel/accepted-snapshot.json');
const hash=r=>createHash('sha256').update(JSON.stringify(r)).digest('hex');
const sum=(r,f,p)=>r.filter(p).reduce((s,r)=>s+Number(r[f]),0);
const cases=[
 ['nj-denial','Which lenders reported the most mortgage denials in New Jersey?','UNSUPPORTED'],
 ['broward-fha-denial','Which lenders reported the most FHA mortgage denials in Broward County?','UNSUPPORTED'],
 ['nj-fha-apps','Which lenders received the most FHA mortgage applications in New Jersey?','UNSUPPORTED'],
 ['nj-orig','Which lenders originated the most mortgages in New Jersey?','AVAILABLE',sum(state,'total_originations',r=>r.state==='NJ')],
 ['fl-fha-orig','Which lenders originated the most FHA mortgages in Florida?','AVAILABLE',sum(state,'orig_fha',r=>r.state==='FL')],
 ['broward-apps','Which lenders received the most applications for properties in Broward County?','AVAILABLE',sum(county,'applications',r=>r.state==='FL'&&r.county_fips==='12011')],
 ['fl-denial','Which lenders reported the most mortgage denials in Florida?','AVAILABLE',sum(county,'denials',r=>r.state==='FL')],
 ['year','Which lenders originated the most mortgages in New Jersey 2024?','UNSUPPORTED'],
 ['purpose','Which lenders originated the most purchase mortgages in New Jersey?','UNSUPPORTED'],
 ['identity-positive','NMLS 30 30','FOUND'],['identity-miss','nmls 32 51','NO_MATCH'],
 ['scalar','How many mortgage denials in New Jersey?','SCALAR',snapshot.geography.find(r=>r.state==='NJ').denials],
 ['comparison','Compare Broward and Palm Beach mortgage applications','COMPARISON'],
];
const b=await chromium.connectOverCDP(cdp),p=await b.contexts()[0].newPage();p.setDefaultTimeout(25000);
const out={at:new Date().toISOString(),sha,deployment,origin,sourceFingerprints:{state:hash(state),county:hash(county)},observations:[],navigation:[],failures:[]};
async function settled(){await p.locator('.intel-ask-result h3').first().waitFor();}
async function api(){return p.evaluate(async()=>{const r=await fetch('/api/ask'+location.search);return {status:r.status,result:await r.json()};});}
async function overflow(){assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');}
try {
 for(let i=0;i<cases.length;i++){
  const [id,q,expected,value]=cases[i];await p.setViewportSize({width:i%2?1280:390,height:844});const start=Date.now();
  if(i===0){await p.goto(origin,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>{const e=document.querySelector('input[name=q]');return e&&Object.keys(e).some(k=>k.startsWith('__reactProps'));});const input=p.locator('input[name=q]');await input.click();assert.ok(await input.evaluate(e=>e.isConnected));await input.fill(q);await input.press('Enter');await p.waitForURL('**/ask?**');}
  else await p.goto(origin+'/ask?'+new URLSearchParams({q}),{waitUntil:'domcontentloaded'});
  await settled();const ms=Date.now()-start;assert.ok(ms<25000);const {status,result:r}=await api();const text=await p.locator('.intel-ask-result').innerText();assert.ok(text.includes(r.headline));assert.ok(text.includes(r.body));
  if(['AVAILABLE','UNSUPPORTED'].includes(expected)){
   assert.equal(r.volumeEvidence?.availability,expected,id);
   if(expected==='AVAILABLE'){assert.equal(r.volumeEvidence.observedSum,value);assert.ok(text.includes(value.toLocaleString('en-US')));assert.ok(r.rows.length>0);assert.ok(text.includes(r.rows[0].metric.toLocaleString('en-US')));assert.ok(text.includes(r.rows[0].displayName));}
   else{assert.equal(r.volumeEvidence.observedSum,null);assert.equal(r.denominator,undefined);assert.equal(r.totalRows,undefined);assert.deepEqual(r.rows,[]);assert.ok(!text.includes('Denominator:'));}
   if(r.volumeEvidence.sourceFingerprint)assert.equal(r.volumeEvidence.sourceFingerprint,r.volumeEvidence.sourceFile.includes('county.csv')?hash(county):hash(state));
  }else if(expected==='SCALAR'){assert.equal(r.countEvidence.value,value);assert.ok(text.includes(value.toLocaleString('en-US')));}
  else if(expected==='COMPARISON'){assert.ok(r.facts.length>=6);}
  else {assert.equal(r.terminalState,expected);if(expected==='FOUND')assert.equal(r.rows[0].nmls,'3030');else assert.equal(r.query.identifier.value,'3251');}
  assert.equal(await p.locator('input[name=q]').inputValue(),q);await overflow();assert.match(await p.locator('meta[name=robots]').getAttribute('content'),/noindex/);
  const trace=p.getByText('Trace this query',{exact:true});await trace.focus();await trace.press('Enter');assert.ok(await trace.evaluate(e=>e.parentElement.open));
  if(['nj-denial','nj-orig','broward-fha-denial'].includes(id)){await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:base+label+'-'+id+'.png',fullPage:true});}
  out.observations.push({id,q,expected,value,ms,status,query:r.query,evidence:r.volumeEvidence??r.countEvidence,terminalState:r.terminalState,rows:r.totalRows,headline:r.headline,body:r.body,facts:r.facts,firstRow:r.rows?.[0],href:r.href,trace:r.trace,rendered:true,overflow:false});
 }
 // Typed filters, refresh and history preserve the cohort; no automatic relaxation.
 await p.goto(origin+'/ask?'+new URLSearchParams({q:cases[3][1],geo:'NJ',action:'origination'}),{waitUntil:'domcontentloaded'});await settled();
 await p.getByRole('link',{name:'Denials',exact:true}).click();await p.waitForURL('**action=denial**');await settled();assert.equal((await api()).result.volumeEvidence.availability,'UNSUPPORTED');assert.equal(new URL(p.url()).searchParams.get('geo'),'NJ');
 await p.reload({waitUntil:'domcontentloaded'});await settled();assert.equal((await api()).result.volumeEvidence.availability,'UNSUPPORTED');
 const recover=p.getByRole('link',{name:'View the New Jersey denials total',exact:true});await recover.click();await settled();assert.equal((await api()).result.countEvidence?.scope,'NJ');assert.equal((await api()).result.countEvidence?.action,'denial');
 await p.goBack({waitUntil:'domcontentloaded'});await settled();assert.equal((await api()).result.volumeEvidence.availability,'UNSUPPORTED');
 await p.getByRole('link',{name:'Originations',exact:true}).click();await p.waitForURL('**action=origination**');await settled();assert.equal((await api()).result.volumeEvidence.availability,'AVAILABLE');
 await p.goBack({waitUntil:'domcontentloaded'});await settled();assert.equal((await api()).result.volumeEvidence.availability,'UNSUPPORTED');await p.goForward({waitUntil:'domcontentloaded'});await settled();assert.equal((await api()).result.volumeEvidence.availability,'AVAILABLE');
 out.navigation.push('available -> unavailable -> reload -> scalar recovery -> back -> available -> back/forward passed');
 for(const width of [1280,390,320]){await p.setViewportSize({width,height:844});await overflow();await p.evaluate(()=>scrollTo(0,0));await p.screenshot({path:base+label+'-available-'+width+'.png',fullPage:width===320});}
 // Edit/resubmit using keyboard while typed filters stay selected.
 await p.locator('input[name=q]').fill(cases[0][1]);await p.locator('input[name=q]').press('Enter');await p.waitForURL(u=>u.searchParams.get('q')===cases[0][1]);await settled();assert.equal((await api()).result.volumeEvidence?.action,'origination');assert.equal((await api()).result.volumeEvidence?.scope,'NJ');out.navigation.push('edit/Enter preserved explicit action override and NJ');
 out.pass=true;
}catch(e){out.failures.push(String(e));out.pass=false;console.error(e);process.exitCode=1;}
finally{out.finishedAt=new Date().toISOString();writeFileSync(base+label+'-browser.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({pass:out.pass,cases:out.observations.length,maxMs:Math.max(...out.observations.map(r=>r.ms)),failures:out.failures}));await p.close();await b.close();}
