'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Download,
  Shuffle,
  Building2,
  Shield,
  Calculator,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { USMap } from '@/components/fdic/USMap';
import { BankCard } from '@/components/fdic/BankCard';
import { US_STATES } from '@/lib/fdic/states';
import { getStateData, getAvailableStateCodes } from '@/lib/fdic/stateData';
import type { FDICBank, RegulatorKey } from '@/lib/fdic/types';
import {
  computeStateStats,
  downloadCSV,
  formatInsuredDate,
  getRegulatorKey,
  isHeadquarteredInState,
  parseInsuredDate,
} from '@/lib/fdic/utils';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 24;
const REGULATORS: RegulatorKey[] = ['OCC', 'FED', 'FDIC'];

type SortKey = 'name' | 'oldest' | 'newest';

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

export function FDICBanksExplorer({ defaultStateCode = 'FL' }: { defaultStateCode?: string }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedCode, setSelectedCode] = useState(defaultStateCode);
  const [search, setSearch] = useState('');
  const [regulators, setRegulators] = useState<Set<RegulatorKey>>(new Set());
  const [before2000, setBefore2000] = useState(false);
  const [hqOnly, setHqOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('name');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [celebrated, setCelebrated] = useState(false);

  const availableCodes = useMemo(() => new Set(getAvailableStateCodes()), []);
  const stateMeta = US_STATES.find((s) => s.code === selectedCode)!;
  const stateData = getStateData(selectedCode);

  const selectState = useCallback(
    (code: string, withCelebration = false) => {
      setSelectedCode(code);
      setSearch('');
      setRegulators(new Set());
      setBefore2000(false);
      setHqOnly(false);
      setSort('name');
      setVisible(PAGE_SIZE);
      if (withCelebration || (!celebrated && getStateData(code))) {
        celebrate();
        setCelebrated(true);
      }
      setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    },
    [celebrated]
  );

  const filteredBanks = useMemo(() => {
    if (!stateData) return [] as FDICBank[];
    let list = [...stateData.banks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.headquarters_address.toLowerCase().includes(q)
      );
    }

    if (regulators.size > 0) {
      list = list.filter((b) => regulators.has(getRegulatorKey(b.primary_regulator)));
    }

    if (before2000) {
      list = list.filter((b) => {
        const d = parseInsuredDate(b.fdic_insured_since);
        return d && d.getFullYear() < 2000;
      });
    }

    if (hqOnly) {
      list = list.filter((b) =>
        isHeadquarteredInState(b.headquarters_address, selectedCode)
      );
    }

    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      const da = parseInsuredDate(a.fdic_insured_since)?.getTime() ?? 0;
      const db = parseInsuredDate(b.fdic_insured_since)?.getTime() ?? 0;
      return sort === 'oldest' ? da - db : db - da;
    });

    return list;
  }, [stateData, search, regulators, before2000, hqOnly, sort, selectedCode]);

  const stats = stateData
    ? computeStateStats(stateData.banks, selectedCode)
    : null;

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

  function surpriseMe() {
    const withData = US_STATES.filter((s) => availableCodes.has(s.code));
    const pool = withData.length > 0 ? withData : US_STATES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    selectState(pick.code, true);
  }

  const regions = [...new Set(US_STATES.map((s) => s.region))];

  return (
    <div>
      <style>{`
        @keyframes fdic-confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      {/* Hero */}
      <section className="border-b border-zinc-200 bg-gradient-to-br from-[#0A2540] via-[#0A2540] to-[#0d3a5c] py-14 text-white md:py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00A3A1]/40 bg-[#00A3A1]/10 px-4 py-1.5 text-sm font-medium text-[#7ee8e6]">
              <Shield className="h-4 w-4" aria-hidden="true" />
              Official FDIC Data • Free Directory
            </div>
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
              Find Every FDIC-Insured Bank in Any State
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-zinc-300">
              Explore 4,000+ FDIC-insured institutions nationwide. Click any state on the map
              or list below to instantly see the full verified list for that state.
            </p>
            <p className="text-sm text-zinc-400">
              100% sourced from official FDIC data • Updated {stateData?.updated ?? 'June 2026'} • Free to use
            </p>
            <div className="mt-8">
              <Link href="/calculators">
                <Button size="lg" variant="trust" className="gap-2 bg-[#00A3A1] hover:bg-[#008f8d]">
                  Get Personalized Bank Recommendations <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Map + state grid */}
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
              onSelect={(code) => selectState(code)}
            />
            <p className="mt-3 text-center text-xs text-zinc-500">
              <span className="inline-block h-3 w-3 rounded-sm bg-[#b2e0df] align-middle" /> Data available
              <span className="mx-2 inline-block h-3 w-3 rounded-sm bg-[#e2e8f0] align-middle" /> Coming soon
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-[#0A2540]">Browse by State</h2>
            {regions.map((region) => (
              <div key={region} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">{region}</p>
                <div className="flex flex-wrap gap-2">
                  {US_STATES.filter((s) => s.region === region).map((s) => (
                    <button
                      key={s.code}
                      type="button"
                      onClick={() => selectState(s.code, availableCodes.has(s.code))}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                        selectedCode === s.code
                          ? 'bg-[#00A3A1] text-white shadow-md'
                          : s.hasData
                            ? 'border border-[#00A3A1]/30 bg-[#00A3A1]/10 text-[#0A2540] hover:bg-[#00A3A1]/20'
                            : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
                      }`}
                      aria-pressed={selectedCode === s.code}
                    >
                      {s.code}
                      {s.hasData && <Sparkles className="ml-1 inline h-3 w-3 text-[#D4AF37]" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Selected state panel */}
      <section ref={listRef} className="border-t border-zinc-200 bg-zinc-50 py-12">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-[#00A3A1]">
                      Selected State
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#0A2540] md:text-3xl">
                      FDIC Insured Banks in {stateMeta.fullName}
                    </h2>
                    {stateData ? (
                      <p className="mt-2 text-zinc-600">
                        {stats?.total} institutions serving {stateMeta.fullName}
                        {stats?.headquartered
                          ? ` • ${stats.headquartered} headquartered in ${stateMeta.fullName}`
                          : ''}
                        {stats?.oldest
                          ? ` • Oldest: ${stats.oldest.name} (${formatInsuredDate(stats.oldest.fdic_insured_since)})`
                          : ''}
                      </p>
                    ) : (
                      <p className="mt-2 text-zinc-600">
                        Data for {stateMeta.fullName} is coming soon. Florida is live — more states added daily.
                      </p>
                    )}
                  </div>
                  {stateData && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          downloadCSV(filteredBanks, `fdic-banks-${selectedCode.toLowerCase()}.csv`)
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-[#0A2540] hover:border-[#00A3A1]"
                      >
                        <Download className="h-4 w-4" /> Download CSV
                      </button>
                      <a
                        href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0A2540]/90"
                      >
                        <Building2 className="h-4 w-4" /> Official FDIC BankFind
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {stateData ? (
                <>
                  {/* Stats bar */}
                  <div className="mb-6 rounded-xl border border-[#00A3A1]/20 bg-[#00A3A1]/5 px-4 py-3 text-sm text-[#0A2540]">
                    Showing <strong>{filteredBanks.length}</strong> of {stateData.banks.length} FDIC-insured
                    institutions serving {stateMeta.fullName}
                    {stats && (
                      <>
                        {' '}• <strong>{stats.headquartered}</strong> headquartered in {stateMeta.fullName}
                        {stats.oldest && (
                          <>
                            {' '}• Oldest: <strong>{stats.oldest.name}</strong> (
                            {formatInsuredDate(stats.oldest.fdic_insured_since)})
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="mb-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" aria-hidden="true" />
                      <input
                        type="search"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setVisible(PAGE_SIZE);
                        }}
                        placeholder="Search by bank name or city..."
                        className="h-12 w-full rounded-xl border border-zinc-200 pl-10 pr-4 text-[#0A2540] focus:border-[#00A3A1] focus:outline-none focus:ring-2 focus:ring-[#00A3A1]/20"
                        aria-label="Search banks"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-zinc-400">Regulator:</span>
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
                      <button
                        type="button"
                        onClick={() => setBefore2000(!before2000)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          before2000 ? 'bg-[#0A2540] text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                        aria-pressed={before2000}
                      >
                        Established before 2000
                      </button>
                      <button
                        type="button"
                        onClick={() => setHqOnly(!hqOnly)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          hqOnly ? 'bg-[#0A2540] text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}
                        aria-pressed={hqOnly}
                      >
                        HQ in {stateMeta.fullName}
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase text-zinc-400">Sort:</span>
                      {(['name', 'oldest', 'newest'] as SortKey[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSort(s)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            sort === s ? 'bg-[#00A3A1] text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {s === 'name' ? 'A–Z' : s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bank grid */}
                  {filteredBanks.length > 0 ? (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredBanks.slice(0, visible).map((bank) => (
                          <BankCard
                            key={bank.fdic_cert}
                            bank={bank}
                            stateAbbr={selectedCode}
                            stateName={stateMeta.fullName}
                          />
                        ))}
                      </div>
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
                      <p className="mt-2 text-sm text-zinc-500">
                        Try clearing filters or searching a different term.
                      </p>
                    </div>
                  )}

                  {/* Top 5 oldest + education */}
                  <div className="mt-12 grid gap-6 lg:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-6 lg:col-span-1">
                      <h3 className="mb-4 font-semibold text-[#0A2540]">Top 5 Oldest in {stateMeta.fullName}</h3>
                      <ol className="space-y-2 text-sm">
                        {top5Oldest.map((b, i) => (
                          <li key={b.fdic_cert} className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
                            <span>
                              <span className="font-medium text-zinc-400">{i + 1}.</span> {b.name}
                            </span>
                            <span className="shrink-0 text-zinc-500">{b.fdic_insured_since}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="space-y-4 lg:col-span-2">
                      <details className="group rounded-2xl border border-zinc-200 bg-white p-5" open>
                        <summary className="cursor-pointer font-semibold text-[#0A2540]">
                          What Does FDIC Insurance Mean for You?
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                          FDIC insurance protects depositors at member banks up to $250,000 per depositor,
                          per insured bank, for each account ownership category. If an FDIC-insured bank fails,
                          your covered deposits are protected by the full faith and credit of the United States government.
                        </p>
                      </details>
                      <details className="group rounded-2xl border border-zinc-200 bg-white p-5">
                        <summary className="cursor-pointer font-semibold text-[#0A2540]">
                          How We Verify These Banks
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
                          Every institution listed is sourced from the official FDIC BankFind database.
                          We display certificate numbers, insurance dates, regulators, and headquarters — with
                          one-click links to verify at{' '}
                          <a
                            href="https://banks.data.fdic.gov/bankfind-suite/bankfind"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00A3A1] underline"
                          >
                            banks.data.fdic.gov
                          </a>
                          . Lender Trust Hub does not accept paid placements.
                        </p>
                      </details>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <Link
                          href="/calculators"
                          className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#00A3A1]"
                        >
                          <Calculator className="mb-2 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0A2540]">Mortgage Calculators</p>
                          <p className="text-xs text-zinc-500">Estimate payments & affordability</p>
                        </Link>
                        <Link
                          href={`/local-lenders/${stateMeta.slug === 'florida' ? 'florida/broward' : stateMeta.slug}`}
                          className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#00A3A1]"
                        >
                          <Building2 className="mb-2 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0A2540]">Compare Lenders</p>
                          <p className="text-xs text-zinc-500">Verified mortgage lenders in {stateMeta.fullName}</p>
                        </Link>
                        <a
                          href="https://www.movetrusthub.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-[#00A3A1]"
                        >
                          <Shield className="mb-2 h-6 w-6 text-[#00A3A1]" aria-hidden="true" />
                          <p className="text-sm font-semibold text-[#0A2540]">MoveTrustHub</p>
                          <p className="text-xs text-zinc-500">Trusted mover directory sister site</p>
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center">
                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-[#00A3A1]" aria-hidden="true" />
                  <h3 className="text-xl font-semibold text-[#0A2540]">
                    {stateMeta.fullName} data coming soon
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
                    We&apos;re adding FDIC bank lists state by state. Florida is live with 198 institutions.
                    Select FL on the map or try Surprise Me.
                  </p>
                  <button
                    type="button"
                    onClick={() => selectState('FL', true)}
                    className="mt-6 rounded-xl bg-[#00A3A1] px-6 py-3 text-sm font-semibold text-white hover:bg-[#008f8d]"
                  >
                    View Florida Banks
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}