import { generateNjCountyMetadata, NewJerseyCountyPage } from '@/lib/new-jersey-intelligence/counties/county-route';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return generateNjCountyMetadata('somerset-county');
}

export default function Page() {
  return <NewJerseyCountyPage slug="somerset-county" />;
}
