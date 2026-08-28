import Link from 'next/link';
import type { ProfileIntelligence } from '@/lib/identity/profile-intelligence';
import type { NationalProfileCohortEntry } from '@/lib/national-profile/cohort';
import { nationalPresentationName } from '@/lib/national-profile/discovery';
import {
  coverageCopy,
  familyLabel,
  formatInt,
  formatRate,
  identifierLabel,
  metricDef,
  nameKindLabel,
  primaryClassification,
  stateName,
  topEntries,
} from '@/lib/national-profile/format';


function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function metricBox(v: unknown): { available?: boolean; value?: number | null; numerator?: number | null; denominator?: number | null; reason?: string; denominator_definition?: string } {
  return asRecord(v) as ReturnType<typeof metricBox>;
}

function Card({
  title,
  children,
  id,
}: {
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <h2 id={id} className="text-lg font-semibold text-[#0A2540] sm:text-xl">
          {title}
        </h2>
      </div>
      <div className="min-w-0 space-y-4 px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

function DistTable({
  caption,
  rows,
}: {
  caption: string;
  rows: { label: string; count: number }[];
}) {
  if (!rows.length) return null;
  return (
    <div className="min-w-0 overflow-x-auto">
      <table className="w-full min-w-[16rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th scope="col" className="py-2 pr-3 font-semibold">
              Category
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-slate-100">
              <td className="max-w-[14rem] break-words py-2 pr-3 text-slate-800 sm:max-w-none">{r.label}</td>
              <td className="py-2 text-right tabular-nums text-[#0A2540]">{formatInt(r.count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NationalLenderProfile({
  entry,
  profile,
  fetchSource,
  fetchMs,
  indexable = false,
}: {
  entry: NationalProfileCohortEntry;
  profile: ProfileIntelligence;
  fetchSource: string;
  fetchMs: number;
  indexable?: boolean;
}) {
  const lending = asRecord(profile.lending);
  const geo = asRecord(profile.geography);
  const cfpb = asRecord(profile.cfpb);
  const enf = asRecord(profile.enforcement);
  const roles = asRecord(profile.roles);
  const ids = profile.identity.identifiers || [];
  const names = profile.identity.names || [];
  const classes = profile.identity.classifications || [];
  const cover = coverageCopy(profile.coverage);
  const typeLabel = primaryClassification(classes);
  const headingName = nationalPresentationName(profile.identity.canonical_name, profile.identity.display_name);
  const nmls = ids.find((i) => i.identifier_type === 'NMLS_INSTITUTION');
  const lei = ids.find((i) => i.identifier_type === 'LEI');
  const cert = ids.find((i) => i.identifier_type === 'FDIC_CERT');
  const ncua = ids.find((i) => i.identifier_type === 'NCUA_CHARTER');
  const apps = metricBox(lending.hmda_application_count);
  const orig = metricBox(lending.hmda_origination_count);
  const origRate = metricBox(lending.hmda_origination_rate);
  const den = metricBox(lending.hmda_denial_count);
  const denRate = metricBox(lending.hmda_denial_rate);
  const hmdaPeriod = String(lending.period || 'HMDA 2025 reporting vintage');
  const states = Array.isArray(geo.states) ? (geo.states as { state: string; applications: number; originations: number }[]) : [];
  const topStates = [...states].sort((a, b) => b.applications - a.applications).slice(0, 10);
  const counties = Array.isArray(geo.top_counties)
    ? (geo.top_counties as { state: string; county_fips: string; applications: number; originations: number }[])
    : [];
  const hq = asRecord(geo.headquarters);
  const unresolved = Array.isArray(cfpb.unresolved_related)
    ? (cfpb.unresolved_related as { label: string; complaint_count: number | null; reason: string }[])
    : [];
  const sourceLabels = Array.isArray(cfpb.source_labels)
    ? (cfpb.source_labels as { source_company_key: string; confidence: string; count: number }[])
    : [];
  const events = Array.isArray(enf.events)
    ? (enf.events as {
        agency: string;
        action_family: string;
        issued_on: string | null;
        procedural_posture: string | null;
        source_url: string | null;
        title: string | null;
        attribution_confidence: string;
      }[])
    : [];
  const servicer = String(roles.servicer_status || profile.coverage.servicer_role);
  const sources = Array.isArray(profile.sources) ? profile.sources : [];
  const hmdaAppDef = metricDef('hmda_application_count');
  const denDef = metricDef('hmda_denial_rate');

  return (
    <div
      className="min-w-0 max-w-full overflow-x-clip"
      data-lth-profile-source={fetchSource}
      data-lth-contract={profile.contract_version}
      data-lth-stable-key={entry.stableKey}
      data-lth-institution-id={profile.identity.institution_id}
      data-lth-robots={indexable ? 'index,follow' : 'noindex,nofollow'}
    >
      <div className="th-shell mx-auto w-full max-w-[1200px] px-4 py-8 sm:py-10">
        {indexable ? (
          <p className="mb-4 break-words rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-700">
            Independent research profile. Not a ranking.
          </p>
        ) : (
          <p className="mb-4 break-words rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-950">
            Research profile. Not indexed. Not a ranking.
          </p>
        )}

        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
          <ol className="flex min-w-0 flex-wrap gap-1">
            <li>
              <Link href="/" className="text-[#0D9488] underline-offset-2 hover:underline">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/lender" className="text-[#0D9488] underline-offset-2 hover:underline">
                Lender research
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="min-w-0 break-words text-slate-800">{headingName}</li>
          </ol>
        </nav>

        <header className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-[#0A2540] px-4 py-6 text-white sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-200">Independent lender research</p>
          <h1 className="mt-1 break-words text-2xl font-bold leading-tight sm:text-3xl">
            {headingName}
          </h1>
          {typeLabel ? <p className="mt-2 text-sm text-slate-200">{typeLabel}</p> : null}
          <ul className="mt-4 flex min-w-0 flex-wrap gap-2 text-sm">
            {nmls ? (
              <li className="max-w-full break-words rounded-full bg-white/10 px-3 py-1">NMLS Institution ID {nmls.identifier_value}</li>
            ) : null}
            {cert ? <li className="rounded-full bg-white/10 px-3 py-1">FDIC Certificate {cert.identifier_value}</li> : null}
            {ncua ? <li className="rounded-full bg-white/10 px-3 py-1">NCUA {ncua.identifier_value}</li> : null}
            {lei && !nmls && !cert && !ncua ? (
              <li className="max-w-full break-all rounded-full bg-white/10 px-3 py-1">LEI {lei.identifier_value}</li>
            ) : null}
          </ul>
          {hq.city || hq.state ? (
            <p className="mt-3 text-sm text-slate-200">
              Headquarters (FDIC record): {[hq.city, hq.state].filter(Boolean).join(', ')}
            </p>
          ) : null}
          <p className="mt-4 max-w-full break-words text-sm leading-relaxed text-slate-200">
            Independent research from official public records. No paid ranking. No lender score. Not lending advice.
          </p>
          <p className="mt-2 max-w-full break-words text-xs leading-relaxed text-teal-100">
            HMDA activity shown reflects the 2025 reporting vintage. Dates below are source dates, not ingest dates.
          </p>
        </header>

        <div className="mt-6 grid min-w-0 gap-4">
          <Card title="Evidence coverage" id="coverage-heading">
            <p className="text-sm text-slate-600">
              Coverage describes what this evidence layer contains. <strong>None observed</strong> is not the same as
              none exists. <strong>Partial</strong> means the evidence layer is incomplete.
            </p>
            <ul className="grid min-w-0 gap-3 sm:grid-cols-2">
              {Object.entries(cover).map(([key, item]) => (
                <li key={key} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="mt-1 font-semibold text-[#0A2540]">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.meaning}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Identity & regulatory identifiers" id="identity-heading">
            <p className="text-sm text-slate-600">
              Identifiers are shown in their own namespaces. An LEI is not an NMLS ID. An NMLS Institution ID is not a
              branch or person ID. An FDIC certificate is not a mortgage license.
            </p>
            <dl className="grid min-w-0 gap-2">
              {ids.map((id) => (
                <div key={`${id.identifier_type}:${id.identifier_value}`} className="min-w-0 rounded-lg border border-slate-100 px-3 py-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {identifierLabel(id.identifier_type)}
                  </dt>
                  <dd className="break-all font-mono text-sm text-[#0A2540]">{id.identifier_value}</dd>
                </div>
              ))}
            </dl>
            {names.length ? (
              <div>
                <h3 className="text-sm font-semibold text-[#0A2540]">Names on this institution</h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {names.map((n) => (
                    <li key={`${n.kind}:${n.name}`} className="min-w-0 break-words">
                      <span className="text-slate-500">{nameKindLabel(n.kind)}:</span> {n.name}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  Historical names remain on this same institution. They do not create a separate profile.
                </p>
              </div>
            ) : null}
          </Card>

          <Card title="Mortgage activity reported through HMDA" id="hmda-heading">
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <strong>Period:</strong> {hmdaPeriod}. This is not 2026 mortgage activity. Source: FFIEC HMDA 2025 LEI
              summaries.
            </p>
            {lending.source && profile.coverage.hmda === 'NOT AVAILABLE' ? (
              <p className="text-sm text-slate-600">No HMDA observations are attached to this institution in the current evidence layer.</p>
            ) : null}
            {profile.coverage.hmda === 'AVAILABLE' ? (
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {apps.available && apps.value != null ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Applications</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0A2540]">{formatInt(apps.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">{hmdaAppDef?.numerator}. Not a quality signal.</p>
                  </div>
                ) : null}
                {orig.available && orig.value != null ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Originations</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0A2540]">{formatInt(orig.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">{metricDef('hmda_origination_count')?.numerator}.</p>
                  </div>
                ) : null}
                {origRate.available && origRate.value != null ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Origination rate</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0A2540]">{formatRate(origRate.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatInt(origRate.numerator)} originations / {formatInt(origRate.denominator)} applications.
                      Not an approval prediction.
                    </p>
                  </div>
                ) : null}
                {den.available && den.value != null ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Denials</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0A2540]">{formatInt(den.value)}</p>
                    <p className="mt-1 text-xs text-slate-500">County-grain denial count. Not a quality score.</p>
                  </div>
                ) : null}
                {denRate.available && denRate.value != null ? (
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Denial rate</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-[#0A2540]">{formatRate(denRate.value)}</p>
                    <p className="mt-1 text-xs text-slate-600">
                      {formatInt(denRate.numerator)} county-grain denials ÷ {formatInt(denRate.denominator)} state-grain
                      applications. {denDef?.limitations} This is not “chance of being denied” and not your approval
                      odds.
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      See <Link href="/methodology" className="text-[#0D9488] underline-offset-2 hover:underline">methodology</Link>.
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card title="Where HMDA activity was observed" id="geo-heading">
            <p className="text-sm text-slate-600">
              {String(geo.language || 'HMDA activity observed in listed states and counties.')} These are not licensed
              states, branch locations, or a service area unless separate evidence says so.
            </p>
            {hq.city ? (
              <p className="text-sm text-slate-700">
                Headquarters (separate from activity): {String(hq.city)}
                {hq.state ? `, ${String(hq.state)}` : ''}
              </p>
            ) : (
              <p className="text-sm text-slate-600">Headquarters is not listed from an FDIC institution record on this profile.</p>
            )}
            {topStates.length ? (
              <div>
                <h3 className="text-sm font-semibold text-[#0A2540]">Top states by HMDA applications</h3>
                <DistTable
                  caption="Top states by HMDA applications"
                  rows={topStates.map((s) => ({
                    label: `${stateName(s.state)} (${s.state})`,
                    count: s.applications,
                  }))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  HMDA activity observed in {Number(geo.states_with_hmda_activity || topStates.length)} state
                  {Number(geo.states_with_hmda_activity || 0) === 1 ? '' : 's'}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-600">No state-level HMDA activity is attached.</p>
            )}
            {counties.length ? (
              <div>
                <h3 className="text-sm font-semibold text-[#0A2540]">Top counties by HMDA applications</h3>
                <DistTable
                  caption="Top counties by HMDA applications"
                  rows={counties.map((c) => ({
                    label: `${c.county_fips} · ${c.state}`,
                    count: c.applications,
                  }))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  County FIPS codes are activity locations, not branches. {Number(geo.counties_with_hmda_activity || 0)}{' '}
                  counties with observed applications.
                </p>
              </div>
            ) : null}
          </Card>

          <Card title="Consumer complaint evidence" id="cfpb-heading">
            <p className="text-sm text-slate-600">
              CFPB complaints attributed to this institution through confirmed identity mappings. Complaint totals are
              not a quality score and are not enforcement findings.
            </p>
            {Number(cfpb.attributed_complaint_count || 0) > 0 ? (
              <>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Attributed complaints</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInt(Number(cfpb.attributed_complaint_count))}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last 24 months</p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums">{formatInt(Number(cfpb.attributed_complaint_count_24m))}</p>
                    <p className="mt-1 text-xs text-slate-500">Received on or after {String(cfpb.window_24m_start || '2024-08-26')}.</p>
                  </div>
                </div>
                {sourceLabels.length ? (
                  <p className="text-sm text-slate-600">
                    Source company label{sourceLabels.length > 1 ? 's' : ''}:{' '}
                    {sourceLabels.map((s) => `${s.source_company_key} (${s.confidence})`).join('; ')}.
                  </p>
                ) : null}
                <DistTable caption="Complaint products" rows={topEntries(cfpb.product as Record<string, number>)} />
                <DistTable caption="Complaint issues" rows={topEntries(cfpb.issue as Record<string, number>)} />
                <DistTable caption="Company responses" rows={topEntries(cfpb.company_response as Record<string, number>)} />
                <DistTable caption="Timely response" rows={topEntries(cfpb.timely_response as Record<string, number>)} />
              </>
            ) : (
              <p className="text-sm text-slate-600">
                No confirmed CFPB complaints are attributed to this institution in the current evidence layer.
              </p>
            )}
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {String(
                cfpb.coverage_disclosure ||
                  'Complaint figures include records that could be deterministically linked to this institution. Some CFPB company labels remain unresolved and are not included.'
              )}
            </p>
            {unresolved.length ? (
              <div>
                <h3 className="text-sm font-semibold text-[#0A2540]">Related unresolved CFPB labels</h3>
                <p className="text-sm text-slate-600">These labels are not counted in the totals above.</p>
                <ul className="mt-2 space-y-2">
                  {unresolved.map((u) => (
                    <li key={u.label} className="min-w-0 break-words rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
                      <strong>{u.label}</strong>
                      {u.complaint_count != null ? ` · ${formatInt(u.complaint_count)} published rows` : null}
                      <span className="mt-1 block text-slate-700">{u.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Card>

          <Card title="Regulatory & Enforcement History" id="enforcement-heading">
            <p className="text-sm text-slate-600">
              Separate from consumer complaints. Events appear only when a regulator record is confirmed to this
              institution with an official identifier. Counts are not a severity score. Nonfinal events are not proven
              wrongdoing unless the source disposition says so.
            </p>
            {Number(enf.attributed_event_count || 0) > 0 ? (
              <div className="min-w-0 overflow-x-auto">
                <p className="mb-2 text-sm">
                  Attributable events in connected sources: {formatInt(Number(enf.attributed_event_count))}
                </p>
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <caption className="sr-only">Regulatory and enforcement events</caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th scope="col" className="py-2 pr-2">Regulator</th>
                      <th scope="col" className="py-2 pr-2">Action</th>
                      <th scope="col" className="py-2 pr-2">Date</th>
                      <th scope="col" className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((ev, i) => (
                      <tr key={`${ev.agency}-${ev.issued_on}-${i}`} className="border-b border-slate-100">
                        <td className="py-2 pr-2">{ev.agency}</td>
                        <td className="max-w-[10rem] break-words py-2 pr-2">{ev.action_family || ev.title || '—'}</td>
                        <td className="py-2 pr-2 whitespace-nowrap">{ev.issued_on || '—'}</td>
                        <td className="py-2">{ev.procedural_posture || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.some((e) => e.source_url) ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {events.filter((e) => e.source_url).slice(0, 8).map((e, i) => (
                      <li key={i} className="break-all">
                        <a href={e.source_url!} className="text-[#0D9488] underline-offset-2 hover:underline">
                          Source document
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-700">
                No attributable enforcement events were observed in the currently connected sources. That is not proof
                that no enforcement history exists.
              </p>
            )}
          </Card>

          <Card title="Observed roles" id="roles-heading">
            <p className="text-sm text-slate-700">
              <strong>Servicer role:</strong>{' '}
              {servicer === 'CONFIRMED'
                ? 'Confirmed mortgage servicer'
                : servicer === 'HISTORICAL'
                  ? 'Historical mortgage servicer'
                  : 'Servicer role not established'}
            </p>
            <p className="text-sm text-slate-600">
              Role status uses official servicer-role evidence only. It is not inferred from company name, CFPB
              complaint count, ownership, parent company, or mortgage volume.
            </p>
            {Array.isArray(roles.classifications) ? (
              <ul className="text-sm text-slate-700">
                {(roles.classifications as { family: string; authoritative: boolean }[])
                  .filter((c) => c.family !== 'UNKNOWN')
                  .map((c) => (
                    <li key={c.family + String(c.authoritative)}>{familyLabel(c.family)}</li>
                  ))}
              </ul>
            ) : null}
          </Card>

          <Card title="Sources & methodology" id="sources-heading">
            <p className="text-sm text-slate-600">
              Consumers should use source and reporting dates. Snapshot rebuild dates are not “verified today.”
            </p>
            <ul className="space-y-2 text-sm">
              {sources.map((s, i) => {
                const row = asRecord(s);
                return (
                  <li key={i} className="min-w-0 rounded-lg border border-slate-100 px-3 py-2">
                    <p className="font-medium text-[#0A2540]">
                      {String(row.agency || 'Source')}
                      {row.dataset ? ` · ${String(row.dataset)}` : ''}
                    </p>
                    {row.as_of ? <p className="text-slate-600">As-of / vintage: {String(row.as_of)}</p> : null}
                    {row.source_observed_from ? (
                      <p className="text-slate-600">Source observed: {String(row.source_observed_from)}</p>
                    ) : null}
                    {row.note ? <p className="text-slate-600">{String(row.note)}</p> : null}
                  </li>
                );
              })}
            </ul>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              {(profile.limitations || []).slice(0, 8).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Contract {profile.contract_version}. Materialized evidence snapshot
              {fetchSource === 'snapshot_pk' ? '' : ''}. Not a live national scan.
              {fetchMs ? ` Lookup ${fetchMs} ms.` : ''}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
