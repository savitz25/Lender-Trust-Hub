import { createHash } from 'node:crypto';
import type { LenderHomeIntel } from './types';

const VOLATILE = new Set(['generatedAt', 'payloadFingerprint']);

export function fingerprintLenderHomeIntel(value: LenderHomeIntel | Omit<LenderHomeIntel, 'payloadFingerprint'>): string {
  const copy = JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
  for (const key of VOLATILE) delete copy[key];
  return createHash('sha256').update(JSON.stringify(copy)).digest('hex');
}

export const FINGERPRINT_EXCLUSIONS = ['generatedAt', 'payloadFingerprint'] as const;
