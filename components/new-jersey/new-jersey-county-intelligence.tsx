import type { ReactNode } from 'react';
import Link from 'next/link';
import { Trace } from '@/components/new-jersey/trace';
import { NJ_COUNTY_INTELLIGENCE_GATES, NJ_COUNTY_SNAPSHOTS } from '@/lib/new-jersey-intelligence/counties';
import { fmtInt, fmtPct, fmtUsd } from '@/lib/new-jersey-intelligence/snapshot';
import type { NjCountyIntelligenceSnapshot, NjCountySlug } from '@/lib/new-jersey-intelligence/counties';

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

function BarRow({ label, n, max }: { label: string; n: number; max: number }) {
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
    </div>
  );
}

function OfficialLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} className="text-[#047857] underline underline-offset-2" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function NewJerseyCountyIntelligence({ snapshot }: { snapshot: NjCountyIntelligenceSnapshot }) {
  const s = snapshot;
  const H = s.hmda;
  const mixMax = Math.max(H.apps_conventional, H.apps_fha, H.apps_va, H.apps_usda_other);
  const purposeMax = Math.max(H.purchase_applications, H.refinance_applications);
  const sheriffAcquired = s.sheriff.coverage_state === 'ACQUIRED_CURRENT_SNAPSHOT';
  const propertyAcquired = s.property.coverage_state === 'ACQUIRED_CURRENT_SNAPSHOT';
  const siblingSlugs = (Object.keys(NJ_COUNTY_SNAPSHOTS) as NjCountySlug[]).filter(
    (slug) => slug !== s.county_slug,
  );

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
          <li>
            <Link href="/new-jersey" className="text-[#047857] underline underline-offset-2">
              New Jersey research
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800">{s.county_name} County</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">
          Independent research · {s.county_name} County, New Jersey
        </p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          {s.county_name} County Mortgage &amp; Property-Market Research
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          A source-backed view of {s.county_name} County mortgage-market activity, NJHMFA down-payment geography, and
          official county research access. This is not a ranking, recommendation, or Trust Score.
        </p>
      </header>

      <section aria-labelledby="hero-metrics" className="mt-8">
        <h2 id="hero-metrics" className="sr-only">
          Snapshot metrics
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric
            value={fmtInt(H.applications)}
            label="HMDA applications"
            hint="2025 HMDA, properties in this county. Not a count of NJ-licensed lenders."
          />
          <Metric value={fmtInt(H.originations)} label="HMDA originations" hint="2025 HMDA originations." />
          <Metric
            value={fmtPct(H.denial_rate_pct)}
            label="Denial rate"
            hint="Denials ÷ applications. Not a quality score."
          />
          <Metric
            value={fmtUsd(s.njhmfa.combined)}
            label="Potential combined DPA"
            hint="Eligible borrowers may qualify for up to this amount. County alone does not establish eligibility."
          />
        </div>
      </section>

      <section aria-labelledby="findings-heading" className="mt-10">
        <h2 id="findings-heading" className="text-lg font-semibold text-[#0A2540]">
          County findings
        </h2>
        <ul className="mt-3 list-disc space-y-3 pl-5 text-sm leading-relaxed text-slate-700">
          {s.findings.map((f) => (
            <li key={f.id}>
              <span className="font-medium text-slate-800">{f.title}. </span>
              {f.body}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="hmda-heading" className="mt-10">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          2025 {s.county_name} County mortgage market
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{H.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric value={fmtInt(H.applications)} label="Applications" hint="HMDA 2025, properties in this county." />
          <Metric value={fmtInt(H.originations)} label="Originations" />
          <Metric value={fmtInt(H.denials)} label="Denials" />
          <Metric value={fmtPct(H.denial_rate_pct)} label="Denial rate" hint="Denials ÷ applications in this extract." />
        </div>
        <Trace
          source={H.source}
          sourceDate={H.source_as_of}
          denominator={`${fmtInt(H.applications)} applications`}
          calculation={H.denial_rate_calculation}
          grain="County row from the committed New Jersey HMDA slice"
          coverage={H.coverage_state}
          caveat={H.caveat}
        />

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Applications compared with originations and denials</h3>
        <div className="mt-3 space-y-3">
          <BarRow label="Applications" n={H.applications} max={H.applications} />
          <BarRow label="Originations" n={H.originations} max={H.applications} />
          <BarRow label="Denials" n={H.denials} max={H.applications} />
        </div>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan purpose (applications)</h3>
        <p className="mt-1 text-sm text-slate-600">
          Purchase {fmtPct(H.purchase_pct_of_apps)} and refinance {fmtPct(H.refinance_pct_of_apps)} of applications.
          These are application-purpose counts, not originations.
        </p>
        <div className="mt-3 space-y-3">
          <BarRow label="Purchase applications" n={H.purchase_applications} max={purposeMax} />
          <BarRow label="Refinance applications" n={H.refinance_applications} max={purposeMax} />
        </div>

        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Loan type (applications)</h3>
        <div className="mt-3 space-y-3">
          <BarRow label={`Conventional (${fmtPct(H.conventional_pct)})`} n={H.apps_conventional} max={mixMax} />
          <BarRow label={`FHA (${fmtPct(H.fha_pct)})`} n={H.apps_fha} max={mixMax} />
          <BarRow label={`VA (${fmtPct(H.va_pct)})`} n={H.apps_va} max={mixMax} />
          <BarRow label={`USDA / other (${fmtPct(H.usda_other_pct)})`} n={H.apps_usda_other} max={mixMax} />
        </div>
      </section>

      <section aria-labelledby="dpa-heading" className="mt-10">
        <h2 id="dpa-heading" className="text-lg font-semibold text-[#0A2540]">
          NJHMFA down payment assistance
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.njhmfa.copy}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.njhmfa.caveat}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Metric value={fmtUsd(s.njhmfa.standard_dpa)} label="Potential DPA" hint="Eligible borrowers may qualify for up to this amount." />
          <Metric value={fmtUsd(s.njhmfa.first_generation)} label="Potential first-generation supplement" hint="Where the borrower is eligible." />
          <Metric value={fmtUsd(s.njhmfa.combined)} label="Potential combined" hint="Not a guarantee." />
        </div>
        <h3 className="mt-6 text-base font-semibold text-[#0A2540]">Current program families</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {s.njhmfa.program_families.map((p) => (
            <li key={p.program_key}>
              <OfficialLink href={p.source_url}>{p.official_name}</OfficialLink>
            </li>
          ))}
        </ul>
        <Trace
          source={s.njhmfa.source}
          sourceDate={s.njhmfa.source_effective_on}
          denominator="County of the property being purchased, not the borrower's residence county alone"
          calculation="Official 12-county group amounts; 'up to' and eligibility-conditioned"
          grain="County membership in NJHMFA DPA geography"
          coverage="ACQUIRED_CURRENT_SNAPSHOT"
          caveat={s.njhmfa.caveat}
        />
      </section>

      <section aria-labelledby="land-heading" className="mt-10">
        <h2 id="land-heading" className="text-lg font-semibold text-[#0A2540]">
          Land-record research access
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.land_records.copy}</p>
        <p className="mt-2 text-sm text-slate-700">
          Access class: {s.land_records.access_class.replace(/_/g, ' ')}.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {s.land_records.what_users_can_research.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm">
          <OfficialLink href={s.land_records.source_url}>Open the official {s.land_records.system_name} search</OfficialLink>
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Land records are not a title report. Mortgage recording is not current balance. This page does not scrape the
          portal.
        </p>
      </section>

      <section aria-labelledby="sheriff-heading" className="mt-10">
        <h2 id="sheriff-heading" className="text-lg font-semibold text-[#0A2540]">
          Sheriff-sale context
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.sheriff.copy}</p>
        {sheriffAcquired && s.sheriff.status_class_counts ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric value={fmtInt(s.sheriff.listing_count ?? 0)} label="Listings in snapshot" hint={`As of ${s.sheriff.source_as_of}.`} />
            <Metric
              value={fmtInt(s.sheriff.status_class_counts.SCHEDULED_NOT_COMPLETED ?? 0)}
              label="Scheduled (not completed)"
            />
            <Metric
              value={fmtInt(s.sheriff.status_class_counts.ADJOURNED_NOT_COMPLETED ?? 0)}
              label="Adjourned (not completed)"
            />
            <Metric
              value={fmtInt(s.sheriff.completed_sale_count ?? 0)}
              label="Completed-sale status on this listing"
              hint={
                'completed_sale_status_label' in s.sheriff && s.sheriff.completed_sale_status_label
                  ? String(s.sheriff.completed_sale_status_label)
                  : 'Zero completed-sale rows in this snapshot is not a claim that sales never occur.'
              }
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Coverage: SOURCE_NOT_ACQUIRED. Missing count is not zero sheriff sales.
          </p>
        )}
        <p className="mt-3 text-sm">
          <OfficialLink href={s.sheriff.source_url}>Official sheriff-sale source</OfficialLink>
        </p>
      </section>

      <section aria-labelledby="property-heading" className="mt-10">
        <h2 id="property-heading" className="text-lg font-semibold text-[#0A2540]">
          Property / parcel context
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.property.copy}</p>
        {propertyAcquired && s.property.feature_count != null ? (
          <div className="mt-4">
            <Metric
              value={fmtInt(s.property.feature_count)}
              label="Parcel / MOD-IV features"
              hint="Not a housing-unit or household count. Assessment is not appraisal."
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            Coverage: SOURCE_NOT_ACQUIRED. Missing parcel count is not zero parcels.
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">{s.property.daniels_law}</p>
      </section>

      {s.local_housing_resources ? (
        <section aria-labelledby="housing-heading" className="mt-10">
          <h2 id="housing-heading" className="text-lg font-semibold text-[#0A2540]">
            {s.local_housing_resources.label}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            These are local housing and repair resources. They are not mortgage products. Amounts are stated only as of
            the official county page date.
          </p>
          <div className="mt-4 space-y-3">
            {s.local_housing_resources.programs.map((p) => (
              <article key={p.program_id} className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-base font-semibold text-[#0A2540]">{p.program_name}</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  <li>Type: {p.benefit_type}</li>
                  <li>Published amount: {p.benefit_amount_published}</li>
                  <li>Property: {p.eligible_property}</li>
                  <li>{p.note}</li>
                </ul>
              </article>
            ))}
          </div>
          <p className="mt-3 text-sm">
            <OfficialLink href={s.local_housing_resources.source_url}>Official county program page</OfficialLink>
          </p>
        </section>
      ) : null}

      <section aria-labelledby="lenders-heading" className="mt-10">
        <h2 id="lenders-heading" className="text-lg font-semibold text-[#0A2540]">
          Lender research
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.lender_discovery.copy}</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <Link href={s.lender_discovery.state_catalog_href} className="text-[#047857] underline underline-offset-2">
              New Jersey lender catalog
            </Link>
          </li>
          <li>
            <Link href={s.lender_discovery.county_catalog_href} className="text-[#047857] underline underline-offset-2">
              {s.county_name} County catalog page
            </Link>
          </li>
          <li>
            <Link href={s.lender_discovery.program_finder_href} className="text-[#047857] underline underline-offset-2">
              Program finder
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="coverage-heading" className="mt-10">
        <h2 id="coverage-heading" className="text-lg font-semibold text-[#0A2540]">
          Source coverage
        </h2>
        <div className="mt-4 min-w-0 overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Source family</th>
                <th className="py-2 pr-3">Coverage</th>
                <th className="py-2 pr-3">As-of</th>
                <th className="py-2">Grain</th>
              </tr>
            </thead>
            <tbody>
              {s.coverage.source_families.map((c) => (
                <tr key={c.family} className="border-b border-slate-100">
                  <td className="py-2 pr-3">{c.family}</td>
                  <td className="py-2 pr-3">{c.coverage}</td>
                  <td className="py-2 pr-3">{c.as_of || '—'}</td>
                  <td className="py-2">{c.grain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-slate-500">Unavailable evidence is unknown, not zero.</p>
      </section>

      <section aria-labelledby="more-heading" className="mt-10">
        <h2 id="more-heading" className="text-lg font-semibold text-[#0A2540]">
          More New Jersey research
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            <Link href="/new-jersey" className="text-[#047857] underline underline-offset-2">
              New Jersey state intelligence
            </Link>
          </li>
          {siblingSlugs.map((slug) => (
            <li key={slug}>
              <Link
                href={NJ_COUNTY_INTELLIGENCE_GATES[slug].path}
                className="text-[#047857] underline underline-offset-2"
              >
                {NJ_COUNTY_SNAPSHOTS[slug].county_name} County
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
