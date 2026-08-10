import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Landmark } from 'lucide-react';
import { getAllPrograms } from '@/lib/programs';
import { ProgramCard } from '@/components/programs/ProgramCard';
import { ProgramDisclaimer } from '@/components/programs/ProgramDisclaimer';
import { JsonLd } from '@/components/directory/JsonLd';

export const metadata: Metadata = {
  title: 'Mortgage Programs Overview — FHA, VA, Conventional, DPA | Lender Trust Hub',
  description:
    'Educational overviews of FHA, VA, conventional, USDA, and down-payment assistance themes. Independent research — not eligibility determination or a lead form.',
  alternates: { canonical: 'https://www.lendertrusthub.com/programs' },
};

export default function ProgramsHubPage() {
  const programs = getAllPrograms();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Mortgage program overviews',
    description:
      'Educational guides to common mortgage program types for independent research.',
    url: 'https://www.lendertrusthub.com/programs',
  };

  return (
    <>
      <JsonLd data={schema} />
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540]/[0.04] via-white to-sky-50/40">
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
                <span className="text-[#0A2540]">Programs</span>
              </li>
            </ol>
          </nav>
          <div className="mx-auto max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">
              <Landmark className="h-3.5 w-3.5" aria-hidden />
              Educational · No application form
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0A2540] md:text-4xl">
              Mortgage programs &amp; assistance
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-zinc-600">
              High-level guides to programs people commonly research—FHA, VA, conventional, USDA,
              and down-payment assistance. Not a qualification tool. We show the public record. You
              decide.
            </p>
            <Link
              href="/tools/program-finder"
              className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#0A2540] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
            >
              Try the program finder
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((p) => (
            <ProgramCard key={p.id} program={p} />
          ))}
        </div>
        <ProgramDisclaimer className="mx-auto mt-10 max-w-3xl" />
      </div>
    </>
  );
}
