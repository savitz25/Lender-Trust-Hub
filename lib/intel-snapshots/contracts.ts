export const NATIONAL_SNAPSHOT_CONTRACT = 'lender-home-intel-snapshot-v2' as const;
export const FLORIDA_SNAPSHOT_CONTRACT = 'lender-fl-state-intel-v2' as const;
export const NEW_JERSEY_SNAPSHOT_CONTRACT = 'lender-nj-state-intel-v1' as const;
export const CALIFORNIA_SNAPSHOT_CONTRACT = 'lender-ca-state-intel-v1' as const;
export const TEXAS_SNAPSHOT_CONTRACT = 'lender-tx-state-intel-v1' as const;
export const WASHINGTON_SNAPSHOT_CONTRACT = 'lender-wa-state-intel-v1' as const;
export const ARIZONA_SNAPSHOT_CONTRACT = 'lender-az-state-intel-v1' as const;
export const COLORADO_SNAPSHOT_CONTRACT = 'lender-co-state-intel-v1' as const;
export const VIRGINIA_SNAPSHOT_CONTRACT = 'lender-va-state-intel-v1' as const;
export const NEW_YORK_SNAPSHOT_CONTRACT = 'lender-ny-state-intel-v1' as const;
export const ILLINOIS_SNAPSHOT_CONTRACT = 'lender-il-state-intel-v1' as const;

export type SnapshotGeography = 'NATIONAL' | 'FL' | 'NJ' | 'CA' | 'TX' | 'WA' | 'AZ' | 'CO' | 'VA' | 'NY' | 'IL';
export type SnapshotPublicationStatus = 'draft' | 'published' | 'superseded';

export type SnapshotLoadSource = 'published' | 'superseded' | 'accepted_artifact';

export type SnapshotLoadResult<T> =
  | { status: 'ok'; source: SnapshotLoadSource; payload: T; fingerprint: string; generatedAt: string }
  | { status: 'unavailable'; reason: string };
