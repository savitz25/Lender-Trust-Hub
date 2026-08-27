import { SITE_URL } from '@/lib/directory/categories';
import { NATIONAL_PROFILE_GATE, nationalProfilePath } from './cohort';

const BRAND = 'Lender Trust Hub';

export function nationalProfileTitle(name: string): string {
  return `${name} — Mortgage Activity, Complaints & Regulatory Research`;
}

export function nationalProfileAbsoluteTitle(name: string): string {
  return `${nationalProfileTitle(name)} | ${BRAND}`;
}

export function nationalProfileDescription(name: string): string {
  return `Research ${name} using HMDA mortgage activity, CFPB complaint evidence, regulatory records, official identifiers, and source transparency. Independent research. Not a ranking, score, or lending advice.`;
}

export function nationalProfileCanonical(slug: string): string {
  return `${SITE_URL}${nationalProfilePath(slug)}`;
}

export function nationalProfileRobots() {
  if (NATIONAL_PROFILE_GATE.noindex) {
    return { index: false, follow: false, googleBot: { index: false, follow: false } };
  }
  return { index: true, follow: true };
}
