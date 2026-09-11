import Link from 'next/link';
import type { AskExecution } from '@/lib/ask-lender/types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function AskResultView({ result, question }: { result: AskExecution; question: string }) {
  return (
    <div className="intel-ask-result" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
      <p className="intel-eyebrow">We interpreted your question as</p>
      <dl className="intel-interpretation-grid">
        {result.interpretation.map((line) => (
          <div key={`${line.label}-${line.value}`}><dt>{line.label}</dt><dd>{line.value}</dd><dd><a className="intel-text-link" href="#ask-lender-input">Edit request</a></dd></div>
        ))}
      </dl>
      <p className="intel-kicker">{result.geographyWarning}</p>

      {result.filters?.length ? (
        <div className="intel-ask-examples" role="list" aria-label="Refine this query">
          {result.filters.map((chip) => (
            <Link key={chip.id} href={chip.href} data-specialist-event="refine" className={chip.active ? 'intel-chip intel-chip--active' : 'intel-chip'}>
              {chip.label}
            </Link>
          ))}
        </div>
      ) : null}

      <details className="intel-disclose">
        <summary>Change interpretation</summary>
        <p>
          Use the filters above or edit the question. Property geography is not converted to lender location. “Most” is
          not converted to “best.”
        </p>
      </details>

      <h3>{result.headline}</h3>
      <p>{result.body}</p>
      {result.lookup ? (
        <section aria-label="Identifier lookup outcome" style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
          <p><strong>Research scope:</strong> {result.lookup.scope}.</p>
          {result.lookup.sourceLookup === 'not_run' ? <p>No institution lookup was run for this request.</p> : null}
          <p><strong>Subject:</strong> requested {result.lookup.requestedClass === 'unknown' ? 'unspecified' : result.lookup.requestedClass}; resolved {result.lookup.resolvedClass}.</p>
          {result.lookup.identifiers.map((id, index) => <div key={`${id.type}-${index}`}>
            <p>Submitted: <code>{id.rawSpan}</code>. {result.lookup!.sourceLookup === 'not_run' ? 'Unconfirmed span' : `Complete ${id.type === 'LEI' ? 'LEI' : 'NMLS'}`}: <code>{id.value}</code>.</p>
            {id.normalization.map(note => <p key={note}>{note}.</p>)}
          </div>)}
          {result.rows?.map(row => <article key={row.institutionKey} className="intel-disclose">
            <h4>{row.displayName}</h4>
            <p>{row.nmls ? `NMLS ${row.nmls}` : ''}{row.lei ? ` | LEI ${row.lei}` : ''}</p>
            <p><strong>Why this matched:</strong> {row.whyMatched.join(' ')}</p>
            {row.href ? <Link className="intel-text-link" href={row.href} data-specialist-event="profile_open">Research this lender</Link> : null}
          </article>)}
          {result.lookup.conditions.length ? <div><h4>Requested conditions</h4><ul>{result.lookup.conditions.map((condition, index) => <li key={index}>
            <strong>{condition.text}:</strong> {condition.state === 'APPLIED' ? 'Applied' : condition.state === 'CONFLICT' ? 'Conflicting' : 'Not established'}. {condition.explanation}
          </li>)}</ul></div> : null}
          <p><a className="intel-text-link" href="#ask-lender-input">Edit or retry this lookup</a></p>
          {result.lookup.officialActions.map(action => <div key={action.family}><a className="intel-text-link" href={action.href} rel="noopener noreferrer" target="_blank">{action.label}</a><p>{action.instruction}</p></div>)}
        </section>
      ) : null}

      {result.period ? (
        <p className="intel-kicker">
          Source period: {result.period}. Grain: {result.grain ?? 'see trace'}.
          {result.denominator ? ` Denominator: ${result.denominator.label} ${fmt(result.denominator.value)}.` : ''}
        </p>
      ) : null}

      {result.facts?.length ? (
        <ul className="intel-plain-list">
          {result.facts.map((f) => (
            <li key={f.label}>
              {f.label}: {f.value}
            </li>
          ))}
        </ul>
      ) : null}

      {result.rows?.length && !result.lookup ? (
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="Ask institution results">
          <table className="hub-table hub-table--compact">
            <caption className="visually-hidden">{result.headline}</caption>
            <thead>
              <tr>
                <th scope="col">{result.query.identityQuery ? 'Identity relevance order' : 'Market activity order'}</th>
                <th scope="col">Institution / LEI</th>
                <th scope="col">{result.rows[0]?.metricLabel ?? 'Count'}</th>
                <th scope="col">Why this matched</th>
                <th scope="col">Identity</th>
                <th scope="col">Profile</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={`${row.rank}-${row.lei || row.displayName}`}>
                  <td>{row.rank}</td>
                  <th scope="row">
                    {row.displayName}
                    <div className="intel-kicker">
                      {row.lei ? `LEI ${row.lei}` : null}
                      {row.nmls ? ` · NMLS ${row.nmls}` : null}
                    </div>
                  </th>
                  <td>{result.query.identityQuery ? row.metricLabel : fmt(row.metric)}</td>
                  <td>{row.whyMatched[0]}</td>
                  <td>
                    {row.identityStatus === 'public_profile'
                      ? 'Public research profile'
                      : row.identityStatus === 'identity_hold'
                        ? 'Identity hold'
                        : row.identityStatus === 'unpublished_research_identity'
                          ? 'Unpublished research identity'
                          : 'HMDA reporting LEI'}
                  </td>
                  <td>
                    {row.href ? (
                      <Link className="intel-text-link" data-specialist-event="profile_open" href={row.href}>
                        {row.hrefLabel ?? 'Research this lender'}
                      </Link>
                    ) : (
                      'Not a public profile'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {result.rows?.map((row) => (
        <details key={`why-${row.rank}-${row.lei}`} className="intel-disclose" data-specialist-event="trace_open">
          <summary>
            Trace this result · {row.displayName}
          </summary>
          <p><strong>Why this matched</strong></p>
          <ul>
            {row.whyMatched.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {row.matchEvidence?.map(evidence => <p key={evidence.family}>
            Matched source field: {evidence.matchedField} = <code>{evidence.returnedValue}</code>. Method: exact identifier. Institution key: <code>{evidence.institutionKey}</code>. Source: {evidence.sourceReference}. Official source-as-of: {evidence.sourceAsOf ?? 'not supplied'}.
          </p>)}
          <p><strong>Evidence available:</strong> {(row.evidenceAvailable?.length ? row.evidenceAvailable : ['institution identity']).join('; ')}.</p>
          <p className="intel-kicker">{result.period ?? 'Committed publication manifest'} · {result.grain ?? 'institution identity'}. Property geography is not lender location or service territory.</p>
        </details>
      ))}

      {result.totalRows != null && result.pageCount != null && result.pageCount > 1 && result.sharePath ? (
        <nav className="intel-ask-pager" aria-label="Result pages">
          {result.page && result.page > 1 ? <Link href={askPageHref(result.sharePath, result.page - 1)}>Previous</Link> : <span>Previous</span>}
          <span>
            Page {result.page} of {result.pageCount} · {fmt(result.totalRows)} reporting institutions
          </span>
          {result.page && result.page < result.pageCount ? <Link href={askPageHref(result.sharePath, result.page + 1)}>Next</Link> : <span>Next</span>}
        </nav>
      ) : null}

      {result.caveats?.length ? (
        <div>
          <h3>Caveats</h3>
          <ul>
            {result.caveats.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {result.href ? (
        <p>
          <Link className="intel-text-link" href={result.href}>
            {result.hrefLabel ?? result.href}
          </Link>
        </p>
      ) : null}

      {result.trace ? (
        <details className="intel-disclose">
          <summary>Trace this query</summary>
          <p>{result.trace.method}</p>
          <ul>
            <li>Contract: {result.contract ?? result.trace.contract}</li>
            <li>Grain: {result.trace.grain}</li>
            <li>Period: {result.trace.period}</li>
            <li>Identity: {result.trace.identityPolicy}</li>
            <li>Publication gate: {result.trace.publicationGate}</li>
            <li>Indexes: {result.trace.indexes.join('; ')}</li>
            <li>Cache: {result.trace.cache}</li>
            <li>Source files: {result.trace.sourceFiles.join('; ')}</li>
            {result.elapsedMs != null ? <li>Elapsed: {result.elapsedMs} ms</li> : null}
            {result.countEvidence ? <>
              <li>Count availability: {result.countEvidence.availability}; numeric value: {result.countEvidence.value ?? 'unavailable'}</li>
              <li>Scope: {result.countEvidence.scope}; action: {result.countEvidence.action}; source field: {result.countEvidence.field ?? 'not selected'}</li>
              <li>Source fingerprint: {result.countEvidence.sourceFingerprint ?? 'not selected'}</li>
              <li>Retrieved: {result.countEvidence.retrievedAt ?? 'not supplied by this artifact'}; generated: {result.countEvidence.generatedAt ?? 'not supplied by this artifact'}</li>
              <li>Reporting year is a vintage, not an exact official effective timestamp or a live check.</li>
            </> : null}
            <li>Question: {question}</li>
          </ul>
        </details>
      ) : null}

      {result.sharePath ? (
        <p className="intel-kicker">
          Shareable research URL (noindex): <code style={{ overflowWrap: 'anywhere' }}>{result.sharePath}</code>
        </p>
      ) : null}
    </div>
  );
}

function askPageHref(sharePath: string, page: number): string {
  const url = new URL(sharePath, 'https://lendertrusthub.local');
  url.searchParams.set('page', String(page));
  return `${url.pathname}?${url.searchParams.toString()}`;
}
