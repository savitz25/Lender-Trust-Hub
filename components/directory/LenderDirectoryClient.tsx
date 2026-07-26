'use client';

/**
 * Progressive lender directory grid — mirrors MoveTrustHub /companies behavior.
 *
 * Page size: LENDER_DIRECTORY_PAGE_SIZE (default 30 = 10 rows × 3 cols).
 * Adjust batch size in lib/directory/page-size.ts only.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Loader2, Search, X } from 'lucide-react';
import { LenderCard } from '@/components/LenderCard';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  filterAndSortLenders,
  LENDER_SORT_OPTIONS,
  LOAN_TYPE_FILTERS,
  type LenderDirectoryQuery,
  type LenderSortOption,
} from '@/lib/directory/filter-lenders';
import {
  LENDER_DIRECTORY_MAX_REVEAL,
  LENDER_DIRECTORY_PAGE_SIZE,
} from '@/lib/directory/page-size';
import type { Lender, LoanType } from '@/lib/mockData';

const RESULTS_MIN_HEIGHT = 'min-h-[480px] md:min-h-[520px]';

export interface LenderDirectoryClientProps {
  /** Full (or pre-scoped) lender list for this view — client filters & paginates. */
  lenders: Lender[];
  /** Initial batch size. Change via pageSize prop or LENDER_DIRECTORY_PAGE_SIZE. */
  pageSize?: number;
  countyLabel?: string;
  /** Return path for profile links (e.g. /local-lenders or county URL). */
  profileReturnPath?: string;
  /** Optional initial query from server searchParams. */
  initialSearch?: string;
  initialSort?: LenderSortOption;
  initialLoanType?: LoanType | '';
  initialMinRating?: number;
  /** Hide search when parent already provides a hero search. */
  showSearch?: boolean;
  /** Show rank numbers on cards (useful on small county lists). */
  showRank?: boolean;
  emptyMessage?: string;
}

