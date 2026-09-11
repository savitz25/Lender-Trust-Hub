import test from 'node:test';
import assert from 'node:assert/strict';
import {executeAskQuery} from './execute-query';
test('reported NJ denial breakdown never becomes a market-zero fact',()=>{
 const r=executeAskQuery({q:'Which lenders reported the most mortgage denials in New Jersey?'});
 assert.equal(r.denominator,undefined,'Unavailable denial field must not produce a numeric denominator');
 assert.equal(r.volumeEvidence?.availability,'UNSUPPORTED');
 assert.equal(r.volumeEvidence?.observedSum,null);
 assert.equal(r.totalRows,undefined);
});
