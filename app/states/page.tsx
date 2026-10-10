import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/directory/categories';
import { PUBLISHED_STATES } from '@/lib/home-intel/published-states';

const PATH = '/states';

export const metadata: Metadata = {
  title: 'All states',
  description: 'Published LenderTrustHub state research pages.',
  alternates: { canonical: `${SITE_URL}${PATH}` },
  robots: { index: true, follow: true },
  openGraph: {
    title: 'All states | Lender Trust Hub',
    description: 'Published LenderTrustHub state research pages.',
    url: `${SITE_URL}${PATH}`,
  },
};

export default function StatesIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 text-slate-900">
      <h1 className="text-4xl font-bold tracking-tight">All states</h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-700">
        Published statewide LenderTrustHub research.
      </p>
      <ul className="mt-8 columns-1 gap-x-8 sm:columns-2 lg:columns-3">
        {PUBLISHED_STATES.map((state) => (
          <li key={state.slug} className="mb-2 break-inside-avoid">
            <Link href={state.href} className="text-teal-800 underline">
              {state.name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
