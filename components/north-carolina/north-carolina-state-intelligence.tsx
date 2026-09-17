import Link from 'next/link';
import { fmtInt, fmtPct, type NorthCarolinaIntelligenceSnapshot } from '@/lib/north-carolina-intelligence/snapshot';

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

export function NorthCarolinaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">North Carolina Mortgage & Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function NorthCarolinaStateIntelligence({ snapshot }: { snapshot: NorthCarolinaIntelligenceSnapshot }) {
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
          <li className="text-slate-800">North Carolina research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · North Carolina · statewide only</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">North Carolina Mortgage & Lending Intelligence</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The North Carolina Office of the Commissioner of Banks (NCCOB) regulates North Carolina mortgage licensing. NMLS
          is the licensing and public verification infrastructure, not the North Carolina regulator. Mortgage lender, broker,
          servicer, MOSR, reverse-mortgage certificate, and mortgage loan originator stay separate classes. This page does
          not publish a combined “North Carolina lenders” census. It is not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          No Charlotte, Raleigh, Durham, Greensboro, Wake, Mecklenburg, or other local North Carolina lender pages are
          published from this statewide page.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · HMDA vintage {s.hmda.source_as_of} ·
          FDIC overlay as of {s.fdic.source_as_of} · CFPB 2025 calendar year · NCCOB current companies as of{' '}
          {s.source_as_of.nccob_current_companies}. Reused HMDA/FDIC retrieval instants are not recorded. Page generated{' '}
          {s.generated_at} is not a license effective date.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={fmtInt(H.applications)} label="HMDA 2025 North Carolina applications" hint="Property geography. Not lenders and not current licenses." />
          <Metric value={fmtInt(H.originations)} label="HMDA 2025 North Carolina originations" hint="Originations are not a company count." />
          <Metric value={fmtInt(s.cfpb.NC_CFPB_2025_MORTGAGE_COMPLAINT_ROWS)} label="CFPB 2025 NC mortgage complaints" hint="Consumer submissions. Not findings and not NCCOB orders." />
          <Metric value={fmtInt(H.county_count)} label="North Carolina counties in the HMDA slice" hint="County rows are not county pages." />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 North Carolina
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
          Distinct LEIs are not licensed North Carolina mortgage companies.
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
          Current North Carolina mortgage licensing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          NCCOB Licensee Search Show All currently lists {fmtInt(s.current_roster.NC_MORTGAGE_LENDER_ROWS)} Mortgage Lender
          licenses, {fmtInt(s.broker.NC_MORTGAGE_BROKER_ROWS)} Mortgage Broker licenses,{' '}
          {fmtInt(s.servicer.NC_MORTGAGE_SERVICER_ROWS)} Mortgage Servicer licenses, and {fmtInt(s.mosr.NC_MOSR_ROWS)}{' '}
          Mortgage Origination Support Registration rows. Those four classes together are{' '}
          {fmtInt(s.mixed_nccob_denominator.NC_CURRENT_LICENSED_ENTITY_ROWS)} current licensed entities — not a combined
          “North Carolina mortgage companies” or “lenders” headline. NCCOB license number is not an NMLS Unique ID; the
          Show All grid printed both identifiers on {fmtInt(s.current_roster.NC_CURRENT_EXACT_NCCOB_NMLS_PAIRS)} rows (
          {fmtInt(s.current_roster.NC_CURRENT_DISTINCT_NMLS_IDS)} distinct NMLS IDs). DBA text is populated on{' '}
          {fmtInt(s.dba.NC_DBA_POPULATED_ROWS)} rows and is not a company count. A Services Loan = Yes flag appears on{' '}
          {fmtInt(s.servicer.services_loan_yes_flag)} company rows and is not the servicer census. Reverse-mortgage
          certificates are a separate list of {fmtInt(s.reverse.NC_REVERSE_MORTGAGE_CERTIFICATE_ROWS)} RM numbers and are
          not added to the 640 lenders. Official MLO Show All matching records are {fmtInt(s.mlo.NC_MLO_OFFICIAL_MATCHING_RECORDS)}
          ; distinct NCCOB/NMLS person IDs were not fully paged. An MLO is not a company. Previous and exempt entities
          remain search-only. Verify current status on{' '}
          <Official href={s.regulators.url} label="NCCOB Licensee Search" /> and{' '}
          <Official href={s.regulators.nmls} label="NMLS Consumer Access" />.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="cfpb-heading">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          CFPB North Carolina mortgage complaints (2025)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.cfpb.NC_CFPB_2025_DISTINCT_COMPLAINT_IDS)} distinct complaint IDs for product Mortgage and state NC in
          calendar year 2025. A consumer complaint is not a regulator finding and is not a quality score. Company name is
          not an NMLS identity. No name-only attachments.{' '}
          <Official href={s.cfpb.source_url} label="CFPB Consumer Complaint Database" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="nccob-heading">
        <h2 id="nccob-heading" className="text-lg font-semibold text-[#0A2540]">
          NCCOB complaints and mortgage enforcement
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          NCCOB accepts residential mortgage complaints within its jurisdiction, but no public bulk complaint dataset was
          acquired (INTAKE_AVAILABLE / BULK_NOT_PUBLIC). Missing is not zero. NCCOB intake is not the CFPB database. The
          Mortgage Enforcement Actions search returned {fmtInt(s.nccob_orders.NC_NCCOB_MORTGAGE_ORDER_DOCUMENTS)} documents
          across {fmtInt(s.nccob_orders.NC_NCCOB_MORTGAGE_DISTINCT_DOCKETS)} distinct docket numbers used as matter identity
          ({fmtInt(s.nccob_orders.NC_NCCOB_MORTGAGE_UNIQUE_MATTERS)} unique matters). A document is not a unique matter. One
          respondent may have multiple dockets. Do not dedupe by respondent name. Action types are source-native (Consent
          Order is the largest class). A consent order is not a criminal conviction. A suspension is not a permanent
          revocation. A notice of hearing is not a final finding. Person respondents are not company lender matters. The
          grid did not publish NCCOB license or NMLS IDs, so exact enforcement attachments are 0.{' '}
          <Official href={s.regulators.orders} label="NCCOB Mortgage Enforcement Actions" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="nchfa-heading">
        <h2 id="nchfa-heading" className="text-lg font-semibold text-[#0A2540]">
          NCHFA participating lenders
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The North Carolina Housing Finance Agency publishes a radius-based lender finder, not a bounded statewide
          participating-lender census in this snapshot. Search-only is not zero. NCHFA participation is a housing-program
          relationship, not NCCOB licensure. An NCHFA loan-officer listing is not an MLO census. NCHFA “preferred loan officer”
          and “top lender” awards are the Agency’s own program language, not LenderTrustHub rankings. Names were
          not attached to NMLS by name alone.{' '}
          <Official href={s.regulators.nchfa} label="NCHFA find a lender" />
        </p>
      </section>

      <section className="mt-10" aria-labelledby="fdic-heading">
        <h2 id="fdic-heading" className="text-lg font-semibold text-[#0A2540]">
          FDIC North Carolina depositories
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(s.fdic.NC_FDIC_DEPOSITORY_ROWS)} institutions in the existing FDIC overlay (as of {s.fdic.source_as_of}).
          A bank is not an NCCOB non-bank mortgage licensee. Headquarters is not HMDA North Carolina activity. State-chartered
          bank and credit-union populations stay separate from the mortgage-license population.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What these numbers do not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>HMDA application ≠ lender. Property geography ≠ headquarters, license jurisdiction, or service territory.</li>
          <li>HMDA reporting LEI ≠ North Carolina NCCOB/NMLS license. Distinct HMDA institutions are not licensed mortgage companies.</li>
          <li>FDIC CERT ≠ NCCOB mortgage license. Depository ≠ mortgage lender. Bank ≠ mortgage broker.</li>
          <li>NCHFA participation ≠ NCCOB mortgage-license universe. Preferred/top is NCHFA language, not a TrustHub ranking.</li>
          <li>Lender ≠ broker ≠ servicer ≠ MOSR ≠ MLO. Do not add 640 + 574 + 62 + 104 as “North Carolina lenders.”</li>
          <li>1,380 current licensed entities ≠ North Carolina mortgage companies. Reverse certificates ≠ the 640 lenders.</li>
          <li>CFPB complaints ≠ NCCOB orders. Do not add them into one adverse total. Search-only and missing ≠ zero.</li>
          <li>No Trust Score, paid ranking, or best/safest/vetted conclusions.</li>
        </ul>
      </section>
    </div>
  );
}
