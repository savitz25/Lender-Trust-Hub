'use client';

import Script from 'next/script';

/**
 * GA4 integration — set NEXT_PUBLIC_GA4_ID in Vercel env.
 * Events: wire via trackDirectoryEvent() in lib/directory/analytics.ts
 *
 * IMPLEMENTATION:
 *   1. Create GA4 property at analytics.google.com
 *   2. Vercel → Settings → Environment Variables → NEXT_PUBLIC_GA4_ID=G-XXXXXXXX
 *   3. Redeploy — events flow automatically on page_view
 */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GtagProvider() {
  if (!GA4_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}', { send_page_view: true });
        `}
      </Script>
    </>
  );
}