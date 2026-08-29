import Link from 'next/link';
import { askExamplePrompts } from '@/lib/ask-lender/execute';

export function AskTrustHubSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const examples = askExamplePrompts();
  return (
    <div className="intel-ask-panel">
      <form action="/ask" method="get">
        <label htmlFor="ask-lender-input">Ask a mortgage-market research question</label>
        <div className="intel-ask-row">
          <input
            id="ask-lender-input"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={initialQuery}
            placeholder="Which lenders originated the most mortgages in Florida?"
          />
          <button className="intel-btn intel-btn--primary" type="submit">
            Ask
          </button>
        </div>
      </form>
      <p className="intel-kicker">
        This is not a chatbot. Natural language is mapped to a structured query plan. Institution results come from
        committed HMDA observations and confirmed identity bridges — not invented answers.
      </p>
      <div className="intel-ask-examples" role="list">
        {examples.map((q) => (
          <Link key={q} href={`/ask?q=${encodeURIComponent(q)}`} className="intel-chip">
            {q}
          </Link>
        ))}
      </div>
    </div>
  );
}
