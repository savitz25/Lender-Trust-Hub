#!/usr/bin/env tsx
/**
 * Validate Vercel / local environment before deploy.
 * Usage: npx tsx scripts/validate-env.ts
 *        npm run validate:env
 */
import { validateEnv } from '../lib/env';

const strict = process.argv.includes('--strict') || process.env.CI === 'true';

try {
  const result = validateEnv({ strict });
  console.log('✓ Environment validation passed');
  if (result.warnings.length) {
    console.log('Warnings:');
    result.warnings.forEach((w) => console.log(`  - ${w}`));
  }
  process.exit(0);
} catch (err) {
  console.error('✗ Environment validation failed');
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}