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
}: {
  value?: string;
  onSave: (notes: string) => void;
  className?: string;
  placeholder?: string;
}) {
  /** Start collapsed so lists stay scannable; preview shows existing notes. */
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setDraft(value ?? '');
  }, [value]);

  function persist() {
    onSave(draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
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
          'mt-1.5 flex w-full max-w-full items-start gap-1.5 rounded-lg border border-transparent px-0 py-1 text-left text-xs font-medium text-zinc-500 hover:border-amber-100 hover:bg-amber-50/50 hover:text-teal-800',
          className
        )}
      >
        <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="min-w-0">
          {preview ? (
            <>
              <span className="font-semibold text-amber-900/80">Private note · </span>
              <span className="font-normal text-zinc-600 line-clamp-2">{preview}</span>
              <span className="mt-0.5 block text-[11px] font-medium text-teal-800">Tap to edit</span>
            </>
          ) : (
            <span>Add a private note — why this stood out</span>
          )}
        </span>
      </button>
    );
  }

  return (
    <div className={cn('mt-2 rounded-lg border border-amber-100 bg-amber-50/40 p-2.5', className)}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-900/80">
          <StickyNote className="h-3 w-3" aria-hidden />
          Private note
        </p>
        <span className="text-[10px] text-zinc-400">
          {draft.length}/{MAX_PRIVATE_NOTE_CHARS}
        </span>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, MAX_PRIVATE_NOTE_CHARS))}
        rows={2}
        className="w-full rounded-md border border-amber-100/80 bg-white px-2 py-1.5 text-sm text-zinc-800 placeholder:text-zinc-400"
        placeholder={placeholder}
        aria-label="Private research note"
      />
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={persist}>
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
            Clear
          </Button>
        ) : (
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
            Cancel
          </Button>
        )}
        {savedFlash ? (
          <span className="text-xs text-teal-700" role="status">
            Saved
          </span>
        ) : null}
      </div>
    </div>
  );
}
