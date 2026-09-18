import Link from 'next/link';
import { fmtInt, fmtPct, type OhioIntelligenceSnapshot } from '@/lib/ohio-intelligence/snapshot';

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

export function OhioStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Ohio Mortgage &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function OhioStateIntelligence({ snapshot }: { snapshot: OhioIntelligenceSnapshot }) {
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
          <li className="text-slate-800">Ohio research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Ohio · statewide only</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">Ohio Mortgage &amp; Lending Intelligence</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Ohio Department of Commerce Division of Financial Institutions (DFI) is the regulator under the Residential
          Mortgage Lending Act (ORC Chapter 1322). NMLS is licensing infrastructure, not the Ohio regulator. One RMLA
          company registration can cover lending, brokering, and servicing — those are activities, not separate company
          counts. A company is not an MLO person. Nonbank RMLA registration is not all Ohio mortgage lenders: banks and
          other exempt depositories can originate without appearing as RMLA companies. This page is not a ranking,
          recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Columbus, Cleveland, Cincinnati, Toledo, Dayton, Akron, or other local Ohio lender pages are published from
          this statewide page.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage {s.hmda.source_as_of} ·
          FDIC overlay as of {s.fdic.source_as_of} · CFPB 2025 calendar year · OHFA county tables{' '}
          {s.ohfa.observation_period_label}. Reused HMDA/FDIC retrieval instants are not recorded. Page generated{' '}
          {s.generated_at} is not a license effective date.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={fmtInt(H.applications)} label="HMDA 2025 Ohio applications" hint="Market activity. Not lenders and not current RMLA registrations." />
          <Metric value={fmtInt(H.originations)} label="HMDA 2025 Ohio originations" hint="Originations are not a company count." />
          <Metric value={fmtInt(s.cfpb.OH_CFPB_2025_MORTGAGE_COMPLAINT_ROWS)} label="CFPB 2025 Ohio mortgage complaints" hint="Consumer submissions. Not findings and not DFI enforcement." />
          <Metric value={fmtInt(H.county_count)} label="Ohio counties in the HMDA slice" hint="All 88 counties are represented. County rows are not county pages." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 Ohio
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
          Distinct LEIs are not RMLA registrations and are not NMLS IDs. Property geography is not headquarters.
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
          Current Ohio RMLA company registration
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Current residential mortgage company and MLO research is directed by DFI eLicense to{' '}
          <Official href={s.regulators.nmls} label="NMLS Consumer Access" />. No complete public current RMLA company roster
          was acquired (OPEN_SEARCH_ONLY). Search-only is not zero companies. Ohio DFI license/registration identifiers stay
          separate from NMLS Unique IDs. Branches and DBAs are not extra companies. Do not add lending, brokering, and
          servicing as three company counts. MLOs are a person grain and are not added to companies. General Loan Law, CILA,
          Small Loan, and Short-Term Loan licenses are not the RMLA mortgage universe. Verify on NMLS Consumer Access and{' '}
          <Official href={s.regulators.elicense} label="DFI eLicense lookup" />.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="cfpb-heading">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB Ohio mortgage complaints (2025)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.cfpb.OH_CFPB_2025_DISTINCT_COMPLAINT_IDS)} distinct complaint IDs for product Mortgage and state OH in
          calendar year 2025. A consumer complaint is not a regulator finding and is not a quality score. Company name is
          not an NMLS identity. No name-only attachments.{' '}
          <Official href={s.cfpb.source_url} label="CFPB Consumer Complaint Database" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="dfi-heading">
        <h2 id="dfi-heading" className="text-lg font-semibold text-[#0A2540]">
          DFI complaints and enforcement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          DFI accepts written consumer-finance complaints, but no public bulk mortgage complaint dataset was acquired
          (INTAKE_AVAILABLE / BULK_NOT_PUBLIC). Missing is not zero. DFI intake is not the CFPB database. ORC 1349.43
          requires an internet enforcement database covering DFI Chapter 1322 actions, Attorney General Chapter 1345
          actions, and qualifying civil judgments. Those three origins stay separate. A DFI order is not an AG action and
          not a civil judgment. A person action is not a company action. Absence from the database is not a clean
          regulatory history. Individual published PDFs are not a census. Exact NMLS and Ohio-license attachments in this
          snapshot: 0.{' '}
          <Official href={s.regulators.complaints} label="DFI complaint intake" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="ohfa-heading">
        <h2 id="ohfa-heading" className="text-lg font-semibold text-[#0A2540]">
          OHFA participating lenders
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Official Find A Lender county pages ({s.ohfa.observation_period_label}) produced{' '}
          {fmtInt(s.ohfa.OH_OHFA_LENDER_OBSERVATION_ROWS)} lender-county observations and{' '}
          {fmtInt(s.ohfa.OH_OHFA_DISTINCT_LENDER_NAMES)} distinct source names across all 88 counties. Distinct names are
          not exact companies. County appearance is not headquarters. OHFA participation is not DFI licensure, not an MLO
          census, and not a TrustHub endorsement. Names were not attached to NMLS. Program checkmarks (Down Payment, MTC,
          Next Home, REFI) are source-native indicators, not general product capability.{' '}
          <Official href={s.regulators.ohfa} label="OHFA Find A Lender" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="fdic-heading">
        <h2 id="fdic-heading" className="text-lg font-semibold text-[#0A2540]">
          FDIC Ohio depositories
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.fdic.OH_FDIC_DEPOSITORY_ROWS)} institutions in the existing FDIC overlay (as of {s.fdic.source_as_of}).
          A bank is not an RMLA nonbank company. Headquarters is not HMDA Ohio activity. Do not add FDIC banks to the
          RMLA search-only universe.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>HMDA application ≠ lender. Property geography ≠ headquarters, license jurisdiction, or service territory.</li>
          <li>HMDA reporting LEI ≠ Ohio DFI/NMLS license. Distinct HMDA institutions are not RMLA companies.</li>
          <li>FDIC CERT ≠ RMLA registration. Depository ≠ nonbank mortgage company. Bank ≠ mortgage broker.</li>
          <li>OHFA participation ≠ DFI license. Distinct OHFA names ≠ exact companies. Preferred/top program language is not a TrustHub ranking.</li>
          <li>Company ≠ MLO. Lending/brokering/servicing activities ≠ extra company counts. Branch ≠ company. DBA ≠ company.</li>
          <li>RMLA registration population ≠ all Ohio mortgage lenders. Search-only and missing ≠ zero.</li>
          <li>CFPB complaints ≠ DFI/AG/court enforcement. Do not add them into one adverse total.</li>
          <li>No Trust Score, paid ranking, or best/safest/vetted conclusions.</li>
        </ul>
      </section>
    </div>
  );
}
