import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Edge middleware:
 * - Admin gate (shared secret cookie)
 * - Supabase session refresh for auth cookies (sitewide, light)
 */
const ADMIN_COOKIE = 'lth_admin_session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
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

  if ((request.nextUrl.searchParams.get('src') || '').toLowerCase() === 'ask') {
    const { parseLenderAskHandoff } = await import('@/lib/search-handoff/parse');
    const {
      isResolvedLenderAskPath,
      resolveLenderAskHandoff,
      shouldRedirectLenderAskEntry,
    } = await import('@/lib/search-handoff/resolve');
    const ctx = parseLenderAskHandoff(request.nextUrl.searchParams);
    if (ctx) {
      const dest = resolveLenderAskHandoff(ctx);
      if (shouldRedirectLenderAskEntry(pathname) && !isResolvedLenderAskPath(pathname, dest)) {
        const destUrl = request.nextUrl.clone();
        const qIndex = dest.href.indexOf('?');
        destUrl.pathname = qIndex === -1 ? dest.href : dest.href.slice(0, qIndex);
        destUrl.search = qIndex === -1 ? '' : dest.href.slice(qIndex);
        return NextResponse.redirect(destUrl, 307);
      }
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2|woff|ttf|otf|xml|txt|webmanifest)$).*)',
  ],
};
