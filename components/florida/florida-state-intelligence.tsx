import Link from 'next/link';
import { FLORIDA_SNAPSHOT, fmtInt, fmtUsdCompact, identityPct } from '@/lib/florida-intelligence/snapshot';

function Metric({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <p className="break-words text-2xl font-bold tabular-nums text-[#0A2540]">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{label}</p>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
    </div>
  );
}

function BarRow({ label, n, max, caption }: { label: string; n: number; max: number; caption?: string }) {
  const pct = max > 0 ? Math.max(2, Math.round((n / max) * 100)) : 0;
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 break-words text-slate-800">{label}</span>
        <span className="shrink-0 tabular-nums text-slate-600">{fmtInt(n)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden>
        <div className="h-full rounded-full bg-[#0D9488]" style={{ width: `${pct}%` }} />
      </div>
      {caption ? <p className="mt-1 text-xs text-slate-500">{caption}</p> : null}
    </div>
  );
}

export function FloridaStateIntelligence() {
  const s = FLORIDA_SNAPSHOT;
  const L = s.licensing;
  const O = s.ofr;
  const types = [
    { k: 'Final orders', n: O.company_types.FINAL_ORDER },
    { k: 'License denials', n: O.company_types.LICENSE_DENIAL },
    { k: 'Other final dispositions', n: O.company_types.OTHER },
    { k: 'Withdrawals', n: O.company_types.WITHDRAWAL },
    { k: 'Emergency orders', n: O.company_types.EMERGENCY_ORDER },
  ];
  const typeMax = Math.max(...types.map((t) => t.n));
  const findings = [
    { k: 'Agency findings', n: O.company_findings.AGENCY_FINDING },
    { k: 'Consent / settlement orders', n: O.company_findings.CONSENTED_ORDER },
    { k: 'Unspecified', n: O.company_findings.UNSPECIFIED },
    { k: 'Not discipline', n: O.company_findings.NOT_DISCIPLINE },
  ];
  const cfpbYears = s.cfpb.years;
  const yearMax = Math.max(...cfpbYears.map((y) => y.n));
  const issues = s.cfpb.issues.slice(0, 8);
  const issueMax = Math.max(...issues.map((i) => i.n));

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
          <li className="text-slate-800">Florida research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0D9488]">Independent research · Florida</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Florida Mortgage &amp; Lending Research
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Explore official Florida licensing, mortgage activity, consumer complaint, and regulatory-action data using
          OFR, HMDA, CFPB and other public evidence. This is not a ranking, recommendation, or score. Individual
          Florida company profiles are not published from this page.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Local catalog pages remain at{' '}
          <Link href="/local-lenders/florida" className="text-[#047857] underline underline-offset-2">
            /local-lenders/florida
          </Link>
          . Those pages are not this official-source Intelligence snapshot.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            value={fmtInt(L.unique_nmls)}
            label="Unique Approved Florida company NMLS identities"
            hint="Current Chapter 494 company denominator. Not 6,435 lenders."
          />
          <Metric
            value={fmtInt(L.approved_credentials)}
            label="Approved MBR/MLD credentials"
            hint="License rows. Some companies hold more than one credential."
          />
          <Metric
            value={fmtInt(L.confirmed_nmls)}
            label="Companies linked to confirmed canonical identities"
            hint={`${identityPct()}% of 6,325. 22 remain REVIEW_REQUIRED.`}
          />
        </div>
      </section>

      <section aria-labelledby="licensing-heading" className="mt-10">
        <h2 id="licensing-heading" className="text-lg font-semibold text-[#0A2540]">
          Current Florida licensing
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          <strong>{fmtInt(L.approved_credentials)} Approved company license credentials</strong> across{' '}
          <strong>{fmtInt(L.unique_nmls)} unique company NMLS identities</strong>. Credentials are not companies. Some
          companies hold two or three credentials. Do not call this 6,435 Florida lenders.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-[#0A2540]">Mortgage Broker (MBR)</h3>
            <p className="mt-1 text-2xl font-bold tabular-nums">{fmtInt(L.mbr)}</p>
            <p className="mt-1 text-sm text-slate-600">
              Chapter 494 Part II company credentials. Broker authority is not a lender charter.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-base font-semibold text-[#0A2540]">Mortgage Lender (MLD)</h3>
            <p className="mt-1 text-2xl font-bold tabular-nums">{fmtInt(L.mld)}</p>
            <p className="mt-1 text-sm text-slate-600">
              Chapter 494 Part III company credentials. Making or servicing a mortgage loan as defined in statute.
            </p>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Dual Approved MBR + MLD companies: {fmtInt(L.dual_nmls)} unique NMLS identities.</li>
          <li>
            Multiplicity: {fmtInt(L.credential_multiplicity['1'])} companies with 1 credential;{' '}
            {fmtInt(L.credential_multiplicity['2'])} with 2; {fmtInt(L.credential_multiplicity['3'])} with 3.
          </li>
          <li>
            MLD credentials with OFR SERVICER=Yes: {fmtInt(L.mld_servicer_yes_rows)} credential rows (
            {fmtInt(L.mld_servicer_yes_nmls)} unique company NMLS). Blank/No does not mean the company never services
            mortgages.
          </li>
          <li>
            Phone present on {fmtInt(L.phone_credentials)} / {fmtInt(L.approved_credentials)} credentials (
            {((L.phone_credentials / L.approved_credentials) * 100).toFixed(2)}%). Primary address 1 on all{' '}
            {fmtInt(L.prim_addr)} rows. Mail address 1 on {fmtInt(L.mail_addr)}. These are credential-level observations
            and are not merged.
          </li>
          <li>
            OFR primary state = FL on {fmtInt(L.prim_state_fl)} credentials. Out-of-state HQ addresses are legitimate.
            PRIM COUNTY is license/business address evidence — not service territory, operating county, or branch
            footprint. This page does not create county market pages.
          </li>
        </ul>
      </section>

      <section aria-labelledby="identity-heading" className="mt-10">
        <h2 id="identity-heading" className="text-lg font-semibold text-[#0A2540]">
          Canonical identity coverage
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Confirmed canonical company identities: <strong>{fmtInt(L.confirmed_nmls)} / {fmtInt(L.unique_nmls)}</strong>{' '}
          ({identityPct()}%). REVIEW_REQUIRED: <strong>{fmtInt(L.held_nmls)} / {fmtInt(L.unique_nmls)}</strong> (23
          credential rows). Those 22 are official Approved OFR records whose canonical national relationship remains
          held for review. They are not unlicensed, invalid, or fake.
        </p>
      </section>

      <section aria-labelledby="enforcement-heading" className="mt-10">
        <h2 id="enforcement-heading" className="text-lg font-semibold text-[#0A2540]">
          Regulatory &amp; Enforcement History
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Connected OFR final-agency-action records from July 2015 forward (DOAH FLAIO). This is not all Florida OFR
          enforcement history. Pre-July 2015 orders remain in interactive REAL search and were not bulk-acquired. The
          FLAIO corpus is final agency action — not automatically an adverse disciplinary finding.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(O.company)} label="Chapter 494 company source observations" hint="Do not use 2,515 here. Most FLAIO rows are loan originators or other programs." />
          <Metric value={fmtInt(O.company_confirmed)} label="Confirmed company events" hint={`On ${fmtInt(O.confirmed_institutions)} distinct canonical institutions.`} />
          <Metric value={fmtInt(O.company_review)} label="Review-required company events" hint="Touch held identities. Not counted as confirmed canonical institution events." />
          <Metric value={fmtInt(O.company_unresolved)} label="Unresolved / historical company orders" hint="Could not be safely attached to the current Approved-company identity foundation." />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Official documents: {fmtInt(O.company_docs)} / {fmtInt(O.company)} company observations have an OFR/FLAIO PDF
          URL. {fmtInt(O.text_extractable_company)} were text-extractable; {fmtInt(O.non_text_company)} were not (no
          OCR).
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Person-subject FLAIO listings ({fmtInt(O.person_mlo)}) and branch-subject listings ({fmtInt(O.branch)}) are
          stored separately and are not company enforcement counts. Mixed company/person: {fmtInt(O.mixed)}. Total
          internal observations including those subjects: {fmtInt(O.written_observations)} — not “Florida lender company
          enforcement actions.”
        </p>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Company observation types</h3>
        <p className="mt-1 text-sm text-slate-600">
          Normalized from FLAIO type and subject. Raw action type is preserved. Not all {fmtInt(O.company)} are
          disciplinary findings.
        </p>
        <div className="mt-3 space-y-3" role="img" aria-label="Company observation types">
          {types.map((t) => (
            <BarRow key={t.k} label={t.k} n={t.n} max={typeMax} />
          ))}
        </div>
        <div className="mt-3 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[16rem] text-left text-sm">
            <caption className="sr-only">Company OFR observation types</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-2">Type</th>
                <th scope="col" className="py-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.k} className="border-b border-slate-100">
                  <td className="py-2 pr-2">{t.k}</td>
                  <td className="py-2 tabular-nums">{fmtInt(t.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Finding posture</h3>
        <p className="mt-1 text-sm text-slate-600">
          Consent / settlement order is not an admission of every allegation unless the order says so. NOT_DISCIPLINE
          (including some declaratory and application outcomes) must not be read as enforcement misconduct. Final agency
          action includes dismissals, approvals, withdrawals, denials, and consent orders.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {findings.map((f) => (
            <li key={f.k}>
              {f.k}: {fmtInt(f.n)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-slate-600">
          No standalone administrative-complaint metric is built from this dataset. FLAIO is a final-agency-action
          corpus; complaint exhibits inside PDFs were not counted as separate findings.
        </p>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Fines and license actions</h3>
        <p className="mt-1 text-sm text-slate-600">
          {fmtInt(O.company_fines)} fine-bearing observations are a subset of the {fmtInt(O.company)} company events —
          not {fmtInt(O.company)} + {fmtInt(O.company_fines)} events.{' '}
          {fmtUsdCompact(O.company_fine_dollars)} in machine-extractable OFR fine/penalty amounts observed in the
          connected July-2015-forward FLAIO company corpus. That is not “total Florida lender fines since 2015.”
          Spelled-out amounts without structured $ values were not inferred.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Explicit company-subject PDF evidence: {fmtInt(O.company_revocation)} revocations and{' '}
          {fmtInt(O.company_suspension)} suspensions. {fmtInt(O.company_consent_mentioned)} company documents reference
          stipulation/consent. Company emergency orders: {fmtInt(O.company_types.EMERGENCY_ORDER)}. Ordinary consent-order
          “cease and desist” boilerplate is not counted as emergency action.
        </p>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          Florida HMDA lending activity
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          State-grain HMDA / FFIEC LEI summaries with <code className="text-xs">state_code=FL</code>. Vintage:{' '}
          {s.hmda.vintages[0]?.source_vintage}. Source observed {String(s.hmda.source_observed)}. This measures
          reporting activity in Florida, not lender quality, and not Chapter 494 licensure. Many brokers are not HMDA
          reporters; depositories may originate in Florida without an OFR company license when exempt.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(s.hmda.applications)} label="Florida applications" hint="Sum of state-grain LEI application counts." />
          <Metric value={fmtInt(s.hmda.originations)} label="Florida originations" hint="Sum of state-grain LEI origination counts." />
          <Metric value={fmtInt(s.hmda.leis)} label="Distinct LEIs at Florida state grain" hint={`${fmtInt(s.hmda.attached_inst)} attached to a canonical institution.`} />
          <Metric value={fmtInt(s.hmda.rows)} label="State-grain observation rows" hint="HMDA 2025 only at this grain. Loan-purpose and denial fields are not populated on these summaries, so no denial ratio is shown." />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Attribution: {fmtInt(s.hmda.confidence.find((c) => c.attribution_confidence === 'confirmed')?.n || 0)}{' '}
          confirmed, {fmtInt(s.hmda.confidence.find((c) => c.attribution_confidence === 'unresolved')?.n || 0)}{' '}
          unresolved, {fmtInt(s.hmda.confidence.find((c) => c.attribution_confidence === 'review_required')?.n || 0)}{' '}
          review-required. Unresolved rows remain in the application/origination totals. No lender ranking. No
          demographic fairness score.
        </p>
      </section>

      <section aria-labelledby="cfpb-heading" className="mt-10">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          Florida consumer complaint observations
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          CFPB Consumer Complaint Database rows with consumer state Florida, in the mortgage-scoped production table
          ({fmtInt(s.cfpb.rows)} observations). These are consumer-submitted records — not violations, not proven
          misconduct, and not OFR findings. Geography is complaint-reported-from, never licensed-in. Unattributed rows
          are included.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(s.cfpb.rows)} label="Florida mortgage complaint observations" />
          <Metric value={fmtInt(s.cfpb.confirmed)} label="Confirmed to a canonical institution" hint={`${fmtInt(s.cfpb.attached_inst)} distinct institutions.`} />
          <Metric value={fmtInt(s.cfpb.high_confidence)} label="High-confidence attribution" />
          <Metric value={fmtInt(s.cfpb.unresolved)} label="Unattributed / unresolved" hint="Not silently excluded." />
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Date range {String(s.cfpb.date_min)} to {String(s.cfpb.date_max)}. Source observed {String(s.cfpb.observed)}.
          Review-required: {fmtInt(s.cfpb.review_required)}.
        </p>
        <h3 className="mt-5 text-base font-semibold text-[#0A2540]">Complaints by year</h3>
        <div className="mt-2 space-y-2" role="img" aria-label="Florida CFPB mortgage complaints by year">
          {cfpbYears.map((y) => (
            <BarRow key={y.y} label={String(y.y)} n={y.n} max={yearMax} />
          ))}
        </div>
        <div className="mt-3 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[16rem] text-left text-sm">
            <caption className="sr-only">Florida CFPB mortgage complaints by year</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-2">Year</th>
                <th scope="col" className="py-2">Observations</th>
              </tr>
            </thead>
            <tbody>
              {cfpbYears.map((y) => (
                <tr key={y.y} className="border-b border-slate-100">
                  <td className="py-2 pr-2">{y.y}</td>
                  <td className="py-2 tabular-nums">{fmtInt(y.n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="mt-5 text-base font-semibold text-[#0A2540]">Frequent issues</h3>
        <ul className="mt-2 space-y-2">
          {issues.map((i) => (
            <li key={i.issue}>
              <BarRow label={i.issue} n={i.n} max={issueMax} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="federal-heading" className="mt-10">
        <h2 id="federal-heading" className="text-lg font-semibold text-[#0A2540]">
          Federal enforcement overlay
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          FEDERAL evidence is kept separate from Florida OFR. National federal enforcement events in production:{' '}
          {fmtInt(s.baseline.enf)}. A Florida-relevant overlay was attempted only where a confirmed federal respondent
          shares a canonical institution with a confirmed current Florida Chapter 494 company credential — not from
          headquarters or address. That identity intersection is currently {fmtInt(s.federal_overlay.events)} events /{' '}
          {fmtInt(s.federal_overlay.institutions)} institutions, so no federal count appears in the hero. Separate
          sovereign actions are not summed and not auto-deduplicated. Many Chapter 494 companies are nonbanks and are
          not banks, credit unions, or federally supervised depositories.
        </p>
      </section>

      <section aria-labelledby="limits-heading" className="mt-10">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          Important limitations
        </h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>6,435 credentials ≠ 6,325 companies.</li>
          <li>22 Approved company NMLS identities remain REVIEW_REQUIRED.</li>
          <li>OFR FLAIO automated coverage begins July 2015. Pre-2015 REAL search is not in the P0 bulk corpus.</li>
          <li>607 company orders cannot currently be safely attached to the CURRENT Approved company identity foundation.</li>
          <li>9 company PDFs were not text extractable. Fine-dollar coverage is partial.</li>
          <li>CFPB complaints are consumer reports, not findings.</li>
          <li>HMDA measures lending activity/reporting, not lender quality.</li>
          <li>OFR business address/county is not service territory.</li>
          <li>No Branch or MLO identity layer exists yet. No Trust Score, complaint score, or ranking.</li>
        </ul>
      </section>

      <section aria-labelledby="sources-heading" className="mt-10">
        <h2 id="sources-heading" className="text-lg font-semibold text-[#0A2540]">
          Sources &amp; methodology
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Snapshot generated {s.generated_at}. That is not a claim that every underlying source updated on that day.
        </p>
        <div className="mt-3 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <caption className="sr-only">Florida research sources</caption>
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="py-2 pr-2">Source</th>
                <th scope="col" className="py-2 pr-2">Role</th>
                <th scope="col" className="py-2">As-of / retrieved</th>
              </tr>
            </thead>
            <tbody>
              {s.sources.map((src) => (
                <tr key={src.id} className="border-b border-slate-100 align-top">
                  <td className="py-2 pr-2">
                    {src.url ? (
                      <a href={src.url} className="break-words text-[#047857] underline underline-offset-2">
                        {src.name} (official FLAIO index)
                      </a>
                    ) : (
                      src.name
                    )}
                  </td>
                  <td className="py-2 pr-2">{src.role}</td>
                  <td className="py-2">
                    As-of {src.as_of || 'see coverage'}. Retrieved {src.retrieved || 'n/a'}.
                    <span className="mt-1 block text-xs text-slate-500">{src.limitations}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Read the hub{' '}
          <Link href="/methodology" className="text-[#047857] underline underline-offset-2">
            methodology
          </Link>
          . Confirm licenses on{' '}
          <a
            href="https://www.nmlsconsumeraccess.org/"
            className="text-[#047857] underline underline-offset-2"
          >
            NMLS Consumer Access
          </a>{' '}
          and{' '}
          <a href="https://flofr.gov/" className="text-[#047857] underline underline-offset-2">
            Florida OFR
          </a>
          .
        </p>
      </section>
    </div>
  );
}
