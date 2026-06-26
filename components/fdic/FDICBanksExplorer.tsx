'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Shuffle,
  Building2,
  Shield,
  ArrowRight,
  Sparkles,
  LayoutGrid,
  Table2,
  ArrowLeft,
} from 'lucide-react';
import { USMap } from '@/components/fdic/USMap';
import { BankCard } from '@/components/fdic/BankCard';
import { BankTable } from '@/components/fdic/BankTable';
import { StateStatsBar } from '@/components/fdic/StateStatsBar';
import { FDICFAQ } from '@/components/fdic/FDICFAQ';
import { BankMatchPanel } from '@/components/fdic/BankMatchPanel';
import { StateSelectorBar } from '@/components/fdic/StateSelectorBar';
import { ShareBookmarkBar } from '@/components/fdic/ShareBookmarkBar';
import { BankComparison } from '@/components/fdic/BankComparison';
import { StateEducationSections } from '@/components/fdic/StateEducationSections';
import { CategoryCTAs } from '@/components/fdic/CategoryCTAs';
import { US_STATES } from '@/lib/fdic/states';
import { getStateData, getAvailableStateCodes } from '@/lib/fdic/stateData';
import type { FDICBank, RegulatorKey } from '@/lib/fdic/types';
import {
  computeExtendedStateStats,
  downloadCSV,
  formatInsuredDate,
  getRegulatorKey,
  isHeadquarteredInState,
  parseInsuredDate,
} from '@/lib/fdic/utils';
import { statePagePath, statePageUrl } from '@/lib/fdic/seo';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 24;
const REGULATORS: RegulatorKey[] = ['OCC', 'FED', 'FDIC'];

type SortKey = 'name' | 'oldest' | 'newest' | 'cert';
type ViewMode = 'grid' | 'table';
type YearFilter = 'all' | 'before1990' | 'before2000' | 'after2010';

