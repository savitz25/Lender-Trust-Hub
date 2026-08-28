/**
 * Fixture intelligence is for local automated tests only.
 * Hosted Preview and Production must never silently serve fixtures.
 */
export function allowNationalProfileFixtures(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  const vercelEnv = env.VERCEL_ENV;
  if (vercelEnv === 'production' || vercelEnv === 'preview') return false;
  if (env.NATIONAL_PROFILE_FORCE_PRODUCTION === '1') return false;
  if (env.VERCEL === '1') return false;
  if (env.NODE_ENV === 'production') return false;
  return env.NATIONAL_PROFILE_ALLOW_FIXTURES === '1';
}

export function isHostedNationalProfileRuntime(
  env: NodeJS.ProcessEnv = process.env
): boolean {
  return env.VERCEL === '1' || env.VERCEL_ENV === 'preview' || env.VERCEL_ENV === 'production';
}
