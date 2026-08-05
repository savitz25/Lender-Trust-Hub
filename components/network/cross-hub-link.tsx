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
};

export function CrossHubLink({
  href,
  children,
  currentHub = 'lender',
  rel,
  ...rest
}: CrossHubLinkProps) {
  const resolved = rewriteCrossHubHref(href, true, currentHub);
  const isHandoff = resolved.startsWith('/api/auth/network-handoff/');

  return (
    <a
      href={resolved}
      rel={isHandoff ? undefined : rel ?? 'noopener noreferrer'}
      data-network-handoff={isHandoff ? 'start' : undefined}
      {...rest}
    >
      {children}
    </a>
  );
}
