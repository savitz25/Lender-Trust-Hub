// Isolated browser fixture: real control/storage; auth and cloud are MOCKED.
// No credentials, external calls, application route, or database writes.
import { build } from 'esbuild';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const root = process.cwd();
const baseline = process.argv.includes('--baseline');
const realProvider = process.argv.includes('--provider');
const entry = `
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SaveLenderButton } from './components/my-lending/save-lender-button';
import * as storage from './lib/my-lending/storage';
import { MyLendingProvider, useMyLendingOptional } from './components/my-lending/my-lending-provider';

window.b3 = {
  cloud: [], events: [], storage, slug: 'b3-fixture',
  context: { loading: false, user: null, workspaceStorage: { syncStatus: 'local_only' },
    isProviderSaved: () => false, markProviderSaved: slug => window.b3.events.push(slug) },
  render(slug = this.slug) {
    this.slug = slug;
    const content = <main><h1>lender isolated Save QA</h1><SaveLenderButton lenderSlug={slug} lenderName={slug} /></main>;
    root.render(${realProvider ? '<MyLendingProvider><Observer />{content}</MyLendingProvider>' : 'content'});
  },
  auth(user, loading = false) {
    this.context = { ...this.context, user: user ? {id:user} : null, loading };
    if (!loading) storage.setMyLendingStorageIdentity(user);
    this.render();
  }
};
const root = createRoot(document.getElementById('root'));
function Observer() { const value=useMyLendingOptional(); React.useEffect(()=>{window.b3.observed=value},[value]);return null; }
window.b3.render();
`;
const mocks = {
  '@/lib/supabase/client': `export function createBrowserSupabaseClient() { return {
    auth: {
      getUser: () => new Promise(done => window.b3.resolveInitial = user => done({data:{user:user?{id:user}:null},error:null})),
      onAuthStateChange: callback => {window.b3.emitAuth = id => callback('SIGNED_IN',id?{user:{id}}:null);return {data:{subscription:{unsubscribe(){}}}};}
    },
    from: () => ({select(){return this},eq(){return this},maybeSingle(){return new Promise(done=>window.b3.resolvePull=payload=>done({data:payload?{payload,client_updated_at:'2099-01-01T00:00:00Z'}:null,error:null}))},upsert(payload){window.b3.cloud.push(payload);return Promise.resolve({error:null})}})
  }; }`,
  'next/link': "import React from 'react'; export default function Link(props) { return React.createElement('a',props); }",
  '@/components/my-lending/my-lending-provider': 'export const useMyLendingOptional = () => window.b3.context;',
  './my-lending-provider': 'export const useMyLendingOptional = () => window.b3.context;',
  '@/lib/analytics/ga-events': 'export const trackMyLendingSave = input => window.b3.events.push(input);',
};
const result = await build({
  stdin: { contents: entry, resolveDir: root, loader: 'tsx' },
  bundle: true, write: false, format: 'esm', jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"development"' },
  plugins: [{ name:'isolated-adapters', setup(builder) {
    builder.onResolve({ filter: /.*/ }, args => {
      if (realProvider && args.path.endsWith('my-lending-provider')) return null;
      return mocks[args.path] ? { path: args.path, namespace:'mock' } : null;
    });
    builder.onLoad({ filter: /.*/, namespace:'mock' }, args => ({ contents:mocks[args.path],loader:'js',resolveDir:root }));
    if (baseline) builder.onLoad({ filter: /save-lender-button\.tsx$/ }, () => ({
      contents: execFileSync('git',['show','6f75d1c3a3bd639c6919c59fef28e1201d36d2c8:components/my-lending/save-lender-button.tsx'],{encoding:'utf8'}),
      loader:'tsx', resolveDir:resolve(root,'components/my-lending')
    }));
  }}],
});
const server = createServer((req,res) => {
  if(req.url === '/app.js') {res.setHeader('Content-Type','text/javascript');res.end(result.outputFiles[0].text);return;}
  res.setHeader('Content-Type','text/html');
  res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>B3 lender fixture</title><style>body{font:16px sans-serif;margin:16px}button{padding:12px;max-width:100%}svg{width:16px;height:16px}button:focus-visible{outline:3px solid blue}[role=alert]{max-width:256px;overflow-wrap:anywhere}</style><div id="root"></div><script type="module" src="/app.js"></script></html>');
});
server.listen(realProvider?4314:4313,'127.0.0.1',()=>console.log('B3 lender: localhost port '+(realProvider?4314:4313)+'; auth/cloud MOCKED; real provider='+realProvider+'; baseline='+baseline));
