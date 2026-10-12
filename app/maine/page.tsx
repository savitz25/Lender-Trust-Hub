import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';
import summary from '@/data/maine-lend-001/summary.json';

const BCCP = 'https://www.maine.gov/pfr/consumercredit/license_search.htm';
const SUPERVISED = 'https://www.maine.gov/pfr/consumercredit/industry/licensing/supervised_lender.htm';
const NMLS_INFO = 'https://www.maine.gov/pfr/consumercredit/industry/licensing/nmls.html';
const NMLS_ACCESS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-publication/snapshot-national-loan-level-dataset/2025';
const fmt = (n: number) => n.toLocaleString('en-US');
const source = (url: string, label: string) => <a className="underline underline-offset-2" href={url} rel="noopener noreferrer" target="_blank">{label}</a>;

export const metadata: Metadata = {
  title: 'Maine mortgage and consumer-credit licensing evidence',
  description: 'Maine BCCP licensing pathways and separate 2025 HMDA property-market activity.',
  alternates: { canonical: `${SITE_URL}/maine` },
  robots: { index: true, follow: true },
};

export default function MaineLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link><span aria-hidden="true"> / </span>Maine research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State intelligence · Maine BCCP</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Maine mortgage and consumer-credit evidence</h1>
    <p className="mt-5 text-lg text-slate-700">Maine's Bureau of Consumer Credit Protection (BCCP) administers nonbank consumer-credit license classes, including supervised lenders, loan brokers, and mortgage loan originators through NMLS. HMDA reports activity on Maine properties. Neither an NMLS identity nor HMDA activity proves a current Maine license.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Maine evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Current BCCP license status</p><p className="mt-2 text-2xl font-bold">Live verification</p><p className="mt-2 text-sm">Company, branch, and MLO person records are separate; roster rows and counts NOT_ACQUIRED.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(summary.applications)}</p><p className="mt-2 text-sm">Maine-property transactions, not a license count.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA originations</p><p className="mt-2 text-2xl font-bold">{fmt(summary.originations)}</p><p className="mt-2 text-sm">Across {summary.county_market_rows} county market rows.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">BCCP licensing classes</h2>
      <p className="mt-3 text-slate-700">BCCP's {source(BCCP, 'licensee search')} sends NMLS status checks to {source(NMLS_ACCESS, 'NMLS Consumer Access')}. It lists mortgage loan originators, supervised lenders (including mortgage lenders and servicers as well as other consumer-credit businesses), and loan brokers, among other NMLS classes. {source(SUPERVISED, 'Supervised-lender requirements')} are broader than a mortgage-only lender category. {source(NMLS_INFO, 'BCCP NMLS information')} states that NMLS is the application and licensing system; an NMLS identity by itself is not state authority.</p>
      <ul className="mt-4 list-disc space-y-2 pl-6 text-sm"><li>Company authorization: NOT_ACQUIRED as a current roster.</li><li>Branch licenses: NOT_ACQUIRED as a separate current roster.</li><li>MLO person licenses: NOT_ACQUIRED as a separate current roster.</li><li>Loan brokers and non-mortgage BCCP classes: NOT_ACQUIRED; not counted as mortgage lenders.</li></ul>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Maine-property activity</h2>
      <p className="mt-3 text-slate-700">The committed county market slice reports {fmt(summary.applications)} applications, {fmt(summary.originations)} originations, and {fmt(summary.denials)} denials across 16 Maine counties. The source is the CFPB/FFIEC 2025 snapshot national LAR, with a June 2, 2026 data freeze. These are loan/application observations grouped by property geography; this is not the number of licensed Maine companies or people.</p>
      <p className="mt-2 text-sm text-slate-600">The separate source extracts contain {fmt(summary.state_summary_lei_rows)} state-summary LEI rows and {fmt(summary.lender_county_activity_rows)} lender-county activity rows. The existing crosswalk has {summary.lei_to_nmls_crosswalk_rows} LEI-to-NMLS mapping rows ({summary.crosswalk_match_confidence_rows.high} labeled high match confidence, {summary.crosswalk_match_confidence_rows.medium} medium, {fmt(summary.distinct_nmls_identifiers_in_crosswalk)} distinct NMLS identifiers). A crosswalk candidate does not verify a Maine license. {source(HMDA, 'Open the CFPB/FFIEC 2025 snapshot source')}.</p>
    </section>

    <section className="mt-12 border-t pt-5"><h2 className="text-xl font-semibold">Source clocks and limits</h2><p className="mt-2 text-sm">HMDA data year: 2025; snapshot freeze: June 2, 2026; source extracts committed August 10, 2026. BCCP and NMLS live search can change independently and were not snapshotted. No unified “Maine lender total” is asserted. HMDA ≠ licensing; company ≠ branch ≠ person. Loan broker or supervised lender ≠ mortgage-only institution.</p><p className="mt-3 text-sm"><Link className="underline" href="/ask?q=Maine%20mortgage%20lender%20license">Ask about Maine mortgage licensing</Link></p></section>
  </main>;
}
