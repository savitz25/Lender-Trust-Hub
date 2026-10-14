import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const DFI = 'https://www.nd.gov/dfi/';
const FAQ = 'https://www.nd.gov/dfi/about-dfi/non-depository/frequently-asked-questions-non-depository';
const NMLS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-publication/snapshot-national-loan-level-dataset/2025';
const HMDA_RELEASE = 'https://www.consumerfinance.gov/about-us/newsroom/2025-hmda-data-on-mortgage-lending-now-available/';

const source = (url: string, label: string) => (
  <a className="underline underline-offset-2" href={url} rel="noopener noreferrer" target="_blank">{label}</a>
);

export const metadata: Metadata = {
  title: 'North Dakota mortgage and financial licensing evidence | LenderTrustHub',
  description: 'North Dakota Department of Financial Institutions licensing framework, NMLS source limits, existing 2025 HMDA market activity, and separate bank records.',
  alternates: { canonical: `${SITE_URL}/north-dakota` },
  robots: { index: true, follow: true },
};

export default function NorthDakotaLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / North Dakota research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State licensing · North Dakota Department of Financial Institutions</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">North Dakota mortgage and financial licensing evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The North Dakota Department of Financial Institutions (DFI) administers state non-depository mortgage licensing and participates in NMLS. North Dakota state-chartered banks and credit unions are a separate charter population; federally chartered institutions are not regulated by DFI.</p>

    <section className="mt-10 rounded-xl border p-5" aria-labelledby="licensing-populations">
      <h2 id="licensing-populations" className="text-2xl font-semibold">Licensing populations</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-slate-700">
        <li>Residential mortgage lender companies: DFI requires a state license for covered residential mortgage lending. Current company rows and status counts: <strong>NOT_ACQUIRED</strong>.</li>
        <li>Mortgage loan originators: DFI requires individual MLO licensing unless an exemption applies. Current person rows and status counts: <strong>NOT_ACQUIRED</strong>.</li>
        <li>Residential mortgage loan servicers: a separate DFI/NMLS licensing population; current company rows and counts: <strong>NOT_ACQUIRED</strong>.</li>
        <li>Branches: DFI treats branch locations separately for residential mortgage lender licensing. No branch count is reported as a company count.</li>
        <li>Money brokers: DFI licenses money brokers as a separate non-depository class. This broader class is not presented as a mortgage-broker census.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-700">DFI directs the public to NMLS Consumer Access for company and individual license lookup. No current, source-native statewide export was acquired. NOT_ACQUIRED does not mean no licensees exist.</p>
    </section>

    <section className="mt-10 rounded-xl border p-5" aria-labelledby="hmda-activity">
      <h2 id="hmda-activity" className="text-2xl font-semibold">Existing 2025 HMDA market activity</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-700">The existing TrustHub 2025 HMDA North Dakota slice contains 18 market rows, 1,169 lender-market activity observations, 277 LEI state-summary rows, and 103 high-confidence LEI-to-directory mappings across 16 named major markets. These are HMDA market and identifier observations, not licensees, branches, or MLO persons. HMDA market activity is not a licensing census.</p>
      <p className="mt-3 text-sm text-slate-700"><strong>Source clock:</strong> 2025 HMDA reporting vintage; CFPB announced availability on March 31, 2026. This page reuses the existing North Dakota slice and does not reload or reinterpret it as licensing data.</p>
    </section>

    <section className="mt-10" aria-labelledby="bank-populations">
      <h2 id="bank-populations" className="text-2xl font-semibold">Bank records remain separate</h2>
      <p className="mt-3 text-sm text-slate-700">The DFI’s state-chartered bank, credit-union, and trust-company populations are separate from non-depository mortgage licenses and HMDA activity. Existing FDIC bank data are retained in TrustHub; no current charter count is stated here because the retained file does not establish a current source clock or a complete DFI charter population.</p>
    </section>

    <section className="mt-10 rounded-xl bg-slate-50 p-5" aria-label="Official sources and clocks">
      <h2 className="text-lg font-semibold">Official sources and clocks</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-sm">
        <li>{source(DFI, 'North Dakota Department of Financial Institutions')} — regulator scope and chartered-institution responsibilities; checked October 14, 2026.</li>
        <li>{source(FAQ, 'DFI non-depository licensing FAQs')} — NMLS lookup, MLO, residential mortgage lender, servicer, branch, and money-broker distinctions; checked October 14, 2026.</li>
        <li>{source(NMLS, 'NMLS Consumer Access')} — public company/person license lookup; no statewide export rows acquired.</li>
        <li>{source(HMDA, 'CFPB/FFIEC 2025 HMDA data')} and {source(HMDA_RELEASE, 'CFPB 2025 HMDA release')} — 2025 market-activity source and publication clock.</li>
      </ul>
      <p className="mt-3 text-sm text-slate-600">Mortgage company, branch, servicer, MLO person, bank charter, and HMDA records remain separate. No licensing total, status distribution, or enforcement count is inferred from HMDA or FDIC data.</p>
    </section>
  </main>;
}
