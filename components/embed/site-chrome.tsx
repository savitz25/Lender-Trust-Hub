'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Hide global nav/footer/network bar on embed routes (iframe-friendly).
 */
export function SiteChrome({
  chrome,
  children,
  footer,
}: {
  chrome: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const pathname = usePathname() || '';
  if (pathname.startsWith('/embed')) {
    return (
      <div className="min-h-screen bg-transparent" data-chrome="embed">
        {children}
      </div>
    );
  }
  return (
    <>
      {chrome}
      <main className="flex-1 bg-[#F8FAFC]">{children}</main>
      {footer}
    </>
  );
}
