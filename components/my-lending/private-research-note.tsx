'use client';

import { useEffect, useState } from 'react';
import { StickyNote } from 'lucide-react';
import { MAX_PRIVATE_NOTE_CHARS } from '@/lib/my-lending/types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Compact private note editor for My Lending saved items.
 * Research-oriented — not a document system.
 */
export function PrivateResearchNote({
  value,
  onSave,
  className,
  placeholder = 'Private research note (only on this workspace)…',
  emptyPrompt = 'Add a private note — why this stood out, what to re-check later',
}: {
  value?: string;
  onSave: (notes: string) => void;
  className?: string;
  placeholder?: string;
  emptyPrompt?: string;
}) {
  /** Start collapsed so lists stay scannable; preview shows existing notes. */
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const syncDraft = window.setTimeout(() => setDraft(value ?? ''), 0);
    return () => window.clearTimeout(syncDraft);
  }, [value]);

  function persist() {
    onSave(draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
    if (!draft.trim()) setOpen(false);
  }

  function clear() {
    setDraft('');
    onSave('');
    setOpen(false);
  }

  if (!open) {
    const preview = value?.trim();
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'mt-2 flex w-full max-w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors',
          preview
            ? 'border-amber-200/90 bg-amber-50/70 text-zinc-700 hover:border-amber-300 hover:bg-amber-50'
            : 'border-dashed border-amber-200/80 bg-amber-50/30 text-zinc-500 hover:border-amber-300 hover:bg-amber-50/60 hover:text-teal-900',
          className
        )}
      >
        <StickyNote
          className={cn(
            'mt-0.5 h-3.5 w-3.5 shrink-0',
            preview ? 'text-amber-800' : 'text-amber-700/70'
          )}
          aria-hidden
        />
        <span className="min-w-0">
          {preview ? (
            <>
              <span className="font-semibold text-amber-950">Private note</span>
              <span className="mt-0.5 block font-normal text-zinc-700 line-clamp-2">{preview}</span>
              <span className="mt-1 block text-[11px] font-semibold text-teal-800">
                Tap to edit · private to this workspace
              </span>
            </>
          ) : (
            <>
              <span className="font-medium text-zinc-700">{emptyPrompt}</span>
              <span className="mt-0.5 block text-[11px] text-zinc-500">
                Optional · not shared · max {MAX_PRIVATE_NOTE_CHARS} characters
              </span>
            </>
          )}
        </span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        'mt-2 rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 shadow-sm',
        className
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-950">
          <StickyNote className="h-3 w-3" aria-hidden />
          Private research note
        </p>
        <span className="text-[10px] tabular-nums text-zinc-500">
          {draft.length}/{MAX_PRIVATE_NOTE_CHARS}
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_PRIVATE_NOTE_CHARS))}
        rows={3}
        className="w-full rounded-md border border-amber-100 bg-white px-2.5 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-200"
        placeholder={placeholder}
        aria-label="Private research note"
        autoFocus
      />
      <p className="mt-1 text-[11px] text-zinc-500">
        For your eyes only on this research passport — not a document system or shared memo.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="trust" className="h-8 text-xs" onClick={persist}>
          Save note
        </Button>
        {draft.trim() || value?.trim() ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 text-xs text-zinc-600"
            onClick={clear}
          >
            Clear note
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 text-xs text-zinc-600"
          onClick={() => {
            setDraft(value ?? '');
            setOpen(false);
          }}
        >
          {draft !== (value ?? '') ? 'Discard' : 'Close'}
        </Button>
        {savedFlash ? (
          <span className="text-xs font-medium text-teal-700" role="status">
            Note saved
          </span>
        ) : null}
      </div>
    </div>
  );
}
