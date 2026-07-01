/**
 * Next.js instrumentation — validates env on server startup (production).
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('@/lib/env');
    try {
      validateEnv({ strict: process.env.VERCEL === '1' });
    } catch (err) {
      console.error('[LTH] Environment validation failed:', err);
      if (process.env.VERCEL === '1') throw err;
    }
  }
}