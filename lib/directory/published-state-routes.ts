import { getStateSlugsWithAutoProviders } from '@/lib/auto/stateProviders';
import { US_STATES } from '@/lib/fdic/states';
import { getStateSlugsWithLenders } from '@/lib/mortgage/stateLenders';
import { AUTO_CATEGORY, FDIC_CATEGORY, MORTGAGE_CATEGORY } from './categories';

const publishedFdicStateSlugs = new Set(
  US_STATES.filter((state) => state.hasData).map((state) => state.slug)
);
const publishedMortgageStateSlugs = new Set(getStateSlugsWithLenders());
const publishedAutoStateSlugs = new Set(getStateSlugsWithAutoProviders());

/** Public FDIC state route, or null when that state page calls notFound(). */
export function publishedFdicStatePath(stateSlug: string): string | null {
  return publishedFdicStateSlugs.has(stateSlug) ? FDIC_CATEGORY.statePath(stateSlug) : null;
}

/** Public mortgage state route, or null when that state has no lender inventory. */
export function publishedMortgageStatePath(stateSlug: string): string | null {
  return publishedMortgageStateSlugs.has(stateSlug) ? MORTGAGE_CATEGORY.statePath(stateSlug) : null;
}

/** Public auto state route, or null when that state has no provider inventory. */
export function publishedAutoStatePath(stateSlug: string): string | null {
  return publishedAutoStateSlugs.has(stateSlug) ? AUTO_CATEGORY.statePath(stateSlug) : null;
}
