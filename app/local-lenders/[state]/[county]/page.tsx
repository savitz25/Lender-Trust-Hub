import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { LenderDirectoryLoader } from '@/components/directory/LenderDirectoryLoader';
import { JsonLd } from '@/components/directory/JsonLd';
import { getAllCounties, getCountyLenderSegments, lenders } from '@/lib/lenders';
import { parseLenderAskHandoff } from '@/lib/search-handoff/parse';
import { resolveLenderAskHandoff } from '@/lib/search-handoff/resolve';
import { filterLendersForAskHandoff } from '@/lib/search-handoff/match';
import { LENDER_LOCALITY_POLICY } from '@/lib/geo';
import { RankingBasisPanel } from '@/components/research/ranking-basis-panel';
import { ResearchPathNav } from '@/components/research/research-path-nav';
import { CountyIntelligenceModules } from '@/components/mortgage/county-intelligence-modules';
import {
  assessCountyForPage,
  countyRobotsForTier,
} from '@/lib/mortgage/county-quality-tiers';
import {
  EmptyCoveragePanel,
  NMLS_CONSUMER_ACCESS_URL,
  CFPB_HOME_URL,
} from '@/components/research/empty-coverage-panel';
import { getHmdaCountyEvidence } from '@/lib/hmda';
import { HmdaCountyMarketPanel } from '@/components/hmda/HmdaCountyMarketPanel';
import { LoanEstimateToolsCta } from '@/components/tools/LoanEstimateToolsCta';
import { ProgramsToolsCta } from '@/components/programs/ProgramsToolsCta';
import {
  buildMortgageCountyDescription,
  buildMortgageCountyH1,
  buildMortgageCountyJsonLd,
  buildMortgageCountyTitle,
  mortgageCountyUrl,
} from '@/lib/mortgage/seo';
import { analyzerCountyOptionSlug } from '@/lib/tools/loan-estimate-analyzer/county-option';
import {
  parseJourneyContext,
  type JourneyContext,
} from '@/lib/network/journey-context';
import { JourneyOrientationBanner } from '@/components/network/journey-orientation-banner';
import { JourneyLandingTracker } from '@/components/network/journey-landing-tracker';
import { JourneySessionSync } from '@/components/network/journey-session-sync';
import { ContinueTrustJourney } from '@/components/network/continue-trust-journey';

