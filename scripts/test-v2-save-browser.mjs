// Run while qa-v2-save.mjs serves localhost. Real browser storage; auth/cloud MOCKED.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync,openSync,closeSync,readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'b3-lender-'));
let seq=0;
function command(args,input) {
 const path=join(dir,seq+++'.json'), fd=openSync(path,'w');
 const child=spawnSync(process.env.AGENT_BROWSER_BIN || 'agent-browser',['--session','b3-lender-tests','--json',...args],
 {input,encoding:'utf8',stdio:['pipe',fd,'ignore'],timeout:30000});
 closeSync(fd); assert.ifError(child.error);
 const result=JSON.parse(readFileSync(path,'utf8'));
 assert.equal(result.success,true,result.error); return result.data;
}
const browser=(...args)=>command(args);
const evaluate=source=>command(['eval','--stdin'],source).result;
const delay=ms=>new Promise(done=>setTimeout(done,ms));
async function until(source) { for(let n=0;n<60;n++){if(evaluate(source))return;await delay(100);}assert.fail(source); }
async function reset() {
 browser('open','http://127.0.0.1:'+(process.argv.includes('--provider')?4314:4313));
 evaluate('localStorage.clear(); sessionStorage.clear()'); browser('reload');
 await until('Boolean(window.b3 && document.querySelector("button"))');
}
const state=`JSON.parse(localStorage.getItem('lth:my-lending:v1')||'{"savedLenders":[]}').savedLenders`;
const click=()=>evaluate("document.querySelector('button').click()");
if (process.argv.includes('--provider')) {
 try {
  await reset();
  await until('Boolean(window.b3.resolveInitial)');
  click();
  assert.equal(evaluate(state).length,0);
  evaluate("window.b3.resolveInitial('owner-a')");
  await until('Boolean(window.b3.resolvePull)');
  assert.equal(evaluate('window.b3.observed.loading'),true);
  assert.equal(evaluate('window.b3.storage.loadState().savedLenders.length'),0);
  evaluate('window.b3.resolvePull(null)');
  await until('window.b3.storage.loadState().savedLenders.length===1');
  assert.equal(evaluate(state).length,0);
  await until('window.b3.cloud.length===1');
  assert.equal(evaluate('window.b3.cloud[0].user_id'),'owner-a');
  assert.equal(evaluate('window.b3.cloud[0].payload.savedLenders.length'),1);
  console.log('B3-L05/06 PASS real provider/control/storage/sync; MOCKED Supabase delayed auth and workspace pull');

  await reset(); await until('Boolean(window.b3.resolveInitial)');
  evaluate("window.b3.emitAuth('owner-a')");
  await until('Boolean(window.b3.resolvePull)');
  evaluate("window.b3.stalePull=window.b3.resolvePull; window.b3.emitAuth(null); window.b3.resolveInitial('owner-a')");
  await delay(100);
  assert.equal(evaluate('window.b3.storage.getMyLendingStorageUserId()'),null);
  evaluate("window.b3.stalePull({version:3,activePlanId:null,plans:[],savedLenders:[{id:'stale',lenderSlug:'other-owner',lenderName:'Other owner',status:'researching',savedAt:'2099-01-01',updatedAt:'2099-01-01'}]})");
  await delay(100);
  assert.equal(evaluate(state).length,0);
  assert.equal(evaluate('window.b3.storage.getMyLendingStorageUserId()'),null);
  assert.equal(evaluate('window.b3.observed.user'),null);
  console.log('B3-L07 PASS stale getUser and stale cloud pull cannot restore/write previous owner after sign-out');
 } finally { browser('close'); }
} else try {
 await reset();
 browser('focus','button'); browser('press','Enter');
 await until(state+'.length===1');
 assert.equal(evaluate(state)[0].lenderSlug,'b3-fixture');
 browser('reload'); await until("document.querySelector('button')?.textContent.includes('In My')");
 assert.equal(evaluate(state).length,1);
 console.log('B3-01/02/09 PASS browser keyboard immediate Save and real reload persistence');

 await reset();
 evaluate("document.querySelector('button').click();document.querySelector('button').click();document.querySelector('button').click()");
 assert.equal(evaluate(state).length,1);
 console.log('B3-03 PASS rapid duplicate clicks create one row');

 await reset(); evaluate('window.b3.auth(null,true)'); await delay(100); click();
 assert.equal(evaluate(state).length,0);
 await until("document.querySelector('button')?.getAttribute('aria-busy')==='true'");
 evaluate('window.b3.auth(null,false)');
 await until(state+'.length===1');
 console.log('B3-04/05 PASS delayed auth: visible retained intent executes once after resolution');

 await reset();
 evaluate("window.b3.originalSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('blocked','QuotaExceededError')}");
 click(); await until("Boolean(document.querySelector('[role=alert]'))");
 assert.equal(evaluate(state).length,0);
 evaluate('Storage.prototype.setItem=window.b3.originalSetItem'); click();
 await until(state+'.length===1');
 console.log('B3-08 PASS blocked fresh storage honest error and recovery');

 
 await reset(); evaluate('window.b3.auth(null,true)'); await delay(100); click();
 evaluate("window.b3.render('different-profile')"); await delay(100); evaluate('window.b3.auth(null,false)'); await delay(100);
 assert.equal(evaluate(state).length,0);
 console.log('B3-07 PASS navigation cancels pending profile intent');

 await reset(); evaluate("window.b3.auth('owner-a',true)"); await delay(100); click();
 evaluate("window.b3.auth('owner-b',false)"); await until("document.body.textContent.includes('Account changed')");
 assert.equal(evaluate('window.b3.storage.loadState().savedLenders.length'),0);
 console.log('B3-07 PASS MOCKED owner switch cancels intent');

 await reset(); evaluate('window.b3.auth(null,true)'); await delay(100); click();
 evaluate("window.b3.auth('owner-a',false)");
 await until('window.b3.storage.loadState().savedLenders.length===1');
 assert.equal(evaluate(state).length,0);
 console.log('B3-05/06 PASS MOCKED initial auth resolution saves only in owner namespace');
 
 for(const width of [1440,390,320]){
   await reset(); browser('set','viewport',String(width),'900');
   browser('focus','button');
   assert.equal(evaluate("document.activeElement===document.querySelector('button')"),true);
   assert.equal(evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   browser('screenshot',join(dir,'width-'+width+'.png'));
 }
 console.log('B3-09 PASS component fixture 1440/390/320 keyboard, focus, no overflow');
 console.log('Evidence directory: '+dir);
} finally { browser('close'); }
