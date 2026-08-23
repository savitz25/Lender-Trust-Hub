import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { parseLenderAskHandoff } from '@/lib/search-handoff/parse';
import { resolveLenderAskHandoff } from '@/lib/search-handoff/resolve';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FromAskHandoffPage({ searchParams }: Props) {
  const params = await searchParams;
  const ctx = parseLenderAskHandoff(params);
  if (!ctx) redirect('/local-lenders');
  redirect(resolveLenderAskHandoff(ctx).href);
}
