'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Archive,
  Copy,
  FileText,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { LOAN_FOCUS_OPTIONS, type FinancePlan } from '@/lib/my-lending/types';
import {
  archivePlan,
  deletePlan,
  duplicatePlan,
  getPlanStats,
  listAllPlans,
  loadMyLendingStore,
  renamePlan,
  setActivePlan,
} from '@/lib/my-lending/storage';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Phase D — multi-plan library (Insurance / My Move reports parity).
 */
export function PlansLibrary() {
  const router = useRouter();
  const [plans, setPlans] = useState<FinancePlan[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const store = loadMyLendingStore();
    setPlans(listAllPlans(store));
    setActiveId(store.activePlanId);
  }, []);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      refresh();
      setHydrated(true);
    }, 0);
    const onStore = () => refresh();
    window.addEventListener('lth-my-lending-store', onStore);
    window.addEventListener('storage', onStore);
    return () => {
      window.clearTimeout(initialize);
      window.removeEventListener('lth-my-lending-store', onStore);
      window.removeEventListener('storage', onStore);
    };
  }, [refresh]);

  function flash(msg: string) {
    setMessage(msg);
    window.setTimeout(() => setMessage(null), 2500);
  }

  if (!hydrated) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
        Loading financing plans...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-12 text-center shadow-sm">
        <FolderOpen className="mx-auto h-10 w-10 text-zinc-300" aria-hidden />
        <p className="mt-2 font-medium text-[#0A2540]">No financing plans yet</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-zinc-600">
          Start guided setup to create your first research plan. Shortlist and calculator snapshots
          attach to the active plan.
        </p>
        <div className="mt-4">
          <Link href="/my-lending/setup">
            <Button variant="trust" className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              Guided setup
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600">
          {plans.length} plan{plans.length === 1 ? '' : 's'} on this device. Shortlist is per active
          plan (max 3).
        </p>
        <Link href="/my-lending/setup">
          <Button size="sm" variant="trust" className="gap-1">
            <Plus className="h-4 w-4" aria-hidden />
            New plan setup
          </Button>
        </Link>
      </div>
      {message ? (
        <p className="text-sm text-emerald-800" role="status">
          {message}
        </p>
      ) : null}

      <ul className="space-y-3">
        {plans.map((plan) => {
          const stats = getPlanStats(plan.id);
          const isActive = plan.id === activeId && plan.status !== 'archived';
          const isRenaming = renamingId === plan.id;
          return (
            <li key={plan.id}>
              <div
                className={cn(
                  'rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors',
                  isActive && 'border-emerald-300 ring-1 ring-emerald-100'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {isRenaming ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          className="h-9 max-w-xs rounded-lg border border-zinc-200 px-2 text-sm"
                          aria-label="Plan label"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="trust"
                          onClick={() => {
                            renamePlan(plan.id, renameValue);
                            setRenamingId(null);
                            flash('Plan renamed');
                            refresh();
                          }}
                        >
                          Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRenamingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <h2 className="text-lg font-semibold text-[#0A2540]">{plan.label}</h2>
                    )}
                    <p className="mt-1 text-xs text-zinc-500">
                      Updated {new Date(plan.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {isActive ? (
                      <span className="rounded-full bg-[#059669] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                        Active
                      </span>
                    ) : null}
                    {plan.status === 'archived' ? (
                      <span className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-700">
                        Archived
                      </span>
                    ) : null}
                  </div>
                </div>

                {plan.loanFocus.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {plan.loanFocus.map((id) => (
                      <li
                        key={id}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-medium text-zinc-700"
                      >
                        {LOAN_FOCUS_OPTIONS.find((o) => o.id === id)?.label ?? id}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <p className="mt-3 text-sm text-zinc-600">
                  {plan.location?.label ||
                    [plan.location?.zip, plan.location?.state].filter(Boolean).join(' ') ||
                    'No location set'}
                  {' · '}
                  Shortlist {stats.shortlist}/3 · {stats.snapshots} snapshot
                  {stats.snapshots === 1 ? '' : 's'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="trust"
                    onClick={() => {
                      setActivePlan(plan.id);
                      flash(`Active plan: ${plan.label}`);
                      router.push('/my-lending');
                    }}
                  >
                    <FolderOpen className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActivePlan(plan.id);
                      router.push(
                        `/my-lending/report?planId=${encodeURIComponent(plan.id)}`
                      );
                    }}
                  >
                    <FileText className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Report
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRenamingId(plan.id);
                      setRenameValue(plan.label);
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const copy = duplicatePlan(plan.id);
                      if (copy) {
                        flash('Plan duplicated');
                        refresh();
                      }
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
                    Duplicate
                  </Button>
                  {plan.status !== 'archived' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        archivePlan(plan.id);
                        flash('Plan archived');
                        refresh();
                      }}
                    >
                      <Archive className="mr-1 h-3.5 w-3.5" aria-hidden />
                      Archive
                    </Button>
                  ) : null}
                  {confirmDeleteId === plan.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-rose-700">
                        Delete plan and its shortlist?
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-rose-700"
                        onClick={() => {
                          deletePlan(plan.id);
                          setConfirmDeleteId(null);
                          flash('Plan deleted');
                          refresh();
                        }}
                      >
                        Confirm delete
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-rose-700 hover:bg-rose-50"
                      onClick={() => setConfirmDeleteId(plan.id)}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" aria-hidden />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
