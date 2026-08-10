import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Landmark } from 'lucide-react';
import { ProgramFinder } from '@/components/programs/ProgramFinder';
import { JsonLd } from '@/components/directory/JsonLd';
import { DPA_GUIDANCE_STATE_SLUGS } from '@/lib/programs/location-notes';

export const metadata: Metadata = {
  title: 'Mortgage Program Finder — FHA, VA, DPA Education | Lender Trust Hub',
  description:
    'Answer a few optional questions to see educational mortgage program fits (FHA, VA, conventional, USDA, DPA). Not an eligibility tool. No lead form.',
  alternates: { canonical: 'https://www.lendertrusthub.com/tools/program-finder' },
};

export default async function ProgramFinderPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const sp = await searchParams;
  const allowed = new Set([...DPA_GUIDANCE_STATE_SLUGS, 'other']);
  const initialStateSlug =
    sp.state && allowed.has(sp.state) ? sp.state : '';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Mortgage Program Finder',
    applicationCategory: 'FinanceApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description:
      'Educational guided overview of common mortgage program types. Does not determine eligibility.',
    url: 'https://www.lendertrusthub.com/tools/program-finder',
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540]/[0.04] via-white to-emerald-50/40">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
            <ol className="flex flex-wrap items-center gap-1">
              <li>
                <Link href="/" className="hover:text-[#059669]">
                  Home
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden />
              <li>
                <Link href="/calculators" className="hover:text-[#059669]">
                  Calculators
                </Link>
              </li>
              <ChevronRight className="h-4 w-4" aria-hidden />
              <li>
                <span className="text-[#0A2540]">Program finder</span>
              </li>
            </ol>
          </nav>
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Landmark className="h-3.5 w-3.5" aria-hidden />
              Free research tool · No lead form
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-4xl">
              Program &amp; assistance finder
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              Explore whether FHA, VA, conventional, USDA, or down-payment assistance themes are
              commonly researched for situations like yours. This is not a qualification decision
              and does not submit your data to lenders.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <ProgramFinder initialStateSlug={initialStateSlug} />
        <p className="mt-10 text-center text-sm text-zinc-500">
          Prefer long-form reading?{' '}
          <Link href="/programs" className="font-medium text-[#059669] hover:underline">
            Browse all program overviews
          </Link>
        </p>
      </div>
    </>
  );
}
