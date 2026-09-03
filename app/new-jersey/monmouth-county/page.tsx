import { generateNjCountyMetadata, NewJerseyCountyPage } from '@/lib/new-jersey-intelligence/counties/county-route';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return generateNjCountyMetadata('monmouth-county');
}

export default function Page() {
  return <NewJerseyCountyPage slug="monmouth-county" />;
}
