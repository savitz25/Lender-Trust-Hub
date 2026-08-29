import Link from 'next/link';
import type { FeaturedStory, LenderHomeIntel, TraceMetric } from '@/lib/home-intel/types';
import { LenderHomeChecklist } from './lender-home-checklist';
import { AskTrustHubSearch } from './ask-trust-hub-search';

function CoverageBar({ value, max, label, note }: { value: number; max: number; label: string; note?: string }) {
  const width = max > 0 ? Math.max(2, Math.round((100 * value) / max)) : 0;
  return (
    <div className="intel-bar">
      <div className="intel-bar__meta">
        <span>{label}</span>
        <span>{note ?? value.toLocaleString('en-US')}</span>
      </div>
      <div className="intel-bar__track" aria-hidden="true">
        <span className="intel-bar__fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ExplainFinding({ finding }: { finding: FeaturedStory }) {
  return (
    <details className="intel-disclose">
      <summary>Explain this data</summary>
      <p>
        <strong>What am I looking at?</strong> {finding.chart.caption}
      </p>
      <p>
        <strong>Why does it matter?</strong> {finding.whyItMatters}
      </p>
      <p>
        <strong>Where did this come from?</strong> {finding.sourceIds.join(', ')}. Official as-of {finding.officialAsOf}.
      </p>
      <p>
        <strong>Important limitation</strong>
      </p>
      <ul>
        {finding.doesNotMean.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <details className="intel-disclose">
        <summary>View technical provenance</summary>
        <p>
          Payload keys: {finding.payloadKeys.join(', ')}. Retrieved {finding.retrievedAt}. Story type {finding.storyType}.
        </p>
      </details>
    </details>
  );
}

function Story({ finding }: { finding: FeaturedStory }) {
  const label = finding.storyType === 'GAP' ? 'GAP' : finding.storyType === 'BENCHMARK' ? 'MARKET FINDING' : finding.storyType;
  return (
    <article className="intel-finding">
      <p className="intel-eyebrow">{label}</p>
      <h3>{finding.title}</h3>
      <p>{finding.summary}</p>
      <figure>
        <figcaption>{finding.chart.caption}</figcaption>
        <div className="intel-chart" role="img" aria-label={finding.chart.caption}>
          {finding.chart.series.map((series) => (
            <CoverageBar key={series.label} value={series.value} max={finding.chart.max} label={series.label} note={series.note} />
          ))}
        </div>
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label={finding.chart.caption}>
          <table className="hub-table hub-table--compact">
            <caption className="visually-hidden">{finding.chart.caption}</caption>
            <thead>
              <tr>
                <th scope="col">Measure</th>
                <th scope="col">Count</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {finding.chart.series.map((series) => (
                <tr key={series.label}>
                  <th scope="row">{series.label}</th>
                  <td>{series.value.toLocaleString('en-US')}</td>
                  <td>
                    {series.shareOf
                      ? `${((100 * series.value) / series.shareOf).toFixed(1)}% of ${series.shareOf.toLocaleString('en-US')}`
                      : series.note ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </figure>
      <ExplainFinding finding={finding} />
    </article>
  );
}

function TraceMetricCard({ metric, vocab, subtitle }: { metric: TraceMetric; vocab: string; subtitle: string }) {
  return (
    <article className="intel-metric">
      <p className="intel-eyebrow">{vocab}</p>
      <p className="intel-metric__value">{metric.display}</p>
      <h3>{metric.label}</h3>
      <p className="intel-kicker">{subtitle}</p>
      <details className="intel-disclose">
        <summary>Trace this number</summary>
        <p>{metric.definition}</p>
        <ul>
          {metric.components.map((part) => (
            <li key={part.payloadKey}>
              {part.label}: {part.value}
            </li>
          ))}
        </ul>
        <p>
          Source: {metric.sourceIds.join(', ')}. Official as-of {metric.officialAsOf}. Grain: {metric.grain}.
        </p>
        <details className="intel-disclose">
          <summary>View technical provenance</summary>
          <p>
            Method: {metric.method} Payload key: <code>{metric.payloadKey}</code>. Retrieved {metric.retrievedAt}.
          </p>
          <ul>
            {metric.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </details>
    </article>
  );
}

export function LenderHomeIntelligence({ intel }: { intel: LenderHomeIntel }) {
  const byId = (id: string) => intel.stateOfRecord.find((row) => row.id === id)!;
  const institutions = byId('institutions');
  const published = byId('public-national');
  const apps = byId('hmda-apps');
  const orig = byId('hmda-orig');
  const fl = intel.geography.find((g) => g.state === 'FL');
  const usApps = intel.geography.reduce((s, g) => s + g.applications, 0);
  const featured: typeof intel.geography = [];
  for (const row of intel.geography.slice().sort((a, b) => b.applications - a.applications)) {
    if (featured.length >= 8 && row.state !== 'FL') continue;
    if (!featured.some((item) => item.state === row.state)) featured.push(row);
    if (featured.length >= 9) break;
  }
  if (fl && !featured.some((item) => item.state === 'FL')) featured.push(fl);
  const consumerGaps = intel.gaps.slice(0, 5);

  return (
    <div className="intel-home">
      <section className="intel-hero" aria-labelledby="home-title">
        <p className="intel-eyebrow">Mortgage market intelligence</p>
        <h1 id="home-title">Understand the mortgage market before you choose a lender.</h1>
        <p className="intel-hero__lede">
          Research mortgage lenders and market outcomes using HMDA, consumer complaint, and regulatory records. No Trust
          Score. No ranking. You decide.
        </p>
        <p className="intel-pulse">
          Latest mortgage-market research includes HMDA application data through the {apps.officialAsOf} reporting vintage
          and complaint observations retrieved {intel.sources.find((s) => s.id === 'cfpb-complaints')?.retrievedAt ?? apps.retrievedAt}.
        </p>
        <div className="intel-hero__actions">
          <a className="intel-btn intel-btn--primary" href="#snapshot">
            Explore mortgage intelligence
          </a>
          <a className="intel-btn intel-btn--secondary" href="#research-lender">
            Research a lender
          </a>
          <a className="intel-btn intel-btn--secondary" href="#ask">
            Ask LenderTrustHub
          </a>
        </div>
      </section>

      <section className="intel-section" id="snapshot" aria-labelledby="snapshot-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Market snapshot</p>
          <h2 id="snapshot-title">What this research universe currently holds</h2>
          <p>
            Thousands of lender identities are researched in the underlying graph. Public national research reports are
            published through a narrower evidence gate. That is publication discipline, not a missing product.
          </p>
        </div>
        <div className="intel-metric-rail">
          <TraceMetricCard
            metric={institutions}
            vocab="Research universe"
            subtitle="Canonical institution identities in the graph"
          />
          <TraceMetricCard
            metric={published}
            vocab="Currently researched / public"
            subtitle="Published national reports vs researched identities"
          />
          <TraceMetricCard metric={apps} vocab="Evidence records" subtitle="HMDA county-grain applications, 2025 vintage" />
          <article className="intel-metric">
            <p className="intel-eyebrow">Geography</p>
            <p className="intel-metric__value">{intel.geography.length}</p>
            <h3>Jurisdictions with county-grain HMDA</h3>
            <p className="intel-kicker">Property/census geography, not lender branch maps</p>
          </article>
          <article className="intel-metric">
            <p className="intel-eyebrow">Last official update</p>
            <p className="intel-metric__value">{apps.officialAsOf}</p>
            <h3>HMDA reporting vintage</h3>
            <p className="intel-kicker">Complaint observations retrieved {apps.retrievedAt}</p>
          </article>
        </div>
      </section>

      <section className="intel-section" id="findings" aria-labelledby="findings-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">What the current data says</p>
          <h2 id="findings-title">Three national evidence stories</h2>
          <p>Two market findings and one coverage gap. None is a ranking of lenders.</p>
        </div>
        <div className="intel-findings">
          {intel.findings.map((finding) => (
            <Story key={finding.storyId} finding={finding} />
          ))}
        </div>
      </section>

      <section className="intel-section" id="ask" aria-labelledby="ask-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Ask LenderTrustHub</p>
          <h2 id="ask-title">Ask questions across structured mortgage-market research</h2>
          <p>Interpretation is shown before any number. Unsupported ranking and pricing questions fail closed.</p>
        </div>
        <AskTrustHubSearch intel={intel} />
      </section>

      <section className="intel-section" id="compare" aria-labelledby="compare-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Compare / explore</p>
          <h2 id="compare-title">Compare mortgage markets</h2>
          <p>
            Florida vs U.S. uses the same HMDA 2025 county grain. This is not which market is better. Geography is
            property location, not lender service territory.
          </p>
        </div>
        {fl ? (
          <div className="intel-compare">
            <CoverageBar label="Florida applications" value={fl.applications} max={usApps} note={fl.applications.toLocaleString('en-US')} />
            <CoverageBar label="U.S. applications (jurisdiction sum)" value={usApps} max={usApps} note={usApps.toLocaleString('en-US')} />
            <CoverageBar label="Florida originations" value={fl.originations} max={orig.value} note={fl.originations.toLocaleString('en-US')} />
          </div>
        ) : null}
        <h3>Explore mortgage activity</h3>
        <p className="intel-legend">
          A compact set of high-volume jurisdictions plus Florida. Darker cells have more reported county-grain
          applications. Not a ranking. Only Florida currently has a full state intelligence page.
        </p>
        <div className="intel-geo-grid intel-geo-grid--compact">
          {featured.map((row) => (
            <a
              key={row.state}
              className="intel-geo-cell"
              href={row.intelligenceHref ?? row.searchHref}
              style={{ ['--intel-volume' as string]: String(row.volumeShare / 100) }}
            >
              <strong>{row.state}</strong>
              <span className="visually-hidden">
                {row.name}. Reported applications {row.applications.toLocaleString('en-US')}.
                {row.intelligenceHref ? ' State intelligence.' : ' Opens national lender research — not a full state OS page.'}
              </span>
            </a>
          ))}
        </div>
        <p>
          <Link className="intel-text-link" href="/lender">
            View all jurisdictions via national lender research
          </Link>
        </p>
        <details className="intel-disclose">
          <summary>Accessible full jurisdiction list</summary>
          <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="County-grain HMDA 2025 counts by jurisdiction">
            <table className="hub-table">
              <caption>County-grain HMDA 2025 counts. Florida opens state intelligence; others open national research.</caption>
              <thead>
                <tr>
                  <th scope="col">Jurisdiction</th>
                  <th scope="col">Applications</th>
                  <th scope="col">Originations</th>
                  <th scope="col">Denials</th>
                  <th scope="col">Destination</th>
                </tr>
              </thead>
              <tbody>
                {intel.geography.map((row) => (
                  <tr key={`list-${row.state}`}>
                    <th scope="row">
                      <Link href={row.intelligenceHref ?? row.searchHref}>
                        {row.state} · {row.name}
                      </Link>
                    </th>
                    <td>{row.applications.toLocaleString('en-US')}</td>
                    <td>{row.originations.toLocaleString('en-US')}</td>
                    <td>{row.denials.toLocaleString('en-US')}</td>
                    <td>{row.intelligenceHref ? 'State intelligence' : 'HMDA research / lender search'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="intel-section" id="depth" aria-labelledby="depth-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Evidence depth</p>
          <h2 id="depth-title">How complete is the research?</h2>
          <p>Coverage describes whether this hub has published evidence for a family. It does not describe how trustworthy a lender is.</p>
        </div>
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="Evidence availability by family">
          <table className="hub-table">
            <caption>Evidence availability by family</caption>
            <thead>
              <tr>
                <th scope="col">Evidence family</th>
                <th scope="col">Coverage</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {intel.coverage.map((row) => (
                <tr key={row.family}>
                  <th scope="row">{row.family}</th>
                  <td>{row.display}</td>
                  <td>{row.status.replaceAll('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="intel-section" id="gaps" aria-labelledby="gaps-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">What we don&apos;t know</p>
          <h2 id="gaps-title">The current record is incomplete</h2>
        </div>
        <ul className="intel-plain-list">
          {consumerGaps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <details className="intel-disclose">
          <summary>More methodology limitations</summary>
          <ul className="intel-plain-list">
            {intel.gaps.slice(5).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <h3>Things you may still want to verify directly</h3>
          <ul className="intel-plain-list">
            {intel.verifyDirectly.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </section>

      <section className="intel-section" id="research-lender" aria-labelledby="research-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Research a specific lender</p>
          <h2 id="research-title">Look up a published institution</h2>
          <p>
            Search uses the controlled public corpus. It does not rank lenders and does not search MLOs or branches. A
            researched identity without a publication gate is not turned into a thin public page.
          </p>
        </div>
        <form className="intel-lookup" action="/lender" method="get">
          <div className="intel-lookup__grid">
            <label htmlFor="lender-q">
              Name or NMLS Institution ID
              <input id="lender-q" name="q" type="search" autoComplete="off" />
            </label>
            <button className="intel-btn intel-btn--primary" type="submit">
              Search published profiles
            </button>
          </div>
        </form>
      </section>

      <section className="intel-section" id="use" aria-labelledby="use-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Use the research</p>
          <h2 id="use-title">Loan Estimates and tools after the evidence</h2>
        </div>
        <div className="intel-cta-grid">
          {intel.tools.map((tool) => (
            <Link className="intel-cta" href={tool.href} key={tool.id}>
              <strong>{tool.label}</strong>
              <span>{tool.note}</span>
            </Link>
          ))}
        </div>
        <h3>Research checklist</h3>
        <LenderHomeChecklist />
      </section>

      <section className="intel-section" id="sources" aria-labelledby="sources-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Sources / methodology</p>
          <h2 id="sources-title">Where the numbers come from</h2>
        </div>
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="Source ledger for homepage families">
          <table className="hub-table">
            <caption>Source ledger for homepage families</caption>
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Agency</th>
                <th scope="col">Official as-of</th>
                <th scope="col">Retrieved</th>
                <th scope="col">Used for</th>
              </tr>
            </thead>
            <tbody>
              {intel.sources.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.dataset}</th>
                  <td>{row.agency}</td>
                  <td>{row.officialAsOf}</td>
                  <td>{row.retrievedAt}</td>
                  <td>{row.usedFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>What this page does not infer</h3>
        <ul className="intel-plain-list">
          {intel.doesNotInfer.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <details className="intel-disclose">
          <summary>View technical provenance</summary>
          <p>
            Snapshot {intel.homepagePublicationVersion}. Contract {intel.contractVersion}. Pricing homepage:{' '}
            {intel.pricingHomepageV1}.
          </p>
          <ul className="intel-plain-list">
            {intel.limitations.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
