'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ASK_TRUST_HUB, NETWORK_HUBS } from '@/lib/network/ask-trust-hub';

/**
 * Slim network bar above Lender primary header (matches Move chrome).
 */
export function AskNetworkBar() {
  const [open, setOpen] = useState(false);

  const links = [
    ...NETWORK_HUBS.map((h) => ({
      id: h.id,
      label: h.shortLabel,
      href: h.url,
      active: h.id === 'lender',
    })),
    {
      id: 'standards',
      label: 'Standards',
      // Clear path to The Ask Trust Hub Standard (methodology)
      href: ASK_TRUST_HUB.methodologyUrl,
      active: false,
    },
  ];

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
      <div className="container mx-auto flex min-h-9 items-center justify-between gap-3 px-4 py-1.5 sm:min-h-10">
        <a
          href={ASK_TRUST_HUB.url}
          className="shrink-0 font-semibold tracking-tight text-zinc-700 hover:text-[#0A2540] dark:text-zinc-200"
          rel="noopener noreferrer"
        >
          <span className="hidden sm:inline">Ask Trust Hub Network</span>
          <span className="sm:hidden">Network</span>
        </a>

        <nav aria-label="Ask Trust Hub network" className="hidden items-center gap-1 sm:flex">
          {links.map((link) =>
            link.active ? (
              <span
                key={link.id}
                className="rounded-md bg-white px-2.5 py-1 font-semibold text-[#0A2540] shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700"
                aria-current="page"
              >
                {link.label}
              </span>
            ) : (
              <a
                key={link.id}
                href={link.href}
                className="rounded-md px-2.5 py-1 font-medium hover:bg-white/80 hover:text-[#0A2540] dark:hover:bg-zinc-800"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="relative sm:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Network <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          {open ? (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="block px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                  {link.active ? ' · you are here' : ''}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
