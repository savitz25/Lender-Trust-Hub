import Link from 'next/link';
import { fmtInt, fmtPct, type PennsylvaniaIntelligenceSnapshot } from '@/lib/pennsylvania-intelligence/snapshot';

function Metric({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="break-words text-2xl font-bold tabular-nums text-[#0A2540]">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Official({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="font-medium text-[#047857] underline underline-offset-2" rel="noopener noreferrer" target="_blank">
      {label}
    </a>
  );
}

export function PennsylvaniaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Pennsylvania Mortgage & Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function PennsylvaniaStateIntelligence({ snapshot }: { snapshot: PennsylvaniaIntelligenceSnapshot }) {
  const s = snapshot;
  const H = s.hmda;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="text-[#047857] underline underline-offset-2">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800">Pennsylvania research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Pennsylvania · statewide only</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">Pennsylvania Mortgage & Lending Intelligence</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Pennsylvania Department of Banking and Securities (DoBS) regulates Pennsylvania mortgage licensing. NMLS is
          the licensing and public verification infrastructure, not the Pennsylvania regulator. Mortgage lender, broker,
          servicer, originator, and mortgage discount company stay separate classes. Current NMLS populations are
          search-only. This page does not publish a combined “Pennsylvania lenders” census. It is not a ranking,
          recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Philadelphia, Pittsburgh, or other local Pennsylvania lender pages are published from this statewide page.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage {s.hmda.source_as_of} ·
          FDIC overlay as of {s.fdic.source_as_of} · CFPB 2025 calendar year · PHFA list updated {s.phfa.sourceUpdatedAt}.
          Reused HMDA/FDIC retrieval instants are not recorded. Page generated {s.generated_at} is not a license effective
          date.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={fmtInt(H.applications)} label="HMDA 2025 Pennsylvania applications" hint="Property geography. Not lenders and not current licenses." />
          <Metric value={fmtInt(H.originations)} label="HMDA 2025 Pennsylvania originations" hint="Originations are not a company count." />
          <Metric value={fmtInt(s.cfpb.PA_CFPB_2025_MORTGAGE_COMPLAINT_ROWS)} label="CFPB 2025 PA mortgage complaints" hint="Consumer submissions. Not findings and not DoBS orders." />
          <Metric value={fmtInt(H.county_count)} label="Pennsylvania counties in the HMDA slice" hint="County rows are not county pages." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Pennsylvania
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(H.applications)} applications, {fmtInt(H.originations)} originations, {fmtInt(H.denials)} denials as{' '}
          {fmtPct(H.denials_as_pct_of_total_applications)} of {fmtInt(H.denial_pct_denominator_total_applications)} total
          applications (numerator {fmtInt(H.denial_pct_numerator_denial_observations)} denial observations ÷ denominator{' '}
          {fmtInt(H.denial_pct_denominator_total_applications)} total HMDA applications; not a decision-based denial rate
          and not lender quality). Purchase {fmtInt(H.purchase_applications)}, refinance{' '}
          {fmtInt(H.refinance_applications)}, other purpose {fmtInt(H.purpose_other_applications)}. Conventional{' '}
          {fmtInt(H.apps_conventional)}, FHA {fmtInt(H.apps_fha)}, VA {fmtInt(H.apps_va)}, USDA/other {fmtInt(H.apps_usda_other)}.
          Mix bars are application shares, not quality. A separate LEI-cell grain is {fmtInt(H.lei_cell_applications)}{' '}
          applications / {fmtInt(H.lei_cell_originations)} originations / {fmtInt(H.lei_cell_denials)} denials across{' '}
          {fmtInt(H.distinct_leis)} distinct LEIs (county-market minus LEI-cell applications {fmtInt(H.county_minus_lei_apps)}).
          Distinct LEIs are not licensed Pennsylvania mortgage companies.
        </p>
        <div className="mt-3 space-y-1 text-xs text-slate-600" aria-hidden="true">
          {[
            ['Conventional', H.apps_conventional],
            ['FHA', H.apps_fha],
            ['VA', H.apps_va],
            ['USDA/other', H.apps_usda_other],
          ].map(([label, n]) => (
            <div key={String(label)} className="flex items-center gap-2">
              <span className="w-24 shrink-0">{label}</span>
              <span className="h-2 flex-1 rounded bg-slate-100">
                <span className="block h-2 rounded bg-[#047857]" style={{ width: `${Math.round((Number(n) / mixMax) * 100)}%` }} />
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="roster-heading">
        <h2 id="roster-heading" className="text-lg font-semibold text-[#0A2540]">
          Current Pennsylvania mortgage licensing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          No bulk current NMLS Consumer Access mortgage-lender, broker, servicer, or originator census was acquired.
          Search-only is not zero. DoBS Open Data currently lists {fmtInt(s.open_data.PA_MORTGAGE_LENDER_ROWS)} Mortgage
          Lender rows, {fmtInt(s.open_data.PA_MORTGAGE_BROKER_ROWS)} Mortgage Broker rows,{' '}
          {fmtInt(s.open_data.PA_MORTGAGE_SERVICER_ROWS)} Mortgage Servicing rows,{' '}
          {fmtInt(s.open_data.PA_MORTGAGE_DISCOUNT_COMPANY_ROWS)} Mortgage Discount Company rows, and{' '}
          {fmtInt(s.open_data.PA_MLO_ROWS)} Mortgage Originator person rows. Those Open Data rows are not an NMLS ID
          census, not branches, and not a combined “Pennsylvania lenders” headline. Principal License is not automatically
          an NMLS ID. Verify current status on{' '}
          <Official href={s.regulators.nmls} label="NMLS Consumer Access" />. DoBS public material also cites about{' '}
          {fmtInt(s.mixed_dobs_denominator.dobs_public_approx_nonbank)} mixed non-bank/non-depository licensees across
          many industries; that figure is not a mortgage-company count.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="cfpb-heading">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB Pennsylvania mortgage complaints (2025)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.cfpb.PA_CFPB_2025_DISTINCT_COMPLAINT_IDS)} distinct complaint IDs for product Mortgage and state PA in
          calendar year 2025. A consumer complaint is not a regulator finding and is not a quality score. Company name is
          not an NMLS identity. No name-only attachments.{' '}
          <Official href={s.cfpb.source_url} label="CFPB Consumer Complaint Database" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="dobs-heading">
        <h2 id="dobs-heading" className="text-lg font-semibold text-[#0A2540]">
          DoBS complaints and enforcement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          DoBS accepts consumer complaints, but no public bulk mortgage-complaint universe was acquired (INTAKE_AVAILABLE /
          BULK_NOT_PUBLIC). Missing is not zero. DoBS intake is not the CFPB database. The enforcement-order catalog has{' '}
          {fmtInt(s.dobs_orders.catalog_document_rows)} mixed Department-wide documents. There is no source-native mortgage
          program-area field, so a mortgage-specific enforcement census is NOT_ACQUIRED. Title-keyword matches are not a
          census. A document is not a unique matter. An Order to Show Cause is not a final finding. A settlement is not a
          criminal conviction.{' '}
          <Official href={s.regulators.orders} label="DoBS Enforcement Orders" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="phfa-heading">
        <h2 id="phfa-heading" className="text-lg font-semibold text-[#0A2540]">
          PHFA participating lenders
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.phfa.PA_PHFA_PARTICIPATING_LENDER_ROWS)} name rows / {fmtInt(s.phfa.PA_PHFA_DISTINCT_LENDER_NAMES)}{' '}
          distinct names on the statewide participating-lender list updated {s.phfa.sourceUpdatedAt}. PHFA says
          participating lenders can originate PHFA loans throughout Pennsylvania even where county pages identify physical
          presence. Participation is a housing-program relationship, not DoBS licensure. PHFA “Top” designations for 2025
          are PHFA program labels, not LenderTrustHub rankings.{' '}
          <Official href={s.regulators.phfa} label="PHFA participating lenders list" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="fdic-heading">
        <h2 id="fdic-heading" className="text-lg font-semibold text-[#0A2540]">
          FDIC Pennsylvania depositories
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.fdic.PA_FDIC_DEPOSITORY_ROWS)} institutions in the existing FDIC overlay (as of {s.fdic.source_as_of}).
          A bank is not a DoBS non-bank mortgage licensee. Headquarters is not mortgage-market activity.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>HMDA application ≠ lender. Property geography ≠ headquarters, license jurisdiction, or service territory.</li>
          <li>HMDA reporting LEI ≠ Pennsylvania DoBS/NMLS license. Distinct HMDA institutions are not licensed mortgage companies.</li>
          <li>FDIC CERT ≠ DoBS mortgage license. Depository ≠ mortgage lender.</li>
          <li>PHFA participation ≠ DoBS mortgage-license universe.</li>
          <li>Open Data Mortgage Lender rows ≠ NMLS Consumer Access census. Lender ≠ broker ≠ servicer ≠ MLO.</li>
          <li>DoBS ~28,450 mixed non-bank licensees ≠ Pennsylvania mortgage companies.</li>
          <li>CFPB complaints ≠ DoBS orders. Do not add them into one adverse total. Search-only and missing ≠ zero.</li>
          <li>No Trust Score, paid ranking, or best/safest/vetted conclusions.</li>
        </ul>
      </section>
    </div>
  );
}
