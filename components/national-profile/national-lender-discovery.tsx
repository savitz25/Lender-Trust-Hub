import Link from 'next/link';
import {
  BROWSE_TYPES,
  DISCOVERY_INDEXABLE_COUNT,
  DISCOVERY_SEARCHABLE_COUNT,
  browseCounts,
  browseDiscovery,
  searchDiscovery,
  typeLabel,
  type DiscoveryHit,
  type DiscoveryRecord,
} from '@/lib/national-profile/discovery';


export function NationalLenderDiscovery({
  query,
  type,
}: {
  query: string;
  type: string;
}) {
  const counts = browseCounts();
  const activeType = BROWSE_TYPES.some((t) => t.id === type) ? type : '';
  const hits: DiscoveryHit[] = query.trim()
    ? searchDiscovery(query, activeType || null)
    : activeType
      ? browseDiscovery(activeType)
      : [];
  const searching = Boolean(query.trim() || activeType);

  return (
    <div className="th-shell mx-auto w-full max-w-[880px] overflow-x-clip px-4 py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-600">
        <ol className="flex flex-wrap gap-1">
          <li>
            <Link href="/" className="text-[#0D9488] underline-offset-2 hover:underline">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-slate-800">Lender research</li>
        </ol>
      </nav>

      <header className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0D9488]">Independent research</p>
        <h1 className="mt-1 break-words text-2xl font-bold text-[#0A2540] sm:text-3xl">
          National lender research
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          Research a U.S. lending institution as one canonical record: official identifiers, HMDA 2025 mortgage
          activity, CFPB complaint evidence, and Regulatory &amp; Enforcement History. This is not a ranking, not a
          recommendation, and not the same as local catalog pages at{' '}
          <Link href="/local-lenders" className="text-[#0D9488] underline-offset-2 hover:underline">
            /local-lenders
          </Link>
          .
        </p>
      </header>

      <section className="mt-8" aria-labelledby="search-heading">
        <h2 id="search-heading" className="text-lg font-semibold text-[#0A2540]">
          Search published research profiles
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Search by institution name, NMLS Institution ID, FDIC certificate, NCUA charter, or LEI. Namespaces stay
          separate: NMLS 3030 is not FDIC 3030.
        </p>
        <form method="get" action="/lender" className="mt-4 space-y-3" role="search">
          {activeType ? <input type="hidden" name="type" value={activeType} /> : null}
          <div>
            <label htmlFor="lender-q" className="block text-sm font-medium text-slate-800">
              Institution name or identifier
            </label>
            <input
              id="lender-q"
              name="q"
              type="search"
              defaultValue={query}
              autoComplete="off"
              placeholder="Rocket Mortgage, NMLS 3030, FDIC 16243, or LEI"
              className="mt-1 h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-base text-[#1E293B] shadow-sm focus:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/20"
            />
          </div>
          <fieldset className="min-w-0">
            <legend className="text-sm font-medium text-slate-800">Browse by institution type</legend>
            <p className="mt-1 text-xs text-slate-500">
              Types come from official classification, not names. An institution may appear as both a nonbank and a
              servicer when both are evidenced.
            </p>
            <div className="mt-2 flex min-w-0 flex-wrap gap-2">
              {BROWSE_TYPES.map((t) => {
                const href = t.id === activeType && !query ? '/lender' : `/lender?${new URLSearchParams({ ...(query ? { q: query } : {}), type: t.id }).toString()}`;
                const selected = activeType === t.id;
                return (
                  <a
                    key={t.id}
                    href={href}
                    className={`rounded-full border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40 ${
                      selected
                        ? 'border-[#0A2540] bg-[#0A2540] text-white'
                        : 'border-slate-200 bg-white text-slate-800 hover:border-[#0D9488]'
                    }`}
                    aria-current={selected ? 'true' : undefined}
                  >
                    {t.label}
                    <span className="ml-1 text-xs opacity-80">({counts[t.id] ?? 0})</span>
                  </a>
                );
              })}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-[#0D9488] px-5 text-sm font-semibold text-white hover:bg-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
            >
              Search
            </button>
            {searching ? (
              <Link
                href="/lender"
                className="inline-flex h-11 items-center rounded-xl border border-slate-200 px-4 text-sm text-slate-700 hover:border-[#0D9488] focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      {searching ? (
        <section className="mt-8" aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-lg font-semibold text-[#0A2540]">
            Results
          </h2>
          <p className="mt-1 text-sm text-slate-600" aria-live="polite">
            {hits.length === 1
              ? '1 published research profile matched.'
              : `${hits.length} published research profiles matched.`}
          </p>
          {hits.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-700">
              <p>No currently published national lender research profile matched this search.</p>
              <p className="mt-2">That does not mean no lender exists. Try a different spelling, an identifier such as an NMLS Institution ID, or browse by type.</p>
              <p className="mt-2">
                <Link href="/lender" className="text-[#0D9488] underline-offset-2 hover:underline">
                  Browse published research
                </Link>
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {hits.map((hit) => (
                <li key={hit.record.institution_id}>
                  <ResultCard hit={hit} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="mt-6 text-sm text-slate-600">
          A controlled set of published national research profiles is searchable here. It is not a complete U.S.
          lender directory and not a ranked list of {DISCOVERY_INDEXABLE_COUNT} “top” lenders. {DISCOVERY_SEARCHABLE_COUNT}{' '}
          profiles currently have a public research page.
        </p>
      )}

      <EducationSections />
    </div>
  );
}

function ResultCard({ hit }: { hit: DiscoveryHit }) {
  const r = hit.record;
  const ids: string[] = [];
  if (r.nmls) ids.push(`NMLS Institution ID ${r.nmls}`);
  if (r.fdic) ids.push(`FDIC Certificate ${r.fdic}`);
  if (r.ncua) ids.push(`NCUA Charter ${r.ncua}`);
  if (r.lei && !r.nmls && !r.fdic && !r.ncua) ids.push(`LEI ${r.lei}`);
  const hq = [r.hq_city, r.hq_state].filter(Boolean).join(', ');
  const evidence: string[] = [];
  if (r.evidence.hmda) evidence.push('HMDA');
  if (r.evidence.cfpb) evidence.push('CFPB evidence');
  if (r.evidence.enforcement) evidence.push('Regulatory records');
  if (r.evidence.servicer) evidence.push('Servicer evidence');

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{typeLabel(r)}</p>
      <h3 className="mt-1 break-words text-lg font-semibold text-[#0A2540]">
        <Link href={hit.href} className="text-[#0D9488] underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-[#0D9488]/40">
          {r.presentation_name}
        </Link>
      </h3>
      {hq ? (
        <p className="mt-1 text-sm text-slate-600">Headquarters (official depository record): {hq}</p>
      ) : null}
      {ids.length ? <p className="mt-2 break-words text-sm text-slate-700">{ids.join(' · ')}</p> : null}
      {hit.matchedIdentifier ? (
        <p className="mt-1 text-xs text-slate-500">Matched {hit.matchedIdentifier.toUpperCase()} identifier</p>
      ) : null}
      {evidence.length ? (
        <p className="mt-2 text-xs text-slate-500">Evidence families on this profile: {evidence.join(', ')}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Identity and source notes on this profile. Not a ranking.</p>
      )}
    </article>
  );
}

function EducationSections() {
  return (
    <div className="mt-12 space-y-8 border-t border-slate-200 pt-8">
      <section aria-labelledby="what-heading">
        <h2 id="what-heading" className="text-lg font-semibold text-[#0A2540]">
          What these profiles are
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          One canonical institution has one national research profile. Identifiers stay in their own namespaces. Bank
          holding companies are not listed as operating lenders. Local catalog pages at /lenders are a separate product.
        </p>
      </section>
      <section aria-labelledby="hmda-heading">
        <h2 id="hmda-heading" className="text-lg font-semibold text-[#0A2540]">
          HMDA mortgage activity
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Activity shown on profiles uses the HMDA 2025 reporting vintage, not 2026 lending. Geography is observed
          mortgage activity. It is not a license map, branch network, or service territory.
        </p>
      </section>
      <section aria-labelledby="cfpb-heading">
        <h2 id="cfpb-heading" className="text-lg font-semibold text-[#0A2540]">
          Consumer complaint evidence
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Profile totals include only complaints that could be deterministically attributed. Unresolved source labels
          stay excluded. Complaint counts are not ratings, quality scores, or recommendations.
        </p>
      </section>
      <section aria-labelledby="enf-heading">
        <h2 id="enf-heading" className="text-lg font-semibold text-[#0A2540]">
          Regulatory &amp; Enforcement History
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Confirmed attributable regulatory events are separate from consumer complaints. When no attributable events
          are observed, that is source-limited evidence — not proof that no enforcement history exists.
        </p>
      </section>
      <section aria-labelledby="svc-heading">
        <h2 id="svc-heading" className="text-lg font-semibold text-[#0A2540]">
          Servicer role
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Labels are Confirmed, Historical, or Not established. Not established means the role is not established in
          connected evidence — not a finding that the institution is “not a servicer.” Role evidence is not a quality
          score.
        </p>
      </section>
      <section aria-labelledby="src-heading">
        <h2 id="src-heading" className="text-lg font-semibold text-[#0A2540]">
          Sources
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Profiles draw from HMDA/FFIEC, CFPB, FDIC, NCUA, GLEIF, and federal enforcement records. NMLS Institution IDs
          appear where they were deterministically acquired. Company NMLS coverage is partial because national bulk
          Consumer Access is constrained. Source dates are reporting vintages or official as-of dates, not ingest dates.
        </p>
      </section>
      <p className="text-xs text-slate-500">
        Independent research. Not a ranking. Explore lenders by location separately via ZIP search on the homepage.
      </p>
    </div>
  );
}

export function discoveryTypeLabel(record: DiscoveryRecord) {
  return typeLabel(record);
}
