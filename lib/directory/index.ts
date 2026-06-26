/**
 * Unified directory platform — import from here when building new verticals.
 * See lib/directory/rollout.ts for the full integration guide.
 */
export { SITE_URL, FDIC_CATEGORY, MORTGAGE_CATEGORY, AUTO_CATEGORY, DIRECTORY_CATEGORIES } from './categories';
export type { DirectoryCategoryConfig, DirectoryInsightCard, UserScenario } from './types';
export { trackDirectoryEvent } from './analytics';
export { ROLLOUT_GUIDE } from './rollout';