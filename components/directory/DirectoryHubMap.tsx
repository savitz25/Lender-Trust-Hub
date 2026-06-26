'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { US_STATES } from '@/lib/fdic/states';
const USMap = dynamic(
  () => import('@/components/fdic/USMap').then((m) => ({ default: m.USMap })),
  {
    loading: () => (
      <div className="flex h-[320px] animate-pulse items-center justify-center rounded-2xl bg-zinc-100 md:h-[420px]">
        <span className="text-sm text-zinc-400">Loading map…</span>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Reusable interactive map for any directory vertical.
 * Pass category config — navigates to category.statePath(slug) on click.
 */
export function DirectoryHubMap({
  statePathPrefix,
  defaultStateCode = 'FL',
  availableSlugs,
}: {
  /** e.g. /fdic-insured-banks — serializable for client boundary */
  statePathPrefix: string;
  defaultStateCode?: string;
  availableSlugs?: string[];
}) {
  const router = useRouter();
  const slugSet = availableSlugs ? new Set(availableSlugs) : null;
  const availableCodes = new Set(
    US_STATES.filter((s) => {
      if (slugSet) return slugSet.has(s.slug);
      return s.hasData;
    }).map((s) => s.code)
  );

  return (
    <USMap
      selectedCode={defaultStateCode}
      availableCodes={availableCodes}
      onSelect={(code) => {
        const meta = US_STATES.find((s) => s.code === code);
        if (meta) router.push(`${statePathPrefix}/${meta.slug}`);
      }}
    />
  );
}