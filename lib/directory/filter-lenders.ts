import type { Lender, LoanType } from '@/lib/mockData';

export type LenderSortOption =
  | 'trust'
  | 'rating'
  | 'reviews'
  | 'county-experience'
  | 'name';

export const LENDER_SORT_OPTIONS: { value: LenderSortOption; label: string }[] = [
  { value: 'trust', label: 'Trust Score (High → Low)' },
  { value: 'county-experience', label: 'County Experience (High → Low)' },
  { value: 'rating', label: 'Customer Rating' },
  { value: 'reviews', label: 'Number of Reviews' },
  { value: 'name', label: 'Name (A → Z)' },
];

export const LOAN_TYPE_FILTERS: LoanType[] = [
  'Conventional',
  'FHA',
  'VA',
  'USDA',
  'Jumbo',
  'ARM',
  'Refinance',
];

export interface LenderDirectoryQuery {
  search?: string;
  sort?: LenderSortOption;
  loanType?: LoanType | '';
  minRating?: number;
  nmlsVerifiedOnly?: boolean;
  bbbAPlusOnly?: boolean;
}

function matchesSearch(lender: Lender, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;

  if (/^\d{5}$/.test(q)) {
    return lender.zipCodes.some((z) => z === q || z.startsWith(q));
  }

  const haystack = [
    lender.name,
    lender.city,
    lender.state,
    lender.county,
    lender.nmlsId,
    lender.type,
    lender.shortDescription,
    ...lender.loanTypes,
    ...lender.specialties,
  ]
    .join(' ')
    .toLowerCase();

  return haystack.includes(q);
}

export function filterAndSortLenders(
  source: Lender[],
  query: LenderDirectoryQuery,
): Lender[] {
  let result = source;

  if (query.search?.trim()) {
    result = result.filter((l) => matchesSearch(l, query.search!));
  }

  if (query.loanType) {
    result = result.filter((l) => l.loanTypes.includes(query.loanType as LoanType));
  }

  if (query.minRating && query.minRating > 0) {
    result = result.filter((l) => l.rating >= query.minRating!);
  }

  if (query.nmlsVerifiedOnly) {
    result = result.filter((l) => l.nmlsVerified);
  }

  if (query.bbbAPlusOnly) {
    result = result.filter((l) => l.bbbRating === 'A+');
  }

  const sort = query.sort ?? 'trust';
  const sorted = [...result];

  sorted.sort((a, b) => {
    switch (sort) {
      case 'rating':
        return b.rating - a.rating || b.reviewCount - a.reviewCount;
      case 'reviews':
        return b.reviewCount - a.reviewCount || b.rating - a.rating;
      case 'county-experience':
        return (
          b.countyExperienceScore - a.countyExperienceScore || b.trustScore - a.trustScore
        );
      case 'name':
        return a.name.localeCompare(b.name);
      case 'trust':
      default:
        return b.trustScore - a.trustScore || b.countyExperienceScore - a.countyExperienceScore;
    }
  });

  return sorted;
}
