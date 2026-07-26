import { type NextRequest, NextResponse } from 'next/server';

/**
 * Edge middleware — keep this file free of path-alias imports and Node-only packages.
 * Vercel Edge cannot resolve unsupported module graphs (e.g. @/lib/supabase/* + server-only).
 *
 * Admin gate uses ADMIN_SECRET cookie only. Supabase session refresh lives in
 * Server Components / Route Handlers via @/lib/supabase/server, not Edge.
 */
const ADMIN_COOKIE = 'lth_admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const isLogin = pathname === '/admin/login';
  const isApi = pathname.startsWith('/admin/api');

  if (isLogin || isApi) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SECRET?.trim();
  const cookie = request.cookies.get(ADMIN_COOKIE)?.value;

  if (!secret || cookie !== secret) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only run Edge middleware on admin routes (avoids sitewide Edge bundle cost).
  matcher: ['/admin/:path*'],
};
