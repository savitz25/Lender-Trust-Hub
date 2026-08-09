export {
  cleanNmlsId,
  isValidNumericNmlsId,
  resolveNmlsVerification,
  type NmlsVerificationDisplay,
  type NmlsVerificationLevel,
} from '@/lib/verification/nmls';

export {
  cleanDisplayPhone,
  isLenderPlaceholderPhone,
} from '@/lib/verification/phone';

export {
  NO_CLOSING_PERFORMANCE_LABEL,
  resolveClosingPerformance,
  type ClosingPerformanceDisplay,
  type ClosingPerformanceProvenance,
} from '@/lib/verification/performance-metrics';

export {
  resolveLenderMetricProvenance,
  type LenderMetricBundle,
  type MetricConfidence,
  type MetricProvenance,
} from '@/lib/verification/metric-provenance';

export {
  applyEntityTrustScores,
  coreCompanyName,
  dedupeLendersByEntity,
  getCanonicalSlugForEntity,
  isCanonicalLenderProfile,
  lenderEntityKey,
  pickCanonicalLender,
  resolveNmlsIdentityConflicts,
} from '@/lib/verification/entity-identity';

export {
  catalogDistinctEntities,
  finalizeLenderCatalog,
  sanitizeLender,
} from '@/lib/verification/sanitize-lender';

export {
  countEntitiesByCounty,
  countLenderCatalog,
  type LenderCatalogCounts,
} from '@/lib/verification/counts';
