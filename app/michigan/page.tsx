import type { Metadata } from 'next';
import { MICHIGAN_SNAPSHOT as mi } from '@/lib/michigan-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Michigan Mortgage Licensing & Lending Evidence | LenderTrustHub',
  description: 'DIFS licensing verification, selected mortgage enforcement orders, and 2025 Michigan HMDA activity. No license roster or lender ranking.',
  alternates: { canonical: `${SITE_URL}/michigan` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function MichiganPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Michigan</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Michigan mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">DIFS regulates Michigan mortgage brokers, lenders, and servicers. A DIFS license or registration, an NMLS identity, and HMDA lending activity are different facts. This page does not rank providers.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Michigan evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">DIFS license verification</p><p className="mt-2 text-2xl font-bold">Known</p><p className="mt-2 text-sm">Statewide roster: NOT_ACQUIRED; rows: unknown, not zero.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(mi.hmda.applications)}</p><p className="mt-2 text-sm">Michigan-property activity across {mi.hmda.counties} counties.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Reviewed DIFS orders</p><p className="mt-2 text-2xl font-bold">{mi.enforcement.rows.length}</p><p className="mt-2 text-sm">Selected decisions, not a complete enforcement census.</p></div>
    </section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">Licensing and identity</h2><p className="mt-3 text-slate-700">{mi.licensing.note} Verify a company or individual in the <a className="underline" href={mi.sources.locator}>DIFS locator</a> and cross-check an exact NMLS ID in NMLS Consumer Access. Broker, lender, servicer, company, person, branch, and exemption are separate grains; one business may hold more than one authority.</p><p className="mt-3 text-sm text-slate-600">DIFS 2025 annual report, as of {mi.licensing.annualReportAsOf}: first-mortgage licensees {fmt(mi.licensing.annualReportGrains.firstMortgageLicensees)}, registrants {fmt(mi.licensing.annualReportGrains.firstMortgageRegistrants)}; second-mortgage licensees {fmt(mi.licensing.annualReportGrains.secondMortgageLicensees)}, registrants {fmt(mi.licensing.annualReportGrains.secondMortgageRegistrants)}; individual MLO licensees {fmt(mi.licensing.annualReportGrains.mloPersons)}. These overlapping, dated regulatory categories are not a combined lender total. <a className="underline" href={mi.sources.annualReport}>Source</a>.</p></section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">2025 HMDA activity</h2><p className="mt-3 text-slate-700">{fmt(mi.hmda.originations)} originations and {fmt(mi.hmda.denials)} denials among {fmt(mi.hmda.applications)} applications; denials/application ratio {mi.hmda.denialApplicationPct}%. {fmt(mi.hmda.distinctLeis)} reporting LEIs. Purchase {fmt(mi.hmda.purchase)}, refinance {fmt(mi.hmda.refinance)}, other purpose {fmt(mi.hmda.otherPurpose)}. Applications by loan type: conventional {fmt(mi.hmda.conventional)}, FHA {fmt(mi.hmda.fha)}, VA {fmt(mi.hmda.va)}, USDA/other {fmt(mi.hmda.usdaOther)}.</p><p className="mt-2 text-sm text-slate-600">{mi.hmda.note} Source: committed 2025 national HMDA state partition.</p></section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">DIFS mortgage enforcement</h2><p className="mt-3 text-slate-700">{mi.enforcement.scope} Window assessed: {mi.enforcement.window[0]}–{mi.enforcement.window[1]}. The {mi.enforcement.rows.length} reviewed documents include {mi.enforcement.rows.filter(r => r.type === 'company').length} company orders and {mi.enforcement.rows.filter(r => r.type === 'person').length} individual order. A stipulation is not proof that every allegation was admitted. Printed NMLS and Michigan license identifiers are shown as separate keys; no name-only adverse joins.</p><div className="mt-5 space-y-4">{mi.enforcement.rows.map((row) => <article key={`${row.caseId}-${row.date}`} className="rounded-xl border p-5"><h3 className="font-semibold">{row.respondent ?? 'Individual MLO'} · {row.order}</h3><p className="mt-1 text-sm text-slate-700">{row.date} · {row.status} · {row.law}</p><p className="mt-1 text-sm">NMLS {row.nmls}; Michigan license {row.licenses.length ? row.licenses.join(', ') : 'not printed in reviewed header'}</p><a className="mt-2 inline-block text-sm underline" href={row.url}>DIFS document · case {row.caseId}</a></article>)}</div><p className="mt-3 text-sm text-slate-600">{mi.enforcement.note} Source indexes: <a className="underline" href={mi.sources.orders}>Director’s Orders</a> and <a className="underline" href={mi.sources.decisions}>Final Decisions</a>.</p></section>

    <section className="mt-12"><h2 className="text-2xl font-semibold">Complaints and limits</h2><p className="mt-3 text-slate-700">DIFS accepts <a className="underline" href={mi.sources.complaints}>mortgage complaints</a>. Provider-level complaint rows: NOT_ACQUIRED. Outcomes: REQUEST_ONLY. A complaint is not an adjudicated violation, and missing records do not mean zero complaints.</p><p className="mt-3 text-sm text-slate-600">Source review clock: {mi.retrieved_at}. HMDA: 2025 activity. No license roster, full DIFS enforcement census, provider-level complaint outcomes, new canonical organizations, graph writes, or broadened claim eligibility.</p></section>
  </main>;
}
