export const NATIONAL_SNAPSHOT_CONTRACT = 'lender-home-intel-snapshot-v2' as const;
export const FLORIDA_SNAPSHOT_CONTRACT = 'lender-fl-state-intel-v2' as const;
export const NEW_JERSEY_SNAPSHOT_CONTRACT = 'lender-nj-state-intel-v1' as const;

export type SnapshotGeography = 'NATIONAL' | 'FL' | 'NJ';
export type SnapshotPublicationStatus = 'draft' | 'published' | 'superseded';

export type SnapshotLoadSource = 'published' | 'superseded' | 'accepted_artifact';

export type SnapshotLoadResult<T> =
  | { status: 'ok'; source: SnapshotLoadSource; payload: T; fingerprint: string; generatedAt: string }
  | { status: 'unavailable'; reason: string };