export function LenderDirectoryClient({
  lenders,
  pageSize = LENDER_DIRECTORY_PAGE_SIZE,
  countyLabel,
  profileReturnPath = '/local-lenders',
  initialSearch = '',
  initialSort = 'trust',
  initialLoanType = '',
  initialMinRating = 0,
  showSearch = true,
  showRank = false,
  emptyMessage = 'No lenders match your criteria. Try clearing filters or browsing by state.',
}: LenderDirectoryClientProps) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sort, setSort] = useState<LenderSortOption>(initialSort);
  const [loanType, setLoanType] = useState<LoanType | ''>(initialLoanType);
  const [minRating, setMinRating] = useState(initialMinRating);
  const [nmlsVerifiedOnly, setNmlsVerifiedOnly] = useState(false);
  const [bbbAPlusOnly, setBbbAPlusOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  /** How many filtered results are currently revealed in the grid. */
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [loadingMore, setLoadingMore] = useState(false);

  // Debounce search so typing stays snappy
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput), 280);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const query: LenderDirectoryQuery = useMemo(
    () => ({
      search: debouncedSearch,
      sort,
      loanType,
      minRating,
      nmlsVerifiedOnly,
      bbbAPlusOnly,
    }),
    [debouncedSearch, sort, loanType, minRating, nmlsVerifiedOnly, bbbAPlusOnly],
  );

  const filtered = useMemo(
    () => filterAndSortLenders(lenders, query),
    [lenders, query],
  );

  // Reset progressive window whenever filters/search change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [query, pageSize]);

  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const totalMatches = filtered.length;
  const hasMore = visibleCount < totalMatches;
  const remaining = Math.max(totalMatches - visible.length, 0);
  const showingFrom = totalMatches === 0 ? 0 : 1;
  const showingTo = Math.min(visible.length, totalMatches);

  const activeFilterCount =
    (loanType ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (nmlsVerifiedOnly ? 1 : 0) +
    (bbbAPlusOnly ? 1 : 0) +
    (debouncedSearch.trim() ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
    setSort('trust');
    setLoanType('');
    setMinRating(0);
    setNmlsVerifiedOnly(false);
    setBbbAPlusOnly(false);
  }, []);

  const loadNextPage = useCallback(() => {
    setLoadingMore(true);
    // Microtask delay keeps button loading state accessible for screen readers
    window.requestAnimationFrame(() => {
      setVisibleCount((n) => Math.min(n + pageSize, totalMatches));
      setLoadingMore(false);
    });
  }, [pageSize, totalMatches]);

  const showAll = useCallback(() => {
    setLoadingMore(true);
    window.requestAnimationFrame(() => {
      setVisibleCount(Math.min(totalMatches, LENDER_DIRECTORY_MAX_REVEAL));
      setLoadingMore(false);
    });
  }, [totalMatches]);

  return (
    <div className="space-y-4">
      {/* Toolbar: search + sort + filter toggle */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {showSearch ? (
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search lenders by name, ZIP, city, or loan type</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                aria-hidden
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by ZIP, lender name, city, or loan type…"
                className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-[#0A2540] placeholder:text-zinc-400 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                autoComplete="off"
              />
            </label>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <span className="whitespace-nowrap font-medium text-[#0A2540]">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as LenderSortOption)}
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-[#0A2540] focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                aria-label="Sort lenders"
              >
                {LENDER_SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <Button
              type="button"
              variant={showFilters ? 'default' : 'outline'}
              size="sm"
              className="h-11 gap-1.5 px-4"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="lender-directory-filters"
            >
              <Filter className="h-4 w-4" aria-hidden />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-white/20 px-1.5 text-xs tabular-nums">
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
          </div>
        </div>

        {showFilters ? (
          <div
            id="lender-directory-filters"
            className="mt-4 space-y-4 border-t border-zinc-100 pt-4"
          >
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                Loan type
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by loan type">
                <button
                  type="button"
                  onClick={() => setLoanType('')}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    !loanType
                      ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#3B82F6]/40'
                  }`}
                >
                  Any
                </button>
                {LOAN_TYPE_FILTERS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setLoanType(type === loanType ? '' : type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      loanType === type
                        ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#3B82F6]/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <label className="flex items-center gap-2 text-sm text-zinc-600">
                <span className="font-medium text-[#0A2540]">Min rating</span>
                <select
                  value={minRating || ''}
                  onChange={(e) => setMinRating(e.target.value ? Number(e.target.value) : 0)}
                  className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-sm focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20"
                >
                  <option value="">Any</option>
                  <option value="4.5">4.5+ stars</option>
                  <option value="4.0">4.0+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                </select>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={nmlsVerifiedOnly}
                  onChange={(e) => setNmlsVerifiedOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#3B82F6] focus:ring-[#3B82F6]/30"
                />
                NMLS verified only
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
                <input
                  type="checkbox"
                  checked={bbbAPlusOnly}
                  onChange={(e) => setBbbAPlusOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-[#3B82F6] focus:ring-[#3B82F6]/30"
                />
                BBB A+ only
              </label>

              {activeFilterCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="ml-auto gap-1 text-xs"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Clear all filters
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Counter — same pattern as movers “Showing 1–24 of N companies” */}
      <div className="mb-1 flex min-h-[1.25rem] flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" aria-atomic="true" className="text-zinc-500">
          {totalMatches === 0 ? (
            <span>No lenders match your criteria</span>
          ) : (
            <>
              Showing{' '}
              <span className="font-medium tabular-nums text-[#0A2540]">
                {showingFrom}–{showingTo}
              </span>{' '}
              of{' '}
              <span className="font-medium tabular-nums text-[#0A2540]">{totalMatches}</span>{' '}
              {totalMatches === 1 ? 'lender' : 'lenders'}
            </>
          )}
        </div>
        <div className="hidden text-zinc-500 sm:block">Click a card to view full profile</div>
      </div>

      <div className={`relative ${RESULTS_MIN_HEIGHT}`}>
        {totalMatches === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
            <p className="text-zinc-600">{emptyMessage}</p>
            {activeFilterCount > 0 ? (
              <Button type="button" variant="outline" className="mt-4" onClick={clearAllFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          /* Responsive grid: 1 / 2 / 3 columns — matches movers directory */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((lender, i) => (
              <LenderCard
                key={lender.id}
                lender={lender}
                rank={showRank ? i + 1 : undefined}
                countyLabel={countyLabel}
                profileReturnPath={profileReturnPath}
              />
            ))}
          </div>
        )}

        {hasMore ? (
          <div className="mt-10 flex flex-col items-center gap-3 border-t border-zinc-200 pt-8">
            <Button
              type="button"
              size="lg"
              className="h-12 min-w-[min(100%,20rem)] px-8 text-base font-semibold shadow-sm"
              disabled={loadingMore}
              onClick={loadNextPage}
              aria-label={`Show the next ${Math.min(pageSize, remaining)} lenders`}
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  Loading…
                </>
              ) : (
                <>
                  Show the next {Math.min(pageSize, remaining)} lenders
                  <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
            <button
              type="button"
              className="text-sm text-zinc-500 underline-offset-4 hover:text-[#0A2540] hover:underline disabled:opacity-50"
              disabled={loadingMore}
              onClick={showAll}
            >
              Show all remaining ({remaining})
            </button>
          </div>
        ) : null}

        {!hasMore && totalMatches > pageSize ? (
          <p className="mt-8 text-center text-sm text-zinc-500">
            You&apos;ve reached the end of the directory
            {activeFilterCount > 0 ? ' for these filters' : ''}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
