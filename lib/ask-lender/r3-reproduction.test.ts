import test from 'node:test';
import assert from 'node:assert/strict';
import snapshot from '../home-intel/accepted-snapshot.json';
import {executeAskQuery} from './execute-query';
test('R1-003 accepted NJ measure, not national fallback',()=>{
 const expected=snapshot.geography.find(r=>r.state==='NJ')!.originations;
 const result=executeAskQuery({q:'How many mortgage originations in New Jersey?'});
 assert.equal(result.facts?.[0]?.value,expected.toLocaleString('en-US'));
});
test('R1-003 executed overrides agree with visible plan',()=>{
 const expected=snapshot.geography.find(r=>r.state==='FL')!.denials;
 const result=executeAskQuery({q:'How many mortgage originations in New Jersey?',overrides:{geo:'FL',action:'denial'}});
 assert.equal(result.facts?.[0]?.value,expected.toLocaleString('en-US'));
});
