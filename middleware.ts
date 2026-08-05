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

  return updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2|woff|ttf|otf|xml|txt|webmanifest)$).*)',
  ],
};
