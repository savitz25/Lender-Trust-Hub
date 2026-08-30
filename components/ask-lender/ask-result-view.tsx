import Link from 'next/link';
import type { AskExecution } from '@/lib/ask-lender/types';

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

export function AskResultView({ result, question }: { result: AskExecution; question: string }) {
  return (
    <div className="intel-ask-result">
      <h2>We interpreted your question as</h2>
      <ul className="intel-plain-list">
        {result.interpretation.map((line) => (
          <li key={line.label}>
            <strong>{line.label}:</strong> {line.value}
          </li>
        ))}
      </ul>
      <p className="intel-kicker">{result.geographyWarning}</p>

      {result.filters?.length ? (
        <div className="intel-ask-examples" role="list" aria-label="Refine this query">
          {result.filters.map((chip) => (
            <Link key={chip.id} href={chip.href} className={chip.active ? 'intel-chip intel-chip--active' : 'intel-chip'}>
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

      {result.rows?.length ? (
        <div className="hub-table-scroll" tabIndex={0} role="region" aria-label="Ask institution results">
          <table className="hub-table hub-table--compact">
            <caption className="visually-hidden">{result.headline}</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Institution / LEI</th>
                <th scope="col">{result.rows[0]?.metricLabel ?? 'Count'}</th>
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
                  <td>{fmt(row.metric)}</td>
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
                      <Link className="intel-text-link" href={row.href}>
                        {row.hrefLabel ?? 'Open profile'}
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
        <details key={`why-${row.rank}-${row.lei}`} className="intel-disclose">
          <summary>
            Why this matched · {row.displayName}
          </summary>
          <ul>
            {row.whyMatched.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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
            <li>Question: {question}</li>
          </ul>
        </details>
      ) : null}

      {result.sharePath ? (
        <p className="intel-kicker">
          Shareable research URL (noindex): <code>{result.sharePath}</code>
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
