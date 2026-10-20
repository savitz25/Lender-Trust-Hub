import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { MY_TRUSTHUB_ACCOUNT_ENTRY_HREF } from './account-presentation';
import { handoffForm, handoffParentOrigin, ISOLATED_ASK_ORIGIN, LENDER_PARENT_ORIGIN, profileSignInHref } from './handoff-form';
import { exactIsolatedLenderOrigin, ISOLATED_PROJECT, isolatedLenderPins } from './isolated-pilot';
import { signLenderAssertion, verifyLenderAssertion } from './lender-assertion';
import { PARENT_ORIGIN } from './manifest';
import { parentProtectionHeader } from './signed-handoff';

/** Hardcoded origins. These assertions do not follow a renamed constant. */
const B4 = 'https://conumers-trust-hub-git-b4-lender-ask-710157-savitz25-s-projects.vercel.app';
const PARE = 'https://conumers-trust-hub-git-mth-v2-3-pare-3127df-savitz25-s-projects.vercel.app';
const MOVE = 'https://move-trust-hub-git-mth-v2-3-move-cur-0a05f1-savitz25-s-projects.vercel.app';
const PRODUCTION_ASK = 'https://www.asktrusthub.com';
const LENDER = 'https://lender-pilot.preview.example';
const browser = 'b'.repeat(43);
const now = 1_700_000_000_000;

function agreedEnv(parent = B4, publicParent = parent) {
  return {
    VERCEL_ENV: 'preview',
    MY_TRUSTHUB_V23_PARENT_ORIGIN: parent,
    NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN: publicParent,
    MY_TRUSTHUB_V23_LENDER_ORIGIN: LENDER,
    MY_TRUSTHUB_V23_ISOLATED_PROJECT: ISOLATED_PROJECT,
  };
}

function claimsOf(token: string): { aud: string; ask_origin: string; lender_origin: string; iss: string } {
  return JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString('utf8'));
}

test('the isolated Ask origin is the B4 alias', () => {
  assert.equal(ISOLATED_ASK_ORIGIN, B4);
  assert.equal(LENDER_PARENT_ORIGIN, PRODUCTION_ASK);
  assert.equal(PARENT_ORIGIN, PRODUCTION_ASK);
  const pins = isolatedLenderPins(agreedEnv());
  assert.deepEqual(pins, { parentOrigin: B4, lenderOrigin: LENDER, project: ISOLATED_PROJECT, assertionEnvironment: 'isolated' });
  assert.equal(handoffParentOrigin(B4), B4);
  assert.equal(pins?.parentOrigin, handoffParentOrigin(agreedEnv().NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN));
  assert.equal(handoffForm(B4 + '/my/profile-save', browser, 'save', handoffParentOrigin(B4))?.action, B4 + '/my/profile-save');
});

test('a mixed retained pare parent does not agree with the B4 server pins', () => {
  assert.equal(isolatedLenderPins(agreedEnv(PARE, B4)), null);
  assert.equal(isolatedLenderPins(agreedEnv(PARE, PARE)), null);
  assert.equal(handoffParentOrigin(PARE), PRODUCTION_ASK);
  assert.equal(handoffForm(PARE + '/my/profile-save', browser, 'save', handoffParentOrigin(PARE)), null);
  assert.equal(handoffForm(B4 + '/my/profile-save', browser, 'save', handoffParentOrigin(PARE)), null);
  const serverOnly = isolatedLenderPins(agreedEnv(B4, PARE));
  assert.equal(serverOnly?.parentOrigin, B4);
  assert.notEqual(serverOnly?.parentOrigin, handoffParentOrigin(PARE));
  assert.equal(handoffForm(PARE + '/my/profile-save', browser, 'save', handoffParentOrigin(B4)), null);
});

test('browser handoff and server pins agree when both parent values are the B4 alias', () => {
  const env = agreedEnv(B4, B4);
  const pins = isolatedLenderPins(env);
  const browserOrigin = handoffParentOrigin(env.NEXT_PUBLIC_MY_TRUSTHUB_V23_PARENT_ORIGIN);
  assert.equal(browserOrigin, B4);
  assert.equal(pins?.parentOrigin, browserOrigin);
  assert.equal(handoffForm(B4 + '/my/profile-save', browser, 'save', browserOrigin)?.action, B4 + '/my/profile-save');
  assert.equal(handoffForm(PRODUCTION_ASK + '/my/profile-save', browser, 'save', browserOrigin), null);
  assert.equal(handoffParentOrigin(undefined), PRODUCTION_ASK);
  assert.equal(handoffForm(B4 + '/my/profile-save', browser, 'save'), null);
});

test('the B4 host, the retained pare host, the Move preview host, and production hosts are rejected as Lender destinations', () => {
  assert.equal(exactIsolatedLenderOrigin(LENDER), LENDER);
  for (const rejected of [
    B4, PARE, MOVE, PRODUCTION_ASK, 'https://asktrusthub.com',
    'https://www.consumerstrusthub.com', 'https://consumerstrusthub.com',
    'https://www.movetrusthub.com', 'https://movetrusthub.com',
    'https://www.lendertrusthub.com', 'https://lendertrusthub.com',
    'https://www.insurancetrusthub.com', 'https://insurancetrusthub.com',
    'https://www.contractortrusthub.com', 'https://contractortrusthub.com',
    'https://www.seniortrusthub.com', 'https://seniortrusthub.com',
    'https://www.investortrusthub.com', 'https://investortrusthub.com',
    LENDER + '/lenders/freedom-mortgage', LENDER + '?next=/',
  ]) assert.equal(exactIsolatedLenderOrigin(rejected), null, rejected);
  assert.equal(isolatedLenderPins({ ...agreedEnv(), MY_TRUSTHUB_V23_LENDER_ORIGIN: B4 }), null);
  assert.equal(isolatedLenderPins({ ...agreedEnv(), MY_TRUSTHUB_V23_LENDER_ORIGIN: PARE }), null);
  assert.equal(isolatedLenderPins({ ...agreedEnv(), MY_TRUSTHUB_V23_LENDER_ORIGIN: MOVE }), null);
  assert.equal(isolatedLenderPins({ ...agreedEnv(), MY_TRUSTHUB_V23_LENDER_ORIGIN: 'https://www.lendertrusthub.com' }), null);
});

