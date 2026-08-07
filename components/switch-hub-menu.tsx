'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, ExternalLink } from 'lucide-react';
import { LENDER_BRAND, LENDER_NETWORK_LINKS } from '@/lib/design/lender-design-system';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  compact?: boolean;
};

/**
 * Switch Hub — network sibling + parent Ask destinations.
 */
export function SwitchHubMenu({ className, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className={cn(
          'inline-flex min-h-10 items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-sm font-semibold transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
        )}
        style={{
          borderColor: LENDER_BRAND.border,
          color: LENDER_BRAND.navy,
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {compact ? 'Hubs' : 'Switch Hub'}
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
          style={{ color: LENDER_BRAND.teal }}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="menu"
          aria-label="Switch Trust Hub"
          className="absolute right-0 z-[80] mt-2 w-[min(100vw-2rem,18rem)] overflow-hidden rounded-2xl border bg-white py-2 shadow-lg"
          style={{ borderColor: LENDER_BRAND.border }}
        >
          <p
            className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: LENDER_BRAND.teal }}
          >
            Ask network
          </p>
          <ul className="space-y-0.5 px-1.5">
            {LENDER_NETWORK_LINKS.map((hub) => (
              <li key={hub.id}>
                <a
                  role="menuitem"
                  href={hub.href}
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-[#CCFBF1]/60"
                  onClick={() => setOpen(false)}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className="block text-sm font-semibold"
                      style={{ color: LENDER_BRAND.navy }}
                    >
                      {hub.label}
                    </span>
                    <span
                      className="mt-0.5 block text-xs leading-snug"
                      style={{ color: LENDER_BRAND.ink }}
                    >
                      {hub.blurb}
                    </span>
                  </span>
                  <ExternalLink
                    className="mt-0.5 h-3.5 w-3.5 shrink-0"
                    style={{ color: LENDER_BRAND.teal }}
                    aria-hidden
                  />
                </a>
              </li>
            ))}
          </ul>
          <p
            className="mt-1 border-t px-3 pt-2 text-[11px] leading-relaxed"
            style={{ borderColor: LENDER_BRAND.border, color: LENDER_BRAND.ink }}
          >
            You are on Lender Trust Hub — wealth &amp; finance research.
          </p>
        </div>
      ) : null}
    </div>
  );
}
