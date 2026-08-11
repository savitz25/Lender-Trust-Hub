import type { Metadata } from 'next';
import { LoanEstimateAnalyzerEmbed } from '@/components/embed/loan-estimate-analyzer-embed';
import { resolveLeEmbedParams } from '@/lib/embed/le-analyzer-params';
import { buildAnalyzerBootstrap } from '@/lib/tools/loan-estimate-analyzer/serialize-context';

export const metadata: Metadata = {
  title: 'Loan Estimate Analyzer Embed',
  description:
    'Research-only Loan Estimate fee bands embed. Educational — not underwriting. No lead form.',
  robots: { index: false, follow: true },
};

export const revalidate = 86400;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Stage C.2 — Loan Estimate Analyzer Embed
 *
 * /embed/loan-estimate-analyzer?lender=…&county=miami-dade&state=FL&src=partner
 */
export default async function LoanEstimateAnalyzerEmbedPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const bootstrap = await buildAnalyzerBootstrap();
  const resolved = resolveLeEmbedParams(sp, bootstrap);

  return (
    <main className="p-3 sm:p-4">
      <LoanEstimateAnalyzerEmbed
        bootstrap={bootstrap}
        initialLenderSlug={resolved.lenderSlug}
        initialCountySlug={resolved.countyOptionSlug}
        contextNote={resolved.contextNote}
        embedSrc={resolved.embedSrc}
      />
    </main>
  );
}
