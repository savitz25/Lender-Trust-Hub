import { SITE_URL } from '@/lib/directory/categories';
import { nationalProfilePath } from './cohort';
import { getRenderRow, publicLenderRobots } from './publication';

const BRAND = 'Lender Trust Hub';

export function nationalProfileTitle(name: string): string {
  return `${name} — Independent Lender Research`;
}

export function nationalProfileAbsoluteTitle(name: string): string {
  return `${nationalProfileTitle(name)} | ${BRAND}`;
}

export function nationalProfileDescription(name: string, families?: string[]): string {
  const fam = new Set(families || []);
  const parts: string[] = [];
  if (!families || fam.has('hmda') || fam.has('geography')) {
    parts.push('HMDA mortgage activity');
  }
  if (!families || fam.has('cfpb')) {
    parts.push('CFPB complaint evidence');
  }
  if (!families || fam.has('enforcement')) {
    parts.push('regulatory records');
  }
  parts.push('official identifiers');
  parts.push('source transparency');
  return `Research ${name} using ${joinAnd(parts)}. Independent research. Not a ranking, score, or lending advice.`;
}

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] || 'public records';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

export function nationalProfileCanonical(slug: string): string {
  return `${SITE_URL}${nationalProfilePath(slug)}`;
}

/** Landing and unknown slugs: always noindex. */
export function nationalProfileRobots() {
  return publicLenderRobots({ isLanding: true });
}

export function nationalProfileRobotsForSlug(slug: string) {
  return publicLenderRobots({ slug });
}

export function nationalProfileDescriptionForSlug(name: string, slug: string): string {
  const row = getRenderRow(slug);
  return nationalProfileDescription(name, row?.content_families);
}

export { publicLenderRobots };
