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
  await until("window.b3.observed.workspaceStorage.syncStatus==='synced'");
  assert.equal(evaluate("document.querySelector('[role=status]').textContent"),'Saved to your Lending account');
  console.log('B3-L05/06 PASS real provider/control/storage/sync; MOCKED Supabase delayed auth and workspace pull');

  browser('reload'); await until('Boolean(window.b3.resolveInitial)');
  evaluate("window.b3.resolveInitial('owner-a')"); await until('Boolean(window.b3.resolvePull)');
  evaluate('window.b3.resolvePull(window.b3.storage.loadState())');
  await until("document.querySelector('[role=status]')?.textContent==='Saved to your Lending account'");
  assert.equal(evaluate('window.b3.storage.loadState().savedLenders.length'),1);
  console.log('V2-1C PASS reload with server-confirmed legacy account is not mislabeled device-only');

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

  await reset(); await until('Boolean(window.b3.resolveInitial)');
  evaluate("window.b3.resolveInitial('owner-a');window.b3.delayPush=true");
  await until('Boolean(window.b3.resolvePull)'); evaluate('window.b3.resolvePull(null)');
  await until('window.b3.observed.loading===false'); click();
  await until('Boolean(window.b3.finishPush)');
  assert.notEqual(evaluate('window.b3.observed.workspaceStorage.syncStatus'),'synced');
  evaluate("window.b3.emitAuth('owner-b')");
  await until("window.b3.storage.getMyLendingStorageUserId()==='owner-b'");
  evaluate('window.b3.resolvePull(null)'); await until('window.b3.observed.loading===false');
  evaluate('window.b3.finishPush()'); await delay(100);
  assert.equal(evaluate('window.b3.storage.loadState().savedLenders.length'),0);
  assert.notEqual(evaluate('window.b3.observed.workspaceStorage.syncStatus'),'synced');
  assert.equal(evaluate("document.querySelector('button').getAttribute('aria-pressed')"),null);
  assert.equal(evaluate('window.b3.cloud.length'),1);
  assert.equal(evaluate('window.b3.cloud[0].user_id'),'owner-a');
  console.log('V2-1C PASS late old-owner push cannot mark B synced/Saved or write B research');
 } finally { browser('close'); }
} else try {
 await reset();
 browser('focus','button'); browser('press','Enter');
 await until(state+'.length===1');
 assert.equal(evaluate(state)[0].lenderSlug,'b3-fixture');
 browser('reload'); await until("document.querySelector('button')?.textContent.includes('In My')");
 assert.equal(evaluate(state).length,1);
 assert.equal(evaluate("document.querySelector('[role=status]')?.textContent"),'Saved on this device');
 assert.equal(evaluate("document.querySelector('button').getAttribute('aria-describedby')===document.querySelector('[role=status]').id"),true);
 assert.equal(evaluate("document.body.textContent.includes('My TrustHub')"),false);
 console.log('B3-01/02/09 PASS browser keyboard immediate Save and real reload persistence');

 await reset();
 evaluate("window.b3.writes=0;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='lth:my-lending:v1')window.b3.writes++;return original.call(this,k,v)};document.querySelector('button').click();window.b3.firstWrites=window.b3.writes;document.querySelector('button').click();document.querySelector('button').click()");
 assert.equal(evaluate(state).length,1);
 assert.equal(evaluate('window.b3.writes'),evaluate('window.b3.firstWrites'),'duplicate activation must not repeat persistence effects');
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

 await reset(); evaluate("window.b3.auth('owner-a',false)"); await delay(100);
 evaluate("window.b3.storage.setMyLendingStorageIdentity('owner-b');document.querySelector('button').click()");
 await until("document.body.textContent.includes('Account changed')");
 assert.equal(evaluate('window.b3.storage.loadState().savedLenders.length'),0);
 console.log('B3-07 PASS storage owner switch before React auth rerender rejects Save');

 await reset(); evaluate('window.b3.auth(null,true)'); await delay(100); click();
 evaluate("window.b3.auth('owner-a',false)");
 await until('window.b3.storage.loadState().savedLenders.length===1');
 assert.equal(evaluate(state).length,0);
 console.log('B3-05/06 PASS MOCKED initial auth resolution saves only in owner namespace');

 await reset(); evaluate('window.b3.auth(null,true)'); await delay(100); click();
 await delay(15500);
 await until("document.body.textContent.includes('Nothing was saved')");
 evaluate('window.b3.auth(null,false)'); await delay(100);
 assert.equal(evaluate(state).length,0,'late readiness must not replay timed-out intent');
 click(); await until(state+'.length===1');
 console.log('B3-04/08 PASS bounded pending timeout, no late write, explicit retry succeeds');

 for(const width of [1440,390,320]){
   await reset(); browser('set','viewport',String(width),'900');
   click(); await until(state+'.length===1'); browser('reload');
   await until("document.querySelector('[role=status]')?.textContent==='Saved on this device'");
   browser('focus','button');
   assert.equal(evaluate("document.activeElement===document.querySelector('button')"),true);
   assert.equal(evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   browser('screenshot',join(dir,'width-'+width+'.png'));
 }
 console.log('B3-09 PASS component fixture 1440/390/320 keyboard, focus, no overflow');
 console.log('Evidence directory: '+dir);
} finally { browser('close'); }
