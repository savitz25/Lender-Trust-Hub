'use client';

import { Suspense } from 'react';
import {
  LenderDirectoryClient,
  type LenderDirectoryClientProps,
} from '@/components/directory/LenderDirectoryClient';
import { LENDER_DIRECTORY_PAGE_SIZE } from '@/lib/directory/page-size';

function DirectorySkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-24 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50" />
        ))}
      </div>
    </div>
  );
}

/** Suspense boundary for the progressive lender grid. */
export function LenderDirectoryLoader(props: LenderDirectoryClientProps) {
  return (
    <Suspense fallback={<DirectorySkeleton />}>
      <LenderDirectoryClient pageSize={LENDER_DIRECTORY_PAGE_SIZE} {...props} />
    </Suspense>
  );
}
