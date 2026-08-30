import { createHash } from 'node:crypto';

const VOLATILE = new Set(['generated_at', 'fingerprint']);

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

export function fingerprintSnapshotPayload(payload: unknown): string {
  const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
  for (const key of VOLATILE) delete copy[key];
  return createHash('sha256').update(canonicalJson(copy)).digest('hex');
}
