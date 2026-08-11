import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HMDA County Snapshot | Lender Trust Hub',
  description:
    'Read-only public HMDA mortgage market snapshot for embedding. Research only — not a lead form.',
  robots: { index: false, follow: true },
};

/**
 * Stage C.1 — minimal chrome for iframe embeds.
 * Site shell (nav/footer) is suppressed via SiteChrome for /embed/*.
 */
export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-embed-shell="true" className="min-h-0 bg-transparent">
      {children}
    </div>
  );
}
