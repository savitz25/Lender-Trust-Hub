import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const AK_DBS = 'https://www.commerce.alaska.gov/web/dbs/ConsumerFinance/MortgageBrokerLendersOriginators';
const LICENSING = 'https://www.commerce.alaska.gov/web/dbs/ConsumerFinance/MortgageLicensingHighlights';
const ENFORCEMENT = 'https://www.commerce.alaska.gov/web/dbs/EnforcementOrders';
const NMLS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-publication/snapshot-national-loan-level-dataset/2025';
const fmt = (n: number) => n.toLocaleString('en-US');
const source = (url: string, label: string) => <a className="underline underline-offset-2" href={url} rel="noopener noreferrer" target="_blank">{label}</a>;

export const metadata: Metadata = {
  title: 'Alaska mortgage and financial licensing evidence',
  description: 'Alaska Division of Banking and Securities licensing sources and separate 2025 HMDA market activity.',
  alternates: { canonical: `${SITE_URL}/alaska` },
  robots: { index: true, follow: true },
};

export default function AlaskaLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link> / Alaska research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State intelligence · Alaska Division of Banking and Securities</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Alaska mortgage and financial licensing evidence</h1>
    <p className="mt-5 text-lg text-slate-700">Alaska’s Division of Banking and Securities administers mortgage broker-lender and mortgage loan originator licensing through NMLS. It does not license mortgage branches as separate Alaska licenses; non-main offices are registered through NMLS. Other consumer-finance, banking, and securities classes remain distinct.</p>
    <section className="mt-10 rounded-xl border p-5"><h2 className="text-2xl font-semibold">Current licensing records</h2><ul className="mt-3 list-disc space-y-2 pl-6 text-sm"><li>Mortgage broker-lender companies: current public row roster and count NOT_ACQUIRED.</li><li>Mortgage loan originator persons: current public row roster and count NOT_ACQUIRED; distinct from companies.</li><li>Branches/non-main offices: registration is separate and not counted as a company or individual license.</li><li>Other consumer-finance and state-chartered bank classes: not included in a mortgage count.</li></ul><p className="mt-3 text-sm">The Department links to live NMLS lookup. No dated state-wide company/person export was acquired in this pass.</p></section>
    <section className="mt-10" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Alaska-property activity</h2>
      <p className="mt-3 text-slate-700">The existing CFPB/FFIEC 2025 HMDA snapshot files report {fmt(19396)} application observations and {fmt(11797)} originations across 17 Alaska county-market rows. A separate lender-state summary contains 195 LEI rows; lender-county activity contains 706 observations across 12 major-market counties and 191 distinct LEIs. These are property-market activity observations, not state license counts. Company LEIs, office registrations, MLO persons, and state license authority are separate.</p>
      <p className="mt-2 text-sm text-slate-600">HMDA data year 2025; repository source freeze June 2, 2026. Existing Alaska HMDA slices were reused and not reloaded. Existing Alaska FDIC data contains five bank records, last updated June 26, 2026, a separate federal institution population.</p>
      <p className="mt-2">{source(HMDA, 'CFPB/FFIEC 2025 HMDA snapshot source')}</p>
    </section>
    <section className="mt-10 border-t pt-6"><h2 className="text-xl font-semibold">Authority, search, and enforcement sources</h2><ul className="mt-3 list-disc space-y-2 pl-6 text-sm"><li>{source(AK_DBS, 'Alaska mortgage brokers, lenders, and originators')}</li><li>{source(LICENSING, 'Mortgage licensing highlights, including branch registration distinctions')}</li><li>{source(NMLS, 'NMLS Consumer Access live search')}</li><li>{source(ENFORCEMENT, 'Division of Banking and Securities enforcement orders')} — mixed regulator programs; classify by issuing program and order, not name alone.</li></ul><p className="mt-4 text-sm">The NMLS sources were checked October 14, 2026 and are live, not date-stamped roster extracts. HMDA is not licensing; complaint and enforcement records are separate from license populations.</p></section>
  </main>;
}
