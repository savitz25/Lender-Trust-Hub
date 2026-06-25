import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}