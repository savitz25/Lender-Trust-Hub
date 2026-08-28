import Link from 'next/link';
import type { ProfileIntelligence } from '@/lib/identity/profile-intelligence';
import { FLORIDA_PHASE1_COPY, EVENT_TYPE_LABEL, FINDING_LABEL } from '@/lib/florida-profile/copy';
import type { FloridaPublicProfile, PublicOfrEvent } from '@/lib/florida-profile/public-projection';

function Card({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <h2 id={id} className="text-lg font-semibold text-[#0A2540] sm:text-xl">
          {title}
        </h2>
      </div>
      <div className="min-w-0 space-y-3 px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function fmtUsd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function EventList({ events }: { events: PublicOfrEvent[] }) {
  if (!events.length) return null;
  return (
    <ul className="space-y-2">
      {events.map((e, i) => (
        <li key={`${e.case_number || e.event_date || i}-${i}`} className="min-w-0 rounded-lg border border-slate-100 px-3 py-2 text-sm">
          <p className="font-medium text-[#0A2540]">
            {EVENT_TYPE_LABEL[e.event_type_normalized] || e.event_type_normalized}
            {e.event_date ? ` · ${e.event_date}` : ''}
          </p>
          {e.finding_type ? (
            <p className="mt-1 text-slate-600">
              Finding: {FINDING_LABEL[e.finding_type] || e.finding_type}
              {e.finding_type === 'CONSENTED_ORDER' ? ` — ${FLORIDA_PHASE1_COPY.consentNotAdmission}` : ''}
            </p>
          ) : null}
          {e.amount != null ? <p className="mt-1 tabular-nums text-slate-700">Parsed fine amount: {fmtUsd(e.amount)}</p> : null}
          {e.document_url ? (
            <p className="mt-1">
              <a href={e.document_url} className="text-[#047857] underline underline-offset-2" rel="noopener noreferrer">
                {FLORIDA_PHASE1_COPY.viewOrder}
              </a>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function FloridaCompanyProfile({
  florida,
  national,
  fetchMs,
}: {
  florida: FloridaPublicProfile;
  national?: { profile: ProfileIntelligence; fetchMs: number } | null;
  fetchMs: number;
}) {
  const classes = Array.from(new Set(florida.credentials.map((c) => c.license_class_label)));
  return (
    <article className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="text-[#047857] underline underline-offset-2">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/florida" className="text-[#047857] underline underline-offset-2">
              Florida research
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800">{florida.name}</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#047857]">Independent research · Florida</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">{florida.name}</h1>
        <p className="mt-2 font-mono text-sm text-slate-700">NMLS Institution ID {florida.nmls_id}</p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-slate-700">{florida.independent}</p>
        <p className="mt-2 text-sm text-slate-600">This is not a ranking, recommendation, or score.</p>
      </header>

      <div className="mt-6 grid min-w-0 gap-4">
        <Card title="Florida Chapter 494 credentials" id="credentials-heading">
          <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.credentialsNotCompanies}</p>
          <p className="text-sm text-slate-700">
            {florida.credentials.length} Approved credential{florida.credentials.length === 1 ? '' : 's'}
            {classes.length ? ` · ${classes.join(' · ')}` : ''}
            {florida.dual_mbr_mld ? ' · dual MBR + MLD' : ''}
          </p>
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[20rem] text-left text-sm">
              <caption className="sr-only">Florida OFR Approved company credentials</caption>
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-3">Class</th>
                  <th scope="col" className="py-2 pr-3">License</th>
                  <th scope="col" className="py-2 pr-3">Phone</th>
                  <th scope="col" className="py-2">Primary address</th>
                </tr>
              </thead>
              <tbody>
                {florida.credentials.map((c) => (
                  <tr key={`${c.license_class}-${c.license_number}`} className="border-b border-slate-100 align-top">
                    <td className="py-2 pr-3">{c.license_class_label}</td>
                    <td className="py-2 pr-3 font-mono">{c.license_number}</td>
                    <td className="py-2 pr-3">{c.phone || '—'}</td>
                    <td className="py-2">
                      {c.prim_address
                        ? [c.prim_address.address1, c.prim_address.city, c.prim_address.state, c.prim_address.zip]
                            .filter(Boolean)
                            .join(', ')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {florida.servicer_statement ? <p className="text-sm text-slate-800">{florida.servicer_statement}</p> : null}
          <p className="text-xs text-slate-500">{FLORIDA_PHASE1_COPY.addressNotTerritory}</p>
        </Card>

        <Card title={FLORIDA_PHASE1_COPY.regulatoryHeading} id="ofr-heading">
          {florida.ofr.no_event_copy ? (
            <>
              <p className="text-sm text-slate-800">{florida.ofr.no_event_copy}</p>
              <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.notCleanRecord}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-700">
                {florida.ofr.confirmed_event_observations} confirmed Florida OFR observation
                {florida.ofr.confirmed_event_observations === 1 ? '' : 's'} attached to this identity. Review-required and
                unresolved orders are not shown.
              </p>
              <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.notAutomaticallyAdverse}</p>
              {florida.ofr.fine_bearing_observations ? (
                <p className="text-sm text-slate-700">
                  Confirmed fine-bearing observations on this profile: {florida.ofr.fine_bearing_observations} totaling{' '}
                  {fmtUsd(florida.ofr.parsed_fine_dollars)} parsed dollars. These are this company’s attributable confirmed
                  observations, not Florida statewide totals.
                </p>
              ) : null}
              <EventList events={florida.ofr.recent_events} />
              {florida.ofr.official_document_links.map((d) => (
                <p key={d.url} className="text-sm">
                  <a href={d.url} className="text-[#047857] underline underline-offset-2" rel="noopener noreferrer">
                    {d.title || FLORIDA_PHASE1_COPY.viewOrder}
                  </a>
                </p>
              ))}
            </>
          )}
        </Card>

        {florida.hmda ? (
          <Card title="Florida HMDA activity" id="hmda-heading">
            <p className="text-sm text-slate-700">
              Florida state-grain HMDA: {florida.hmda.applications.toLocaleString('en-US')} applications,{' '}
              {florida.hmda.originations.toLocaleString('en-US')} originations.
              {florida.hmda.vintages.length ? ` Vintage: ${florida.hmda.vintages.join(', ')}.` : ''}
            </p>
            <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.hmdaNotQuality}</p>
          </Card>
        ) : null}

        {florida.cfpb ? (
          <Card title="CFPB consumer complaint observations" id="cfpb-heading">
            <p className="text-sm text-slate-700">
              {florida.cfpb.confirmed_rows.toLocaleString('en-US')} confirmed consumer complaint observation
              {florida.cfpb.confirmed_rows === 1 ? '' : 's'} attributed to this institution.
            </p>
            <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.cfpbNotFindings}</p>
          </Card>
        ) : null}

        {national ? (
          <Card title="National / federal evidence" id="national-heading">
            <p className="text-sm text-slate-600">{FLORIDA_PHASE1_COPY.ofrNotFederal}</p>
            <ul className="space-y-1 text-sm text-slate-700">
              <li>National identity snapshot: present</li>
              <li>HMDA coverage: {national.profile.coverage.hmda}</li>
              <li>CFPB coverage: {national.profile.coverage.cfpb} — {FLORIDA_PHASE1_COPY.cfpbNotFindings}</li>
              <li>
                Federal enforcement coverage: {national.profile.coverage.enforcement}. Absence is not a clean-record finding.
              </li>
            </ul>
          </Card>
        ) : null}

        <Card title="Sources and freshness" id="sources-heading">
          <ul className="space-y-2 text-sm text-slate-700">
            {florida.sources.map((s) => (
              <li key={s.id}>
                <span className="font-medium">{s.name}</span>
                {s.as_of ? ` · as-of ${s.as_of}` : ''}
                {s.coverage_start ? ` · coverage from ${s.coverage_start}` : ''}
                {s.role ? ` — ${s.role}` : ''}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">
            OFR licensing as-of {florida.freshness.ofr_licensing_as_of}. FLAIO {florida.freshness.flaio_coverage_start} to{' '}
            {florida.freshness.flaio_coverage_end}. Dates are source dates, not “updated today.”
          </p>
        </Card>

        <Card title="Limitations" id="limitations-heading">
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {florida.limitations.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">Server render {fetchMs} ms. Snapshot lookup only.</p>
        </Card>
      </div>
    </article>
  );
}
