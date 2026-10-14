import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';

const DBR = 'https://dbr.ri.gov/banking-securities-and-charitable-organizations/banking';
const LICENSEES = 'https://dbr.ri.gov/banking-securities-and-charitable-organizations/banking/all-other-licensees';
const NMLS = 'https://www.nmlsconsumeraccess.org/';
const HMDA = 'https://ffiec.cfpb.gov/data-publication/snapshot-national-loan-level-dataset/2025';
const source = (url: string, label: string) => <a className="underline" href={url} rel="noopener noreferrer" target="_blank">{label}</a>;
export const metadata: Metadata = { title: 'Rhode Island mortgage and consumer-credit licensing evidence', description: 'Separate Rhode Island DBR license classes from 2025 HMDA mortgage activity.', alternates: { canonical: `${SITE_URL}/rhode-island` }, robots: { index: true, follow: true } };

export default function RhodeIslandLenderPage() {
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm"><Link href="/" className="underline">Home</Link><span aria-hidden="true"> / </span>Rhode Island research</nav>
    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">State intelligence · Rhode Island DBR Banking</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Rhode Island mortgage and consumer-credit evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Rhode Island Department of Business Regulation (DBR), Banking Division administers state non-depository licensing. NMLS Consumer Access is a free lookup, but this evidence packet did not acquire a complete current statewide company, branch, or MLO roster. HMDA measures mortgage activity on Rhode Island property; it does not establish license status.</p>
    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Current license roster</p><p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p><p className="mt-2 text-sm">Live NMLS lookup exists; no statewide snapshot or counts asserted.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">43,488</p><p className="mt-2 text-sm">Five county market rows, property geography.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA originations</p><p className="mt-2 text-2xl font-bold">25,984</p><p className="mt-2 text-sm">Loan activity, not licensees.</p></div>
    </section>
    <section className="mt-12"><h2 className="text-2xl font-semibold">State license populations</h2>
      <p className="mt-3 text-slate-700">{source(DBR, 'Rhode Island DBR Banking')} and its {source(LICENSEES, 'licensee information')} identify NMLS-based company and individual licensing programs. Distinct evidence populations include mortgage lender companies, lender branches, loan broker companies and branches, third-party loan servicers and branches, small-loan lenders, and mortgage loan originator (MLO) people. A company is not a branch or person; broader consumer-credit classes are not all mortgage lenders.</p>
      <p className="mt-3 text-sm">Current company/license rows: NOT_ACQUIRED. Branch rows: NOT_ACQUIRED. MLO person rows: NOT_ACQUIRED. Counts not asserted. {source(NMLS, 'NMLS Consumer Access')} provides public lookup; no high-volume individual search scrape was performed.</p>
    </section>
    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Rhode Island-property activity</h2>
      <p className="mt-3 text-slate-700">The existing source-native county summary has 5 rows: 43,488 applications, 25,984 originations, and 8,091 denials. Separate committed extracts contain 385 LEI state-summary rows and 1,111 lender-county activity rows. These observations describe reported loan activity, not Rhode Island licensees.</p>
      <p className="mt-2 text-sm text-slate-600">The existing LEI-to-NMLS crosswalk has 85 high-confidence mapping rows. These are identity candidates, not verified DBR licenses. Source data year: 2025; extract is an existing repository artifact. {source(HMDA, 'CFPB/FFIEC 2025 HMDA snapshot')}.</p>
    </section>
    <section className="mt-12 border-t pt-5"><h2 className="text-xl font-semibold">Source clocks and limits</h2><p className="mt-2 text-sm">DBR/NMLS public lookups are live and can change; no dated license roster was acquired. HMDA data year 2025; the repository slice preserves county market, lender-county activity, LEI summary, and crosswalk grains. No combined “Rhode Island lender total” is asserted. HMDA ≠ licensing; LEI/NMLS identity ≠ current authority.</p><p className="mt-3 text-sm"><Link className="underline" href="/ask?q=Rhode%20Island%20mortgage%20license">Ask about Rhode Island mortgage licensing</Link></p></section>
  </main>;
}
