import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import { SITE_URL } from '@/lib/directory/categories';
import snapshot from '@/data/iowa/ia-lend-001/annual-report-snapshot.json';

export const metadata: Metadata = {
  title: 'Iowa Mortgage Licensing and HMDA Evidence | LenderTrustHub',
  description: 'Iowa Division of Banking mortgage licensing classes, NMLS current-status research, and separate historical IDOB and HMDA observations.',
  alternates: { canonical: `${SITE_URL}/iowa` },
  robots: { index: true, follow: true },
};

export default function IowaLenderPage() {
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Iowa mortgage licensing and HMDA evidence', url: `${SITE_URL}/iowa` }} />
    <header className="border-b pb-8"><p className="text-sm font-semibold uppercase tracking-wide text-blue-800">Iowa Division of Banking</p><h1 className="mt-2 text-3xl font-bold sm:text-4xl">Iowa mortgage licensing and market evidence</h1><p className="mt-3 max-w-3xl text-slate-700">The Iowa Division of Banking regulates mortgage banker, broker and related state license classes through NMLS. Companies, branches and mortgage loan originators are different identities. HMDA reports market activity, not licensing.</p></header>
    <section className="mt-8 grid gap-4 sm:grid-cols-3" aria-label="Historical Division of Banking observations">
      {snapshot.annualObservations.map(row => <article key={row.class} className="rounded-xl border p-5"><strong className="text-3xl">{row.count.toLocaleString('en-US')}</strong><h2 className="mt-2 text-lg font-semibold">{row.class}</h2><p className="text-sm text-slate-700">{row.grain}; IDOB FY2025 report. This is not a current NMLS census.</p></article>)}
    </section>
    <section className="mt-10 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700">
      <h2 className="text-xl font-semibold text-slate-950">Current status belongs to NMLS</h2>
      <p>The <a className="underline" href="https://idob.iowa.gov/finance/finance-license-verification">Division of Banking license verification page</a> directs consumers to <a className="underline" href="https://www.nmlsconsumeraccess.org/">NMLS Consumer Access</a> for a named Iowa company or person. Search the exact NMLS ID, Iowa license class and status. NMLS assigns different IDs to companies, branches and individuals. A company license does not establish a branch&apos;s or person&apos;s authority.</p>
      <p>IDOB lists mortgage banker, mortgage broker, mortgage closing agent, mortgage registrant and individual registrant classes. The <a className="underline" href="https://idob.iowa.gov/finance/finance-applications">IDOB NMLS application page</a> explains the system of record. A servicer role or lender activity cannot be inferred from a broker license, company name, address or HMDA report. A separate current bulk NMLS Iowa license export was not acquired; current per-license status and distinct current company, branch and MLO counts are <strong>NOT_ACQUIRED</strong>.</p>
      <h2 className="text-xl font-semibold text-slate-950">Annual report clock</h2>
      <p>The <a className="underline" href={snapshot.source}>IDOB annual report</a> reports the class observations above for the year ending {snapshot.reportPeriodEnd}; it was submitted {snapshot.reportPublishedAt}. The figures are historical class counts, not row-level NMLS identities or an additive provider total. Report retrieved {snapshot.retrievedAt.slice(0, 10)} UTC; retained PDF SHA-256 {snapshot.pdfSha256}.</p>
      <h2 className="text-xl font-semibold text-slate-950">HMDA remains market activity</h2>
      <p>The already held {snapshot.hmdaYear} Iowa HMDA slice has {snapshot.hmdaStateSummaryRows} LEI state-summary rows and {snapshot.hmdaDistinctLei} distinct LEIs. It was not reloaded. An HMDA institution may report Iowa property activity without an IDOB license. No HMDA LEI was promoted to state licensing by this page.</p>
      <h2 className="text-xl font-semibold text-slate-950">Orders and limits</h2>
      <p>Enforcement orders, complaints and examinations require their own case records and exact identity bridge; they are NOT_ACQUIRED as Iowa attachments. A complaint is not a finding. Existing canonical matches and net-new entities: NOT_ACQUIRED. Graph writes and record-level evidence attachments from this publication: 0. No city or county work.</p>
    </section>
  </main>;
}
