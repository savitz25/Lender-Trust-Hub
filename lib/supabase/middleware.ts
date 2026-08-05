import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from '@/lib/supabase/config';

function hasSupabaseAuthCookies(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((c) => c.name.includes('auth-token') || c.name.startsWith('sb-'));
}

/**
 * Refresh Supabase session cookies on the response when present.
 * Keeps signed-in state sticky across navigations on lendertrusthub.com.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (!isSupabaseConfigured() || !hasSupabaseAuthCookies(request)) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(getSupabaseUrl()!, getSupabaseAnonKey()!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: request.headers },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}
