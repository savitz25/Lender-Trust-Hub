// TH-ARCH-P0-001: naturalRequest() in specialist-execution/v2.ts used to maintain its own crude
// identifier regex (`/\b(NMLS|LEI)\s*[:#]?\s*([A-Z0-9]+)\b/i`) parallel to this repo's own
// R1-hardened parser (ask-lender/identifier.ts). That regex could mis-capture a label word
// ("NMLS number 12345" -> "NUMBER") and had none of parseIdentityRequest's ambiguity guards.
// This locks in the delegation: naturalRequest's identifier must agree with the authoritative
// parser, never fabricate a value from filler wording, and never fuzzy-match a regulatory id.
import test from 'node:test';
import assert from 'node:assert/strict';
import { executeSpecialistV2 } from './v2';

const LEI = '549300FGXN1K3HLB1R50';

function interpretation(query: string) {
  const response = executeSpecialistV2(query) as { body: { queryInterpretation: { identifier?: { type?: string; value?: string } } } };
  return response.body.queryInterpretation.identifier;
}

test('ARCH-P0-001: "NMLS 12345" extracts a clean NMLS identifier', () => {
  assert.deepEqual(interpretation('NMLS 12345'), { type: 'NMLS', value: '12345' });
});

test('ARCH-P0-001: "NMLS number 12345" extracts the value, not the word "number"', () => {
  const id = interpretation('NMLS number 12345');
  assert.equal(id?.type, 'NMLS');
  assert.equal(id?.value, '12345');
  assert.notEqual(id?.value, 'NUMBER');
});

test('ARCH-P0-001: "NMLS #12345" extracts a clean NMLS identifier', () => {
  assert.deepEqual(interpretation('NMLS #12345'), { type: 'NMLS', value: '12345' });
});

test(`ARCH-P0-001: "LEI ${LEI}" extracts a clean LEI identifier`, () => {
  assert.deepEqual(interpretation(`LEI ${LEI}`), { type: 'LEI', value: LEI });
});

test('ARCH-P0-001: malformed identifier wording never fabricates a value', () => {
  for (const q of ['What is my NMLS number?', 'NMLS number', 'NMLS #']) {
    const id = interpretation(q);
    assert.notEqual(id?.value, 'NUMBER');
    assert.notEqual(id?.value, '');
  }
});

test('ARCH-P0-001: ambiguous digit grouping is not silently accepted as an identifier here', () => {
  // parseIdentityRequest flags this as NEEDS_CLARIFICATION rather than a clean span; naturalRequest
  // must not force it into identity execution regardless -- it should fall through instead of
  // reporting a confident (and possibly wrong) NMLS value.
  const id = interpretation('NMLS 12 3 45');
  assert.equal(id, undefined);
});

test('ARCH-P0-001: two distinct NMLS numbers never collide (no fuzzy regulatory identifier match)', () => {
  const a = interpretation('NMLS 12345');
  const b = interpretation('NMLS 12346');
  assert.equal(a?.value, '12345');
  assert.equal(b?.value, '12346');
  assert.notEqual(a?.value, b?.value);
});
