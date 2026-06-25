import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Lenders',
  description: 'Side-by-side comparison of verified mortgage lenders by trust score, ratings, and loan types.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}