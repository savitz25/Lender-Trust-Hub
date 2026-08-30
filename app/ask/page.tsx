import type { Metadata } from 'next';
import Link from 'next/link';
import { AskResultView } from '@/components/ask-lender/ask-result-view';
import { AskTrustHubSearch } from '@/components/home-intel/ask-trust-hub-search';
import { executeAskQuery } from '@/lib/ask-lender/execute-query';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { absolute: 'Ask LenderTrustHub' },
  description: 'Structured mortgage-market queries over existing HMDA, identity, and CFPB research records. Not a chatbot.',
  robots: { index: false, follow: true, googleBot: { index: false, follow: true, noimageindex: true } },
  alternates: { canonical: '/ask' },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function one(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? '';
  return v ?? '';
}

export default async function AskPage({ searchParams }: Props) {
  const params = await searchParams;
  const q = one(params.q).trim();
  const page = Number(one(params.page) || '1') || 1;
  const result = q
    ? executeAskQuery({
        q,
        page,
        overrides: {
          action: one(params.action) || null,
          loanType: one(params.loanType) || null,
          geo: one(params.geo) || null,
        },
      })
    : null;

  return (
    <div className="intel-home">
      <section className="intel-hero" aria-labelledby="ask-title">
        <p className="intel-eyebrow">Ask LenderTrustHub</p>
        <h1 id="ask-title">Ask a mortgage-market research question</h1>
        <p className="intel-hero__lede">
          Natural language is mapped to a structured query plan. Facts come from committed HMDA observations and
          confirmed identity bridges — not from a chatbot and not from invented counts.
        </p>
        <p className="intel-kicker">This page is shareable and noindex. It is not a public ranking product.</p>
      </section>
      <section className="intel-section" aria-labelledby="ask-form-title">
        <h2 id="ask-form-title" className="visually-hidden">
          Ask form
        </h2>
        <AskTrustHubSearch initialQuery={q} />
        {result ? <AskResultView result={result} question={q} /> : <p>Enter a question to run a deterministic research query.</p>}
        <p>
          <Link className="intel-text-link" href="/">
            Back to mortgage intelligence
          </Link>
        </p>
      </section>
    </div>
  );
}
