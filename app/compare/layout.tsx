import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/directory/categories';

export const metadata: Metadata = {
  title: 'Compare Lenders',
  description: 'Side-by-side comparison of verified mortgage lenders by trust score, ratings, and loan types.',
  alternates: { canonical: `${SITE_URL}/compare` },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
