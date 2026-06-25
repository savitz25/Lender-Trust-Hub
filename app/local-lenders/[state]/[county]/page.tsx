import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { LenderCard } from '@/components/LenderCard';
import { SearchBar } from '@/components/SearchBar';
import { getLendersByCounty } from '@/lib/lenders';

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}): Promise<Metadata> {
  const { state, county } = await params;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  return {
    title: `Mortgage Lenders in ${countyName} County, ${stateName}`,
    description: `Compare verified mortgage lenders and brokers in ${countyName} County, ${stateName}. NMLS verified with county experience scores.`,
  };
}

export default async function CountyLendersPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; county: string }>;
  searchParams: Promise<{ zip?: string }>;
}) {
  const { state, county } = await params;
  const { zip } = await searchParams;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  const lenders = getLendersByCounty(state, county);
  const countyLabel = `${countyName} County, ${stateName}`;

  return (
    <div className="container mx-auto px-4 py-12">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link href="/" className="hover:text-[#3B82F6]">Home</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><Link href="/local-lenders" className="hover:text-[#3B82F6]">Local Lenders</Link></li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li><span className="text-[#0A2540]">{countyLabel}</span></li>
        </ol>
      </nav>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
          Mortgage Lenders in {countyLabel}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          {lenders.length} verified lender{lenders.length !== 1 ? 's' : ''} ranked by
          county experience score and trust score. {zip ? `Showing results for ZIP ${zip}.` : ''}
        </p>
        <SearchBar className="mt-6 max-w-xl" />
      </div>

      <div className="mx-auto max-w-3xl space-y-4">
        {lenders.length > 0 ? (
          lenders.map((lender, i) => (
            <LenderCard
              key={lender.id}
              lender={lender}
              rank={i + 1}
              countyLabel={countyLabel}
            />
          ))
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-zinc-600">
              We&apos;re expanding coverage in {countyLabel}. Check back soon or{' '}
              <Link href="/local-lenders" className="text-[#3B82F6] underline">
                browse all counties
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}