import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import type { Lender } from '../mockData';
import { handoffForm, handoffParentOrigin, ISOLATED_ASK_ORIGIN } from './handoff-form';
import { exactIsolatedLenderOrigin, ISOLATED_PILOT_SLUG, ISOLATED_PROJECT, isolatedLenderPins, isolatedPilotAdmits } from './isolated-pilot';
import { LENDER_PRODUCTION_PINS, signLenderAssertion, verifyLenderAssertion } from './lender-assertion';
import { manifestDigest } from './manifest';
import { productionParentGate } from './one-click';
import { isolatedHandoffDeps, productionHandoffDeps, stageParentHandoff } from './signed-handoff';
import { handleLenderSource } from './source-callback';

const LENDER = 'https://lender-pilot.preview.example';
const browser = 'b'.repeat(43);
const now = 1_700_000_000_000;
const pilotEnv = {
  VERCEL_ENV: 'preview',
  MY_TRUSTHUB_V23_PARENT_ORIGIN: ISOLATED_ASK_ORIGIN,
  MY_TRUSTHUB_V23_LENDER_ORIGIN: LENDER,
  MY_TRUSTHUB_V23_ISOLATED_PROJECT: ISOLATED_PROJECT,
  NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN: ISOLATED_ASK_ORIGIN,
};

function keys() {
  const pair = generateKeyPairSync('ed25519');
  return {
    privateKey: { kid: 'lender-pilot-fixture', pem: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() },
    publicKey: { kid: 'lender-pilot-fixture', pem: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString() },
  };
}

test('production handoff stays closed for the isolated parent origin', () => {
  assert.equal(productionParentGate({}).enabled, false);
  assert.equal(productionParentGate({}).broad, false);
  assert.deepEqual(productionHandoffDeps({ MY_TRUSTHUB_V23_PARENT_ORIGIN: ISOLATED_ASK_ORIGIN, MY_TRUSTHUB_V23_LENDER_KEY_ID: 'k', MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM: 'PRIVATE KEY' }), {});
  assert.equal(isolatedLenderPins({}), null);
  assert.equal(isolatedPilotAdmits(ISOLATED_PILOT_SLUG, {}), false);
  assert.equal(handoffParentOrigin(undefined), 'https://www.asktrusthub.com');
  assert.equal(handoffForm(ISOLATED_ASK_ORIGIN + '/my/profile-save', browser, 'save'), null);
});

test('one explicit lender origin admits only the proposed profile', () => {
  assert.equal(exactIsolatedLenderOrigin(LENDER), LENDER);
  for (const rejected of ['*', LENDER + '?next=/', 'http://lender-pilot.preview.example', 'https://www.lendertrusthub.com', 'https://www.asktrusthub.com', ISOLATED_ASK_ORIGIN, LENDER + '/lenders/freedom-mortgage']) {
    assert.equal(exactIsolatedLenderOrigin(rejected), null, rejected);
  }
  const pins = isolatedLenderPins(pilotEnv);
  assert.deepEqual(pins, { parentOrigin: ISOLATED_ASK_ORIGIN, lenderOrigin: LENDER, project: ISOLATED_PROJECT, assertionEnvironment: 'isolated' });
  assert.equal(isolatedPilotAdmits('freedom-mortgage', pilotEnv), true);
  assert.equal(isolatedPilotAdmits('loandepot', pilotEnv), false);
  assert.equal(isolatedLenderPins({ ...pilotEnv, VERCEL_ENV: 'production' }), null);
  assert.equal(isolatedLenderPins({ ...pilotEnv, NEXT_PUBLIC_LENDER_PARENT_SAVE_ENABLED: '1', MTH_LENDER_PARENT_SAVE_MODE: 'production', NEXT_PUBLIC_LENDER_PARENT_SAVE_CANARY_SLUGS: 'freedom-mortgage' }), null);
  assert.equal(handoffParentOrigin(ISOLATED_ASK_ORIGIN), ISOLATED_ASK_ORIGIN);
  assert.equal(handoffForm(ISOLATED_ASK_ORIGIN + '/my/profile-save', browser, 'save', handoffParentOrigin(ISOLATED_ASK_ORIGIN))?.action, ISOLATED_ASK_ORIGIN + '/my/profile-save');
  assert.equal(handoffForm('https://evil.example/my/profile-save', browser, 'save', handoffParentOrigin(ISOLATED_ASK_ORIGIN)), null);
});

test('isolated assertions and the source origin stay on the explicit pair', async () => {
  const pair = keys();
  const pins = isolatedLenderPins(pilotEnv)!;
  const body = Buffer.from('{"action":"resolve"}');
  const target = ISOLATED_ASK_ORIGIN + '/api/my-trusthub/profile-save';
  const token = signLenderAssertion(pair.privateKey, 'lender', target, 'transfer:stage', body, browser, null, null, now, pins);
  const claims = await verifyLenderAssertion(new Request(target, { method: 'POST', headers: { 'x-trusthub-v23-assertion': token }, body }), body, pair.publicKey, 'lender', 'transfer:stage', { claim: async () => true }, now, pins);
  assert.equal(claims.sub, 'svc:trusthub:lender:v23:isolated');
  assert.equal(claims.ask_origin, ISOLATED_ASK_ORIGIN);
  assert.equal(claims.lender_origin, LENDER);
  const productionToken = signLenderAssertion(pair.privateKey, 'lender', LENDER_PRODUCTION_PINS.parentOrigin + '/api/my-trusthub/profile-save', 'transfer:stage', body, browser, null, null, now);
  await assert.rejects(() => verifyLenderAssertion(new Request(target, { method: 'POST', headers: { 'x-trusthub-v23-assertion': productionToken }, body }), body, pair.publicKey, 'lender', 'transfer:stage', { claim: async () => true }, now, pins));
  const nonces = { claim: async () => true };
  const wrong = await handleLenderSource(new Request(LENDER_PRODUCTION_PINS.lenderOrigin + '/api/my-trusthub/profile-save/source', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  }), { catalog: [], key: pair.publicKey, nonces, pins });
  assert.equal(wrong.status, 400);
  const staged = await stageParentHandoff({
    slug: 'freedom-mortgage', intent: 'save', pageOpen: true, signedIn: true, gate: { broad: false, canary: true, slugs: ['freedom-mortgage'] },
  }, {
    catalog: [{ slug: 'freedom-mortgage', nmlsId: '2767' } as Lender],
    now: () => now,
    browserBinding: browser,
    ...isolatedHandoffDeps({ ...pilotEnv, MY_TRUSTHUB_V23_LENDER_KEY_ID: pair.privateKey.kid, MY_TRUSTHUB_V23_LENDER_SIGNING_PRIVATE_KEY_PEM: pair.privateKey.pem }),
    parent: async (call) => {
      const parsed = JSON.parse(call.body) as { operation: string; input: { version: string } };
      if (parsed.operation === 'prepareGuestProfileTransfer') {
        return { ok: true as const, operation: parsed.operation, result: { transferRef: 't'.repeat(43), manifestDigest: manifestDigest(parsed.input as never), expiresAt: now + 10_000 } };
      }
      return { ok: true as const, operation: parsed.operation, result: { continuationRef: 'c'.repeat(43), expiresAt: now + 5_000 } };
    },
  });
  assert.equal(staged.state, 'continue');
  if (staged.state === 'continue') assert.equal(staged.target, ISOLATED_ASK_ORIGIN + '/my/profile-save');
});
