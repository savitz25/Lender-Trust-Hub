/** Lender Trust Hub brand paths — keep cache version in sync with logo assets. */

import { LENDER_BRAND, LENDER_TAGLINE } from '@/lib/design/lender-design-system';

export const LENDER_LOGO_VERSION = '20260807lth';

export const BRAND = {
  name: 'Lender Trust Hub',
  shortName: 'LTH',
  domain: 'lendertrusthub.com',
  url: 'https://www.lendertrusthub.com',
  email: 'hello@lendertrusthub.com',
  tagline: LENDER_TAGLINE,
  colors: LENDER_BRAND,
} as const;

export const BRAND_LOGO = {
  /** Header / light surfaces */
  headerSrc: `/brand/lender-trust-hub-logo-header.png?v=${LENDER_LOGO_VERSION}`,
  transparentSrc: `/brand/LenderTrustHub-logo-transparent.png?v=${LENDER_LOGO_VERSION}`,
  /** Footer on navy (invert CSS or use same multi-color lockup) */
  footerSrc: `/brand/lender-trust-hub-logo-header.png?v=${LENDER_LOGO_VERSION}`,
  alt: 'Lender Trust Hub',
  width: 720,
  height: 217,
} as const;
