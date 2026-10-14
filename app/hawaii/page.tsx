import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const DFI = 'https://www.cca.hawaii.gov/dfi/';
const STATUS = 'https://cca.hawaii.gov/dfi/license-status/';
const SERVICERS = 'https://cca.hawaii.gov/dfi/learn-more-about-mortgage-servicers/';
const MLO_FAQ = 'https://cca.hawaii.gov/dfi/faq-mlo/';
const NMLS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-publication/';
const source = (url: string, label: string) => <a className="underline underline-offset-2" href={url} rel="noopener noreferrer" target="_blank">{label}</a>;

export const metadata: Metadata = {
  title: 'Hawaii mortgage and financial licensing evidence',
  description: 'Hawaii DFI mortgage licensing pathways and separate NMLS and HMDA evidence.',
  alternates: { canonical: `${SITE_URL}/hawaii` },
  robots: { index: true, follow: true },
};

export default function HawaiiLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10 text-slate-900">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / Hawaii research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State intelligence · Hawaii DFI</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Hawaii mortgage and financial licensing evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Hawaii DCCA Division of Financial Institutions supervises state-licensed mortgage servicers and mortgage loan originators, and licenses mortgage loan originator companies. It also supervises state-chartered financial institutions and other regulated financial classes.</p>
    <section className="mt-8 rounded-xl border p-5" aria-labelledby="licensing-status">
      <h2 id="licensing-status" className="text-xl font-semibold">Current licensing populations</h2>
      <p className="mt-3">Current Hawaii mortgage company, branch, lender, broker, servicer, and MLO roster rows and counts are <strong>NOT_ACQUIRED</strong> from a statewide bulk export during this retrieval. DFI provides a license-status lookup and directs relevant records to NMLS. NMLS identifiers alone do not establish current Hawaii authority.</p>
    </section>
    <section className="mt-8" aria-labelledby="separate-grains">
      <h2 id="separate-grains" className="text-2xl font-semibold">Separate populations and clocks</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6 text-slate-700">
        <li>Mortgage companies, branches, and mortgage loan originator persons are different entities.</li>
        <li>Lender, broker, and servicer authority are separate license roles where the source identifies them; state-chartered institutions and other consumer-finance classes are separate.</li>
        <li>NMLS is a licensing identity/system. HMDA is reported mortgage activity on Hawaii properties, not evidence of a license.</li>
        <li>No roster-derived total or HMDA market total is published here.</li>
      </ul>
    </section>
    <section className="mt-8 rounded-xl bg-slate-50 p-5" aria-label="Official sources">
      <h2 className="text-lg font-semibold">Official sources</h2>
      <ul className="mt-3 list-disc space-y-2 pl-6">
        <li>{source(DFI, 'Hawaii DFI')} — regulator and supervised financial classes.</li>
        <li>{source(STATUS, 'DFI license status')} — public status lookup; a bulk roster was not acquired.</li>
        <li>{source(SERVICERS, 'DFI mortgage-servicer guidance')} — servicer scope and requirements.</li>
        <li>{source(MLO_FAQ, 'DFI MLO FAQs')} — MLO and company licensing guidance.</li>
        <li>{source(NMLS, 'NMLS Consumer Access')} — separate company, branch, and person verification.</li>
        <li>{source(HMDA, 'FFIEC HMDA data')} — market activity, separate from licensing.</li>
      </ul>
    </section>
  </main>;
}
