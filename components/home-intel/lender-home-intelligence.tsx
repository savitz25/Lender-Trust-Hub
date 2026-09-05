import Link from 'next/link';
import { LENDER_EVIDENCE_FAMILY_LABELS } from '@/lib/home-intel/evidence-inventory';
import type { HomepageEvidenceMeasure, LenderEvidenceFamily, LenderHomeIntel } from '@/lib/home-intel/types';
import { AskTrustHubSearch } from './ask-trust-hub-search';
import { LenderHomeChecklist } from './lender-home-checklist';

const FAMILY_ORDER = Object.keys(LENDER_EVIDENCE_FAMILY_LABELS) as LenderEvidenceFamily[];

function Trace({ item }: { item: HomepageEvidenceMeasure }) {
  return (
    <details className="intel-disclose">
      <summary>Trace this measure</summary>
      <p>{item.definition}</p>
      <dl className="intel-trace-list">
        <div><dt>Grain</dt><dd>{item.grain}</dd></div>
        <div><dt>Geography</dt><dd>{item.geography}</dd></div>
        <div><dt>Source</dt><dd>{item.sourceSystem}</dd></div>
        <div><dt>{item.sourceClockLabel}</dt><dd>{item.sourceClock}</dd></div>
        {item.retrievedAt ? <div><dt>Retrieved</dt><dd>{item.retrievedAt}</dd></div> : null}
        {item.generatedAt ? <div><dt>Snapshot generated</dt><dd>{item.generatedAt}</dd></div> : null}
        <div><dt>Accepted artifact</dt><dd><code>{item.acceptedArtifact}</code></dd></div>
        <div><dt>Counts</dt><dd>{item.counts}</dd></div>
        <div><dt>Does not count</dt><dd>{item.doesNotCount}</dd></div>
      </dl>
      {item.identityRule ? <p><strong>Identity rule:</strong> {item.identityRule}</p> : null}
      <Link className="intel-text-link" href={item.researchDestination}>Open related research →</Link>
    </details>
  );
}

