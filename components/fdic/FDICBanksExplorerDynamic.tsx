'use client';

import dynamic from 'next/dynamic';
import { ExplorerSkeleton } from '@/components/fdic/ExplorerSkeleton';
import type { StateFDICData } from '@/lib/fdic/types';
import type { StateMeta } from '@/lib/fdic/types';

const FDICBanksExplorer = dynamic(
  () => import('./FDICBanksExplorer').then((m) => ({ default: m.FDICBanksExplorer })),
  { loading: () => <ExplorerSkeleton /> }
);

export function FDICBanksExplorerDynamic({
  stateData,
  stateMeta,
  statePageMode = false,
  stateSlug,
}: {
  stateData: StateFDICData;
  stateMeta: StateMeta;
  statePageMode?: boolean;
  stateSlug?: string;
}) {
  return (
    <FDICBanksExplorer
      stateData={stateData}
      stateMeta={stateMeta}
      statePageMode={statePageMode}
      stateSlug={stateSlug}
    />
  );
}