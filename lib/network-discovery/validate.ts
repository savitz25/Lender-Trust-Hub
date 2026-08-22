import type { NetworkDiscoveryEntity } from './types';

export type ValidationIssue = { path: string; message: string };

const FORBIDDEN = [
  'consumer_email',
  'consumer_phone',
  'account_id',
  'ssn',
  'email',
  'phone',
  'uploaded_document',
  'internal_notes',
  'paid_rank',
  'premium',
  'premium_tier',
  'ranking_boost',
  'trust_score',
  'overall_rating',
  'review_count',
  'reputation_score',
  'is_featured',
  'lead_conversion',
  'google_data',
  'fmcsa_raw',
];

const ENTITY_TYPES = new Set([
  'mortgage_company',
  'mortgage_broker',
  'bank',
  'auto_loan_company',
]);

export function validateDiscoveryEntity(
  entity: NetworkDiscoveryEntity,
  path = 'entity'
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!entity.network_entity_id?.startsWith('lender:')) {
    issues.push({ path: `${path}.network_entity_id`, message: 'must start with lender:' });
  }
  if (entity.hub !== 'lender') {
    issues.push({ path: `${path}.hub`, message: 'must be lender' });
  }
  if (!entity.source_entity_id) {
    issues.push({ path: `${path}.source_entity_id`, message: 'required' });
  }
  if (!ENTITY_TYPES.has(entity.entity_type)) {
    issues.push({ path: `${path}.entity_type`, message: `unsupported ${entity.entity_type}` });
  }
  if (!entity.display_name?.trim()) {
    issues.push({ path: `${path}.display_name`, message: 'required' });
  }
  if (!['active', 'held', 'disabled'].includes(entity.discovery_status)) {
    issues.push({ path: `${path}.discovery_status`, message: 'invalid' });
  }
  try {
    const u = new URL(entity.canonical_profile_url);
    if (u.protocol !== 'https:') {
      issues.push({ path: `${path}.canonical_profile_url`, message: 'https required' });
    }
    if (u.hostname !== 'www.lendertrusthub.com') {
      issues.push({
        path: `${path}.canonical_profile_url`,
        message: `host must be www.lendertrusthub.com got ${u.hostname}`,
      });
    }
    if (!u.pathname.startsWith('/lenders/')) {
      issues.push({ path: `${path}.canonical_profile_url`, message: 'path must be /lenders/{slug}' });
    }
    if ([...u.searchParams.keys()].length > 0) {
      issues.push({
        path: `${path}.canonical_profile_url`,
        message: 'profile URL must not carry query params',
      });
    }
  } catch {
    issues.push({ path: `${path}.canonical_profile_url`, message: 'malformed URL' });
  }
  if (entity.state && !/^[A-Z]{2}$/.test(entity.state)) {
    issues.push({ path: `${path}.state`, message: 'must be USPS 2-letter' });
  }
  for (const bad of FORBIDDEN) {
    if (Object.prototype.hasOwnProperty.call(entity, bad)) {
      issues.push({ path: `${path}.${bad}`, message: 'forbidden field' });
    }
  }
  return issues;
}

export function validateDiscoveryExport(entities: NetworkDiscoveryEntity[]): {
  ok: boolean;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  entities.forEach((e, i) => {
    issues.push(...validateDiscoveryEntity(e, `entities[${i}]`));
    if (ids.has(e.network_entity_id)) {
      issues.push({
        path: `entities[${i}].network_entity_id`,
        message: `duplicate ${e.network_entity_id}`,
      });
    }
    ids.add(e.network_entity_id);
  });
  return { ok: issues.length === 0, issues };
}
