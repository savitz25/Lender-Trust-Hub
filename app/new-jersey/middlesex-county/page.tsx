import { generateNjCountyMetadata, NewJerseyCountyPage } from '@/lib/new-jersey-intelligence/counties/county-route';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return generateNjCountyMetadata('middlesex-county');
}

export default function Page() {
  return <NewJerseyCountyPage slug="middlesex-county" />;
}
