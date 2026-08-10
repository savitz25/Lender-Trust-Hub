'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Building2,
  Calculator,
  ExternalLink,
  FileText,
  GitCompare,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  Settings2,
  Shield,
  Trash2,
} from 'lucide-react';
import {
  LOAN_FOCUS_OPTIONS,
  LENDER_STATUS_OPTIONS,
  type CalculatorSnapshot,
  type FinancePlan,
  type LoanFocus,
  type LenderResearchStatus,
  type SavedLeComparison,
  type SavedLender,
  type SavedLoanEstimate,
  type WorkspaceItemSort,
} from '@/lib/my-lending/types';
import {
  ensureActivePlan,
  getActivePlan,
  getCalculatorSnapshots,
  getHistory,
  getLastSaveError,
  getLendersForPlan,
  getResearching,
  getSavedLeComparisons,
  getSavedLoanEstimates,
  getShortlisted,
  listActivePlans,
  loadMyLendingStore,
  removeSavedLeComparison,
  removeSavedLoanEstimate,
  removeSavedLender,
  setActivePlan,
  SHORTLIST_CAP,
  shortlistReplacing,
  shortlistWithDemoteOldest,
  sortByWorkspaceOrder,
  stageLeWorkspaceReopen,
  updateSavedLeComparisonNotes,
  updateSavedLenderNotes,
  updateSavedLenderStatus,
  updateSavedLoanEstimateNotes,
  upsertPlan,
} from '@/lib/my-lending/storage';
import { ShortlistFullPanel } from '@/components/my-lending/shortlist-full-panel';
import { PrivateResearchNote } from '@/components/my-lending/private-research-note';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';
import { TrustMark } from '@/components/network/trust-mark';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * My Lending HQ — research passport (V1.1).
 * Organize saves, private notes, empty-state onboarding, guest vs signed-in storage.
 */
