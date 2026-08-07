import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AskNetworkBar } from '@/components/network/ask-network-bar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { GtagProvider } from '@/components/directory/GtagProvider';
import { MyLendingShell } from '@/components/my-lending/my-lending-shell';
import { BRAND_ICONS, LENDER_LOGO_VERSION } from '@/lib/brand';
import { ASK_NETWORK_STANDARD_VERSION } from '@/lib/network/standard-version';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.lendertrusthub.com'),
  title: {
    default: 'Verify. Compare. Finance wisely. | Lender Trust Hub',
    template: '%s | Lender Trust Hub',
  },
  description:
    'Independent research for lenders and financing options. NMLS-oriented verification, rate comparison, and educational calculators. No paid placements. No lead fees. You decide.',
  applicationName: 'Lender Trust Hub',
  keywords: [
    'mortgage lenders',
    'local lenders',
    'NMLS verified',
    'mortgage calculator',
    'county lenders',
    'mortgage broker directory',
  ],
  alternates: {
    canonical: 'https://www.lendertrusthub.com',
  },
  openGraph: {
    title: 'Verify. Compare. Finance wisely. | Lender Trust Hub',
    description:
      'Independent lender research — NMLS verification signals, comparisons, and calculators. Zero paid placements.',
    siteName: 'Lender Trust Hub',
    url: 'https://www.lendertrusthub.com',
    type: 'website',
    images: [
      {
        url: `/brand/lender-trust-hub-logo-header.png?v=${LENDER_LOGO_VERSION}`,
        width: 720,
        height: 217,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Verify. Compare. Finance wisely. | Lender Trust Hub',
    description:
      'Independent lender research. NMLS signals, comparisons, calculators — no paid placements.',
  },
  icons: {
    icon: [
      { url: BRAND_ICONS.faviconIco, sizes: 'any' },
      { url: BRAND_ICONS.favicon16, sizes: '16x16', type: 'image/png' },
      { url: BRAND_ICONS.favicon32, sizes: '32x32', type: 'image/png' },
      { url: BRAND_ICONS.android192, sizes: '192x192', type: 'image/png' },
      { url: BRAND_ICONS.android512, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: BRAND_ICONS.apple, sizes: '180x180', type: 'image/png' }],
    shortcut: [BRAND_ICONS.favicon32],
  },
  manifest: BRAND_ICONS.manifest,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0D9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0A2540' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;

  return (
    <html lang="en-US" className={inter.variable} suppressHydrationWarning style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        {gaId && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
      </head>
      <body
        className="flex min-h-screen flex-col bg-[#F8FAFC] text-[#1E293B] antialiased"
        data-hub="lender"
        data-network-standard={ASK_NETWORK_STANDARD_VERSION}
      >
        {/* network-standard: {ASK_NETWORK_STANDARD_VERSION} */}
        <ThemeProvider>
          <MyLendingShell>
            <GtagProvider />
            <AskNetworkBar />
            <Navbar />
            <main className="flex-1 bg-[#F8FAFC]">{children}</main>
            <Footer />
          </MyLendingShell>
        </ThemeProvider>
      </body>
    </html>
  );
}