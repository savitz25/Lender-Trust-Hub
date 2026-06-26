import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { FDICBanksExplorer } from '@/components/fdic/FDICBanksExplorer';
import { STATE_BY_SLUG, US_STATES } from '@/lib/fdic/states';
import { getStateData, DATA_UPDATED } from '@/lib/fdic/stateData';
import {
  buildStateDescription,
  buildStateJsonLd,
  buildStateTitle,
  statePageUrl,
} from '@/lib/fdic/seo';

export function generateStaticParams() {
  return US_STATES.filter((s) => s.hasData).map((s) => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta?.hasData) return { title: 'FDIC Banks | LenderTrustHub' };

  const stateData = getStateData(stateMeta.code);
  if (!stateData) return { title: 'FDIC Banks | LenderTrustHub' };

  const title = buildStateTitle(stateMeta.fullName, stateData.banks.length);
  const description = buildStateDescription(
    stateMeta.fullName,
    stateData.banks.length,
    stateData.updated
  );

  return {
    title,
    description,
    keywords: [
      `FDIC insured banks in ${stateMeta.fullName}`,
      `list of FDIC banks in ${stateMeta.fullName} 2026`,
      `${stateMeta.fullName} FDIC banks`,
      'FDIC bank directory',
      'verified FDIC institutions',
    ],
    openGraph: {
      title,
      description,
      siteName: 'Lender Trust Hub',
      type: 'website',
      url: statePageUrl(slug),
    },
    alternates: {
      canonical: statePageUrl(slug),
    },
  };
}

export default async function FDICStatePage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: slug } = await params;
  const stateMeta = STATE_BY_SLUG.get(slug);
  if (!stateMeta?.hasData) notFound();

  const stateData = getStateData(stateMeta.code);
  if (!stateData) notFound();

  const jsonLd = buildStateJsonLd(stateMeta, stateData);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav
        aria-label="Breadcrumb"
        className="container mx-auto px-4 pt-6 text-sm text-zinc-500"
      >
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-[#00A3A1]">
              Home
            </Link>
          </li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li>
            <Link href="/fdic-insured-banks" className="hover:text-[#00A3A1]">
              FDIC Insured Banks
            </Link>
          </li>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
          <li>
            <span className="text-[#0A2540]">{stateMeta.fullName}</span>
          </li>
        </ol>
      </nav>
      <FDICBanksExplorer
        defaultStateCode={stateMeta.code}
        statePageMode
        stateSlug={slug}
      />
      <section className="border-t border-zinc-200 bg-[#0A2540] py-6 text-center text-xs text-zinc-400">
        Data last updated from FDIC {DATA_UPDATED}. This directory is for informational purposes
        only. Not financial advice. Verify all data at{' '}
        <a
          href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
          className="text-[#00A3A1] underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          FDIC BankFind
        </a>
        .
      </section>
    </>
  );
}