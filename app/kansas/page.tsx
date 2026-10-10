import type { Metadata } from 'next';
import snapshot from '@/data/kansas/hmda-snapshot.json';
import { JsonLd } from '@/components/directory/JsonLd';
import { SITE_URL } from '@/lib/directory/categories';

const fmt = (n: number) => n.toLocaleString('en-US');

export const metadata: Metadata = {
  title: 'Kansas Mortgage Licensing and HMDA Evidence',
  description: 'Kansas OSBC mortgage company, branch, and MLO authority are distinct. Current license rosters were not acquired. 2025 HMDA activity is reported separately.',
  alternates: { canonical: `${SITE_URL}/kansas` },
  robots: { index: true, follow: true },
};

export default function KansasLenderPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Kansas mortgage licensing and HMDA evidence', url: `${SITE_URL}/kansas` }} />
    <header className="border-b pb-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Kansas Office of the State Bank Commissioner</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Kansas mortgage regulation and market activity</h1>
      <p className="mt-5 text-lg text-slate-700">Kansas mortgage company licenses, branch registrations, and mortgage loan originator licenses are separate records. HMDA describes activity on Kansas property; it does not establish Kansas licensing.</p>
    </header>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Kansas mortgage evidence">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(snapshot.countyAggregate.applications)}</p><p className="mt-2 text-sm">Kansas-property county aggregate.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA originations</p><p className="mt-2 text-2xl font-bold">{fmt(snapshot.countyAggregate.originations)}</p><p className="mt-2 text-sm">Market activity, not a lender-license population.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Current mortgage license roster</p><p className="mt-2 text-2xl font-bold">NOT_ACQUIRED</p><p className="mt-2 text-sm">Company, branch, and MLO counts are not inferred.</p></div>
    </section>

    <section className="mt-12" id="licensing">
      <h2 className="text-2xl font-semibold">Kansas licensing and verification</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href="https://osbckansas.gov/consumer-mortgage-lending/applications-forms/">OSBC Consumer and Mortgage Lending Division</a> distinguishes a Mortgage Company license, a separate registration for each branch, and an MLO person license. OSBC directs current nonbank mortgage license verification to <a className="underline" href="https://www.nmlsconsumeraccess.org/">NMLS Consumer Access</a>. A company, branch, and person are not interchangeable.</p>
      <p className="mt-3 text-slate-700">No current bulk NMLS/OSBC Kansas mortgage roster was acquired. Mortgage company, branch, MLO, supervised lender, state-chartered bank, current status, and license-to-canonical entity matches remain <strong>NOT_ACQUIRED</strong>. OSBC supervised-lender and consumer-credit records are not counted as mortgage companies. HMDA LEIs are not NMLS identifiers.</p>
    </section>

    <section className="mt-12" id="hmda">
      <h2 className="text-2xl font-semibold">2025 HMDA market activity</h2>
      <p className="mt-3 text-slate-700">The reused county aggregate contains {fmt(snapshot.countyAggregate.applications)} applications, {fmt(snapshot.countyAggregate.originations)} originations, and {fmt(snapshot.countyAggregate.denials)} reported denials across {snapshot.countyAggregate.rows} county rows. This is a market-activity summary, not a licensing census, lender ranking, or finding of discrimination.</p>
      <p className="mt-3 text-slate-700">The separate LEI state summary has {fmt(snapshot.leiStateSummary.distinctLeis)} LEIs and {fmt(snapshot.leiStateSummary.applications)} applications; its application total differs from the county aggregate by {fmt(snapshot.knownReconciliationDifferences.countyVsLeiApplications)}. The lender-county table has {fmt(snapshot.lenderCountyActivity.rows)} rows and {fmt(snapshot.lenderCountyActivity.applications)} applications, {fmt(snapshot.knownReconciliationDifferences.countyVsLenderCountyApplications)} below the county aggregate. These source tables are not added together. The county aggregate alone supplies the statewide HMDA figure above.</p>
      <p className="mt-3 text-sm text-slate-600">Vintage: 2025. HMDA data are published by the <a className="underline" href="https://ffiec.cfpb.gov/data-publication/">FFIEC HMDA Platform</a>. County aggregate SHA-256: <code>{snapshot.countyAggregate.sha256}</code>. The existing files did not retain a source retrieval timestamp. HMDA activity dates do not establish current license status.</p>
    </section>

    <section className="mt-12 border-t pt-6 text-sm text-slate-600" id="limits">
      <h2 className="text-xl font-semibold text-slate-950">Evidence limits</h2>
      <p className="mt-3">Kansas mortgage-company, branch, MLO, supervised-lender, bank, examination, enforcement, and complaint populations were not acquired here. Complaint intake is not an enforcement finding; exams and enforcement are separate. Existing Kansas HMDA data were reused; no license entities or graph attachments were created. Source files do not retain an HMDA retrieval clock.</p>
    </section>
  </main>;
}
