import { ASK_QUERY_LIMIT } from '@/lib/ask-lender/request';
import type { AskUrlOverrides } from '@/lib/ask-lender/parse';
import Link from 'next/link';
import { askExamplePrompts } from '@/lib/ask-lender/execute';
import { SearchShellAnalytics } from '@/components/specialist-search/SearchShellAnalytics';

export function AskTrustHubSearch({ initialQuery = '', overrides = {} }: { initialQuery?: string; overrides?: AskUrlOverrides }) {
  const examples = askExamplePrompts();
  return (
    <div className="intel-ask-panel">
      <SearchShellAnalytics />
      <p className="intel-eyebrow">Research lenders</p>
      <h3>What do you want to find out?</h3>
      <form id="lender-specialist-search" action="/ask" method="get" role="search" aria-label="Research lenders">
        <label htmlFor="ask-lender-input" className="visually-hidden">Lender research question, institution name, NMLS ID, market, county or state</label>
        <div className="intel-ask-row">
          <input
            id="ask-lender-input"
            name="q"
            type="search"
            autoComplete="off"
            defaultValue={initialQuery}
            aria-describedby="ask-query-limit"
            required
            placeholder="Ask a question, enter a lender, NMLS ID, market, county or state..."
          />
          <button className="intel-btn intel-btn--primary" type="submit">
            Research
          </button>
        </div>
      </form>
      <p id="ask-query-limit" className="intel-kicker">Up to {ASK_QUERY_LIMIT} characters. Longer requests are rejected without shortening identifiers.</p>
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
      <details className="intel-disclose intel-advanced-filters">
        <summary>Advanced filters</summary>
        <div className="intel-filter-grid">
          <label>HMDA action<select name="action" defaultValue={overrides.action ?? ''} form="lender-specialist-search"><option value="">As interpreted</option><option value="application">Applications</option><option value="origination">Originations</option><option value="denial">Denials</option></select></label>
          <label>Loan type<select name="loanType" defaultValue={overrides.loanType ?? ''} form="lender-specialist-search"><option value="">As interpreted</option><option value="all">All loan types</option><option value="conventional">Conventional</option><option value="FHA">FHA</option><option value="VA">VA</option><option value="USDA">USDA</option></select></label>
          <label>Property geography<select name="geo" defaultValue={overrides.geo ?? ''} form="lender-specialist-search"><option value="">As interpreted</option><option value="FL">Florida</option><option value="broward">Broward County</option><option value="palm-beach">Palm Beach County</option></select></label>
        </div>
        <p className="intel-kicker">HMDA geography describes mortgaged-property activity—not lender headquarters, branches, licensing, or service territory.</p>
      </details>
    </div>
  );
}
