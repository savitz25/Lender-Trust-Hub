import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getSupabaseAnonKey,
  getSupabaseServiceRoleKey,
  getSupabaseUrl,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from '@/lib/supabase/config';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DUMMY_HASH = '0'.repeat(64);

function isPrivilegeDenied(message: string): boolean {
  return /permission denied|not authorized|42501|must be owner|execute privilege|privileges/i.test(
    message
  );
}

function isFunctionHidden(message: string): boolean {
  return /could not find the function|schema cache|does not exist|PGRST202/i.test(message);
}

type RpcClient = {
  from: (t: string) => {
    select: (
      c: string,
      o: { count: 'exact'; head: boolean }
    ) => Promise<{ error: { message: string } | null }>;
  };
  rpc: (
    fn: string,
    args: Record<string, string>
  ) => Promise<{ error: { message: string } | null }>;
};

/** Probe: validates service role + handoff table/RPC (same project as Move). */
export async function GET() {
  const key = getSupabaseServiceRoleKey();
  const url = getSupabaseUrl();
  let tableOk: boolean | null = null;
  let tableError: string | null = null;
  let rpcOk: boolean | null = null;
  let rpcError: string | null = null;
  let serviceRoleValid: boolean | null = null;
  let anonRpcDenied: boolean | null = null;
  let anonRpcError: string | null = null;
  let anonTableSelectDenied: boolean | null = null;
  let anonTableSelectError: string | null = null;

  if (isSupabaseAdminConfigured()) {
    try {
      const admin = createAdminClient() as unknown as RpcClient;

      const { error: tableErr } = await admin
        .from('network_auth_handoffs')
        .select('id', { count: 'exact', head: true });

      if (tableErr) {
        tableOk = false;
        tableError = tableErr.message || 'unknown table error';
        if (/invalid api key|jwt|not authorized/i.test(tableErr.message)) {
          serviceRoleValid = false;
        }
      } else {
        tableOk = true;
        serviceRoleValid = true;
      }

      const { error: rpcErr } = await admin.rpc('consume_network_auth_handoff', {
        p_code_hash: DUMMY_HASH,
        p_to_hub: 'lender',
      });
      if (rpcErr) {
        rpcOk = false;
        rpcError = rpcErr.message || 'unknown rpc error';
        if (/invalid api key|jwt|not authorized/i.test(rpcErr.message)) {
          serviceRoleValid = false;
        }
      } else {
        rpcOk = true;
        if (serviceRoleValid === null) serviceRoleValid = true;
      }
    } catch (e) {
      tableOk = false;
      tableError = e instanceof Error ? e.message : String(e);
      serviceRoleValid = false;
    }
  }

  const anon = getSupabaseAnonKey();
  if (url && anon) {
    try {
      const anonClient = createClient(url, anon, {
        auth: { autoRefreshToken: false, persistSession: false },
      }) as unknown as RpcClient;

      const { error: anonTableErr } = await anonClient
        .from('network_auth_handoffs')
        .select('id', { count: 'exact', head: true });
      if (anonTableErr) {
        anonTableSelectError = anonTableErr.message;
        anonTableSelectDenied =
          isPrivilegeDenied(anonTableErr.message) || isFunctionHidden(anonTableErr.message);
      } else {
        anonTableSelectDenied = false;
      }

      const { error: anonRpcErr } = await anonClient.rpc('consume_network_auth_handoff', {
        p_code_hash: DUMMY_HASH,
        p_to_hub: 'lender',
      });
      if (anonRpcErr) {
        anonRpcError = anonRpcErr.message;
        if (rpcOk === true && (isPrivilegeDenied(anonRpcErr.message) || isFunctionHidden(anonRpcErr.message))) {
          anonRpcDenied = true;
        } else if (isPrivilegeDenied(anonRpcErr.message) || isFunctionHidden(anonRpcErr.message)) {
          anonRpcDenied = true;
        } else {
          anonRpcDenied = false;
        }
      } else {
        anonRpcDenied = false;
      }
    } catch (e) {
      anonRpcError = e instanceof Error ? e.message : String(e);
      anonRpcDenied = null;
    }
  }

  const ok =
    isSupabaseConfigured() &&
    isSupabaseAdminConfigured() &&
    serviceRoleValid === true &&
    tableOk === true &&
    rpcOk === true;

  const consumeRpcServiceRoleOnly =
    rpcOk === true && anonRpcDenied === true ? true : rpcOk === true && anonRpcDenied === false ? false : null;

  return NextResponse.json({
    ok,
    hub: 'lender',
    supabaseConfigured: isSupabaseConfigured(),
    serviceRoleConfigured: isSupabaseAdminConfigured(),
    serviceRole: isSupabaseAdminConfigured(),
    serviceRoleValid,
    serviceRoleKeyLength: key?.length ?? 0,
    supabaseHost: url
      ? (() => {
          try {
            return new URL(url).host;
          } catch {
            return null;
          }
        })()
      : null,
    table: tableOk,
    tableError,
    rpc: rpcOk,
    rpcError,
    wave0Contract: {
      consumeRpcServiceRoleOnly,
      serviceRoleRpc: rpcOk,
      anonRpcDenied,
      anonRpcError,
      anonTableSelectDenied,
      anonTableSelectError,
      note:
        'D1: consume_network_auth_handoff is SERVICE_ROLE_ONLY. Live Wave 0 branch expects consumeRpcServiceRoleOnly=true. Production HOLD — do not treat prod anon EXECUTE as a pass to re-grant.',
    },
    routes: {
      start: '/api/auth/network-handoff/start',
      complete: '/auth/network-handoff',
    },
    hint:
      serviceRoleValid === false
        ? 'SUPABASE_SERVICE_ROLE_KEY rejected — use service_role secret from arepfylnilkjmyduhwbz (same project as Move).'
        : tableOk === false
          ? 'network_auth_handoffs missing — run migration on shared Supabase project'
          : rpcOk === false
            ? 'consume_network_auth_handoff RPC missing'
            : null,
  });
}
