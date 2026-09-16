import test from 'node:test';
import assert from 'node:assert/strict';
import { parseLenderAsk } from './parse';

// TH-DISCOVERY-GEN-001: [PROVIDER CATEGORY] + [OPTIONAL GEOGRAPHY] must default to DISCOVERY,
// not aggregate/count research. "Lender in Dallas Texas" was interpreted as an HMDA
// count/origination question because entity-mode recognition only fired for a bare "lender"
// mention paired with "most"/"which" language, or a hardcoded, Miami-only bare-city check. This
// generalizes county/city recognition to every state's own acquired major-county list (already
// used elsewhere for real HMDA data), used only as a DISCOVERY-mode trigger -- exact county-grain
// institution data stays Florida-only, so a non-Florida match still resolves to real, broader
// state-level institution rows for the state the consumer actually named, never a fabricated
// county-specific claim.
for (const [query, expectedState] of [
  ['lender in Dallas Texas', 'TX'],
  ['lenders in Houston Texas', 'TX'],
  ['mortgage broker in Monmouth County New Jersey', 'NJ'],
  ['lender in Seattle Washington', 'WA'],
  ['mortgage company in Los Angeles California', 'CA'],
] as const)
  test(`provider category + city + state defaults to discovery: "${query}"`, () => {
    const r = parseLenderAsk(query);
    assert.equal(r.mode, 'entity', `expected entity mode, got ${r.mode} (${r.failReason ?? ''})`);
    assert.equal(r.geography?.state, expectedState);
  });

test('"mortgage companies in Florida" stays the established state-level scalar-count ground truth', () => {
  const r = parseLenderAsk('mortgage companies in Florida');
  assert.equal(r.mode, 'count');
  assert.equal(r.geography?.state, 'FL');
});

// A bare city name with NO state at all must never guess a state from an incidental
// cross-state county-name collision (e.g. a real Houston County, Georgia does not mean
// "lenders in Houston" refers to Georgia) -- safer to fall through to the existing honest
// behavior than to attribute the wrong state.
test('a bare city name with no state never infers a state from an unrelated same-name county', () => {
  const r = parseLenderAsk('lenders in Houston');
  assert.notEqual(r.geography?.state, 'GA');
});