function celebrate() {
  if (typeof document === 'undefined') return;
  const colors = ['#00A3A1', '#0A2540', '#D4AF37', '#3B82F6'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed;z-index:9999;pointer-events:none;
      width:8px;height:8px;border-radius:2px;
      left:${50 + (Math.random() - 0.5) * 60}vw;
      top:40vh;
      background:${colors[i % colors.length]};
      animation:fdic-confetti 1.2s ease-out forwards;
      animation-delay:${Math.random() * 0.3}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
}

export function FDICBanksExplorer({
  defaultStateCode = 'FL',
  statePageMode = false,
  stateSlug,
}: {
  defaultStateCode?: string;
  statePageMode?: boolean;
  stateSlug?: string;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedCode, setSelectedCode] = useState(defaultStateCode);
  const [search, setSearch] = useState('');
  const [regulators, setRegulators] = useState<Set<RegulatorKey>>(new Set());
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [hqOnly, setHqOnly] = useState(false);
  const [compareCerts, setCompareCerts] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [celebrated, setCelebrated] = useState(false);

  const availableCodes = useMemo(() => new Set(getAvailableStateCodes()), []);
  const stateMeta = US_STATES.find((s) => s.code === selectedCode)!;
  const stateData = getStateData(selectedCode);

  const navigateToState = useCallback(
    (code: string, withCelebration = false) => {
      const meta = US_STATES.find((s) => s.code === code);
      if (!meta) return;

      if (availableCodes.has(code) && meta.slug !== stateSlug) {
        router.push(statePagePath(meta.slug));
        return;
      }

      setSelectedCode(code);
      setSearch('');
      setRegulators(new Set());
      setYearFilter('all');
      setHqOnly(false);
      setCompareCerts([]);
      setSort('name');
      setVisible(PAGE_SIZE);
      if (withCelebration || (!celebrated && getStateData(code))) {
        celebrate();
        setCelebrated(true);
      }
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    },
    [availableCodes, celebrated, router, stateSlug]
  );

  const filteredBanks = useMemo(() => {
    if (!stateData) return [] as FDICBank[];
    let list = [...stateData.banks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.headquarters_address.toLowerCase().includes(q) ||
          b.fdic_cert.includes(q)
      );
    }

    if (regulators.size > 0) {
      list = list.filter((b) => regulators.has(getRegulatorKey(b.primary_regulator)));
    }

    if (yearFilter !== 'all') {
      list = list.filter((b) => {
        const d = parseInsuredDate(b.fdic_insured_since);
        if (!d) return false;
        const year = d.getFullYear();
        if (yearFilter === 'before1990') return year < 1990;
        if (yearFilter === 'before2000') return year < 2000;
        if (yearFilter === 'after2010') return year >= 2010;
        return true;
      });
    }

    if (hqOnly) {
      list = list.filter((b) => isHeadquarteredInState(b.headquarters_address, selectedCode));
    }

    list.sort((a, b) => {
      if (sort === 'cert') return Number(a.fdic_cert) - Number(b.fdic_cert);
      if (sort === 'name') return a.name.localeCompare(b.name);
      const da = parseInsuredDate(a.fdic_insured_since)?.getTime() ?? 0;
      const db = parseInsuredDate(b.fdic_insured_since)?.getTime() ?? 0;
      return sort === 'oldest' ? da - db : db - da;
    });

    return list;
  }, [stateData, search, regulators, yearFilter, hqOnly, sort, selectedCode]);

  const stats = stateData ? computeExtendedStateStats(stateData.banks, selectedCode) : null;

  const top5Oldest = stateData
    ? [...stateData.banks]
        .sort((a, b) => {
          const da = parseInsuredDate(a.fdic_insured_since)?.getTime() ?? Infinity;
          const db = parseInsuredDate(b.fdic_insured_since)?.getTime() ?? Infinity;
          return da - db;
        })
        .slice(0, 5)
    : [];

  function toggleRegulator(key: RegulatorKey) {
    setRegulators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function resetFilters() {
    setSearch('');
    setRegulators(new Set());
    setYearFilter('all');
    setHqOnly(false);
    setSort('name');
    setVisible(PAGE_SIZE);
  }

  function toggleCompare(cert: string) {
    setCompareCerts((prev) => {
      if (prev.includes(cert)) return prev.filter((c) => c !== cert);
      if (prev.length >= 3) return prev;
      return [...prev, cert];
    });
  }

  function surpriseMe() {
    const withData = US_STATES.filter((s) => availableCodes.has(s.code));
    const pick = withData[Math.floor(Math.random() * withData.length)];
    navigateToState(pick.code, true);
  }

  const regions = [...new Set(US_STATES.map((s) => s.region))];
  const currentYear = 2026;

  return (
    <div>
      <style>{`
        @keyframes fdic-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0d3a5c] py-14 text-white md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            {statePageMode && (
              <Link
                href="/fdic-insured-banks"
                className="mb-6 inline-flex items-center gap-2 text-sm text-[#7ee8e6] hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to National FDIC Hub
              </Link>
            )}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00A3A1]/40 bg-[#00A3A1]/10 px-4 py-1.5 text-sm font-medium text-[#7ee8e6]">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Sourced directly from FDIC data • 100% Free & Transparent
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
              {statePageMode && stateData ? (
                <>
                  FDIC Insured Banks in {stateMeta.fullName} ({currentYear})
                  <span className="mt-2 block text-xl font-medium text-[#7ee8e6] md:text-2xl">
                    Verified List & Insights
                  </span>
                </>
              ) : (
                'Find Every FDIC-Insured Bank in Any State'
              )}
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-zinc-300">
              {statePageMode && stats ? (
                <>
                  {stats.total} FDIC-insured institutions • {stats.headquartered} headquartered in{' '}
                  {stateMeta.fullName}
                  {stats.oldest && (
                    <>
                      {' '}
                      • Oldest: {stats.oldest.name} (
                      {formatInsuredDate(stats.oldest.fdic_insured_since)})
                    </>
                  )}
                </>
              ) : (
                <>
                  Explore 4,800+ FDIC-insured institutions nationwide. Click any state on the map
                  or browse below for the full verified list.
                </>
              )}
            </p>
            <p className="text-sm text-zinc-400">
              Updated {stateData?.updated ?? 'June 2026'} • No paid placements • Verify at FDIC
              BankFind
            </p>
            {!statePageMode && (
              <div className="mt-8">
                <Link href="/calculators">
                  <Button size="lg" variant="trust" className="gap-2 bg-[#00A3A1] hover:bg-[#008f8d]">
                    Mortgage Calculators <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {statePageMode && (
        <section className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <StateSelectorBar currentState={stateMeta} showGrid />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0A2540]">Explore Other States</h2>
                <button
                  type="button"
                  onClick={surpriseMe}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-[#D4AF37]/25"
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Surprise Me
                </button>
              </div>
              <USMap
                selectedCode={selectedCode}
                availableCodes={availableCodes}
                onSelect={(code) => navigateToState(code, true)}
              />
            </div>
            <div className="flex flex-col justify-center gap-4">
              {statePageMode && stats && (
                <ShareBookmarkBar
                  title={`FDIC Insured Banks in ${stateMeta.fullName} 2026`}
                  url={statePageUrl(stateMeta.slug)}
                  stateName={stateMeta.fullName}
                />
              )}
              <p className="text-sm leading-relaxed text-zinc-600">
                Click any state on the map or use the grid above to instantly switch directories.
                All data is sourced from official FDIC records with direct BankFind verification
                links.
              </p>
            </div>
          </div>
        </section>
      )}

      {!statePageMode && (
        <section className="container mx-auto px-4 py-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm md:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#0A2540]">Interactive US Map</h2>
                <button
                  type="button"
                  onClick={surpriseMe}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/15 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-[#D4AF37]/25"
                >
                  <Shuffle className="h-3.5 w-3.5" aria-hidden="true" />
                  Surprise Me
                </button>
              </div>
              <USMap
                selectedCode={selectedCode}
                availableCodes={availableCodes}
                onSelect={(code) => navigateToState(code, true)}
              />
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold text-[#0A2540]">Browse by State</h2>
              {regions.map((region) => (
                <div key={region} className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    {region}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {US_STATES.filter((s) => s.region === region).map((s) => (
                      <Link
                        key={s.code}
                        href={statePagePath(s.slug)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                          selectedCode === s.code
                            ? 'bg-[#00A3A1] text-white shadow-md'
                            : 'border border-[#00A3A1]/30 bg-[#00A3A1]/10 text-[#0A2540] hover:bg-[#00A3A1]/20'
                        }`}
                      >
                        {s.code}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section
        ref={listRef}
        className={`border-t border-zinc-200 bg-zinc-50 py-12 ${compareCerts.length > 0 ? 'pb-36' : ''}`}
      >
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {stateData && stats && (
                <>
                  <StateStatsBar banks={stateData.banks} stateMeta={stateMeta} />

                  <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <p className="text-sm text-zinc-600">
                      Showing <strong>{filteredBanks.length}</strong> of {stateData.banks.length}{' '}
                      institutions
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCSV(filteredBanks, `fdic-banks-${selectedCode.toLowerCase()}.csv`)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] hover:border-[#00A3A1]"
                      >
                        <Download className="h-4 w-4" /> CSV
                      </button>
                      <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => setViewMode('grid')}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            viewMode === 'grid' ? 'bg-[#0A2540] text-white' : 'text-zinc-600'
                          }`}
                          aria-pressed={viewMode === 'grid'}
                        >
                          <LayoutGrid className="h-3.5 w-3.5" /> Cards
                        </button>
                        <button
                          type="button"
                          onClick={() => setViewMode('table')}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                            viewMode === 'table' ? 'bg-[#0A2540] text-white' : 'text-zinc-600'
                          }`}
                          aria-pressed={viewMode === 'table'}
                        >
                          <Table2 className="h-3.5 w-3.5" /> Table
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8 grid gap-6 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                      <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
                        <div className="relative mb-4">
                          <Search
                            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
                            aria-hidden="true"
                          />
                          <input
                            type="search"
                            value={search}
                            onChange={(e) => {
                              setSearch(e.target.value);
                              setVisible(PAGE_SIZE);
                            }}
                            placeholder="Search by bank name, city, or FDIC cert..."
                            className="h-12 w-full rounded-xl border border-zinc-200 pl-10 pr-4 text-[#0A2540] focus:border-[#00A3A1] focus:outline-none focus:ring-2 focus:ring-[#00A3A1]/20"
                            aria-label="Search banks"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-zinc-400">
                            Regulator:
                          </span>
                          {REGULATORS.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => toggleRegulator(r)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                                regulators.has(r)
                                  ? 'bg-[#0A2540] text-white'
                                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                              }`}
                              aria-pressed={regulators.has(r)}
                            >
                              {r}
                            </button>
                          ))}
                          {(
                            [
                              ['before1990', 'Before 1990'],
                              ['before2000', 'Before 2000'],
                              ['after2010', 'After 2010'],
                            ] as const
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                setYearFilter((prev) => (prev === key ? 'all' : key))
                              }
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                yearFilter === key
                                  ? 'bg-[#0A2540] text-white'
                                  : 'bg-zinc-100 text-zinc-600'
                              }`}
                              aria-pressed={yearFilter === key}
                            >
                              {label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setHqOnly(!hqOnly)}
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              hqOnly ? 'bg-[#0A2540] text-white' : 'bg-zinc-100 text-zinc-600'
                            }`}
                            aria-pressed={hqOnly}
                          >
                            HQ in {stateMeta.code}
                          </button>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-zinc-400">Sort:</span>
                          {(
                            [
                              ['name', 'A–Z'],
                              ['oldest', 'Oldest'],
                              ['newest', 'Newest'],
                              ['cert', 'Cert #'],
                            ] as const
                          ).map(([key, label]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() => setSort(key)}
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                sort === key ? 'bg-[#00A3A1] text-white' : 'bg-zinc-100 text-zinc-600'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {filteredBanks.length > 0 ? (
                        <>
                          {viewMode === 'grid' ? (
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                              {filteredBanks.slice(0, visible).map((bank) => (
                                <BankCard
                                  key={bank.fdic_cert}
                                  bank={bank}
                                  stateAbbr={selectedCode}
                                  stateName={stateMeta.fullName}
                                  compareMode
                                  isCompared={compareCerts.includes(bank.fdic_cert)}
                                  compareDisabled={compareCerts.length >= 3}
                                  onCompareToggle={toggleCompare}
                                />
                              ))}
                            </div>
                          ) : (
                            <BankTable
                              banks={filteredBanks.slice(0, visible)}
                              stateAbbr={selectedCode}
                              stateName={stateMeta.fullName}
                            />
                          )}
                          {visible < filteredBanks.length && (
                            <div className="mt-8 text-center">
                              <Button
                                variant="outline"
                                size="lg"
                                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                              >
                                Load More ({filteredBanks.length - visible} remaining)
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                          <Building2 className="mx-auto mb-4 h-12 w-12 text-zinc-300" aria-hidden="true" />
                          <h3 className="text-lg font-semibold text-[#0A2540]">No banks match your filters</h3>
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-4 text-sm font-semibold text-[#00A3A1] hover:underline"
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      <BankMatchPanel
                        banks={stateData.banks}
                        stateAbbr={selectedCode}
                        stateName={stateMeta.fullName}
                        onApplyHqOnly={() => setHqOnly(true)}
                        onApplyLegacy={() => setYearFilter('before2000')}
                        onApplyRegulator={(reg) => setRegulators(new Set([reg]))}
                        onReset={resetFilters}
                      />
                      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                        <h3 className="mb-4 font-semibold text-[#0A2540]">
                          Top 5 Oldest in {stateMeta.fullName}
                        </h3>
                        <ol className="space-y-2 text-sm">
                          {top5Oldest.map((b, i) => (
                            <li
                              key={b.fdic_cert}
                              className="flex justify-between gap-2 border-b border-zinc-100 pb-2"
                            >
                              <span>
                                <span className="font-medium text-zinc-400">{i + 1}.</span> {b.name}
                              </span>
                              <span className="shrink-0 text-zinc-500">{b.fdic_insured_since}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>

                  <StateEducationSections stateMeta={stateMeta} />
                  <CategoryCTAs stateMeta={stateMeta} />

                  <FDICFAQ
                    stateMeta={stateMeta}
                    bankCount={stats.total}
                    hqCount={stats.headquartered}
                  />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      {stateData && compareCerts.length > 0 && (
        <BankComparison
          banks={stateData.banks}
          selectedCerts={compareCerts}
          stateAbbr={selectedCode}
          stateName={stateMeta.fullName}
          onRemove={(cert) => toggleCompare(cert)}
          onClear={() => setCompareCerts([])}
        />
      )}
    </div>
  );
}