test('the signed audience and the protection header use the B4 origin', async () => {
  const pair = generateKeyPairSync('ed25519');
  const privateKey = { kid: 'lender-pilot-fixture', pem: pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString() };
  const publicKey = { kid: 'lender-pilot-fixture', pem: pair.publicKey.export({ type: 'spki', format: 'pem' }).toString() };
  const pins = isolatedLenderPins(agreedEnv())!;
  const body = Buffer.from('{"action":"resolve"}');
  const target = B4 + '/api/my-trusthub/profile-save';
  const token = signLenderAssertion(privateKey, 'lender', target, 'transfer:stage', body, browser, null, null, now, pins);
  assert.equal(claimsOf(token).aud, target);
  assert.equal(claimsOf(token).ask_origin, B4);
  assert.equal(claimsOf(token).iss, `urn:trusthub:v23:${ISOLATED_PROJECT}:lender`);
  const claims = await verifyLenderAssertion(new Request(target, { method: 'POST', headers: { 'x-trusthub-v23-assertion': token }, body }), body, publicKey, 'lender', 'transfer:stage', { claim: async () => true }, now, pins);
  assert.equal(claims.ask_origin, B4);
  assert.equal(claims.lender_origin, LENDER);
  assert.throws(() => signLenderAssertion(privateKey, 'lender', PARE + '/api/my-trusthub/profile-save', 'transfer:stage', body, browser, null, null, now, pins));
  await assert.rejects(verifyLenderAssertion(new Request(PARE + '/api/my-trusthub/profile-save', { method: 'POST', headers: { 'x-trusthub-v23-assertion': token }, body }), body, publicKey, 'lender', 'transfer:stage', { claim: async () => true }, now, pins));
  assert.deepEqual(parentProtectionHeader(B4, target, 'fixture-parent-bypass'), { 'x-vercel-protection-bypass': 'fixture-parent-bypass' });
  assert.deepEqual(parentProtectionHeader(B4, PARE + '/api/my-trusthub/profile-save', 'fixture-parent-bypass'), {});
  assert.deepEqual(parentProtectionHeader(B4, PRODUCTION_ASK + '/api/my-trusthub/profile-save', 'fixture-parent-bypass'), {});
  assert.deepEqual(parentProtectionHeader(B4, target, '  '), {});
});

test('production handoff stays on www.asktrusthub.com', () => {
  assert.equal(isolatedLenderPins({ ...agreedEnv(), VERCEL_ENV: 'production' }), null);
  assert.equal(isolatedLenderPins({ ...agreedEnv(), MY_TRUSTHUB_V23_PARENT_ORIGIN: PRODUCTION_ASK }), null);
  assert.equal(handoffParentOrigin(PRODUCTION_ASK), PRODUCTION_ASK);
  assert.equal(handoffForm(PRODUCTION_ASK + '/my/profile-save', browser, 'save', handoffParentOrigin(PRODUCTION_ASK))?.action, PRODUCTION_ASK + '/my/profile-save');
  assert.equal(handoffForm(B4 + '/my/profile-save', browser, 'save', PRODUCTION_ASK), null);
  assert.equal(handoffForm(PARE + '/my/profile-save', browser, 'save', PRODUCTION_ASK), null);
});

test('the profile sign-in href is the B4 alias only for that exact public parent', () => {
  assert.equal(MY_TRUSTHUB_ACCOUNT_ENTRY_HREF, PRODUCTION_ASK + '/my/sign-in');
  assert.equal(profileSignInHref(B4), B4 + '/my/sign-in');
  assert.equal(profileSignInHref(undefined), MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
  assert.equal(profileSignInHref(PARE), MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
  assert.equal(profileSignInHref(MOVE), MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
  assert.equal(profileSignInHref(PRODUCTION_ASK), MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
  assert.equal(profileSignInHref(''), MY_TRUSTHUB_ACCOUNT_ENTRY_HREF);
  const source = readFileSync(join(process.cwd(), 'components', 'my-lending', 'save-lender-button.tsx'), 'utf8');
  assert.match(source, /const isolatedSignIn = handoffParentOrigin\(\) === ISOLATED_ASK_ORIGIN/);
  assert.match(source, /const signInHref = isolatedSignIn \? profileSignInHref\(\) : MY_TRUSTHUB_ACCOUNT_ENTRY_HREF/);
  assert.match(source, /href=\{signInHref\}/);
  assert.match(source, /onClick=\{\(event\) => \{\s*event\.preventDefault\(\);\s*void beginHandoff\('save_signin'\);/s);
  assert.match(source, /onAuxClick=\{isolatedSignIn \? \(event\) => \{\s*if \(event\.button !== 1\) return;\s*event\.preventDefault\(\);\s*void beginHandoff\('save_signin'\);/s);
  assert.equal(source.includes('https://www.asktrusthub.com/my/sign-in'), false);
});
