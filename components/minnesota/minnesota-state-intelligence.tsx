import Link from 'next/link';
import { fmtInt, fmtPct, type MinnesotaIntelligenceSnapshot } from '@/lib/minnesota-intelligence/snapshot';

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

const CLASS_LABEL: Record<string, string> = {
  RESIDENTIAL_MORTGAGE_ORIGINATOR: 'Residential Mortgage Originator',
  RESIDENTIAL_MORTGAGE_SERVICER: 'Residential Mortgage Servicer',
};

export function MinnesotaStateIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <h1 className="text-2xl font-bold text-[#0A2540]">Minnesota Mortgage Licensing &amp; Lending Intelligence</h1>
      <p className="mt-3 text-sm text-slate-600">{reason}</p>
    </div>
  );
}

export function MinnesotaStateIntelligence({ snapshot }: { snapshot: MinnesotaIntelligenceSnapshot }) {
  const s = snapshot;
  const E = s.enforcement;
  const H = s.hmda;
  const A = s.existing_coverage_audit;
  const R = s.regulators;
  const L = s.licenses.law;
  const companies = E.orders.filter((o) => o.respondentClass === 'COMPANY');
  const people = E.orders.filter((o) => o.respondentClass === 'PERSON');
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
          <li className="text-slate-800">Minnesota research</li>
        </ol>
      </nav>
      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Minnesota · statewide</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          Minnesota Mortgage Licensing &amp; Lending Intelligence
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          The Minnesota Department of Commerce licenses residential mortgage originators and residential mortgage servicers
          (companies) under Minnesota Statutes chapter 58, and mortgage loan originators (individuals) under chapter 58A.
          NMLS is the licensing and verification system, not the Minnesota regulator. An originator, a servicer, a loan
          originator and a branch are different things, and banks and credit unions are outside this license population.
          There is no single &ldquo;Minnesota lenders&rdquo; number on this page. Not a ranking, recommendation, or Trust Score.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Snapshot {s.contract_name} · fingerprint {s.fingerprint.slice(0, 12)} · law cited from the 2025 Minnesota Statutes ·
          HMDA vintage 2025 · Commerce enforcement search retrieved {E.retrievedAt.slice(0, 10)} · page generated {s.generated_at}.
          Retrieval dates are not license or order dates.
        </p>
      </header>

      <section className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Separate Minnesota measures">
        <Metric value={fmtInt(E.rows)} label="Commerce mortgage enforcement actions, 2022–2026" hint={`${E.companyRows} against companies, ${E.personRows} against individuals (not named).`} />
        <Metric value={fmtInt(H.applications)} label="HMDA 2025 applications for Minnesota properties" hint="Federal activity data. Not a license count." />
        <Metric value="Not acquired" label="Minnesota licensee roster" hint="Verify each company or loan originator on NMLS Consumer Access. Unknown, not zero." />
      </section>

      <section className="mt-10" aria-labelledby="regulation-heading">
        <h2 id="regulation-heading" className="text-lg font-semibold text-[#0A2540]">
          Minnesota mortgage regulation
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {L['58.03'].classes} Commerce&apos;s <Official href={R.license_lookup} label="License Lookup" /> sends the public to{' '}
          <Official href={R.consumer_access} label="NMLS Consumer Access" /> for both &ldquo;Mortgage Originator and Servicer
          Companies, Residential&rdquo; and &ldquo;Mortgage Loan Originators, Individuals.&rdquo; Commerce publishes no downloadable
          mortgage license roster, so this page has no licensee count and does not copy NMLS records.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="originator-heading">
        <h2 id="originator-heading" className="text-lg font-semibold text-[#0A2540]">
          Residential mortgage originators
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {L['58.04'].originator_required} {L['58.04'].business_form} The originator bond starts at $125,000 (section 58.08).
          Licenses expire on December 31 and renew on January 1 (section 58.09). A bond, fee, or capital requirement is a
          licensing condition, not a measure of quality.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="servicer-heading">
        <h2 id="servicer-heading" className="text-lg font-semibold text-[#0A2540]">
          Residential mortgage servicers
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The residential mortgage servicer license is a separate company license. A servicer collects payments and manages
          loans; it is not automatically the company that originated the loan, and one company holding both licenses stays one
          company. Verify a servicer on NMLS Consumer Access.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="mlo-heading">
        <h2 id="mlo-heading" className="text-lg font-semibold text-[#0A2540]">
          Mortgage loan originators (individuals)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {L['58A.03'].mlo_required} {L['58A.03'].mlo_employed} {L['58A.03'].mlo_nmls} A loan originator is a person with a
          person NMLS ID, which is not a company NMLS ID. This site does not publish loan originator pages or counts, and
          loan originators are never added to company counts.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="nmls-heading">
        <h2 id="nmls-heading" className="text-lg font-semibold text-[#0A2540]">
          NMLS and existing identities
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The company identity used across LenderTrustHub is the NMLS ID. No Minnesota company was created for this page. A
          read-only check of the {fmtInt(A.curatedRows)} curated Minnesota HMDA-reporter rows ({fmtInt(A.distinctNmls)} NMLS
          IDs) found {fmtInt(A.exactIdentityPublicProfile)} with a public profile, {fmtInt(A.exactIdentityUnpublishedResearch)}{' '}
          as unpublished research identities, {fmtInt(A.publicationRestrictedPerson)} person record (not shown), and{' '}
          {fmtInt(A.noConfidentMatch)} with no confident match. Those are HMDA reporters, not a census of Minnesota licensees.
          Search a company by its NMLS ID, for example{' '}
          <Link href="/ask?q=NMLS%202229%20Minnesota" className="text-[#047857] underline underline-offset-2">
            NMLS 2229 Minnesota
          </Link>
          .
        </p>
      </section>

      <section className="mt-10" aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA 2025 activity (activity lens only)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {fmtInt(H.applications)} applications, {fmtInt(H.originations)} originations, and {fmtInt(H.denials)} denials (
          {fmtPct(H.denials_as_pct_of_total_applications)} of applications) for properties in {H.county_count} Minnesota
          counties, reported by {fmtInt(H.distinct_leis)} institutions (LEIs). HMDA covers banks, credit unions and licensed
          companies alike, so it is not the Commerce license list; an LEI is not an NMLS ID, and an application is not a lender.
        </p>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="HMDA 2025 top Minnesota counties">
          <table className="w-full min-w-[480px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">County</th>
                <th className="py-2 pr-3">Applications</th>
                <th className="py-2 pr-3">Originations</th>
                <th className="py-2">Denials</th>
              </tr>
            </thead>
            <tbody>
              {H.top_counties.map((c) => (
                <tr key={c.county_fips} className="border-t border-slate-100">
                  <td className="py-2 pr-3">{c.county_name || c.county_fips}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmtInt(c.applications)}</td>
                  <td className="py-2 pr-3 tabular-nums">{fmtInt(c.originations)}</td>
                  <td className="py-2 tabular-nums">{fmtInt(c.denials)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="enforcement-heading">
        <h2 id="enforcement-heading" className="text-lg font-semibold text-[#0A2540]">
          Commerce mortgage enforcement, 2022–2026
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Commerce&apos;s <Official href={E.source} label="CARDS enforcement search" />, filtered to Commerce&apos;s own
          &ldquo;Mortgage&rdquo; industry type and signed from January 1, 2022 to September 26, 2026, returns {E.rows} actions (
          {Object.entries(E.rowsByYear)
            .map(([y, n]) => `${y}: ${n}`)
            .join(', ')}
          ). Action types are shown as Commerce publishes them; a consent order is a settlement, not an adjudicated violation.
          {` ${E.personRows}`} actions are against individuals; they are counted but not named and their documents are not
          linked here. For the {E.companyRows} company actions, {E.companyOrdersRead} orders were read for the license and NMLS
          number printed in the caption ({E.companyOrdersNotRead429} could not be read because the site limited requests). An
          action is linked to an existing LenderTrustHub identity only when the order prints that company&apos;s NMLS ID and it
          matches exactly ({E.exactNmlsAttachments} actions); nothing is matched by name.
        </p>
        <div className="mt-3 overflow-x-auto" tabIndex={0} role="region" aria-label="Commerce mortgage enforcement actions against companies">
          <table className="w-full min-w-[640px] text-left text-sm text-slate-700">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2 pr-3">Signed</th>
                <th className="py-2 pr-3">Company (as published)</th>
                <th className="py-2 pr-3">Action type</th>
                <th className="py-2 pr-3">License printed</th>
                <th className="py-2">NMLS link</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((o) => (
                <tr key={o.id} className="border-t border-slate-100 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{o.signedDate}</td>
                  <td className="py-2 pr-3">
                    {o.documentUrl ? <Official href={o.documentUrl} label={o.respondentAsPublished ?? 'Order document'} /> : o.respondentAsPublished}
                  </td>
                  <td className="py-2 pr-3">{o.actionTypeAsPublished}</td>
                  <td className="py-2 pr-3">
                    {o.orderText.documentRead
                      ? o.orderText.licenseClassPrinted
                        ? `${CLASS_LABEL[o.orderText.licenseClassPrinted]}${o.orderText.minnesotaLicensePrinted ? ` ${o.orderText.minnesotaLicensePrinted}` : ''}`
                        : 'Not printed in caption'
                      : 'Order not read'}
                  </td>
                  <td className="py-2">
                    {o.attachedIdentity ? (
                      <Link href={`/ask?q=NMLS%20${o.attachedIdentity.nmls}`} className="text-[#047857] underline underline-offset-2">
                        NMLS {o.attachedIdentity.nmls}
                      </Link>
                    ) : o.nmlsPrintedNotInSpine ? (
                      `NMLS ${o.nmlsPrintedNotInSpine} printed; no exact identity here`
                    ) : (
                      'Standalone'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Actions against individuals ({people.length}): signed dates{' '}
          {people
            .map((o) => o.signedDate)
            .sort()
            .reverse()
            .join(', ')}
          . Names, allegations and documents are withheld.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="complaints-heading">
        <h2 id="complaints-heading" className="text-lg font-semibold text-[#0A2540]">
          Complaints
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Commerce takes consumer complaints about mortgage originators, servicers and loan originators. Complaint records and
          outcomes are not published by company, so there is no complaint count here (request only). A complaint is not an
          enforcement action or a finding.
        </p>
      </section>

      <section className="mt-10" aria-labelledby="limits-heading">
        <h2 id="limits-heading" className="text-lg font-semibold text-[#0A2540]">
          What this page does not mean
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-600">
          <li>No count of Minnesota lenders: originators, servicers, loan originators, branches and HMDA rows are never added together.</li>
          <li>The Commerce license population is not every Minnesota mortgage lender; banks and credit unions are regulated separately.</li>
          <li>No ranking, recommendation, lowest-rate claim, or Trust Score.</li>
          <li>No Minneapolis, St. Paul, Rochester, Duluth, or county research page.</li>
        </ul>
      </section>
    </div>
  );
}
