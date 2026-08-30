import Link from 'next/link';
import type { FeaturedStory, LenderHomeIntel } from '@/lib/home-intel/types';
import { AskTrustHubSearch } from './ask-trust-hub-search';
import { LenderHomeChecklist } from './lender-home-checklist';

function dateLabel(value: string): string {
  return value;
}

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

function Story({ finding }: { finding: FeaturedStory }) {
  return (
    <article className="intel-finding">
      <p className="intel-eyebrow">{finding.storyType}</p>
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
      <details className="intel-disclose">
        <summary>Explain this chart</summary>
        <p>
          <strong>What am I looking at?</strong> {finding.chart.caption}
        </p>
        <p>
          <strong>Why might this matter?</strong> {finding.whyItMatters}
        </p>
        <p>
          <strong>What this does not mean</strong>
        </p>
        <ul>
          {finding.doesNotMean.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Source keys: {finding.sourceIds.join(', ')}. Official as-of {dateLabel(finding.officialAsOf)} · Retrieved{' '}
          {dateLabel(finding.retrievedAt)}.
        </p>
      </details>
    </article>
  );
}

export function LenderHomeIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="intel-home">
      <section className="intel-hero" aria-labelledby="home-title">
        <p className="intel-eyebrow">National mortgage-market intelligence</p>
        <h1 id="home-title">Understand the mortgage market before you choose a lender.</h1>
        <p className="intel-hero__lede">
          The current published intelligence snapshot is unavailable. This page does not substitute live database
          queries or stale hardcoded constants.
        </p>
        <p className="intel-kicker">{reason}</p>
      </section>
    </div>
  );
}

