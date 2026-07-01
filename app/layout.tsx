import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { GtagProvider } from '@/components/directory/GtagProvider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Lender Trust Hub • Trusted Local Lenders • Verified County Insights',
    template: '%s | Lender Trust Hub',
  },
  description:
    'Independent directory of mortgage lenders & brokers. NMLS verified • County-level experience • Fun financial calculators. Zero paid placements.',
  keywords: [
    'mortgage lenders',
    'local lenders',
    'NMLS verified',
    'mortgage calculator',
    'county lenders',
    'mortgage broker directory',
  ],
  openGraph: {
    title: 'Lender Trust Hub',
    description: 'Discover honest lenders in your county — transparent data, confident choices.',
    siteName: 'Lender Trust Hub',
    type: 'website',
    images: [{ url: '/brand/lender-trust-hub-logo-stacked.png', width: 1200, height: 1200 }],
  },
  icons: {
    icon: [{ url: '/brand/lender-trust-hub-favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/brand/lender-trust-hub-icon-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA4_ID;

  return (
    <html lang="en-US" className={inter.variable} suppressHydrationWarning>
      <head>
        {gaId && (
          <>
            <link rel="preconnect" href="https://www.googletagmanager.com" />
            <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col antialiased bg-[#fafafa] text-[#0F172A] dark:bg-zinc-950 dark:text-zinc-100">
        <ThemeProvider>
          <GtagProvider />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}