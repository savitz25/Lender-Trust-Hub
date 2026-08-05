'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ASK_TRUST_HUB, NETWORK_HUBS } from '@/lib/network/ask-trust-hub';
import { networkHubHref, type HubLinkId } from '@/lib/network/handoff-href';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';

/**
 * Slim network bar — silent SSO when signed in (handoff start on same origin).
 */
export function AskNetworkBar() {
  const [open, setOpen] = useState(false);
  const ml = useMyLendingOptional();
  const signedIn = Boolean(ml?.user) && !ml?.loading;

  const links = [
    ...NETWORK_HUBS.map((h) => {
      const id = h.id as HubLinkId;
      return {
        id: h.id,
        label: h.shortLabel,
        href: id === 'lender' ? h.url : networkHubHref(id, signedIn),
        active: h.id === 'lender',
        sameOrigin: id !== 'lender' && signedIn,
      };
    }),
    {
      id: 'standards',
      label: 'Standards',
      href: ASK_TRUST_HUB.methodologyUrl,
      active: false,
      sameOrigin: false,
    },
  ];

  return (
    <div className="border-b border-zinc-200 bg-zinc-50 text-[12px] text-zinc-600">
      <div className="container mx-auto flex min-h-9 items-center justify-between gap-3 px-4 py-1.5 sm:min-h-10">
        <a
          href={ASK_TRUST_HUB.url}
          className="shrink-0 font-semibold tracking-tight text-zinc-700 hover:text-[#0A2540]"
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
                className="rounded-md bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-900 shadow-sm ring-1 ring-emerald-200"
                aria-current="page"
              >
                {link.label}
              </span>
            ) : (
              <a
                key={link.id}
                href={link.href}
                className="rounded-md px-2.5 py-1 font-medium text-zinc-600 hover:bg-white hover:text-[#0A2540]"
                rel={link.sameOrigin ? undefined : 'noopener noreferrer'}
              >
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="relative sm:hidden">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-medium text-zinc-700"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            Network <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
          {open ? (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-md">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  rel={link.sameOrigin ? undefined : 'noopener noreferrer'}
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
