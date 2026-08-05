'use client';

import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import {
  rewriteCrossHubHref,
  type HubLinkId,
} from '@/lib/network/handoff-href';
import { useMyLendingOptional } from '@/components/my-lending/my-lending-provider';

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
  const ml = useMyLendingOptional();
  const signedIn = Boolean(ml?.user) && !ml?.loading;
  const resolved = rewriteCrossHubHref(href, signedIn, currentHub);
  const isHandoff = resolved.startsWith('/api/auth/network-handoff/');

  return (
    <a
      href={resolved}
      rel={isHandoff ? undefined : rel ?? 'noopener noreferrer'}
      {...rest}
    >
      {children}
    </a>
  );
}
