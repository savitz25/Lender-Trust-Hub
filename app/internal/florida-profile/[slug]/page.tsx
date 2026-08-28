import { notFound } from 'next/navigation';
import { floridaProfileQaAllowed } from '@/lib/florida-profile/publication';

export const dynamic = 'force-dynamic';
export const robots = { index: false, follow: false };

export default async function FloridaProfileQaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await params;
  if (!floridaProfileQaAllowed()) {
    notFound();
  }
  notFound();
}
