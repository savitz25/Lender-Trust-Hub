import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const BANKING = 'https://www.banking.nh.gov/';
const ANNUAL = 'https://www.banking.nh.gov/sites/g/files/ehbemt621/files/inline-documents/sonh/fy24-annual-report.pdf';
const NMLS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-browser/data/2025?actions_taken=1&category=states';
const fmt = (n: number) => n.toLocaleString('en-US');
const source = (url: string, label: string) => <a className="underline" href={url} rel="noopener noreferrer" target="_blank">{label}</a>;

export const metadata: Metadata = {
  title: 'New Hampshire mortgage and consumer finance evidence',
  description: 'Separate New Hampshire banking and NMLS licensing records from 2025 mortgage-market activity.',
  alternates: { canonical: `${SITE_URL}/new-hampshire` },
  robots: { index: true, follow: true },
};

export default function NewHampshireLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link><span aria-hidden="true"> / </span>New Hampshire research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State intelligence · New Hampshire</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">New Hampshire mortgage and consumer-finance evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The New Hampshire Banking Department regulates state-chartered banking institutions and administers licensing programs using NMLS. Mortgage activity on New Hampshire property is reported separately through HMDA. An NMLS identity or HMDA observation does not by itself establish a current New Hampshire license.</p>

    <section className="mt-10" aria-label="Licensing populations"><h2 className="text-2xl font-semibold">Licensing populations</h2>
      <p className="mt-3 text-slate-700">{source(BANKING, 'New Hampshire Banking Department')} identifies the state regulator. Its {source(ANNUAL, 'FY2024 annual report')} describes NMLS administration. Check current jurisdiction-specific status through {source(NMLS, 'NMLS Consumer Access')} and the responsible state regulator.</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm">
        <li>Mortgage lender and mortgage broker companies: NOT_ACQUIRED as a current state roster.</li>
        <li>Branches: a separate company-location population; NOT_ACQUIRED.</li>
        <li>Mortgage loan originator persons: separate from companies and branches; NOT_ACQUIRED.</li>
        <li>Mortgage servicers and other consumer-finance license classes: separate state classes; current dated rows NOT_ACQUIRED.</li>
        <li>Bank charters, NMLS identities, and state mortgage authority are not combined.</li>
      </ul>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA New Hampshire-property activity</h2>
      <p className="mt-3 text-slate-700">The existing 2025 HMDA slice contains {fmt(57640)} applications, {fmt(35576)} originations, and {fmt(9485)} denials across 10 county market rows. It also contains 2,229 lender-county activity observations and 475 LEI state-summary rows. These are property-market activity and reporting-entity observations, not license counts. The source inventory has 98 high-confidence LEI-to-directory mappings; those mappings are not state licensing verification. {source(HMDA, 'Open the CFPB/FFIEC 2025 HMDA source')}.</p>
      <p className="mt-2 text-sm text-slate-600">Existing source files: <code>data/hmda/new-hampshire/</code>. Data year: 2025. No company, branch, and person totals are merged.</p>
    </section>

    <section className="mt-12 border-t pt-5"><h2 className="text-xl font-semibold">Source clocks and limits</h2><p className="mt-2 text-sm">HMDA vintage 2025; source slice is the repository's national 2025 foundation. The NH Banking Department annual report is FY2024 and provides regulatory context, not a current license count. NMLS Consumer Access is a live verification service and was not acquired as a dated statewide extract. No unified New Hampshire lender total is asserted. Company ≠ branch ≠ person; HMDA ≠ licensing.</p><p className="mt-3 text-sm"><Link className="underline" href="/ask?q=New%20Hampshire%20mortgage%20license">Ask about New Hampshire mortgage licensing</Link></p></section>
  </main>;
}
