'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  rewriteCrossHubHref,
  type HubLinkId,
} from '@/lib/network/handoff-href';

type CrossHubLinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string;
  children: ReactNode;
  currentHub?: HubLinkId;
  /**
   * public (default) — crawlable absolute specialist URLs for research journeys.
   * auth — signed-in passport sync via /api/auth/network-handoff/start only.
   */
  mode?: 'public' | 'auth';
};

/**
 * Inter-hub link. Stage A′: public research handoffs stay crawlable plain URLs.
 * Auth mode reserved for real signed-in passport sync.
 */
export function CrossHubLink({
  href,
  children,
  currentHub = 'lender',
  mode = 'public',
  rel,
  ...rest
}: CrossHubLinkProps) {
  const resolved =
    mode === 'auth' ? rewriteCrossHubHref(href, true, currentHub) : href;
  const isHandoff = resolved.startsWith('/api/auth/network-handoff/');

  return (
    <a
      href={resolved}
      rel={isHandoff ? undefined : rel ?? 'noopener noreferrer'}
      data-network-handoff={isHandoff ? 'start' : 'public'}
      data-journey-link={mode === 'public' ? 'crawlable' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}
