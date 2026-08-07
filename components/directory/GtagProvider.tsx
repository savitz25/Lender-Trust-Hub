'use client';

import Script from 'next/script';
import { ResearchClickTracker } from '@/components/analytics/research-click-tracker';
import {
  LENDER_MEASUREMENT_BASELINE_DATE,
  LENDER_MEASUREMENT_BASELINE_LABEL,
} from '@/lib/analytics/measurement-baseline';

/**
 * GA4 integration — set NEXT_PUBLIC_GA4_ID in Vercel env.
 * Phase 5: baseline globals + research click tracker.
 *
 * IMPLEMENTATION:
 *   1. Create GA4 property at analytics.google.com
 *   2. Vercel → Settings → Environment Variables → NEXT_PUBLIC_GA4_ID=G-XXXXXXXX
 *   3. Redeploy — page_view + priority research events
 */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GtagProvider() {
  return (
    <>
      <ResearchClickTracker />
      {GA4_ID ? (
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
          window.__LTH_MEASUREMENT_BASELINE = '${LENDER_MEASUREMENT_BASELINE_DATE}';
          window.__LTH_MEASUREMENT_LABEL = '${LENDER_MEASUREMENT_BASELINE_LABEL}';
          window.__LTH_HUB = 'lender';
        `}
          </Script>
        </>
      ) : null}
    </>
  );
}