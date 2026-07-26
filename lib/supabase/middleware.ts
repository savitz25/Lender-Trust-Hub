/**
 * Supabase session helpers for Node/server runtimes.
 * Do NOT import this from root middleware.ts — Edge bundling fails on the
 * @supabase/ssr + path-alias graph under Vercel.
 *
 * Prefer: createClient() from @/lib/supabase/server in RSC / Route Handlers.
 */

import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/supabase';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/config';

/**
 * Optional helper if you later need session refresh outside Edge middleware
 * (e.g. a Node middleware polyfill or custom server).
 */
export async function refreshSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return supabaseResponse;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return supabaseResponse;
}
