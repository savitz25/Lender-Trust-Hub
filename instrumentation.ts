/**
 * Next.js instrumentation — validates env on server startup (production).
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env');
    try {
      // Never throw on Vercel boot — missing Supabase must not take down static pages.
      validateEnv({ strict: false });
    } catch (err) {
      console.error('[LTH] Environment validation failed:', err);
    }
  }
}