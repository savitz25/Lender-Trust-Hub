'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { LenderHomeIntel } from '@/lib/home-intel/types';
import { askExamplePrompts, executeLenderAsk } from '@/lib/ask-lender/execute';

export function AskTrustHubSearch({ intel }: { intel: LenderHomeIntel }) {
  const [raw, setRaw] = useState('');
  const examples = askExamplePrompts();
  const result = useMemo(() => (raw.trim() ? executeLenderAsk(raw, intel) : null), [raw, intel]);

  return (
    <div className="intel-ask-panel">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setRaw(String(fd.get('ask') ?? ''));
        }}
      >
        <label htmlFor="ask-lender-input">Ask a mortgage-market research question</label>
        <div className="intel-ask-row">
          <input
            id="ask-lender-input"
            name="ask"
            type="search"
            autoComplete="off"
            defaultValue={raw}
            placeholder="How many mortgage applications are in the current research universe?"
          />
          <button className="intel-btn intel-btn--primary" type="submit">
            Interpret
          </button>
        </div>
      </form>
      <p className="intel-kicker">
        This is not a chatbot. Natural language is mapped to a structured query plan. Facts come from the deterministic
        homepage snapshot — not invented answers.
      </p>
      <div className="intel-ask-examples" role="list">
        {examples.map((q) => (
          <button key={q} type="button" className="intel-chip" onClick={() => setRaw(q)}>
            {q}
          </button>
        ))}
      </div>
      {result ? (
        <div className="intel-ask-result">
          <h3>We interpreted your question as</h3>
          <ul className="intel-plain-list">
            {result.interpretation.map((line) => (
              <li key={line.label}>
                <strong>{line.label}:</strong> {line.value}
              </li>
            ))}
          </ul>
          <p className="intel-kicker">{result.geographyWarning}</p>
          <details className="intel-disclose">
            <summary>Change interpretation</summary>
            <p>
              Edit the question and submit again. Property geography is not converted to lender location. “Most” is not
              converted to “best.”
            </p>
          </details>
          <h3>{result.headline}</h3>
          <p>{result.body}</p>
          {result.facts?.length ? (
            <ul className="intel-plain-list">
              {result.facts.map((f) => (
                <li key={f.label}>
                  {f.label}: {f.value}
                </li>
              ))}
            </ul>
          ) : null}
          {result.href ? (
            <p>
              <Link className="intel-text-link" href={result.href}>
                {result.hrefLabel ?? result.href}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
