import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of service for using Lender Trust Hub directory, calculators, and resources.',
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-10 md:py-14 prose prose-zinc">
      <h1>Terms of Service</h1>
      <p className="text-sm text-zinc-500">Effective date: June 1, 2026</p>
      <p>
        By using <a href={SITE_URL}>www.lendertrusthub.com</a>, you agree to these terms.
      </p>
      <h2>Educational use only</h2>
      <p>
        Directory listings, calculators, and articles are for informational and educational
        purposes. They are not financial, legal, or lending advice. Rates, fees, and approvals
        vary — confirm details directly with licensed lenders.
      </p>
      <h2>Not a lender</h2>
      <p>
        Lender Trust Hub is an independent research directory. We do not originate loans, broker
        mortgages, or guarantee outcomes with any listed company.
      </p>
      <h2>Zero paid placements</h2>
      <p>
        Rankings and listings cannot be bought. Sponsored content, if ever introduced, will be
        clearly labeled and separated from organic rankings.
      </p>
      <h2>Contact</h2>
      <p>
        Questions: <a href="/contact">Contact us</a>.
      </p>
    </div>
  );
}