export function LenderHomeIntelligence({ intel }: { intel: LenderHomeIntel }) {
  return (
    <div className="intel-home">
      <section className="intel-hero" aria-labelledby="home-title">
        <p className="intel-eyebrow">National mortgage-market intelligence</p>
        <h1 id="home-title">Understand the mortgage market before you choose a lender.</h1>
        <p className="intel-hero__lede">
          Independent research on institutions, applications, originations, denials, complaints, licensing, and
          regulatory evidence from public sources. Classes of evidence stay separate.{' '}
          <strong>Understand the market. Research the lender. Compare the offer. You decide.</strong>
        </p>
        <p className="intel-hero__promise">We cite the evidence. You decide.</p>
        <div className="intel-hero__actions">
          <a className="intel-btn intel-btn--primary" href="#record">
            Explore Lending Intelligence
          </a>
          <a className="intel-btn intel-btn--secondary" href="#lookup">
            Research a lender
          </a>
        </div>
        <form id="lookup" className="intel-lookup" action="/lender" method="get">
          <p className="intel-eyebrow">Institution lookup</p>
          <div className="intel-lookup__grid">
            <label>
              Name or NMLS Institution ID
              <input name="q" type="search" autoComplete="off" />
            </label>
            <button className="intel-btn intel-btn--primary" type="submit">
              Search published profiles
            </button>
          </div>
          <p className="intel-kicker">
            Search uses the existing controlled public corpus (181 national-searchable + 130 Florida-public). It does
            not rank lenders and does not search MLOs or branches.
          </p>
        </form>
      </section>

      <section className="intel-section" id="record" aria-labelledby="record-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">State of the record</p>
          <h2 id="record-title">What is in the research universe</h2>
          <p>These are snapshot metrics, not findings about lender quality. Each number has a grain.</p>
        </div>
        <div className="intel-metric-rail">
          {intel.stateOfRecord.map((metric) => (
            <article className="intel-metric" key={metric.id}>
              <p className="intel-metric__value">{metric.display}</p>
              <h3>{metric.label}</h3>
              <p className="intel-kicker">
                Official as-of {dateLabel(metric.officialAsOf)} · Retrieved {dateLabel(metric.retrievedAt)}
              </p>
              <details className="intel-disclose">
                <summary>Trace this number</summary>
                <p>{metric.definition}</p>
                <ul>
                  {metric.components.map((part) => (
                    <li key={part.payloadKey}>
                      {part.label}: {part.value} ({part.payloadKey})
                    </li>
                  ))}
                </ul>
                <p>
                  Grain: {metric.grain}. Method: {metric.method} Payload key: <code>{metric.payloadKey}</code>
                </p>
                <ul>
                  {metric.limitations.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </div>
      </section>

      <section className="intel-section" id="findings" aria-labelledby="findings-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">What the data says</p>
          <h2 id="findings-title">Three national evidence stories</h2>
          <p>Each story is a benchmark or a coverage gap. None is a ranking of lenders.</p>
        </div>
        <div className="intel-findings">
          {intel.findings.map((finding) => (
            <Story key={finding.storyId} finding={finding} />
          ))}
        </div>
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
          <h2 id="gaps-title">Where the record is incomplete</h2>
        </div>
        <ul className="intel-plain-list">
          {intel.gaps.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h3>Things you may still want to verify directly</h3>
        <ul className="intel-plain-list">
          {intel.verifyDirectly.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="intel-section" id="explore" aria-labelledby="explore-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Explore the market</p>
          <h2 id="explore-title">Reported HMDA 2025 application volume by jurisdiction</h2>
          <p>
            Color intensity encodes county-grain HMDA 2025 application volume aggregated to the state or territory. It
            does not encode quality, approval likelihood, consumer risk, or lender quality. Florida is the only state
            intelligence page on this hub today.
          </p>
        </div>
        <p className="intel-legend">Legend: darker cells have more reported county-grain applications. Not a ranking.</p>
        <div className="intel-geo-grid">
          {intel.geography
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((row) => (
              <a
                key={row.state}
                className="intel-geo-cell"
                href={row.intelligenceHref ?? row.searchHref}
                style={{ ['--intel-volume' as string]: String(row.volumeShare / 100) }}
              >
                <strong>{row.state}</strong>
                <span className="visually-hidden">
                  {row.name}. Reported applications {row.applications.toLocaleString('en-US')}.
                  {row.intelligenceHref ? ' Opens Florida intelligence.' : ' Opens national lender research.'}
                </span>
              </a>
            ))}
        </div>
        <article className="intel-florida">
          <p className="intel-eyebrow">Florida preview</p>
          <h3>Florida mortgage intelligence</h3>
          <p>{intel.floridaPreview.note}</p>
          <ul className="intel-plain-list">
            <li>HMDA 2025 county-grain applications: {intel.floridaPreview.applications.toLocaleString('en-US')}</li>
            <li>HMDA 2025 originations: {intel.floridaPreview.originations.toLocaleString('en-US')}</li>
            <li>Public Florida company profiles: {intel.floridaPreview.publicProfiles}</li>
            <li>Internal Florida company profiles: {intel.floridaPreview.internalProfiles.toLocaleString('en-US')} (not all public)</li>
          </ul>
          <Link className="intel-btn intel-btn--secondary" href={intel.floridaPreview.href}>
            Explore Florida Intelligence →
          </Link>
        </article>
        <details className="intel-disclose">
          <summary>Accessible state list</summary>
          <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="County-grain HMDA 2025 counts by jurisdiction">
            <table className="hub-table">
              <caption>
                County-grain HMDA 2025 counts by jurisdiction. Florida links to state intelligence; other jurisdictions
                open national lender research.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Jurisdiction</th>
                  <th scope="col">Applications</th>
                  <th scope="col">Originations</th>
                  <th scope="col">Denials</th>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="intel-section" id="ask" aria-labelledby="ask-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Ask the market</p>
          <h2 id="ask-title">Structured questions, not a chatbot</h2>
        </div>
        <AskTrustHubSearch />
        <div className="intel-ask">
          {intel.askMarket.map((item) => (
            <details key={item.id} className="intel-disclose">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
              <p>
                <Link className="intel-text-link" href={item.href}>
                  {item.hrefLabel} <span aria-hidden="true">→</span>
                </Link>
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="intel-section" id="use" aria-labelledby="use-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Use the research</p>
          <h2 id="use-title">Act after you understand the evidence</h2>
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
        <h3>How this research was assembled</h3>
        <ol className="intel-journey">
          {intel.journey.map((row) => (
            <li key={row.step}>
              {row.step} — {row.status}
            </li>
          ))}
        </ol>
      </section>

      <section className="intel-section" id="sources" aria-labelledby="sources-title">
        <div className="intel-heading">
          <p className="intel-eyebrow">Evidence / sources / limitations</p>
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
        <ul className="intel-plain-list">
          {intel.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="intel-kicker">
          Snapshot {intel.homepagePublicationVersion}. Payload {intel.payloadFingerprint.slice(0, 12)}… Pricing homepage
          V1: {intel.pricingHomepageV1}. Change module: {intel.changeModule.status}.
        </p>
      </section>
    </div>
  );
}
