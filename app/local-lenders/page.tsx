import type { Metadata } from 'next';
import Link from 'next/link';
import { LenderCard } from '@/components/LenderCard';
import { SearchBar } from '@/components/SearchBar';
import { filterLenders, getAllCounties } from '@/lib/lenders';
import type { LoanType, CreditTier } from '@/lib/mockData';

export const metadata: Metadata = {
  title: 'Local Lenders Directory',
  description: 'Browse verified mortgage lenders and brokers by county. Filter by loan type, credit tier, and NMLS verification.',
};

export default async function LocalLendersPage({
  searchParams,
}: {
  searchParams: Promise<{
    zip?: string;
    loanType?: string;
    creditTier?: string;
    state?: string;
    county?: string;
  }>;
}) {
  const params = await searchParams;
  const filtered = filterLenders({
    zip: params.zip,
    loanType: params.loanType as LoanType | undefined,
    creditTier: params.creditTier as CreditTier | undefined,
    stateSlug: params.state,
    countySlug: params.county,
    nmlsVerified: true,
  });
  const counties = getAllCounties();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">Local Lenders Directory</h1>
        <p className="mt-3 text-zinc-600">
          Hyper-local search by ZIP or county. All lenders NMLS verified.
        </p>
        <SearchBar className="mt-6" />
      </div>

      {(params.loanType || params.creditTier || params.zip) && (
        <div className="mb-6 flex flex-wrap gap-2 justify-center">
          {params.zip && (
            <span className="trust-badge">ZIP: {params.zip}</span>
          )}
          {params.loanType && (
            <span className="trust-badge">Loan: {params.loanType}</span>
          )}
          {params.creditTier && (
            <span className="trust-badge">Credit: {params.creditTier}</span>
          )}
        </div>
      )}

      <div className="mx-auto mb-12 max-w-3xl space-y-4">
        {filtered.length > 0 ? (
          filtered.map((lender, i) => (
            <LenderCard
              key={lender.id}
              lender={lender}
              rank={i + 1}
              countyLabel={`${lender.county} County, ${lender.state}`}
            />
          ))
        ) : (
          <p className="text-center text-zinc-500">
            No lenders found for your search. Try a different ZIP or browse counties below.
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-6 text-center text-2xl font-bold text-[#0A2540]">
          Browse by County
        </h2>
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 md:grid-cols-3">
          {counties.map((c) => (
            <Link
              key={`${c.stateSlug}/${c.countySlug}`}
              href={`/local-lenders/${c.stateSlug}/${c.countySlug}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-[#3B82F6]"
            >
              <div className="font-semibold text-[#0A2540]">
                {c.county} County
              </div>
              <div className="text-sm text-zinc-500">
                {c.state} · {c.lenderCount} lender{c.lenderCount !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}