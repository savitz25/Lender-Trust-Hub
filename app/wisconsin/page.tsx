import { StateCountyLinks } from '@/components/mortgage/state-county-links';
import type { Metadata } from 'next';
import { WISCONSIN_SNAPSHOT as wi } from '@/lib/wisconsin-intelligence/snapshot';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Wisconsin Mortgage Licensing, HMDA & Enforcement | LenderTrustHub',
  description: 'Wisconsin DFI mortgage license verification, 2025 Wisconsin-property HMDA activity, selected mortgage-servicing settlements and complaint intake.',
  alternates: { canonical: `${SITE_URL}/wisconsin` },
  robots: { index: true, follow: true },
};

const fmt = (n: number) => n.toLocaleString('en-US');

export default function WisconsinPage() {
  return <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
    <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">State intelligence · Wisconsin DFI</p>
    <h1 className="mt-3 text-4xl font-bold tracking-tight">Wisconsin mortgage licensing and lending evidence</h1>
    <p className="mt-5 text-lg text-slate-700">Wisconsin Department of Financial Institutions (DFI) regulates mortgage banking. A Wisconsin license, an NMLS identity and HMDA property activity are separate facts. This page does not rank lenders.</p>

    <section className="mt-10 grid gap-4 sm:grid-cols-3" aria-label="Wisconsin evidence summary">
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">DFI mortgage licenses</p><p className="mt-2 text-2xl font-bold">Live verification</p><p className="mt-2 text-sm">Banker, broker, branch and person/MLO classes stay separate. Statewide roster and class counts NOT_ACQUIRED.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">2025 HMDA applications</p><p className="mt-2 text-2xl font-bold">{fmt(wi.hmda.applications)}</p><p className="mt-2 text-sm">Wisconsin-property activity, not a DFI license census.</p></div>
      <div className="rounded-xl border p-5"><p className="text-sm text-slate-600">Selected DFI actions</p><p className="mt-2 text-2xl font-bold">{wi.enforcement.rows.length}</p><p className="mt-2 text-sm">Mortgage-servicing settlement announcements in the 2022–2026 review window; not a complete action census.</p></div>
    </section>

    <section className="mt-12" id="licenses"><h2 className="text-2xl font-semibold">DFI mortgage license verification</h2>
      <p className="mt-3 text-slate-700"><a className="underline" href={wi.sources.licensing}>Wisconsin DFI directs consumers to NMLS Consumer Access</a> to verify a mortgage banker, mortgage broker or mortgage loan originator. <a className="underline" href={wi.sources.nmls}>Check the current Wisconsin license in NMLS Consumer Access</a> before relying on an NMLS ID. DFI also lists separate banker and broker branch licenses and an individual MLO license. A branch is not a company and an MLO is a person.</p>
      <p className="mt-3 text-slate-700">The <a className="underline" href={wi.sources.licenseTypes}>DFI license-type definitions</a> include servicing within the Mortgage Banker License description; they do not list a separate mortgage-servicer license. DFI says these licenses expire December 31 each year. That general expiration rule is not an individual status or renewal record.</p>
      <p className="mt-3 text-slate-700">No clean downloadable statewide mortgage roster or structured DFI export was acquired. License rows and class counts, Wisconsin license numbers, current statuses, printed NMLS IDs, distinct NMLS IDs, exact license-to-canonical bridges and unmatched rows are <strong>NOT_ACQUIRED</strong>, not zero. An NMLS ID does not itself establish a Wisconsin license; HMDA activity is not a license census.</p>
    </section>

    <section className="mt-12" id="hmda"><h2 className="text-2xl font-semibold">2025 HMDA Wisconsin-property activity</h2>
      <p className="mt-3 text-slate-700">{fmt(wi.hmda.applications)} applications; {fmt(wi.hmda.originations)} originations; {fmt(wi.hmda.denials)} denials ({wi.hmda.denialApplicationPct}% of applications). {fmt(wi.hmda.distinctLeis)} reporting LEIs across {wi.hmda.counties} counties. Purchase {fmt(wi.hmda.purchase)}, refinance {fmt(wi.hmda.refinance)}, other purpose {fmt(wi.hmda.otherPurpose)}. Application loan types: conventional {fmt(wi.hmda.conventional)}, FHA {fmt(wi.hmda.fha)}, VA {fmt(wi.hmda.va)}, USDA/other {fmt(wi.hmda.usdaOther)}.</p>
      <p className="mt-2 text-sm text-slate-600">These figures sum the accepted Wisconsin-property 2025 HMDA county slice. The national HMDA spine was reused. The denial/application ratio is not a lender quality score or a license measure.</p>
    </section>

    <section className="mt-12" id="enforcement"><h2 className="text-2xl font-semibold">Selected DFI mortgage-servicing actions</h2>
      <p className="mt-3 text-slate-700">DFI announced {wi.enforcement.rows.length} selected multistate mortgage-servicing settlements in this bounded review. These are announcements about actions, not a complete Wisconsin order index or a count of unique licensed mortgage bankers. A multistate penalty is not a Wisconsin-only amount.</p>
      <div className="mt-5 space-y-3">{wi.enforcement.rows.map((row) => <article key={row.date} className="rounded-xl border p-4"><h3 className="font-semibold">{row.respondent} <span className="font-normal text-slate-600">({row.grain})</span></h3><p className="mt-1 text-sm">{row.date} · {row.action} · {row.status}</p><p className="mt-1 text-sm">{row.nmls ? `Printed NMLS ${row.nmls}; ` : 'NMLS not printed; '}Wisconsin license and order number not acquired.</p><a className="mt-2 inline-block text-sm underline" href={row.url}>DFI source announcement</a></article>)}</div>
      <p className="mt-3 text-sm text-slate-600">One announcement prints NMLS 3013 for NewRez. That exact identifier was retained in the source row, but no canonical company adverse attachment was made. The Bayview group announcement prints no respondent NMLS identifier. Exact canonical attachments: 0; name-only adverse joins: 0. Other 2022–2026 mortgage orders are NOT_ACQUIRED. Settlement terms and reported examination findings remain attributed to DFI, not a TrustHub finding.</p>
    </section>

    <section className="mt-12" id="complaints"><h2 className="text-2xl font-semibold">Complaints and source clocks</h2><p className="mt-3 text-slate-700"><a className="underline" href={wi.sources.complaints}>DFI accepts mortgage banking complaints</a> online, by email or by mail and may investigate alleged violations. Public provider-level complaint rows were NOT_ACQUIRED; outcomes are REQUEST_ONLY/NOT_ACQUIRED. A complaint is not an enforcement finding.</p><p className="mt-3 text-sm text-slate-600">License and NMLS verification pages retrieved {wi.retrievedAt}; no roster source clock. HMDA vintage {wi.hmda.year}; selected DFI announcement dates appear above and were reviewed {wi.enforcement.retrievedAt}; page data generated {wi.generatedAt}. No universal Wisconsin as-of date. Net-new canonical organizations 0; graph writes 0; claim eligibility changes 0. Milwaukee, Madison, Green Bay and Kenosha are geographic context only; no city intelligence pages.</p></section>
    <StateCountyLinks stateSlug="wisconsin" stateName="Wisconsin" />
  </main>;
}
