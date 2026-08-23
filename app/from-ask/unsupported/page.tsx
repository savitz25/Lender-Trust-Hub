import type { Metadata } from 'next';
import { parseLenderAskHandoff } from '@/lib/search-handoff/parse';
import { resolveLenderAskHandoff } from '@/lib/search-handoff/resolve';
import {
  EmptyCoveragePanel,
  NMLS_CONSUMER_ACCESS_URL,
} from '@/components/research/empty-coverage-panel';

export const metadata: Metadata = {
  title: 'Search not available | LenderTrustHub',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://www.lendertrusthub.com/from-ask/unsupported' },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LenderAskUnsupportedPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = parseLenderAskHandoff(params);
  const dest = ctx ? resolveLenderAskHandoff(ctx) : null;
  const refinance = ctx?.unsupportedCategory === 'refinance' || ctx?.unsupportedCategory === 'refi';
  const officer = ctx?.unsupportedEntity === 'loan_officer';

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <EmptyCoveragePanel
        variant="filtered"
        title={dest?.bannerTitle || 'No matching listings for this search'}
        description={
          dest?.bannerBody ||
          'LenderTrustHub did not substitute a different directory for an unsupported search.'
        }
        primarySources={[
          { href: NMLS_CONSUMER_ACCESS_URL, label: 'NMLS Consumer Access', external: true },
        ]}
        widenLinks={[
          {
            href:
              refinance && ctx?.state === 'TX'
                ? '/local-lenders/texas'
                : officer && ctx?.state === 'FL'
                  ? '/local-lenders/florida'
                  : '/local-lenders',
            label: refinance
              ? 'Browse mortgage companies (optional)'
              : 'Browse local lenders (optional)',
          },
        ]}
      />
      <p className="mt-6 text-sm leading-relaxed text-zinc-600">
        {officer
          ? 'Loan officers were not converted into mortgage companies.'
          : refinance
            ? 'A broader mortgage-company search is optional and requires an explicit click. Refinance was not inferred.'
            : 'This page does not auto-widen to a different provider type or product category.'}
      </p>
    </div>
  );
}