function titleCase(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function generateStaticParams() {
  return getAllCounties().map((c) => ({
    state: c.stateSlug,
    county: c.countySlug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; county: string }>;
}): Promise<Metadata> {
  const { state, county } = await params;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  const quality = assessCountyForPage(state, county);
  const robots = countyRobotsForTier(quality.tier);
  const segments = getCountyLenderSegments(state, county, `${countyName} County, ${stateName}`);
  const title = buildMortgageCountyTitle(countyName);
  const description = buildMortgageCountyDescription(
    countyName,
    stateName,
    segments.inCountyCount
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: mortgageCountyUrl(state, county),
      locale: 'en_US',
    },
    alternates: { canonical: mortgageCountyUrl(state, county) },
    robots: { index: robots.index, follow: robots.follow },
  };
}

export default async function CountyLendersPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; county: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { state, county } = await params;
  const sp = await searchParams;
  const zip = typeof sp.zip === 'string' ? sp.zip : Array.isArray(sp.zip) ? sp.zip[0] : undefined;
  const stateName = titleCase(state);
  const countyName = titleCase(county);
  const countyLabel = `${countyName} County, ${stateName}`;
  const segments = getCountyLenderSegments(state, county, countyLabel);
  const askCtx = parseLenderAskHandoff(sp);
  const askDest = askCtx ? resolveLenderAskHandoff(askCtx) : null;
  const askMatches =
    askCtx && askDest?.status === 'ok'
      ? filterLendersForAskHandoff(lenders, askCtx, askDest.geography)
      : null;
  const allowIds = askMatches ? new Set(askMatches.map((m) => m.lender.id)) : null;
  const inCounty = allowIds
    ? segments.inCounty.filter((l) => allowIds.has(l.id))
    : segments.inCounty;
  const nearby = allowIds
    ? segments.nearby.filter((l) => allowIds.has(l.id))
    : segments.nearby;
  const shownIds = new Set([...inCounty, ...nearby].map((l) => l.id));
  const hmdaActivityOnly = (askMatches || [])
    .filter((m) => m.reasons.includes('hmda_activity_county') && !shownIds.has(m.lender.id))
    .map((m) => m.lender);
  const inCountyCount = inCounty.length;
  const nearbyCount = nearby.length;
  const localScarcity = segments.localScarcity && !askCtx;
  const quality = assessCountyForPage(state, county);
  const hmdaCounty = getHmdaCountyEvidence(state, county);
  const description = buildMortgageCountyDescription(countyName, stateName, inCountyCount);
  const jsonLd = buildMortgageCountyJsonLd({
    stateSlug: state,
    stateName,
    countySlug: county,
    countyName,
    inCountyCount,
    description,
  });
  const topMatched = (hmdaCounty?.topMatchedLenders ?? [])
    .filter((l) => l.slug)
    .slice(0, 5);
  const journey: JourneyContext = {
    ...parseJourneyContext(sp),
    stateSlug: state,
    county,
    stateName,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <JourneyLandingTracker context={journey} landedOn="county" />
      <div className="container mx-auto px-4 py-12">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#059669]">
                Home
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <li>
              <Link href="/local-lenders" className="hover:text-[#059669]">
                Local Lenders
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <li>
              <Link href={`/local-lenders/${state}`} className="hover:text-[#059669]">
                {stateName}
              </Link>
            </li>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <li>
              <span className="text-[#0A2540]">{countyLabel}</span>
            </li>
          </ol>
        </nav>

        <div className="mb-6">
          <JourneyOrientationBanner context={journey} />
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#0A2540] md:text-4xl">
            {buildMortgageCountyH1(countyName, stateName)}
          </h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            {inCountyCount} in-county HQ compan{inCountyCount === 1 ? 'y' : 'ies'}
            {nearbyCount > 0
              ? ` · ${nearbyCount} nearby / serving from elsewhere`
              : ''}
            . Local means a licensed business address in this county — not statewide license alone.
            {zip ? ` Filtering context for ZIP ${zip}.` : ''}
          </p>
          <SearchBar className="mt-6 max-w-xl" />
          <RankingBasisPanel
            className="mt-6 max-w-2xl"
            localityNote={`${inCountyCount} in-county · ${nearbyCount} nearby — nearby never outranks in-county by score alone.`}
          />
        </div>

        {hmdaCounty && <HmdaCountyMarketPanel evidence={hmdaCounty} />}

        {topMatched.length > 0 ? (
          <section className="mb-8 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm" aria-labelledby="hmda-matched-heading">
            <h2 id="hmda-matched-heading" className="text-sm font-semibold text-[#0A2540]">
              Higher HMDA activity (matched lenders)
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              From county HMDA extracts when a LEI maps to our directory — not a ranking or
              recommendation.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {topMatched.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/lenders/${l.slug}`}
                    className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-medium text-[#0A2540] hover:border-emerald-400"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mb-8">
          <LoanEstimateToolsCta
            variant="county"
            countySlug={analyzerCountyOptionSlug(state, county)}
            countyName={countyName}
          />
        </div>

        <div className="mb-8">
          <ProgramsToolsCta variant="county" stateSlug={state} />
        </div>

        <div className="mb-10">
          <ResearchPathNav
            context={{
              stateSlug: state,
              stateName,
              countySlug: county,
              countyName,
            }}
            heading="State hub · tools · next steps"
          />
        </div>

        {(quality.tier === 1 || quality.tier === 2) && (
          <CountyIntelligenceModules
            stateSlug={state}
            countyName={countyName}
            assessment={quality}
            inCounty={inCounty}
          />
        )}

        {localScarcity ? (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            {LENDER_LOCALITY_POLICY.scarceInCountyCopy(inCountyCount, countyLabel)}
          </p>
        ) : null}

        {inCountyCount > 0 ? (
          <section className="mb-12" aria-labelledby="in-county-heading">
            <h2 id="in-county-heading" className="mb-2 text-xl font-semibold text-[#0A2540]">
              In-county HQ
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Licensed business city or HQ locality maps to {countyName} County.
            </p>
            <LenderDirectoryLoader
              lenders={inCounty}
              countyLabel={countyLabel}
              profileReturnPath={`/local-lenders/${state}/${county}`}
              showRank
              presenceLabel="HQ in county"
              emptyVariant="filtered"
              emptyPlaceLabel={countyLabel}
              emptyMessage={`No in-county lenders match your filters in ${countyLabel}.`}
            />
          </section>
        ) : (
          <div className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
            <p className="text-sm text-zinc-700">{LENDER_LOCALITY_POLICY.emptyInCountyCopy}</p>
          </div>
        )}

        {nearbyCount > 0 ? (
          <section className="mb-12" aria-labelledby="nearby-heading">
            <h2 id="nearby-heading" className="mb-2 text-xl font-semibold text-[#0A2540]">
              Nearby / serving from elsewhere
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              HQ outside {countyName} County. Not in-county locals — listed separately so inventory is
              not padded as local.
            </p>
            <LenderDirectoryLoader
              lenders={nearby}
              countyLabel={countyLabel}
              profileReturnPath={`/local-lenders/${state}/${county}`}
              showRank={false}
              presenceLabel="Serves from nearby market"
              showSearch={false}
              emptyVariant="filtered"
              emptyPlaceLabel={countyLabel}
            />
          </section>
        ) : null}

        {hmdaActivityOnly.length > 0 ? (
          <section className="mb-12" aria-labelledby="hmda-activity-heading">
            <h2 id="hmda-activity-heading" className="mb-2 text-xl font-semibold text-[#0A2540]">
              HMDA activity in this county
            </h2>
            <p className="mb-4 text-sm text-zinc-500">
              Reported mortgage originations in {countyName} County. This is not a license, branch, or
              office claim.
            </p>
            <LenderDirectoryLoader
              lenders={hmdaActivityOnly}
              countyLabel={countyLabel}
              profileReturnPath={askDest?.href || `/local-lenders/${state}/${county}`}
              showRank={false}
              presenceLabel="HMDA activity in county"
              showSearch={false}
              emptyVariant="filtered"
              emptyPlaceLabel={countyLabel}
            />
          </section>
        ) : null}

        {inCountyCount === 0 && nearbyCount === 0 && hmdaActivityOnly.length === 0 ? (
          <EmptyCoveragePanel
            variant="unmapped"
            title={`We haven’t listed in-county lenders in ${countyLabel} yet`}
            description="This county has no confirmed in-county HQ listings in our research directory. We do not pad with far-away offices labeled as local. Re-check any company on NMLS Consumer Access."
            placeLabel={countyLabel}
            primarySources={[
              {
                href: NMLS_CONSUMER_ACCESS_URL,
                label: 'NMLS Consumer Access',
                external: true,
              },
              {
                href: CFPB_HOME_URL,
                label: 'CFPB owning a home',
                external: true,
              },
            ]}
            widenLinks={[
              { href: '/local-lenders', label: 'Browse all states' },
              { href: `/local-lenders/${state}`, label: 'State directory' },
              { href: '/tools/loan-estimate-analyzer', label: 'Understand your Loan Estimate' },
              { href: '/calculators', label: 'Educational calculators' },
            ]}
          />
        ) : null}

        <div className="mt-10 space-y-6">
          {/* SSR crawlable handoffs; client sync persists session + gap-fills intent */}
          <ContinueTrustJourney
            currentHub="lender"
            context={{
              ...journey,
              journey: journey.journey ?? 'purchase',
              src: journey.src ?? 'lender',
            }}
            title="Coverage is typically next after financing research"
          />
          <JourneySessionSync
            urlContext={{
              ...journey,
              journey: journey.journey ?? 'purchase',
              src: journey.src ?? 'lender',
            }}
            preferSrc="lender"
            currentHub="lender"
            silent
          />
          <ResearchPathNav
            context={{
              stateSlug: state,
              stateName,
              countySlug: county,
              countyName,
            }}
            heading="Keep researching on this hub"
          />
        </div>
      </div>
    </>
  );
}
