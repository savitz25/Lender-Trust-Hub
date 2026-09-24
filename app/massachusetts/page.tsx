import type { Metadata } from 'next';
import { JsonLd } from '@/components/directory/JsonLd';
import {
  MassachusettsStateIntelligence,
  MassachusettsStateIntelligenceUnavailable,
} from '@/components/massachusetts/massachusetts-state-intelligence';
import { buildMassachusettsIntelligenceJsonLd } from '@/lib/massachusetts-intelligence/jsonld';
import { loadMassachusettsIntelligence } from '@/lib/massachusetts-intelligence/load';
import { lookupMaDob } from '@/lib/massachusetts-intelligence/lookup';
import { MASSACHUSETTS_INTELLIGENCE_GATE } from '@/lib/massachusetts-intelligence/publication';
import { SITE_URL } from '@/lib/directory/categories';

export const dynamic = 'force-dynamic';

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata(): Metadata {
  const url = `${SITE_URL}${MASSACHUSETTS_INTELLIGENCE_GATE.path}`;
  const robots = MASSACHUSETTS_INTELLIGENCE_GATE.robotsIndex
    ? { index: true, follow: true }
    : { index: false, follow: false, googleBot: { index: false, follow: false } };
  return {
    title: MASSACHUSETTS_INTELLIGENCE_GATE.title,
    description: MASSACHUSETTS_INTELLIGENCE_GATE.description,
    robots,
    alternates: { canonical: url },
    openGraph: {
      title: MASSACHUSETTS_INTELLIGENCE_GATE.title,
      description: MASSACHUSETTS_INTELLIGENCE_GATE.description,
      url,
    },
  };
}

export default async function MassachusettsIntelligencePage({ searchParams }: Props) {
  const params = await searchParams;
  const raw = Array.isArray(params.id) ? params.id[0] : params.id;
  const lookup = raw ? lookupMaDob(raw) : null;
  const loaded = await loadMassachusettsIntelligence();
  if (loaded.status !== 'ok') {
    return <MassachusettsStateIntelligenceUnavailable reason={loaded.reason} />;
  }
  return (
    <>
      <JsonLd data={buildMassachusettsIntelligenceJsonLd(loaded.snapshot)} />
      <MassachusettsStateIntelligence snapshot={loaded.snapshot} lookup={lookup} />
    </>
  );
}
