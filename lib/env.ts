/**
 * Environment variable validation for Lender Trust Hub.
 * Called at build/startup via instrumentation.ts and scripts/validate-env.ts.
 */

export type EnvCheckResult = {
  ok: boolean;
  missing: string[];
  warnings: string[];
};

const PUBLIC_REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

const SERVER_REQUIRED_PROD = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_SECRET',
] as const;

const OPTIONAL = [
  'NEXT_PUBLIC_GA4_ID',
  'NEXT_PUBLIC_SITE_URL',
] as const;

function isSet(key: string): boolean {
  const v = process.env[key];
  return typeof v === 'string' && v.trim().length > 0;
}

export function validateEnv(options?: { strict?: boolean }): EnvCheckResult {
  const strict = options?.strict ?? process.env.NODE_ENV === 'production';
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of PUBLIC_REQUIRED) {
    if (!isSet(key)) missing.push(key);
  }

  if (strict) {
    for (const key of SERVER_REQUIRED_PROD) {
      if (!isSet(key)) missing.push(key);
    }
  } else {
    for (const key of SERVER_REQUIRED_PROD) {
      if (!isSet(key)) warnings.push(`${key} not set (required for admin/seed in production)`);
    }
  }

  for (const key of OPTIONAL) {
    if (!isSet(key)) warnings.push(`${key} not set (optional)`);
  }

  // Validate Supabase URL shape when present
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (url && !url.startsWith('https://') && !url.includes('localhost')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should use https:// in production');
  }

  const ok = missing.length === 0;

  if (!ok) {
    const msg = `[LTH Env] Missing required variables: ${missing.join(', ')}`;
    if (strict) throw new Error(msg);
    console.warn(msg);
  }

  if (warnings.length && process.env.NODE_ENV === 'development') {
    console.info('[LTH Env] Warnings:', warnings.join('; '));
  }

  return { ok, missing, warnings };
}