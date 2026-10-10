import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { MARYLAND_SNAPSHOT as md } from '@/lib/maryland-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Maryland Mortgage Licensing, HMDA & Enforcement',
  description: 'Maryland OFR mortgage license verification, 2025 Maryland-property HMDA activity, bounded 2022–2026 enforcement actions and complaint intake.',
  alternates: { canonical: `${SITE_URL}/maryland` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function MarylandPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Maryland OFR</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Maryland mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">The Maryland Department of Labor Office of Financial Regulation regulates mortgage lending activity. A Maryland license, NMLS identity and HMDA property activity are separate facts. This page does not rank lenders.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Maryland evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">OFR licensing</p><p className="mt-2 text-2xl font-bold">Live verification</p><p className="mt-2 text-sm">Company, person and approved-location grains stay separate. Statewide roster rows NOT_ACQUIRED.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(md.hmda.applications)}</p><p className="mt-2 text-sm">Maryland-property activity, not an OFR license census.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">OFR index actions</p><p className="mt-2 text-2xl font-bold">{md.enforcement.rows.length}</p><p className="mt-2 text-sm">Bounded mortgage-relevant 2022–2026 index review; not a full respondent census.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">OFR mortgage license verification</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={md.sources.licensing}>OFR directs consumers to NMLS Consumer Access</a> to verify authorization. The site supports Maryland mortgage lenders, brokers, servicers and mortgage loan originators, including affiliated insurance producers. <a className="underline" href={md.sources.nmls}>Check the current record in NMLS Consumer Access</a> before relying on a license. OFR says NMLS is a national site that OFR does not directly maintain.</p>
      <p className="mt-3 text-slate-700"><a className="underline" href={md.sources.locations}>OFR says Maryland removed separate branch licenses effective July 1, 2023</a> for covered nonbank businesses, including mortgage lenders. A company has one license and provides OFR its other business locations. Approved-location lists are available on request from OFR, so branch locations are REQUEST_ONLY and are not counted as current branch licenses here.</p>
      <p className="mt-3 text-slate-700">No clean downloadable Maryland mortgage license roster or official structured list was acquired. Counts by license class, license numbers, status, company/branch rows, printed NMLS IDs, distinct NMLS IDs, exact existing-company bridges and unmatched rows are <strong>NOT_ACQUIRED</strong>, not zero. An NMLS ID is not itself a Maryland license, and HMDA activity is not a license footprint.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Maryland-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(md.hmda.applications)} applications; {fmt(md.hmda.originations)} originations; {fmt(md.hmda.denials)} denials ({md.hmda.denialApplicationPct}% of applications). {fmt(md.hmda.distinctLeis)} reporting LEIs across {md.hmda.countyEquivalents} counties and county-equivalents. Purchase {fmt(md.hmda.purchase)}, refinance {fmt(md.hmda.refinance)}, other purpose {fmt(md.hmda.otherPurpose)}. Application loan types: conventional {fmt(md.hmda.conventional)}, FHA {fmt(md.hmda.fha)}, VA {fmt(md.hmda.va)}, USDA/other {fmt(md.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These are sums from the accepted Maryland-property 2025 HMDA county slice. The existing national HMDA foundation was reused. A denial/application ratio is not a lender quality score.</p>
    </section>

    <section className="mt-12" id="enforcement"><h2 className="text-2xl font-semibold">OFR mortgage-related actions</h2>
      <p className="mt-3 text-slate-700">The <a className="underline" href={md.sources.enforcement}>OFR enforcement index</a> lists {md.enforcement.rows.length} mortgage-relevant actions in the reviewed window, including mortgage-assistance relief services. This is an action count, not a count of unique companies or respondents. The 2025 index has no mortgage-labeled entry; a 2026 annual index was not available at retrieval. Neither fact establishes zero enforcement. One reviewed order prints an exact NMLS ID for an individual MLO; no order was attached to a canonical company.</p>
      <div className="mt-5 space-y-3">{md.enforcement.rows.map((row) => <article key={`${row.date}-${row.respondent}`} className="rounded-xl border p-4"><h3 className="font-semibold">{row.respondent} <span className="font-normal text-slate-600">({row.grain})</span></h3><p className="mt-1 text-sm">{row.date} · {row.action} · {row.status} · {row.activity}</p><p className="mt-1 text-sm">{row.nmls ? `Printed NMLS ${row.nmls}; ` : 'NMLS not acquired; '}{row.license ? `Maryland license ${row.license}; ` : 'Maryland license not acquired; '}{row.caseNumber ? `case ${row.caseNumber}` : 'case number not acquired'}</p><a className="mt-2 inline-block text-sm underline" href={row.url}>OFR source document</a></article>)}</div>
      <p className="mt-3 text-sm text-slate-600">Consent orders, summary orders and final orders have different procedural status. A summary order is not labeled a final disposition here; allegations are not converted to findings. Enforcement documents were reviewed {md.enforcement.retrievedAt}. Exact adverse attachments: 0; name-only adverse joins: 0.</p>
    </section>

    <section className="mt-12" id="transition"><h2 className="text-2xl font-semibold">2026 licensing transition</h2><p className="mt-3 text-slate-700">In its <a className="underline" href={md.sources.advisory}>June 8, 2026 advisory</a>, OFR explained that 2026 legislation removed an exemption that had been incorrectly published after the 2025 Secondary Market Stability Act. OFR described a July 1, 2026 licensing deadline for affected persons relying on that provision in good faith. This is policy context; it does not identify any provider here as noncompliant or subject to an order.</p></section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints and source clocks</h2><p className="mt-3 text-slate-700"><a className="underline" href={md.sources.complaints}>OFR accepts consumer complaints</a> about regulated financial service providers and can investigate or refer them. Provider-level Maryland complaint rows are NOT_ACQUIRED; outcomes are REQUEST_ONLY/NOT_ACQUIRED. A complaint is not an enforcement finding.</p><p className="mt-3 text-sm text-slate-600">License verification retrieved {md.retrievedAt}; no roster as-of date. HMDA vintage {md.hmda.year}; order action dates above and index review {md.enforcement.retrievedAt}; page data generated {md.generatedAt}. There is no universal Maryland as-of date. Net-new canonical organizations 0; graph writes 0; claim eligibility changes 0. Baltimore, Annapolis, Frederick and Rockville are geographic context only; no city intelligence pages.</p></section>
    <StateCountyLinks stateSlug="maryland" stateName="Maryland" />
  </main>;
}
