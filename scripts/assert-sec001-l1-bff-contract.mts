/**
 * TRUST-SEC-001 L1 — Lender App/BFF call-site contract.
 * Fails if consume_network_auth_handoff is invoked from browser/anon paths,
 * or if the SQL grant contract re-grants anon/auth EXECUTE.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const failures: string[] = [];
const assert = (id: string, cond: boolean, detail: string) => {
  if (!cond) failures.push(`${id}: ${detail}`);
  else console.log(`PASS ${id} ${detail}`);
};

const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === '.next') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx|js|jsx|mts|mjs)$/.test(name)) acc.push(p);
  }
  return acc;
}

const consumeRe = /consume_network_auth_handoff/;
const rpcConsumeRe = /\.rpc\(\s*['"]consume_network_auth_handoff['"]/;

const srcFiles = walk(root);
const clientHits: string[] = [];
const rpcHits: string[] = [];

for (const abs of srcFiles) {
  const rel = relative(root, abs).replaceAll('\\', '/');
  if (rel.startsWith('scripts/assert-sec001')) continue;
  const text = readFileSync(abs, 'utf8');
  if (consumeRe.test(text) && /^['"]use client['"]/.test(text.trimStart())) {
    clientHits.push(rel);
  }
  if (rpcConsumeRe.test(text)) rpcHits.push(rel);
}

assert(
  'L1-1',
  clientHits.length === 0,
  `no 'use client' file may mention consume_network_auth_handoff (got ${clientHits.join(', ') || 'none'})`
);

const allowedRpc = new Set([
  'lib/network/network-handoff.ts',
  'app/api/auth/network-handoff/health/route.ts',
]);
const unexpectedRpc = rpcHits.filter((f) => !allowedRpc.has(f));
assert(
  'L1-2',
  unexpectedRpc.length === 0,
  `rpc(consume_network_auth_handoff) only in BFF/health (got ${rpcHits.join(', ') || 'none'})`
);

const handoff = read('lib/network/network-handoff.ts');
assert('L1-3', handoff.includes("import 'server-only'"), 'network-handoff.ts is server-only');
assert(
  'L1-4',
  handoff.includes("createAdminClient") &&
    handoff.includes("adminDb().rpc('consume_network_auth_handoff'") &&
    handoff.includes('SERVICE_ROLE_ONLY'),
  'consume uses createAdminClient / service_role'
);
assert(
  'L1-5',
  handoff.includes("adminDb().from('network_auth_handoffs').insert"),
  'create handoff inserts via admin/service_role'
);

const complete = read('app/auth/network-handoff/route.ts');
assert(
  'L1-6',
  complete.includes('consumeNetworkHandoff') &&
    complete.includes('isSupabaseAdminConfigured') &&
    !rpcConsumeRe.test(complete),
  'complete route consumes via BFF helper, not direct anon rpc'
);

const start = read('app/api/auth/network-handoff/start/route.ts');
assert(
  'L1-7',
  start.includes('createNetworkHandoff') && !rpcConsumeRe.test(start),
  'start route mints via BFF helper'
);

const link = read('components/network/network-handoff-link.tsx');
assert(
  'L1-8',
  link.includes("fetch('/api/auth/network-handoff/start'") &&
    !consumeRe.test(link) &&
    !rpcConsumeRe.test(link),
  'browser link POSTs BFF; never calls consume RPC'
);

const sql = read('supabase/migrations/20260805120000_network_auth_handoffs.sql');
assert(
  'L1-9',
  sql.includes('revoke all on function public.consume_network_auth_handoff(text, text) from public') &&
    sql.includes(
      'grant execute on function public.consume_network_auth_handoff(text, text) to service_role'
    ) &&
    !/grant execute on function public\.consume_network_auth_handoff\(text, text\) to (anon|authenticated)/i.test(
      sql
    ),
  'SQL grant contract is service_role only (no anon/auth EXECUTE)'
);

const health = read('app/api/auth/network-handoff/health/route.ts');
assert(
  'L1-10',
  health.includes('createAdminClient') &&
    health.includes('wave0Contract') &&
    health.includes('anonRpcDenied') &&
    health.includes("getSupabaseAnonKey"),
  'health probes service_role success + anon EXECUTE denied (does not re-grant)'
);

const fetchNat = read('lib/national-profile/fetch.ts');
assert(
  'L1-11',
  fetchNat.includes("import 'server-only'") &&
    fetchNat.includes('createAdminClient') &&
    fetchNat.includes('lender_profile_intelligence') &&
    !fetchNat.includes('lender_cfpb_complaints'),
  'national public profiles read LPI via service_role BFF, not live CFPB tables'
);

const fetchFl = read('lib/florida-profile/fetch-public.ts');
assert(
  'L1-12',
  fetchFl.includes("import 'server-only'") &&
    fetchFl.includes('createAdminClient') &&
    fetchFl.includes('lender_state_company_profiles'),
  'Florida public profiles read via service_role BFF'
);

const cfpbLoad = read('lib/cfpb/load.ts');
const cfpbQueries = read('lib/cfpb/queries.ts');
assert(
  'L1-13',
  cfpbLoad.includes('mortgage-complaints-snapshot.json') &&
    !cfpbQueries.includes('.from(') &&
    !cfpbLoad.includes('lender_cfpb_complaints'),
  'directory CFPB evidence is JSON snapshot, not anon table SELECT'
);

const snaps = read('lib/intel-snapshots/load.ts');
assert(
  'L1-14',
  snaps.includes("import 'server-only'") &&
    snaps.includes('getSupabaseServiceRoleKey') &&
    snaps.includes('PUBLIC_READ') &&
    snaps.includes('Never write with the anon key'),
  'state intel snapshots load server-side; writes not via anon'
);

const identity = read('lib/specialist-execution/identity-store.ts');
assert(
  'L1-15',
  identity.includes('getSupabaseServiceRoleKey') && identity.includes('lender_identifiers'),
  'identity lookups are service_role'
);

const leads = read('lib/supabase/queries/leads.ts');
assert(
  'L1-16',
  leads.includes("import 'server-only'") && leads.includes('createAdminClient'),
  'lead insert is BFF/service_role'
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('OK TRUST-SEC-001 L1 BFF contract assertions');