export function GuestLendingHq() {
  const ml = useMyLendingOptional();
  const [plan, setPlan] = useState<FinancePlan | null>(null);
  const [lenders, setLenders] = useState<SavedLender[]>([]);
  const [snapshots, setSnapshots] = useState<CalculatorSnapshot[]>([]);
  const [loanEstimates, setLoanEstimates] = useState<SavedLoanEstimate[]>([]);
  const [leComparisons, setLeComparisons] = useState<SavedLeComparison[]>([]);
  const [openPlans, setOpenPlans] = useState<FinancePlan[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [label, setLabel] = useState('');
  const [zip, setZip] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [notes, setNotes] = useState('');
  const [focus, setFocus] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullPanel, setFullPanel] = useState<{
    shortlisted: SavedLender[];
    pendingId: string;
    pendingName: string;
  } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [leSort, setLeSort] = useState<WorkspaceItemSort>('newest');
  const [compareSort, setCompareSort] = useState<WorkspaceItemSort>('newest');
  const [lenderSort, setLenderSort] = useState<WorkspaceItemSort>('newest');
  const [researchTab, setResearchTab] = useState<'estimates' | 'comparisons'>('estimates');

  const refresh = useCallback(() => {
    const store = loadMyLendingStore();
    const active = getActivePlan(store);
    setPlan(active);
    setOpenPlans(listActivePlans(store));
    if (active) {
      setLenders(getLendersForPlan(active.id, store));
      setSnapshots(getCalculatorSnapshots(active.id));
      setLoanEstimates(getSavedLoanEstimates(active.id, leSort));
      setLeComparisons(getSavedLeComparisons(active.id, compareSort));
      setLabel(active.label);
      setZip(active.location?.zip ?? '');
      setStateCode(active.location?.state ?? '');
      setNotes(active.notes ?? '');
      setFocus(active.loanFocus ?? []);
    } else {
      setLenders([]);
      setSnapshots([]);
      setLoanEstimates([]);
      setLeComparisons([]);
    }
  }, [leSort, compareSort]);

  useEffect(() => {
    refresh();
    setHydrated(true);
    const onStore = () => refresh();
    window.addEventListener('lth-my-lending-store', onStore);
    window.addEventListener('storage', onStore);
    return () => {
      window.removeEventListener('lth-my-lending-store', onStore);
      window.removeEventListener('storage', onStore);
    };
  }, [refresh]);

  const sortedLenders = useMemo(
    () =>
      sortByWorkspaceOrder(
        lenders.map((l) => ({
          ...l,
          label: l.lenderName,
          savedAt: l.savedAt,
          updatedAt: l.updatedAt,
        })),
        lenderSort
      ),
    [lenders, lenderSort]
  );

  const locationLabel = useMemo(() => {
    const parts = [zip, stateCode].filter(Boolean);
    return parts.join(' · ') || undefined;
  }, [zip, stateCode]);

  const storageMode = ml?.workspaceStorage?.mode ?? 'guest';
  const syncStatus = ml?.workspaceStorage?.syncStatus ?? 'local_only';

  function persistPlanFields() {
    setError(null);
    setMessage(null);
    if (!label.trim()) {
      setError('Plan label is required.');
      return;
    }
    if (focus.length === 0) {
      setError('Select at least one loan focus.');
      return;
    }
    const active =
      getActivePlan() ??
      ensureActivePlan({
        label: label.trim() || 'My financing research',
        loanFocus: focus,
      });
    upsertPlan({
      id: active.id,
      label: label.trim() || 'My financing research',
      loanFocus: focus,
      notes: notes.trim() || undefined,
      location: {
        zip: zip.trim() || undefined,
        state: stateCode.trim().toUpperCase().slice(0, 2) || undefined,
        label: locationLabel,
      },
    });
    const err = getLastSaveError();
    if (err) {
      setError(err);
      return;
    }
    setMessage(
      storageMode === 'signed_in'
        ? 'Plan saved to your research workspace.'
        : 'Plan saved on this device.'
    );
    refresh();
  }

  function toggleFocus(id: LoanFocus) {
    setFocus((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
        Loading Lending HQ...
      </div>
    );
  }

  const accountStrip = ml?.user ? (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm text-zinc-600">
          Signed in as{' '}
          <span className="font-medium text-[#0A2540]">{ml.user.email}</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Signed-in workspace uses a synced research foundation when available. Guest data on this
          device is kept separate and is never deleted when you sign out.
          {syncStatus === 'syncing'
            ? ' Syncing…'
            : syncStatus === 'synced'
              ? ' Workspace cache ready.'
              : syncStatus === 'error'
                ? ' Cloud sync unavailable — still saved on this device.'
                : ' Local signed-in cache on this device.'}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => void ml.signOutLocal()}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  ) : (
    <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-[#0A2540]">Sign in (optional)</p>
        <p className="mt-1 text-sm text-zinc-600">
          Guest mode keeps research on this device only. Sign in for a multi-device workspace
          foundation — never required to use Analyzer, Compare, or save tools.
        </p>
      </div>
      <Button
        size="sm"
        variant="trust"
        className="gap-2"
        onClick={() => ml?.openAuth({ redirectPath: '/my-lending' })}
      >
        <LogIn className="h-4 w-4" />
        Sign in
      </Button>
    </div>
  );

  // Empty library after delete last plan
  if (!plan && openPlans.length === 0) {
    return (
      <div className="space-y-6">
        {accountStrip}
        <ResearchPassportIntro storageMode={storageMode} firstVisit />
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-5 py-12 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
          <p className="mt-3 font-medium text-[#0A2540]">Start your research passport</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600">
            Create a plan, then save Loan Estimates, side-by-side comparisons, and lenders as you
            research. Optional — nothing is forced.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/my-lending/setup">
              <Button variant="trust">Guided setup</Button>
            </Link>
            <Link href="/tools/loan-estimate-analyzer">
              <Button variant="outline">Loan Estimate Analyzer</Button>
            </Link>
            <Link href="/tools/compare-loan-estimates">
              <Button variant="outline">Compare LEs</Button>
            </Link>
            <Link href="/local-lenders">
              <Button variant="outline">Local lenders</Button>
            </Link>
          </div>
        </div>
        <FooterTrust />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {accountStrip}

      <ResearchPassportIntro storageMode={storageMode} />

      <nav aria-label="My Lending sections" className="flex flex-wrap gap-2">
        <Link href="/my-lending/plans">
          <Button size="sm" variant="outline" className="gap-1.5">
            All plans
          </Button>
        </Link>
        <Link href="/my-lending/setup">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Settings2 className="h-3.5 w-3.5" aria-hidden />
            Setup
          </Button>
        </Link>
        <Link href="/my-lending/report">
          <Button size="sm" variant="outline" className="gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            Report
          </Button>
        </Link>
        <Link href="/calculators">
          <Button size="sm" variant="outline" className="gap-1.5">
            <Calculator className="h-3.5 w-3.5" aria-hidden />
            Calculators
          </Button>
        </Link>
      </nav>

      <section className="rounded-2xl border border-teal-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">
              Active plan
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0A2540]">
              {plan?.label || 'Financing research plan'}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {storageMode === 'signed_in'
                ? 'Saved to your signed-in research workspace (device cache + sync foundation when available).'
                : 'Guest-saved on this device. Sign in anytime for multi-device foundation — optional.'}{' '}
              Research only — not a marketplace or pre-approval service.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {openPlans.length > 1 ? (
              <select
                className="h-9 max-w-[14rem] rounded-md border border-zinc-200 bg-white px-2 text-sm font-medium text-zinc-800"
                value={plan?.id ?? ''}
                onChange={(e) => {
                  const id = e.target.value;
                  if (!id) return;
                  setActivePlan(id);
                  refresh();
                }}
                aria-label="Switch active plan"
              >
                {openPlans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            ) : null}
            <Link href="/my-lending/plans">
              <Button size="sm" variant="outline">
                All plans
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="plan-label" className="text-sm font-medium text-zinc-800">
              Plan label <span className="text-rose-600">*</span>
            </label>
            <input
              id="plan-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Purchase - Austin TX"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="plan-zip" className="text-sm font-medium text-zinc-800">
              ZIP (optional)
            </label>
            <input
              id="plan-zip"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="78701"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              inputMode="numeric"
            />
          </div>
          <div>
            <label htmlFor="plan-state" className="text-sm font-medium text-zinc-800">
              State (optional)
            </label>
            <input
              id="plan-state"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
              placeholder="TX"
              maxLength={2}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-zinc-800">
            Loan focus <span className="text-rose-600">*</span>
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {LOAN_FOCUS_OPTIONS.map((opt) => {
              const on = focus.includes(opt.id);
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => toggleFocus(opt.id)}
                    className={cn(
                      'inline-flex min-h-10 items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors',
                      on
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-teal-300'
                    )}
                    aria-pressed={on}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-4">
          <label htmlFor="plan-notes" className="text-sm font-medium text-zinc-800">
            Plan notes (optional)
          </label>
          <textarea
            id="plan-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. First-time buyer; comparing FHA vs conventional"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="trust" onClick={persistPlanFields}>
            {storageMode === 'signed_in' ? 'Save plan' : 'Save plan on this device'}
          </Button>
          <Link href="/local-lenders">
            <Button type="button" variant="outline">
              <Plus className="h-4 w-4" aria-hidden />
              Local lenders
            </Button>
          </Link>
          <Link href="/calculators">
            <Button type="button" variant="outline">
              Calculators
            </Button>
          </Link>
          <Link href="/about">
            <Button type="button" variant="ghost">
              About
            </Button>
          </Link>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-rose-700" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="mt-3 text-sm text-teal-800" role="status">
            {message}
          </p>
        ) : null}
        {plan ? (
          <p className="mt-3 text-xs text-zinc-500">
            Shortlist {getShortlisted(lenders).length}/{SHORTLIST_CAP} · {lenders.length} lenders ·{' '}
            {loanEstimates.length} LE
            {loanEstimates.length === 1 ? '' : 's'} · {leComparisons.length} comparison
            {leComparisons.length === 1 ? '' : 's'} · {snapshots.length} calculator snapshot
            {snapshots.length === 1 ? '' : 's'} · Updated{' '}
            {new Date(plan.updatedAt).toLocaleString()}
          </p>
        ) : null}
      </section>

      {/* Loan Estimate research — organized workspace */}
      <section className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-sky-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
              <FileText className="h-5 w-5 text-emerald-700" aria-hidden />
              Loan Estimate research
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Saved analyses and side-by-side comparisons. Add private notes as you shop offers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/tools/loan-estimate-analyzer">
              <Button size="sm" variant="outline">
                Analyzer
              </Button>
            </Link>
            <Link href="/tools/compare-loan-estimates">
              <Button size="sm" variant="outline">
                Compare
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2 border-b border-emerald-100 pb-3"
          role="tablist"
          aria-label="Loan Estimate research tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={researchTab === 'estimates'}
            onClick={() => setResearchTab('estimates')}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
              researchTab === 'estimates'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50'
            )}
          >
            Loan Estimates ({loanEstimates.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={researchTab === 'comparisons'}
            onClick={() => setResearchTab('comparisons')}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
              researchTab === 'comparisons'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50'
            )}
          >
            Comparisons ({leComparisons.length})
          </button>
        </div>

        {researchTab === 'estimates' ? (
          <div className="mt-4" role="tabpanel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0A2540]">Saved Loan Estimates</h3>
              {loanEstimates.length > 1 ? (
                <SortSelect
                  value={leSort}
                  onChange={setLeSort}
                  ariaLabel="Sort Loan Estimates"
                />
              ) : null}
            </div>
            {loanEstimates.length === 0 ? (
              <EmptyResearchCard
                title="No Loan Estimates saved yet"
                body="Paste numbers from a Loan Estimate into the free Analyzer, then Save to My Lending. Notes stay private to your workspace."
                links={[
                  {
                    href: '/tools/loan-estimate-analyzer',
                    label: 'Open Loan Estimate Analyzer',
                    primary: true,
                  },
                  { href: '/tools/compare-loan-estimates', label: 'Compare offers' },
                ]}
              />
            ) : (
              <ul className="mt-3 space-y-3">
                {loanEstimates.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-emerald-100/80 bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0A2540]">{item.label}</p>
                        <p className="text-xs text-zinc-500">{item.summary}</p>
                        {item.bandSummary ? (
                          <p className="mt-0.5 text-[11px] text-zinc-400">{item.bandSummary}</p>
                        ) : null}
                        <p className="text-[11px] text-zinc-400">
                          Saved {new Date(item.savedAt).toLocaleString()}
                          {item.updatedAt !== item.savedAt
                            ? ` · Updated ${new Date(item.updatedAt).toLocaleString()}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            stageLeWorkspaceReopen({
                              type: 'loan-estimate',
                              inputs: item.inputs,
                            });
                            window.location.href = '/tools/loan-estimate-analyzer';
                          }}
                        >
                          Reopen
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            removeSavedLoanEstimate(item.id, plan?.id);
                            refresh();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <PrivateResearchNote
                      value={item.notes}
                      onSave={(n) => {
                        updateSavedLoanEstimateNotes(item.id, n, plan?.id);
                        refresh();
                      }}
                      placeholder="e.g. Preferred cash-to-close; asked about rate lock…"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <div className="mt-4" role="tabpanel">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold text-[#0A2540]">
                <GitCompare className="h-4 w-4 text-emerald-700" aria-hidden />
                Saved comparisons
              </h3>
              {leComparisons.length > 1 ? (
                <SortSelect
                  value={compareSort}
                  onChange={setCompareSort}
                  ariaLabel="Sort comparisons"
                />
              ) : null}
            </div>
            {leComparisons.length === 0 ? (
              <EmptyResearchCard
                title="No comparisons saved yet"
                body="Load 2–3 Loan Estimates side by side, then save the comparison to revisit differences later."
                links={[
                  {
                    href: '/tools/compare-loan-estimates',
                    label: 'Compare Loan Estimates',
                    primary: true,
                  },
                  { href: '/tools/loan-estimate-analyzer', label: 'Single LE Analyzer' },
                ]}
              />
            ) : (
              <ul className="mt-3 space-y-3">
                {leComparisons.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-sky-100/80 bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-[#0A2540]">{item.label}</p>
                        <p className="text-xs text-zinc-500">{item.summary}</p>
                        <p className="text-[11px] text-zinc-400">
                          {item.estimates.length} offers · Saved{' '}
                          {new Date(item.savedAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            stageLeWorkspaceReopen({
                              type: 'comparison',
                              estimates: item.estimates,
                            });
                            window.location.href = '/tools/compare-loan-estimates';
                          }}
                        >
                          Reopen
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            removeSavedLeComparison(item.id, plan?.id);
                            refresh();
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          Remove
                        </Button>
                      </div>
                    </div>
                    <PrivateResearchNote
                      value={item.notes}
                      onSave={(n) => {
                        updateSavedLeComparisonNotes(item.id, n, plan?.id);
                        refresh();
                      }}
                      placeholder="e.g. Offer B lower APR but higher origination…"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {snapshots.length > 0 ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
            <Calculator className="h-5 w-5 text-emerald-700" aria-hidden />
            Calculator snapshots ({snapshots.length})
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Educational estimates only — not a Loan Estimate or offer.
          </p>
          <ul className="mt-4 space-y-2">
            {snapshots.slice(0, 5).map((s) => (
              <li
                key={s.id}
                className="flex flex-col gap-1 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-[#0A2540]">{s.title}</p>
                  <p className="text-xs text-zinc-500">{s.summary}</p>
                </div>
                {s.href ? (
                  <Link href={s.href}>
                    <Button size="sm" variant="outline">
                      Open tool
                    </Button>
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link href="/my-lending/report" className="font-medium text-emerald-800 underline">
              Include on report
            </Link>
            {' · '}
            <Link href="/calculators" className="font-medium text-emerald-800 underline">
              Run another calculator
            </Link>
          </p>
        </section>
      ) : null}

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
              <Bookmark className="h-5 w-5 text-emerald-700" aria-hidden />
              Saved lenders
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Shortlist (max {SHORTLIST_CAP}), researching, and history — with private notes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lenders.length > 1 ? (
              <SortSelect value={lenderSort} onChange={setLenderSort} ariaLabel="Sort lenders" />
            ) : null}
            <Link href="/local-lenders">
              <Button size="sm" variant="outline">
                Directory
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <LenderBucket
        title={`Shortlist (${getShortlisted(sortedLenders).length}/${SHORTLIST_CAP})`}
        hint="Top candidates — max 3. Promote carefully. Research only."
        items={getShortlisted(sortedLenders)}
        empty="No shortlisted lenders yet. Save from a profile or directory card."
        emptyLinks={[
          { href: '/local-lenders', label: 'Browse local lenders', primary: true },
          { href: '/tools/program-finder', label: 'Program finder' },
          { href: '/tools/loan-estimate-analyzer', label: 'Loan Estimate Analyzer' },
        ]}
        planId={plan?.id}
        onStatus={(id, status, name) => {
          const res = updateSavedLenderStatus(id, status);
          if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
            setFullPanel({ shortlisted: res.shortlisted, pendingId: id, pendingName: name });
          } else {
            refresh();
          }
        }}
        onRemove={(slug) => {
          removeSavedLender(slug, plan?.id);
          refresh();
        }}
        onNotes={(id, n) => {
          updateSavedLenderNotes(id, n);
          refresh();
        }}
      />

      <LenderBucket
        title={`Still researching (${getResearching(sortedLenders).length})`}
        hint="Directory saves can land here when shortlist is full."
        items={getResearching(sortedLenders)}
        empty="Nothing in researching."
        planId={plan?.id}
        onStatus={(id, status, name) => {
          const res = updateSavedLenderStatus(id, status);
          if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
            setFullPanel({ shortlisted: res.shortlisted, pendingId: id, pendingName: name });
          } else {
            refresh();
          }
        }}
        onRemove={(slug) => {
          removeSavedLender(slug, plan?.id);
          refresh();
        }}
        onNotes={(id, n) => {
          updateSavedLenderNotes(id, n);
          refresh();
        }}
      />

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setHistoryOpen((v) => !v)}
          aria-expanded={historyOpen}
        >
          <h2 className="text-lg font-semibold text-[#0A2540]">
            Reached out / done ({getHistory(sortedLenders).length})
          </h2>
          <span className="text-xs font-medium text-zinc-500">
            {historyOpen ? 'Hide' : 'Show'}
          </span>
        </button>
        {historyOpen ? (
          <div className="mt-4">
            {getHistory(sortedLenders).length === 0 ? (
              <p className="text-sm text-zinc-500">No history yet.</p>
            ) : (
              <LenderList
                items={getHistory(sortedLenders)}
                planId={plan?.id}
                onStatus={(id, status, name) => {
                  const res = updateSavedLenderStatus(id, status);
                  if (res && !res.ok && res.reason === 'shortlist_full' && res.shortlisted) {
                    setFullPanel({
                      shortlisted: res.shortlisted,
                      pendingId: id,
                      pendingName: name,
                    });
                  } else {
                    refresh();
                  }
                }}
                onRemove={(slug) => {
                  removeSavedLender(slug, plan?.id);
                  refresh();
                }}
                onNotes={(id, n) => {
                  updateSavedLenderNotes(id, n);
                  refresh();
                }}
              />
            )}
          </div>
        ) : null}
      </section>

      {lenders.length === 0 ? (
        <EmptyResearchCard
          title="No saved lenders yet"
          body={`Save from a lender profile or directory card (shortlist max ${SHORTLIST_CAP}). Your shortlist is a research aid — not a lead form.`}
          links={[
            { href: '/local-lenders', label: 'Browse local lenders', primary: true },
            { href: '/calculators', label: 'Calculators' },
          ]}
        />
      ) : null}

      {fullPanel ? (
        <ShortlistFullPanel
          shortlisted={fullPanel.shortlisted}
          incomingName={fullPanel.pendingName}
          onCancel={() => setFullPanel(null)}
          onDemoteOldest={() => {
            const p = lenders.find((x) => x.id === fullPanel.pendingId);
            if (p) {
              shortlistWithDemoteOldest({
                lenderSlug: p.lenderSlug,
                lenderName: p.lenderName,
                profilePath: p.profilePath,
                nmlsId: p.nmlsId,
                loanTypes: p.loanTypes,
                status: 'shortlisted',
              });
            }
            setFullPanel(null);
            refresh();
          }}
          onReplace={(slug) => {
            const p = lenders.find((x) => x.id === fullPanel.pendingId);
            if (p) {
              shortlistReplacing(
                {
                  lenderSlug: p.lenderSlug,
                  lenderName: p.lenderName,
                  profilePath: p.profilePath,
                  nmlsId: p.nmlsId,
                  loanTypes: p.loanTypes,
                  status: 'shortlisted',
                },
                slug
              );
            }
            setFullPanel(null);
            refresh();
          }}
          onSaveAsResearching={() => {
            updateSavedLenderStatus(fullPanel.pendingId, 'researching');
            setFullPanel(null);
            refresh();
          }}
        />
      ) : null}

      <FooterTrust />
    </div>
  );
}

function ResearchPassportIntro({
  storageMode,
  firstVisit,
}: {
  storageMode: 'guest' | 'signed_in';
  firstVisit?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/80 to-white px-4 py-4 sm:px-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
        Your research passport
      </p>
      <p className="mt-1 text-sm leading-relaxed text-zinc-600">
        {firstVisit
          ? 'My Lending holds the financing research you choose to keep — Loan Estimates, comparisons, and lenders — so you can revisit calmly. Not a CRM, not a lead funnel.'
          : 'Revisit saved Loan Estimates, comparisons, and lenders in one place. Private notes help you remember why an offer stood out.'}{' '}
        {storageMode === 'guest' ? (
          <span className="text-zinc-500">Currently guest (this device only).</span>
        ) : (
          <span className="text-zinc-500">Signed-in workspace foundation active.</span>
        )}
      </p>
    </div>
  );
}

function SortSelect({
  value,
  onChange,
  ariaLabel,
}: {
  value: WorkspaceItemSort;
  onChange: (v: WorkspaceItemSort) => void;
  ariaLabel: string;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <span className="sr-only sm:not-sr-only">Sort</span>
      <select
        className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700"
        value={value}
        onChange={(e) => onChange(e.target.value as WorkspaceItemSort)}
        aria-label={ariaLabel}
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="alpha">A–Z</option>
      </select>
    </label>
  );
}

function EmptyResearchCard({
  title,
  body,
  links,
}: {
  title: string;
  body: string;
  links: Array<{ href: string; label: string; primary?: boolean }>;
}) {
  return (
    <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center">
      <p className="font-medium text-zinc-800">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600">{body}</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {links.map((l) => (
          <Link key={l.href + l.label} href={l.href}>
            <Button size="sm" variant={l.primary ? 'trust' : 'outline'}>
              {l.label}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FooterTrust() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
      <p className="flex items-start gap-2">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden />
        <span>
          Research only · Not an endorsement · Not a lender or broker · Verify licenses on{' '}
          <a
            href="https://www.nmlsconsumeraccess.org/"
            className="font-medium text-[#059669] underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            NMLS Consumer Access
          </a>
          . Common ownership network · No paid placements.
        </span>
      </p>
      <div className="mt-2">
        <TrustMark />
      </div>
    </div>
  );
}

function LenderBucket({
  title,
  hint,
  items,
  empty,
  emptyLinks,
  planId,
  onStatus,
  onRemove,
  onNotes,
}: {
  title: string;
  hint: string;
  items: SavedLender[];
  empty: string;
  emptyLinks?: Array<{ href: string; label: string; primary?: boolean }>;
  planId?: string;
  onStatus: (id: string, status: LenderResearchStatus, name: string) => void;
  onRemove: (slug: string) => void;
  onNotes: (id: string, notes: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[#0A2540]">
        <Bookmark className="h-5 w-5 text-emerald-700" aria-hidden />
        {title}
      </h2>
      <p className="mt-1 text-sm text-zinc-600">{hint}</p>
      {items.length === 0 ? (
        emptyLinks?.length ? (
          <EmptyResearchCard title={empty} body="" links={emptyLinks} />
        ) : (
          <p className="mt-4 text-sm text-zinc-500">{empty}</p>
        )
      ) : (
        <div className="mt-4">
          <LenderList
            items={items}
            planId={planId}
            onStatus={onStatus}
            onRemove={onRemove}
            onNotes={onNotes}
          />
        </div>
      )}
    </section>
  );
}

function LenderList({
  items,
  planId,
  onStatus,
  onRemove,
  onNotes,
}: {
  items: SavedLender[];
  planId?: string;
  onStatus: (id: string, status: LenderResearchStatus, name: string) => void;
  onRemove: (slug: string) => void;
  onNotes: (id: string, notes: string) => void;
}) {
  void planId;
  return (
    <ul className="space-y-3">
      {items.map((l) => (
        <li
          key={l.id}
          className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <Link
                href={l.profilePath || `/lenders/${l.lenderSlug}`}
                className="font-semibold text-[#0A2540] hover:text-[#059669] hover:underline"
              >
                {l.lenderName}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500">
                {l.nmlsId || l.licenseSummary ? (
                  <span>{l.licenseSummary || `NMLS #${l.nmlsId}`}</span>
                ) : null}
                {l.loanTypes?.length ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" aria-hidden />
                    {l.loanTypes.slice(0, 4).join(', ')}
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`status-${l.id}`}>
                Status for {l.lenderName}
              </label>
              <select
                id={`status-${l.id}`}
                value={l.status}
                onChange={(e) =>
                  onStatus(l.id, e.target.value as LenderResearchStatus, l.lenderName)
                }
                className="h-10 rounded-lg border border-zinc-200 bg-white px-2 text-sm"
              >
                {LENDER_STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Link href={l.profilePath || `/lenders/${l.lenderSlug}`}>
                <Button type="button" variant="outline" size="sm">
                  Profile <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-rose-700 hover:bg-rose-50"
                onClick={() => onRemove(l.lenderSlug)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </div>
          <PrivateResearchNote
            value={l.notes}
            onSave={(n) => onNotes(l.id, n)}
            placeholder="e.g. Called Monday; waiting on LE…"
          />
        </li>
      ))}
    </ul>
  );
}
