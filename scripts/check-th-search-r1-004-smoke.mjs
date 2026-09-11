import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const [origin,sha,deployment,label='production']=process.argv.slice(2);const checks=[];
for(const path of ['/','/ask','/lender/rocket-mortgage','/florida','/new-jersey','/calculators','/compare','/admin/login','/robots.txt','/sitemap.xml']){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});checks.push({path,status:r.status});assert.equal(r.status,200,path);const text=await r.text();if(path==='/robots.txt')assert.ok(text.includes('/ask'));if(path==='/sitemap.xml')assert.ok(!text.includes('<loc>https://www.lendertrusthub.com/ask</loc>'));
}
const q='Which lenders reported the most mortgage denials in New Jersey?';const r=await fetch('https://lendertrusthub.com/ask?'+new URLSearchParams({q}),{redirect:'manual',signal:AbortSignal.timeout(20000)});const target=new URL(r.headers.get('location'));assert.equal(r.status,308);assert.equal(target.hostname,'www.lendertrusthub.com');assert.equal(target.searchParams.get('q'),q);
const out={at:new Date().toISOString(),sha,deployment,checks,canonical:{status:r.status,host:target.hostname,queryPreserved:true},status:'PASS'};writeFileSync('docs/qa/th-search-r1-004/'+label+'-smoke.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
