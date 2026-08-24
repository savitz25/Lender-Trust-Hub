/** Lender Trust Hub brand paths — keep cache version in sync with logo assets. */

import { LENDER_BRAND, LENDER_TAGLINE } from '@/lib/design/lender-design-system';

/** Bump when logo / favicon assets change (cache bust). */
export const LENDER_LOGO_VERSION = '20260807lth-fav-t';

export const BRAND = {
  name: 'Lender Trust Hub',
  shortName: 'LTH',
  domain: 'lendertrusthub.com',
  url: 'https://www.lendertrusthub.com',
  email: 'hello@asktrusthub.com',
  tagline: LENDER_TAGLINE,
  colors: LENDER_BRAND,
} as const;

export const BRAND_LOGO = {
  /** Header / light surfaces */
  headerSrc: `/brand/lender-trust-hub-logo-header.png?v=${LENDER_LOGO_VERSION}`,
  transparentSrc: `/brand/LenderTrustHub-logo-transparent.png?v=${LENDER_LOGO_VERSION}`,
  /** Footer on navy — lightened wordmark, multi-color mark preserved */
  footerSrc: `/brand/lender-trust-hub-logo-footer.png?v=${LENDER_LOGO_VERSION}`,
  /** Hub mark only (favicon / email) */
  markSrc: `/brand/lender-trust-hub-icon.png?v=${LENDER_LOGO_VERSION}`,
  alt: 'Lender Trust Hub',
  width: 720,
  height: 217,
} as const;

export const BRAND_ICONS = {
  faviconIco: `/favicon.ico?v=${LENDER_LOGO_VERSION}`,
  favicon16: `/favicon-16x16.png?v=${LENDER_LOGO_VERSION}`,
  favicon32: `/favicon-32x32.png?v=${LENDER_LOGO_VERSION}`,
  apple: `/apple-touch-icon.png?v=${LENDER_LOGO_VERSION}`,
  android192: `/android-chrome-192x192.png?v=${LENDER_LOGO_VERSION}`,
  android512: `/android-chrome-512x512.png?v=${LENDER_LOGO_VERSION}`,
  manifest: `/site.webmanifest?v=${LENDER_LOGO_VERSION}`,
} as const;