function InventoryFamily({ family, items }: { family: LenderEvidenceFamily; items: HomepageEvidenceMeasure[] }) {
  return (
    <section className="intel-family" aria-labelledby={`family-${family}`}>
      <div className="intel-family__heading">
        <p className="intel-eyebrow">Evidence family</p>
        <h3 id={`family-${family}`}>{LENDER_EVIDENCE_FAMILY_LABELS[family]}</h3>
      </div>
      <div className="intel-family__measures">
        {items.map((item) => (
          <article className={`intel-measure${item.publicationStatus === 'PUBLIC_LIMITATION' ? ' intel-measure--limitation' : ''}`} key={item.key}>
            {item.publicationStatus === 'PUBLIC_LIMITATION' ? <p className="intel-measure__badge">Coverage limitation</p> : null}
            <p className="intel-measure__value">{item.display}</p>
            <h4>{item.label}</h4>
            <p>{item.grain} · {item.geography}</p>
            <p className="intel-freshness"><span>{item.sourceClockLabel}</span> {item.sourceClock}</p>
            {item.retrievedAt ? <p className="intel-freshness"><span>Retrieved</span> {item.retrievedAt}</p> : null}
            <Trace item={item} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function LenderHomeIntelligenceUnavailable({ reason }: { reason: string }) {
  return (
    <div className="intel-home"><section className="intel-hero" aria-labelledby="home-title">
      <p className="intel-eyebrow">Independent lender intelligence</p>
      <h1 id="home-title">Research the lender—and the evidence around them.</h1>
      <p className="intel-hero__lede">The accepted evidence inventory is temporarily unavailable. We do not replace it with stale marketing numbers.</p>
      <p className="intel-kicker">{reason}</p>
    </section></div>
  );
}

export function LenderHomeIntelligence({ intel }: { intel: LenderHomeIntel }) {
  const inventoryByFamily = new Map(FAMILY_ORDER.map((family) => [family, intel.evidenceInventory.filter((item) => item.family === family)]));
  const nationalScale = ['national_institutions', 'hmda_applications', 'hmda_originations', 'cfpb_complaints', 'federal_enforcement']
    .map((key) => intel.evidenceInventory.find((item) => item.key === key)).filter(Boolean) as HomepageEvidenceMeasure[];

  return (
    <div className="intel-home">
      <section className="intel-hero intel-hero--showcase" aria-labelledby="home-title">
        <div className="intel-hero__copy">
          <p className="intel-eyebrow">Independent lender & mortgage intelligence</p>
          <h1 id="home-title">Research the lender. Understand the market. Compare the offer.</h1>
          <p className="intel-hero__lede">LenderTrustHub connects institution identity to licensing, HMDA market activity, consumer complaints, regulatory actions, depository context, and state homebuyer programs—where official sources support it.</p>
          <p className="intel-hero__promise">No Trust Score. No ranking. You decide.</p>
          <div className="intel-hero__actions">
            <a className="intel-btn intel-btn--primary" href="#lookup">Research a lender</a>
            <a className="intel-btn intel-btn--secondary" href="#states">Explore state intelligence</a>
            <a className="intel-text-link intel-hero__text-link" href="#inventory">See the evidence inventory →</a>
          </div>
          <p className="intel-kicker">Official public evidence · Source-native grains · Freshness shown per source</p>
        </div>
        <aside className="intel-hero__signal" aria-label="Evidence available around a lender">
          <p className="intel-eyebrow">Evidence around a lender</p>
          <ol><li><span>01</span> Institution & license identity</li><li><span>02</span> Market activity by geography</li><li><span>03</span> Complaints & regulatory history</li><li><span>04</span> Bank and program context</li></ol>
          <p>Availability differs by institution, state, source, and time.</p>
        </aside>
        <form id="lookup" className="intel-lookup" action="/lender" method="get">
          <div><p className="intel-eyebrow">Research a lender</p><h2>Search by name or NMLS Institution ID</h2><p>Search public institution profiles—not MLO people or branch records.</p></div>
          <div className="intel-lookup__grid"><label><span className="visually-hidden">Lender name or NMLS Institution ID</span><input name="q" type="search" autoComplete="off" placeholder="Lender name or NMLS ID" /></label><button className="intel-btn intel-btn--primary" type="submit">Search lenders</button></div>
        </form>
      </section>

      <section className="intel-section intel-section--tint" id="layers" aria-labelledby="layers-title">
        <div className="intel-heading intel-heading--wide"><p className="intel-eyebrow">Beyond a lender directory</p><h2 id="layers-title">Eight evidence layers. Different questions. Separate grains.</h2><p>A profile is an entry point. The research product is the official evidence connected around that identity.</p></div>
        <div className="intel-layer-flow">{FAMILY_ORDER.map((family, index) => <a href={`#family-${family}`} key={family}><span>{String(index + 1).padStart(2, '0')}</span><strong>{LENDER_EVIDENCE_FAMILY_LABELS[family]}</strong><small>{inventoryByFamily.get(family)?.length ?? 0} traceable measures</small></a>)}</div>
        <p className="intel-semantic-note">An application is not a lender. A complaint is not a finding. An enforcement record is not a criminal conviction. Missing evidence is not zero.</p>
      </section>

      <section className="intel-section" id="scale" aria-labelledby="scale-title">
        <div className="intel-heading"><p className="intel-eyebrow">Network scale</p><h2 id="scale-title">Large official datasets—without a fake grand total</h2><p>Each headline stays in its own source-native grain. These figures must not be added together.</p></div>
        <div className="intel-scale-band">{nationalScale.map((item) => <article key={item.key}><p className="intel-measure__value">{item.display}</p><h3>{item.label}</h3><p>{item.grain}</p><Trace item={item} /></article>)}</div>
      </section>

      <section className="intel-section intel-section--dark" id="identity" aria-labelledby="identity-title">
        <div className="intel-heading"><p className="intel-eyebrow">Identity is infrastructure</p><h2 id="identity-title">One institution can appear under several official identifiers</h2><p>We connect identifiers only when accepted evidence supports the relationship. There is no fabricated universal crosswalk.</p></div>
        <div className="intel-identity-map" aria-label="Separate official lender identity systems">
          <div className="intel-identity-map__hub"><strong>Lender / institution research identity</strong><span>Evidence-connected only when the accepted crosswalk is exact or deterministic</span></div>
          <div><strong>NMLS institution</strong><span>Company identifier</span></div><div><strong>State license / credential</strong><span>Regulator identifier</span></div><div><strong>HMDA LEI</strong><span>Market reporter identifier</span></div><div><strong>FDIC CERT</strong><span>Insured depository identifier</span></div><div><strong>Branch NMLS</strong><span>Branch identifier</span></div><div><strong>MLO NMLS</strong><span>Individual originator identifier</span></div>
        </div>
        <div className="intel-identity-footnotes"><p><strong>No universal crosswalk:</strong> relationships are shown only when accepted evidence supports an exact or deterministic crosswalk.</p><p><strong>Separate:</strong> NMLS institution ≠ branch NMLS · NMLS institution ≠ MLO NMLS · HMDA LEI ≠ NMLS ID · FDIC CERT ≠ NMLS ID · bank ≠ all lenders.</p><p><strong>Safe attribution:</strong> exact official identifiers are preferred for adverse evidence. Ambiguous name-only matches remain aggregate or withheld.</p></div>
      </section>

      <section className="intel-section" id="inventory" aria-labelledby="inventory-title">
        <div className="intel-heading intel-heading--wide"><p className="intel-eyebrow">Full public evidence inventory</p><h2 id="inventory-title">What the homepage can substantiate today</h2><p>Built from accepted national and state artifacts. Unknown sources are labeled; internal graph and private MLO measures are excluded.</p></div>
        <nav className="intel-family-nav" aria-label="Evidence inventory families">{FAMILY_ORDER.map((family) => <a href={`#family-${family}`} key={family}>{LENDER_EVIDENCE_FAMILY_LABELS[family]}</a>)}</nav>
        <div className="intel-inventory">{FAMILY_ORDER.map((family) => <InventoryFamily key={family} family={family} items={inventoryByFamily.get(family) ?? []} />)}</div>
      </section>

      <section className="intel-section intel-section--tint" id="states" aria-labelledby="states-title">
        <div className="intel-heading intel-heading--wide"><p className="intel-eyebrow">Six state intelligence surfaces</p><h2 id="states-title">Regulators, evidence depth, and source clocks differ by state</h2><p>These are research destinations, not ratings. Application volume does not determine their order or visual weight.</p></div>
        <div className="intel-state-grid">{intel.stateCards.map((state) => <article className="intel-state-card" key={state.code}>
          <header><span>{state.code}</span><div><h3>{state.name}</h3><p>{state.regulators}</p></div></header>
          <div className="intel-state-card__metrics">{state.highlights.map((highlight) => <div key={highlight.label}><strong>{highlight.value}</strong><span>{highlight.label}</span><small>{highlight.grain}</small></div>)}</div>
          <ul>{state.evidence.map((item) => <li key={item}>{item}</li>)}</ul><p><strong>Identity:</strong> {state.identityNote}</p><p className="intel-state-card__limit">{state.limitation}</p>
          <dl className="intel-state-clocks">{state.sourceClocks.map((clock) => <div key={clock.label}><dt>{clock.label}</dt><dd>{clock.sourceAsOf ? <><span>Source as of</span> {clock.sourceAsOf}</> : clock.sourceClock ? <><span>Source clock</span> {clock.sourceClock}</> : <><span>Source as of</span> Source date not reported</>}{clock.retrievedAt ? <small><b>Retrieved</b> {clock.retrievedAt}</small> : null}</dd></div>)}</dl>
          <Link className="intel-btn intel-btn--secondary" href={state.href}>Explore {state.name} intelligence →</Link>
        </article>)}</div>
      </section>

      <section className="intel-section" id="market" aria-labelledby="market-title">
        <div className="intel-heading"><p className="intel-eyebrow">Mortgage market activity</p><h2 id="market-title">HMDA shows what was reported—not which lender is best</h2><p>Applications, originations, denials, purpose, product, reporter, and geography are market observations. Denial rate is not a quality or misconduct score.</p></div>
        <div className="intel-geo-layout"><div><p className="intel-legend">Darker cells indicate more reported 2025 county-grain applications only.</p><div className="intel-geo-grid">{intel.geography.slice().sort((a, b) => a.name.localeCompare(b.name)).map((row) => <a key={row.state} className="intel-geo-cell" href={row.intelligenceHref ?? row.searchHref} style={{ ['--intel-volume' as string]: String(row.volumeShare / 100) }} title={`${row.name}: ${row.applications.toLocaleString('en-US')} applications`}><strong>{row.state}</strong><span className="visually-hidden">{row.name}. {row.applications.toLocaleString('en-US')} reported applications. {row.intelligenceHref ? 'Opens state intelligence.' : 'Opens national lender research.'}</span></a>)}</div></div>
          <aside><h3>Read market measures carefully</h3><ul className="intel-plain-list"><li>Application ≠ lender</li><li>Origination ≠ unique borrower</li><li>Denial ≠ misconduct</li><li>Market share ≠ recommendation</li></ul><Link className="intel-text-link" href="/mortgage-data">Explore mortgage market data →</Link></aside></div>
      </section>

      <section className="intel-section intel-section--split" id="regulatory" aria-labelledby="regulatory-title">
        <div><p className="intel-eyebrow">Complaints & regulatory history</p><h2 id="regulatory-title">Related evidence, different legal meaning</h2><p>CFPB complaints are consumer-reported observations. Regulator orders follow source-native legal processes. Neither becomes a proprietary score.</p></div>
        <div className="intel-contrast"><article><span>Consumer report</span><h3>CFPB complaint</h3><p>Not a proven violation, finding, or exposure-adjusted rate.</p></article><article><span>Official publication</span><h3>Regulatory record</h3><p>Not necessarily a criminal conviction or statement of current status.</p></article></div>
      </section>

      <section className="intel-section" id="programs" aria-labelledby="programs-title">
        <div className="intel-heading"><p className="intel-eyebrow">Homebuyer program intelligence</p><h2 id="programs-title">Research programs before assuming eligibility</h2><p>Accepted state artifacts document program families in five states. A program’s existence does not mean a borrower qualifies, funding is available, or a lender participates.</p></div>
        <div className="intel-program-band">{['nj_programs', 'ca_programs', 'tx_programs', 'wa_programs', 'az_programs'].map((key) => { const item = intel.evidenceInventory.find((entry) => entry.key === key); return item ? <article key={key}><strong>{item.display}</strong><span>{item.geography}</span><p>{item.label}</p></article> : null; })}</div>
        <Link className="intel-btn intel-btn--secondary" href="/tools/program-finder">Explore the program finder →</Link>
      </section>

      <section className="intel-section intel-section--tint" id="ask" aria-labelledby="ask-title">
        <div className="intel-heading"><p className="intel-eyebrow">Ask LenderTrustHub</p><h2 id="ask-title">Start with a research question</h2><p>Ask about a lender, NMLS identity, market, complaint evidence, regulator, or program—then inspect the cited context.</p></div><AskTrustHubSearch />
        <div className="intel-ask">{intel.askMarket.slice(0, 4).map((item) => <details key={item.id} className="intel-disclose"><summary>{item.question}</summary><p>{item.answer}</p><Link className="intel-text-link" href={item.href}>{item.hrefLabel} →</Link></details>)}</div>
      </section>

      <section className="intel-section" id="use" aria-labelledby="use-title">
        <div className="intel-heading"><p className="intel-eyebrow">Research, then compare</p><h2 id="use-title">Move from public evidence to your actual offer</h2><p>Lender research and market context come first. Calculators compare terms; they do not select or rank a lender.</p></div>
        <div className="intel-cta-grid">{intel.tools.map((tool) => <Link className="intel-cta" href={tool.href} key={tool.id}><strong>{tool.label}</strong><span>{tool.note}</span></Link>)}</div><h3>Research checklist</h3><LenderHomeChecklist />
      </section>

      <section className="intel-section intel-section--dark" id="limits" aria-labelledby="limits-title">
        <div className="intel-heading"><p className="intel-eyebrow">Evidence has limits</p><h2 id="limits-title">What this research does not establish</h2></div><div className="intel-limit-grid">{intel.doesNotInfer.map((item) => <p key={item}>{item}</p>)}<p>No enforcement found does not mean a clean record.</p><p>A program exists does not mean a borrower is eligible.</p><p>An address does not establish a lender’s service area.</p></div>
      </section>

      <section className="intel-section" id="sources" aria-labelledby="sources-title">
        <div className="intel-heading"><p className="intel-eyebrow">Sources, freshness & methodology</p><h2 id="sources-title">Every major number has a trace</h2><p>Source dates, retrieval dates, snapshot generation, and deployment are different clocks.</p></div>
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="Homepage source ledger"><table className="hub-table"><caption>National source ledger retained for technical traceability</caption><thead><tr><th scope="col">Dataset</th><th scope="col">Agency</th><th scope="col">Source as of</th><th scope="col">Retrieved</th><th scope="col">Used for</th></tr></thead><tbody>{intel.sources.map((row) => <tr key={row.id}><th scope="row">{row.dataset}</th><td>{row.agency}</td><td>{row.officialAsOf}</td><td>{row.retrievedAt}</td><td>{row.usedFor}</td></tr>)}</tbody></table></div>
        <p className="intel-kicker">Inventory projection generated {intel.freshnessClocks?.generatedAt.slice(0, 10) ?? intel.generatedAt.slice(0, 10)}. This is not a universal agency source date.</p><p><Link className="intel-text-link" href="/methodology">Read the methodology →</Link></p>
      </section>
    </div>
  );
}
