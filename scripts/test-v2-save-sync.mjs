// Actual storage + sync modules, deterministic provider adapter and timers. No backend.
import assert from 'node:assert/strict';
import test from 'node:test';
import { build } from 'esbuild';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';
const bundle = await build({stdin:{contents:`export * from './lib/my-lending/storage'; export * from './lib/my-lending/sync';`,resolveDir:process.cwd()},
  bundle:true,write:false,platform:'node',format:'cjs',plugins:[{name:'isolated',setup(b){
    b.onResolve({filter:/^@\/lib\/supabase\/client$/},()=>({path:'provider',namespace:'mock'}));
    b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:`export const createBrowserSupabaseClient=()=>({from:()=>({select(){return this},eq(){return this},maybeSingle:()=>Promise.resolve({data:fixture.remote,error:null}),upsert:row=>{fixture.rows.push(row);return new Promise(done=>fixture.complete=done)}})});`,loader:'js'}));
  }}]});
function setup() {
  const data=new Map(), fixture={rows:[],complete:null,timer:null}, fixtureModule={exports:{}};
  const localStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  runInNewContext(bundle.outputFiles[0].text,{fixture,module:fixtureModule,exports:fixtureModule.exports,
    console,window:new EventTarget(),localStorage,CustomEvent,Event,crypto:webcrypto,
    setTimeout:fn=>{fixture.timer=fn;return 1},clearTimeout:()=>{fixture.timer=null}});
  const api=fixtureModule.exports;
  api.setMyLendingStorageIdentity('owner-a');
  api.shortlistLender({lenderSlug:'fixture-a',lenderName:'Fixture A'});
  return {api,fixture,data};
}
for (const next of ['owner-b',null,'away-and-back']) test(`late A push after ${next} is skipped; current research unchanged`,async()=>{
  const {api,fixture,data}=setup();
  const pending=api.pushMyLendingWorkspace('owner-a');
  assert.equal(fixture.rows[0].user_id,'owner-a');
  api.setMyLendingStorageIdentity(next==='away-and-back'?null:next);
  if(next==='away-and-back')api.setMyLendingStorageIdentity('owner-a');
  api.shortlistLender({lenderSlug:'current-only',lenderName:'Current research',notes:'Keep'});
  const before=[...data.entries()];
  fixture.complete({error:null});
  assert.equal(await pending,'skipped');
  assert.deepEqual([...data.entries()],before);
  assert.equal(fixture.rows.length,1,'no redispatch under new owner');
});
test('unchanged initiating owner gets normal confirmed result only after response',async()=>{
  const {api,fixture}=setup();let settled=false;
  const pending=api.pushMyLendingWorkspace('owner-a').then(r=>{settled=true;return r});
  await Promise.resolve();assert.equal(settled,false);
  fixture.complete({error:null});assert.equal(await pending,'ok');
});
test('old owner provider error is also skipped; current owner errors remain honest',async()=>{
  const first=setup();const pending=first.api.pushMyLendingWorkspace('owner-a');
  first.api.setMyLendingStorageIdentity(null);first.fixture.complete({error:{message:'synthetic failure'}});
  assert.equal(await pending,'skipped');
  const second=setup();const current=second.api.pushMyLendingWorkspace('owner-a');
  second.fixture.complete({error:{message:'synthetic failure'}});assert.equal(await current,'error');
});
test('queued push cannot dispatch after ABA identity transition',()=>{
  const {api,fixture}=setup();let outcome;
  api.scheduleMyLendingCloudPush('owner-a',api.loadState(),result=>outcome=result);
  api.setMyLendingStorageIdentity(null);api.setMyLendingStorageIdentity('owner-a');
  fixture.timer();assert.equal(outcome,'skipped');assert.equal(fixture.rows.length,0);
});
test('reload confirms exact remote/local match, not timestamp alone',async()=>{
  const {api,fixture}=setup();const local=api.loadState();
  fixture.remote={payload:local,client_updated_at:api.getStateMaxUpdatedAt(local)};
  assert.equal(await api.pullMyLendingWorkspace('owner-a'),'confirmed_local');
  fixture.remote={...fixture.remote,payload:{...local,savedLenders:[]}};
  assert.equal(await api.pullMyLendingWorkspace('owner-a'),'kept_local');
  assert.equal(fixture.rows.length,0);
});
